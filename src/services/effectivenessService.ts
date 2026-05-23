// Phase 4 — Effectiveness Simulator + Dashboard data layer.
//
// Generates simulated KPI data per delivered customer. The simulation is
// biased: certain segment × format combinations get a CVR multiplier of
// ~1.5×, so the dashboard's heatmap shows clear "this combination worked"
// hotspots. This is the demo's payoff moment — the bias is what makes
// the personalization story visible.
//
// All values are simulated. No real attribution. The bias config is
// explicit and could be tuned per demo.

import type {
  Customer,
  DeliveryRecord,
  EffectivenessRecord,
  IndividualBrief,
} from '../types';

// Base probabilities for the unbiased baseline.
const BASE_OPEN_RATE = 0.6;
const BASE_CLICK_GIVEN_OPEN = 0.3;
const BASE_CONVERT_GIVEN_CLICK = 0.15;

// Segment × format hot combos. Each entry is a CVR multiplier applied to
// open, click, AND convert probabilities — the strong segments perform
// noticeably better across the whole funnel.
const HOT_COMBOS: Record<string, { format: string; multiplier: number }[]> = {
  経営者: [
    { format: 'voice', multiplier: 1.6 },
    { format: 'text', multiplier: 1.4 },
  ],
  '若手専門職': [
    { format: 'image', multiplier: 1.4 },
    { format: 'video', multiplier: 1.3 },
  ],
  クリエイティブ: [
    { format: 'image', multiplier: 1.55 },
    { format: 'video', multiplier: 1.5 },
  ],
  '投資家・FIRE志向': [
    { format: 'text', multiplier: 1.55 },
    { format: 'voice', multiplier: 1.3 },
  ],
  '主婦・育児世代': [
    { format: 'video', multiplier: 1.45 },
    { format: 'image', multiplier: 1.35 },
  ],
  趣味嗜好型: [
    { format: 'image', multiplier: 1.5 },
    { format: 'text', multiplier: 1.3 },
  ],
  '学生・若手': [
    { format: 'video', multiplier: 1.65 },
    { format: 'image', multiplier: 1.55 },
  ],
  リタイア層: [
    { format: 'voice', multiplier: 1.5 },
    { format: 'text', multiplier: 1.35 },
  ],
  // English fallback labels — used when the audience isn't JP-flavored.
  Executives: [{ format: 'voice', multiplier: 1.55 }],
  Professionals: [{ format: 'image', multiplier: 1.35 }],
  Creatives: [{ format: 'image', multiplier: 1.5 }],
};

function multiplierFor(segment: string, format: string): number {
  const combos = HOT_COMBOS[segment];
  if (!combos) return 1;
  for (const c of combos) {
    if (c.format === format) return c.multiplier;
  }
  return 1;
}

// Deterministic pseudo-random per customer so a demo re-run produces the
// same effectiveness story. Seeds from the customer id.
function seededRng(seed: string): () => number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  let s = h || 0xa5a5a5a5;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Drop-off points used for the per-customer drill-down. Picked from a
// small pool so the dashboard view shows realistic-looking churn signals.
const DROP_OFF_POINTS = [
  'after intro line',
  'mid-script (~10s)',
  'just before CTA',
  'at CTA reveal',
  'after first image change',
];

export type GenerateEffectivenessArgs = {
  deliveryLog: DeliveryRecord[];
  customers: Customer[];
  briefCache: Record<string, IndividualBrief>;
};

// Simulates effectiveness for every delivered customer. Pure function: no
// network, no side effects. Returns a record keyed by customer id.
export function generateEffectiveness(
  args: GenerateEffectivenessArgs,
): Record<string, EffectivenessRecord> {
  const out: Record<string, EffectivenessRecord> = {};
  const customerById = new Map(args.customers.map((c) => [c.id, c]));

  for (const delivery of args.deliveryLog) {
    const customer = customerById.get(delivery.customerId);
    if (!customer) continue;
    const ib = args.briefCache[customer.id];
    const format = delivery.format ?? ib?.recommendedFormat ?? 'text';
    const mult = multiplierFor(customer.segment, format);
    const rng = seededRng(`${customer.id}|${format}|${delivery.channel}`);

    const opened = rng() < Math.min(0.95, BASE_OPEN_RATE * mult);
    const clicked = opened && rng() < Math.min(0.85, BASE_CLICK_GIVEN_OPEN * mult);
    const converted = clicked && rng() < Math.min(0.7, BASE_CONVERT_GIVEN_CLICK * mult);
    const watchTime = format === 'video' || format === 'voice'
      ? Math.round((opened ? 6 + rng() * 18 * mult : 0) * 10) / 10
      : null;
    const dropOffPoint =
      (format === 'video' || format === 'voice') && opened && !converted
        ? DROP_OFF_POINTS[Math.floor(rng() * DROP_OFF_POINTS.length)]!
        : null;

    out[customer.id] = {
      customerId: customer.id,
      opened,
      clicked,
      converted,
      watchTimeSeconds: watchTime,
      dropOffPoint,
    };
  }

  return out;
}

// ---------------------------------------------------------------------------
// Aggregation for dashboard views
// ---------------------------------------------------------------------------

export type KpiSummary = {
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  openRate: number;
  clickRate: number; // clicked / delivered
  convertRate: number; // converted / delivered
  // The "single-creative baseline" comparison — assumes a flat, no-targeting
  // campaign at the global average. We approximate this as the unbiased
  // base rates (which DON'T have the multiplier applied).
  baselineConvertRate: number;
  upliftPct: number; // ((convertRate - baseline) / baseline) * 100
};

export function computeKpiSummary(
  effectivenessData: Record<string, EffectivenessRecord>,
): KpiSummary {
  const records = Object.values(effectivenessData);
  const delivered = records.length;
  let opened = 0;
  let clicked = 0;
  let converted = 0;
  for (const r of records) {
    if (r.opened) opened += 1;
    if (r.clicked) clicked += 1;
    if (r.converted) converted += 1;
  }
  const openRate = delivered === 0 ? 0 : opened / delivered;
  const clickRate = delivered === 0 ? 0 : clicked / delivered;
  const convertRate = delivered === 0 ? 0 : converted / delivered;
  // Baseline: open × click × convert at the unbiased rates.
  const baselineConvertRate = BASE_OPEN_RATE * BASE_CLICK_GIVEN_OPEN * BASE_CONVERT_GIVEN_CLICK;
  const upliftPct =
    baselineConvertRate === 0 ? 0 : ((convertRate - baselineConvertRate) / baselineConvertRate) * 100;
  return {
    delivered,
    opened,
    clicked,
    converted,
    openRate,
    clickRate,
    convertRate,
    baselineConvertRate,
    upliftPct,
  };
}

// Segment × format CVR matrix for the heatmap view. Returns rows
// (segments) × columns (formats) with cell = { delivered, converted, cvr }.
export type HeatmapCell = {
  segment: string;
  format: string;
  delivered: number;
  converted: number;
  cvr: number;
};

export function computeSegmentHeatmap(args: {
  customers: Customer[];
  deliveryLog: DeliveryRecord[];
  effectivenessData: Record<string, EffectivenessRecord>;
}): HeatmapCell[] {
  const customerById = new Map(args.customers.map((c) => [c.id, c]));
  type Cell = { delivered: number; converted: number };
  const grid: Record<string, Record<string, Cell>> = {};
  for (const delivery of args.deliveryLog) {
    const customer = customerById.get(delivery.customerId);
    if (!customer) continue;
    const eff = args.effectivenessData[customer.id];
    if (!eff) continue;
    const segment = customer.segment || 'unspecified';
    const format = delivery.format || 'text';
    if (!grid[segment]) grid[segment] = {};
    if (!grid[segment][format]) grid[segment][format] = { delivered: 0, converted: 0 };
    grid[segment][format].delivered += 1;
    if (eff.converted) grid[segment][format].converted += 1;
  }
  const out: HeatmapCell[] = [];
  for (const segment of Object.keys(grid)) {
    for (const format of Object.keys(grid[segment]!)) {
      const cell = grid[segment]![format]!;
      out.push({
        segment,
        format,
        delivered: cell.delivered,
        converted: cell.converted,
        cvr: cell.delivered === 0 ? 0 : cell.converted / cell.delivered,
      });
    }
  }
  return out;
}
