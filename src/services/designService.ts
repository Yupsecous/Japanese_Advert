import { z } from 'zod';
import { messagesJson } from './anthropicClient';
import { AppError } from './errorMessages';
import { languageDirective, type Locale } from '../i18n';
import type { Brief, CopyVariant, DesignVariant, ImageVariant } from '../types';

export type GenerateDesignArgs = {
  apiKey: string;
  brief: Brief;
  approvedCopy: CopyVariant;
  approvedImage: ImageVariant;
  refineDirection?: string;
  count?: number;
  locale?: Locale;
};

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
- Aspect ratio for hero image: object-cover with a max height; never stretch.

Design quality bar:
- Editorial typography. Mix one serif and one sans via Tailwind's font-serif / font-sans.
- Restrained palette: 2 neutrals + 1 accent. Pull the accent from the energy of the brief.
- Generous whitespace. Section padding at least py-16 on desktop, py-12 on mobile.
- Visible hierarchy. The H1 must be at least text-4xl on mobile and text-6xl on desktop.

Return only via the submit_landing_page tool. Do not write code outside the tool input.`;

const DESIGN_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    componentName: {
      type: 'string',
      description: 'Always "GeneratedComponent". Used as the default export name.',
    },
    code: {
      type: 'string',
      description:
        'Full TSX source for one functional component named GeneratedComponent. No imports, Tailwind v4 classes only, self-contained.',
    },
    rationale: {
      type: 'string',
      description:
        'One or two sentences explaining the key design choices (palette, hierarchy, hero treatment).',
    },
  },
  required: ['componentName', 'code', 'rationale'],
  additionalProperties: false,
} as const;

const DesignResponseZ = z.object({
  componentName: z.string(),
  code: z.string(),
  rationale: z.string(),
});

function buildUserMessage(args: GenerateDesignArgs): string {
  const lines = [
    `Brief: { product: "${args.brief.productName}", audience: "${args.brief.targetAudience}", angle: "${args.brief.adAngle}" }`,
    `Approved copy: { headline: "${args.approvedCopy.headline}", caption: "${args.approvedCopy.caption}", cta: "${args.approvedCopy.cta}" }`,
    `Hero image URL: ${args.approvedImage.imageUrl}`,
    `Hero image scene: ${args.approvedImage.prompt}`,
  ];
  const direction = args.refineDirection?.trim();
  if (direction) {
    lines.push('', `Refine direction: "${direction}"`);
    lines.push(
      'Apply this direction firmly. Do not preserve choices from a previous version; produce a fresh design that takes the direction seriously.',
    );
  }
  lines.push('', 'Generate the landing-page component.');
  return lines.join('\n');
}

export async function generateDesign(args: GenerateDesignArgs): Promise<DesignVariant[]> {
  const apiKey = args.apiKey.trim();
  if (!apiKey) {
    throw new AppError('anthropic/missing-key');
  }
  const locale: Locale = args.locale ?? 'en';
  const count = args.count ?? 1;

  const system = `${DESIGN_SYSTEM_PROMPT}\n\nLanguage note for any visible copy you invent (testimonials, feature blurbs, micro-headers): ${languageDirective(
    locale,
  )} The headline, caption, and CTA passed in the user message must be used verbatim regardless of language.`;

  const tasks = Array.from({ length: count }).map(async (): Promise<DesignVariant> => {
    const raw = await messagesJson({
      apiKey,
      systemPrompt: system,
      userMessage: buildUserMessage(args),
      toolName: 'submit_landing_page',
      toolDescription:
        'Submit the generated single-file React landing-page component as structured output.',
      inputSchema: DESIGN_RESPONSE_SCHEMA as unknown as Record<string, unknown>,
      model: 'claude-opus-4-7',
      maxTokens: 8000,
    });
    const parsed = DesignResponseZ.parse(raw);
    return {
      kind: 'design',
      id: crypto.randomUUID(),
      componentName: parsed.componentName.trim() || 'GeneratedComponent',
      code: parsed.code,
      rationale: parsed.rationale.trim(),
      createdAt: Date.now(),
    };
  });

  return Promise.all(tasks);
}
