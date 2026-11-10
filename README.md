# UPI ScamShield AI

**Detect. Analyze. Protect.**

UPI ScamShield AI is a full-stack educational fraud-analysis application. It
combines explainable rule-based detection, passive URL inspection and optional
Google Gemini assistance to produce a risk score, indicators and practical
safety recommendations for a suspicious message or link.

> **Project status: Phase 17 complete.** The application is tested, hardened and
> prepared for the Phase 18 deployment work. It is **not deployed yet**. Results
> are heuristic risk assessments, not proof that a message is fraudulent, and
> the project has not received a formal penetration test or security
> certification.

---

## 1. Features

- Account registration and login with Argon2 password hashing and JWT sessions.
- User-scoped scam detection for SMS, WhatsApp, payment requests, general text
  and URLs.
- Explainable rule engine with severity, category, description and source for
  every indicator.
- Passive URL analysis: no URL is ever opened, fetched or followed.
- Optional Gemini analysis with strict output validation; rules still work when
  Gemini is unavailable.
- Scan history with filters, sorting, pagination, detail view and owner-only
  data isolation.
- Dashboard statistics and analytics with user-scoped aggregation.
- Scam Awareness Center with guides, safety rules, emergency guidance, FAQ and
  a knowledge quiz.
- Responsive dark UI with keyboard-accessible navigation, focus handling,
  reduced-motion support and labelled charts.

## 2. Technology Stack

| Area | Technology |
| --- | --- |
| Frontend | React 19, React Router 7, Vite 8, Tailwind CSS 4 |
| UI | Lucide icons, Recharts |
| HTTP | Axios |
| Backend | Python 3.14, FastAPI 0.162, Uvicorn |
| Validation | Pydantic 2 / pydantic-settings |
| Database | SQLAlchemy 2.1 with SQLite by default (PostgreSQL supported by URL) |
| Authentication | PyJWT (HS256 by default), Argon2 via passlib |
| AI (optional) | Google Gemini through `google-genai` |
| Backend tests | pytest + httpx |

## 3. Architecture

```text
React SPA (Vite, :5173)
        │  axios + Bearer token
        ▼
FastAPI (:8000) ── Request guards ── CORS ── Auth ── Detection ── History ── Analytics
        │
        ├── SQLite / PostgreSQL (users, scans)
        └── Google Gemini API (optional, backend-only key)
```

- API routes are aggregated under `/api/v1`.
- The frontend reads its API base URL from `VITE_API_BASE_URL`.
- Protected routes require a valid JWT. The backend enforces authentication and
  ownership independently of the frontend.
- Raw submitted message content is **not stored**. Scan records keep only the
  content type, score, level, category, summary, structured indicators,
  recommendations and timestamps.
- Database tables and indexes are created idempotently at startup. Existing
  records are never reset automatically.

## 4. Project Structure

```text
UPI-ScamShield-AI/
├── backend/
│   ├── app/
│   │   ├── api/              # health, auth, detection/history, dashboard/analytics
│   │   ├── core/             # config, JWT/password security, dependencies, errors, middleware
│   │   ├── database/         # engine, session factory, schema initialization
│   │   ├── models/           # User, Scan
│   │   ├── schemas/          # Pydantic request/response contracts
│   │   └── services/         # auth and detection engines (rules, URL, Gemini, scoring)
│   ├── tests/
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/       # UI, layout, detection, dashboard components
│   │   ├── context/          # authentication state
│   │   ├── data/awareness/   # static educational content
│   │   ├── pages/            # landing, auth, dashboard, detection, history, analytics, awareness
│   │   ├── routes/
│   │   └── services/
│   ├── package.json
│   └── .env.example
├── docs/
│   ├── ARCHITECTURE.md
│   └── PHASE_17_QA_REPORT.md
├── .gitignore
├── LICENSE
└── README.md
```

## 5. Local Installation

Prerequisites: Node.js 20+, Python 3.11+ (developed on 3.14), Git.

```bash
git clone <repository-url> UPI-ScamShield-AI
cd UPI-ScamShield-AI

cd backend
python -m venv .venv
source .venv/Scripts/activate        # Windows Git Bash
# source .venv/bin/activate          # macOS / Linux
pip install -r requirements.txt
cp .env.example .env

cd ../frontend
npm install
cp .env.example .env
```

Start the backend:

```bash
cd backend
source .venv/Scripts/activate
uvicorn app.main:app --reload --port 8000
```

Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

Open <http://localhost:5173>. API documentation is available at
<http://localhost:8000/docs> and <http://localhost:8000/redoc>.

## 6. Environment Variables

Only `.env.example` files are tracked. Real `.env` files, databases, virtual
environments and build output are gitignored.

### Backend

| Variable | Default | Notes |
| --- | --- | --- |
| `APP_NAME` | `UPI ScamShield AI` | Service name in API metadata |
| `APP_VERSION` | `1.0.0` | Reported API version |
| `ENVIRONMENT` | `development` | `production` enables production checks and HSTS |
| `DEBUG` | `true` | Set `false` in production |
| `DATABASE_URL` | `sqlite:///./scamshield.db` | SQLAlchemy database URL |
| `API_PREFIX` | `/api/v1` | API route prefix |
| `FRONTEND_URL` | `http://localhost:5173` | Primary allowed CORS origin |
| `CORS_ORIGINS` | empty | Optional comma-separated extra origins |
| `JWT_SECRET_KEY` | empty | **Required in production**, at least 32 characters. Empty in development uses an ephemeral secret and invalidates sessions on restart. |
| `JWT_ALGORITHM` | `HS256` | Only HS256, HS384 and HS512 are accepted |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | 5–1440 minutes |
| `RATE_LIMIT_LOGIN_PER_MINUTE` | `10` | Per client IP and path |
| `RATE_LIMIT_REGISTER_PER_5_MINUTES` | `5` | Per client IP and path |
| `RATE_LIMIT_ANALYZE_PER_MINUTE` | `30` | Per client IP and path |
| `RATE_LIMIT_API_PER_MINUTE` | `300` | General mutation/API bucket |
| `TRUST_PROXY_HEADERS` | `false` | Enable only behind a trusted reverse proxy |
| `MAX_REQUEST_BYTES` | `1048576` | Declared request body limit |
| `GEMINI_API_KEY` | empty | Optional; backend-only, never sent to the browser |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Gemini model name |
| `GEMINI_TIMEOUT_SECONDS` | `30` | Provider request timeout |
| `GEMINI_MAX_RETRIES` | `2` | Bounded retries |

Generate a secret with:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

### Frontend

| Variable | Default | Notes |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:8000/api/v1` | Must include `/api/v1` |

Vite exposes only `VITE_`-prefixed variables. Never put backend secrets in a
frontend environment file: anything bundled into the SPA is public.

## 7. Authentication and Security Architecture

- Passwords are hashed with **Argon2id**; plaintext passwords are never stored
  or logged. Password length is validated at 8–128 characters.
- Access tokens are signed JWTs with `sub`, `iat`, `exp`, `iss`, `aud` and a
  `type` claim. Decoding requires all of them and only the configured HMAC
  algorithm, which rejects `alg=none`, algorithm confusion, expired, tampered
  and wrong-key tokens.
- Production startup fails if `JWT_SECRET_KEY` is missing, shorter than 32
  characters or a known weak value.
- Login and registration return generic credential errors to avoid account
  enumeration. Duplicate registration returns a generic conflict message.
- All detection, history, dashboard and analytics endpoints require
  authentication. Every scan query is scoped by `user_id`; another user's scan
  detail returns `404` rather than revealing that the record exists.
- Validation errors do not echo submitted values, so passwords and tokens are
  not reflected in responses. Unhandled exceptions return a generic 500 without
  stack traces while full details stay in server logs.
- Request guards enforce a 1 MB body limit, per-IP sliding-window rate limits
  and security headers (`X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy`, `Cache-Control: no-store` on API
  responses, and HSTS in production).
- CORS allows only `FRONTEND_URL` plus configured extra origins; wildcard
  origins are discarded.
- SQLAlchemy parameterizes queries. Sort fields, content types, risk levels and
  other filter options are allow-listed.
- The frontend uses `textContent`/React escaping for all dynamic content and
  does not use `dangerouslySetInnerHTML`. External awareness links use
  `rel="noopener noreferrer"`.

## 8. Privacy and Data Retention

- Submitted message text is processed in memory for the request and is **not
  stored** in the database or written to application logs.
- Scan records store only analysis metadata and results. `content_hash` is not
  populated.
- URL query values are redacted in API responses (`?token=[redacted]`) before
  being stored in indicators or displayed. Host and path remain visible for
  explainability.
- Password hashes, JWT secrets and Gemini API keys are never returned by APIs or
  included in frontend bundles.
- Users can delete all of their scan history from the History page or via
  `DELETE /api/v1/detect/history`. There is no automatic retention expiry and no
  per-scan deletion endpoint yet.
- Account deletion, email verification and password reset are not implemented.

## 9. Gemini API Processing Disclosure

Gemini analysis is optional and only runs when `GEMINI_API_KEY` is configured.

When enabled, the submitted message or URL text and its content type are sent
from the backend to the Google Gemini API. That content is therefore processed
by Google under the applicable Gemini API terms and data policies. No message
is sent to Gemini when the key is absent, and the browser never receives the
key. Failures, timeouts and invalid model output fall back to rule and URL
analysis without failing the request.

The prompt treats submitted text as untrusted JSON-delimited data and the model
response is validated against a strict Pydantic schema. This reduces, but does
not eliminate, prompt-injection risk; model output is never executed or trusted
as instructions. If you do not want message content sent to a third party, leave
`GEMINI_API_KEY` empty.

## 10. URL Analysis and Limitations

URL analysis is **passive**. The application parses submitted text and applies
heuristics; it does not open links, send HTTP requests, resolve DNS, follow
redirects or fetch external pages. This prevents SSRF and drive-by exposure but
means the analyzer cannot inspect live page content.

Checks include IP-address hosts, suspicious TLDs, URL shorteners, excessive
subdomains, credential-like user-info, punycode/Unicode normalization, risky
keywords and unusual ports. Query values are redacted in responses.

Limitations: heuristics can produce false positives and false negatives; a
short, simple message containing a shortened URL may receive a low score because
the message-level rule bands dominate. Domain age, TLS certificates, live
content and reputation feeds are not checked. A low score is not a guarantee of
safety.

## 11. API Overview

Base URL: `/api/v1`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/` | No | API metadata |
| `GET` | `/health` | No | Service and database health |
| `GET` | `/system/info` | No | Safe module metadata |
| `POST` | `/auth/register` | No | Create an account |
| `POST` | `/auth/login` | No | Obtain a bearer token |
| `GET` | `/auth/me` | Yes | Current user profile |
| `POST` | `/auth/logout` | Yes | Client-side logout acknowledgement |
| `POST` | `/detect/analyze` | Yes | Analyze message or URL and persist result |
| `GET` | `/detect/history` | Yes | Paginated, filtered, sorted history |
| `GET` | `/detect/history/{scan_id}` | Yes | Owner-only scan detail |
| `DELETE` | `/detect/history` | Yes | Delete all scans for the current user |
| `GET` | `/dashboard/stats` | Yes | Dashboard statistics |
| `GET` | `/analytics/overview` | Yes | Extended analytics |

`POST /detect/analyze` accepts:

```json
{
  "content": "Your KYC is expiring. Share the OTP at http://bit.ly/example now.",
  "content_type": "sms"
}
```

Supported content types: `sms`, `whatsapp`, `payment_request`, `general`, `url`.
Content is limited to 10,000 characters.

Final analysis uses `max(rule_score, url_score)` as the base score. If Gemini
returns a validated result, the documented 60/40 hybrid merge is applied; if not,
rules and URL findings remain authoritative. URL-only severity bands are
Critical ≥80, High ≥20, Medium ≥10, Low below 10.

## 12. Testing and Dependency Audits

Backend (104 tests as of Phase 17):

```bash
cd backend
source .venv/Scripts/activate
pytest -v
```

Frontend build and lint:

```bash
cd frontend
npm run build
npm run lint
```

There is currently **no committed frontend unit or browser test suite** in the
repository. Phase 17 verified the production build, lint, a backend API journey
and a one-off Playwright/Chrome journey covering registration, detection, URL
redaction, history, analytics, the quiz, authorization, mobile navigation and
console errors. The Playwright dependency and script were not retained. See
`docs/PHASE_17_QA_REPORT.md` for the full results and remaining gaps.

Dependency audits:

```bash
cd frontend && npm audit
cd ../backend && python -m pip_audit
python -m pip list --outdated
```

Phase 17 results: `npm audit` reported **0 vulnerabilities**; `pip_audit`
reported **no known vulnerabilities** after replacing vulnerable `python-jose`
and its `ecdsa` dependency with PyJWT. Compatible outdated packages remain
(`fastapi` 0.162.2 → 0.162.3 and `tenacity` 9.1.4 → 9.2.1 at audit time) and
were intentionally not upgraded without a full retest.

## 13. Known Security Limitations

- JWTs are stored in `localStorage` in the browser, so an XSS vulnerability
  would expose the token. The app avoids unsafe HTML, but a strict Content
  Security Policy is not yet configured.
- Logout is client-side only. Access tokens remain valid until expiration
  (30 minutes by default); there is no server-side token revocation or refresh
  token rotation.
- Rate limiting is in-process and per worker. Multi-instance or multi-worker
  deployments need a shared store such as Redis. Proxy headers are trusted only
  when `TRUST_PROXY_HEADERS=true`.
- SQLite is the default for local development. Production concurrency and
  backups require PostgreSQL and a migration strategy.
- No account lockout, CAPTCHA, email verification, MFA or password reset.
- Dashboard and analytics currently load the user's scans into memory for
  aggregation; this is acceptable for individual accounts but should be moved
  to SQL aggregation at larger scale.
- Detection is heuristic. It can miss scams and can flag legitimate messages.
  URL content is never fetched, so live phishing pages cannot be confirmed.
- The project has not undergone a professional penetration test or formal
  security certification.

## 14. Quality Assurance Report

Phase 17 findings, fixes, test results, performance measurements, accessibility
changes, remaining risks and deployment readiness are documented in
[`docs/PHASE_17_QA_REPORT.md`](docs/PHASE_17_QA_REPORT.md).

## 15. Roadmap

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Full-stack foundation, routing, health API, CORS | Complete |
| 2 | Design system and component library | Complete |
| 3–7 | Database, detection engine, scan APIs, authentication, history | Complete |
| 8–14 | Detection intelligence, URL analysis, AI/hybrid scoring, UX | Complete |
| 15 | History, dashboard and security analytics | Complete |
| 16 | Scam Awareness and Education Center | Complete |
| 17 | Testing, security audit, performance optimization, QA report | Complete |
| 18 | Deployment preparation and release | Planned |

## 16. Troubleshooting

| Symptom | Fix |
| --- | --- |
| Backend unreachable | Start Uvicorn on port 8000 and check `VITE_API_BASE_URL` |
| CORS error | Make `FRONTEND_URL` exactly match the browser origin; restart Uvicorn |
| `JWT_SECRET_KEY must be set...` | Set a 32+ character secret when `ENVIRONMENT=production` |
| Sessions expire after restart | Set `JWT_SECRET_KEY` in development instead of using the ephemeral key |
| Port 5173 in use | Stop the process using it; the frontend uses `strictPort` |
| `No module named 'app'` | Run Uvicorn and pytest from `backend/` |

## License

Released under the [MIT License](LICENSE).
