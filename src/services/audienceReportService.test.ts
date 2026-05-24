import { describe, it, expect } from 'vitest';
import {
  csvEscape,
  buildCsv,
  buildSummaryMarkdown,
  buildAppliedInsightsMarkdown,
  buildCampaignReport,
} from './audienceReportService';
import { EMPTY_BRAND_DICTIONARY } from '../types';
import type {
  Brief,
  Customer,
  DeliveryRecord,
  EffectivenessRecord,
  GeneratedAssetSet,
  IndividualBrief,
} from '../types';

describe('audienceReportService.csvEscape', () => {
  it('passes plain values through', () => {
    expect(csvEscape('plain')).toBe('plain');
    expect(csvEscape(42)).toBe('42');
    expect(csvEscape(true)).toBe('true');
  });

  it('renders null and undefined as empty', () => {
    expect(csvEscape(null)).toBe('');
    expect(csvEscape(undefined)).toBe('');
  });

  it('quotes values with commas, newlines, or quotes', () => {
    expect(csvEscape('a, b')).toBe('"a, b"');
    expect(csvEscape('line one\nline two')).toBe('"line one\nline two"');
    expect(csvEscape('she said "hi"')).toBe('"she said ""hi"""');
  });
});

describe('audienceReportService.buildCsv', () => {
  it('produces header row + data rows in the right column order', () => {
    const csv = buildCsv(
      ['id', 'name', 'segment'],
      [
        { id: 'c1', name: 'Alice', segment: 'A' },
        { id: 'c2', name: 'Bob', segment: 'B' },
      ],
    );
    const lines = csv.trim().split('\n');
    expect(lines[0]).toBe('id,name,segment');
    expect(lines[1]).toBe('c1,Alice,A');
    expect(lines[2]).toBe('c2,Bob,B');
  });

  it('renders missing fields as empty cells', () => {
    const csv = buildCsv(['a', 'b'], [{ a: 1 }]);
    expect(csv.trim().split('\n')[1]).toBe('1,');
  });
});

describe('audienceReportService.buildSummaryMarkdown', () => {
  it('includes brief, KPI table, top combinations, and insights', () => {
    const brief: Brief = {
      productName: 'TestProduct',
      targetAudience: 'TestAudience',
      adAngle: 'TestAngle',
    };
    const customers: Customer[] = [
      {
        id: 'c1',
        name: 'A',
        age: 30,
        gender: 'female',
        location: 'Tokyo',
        segment: 'クリエイティブ',
        recentInterest: '写真',
        recentPurchase: 'camera',
        socialSignalSummary: 'posted gallery',
      },
    ];
    const briefCache: Record<string, IndividualBrief> = {
      c1: {
        customerId: 'c1',
        product: 'TestProduct',
        audience: 'Specialized',
        tone: 'editorial',
        recommendedFormat: 'image',
        rationale: 'art-leaning',
        generatedAt: 1,
      },
    };
    const generatedAssets: Record<string, GeneratedAssetSet> = {
      c1: {
        customerId: 'c1',
        headline: 'Headline',
        caption: 'Caption',
        cta: 'CTA',
        imageUrl: null,
        script: null,
        generatedAt: 1,
      },
    };
    const deliveryLog: DeliveryRecord[] = [
      {
        customerId: 'c1',
        channel: 'instagram_dm',
        deliveredAt: '2026-05-24T00:00:00Z',
        format: 'image',
        assetId: 'c1',
      },
    ];
    const effectivenessData: Record<string, EffectivenessRecord> = {
      c1: {
        customerId: 'c1',
        opened: true,
        clicked: true,
        converted: true,
        watchTimeSeconds: null,
        dropOffPoint: null,
      },
    };
    const md = buildSummaryMarkdown({
      brief,
      customers,
      briefCache,
      generatedAssets,
      deliveryLog,
      effectivenessData,
      learnedInsights: ['Insight one paragraph.'],
      runVersion: 1,
      brandName: 'TestBrand',
      generatedAt: 1716508800000,
    });
    expect(md).toContain('# Campaign Report — TestProduct');
    expect(md).toContain('**Brand:** TestBrand');
    expect(md).toContain('**Learning version applied:** v1');
    expect(md).toContain('TestAudience');
    expect(md).toContain('| Metric | Value |');
    expect(md).toContain('## Top-Performing Segment × Format Combinations');
    expect(md).toContain('Insight one paragraph.');
    expect(md).toContain('## Methodology Notes');
  });

  it('omits the learning-version line when runVersion is 0', () => {
    const md = buildSummaryMarkdown({
      brief: { productName: 'P', targetAudience: 'A', adAngle: 'X' },
      customers: [],
      briefCache: {},
      generatedAssets: {},
      deliveryLog: [],
      effectivenessData: {},
      learnedInsights: [],
      runVersion: 0,
      brandName: '',
    });
    expect(md).not.toContain('Learning version applied');
  });
});

describe('audienceReportService.buildAppliedInsightsMarkdown', () => {
  it('renders both session and brand-level insights when present', () => {
    const md = buildAppliedInsightsMarkdown({
      brandLearnedInsights: ['brand-1', 'brand-2'],
      sessionLearnedInsights: ['session-1'],
    });
    expect(md).toContain('## Extracted This Session');
    expect(md).toContain('1. session-1');
    expect(md).toContain('## All Brand-Level Insights');
    expect(md).toContain('1. brand-1');
    expect(md).toContain('2. brand-2');
  });

  it('shows a fallback when both lists are empty', () => {
    const md = buildAppliedInsightsMarkdown({
      brandLearnedInsights: [],
      sessionLearnedInsights: [],
    });
    expect(md).toContain('No insights extracted yet');
  });
});

describe('audienceReportService.buildCampaignReport', () => {
  it('produces a ZIP with the expected file names', async () => {
    const result = await buildCampaignReport({
      brief: { productName: 'P', targetAudience: 'A', adAngle: 'X' },
      customers: [],
      briefCache: {},
      generatedAssets: {},
      deliveryLog: [],
      effectivenessData: {},
      learnedInsights: [],
      runVersion: 0,
      brand: EMPTY_BRAND_DICTIONARY,
    });
    expect(result.filename).toMatch(/^p-campaign-report\.zip$/);
    // 9 expected files
    expect(result.fileCount).toBe(9);
    expect(result.blob.size).toBeGreaterThan(0);
  });
});
