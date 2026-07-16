// Fallback helpers invoked when a primary provider returns HTTP 402
// (quota exhausted). Routes through OpenRouter using OPENROUTER_API_KEY.
// Each helper converts the request/response to match the original provider's
// format so callers can return the result without any further adaptation.

const OR_BASE = 'https://openrouter.ai/api/v1';
const OR_HEADERS = {
  'Content-Type': 'application/json',
  'HTTP-Referer': 'https://personifyads.online',
  'X-Title': 'Personify Ads',
};

// Fallback model for Anthropic text calls. Uses a cheap OpenAI-family model
// on OpenRouter so Anthropic-credit exhaustion doesn't kill text generation.
const TEXT_FALLBACK_MODEL = 'openai/gpt-4o-mini';

// Fallback model for Fal.AI image calls.
const IMAGE_FALLBACK_MODEL = 'black-forest-labs/flux-schnell';

type AnthropicMessage = { role: string; content: unknown };

function anthropicToOpenAI(
  body: Record<string, unknown>,
  maxTokens: number,
): Record<string, unknown> {
  const messages: AnthropicMessage[] = [];
  if (typeof body.system === 'string' && body.system) {
    messages.push({ role: 'system', content: body.system });
  }
  if (Array.isArray(body.messages)) {
    for (const m of body.messages as AnthropicMessage[]) {
      messages.push({ role: m.role, content: m.content });
    }
  }
  return { model: TEXT_FALLBACK_MODEL, max_tokens: maxTokens, messages };
}

function openAIToAnthropic(
  orBody: Record<string, unknown>,
  originalModel: string,
): Record<string, unknown> {
  const choices = Array.isArray(orBody.choices) ? orBody.choices : [];
  const text =
    (choices[0] as { message?: { content?: string } } | undefined)?.message?.content ?? '';
  return {
    id: orBody.id ?? 'or-fallback',
    type: 'message',
    role: 'assistant',
    model: originalModel,
    content: [{ type: 'text', text }],
    stop_reason: 'end_turn',
    usage: { input_tokens: 0, output_tokens: 0 },
  };
}

/**
 * Drop-in fallback for Anthropic /v1/messages.
 * Converts the Anthropic request to OpenRouter chat/completions format,
 * calls OpenRouter, and returns an Anthropic-shaped response body.
 */
export async function anthropicViaOpenRouter(
  apiKey: string,
  body: Record<string, unknown>,
  originalModel: string,
  maxTokens: number,
): Promise<Record<string, unknown>> {
  const orBody = anthropicToOpenAI(body, maxTokens);
  const res = await fetch(`${OR_BASE}/chat/completions`, {
    method: 'POST',
    headers: { ...OR_HEADERS, Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(orBody),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`openrouter chat ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as Record<string, unknown>;
  return openAIToAnthropic(json, originalModel);
}

/**
 * Drop-in fallback for Fal.AI /fal-ai/flux-*.
 * Calls OpenRouter image generations and returns a Fal-shaped response body.
 */
export async function fluxViaOpenRouter(
  apiKey: string,
  prompt: string,
  width: number,
  height: number,
): Promise<Record<string, unknown>> {
  const res = await fetch(`${OR_BASE}/images/generations`, {
    method: 'POST',
    headers: { ...OR_HEADERS, Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: IMAGE_FALLBACK_MODEL,
      prompt,
      n: 1,
      size: `${width}x${height}`,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`openrouter images ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as { data?: { url?: string }[] };
  const url = json.data?.[0]?.url ?? '';
  return {
    images: [{ url, width, height, content_type: 'image/jpeg' }],
    seed: 0,
    has_nsfw_concepts: [false],
  };
}
