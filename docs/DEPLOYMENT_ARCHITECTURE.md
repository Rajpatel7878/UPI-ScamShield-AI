# Deployment Architecture — UPI ScamShield AI

**Status:** deployment configuration is committed and verified locally. No public
deployment exists yet; see [Deployment status](#12-deployment-status).

This document describes the production target, every environment variable, the
database migration procedure and the exact manual steps required to go live.

---

## 1. Target architecture

```text
                    HTTPS                        HTTPS (JSON + Bearer JWT)
  Browser  ───────────────────►  Vercel  ───────────────────────────────►  Render
            (React SPA bundle)   Edge     /api/v1/*                        FastAPI + Uvicorn
                                      │                                        │
                                      │                                        ├── managed PostgreSQL
                                      │                                        │   (Render Postgres / Neon)
                                      │                                        │
                                      │                                        └── OpenRouter API (primary)
                                      │                                            → Google Gemini API (fallback)
                                      │                                            (optional, backend-only keys)
                                      └── static assets, SPA fallback
```

| Layer | Provider | Notes |
| --- | --- | --- |
| Frontend | Vercel | Vite build, static output, SPA rewrite, security headers |
| Backend | Render (web service, Python runtime) | Uvicorn, `alembic upgrade head` before start |
| Database | Render managed PostgreSQL or Neon | SQLAlchemy + psycopg 3; SQLite only for local development |
| AI | OpenRouter API (primary), Google Gemini API (fallback) | Optional; called only from the backend; no request is made when neither key is set |

The frontend and backend are separate origins, so CORS is configured explicitly
on the backend through `FRONTEND_URL` (the deployed Vercel domain).

---

## 2. Backend runtime

| Item | Value |
| --- | --- |
| Entry point | `backend/app/main.py` (`app = create_application()`) |
| Start command | `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT --proxy-headers --forwarded-allow-ips="*" --timeout-keep-alive 5` |
| Build command | `pip install --upgrade pip && pip install -r requirements.txt` |
| Health check path | `/api/v1/health` (returns `503` when the database is unreachable) |
| API documentation | `/docs`, `/redoc`, `/api/v1/openapi.json` — controlled by `ENABLE_DOCS` |
| Working directory | `backend/` |

`render.yaml` implements this configuration as a Render Blueprint.

At startup the application:

1. validates `JWT_SECRET_KEY` (production requires at least 32 characters and
   rejects known weak values — it fails fast rather than starting insecurely);
2. verifies, in production, that the Alembic-managed tables `users` and `scans`
   exist, and refuses to start with an actionable error if migrations were not
   applied;
3. in development only, creates missing tables and indexes idempotently.

No code path calls `drop_all()`, truncates tables or resets data. Startup never
deletes existing records.

---

## 3. Environment variables

Secrets are configured in the hosting dashboards and are never committed. Only
`.env.example` templates are tracked.

### Backend (Render)

| Variable | Value in production | Notes |
| --- | --- | --- |
| `ENVIRONMENT` | `production` | Enables HSTS and fail-fast secret checks |
| `DEBUG` | `false` | No debug error surfaces |
| `ENABLE_DOCS` | `true` for the hackathon review | Set `false` to hide `/docs` |
| `LOG_FORMAT` | `json` | Structured one-line JSON logs |
| `LOG_LEVEL` | `INFO` | |
| `DATABASE_URL` | managed PostgreSQL URL | `postgres://` and `postgresql://` are normalised to `postgresql+psycopg://`; include `?sslmode=require` for providers such as Neon |
| `JWT_SECRET_KEY` | generated (32+ chars) | `generateValue: true` in the blueprint; rotate to invalidate all sessions |
| `FRONTEND_URL` | deployed Vercel origin, no trailing slash | Primary CORS allowlist entry |
| `CORS_ORIGINS` | optional comma-separated extras | Wildcards are discarded |
| `OPENROUTER_API_KEY` | optional | Primary AI provider; leave empty to skip OpenRouter |
| `OPENROUTER_BASE_URL` | `https://openrouter.ai/api/v1` | OpenAI-compatible endpoint |
| `OPENROUTER_MODEL` | `google/gemini-3.5-flash` | Model id sent to OpenRouter |
| `OPENROUTER_TIMEOUT_SECONDS` | `30` | Provider call timeout |
| `OPENROUTER_MAX_RETRIES` | `2` | Bounded retries for transient errors |
| `GEMINI_API_KEY` | optional | Fallback provider, used when OpenRouter is unavailable or fails |
| `GEMINI_MODEL` | `gemini-2.5-flash` | |
| `GEMINI_TIMEOUT_SECONDS` | `30` | Provider call timeout |
| `GEMINI_MAX_RETRIES` | `2` | Bounded retries |

Provider order at runtime: OpenRouter (if `OPENROUTER_API_KEY` is set) → Gemini
(if `GEMINI_API_KEY` is set) → rule-based + URL analysis. With neither key set
no external AI request is made.
| `TRUST_PROXY_HEADERS` | `true` on Render | Rate limiting keys on the real client IP |
| `MAX_REQUEST_BYTES` | `1048576` | Requests above 1 MB are rejected with `413` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | |
| `RATE_LIMIT_*` | defaults | In-process sliding windows, per instance |

Generate a secret locally with:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

### Frontend (Vercel)

| Variable | Value | Notes |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `https://<backend-host>/api/v1` | Required. Production builds never fall back to localhost; a missing value logs a console error and API calls fail |

Only `VITE_`-prefixed variables are bundled. Never place `GEMINI_API_KEY`,
`JWT_SECRET_KEY` or `DATABASE_URL` in the frontend environment.

---

## 4. Database migration procedure

The schema is owned by Alembic. There is exactly one initial revision
(`alembic/versions/70e8fa9ea9cc_create_initial_database_tables.py`) that creates
`users`, `scans` and all indexes and the foreign key.

### New production database

```bash
cd backend
export DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
alembic upgrade head          # apply all migrations
alembic current               # confirm the applied revision
```

Render runs `alembic upgrade head` in the start command, so a fresh deploy
migrates automatically before the first request.

### Future schema changes

```bash
cd backend
alembic revision --autogenerate -m "describe the change"
# review the generated file; never add destructive statements
alembic upgrade head
```

### Existing local SQLite database

A development database created by `create_all` has tables but no
`alembic_version` row. Stamp it once instead of re-creating tables:

```bash
cd backend
alembic stamp head
```

### Verification performed

| Check | Result |
| --- | --- |
| `alembic upgrade head` on a fresh SQLite database | Passed |
| `alembic check` (model/migration drift) | `No new upgrade operations detected` |
| `alembic upgrade head --sql` with a `postgresql://` URL | Valid PostgreSQL DDL generated (SERIAL, TIMESTAMP WITH TIME ZONE, BOOLEAN, JSON) |
| Production startup with an unmigrated database | Refused to start with a clear error |
| Production startup with a migrated database | Started; `/api/v1/health` reported `connected` |

A live PostgreSQL server was **not** available in the development environment, so
PostgreSQL was verified at the SQL-dialect and driver-configuration level only.
The first real PostgreSQL deploy must be re-verified (health check, register,
login, analyze, history) before it is presented as live.

---

## 5. Render deployment steps (manual, requires account access)

1. Push the repository to GitHub (branch `main`).
2. Render Dashboard → **New → Blueprint** → connect
   `Rajpatel7878/UPI-ScamShield-AI`. Render reads `render.yaml`.
3. Confirm the web service `upi-scamshield-api` and database
   `upi-scamshield-db`. If Render rejects the free database plan, create a
   PostgreSQL instance on Render or Neon and paste its URL into `DATABASE_URL`.
4. Set the `sync: false` variables:
   - `FRONTEND_URL` — the Vercel URL (add it after step 6, then redeploy);
   - `OPENROUTER_API_KEY` — optional; primary AI provider;
   - `GEMINI_API_KEY` — optional; fallback AI provider. Leave both empty to run
     rule + URL analysis only.
5. Deploy. In the logs confirm, in order:
   - `Running upgrade -> 70e8fa9ea9cc`
   - `Production schema verified (users, scans)`
   - `Uvicorn running on http://0.0.0.0:<port>`
6. Verify from a terminal:

```bash
curl -s https://<backend-host>/api/v1/health
# {"status":"healthy","database":"connected","ai_analysis":"configured|not_configured", ...}
```

7. Open `https://<backend-host>/docs` if `ENABLE_DOCS=true`.

---

## 6. Vercel deployment steps (manual, requires account access)

1. Vercel Dashboard → **Add New → Project** → import the repository.
2. **Root Directory:** `frontend` (required — otherwise Vercel cannot find
   `package.json`). Framework preset: Vite.
3. Build command `npm run build`, output directory `dist` (already in
   `frontend/vercel.json`).
4. Environment variable `VITE_API_BASE_URL = https://<backend-host>/api/v1`
   for Production (and Preview if desired).
5. Deploy, then copy the production domain into the backend's `FRONTEND_URL`
   and redeploy the backend so CORS allows it.
6. Confirm `frontend/vercel.json` rewrites make deep links work, e.g.
   `https://<frontend-host>/history` loads the SPA instead of a 404.

---

## 7. CORS and HTTPS

- `FRONTEND_URL` must exactly match the browser origin (`https://…`, no
  trailing slash, no path). `CORS_ORIGINS` adds staging/preview domains.
- Credentials mode is enabled, but the API uses `Authorization: Bearer`
  headers rather than cookies.
- Vercel and Render both terminate TLS, so the browser only uses HTTPS; there is
  no mixed-content path because `VITE_API_BASE_URL` is an `https://` URL.
- In production the API sends `Strict-Transport-Security`,
  `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy: no-referrer`, `Permissions-Policy` and
  `Cache-Control: no-store` on API responses.

---

## 8. Observability

- Structured JSON logs (`LOG_FORMAT=json`) include one access line per request:
  `METHOD /path -> status (duration ms)`. Request bodies and query strings are
  not logged.
- `/api/v1/health` is the platform health check; it also reports database
  connectivity and which AI providers (OpenRouter, Gemini) are configured.
- Uptime monitors can poll `/api/v1/health` (expect `200`) and receive `503`
  during a database outage.

---

## 9. Rollback and recovery

- **Application:** Render keeps previous deploys; "Rollback" restores the last
  working build.
- **Schema:** Alembic downgrades exist for the initial revision, but production
  downgrades should be avoided. Prefer a forward-fix migration. Back up the
  database (Render/Neon automated backups or `pg_dump`) before schema changes.
- **Sessions:** rotating `JWT_SECRET_KEY` invalidates all issued tokens.
- Never reset production data to "fix" a deployment problem.

---

## 10. Scaling notes and limits

- Rate limiting is in-process and per instance. Running multiple workers or
  instances requires a shared store (for example Redis).
- The default database pool is 5 connections with 5 overflow.
- An AI-assisted analysis is bounded to roughly 35 seconds server-side; the
  client waits 45 seconds for `/detect/analyze`.
- Render's free instances sleep when idle, so the first request after a period
  of inactivity is slow. This is a hosting characteristic, not an application
  timeout.

---

## 11. Local production rehearsal

The full production configuration was rehearsed locally with `ENVIRONMENT=production`,
`DEBUG=false`, `ENABLE_DOCS=false`, a generated 48-character `JWT_SECRET_KEY`, a
migrated SQLite database and a fictional frontend origin. Verified:

- startup log shows `environment=production | debug=False | docs=False`;
- `/api/v1/health` → `200`, `database: connected`, `ai_analysis: not_configured`;
- `/docs` and `/api/v1/openapi.json` → `404` (docs intentionally disabled);
- register `201`, login `200`, `/auth/me` available;
- `POST /api/v1/detect/analyze` → `200`, `Critical`, score `85`,
  `analysis_type: rule_and_url`;
- `GET /api/v1/detect/history` → `200`, one persisted scan;
- CORS returned the configured production origin; HSTS and `nosniff` present;
- startup with an unmigrated database was refused with an actionable error.

---

## 12. Deployment status

| Item | Status |
| --- | --- |
| Deployment configuration (`render.yaml`, `frontend/vercel.json`) | Complete, committed |
| Backend production mode rehearsed locally | Verified |
| Frontend production build | Verified (`npm run build`, 1.1 MB `dist`) |
| Managed PostgreSQL provisioned | **Not provisioned** |
| Backend deployed to Render | **Not deployed** |
| Frontend deployed to Vercel | **Not deployed** |
| Live URLs | **None yet — nothing to publish in the README or submission until verified** |

Deployment requires account authorisation that this environment does not have
(no `VERCEL_TOKEN`, `RENDER_API_KEY`, Vercel CLI or Render CLI are available).
Follow sections 5 and 6, then complete the live verification checklist in
[`submission/SUBMISSION_CHECKLIST.md`](../submission/SUBMISSION_CHECKLIST.md)
before adding any URL to the README or submission documents.
