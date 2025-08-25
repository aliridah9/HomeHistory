# Auth Flow Additions

This project adds a smart entry auth flow and OAuth linking across the web (React + Vite + TS) and API (NestJS + Prisma).

## Backend

- Endpoints
  - POST `/api/auth/lookup` → body `{ email?: string, phone?: string }` → `{ exists, userId?, providers }`
  - GET `/auth/google` and `/auth/google/callback` (no `/api` prefix)
  - GET `/auth/facebook` and `/auth/facebook/callback` (no `/api` prefix)
  - GET `/api/auth/me` (existing) returns current user
  - POST `/api/auth/login`, `/api/auth/register` now set httpOnly cookies

- Cookies
  - `access_token` httpOnly, SameSite=Lax, TTL 15m
  - `refresh_token` httpOnly, SameSite=Lax, TTL 7d
  - JWT is read from cookies first (via `jwt.strategy.ts`).

- OAuth
  - Google + Facebook via Passport strategies with `state: true`.
  - On callback, providers are linked by email. Missing Facebook email → 401 JSON `{ code: 'NO_EMAIL_FROM_FACEBOOK', message: ... }`.
  - On success, server redirects to `FRONTEND_ORIGIN/auth/sso-complete`.

- Prisma
  - `User` extended with optional `phone`, `firstName`, `lastName`, `professionalType`.
  - New `ProviderAccount` with unique `(provider, providerId)` and `email` index.
  - Migration: `20250821_auth_provider_accounts`.

- CORS
  - `CORS_ORIGIN` allowed with `credentials: true`.

## Frontend

- Routes
  - `/auth` → EmailEntry (smart gate)
  - `/auth/login` (prefills email from query)
  - `/auth/register` (existing)
  - `/signup/professional` → Professional Signup
  - `/auth/sso-complete` → calls `/api/auth/me` and routes user

- Networking
  - Axios uses `withCredentials: true` for cookies.

- OAuth Buttons (Login)
  - Google → `${API_BASE_URL}/auth/google`
  - Facebook → `${API_BASE_URL}/auth/facebook`

## Env (server only; not exposed client-side)

- CORS_ORIGIN=http://localhost:5173
- API_BASE_URL=http://localhost:${PORT}
- FRONTEND_ORIGIN=${CORS_ORIGIN}
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL=${API_BASE_URL}/auth/google/callback
- FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, FACEBOOK_CALLBACK_URL=${API_BASE_URL}/auth/facebook/callback

## Run

- From `packages/database`: `pnpm prisma migrate deploy --schema prisma/schema.prisma`
- API: from `apps/api`: `pnpm dev`
- Web: from `apps/web`: `pnpm dev`
