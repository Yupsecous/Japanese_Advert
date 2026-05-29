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
};

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

  const body = await backendPost<AnthropicMessageResponse>(
    '/api/anthropic/messages',
    {
      model,
      max_tokens: maxTokens,
      system: args.systemPrompt,
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
