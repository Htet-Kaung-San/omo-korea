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
- Community (by department / country / all international)
- Internships & Jobs (JobKorea + AI recommendation hook)
- Help & Support (FAQ, contacts, emergency, work permit)
- Profile + academic records

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

Never put secrets in `VITE_*` variables.

### 3. Supabase SQL (run in SQL Editor)

Apply these once (safe to re-run where noted):

1. `backend/supabase/map_profile_migration.sql` — facility enrichment + academic tables  
2. `backend/supabase/support_contacts.sql` — PNU contacts + FAQ  
3. `backend/supabase/community.sql` — community groups + posts  

Optional seed scripts (after migrations):

```powershell
cd backend
npm run seed:map-profile
npm run seed:support
```

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

Demo login (if seeded): student ID `202600001` / password `password`  
(Or your existing Supabase student account.)

## Naver Maps (campus map)

1. NCP console → Application → Maps → Dynamic Map enabled  
2. Web Service URL: `http://localhost` (**no port**)  
3. Put Client ID in `frontend/.env` as `VITE_NAVER_MAP_CLIENT_ID`

## Useful API routes

| Method | Path | Notes |
|--------|------|--------|
| POST | `/api/students/login` | Auth |
| GET | `/api/students/facilities` | Campus map |
| GET | `/api/students/pnu-contacts` | Support contacts |
| GET | `/api/students/faq` | FAQ |
| GET | `/api/students/community/my-group?scope=` | Community (auth) |
| GET | `/api/students/community/posts` | Community feed (auth) |
| GET | `/api/students/career-opportunities` | Internships |
| GET | `/api/students/career-recommendations` | AI hook |
| GET | `/api/students/emergency-guide` | Emergency |
| GET | `/api/students/academic-records/:id` | Transcript data (auth) |

## Git / secrets

- `.env` files are gitignored — only commit `.env.example`
- Do not commit Supabase keys, JWT secrets, or Naver secrets
- Current integration branch: `integration/map-profile-redesign`
