# UPI ScamShield AI — Technical Architecture

**Stack:** React 19 + Vite 8 + Tailwind CSS 4 · FastAPI + Pydantic 2 · SQLAlchemy
2.1 + Alembic · SQLite (local) / PostgreSQL (production) · optional Google Gemini

---

## 1. Frontend architecture

| Concern | Implementation |
| --- | --- |
| Runtime | React 19 SPA, Vite 8 build (`dist`), Tailwind CSS 4 |
| Routing | React Router 7. Public: `/`, `/awareness`, `/login`, `/register`. Protected: `/dashboard`, `/detect`, `/history`, `/analytics`, `/settings` |
| Code splitting | `React.lazy` + `Suspense` per internal page; landing page eager; Recharts isolated in a lazy chunk |
| Layout | `AppLayout` (sidebar, topbar, mobile drawer, skip link) for app pages; `MainLayout` for auth/404 |
| State | `AuthProvider` context: token in `localStorage`, `/auth/me` bootstrap, `401` → clear session + redirect |
| HTTP | Single Axios instance, `VITE_API_BASE_URL`, 20 s default timeout (45 s for analysis), normalized error messages |
| Errors | API errors surfaced as inline messages; route-level fallback for chunk loading |
| Design | Token-driven dark theme (`design-tokens.css`), accessible focus states, labelled charts, reduced-motion support |
| Config | `frontend/vercel.json`: build command, `dist` output, SPA rewrite, cache + security headers |
| Production guards | Production builds never fall back to `localhost`; a missing `VITE_API_BASE_URL` logs an explicit console error |

Deep links work on Vercel through the catch-all rewrite to `/index.html`, while
hashed assets are served from `/assets/*` with immutable caching.

## 2. Backend architecture

```text
app/main.py            app factory, CORS, exception handlers, lifespan
app/api/
  health.py            GET /, /health, /system/info
  routes/auth.py       register, login, me, logout
  routes/detect.py     analyze, history list/detail, delete history
  routes/dashboard.py  stats, analytics overview
app/core/
  config.py            pydantic-settings configuration
  logging_config.py    text / JSON logging
  security.py          Argon2id + JWT encode/decode/validation
  dependencies.py      bearer auth dependency, DB session dependency
  errors.py            uniform error contract, sanitized validation errors
  middleware.py        body limit, rate limiting, security headers, access logs
app/database/
  connection.py        engine, session factory, URL normalization
  init_db.py           dev create_all / production schema verification
app/services/
  auth_service.py      user creation and credential checks
  detection/           normalizer, rules, scorer, explanations, URL, Gemini, hybrid
```

**Request pipeline:** middleware (size → rate limit) → auth dependency → Pydantic
validation → route logic → detection pipeline → optional AI → persistence →
response. Exceptions are converted to `{status, detail, path}` JSON; validation
details are sanitized so passwords and tokens are never reflected.

**Production start:**

```bash
alembic upgrade head && \
uvicorn app.main:app --host 0.0.0.0 --port $PORT \
  --proxy-headers --forwarded-allow-ips="*" --timeout-keep-alive 5
```

## 3. Database architecture

```text
users(id PK, email UNIQUE, hashed_password, full_name, is_active,
      created_at, updated_at)
   │ 1
   │
   │ N
scans(id PK, user_id FK → users.id ON DELETE SET NULL, content_type,
      content_hash, risk_score, risk_level, category, summary,
      indicators JSON, recommendations JSON, created_at)
```

Indexes: `ix_users_email`, `ix_scans_user_id`,
`ix_scans_user_created_at (user_id, created_at)`, `ix_scans_risk_level`,
`ix_scans_content_type` — matching history filters and analytics ordering.

- **Local:** SQLite file, tables created idempotently at startup.
- **Production:** PostgreSQL via psycopg 3. `postgres://` and `postgresql://`
  URLs are normalized to `postgresql+psycopg://`; `pool_pre_ping` and
  `pool_recycle` handle restarts; pool size 5 with 5 overflow.
- **Migrations:** one initial Alembic revision creates all tables, indexes, the
  unique constraint and the foreign key. `alembic check` reports no drift between
  models and migrations, and `alembic upgrade head --sql` compiles valid
  PostgreSQL DDL.
- **Startup policy:** development creates missing tables; production only
  verifies that `users` and `scans` exist and refuses to boot otherwise. No code
  path performs `drop_all`, truncation or a data reset.
- **Isolation:** every read/update/delete filters on `user_id`; unauthorized scan
  detail returns `404`.

## 4. AI architecture

```text
content ──► prompt builder ──► Gemini (google-genai, backend only)
                                   │
                          JSON response (schema-required)
                                   │
                    strict Pydantic validation (fields, ranges)
                                   │
              completed ────────────┴──────────── unavailable / failed
                  │                                      │
          hybrid merge with rules              rules + URL remain authoritative
```

- The client is created only when `GEMINI_API_KEY` exists; construction performs
  no network call.
- Submitted text is JSON-encoded inside an `<untrusted_message>` block with
  system instructions held separately; the model is told not to follow embedded
  instructions. This reduces, but cannot eliminate, prompt injection.
- Output must contain every field (`is_suspicious`, `risk_level`, `category`,
  `summary`, `indicators`, `recommendations`, `confidence`); risk level and
  severity are allow-listed and confidence must be within 0–1. Malformed output
  is rejected rather than guessed at.
- The call runs in a worker thread with a provider timeout (`GEMINI_TIMEOUT_SECONDS`)
  and a hard ~35 s wall-clock bound; retries are bounded and only for transient
  errors. Failure never fails the request.
- The response always reports `ai_analysis.status` honestly.

## 5. Hybrid detection workflow

```text
1. Normalize text (case, Unicode, spacing, obfuscation)
2. Rule engine → matched rules → weighted score, level, category, explanations
3. Passive URL analysis → per-URL indicators, URL score, redacted URLs
4. base_score = max(rule_score, url_score); level follows the higher source
5. If AI result valid: hybrid = documented 60/40 merge of base and AI score
   Else: base score and level stand
6. Deduplicate recommendations (max 10), add default safety advice if empty
7. Persist metadata only; return score, level, category, indicators, advice
```

Risk bands: Low < 30, Medium < 60, High < 80, Critical ≥ 80. URL-only bands:
Critical ≥ 80, High ≥ 20, Medium ≥ 10.

**URL analysis is passive:** the parser extracts scheme, host, path, query names
and port from submitted text and applies heuristics. No DNS resolution, HTTP
request, redirect follow or page fetch occurs, which prevents SSRF and drive-by
exposure at the cost of not knowing live page content.

## 6. API integration

- Base URL `/api/v1`; the frontend reads it from `VITE_API_BASE_URL` and appends
  `/api/v1` once if omitted.
- Authentication: `Authorization: Bearer <JWT>`; the Axios interceptor attaches
  the stored token and clears the session on `401`.
- Contracts are typed end to end: Pydantic response models on the server,
  defensive mapping in `toResult()` on the client (arrays default to `[]`,
  numbers coerced, unknown fields ignored).
- Error mapping: `401` session expired, `403` access denied, `429` rate limited,
  `5xx` generic server failure, network/timeout messages otherwise.
- Slow AI responses: server bound ~35 s, client timeout 45 s, with a loading
  state and graceful fallback result.

## 7. Deployment architecture

```text
Browser ──HTTPS──► Vercel (React SPA, SPA rewrite, security headers)
                        │
                        │ HTTPS JSON, Bearer JWT, CORS allowlist
                        ▼
                   Render (FastAPI + Uvicorn)
                        ├── alembic upgrade head (before start)
                        ├── managed PostgreSQL (Render Postgres / Neon)
                        └── Google Gemini API (optional)
```

| Variable | Where | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Vercel | Public API base URL baked into the build |
| `ENVIRONMENT`, `DEBUG` | Render | Production safeguards |
| `JWT_SECRET_KEY` | Render (generated) | Token signing, 32+ chars |
| `DATABASE_URL` | Render | Managed PostgreSQL connection |
| `FRONTEND_URL`, `CORS_ORIGINS` | Render | Exact browser origins allowed |
| `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_TIMEOUT_SECONDS`, `GEMINI_MAX_RETRIES` | Render | Optional AI configuration |
| `ENABLE_DOCS`, `LOG_FORMAT`, `LOG_LEVEL`, `TRUST_PROXY_HEADERS` | Render | API docs, structured logs, real client IPs |

Health check `/api/v1/health` returns `200` when the database is reachable and
`503` otherwise. Full runbook: `docs/DEPLOYMENT_ARCHITECTURE.md`.

## 8. Data privacy flow

```text
Browser
  │ 1. message text (in memory)
  ▼
FastAPI ── 2. analysis in memory ──► rules / URL parser
  │                    │
  │                    └── 3. optional: text sent to Gemini (only if key set)
  │
  ├── 4. persisted: content type, score, level, category, summary,
  │      indicators (URL query values redacted), recommendations, timestamp,
  │      owner user_id
  │
  └── 5. NOT persisted / NOT logged: raw message text, OTPs, PINs, query values,
         passwords, tokens, API keys

JWT in localStorage ──► browser only; server stores no session state

User action ── 6. DELETE /detect/history removes that user's scan metadata
```

Privacy properties:

- The raw message is processed for the request and discarded.
- URL query values are replaced with `[redacted]` before storage and display.
- Request logs contain method, path, status and duration only.
- Password hashes and secrets are never returned by any endpoint.
- AI processing is opt-in by configuration and disclosed in the UI.
