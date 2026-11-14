# Final Pre-Deployment Audit Report — UPI ScamShield AI

**Date:** 2026-11-11
**Application:** UPI ScamShield AI — Detect. Analyze. Protect.
**Stack:** React 19 + Vite 8, FastAPI 0.162, SQLAlchemy 2.1, SQLite/PostgreSQL, optional Google Gemini
**Audit type:** Full repository, code, security, API, database and deployment readiness review
**Deployment status:** **READY WITH WARNINGS**
**Deployment performed:** No
**Changes pushed:** No

---

## 1. Executive summary

The project is structurally sound and its core flows work. All 110 backend tests
pass, the production frontend build succeeds, `npm audit` reports no vulnerable
packages, `pip-audit` reports no known vulnerabilities for the pinned backend
requirements, and no secrets were found in tracked files or in the 19-commit
history.

The audit found and fixed ten verified defects, including one high-severity
integration bug (a Gemini key supplied through `backend/.env` was silently
ignored) and two security-relevant defects (prompt-injection delimiter breakout
and naive UTC timestamps). No authentication bypass, cross-user data exposure,
SQL injection, or committed secret was found. Cross-user isolation was verified
directly: a second account received `404` for another user's scan and its
"delete history" removed zero rows.

No P0 issues remain. No unresolved high-severity issue affects production.
Two medium items and nine low items remain; they are documented in section 18
and do not block deployment. The project is therefore **READY WITH WARNINGS**,
conditional on setting the documented production environment variables.

---

## 2. Repository inspection

| Metric | Value |
|---|---|
| Git-tracked files | 190 |
| Backend app Python files | 41 |
| Backend test files | 7 (including analytics aggregate regressions) |
| Frontend source files | 111 |
| Branch / HEAD | `main` / `317d699` |
| Working tree at audit start | clean |
| Alembic revisions | 1 |
| Tracked `.env` / `*.db` / `venv` / `node_modules` | none |

- `.gitignore` correctly excludes `.env`, `.env.*` (except `.env.example`), `*.db`,
  `venv/`, `node_modules/`, `dist/` and caches. Confirmed with `git check-ignore`.
- `backend/scamshield.db` exists locally but is untracked and **was not reset or
  modified**; all API tests used throwaway databases.
- No TODO/FIXME/placeholders, no `NotImplementedError`, no fake production
  responses, no `dangerouslySetInnerHTML`, no hardcoded production URLs.
- Unused/demo files are listed in `docs/PRE_DEPLOYMENT_AUDIT.md`; none were deleted.
- CI is configured in `.github/workflows/ci.yml`: backend compile/Ruff/tests,
  Alembic migrations and analytics tests against PostgreSQL, plus frontend
  `npm audit`, lint and production build.

---

## 3. Backend code audit

Reviewed all 41 application modules (routers, core, database, models, schemas,
auth service, rule/URL/Gemini/hybrid detection services) and 7 test modules.

### Results

| Check | Result |
|---|---|
| `python -m compileall -q app` | exit 0, no syntax errors |
| Import smoke (`app.main`, detection services, DB session) | OK |
| `ruff check app --select F,E9` | **All checks passed** |
| `ruff check app` (strict external ruleset) | 115 advisory findings, all style/typing |
| `pytest -q -p no:asyncio` | **110 passed** |

The 115 advisory findings are non-defects: `UP045` (`Optional[X]` → `X | None`),
`B008` (FastAPI `Depends()` in defaults — expected pattern), `UP017`
(`timezone.utc` → `UTC`), import ordering, `S110/S112` (two intentional
best-effort aggregation guards), and typing modernization. There are **zero**
undefined names, unused imports, syntax errors or broken imports in application
code after the fixes.

### Fixed backend defects

1. **Gemini config ignored from `.env` (P1/F-01).** `Settings` did not define
   Gemini fields and the service used `os.getenv` only; pydantic-settings parses
   `.env` into the model but does not populate `os.environ`. The key documented
   for `backend/.env` was therefore silently ignored. Added `gemini_api_key`,
   `gemini_model`, `gemini_timeout_seconds`, `gemini_max_retries` to `Settings`
   and a resolver that prefers the real process environment, then `.env`.
   Verified: a settings-supplied key is now detected.
2. **Prompt-injection delimiter breakout (P2/F-02).** The prompt JSON-encoded
   the message but left `<`/`>` intact inside `<untrusted_message>`, allowing a
   crafted message containing `</untrusted_message>` to escape the data block.
   Angle brackets are now JSON-escaped. Verified: the prompt contains exactly one
   closing delimiter, and injected text appears as `\u003c/untrusted_message\u003e`.
3. **Broken session context manager (P2/F-03).** `get_session()` was a generator
   function but `app/database/session.py` used it with `with`, which would raise
   `AttributeError`. It is now a real `@contextmanager`.
4. **Hybrid indicator provenance (P2/F-04).** URL indicators were relabelled
   `rule_based` and their redacted URL was dropped when Gemini participated.
   Source and URL are now preserved. Verified with a synthetic hybrid result.
5. **Naive UTC timestamps (P2/F-05).** SQLite returns naive datetimes; API
   responses omitted the UTC offset, so browsers displayed UTC as local time.
   Added `app/core/time_utils.py` and UTC validators. Verified: history, detail,
   dashboard and overview now return `+00:00`/`Z`, and same-day filtering works.
6. **Regex case-insensitivity (P3/F-09).** The `(?i)` prefix was stripped while
   `re.IGNORECASE` was disabled. Rules now strip the prefix and always search
   case-insensitively.
7. **Deprecated SQLAlchemy import (P3/F-10).** `declarative_base` now comes from
   `sqlalchemy.orm`, removing the `MovedIn20Warning`.
8. **Incorrect model annotation (P3/F-11).** `Scan.recommendations` is now typed
   `list[str] | None`, matching stored data.
9. **46 unused imports (P3/F-12).** Removed with Ruff F401 autofix; the
   intentional `Base` re-export in `connection.py` was restored with a comment.

No scoring formula, API contract, migration, or database schema was changed.

---

## 4. Frontend code audit

Reviewed services, auth/app contexts, routing, protected routes, Dashboard,
Detection, History, Analytics, AuthPage, layout, and shared UI components.

| Check | Result |
|---|---|
| `npm run build` | success |
| `npm run lint` (oxlint) | 0 errors, **9 warnings** |
| Axios/API integration | matches backend contracts |
| Missing loading/error states | none in the main flows |
| React key usage | present in all rendered lists inspected |
| Unsafe HTML | none |
| Secrets in bundle | none (`GEMINI_API_KEY`, `JWT_SECRET_KEY`, `AIza…` absent) |

### Build output (measured)

| Asset | Size | Gzip |
|---|---|---|
| `index-*.js` | 383.63 kB | 120.23 kB |
| `PieChart-*.js` (recharts) | 398.37 kB | 113.39 kB |
| `Awareness-*.js` | 82.98 kB | 24.25 kB |
| `Analytics-*.js` | 27.35 kB | 8.75 kB |
| `Detection-*.js` | 18.30 kB | 5.34 kB |
| `History-*.js` | 16.39 kB | 3.97 kB |
| `index-*.css` | 76.58 kB | 12.17 kB |

Code splitting is active for all internal pages. The two largest chunks are
React/Axios/router and recharts; acceptable for this app, but recharts alone is
~113 kB gzip and could be deferred further if analytics is rarely used.

### Lint warnings (not errors)

`AppLayout.jsx` setState-in-effect; `ScamDetail.jsx` and `ScamCard.jsx`
component-created-in-render; `ProtectedRoute.jsx` and `AppContext.jsx`
fast-refresh export-boundary warnings; `AppContext.jsx` setState-in-effect.
These do not affect production behavior.

### Remaining frontend findings

- No frontend unit/integration test framework is configured, and no browser
  automation exists in the repo. **No Playwright or manual browser/mobile pass was
  performed**, so visual layout, keyboard navigation, focus order, contrast and
  small-screen behavior are **not verified** by this audit.
- `History.jsx` suppresses exhaustive-deps with a comment; the dependency list
  covers all filter state used by its fetch, so no stale-filter bug was observed.
- `frontend/.env` (untracked) sets `VITE_API_BASE_URL=http://localhost:8000/api/v1`.
  A **local** `npm run build` therefore bakes localhost into `dist`. Vercel builds
  from the repository without that file, but the hosting project must define
  `VITE_API_BASE_URL`; the app logs a console error if it is missing in production.
- `frontend/src/mock-data/dashboard.js` still exports demo statistics, but only
  `QUICK_ACTIONS` is rendered. No demo analytics are presented as real data.

---

## 5. Dependency and supply-chain scan

| Command | Result |
|---|---|
| `npm audit` | **0 vulnerabilities** |
| `npm outdated` | `lucide-react` 1.71.0→1.72.0, `vite` 8.3.7→8.3.8 (patch); exit 1 by design |
| `npm ls --depth=0` | all declared packages resolved, no invalid/extraneous deps |
| `python -m pip_audit -r requirements.txt` | **No known vulnerabilities found** |
| `python -m pip check` | 1 conflict: global `pytest-asyncio 0.24.0` requires `pytest<9`, global pytest is 9.2.0 |
| `python -m pip list --outdated` | run against the global interpreter; many unrelated global packages are outdated (not the project environment) |

Notes:

- `requirements-dev.txt` pins `pytest`, `httpx` and `ruff`; it does **not**
  install `pytest-asyncio`. The collection failure comes from a globally installed,
  incompatible plugin, not from the repository. A clean venv from
  `requirements-dev.txt` avoids it. If async tests are added later, pin a
  pytest-9-compatible `pytest-asyncio`.
- `requirements.txt` correctly keeps Gemini, JWT, Argon2, psycopg and Alembic in
  production dependencies; test-only packages stay in `requirements-dev.txt`.
- Patch upgrades were **not** applied: they are not security fixes and would
  require lockfile churn and a full retest. Recommended, not required.
- `pip-audit` used the pinned requirement set, not the global interpreter, so the
  result reflects what production will install.

---

## 6. Secret and environment scan

| Check | Result |
|---|---|
| Tracked `.env` / `.db` files | none |
| `.env.example` contents | placeholders only (empty `JWT_SECRET_KEY`, empty `GEMINI_API_KEY`, example URLs) |
| Local `backend/.env` | gitignored; `GEMINI_API_KEY` is empty (length 0); no JWT secret set |
| Local `frontend/.env` | gitignored; contains only `VITE_API_BASE_URL` |
| High-entropy patterns across all 19 commits (`AIza…`, `ghp_…`, `sk-…`, private keys) | **no matches** |
| `GEMINI_API_KEY` / `JWT_SECRET_KEY` in the built frontend bundle | **not present** |
| Secret values printed during audit | none |

`git log -S`/`git grep` checks across all revisions found no Google API key,
GitHub token, OpenAI-style key, or private key material. If a real key is ever
committed in the future, deleting it from the working tree is not enough — rotate
it and rewrite history.

---

## 7. Security audit (OWASP-aligned)

### Authentication — PASS

- Argon2 password hashing (passlib, `$argon2…`); malformed hashes return `False`
  instead of crashing.
- Generic `401` for both unknown email and wrong password; inactive accounts
  cannot authenticate or use existing tokens.
- JWT `HS256` (configurable only among HS256/384/512), 30-minute default expiry,
  `iss`/`aud`/`exp`/`iat`/`sub`/`type` all required and verified; the decode
  algorithm list is fixed, preventing `alg=none` and confusion attacks.
- Production refuses to start with a missing, short (<32 chars) or known-weak
  `JWT_SECRET_KEY`.
- Development uses an ephemeral secret when unset; documented behavior, tokens
  expire on restart.
- Logout is client-side by design; stateless JWTs cannot be revoked server-side
  without a denylist. This is documented in the endpoint and README.

### Authorization — PASS (verified)

- Every history/detail/delete/dashboard/analytics query is scoped by
  `Scan.user_id == current_user.id`.
- Verified end-to-end: user B received `404` for user A's scan ID, saw 0 scans,
  and deleting their own history removed 0 of A's rows. A's 6 scans remained.

### API security — PASS

- Pydantic validation on all bodies; content limited to 10,000 chars; body size
  limited to 1 MiB (verified `413`); unknown content types rejected (`422`);
  blank content rejected (`422`).
- Rate limiting verified: the 10th login attempt in the window returned `429`
  with `Retry-After`; register, analyze and general API buckets are configured.
- CORS allows only configured origins; a disallowed origin received no
  `access-control-allow-origin` header. Wildcards are filtered out.
- Centralized error shape; unexpected errors return a generic 500; validation
  errors omit the submitted input (so passwords are not echoed).
- SQLAlchemy ORM/parameterized queries; the only raw SQL is `SELECT 1` for health.
- No mass assignment: explicit request schemas, password never accepted as a
  profile field.
- Security headers on every response: `nosniff`, `DENY`, `no-referrer`,
  Permissions-Policy, `Cache-Control: no-store` under `/api/v1`, and HSTS in
  production (verified live).

### Frontend security — PASS with notes

- No unsafe HTML rendering; React escapes output.
- Token is stored in `localStorage` (standard for bearer SPA auth, but readable by
  any XSS). No sensitive API key is in the bundle.
- Only one external link (`cybercrime.gov.in`), opened with
  `target="_blank" rel="noopener noreferrer"`.
- Redirect after login uses an internal pathname from router state, not an
  attacker-supplied absolute URL.
- Authorization is enforced server-side; the frontend guard is UX only.

### Privacy — PASS

- Raw submitted messages are **not stored**: `Scan` has no content column and the
  route writes `content_hash=None`; history stores only type, score, category,
  generated summary, indicators and recommendations.
- No UPI PIN/OTP/password input is requested by the UI or persisted.
- Passwords are never logged; access logs record method/path/status/duration and
  omit bodies and query strings.
- The Gemini key never leaves the backend; health reports only
  `configured`/`not_configured`.
- URL query values are redacted in indicators (`name=[redacted]`).
- The Detection page and auth page disclose Gemini processing; the awareness
  privacy wording is consistent with the implementation.

### Prompt injection

- The message is JSON-encoded inside an `<untrusted_message>` block, the system
  instructions forbid following embedded instructions, and angle brackets are now
  escaped so the block cannot be closed. This reduces, but cannot mathematically
  eliminate, LLM prompt-injection risk; the AI score is also only 40% of the
  hybrid score and the rule engine remains authoritative for core indicators.

---

## 8. Database audit

| Check | Result |
|---|---|
| Models | `users`, `scans`; `Scan.user_id` nullable FK with `ondelete=SET NULL` |
| Relationships | bidirectional, `cascade="all, delete-orphan"` on user scans |
| Unique / nullability | unique email (constraint + unique index); required fields enforced |
| Indexes | `ix_scans_user_created_at`, `ix_scans_risk_level`, `ix_scans_content_type`, `ix_scans_user_id`, `ix_users_email` |
| Session lifecycle | dependency rolls back on exception and always closes |
| Pagination | `page ≥ 1`, `limit` 1–100; bounded |
| Transaction handling | explicit commit after analyze/delete; rollback on exceptions |
| Migration consistency | initial revision matches models |
| SQLite / PostgreSQL | shared URL normalization to `psycopg`; SQLite tested, PostgreSQL **not executed** |
| `drop_all()` / destructive startup | none; production startup only verifies required tables |
| Data reset during audit | none |

- Development startup uses additive, idempotent `create_all`; production refuses
  to start when migrations are missing. Verified in production mode.
- `_compute_stats` now uses grouped SQL aggregates for totals, risk/content/
  category distributions, daily counts and the recent-scan window. It no longer
  materializes full scan rows. Indicator names still live in a JSON column, so
  only that column is streamed and counted in Python (F-06 fixed).
- Scans may have `user_id=NULL`, but scans created by the API always set the
  authenticated user.

---

## 9. API and integration audit

Frontend calls were matched against backend routes. Methods, paths, request
fields and response fields agree for auth, detection, history, dashboard and
analytics.

| Endpoint | Method | Auth | Verified result |
|---|---|---|---|
| `/` | GET | no | 200 metadata |
| `/api/v1/` | GET | no | 200 alternate metadata |
| `/api/v1/health` | GET | no | 200, real DB connectivity |
| `/api/v1/system/info` | GET | no | 200 safe metadata |
| `/api/v1/auth/register` | POST | no | 201; duplicate/invalid 400/422 |
| `/api/v1/auth/login` | POST | no | 200 token; bad credentials 401; 429 after limit |
| `/api/v1/auth/me` | GET | yes | 200 profile; bad token 401 |
| `/api/v1/auth/logout` | POST | no | 200 acknowledgement |
| `/api/v1/detect/analyze` | POST | yes | 200; invalid type/blank 422; no token 401; >1 MiB 413 |
| `/api/v1/detect/history` | GET | yes | 200 paginated items + overview |
| `/api/v1/detect/history/{id}` | GET | yes | 200 own; 404 other user's; 404 missing |
| `/api/v1/detect/history` | DELETE | yes | 200 count, own rows only |
| `/api/v1/dashboard/stats` | GET | yes | 200 real aggregates |
| `/api/v1/analytics/overview` | GET | yes | 200 aggregates + trends |

No request/response schema mismatch was found. Unauthorized, invalid, expired and
malformed tokens all return `401` with `WWW-Authenticate: Bearer`.

---

## 10. AI and fraud-detection audit

No Gemini key is configured in this environment, so **no live Gemini API call was
made**. Gemini behavior was exercised through the existing mocked unit tests and
by inspecting the prompt and fallback code. This limitation is explicit.

### Rule-based / URL results (actual API calls, fictional messages)

| Example | Score | Level | Indicators | Analysis type |
|---|---|---|---|---|
| OTP scam: “Your bank account will be blocked. Share your OTP immediately.” | 85 | Critical | 3 | rule_based_only |
| Fake cashback: “You won Rs 5,000 cashback. Pay a processing fee…” | 40 | Medium | 2 | rule_based_only |
| UPI PIN request: “Share your UPI PIN with our support agent…” | 35 | Medium | 1 | rule_based_only |
| Normal: “Your electricity bill payment was successful. Thank you.” | 0 | Low | 0 | rule_based_only |
| Suspicious URL: `http://192.168.10.25/secure-login/verify?token=…` | 80 | Critical | 5 | rule_and_url |
| Prompt-injection text with `</untrusted_message>` | 0 | Low | 0 | rule_based_only |

Observations:

- Risk scores stay within 0–100 and labels match the documented bands.
- Indicators are deduplicated by name; URL indicators are deduplicated per URL.
- The normal message is not falsely classified as critical.
- A single critical-severity credential-theft rule scores 35, which maps to
  **Medium** by the documented 30–59 band. This is a calibration observation, not
  an implementation defect; the scoring formula was intentionally not changed.
- The fake-cashback example scores Medium (40). It correctly identifies reward
  manipulation and advance-fee indicators; a “High” label would require a scoring
  calibration decision, not a bug fix.
- Gemini fallback is safe: missing key, timeout (35 s wall clock), provider error,
  invalid JSON, missing fields, invalid risk/severity, or out-of-range confidence
  all return `ai_analysis.status = "unavailable"` and the rule/URL result is
  returned. No confidence value is fabricated; the UI does not show one when AI
  is unavailable.
- The hybrid merge is 60% rule / 40% mapped Gemini level, capped at 100. The
  summary and recommendations are merged and capped at 10.
- Gemini model output is validated against a strict schema before use.

---

## 11. URL security audit

- URL analysis is **strictly passive**: no `requests`, `httpx`, `urllib.request`,
  socket, DNS lookup, redirect following, browser opening or download exists in
  the URL/detection modules. Only `urllib.parse` is used (for redaction).
- Covered and tested: HTTP/HTTPS, IP-based hosts, lookalike brands, brand name in
  an unrelated domain, excessive subdomains, unusual ports, shorteners, punycode,
  Unicode/punycode indicators, misleading paths, suspicious query parameters,
  embedded credentials, malformed/empty URLs.
- Shortened URLs are identified; their destinations are **not** resolved.
- Query values are redacted in returned indicators; the raw URL is not logged.
- No external reputation scanner is called.
- URL risk bands are intentionally stricter than message bands (20+ = High), as
  documented in `url_detector.py`; no change was made.

---

## 12. Functional testing results

API-level journeys were executed with `fastapi.testclient` against a throwaway
SQLite database. No browser was driven.

| Journey | Result |
|---|---|
| 1. Register → login → `/auth/me` → logout endpoint | PASS (201/200/200/200) |
| 2. Scam detection (SMS) | PASS (score, indicators, recommendations, persisted scan) |
| 3. URL detection | PASS (passive result, critical score for IP + credentials + path) |
| 4. History list/detail/delete | PASS; filters, sort and pagination present; delete scoped |
| 5. Analytics | PASS; real distributions, trends, empty state handled by UI |
| 6. Awareness content | Static content verified by inspection; no API dependency |
| 7. Mobile / responsive / keyboard / screen reader | **NOT TESTED** (no browser automation available) |

Additional verified behaviors: cross-user isolation, invalid credentials, missing
token, invalid content type, blank content, oversized request, rate limit, CORS
allow/deny, UTC timestamps, same-day history filter.

---

## 13. Performance audit

Measurements actually collected (local machine, TestClient/uvicorn, single
process, no load generator):

- Health check: ~1–5 ms.
- Register (Argon2 hashing): ~220–340 ms.
- Login: ~95–140 ms.
- Rule-only analyze (6 rules, no URL/Gemini): ~13–20 ms.
- URL analyze (5 indicators): ~20 ms.
- Page chunk sizes: see section 4.

No claim is made about production throughput or memory. Observations:

- Scalar aggregates (totals, distributions, daily counts, recent window) are
  computed in the database. Only the JSON `indicators` column is streamed for
  indicator frequency; no full ORM scan rows are loaded (F-06 fixed).
- Indicator frequency is recomputed per request; no caching.
- Rate limiter state is per process; multiple workers multiply effective limits
  and require a shared store (F-07).
- Gemini calls are bounded to 35 s and run in a worker thread; the client waits
  45 s. A slow Gemini call can still occupy a worker thread after the timeout.
- The query `pool_pre_ping`, `pool_recycle`, pool size 5 + overflow 5 are
  configured for PostgreSQL.

---

## 14. Accessibility audit

Code-level checks only (no browser/a11y tooling run):

- Semantic landmarks, `main`, headings, labels, table headers with `scope`, and
  skip-to-content link are present.
- Form fields have associated labels; errors use `role="alert"`/`aria-live`.
- Charts include screen-reader summaries and `aria-hidden` on the visual layer.
- Modal handles Escape, restores focus and locks background scroll.
- Loading states use `role="status"`/`aria-live`.
- Focus-visible styles exist on key controls.

Not verified: contrast ratios, reduced-motion behavior, full keyboard traversal,
screen-reader announcements, 320 px layout. These require manual or automated
browser testing and are reported as unverified, not passed.

---

## 15. Deployment configuration audit

| Item | Finding |
|---|---|
| Frontend production build | Succeeds |
| Backend start command | `alembic upgrade head && uvicorn app.main:app …` in `render.yaml` |
| Alembic migrations | `alembic upgrade head` succeeded against a fresh DB |
| PostgreSQL driver | `psycopg[binary]`; `postgres://`/`postgresql://` normalized to `+psycopg` |
| JWT secret | Render `generateValue: true`; production startup enforces strength |
| Gemini key | Backend-only, optional; never exposed to Vite |
| Health endpoint | `/api/v1/health`, returns 503 when the DB is unreachable |
| CORS | Explicit origins from `FRONTEND_URL` + optional `CORS_ORIGINS` |
| Security headers | Present; HSTS added in production |
| Docs | `/docs` and `/redoc` controlled by `ENABLE_DOCS` (production test: 404) |
| Logging | Text locally, JSON in production; no bodies or query strings |
| Error handling | Centralized JSON shape; generic 500 |
| React Router fallback | `vercel.json` rewrites all paths to `index.html` |
| Frontend API URL | `VITE_API_BASE_URL`; required in Vercel |
| Localhost dependency | None in code; a local build can bake localhost if the untracked `frontend/.env` is present |
| Git ignore | Correct |
| Hosting config | `render.yaml` + `vercel.json` present and coherent |

---

## 16. Bugs discovered

21 findings, listed in full in `docs/PRE_DEPLOYMENT_AUDIT.md`:
0 critical, 1 high, 7 medium, 13 low.

The most important were:

1. Gemini key from `backend/.env` silently ignored.
2. Prompt-injection delimiter breakout.
3. Broken (but unused) DB session context manager.
4. URL indicator provenance lost in hybrid results.
5. UTC timestamps serialized without an offset.
6. Regex rules accidentally case-sensitive.
7. Deprecated SQLAlchemy import.
8. Incorrect model type hint.
9. 46 unused imports.

---

## 17. Bugs fixed

| ID | Fix | Verification |
|---|---|---|
| F-01 | Gemini settings + env/`.env` resolver | settings-supplied key detected; unit tests pass |
| F-02 | Escape `<`/`>` in untrusted message | exactly one closing delimiter; injected text escaped |
| F-03 | `@contextmanager` on `get_session` | import/compile and full test suite pass |
| F-04 | Preserve `source` and `url` in hybrid merge | synthetic hybrid output preserved `url_based` + redacted URL |
| F-05 | UTC output helpers + schema validators | API returns `+00:00`/`Z`; same-day filter returns the scan |
| F-06 | Grouped SQL aggregates replace the in-memory scan load | exact match with the previous implementation across 5 time windows; API endpoints 200 |
| F-09 | Always use `re.IGNORECASE` | rule tests pass |
| F-10 | `sqlalchemy.orm.declarative_base` | compile/tests pass; warning removed |
| F-11 | `recommendations: list[str]` | compile/tests pass |
| F-12 | Removed unused imports | `ruff --select F,E9` clean |

`git diff --check` passes; the final diff was reviewed and contains no unintended
file changes. No tests were modified, skipped or weakened.

---

## 18. Unresolved issues

| ID | Severity | Issue | Recommended action |
|---|---|---|---|
| F-07 | P2 | Rate limiter is per-process | Use Redis (or a shared store) when running more than one worker |
| F-08 | P2 | Local production build bakes localhost from `frontend/.env` | Set `VITE_API_BASE_URL` in Vercel; never deploy a local `dist` |
| F-13 | P3 | Unused demo pages/data exports | Remove after confirming no product intent |
| F-14 | P3 | Corrupted dead regex in an unused helper | Delete the helper or fix the regex |
| F-15 | P3 | Hybrid category override contradicts its comment | Decide whether Gemini or rules own the category; align comment/code |
| F-16 | P3 | 2 low Bandit findings | Keep (intentional best-effort aggregation) or narrow the excepts |
| F-17 | P3 | 9 oxlint warnings | Address fast-refresh/state-in-effect warnings in a UI cleanup pass |
| F-18 | P3 | Patch updates available (`lucide-react`, `vite`) | Upgrade with lockfile + full retest when convenient |
| F-19 | P3 | No frontend/browser test suite (backend analytics regressions and CI now exist) | Add Vitest + Playwright for the critical journeys |
| F-20 | P3 | Global pytest-asyncio/pytest conflict | Use a clean venv; pin a compatible pytest-asyncio only if async tests are added |
| F-21 | P3 | Duplicate API root payloads | Keep one canonical root or align the schemas |

Additional limitations:

- **PostgreSQL was not executed locally** (no server, Docker or `psql` in this
  environment). The PostgreSQL branch is covered by SQL-compilation tests and
  offline Alembic SQL generation; the CI workflow applies the migrations and
  runs the analytics tests against a real `postgres:16` service. Run the same
  job against the staging database before production.
- **No live Gemini call was made.** Validate with a real key in staging,
  including quota/timeout behaviour.
- **No browser, mobile, accessibility or visual testing was performed.**
- **No load/performance test was performed.**

None of these is a P0/P1 production blocker.

---

## 19. Commands executed (exact)

```bash
# Backend
cd backend
python -m compileall -q app
python -m pytest -q                      # fails collection: global pytest-asyncio 0.24 vs pytest 9
python -m pytest -q -p no:asyncio        # 110 passed
python -m ruff check .
python -m ruff check app --select F,E9
python -m ruff check app --select F401 --fix
python -m bandit -r app -f txt -q
python -m pip check
python -m pip_audit -r requirements.txt --progress-spinner off
python -m pip list --outdated

# Frontend
cd frontend
npm run lint
npm run build
npm audit
npm outdated
npm ls --depth=0

# Deployment verification
DATABASE_URL=sqlite:///./audit_prod_tmp.db ENVIRONMENT=production \
  JWT_SECRET_KEY=<32+ char test value> ENABLE_DOCS=false LOG_FORMAT=json \
  python -m alembic upgrade head
DATABASE_URL=... python -m uvicorn app.main:app --host 127.0.0.1 --port 8123
curl http://127.0.0.1:8123/api/v1/health

# Secret/history review
git ls-files
git check-ignore -v backend/.env frontend/.env backend/scamshield.db
git grep -n -E 'AIza[0-9A-Za-z_-]{30,}|-----BEGIN ... PRIVATE KEY-----|ghp_[A-Za-z0-9]{30,}' -- .
for c in $(git rev-list --all); do git grep -I -l -E '<secret patterns>' "$c"; done

# Final diff
git diff --check
git status --short
```

---

## 20. Exact test results

| Action | Result |
|---|---|
| `compileall` | pass (exit 0) |
| `pytest -q -p no:asyncio` | **110 passed**, 15 warnings, 10.11 s |
| `pytest -q` (raw) | collection error from global `pytest-asyncio`; not a repo failure |
| `ruff check app --select F,E9` | **All checks passed** |
| `ruff check app` | 115 advisory style findings; 0 F/E9 |
| `ruff check .` | 181 advisory findings across app + tests; 0 F/E9 |
| Bandit | 2 low, 0 medium, 0 high |
| pip-audit (requirements) | No known vulnerabilities |
| pip check | 1 global-env conflict (`pytest-asyncio`), not in project requirements |
| npm audit | 0 vulnerabilities |
| npm run lint | 0 errors, 9 warnings |
| npm run build | success (2612 modules, ~2.6 s) |
| Alembic upgrade | success on fresh SQLite |
| Production uvicorn + health | 200; HSTS present; `/docs` 404 |
| E2E API journeys | all primary paths pass |
| Secret scan (tree + 19 commits) | no secrets found |

---

## 21. Recommendations before deployment

1. In Vercel, set `VITE_API_BASE_URL=https://<backend-host>/api/v1` and redeploy.
2. In Render, set `FRONTEND_URL=https://<frontend-host>` (no trailing slash); add
   `CORS_ORIGINS` only if additional origins are needed.
3. Keep `JWT_SECRET_KEY` generated by Render (or another 32+ character random
   value); never reuse the development secret.
4. Set `GEMINI_API_KEY` in Render only if AI analysis is desired; the app runs
   without it. Test one analysis in staging to confirm quota/timeout behavior.
5. Confirm `ENVIRONMENT=production`, `DEBUG=false`, `LOG_FORMAT=json`.
6. Run the Alembic migration and health check against staging PostgreSQL.
7. Consider setting `ENABLE_DOCS=false` for a public launch (currently enabled
   intentionally for the hackathon).
8. Before scaling beyond one worker, add a shared rate-limit store.
9. CI now runs compile, pytest, Ruff, npm audit and the production build. Add a
   Playwright smoke test for the frontend journeys.
10. For very large histories, consider a covering index on `(user_id, created_at)`
    plus a retention policy; the aggregate queries are already SQL-based.

Do not treat heuristic detection as a guarantee of fraud detection; the UI
already states this and the audit confirms no such guarantee is made.

---

## 22. Deployment gate

| Condition | Status |
|---|---|
| No unresolved critical vulnerabilities | PASS |
| No unresolved high-severity production vulnerability | PASS |
| No exposed secrets | PASS |
| Backend starts successfully | PASS |
| Frontend production build succeeds | PASS |
| Backend tests pass | PASS (110/110) |
| Frontend tests pass, if configured | N/A (not configured) |
| Database migrations verified | PASS (SQLite; PostgreSQL not executed) |
| Authentication works | PASS |
| User data isolation verified | PASS |
| Scam detection works | PASS |
| Gemini fallback works | PASS (mocked/unit + code review; no live key) |
| URL analysis is passive | PASS (code + tests) |
| History works | PASS |
| Analytics work | PASS |
| Awareness Center works | PASS (inspection; no browser test) |
| CORS and production configuration reviewed | PASS with required env setup |
| Environment variables documented | PASS |
| Git diff reviewed | PASS |
| Audit report created | PASS |

### Final status: **READY WITH WARNINGS**

The mandatory checks pass and no critical/high-severity blocker remains. The
status is not an unconditional “ready”: two medium items (single-process rate
limiting, local-build localhost) and nine low items
remain, and browser/PostgreSQL/live-Gemini verification was not possible in this
environment. Do not deploy until the production environment variables in section
21 are set and staging verification is complete.

---

## 23. Audit totals

| Metric | Value |
|---|---|
| Files inspected / inventoried | 190 tracked files (41 backend modules, 6 tests, 111 frontend sources) |
| Total issues discovered | 21 |
| Total issues fixed | 10 |
| Critical remaining | 0 |
| High remaining | 0 |
| Medium remaining | 2 |
| Low remaining | 9 |
| Backend tests | 110 passed |
| Frontend build | success |
| Security scans | Bandit 2 low; pip-audit clean; npm audit clean |
| Secret scan | clean (tree + history) |
| AI detection | rule/URL verified; Gemini path mocked only |
| URL security | passive confirmed |
| Git working tree | modified, uncommitted (see below) |
| Audit report | `docs/FINAL_PRE_DEPLOYMENT_AUDIT_REPORT.md` |

### Exact next action required

Review the uncommitted diff, then set the production environment variables and
approve a commit. Nothing has been pushed and nothing has been deployed.
