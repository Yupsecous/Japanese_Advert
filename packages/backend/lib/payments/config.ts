// Static registry + env-driven configuration for non-custodial crypto payments.
//
// Scope (v1): EVM family (Ethereum, Arbitrum, BNB Smart Chain) incl. USDT/USDC,
// Bitcoin, and Solana incl. SPL USDT/USDC. Each chain pays to ONE receiving
// address the operator controls, configured via env so nothing sensitive lives
// in git. An asset is only offered if its chain has a receiving address set.
//
// Contract / mint addresses below are the canonical, well-known token
// deployments on each chain — they are public constants, not secrets.

export type ChainId = 'ethereum' | 'arbitrum' | 'bnb' | 'bitcoin' | 'solana';
export type ChainFamily = 'evm' | 'btc' | 'sol';
export type AssetKind = 'native' | 'erc20' | 'spl';

export type ChainMeta = {
  id: ChainId;
  family: ChainFamily;
  label: string; // human network name, e.g. "Arbitrum One"
  addressEnv: string; // env var holding the receiving address
  rpcEnv: string; // env var overriding the RPC / explorer base URL
  rpcDefault: string;
  minConfEnv: string;
  minConfDefault: number;
};

export type AssetSpec = {
  chain: ChainId;
  asset: string; // symbol: ETH/BNB/BTC/SOL/USDT/USDC
  kind: AssetKind;
  decimals: number; // on-chain token decimals
  displayDecimals: number; // how many decimals we show / round the quote to
  contract?: string; // erc20 contract (EVM, lower-cased) or SPL mint (Solana)
  coingeckoId?: string; // for live native price; stablecoins use $1 instead
  stable?: boolean; // treat the unit price as exactly $1
  label: string; // e.g. "USDT on Arbitrum"
};

export const CHAINS: Record<ChainId, ChainMeta> = {
  ethereum: {
    id: 'ethereum',
    family: 'evm',
    label: 'Ethereum',
    addressEnv: 'PAY_EVM_ADDRESS',
    rpcEnv: 'ETH_RPC_URL',
    rpcDefault: 'https://eth.llamarpc.com',
    minConfEnv: 'PAY_ETH_MIN_CONF',
    minConfDefault: 3,
  },
  arbitrum: {
    id: 'arbitrum',
    family: 'evm',
    label: 'Arbitrum One',
    addressEnv: 'PAY_EVM_ADDRESS',
    rpcEnv: 'ARBITRUM_RPC_URL',
    rpcDefault: 'https://arb1.arbitrum.io/rpc',
    minConfEnv: 'PAY_ARBITRUM_MIN_CONF',
    minConfDefault: 5,
  },
  bnb: {
    id: 'bnb',
    family: 'evm',
    label: 'BNB Smart Chain',
    addressEnv: 'PAY_EVM_ADDRESS',
    rpcEnv: 'BNB_RPC_URL',
    rpcDefault: 'https://bsc-dataseed.binance.org',
    minConfEnv: 'PAY_BNB_MIN_CONF',
    minConfDefault: 6,
  },
  bitcoin: {
    id: 'bitcoin',
    family: 'btc',
    label: 'Bitcoin',
    addressEnv: 'PAY_BTC_ADDRESS',
    rpcEnv: 'BTC_EXPLORER_URL',
    rpcDefault: 'https://blockstream.info/api',
    minConfEnv: 'PAY_BTC_MIN_CONF',
    minConfDefault: 1,
  },
  solana: {
    id: 'solana',
    family: 'sol',
    label: 'Solana',
    addressEnv: 'PAY_SOL_ADDRESS',
    rpcEnv: 'SOLANA_RPC_URL',
    rpcDefault: 'https://api.mainnet-beta.solana.com',
    minConfEnv: 'PAY_SOL_MIN_CONF', // unused (Solana uses finalized commitment) — kept for symmetry
    minConfDefault: 0,
  },
};

// All assets the system knows how to quote + verify. `enabledAssets()` filters
// this to the ones whose chain currently has a receiving address configured.
export const ASSETS: AssetSpec[] = [
  // ── Ethereum ──
  { chain: 'ethereum', asset: 'ETH', kind: 'native', decimals: 18, displayDecimals: 6, coingeckoId: 'ethereum', label: 'ETH on Ethereum' },
  { chain: 'ethereum', asset: 'USDT', kind: 'erc20', decimals: 6, displayDecimals: 2, stable: true, contract: '0xdac17f958d2ee523a2206206994597c13d831ec7', label: 'USDT on Ethereum' },
  { chain: 'ethereum', asset: 'USDC', kind: 'erc20', decimals: 6, displayDecimals: 2, stable: true, contract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', label: 'USDC on Ethereum' },
  // ── Arbitrum One ──
  { chain: 'arbitrum', asset: 'ETH', kind: 'native', decimals: 18, displayDecimals: 6, coingeckoId: 'ethereum', label: 'ETH on Arbitrum' },
  { chain: 'arbitrum', asset: 'USDT', kind: 'erc20', decimals: 6, displayDecimals: 2, stable: true, contract: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', label: 'USDT on Arbitrum' },
  { chain: 'arbitrum', asset: 'USDC', kind: 'erc20', decimals: 6, displayDecimals: 2, stable: true, contract: '0xaf88d065e77c8cc2239327c5edb3a432268e5831', label: 'USDC on Arbitrum' },
  // ── BNB Smart Chain (BEP-20 stablecoins are 18 decimals) ──
  { chain: 'bnb', asset: 'BNB', kind: 'native', decimals: 18, displayDecimals: 6, coingeckoId: 'binancecoin', label: 'BNB on BNB Chain' },
  { chain: 'bnb', asset: 'USDT', kind: 'erc20', decimals: 18, displayDecimals: 2, stable: true, contract: '0x55d398326f99059ff775485246999027b3197955', label: 'USDT on BNB Chain' },
  { chain: 'bnb', asset: 'USDC', kind: 'erc20', decimals: 18, displayDecimals: 2, stable: true, contract: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', label: 'USDC on BNB Chain' },
  // ── Bitcoin ──
  { chain: 'bitcoin', asset: 'BTC', kind: 'native', decimals: 8, displayDecimals: 8, coingeckoId: 'bitcoin', label: 'BTC' },
  // ── Solana ──
  { chain: 'solana', asset: 'SOL', kind: 'native', decimals: 9, displayDecimals: 4, coingeckoId: 'solana', label: 'SOL' },
  { chain: 'solana', asset: 'USDT', kind: 'spl', decimals: 6, displayDecimals: 2, stable: true, contract: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', label: 'USDT on Solana' },
  { chain: 'solana', asset: 'USDC', kind: 'spl', decimals: 6, displayDecimals: 2, stable: true, contract: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', label: 'USDC on Solana' },
];

function trimmed(envVar: string): string | undefined {
  const v = process.env[envVar]?.trim();
  return v && v.length > 0 ? v : undefined;
}

// The receiving address for a chain, or undefined if not configured (chain off).
export function receivingAddress(chain: ChainId): string | undefined {
  return trimmed(CHAINS[chain].addressEnv);
}

export function rpcUrl(chain: ChainId): string {
  return trimmed(CHAINS[chain].rpcEnv) ?? CHAINS[chain].rpcDefault;
}

export function minConfirmations(chain: ChainId): number {
  const raw = trimmed(CHAINS[chain].minConfEnv);
  const n = raw === undefined ? CHAINS[chain].minConfDefault : Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : CHAINS[chain].minConfDefault;
}

export function findAsset(chain: string, asset: string): AssetSpec | undefined {
  return ASSETS.find((a) => a.chain === chain && a.asset === asset);
}

// Assets currently payable — those whose chain has a receiving address set.
export function enabledAssets(): AssetSpec[] {
  return ASSETS.filter((a) => receivingAddress(a.chain) !== undefined);
}

export function isPayTier(v: unknown): v is 'pro' | 'ultra' {
  return v === 'pro' || v === 'ultra';
}

// Price of a tier in USD (env-tunable; defaults match the plan cards' copy). A
// misconfigured/empty env (Number('') === 0, Number('x') === NaN) falls back to
// the default rather than producing a $0/NaN quote.
export function tierPriceUsd(tier: 'pro' | 'ultra'): number {
  const fallback = tier === 'pro' ? 19 : 49;
  const raw = trimmed(tier === 'pro' ? 'PRICE_PRO_USD' : 'PRICE_ULTRA_USD');
  const n = raw === undefined ? fallback : Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// How long a quote (and its locked token amount) stays valid.
export function orderTtlMinutes(): number {
  const n = Number(process.env.PAY_ORDER_TTL_MIN ?? 30);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 30;
}
