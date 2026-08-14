process.env.GEMINI_API_KEY = 'test-key';

jest.mock('../supabaseClient', () => {
  return {
    from() {
      return {
        select() {
          const chain = {
            eq() {
              return chain;
            },
            in() {
              return Promise.resolve({ data: [], error: null });
            },
          };
          return chain;
        },
        upsert() {
          return Promise.resolve({ error: null });
        },
      };
    },
  };
});

const calls = [];
global.fetch = jest.fn(async (url, opts) => {
  calls.push(url);
  const body = JSON.parse(opts.body);
  const prompt = body.contents[0].parts[0].text;
  const list = JSON.parse(prompt.split('Programs to translate:')[1].trim());
  const translations = list.map((item) => ({
    id: item.id,
    title: `EN::${item.title}`,
    category: `CAT::${item.category}`,
    ...(item.description ? { description: `DESC::${item.description}` } : {}),
    ...(item.matchHint ? { matchHint: `HINT::${item.matchHint}` } : {}),
  }));
  return {
    ok: true,
    json: async () => ({
      candidates: [{ content: { parts: [{ text: JSON.stringify({ translations }) }] } }],
    }),
  };
});

const { translatePrograms } = require('../services/geminiService');

const programs = [
  {
    id: '1',
    title: '자기소개서 클리닉',
    category: 'Career',
    description: '<p>1:1 이력서 클리닉.</p>',
    matchHint: '이력서 도움',
  },
  {
    id: '2',
    title: 'AI 해커톤',
    category: 'Hackathon',
    description: '팀과 함께 AI 앱을 만듭니다.',
    matchHint: 'AI 프로젝트',
  },
];

beforeEach(() => {
  calls.length = 0;
});

test('list mode omits descriptions from the AI request and stays fast', async () => {
  const result = await translatePrograms(programs, 'en', { includeDescriptions: false });
  expect(calls.length).toBe(1);
  expect(result.map((p) => p.title)).toEqual(['EN::자기소개서 클리닉', 'EN::AI 해커톤']);
  expect(result[0].category).toBe('CAT::Career');
  expect(result[0].matchHint).toBe('HINT::이력서 도움');
  // Description was not translated by the list path -> falls back to Korean
  expect(result[0].description).toBe('<p>1:1 이력서 클리닉.</p>');
  expect(calls.length).toBe(1);
});

test('warm/detail mode includes descriptions and persists', async () => {
  const result = await translatePrograms(programs, 'en', { includeDescriptions: true });
  expect(calls.length).toBe(1);
  expect(result[0].description).toBe('DESC::<p>1:1 이력서 클리닉.</p>');
  expect(result[1].description).toBe('DESC::팀과 함께 AI 앱을 만듭니다.');
  expect(calls.length).toBe(1);
});

test('warm first, then list request is a pure cache hit (no extra AI call)', async () => {
  await translatePrograms(programs, 'en', { includeDescriptions: true });
  calls.length = 0;

  const result = await translatePrograms(programs, 'en', { includeDescriptions: false });
  expect(calls.length).toBe(0);
  expect(result[0].title).toBe('EN::자기소개서 클리닉');
  expect(result[0].description).toBe('DESC::<p>1:1 이력서 클리닉.</p>');
});

test('concurrent identical list requests dedupe to a single AI call', async () => {
  const fresh = [
    { id: '100', title: '새 프로그램', category: 'Research', description: '설명', matchHint: '' },
    { id: '101', title: '또 다른 프로그램', category: 'Club', description: '설명2', matchHint: '' },
  ];
  const [a, b] = await Promise.all([
    translatePrograms(fresh, 'en', { includeDescriptions: false }),
    translatePrograms(fresh, 'en', { includeDescriptions: false }),
  ]);
  expect(a.map((p) => p.title)).toEqual(b.map((p) => p.title));
  expect(calls.length).toBe(1);
});
