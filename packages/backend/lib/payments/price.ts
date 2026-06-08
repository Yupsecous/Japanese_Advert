// Live USD price for an asset. Stablecoins are fixed at $1; native coins are
// quoted from CoinGecko's free simple-price endpoint. A failed/garbage price
// THROWS — the caller must refuse to create an order rather than guess (a wrong
// price means the user over- or under-pays).

import type { AssetSpec } from './config.js';
import { getJson } from './http.js';

function coingeckoBase(): string {
  return (process.env.COINGECKO_API_BASE ?? 'https://api.coingecko.com/api/v3').replace(/\/$/, '');
}

export async function assetPriceUsd(asset: AssetSpec): Promise<number> {
  if (asset.stable) return 1;
  const id = asset.coingeckoId;
  if (!id) throw new Error(`no price source for ${asset.asset}`);

  const url = `${coingeckoBase()}/simple/price?ids=${encodeURIComponent(id)}&vs_currencies=usd`;
  const { ok, data } = await getJson(url);
  if (!ok) throw new Error(`price http for ${id}`);
  const price = (data as Record<string, { usd?: unknown }> | null)?.[id]?.usd;
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
    throw new Error(`price unavailable for ${id}`);
  }
  return price;
}
