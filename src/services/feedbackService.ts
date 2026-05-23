// Phase 5 — Feedback Loop.
//
// Takes the effectiveness data + customer profiles + delivery records and
// asks Claude to extract a one-paragraph natural-language summary of what
// worked. That summary becomes a "learned insight" that gets:
//
//   1. Appended to audience.learnedInsights (per-campaign log)
//   2. Appended to brand.learnedInsights (durable, cross-campaign)
//
// brand.learnedInsights is then injected by brandPromptBlock into all 8
// generation paths — so the next generation run carries the lessons.

import { z } from 'zod';
import { messagesJson } from './anthropicClient';
import { AppError } from './errorMessages';
import { languageDirective, type Locale } from '../i18n';
import type {
  Customer,
  DeliveryRecord,
  EffectivenessRecord,
} from '../types';

const INSIGHT_SCHEMA = {
  type: 'object',
  properties: { insight: { type: 'string' } },
  required: ['insight'],
  additionalProperties: false,
} as const;

const InsightZ = z.object({ insight: z.string() });

const SYSTEM_PROMPT = `You extract one actionable insight from a personalized ad-campaign's effectiveness data. The user message gives you, for each customer that received an ad:
  - segment, age bucket, recent interest, signal
  - delivered format (text / image / video / voice)
  - opened / clicked / converted booleans
  - watch time (if video/voice)

Your job: find the pattern across customers that explains WHY some converted and others didn't. Output ONE paragraph (3-4 sentences) that names the winning patterns concretely (e.g. "40代経営者層は短尺の音声ナレーションに反応した。語彙としては『熟成』『投資』といった落ち着いた断定が刺さった。20代の学生・若手は逆に縦動画の方が反応率が高く、エモーショナルな『発見』『挑戦』語彙が刺さった。").

Hard rules:
- Be specific. Name segments + formats + words.
- Don't restate the obvious. ("More people converted than didn't" is not an insight.)
- Don't speculate beyond the data.
- Future generations will use this prompt-side; write so a downstream LLM can apply it.

Return only via the submit_insight tool.`;

export type ExtractInsightArgs = {
  customers: Customer[];
  deliveryLog: DeliveryRecord[];
  effectivenessData: Record<string, EffectivenessRecord>;
  apiKey: string;
  locale: Locale;
};

export async function extractLearnedInsight(args: ExtractInsightArgs): Promise<string> {
  const apiKey = args.apiKey.trim();
  if (!apiKey) throw new AppError('anthropic/missing-key');

  const customerById = new Map(args.customers.map((c) => [c.id, c]));
  const rows: string[] = ['Effectiveness records:'];
  for (const delivery of args.deliveryLog) {
    const c = customerById.get(delivery.customerId);
    const eff = args.effectivenessData[delivery.customerId];
    if (!c || !eff) continue;
    rows.push(
      `  - ${c.id} | segment=${c.segment} | age=${c.age} | interest=${c.recentInterest} | format=${delivery.format} | opened=${eff.opened} | clicked=${eff.clicked} | converted=${eff.converted}${eff.watchTimeSeconds !== null ? ` | watch=${eff.watchTimeSeconds}s` : ''}`,
    );
  }

  const system = `${SYSTEM_PROMPT}\n\nLanguage: ${languageDirective(args.locale)}`;

  const raw = await messagesJson({
    apiKey,
    systemPrompt: system,
    userMessage: rows.join('\n'),
    toolName: 'submit_insight',
    toolDescription: 'Submit the one-paragraph learned insight extracted from the effectiveness data.',
    inputSchema: INSIGHT_SCHEMA as unknown as Record<string, unknown>,
    maxTokens: 600,
  });
  const parsed = InsightZ.safeParse(raw);
  if (!parsed.success) {
    throw new AppError('anthropic/bad-response', `insight schema mismatch: ${parsed.error.message}`);
  }
  return parsed.data.insight.trim();
}
