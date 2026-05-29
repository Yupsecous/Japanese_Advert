import { AppError } from './errorMessages';
import { backendPost } from './backendClient';

// Routes through the backend proxy (/api/openai/chat) which holds the server
// API key. `apiKey` is retained in the args type for call-site compatibility
// but is ignored — the web never sees provider keys.
export type ChatCompletionsJsonArgs = {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  system: string;
  user: string;
  schemaName: string;
  schema: Record<string, unknown>;
};

type ChatResponse = { choices?: { message?: { content?: string } }[] };

export async function chatCompletionsJson(args: ChatCompletionsJsonArgs): Promise<unknown> {
  const model = args.model ?? 'gpt-4o-mini';
  const temperature = args.temperature ?? 0.85;
  const maxTokens = args.maxTokens ?? 1000;

  const body = await backendPost<ChatResponse>(
    '/api/openai/chat',
    {
      model,
      temperature,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: args.system },
        { role: 'user', content: args.user },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: { name: args.schemaName, strict: true, schema: args.schema },
      },
    },
    'openai',
  );

  const content = body.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || content.length === 0) {
    throw new AppError('openai/bad-response', 'response missing message content');
  }
  try {
    return JSON.parse(content);
  } catch {
    throw new AppError('openai/bad-response', 'content was not valid JSON despite strict schema');
  }
}
