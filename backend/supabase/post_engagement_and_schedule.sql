-- Adds the columns two shipped API handlers already depend on.
-- Run in Supabase SQL Editor once. Safe to re-run.
--
-- Until this is applied:
--   * POST /api/students/posts/:id/like   always 404s — it selects post.likes_count
--   * POST /api/students/posts/:id/report always 404s — same lookup
--   * POST /api/students/enrollments      never detects timetable clashes, because
--     the conflict check is guarded on course.day_of_week/start_time/end_time and
--     those columns do not exist, so the guard is never true.
--
-- The matching tests in tests/api.test.js are skipped and reference this file.

-- 1. Post engagement -----------------------------------------------------

ALTER TABLE post
  ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reports_count INTEGER NOT NULL DEFAULT 0;

-- 2. Course scheduling ---------------------------------------------------
-- day_of_week uses the same short names the frontend timetable helpers emit
-- ('Mon', 'Tue', …). Times are stored as TIME so the overlap comparison in
-- createEnrollment (start < other_end AND other_start < end) works directly.

ALTER TABLE course
  ADD COLUMN IF NOT EXISTS day_of_week TEXT,
  ADD COLUMN IF NOT EXISTS start_time TIME,
  ADD COLUMN IF NOT EXISTS end_time TIME;

CREATE INDEX IF NOT EXISTS course_schedule_idx
  ON course (day_of_week, start_time);

-- 3. Sample schedule so the conflict path is exercisable ------------------
-- Courses 8 and 9 are the pair the integration suite uses: same day, and
-- overlapping windows, so enrolling in both must be rejected.

UPDATE course SET day_of_week = 'Mon', start_time = '09:30', end_time = '10:45'
  WHERE course_id = 8;

UPDATE course SET day_of_week = 'Mon', start_time = '10:00', end_time = '11:15'
  WHERE course_id = 9;
