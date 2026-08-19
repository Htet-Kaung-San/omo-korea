/**
 * What the streaming chat path tells the student about its own answer.
 *
 * /ai/chat-stream is the ONLY path the assistant UI uses, and it answers visa,
 * work-permit and graduation questions. When retrieval returns nothing it still
 * answers — fluently, from a general-purpose model — in a bubble indistinguishable
 * from a sourced one. The backend has always computed `ragUsed`/`ragStatus`;
 * nothing downstream read them, so "grounded in a PNU document" and "invented by
 * a free model" looked identical on screen.
 *
 * These pin the two halves of the fix:
 *   1. the final metadata frame names the documents an answer rested on, and
 *      reports honestly when there were none;
 *   2. the academic context sent to the model no longer derives a student's
 *      intake year by parsing their student id.
 *
 * That second one mattered because signup hashes any non-numeric email local
 * part into [1e9, 2^31). Parsing the first four digits of such an id produced
 * "enrolled March 1830" and a four-figure semester count, which then drove the
 * "recommend courses for their year" instruction. Seeded demo accounts have
 * numeric ids, so it never showed in a demo.
 */
const mockStudentRow = { current: null };

function createQueryChain() {
  const base = {
    select: jest.fn(() => base),
    eq: jest.fn(() => base),
    order: jest.fn(() => base),
    limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
    single: jest.fn(() => Promise.resolve({ data: mockStudentRow.current, error: null })),
    insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
    delete: jest.fn(() => Promise.resolve({ data: null, error: null })),
  };
  return base;
}

const mockSupabase = { from: jest.fn(() => createQueryChain()) };
jest.mock('../supabaseClient', () => mockSupabase);

jest.mock('../services/ragService', () => ({
  retrieveContext: jest.fn(),
  retrieveContextWithSources: jest.fn(),
}));
jest.mock('../services/openrouterService', () => ({
  isOpenRouterConfigured: jest.fn(() => true),
  generateOpenRouterChat: jest.fn(),
  generateOpenRouterChatStream: jest.fn(),
  generateOpenRouterMajorAnalysis: jest.fn(),
}));
jest.mock('../services/geminiService', () => ({
  isGeminiConfigured: jest.fn(() => false),
  generateGeminiChat: jest.fn(),
  generateGeminiChatStream: jest.fn(),
  generateGeminiMajorAnalysis: jest.fn(),
  translateGeminiAnnouncement: jest.fn(),
  translateCafeteriaMenus: jest.fn(),
}));

const ragService = require('../services/ragService');
const openrouterService = require('../services/openrouterService');
const geminiService = require('../services/geminiService');
const aiController = require('../controllers/aiController');

/** Collects the SSE frames the handler writes, so a test can read the metadata. */
function createStreamRes() {
  const frames = [];
  return {
    frames,
    setHeader: jest.fn(),
    write(chunk) {
      const payload = String(chunk).replace(/^data: /, '').trim();
      if (payload && payload !== '[DONE]') {
        try {
          frames.push(JSON.parse(payload));
        } catch {
          /* not a JSON frame */
        }
      }
      return true;
    },
    end: jest.fn(),
    status() {
      return this;
    },
    json() {
      return this;
    },
  };
}

/** An upstream SSE body carrying one token, in OpenRouter's wire format. */
function singleTokenStream(text, finishReason = 'stop') {
  const encoder = new TextEncoder();
  return (async function* () {
    yield encoder.encode(
      `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`,
    );
    yield encoder.encode(
      `data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: finishReason }] })}\n\n`,
    );
  })();
}

/** A Gemini-shaped stream, which uses a different wire format. */
function geminiStream(text) {
  const encoder = new TextEncoder();
  return (async function* () {
    yield encoder.encode(JSON.stringify({ text }));
  })();
}

const metadataOf = (res) => res.frames.find((f) => f.metadata)?.metadata;

beforeEach(() => {
  jest.clearAllMocks();
  mockStudentRow.current = null;
  openrouterService.isOpenRouterConfigured.mockReturnValue(true);
  openrouterService.generateOpenRouterChatStream.mockResolvedValue(
    singleTokenStream('An answer.'),
  );
});

describe('the stream says what its answer rests on', () => {
  test('names the documents when retrieval matched', async () => {
    ragService.retrieveContextWithSources.mockResolvedValue({
      context: 'Work permits require a D-2 visa and one completed semester.',
      sources: [
        { title: 'Part-time Work Permit Guide', category: 'Immigration' },
        { title: 'D-2 Visa Overview', category: 'Immigration' },
      ],
    });

    const res = createStreamRes();
    await aiController.handleChatStream(
      { body: { message: 'Can I work part time?' }, user: {} },
      res,
    );

    const meta = metadataOf(res);
    expect(meta.ragUsed).toBe(true);
    expect(meta.ragStatus).toBe('used');
    expect(meta.ragSources).toEqual([
      'Part-time Work Permit Guide',
      'D-2 Visa Overview',
    ]);
  });

  test('does not cite machine-generated curriculum payloads as a source', async () => {
    // The retrieval query is expanded with the student's major and year, so
    // "Artificial Intelligence - 2nd Year - 1st Semester Recommendations"
    // matches an immigration question as reliably as a course one. Citing it
    // under a visa answer is precisely the false provenance claim this
    // metadata exists to prevent.
    ragService.retrieveContextWithSources.mockResolvedValue({
      context: 'Some curriculum text.',
      sources: [
        { title: 'Artificial Intelligence - 2nd Year - 1st Semester Recommendations', category: 'Curriculum' },
        { title: 'Part-time Work Permit Guide', category: 'Immigration' },
      ],
    });

    const res = createStreamRes();
    await aiController.handleChatStream(
      { body: { message: 'How many hours can I work?' }, user: {} },
      res,
    );

    expect(metadataOf(res).ragSources).toEqual(['Part-time Work Permit Guide']);
  });

  test('a curriculum-only match cites nothing, but still counts as model context', async () => {
    ragService.retrieveContextWithSources.mockResolvedValue({
      context: 'Curriculum payload for this major.',
      sources: [
        { title: 'Artificial Intelligence - 2nd Year - 1st Semester Recommendations', category: 'Curriculum' },
      ],
    });

    const res = createStreamRes();
    await aiController.handleChatStream(
      { body: { message: 'What should I take?' }, user: {} },
      res,
    );

    const meta = metadataOf(res);
    expect(meta.ragSources).toEqual([]);
    // ragUsed stays true on purpose: the curriculum IS the right grounding for
    // a course question, and flipping it false would put "confirm with
    // immigration" under correct course advice.
    expect(meta.ragUsed).toBe(true);
  });

  test('reports honestly when nothing matched — the answer is ungrounded', async () => {
    ragService.retrieveContextWithSources.mockResolvedValue({ context: '', sources: [] });

    const res = createStreamRes();
    await aiController.handleChatStream(
      { body: { message: 'How many hours can I work?' }, user: {} },
      res,
    );

    const meta = metadataOf(res);
    expect(meta.ragUsed).toBe(false);
    expect(meta.ragStatus).toBe('not-used');
    expect(meta.ragSources).toEqual([]);
  });

  test('a retrieval failure is distinguishable from an empty result', async () => {
    ragService.retrieveContextWithSources.mockRejectedValue(new Error('vector lookup failed'));

    const res = createStreamRes();
    await aiController.handleChatStream(
      { body: { message: 'Do I need to report my job?' }, user: {} },
      res,
    );

    const meta = metadataOf(res);
    expect(meta.ragUsed).toBe(false);
    expect(meta.ragStatus).toBe('failed');
  });
});

describe('academic context does not invent an enrolment history', () => {
  const promptSent = () =>
    String(openrouterService.generateOpenRouterChatStream.mock.calls[0][0]);

  beforeEach(() => {
    ragService.retrieveContextWithSources.mockResolvedValue({ context: '', sources: [] });
  });

  test('a hashed student id no longer reads as a 19th-century intake year', async () => {
    // 1830… is what studentIdFromEmail produces for htet_kaung_san@pusan.ac.kr
    // and every other non-numeric school address.
    mockStudentRow.current = {
      student_id: 1830123456,
      student_type: 'Current',
      completed_courses: [],
      intake_term: 'March',
      grade: 2,
      major_id: 7,
      major: { major_id: 7, major_name: 'Artificial Intelligence' },
    };

    const res = createStreamRes();
    await aiController.handleChatStream(
      { body: { message: 'What should I take next semester?' }, user: { student_id: 1830123456 } },
      res,
    );

    const prompt = promptSent();
    expect(prompt).not.toMatch(/Enrolled in \w+ 18\d{2}/);
    expect(prompt).toContain(`Enrolled in March ${new Date().getFullYear() - 1}`);
  });

  test('the recorded grade decides the year the model is told to target', async () => {
    mockStudentRow.current = {
      student_id: 1830123456,
      student_type: 'Current',
      completed_courses: [],
      intake_term: 'March',
      grade: 1,
      major_id: 7,
      major: { major_id: 7, major_name: 'Artificial Intelligence' },
    };

    const res = createStreamRes();
    await aiController.handleChatStream(
      { body: { message: 'Recommend courses' }, user: { student_id: 1830123456 } },
      res,
    );

    // A first-year must not be pushed toward final-year courses, which is what
    // the parsed-id path did: an 1830 intake made every student a 4th year.
    expect(promptSent()).toContain('1st Year');
    expect(promptSent()).not.toContain('4th Year');
  });

  test('a real PNU id outranks a stale recorded grade', async () => {
    // grade is captured once at onboarding and never advances; the id cannot
    // drift. The seeded demo account 202612345 carries grade 3 against a 2026
    // intake, and ProfilePage shows the student "1st Year" from the same id —
    // preferring grade would make the assistant contradict the profile screen.
    mockStudentRow.current = {
      student_id: 202612345,
      student_type: 'Current',
      completed_courses: [],
      intake_term: 'March',
      grade: 3,
      major_id: 7,
      major: { major_id: 7, major_name: 'Artificial Intelligence' },
    };

    const res = createStreamRes();
    await aiController.handleChatStream(
      { body: { message: 'Recommend courses' }, user: { student_id: 202612345 } },
      res,
    );

    expect(promptSent()).toContain('Enrolled in March 2026');
    expect(promptSent()).not.toContain('Enrolled in March 2024');
  });

  test('a hashed id whose digits look like a year is still rejected', async () => {
    // The hash range is [1000000000, 2147483646], so ids beginning 2000-2147
    // pass a year-range test. All of them are 10 digits; a real PNU number is
    // 8-9, which separates the two populations exactly.
    mockStudentRow.current = {
      student_id: 2013456789,
      student_type: 'Current',
      completed_courses: [],
      intake_term: 'March',
      grade: 2,
      major_id: 7,
      major: { major_id: 7, major_name: 'Artificial Intelligence' },
    };

    const res = createStreamRes();
    await aiController.handleChatStream(
      { body: { message: 'Recommend courses' }, user: { student_id: 2013456789 } },
      res,
    );

    expect(promptSent()).not.toContain('Enrolled in March 2013');
    expect(promptSent()).not.toContain('4th Year');
  });

  test('a real numeric PNU id still works when no grade is recorded', async () => {
    mockStudentRow.current = {
      student_id: 202455474,
      student_type: 'Current',
      completed_courses: [],
      intake_term: 'March',
      grade: null,
      major_id: 7,
      major: { major_id: 7, major_name: 'Artificial Intelligence' },
    };

    const res = createStreamRes();
    await aiController.handleChatStream(
      { body: { message: 'Recommend courses' }, user: { student_id: 202455474 } },
      res,
    );

    expect(promptSent()).toContain('Enrolled in March 2024');
  });

  test('an unparseable id with no grade claims no history it cannot back up', async () => {
    mockStudentRow.current = {
      student_id: 1830123456,
      student_type: 'Current',
      completed_courses: [],
      intake_term: 'March',
      grade: 0, // exchange students use 0 — not an academic year
      major_id: 7,
      major: { major_id: 7, major_name: 'Artificial Intelligence' },
    };

    const res = createStreamRes();
    await aiController.handleChatStream(
      { body: { message: 'Recommend courses' }, user: { student_id: 1830123456 } },
      res,
    );

    const prompt = promptSent();
    expect(prompt).not.toMatch(/18\d{2}/);
    expect(prompt).toContain(`Enrolled in March ${new Date().getFullYear()}`);
  });
});

describe('an answer that was cut off is not reported as a whole one', () => {
  beforeEach(() => {
    ragService.retrieveContextWithSources.mockResolvedValue({ context: '', sources: [] });
  });

  test('finish_reason "stop" means complete', async () => {
    openrouterService.generateOpenRouterChatStream.mockResolvedValue(
      singleTokenStream('A finished answer.', 'stop'),
    );

    const res = createStreamRes();
    await aiController.handleChatStream({ body: { message: 'hi' }, user: {} }, res);

    expect(metadataOf(res).complete).toBe(true);
  });

  test('finish_reason "length" means the model hit the token cap mid-answer', async () => {
    // max_tokens is 1000, so a long visa answer really can end here. It used
    // to be logged as the full answer and given the grounded badge.
    openrouterService.generateOpenRouterChatStream.mockResolvedValue(
      singleTokenStream('You do NOT need to report your part-time job if', 'length'),
    );

    const res = createStreamRes();
    await aiController.handleChatStream(
      { body: { message: 'Do I need to report my job?' }, user: {} },
      res,
    );

    const meta = metadataOf(res);
    expect(meta.complete).toBe(false);
    expect(meta.finishReason).toBe('length');
  });
});

describe('the chat survives OpenRouter being down', () => {
  beforeEach(() => {
    ragService.retrieveContextWithSources.mockResolvedValue({ context: '', sources: [] });
  });

  test('falls back to Gemini when every OpenRouter model fails', async () => {
    // The exact demo-day scenario: the key is configured, so the old code took
    // the OpenRouter branch, threw, and never reached Gemini — even though
    // GEMINI_API_KEY was working.
    openrouterService.isOpenRouterConfigured.mockReturnValue(true);
    geminiService.isGeminiConfigured.mockReturnValue(true);
    openrouterService.generateOpenRouterChatStream.mockRejectedValue(
      new Error('All OpenRouter stream models failed. Last error: HTTP 402'),
    );
    geminiService.generateGeminiChatStream.mockResolvedValue(geminiStream('Gemini answered.'));

    const res = createStreamRes();
    await aiController.handleChatStream({ body: { message: 'hello' }, user: {} }, res);

    expect(geminiService.generateGeminiChatStream).toHaveBeenCalled();
    expect(metadataOf(res).provider).toBe('gemini-fallback');
    const text = res.frames.filter((f) => f.text).map((f) => f.text).join('');
    expect(text).toContain('Gemini answered.');
  });

  test('without a Gemini key the OpenRouter error still surfaces', async () => {
    openrouterService.isOpenRouterConfigured.mockReturnValue(true);
    geminiService.isGeminiConfigured.mockReturnValue(false);
    openrouterService.generateOpenRouterChatStream.mockRejectedValue(new Error('HTTP 402'));

    const res = createStreamRes();
    await aiController.handleChatStream({ body: { message: 'hello' }, user: {} }, res);

    // The catch writes an error frame rather than pretending to answer.
    expect(res.frames.some((f) => f.error)).toBe(true);
    expect(geminiService.generateGeminiChatStream).not.toHaveBeenCalled();
  });
});
