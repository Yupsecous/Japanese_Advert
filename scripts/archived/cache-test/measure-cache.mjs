// Archived re-verification tool for the (reverted) Anthropic prompt-caching
// experiment. See ../../../optimization-notes.md for the full story.
//
// It rebuilds the batch-copy request with cache_control on the system block and
// makes N sequential calls, printing the usage object. Prompt caching is only
// worth re-introducing if `cache_read` goes > 0 on calls 2..N.
//
// Run:  node scripts/archived/cache-test/measure-cache.mjs
//   (reads ANTHROPIC_API_KEY from env, or from packages/backend/.env.local)
//
// Knobs to try when re-evaluating: a newer model, a newer anthropic-version,
// the prompt-caching beta header, and a much larger system prefix (>2000 tok).

import { readFileSync } from 'node:fs';

const MODEL = process.env.MODEL ?? 'claude-sonnet-4-6';
const ANTHROPIC_VERSION = process.env.ANTHROPIC_VERSION ?? '2023-06-01';
const BETA = process.env.BETA === '1' ? 'prompt-caching-2024-07-31' : null;
const CALLS = Number(process.env.CALLS ?? 3);

function key() {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  try {
    const env = readFileSync(new URL('../../../packages/backend/.env.local', import.meta.url), 'utf8');
    const m = env.split(/\r?\n/).find((l) => l.startsWith('ANTHROPIC_API_KEY='));
    if (m) return m.slice('ANTHROPIC_API_KEY='.length);
  } catch {
    /* not found */
  }
  throw new Error('Set ANTHROPIC_API_KEY in env or packages/backend/.env.local');
}

// Mirror of batchGeneratorService.generateCustomerCopy's prompt at the time of
// the experiment (constant content in the cached system, per-customer in user).
const system = `You write one ad-copy variant tuned to ONE specific customer. The campaign brief describes the product. The individual brief specifies the tone and audience-line for THIS customer. Your output is a single variant — not options — because this asset will be delivered to this one recipient only.

Rules:
- Headline: 6-10 words. Lead with what this specific customer cares about based on their interest and social signal.
- Caption: 2-3 sentences in social-feed register. Use the tone specified in the individual brief.
- CTA: 3-5 words, action-led.
- No buzzwords ("unlock", "elevate", "leverage", "synergy", "revolutionary", "game-changing").
- Don't address the customer by name (that's spammy in ad copy). Address by what they're interested in.

Return only via the submit_customer_copy tool.

Language: Write all output in natural English.

Campaign brief (shared across every recipient in this campaign): { product: "Acme", audience: "busy parents", angle: "save time" }`;

const tools = [{
  name: 'submit_customer_copy',
  description: 'Submit one personalized ad copy variant for this specific customer.',
  input_schema: { type: 'object', properties: { headline: { type: 'string' }, caption: { type: 'string' }, cta: { type: 'string' } }, required: ['headline', 'caption', 'cta'], additionalProperties: false },
}];
const user = (n) => `Individual brief: { audience: "runners 25-34", tone: "energetic" }\nCustomer signal: new PR (customer ${n})\n\nWrite the personalized copy for this recipient.`;

const KEY = key();
async function call(n) {
  const headers = { 'x-api-key': KEY, 'anthropic-version': ANTHROPIC_VERSION, 'content-type': 'application/json' };
  if (BETA) headers['anthropic-beta'] = BETA;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 120,
      system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
      tools,
      tool_choice: { type: 'tool', name: 'submit_customer_copy' },
      messages: [{ role: 'user', content: user(n) }],
    }),
  });
  const j = await res.json();
  if (!res.ok) { console.log('ERROR', res.status, JSON.stringify(j).slice(0, 300)); return; }
  const u = j.usage ?? {};
  console.log(`call ${n}: input=${u.input_tokens} cache_creation=${u.cache_creation_input_tokens ?? 0} cache_read=${u.cache_read_input_tokens ?? 0} output=${u.output_tokens}`);
}

console.log(`model=${MODEL} version=${ANTHROPIC_VERSION} beta=${BETA ?? 'none'}`);
for (let i = 1; i <= CALLS; i++) await call(i);
