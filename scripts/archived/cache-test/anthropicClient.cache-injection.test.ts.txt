import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the backend transport so we can inspect the exact request body that
// messagesJson constructs (the cache-control injection is what we verify).
vi.mock('./backendClient', () => ({ backendPost: vi.fn() }));
import { backendPost } from './backendClient';
import { messagesJson } from './anthropicClient';

const post = vi.mocked(backendPost);

const baseArgs = {
  systemPrompt: 'SYSTEM PREFIX',
  userMessage: 'USER MSG',
  toolName: 'submit_x',
  toolDescription: 'desc',
  inputSchema: { type: 'object', properties: {}, required: [] } as Record<string, unknown>,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lastBody(): any {
  return post.mock.calls[0]![1];
}

beforeEach(() => {
  post.mockReset();
  post.mockResolvedValue({
    content: [{ type: 'tool_use', id: 't1', name: 'submit_x', input: { ok: true } }],
  });
});

describe('messagesJson cache_control injection', () => {
  it('sends system as a cached content block when cacheSystem is true', async () => {
    await messagesJson({ ...baseArgs, cacheSystem: true });
    const body = lastBody();
    expect(body.system).toEqual([
      { type: 'text', text: 'SYSTEM PREFIX', cache_control: { type: 'ephemeral' } },
    ]);
    // Tools precede system in Anthropic's cache hierarchy, so the breakpoint on
    // the system block also caches the tool definition — confirm it's still sent.
    expect(body.tools[0].name).toBe('submit_x');
  });

  it('sends system as a plain string when cacheSystem is omitted (unchanged behavior)', async () => {
    await messagesJson({ ...baseArgs });
    expect(lastBody().system).toBe('SYSTEM PREFIX');
  });

  it('sends system as a plain string when cacheSystem is false', async () => {
    await messagesJson({ ...baseArgs, cacheSystem: false });
    expect(lastBody().system).toBe('SYSTEM PREFIX');
  });

  it('still returns the tool_use input regardless of caching', async () => {
    const out = await messagesJson({ ...baseArgs, cacheSystem: true });
    expect(out).toEqual({ ok: true });
  });
});
