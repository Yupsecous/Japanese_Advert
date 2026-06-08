import { describe, it, expect, vi, afterEach } from 'vitest';
import { verifySol } from './verify-sol.js';
import type { VerifyParams } from './verify.js';
import type { AssetSpec } from './config.js';

const ADDR = 'So11111111111111111111111111111111111111112';
const OTHER = 'OtherWa11etxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const solAsset: AssetSpec = { chain: 'solana', asset: 'SOL', kind: 'native', decimals: 9, displayDecimals: 4, label: 'SOL' };
const usdcAsset: AssetSpec = { chain: 'solana', asset: 'USDC', kind: 'spl', decimals: 6, displayDecimals: 2, contract: MINT, label: 'USDC on Solana' };

function params(over: Partial<VerifyParams>): VerifyParams {
  return { rpcUrl: 'http://rpc', address: ADDR, asset: solAsset, requiredAtomic: 0n, minConf: 0, txHash: 'sig', ...over };
}

function solMock(result: unknown) {
  return vi.fn(async (_url: string, init?: { body?: string }) => {
    const body = JSON.parse(init?.body ?? '{}') as { method: string };
    if (body.method !== 'getTransaction') throw new Error('unexpected ' + body.method);
    return { ok: true, status: 200, json: async () => ({ jsonrpc: '2.0', id: 1, result }) } as unknown as Response;
  });
}

afterEach(() => vi.restoreAllMocks());

describe('verifySol — native', () => {
  it('accepts when the receiving account balance rose by >= the amount', async () => {
    vi.stubGlobal('fetch', solMock({
      meta: { err: null, preBalances: [1000, 0], postBalances: [1000 + 500_000_000, 0] },
      transaction: { message: { accountKeys: [{ pubkey: ADDR }, { pubkey: OTHER }] } },
    }));
    expect(await verifySol(params({ requiredAtomic: 500_000_000n }))).toEqual({ ok: true });
  });

  it('rejects an underpayment', async () => {
    vi.stubGlobal('fetch', solMock({
      meta: { err: null, preBalances: [1000, 0], postBalances: [1000 + 100, 0] },
      transaction: { message: { accountKeys: [{ pubkey: ADDR }, { pubkey: OTHER }] } },
    }));
    expect(await verifySol(params({ requiredAtomic: 500_000_000n }))).toEqual({ ok: false, reason: 'mismatch' });
  });

  it('rejects when our address is not in the tx', async () => {
    vi.stubGlobal('fetch', solMock({
      meta: { err: null, preBalances: [0], postBalances: [500_000_000] },
      transaction: { message: { accountKeys: [{ pubkey: OTHER }] } },
    }));
    expect(await verifySol(params({ requiredAtomic: 1n }))).toEqual({ ok: false, reason: 'mismatch' });
  });

  it('returns unconfirmed when the tx is not finalized / not found', async () => {
    vi.stubGlobal('fetch', solMock(null));
    expect(await verifySol(params({ requiredAtomic: 1n }))).toEqual({ ok: false, reason: 'unconfirmed' });
  });

  it('returns failed when the tx errored on-chain', async () => {
    vi.stubGlobal('fetch', solMock({
      meta: { err: { InstructionError: [0, 'Custom'] }, preBalances: [0], postBalances: [0] },
      transaction: { message: { accountKeys: [{ pubkey: ADDR }] } },
    }));
    expect(await verifySol(params({ requiredAtomic: 1n }))).toEqual({ ok: false, reason: 'failed' });
  });

  it('returns unconfirmed when balance arrays are missing/malformed', async () => {
    vi.stubGlobal('fetch', solMock({
      meta: { err: null, postBalances: [500_000_000] }, // no preBalances
      transaction: { message: { accountKeys: [{ pubkey: ADDR }] } },
    }));
    expect(await verifySol(params({ requiredAtomic: 1n }))).toEqual({ ok: false, reason: 'unconfirmed' });
  });
});

describe('verifySol — SPL token', () => {
  it('accepts when the owner token balance for the mint rose by >= the amount', async () => {
    vi.stubGlobal('fetch', solMock({
      meta: {
        err: null,
        preBalances: [0],
        postBalances: [0],
        preTokenBalances: [],
        postTokenBalances: [{ owner: ADDR, mint: MINT, uiTokenAmount: { amount: '1000000' } }],
      },
      transaction: { message: { accountKeys: [{ pubkey: ADDR }] } },
    }));
    expect(await verifySol(params({ asset: usdcAsset, requiredAtomic: 1_000_000n }))).toEqual({ ok: true });
  });

  it('rejects a wrong-mint balance change', async () => {
    vi.stubGlobal('fetch', solMock({
      meta: {
        err: null,
        preBalances: [0],
        postBalances: [0],
        preTokenBalances: [],
        postTokenBalances: [{ owner: ADDR, mint: 'WRONGMINT', uiTokenAmount: { amount: '1000000' } }],
      },
      transaction: { message: { accountKeys: [{ pubkey: ADDR }] } },
    }));
    expect(await verifySol(params({ asset: usdcAsset, requiredAtomic: 1_000_000n }))).toEqual({ ok: false, reason: 'mismatch' });
  });
});
