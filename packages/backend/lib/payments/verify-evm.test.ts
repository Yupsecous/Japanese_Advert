import { describe, it, expect, vi, afterEach } from 'vitest';
import { verifyEvm } from './verify-evm.js';
import type { VerifyParams } from './verify.js';
import type { AssetSpec } from './config.js';

const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const ADDR = '0x' + '1'.repeat(40);
const OTHER = '0x' + '2'.repeat(40);
const ONE_ETH = '0xde0b6b3a7640000'; // 10^18 wei

// Mock global fetch to answer JSON-RPC POSTs from a method->result map.
function rpcMock(results: Record<string, unknown>) {
  return vi.fn(async (_url: string, init?: { body?: string }) => {
    const body = JSON.parse(init?.body ?? '{}') as { method: string };
    if (!(body.method in results)) throw new Error('unexpected method ' + body.method);
    return {
      ok: true,
      status: 200,
      json: async () => ({ jsonrpc: '2.0', id: 1, result: results[body.method] }),
    } as unknown as Response;
  });
}

afterEach(() => vi.restoreAllMocks());

const nativeAsset: AssetSpec = { chain: 'ethereum', asset: 'ETH', kind: 'native', decimals: 18, displayDecimals: 6, label: 'ETH' };
const erc20Asset: AssetSpec = {
  chain: 'ethereum', asset: 'USDT', kind: 'erc20', decimals: 6, displayDecimals: 2,
  contract: '0xdac17f958d2ee523a2206206994597c13d831ec7', label: 'USDT',
};

function params(over: Partial<VerifyParams>): VerifyParams {
  return { rpcUrl: 'http://rpc', address: ADDR, asset: nativeAsset, requiredAtomic: 0n, minConf: 3, txHash: '0xabc', ...over };
}

function transferLog(to: string, amount: bigint, contract = erc20Asset.contract!) {
  const toTopic = '0x' + '0'.repeat(24) + to.slice(2);
  const data = '0x' + amount.toString(16).padStart(64, '0');
  return { address: contract, topics: [TRANSFER_TOPIC, '0x' + '0'.repeat(64), toTopic], data };
}

describe('verifyEvm — native coin', () => {
  it('accepts a confirmed transfer to our address for >= the amount', async () => {
    vi.stubGlobal('fetch', rpcMock({
      eth_getTransactionByHash: { to: ADDR, value: ONE_ETH },
      eth_getTransactionReceipt: { status: '0x1', blockNumber: '0x10', logs: [] },
      eth_blockNumber: '0x14', // 5 confirmations
    }));
    const out = await verifyEvm(params({ requiredAtomic: 500000000000000000n }));
    expect(out).toEqual({ ok: true });
  });

  it('rejects payment to a different address', async () => {
    vi.stubGlobal('fetch', rpcMock({
      eth_getTransactionByHash: { to: OTHER, value: ONE_ETH },
      eth_getTransactionReceipt: { status: '0x1', blockNumber: '0x10', logs: [] },
      eth_blockNumber: '0x14',
    }));
    expect(await verifyEvm(params({ requiredAtomic: 1n }))).toEqual({ ok: false, reason: 'mismatch' });
  });

  it('rejects an underpayment', async () => {
    vi.stubGlobal('fetch', rpcMock({
      eth_getTransactionByHash: { to: ADDR, value: ONE_ETH },
      eth_getTransactionReceipt: { status: '0x1', blockNumber: '0x10', logs: [] },
      eth_blockNumber: '0x14',
    }));
    expect(await verifyEvm(params({ requiredAtomic: 2000000000000000000n }))).toEqual({ ok: false, reason: 'mismatch' });
  });

  it('returns not-found when the tx is unknown', async () => {
    vi.stubGlobal('fetch', rpcMock({ eth_getTransactionByHash: null }));
    expect(await verifyEvm(params({ requiredAtomic: 1n }))).toEqual({ ok: false, reason: 'not-found' });
  });

  it('returns unconfirmed when not yet mined', async () => {
    vi.stubGlobal('fetch', rpcMock({
      eth_getTransactionByHash: { to: ADDR, value: ONE_ETH },
      eth_getTransactionReceipt: null,
    }));
    expect(await verifyEvm(params({ requiredAtomic: 1n }))).toEqual({ ok: false, reason: 'unconfirmed' });
  });

  it('returns unconfirmed with too few confirmations', async () => {
    vi.stubGlobal('fetch', rpcMock({
      eth_getTransactionByHash: { to: ADDR, value: ONE_ETH },
      eth_getTransactionReceipt: { status: '0x1', blockNumber: '0x10', logs: [] },
      eth_blockNumber: '0x11', // 2 confirmations < minConf 3
    }));
    expect(await verifyEvm(params({ requiredAtomic: 1n }))).toEqual({ ok: false, reason: 'unconfirmed' });
  });

  it('returns failed for a reverted tx', async () => {
    vi.stubGlobal('fetch', rpcMock({
      eth_getTransactionByHash: { to: ADDR, value: ONE_ETH },
      eth_getTransactionReceipt: { status: '0x0', blockNumber: '0x10', logs: [] },
    }));
    expect(await verifyEvm(params({ requiredAtomic: 1n }))).toEqual({ ok: false, reason: 'failed' });
  });
});

describe('verifyEvm — ERC-20', () => {
  it('accepts a Transfer log from the right token to our address', async () => {
    vi.stubGlobal('fetch', rpcMock({
      eth_getTransactionByHash: { to: erc20Asset.contract, value: '0x0' },
      eth_getTransactionReceipt: { status: '0x1', blockNumber: '0x10', logs: [transferLog(ADDR, 1_000_000n)] },
      eth_blockNumber: '0x14',
    }));
    const out = await verifyEvm(params({ asset: erc20Asset, requiredAtomic: 1_000_000n }));
    expect(out).toEqual({ ok: true });
  });

  it('ignores a Transfer from a different token contract', async () => {
    vi.stubGlobal('fetch', rpcMock({
      eth_getTransactionByHash: { to: erc20Asset.contract, value: '0x0' },
      eth_getTransactionReceipt: { status: '0x1', blockNumber: '0x10', logs: [transferLog(ADDR, 1_000_000n, '0x' + '9'.repeat(40))] },
      eth_blockNumber: '0x14',
    }));
    expect(await verifyEvm(params({ asset: erc20Asset, requiredAtomic: 1_000_000n }))).toEqual({ ok: false, reason: 'mismatch' });
  });

  it('rejects a Transfer to a different recipient', async () => {
    vi.stubGlobal('fetch', rpcMock({
      eth_getTransactionByHash: { to: erc20Asset.contract, value: '0x0' },
      eth_getTransactionReceipt: { status: '0x1', blockNumber: '0x10', logs: [transferLog(OTHER, 1_000_000n)] },
      eth_blockNumber: '0x14',
    }));
    expect(await verifyEvm(params({ asset: erc20Asset, requiredAtomic: 1_000_000n }))).toEqual({ ok: false, reason: 'mismatch' });
  });

  it('rejects an ERC-20 underpayment', async () => {
    vi.stubGlobal('fetch', rpcMock({
      eth_getTransactionByHash: { to: erc20Asset.contract, value: '0x0' },
      eth_getTransactionReceipt: { status: '0x1', blockNumber: '0x10', logs: [transferLog(ADDR, 500_000n)] },
      eth_blockNumber: '0x14',
    }));
    expect(await verifyEvm(params({ asset: erc20Asset, requiredAtomic: 1_000_000n }))).toEqual({ ok: false, reason: 'mismatch' });
  });
});
