const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

const mockListCourseCatalog = jest.fn();
const mockListTimetableEntries = jest.fn();
const mockAddTimetableEntry = jest.fn();
const mockDeleteTimetableEntry = jest.fn();
const mockDeleteTimetableByCourseId = jest.fn();

jest.mock('../supabaseClient', () => ({ from: jest.fn(), rpc: jest.fn() }));
jest.mock('../services/courseCatalogService', () => ({
  listCourseCatalog: mockListCourseCatalog,
}));
jest.mock('../services/timetableService', () => ({
  listTimetableEntries: mockListTimetableEntries,
  addTimetableEntry: mockAddTimetableEntry,
  deleteTimetableEntry: mockDeleteTimetableEntry,
  deleteTimetableByCourseId: mockDeleteTimetableByCourseId,
}));

const studentRoutes = require('../routes/studentRoutes');
const errorHandler = require('../middleware/errorHandler');
const { JWT_SECRET } = require('../jwtConfig');

function app() {
  const instance = express();
  instance.use(express.json());
  instance.use('/api/students', studentRoutes);
  instance.use(errorHandler);
  return instance;
}

function tokenFor(studentId) {
  return jwt.sign({ student_id: studentId }, JWT_SECRET, { expiresIn: '5m' });
}

describe('course catalog and personal timetable endpoints', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns a separately paginated course catalog', async () => {
    mockListCourseCatalog.mockResolvedValue({
      items: [{ id: '6146', nameEn: 'Principles of Accounting' }],
      page: 1,
      pageSize: 50,
      total: 84,
      totalPages: 2,
      hasMore: true,
    });
    const response = await request(app())
      .get('/api/students/course-catalog?page=1&pageSize=50&majorId=73')
      .set('Authorization', `Bearer ${tokenFor(20260001)}`)
      .expect(200);
    expect(response.body.data.total).toBe(84);
    expect(mockListCourseCatalog).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ page: '1', pageSize: '50', majorId: '73' }),
    );
  });

  test('uses authenticated student ownership for timetable writes and deletes', async () => {
    mockAddTimetableEntry.mockResolvedValue({ timetableEntryId: 9, status: 'Planned' });
    mockDeleteTimetableEntry.mockResolvedValue({ timetableEntryId: 9 });
    mockDeleteTimetableByCourseId.mockResolvedValue({ success: true });
    const body = {
      studentId: 99999999,
      courseId: 6146,
      academicYear: 2026,
      semester: '2',
      slots: [{ day: 1, start: '09:00', end: '10:30' }],
    };
    await request(app())
      .post('/api/students/timetable')
      .set('Authorization', `Bearer ${tokenFor(20260001)}`)
      .send(body)
      .expect(201);
    expect(mockAddTimetableEntry).toHaveBeenCalledWith(
      expect.any(Object),
      20260001,
      body,
    );

    await request(app())
      .delete('/api/students/timetable/9')
      .set('Authorization', `Bearer ${tokenFor(20260001)}`)
      .expect(200);
    expect(mockDeleteTimetableEntry).toHaveBeenCalledWith(
      expect.any(Object),
      20260001,
      '9',
    );

    await request(app())
      .delete('/api/students/timetable/course/6146')
      .set('Authorization', `Bearer ${tokenFor(20260001)}`)
      .expect(200);
    expect(mockDeleteTimetableByCourseId).toHaveBeenCalledWith(
      expect.any(Object),
      20260001,
      '6146',
    );
  });
});
