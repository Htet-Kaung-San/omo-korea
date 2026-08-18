/**
 * The feedback forms must not claim success for a message they did not save.
 *
 * FeedbackPage and AppSupportPage both used to run `setSent(true)` and drop the
 * text. A student reporting "the visa information on this page is wrong" — the
 * highest-value message an app about official information can receive — saw a
 * green confirmation, and nothing was recorded anywhere.
 *
 * The failure case is the one that matters: if the insert fails (most likely
 * because supabase/feedback.sql has not been applied yet), this endpoint must
 * answer 5xx so the form shows an error. A 200 here would restore the old lie
 * through a new code path.
 */
const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

const mockSupabase = { from: jest.fn() };
jest.mock('../supabaseClient', () => mockSupabase);
jest.mock('../ai/supabaseDataRepository', () => ({
  fetchAllCourses: jest.fn(),
  fetchAllNotices: jest.fn(),
  fetchDashboardCatalogs: jest.fn(),
}));
jest.mock('../services/pnuNoticeScraperService', () => ({ scrapeRecentNotices: jest.fn() }));
jest.mock('../services/noticeSyncService', () => ({ synchronizeNotices: jest.fn() }));

const studentRoutes = require('../routes/studentRoutes');
const { JWT_SECRET } = require('../jwtConfig');

const STUDENT_ID = 202455474;
const token = jwt.sign({ student_id: STUDENT_ID }, JWT_SECRET, { expiresIn: '5m' });

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/students', studentRoutes);
  return app;
}

function mockInsert(result) {
  const insert = jest.fn(() => Promise.resolve(result));
  mockSupabase.from.mockImplementation(() => ({ insert }));
  return insert;
}

const post = (body, auth = true) => {
  const req = request(createApp()).post('/api/students/feedback');
  if (auth) req.set('Authorization', `Bearer ${token}`);
  return req.send(body);
};

beforeEach(() => jest.clearAllMocks());

describe('POST /students/feedback', () => {
  test('stores the report and confirms only then', async () => {
    const insert = mockInsert({ error: null });

    const res = await post({ message: 'The work hour limit on this page is wrong.', kind: 'feedback' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        student_id: STUDENT_ID,
        kind: 'feedback',
        message: 'The work hour limit on this page is wrong.',
      }),
    );
  });

  test('fails loudly when the row could not be written', async () => {
    // What happens today if supabase/feedback.sql has not been applied.
    mockInsert({ error: { message: 'relation "app_feedback" does not exist' } });

    const res = await post({ message: 'Something is broken.', kind: 'app-support' });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    // The student is told it did not send; the cause stays in the server log.
    expect(JSON.stringify(res.body)).not.toContain('app_feedback');
  });

  test('records which form the report came from', async () => {
    const insert = mockInsert({ error: null });

    await post({ message: 'The map will not load.', kind: 'app-support' });

    expect(insert.mock.calls[0][0].kind).toBe('app-support');
  });

  test('an unknown kind falls back rather than writing a value the check constraint rejects', async () => {
    const insert = mockInsert({ error: null });

    await post({ message: 'Hello.', kind: 'not-a-real-kind' });

    expect(insert.mock.calls[0][0].kind).toBe('feedback');
  });

  test('rejects an empty message without touching the database', async () => {
    const insert = mockInsert({ error: null });

    const res = await post({ message: '   ', kind: 'feedback' });

    expect(res.status).toBe(400);
    expect(insert).not.toHaveBeenCalled();
  });

  test('rejects a message past the column-sized limit', async () => {
    const insert = mockInsert({ error: null });

    const res = await post({ message: 'x'.repeat(4001), kind: 'feedback' });

    expect(res.status).toBe(400);
    expect(insert).not.toHaveBeenCalled();
  });

  test('requires a login', async () => {
    const insert = mockInsert({ error: null });

    const res = await post({ message: 'Anonymous note.' }, false);

    expect(res.status).toBe(401);
    expect(insert).not.toHaveBeenCalled();
  });
});
