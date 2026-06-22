# Backend Integration Guide

This document is for the **backend team** wiring the Hey! PNU API to the React UI.

## Quick start

1. Implement the endpoints below (see also [`../PROJECT_SPEC.md`](../PROJECT_SPEC.md)).
2. Run your API on `http://localhost:3000` (or update the Vite proxy in `vite.config.ts`).
3. In `app/.env`:

   ```env
   VITE_API_MODE=real
   VITE_API_BASE_URL=/api
   ```

4. Start the UI: `npm run dev` — requests to `/api/*` are proxied to your server.

## Architecture

```
src/
  types/api.ts       ← Shared TypeScript contracts (source of truth for shapes)
  api/
    index.ts         ← Exports `api` — switches mock vs real via env
    client.ts        ← HTTP client + Bearer token from localStorage
    mock/            ← In-memory demo (default)
    real/            ← HTTP adapter — maps 1:1 to your REST routes
```

**To connect the backend:** implement routes in `src/api/real/index.ts` to match your server, or update paths there if your API uses a different prefix.

## Authentication

- Login returns `{ token, user }`.
- UI stores `token` in `localStorage` key `hey_pnu_token`.
- All authenticated requests send: `Authorization: Bearer <token>`.
- `401` clears session and redirects to login (add handling in client if needed).

### `POST /auth/login`

**Request**

```json
{ "studentId": "2020123456", "password": "password" }
```

**Response `200`**

```json
{
  "token": "jwt-string",
  "user": {
    "studentId": "2020123456",
    "name": "Minh Nguyen",
    "nationality": "Vietnam",
    "major": "Computer Science & Engineering",
    "interests": ["AI", "Data Science"]
  }
}
```

**Response `401`**

```json
{ "message": "Invalid student ID or password." }
```

### `POST /auth/logout` (optional)

No body. Return `204`.

### `GET /users/me`

Returns the same `user` object as login.

## Profile

### `PATCH /users/me`

**Request**

```json
{
  "name": "Minh Nguyen",
  "nationality": "Vietnam",
  "major": "Computer Science & Engineering",
  "interests": ["AI", "Data Science", "Korean Language"]
}
```

**Response `200`:** updated `user` object.

## Courses

### `GET /courses/recommended`

Optional query: `?type=REQUIRED|ELECTIVE|GEN_ED`

**Response `200`**

```json
[
  {
    "id": "c1",
    "nameKo": "컴퓨터공학개론",
    "nameEn": "Introduction to Computer Science",
    "type": "REQUIRED",
    "credits": 3,
    "department": "Computer Science & Engineering",
    "tags": ["AI", "Data Science"],
    "score": 15,
    "matchHint": "Matches your major"
  }
]
```

Backend may compute `score` and `matchHint`, or return unscored courses and let the UI sort (currently UI expects scored list from API).

## Graduation

### `GET /graduation/progress`

```json
{
  "totalRequired": 130,
  "totalCompleted": 87,
  "breakdown": {
    "required": { "completed": 45, "required": 60 },
    "elective": { "completed": 27, "required": 40 },
    "genEd": { "completed": 15, "required": 30 }
  }
}
```

## Notifications

### `GET /notifications`

```json
[
  {
    "id": "n1",
    "title": "Fall 2026 Course Registration",
    "body": "Registration opens Aug 10…",
    "date": "2026-08-10",
    "category": "REGISTRATION",
    "priority": "HIGH"
  }
]
```

Sort by date ascending recommended.

## Checklist

### `GET /checklist`

```json
[
  {
    "id": "cl1",
    "title": "Alien registration",
    "description": "Apply for your 외국인등록증…",
    "completed": false
  }
]
```

### `PATCH /checklist/:itemId`

**Request**

```json
{ "completed": true }
```

**Response `200`:** updated checklist item.

## Chat (predefined FAQ)

### `POST /chat/message`

**Request**

```json
{ "message": "When is course registration?" }
```

**Response `200`**

```json
{
  "reply": "Course registration for Fall 2026 is Aug 10–14…",
  "intentId": "registration"
}
```

Use keyword/intent matching server-side. Fallback when no match:

```json
{
  "reply": "I don't have an answer for that. Contact the International Student Office at iso@pnu.ac.kr or visit Building 123."
}
```

### `GET /chat/suggestions` (optional)

```json
["Course registration", "Graduation credits", "Dorm housing"]
```

## Type reference

All TypeScript interfaces live in [`src/types/api.ts`](src/types/api.ts). The `HeyPnuApi` interface lists every method the UI calls.

## Mock mode (default)

```env
VITE_API_MODE=mock
```

Demo login:

- **Student ID:** `2020123456`
- **Password:** `password`

Mock data is in `src/api/mock/data.ts` — useful as sample payloads for seed scripts.

## CORS (production)

If the UI and API are on different origins, enable CORS on the API for the UI origin and allow header `Authorization`.

## Checklist for backend handoff

- [ ] All endpoints return shapes matching `src/types/api.ts`
- [ ] Error responses use `{ "message": "…" }` for user-facing text
- [ ] JWT validation on protected routes
- [ ] Only enrolled international students can authenticate
- [ ] Share base URL and any auth test accounts with the UI team
