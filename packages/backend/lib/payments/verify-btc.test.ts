import { describe, it, expect, vi, afterEach } from 'vitest';
import { verifyBtc } from './verify-btc.js';
import type { VerifyParams } from './verify.js';
import type { AssetSpec } from './config.js';

const ADDR = 'bc1qexampleaddrxxxxxxxxxxxxxxxxxxxxxxxxxx';
const OTHER = 'bc1qotheraddrxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const btcAsset: AssetSpec = { chain: 'bitcoin', asset: 'BTC', kind: 'native', decimals: 8, displayDecimals: 8, label: 'BTC' };

function params(over: Partial<VerifyParams>): VerifyParams {
  return { rpcUrl: 'http://exp/api', address: ADDR, asset: btcAsset, requiredAtomic: 0n, minConf: 1, txHash: 'deadbeef', ...over };
}

function btcMock(opts: { txOk?: boolean; txStatus?: number; txData?: unknown; tip?: string }) {
  return vi.fn(async (url: string) => {
    if (url.includes('/tx/')) {
      return {
        ok: opts.txOk ?? true,
        status: opts.txStatus ?? 200,
        json: async () => opts.txData ?? null,
        text: async () => '',
      } as unknown as Response;
    }
    if (url.includes('/blocks/tip/height')) {
      return { ok: true, status: 200, text: async () => opts.tip ?? '0', json: async () => null } as unknown as Response;
    }
    throw new Error('unexpected url ' + url);
  });
}

afterEach(() => vi.restoreAllMocks());

describe('verifyBtc', () => {
  it('accepts a confirmed tx paying our address for >= the amount', async () => {
    vi.stubGlobal('fetch', btcMock({
      txData: { vout: [{ scriptpubkey_address: ADDR, value: 100_000 }], status: { confirmed: true, block_height: 100 } },
      tip: '105', // 6 confirmations
    }));
    expect(await verifyBtc(params({ requiredAtomic: 100_000n }))).toEqual({ ok: true });
  });

  it('sums multiple outputs to our address', async () => {
    vi.stubGlobal('fetch', btcMock({
      txData: {
        vout: [
          { scriptpubkey_address: ADDR, value: 60_000 },
          { scriptpubkey_address: OTHER, value: 999 },
          { scriptpubkey_address: ADDR, value: 40_000 },
        ],
        status: { confirmed: true, block_height: 100 },
      },
      tip: '101',
    }));
    expect(await verifyBtc(params({ requiredAtomic: 100_000n }))).toEqual({ ok: true });
  });

  it('rejects when nothing is paid to our address', async () => {
    vi.stubGlobal('fetch', btcMock({
      txData: { vout: [{ scriptpubkey_address: OTHER, value: 100_000 }], status: { confirmed: true, block_height: 100 } },
      tip: '105',
    }));
    expect(await verifyBtc(params({ requiredAtomic: 1n }))).toEqual({ ok: false, reason: 'mismatch' });
  });

  it('returns not-found for an unknown txid', async () => {
    vi.stubGlobal('fetch', btcMock({ txOk: false, txStatus: 404 }));
    expect(await verifyBtc(params({ requiredAtomic: 1n }))).toEqual({ ok: false, reason: 'not-found' });
  });

  it('returns unconfirmed while still in the mempool', async () => {
    vi.stubGlobal('fetch', btcMock({
      txData: { vout: [{ scriptpubkey_address: ADDR, value: 100_000 }], status: { confirmed: false } },
    }));
    expect(await verifyBtc(params({ requiredAtomic: 100_000n }))).toEqual({ ok: false, reason: 'unconfirmed' });
  });

  it('rejects a non-integer (malformed) tip height', async () => {
    vi.stubGlobal('fetch', btcMock({
      txData: { vout: [{ scriptpubkey_address: ADDR, value: 100_000 }], status: { confirmed: true, block_height: 100 } },
      tip: '105.5',
    }));
    expect(await verifyBtc(params({ requiredAtomic: 100_000n }))).toEqual({ ok: false, reason: 'unconfirmed' });
  });
});
