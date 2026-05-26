// Script generation — 2 voice-over scripts in distinct tonal registers
// landing on the same emotional beat as the approved copy and image.
// Ported from packages/web/src/services/llmService.ts.
//
// Routes through /api/anthropic/messages by default (better tonal range
// than 4o-mini), falls back to /api/openai/chat if Anthropic 5xxs.

import { z } from 'zod';
import type {
  Brief,
  CopyVariant,
  ImageVariant,
  ScriptVariant,
} from '@advert/shared';
import { anthropicMessages, openaiChat, BackendError } from './backend';

const SCRIPT_SYSTEM_PROMPT = `You write voiceover scripts for short ad reads. 20–40 seconds each, 50–100 words. Designed for spoken delivery, not silent reading. Punchy openers. Short clauses. Natural breath points. No buzzwords ("revolutionary", "game-changing", "unlock"). No corporate hedging ("perhaps", "consider", "explore").

Each variant lands on the same emotional beat as the approved copy and image — same promise, same urgency, same audience. The variants in one batch should differ in tonal register (e.g. confident-direct vs warm-conversational), not in the underlying claim.

Output format: an object with a "variants" array. Each variant has script (string, 50-100 words), durationEstimate (integer seconds), and toneDescription (short label like "Confident, clipped, military cadence").`;

const VARIANT_SCHEMA = {
  type: 'object',
  properties: {
    script: { type: 'string' },
    durationEstimate: { type: 'number' },
    toneDescription: { type: 'string' },
  },
  required: ['script', 'durationEstimate', 'toneDescription'],
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
      script: z.string(),
      durationEstimate: z.number(),
      toneDescription: z.string(),
    }),
  ),
});

function newId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function userMessage(args: {
  brief: Brief;
  approvedCopy: CopyVariant;
  approvedImage: ImageVariant;
  count: number;
}): string {
  return [
    `Brief: { product: "${args.brief.productName}", audience: "${args.brief.targetAudience}", angle: "${args.brief.adAngle}" }`,
    `Approved copy: { headline: "${args.approvedCopy.headline}", caption: "${args.approvedCopy.caption}", cta: "${args.approvedCopy.cta}" }`,
    `Image: ${args.approvedImage.prompt}`,
    '',
    `Generate ${args.count} distinct script variants. Each should be 50–100 words, designed for spoken delivery, landing on the same emotional beat as the copy and image. The variants must differ in tonal register (e.g. confident-direct vs warm-conversational).`,
  ].join('\n');
}

export type GenerateScriptArgs = {
  brief: Brief;
  approvedCopy: CopyVariant;
  approvedImage: ImageVariant;
  count?: number;
};

function extractAnthropicToolInput(raw: unknown): unknown {
  const body = raw as { content?: Array<{ type?: string; input?: unknown }> } | undefined;
  const toolUse = body?.content?.find((b) => b?.type === 'tool_use');
  if (!toolUse || toolUse.input === undefined) {
    throw new Error('anthropic response missing tool_use block');
  }
  return toolUse.input;
}

export async function generateScript(args: GenerateScriptArgs): Promise<ScriptVariant[]> {
  const count = args.count ?? 2;
  const user = userMessage({ ...args, count });

  let raw: unknown;
  try {
    const body = await anthropicMessages({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      system: SCRIPT_SYSTEM_PROMPT,
      tools: [
        {
          name: 'submit_script_variants',
          description: 'Submit the generated script variants.',
          input_schema: RESPONSE_SCHEMA,
        },
      ],
      tool_choice: { type: 'tool', name: 'submit_script_variants' },
      messages: [{ role: 'user', content: user }],
    });
    raw = extractAnthropicToolInput(body);
  } catch (err) {
    if (
      err instanceof BackendError &&
      (err.code === 'auth/unauthorized' || err.code === 'cost/cap-exceeded')
    ) {
      throw err;
    }
    raw = await openaiFallback(user);
  }

  const parsed = ResponseZ.parse(raw);
  const now = Date.now();
  return parsed.variants.map<ScriptVariant>((v) => ({
    kind: 'script',
    id: newId(),
    script: v.script.trim(),
    durationEstimate: Math.round(v.durationEstimate),
    toneDescription: v.toneDescription.trim(),
    createdAt: now,
  }));
}

async function openaiFallback(user: string): Promise<unknown> {
  const body = await openaiChat<{ choices: Array<{ message: { content: string } }> }>(
    {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SCRIPT_SYSTEM_PROMPT },
        { role: 'user', content: user },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'script_variants', strict: true, schema: RESPONSE_SCHEMA },
      },
      temperature: 0.85,
      max_tokens: 1200,
    },
  );
  return JSON.parse(body.choices[0]?.message?.content ?? '{}');
}
