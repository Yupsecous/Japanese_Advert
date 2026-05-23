import { z } from 'zod';
import { chatCompletionsJson } from './openaiClient';
import { messagesJson } from './anthropicClient';
import { AppError } from './errorMessages';
import { brandPromptBlock, brandVisualBlock } from './brandPrompt';
import { languageDirective, type Locale } from '../i18n';
import {
  META_CTAS,
  X_CTAS,
  type AspectRatio,
  type BrandDictionary,
  type Brief,
  type CarouselImage,
  type CarouselSet,
  type CopyVariant,
  type MetaCta,
  type PlatformCopy,
  type PlatformImagePair,
  type XCta,
} from '../types';

// ---------------------------------------------------------------------------
// Platform copy adapter — now produces TWO distinct variants per platform
// ---------------------------------------------------------------------------

const PLATFORM_COPY_SYSTEM_PROMPT = `You adapt approved ad copy into Meta Ads and X Ads platform formats. You produce TWO distinct variants per platform — these will be A/B-tested in the real campaign, so they must differ in tonal register, not just paraphrase each other.

Variant A: confident-direct. Short clauses. Imperative verbs. Declarative claims. Low hedge.
Variant B: warm-conversational. Empathy first. Contractions. Second-person address. Light specificity.

Same claim, same product, same audience. Different rhythm and posture.

Hard constraints (failure means the asset is rejected by the platform):
- Meta primary_text: max 125 characters per variant. Counts toward the truncation point where Meta inserts the "...more" link. Stay under.
- Meta headline: max 27 characters per variant.
- Meta description: max 27 characters per variant.
- Meta cta_button: pick exactly ONE from this enum list per variant: SHOP_NOW, LEARN_MORE, SIGN_UP, SUBSCRIBE, DOWNLOAD, GET_OFFER, GET_QUOTE, CONTACT_US, APPLY_NOW, BOOK_NOW, ORDER_NOW, WATCH_MORE. These are API enums — uppercase English regardless of the user's locale. Variant A and B may pick the same enum if no better option fits.
- X tweet_text: max 280 characters per variant (this includes any handle or URL the user later adds — leave 20 chars of headroom; aim for ≤260). The tweet_text MUST NOT include the hashtags from the hashtags field — they are listed separately so the user can choose to append, schedule them in a thread, or A/B drop them.
- X cta_button: pick exactly ONE from: SHOP, LEARN_MORE, BOOK, ORDER, INSTALL, VISIT_SITE.
- X hashtags: an array of 0–3 hashtag strings WITHOUT the leading "#" (we add it on render). Choose tags that are platform-relevant: a category tag, a product/brand tag, and (optionally) a campaign/audience tag. Skip if no good tag exists — empty array is fine. NEVER fabricate trademarks you don't have rights to.

Variant tone labels: provide a short human-readable label for each variant (e.g. "Confident-direct", "Warm-conversational", "Urgent-clipped", "Empathic-grounded"). Pick whichever pair of labels best describes the actual register split you produced.

Restricted-category check:
- If the brief or copy clearly references alcohol, tobacco, gambling, prescription drugs, financial loans/credit, cryptocurrency, weapons, dating/relationships, or political content, set restricted_category_warning to a one-sentence description of which category was detected. Otherwise set it to null.

Return only via the submit_platform_copy tool.`;

const META_CTA_ENUM = [...META_CTAS] as unknown as string[];
const X_CTA_ENUM = [...X_CTAS] as unknown as string[];

const META_VARIANT_SCHEMA = {
  type: 'object',
  properties: {
    primary_text: { type: 'string' },
    headline: { type: 'string' },
    description: { type: 'string' },
    cta_button: { type: 'string', enum: META_CTA_ENUM },
    tone_label: { type: 'string' },
  },
  required: ['primary_text', 'headline', 'description', 'cta_button', 'tone_label'],
  additionalProperties: false,
} as const;

const X_VARIANT_SCHEMA = {
  type: 'object',
  properties: {
    tweet_text: { type: 'string' },
    cta_button: { type: 'string', enum: X_CTA_ENUM },
    tone_label: { type: 'string' },
    hashtags: {
      type: 'array',
      items: { type: 'string' },
      maxItems: 3,
    },
  },
  required: ['tweet_text', 'cta_button', 'tone_label', 'hashtags'],
  additionalProperties: false,
} as const;

const PLATFORM_COPY_SCHEMA = {
  type: 'object',
  properties: {
    meta_a: META_VARIANT_SCHEMA,
    meta_b: META_VARIANT_SCHEMA,
    x_a: X_VARIANT_SCHEMA,
    x_b: X_VARIANT_SCHEMA,
    restricted_category_warning: { type: ['string', 'null'] },
  },
  required: ['meta_a', 'meta_b', 'x_a', 'x_b', 'restricted_category_warning'],
  additionalProperties: false,
} as const;

const MetaVariantZ = z.object({
  primary_text: z.string(),
  headline: z.string(),
  description: z.string(),
  cta_button: z.enum(META_CTAS),
  tone_label: z.string(),
});

const XVariantZ = z.object({
  tweet_text: z.string(),
  cta_button: z.enum(X_CTAS),
  tone_label: z.string(),
  hashtags: z.array(z.string()).max(3),
});

const PlatformCopyResponseZ = z.object({
  meta_a: MetaVariantZ,
  meta_b: MetaVariantZ,
  x_a: XVariantZ,
  x_b: XVariantZ,
  restricted_category_warning: z.string().nullable(),
});

function buildPlatformCopyUserMessage(args: {
  brief: Brief;
  approvedCopy: CopyVariant;
  locale: Locale;
}): string {
  return [
    `Locale: ${args.locale}`,
    `Product: ${args.brief.productName}`,
    `Audience: ${args.brief.targetAudience}`,
    `Angle: ${args.brief.adAngle}`,
    '',
    'Approved copy:',
    `Headline: "${args.approvedCopy.headline}"`,
    `Caption: "${args.approvedCopy.caption}"`,
    `CTA: "${args.approvedCopy.cta}"`,
    '',
    'Produce two distinct variants per platform (A: confident-direct, B: warm-conversational) — same claim, different register. Adapt to the platform character limits.',
  ].join('\n');
}

export type GeneratePlatformCopyArgs = {
  brief: Brief;
  approvedCopy: CopyVariant;
  apiKeys: { openai: string; anthropic?: string };
  locale?: Locale;
  brand?: BrandDictionary;
};

export async function generatePlatformCopy(
  args: GeneratePlatformCopyArgs,
): Promise<PlatformCopy> {
  const openai = args.apiKeys.openai.trim();
  const anthropic = args.apiKeys.anthropic?.trim() ?? '';
  if (!openai && !anthropic) {
    throw new AppError('openai/missing-key');
  }
  const locale: Locale = args.locale ?? 'en';

  const system = `${PLATFORM_COPY_SYSTEM_PROMPT}\n\nLanguage note for the visible ad copy (primary_text, headline, description, tweet_text, tone_label): ${languageDirective(
    locale,
  )} The CTA enum identifiers always stay in uppercase English regardless of locale. Hashtag tokens should follow the conventions of the target platform locale (e.g. use English for global brands, even if the rest of the copy is localized).${brandPromptBlock(
    args.brand,
  )}`;

  const user = buildPlatformCopyUserMessage({
    brief: args.brief,
    approvedCopy: args.approvedCopy,
    locale,
  });

  const raw = anthropic
    ? await messagesJson({
        apiKey: anthropic,
        systemPrompt: system,
        userMessage: user,
        toolName: 'submit_platform_copy',
        toolDescription:
          'Submit the platform-adapted ad copy: two variants per platform (A: confident-direct, B: warm-conversational), respecting all character limits and CTA enum constraints.',
        inputSchema: PLATFORM_COPY_SCHEMA as unknown as Record<string, unknown>,
        maxTokens: 2000,
      })
    : await chatCompletionsJson({
        apiKey: openai,
        system,
        user,
        schemaName: 'platform_copy',
        schema: PLATFORM_COPY_SCHEMA as unknown as Record<string, unknown>,
        temperature: 0.6,
        maxTokens: 1800,
      });

  const parsed = PlatformCopyResponseZ.safeParse(raw);
  if (!parsed.success) {
    throw new AppError(
      anthropic ? 'anthropic/bad-response' : 'openai/bad-response',
      `platform copy schema mismatch: ${parsed.error.message}`,
    );
  }

  const metaVariant = (v: z.infer<typeof MetaVariantZ>) => ({
    primaryText: v.primary_text.trim(),
    headline: v.headline.trim(),
    description: v.description.trim(),
    ctaButton: v.cta_button as MetaCta,
    toneLabel: v.tone_label.trim(),
  });
  const xVariant = (v: z.infer<typeof XVariantZ>) => ({
    tweetText: v.tweet_text.trim(),
    ctaButton: v.cta_button as XCta,
    toneLabel: v.tone_label.trim(),
    hashtags: v.hashtags
      .map((h) => h.trim().replace(/^#+/, ''))
      .filter((h) => h.length > 0)
      .slice(0, 3),
  });

  return {
    meta: { variants: [metaVariant(parsed.data.meta_a), metaVariant(parsed.data.meta_b)] },
    x: { variants: [xVariant(parsed.data.x_a), xVariant(parsed.data.x_b)] },
    restrictedCategoryWarning: parsed.data.restricted_category_warning,
  };
}

// ---------------------------------------------------------------------------
// Platform image generation — pairs (A/B) per aspect ratio + carousel
// ---------------------------------------------------------------------------

const ASPECT_DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  '1x1': { width: 1024, height: 1024 },
  '4x5': { width: 768, height: 960 },
  '9x16': { width: 768, height: 1344 },
  '1.91x1': { width: 1216, height: 640 },
};

const FalImageZ = z.object({
  images: z.array(z.object({ url: z.string() })).min(1),
});

async function callFlux(args: {
  prompt: string;
  falKey: string;
  width: number;
  height: number;
}): Promise<string> {
  let res: Response;
  try {
    res = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        Authorization: `Key ${args.falKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: args.prompt,
        image_size: { width: args.width, height: args.height },
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: true,
      }),
    });
  } catch (err) {
    throw new AppError('fal/network', err instanceof Error ? err.message : 'fetch failed');
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    if (res.status === 401) throw new AppError('fal/auth-failed', text.slice(0, 200));
    if (res.status === 402) throw new AppError('fal/no-credits', text.slice(0, 200));
    if (res.status === 403) throw new AppError('fal/forbidden', text.slice(0, 200));
    if (res.status === 429) throw new AppError('fal/rate-limit', text.slice(0, 200));
    throw new AppError('fal/bad-response', `status ${res.status}: ${text.slice(0, 200)}`);
  }
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new AppError('fal/bad-response', 'response was not valid JSON');
  }
  const parsed = FalImageZ.safeParse(body);
  if (!parsed.success) {
    throw new AppError('fal/bad-response', `image schema mismatch: ${parsed.error.message}`);
  }
  return parsed.data.images[0]!.url;
}

// Builds a B-variant prompt by injecting a different framing/energy directive.
// Same scene, different angle — preserves the brief's mood but produces a
// genuinely distinct image for A/B testing.
function deriveBVariantPrompt(basePrompt: string): string {
  const directives = [
    'Alternate framing: shift to a tighter, more intimate composition with the subject filling more of the frame. Slightly warmer lighting, more candid expression.',
    'Same scene, same product, same mood — but rendered as a true alternative take a director would have considered.',
  ];
  return `${basePrompt}\n\n${directives.join(' ')}`;
}

export type GeneratePlatformImagesArgs = {
  approvedImagePrompt: string;
  approvedImageUrl: string; // the approved 4:5 hero — reused as variant A's 4:5
  apiKeys: { fal: string };
  brand?: BrandDictionary;
};

const PLATFORM_ASPECTS: AspectRatio[] = ['1x1', '4x5', '9x16', '1.91x1'];

export async function generatePlatformImagePairs(
  args: GeneratePlatformImagesArgs,
): Promise<PlatformImagePair[]> {
  const fal = args.apiKeys.fal.trim();
  if (!fal) throw new AppError('fal/missing-key');

  // Inject brand visual rules into both A and B prompts so the framing
  // shift still respects the brand-level visual constraints (e.g. "no human
  // faces").
  const visualBlock = brandVisualBlock(args.brand);
  const aPrompt = visualBlock ? `${args.approvedImagePrompt}\n${visualBlock}` : args.approvedImagePrompt;
  const bPrompt = visualBlock
    ? `${deriveBVariantPrompt(args.approvedImagePrompt)}\n${visualBlock}`
    : deriveBVariantPrompt(args.approvedImagePrompt);

  // 4:5 variant A is free (reuses approved hero). All other slots are 1
  // Flux call each. Total: 7 calls in parallel (~5-8s wall-clock).
  type Slot = { aspect: AspectRatio; variant: 'A' | 'B'; prompt: string };
  const slots: Slot[] = [];
  for (const aspect of PLATFORM_ASPECTS) {
    if (aspect === '4x5') {
      // A reuses approved; B is fresh
      slots.push({ aspect, variant: 'B', prompt: bPrompt });
    } else {
      slots.push({ aspect, variant: 'A', prompt: aPrompt });
      slots.push({ aspect, variant: 'B', prompt: bPrompt });
    }
  }

  const tasks = slots.map(async (slot) => {
    const dims = ASPECT_DIMENSIONS[slot.aspect];
    const url = await callFlux({
      prompt: slot.prompt,
      falKey: fal,
      width: dims.width,
      height: dims.height,
    });
    return {
      aspect: slot.aspect,
      variant: slot.variant,
      imageUrl: url,
      width: dims.width,
      height: dims.height,
    };
  });

  const settled = await Promise.allSettled(tasks);

  // Index successes by (aspect, variant) for easy lookup
  const byKey = new Map<string, { aspect: AspectRatio; variant: 'A' | 'B'; imageUrl: string; width: number; height: number }>();
  for (const r of settled) {
    if (r.status === 'fulfilled') {
      byKey.set(`${r.value.aspect}|${r.value.variant}`, r.value);
    }
  }

  // Always include the approved 4:5 hero as variant A
  const fourFive = ASPECT_DIMENSIONS['4x5'];
  byKey.set('4x5|A', {
    aspect: '4x5',
    variant: 'A',
    imageUrl: args.approvedImageUrl,
    width: fourFive.width,
    height: fourFive.height,
  });

  const pairs: PlatformImagePair[] = [];
  for (const aspect of PLATFORM_ASPECTS) {
    const a = byKey.get(`${aspect}|A`);
    const b = byKey.get(`${aspect}|B`);
    if (!a || !b) continue; // partial failure — skip the aspect; UI shows what landed
    const dims = ASPECT_DIMENSIONS[aspect];
    pairs.push({
      aspect,
      variants: [
        { imageUrl: a.imageUrl, width: dims.width, height: dims.height, variantLabel: 'A' as const },
        { imageUrl: b.imageUrl, width: dims.width, height: dims.height, variantLabel: 'B' as const },
      ],
    });
  }

  if (pairs.length === 0) {
    // Everything failed — surface the first AppError if they all match
    const errors = settled
      .filter((r) => r.status === 'rejected')
      .map((r) => (r as PromiseRejectedResult).reason);
    const codes = new Set(
      errors.map((e) => (e instanceof AppError ? e.code : null)).filter((c) => c !== null),
    );
    if (codes.size === 1 && errors[0] instanceof AppError) throw errors[0];
    throw new AppError(
      'image/all-failed',
      errors
        .map((e) => (e instanceof Error ? e.message : String(e)))
        .join(' | ')
        .slice(0, 400),
    );
  }

  return pairs;
}

// ---------------------------------------------------------------------------
// Meta carousel — 3 image cards, 1:1 each, showing the hero scene from
// different framings. Simpler than a full story arc: just 3 distinct
// renders of the same brief at carousel-card size.
// ---------------------------------------------------------------------------

const CAROUSEL_DIRECTIVES = [
  // Card 1: the canonical hero shot — same prompt as approved
  '',
  // Card 2: pulled wider — show more environmental context
  '\n\nFraming variation for card 2 of a Meta carousel: pull the camera back to show more of the environment, more negative space, lifestyle context around the subject. Same product, same mood, wider frame.',
  // Card 3: detail shot — closer to the product itself
  '\n\nFraming variation for card 3 of a Meta carousel: tight macro detail on the product itself, less of the person, hands or close-in interaction with the product. Same mood, same lighting register.',
];

export type GenerateCarouselArgs = {
  approvedImagePrompt: string;
  approvedImageUrl: string; // reused as card 1
  apiKeys: { fal: string };
  brand?: BrandDictionary;
};

export async function generateCarousel(args: GenerateCarouselArgs): Promise<CarouselSet> {
  const fal = args.apiKeys.fal.trim();
  if (!fal) throw new AppError('fal/missing-key');

  const square = ASPECT_DIMENSIONS['1x1'];
  const visualBlock = brandVisualBlock(args.brand);
  const basePrompt = visualBlock
    ? `${args.approvedImagePrompt}\n${visualBlock}`
    : args.approvedImagePrompt;

  // Card 1 reuses the approved hero (re-rendered at 1:1 for carousel consistency).
  // Cards 2 + 3 are framing variations.
  const tasks = CAROUSEL_DIRECTIVES.map((directive, index) => {
    return callFlux({
      prompt: index === 0 ? basePrompt : basePrompt + directive,
      falKey: fal,
      width: square.width,
      height: square.height,
    });
  });

  const settled = await Promise.allSettled(tasks);
  const images: CarouselImage[] = [];
  for (let i = 0; i < settled.length; i++) {
    const r = settled[i]!;
    if (r.status === 'fulfilled') {
      images.push({ imageUrl: r.value, width: square.width, height: square.height, index: i });
    }
  }
  if (images.length === 0) {
    throw new AppError('image/all-failed', 'all carousel cards failed to render');
  }
  return { images };
}
