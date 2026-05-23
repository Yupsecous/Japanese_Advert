import { describe, it, expect } from 'vitest';
import {
  generateEffectiveness,
  computeKpiSummary,
  computeSegmentHeatmap,
} from './effectivenessService';
import type { Customer, DeliveryRecord, IndividualBrief } from '../types';

function customer(o: Partial<Customer>): Customer {
  return {
    id: 'c0',
    name: 'Test',
    age: 35,
    gender: 'unspecified',
    location: 'Tokyo',
    segment: '若手専門職',
    recentInterest: 'coffee',
    recentPurchase: 'mug',
    socialSignalSummary: '...',
    ...o,
  };
}

function delivery(o: Partial<DeliveryRecord>): DeliveryRecord {
  return {
    customerId: 'c0',
    channel: 'email',
    deliveredAt: '2026-05-24T00:00:00.000Z',
    format: 'text',
    assetId: 'c0',
    ...o,
  };
}

describe('effectivenessService.generateEffectiveness', () => {
  it('is deterministic for the same inputs (seeded RNG)', () => {
    const customers: Customer[] = [
      customer({ id: 'c1' }),
      customer({ id: 'c2', segment: '経営者', age: 50 }),
    ];
    const log: DeliveryRecord[] = [
      delivery({ customerId: 'c1', format: 'text' }),
      delivery({ customerId: 'c2', format: 'voice' }),
    ];
    const briefs: Record<string, IndividualBrief> = {};

    const a = generateEffectiveness({ deliveryLog: log, customers, briefCache: briefs });
    const b = generateEffectiveness({ deliveryLog: log, customers, briefCache: briefs });

    expect(a).toEqual(b);
  });

  it('produces measurably higher CVR for hot segment×format combos than baseline', () => {
    // Build a large enough sample to see the bias above noise.
    // Hot combo: 経営者 × voice (multiplier 1.6)
    // Cold combo: 経営者 × image (multiplier 1.0)
    const N = 200;
    const customers: Customer[] = [];
    const log: DeliveryRecord[] = [];
    for (let i = 0; i < N; i++) {
      customers.push(customer({ id: `hot-${i}`, segment: '経営者', age: 50 }));
      log.push(delivery({ customerId: `hot-${i}`, format: 'voice' }));
    }
    for (let i = 0; i < N; i++) {
      customers.push(customer({ id: `cold-${i}`, segment: '経営者', age: 50 }));
      log.push(delivery({ customerId: `cold-${i}`, format: 'image' }));
    }
    const eff = generateEffectiveness({ deliveryLog: log, customers, briefCache: {} });
    let hotConverted = 0;
    let coldConverted = 0;
    for (let i = 0; i < N; i++) {
      if (eff[`hot-${i}`]!.converted) hotConverted += 1;
      if (eff[`cold-${i}`]!.converted) coldConverted += 1;
    }
    // Hot CVR should be visibly higher than cold CVR. We don't assert a
    // specific delta but the strong combo (×1.6 across the funnel) should
    // produce at least ~50% more conversions in a 200-sample run.
    expect(hotConverted).toBeGreaterThan(coldConverted);
  });

  it('attaches a drop-off point only for video/voice opens that did not convert', () => {
    const customers: Customer[] = [
      customer({ id: 'c1', segment: 'クリエイティブ' }),
    ];
    const log: DeliveryRecord[] = [delivery({ customerId: 'c1', format: 'video' })];
    const eff = generateEffectiveness({ deliveryLog: log, customers, briefCache: {} });
    const r = eff['c1']!;
    if (r.opened && !r.converted) {
      expect(r.dropOffPoint).not.toBeNull();
    } else if (!r.opened || r.converted) {
      expect(r.dropOffPoint).toBeNull();
    }
  });
});

describe('effectivenessService.computeKpiSummary', () => {
  it('computes simple aggregates correctly', () => {
    const data: Record<string, import('../types').EffectivenessRecord> = {
      a: { customerId: 'a', opened: true, clicked: true, converted: true, watchTimeSeconds: null, dropOffPoint: null },
      b: { customerId: 'b', opened: true, clicked: true, converted: false, watchTimeSeconds: null, dropOffPoint: null },
      c: { customerId: 'c', opened: true, clicked: false, converted: false, watchTimeSeconds: null, dropOffPoint: null },
      d: { customerId: 'd', opened: false, clicked: false, converted: false, watchTimeSeconds: null, dropOffPoint: null },
    };
    const k = computeKpiSummary(data);
    expect(k.delivered).toBe(4);
    expect(k.opened).toBe(3);
    expect(k.clicked).toBe(2);
    expect(k.converted).toBe(1);
    expect(k.openRate).toBeCloseTo(0.75, 5);
    expect(k.clickRate).toBeCloseTo(0.5, 5);
    expect(k.convertRate).toBeCloseTo(0.25, 5);
    expect(k.upliftPct).toBeGreaterThan(0); // 25% > baseline ~2.7%
  });
});

describe('effectivenessService.computeSegmentHeatmap', () => {
  it('produces one cell per segment×format combination present in the log', () => {
    const customers: Customer[] = [
      customer({ id: 'c1', segment: '経営者' }),
      customer({ id: 'c2', segment: '経営者' }),
      customer({ id: 'c3', segment: '若手専門職' }),
    ];
    const log: DeliveryRecord[] = [
      delivery({ customerId: 'c1', format: 'voice' }),
      delivery({ customerId: 'c2', format: 'voice' }),
      delivery({ customerId: 'c3', format: 'image' }),
    ];
    const eff = generateEffectiveness({ deliveryLog: log, customers, briefCache: {} });
    const cells = computeSegmentHeatmap({ customers, deliveryLog: log, effectivenessData: eff });
    // Two combos present: (経営者, voice) and (若手専門職, image)
    expect(cells).toHaveLength(2);
    const exec = cells.find((c) => c.segment === '経営者' && c.format === 'voice')!;
    expect(exec.delivered).toBe(2);
  });
});
