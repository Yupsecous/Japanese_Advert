// On-chain verification dispatcher. Given an order's locked parameters and a
// user-submitted transaction hash, confirm the payment actually happened on the
// right chain, to the right address, for >= the required amount, with enough
// confirmations. Verifiers NEVER trust client-supplied amounts — they read the
// chain. A thrown error (RPC/transport failure) is surfaced as 'verify-failed'
// so the user can retry without any tier being granted.

import type { AssetSpec, ChainId } from './config.js';
import { CHAINS, minConfirmations, rpcUrl } from './config.js';
import { verifyEvm } from './verify-evm.js';
import { verifyBtc } from './verify-btc.js';
import { verifySol } from './verify-sol.js';

// Why a verification did not (yet) succeed:
//  - not-found    : no such transaction visible on the chain yet
//  - unconfirmed  : found, but not enough confirmations / not finalized
//  - mismatch     : found+confirmed, but wrong address or under the amount
//  - failed       : the transaction itself reverted / errored on-chain
export type VerifyReason = 'not-found' | 'unconfirmed' | 'mismatch' | 'failed';
export type VerifyOutcome = { ok: true } | { ok: false; reason: VerifyReason };

export type VerifyParams = {
  rpcUrl: string;
  address: string; // receiving address (locked at order time)
  asset: AssetSpec;
  requiredAtomic: bigint;
  minConf: number;
  txHash: string;
};

export async function verifyOnChain(args: {
  chain: ChainId;
  asset: AssetSpec;
  address: string;
  requiredAtomic: bigint;
  txHash: string;
}): Promise<VerifyOutcome> {
  const params: VerifyParams = {
    rpcUrl: rpcUrl(args.chain),
    address: args.address,
    asset: args.asset,
    requiredAtomic: args.requiredAtomic,
    minConf: minConfirmations(args.chain),
    txHash: args.txHash.trim(),
  };
  switch (CHAINS[args.chain].family) {
    case 'evm':
      return verifyEvm(params);
    case 'btc':
      return verifyBtc(params);
    case 'sol':
      return verifySol(params);
  }
}
