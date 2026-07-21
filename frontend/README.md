# Hey! PNU UI

Mobile-first React UI for **Hey! PNU**, an international-student companion app for PNU.

See the root [`../README.md`](../README.md) for full setup (backend, Supabase SQL, Naver Maps).

## Run locally

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` and sign in with your PNU student ID and password.

## Current features

- Authenticated shell with bottom nav and top pills (Home, Campus Life, Career, Community, Support)
- Home dashboard: notices carousel (direct board links), cafeteria preview, checklist
- Campus map (Naver Maps) + facility detail
- Academic: courses, credits, scholarships, extracurriculars
- Internships & Jobs with bookmark → **Saved** under Profile
- Notices with bookmark → **Saved**; open original PNU board URL when available
- Profile, academic records, language settings (19 locales)
- AI chat (Sanjini)

## Environment variables

Copy `.env.example` → `.env`:

```env
VITE_API_MODE=real
VITE_API_BASE_URL=/api
VITE_NAVER_MAP_CLIENT_ID=your-naver-map-client-id
```

Use `VITE_API_MODE=mock` for UI-only work without the backend.

## Project structure

```text
src/
  api/           Mock or real HTTP adapter
  components/    Layout, home, career, notifications, …
  context/       Auth and language providers
  i18n/          Locale dictionaries (19 languages)
  pages/         Route-level screens
  types/         Shared API contracts
  utils/         Saved jobs/notices, geo, cafeteria helpers
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |
