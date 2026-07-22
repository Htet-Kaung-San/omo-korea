# Hey! PNU

Campus app for PNU international students — React frontend + Express API + Supabase.

```
omo-korea/
├── frontend/     # React + Vite + Tailwind
├── backend/      # Express + Supabase
├── README.md
└── .gitignore
```

## Features

- Home dashboard, AI assistant (Sanjini), schedule
- Campus map (Naver Maps) + facility detail
- Cafeteria menus (금정회관 학생 식당 preview on Home)
- Notices scraped from PNU boards with **direct links** to the original posts
- Community (department / country / all) with **Supabase Realtime** feed, author post delete, and seeded posts
- **Part-time work permit guide** (Help & Support) — MOJ-style hours table, 19 languages
- Profile & personal information (major-linked department groups, editable fields)
- Internships & Jobs (JobKorea + AI recommendation hook) with save/bookmark
- Help & Support (FAQ, contacts, emergency, **work permit accordion guide**)
- Profile, academic records, and Saved (jobs + notices)
- 19 UI languages (EN, KO, ZH, MY, JA, TH, VI, …)

## Prerequisites

- Node.js 20+
- A Supabase project
- (Optional) Naver Cloud Platform Maps Client ID for the campus map

## Setup

### 1. Backend

```powershell
cd backend
copy .env.example .env
npm install
```

Fill in `backend/.env`:

| Variable | Notes |
|----------|--------|
| `PORT` | Use `3000` (Vite proxy expects this) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Service role key (server only) |
| `JWT_SECRET` | Long random string |

### 2. Frontend

```powershell
cd frontend
copy .env.example .env
npm install
```

Fill in `frontend/.env`:

| Variable | Notes |
|----------|--------|
| `VITE_API_MODE` | `real` for live API, `mock` for UI-only |
| `VITE_API_BASE_URL` | `/api` (proxied to backend `:3000`) |
| `VITE_NAVER_MAP_CLIENT_ID` | NCP Maps Client ID (public) |
| `VITE_SUPABASE_URL` | Supabase project URL (community Realtime feed) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key (public; RLS applies) |

Never put secrets in `VITE_*` variables.

### 3. Supabase SQL (run in SQL Editor)

Apply these once (safe to re-run where noted):

1. `backend/supabase/map_profile_migration.sql` — facility enrichment + academic tables
2. `backend/supabase/support_contacts.sql` — PNU contacts + FAQ
3. `backend/supabase/community.sql` — community groups + posts
4. `backend/supabase/community_realtime.sql` — Realtime publication + post SELECT RLS
5. `backend/supabase/community_group_dedupe.sql` — migrate legacy `dept-*` groups (one-time)
6. `backend/supabase/notice_source.sql` — notice `source` / `source_url` for scraped boards  
7. `backend/supabase/extracurricular_program_descriptions.sql` — single `description` column for program body  

Optional seed scripts (after migrations):

```powershell
cd backend
npm run seed:map-profile
npm run seed:support
npm run seed:notices
npm run seed:community-posts
```

`seed:community-posts` inserts sample community posts (tag `#hey_pnu_seed`; safe to re-run). Alternative: run `backend/supabase/community_posts_seed.sql` in the SQL Editor.

`seed:notices` scrapes recent posts from:

- International Student Center (`international.pusan.ac.kr`)
- CSE department (`cse.pusan.ac.kr`)

Tapping a notice in the app opens the original board URL when `source_url` is present.

## Run locally

Two terminals:

```powershell
# Terminal 1 — API on http://localhost:3000
cd backend
npm run dev

# Terminal 2 — UI on http://localhost:5173
cd frontend
npm run dev
```

Sign in with your PNU student ID and password.

## Naver Maps (campus map)

1. NCP console → Application → Maps → Dynamic Map enabled
2. Web Service URL: `http://localhost` (**no port**)
3. Put Client ID in `frontend/.env` as `VITE_NAVER_MAP_CLIENT_ID`

## Useful API routes

| Method | Path | Notes |
|--------|------|--------|
| POST | `/api/students/login` | Auth |
| GET | `/api/students/facilities` | Campus map |
| GET | `/api/students/notices` | Notices (may auto-scrape; opens source URLs) |
| POST | `/api/notices/sync` | Force notice scrape sync |
| GET | `/api/students/pnu-contacts` | Support contacts |
| GET | `/api/students/faq` | FAQ |
| GET | `/api/students/community/my-group?scope=` | Community (auth) |
| GET | `/api/students/community/posts` | Community feed (auth) |
| DELETE | `/api/students/community/posts/:postId` | Delete own post (auth) |
| GET | `/api/students/career-opportunities` | Internships |
| GET | `/api/students/career-recommendations` | AI hook |
| GET | `/api/students/emergency-guide` | Emergency |
| GET | `/api/students/academic-records/:id` | Transcript data (auth) |

## Git / secrets

- `.env` files are gitignored — only commit `.env.example`
- Do not commit Supabase keys, JWT secrets, or Naver secrets
- Reference: `part-time work application.md` (source notes for the in-app work permit guide)
