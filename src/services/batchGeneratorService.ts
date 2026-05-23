// Phase 2 — Batch Generator.
//
// For each customer in the audience (whose IndividualBrief has been
// converted in Phase 1), generates a personalized copy + image + script
// using the campaign brief, the individual brief, the brand dictionary,
// and any accumulated learned insights.
//
// Architecture choice: rather than reuse llmService.generateCopy /
// generateImages / generateScript (which would compound translator calls
// and produce 2-variant outputs we don't want), this service writes its
// own focused prompts that produce a single personalized variant per
// asset. ~3 LLM calls + 1 Flux call per customer. Rate-limited to 4
// concurrent customers (= ~16 simultaneous API requests at peak).

import { z } from 'zod';
import { messagesJson } from './anthropicClient';
import { chatCompletionsJson } from './openaiClient';
import { AppError } from './errorMessages';
import { brandPromptBlock, brandVisualBlock } from './brandPrompt';
import { languageDirective, type Locale } from '../i18n';
import type {
  BrandDictionary,
  Brief,
  Customer,
  GeneratedAssetSet,
  IndividualBrief,
} from '../types';

const MAX_CONCURRENT_CUSTOMERS = 4;

// ---------------------------------------------------------------------------
// Per-customer copy generation
// ---------------------------------------------------------------------------

const COPY_SCHEMA = {
  type: 'object',
  properties: {
    headline: { type: 'string' },
    caption: { type: 'string' },
    cta: { type: 'string' },
  },
  required: ['headline', 'caption', 'cta'],
  additionalProperties: false,
} as const;

const CopyZ = z.object({
  headline: z.string(),
  caption: z.string(),
  cta: z.string(),
});

async function generateCustomerCopy(args: {
  campaignBrief: Brief;
  individualBrief: IndividualBrief;
  customer: Customer;
  anthropicKey: string;
  locale: Locale;
  brand?: BrandDictionary;
}): Promise<{ headline: string; caption: string; cta: string }> {
  const system = `You write one ad-copy variant tuned to ONE specific customer. The campaign brief describes the product. The individual brief specifies the tone and audience-line for THIS customer. Your output is a single variant — not options — because this asset will be delivered to this one recipient only.

Rules:
- Headline: 6-10 words. Lead with what this specific customer cares about based on their interest and social signal.
- Caption: 2-3 sentences in social-feed register. Use the tone specified in the individual brief.
- CTA: 3-5 words, action-led.
- No buzzwords ("unlock", "elevate", "leverage", "synergy", "revolutionary", "game-changing").
- Don't address the customer by name (that's spammy in ad copy). Address by what they're interested in.

Return only via the submit_customer_copy tool.${brandPromptBlock(args.brand)}

Language: ${languageDirective(args.locale)}`;

  const user = [
    `Campaign brief: { product: "${args.campaignBrief.productName}", audience: "${args.campaignBrief.targetAudience}", angle: "${args.campaignBrief.adAngle}" }`,
    `Individual brief: { audience: "${args.individualBrief.audience}", tone: "${args.individualBrief.tone}", rationale: "${args.individualBrief.rationale}" }`,
    `Customer signal: ${args.customer.socialSignalSummary}`,
    '',
    `Write the personalized copy for this recipient.`,
  ].join('\n');

  const raw = await messagesJson({
    apiKey: args.anthropicKey,
    systemPrompt: system,
    userMessage: user,
    toolName: 'submit_customer_copy',
    toolDescription: 'Submit one personalized ad copy variant for this specific customer.',
    inputSchema: COPY_SCHEMA as unknown as Record<string, unknown>,
    maxTokens: 700,
  });
  const parsed = CopyZ.safeParse(raw);
  if (!parsed.success) {
    throw new AppError('anthropic/bad-response', `customer copy schema mismatch: ${parsed.error.message}`);
  }
  return {
    headline: parsed.data.headline.trim(),
    caption: parsed.data.caption.trim(),
    cta: parsed.data.cta.trim(),
  };
}

// ---------------------------------------------------------------------------
// Per-customer image (only if recommendedFormat warrants visuals)
// ---------------------------------------------------------------------------

const PROMPT_SCHEMA = {
  type: 'object',
  properties: { prompt: { type: 'string' } },
  required: ['prompt'],
  additionalProperties: false,
} as const;

const PromptZ = z.object({ prompt: z.string() });

const FalImageZ = z.object({
  images: z.array(z.object({ url: z.string() })).min(1),
});

async function generateCustomerImagePrompt(args: {
  campaignBrief: Brief;
  individualBrief: IndividualBrief;
  customer: Customer;
  openaiKey: string;
  brand?: BrandDictionary;
}): Promise<string> {
  const system = `You construct a Flux Schnell image prompt for a personalized ad targeted at ONE specific customer. Write in prose, single paragraph, vivid and specific. Use the customer's interests and signal to inform subject + setting.

End every prompt with: "Portrait 4:5".${brandVisualBlock(args.brand)}

The output prompt MUST be in English regardless of the brief language — diffusion models perform measurably worse on non-English prompts. Translate as you compose if needed.`;
  const user = [
    `Campaign: { product: "${args.campaignBrief.productName}", angle: "${args.campaignBrief.adAngle}" }`,
    `Individual brief: { audience: "${args.individualBrief.audience}", tone: "${args.individualBrief.tone}" }`,
    `Customer signal: ${args.customer.socialSignalSummary}`,
    '',
    'Write the personalized Flux prompt.',
  ].join('\n');

  const raw = await chatCompletionsJson({
    apiKey: args.openaiKey,
    system,
    user,
    schemaName: 'customer_flux_prompt',
    schema: PROMPT_SCHEMA as unknown as Record<string, unknown>,
    temperature: 0.7,
    maxTokens: 500,
  });
  const parsed = PromptZ.parse(raw);
  return parsed.prompt.trim();
}

async function generateCustomerImage(args: { prompt: string; falKey: string }): Promise<string> {
  const res = await fetch('https://fal.run/fal-ai/flux/schnell', {
    method: 'POST',
    headers: {
      Authorization: `Key ${args.falKey.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: args.prompt,
      image_size: { width: 768, height: 960 },
      num_inference_steps: 4,
      num_images: 1,
      enable_safety_checker: true,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new AppError('fal/bad-response', `status ${res.status}: ${text.slice(0, 200)}`);
  }
  const body = (await res.json()) as unknown;
  const parsed = FalImageZ.parse(body);
  return parsed.images[0]!.url;
}

// ---------------------------------------------------------------------------
// Per-customer script
// ---------------------------------------------------------------------------

const SCRIPT_SCHEMA = {
  type: 'object',
  properties: { script: { type: 'string' } },
  required: ['script'],
  additionalProperties: false,
} as const;

const ScriptZ = z.object({ script: z.string() });

async function generateCustomerScript(args: {
  campaignBrief: Brief;
  individualBrief: IndividualBrief;
  customer: Customer;
  openaiKey: string;
  locale: Locale;
  brand?: BrandDictionary;
}): Promise<string> {
  const system = `You write one voiceover script for a personalized ad targeted at ONE customer. 50-100 words for a 20-30s read. Use the tone from the individual brief. Punchy openers. Short clauses. Natural breath points.${brandPromptBlock(args.brand)}

Language: ${languageDirective(args.locale)}`;
  const user = [
    `Campaign: { product: "${args.campaignBrief.productName}", angle: "${args.campaignBrief.adAngle}" }`,
    `Individual brief: { tone: "${args.individualBrief.tone}", audience: "${args.individualBrief.audience}" }`,
    `Customer signal: ${args.customer.socialSignalSummary}`,
    '',
    'Write the personalized script.',
  ].join('\n');

  const raw = await chatCompletionsJson({
    apiKey: args.openaiKey,
    system,
    user,
    schemaName: 'customer_script',
    schema: SCRIPT_SCHEMA as unknown as Record<string, unknown>,
    temperature: 0.85,
    maxTokens: 600,
  });
  const parsed = ScriptZ.parse(raw);
  return parsed.script.trim();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type GenerateAssetsForCustomerArgs = {
  campaignBrief: Brief;
  individualBrief: IndividualBrief;
  customer: Customer;
  apiKeys: { openai: string; anthropic: string; fal: string };
  locale: Locale;
  brand?: BrandDictionary;
};

// Generates the full asset set for a single customer. Copy + Image (prompt
// then Flux call) + Script run in parallel where possible.
export async function generateAssetsForCustomer(
  args: GenerateAssetsForCustomerArgs,
): Promise<GeneratedAssetSet> {
  const { campaignBrief, individualBrief, customer, apiKeys, locale, brand } = args;

  // Image generation has two steps (prompt builder then Flux), so wrap it
  // as a single promise.
  const imagePromise = (async () => {
    if (!apiKeys.fal.trim() || !apiKeys.openai.trim()) return null;
    const prompt = await generateCustomerImagePrompt({
      campaignBrief,
      individualBrief,
      customer,
      openaiKey: apiKeys.openai,
      ...(brand ? { brand } : {}),
    });
    return await generateCustomerImage({ prompt, falKey: apiKeys.fal });
  })();

  const copyPromise = generateCustomerCopy({
    campaignBrief,
    individualBrief,
    customer,
    anthropicKey: apiKeys.anthropic,
    locale,
    ...(brand ? { brand } : {}),
  });

  const scriptPromise = generateCustomerScript({
    campaignBrief,
    individualBrief,
    customer,
    openaiKey: apiKeys.openai,
    locale,
    ...(brand ? { brand } : {}),
  });

  const [copyResult, imageResult, scriptResult] = await Promise.allSettled([
    copyPromise,
    imagePromise,
    scriptPromise,
  ]);

  // Copy is the only hard requirement — without it there's no asset.
  if (copyResult.status === 'rejected') {
    throw copyResult.reason instanceof Error
      ? copyResult.reason
      : new AppError('unknown', String(copyResult.reason));
  }
  const copy = copyResult.value;

  return {
    customerId: customer.id,
    headline: copy.headline,
    caption: copy.caption,
    cta: copy.cta,
    imageUrl: imageResult.status === 'fulfilled' ? imageResult.value : null,
    script: scriptResult.status === 'fulfilled' ? scriptResult.value : null,
    generatedAt: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// Batch over N customers
// ---------------------------------------------------------------------------

export type BatchAssetProgress = {
  completed: number;
  total: number;
  succeeded: number;
  failed: number;
  inFlight: number;
};

export type BatchAssetArgs = {
  campaignBrief: Brief;
  briefCache: Record<string, IndividualBrief>;
  customers: Customer[]; // the subset to generate for (e.g. first 10)
  apiKeys: { openai: string; anthropic: string; fal: string };
  locale: Locale;
  brand?: BrandDictionary;
  onAsset?: (asset: GeneratedAssetSet) => void;
  onProgress?: (p: BatchAssetProgress) => void;
  signal?: AbortSignal;
};

export type BatchAssetResult = {
  assets: Record<string, GeneratedAssetSet>;
  failures: Array<{ customerId: string; error: string }>;
};

export async function generateAssetsBatch(args: BatchAssetArgs): Promise<BatchAssetResult> {
  const assets: Record<string, GeneratedAssetSet> = {};
  const failures: Array<{ customerId: string; error: string }> = [];
  let completed = 0;
  let succeeded = 0;
  let failed = 0;
  let inFlight = 0;
  const total = args.customers.length;
  const queue = [...args.customers];

  function emit() {
    args.onProgress?.({ completed, total, succeeded, failed, inFlight });
  }
  emit();

  async function worker() {
    while (queue.length > 0) {
      if (args.signal?.aborted) return;
      const customer = queue.shift();
      if (!customer) return;
      const individualBrief = args.briefCache[customer.id];
      if (!individualBrief) {
        failures.push({ customerId: customer.id, error: 'no individual brief' });
        failed += 1;
        completed += 1;
        emit();
        continue;
      }
      inFlight += 1;
      emit();
      try {
        const asset = await generateAssetsForCustomer({
          campaignBrief: args.campaignBrief,
          individualBrief,
          customer,
          apiKeys: args.apiKeys,
          locale: args.locale,
          ...(args.brand ? { brand: args.brand } : {}),
        });
        assets[customer.id] = asset;
        args.onAsset?.(asset);
        succeeded += 1;
      } catch (err) {
        failures.push({
          customerId: customer.id,
          error: err instanceof Error ? err.message : String(err),
        });
        failed += 1;
      } finally {
        completed += 1;
        inFlight -= 1;
        emit();
      }
    }
  }

  const workerCount = Math.min(MAX_CONCURRENT_CUSTOMERS, total);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return { assets, failures };
}
