# Hey! PNU — fullstack monorepo

Local integration branch: `integration/heypnu-fullstack`

```
/
├── frontend/   # React + Vite UI (from ui-frontend)
├── backend/    # Node + Express API (from backend-dev)
├── README.md
└── .gitignore
```

## Prerequisites

- Node.js 20+
- Supabase project credentials for the backend

## Setup

```powershell
# Backend
cd backend
copy .env.example .env
# Fill SUPABASE_URL, SUPABASE_KEY, JWT_SECRET in .env
npm install

# Frontend
cd ..\frontend
copy .env.example .env
npm install
```

## Run locally (two terminals)

```powershell
# Terminal 1 — API on :3000
cd backend
npm run dev

# Terminal 2 — UI on :5173 (proxies /api → :3000)
cd frontend
npm run dev
```

Set `VITE_API_MODE=real` in `frontend/.env` to hit the live API.

## API contract

See `hey_pnu_integration_docs.pdf` (local reference; keep untracked unless the team chooses to version it).

Key routes:

- `GET /api/students/emergency-guide`
- `GET /api/students/campus-facilities`
- `PUT /api/students/profile` (Bearer token)
- `GET /api/students/ai-dashboard` (Bearer token)
- `GET /api/students/notifications` (Bearer token)
