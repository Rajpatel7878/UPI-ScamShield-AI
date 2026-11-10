# Phase 17 — Quality Assurance, Security Audit and Performance Report

**Date:** 10 November 2026

**Scope:** UPI ScamShield AI frontend and backend

**Result:** Phase 17 complete. No unresolved Critical or High severity defects. Ready for Phase 18 deployment preparation, subject to the conditions in section 10.

> This was an internal QA and code-security review. It was not a professional
> penetration test, and the application has no formal security certification.

---

## 1. Project Audit Summary

The audit covered the React SPA, FastAPI API, JWT authentication, SQLAlchemy
models and sessions, rule-based detection, passive URL analysis, optional
Gemini integration, hybrid scoring, history and analytics, the Awareness
Center, environment configuration, Git configuration, tests and documentation.

Previous phase labels were not accepted as evidence. The review found that the
working tree contained incomplete Phase 10–15 work: the URL engine contained
corrupted literal backspace bytes and missing mappings, authentication was not
fully wired into the frontend, several API routes had integration defects, and
documentation still described a Phase 2 application. These were treated as
defects and repaired rather than documented as complete.

**Baseline audit checklist and outcome**

| Area | Finding |
| --- | --- |
| Application startup and health | Startup worked, but schema creation and database health reporting required repair. |
| Authentication | Router mounting, frontend integration, JWT claim validation, secret handling and password hashing were incomplete. |
| Database | Models existed; indexes, session cleanup and idempotent startup initialization were missing or incomplete. |
| Rule detection | A malformed duplicate class block raised an error on every matched rule. |
| URL detection | Corrupted source bytes prevented reliable import/execution; URL analysis was not wired into `/detect/analyze`. |
| Gemini/hybrid scoring | Response validation, timeout handling and failure isolation were insufficient. |
| History/analytics | Routes and schemas were missing from the working tree despite existing frontend calls. |
| Frontend/backend integration | Frontend authentication was a stub and detection used non-functional wiring. |
| Awareness Center | Static content was present and functional; no backend surface is required. |
| Configuration and Git | `.env` and databases were ignored, but secrets and rate limits needed a complete documented contract. |
| Tests and docs | Backend coverage existed but had isolation/import failures; frontend had no unit/browser suite; README was obsolete. |

**Findings by priority at audit start:** 3 Critical (broken analysis path, vulnerable
JWT dependency, incomplete authentication), 7 High, 8 Medium and several Low
usability/documentation issues. All Critical and High findings were fixed and
retested. Remaining issues are listed in section 9.

---

## 2. Backend Test Results

Command:

```bash
cd backend
./.venv/Scripts/python -m pytest -v
```

**Result: 104 passed, 0 failed, 0 skipped, 2 warnings in 9.28 s.**

Covered areas include:

- application health, API metadata, CORS/security headers and validation errors;
- registration, duplicate email handling, login, Argon2 hashing, JWT creation,
  expiry, tampering, wrong-key and `alg=none` rejection;
- protected routes, current-user profile, inactive/missing users and logout;
- database initialization, models, constraints, rollback and session cleanup;
- rule detection, URL parsing/detection, Gemini response validation and hybrid
  scoring fallbacks;
- history pagination, filters, sorting, owner-only detail, deletion, dashboard
  statistics and analytics;
- user-level isolation and unauthorized access rejection.

Warnings (non-failing):

1. SQLAlchemy `declarative_base()` is deprecated in favour of
   `sqlalchemy.orm.declarative_base()`.
2. passlib accesses the deprecated `argon2.__version__` attribute.

No live Gemini API call was made in the automated suite; Gemini behaviour is
tested with mocked responses. The rule and URL paths were also exercised through
a live local API.

### End-to-end API journey

A temporary SQLite database and fictional accounts were used. Verified:

- register `201`, duplicate registration rejected, login and `/auth/me` `200`;
- SMS analysis `200` with a Critical result, merged rule/URL indicators and
  recommendations;
- URL analysis `200` with a redacted query value and no external fetch;
- invalid/blank content `422`; unauthenticated requests `401`;
- history persisted, filtered and returned owner-only detail;
- a second user saw zero history records and received `404` for the first
  user's scan;
- dashboard and analytics returned user-scoped totals.

Bad-token requests returned `401`. The temporary database was removed after the
run.

---

## 3. Frontend Build and Test Results

Command:

```bash
cd frontend
npm run build
```

**Result: build passed (2,595 modules transformed in 1.50 s).**

| Artifact | Size | Gzip |
| --- | ---: | ---: |
| Main entry `index-D4i9vuQS.js` | 383.63 kB | 120.23 kB |
| Lazy `PieChart-ccthK7Qr.js` | 398.37 kB | 113.39 kB |
| Lazy `Awareness-CW-2pdV5.js` | 82.98 kB | 24.25 kB |
| Lazy `Analytics-D4i_4kOj.js` | 27.35 kB | 8.74 kB |
| Lazy `Detection-BlRys5Ke.js` | 18.29 kB | 5.33 kB |

`npm run lint` (oxlint): **0 errors, 9 warnings**. The warnings are Fast Refresh
export-shape notices, two component-created-during-render notices and effect
state notices. They are non-blocking and recorded as Low issues.

There is no committed frontend unit-test or browser-test framework. Adding one
was not necessary to verify this phase, but the gap is recorded as a residual
Medium risk.

### Browser end-to-end verification

A one-off Playwright script drove installed Chrome against the running dev
server and a temporary database. Playwright was not added to `package.json` and
the script was removed after the run. All eight groups passed:

1. Landing page → registration → login → dashboard empty state.
2. SMS analysis with real backend scoring, indicators and recommendations.
3. URL analysis with query-value redaction and zero external link requests.
4. History totals, owner-only detail modal, risk filter and analytics.
5. Awareness search, scam guide, back navigation and the full 12-question quiz.
6. Logout, protected-route redirect, unauthenticated API `401`, and a second
   user receiving `404`/zero records for another user's data.
7. Mobile navigation open/close at 390 × 844.
8. No browser console errors after fixing the defects found below.

The journey found a real console defect: dashboard quick-action icons were
strings rendered as `<MessageCircle />`-style lowercase JSX and were not
displayed. `QuickActions.jsx` now maps icon names to imported components.

---

## 4. Security Audit Findings

### Fixed findings

| Severity | Finding | Resolution |
| --- | --- | --- |
| Critical | `python-jose 3.5.0` (PYSEC-2026-4298) and transitive `ecdsa 0.19.2` (PYSEC-2026-1325) had no fixed versions. | Replaced with PyJWT 2.15.1; removed both vulnerable packages from the environment and requirements. |
| Critical | Authentication was not fully wired; protected frontend routes could not enforce a real session. | Mounted auth routes, implemented real login/register/me/logout, protected routes and API `401` handling. |
| Critical | Detection path could not reliably execute due to corrupted URL-engine source and an error on matched rules. | Repaired the engine, removed the duplicate class block and wired URL analysis into detection. |
| High | JWT secret handling allowed an insecure/static development secret. | Secret now comes from settings; production requires 32+ characters and rejects known weak values; development uses an ephemeral key with a warning. |
| High | JWT decoding did not enforce all claims/algorithms. | PyJWT decode requires `exp`, `iat`, `sub`, `iss`, `aud`, validates issuer/audience/type and accepts only the configured HS256/384/512 algorithm. |
| High | Validation responses echoed submitted input, including password values. | Central validation handler returns sanitized locations/messages without the input field. |
| High | URL query values (tokens/OTP-like data) were returned and stored in indicators. | Query values are redacted as `[redacted]`; host/path remain for explainability. |
| High | No request-size limits, rate limiting or security headers. | Added 1 MB body guard, login/register/analyze/API sliding-window limits, security headers and production HSTS. |
| Medium | Password hashing/verification could fail on malformed stored hashes. | Argon2id hashing with safe verification that returns `False` on malformed hashes. |
| Medium | Duplicate-email races could surface database errors. | `IntegrityError` is rolled back and mapped to a generic conflict response. |
| Medium | Gemini failures or malformed model output could affect the request. | Strict Pydantic validation, bounded retries, provider timeout, `asyncio.to_thread` and clean rule/URL fallback. |
| Medium | CORS could be configured too broadly. | Origins come from `FRONTEND_URL` and explicit `CORS_ORIGINS`; wildcard entries are discarded. |

### Verified controls

- Passwords are Argon2id hashes; plaintext is never stored or logged.
- Protected endpoints reject missing, expired, tampered, unsigned, wrong-key,
  wrong-issuer/audience and inactive-user tokens.
- Every scan query is scoped by `user_id`; unauthorized detail returns `404`.
- SQLAlchemy parameterizes queries; filter/sort values are allow-listed.
- No submitted message text or URL query values are written to logs.
- URL analysis never opens, resolves, fetches or follows links.
- Gemini keys remain backend-only. Submitted content is delimited as untrusted
  JSON data and model output is schema-validated; this reduces prompt-injection
  risk but cannot eliminate it.
- No real `.env` files, database files or API keys are tracked. Only
  `.env.example` templates are committed. A repository search found no live
  Gemini/OpenAI-style key; the only `GEMINI_API_KEY` match is a placeholder in
  `VERIFICATION_SUMMARY.md`.
- CORS, security headers and generic 500 responses do not expose stack traces.

### Unresolved security limitations

- JWTs are kept in `localStorage`; a future XSS flaw could expose them. React
  escaping is used and there is no unsafe HTML rendering, but no CSP is set.
- Logout is client-side only: tokens remain valid until expiry, with no
  revocation list or refresh-token rotation.
- Rate limiting is in-process, so limits are per worker and reset on restart.
- No MFA, account lockout, CAPTCHA, email verification or password reset.
- Git history was not exhaustively scanned for historical secrets; the current
  tree and tracked configuration were checked.

---

## 5. Dependency Audit Findings

### Frontend

```bash
cd frontend
npm audit
```

**Result: 0 vulnerabilities.** No unnecessary testing dependency was retained;
Playwright was installed temporarily only for the one-off browser run.

### Backend

```bash
python -m pip_audit --skip-editable
python -m pip list --outdated
```

**pip-audit: no known vulnerabilities.**

**Outdated packages:** `fastapi 0.162.2 → 0.162.3`, `tenacity 9.1.4 → 9.2.1`.

These patch updates were intentionally deferred: they are not security fixes,
and upgrading without a complete retest would add release risk. They are
compatible candidates for Phase 18. `pip check` reported no broken
requirements.

Dependency changes in this phase:

- removed `python-jose[cryptography]` and its `ecdsa` dependency;
- added `PyJWT 2.15.1`, `argon2-cffi 25.1.0`, `passlib 1.7.4`,
  `email-validator 2.3.0` and `google-genai 3.0.0`;
- added `requirements-dev.txt` for test/audit tooling.

---

## 6. Performance Improvements

- **Main JavaScript bundle reduced from 940.36 kB to 383.63 kB (about 59%).**
  Route-level `React.lazy`/`Suspense` split Analytics, Awareness, Detection,
  History, Settings and Auth into separate chunks; Recharts is isolated in the
  lazy `PieChart` chunk.
- Dashboard/history overview counts now use a single aggregate query instead of
  separate counts.
- URL indicators are deduplicated and weight lookups avoid repeated scans.
- Database indexes were added for `(user_id, created_at)`, `risk_level` and
  `content_type`, matching history and analytics filters.
- Schema creation runs once at startup rather than per request.
- Gemini calls run off the event loop with a 30 s client timeout, 35 s hard
  wall-clock bound and at most two retries; failures fall back immediately.
- Session cleanup always closes/rolls back sessions.
- Repeated frontend API calls were reduced by consolidating dashboard overview
  queries and removing nested layouts that remounted pages.

No load test or production latency benchmark was performed, so no runtime
speedup is claimed beyond the measured bundle reduction and query structure.

---

## 7. Accessibility Improvements

- Added accessible names and descriptions to chart regions/alternative
  summaries, form controls, icon buttons and modal controls.
- Scan detail modal now closes on `Escape`, moves focus into the dialog and
  restores focus to the trigger; body scrolling is locked while open.
- History table headers use `scope="col"`; status/empty/error messages use live
  regions where appropriate.
- Keyboard focus indicators were added to navigation, buttons and interactive
  cards; the app layout includes a skip-to-content link.
- Loading, empty and error states have readable text alternatives.
- Mobile sidebar has an explicit close control and `aria-label`s.
- Existing reduced-motion styling was preserved.

A formal WCAG contrast audit with automated tooling was not performed. Visual
contrast and screen-reader behaviour should be included in Phase 18 release QA.

---

## 8. Bugs Found and Fixed

1. URL engine source contained 13 literal backspace bytes, broken mappings,
   missing imports and duplicate indicators.
2. `RuleDetector` raised on every matched rule because of a malformed duplicate
   class-level block.
3. `/detect/analyze` did not run URL analysis or merge URL indicators into the
   saved result.
4. Frontend authentication was a stub; no real login/register session existed.
5. Auth routes were not mounted at the documented `/auth` prefix.
6. JWT implementation used a vulnerable library and incomplete claim checks.
7. Validation errors echoed submitted password/token values.
8. URL query secrets were returned and persisted without redaction.
9. Gemini malformed output/timeout/failure paths could disrupt analysis.
10. Database sessions were not reliably cleaned up and indexes were missing.
11. Dashboard and Detection pages rendered inside duplicate app layouts.
12. History modal lacked `Escape`/focus restoration; table headers lacked scope.
13. Dashboard quick-action icons were rendered as invalid lowercase JSX and
    produced browser console errors.
14. Documentation still claimed the detection engine was unimplemented and the
    database was not configured.

---

## 9. Remaining Issues

### Critical

None.

### High

None.

### Medium

| Issue | Impact | Mitigation / next step |
| --- | --- | --- |
| JWT in `localStorage` and no CSP | A future XSS flaw could expose tokens. | React escaping and no unsafe HTML are in place; add a deployment-specific CSP or move to HttpOnly cookies in Phase 18. |
| Client-side logout only; no token revocation | A stolen token remains valid until expiry (30 min default). | Short expiry is enforced; add revocation/refresh rotation for production. |
| In-memory, per-process rate limits | Limits are not global across workers and reset on restart. | Use Redis/shared storage when deploying multiple instances; document proxy settings. |
| No committed frontend unit/browser tests | Regressions rely on manual/build checks. | Add a lightweight Playwright or Vitest suite in Phase 18. |
| SQLite default and no Alembic migrations | Concurrent production writes and schema evolution are limited. | Use PostgreSQL and introduce migrations before public production. |
| Dashboard/analytics load user scans into memory | Slower for very large histories. | Move aggregation fully into SQL when account volumes grow. |
| Gemini sends message text to a third party when enabled | Privacy trade-off for AI analysis. | Disclosed in the UI/README; leave the key empty to disable. |

### Low

| Issue | Impact |
| --- | --- |
| No account deletion, retention expiry or per-scan delete | Users can clear all history but cannot delete an account or one record. |
| No email verification, password reset, MFA or lockout | Account recovery and abuse controls are limited. |
| Heuristic false positives/negatives | A low score is not proof of safety. Documented in UI and README. |
| URL analysis cannot inspect live pages | Domain age, TLS, redirects and page content are not checked. |
| 9 oxlint warnings | Fast Refresh/effect/style notices; no lint errors. |
| Two deprecation warnings | SQLAlchemy `declarative_base` and passlib's argon2 version access. |
| `fastapi` and `tenacity` patch updates pending | No known vulnerability; retest before upgrading. |
| No formal WCAG/contrast audit | Accessibility improved but not certified. |

---

## 10. Deployment Readiness Assessment

**No Critical or High severity issues remain.** The application starts, builds,
passes 104 backend tests, serves the complete browser journey, rejects
unauthorized access and reports no known dependency vulnerabilities. It is ready
to enter Phase 18 deployment preparation.

It is **not yet public-production-ready** without the following Phase 18
prerequisites:

1. HTTPS termination, production `JWT_SECRET_KEY`, `ENVIRONMENT=production`,
   `DEBUG=false`, exact CORS origins and a trusted reverse proxy configuration.
2. PostgreSQL plus a migration/backup strategy; do not ship the SQLite
   development database.
3. A shared rate-limit store if running more than one worker/instance.
4. A CSP and an explicit decision on token storage/revocation.
5. Monitoring, structured log shipping, uptime checks and secret management.
6. A frontend regression suite and a final cross-browser/accessibility pass.
7. Explicit operational approval for any third-party Gemini data processing.

The detection output remains a heuristic risk assessment, not a guarantee that
a message is safe or fraudulent.
