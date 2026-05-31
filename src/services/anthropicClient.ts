// Anthropic Messages API client. Routes through the backend proxy
// (/api/anthropic/messages) which holds the server API key. Uses tool-use to
// coerce structured JSON output. `apiKey` is retained in the args type for
// call-site compatibility but is ignored.

import { AppError } from './errorMessages';
import { backendPost } from './backendClient';

export type MessagesJsonArgs = {
  apiKey?: string;
  systemPrompt: string;
  userMessage: string;
  toolName: string;
  toolDescription: string;
  inputSchema: Record<string, unknown>;
  model?: string;
  maxTokens?: number;
  // When true, send the system prompt as a cached content block
  // (cache_control: ephemeral). The cache breakpoint sits on the system block,
  // so Anthropic caches the stable prefix BEFORE it too — i.e. the tool
  // definitions + system. Callers should therefore put everything that is
  // CONSTANT across a series of calls (instructions, tool schema, brand block,
  // language directive, shared campaign brief) into systemPrompt, and leave
  // only the per-call variable parts in userMessage. No effect on output;
  // billing only differs once the cached prefix exceeds Anthropic's minimum
  // cacheable size (~1024 tokens for Sonnet) — below that it's a silent no-op.
  cacheSystem?: boolean;
};

// Anthropic's `system` field accepts either a plain string or an array of
// content blocks; the array form lets us attach cache_control.
type SystemField =
  | string
  | Array<{ type: 'text'; text: string; cache_control?: { type: 'ephemeral' } }>;

type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: unknown }
  | { type: string };

type AnthropicMessageResponse = {
  content?: ContentBlock[];
  stop_reason?: string;
};

export async function messagesJson(args: MessagesJsonArgs): Promise<unknown> {
  const model = args.model ?? 'claude-sonnet-4-6';
  const maxTokens = args.maxTokens ?? 2000;

  // Cache breakpoint on the system block → caches tools + system (the stable
  // prefix). Plain string when caching is off (unchanged behavior).
  const system: SystemField = args.cacheSystem
    ? [{ type: 'text', text: args.systemPrompt, cache_control: { type: 'ephemeral' } }]
    : args.systemPrompt;

  const body = await backendPost<AnthropicMessageResponse>(
    '/api/anthropic/messages',
    {
      model,
      max_tokens: maxTokens,
      system,
      tools: [
        {
          name: args.toolName,
          description: args.toolDescription,
          input_schema: args.inputSchema,
        },
      ],
      tool_choice: { type: 'tool', name: args.toolName },
      messages: [{ role: 'user', content: args.userMessage }],
    },
    'anthropic',
  );

  const toolUse = body.content?.find(
    (c): c is { type: 'tool_use'; id: string; name: string; input: unknown } => c.type === 'tool_use',
  );
  if (!toolUse) {
    throw new AppError('anthropic/bad-response', 'response did not include a tool_use block');
  }
  return toolUse.input;
}
