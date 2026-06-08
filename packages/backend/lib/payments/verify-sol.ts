// Solana verifier. Reads the (finalized) transaction and confirms the receiving
// account's balance increased by >= the required amount — native lamports for
// SOL, or the SPL token balance delta for USDT/USDC. Querying at the `finalized`
// commitment means a non-null result is already confirmed (no count needed).

import { jsonRpc } from './http.js';
import type { VerifyOutcome, VerifyParams } from './verify.js';

type TokenBalance = {
  owner?: string;
  mint?: string;
  uiTokenAmount?: { amount?: string };
};
type SolTx = {
  meta?: {
    err: unknown;
    preBalances: number[];
    postBalances: number[];
    preTokenBalances?: TokenBalance[];
    postTokenBalances?: TokenBalance[];
  };
  transaction?: { message?: { accountKeys?: Array<string | { pubkey?: string }> } };
} | null;

function keyAt(keys: Array<string | { pubkey?: string }>, i: number): string {
  const k = keys[i];
  return typeof k === 'string' ? k : (k?.pubkey ?? '');
}

export async function verifySol(p: VerifyParams): Promise<VerifyOutcome> {
  const tx = await jsonRpc<SolTx>(p.rpcUrl, 'getTransaction', [
    p.txHash,
    { commitment: 'finalized', maxSupportedTransactionVersion: 0, encoding: 'jsonParsed' },
  ]);
  // Null = not found yet OR not finalized. Treat as "wait and retry".
  if (!tx || !tx.meta) return { ok: false, reason: 'unconfirmed' };
  if (tx.meta.err) return { ok: false, reason: 'failed' };

  const keys = tx.transaction?.message?.accountKeys ?? [];

  if (p.asset.kind === 'native') {
    // Defend against a malformed RPC response missing the balance arrays.
    if (!Array.isArray(tx.meta.preBalances) || !Array.isArray(tx.meta.postBalances)) {
      return { ok: false, reason: 'unconfirmed' };
    }
    const idx = keys.findIndex((_, i) => keyAt(keys, i) === p.address);
    if (idx < 0) return { ok: false, reason: 'mismatch' };
    const pre = BigInt(tx.meta.preBalances[idx] ?? 0);
    const post = BigInt(tx.meta.postBalances[idx] ?? 0);
    if (post - pre < p.requiredAtomic) return { ok: false, reason: 'mismatch' };
    return { ok: true };
  }

  // SPL token (USDT/USDC): compare the receiving owner's token balance for this
  // mint before vs after.
  const mint = p.asset.contract ?? '';
  const sumFor = (list?: TokenBalance[]): bigint => {
    const e = (list ?? []).find((b) => b.owner === p.address && b.mint === mint);
    return e?.uiTokenAmount?.amount ? BigInt(e.uiTokenAmount.amount) : 0n;
  };
  const delta = sumFor(tx.meta.postTokenBalances) - sumFor(tx.meta.preTokenBalances);
  if (delta < p.requiredAtomic) return { ok: false, reason: 'mismatch' };
  return { ok: true };
}
