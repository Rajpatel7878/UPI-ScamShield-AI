# Android Quick Detection API (Phase 2)

**Project:** UPI ScamShield AI
**Endpoint:** `POST /api/v1/detect/quick`
**Authentication:** `X-Device-Token` (Phase 1 device credential, **not** a user JWT)
**Scope:** backend only. No Android project, no frontend change.

Related documents:

- [`ANDROID_IMPLEMENTATION_PLAN.md`](./ANDROID_IMPLEMENTATION_PLAN.md) — Phase 0 design
- [`ANDROID_DEVICE_AUTH.md`](./ANDROID_DEVICE_AUTH.md) — Phase 1 device credentials

---

## 1. Purpose

The Android notification listener needs a fast, privacy-preserving scam check for a
single message. This endpoint:

- authenticates an enrolled device (no password, no JWT, no shared API key),
- masks credential values before any analysis,
- reuses the existing rule engine, URL analyser, AI provider chain and hybrid scorer,
- returns a compact, content-free risk assessment,
- stores nothing by default.

The existing full-analysis endpoint `POST /api/v1/detect/analyze` is unchanged and
still requires a user JWT.

---

## 2. Authentication

```http
X-Device-Token: ssdev_<placeholder-token>
```

- Issued by `POST /api/v1/devices/register` (see `ANDROID_DEVICE_AUTH.md`).
- A user JWT is **never** accepted here, and a device token is **never** accepted by
  the JWT-protected endpoints.
- Missing, malformed, unknown, revoked or expired tokens all return the same generic
  `401` response. The device token is never logged.

---

## 3. Request

```http
POST /api/v1/detect/quick
X-Device-Token: ssdev_<placeholder-token>
Content-Type: application/json

{
  "text": "Your KYC is expired. Share your OTP immediately.",
  "sender": "BANK-ALERT",
  "source_app": "com.example.sms"
}
```

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `text` | string | yes | 1–2,000 characters; must not be blank; no NUL/control characters (newlines and tabs allowed) |
| `sender` | string | no | ≤120 characters, trimmed; blank becomes `null`; no control characters |
| `source_app` | string | no | ≤255 characters, trimmed; blank becomes `null`; no control characters |

Unknown fields are ignored, matching the existing `POST /detect/analyze` convention.
Request bodies larger than the global 1 MB guard return `413`; `text` longer than
2,000 characters returns `422`.

---

## 4. Response

```json
{
  "risk_score": 100,
  "risk_level": "Critical",
  "category": "Credential Theft",
  "warning_text": "High scam risk. Do not share OTP or UPI PIN or pay. Verify independently.",
  "reasons": ["Asks for an OTP", "Asks for a UPI PIN", "Asks for bank or card details"],
  "analysis_type": "rule_based_only"
}
```

| Field | Type | Notes |
| --- | --- | --- |
| `risk_score` | integer | 0–100 |
| `risk_level` | `Low` / `Medium` / `High` / `Critical` | Existing bands: 0–29, 30–59, 60–79, 80–100 |
| `category` | string | Existing detection categories (`Credential Theft`, `Fake Verification`, `Pressure Tactic`, `Fake Reward`, `Advance Fee`, `Payment Fraud`, `Impersonation`, `Suspicious Link`, `General Scam`); a validated AI result may supply the category, exactly as `/detect/analyze` already allows |
| `warning_text` | string | ≤120 characters, generic and content-free |
| `reasons` | string[] | 0–3 entries, derived from matched rule names only |
| `analysis_type` | string | `hybrid` = validated AI merged, `rule_and_url` = rules + URL only, `rule_based_only` = rules only |

The response never contains the submitted text, sender, credentials, token material or
raw provider output. Reasons use fixed labels for known rule names, so AI-generated text
cannot echo message content back to the client.

---

## 5. Status codes

| Code | Condition |
| --- | --- |
| 200 | Analysis completed. AI failure/timeout still returns 200 with the rule result. |
| 401 | Missing, malformed, unknown, revoked, expired or inactive-device token. |
| 413 | Body larger than the global 1 MB request guard. |
| 422 | Validation failure: blank text, text over 2,000 characters, control characters, wrong types, malformed JSON. |
| 429 | More than 30 requests per minute for this device. `Retry-After` is set. |

---

## 6. Processing pipeline

Implemented in `backend/app/services/detection/quick_analysis.py`; the route only does
authentication, rate limiting, optional metadata storage and response modelling.

1. **Authenticate** with `app.core.device_auth.get_current_device`.
2. **Validate** the request with Pydantic (`QuickDetectionRequest`).
3. **Mask** credential values with `app.services.privacy.masking.mask_sensitive_text`.
4. **Rules**: existing `RuleDetector` / `RiskScorer` on the masked text.
5. **URL analysis**: existing passive `URLDetector`; base score is
   `max(rule_score, url_score)`, the same rule the full endpoint uses.
6. **AI policy**: only when `35 <= base_score <= 75`. Below 35 the message is ordinary
   traffic; above 75 the rule result is already conclusive, so no provider latency is
   added.
7. **AI chain**: the existing `app.api.routes.detect._analyze_with_ai`
   (OpenRouter → Gemini) with a bounded timeout
   (`QUICK_SCAN_AI_TIMEOUT_SECONDS`, default 4.5 s).
8. **Hybrid scoring**: only when a validated AI result exists, through the existing
   `HybridScorer` with the unchanged 60% rule / 40% AI formula.
9. **Respond** with score, band, category, warning, reasons and `analysis_type`.

AI invocation thresholds control *provider usage only*; they are not risk
classification thresholds and do not change `RISK_BANDS`.

### Fallback behaviour

- No provider configured → no external call, rule/URL result returned.
- Provider error, timeout or malformed output → rule/URL result returned, HTTP 200.
- Provider retries are the existing bounded retries inside the provider services; the
  outer `asyncio.wait_for` bound is authoritative, so a slow provider cannot hold the
  request open past the configured timeout.

---

## 7. Privacy and masking

Masking happens **before** rules run, so neither the provider chain nor the AI sees
credentials.

| Masked | Example |
| --- | --- |
| OTP / verification codes | `Your OTP is 482913` → `Your OTP is [REDACTED]` |
| UPI PIN / M-PIN (label or enter/share context) | `UPI PIN 1234`, `PIN enter karo 1234` → `[REDACTED]` |
| Card numbers (Luhn-valid or with card context) | `4111 1111 1111 1111` → `[REDACTED]` |
| CVV / CVC / security code | `CVV 987` → `[REDACTED]` |
| Passwords (`password is <value>`) | `password is Secret123` → `[REDACTED]` |
| Account numbers, Aadhaar | `Account number 123456789012` → `[REDACTED]` |

Deliberately **not** masked: amounts (`Rs 5,000`), dates, OTP validity (`10 minutes`),
order numbers and ordinary chat numbers. Masking is idempotent, and the credential label
is preserved so rule detection still matches.

The existing `redact_credentials()` inside the Gemini and OpenRouter services is
unchanged and remains a second safety net for any text that reaches a provider.

Guarantees:

- raw notification text is never logged (logs contain only method, path, status, timing
  and, on failure, a generic message);
- raw or masked message text is never stored in the database;
- exception details are never returned to the client;
- provider errors are logged by exception type only.

---

## 8. Optional metadata storage

Default: `STORE_QUICK_SCANS=false` → **no database writes at all** for quick scans.

When `STORE_QUICK_SCANS=true`, one row per scan is added to `quick_scan_events`:

| Column | Content |
| --- | --- |
| `user_id` | owning user |
| `device_id` | calling device |
| `risk_score` | 0–100 |
| `risk_level` | band |
| `category` | detection category |
| `source_app` | optional package name |
| `created_at` | UTC timestamp |

There is no column for text, sender, OTP, PIN, password or card data. A storage failure
is logged without content and never fails the analysis.

---

## 9. Rate limiting

- 30 requests per minute per authenticated **device** (configurable with
  `RATE_LIMIT_QUICK_SCAN_PER_MINUTE`).
- Sliding 60-second window in `app.core.device_rate_limit`.
- Exceeding the limit returns `429` with `Retry-After` (seconds until a slot frees).
- The limiter is applied after authentication and before any detection work.
- Windows are isolated per device; other devices and other endpoints are unaffected.
- **Limitation:** like the existing request guard, the window is in-process. A
  multi-worker or multi-instance deployment needs a shared store (for example Redis) for
  an exactly global limit. Until then the effective limit is per worker.

The existing per-IP request guard still applies to this path as a coarse outer bound and
does not change limits on other endpoints.

---

## 10. Performance

Measured locally on this repository (SQLite, no AI provider configured, 30 requests
including the 429):

- rule-only requests: **~7–9 ms** server processing per request (middleware access log);
- no database write by default (one device lookup, one optional `last_used_at` update at
  most once per minute);
- AI is skipped entirely outside 35–75, so high-risk and low-risk notifications never
  wait for a provider.

AI-assisted requests take provider latency plus the hybrid calculation. The endpoint
bounds that with `QUICK_SCAN_AI_TIMEOUT_SECONDS` (default 4.5 s) and always returns a
rule-based result if the bound is hit. A hard guarantee of "under five seconds" is not
claimed for AI-assisted requests: the provider can be slower, and Python cannot cancel a
blocking thread, so the request returns on time while the abandoned call finishes in the
background.

---

## 11. Configuration

```env
# Never persist quick scans unless explicitly enabled.
STORE_QUICK_SCANS=false
# Wall-clock bound for AI assistance on the quick path.
QUICK_SCAN_AI_TIMEOUT_SECONDS=4.5
# Per-device sliding window.
RATE_LIMIT_QUICK_SCAN_PER_MINUTE=30
```

Device settings from Phase 1 still apply (`DEVICE_TOKEN_EXPIRE_DAYS`,
`MAX_ACTIVE_DEVICES_PER_USER`).

---

## 12. OpenAPI

The endpoint is registered in the FastAPI app and appears at
`/docs` / `/api/v1/openapi.json` with:

- the `X-Device-Token` header parameter (from the device-auth dependency),
- `QuickDetectionRequest` and `QuickDetectionResponse` schemas,
- documented `401`, `422` and `429` responses, AI fallback and privacy behaviour.

---

## 13. curl examples

Placeholder tokens only — never paste a real token into documentation, chat or logs.

```bash
BASE=http://localhost:8000/api/v1

# 1. Enroll (user JWT from /auth/login) and capture the token once.
JWT="<placeholder-jwt>"
TOKEN=$(curl -s -X POST "$BASE/devices/register" \
  -H "Authorization: Bearer $JWT" \
  -H 'Content-Type: application/json' \
  -d '{"device_name":"Raj Android Phone"}' \
  | python -c "import sys,json;print(json.load(sys.stdin)['token'])")

# 2. Quick check of a suspicious notification.
curl -s -X POST "$BASE/detect/quick" \
  -H "X-Device-Token: $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
        "text": "Your KYC is expired. Share your OTP immediately.",
        "sender": "BANK-ALERT",
        "source_app": "com.example.sms"
      }'

# 3. Missing token -> 401
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$BASE/detect/quick" \
  -H 'Content-Type: application/json' -d '{"text":"hello"}'

# 4. Oversized text -> 422
python -c "import json;print(json.dumps({'text':'a'*2001}))" > /tmp/big.json
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$BASE/detect/quick" \
  -H "X-Device-Token: $TOKEN" -H 'Content-Type: application/json' --data-binary @/tmp/big.json

# 5. Rate limit (31st request in a minute) -> 429 + Retry-After
for i in $(seq 1 31); do
  curl -s -o /dev/null -w '%{http_code} ' -X POST "$BASE/detect/quick" \
    -H "X-Device-Token: $TOKEN" -H 'Content-Type: application/json' -d '{"text":"hello"}'
done; echo
```

---

## 14. Tests

`backend/tests/test_quick_detection.py` (25 behaviours) and
`backend/tests/test_masking.py` cover:

- authentication: missing, invalid, revoked and valid device tokens;
- validation: blank text, 2,000-character boundary and 2,001 rejection, malformed
  payloads, unknown fields;
- detection paths: low score, high score, borderline AI, AI failure, AI exception,
  boundary bands, reasons ≤3, warning ≤120 characters;
- privacy: OTP/PIN masking before AI, no raw text in logs, no persistence by default,
  metadata-only persistence when enabled, approved column set;
- rate limiting: 30 allowed, 31st `429` with `Retry-After`, isolation between devices.

All provider calls are mocked; no API keys or credits are used.

Run:

```bash
cd backend
./.venv/Scripts/python.exe -m pytest -q tests/test_quick_detection.py tests/test_masking.py
./.venv/Scripts/python.exe -m pytest -q
```

---

## 15. Known limitations

- Rate limiting is per worker (documented above).
- AI-assisted latency depends on the provider; the timeout bounds the response, not the
  provider thread.
- `sender` is accepted and stored (when storage is enabled) but not used by scoring; the
  existing rule engine is message-text based.
- Detection remains heuristic. `Low` means "no strong signals", not "verified safe".
- There is no per-path body-size cap beyond validation; the global 1 MB guard applies.
