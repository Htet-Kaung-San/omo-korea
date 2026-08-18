/**
 * The password column must never reach a client.
 *
 * The invariant is already stated in studentController ("must never leave the
 * server, even on an authorised self-read") and three handlers honoured it by
 * destructuring the field out. Three others did not:
 *
 *   - getAllStudents            select("*", …)  → admin-only, no caller
 *   - updateLanguagePreference  bare .select()  → runs on EVERY language switch
 *   - requestStudentDeletion    bare .select()  → runs on every delete request
 *
 * A bare .select() expands to "*" in postgrest-js, so all three returned the
 * row verbatim — including the bcrypt hash, or the [SUPABASE_AUTH] marker that
 * reveals which store a given account authenticates against. The two
 * self-service handlers are guarded by authenticateToken only, so this was a
 * routine response body, not an edge case.
 *
 * Nothing in CI covered it: the existing admin test only exercises the 403
 * path, and the frontend types both responses as `unknown` and discards them,
 * so no screen would ever have looked wrong.
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
const BCRYPT_HASH = '$2b$10$abcdefghijklmnopqrstuv';

const tokenFor = (id) => jwt.sign({ student_id: id }, JWT_SECRET, { expiresIn: '5m' });

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/students', studentRoutes);
  return app;
}

function studentRow(overrides = {}) {
  return {
    student_id: STUDENT_ID,
    name: 'Test Student',
    email: 'test@pusan.ac.kr',
    password: BCRYPT_HASH,
    language_pref: 'en',
    nationality: 'Myanmar',
    major_id: 7,
    is_admin: false,
    deletion_requested: false,
    ...overrides,
  };
}

/**
 * requireAdmin re-reads is_admin from the database rather than trusting the
 * token, so the admin route needs two answers from the same mocked table: the
 * is_admin probe first, then the list itself.
 */
function mockAdminThenList(rows) {
  let call = 0;
  mockSupabase.from.mockImplementation(() => {
    call += 1;
    if (call === 1) {
      const probe = {
        select: jest.fn(() => probe),
        eq: jest.fn(() => probe),
        single: jest.fn(() => Promise.resolve({ data: { is_admin: true }, error: null })),
      };
      return probe;
    }
    const list = {
      select: jest.fn(() => list),
      order: jest.fn(() => Promise.resolve({ data: rows, error: null })),
    };
    return list;
  });
}

function mockUpdateReturning(row) {
  const query = {
    update: jest.fn(() => query),
    eq: jest.fn(() => query),
    select: jest.fn(() => query),
    single: jest.fn(() => Promise.resolve({ data: row, error: null })),
  };
  mockSupabase.from.mockImplementation(() => query);
  return query;
}

/** Catches the hash under any key, so a rename cannot slip it past the test. */
function expectNoSecret(payload) {
  const serialized = JSON.stringify(payload);
  expect(serialized).not.toContain(BCRYPT_HASH);
  expect(serialized).not.toContain('SUPABASE_AUTH');
}

beforeEach(() => jest.clearAllMocks());

describe('the password column never reaches a client', () => {
  test('GET / (admin list) strips it from every row', async () => {
    mockAdminThenList([
      studentRow({ student_id: STUDENT_ID, is_admin: true }),
      studentRow({ student_id: 202455393, password: '[SUPABASE_AUTH]' }),
    ]);

    const res = await request(createApp())
      .get('/api/students/')
      .set('Authorization', `Bearer ${tokenFor(STUDENT_ID)}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    res.body.data.forEach((row) => expect(row).not.toHaveProperty('password'));
    expectNoSecret(res.body);
  });

  test('GET / keeps the joined major — the only reason that join exists', async () => {
    // The house strip line elsewhere destructures `major` out too, because
    // those handlers re-flatten major_name. Copying it here would silently
    // empty the admin list's major column.
    mockAdminThenList([
      studentRow({ major: { major_name: 'Artificial Intelligence' } }),
    ]);

    const res = await request(createApp())
      .get('/api/students/')
      .set('Authorization', `Bearer ${tokenFor(STUDENT_ID)}`);

    expect(res.status).toBe(200);
    expect(res.body.data[0].major).toEqual({ major_name: 'Artificial Intelligence' });
  });

  test('PATCH /:id/language strips it — this one runs on every language switch', async () => {
    mockUpdateReturning(studentRow({ language_pref: 'my' }));

    const res = await request(createApp())
      .patch(`/api/students/${STUDENT_ID}/language`)
      .set('Authorization', `Bearer ${tokenFor(STUDENT_ID)}`)
      .send({ language_pref: 'my' });

    expect(res.status).toBe(200);
    expect(res.body.data).not.toHaveProperty('password');
    expect(res.body.data.language_pref).toBe('my');
    expectNoSecret(res.body);
  });

  test('PATCH /:id/request-delete strips it', async () => {
    mockUpdateReturning(studentRow({ deletion_requested: true }));

    const res = await request(createApp())
      .patch(`/api/students/${STUDENT_ID}/request-delete`)
      .set('Authorization', `Bearer ${tokenFor(STUDENT_ID)}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.data).not.toHaveProperty('password');
    expectNoSecret(res.body);
  });
});
