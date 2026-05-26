// Copy generation — same prompt + schema as web, routed through the
// backend's Anthropic proxy. Falls back to OpenAI if Anthropic 5xxs.

import { z } from 'zod';
import type { Brief, CopyVariant } from '@advert/shared';
import { anthropicMessages, openaiChat, BackendError } from './backend';

const COPY_SYSTEM_PROMPT = `You are a senior performance copywriter. You write ad copy that converts. Punchy, direct, specific. No corporate buzzwords. No hedging. No "unlock," "elevate," "leverage," "synergy," "revolutionary," or "game-changing." Lead with the specific outcome, not the abstract benefit.`;

const VARIANT_SCHEMA = {
  type: 'object',
  properties: {
    headline: { type: 'string' },
    caption: { type: 'string' },
    cta: { type: 'string' },
  },
  required: ['headline', 'caption', 'cta'],
  additionalProperties: false,
} as const;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    variants: { type: 'array', items: VARIANT_SCHEMA },
  },
  required: ['variants'],
  additionalProperties: false,
} as const;

const ResponseZ = z.object({
  variants: z.array(
    z.object({
      headline: z.string(),
      caption: z.string(),
      cta: z.string(),
    }),
  ),
});

function userMessage(brief: Brief, count: number): string {
  return [
    `Product: ${brief.productName}`,
    `Target audience: ${brief.targetAudience}`,
    `Ad angle: ${brief.adAngle}`,
    '',
    `Generate ${count} distinct variants of ad copy. Each variant must take a genuinely different angle on the brief — different hook, different emotional register, different structure. Not paraphrases.`,
    '',
    'Each variant returns:',
    '- headline: 6-10 words',
    '- caption: 2-3 sentences, Meta/Instagram register (conversational, hook in the first 5 words)',
    '- cta: 3-5 words, action-led',
  ].join('\n');
}

export async function generateCopy(args: {
  brief: Brief;
  count?: number;
}): Promise<CopyVariant[]> {
  const count = args.count ?? 2;
  const user = userMessage(args.brief, count);

  // Try Anthropic via tool-use first; fall back to OpenAI structured outputs
  // on any backend error other than auth/cap (which propagate).
  let raw: unknown;
  try {
    raw = await anthropicMessages({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: COPY_SYSTEM_PROMPT,
      tools: [
        {
          name: 'submit_copy_variants',
          description: 'Submit the generated copy variants.',
          input_schema: RESPONSE_SCHEMA,
        },
      ],
      tool_choice: { type: 'tool', name: 'submit_copy_variants' },
      messages: [{ role: 'user', content: user }],
    });
    raw = extractAnthropicToolInput(raw);
  } catch (err) {
    if (err instanceof BackendError && (err.code === 'auth/unauthorized' || err.code === 'cost/cap-exceeded')) {
      throw err;
    }
    raw = await openaiFallback(user);
  }

  const parsed = ResponseZ.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`copy schema mismatch: ${parsed.error.message}`);
  }
  const now = Date.now();
  // RN polyfills crypto.randomUUID via expo-crypto; if absent, fall back.
  const uuid = () =>
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return parsed.data.variants.map<CopyVariant>((v) => ({
    kind: 'copy',
    id: uuid(),
    headline: v.headline.trim(),
    caption: v.caption.trim(),
    cta: v.cta.trim(),
    createdAt: now,
  }));
}

function extractAnthropicToolInput(raw: unknown): unknown {
  const body = raw as { content?: Array<{ type?: string; input?: unknown }> } | undefined;
  const toolUse = body?.content?.find((b) => b?.type === 'tool_use');
  if (!toolUse || toolUse.input === undefined) {
    throw new Error('anthropic response missing tool_use block');
  }
  return toolUse.input;
}

async function openaiFallback(user: string): Promise<unknown> {
  const body = await openaiChat<{
    choices: Array<{ message: { content: string } }>;
  }>({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: COPY_SYSTEM_PROMPT },
      { role: 'user', content: user },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'copy_variants',
        strict: true,
        schema: RESPONSE_SCHEMA,
      },
    },
    temperature: 0.85,
  });
  return JSON.parse(body.choices[0]?.message?.content ?? '{}');
}
