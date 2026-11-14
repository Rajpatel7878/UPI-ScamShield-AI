# Pre-Deployment Audit — UPI ScamShield AI

**Date:** 2026-11-11
**Project:** UPI ScamShield AI (React + Vite / FastAPI / SQLAlchemy / Gemini)
**Scope:** Full repository audit before production deployment
**Status:** Audit complete — see `docs/FINAL_PRE_DEPLOYMENT_AUDIT_REPORT.md` for the final gate decision.

---

## 1. Audit plan

The audit was executed in this order, and every result below comes from an actual
command or inspection in this repository:

1. Inventory the repository, configuration, dependencies and Git state.
2. Read and review every backend module (API, core, database, models, schemas, services, tests).
3. Read and review frontend services, contexts, routes, pages and shared components.
4. Run backend static checks: `compileall`, Ruff, Bandit, `pip check`, `pip-audit`.
5. Run backend tests: `pytest`.
6. Run frontend checks: `oxlint`, `vite build`, `npm audit`, `npm outdated`, `npm ls`.
7. Scan the working tree and all 19 commits for secrets (redacted reporting only).
8. Execute API-level end-to-end journeys against a throwaway SQLite database.
9. Verify production startup with Alembic migrations, HSTS, docs disabled and a health probe.
10. Fix verified defects with minimal changes, then rerun the affected checks.
11. Record remaining issues and the deployment gate.

**Constraints honored:** no deployment, no Git push, no database reset, no secret values
printed, no fabricated scan results, no test disabling.

---

## 2. Repository inventory

| Area | Count / location |
|---|---|
| Git-tracked files | 190 |
| Backend application modules | 41 Python files under `backend/app` |
| Backend tests | 7 files under `backend/tests` |
| Frontend source files | 111 files under `frontend/src` |
| Frontend routes | 8 routes in `frontend/src/routes/AppRoutes.jsx` |
| API routers | `health`, `auth`, `detect`, `dashboard` |
| Database models | `users`, `scans` |
| Alembic revisions | 1 (`70e8fa9ea9cc`) |
| Deployment config | `render.yaml`, `frontend/vercel.json` |
| CI configuration | `.github/workflows/ci.yml` |
| Browser/E2E test setup | none found |
| Environment templates | `backend/.env.example`, `frontend/.env.example` |

### Structure summary

```text
backend/
  alembic/                 migration environment + initial revision
  app/
    api/                   routers (health, auth, detect, dashboard)
    core/                  config, security, dependencies, middleware, errors, logging
    database/              engine, session, base, init_db
    models/                User, Scan
    schemas/               auth, detection, history, health
    services/              auth_service + detection engine (rules, URL, Gemini, hybrid)
  tests/                   110 tests
frontend/
  src/
    components/            landing, dashboard, detection, awareness, ui, layout...
    context/               app metadata + auth provider
    data/awareness/        static awareness content
    hooks/                 health check
    mock-data/             static demo constants (only quick actions are used)
    pages/                 Landing, AuthPage, Dashboard, Detection, History, Analytics, Awareness...
    routes/                route table
    services/              axios client + health service
  vite.config.js, vercel.json, package.json
docs/, submission/, render.yaml
```

### Git state

- Branch: `main`, remote `origin/main`.
- Last 5 commits: `317d699`, `4cd1cef`, `8b8e9a5`, `8f67a9b`, `d53f7e5`.
- Working tree before audit: clean.
- No `.env`, `*.db`, `venv/`, `node_modules/` or `dist/` files are tracked.
  Verified with `git ls-files` and `git check-ignore`.

### Search results

| Pattern | Result |
|---|---|
| `TODO`, `FIXME`, `XXX` in app source | none |
| `NotImplementedError` | none |
| `pass` placeholder bodies | none in request paths; 2 intentional `except: pass/continue` in `dashboard.py` aggregation |
| Fake API responses in production paths | none |
| Mock data rendered as real analytics | none; only `QUICK_ACTIONS` from `mock-data/dashboard.js` is used |
| `dangerouslySetInnerHTML` | none |
| Hardcoded production URLs | none |
| `localhost` in frontend source | one documented dev fallback in `apiClient.js`; also baked into a **local** production build because `frontend/.env` exists locally (untracked) |
| `drop_all()` / destructive migration | none |

### Unused / suspicious files (verified, not deleted)

| File | Finding |
|---|---|
| `frontend/src/pages/Home.jsx` | Not routed; only imports `ApiStatusCard` |
| `frontend/src/pages/PlaceholderPage.jsx` | Not imported anywhere |
| `frontend/src/pages/DesignSystem.jsx` | Not routed; demo/design page |
| `frontend/src/mock-data/dashboard.js` | Exports demo statistics; only `QUICK_ACTIONS` is imported |
| `backend/app/database/session.py` | Alternate DB dependency; not used by the app (its helper was broken and is now fixed) |
| `backend/app/services/detection/text_normalizer.py` → `is_suspicious_shortened_url` | Unused; contains a corrupted dead regex (`\(bhabhi\)`) |
| `backend/app/services/detection/url_rules.py` | Rule registry is data-only; not wired into scoring (scoring is in `url_detector.py`) |

These were kept because they are either demo assets or documented alternate
utilities, and deleting them is outside the minimal-fix scope.

---

## 3. Tools used

| Tool | Version | Purpose |
|---|---|---|
| Python | 3.14.6 | runtime |
| pytest | 9.2.0 | backend tests |
| Ruff | 0.17.4 | static analysis (installed for this audit) |
| Bandit | 1.9.4 | security lint (installed for this audit) |
| pip-audit | 2.10.1 | dependency vulnerability scan (installed for this audit) |
| npm | 10.9.10 | frontend tooling |
| oxlint | 1.93.0 | configured frontend lint |
| Vite | 8.3.7 | production build |
| Git | — | history/secret review |

Not available/was not used: Gitleaks, Semgrep, Playwright, PostgreSQL server.
Their absence is reported as a limitation in the final report, not as a pass.

---

## 4. Findings log

Severity: **P0** critical, **P1** high, **P2** medium, **P3** low.
Status as of the final report.

| ID | Severity | Finding | Location | Status |
|---|---|---|---|---|
| F-01 | P1 | Gemini configuration was read only from `os.getenv`, so a key placed in `backend/.env` (the documented local workflow) was silently ignored | `app/services/detection/gemini_service.py`, `app/core/config.py` | Fixed |
| F-02 | P2 | Prompt-injection delimiter breakout: message text was JSON-encoded but `<`/`>` were not escaped, so `</untrusted_message>` could close the data block | `gemini_service._build_prompt` | Fixed |
| F-03 | P2 | `get_session()` was a generator function used with `with`, raising `AttributeError` | `app/database/connection.py`, `app/database/session.py` | Fixed |
| F-04 | P2 | Hybrid merge relabelled URL indicators as `rule_based` and dropped their redacted URL | `app/services/detection/hybrid_scorer.py` | Fixed |
| F-05 | P2 | SQLite returns naive datetimes; API timestamps had no offset and browsers treated UTC as local time | history/dashboard/detail responses | Fixed |
| F-06 | P2 | Analytics computed stats by loading every scan row for the user into memory | `app/api/routes/dashboard.py::_compute_stats` | Fixed (grouped SQL aggregates) |
| F-07 | P2 | Rate limiter is in-process; limits are per worker/instance | `app/core/middleware.py` | Open (documented) |
| F-08 | P2 | A locally-run production build baked `http://localhost:8000/api/v1` because the untracked `frontend/.env` is loaded by Vite | `frontend/src/services/apiClient.js` | Open (deployment note) |
| F-09 | P3 | `(?i)` prefix was stripped while `re.IGNORECASE` was disabled, making rules case-sensitive against pre-lowercased text | `rule_detector._match_pattern` | Fixed |
| F-10 | P3 | Deprecated `sqlalchemy.ext.declarative.declarative_base` import | `app/database/base.py` | Fixed |
| F-11 | P3 | `Scan.recommendations` annotated `list[dict]` but stores `list[str]` | `app/models/scan.py` | Fixed |
| F-12 | P3 | 46 unused imports in application modules | `backend/app` | Fixed |
| F-13 | P3 | Unused demo data exports and unrouted pages | `frontend/src/mock-data`, `pages/` | Open |
| F-14 | P3 | Corrupted dead regex in unused helper | `text_normalizer.is_suspicious_shortened_url` | Open |
| F-15 | P3 | Hybrid scorer comment says it prefers the rule category, but code always overrides with Gemini's | `hybrid_scorer._both_sources_available` | Open |
| F-16 | P3 | 2 low Bandit findings (`try/except/pass`, `try/except/continue`) | `dashboard.py` | Open/accepted |
| F-17 | P3 | 9 oxlint warnings (fast-refresh boundaries, setState-in-effect, component-in-render) | frontend components | Open/accepted |
| F-18 | P3 | Patch updates available: `lucide-react` 1.71→1.72, `vite` 8.3.7→8.3.8 | `frontend/package-lock.json` | Open |
| F-19 | P3 | No automated frontend/browser tests configured | `frontend` | Open |
| F-20 | P3 | Global `pytest-asyncio` 0.24.0 is incompatible with pytest 9.2.0; not declared by the repo | environment | Open (environment-only) |
| F-21 | P3 | Duplicate API root (`/` and `/api/v1/`) with different payloads | `app/main.py`, `app/api/health.py` | Open (harmless) |

**Totals:** 21 findings — 0 P0, 1 P1, 7 P2, 13 P3; 10 fixed, 11 open/accepted.

---

## 5. Fix summary

| Fix | Change |
|---|---|
| F-01 | Added Gemini fields to `Settings`; service resolves each value from the process environment first, then `.env` settings |
| F-02 | JSON-escape `<`/`>` in the delimited untrusted message |
| F-03 | Decorated `get_session` with `@contextmanager` and corrected its return type |
| F-04 | Preserve `source` and redacted `url` when merging indicators |
| F-05 | Added `app/core/time_utils.py`; used it in history/overview/detail/dashboard; UTC validators in response schemas |
| F-06 | Replaced the full scan-row load with grouped SQL aggregates (totals, distributions, daily counts, recent limit); only the JSON indicator column is streamed |
| F-09 | Strip `(?i)` and always search with `re.IGNORECASE` |
| F-10 | Import `declarative_base` from `sqlalchemy.orm` |
| F-11 | Corrected the model type hint to `list[str] \| None` |
| F-12 | Removed unused imports with `ruff check app --select F401 --fix`; restored the intentional `Base` re-export in `connection.py` |

No scoring formula, API contract, database schema, or user-facing flow was changed.

---

## 6. Verification after fixes

| Check | Result |
|---|---|
| `python -m compileall -q app` | exit 0 |
| `pytest -q -p no:asyncio` | **110 passed** |
| `ruff check app --select F,E9` | **All checks passed** |
| `ruff check app` (strict external ruleset) | 115 advisory style findings, 0 F/E9 |
| `bandit -r app` | 2 low, 0 medium, 0 high |
| `pip-audit -r requirements.txt` | No known vulnerabilities |
| `npm audit` | 0 vulnerabilities |
| `npm run lint` | 0 errors, 9 warnings |
| `npm run build` | success |
| Production startup + Alembic + health | success (200, HSTS, docs 404) |
| API end-to-end + cross-user isolation | pass |
| Analytics equivalence check | exact match with the previous implementation across 5 time windows |
| Secret scan (tree + 19 commits) | no secrets found |

Detailed evidence, command output and the deployment gate are in
`docs/FINAL_PRE_DEPLOYMENT_AUDIT_REPORT.md`.
