# Hey! PNU — UI (React)

Mobile-first React UI for **Hey! PNU**, built against the contracts in [`PROJECT_SPEC.md`](../PROJECT_SPEC.md).

## Run locally

```bash
cd app
npm install
npm run dev
```

Open http://localhost:5173

## Demo login (mock mode)

| Field | Value |
|---|---|
| Student ID | `2020123456` |
| Password | `password` |

## Project structure

```
src/
  api/           API layer — mock (default) or real HTTP
  types/         Shared TypeScript types for backend contract
  context/       Auth state
  components/    Reusable UI
  pages/         Screen-level views
```

## Backend integration

See [`BACKEND.md`](BACKEND.md) for endpoint specs and env setup.

Set `VITE_API_MODE=real` in `.env` when the API is ready.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
