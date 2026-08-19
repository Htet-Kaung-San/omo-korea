/**
 * What generateOpenRouterChatStream actually sends, and how it fails.
 *
 * This is the ONLY chat function the assistant UI reaches, and it used to
 * assemble its own request rather than reusing buildMessagesPayload. Three
 * differences, none visible from the controller (which mocks this module):
 *
 *   1. No role:"system" message. The instruction was prepended as user text
 *      into the FIRST history turn, so from the second message onward the
 *      model was steered by conversation history alone — the rule about not
 *      presenting general knowledge as official PNU information included.
 *   2. The whole history replayed, uncleaned and uncapped, where the shared
 *      builder keeps the last six turns and strips the reasoning channels
 *      some free models leak.
 *   3. No timeout. A provider that accepted the connection and went quiet
 *      left the request pending forever, so the student watched the typing
 *      dots with no error and no fallback. The non-streaming path has had
 *      per-model timeouts all along.
 */
process.env.OPENROUTER_API_KEY = 'test-key';

const {
  generateOpenRouterChatStream,
} = require('../services/openrouterService');

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
  jest.useRealTimers();
});

/** Captures the request bodies sent to OpenRouter. */
function captureFetch(handler) {
  const calls = [];
  global.fetch = jest.fn(async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body), signal: options.signal });
    return handler(calls.length, options);
  });
  return calls;
}

const okStream = () => ({ ok: true, body: (async function* () {})() });

describe('the streaming request carries the system instruction', () => {
  test('sends a real role:"system" message, not a prefixed user turn', async () => {
    const calls = captureFetch(okStream);

    await generateOpenRouterChatStream('How many hours can I work?', []);

    const { messages } = calls[0].body;
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toMatch(/Hey! PNU Smart Assistant/);
    // The grounding rule has to be in the system turn to apply to every message.
    expect(messages[0].content).toMatch(/do not present it as official PNU information/i);
    // The student's question stays a plain user turn with nothing prepended.
    expect(messages[messages.length - 1]).toEqual({
      role: 'user',
      content: 'How many hours can I work?',
    });
    expect(messages[messages.length - 1].content).not.toMatch(/Smart Assistant/);
  });

  test('the system turn survives a long conversation', async () => {
    const calls = captureFetch(okStream);
    const history = Array.from({ length: 10 }, (_, i) => ({
      question: `q${i}`,
      answer: `a${i}`,
    }));

    await generateOpenRouterChatStream('latest question', history);

    const { messages } = calls[0].body;
    expect(messages[0].role).toBe('system');
    // Capped at the last six turns rather than replaying all ten.
    expect(messages.filter((m) => m.role === 'assistant')).toHaveLength(6);
    expect(messages.some((m) => m.content === 'a0')).toBe(false);
    expect(messages.some((m) => m.content === 'a9')).toBe(true);
  });
});

describe('a model that never responds does not hang the chat', () => {
  test('aborts the attempt and moves to the next model', async () => {
    jest.useFakeTimers();

    const calls = captureFetch((n, options) => {
      // First model accepts the connection and then goes silent.
      if (n === 1) {
        return new Promise((_resolve, reject) => {
          options.signal.addEventListener('abort', () =>
            reject(Object.assign(new Error('aborted'), { name: 'AbortError' })),
          );
        });
      }
      return okStream();
    });

    const pending = generateOpenRouterChatStream('hello', []);
    await jest.advanceTimersByTimeAsync(13_000);
    await expect(pending).resolves.toBeDefined();

    expect(calls).toHaveLength(2);
    expect(calls[0].body.model).not.toBe(calls[1].body.model);
  });

  test('every attempt is sent with an abort signal attached', async () => {
    const calls = captureFetch(okStream);

    await generateOpenRouterChatStream('hello', []);

    expect(calls[0].signal).toBeDefined();
    expect(calls[0].signal.aborted).toBe(false);
  });
});
