// Campaign Report exporter for the Audience Console.
//
// Bundles the entire audience-console session into a single ZIP the user
// can hand to their client / stakeholders:
//
//   campaign-summary.md     — executive overview + KPIs + insight
//   customers.csv           — uploaded customer list (input)
//   individual-briefs.csv   — per-customer specialized briefs
//   generated-assets.csv    — the personalized ad copy per customer
//   delivery-log.csv        — what got sent to whom on what channel
//   effectiveness.csv       — per-customer outcomes
//   segment-heatmap.csv     — segment × format CVR matrix
//   kpi-summary.json        — aggregated KPIs
//   applied-insights.md     — the brand-dictionary insights from this run
//
// Pure data — no LLM calls, no API quota. Fast.

import JSZip from 'jszip';
import {
  computeKpiSummary,
  computeSegmentHeatmap,
  type KpiSummary,
} from './effectivenessService';
import type {
  BrandDictionary,
  Brief,
  Customer,
  DeliveryRecord,
  EffectivenessRecord,
  GeneratedAssetSet,
  IndividualBrief,
} from '../types';

// ---------------------------------------------------------------------------
// CSV helpers
// ---------------------------------------------------------------------------

// RFC-4180-ish escape: wrap any value containing comma / quote / newline
// in quotes, and double any inner quotes. Numbers and booleans pass
// through as their string form.
export function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

// Builds a CSV string from a header row + an array of row objects.
// Keys not in the header are skipped; header keys missing from a row
// render as empty cells.
export function buildCsv(headers: string[], rows: Array<Record<string, unknown>>): string {
  const lines: string[] = [headers.map(csvEscape).join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(','));
  }
  return lines.join('\n') + '\n';
}

// ---------------------------------------------------------------------------
// Per-file builders
// ---------------------------------------------------------------------------

export function buildCustomersCsv(customers: Customer[]): string {
  return buildCsv(
    [
      'id',
      'name',
      'age',
      'gender',
      'location',
      'segment',
      'recentInterest',
      'recentPurchase',
      'socialSignalSummary',
    ],
    customers as unknown as Array<Record<string, unknown>>,
  );
}

export function buildBriefsCsv(briefCache: Record<string, IndividualBrief>): string {
  const rows = Object.values(briefCache).map((b) => ({
    customerId: b.customerId,
    product: b.product,
    audience: b.audience,
    tone: b.tone,
    recommendedFormat: b.recommendedFormat,
    rationale: b.rationale,
    generatedAt: new Date(b.generatedAt).toISOString(),
  }));
  return buildCsv(
    [
      'customerId',
      'product',
      'audience',
      'tone',
      'recommendedFormat',
      'rationale',
      'generatedAt',
    ],
    rows,
  );
}

export function buildAssetsCsv(
  generatedAssets: Record<string, GeneratedAssetSet>,
  customers: Customer[],
): string {
  const customerById = new Map(customers.map((c) => [c.id, c]));
  const rows = Object.values(generatedAssets).map((a) => {
    const c = customerById.get(a.customerId);
    return {
      customerId: a.customerId,
      customerName: c?.name ?? '',
      segment: c?.segment ?? '',
      headline: a.headline,
      caption: a.caption,
      cta: a.cta,
      imageUrl: a.imageUrl ?? '',
      script: a.script ?? '',
      generatedAt: new Date(a.generatedAt).toISOString(),
    };
  });
  return buildCsv(
    [
      'customerId',
      'customerName',
      'segment',
      'headline',
      'caption',
      'cta',
      'imageUrl',
      'script',
      'generatedAt',
    ],
    rows,
  );
}

export function buildDeliveryLogCsv(log: DeliveryRecord[]): string {
  return buildCsv(
    ['customerId', 'channel', 'format', 'assetId', 'deliveredAt'],
    log as unknown as Array<Record<string, unknown>>,
  );
}

export function buildEffectivenessCsv(
  effectivenessData: Record<string, EffectivenessRecord>,
  customers: Customer[],
): string {
  const customerById = new Map(customers.map((c) => [c.id, c]));
  const rows = Object.values(effectivenessData).map((r) => {
    const c = customerById.get(r.customerId);
    return {
      customerId: r.customerId,
      customerName: c?.name ?? '',
      segment: c?.segment ?? '',
      opened: r.opened ? 'true' : 'false',
      clicked: r.clicked ? 'true' : 'false',
      converted: r.converted ? 'true' : 'false',
      watchTimeSeconds: r.watchTimeSeconds ?? '',
      dropOffPoint: r.dropOffPoint ?? '',
    };
  });
  return buildCsv(
    [
      'customerId',
      'customerName',
      'segment',
      'opened',
      'clicked',
      'converted',
      'watchTimeSeconds',
      'dropOffPoint',
    ],
    rows,
  );
}

export function buildHeatmapCsv(args: {
  customers: Customer[];
  deliveryLog: DeliveryRecord[];
  effectivenessData: Record<string, EffectivenessRecord>;
}): string {
  const cells = computeSegmentHeatmap(args);
  return buildCsv(
    ['segment', 'format', 'delivered', 'converted', 'cvr'],
    cells.map((c) => ({ ...c, cvr: c.cvr.toFixed(4) })),
  );
}

// ---------------------------------------------------------------------------
// Executive summary (markdown)
// ---------------------------------------------------------------------------

export function buildSummaryMarkdown(args: {
  brief: Brief;
  customers: Customer[];
  briefCache: Record<string, IndividualBrief>;
  generatedAssets: Record<string, GeneratedAssetSet>;
  deliveryLog: DeliveryRecord[];
  effectivenessData: Record<string, EffectivenessRecord>;
  learnedInsights: string[];
  runVersion: number;
  brandName: string;
  generatedAt?: number;
}): string {
  const kpis = computeKpiSummary(args.effectivenessData);
  const heatmap = computeSegmentHeatmap({
    customers: args.customers,
    deliveryLog: args.deliveryLog,
    effectivenessData: args.effectivenessData,
  });
  const top3 = [...heatmap].sort((a, b) => b.cvr - a.cvr).slice(0, 3);

  const lines: string[] = [];
  lines.push(`# Campaign Report — ${args.brief.productName}`);
  lines.push('');
  if (args.brandName.trim()) {
    lines.push(`**Brand:** ${args.brandName.trim()}`);
  }
  lines.push(`**Generated:** ${new Date(args.generatedAt ?? Date.now()).toISOString()}`);
  if (args.runVersion > 0) {
    lines.push(`**Learning version applied:** v${args.runVersion}`);
  }
  lines.push('');

  // Brief
  lines.push('## Campaign Brief');
  lines.push('');
  lines.push(`- **Product:** ${args.brief.productName}`);
  lines.push(`- **Target audience:** ${args.brief.targetAudience}`);
  lines.push(`- **Angle:** ${args.brief.adAngle}`);
  lines.push('');

  // Cohort
  lines.push('## Audience Cohort');
  lines.push('');
  lines.push(`- **Customers loaded:** ${args.customers.length}`);
  lines.push(`- **Individual briefs generated:** ${Object.keys(args.briefCache).length}`);
  lines.push(`- **Personalized assets generated:** ${Object.keys(args.generatedAssets).length}`);
  lines.push(`- **Deliveries simulated:** ${args.deliveryLog.length}`);
  lines.push('');

  // Headline KPIs
  lines.push('## Headline KPIs');
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('|---|---|');
  lines.push(`| Delivered | ${kpis.delivered} |`);
  lines.push(`| Opens | ${kpis.opened} (${Math.round(kpis.openRate * 100)}%) |`);
  lines.push(`| Clicks | ${kpis.clicked} (${Math.round(kpis.clickRate * 100)}%) |`);
  lines.push(`| Conversions | ${kpis.converted} (${Math.round(kpis.convertRate * 100)}%) |`);
  lines.push(
    `| Uplift vs single-creative baseline | ${kpis.upliftPct >= 0 ? '+' : ''}${Math.round(kpis.upliftPct)}% |`,
  );
  lines.push('');

  // Top combinations
  if (top3.length > 0) {
    lines.push('## Top-Performing Segment × Format Combinations');
    lines.push('');
    lines.push('| Segment | Format | Delivered | Converted | CVR |');
    lines.push('|---|---|---|---|---|');
    for (const c of top3) {
      lines.push(
        `| ${c.segment} | ${c.format} | ${c.delivered} | ${c.converted} | ${Math.round(c.cvr * 100)}% |`,
      );
    }
    lines.push('');
  }

  // Insights
  if (args.learnedInsights.length > 0) {
    lines.push('## Insights Extracted');
    lines.push('');
    lines.push(
      'These insights were extracted from the effectiveness data by the feedback loop and folded into the brand dictionary. They will guide all future generation runs.',
    );
    lines.push('');
    args.learnedInsights.forEach((insight, i) => {
      lines.push(`**v${i + 1}.** ${insight}`);
      lines.push('');
    });
  }

  // Notes
  lines.push('## Methodology Notes');
  lines.push('');
  lines.push(
    '- Effectiveness data in this report is **simulated** for demo purposes. Real campaigns require live Meta Marketing API / X Ads API publishing + attribution.',
  );
  lines.push(
    '- The single-creative baseline assumes a flat, non-personalized campaign reaching the same audience at industry-average conversion rates.',
  );
  lines.push(
    '- Individual briefs are LLM-generated per customer from their profile + the campaign brief.',
  );
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Applied insights markdown
// ---------------------------------------------------------------------------

export function buildAppliedInsightsMarkdown(args: {
  brandLearnedInsights: string[];
  sessionLearnedInsights: string[];
}): string {
  const lines: string[] = ['# Applied Insights', ''];
  if (args.sessionLearnedInsights.length > 0) {
    lines.push('## Extracted This Session');
    lines.push('');
    args.sessionLearnedInsights.forEach((s, i) => {
      lines.push(`${i + 1}. ${s}`);
    });
    lines.push('');
  }
  if (args.brandLearnedInsights.length > 0) {
    lines.push('## All Brand-Level Insights (durable, applied to every future generation)');
    lines.push('');
    args.brandLearnedInsights.forEach((s, i) => {
      lines.push(`${i + 1}. ${s}`);
    });
    lines.push('');
  }
  if (
    args.sessionLearnedInsights.length === 0 &&
    args.brandLearnedInsights.length === 0
  ) {
    lines.push('_No insights extracted yet — run the feedback loop to populate this section._');
    lines.push('');
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Full ZIP builder
// ---------------------------------------------------------------------------

export type BuildReportArgs = {
  brief: Brief;
  customers: Customer[];
  briefCache: Record<string, IndividualBrief>;
  generatedAssets: Record<string, GeneratedAssetSet>;
  deliveryLog: DeliveryRecord[];
  effectivenessData: Record<string, EffectivenessRecord>;
  learnedInsights: string[];
  runVersion: number;
  brand: BrandDictionary;
};

export type ReportResult = {
  blob: Blob;
  filename: string;
  fileCount: number;
  kpiSummary: KpiSummary;
};

function sanitizeForFilename(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'campaign'
  );
}

export async function buildCampaignReport(args: BuildReportArgs): Promise<ReportResult> {
  const zip = new JSZip();
  const generatedAt = Date.now();

  const summary = buildSummaryMarkdown({
    brief: args.brief,
    customers: args.customers,
    briefCache: args.briefCache,
    generatedAssets: args.generatedAssets,
    deliveryLog: args.deliveryLog,
    effectivenessData: args.effectivenessData,
    learnedInsights: args.learnedInsights,
    runVersion: args.runVersion,
    brandName: args.brand.name,
    generatedAt,
  });
  zip.file('campaign-summary.md', summary);

  zip.file('customers.csv', buildCustomersCsv(args.customers));
  zip.file('individual-briefs.csv', buildBriefsCsv(args.briefCache));
  zip.file('generated-assets.csv', buildAssetsCsv(args.generatedAssets, args.customers));
  zip.file('delivery-log.csv', buildDeliveryLogCsv(args.deliveryLog));
  zip.file(
    'effectiveness.csv',
    buildEffectivenessCsv(args.effectivenessData, args.customers),
  );
  zip.file(
    'segment-heatmap.csv',
    buildHeatmapCsv({
      customers: args.customers,
      deliveryLog: args.deliveryLog,
      effectivenessData: args.effectivenessData,
    }),
  );

  const kpiSummary = computeKpiSummary(args.effectivenessData);
  zip.file(
    'kpi-summary.json',
    JSON.stringify({ ...kpiSummary, generatedAt: new Date(generatedAt).toISOString() }, null, 2) + '\n',
  );

  zip.file(
    'applied-insights.md',
    buildAppliedInsightsMarkdown({
      brandLearnedInsights: args.brand.learnedInsights,
      sessionLearnedInsights: args.learnedInsights,
    }),
  );

  const blob = await zip.generateAsync({ type: 'blob' });
  return {
    blob,
    filename: `${sanitizeForFilename(args.brief.productName)}-campaign-report.zip`,
    fileCount: Object.keys(zip.files).length,
    kpiSummary,
  };
}

// Convenience: build and trigger download in one call.
export async function downloadCampaignReport(args: BuildReportArgs): Promise<ReportResult> {
  const result = await buildCampaignReport(args);
  const url = URL.createObjectURL(result.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = result.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
  return result;
}
