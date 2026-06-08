// Bitcoin verifier via an Esplora-style REST API (Blockstream / mempool.space).
// Sums the transaction outputs paying our address and checks confirmations
// against the current chain tip.

import { getJson, getText } from './http.js';
import type { VerifyOutcome, VerifyParams } from './verify.js';

type Vout = { scriptpubkey_address?: string; value: number };
type EsploraTx = {
  vout?: Vout[];
  status?: { confirmed?: boolean; block_height?: number };
} | null;

export async function verifyBtc(p: VerifyParams): Promise<VerifyOutcome> {
  const base = p.rpcUrl.replace(/\/$/, '');
  const { ok, status, data } = await getJson(`${base}/tx/${encodeURIComponent(p.txHash)}`);
  if (!ok) return { ok: false, reason: status === 404 ? 'not-found' : 'failed' };

  const tx = data as EsploraTx;
  if (!tx) return { ok: false, reason: 'not-found' };

  // Sum every output that pays our address (value is in satoshis).
  let received = 0n;
  for (const vout of tx.vout ?? []) {
    if (vout.scriptpubkey_address === p.address) received += BigInt(vout.value);
  }
  if (received < p.requiredAtomic) return { ok: false, reason: 'mismatch' };

  if (!tx.status?.confirmed || !Number.isInteger(tx.status.block_height)) {
    return { ok: false, reason: 'unconfirmed' };
  }

  const tip = await getText(`${base}/blocks/tip/height`);
  const tipHeight = Number(tip.text.trim());
  // Reject non-integer heights so a malformed/float response can't yield a
  // fractional confirmation count that slips past the >= minConf check.
  if (!Number.isInteger(tipHeight)) return { ok: false, reason: 'unconfirmed' };
  const confirmations = tipHeight - (tx.status.block_height as number) + 1;
  if (confirmations < p.minConf) return { ok: false, reason: 'unconfirmed' };

  return { ok: true };
}
