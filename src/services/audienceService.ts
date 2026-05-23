// Audience Console — Phase 1 service.
//
// Converts a list of Customer records into per-customer IndividualBriefs by
// asking Claude Sonnet 4.6 to specialize the campaign-level brief for each
// recipient. Each brief specifies:
//   - audience: the SAME customer described as a tight ad-targeting line
//   - tone: how the ad should speak to THIS specific person
//   - recommendedFormat: text / image / video / voice — what works best
//   - rationale: 1-2 sentence why
//
// Runs in parallel with a 5-concurrent cap to respect Anthropic rate limits
// while still finishing 100 customers in ~30-45 seconds.

import { z } from 'zod';
import { messagesJson } from './anthropicClient';
import { AppError } from './errorMessages';
import { brandPromptBlock } from './brandPrompt';
import { languageDirective, type Locale } from '../i18n';
import type { BrandDictionary, Brief, Customer, IndividualBrief } from '../types';

const FORMATS = ['text', 'image', 'video', 'voice'] as const;
type Format = (typeof FORMATS)[number];

const SYSTEM_PROMPT = `You specialize one campaign-level ad brief into one PERSONALIZED brief per customer. The campaign brief in the user message describes a product, an audience, and an angle. The customer record in the same message describes ONE recipient.

Your job is to write a brief that's specifically optimized for THIS customer — not the average customer, not the campaign target, this person.

Output schema (via the submit_individual_brief tool):
- product: copy the campaign product name verbatim
- audience: a one-line audience descriptor tuned to THIS customer (e.g. "40代経営者、現代美術好き、最近銀座の展示に行った" or "early-thirties marathon runner who recently bought trail shoes"). It should read like a media-buy targeting spec for one person.
- tone: the rhetorical register that will land with this customer specifically (e.g. "落ち着いた断定、装飾を抑える、投資の比喩" or "casual, second-person, lean into shared-experience phrasing"). 2-3 short clauses.
- recommendedFormat: pick exactly one from { text, image, video, voice }. Reasoning rubric:
  - text: customers who scan, busy professionals, short attention windows
  - image: visually-oriented interests (fashion, food, art, design)
  - video: under-35 cohorts, social-feed-native consumers, narrative interests
  - voice: commute-listening cohorts (audio-first behavior), older readers
- rationale: 1-2 sentences in plain language explaining why this customer gets this brief. Cite specifics from the customer record.

Hard rules:
- Tone field must reflect the customer's age, interests, and signal — NOT the generic campaign tone.
- Don't invent customer attributes — use only what's in the record.
- Don't say "this customer might like X" — write the brief directly.

Return only via the submit_individual_brief tool.`;

const BRIEF_SCHEMA = {
  type: 'object',
  properties: {
    product: { type: 'string' },
    audience: { type: 'string' },
    tone: { type: 'string' },
    recommended_format: { type: 'string', enum: [...FORMATS] as unknown as string[] },
    rationale: { type: 'string' },
  },
  required: ['product', 'audience', 'tone', 'recommended_format', 'rationale'],
  additionalProperties: false,
} as const;

const BriefResponseZ = z.object({
  product: z.string(),
  audience: z.string(),
  tone: z.string(),
  recommended_format: z.enum(FORMATS),
  rationale: z.string(),
});

function buildUserMessage(args: { brief: Brief; customer: Customer }): string {
  const { brief, customer } = args;
  return [
    'Campaign brief (the canonical creative — already approved):',
    `  product: "${brief.productName}"`,
    `  audience: "${brief.targetAudience}"`,
    `  angle: "${brief.adAngle}"`,
    '',
    'Customer record (this is the recipient — write a brief for this person):',
    `  id: ${customer.id}`,
    `  name: ${customer.name}`,
    `  age: ${customer.age}`,
    `  gender: ${customer.gender}`,
    `  location: ${customer.location}`,
    `  segment: ${customer.segment}`,
    `  recent_interest: ${customer.recentInterest}`,
    `  recent_purchase: ${customer.recentPurchase}`,
    `  social_signal_summary: ${customer.socialSignalSummary}`,
    '',
    'Specialize the campaign brief for this one recipient.',
  ].join('\n');
}

export type GenerateBriefArgs = {
  brief: Brief;
  customer: Customer;
  apiKey: string;
  locale?: Locale;
  brand?: BrandDictionary;
};

// Single-customer conversion. Exported so tests can mock the LLM layer and
// drive this function directly.
export async function generateIndividualBrief(args: GenerateBriefArgs): Promise<IndividualBrief> {
  const apiKey = args.apiKey.trim();
  if (!apiKey) throw new AppError('anthropic/missing-key');
  const locale: Locale = args.locale ?? 'en';

  const system = `${SYSTEM_PROMPT}\n\nLanguage note for visible audience/tone/rationale fields: ${languageDirective(
    locale,
  )} The recommended_format field stays in lowercase English (it's an API enum).${brandPromptBlock(
    args.brand,
  )}`;

  const raw = await messagesJson({
    apiKey,
    systemPrompt: system,
    userMessage: buildUserMessage(args),
    toolName: 'submit_individual_brief',
    toolDescription:
      'Submit the per-customer specialized brief: product, audience-line, tone, recommended_format, rationale.',
    inputSchema: BRIEF_SCHEMA as unknown as Record<string, unknown>,
    maxTokens: 800,
  });

  const parsed = BriefResponseZ.safeParse(raw);
  if (!parsed.success) {
    throw new AppError('anthropic/bad-response', `brief schema mismatch: ${parsed.error.message}`);
  }

  return {
    customerId: args.customer.id,
    product: parsed.data.product.trim(),
    audience: parsed.data.audience.trim(),
    tone: parsed.data.tone.trim(),
    recommendedFormat: parsed.data.recommended_format as Format,
    rationale: parsed.data.rationale.trim(),
    generatedAt: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// Batch conversion with concurrency cap
// ---------------------------------------------------------------------------

const MAX_CONCURRENT = 5;

export type BatchProgress = {
  completed: number;
  total: number;
  succeeded: number;
  failed: number;
  inFlight: number;
};

export type BatchBriefArgs = {
  brief: Brief;
  customers: Customer[];
  apiKey: string;
  locale?: Locale;
  brand?: BrandDictionary;
  onProgress?: (p: BatchProgress) => void;
  // Optional cancellation. When the signal aborts, in-flight calls finish but
  // queued ones are skipped.
  signal?: AbortSignal;
};

export type BatchBriefResult = {
  briefs: Record<string, IndividualBrief>;
  failures: Array<{ customerId: string; error: string }>;
};

// Runs the conversion across a customer list with at most MAX_CONCURRENT
// requests in flight at any time. Reports progress via onProgress for the
// UI. Errors per-customer are collected; the function does NOT throw on
// partial failure — it returns what succeeded and a per-customer error list.
export async function generateIndividualBriefBatch(
  args: BatchBriefArgs,
): Promise<BatchBriefResult> {
  const briefs: Record<string, IndividualBrief> = {};
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
      inFlight += 1;
      emit();
      try {
        const brief = await generateIndividualBrief({
          brief: args.brief,
          customer,
          apiKey: args.apiKey,
          ...(args.locale ? { locale: args.locale } : {}),
          ...(args.brand ? { brand: args.brand } : {}),
        });
        briefs[customer.id] = brief;
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

  // Spin up up to MAX_CONCURRENT workers; each pulls customers from the queue.
  const workerCount = Math.min(MAX_CONCURRENT, total);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return { briefs, failures };
}

// ---------------------------------------------------------------------------
// Sample preset loader
// ---------------------------------------------------------------------------

const SAMPLE_PATH = 'sample-audience.json';

const CustomerArrayZ = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    age: z.number(),
    gender: z.string(),
    location: z.string(),
    segment: z.string(),
    recentInterest: z.string(),
    recentPurchase: z.string(),
    socialSignalSummary: z.string(),
  }),
);

export async function loadSampleAudience(): Promise<Customer[] | null> {
  try {
    const url = `${import.meta.env.BASE_URL}${SAMPLE_PATH}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') ?? '';
    if (!ct.includes('json')) return null;
    const data = await res.json();
    const parsed = CustomerArrayZ.safeParse(data);
    if (!parsed.success) return null;
    return parsed.data.map((c) => ({
      ...c,
      gender: (['female', 'male', 'nonbinary', 'unspecified'].includes(c.gender)
        ? c.gender
        : 'unspecified') as Customer['gender'],
    }));
  } catch {
    return null;
  }
}
