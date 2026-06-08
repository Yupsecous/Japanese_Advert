import { describe, it, expect } from 'vitest';
import { computeAmount, formatAtomic } from './amount.js';

describe('computeAmount', () => {
  it('quotes a native coin, rounding the display up', () => {
    // $19 at $2000/ETH = 0.0095 ETH, 18 decimals, shown to 6 dp.
    const q = computeAmount(19, 2000, 18, 6);
    expect(q.display).toBe('0.009500');
    expect(q.atomic).toBe('9500000000000000'); // 0.0095 * 1e18
  });

  it('quotes a 6-dp stablecoin at $1', () => {
    const q = computeAmount(19, 1, 6, 2);
    expect(q.display).toBe('19.00');
    expect(q.atomic).toBe('19000000'); // 19 * 1e6
  });

  it('NEVER under-charges: the rounded display * price >= the USD target', () => {
    const amountUsd = 10;
    const price = 3; // ugly division -> 3.3333...
    const q = computeAmount(amountUsd, price, 18, 6);
    expect(q.display).toBe('3.333334'); // rounded UP from 3.333333…
    expect(Number(q.display) * price).toBeGreaterThanOrEqual(amountUsd);
  });

  it('atomic is exactly display scaled to full decimals', () => {
    const q = computeAmount(49, 137.5, 9, 4); // SOL-like, 9 decimals shown to 4
    // display has 4 dp; atomic must equal display * 1e9 with no rounding drift.
    const expected = BigInt(Math.round(Number(q.display) * 1e4)) * 10n ** 5n;
    expect(q.atomic).toBe(expected.toString());
  });

  it('rejects nonsense inputs', () => {
    expect(() => computeAmount(0, 2000, 18, 6)).toThrow();
    expect(() => computeAmount(19, 0, 18, 6)).toThrow();
    expect(() => computeAmount(19, 2000, 6, 8)).toThrow(); // displayDecimals > decimals
  });
});

describe('formatAtomic', () => {
  it('round-trips the display amount', () => {
    expect(formatAtomic('9500000000000000', 18, 6)).toBe('0.009500');
    expect(formatAtomic('19000000', 6, 2)).toBe('19.00');
  });

  it('handles whole-only display', () => {
    expect(formatAtomic('5000000000000000000', 18, 0)).toBe('5');
  });
});
