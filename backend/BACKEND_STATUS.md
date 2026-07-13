# Backend Status

Last updated: 2026-07-13

## Stack in use
- Runtime/framework: Node.js + Express 5
- ORM/DB layer: Supabase JS client (`@supabase/supabase-js`) against PostgreSQL
- DB: PostgreSQL on Supabase (`db/schema.sql`, `db/migration.sql`, `db/seed.sql`)
- Auth approach: JWT (`middlewares/auth.js` — `authenticateToken`, `requireAdmin`); student-ID login

## Done
| Feature | Status | Files/routes | Notes |
|---|---|---|---|
| Auth (signup/login/reset) | Done | `POST /api/students/login\|signup\|forgot-password\|reset-password` | bcrypt + JWT |
| Profile | Done | `GET/PATCH /api/students/:student_id`, `PUT /api/students/profile` | major join, language pref |
| Checklist | Done | `GET/PUT /api/students/checklist/...` | settlement tasks seeded on enrollment |
| Scholarships | Done | `GET /api/students/scholarships`, `POST .../apply` | localized fields |
| Boards / community | Done | boards, posts, comments, like, report | |
| Courses / enrollments | Done | `/courses`, `/enrollments` | |
| Search | Done | `GET /api/students/search` | courses, notices, facilities, posts |
| Notices / notifications | Done | `/notices`, `/notifications` | |
| Emergency guide | Done | `GET /api/students/emergency-guide` | `emergencyGuideService.js` (+ visa office / jeonse tip) |
| Campus facilities | Done | `GET /api/students/campus-facilities`, `/facilities` | cafeteria scrape + shuttle metadata |
| Career opportunities | Done | `GET /api/students/career-opportunities` | JobKorea scraper |
| AI assistant | Done | `/api/ai/*`, `/api/students/ai-dashboard` | chat, RAG docs, major gap, course recs |
| Multilingual | Done | `languageMiddleware` + `languageInterceptor` | Accept-Language → `req.language`; `language_pref` stores PDF ISO codes (`en`/`ko`/`zh`/`vi`/…) |
| Admin RBAC | Done | `requireAdmin` on list/delete students | `student.is_admin` |

## In progress
| Feature | Status | Blocker |
|---|---|---|
| Broader i18n coverage | Done | DB `language_pref` expanded to PDF-supported ISO codes via `db/migrations/20260713_expand_language_pref.sql` |

## Not started
- Map / GPS integration (immigration, hospitals, pharmacies, banks as map layer)
- Dedicated housing/lease scam guide product surface (tip now lives on emergency-guide only)
- Smart deadline notification engine
- Extracurricular/club recommendation HTTP route (`ai/programRecommendationEngine.js` exists, unwired)
- Work-permit / legal-info API (needs human/legal review)

## Known issues / tech debt
- `middleware/authMiddleware.js` (`verifyToken`) is unused; live auth is `middlewares/auth.js`
- Local stash `temporary stash before merging partner branch` may still exist — drop manually if obsolete
- `scratch/` scripts are local utilities, not part of the API

## DB schema snapshot
See `db/schema.sql`: `major`, `student`, `course`, `enrollment`, `facility`, `notice`, `post`, checklist tables in migrations. Auth fields include `is_admin`, `language_pref`, `deletion_requested`, `intake_term`.
