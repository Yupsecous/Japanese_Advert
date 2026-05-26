// Translates a director's plain-language image direction into structured
// Flux modifications. Ported from the web's translator.ts (image branch
// only). Calls the OpenAI proxy for structured-output JSON.

import { z } from 'zod';
import type { ImagePromptMods } from '../shared';
import { openaiChat, BackendError } from './backend';

const IMAGE_SYSTEM_PROMPT = `You translate a creative director's plain-language direction into structured image generation modifications. The output drives an image model (Flux / Stable Diffusion class).

Principles:
- Commit. Don't hedge. No clarifying questions.
- Every field must be filled with concrete, specific terminology a photographer or art director would use.
- If a direction doesn't naturally apply to a field (e.g. "make it pop" for "subject"), interpret broadly and commit to a strong read.
- Return only JSON matching the schema.

Output fields:
- lighting: lighting setup, direction, quality, contrast
- composition: framing, angle, crop, motion implied
- palette: color choices, saturation, contrast
- mood: emotional register
- subject: pose, gaze, expression, energy of the human/object
- background: environment, treatment, depth
- energy: "high" | "medium" | "low"
- avoid: negative-prompt terms (things the image model should NOT include)

Example direction: "more cinematic"
{
  "lighting": "golden-hour rim light with low-angle key, soft falloff, subtle lens-flare highlights",
  "composition": "anamorphic wide, off-center framing, shallow depth of field",
  "palette": "teal and orange split, controlled contrast, slight desaturation",
  "mood": "contemplative, weighty, story-implied",
  "subject": "looking off-frame, captured mid-thought, environmental scale",
  "background": "blurred environmental layers, sense of depth, atmospheric haze",
  "energy": "medium",
  "avoid": ["flat lighting", "centered symmetry", "stock-photo composition", "fully sharp focus"]
}`;

const IMAGE_MODS_SCHEMA = {
  type: 'object',
  properties: {
    lighting: { type: 'string' },
    composition: { type: 'string' },
    palette: { type: 'string' },
    mood: { type: 'string' },
    subject: { type: 'string' },
    background: { type: 'string' },
    energy: { type: 'string', enum: ['high', 'medium', 'low'] },
    avoid: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'lighting',
    'composition',
    'palette',
    'mood',
    'subject',
    'background',
    'energy',
    'avoid',
  ],
  additionalProperties: false,
} as const;

const ImagePromptModsZ: z.ZodType<ImagePromptMods> = z.object({
  lighting: z.string(),
  composition: z.string(),
  palette: z.string(),
  mood: z.string(),
  subject: z.string(),
  background: z.string(),
  energy: z.enum(['high', 'medium', 'low']),
  avoid: z.array(z.string()),
});

export async function translateImageDirection(
  direction: string,
): Promise<ImagePromptMods> {
  const trimmed = direction.trim();
  if (!trimmed) throw new BackendError(400, 'translator/empty-direction');

  const body = await openaiChat<{ choices: Array<{ message: { content: string } }> }>(
    {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: IMAGE_SYSTEM_PROMPT },
        { role: 'user', content: `Direction: "${trimmed}"` },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'image_mods',
          strict: true,
          schema: IMAGE_MODS_SCHEMA,
        },
      },
      temperature: 0.4,
      max_tokens: 700,
    },
  );

  const raw = JSON.parse(body.choices[0]?.message?.content ?? '{}');
  return ImagePromptModsZ.parse(raw);
}
