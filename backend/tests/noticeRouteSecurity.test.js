const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

const mockSupabase = { from: jest.fn() };
const mockFetchAllCourses = jest.fn();
const mockFetchAllNotices = jest.fn();
const mockScrapeRecentNotices = jest.fn();
const mockSynchronizeNotices = jest.fn();

jest.mock('../supabaseClient', () => mockSupabase);
jest.mock('../ai/supabaseDataRepository', () => ({
  fetchAllCourses: mockFetchAllCourses,
  fetchAllNotices: mockFetchAllNotices,
  fetchDashboardCatalogs: jest.fn(),
}));
jest.mock('../services/pnuNoticeScraperService', () => ({
  noticeSourceLabel: (source) => ({
    'pnu-main': 'PNU Main Notices',
    onestop: 'PNU Student Support',
    international: 'PNU International',
    cse: 'CSE Department',
    dormitory: 'PNU Dormitory',
  })[source] || source || null,
  scrapeRecentNotices: mockScrapeRecentNotices,
}));
jest.mock('../services/noticeSyncService', () => ({
  synchronizeNotices: mockSynchronizeNotices,
}));

const studentRoutes = require('../routes/studentRoutes');
const { JWT_SECRET } = require('../jwtConfig');

function tokenFor(studentId, options = {}) {
  return jwt.sign({ student_id: studentId }, JWT_SECRET, {
    expiresIn: '5m',
    ...options,
  });
}

function createApp() {
  const app = express();
  app.use('/api/students', studentRoutes);
  return app;
}

function createAdminQuery(isAdmin) {
  const query = {
    select: jest.fn(() => query),
    eq: jest.fn(() => query),
    single: jest.fn(() =>
      Promise.resolve({
        data: { is_admin: isAdmin },
        error: null,
      }),
    ),
  };
  return query;
}

function createLegacyNotificationQuery(rows = []) {
  const query = {
    select: jest.fn(() => query),
    eq: jest.fn(() => query),
    order: jest.fn(() => Promise.resolve({ data: rows, error: null })),
  };
  return query;
}

function createStudentQuery(row) {
  const query = {
    select: jest.fn(() => query),
    eq: jest.fn(() => query),
    single: jest.fn(() => Promise.resolve({ data: row, error: null })),
  };
  return query;
}

function createChecklistQuery(rows = []) {
  const query = {
    select: jest.fn(() => query),
    eq: jest.fn(() => query),
    then(resolve, reject) {
      return Promise.resolve({ data: rows, error: null }).then(resolve, reject);
    },
  };
  return query;
}

describe('notice routes and authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('public GET reads Supabase notices without invoking synchronization', async () => {
    mockFetchAllNotices.mockResolvedValue([{
      id: '1',
      title: 'Live notice',
      body: 'Live body',
      postedDate: '2026-07-24',
      deadline: null,
      languages: ['Korean'],
      category: null,
      priority: null,
      source: 'pnu-main',
      sourceUrl: 'https://example.edu/notice/1',
    }]);

    const response = await request(createApp())
      .get('/api/students/notices')
      .expect(200);

    expect(response.body.data[0]).toMatchObject({
      id: '1',
      kind: 'NOTICE',
      postedDate: '2026-07-24',
      languages: ['Korean'],
      category: null,
      priority: null,
      source: 'PNU Main Notices',
    });
    expect(response.headers['cache-control']).toBe('no-store');
    expect(mockScrapeRecentNotices).not.toHaveBeenCalled();
    expect(mockSynchronizeNotices).not.toHaveBeenCalled();
  });

  test('public GET propagates notice database failures as 5xx', async () => {
    mockFetchAllNotices.mockRejectedValue(
      Object.assign(new Error('notice database unavailable'), {
        statusCode: 502,
      }),
    );

    await request(createApp())
      .get('/api/students/notices')
      .expect(502);
  });

  test('sync rejects an unauthenticated caller', async () => {
    await request(createApp())
      .post('/api/students/notices/sync')
      .expect(401);

    expect(mockSynchronizeNotices).not.toHaveBeenCalled();
  });

  test('sync rejects an authenticated non-admin', async () => {
    mockSupabase.from.mockReturnValue(createAdminQuery(false));

    await request(createApp())
      .post('/api/students/notices/sync')
      .set('Authorization', `Bearer ${tokenFor('student-1')}`)
      .expect(403);

    expect(mockSynchronizeNotices).not.toHaveBeenCalled();
  });

  test('admin can run synchronization', async () => {
    mockSupabase.from.mockReturnValue(createAdminQuery(true));
    mockSynchronizeNotices.mockResolvedValue({
      scraped: [{
        source: 'international',
      }],
      inserted: 1,
      updated: 0,
    });

    const response = await request(createApp())
      .post('/api/students/notices/sync')
      .set('Authorization', `Bearer ${tokenFor('admin-1')}`)
      .expect(200);

    expect(response.body.data).toMatchObject({
      scraped: 1,
      inserted: 1,
      updated: 0,
    });
    expect(mockSynchronizeNotices).toHaveBeenCalledTimes(1);
  });

  test('legacy notification route rejects another student ID', async () => {
    await request(createApp())
      .get('/api/students/notifications/student-2')
      .set('Authorization', `Bearer ${tokenFor('student-1')}`)
      .expect(403);

    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  test('legacy notification route queries only the authenticated student', async () => {
    const notificationQuery = createLegacyNotificationQuery([
      { notification_id: 1, student_id: 'student-1' },
    ]);
    mockSupabase.from.mockReturnValue(notificationQuery);

    const response = await request(createApp())
      .get('/api/students/notifications/student-1')
      .set('Authorization', `Bearer ${tokenFor('student-1')}`)
      .expect(200);

    expect(notificationQuery.eq).toHaveBeenCalledWith(
      'student_id',
      'student-1',
    );
    expect(response.body.data).toHaveLength(1);
  });

  test('personalized route rejects missing, invalid, and expired tokens', async () => {
    await request(createApp())
      .get('/api/students/notifications')
      .expect(401);

    await request(createApp())
      .get('/api/students/notifications')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);

    await request(createApp())
      .get('/api/students/notifications')
      .set(
        'Authorization',
        `Bearer ${tokenFor('student-1', { expiresIn: -1 })}`,
      )
      .expect(401);

    expect(mockSupabase.from).not.toHaveBeenCalled();
    expect(mockFetchAllNotices).not.toHaveBeenCalled();
  });

  test('personalized route uses JWT identity and preserves real engine ranking', async () => {
    const studentQuery = createStudentQuery({
      student_id: 'student-1',
      major_id: 7,
      major: { major_name: 'Computer Science & Engineering' },
      grade: 3,
      interest_tags: ['AI'],
      language_pref: 'Korean',
      nationality: 'Mongolia',
    });
    const checklistQuery = createChecklistQuery();
    mockSupabase.from.mockImplementation((tableName) => {
      if (tableName === 'student') return studentQuery;
      if (tableName === 'checklist_item') return checklistQuery;
      throw new Error(`Unexpected table: ${tableName}`);
    });
    mockFetchAllNotices.mockResolvedValue([
      {
        id: 'lower-score',
        title: 'General production notice',
        body: 'General information',
        postedDate: '2026-07-24',
        deadline: null,
        category: null,
        priority: null,
        targetMajors: [],
        targetNationalities: [],
        minYear: null,
        maxYear: null,
        tags: [],
        languages: [],
        source: null,
        sourceUrl: null,
      },
      {
        id: 'higher-score',
        title: 'AI production notice',
        body: 'AI information',
        postedDate: '2026-07-24',
        deadline: null,
        category: null,
        priority: null,
        targetMajors: [],
        targetNationalities: [],
        minYear: null,
        maxYear: null,
        tags: ['AI'],
        languages: [],
        source: null,
        sourceUrl: null,
      },
    ]);

    const response = await request(createApp())
      .get('/api/students/notifications')
      .query({ student_id: 'student-other' })
      .set('Authorization', `Bearer ${tokenFor('student-1')}`)
      .expect(200);

    expect(studentQuery.eq).toHaveBeenCalledWith('student_id', 'student-1');
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body.data.map((item) => item.id)).toEqual([
      'higher-score',
      'lower-score',
    ]);
    expect(response.body.data[0]).toMatchObject({
      kind: 'NOTICE',
      score: expect.any(Number),
      matchHint: expect.stringContaining('Matches interests: AI'),
    });
    expect(response.body.data[0].score).toBeGreaterThan(
      response.body.data[1].score,
    );
  });
});
