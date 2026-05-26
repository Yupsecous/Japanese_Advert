// Builds a Flux prompt from brief + approved copy (+ optional direction
// mods). Ported from packages/web/src/services/imagePromptBuilder.ts —
// the system prompt keeps the photorealism cues so the AI look is
// minimized at every tier (Schnell, Dev, Pro 1.1).
//
// The Flux prompt is intentionally English-only — diffusion models
// perform measurably worse on non-English prompts. Locale-aware copy
// stays in copy/script/voice paths.

import { z } from 'zod';
import type { Brief, CopyVariant, ImagePromptMods } from '@advert/shared';
import { openaiChat } from './backend';

const BUILDER_SYSTEM_PROMPT = `You construct prompts for Flux marketing image generation. You write in prose, single paragraph, vivid and specific. You never use tag-lists or comma-soup. You describe one image — what the camera sees, what the light does, what the subject is doing.

When direction is provided, you weave the lighting, composition, palette, mood, subject, background, and energy modifications heavily into the prose. The direction is not optional flavor; it is the spine of the image.

When an "avoid" list is provided, you write the prompt so it actively excludes those qualities — not by appending a negative, but by choosing prose that points the image away from them.

End every prompt with one aspect ratio cue: "Portrait 4:5".

PHOTOREALISM REQUIREMENTS (always apply unless the brief explicitly calls for illustration):

The output must read as a real photograph — not an AI render, not an illustration, not a digital painting. Bake these realism cues into every prompt:

- Camera + lens specifics: mention a real-world camera + focal length where natural. Examples: "shot on a Sony A7 with an 85mm f/1.8", "Hasselblad medium-format, 80mm", "Fujifilm X-T5 with a 56mm portrait lens". Pick lens length to match the framing: 35-50mm for environmental, 85-105mm for portrait.
- Skin and texture realism: when the subject is a person, include "visible skin texture, natural pores, no retouching" or "soft natural skin grain". This is the single biggest counter to the plasticky AI look.
- Light realism: describe the light SOURCE specifically, not just its quality. "Late-afternoon window light spilling from camera-left" beats "soft natural light".
- Subtle imperfection: include one realistic imperfection — "a strand of hair out of place", "faint dust on the matte surface", "wrinkles in the linen background", "condensation beading on the glass". Perfect symmetry reads as AI.
- Depth and falloff: name the depth of field. "Shallow depth, f/2 — eyes sharp, background softly out of focus" beats "soft bokeh".
- Anti-AI directives in prose form: "natural color grading, not over-saturated", "no plastic skin, no over-smoothing", "no extra fingers, anatomically correct hands". Weave these as prose at the end of the description.

Now produce a single-paragraph prompt for the brief, copy, and direction in the user message. Return only the JSON object with a "prompt" field.`;

const SCHEMA = {
  type: 'object',
  properties: { prompt: { type: 'string' } },
  required: ['prompt'],
  additionalProperties: false,
} as const;

const ResponseZ = z.object({ prompt: z.string() });

function formatMods(m: ImagePromptMods): string {
  return [
    `- lighting: ${m.lighting}`,
    `- composition: ${m.composition}`,
    `- palette: ${m.palette}`,
    `- mood: ${m.mood}`,
    `- subject: ${m.subject}`,
    `- background: ${m.background}`,
    `- energy: ${m.energy}`,
    `- avoid: ${m.avoid.join(', ')}`,
  ].join('\n');
}

export type BuildImagePromptArgs = {
  brief: Brief;
  approvedCopy: CopyVariant;
  mods?: ImagePromptMods;
};

export async function buildImagePrompt(args: BuildImagePromptArgs): Promise<string> {
  const { brief, approvedCopy, mods } = args;
  const userLines = [
    `Brief: { product: "${brief.productName}", audience: "${brief.targetAudience}", angle: "${brief.adAngle}" }`,
    `Approved copy: { headline: "${approvedCopy.headline}", caption: "${approvedCopy.caption}", cta: "${approvedCopy.cta}" }`,
  ];
  if (mods) {
    userLines.push('Direction:', formatMods(mods));
  } else {
    userLines.push('Direction: (none)');
  }
  userLines.push('', 'Write the Flux prompt.');

  const body = await openaiChat<{ choices: Array<{ message: { content: string } }> }>(
    {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: BUILDER_SYSTEM_PROMPT },
        { role: 'user', content: userLines.join('\n') },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'flux_prompt',
          strict: true,
          schema: SCHEMA,
        },
      },
      temperature: 0.85,
      max_tokens: 600,
    },
  );
  const raw = JSON.parse(body.choices[0]?.message?.content ?? '{}');
  return ResponseZ.parse(raw).prompt.trim();
}
