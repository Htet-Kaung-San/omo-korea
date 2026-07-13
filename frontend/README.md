# Hey! PNU UI

Mobile-first React UI for **Hey! PNU**, an international-student companion app for PNU. The backend contract is documented in [`BACKEND.md`](BACKEND.md) and [`../PROJECT_SPEC.md`](../PROJECT_SPEC.md).

## Run Locally

```bash
cd app
npm install
npm run dev
```

Open `http://localhost:5173`.

## Demo Login

Mock mode accepts any 9-digit student ID with the demo password.

| User type | Student ID | Password |
|---|---:|---|
| Non-freshman | `202012345` | `password` |
| Freshman | current year + `12345` (example: `202612345`) | `password` |

Freshman status is year-agnostic: the first 4 digits of `studentId` are treated as admission year.

## Current Features

- Authenticated mobile shell with bottom nav: `Home`, `Academic`, `My`
- Global top pills: `Home`, `Campus Life`, `Career and Opportunities`, `Community`, `Support`
- Floating AI chat panel with backdrop, animation, and predefined FAQ replies
- Home dashboard with graduation progress, important notices, and checklist preview
- Academic page with profile-based progress card, recommended courses, 비교과 programs, and scholarships
- Detail pages for notices, recommended courses, programs, and scholarships
- Campus Life cards for One-Stop guide, library guide, cafeteria info, and campus map
- Campus Map page using Naver Map when configured
- Community cards for country-specific and department-specific notices
- Support cards and drill-in pages for emergency info, part-time work permit, and related laws
- App-wide language switcher for `EN`, `KO`, and `ZH`

## Environment Variables

Create `app/.env` as needed.

```env
# mock is the default
VITE_API_MODE=mock

# Use real backend API
VITE_API_MODE=real
VITE_API_BASE_URL=/api

# Optional: enables Campus Map
VITE_NAVER_MAP_CLIENT_ID=your-naver-map-client-id
```

If `VITE_NAVER_MAP_CLIENT_ID` is missing, the campus map page shows a graceful fallback message.

## Project Structure

```text
src/
  api/           API layer: mock data or real HTTP adapter
  components/    Reusable UI, layout, chat, checklist, graduation, notifications
  context/       Auth and language providers
  data/          Local structured data used until backend endpoints exist
  i18n/          EN/KO/ZH translation dictionaries
  pages/         Route-level screens and detail pages
  types/         Shared TypeScript API contracts
```

## Backend Integration

See [`BACKEND.md`](BACKEND.md) for endpoint details.

The UI switches between mock and real APIs through `VITE_API_MODE`:

- `mock`: uses in-memory/localStorage-backed demo data
- `real`: uses `src/api/real/index.ts` and `VITE_API_BASE_URL`

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |
