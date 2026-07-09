# AI Live Data Integration Status

## 1. Overview

The AI recommendation and search layer now uses real Supabase data for several sources while keeping safe fallbacks only where live data is not ready. This gives the dashboard, course recommendations, and intelligent search more current data without forcing low-quality results from incomplete tables.

## 2. Connected Live Data

- `scholarship` table is connected to the dashboard.
- `course` table is connected to the dashboard and course recommendations.
- `enrollment` table is used to exclude completed or already enrolled courses.
- `extracurricular_program` table is connected to the dashboard.
- `notice` table is connected to the dashboard.
- `job_posting` table is prepared through repository and search support, but is not connected to the career dashboard yet.
- Intelligent search now searches `kb_document`, `notice`, `scholarship`, `course`, `major`, and `job_posting`.

## 3. Main Endpoints Affected

- `GET /api/students/dashboard-summary`
- `GET /api/students/course-recommendations`
- `POST /api/search`

## 4. Why `pilotCareers` Still Remains

`pilotCareers` remains in use because the live `job_posting` data is not yet rich enough for the career recommendation engine.

- The `job_posting` table is currently empty.
- The current `job_posting` schema only has `job_id`, `title`, `company`, `type`, and `deadline`.
- `careerRecommendationEngine` needs richer fields such as `academicAreas`, `activities`, `strengths`, `careerAreas`, `learningStyles`, `interests`, and `languages`.
- Switching career recommendations to `job_posting` now could make career recommendations empty or low-quality.

## 5. Testing

Current validation commands:

```bash
node ai/testScholarshipDataAdapter.js
node ai/testScholarshipRepository.js
node ai/testCourseDataAdapter.js
node ai/testCourseRepository.js
node ai/testProgramDataAdapter.js
node ai/testProgramRepository.js
node ai/testNoticeDataAdapter.js
node ai/testNoticeRepository.js
node ai/testJobPostingDataAdapter.js
node ai/testJobPostingRepository.js
node controllers/testAiControllerDashboard.js
node controllers/testAiControllerCourseRecommendations.js
node services/testIntelligentSearchService.js
node controllers/testSearchController.js
```

## 6. Known Limitations / Future Improvements

Future database columns that would improve recommendation and search quality:

- `scholarship`: `source_url`, `eligibility`, `tags`, `last_checked_at`
- `course`: `semester`, `prerequisites`, `tags`, `course_code`
- `extracurricular_program`: `description`, `source_url`, `tags`, `eligibleMajors`, `languages`
- `notice`: `category`, `priority`, `deadline`, `tags`, `targetMajors`, `source_url`
- `job_posting`: `description`, `skills`, `eligibleMajors`, `interests`, `languages`, `location`, `salary`, `source_url`

## 7. Current Safe Status

- All local tests pass.
- No push has been made yet.
- `.env` is still required for real Supabase runtime testing.
