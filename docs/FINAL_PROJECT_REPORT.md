# UPI ScamShield AI — Final Project Report

**Phase:** 18 — Production deployment preparation and hackathon submission
**Date:** 10 November 2026
**Developer:** Raj Patel (individual project)
**Repository:** <https://github.com/Rajpatel7878/UPI-ScamShield-AI> (branch `main`)

**Status vocabulary used throughout**

| Label | Meaning |
| --- | --- |
| **Completed** | Implemented and present in the repository |
| **Tested locally** | Exercised in this environment; result recorded below |
| **Deployed** | Running on a hosting provider |
| **Verified live** | Accessed over the public internet and checked |
| **Pending manual action** | Requires the owner's account, browser or approval |

---

## 1. Project overview

UPI ScamShield AI is a full-stack educational fraud-analysis application for
suspicious UPI and banking messages. It combines an explainable rule engine,
passive URL inspection and optional AI analysis (OpenRouter first, Google Gemini
as fallback) to produce a risk score, the indicators behind it and practical
safety recommendations. Signed-in
users get scan history and analytics; a Scam Awareness Center provides prevention
content.

## 2. Completed functionality

| Area | Functionality | Status |
| --- | --- | --- |
| Landing | Branded marketing page, feature/demo sections, responsive navigation | Completed |
| Auth | Register, login, `/auth/me`, logout, protected routes, 401 handling | Completed |
| Detection | SMS, WhatsApp, payment request, general text and URL analysis | Completed |
| Rule engine | Weighted, explainable indicators across 10 fraud categories | Completed |
| URL engine | Passive structural analysis with query-value redaction | Completed |
| AI | Optional OpenRouter → Gemini fallback with schema validation, timeouts, retries | Completed |
| Hybrid scoring | `max(rule, url)` base, documented 60/40 AI merge when valid | Completed |
| History | Filters, sorting, pagination, detail, delete-all, owner isolation | Completed |
| Dashboard | User-scoped statistics, recent scans, risk insights | Completed |
| Analytics | Overview totals, risk distribution, activity trend | Completed |
| Awareness | Scam guides, warning signs, emergency steps, links, FAQ, 12-question quiz | Completed |
| Security | Argon2id, JWT claim validation, rate limits, headers, CORS allowlist, body cap | Completed |
| Production config | Env-based settings, JSON logging, docs toggle, health check | Completed |
| Database | PostgreSQL support, Alembic migration, production schema verification | Completed |
| Deployment config | `render.yaml`, `frontend/vercel.json`, `.env.example` contracts | Completed |
| Documentation | README, architecture, deployment runbook, QA report, submission package | Completed |

Phase 18 also repaired pre-existing repository hygiene issues: six tracked `.bak`
source copies, three one-off `fix_*docstring*.py` scripts at the repository root,
stale module docstrings claiming the database was "not configured", an empty
Alembic revision, and a stale Phase 1 architecture document.

## 3. Architecture

```text
Browser → React 19 SPA (Vite) → HTTPS /api/v1 → FastAPI (Uvicorn)
      → SQLAlchemy → SQLite (local) / PostgreSQL (production)
      → OpenRouter API, then Google Gemini API (optional, backend-only keys)

Planned hosting: Vercel (frontend) · Render (backend) · managed PostgreSQL
```

Key boundaries: middleware guards → JWT auth → Pydantic validation → detection
pipeline → persistence. Submitted text is never persisted or logged; URL query
values are redacted; links are never fetched.

Details: [`ARCHITECTURE.md`](ARCHITECTURE.md),
[`DEPLOYMENT_ARCHITECTURE.md`](DEPLOYMENT_ARCHITECTURE.md).

## 4. Technology stack

- **Frontend:** React 19, React Router 7, Vite 8, Tailwind CSS 4, Axios, Recharts, Lucide
- **Backend:** Python 3.11+ (developed on 3.14.6), FastAPI 0.162, Uvicorn 0.54, Pydantic 2
- **Data:** SQLAlchemy 2.1, Alembic 1.20, psycopg 3.3, SQLite (local), PostgreSQL (production)
- **Auth:** PyJWT 2.15 (HS256), passlib + Argon2id
- **AI:** OpenRouter via HTTPX (primary), Google Gemini via `google-genai` (fallback); both optional
- **Quality:** pytest, httpx TestClient, oxlint, pip-audit, npm audit

## 5. AI integration

- Provider order is fixed: OpenRouter is attempted first when
  `OPENROUTER_API_KEY` is configured, then Gemini when
  `GEMINI_API_KEY` is configured. If neither key is set, no external AI request
  is made and the response reports `ai_analysis.status: unavailable`.
- The response reports the provider and model that actually produced the
  result (`openrouter` or `gemini`); neither is reported as the other.
- API keys are read only on the backend and never leave it.
- Submitted text is JSON-encoded inside an `<untrusted_message>` block with
  separate system instructions; this reduces, but does not eliminate, prompt
  injection.
- The response must satisfy a strict schema (all fields present, risk level and
  severity allow-listed, confidence within 0–1). Invalid output is rejected, not
  guessed at.
- Calls run in a worker thread with a provider timeout (30 s default), a ~35 s
  hard wall-clock bound and at most two retries; failure falls back to rules and
  URL analysis, and the response reports `ai_analysis.status: unavailable`.
- **Mocked testing only** — no OpenRouter or Gemini key is configured in this
  environment, so provider behaviour is covered by mocked tests (injected HTTP
  transport and patched Gemini SDK client) and never by live API calls. Live AI
  behaviour must be re-checked after a key is set on the deployed backend.

## 6. Security implementation

Implemented: Argon2id hashing; JWT with `exp/iat/sub/iss/aud/type` and a fixed
algorithm allowlist; fail-fast production secret validation; generic credential
errors; sanitized validation responses; 1 MB body limit; per-IP rate limits on
login/register/analyze/API; security headers with HSTS in production;
`Cache-Control: no-store` on API responses; explicit CORS allowlist (wildcards
discarded); owner-scoped queries returning `404` for other users' records;
parameterized SQL with allow-listed filters/sorts; no raw content in logs;
redacted URL query values; passive-only URL analysis.

Documented gaps: JWT in `localStorage` with no CSP or server-side revocation;
in-process rate limiting; no MFA, email verification, password reset, account
lockout or account deletion; heuristic detection with no accuracy claim; no
professional penetration test or certification.

## 7. Test results

All results below were produced in this environment during Phase 18.

| Check | Command | Result | Status |
| --- | --- | --- | --- |
| Backend test suite | `backend/.venv/Scripts/python -m pytest -q` | **104 passed, 0 failed, 2 warnings, 8.63 s** | Tested locally |
| Frontend production build | `npm run build` | Passed, `dist` 1.1 MB | Tested locally |
| Frontend lint | `npm run lint` | 0 errors, 9 warnings (Fast Refresh / effect / render notices) | Tested locally |
| npm dependency audit | `npm audit` | 0 vulnerabilities | Tested locally |
| Python dependency audit | `python -m pip_audit` | No known vulnerabilities | Tested locally |
| Python dependency consistency | `python -m pip check` | No broken requirements | Tested locally |
| Migration from empty database | `alembic upgrade head` | Applied `70e8fa9ea9cc` | Tested locally |
| Model/migration drift | `alembic check` | No new upgrade operations detected | Tested locally |
| PostgreSQL DDL generation | `alembic upgrade head --sql` with `postgresql://` URL | Valid PostgreSQL DDL emitted | Tested locally |
| Production config rehearsal | `ENVIRONMENT=production` + migrated DB | Health `200 connected`, docs `404` when disabled, register `201`, login `200`, analyze `200 Critical/85`, history `200`, CORS + HSTS + nosniff correct | Tested locally |
| Production startup without migrations | `ENVIRONMENT=production` + empty DB | Refused to start with actionable error | Tested locally |
| Secret scan of tracked files | `git ls-files` + pattern scan | No keys, private keys, JWTs or credentialed connection strings | Tested locally |
| Production bundle contains localhost API URL | build + `grep` | 0 occurrences (remaining `localhost` strings are React Router internals) | Tested locally |

Notes and gaps:

- The warnings are two deprecations: SQLAlchemy's `declarative_base()` import path
  and passlib reading `argon2.__version__`. Neither affects behaviour.
- There is **no committed frontend unit or browser test suite**. Phase 17 ran a
  one-off Playwright/Chrome journey (registration, detection, URL redaction,
  history, analytics, quiz, authorization, mobile navigation, console errors) and
  removed the script; that journey was **not re-run in Phase 18**. Frontend
  verification in Phase 18 is the production build, lint and the backend API
  journey.
- No live PostgreSQL server was available; PostgreSQL was verified at the
  driver/SQL-dialect level. A real database must be verified after provisioning.
- No load, latency or Lighthouse benchmark was performed; no performance score is
  claimed.

## 8. Deployment status

| Item | Status |
| --- | --- |
| Deployment configuration committed (`render.yaml`, `frontend/vercel.json`) | Completed |
| Backend production mode | Tested locally |
| Frontend production build | Tested locally |
| Managed PostgreSQL provisioned | **Not deployed** — Pending manual action |
| Backend on Render | **Not deployed** — Pending manual action |
| Frontend on Vercel | **Not deployed** — Pending manual action |
| Live end-to-end verification | **Pending** — blocked on the deployments above |

Deployment was not attempted because this environment has no hosting
credentials or CLIs: no `VERCEL_TOKEN`, `RENDER_API_KEY`, Vercel CLI or Render
CLI is available, and both platforms require interactive account authorisation.
Nothing has been reported as deployed that is not actually deployed.

## 9. Live frontend URL

**None.** No frontend deployment exists. Add the URL here only after the live
verification in `submission/SUBMISSION_CHECKLIST.md` section 6 passes.

## 10. Live backend URL

**None.** No backend deployment exists. Do not publish an API URL until
`/api/v1/health` returns `200` with `"database":"connected"` and the
register → login → analyze → history journey passes against it.

## 11. GitHub repository

<https://github.com/Rajpatel7878/UPI-ScamShield-AI> — branch `main`.
Repository visibility could not be confirmed from this environment (the GitHub
API request returned HTTP 403); confirm it is public before submitting.

Final commit: the Phase 18 commit titled
`Prepare ScamShield for production deployment and hackathon submission`.
Run `git log -1 --stat` on `main` for the exact hash and file list.

## 12. Known limitations

1. Heuristic detection can produce false positives and false negatives; a low
   score is not proof of safety.
2. URL analysis is passive: no live page content, domain age, TLS, redirect or
   reputation checks.
3. JWT in `localStorage`, no CSP, no server-side revocation; logout is
   client-side and tokens stay valid until expiry (30 min).
4. Rate limiting is per process; multiple instances need a shared store.
5. No MFA, email verification, password reset, account lockout or account
   deletion; no per-scan deletion (delete-all only).
6. Dashboard/analytics aggregate in memory; needs SQL aggregation at scale.
7. No committed frontend automated tests; no load testing.
8. Live OpenRouter and Gemini calls unverified in this environment (no keys);
   provider routing is covered by mocked tests only.
9. PostgreSQL verified only at the dialect/driver level.
10. No formal security certification or penetration test.

## 13. Future improvements

- HttpOnly cookie sessions with refresh rotation, revocation and a strict CSP.
- Shared rate-limit store and horizontally scaled workers.
- SQL-side analytics aggregation and per-scan deletion.
- Sandboxed URL reputation service (never fetched from the API process).
- Hindi/regional-language detection, QR/UPI intent parsing, screenshot OCR.
- Vitest unit tests plus a committed Playwright end-to-end suite in CI.
- Uptime monitoring, error tracking, automated backups and a CI pipeline that runs
  tests, lint and dependency audits on every push.

## 14. Hackathon submission readiness

| Deliverable | Status |
| --- | --- |
| Working application (local) | Ready |
| Public repository | Ready, visibility **pending confirmation** |
| README and documentation | Ready |
| Submission package (`submission/`) | Ready |
| Screenshots | **Pending** — capture from a working instance |
| Demo video (< 5 min) | **Pending** — script and checklist ready |
| Presentation deck | **Pending** — outline ready (10 slides) |
| Live deployment | **Pending** — requires account access |
| Live verification | **Pending** — blocked on deployment |

**Overall:** the code, configuration and submission documents are complete and
honestly verified locally. The remaining work is account-bound (deploy, verify,
capture screenshots, record the video, build the deck), and every step is
documented. Until those are done, the project is **not** presented as deployed.
