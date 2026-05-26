// Generates a single-file React + Tailwind landing-page component for
// the approved campaign. Ported from packages/web/src/services/designService.ts.
// Uses claude-opus-4-7 via the backend Anthropic proxy because the
// output is a full TSX file (~6-8k tokens) and the bigger model writes
// noticeably better layouts.

import { z } from 'zod';
import type {
  Brief,
  CopyVariant,
  DesignVariant,
  ImageVariant,
} from '@advert/shared';
import { anthropicMessages, BackendError } from './backend';

const DESIGN_SYSTEM_PROMPT = `You generate single-file React landing-page components for short-form marketing campaigns. The user provides a brief, the approved ad copy, the approved hero-image URL, and an optional refine direction. You return a self-contained React component.

Hard constraints (failure to follow these breaks the preview):
- ONE functional component, default-named "GeneratedComponent".
- Tailwind v4 utility classes only. No external CSS files, no @apply, no <style> blocks.
- No imports. Treat React as globally available (no "import React from 'react'" line).
- No useEffect for fetching, no window/document globals, no localStorage.
- Self-contained: every value displayed (testimonials, feature blurbs, stats) must be inline literals in the JSX.
- The hero image at the given URL must be used as the main visual (one prominent <img>).
- The approved headline must appear verbatim as the primary H1. The approved CTA text must appear verbatim on the primary button. The caption should appear above-the-fold.
- Accessible: semantic HTML, alt text, ARIA where natural, sufficient color contrast.
- Mobile-first responsive: every section must work at 360px width.
- No lorem ipsum. Invent specific, on-brief supporting content (3 feature blurbs, 2 testimonials with invented names, one stat block).

Design quality bar:
- Editorial typography. Mix one serif and one sans via Tailwind's font-serif / font-sans.
- Restrained palette: 2 neutrals + 1 accent. Pull the accent from the energy of the brief.
- Generous whitespace. Section padding at least py-16 on desktop, py-12 on mobile.
- Visible hierarchy. The H1 must be at least text-4xl on mobile and text-6xl on desktop.

Return only via the submit_landing_page tool. Do not write code outside the tool input.`;

const SCHEMA = {
  type: 'object',
  properties: {
    componentName: { type: 'string' },
    code: { type: 'string' },
    rationale: { type: 'string' },
  },
  required: ['componentName', 'code', 'rationale'],
  additionalProperties: false,
} as const;

const ResponseZ = z.object({
  componentName: z.string(),
  code: z.string(),
  rationale: z.string(),
});

function newId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function extractAnthropicToolInput(raw: unknown): unknown {
  const body = raw as { content?: Array<{ type?: string; input?: unknown }> } | undefined;
  const toolUse = body?.content?.find((b) => b?.type === 'tool_use');
  if (!toolUse || toolUse.input === undefined) {
    throw new Error('anthropic response missing tool_use block');
  }
  return toolUse.input;
}

export type GenerateDesignArgs = {
  brief: Brief;
  approvedCopy: CopyVariant;
  approvedImage: ImageVariant;
  refineDirection?: string;
};

export async function generateDesign(args: GenerateDesignArgs): Promise<DesignVariant> {
  const userLines = [
    `Brief: { product: "${args.brief.productName}", audience: "${args.brief.targetAudience}", angle: "${args.brief.adAngle}" }`,
    `Approved copy: { headline: "${args.approvedCopy.headline}", caption: "${args.approvedCopy.caption}", cta: "${args.approvedCopy.cta}" }`,
    `Hero image URL: ${args.approvedImage.imageUrl}`,
    `Hero image scene: ${args.approvedImage.prompt}`,
  ];
  if (args.refineDirection?.trim()) {
    userLines.push('', `Refine direction: "${args.refineDirection.trim()}"`);
    userLines.push(
      'Apply this direction firmly. Do not preserve choices from a previous version; produce a fresh design that takes the direction seriously.',
    );
  }
  userLines.push('', 'Generate the landing-page component.');

  const body = await anthropicMessages({
    model: 'claude-opus-4-7',
    max_tokens: 8000,
    system: DESIGN_SYSTEM_PROMPT,
    tools: [
      {
        name: 'submit_landing_page',
        description:
          'Submit the generated single-file React landing-page component.',
        input_schema: SCHEMA,
      },
    ],
    tool_choice: { type: 'tool', name: 'submit_landing_page' },
    messages: [{ role: 'user', content: userLines.join('\n') }],
  });
  const raw = extractAnthropicToolInput(body);
  const parsed = ResponseZ.parse(raw);
  return {
    kind: 'design',
    id: newId(),
    componentName: parsed.componentName.trim() || 'GeneratedComponent',
    code: parsed.code,
    rationale: parsed.rationale.trim(),
    createdAt: Date.now(),
  };
}

export { BackendError };
