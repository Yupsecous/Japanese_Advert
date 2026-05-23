import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateIndividualBrief,
  generateIndividualBriefBatch,
} from './audienceService';
import type { Brief, Customer } from '../types';

// Mock the Anthropic client. The service depends on messagesJson; we stub
// it per-test so we can verify the customer record + brief flow through to
// the tool input, and that the parsed response shapes correctly.
vi.mock('./anthropicClient', () => ({
  messagesJson: vi.fn(),
}));

import { messagesJson } from './anthropicClient';

const mockedMessagesJson = vi.mocked(messagesJson);

beforeEach(() => {
  mockedMessagesJson.mockReset();
});

function customer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 'cust-001',
    name: '中村 浩二',
    age: 47,
    gender: 'male',
    location: '東京・千代田区',
    segment: '経営者',
    recentInterest: '現代美術',
    recentPurchase: '万年筆',
    socialSignalSummary: '先週、銀座のギャラリーで現代美術展を鑑賞した投稿',
    ...overrides,
  };
}

const baseBrief: Brief = {
  productName: 'Holdfast Sleep Mask',
  targetAudience: 'Light-sensitive sleepers, 28–45',
  adAngle: 'Total darkness, in 30 seconds.',
};

const goodResponse = {
  product: 'Holdfast Sleep Mask',
  audience: '40代経営者、現代美術好き、銀座のギャラリー巡り',
  tone: '落ち着いた断定、装飾を抑える、品質と所有の比喩',
  recommended_format: 'image',
  rationale: '銀座の現代美術展を訪れた高所得層に対し、視覚的洗練の語彙が刺さる。',
};

describe('audienceService.generateIndividualBrief', () => {
  it('passes brief + customer into the Claude tool-use call and parses the response', async () => {
    mockedMessagesJson.mockResolvedValueOnce(goodResponse);
    const brief = await generateIndividualBrief({
      brief: baseBrief,
      customer: customer(),
      apiKey: 'sk-test',
    });
    expect(brief.customerId).toBe('cust-001');
    expect(brief.product).toBe('Holdfast Sleep Mask');
    expect(brief.audience).toContain('経営者');
    expect(brief.tone).toContain('落ち着いた');
    expect(brief.recommendedFormat).toBe('image');
    expect(brief.rationale.length).toBeGreaterThan(0);

    // Verify the call shape: tool name, schema-driven, user message contains
    // the customer's record and the campaign brief.
    expect(mockedMessagesJson).toHaveBeenCalledTimes(1);
    const callArgs = mockedMessagesJson.mock.calls[0]![0];
    expect(callArgs.toolName).toBe('submit_individual_brief');
    expect(callArgs.userMessage).toContain('Holdfast Sleep Mask');
    expect(callArgs.userMessage).toContain('cust-001');
    expect(callArgs.userMessage).toContain('銀座のギャラリー');
  });

  it('throws AppError when API key is empty', async () => {
    await expect(
      generateIndividualBrief({ brief: baseBrief, customer: customer(), apiKey: '   ' }),
    ).rejects.toThrow(/anthropic.*missing/i);
    expect(mockedMessagesJson).not.toHaveBeenCalled();
  });

  it('rejects when the LLM returns an off-schema format value', async () => {
    mockedMessagesJson.mockResolvedValueOnce({
      ...goodResponse,
      recommended_format: 'hologram', // not in the enum
    });
    try {
      await generateIndividualBrief({
        brief: baseBrief,
        customer: customer(),
        apiKey: 'sk-test',
      });
      throw new Error('expected the call to reject but it resolved');
    } catch (err) {
      // AppError.message is the code; .detail carries the schema error.
      expect((err as Error).message).toBe('anthropic/bad-response');
      expect((err as Error & { detail?: string }).detail).toMatch(/schema mismatch/i);
    }
  });

  it('threads brand dictionary banned terms into the system prompt', async () => {
    mockedMessagesJson.mockResolvedValueOnce(goodResponse);
    await generateIndividualBrief({
      brief: baseBrief,
      customer: customer(),
      apiKey: 'sk-test',
      brand: {
        name: 'Holdfast',
        bannedTerms: ['unlock', 'elevate'],
        preferredTerms: ['weighted'],
        voiceCharacter: 'Plainspoken, confident',
        visualRules: '',
        audienceRefinement: '',
      },
    });
    const callArgs = mockedMessagesJson.mock.calls[0]![0];
    expect(callArgs.systemPrompt).toContain('Holdfast');
    expect(callArgs.systemPrompt).toContain('unlock');
    expect(callArgs.systemPrompt).toContain('weighted');
  });
});

describe('audienceService.generateIndividualBriefBatch', () => {
  it('rate-limits to 5 concurrent in-flight calls', async () => {
    let inFlight = 0;
    let peak = 0;
    mockedMessagesJson.mockImplementation(async () => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await new Promise((r) => setTimeout(r, 10));
      inFlight -= 1;
      return goodResponse;
    });

    const customers: Customer[] = Array.from({ length: 12 }, (_, i) =>
      customer({ id: `cust-${i.toString().padStart(3, '0')}` }),
    );
    const result = await generateIndividualBriefBatch({
      brief: baseBrief,
      customers,
      apiKey: 'sk-test',
    });

    expect(Object.keys(result.briefs)).toHaveLength(12);
    expect(result.failures).toHaveLength(0);
    expect(peak).toBeLessThanOrEqual(5);
    expect(peak).toBeGreaterThan(1); // proves we actually parallelized
  });

  it('collects per-customer failures without aborting the whole batch', async () => {
    mockedMessagesJson.mockImplementation(async (args) => {
      // Fail customer 2 specifically.
      if (args.userMessage.includes('cust-002')) {
        throw new Error('simulated provider error');
      }
      return goodResponse;
    });

    const customers: Customer[] = [
      customer({ id: 'cust-001' }),
      customer({ id: 'cust-002' }),
      customer({ id: 'cust-003' }),
    ];
    const result = await generateIndividualBriefBatch({
      brief: baseBrief,
      customers,
      apiKey: 'sk-test',
    });

    expect(Object.keys(result.briefs).sort()).toEqual(['cust-001', 'cust-003']);
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]!.customerId).toBe('cust-002');
    expect(result.failures[0]!.error).toContain('simulated');
  });
});
