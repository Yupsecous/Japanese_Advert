// EVM verifier (Ethereum / Arbitrum / BNB Smart Chain). Uses plain JSON-RPC —
// no web3 library. Handles native coin transfers (tx.value) and ERC-20/BEP-20
// transfers (the Transfer event in the receipt logs).

import { jsonRpc } from './http.js';
import type { VerifyOutcome, VerifyParams } from './verify.js';

// keccak256("Transfer(address,address,uint256)")
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

type EvmTx = { to: string | null; value: string } | null;
type EvmLog = { address: string; topics: string[]; data: string };
type EvmReceipt = { status: string; blockNumber: string | null; logs: EvmLog[] } | null;

// A 32-byte topic holds a left-zero-padded 20-byte address in its last 40 hex
// chars. Normalize to a lower-case 0x-address.
function topicToAddress(topic: string): string {
  return ('0x' + topic.slice(-40)).toLowerCase();
}

export async function verifyEvm(p: VerifyParams): Promise<VerifyOutcome> {
  const tx = await jsonRpc<EvmTx>(p.rpcUrl, 'eth_getTransactionByHash', [p.txHash]);
  if (!tx) return { ok: false, reason: 'not-found' };

  const receipt = await jsonRpc<EvmReceipt>(p.rpcUrl, 'eth_getTransactionReceipt', [p.txHash]);
  if (!receipt || receipt.blockNumber == null) return { ok: false, reason: 'unconfirmed' };
  if (receipt.status !== '0x1') return { ok: false, reason: 'failed' };

  // Enough confirmations? (latest - mined + 1)
  const latest = await jsonRpc<string>(p.rpcUrl, 'eth_blockNumber', []);
  const confirmations = Number(BigInt(latest) - BigInt(receipt.blockNumber)) + 1;
  if (confirmations < p.minConf) return { ok: false, reason: 'unconfirmed' };

  const to = p.address.toLowerCase();

  if (p.asset.kind === 'native') {
    if ((tx.to ?? '').toLowerCase() !== to) return { ok: false, reason: 'mismatch' };
    // Guard the BigInt parse against a malformed/missing value field (fail closed).
    if (typeof tx.value !== 'string') return { ok: false, reason: 'mismatch' };
    if (BigInt(tx.value) < p.requiredAtomic) return { ok: false, reason: 'mismatch' };
    return { ok: true };
  }

  // ERC-20 / BEP-20: find a Transfer log from the right token contract to our
  // address for >= the required amount.
  const contract = (p.asset.contract ?? '').toLowerCase();
  for (const log of receipt.logs ?? []) {
    if ((log.address ?? '').toLowerCase() !== contract) continue;
    if ((log.topics?.[0] ?? '').toLowerCase() !== TRANSFER_TOPIC) continue;
    const toTopic = log.topics?.[2];
    if (!toTopic || topicToAddress(toTopic) !== to) continue;
    const value = BigInt(log.data); // amount is the 32-byte data word
    if (value >= p.requiredAtomic) return { ok: true };
  }
  return { ok: false, reason: 'mismatch' };
}
