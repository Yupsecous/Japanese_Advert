// Convert a USD price into a concrete on-chain amount, with two guarantees:
//  1. "What you see is what's required" — the required atomic amount is derived
//     from the human-readable DISPLAY amount, so there are no hidden sub-units a
//     user can't see and would underpay.
//  2. We round UP to the display precision, never down, so the rounded quote is
//     always >= the true USD value (the operator never under-charges).
//
// Pure + dependency-free so it's trivially unit-testable.

export type AmountQuote = {
  /** Smallest-unit integer amount, as a decimal string (BigInt-safe). */
  atomic: string;
  /** Human-readable amount, fixed to `displayDecimals` (what the user sends). */
  display: string;
};

export function computeAmount(
  amountUsd: number,
  priceUsd: number,
  decimals: number,
  displayDecimals: number,
): AmountQuote {
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) throw new Error('bad amountUsd');
  if (!Number.isFinite(priceUsd) || priceUsd <= 0) throw new Error('bad priceUsd');
  if (!Number.isInteger(decimals) || decimals < 0) throw new Error('bad decimals');
  if (!Number.isInteger(displayDecimals) || displayDecimals < 0 || displayDecimals > decimals) {
    throw new Error('bad displayDecimals');
  }

  const raw = amountUsd / priceUsd; // units of the asset (e.g. 0.0095 ETH)
  // Integer count of display-units, rounded UP so we never under-charge.
  const displayUnits = Math.ceil(raw * 10 ** displayDecimals);
  const display = (displayUnits / 10 ** displayDecimals).toFixed(displayDecimals);
  // displayDecimals <= decimals, so scaling up to atomic stays an exact integer.
  const atomic = (BigInt(displayUnits) * 10n ** BigInt(decimals - displayDecimals)).toString();
  return { atomic, display };
}

// Render an atomic amount back to a human string (e.g. for logging / display
// when only the stored atomic value is on hand).
export function formatAtomic(atomic: string, decimals: number, displayDecimals: number): string {
  const v = BigInt(atomic);
  const base = 10n ** BigInt(decimals);
  const whole = v / base;
  const frac = v % base;
  const fracStr = frac.toString().padStart(decimals, '0').slice(0, displayDecimals);
  return displayDecimals > 0 ? `${whole.toString()}.${fracStr}` : whole.toString();
}
