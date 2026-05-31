import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Brief, Customer, IndividualBrief } from '../types';

// Mock the three provider clients so no real API calls happen and we can assert
// which ones fire for a given recommendedFormat.
vi.mock('./anthropicClient', () => ({ messagesJson: vi.fn() }));
vi.mock('./openaiClient', () => ({ chatCompletionsJson: vi.fn() }));
vi.mock('./fluxClient', () => ({ callFlux: vi.fn() }));

import { messagesJson } from './anthropicClient';
import { chatCompletionsJson } from './openaiClient';
import { callFlux } from './fluxClient';
import { generateAssetsForCustomer } from './batchGeneratorService';

const mMsg = vi.mocked(messagesJson);
const mChat = vi.mocked(chatCompletionsJson);
const mFlux = vi.mocked(callFlux);

const brief = { productName: 'P', targetAudience: 'A', adAngle: 'Angle' } as unknown as Brief;
const apiKeys = { openai: 'k', anthropic: 'k', fal: 'k' };
const customer = {
  id: 'c1', name: 'N', age: 30, gender: 'male', location: 'Austin, TX',
  segment: 'X', recentInterest: 'i', recentPurchase: 'p', socialSignalSummary: 's',
} as unknown as Customer;

function briefIndividual(format: IndividualBrief['recommendedFormat']): IndividualBrief {
  return {
    customerId: 'c1', product: 'P', audience: 'A', tone: 'warm',
    recommendedFormat: format, rationale: 'r', generatedAt: 0,
  } as unknown as IndividualBrief;
}

beforeEach(() => {
  vi.clearAllMocks();
  mMsg.mockResolvedValue({ headline: 'H', caption: 'C', cta: 'Go' });
  // One mock serves both the image-prompt (expects {prompt}) and the script
  // (expects {script}); extra keys are ignored by each zod parse.
  mChat.mockResolvedValue({ prompt: 'a flux prompt', script: 'a script' });
  mFlux.mockResolvedValue('https://img/x.png');
});

describe('generateAssetsForCustomer — image skip by recommendedFormat', () => {
  it('skips Flux entirely for text-only recipients', async () => {
    const asset = await generateAssetsForCustomer({
      campaignBrief: brief, individualBrief: briefIndividual('text'), customer, apiKeys, locale: 'en',
    });
    expect(mFlux).not.toHaveBeenCalled();
    expect(asset.imageUrl).toBeNull();
    expect(asset.headline).toBe('H'); // copy is still produced
  });

  it('skips Flux for voice recipients', async () => {
    await generateAssetsForCustomer({
      campaignBrief: brief, individualBrief: briefIndividual('voice'), customer, apiKeys, locale: 'en',
    });
    expect(mFlux).not.toHaveBeenCalled();
  });

  it('generates a Flux image for image recipients', async () => {
    const asset = await generateAssetsForCustomer({
      campaignBrief: brief, individualBrief: briefIndividual('image'), customer, apiKeys, locale: 'en',
    });
    expect(mFlux).toHaveBeenCalledTimes(1);
    expect(asset.imageUrl).toBe('https://img/x.png');
  });

  it('generates a Flux image for video recipients', async () => {
    await generateAssetsForCustomer({
      campaignBrief: brief, individualBrief: briefIndividual('video'), customer, apiKeys, locale: 'en',
    });
    expect(mFlux).toHaveBeenCalledTimes(1);
  });
});
