# UPI ScamShield AI

**Detect. Analyze. Protect.**

A full-stack, explainable risk-analysis assistant for suspicious UPI and banking
messages. Submit an SMS, WhatsApp message, payment request or link and get a
risk score, the indicators that drove it, and practical safety guidance.

[![Backend tests](https://img.shields.io/badge/backend%20tests-104%20passing-brightgreen)](#13-testing)
[![Frontend build](https://img.shields.io/badge/frontend%20build-passing-brightgreen)](#13-testing)
[![npm audit](https://img.shields.io/badge/npm%20audit-0%20vulnerabilities-brightgreen)](#13-testing)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

> **Honest status:** the application is complete and verified locally. It is
> **prepared for deployment but not deployed yet**, so no live URL is published
> here. Detection results are heuristic risk assessments — not proof that a
> message is fraudulent — and the project has no formal security certification.

---

## 1. Project overview

UPI ScamShield AI is an individual full-stack project that helps users reason
about payment-fraud messages before they act. It combines a transparent
rule-based engine, passive URL inspection and optional Google Gemini analysis
into one risk score with an explanation.

The system is built as a React single-page application backed by a FastAPI API,
with JWT authentication, per-user scan history and analytics, and a Scam
Awareness Center with guides, safety rules, emergency guidance, a quiz and
official reporting links.

## 2. Problem statement

UPI fraud is cheap to run and hard to spot. Attackers impersonate banks, send
fake KYC or account-blocking warnings, request "verification" OTPs and UPI PINs,
push collect requests, and share shortened links that lead to credential-harvesting
pages. The warning signs are scattered: urgency, grammar, a mismatched domain, an
unusual payment request. Under pressure, users — especially first-time digital
payment users — have seconds to decide.

Most people have no simple way to ask: *why does this message look wrong?*

## 3. Solution

Submit the message or link. ScamShield AI:

1. normalizes the text and evaluates weighted fraud rules;
2. passively parses every link (no link is ever opened);
3. optionally asks Gemini for a second opinion when the operator configures a
   key — and falls back cleanly when it is unavailable;
4. returns a 0–100 risk score, a risk level, the indicator list with severity and
   source, and concrete recommendations;
5. stores only the analysis metadata, never the submitted message text.

## 4. Key features

- **Explainable rule engine** — every indicator carries a name, category,
  severity, description and `rule_based` / `url_based` / `gemini` source.
- **Hybrid scoring** — rules and URL findings form the base score; validated AI
  output is merged with documented weights and never overrides missing evidence.
- **Passive URL analysis** — IP hosts, suspicious TLDs, shorteners, deep
  subdomains, credential user-info, punycode, risky keywords and ports. No DNS
  lookups, HTTP requests or page fetches.
- **Optional Gemini analysis** — backend-only key, JSON-delimited untrusted
  input, strict schema validation, bounded retries and timeouts.
- **Authentication** — Argon2id password hashing and signed JWTs with full claim
  verification.
- **Per-user history** — filtering, sorting, pagination, scan detail, delete-all,
  and owner-only isolation enforced in the database query.
- **Dashboard and analytics** — user-scoped counts, charts and empty states.
- **Scam Awareness Center** — scam guides, warning signs, emergency response,
  official reporting links, FAQ, safety checklist and a knowledge quiz.
- **Production-minded UI** — responsive layout, keyboard navigation, focus
  management, labelled charts, reduced-motion support.
- **Privacy by design** — message text is not persisted; URL query values are
  redacted in responses.

## 5. How the system works

```text
Submitted message / URL
        │
        ▼
Text normalization  ──►  Rule engine (weighted, explainable)
        │                        │
        ├──►  Passive URL analysis (no fetching)
        │                        │
        └──►  Gemini analysis (optional, validated) 
                                 │
                                 ▼
                    Hybrid risk scoring (0–100 + level)
                                 │
                                 ▼
        Score · level · category · indicators · recommendations
                                 │
                                 ▼
              Metadata-only scan record for the signed-in user
```

| Score band | Level | Meaning |
| --- | --- | --- |
| 0–29 | Low | No strong indicators found — still verify independently |
| 30–59 | Medium | Suspicious patterns; confirm through official channels |
| 60–79 | High | Multiple fraud indicators; do not act on the message |
| 80–100 | Critical | Strong fraud pattern; do not share credentials or pay |

## 6. Technology stack

| Area | Technology |
| --- | --- |
| Frontend | React 19, React Router 7, Vite 8, Tailwind CSS 4 |
| UI | Lucide icons, Recharts |
| HTTP | Axios |
| Backend | Python 3.11+ (developed on 3.14), FastAPI 0.162, Uvicorn |
| Validation | Pydantic 2 / pydantic-settings |
| Database | SQLAlchemy 2.1 — SQLite locally, PostgreSQL (psycopg 3) in production |
| Migrations | Alembic |
| Authentication | PyJWT (HS256), Argon2 via passlib |
| AI (optional) | Google Gemini via `google-genai` |
| Tests | pytest, httpx TestClient |

## 7. Architecture

```text
Browser (React SPA, Vite)
   │  HTTPS JSON + Bearer JWT
   ▼
FastAPI  /api/v1
   ├── request guards: size limit · rate limit · security headers
   ├── auth: JWT · Argon2
   ├── routes: auth · detect/history · dashboard/analytics · health
   ├── detection: rules → URL → Gemini → hybrid scoring
   ├── SQLAlchemy ──► SQLite (local) / PostgreSQL (production)
   └── Google Gemini API (optional, backend-only key)
```

Deployment target:

```text
Browser → Vercel (React SPA) → HTTPS API → Render (FastAPI) → PostgreSQL
                                                   └──► Google Gemini API
```

Full details: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) ·
[`docs/DEPLOYMENT_ARCHITECTURE.md`](docs/DEPLOYMENT_ARCHITECTURE.md) ·
[`submission/TECHNICAL_ARCHITECTURE.md`](submission/TECHNICAL_ARCHITECTURE.md).

## 8. Project structure

```text
UPI-ScamShield-AI/
├── backend/
│   ├── app/
│   │   ├── api/              # system, auth, detection/history, dashboard/analytics
│   │   ├── core/             # settings, logging, security, dependencies, errors, middleware
│   │   ├── database/         # engine, sessions, URL normalization, schema verification
│   │   ├── models/           # User, Scan
│   │   ├── schemas/          # request/response contracts
│   │   └── services/         # auth service + detection pipeline
│   ├── alembic/              # migration environment and versions
│   ├── tests/                # 104 backend tests
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/       # UI, layout, landing, detection, dashboard, awareness
│   │   ├── context/          # authentication state
│   │   ├── data/awareness/   # static educational content
│   │   ├── pages/            # landing, auth, dashboard, detection, history, analytics, awareness
│   │   ├── routes/
│   │   └── services/         # axios client, health service
│   ├── vercel.json
│   └── .env.example
├── docs/                     # architecture, deployment runbook, QA and final reports
├── submission/               # hackathon submission package
├── render.yaml               # Render Blueprint (backend + PostgreSQL)
├── .gitignore
├── LICENSE
└── README.md
```

## 9. Screenshots

Screenshots are captured from the running application only — no mock-ups or
generated images are committed. The capture checklist (view, viewport, expected
state) is in [`docs/SCREENSHOTS_AND_DEMO.md`](docs/SCREENSHOTS_AND_DEMO.md).

| # | View | File to add |
| --- | --- | --- |
| 1 | Landing page | `docs/screenshots/01-landing.png` |
| 2 | Dashboard | `docs/screenshots/02-dashboard.png` |
| 3 | Detection interface | `docs/screenshots/03-detection.png` |
| 4 | High-risk detection result | `docs/screenshots/04-high-risk-result.png` |
| 5 | URL analysis result | `docs/screenshots/05-url-result.png` |
| 6 | Scan history | `docs/screenshots/06-history.png` |
| 7 | Analytics | `docs/screenshots/07-analytics.png` |
| 8 | Scam Awareness Center | `docs/screenshots/08-awareness.png` |
| 9 | Mobile layout | `docs/screenshots/09-mobile.png` |

> These files do not exist yet; capture them from the verified deployment (or a
> local run) before publishing, then uncomment the embed lines below.

<!--
![Landing page](docs/screenshots/01-landing.png)
![Detection result](docs/screenshots/04-high-risk-result.png)
-->

## 10. Installation

Prerequisites: Node.js 20+, Python 3.11+ (developed on 3.14), Git.

```bash
git clone https://github.com/Rajpatel7878/UPI-ScamShield-AI.git
cd UPI-ScamShield-AI
```

## 11. Local setup

### Backend

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate        # Windows Git Bash
# source .venv/bin/activate          # macOS / Linux
pip install -r requirements.txt      # add -r requirements-dev.txt for pytest
cp .env.example .env                 # then edit if needed
alembic upgrade head                 # create the schema through migrations
uvicorn app.main:app --reload --port 8000
```

Health check: <http://localhost:8000/api/v1/health>
API docs: <http://localhost:8000/docs>

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open <http://localhost:5173>. The dev server uses `strictPort`, so port 5173 must
be free.

## 12. Environment variables

Only `.env.example` templates are tracked. Real `.env` files, databases, virtual
environments and build output are gitignored.

### Backend

| Variable | Default | Notes |
| --- | --- | --- |
| `APP_NAME` | `UPI ScamShield AI` | Service name in API metadata |
| `APP_VERSION` | `1.0.0` | Reported API version |
| `ENVIRONMENT` | `development` | `production` enables HSTS and fail-fast checks |
| `DEBUG` | `true` | Set `false` in production |
| `ENABLE_DOCS` | `true` | Serves `/docs`, `/redoc` and the OpenAPI schema |
| `LOG_FORMAT` | `text` | `json` for structured hosting logs |
| `LOG_LEVEL` | `INFO` | |
| `DATABASE_URL` | `sqlite:///./scamshield.db` | `postgres://` / `postgresql://` are normalized to psycopg 3 |
| `API_PREFIX` | `/api/v1` | API route prefix |
| `FRONTEND_URL` | `http://localhost:5173` | Primary CORS origin (exact match, no trailing slash) |
| `CORS_ORIGINS` | empty | Optional comma-separated extra origins; wildcards discarded |
| `JWT_SECRET_KEY` | empty | **Required in production**, 32+ characters. Empty in development uses an ephemeral secret that invalidates sessions on restart |
| `JWT_ALGORITHM` | `HS256` | HS256/384/512 only |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | 5–1440 |
| `RATE_LIMIT_LOGIN_PER_MINUTE` | `10` | Per client IP and path |
| `RATE_LIMIT_REGISTER_PER_5_MINUTES` | `5` | |
| `RATE_LIMIT_ANALYZE_PER_MINUTE` | `30` | |
| `RATE_LIMIT_API_PER_MINUTE` | `300` | |
| `TRUST_PROXY_HEADERS` | `false` | Enable only behind a trusted reverse proxy |
| `MAX_REQUEST_BYTES` | `1048576` | Declared body limit |
| `GEMINI_API_KEY` | empty | Optional, backend-only |
| `GEMINI_MODEL` | `gemini-2.5-flash` | |
| `GEMINI_TIMEOUT_SECONDS` | `30` | Provider request timeout |
| `GEMINI_MAX_RETRIES` | `2` | Bounded retries |

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

### Frontend

| Variable | Default | Notes |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:8000/api/v1` | Must include `/api/v1`. Required for production builds |

Only `VITE_`-prefixed variables reach the browser. Never put backend secrets in a
frontend environment file.

## 13. API documentation

Base URL: `/api/v1`. Interactive docs: `/docs` and `/redoc` (when
`ENABLE_DOCS=true`). No public API URL is published until a deployment is
verified.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/` | No | API metadata |
| `GET` | `/health` | No | Liveness + database connectivity + AI configuration state (`503` if the database is unreachable) |
| `GET` | `/system/info` | No | Safe module metadata |
| `POST` | `/auth/register` | No | Create an account |
| `POST` | `/auth/login` | No | Obtain a bearer token |
| `GET` | `/auth/me` | Yes | Current user profile |
| `POST` | `/auth/logout` | Yes | Client-side logout acknowledgement |
| `POST` | `/detect/analyze` | Yes | Analyze content and persist the result metadata |
| `GET` | `/detect/history` | Yes | Paginated, filtered, sorted history |
| `GET` | `/detect/history/{scan_id}` | Yes | Owner-only scan detail |
| `DELETE` | `/detect/history` | Yes | Delete all scans for the current user |
| `GET` | `/dashboard/stats` | Yes | Dashboard statistics |
| `GET` | `/analytics/overview` | Yes | Extended analytics |

```bash
# Register and get a token (fictional data)
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Test User","email":"test@example.com","password":"Test-Passw0rd!"}'

curl -X POST http://localhost:8000/api/v1/detect/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"content":"Your KYC is expiring. Share the OTP at http://bit.ly/example now.","content_type":"sms"}'
```

Response (abridged):

```json
{
  "success": true,
  "scan_id": "1",
  "analysis_type": "rule_and_url",
  "risk_score": 85,
  "risk_level": "Critical",
  "category": "Credential Theft",
  "indicators": [
    { "name": "OTP Request", "severity": "critical", "source": "rule_based" },
    { "name": "URL shortener", "severity": "medium", "source": "url_based" }
  ],
  "recommendations": ["Never share your OTP with anyone.", "..."],
  "ai_analysis": { "status": "unavailable", "provider": "gemini", "result": null }
}
```

`content_type` accepts `sms`, `whatsapp`, `payment_request`, `general`, `url`.
Content is limited to 10,000 characters.

## 14. Security and privacy

- Argon2id password hashing; plaintext passwords are never stored or logged.
- JWTs verify `exp`, `iat`, `sub`, `iss`, `aud` and `type`, and only the
  configured HMAC algorithm is accepted.
- Production refuses to start without a strong `JWT_SECRET_KEY`.
- 1 MB request-body limit, per-IP sliding-window rate limits and security headers
  (`nosniff`, `DENY`, `no-referrer`, permissions policy, `no-store`, HSTS in
  production).
- Explicit CORS allowlist; every scan query is scoped by `user_id`.
- Submitted message text is **not persisted** and not written to logs.
- URL query values are redacted (`?token=[redacted]`) in responses and stored
  indicators; URL analysis never opens, resolves or fetches a link.
- Validation errors never echo submitted values.
- Gemini keys stay in backend environment variables; when enabled, submitted text
  is processed by Google under the Gemini API terms. Leave `GEMINI_API_KEY` empty
  to keep all processing local.

Known limitations are listed in [section 15](#15-known-limitations) and analysed
in [`docs/PHASE_17_QA_REPORT.md`](docs/PHASE_17_QA_REPORT.md).

## 15. Known limitations

- Detection is heuristic: it can miss scams and can flag legitimate messages. A
  low score is not a guarantee of safety.
- URL analysis is passive and cannot inspect live page content, domain age, TLS
  certificates or redirect chains.
- JWTs are stored in `localStorage`; a future XSS flaw could expose them. No
  Content Security Policy is configured yet, and logout is client-side only
  (tokens remain valid until expiry).
- Rate limiting is in-process and per instance; multi-instance deployments need
  a shared store.
- No email verification, password reset, MFA, account lockout or account deletion.
- Dashboard/analytics aggregate the user's scans in memory — fine for individual
  accounts, needs SQL aggregation at larger scale.
- No committed frontend unit or browser test suite; frontend verification is a
  production build, lint and manual/one-off browser journeys.
- PostgreSQL was verified at the SQL-dialect and driver level; no live PostgreSQL
  instance was exercised in this environment.
- The project has not had a professional penetration test or security
  certification.

## 16. Deployment

| Item | Status |
| --- | --- |
| Frontend build for production | Verified (`npm run build`) |
| Backend production mode (locally rehearsed) | Verified |
| Alembic migrations | Verified (fresh upgrade, no drift, PostgreSQL DDL) |
| `render.yaml` / `frontend/vercel.json` | Committed |
| Backend deployment | **Not deployed** |
| Frontend deployment | **Not deployed** |
| Managed PostgreSQL | **Not provisioned** |
| Live website / API URL | **None yet** |

Deployment requires account access that is not available to the development
environment. The complete runbook — every variable, the migration procedure, the
Render and Vercel steps and the live verification checklist — is in
[`docs/DEPLOYMENT_ARCHITECTURE.md`](docs/DEPLOYMENT_ARCHITECTURE.md).

## 17. Testing

```bash
cd backend
source .venv/Scripts/activate
pytest -v
```

**Result: 104 passed, 2 warnings (deprecation notices), 0 failed.**

| Check | Command | Result |
| --- | --- | --- |
| Backend tests | `pytest` | 104 passed |
| Frontend build | `npm run build` | Passed in 1.20 s; `dist` 1.1 MB |
| Frontend lint | `npm run lint` | 0 errors, 9 warnings |
| npm audit | `npm audit` | 0 vulnerabilities |
| pip audit | `python -m pip_audit` | No known vulnerabilities |
| pip check | `python -m pip check` | No broken requirements |
| Migration drift | `alembic check` | No new upgrade operations |
| Production startup with unmigrated DB | — | Refused with an actionable error |

Largest build chunks: entry `383.64 kB` (120.23 kB gzip), lazy Recharts chunk
`398.37 kB` (113.39 kB gzip), lazy Awareness `82.98 kB` (24.25 kB gzip), CSS
`76.58 kB` (12.17 kB gzip).

Previous QA (Phase 17) findings, fixes and residual risks:
[`docs/PHASE_17_QA_REPORT.md`](docs/PHASE_17_QA_REPORT.md).

## 18. Hackathon submission

The submission package lives in [`submission/`](submission/):

- [`PROJECT_DESCRIPTION.md`](submission/PROJECT_DESCRIPTION.md)
- [`TECHNICAL_ARCHITECTURE.md`](submission/TECHNICAL_ARCHITECTURE.md)
- [`DEMO_SCRIPT.md`](submission/DEMO_SCRIPT.md)
- [`PRESENTATION_OUTLINE.md`](submission/PRESENTATION_OUTLINE.md)
- [`SUBMISSION_CHECKLIST.md`](submission/SUBMISSION_CHECKLIST.md)

Screenshots and demo recording guidance:
[`docs/SCREENSHOTS_AND_DEMO.md`](docs/SCREENSHOTS_AND_DEMO.md).
Final project report: [`docs/FINAL_PROJECT_REPORT.md`](docs/FINAL_PROJECT_REPORT.md).

## 19. Future improvements

- Move tokens to HttpOnly cookies with refresh rotation and server-side
  revocation, and add a strict Content Security Policy.
- Shared rate-limit store (Redis) and horizontally scaled workers.
- SQL-side aggregation for dashboard and analytics at scale.
- Frontend unit tests (Vitest) and a committed Playwright end-to-end suite.
- Live URL intelligence: reputation feeds, TLS and redirect inspection via an
  isolated, sandboxed fetcher — never from the API process.
- Hindi and regional-language detection, QR/UPI intent parsing, screenshot OCR.
- Email verification, password reset, MFA and account deletion.
- Uptime monitoring, error tracking and automated database backups.

## 20. Developer

**Raj Patel** — individual project (design, frontend, backend, detection engine,
security and documentation).
GitHub: [@Rajpatel7878](https://github.com/Rajpatel7878)

## License

Released under the [MIT License](LICENSE).
