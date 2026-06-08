// Orchestration for non-custodial crypto payments: turn a tier purchase into a
// concrete on-chain quote, and verify a submitted transaction then grant the
// tier. All failure paths return a typed { code, status } so the HTTP handlers
// stay thin. Funds are never custodied by the server — it only reads the chain.

import type { ApiErrorCode } from '../respond.js';
import { findUserById, setUserTier, toPublicUser, type PublicUser } from '../users.js';
import { isTier } from '../tiers.js';
import { recordUsageEvent } from '../cost.js';
import {
  enabledAssets,
  findAsset,
  isPayTier,
  orderTtlMinutes,
  receivingAddress,
  tierPriceUsd,
  CHAINS,
} from './config.js';
import { computeAmount } from './amount.js';
import { assetPriceUsd } from './price.js';
import {
  createOrder,
  findOrder,
  isTxHashUsed,
  isUniqueViolation,
  markConfirmed,
  markExpired,
} from './orders.js';
import { verifyOnChain } from './verify.js';

type Fail = { ok: false; code: ApiErrorCode; status: number };

// ── Payment options (for the UI) ─────────────────────────────────────────────
export type PaymentOptions = {
  enabled: boolean;
  prices: { pro: number; ultra: number };
  ttlMin: number;
  assets: Array<{ chain: string; chainLabel: string; asset: string; label: string; kind: string }>;
};

export function paymentOptions(): PaymentOptions {
  const assets = enabledAssets().map((a) => ({
    chain: a.chain,
    chainLabel: CHAINS[a.chain].label,
    asset: a.asset,
    label: a.label,
    kind: a.kind,
  }));
  return {
    enabled: assets.length > 0,
    prices: { pro: tierPriceUsd('pro'), ultra: tierPriceUsd('ultra') },
    ttlMin: orderTtlMinutes(),
    assets,
  };
}

// ── Create order (quote) ─────────────────────────────────────────────────────
export type CreatedOrder = {
  orderId: string;
  tier: 'pro' | 'ultra';
  chain: string;
  network: string;
  asset: string;
  address: string;
  amount: string; // human display amount to send
  amountUsd: number;
  expiresAt: string; // ISO
  ttlMin: number;
};

export async function createPaymentOrder(args: {
  userId: string;
  tier: unknown;
  chain: unknown;
  asset: unknown;
}): Promise<{ ok: true; order: CreatedOrder } | Fail> {
  if (!isPayTier(args.tier)) return { ok: false, code: 'payment/unsupported', status: 400 };
  if (typeof args.chain !== 'string' || typeof args.asset !== 'string') {
    return { ok: false, code: 'payment/unsupported', status: 400 };
  }
  const spec = findAsset(args.chain, args.asset);
  if (!spec) return { ok: false, code: 'payment/unsupported', status: 400 };

  const address = receivingAddress(spec.chain);
  if (!address) return { ok: false, code: 'payment/disabled', status: 503 };

  const amountUsd = tierPriceUsd(args.tier);
  let priceUsd: number;
  try {
    priceUsd = await assetPriceUsd(spec);
  } catch {
    return { ok: false, code: 'payment/price-unavailable', status: 503 };
  }

  const { atomic, display } = computeAmount(amountUsd, priceUsd, spec.decimals, spec.displayDecimals);
  const ttlMin = orderTtlMinutes();
  const expiresAt = new Date(Date.now() + ttlMin * 60_000);

  const order = await createOrder({
    userId: args.userId,
    tier: args.tier,
    chain: spec.chain,
    asset: spec.asset,
    address,
    amountAtomic: atomic,
    decimals: spec.decimals,
    amountUsd: amountUsd.toFixed(2),
    expiresAt,
  });

  return {
    ok: true,
    order: {
      orderId: order.id,
      tier: args.tier,
      chain: spec.chain,
      network: CHAINS[spec.chain].label,
      asset: spec.asset,
      address,
      amount: display,
      amountUsd,
      expiresAt: expiresAt.toISOString(),
      ttlMin,
    },
  };
}

// ── Verify + grant ───────────────────────────────────────────────────────────
const REASON_TO_CODE: Record<string, ApiErrorCode> = {
  'not-found': 'payment/not-found',
  unconfirmed: 'payment/unconfirmed',
  mismatch: 'payment/mismatch',
  failed: 'payment/mismatch',
};

const TIER_RANK: Record<'free' | 'pro' | 'ultra', number> = { free: 0, pro: 1, ultra: 2 };

// Grant a tier WITHOUT ever downgrading: re-verifying an old Pro order must not
// knock a user who later reached Ultra back down to Pro. Also convergent — if a
// previous grant half-failed (process died after the order was marked confirmed
// but before the tier was written), the next verify heals it. Idempotent.
async function grantAtLeast(userId: string, tier: 'pro' | 'ultra') {
  const before = await findUserById(userId);
  const current = before && isTier(before.tier) ? before.tier : 'free';
  if (TIER_RANK[tier] > TIER_RANK[current]) {
    await setUserTier(userId, tier);
    return findUserById(userId);
  }
  return before;
}

export async function verifyPayment(args: {
  userId: string;
  orderId: unknown;
  txHash: unknown;
}): Promise<{ ok: true; user: PublicUser | null; tier: 'pro' | 'ultra' } | Fail> {
  if (typeof args.orderId !== 'string' || typeof args.txHash !== 'string') {
    return { ok: false, code: 'body/invalid', status: 400 };
  }
  const txHash = args.txHash.trim();
  if (!txHash) return { ok: false, code: 'body/invalid', status: 400 };

  const order = await findOrder(args.orderId, args.userId);
  if (!order) return { ok: false, code: 'payment/not-found', status: 404 };
  const tier = order.tier === 'ultra' ? 'ultra' : 'pro';

  // Already settled — idempotent success. Re-assert the grant (convergent) so a
  // previously half-completed upgrade self-heals; never downgrades.
  if (order.status === 'confirmed') {
    const u = await grantAtLeast(args.userId, tier);
    return { ok: true, user: u ? toPublicUser(u) : null, tier };
  }

  // Expired quote — the locked price is stale; make them start a new one.
  if (order.status === 'expired' || order.expiresAt.getTime() < Date.now()) {
    await markExpired(order.id).catch(() => {});
    return { ok: false, code: 'payment/expired', status: 409 };
  }

  const spec = findAsset(order.chain, order.asset);
  if (!spec) return { ok: false, code: 'payment/unsupported', status: 400 };

  // If the operator rotated the receiving address since this order was quoted,
  // the locked address may no longer be theirs — refuse and make them re-quote
  // against the current address rather than accept a payment they won't receive.
  const currentAddress = receivingAddress(spec.chain);
  if (currentAddress && currentAddress !== order.address) {
    return { ok: false, code: 'payment/expired', status: 409 };
  }

  // Cheap pre-check: this tx already settled another order?
  if (await isTxHashUsed(txHash)) return { ok: false, code: 'payment/tx-reused', status: 409 };

  let outcome;
  try {
    outcome = await verifyOnChain({
      chain: spec.chain,
      asset: spec,
      address: order.address,
      requiredAtomic: BigInt(order.amountAtomic),
      txHash,
    });
  } catch {
    // RPC / network failure — let the user retry; grant nothing.
    return { ok: false, code: 'payment/verify-failed', status: 502 };
  }

  if (!outcome.ok) {
    return { ok: false, code: REASON_TO_CODE[outcome.reason] ?? 'payment/verify-failed', status: 400 };
  }

  // Confirmed on-chain. Claim the tx for this order (unique index is the final
  // guard against a reuse race), then grant the tier.
  try {
    const claimed = await markConfirmed(order.id, txHash);
    if (!claimed) {
      // Status changed under us (double submit). Re-read and treat idempotently.
      const fresh = await findOrder(order.id, args.userId);
      if (fresh?.status !== 'confirmed') return { ok: false, code: 'payment/expired', status: 409 };
    }
  } catch (err) {
    if (isUniqueViolation(err)) return { ok: false, code: 'payment/tx-reused', status: 409 };
    throw err;
  }

  const updated = await grantAtLeast(args.userId, tier);
  // Audit trail (best-effort, internally error-swallowing): a $0 usage event
  // marking the grant. Cost is 0 so it doesn't move the spend caps.
  recordUsageEvent(args.userId, `payment/crypto/${order.chain}/${order.asset}`, 0);

  return { ok: true, user: updated ? toPublicUser(updated) : null, tier };
}
