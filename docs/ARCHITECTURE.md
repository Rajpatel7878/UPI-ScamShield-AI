# System Architecture — UPI ScamShield AI

This document describes the application as it exists today: the React SPA, the
FastAPI service, the SQLAlchemy data layer and the detection pipeline.
Production hosting, environment variables and the migration runbook are in
[`DEPLOYMENT_ARCHITECTURE.md`](DEPLOYMENT_ARCHITECTURE.md).

---

## 1. Component overview

```text
┌──────────────────────────────┐
│ Browser                      │
│ React 19 SPA (Vite, /:5173)  │
│  • landing / marketing       │
│  • auth, dashboard, detect   │
│  • history, analytics        │
│  • awareness center          │
└──────────────┬───────────────┘
               │ HTTPS JSON, Authorization: Bearer <JWT>
               ▼
┌──────────────────────────────┐
│ FastAPI (/api/v1)            │
│  middleware: body limit,     │
│  rate limit, security        │
│  headers                     │
│  auth: JWT + Argon2          │
│  routes: auth, detect,       │
│  history, dashboard, health  │
└──────┬───────────────┬───────┘
       │               │
       ▼               ▼
┌──────────────┐  ┌──────────────────────────┐
│ SQLAlchemy   │  │ Detection pipeline       │
│ users, scans │  │ rules → URL → Gemini →   │
│ (SQLite dev, │  │ hybrid scoring           │
│ PostgreSQL   │  └────────────┬─────────────┘
│ prod)        │               │ optional HTTPS
└──────────────┘               ▼
                        Google Gemini API
```

The frontend and backend are separately deployable. The API base URL is a
build-time value (`VITE_API_BASE_URL`); the backend accepts browser requests only
from the origins listed in `FRONTEND_URL` / `CORS_ORIGINS`.

---

## 2. Backend layers

| Layer | Location | Responsibility |
| --- | --- | --- |
| Entry point | `app/main.py` | FastAPI app factory, CORS, error handlers, middleware, lifespan |
| API | `app/api/` | `health.py` (system), `routes/auth.py`, `routes/detect.py` (detection + history), `routes/dashboard.py` (stats + analytics) |
| Core | `app/core/` | Settings, logging, JWT/password security, dependencies, error handlers, request guard |
| Database | `app/database/` | Engine/session factory, URL normalisation, schema initialization/verification |
| Models | `app/models/` | `User`, `Scan` |
| Schemas | `app/schemas/` | Pydantic request/response contracts |
| Services | `app/services/` | Auth service; detection package (normalizer, rules, scorer, explanation, URL, Gemini, hybrid) |
| Migrations | `alembic/` | Versioned schema; `alembic upgrade head` |

### Request flow for `POST /api/v1/detect/analyze`

1. `RequestGuardMiddleware` rejects oversized bodies (`413`), applies the
   per-IP sliding-window rate limit (`429`) and adds security headers.
2. `get_current_user` validates the bearer JWT and loads the active user.
3. Pydantic validates the body: `content` (1–10,000 chars) and `content_type`.
4. The rule detector normalizes the text and evaluates weighted rules.
5. Passive URL analysis parses any links; URLs are never fetched.
6. Gemini runs (off the event loop, bounded timeout) only when a key is set.
7. `HybridScorer` merges rule and AI output when a validated AI result exists.
8. Only analysis metadata is stored: type, score, level, category, summary,
   indicators and recommendations. The submitted text is not persisted.
9. The response returns score, level, category, indicators, recommendations and
   an `ai_analysis` section with an honest `completed` / `unavailable` status.

### Error contract

Every error has the same shape:

```json
{ "status": "error", "detail": "Not Found", "path": "/api/v1/does-not-exist" }
```

Validation errors add a sanitized `errors` array that never echoes submitted
values. Unexpected exceptions are logged server-side and return a generic `500`.

---

## 3. Frontend layers

| Layer | Location | Responsibility |
| --- | --- | --- |
| Entry | `src/main.jsx` | React root, providers, global styles |
| Routing | `src/routes/AppRoutes.jsx` | Public landing/auth routes, protected app routes, lazy chunks |
| Layouts | `src/layouts/`, `src/components/layout/` | App shell, sidebar, topbar, mobile drawer, breadcrumbs |
| Pages | `src/pages/` | Landing, Auth, Dashboard, Detection, History, Analytics, Awareness, Settings, 404 |
| Components | `src/components/` | UI primitives, landing sections, detection, dashboard, awareness, routing |
| State | `src/context/` | `AuthProvider` (JWT in `localStorage`, session refresh, 401 handling) |
| Services | `src/services/` | Axios client with auth interceptor and normalized errors |
| Content | `src/data/awareness/` | Static scam guides, quiz, safety rules, official resources |
| Styles | `src/styles/`, `src/index.css` | Design tokens, type scale, Tailwind 4 utilities |

Route-level `React.lazy`/`Suspense` keeps the landing page eager and splits the
internal pages (plus Recharts) into separate chunks.

`ProtectedRoute` redirects unauthenticated visitors to `/login`, preserving the
intended destination. A `401` from any request clears the stored token and emits
`auth:unauthorized`, which resets the context.

---

## 4. Data model

```text
users                              scans
─────                              ─────
id            PK                   id             PK
email         UNIQUE, indexed      user_id        FK → users.id (ON DELETE SET NULL), indexed
hashed_password (Argon2id)         content_type   indexed
full_name                          content_hash   (unused, always NULL)
is_active                          risk_score
created_at                         risk_level     indexed
updated_at                         category
                                   summary
                                   indicators     JSON
                                   recommendations JSON
                                   created_at     indexed with user_id
```

Indexes: `ix_users_email`, `ix_scans_user_id`, `ix_scans_user_created_at`,
`ix_scans_risk_level`, `ix_scans_content_type`.

Every history, detail, dashboard and analytics query is scoped by `user_id`.
Requesting another user's scan returns `404` instead of confirming it exists.

---

## 5. Security architecture

- Argon2id password hashing; plaintext passwords are never stored or logged.
- JWTs (HS256 by default) with `sub`, `iat`, `exp`, `iss`, `aud` and `type`
  claims; decoding requires all claims and the configured HMAC algorithm.
- Production refuses to start without a 32+ character, non-weak
  `JWT_SECRET_KEY`.
- Request guards: 1 MB body limit, per-IP rate limits and security headers
  (`nosniff`, `DENY`, `no-referrer`, permissions policy, `no-store` on API
  responses, HSTS in production).
- CORS allows only explicitly configured origins; wildcards are discarded.
- SQLAlchemy parameterizes queries; filter/sort values are allow-listed.
- Submitted text, tokens, passwords and URL query values are never logged.
- URL query values are redacted in responses and stored indicators.

Known limits (see the README and QA report): JWT in `localStorage` with no CSP or
server-side revocation, in-process rate limiting, no MFA/password reset, and
heuristic detection that can produce false positives and false negatives.

---

## 6. Detection pipeline detail

1. **Normalization** — lower-casing, Unicode/whitespace normalization,
   leetspeak and spacing variants.
2. **Rule engine** — weighted rules across credential theft, fake verification,
   pressure tactics, fake rewards, advance fees, payment fraud, impersonation and
   suspicious links, each with severity, category, explanation and source.
3. **Risk scoring** — weighted sum capped at 100; bands Low <30, Medium <60,
   High <80, Critical ≥80.
4. **URL analysis** — passive parsing only: IP hosts, suspicious TLDs,
   shorteners, deep subdomains, user-info credentials, punycode, risky keywords,
   unusual ports. No DNS resolution, HTTP request, redirect follow or page fetch.
5. **Gemini** — optional, backend-only key, JSON-delimited untrusted input,
   strict Pydantic output validation, bounded retries and timeout.
6. **Hybrid merge** — `max(rule, url)` base score, then a documented 60/40
   merge when a validated AI result exists; otherwise rules and URL findings
   remain authoritative.

The output is a heuristic risk assessment, not proof of fraud.
