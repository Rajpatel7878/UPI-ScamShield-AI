# Android Device Authentication (Phase 1)

**Project:** UPI ScamShield AI
**Scope:** backend only. No Android project, no quick-detection endpoint, no frontend change.
**Related plan:** [`ANDROID_IMPLEMENTATION_PLAN.md`](./ANDROID_IMPLEMENTATION_PLAN.md)

---

## 1. Overview

The Android app must call protected endpoints (for example `POST /api/v1/detect/quick`
in Phase 2) from a background notification listener. A background service cannot hold a
user password, and the existing JWT is short-lived and cannot be revoked server-side.

Phase 1 therefore adds a **per-install device credential**:

```text
Android app ──(user JWT, once)──► POST /api/v1/devices/register ──► device token
Android app ──(X-Device-Token)──► device-authenticated endpoints
```

Device tokens are completely separate from user JWTs:

| | User JWT | Device token |
| --- | --- | --- |
| Purpose | web session | one Android installation |
| Header | `Authorization: Bearer` | `X-Device-Token` |
| Lifetime | minutes | `DEVICE_TOKEN_EXPIRE_DAYS` (default 90 days) |
| Revocable | no | yes, per device |
| Issued by | `/api/v1/auth/login` | `/api/v1/devices/register` |

No shared API key is shipped in the APK, and no AI provider key is ever used by the
Android app.

---

## 2. Configuration

Added to `backend/app/core/config.py` and documented in `backend/.env.example`:

| Setting | Default | Meaning |
| --- | --- | --- |
| `DEVICE_TOKEN_EXPIRE_DAYS` | `90` | Lifetime of a newly issued or rotated device token (1–3650) |
| `MAX_ACTIVE_DEVICES_PER_USER` | `5` | Maximum number of live devices per user (1–100) |

```env
DEVICE_TOKEN_EXPIRE_DAYS=90
MAX_ACTIVE_DEVICES_PER_USER=5
```

Both defaults are safe for development and production. No secret is required for device
authentication: tokens are random values, not derived from `JWT_SECRET_KEY`.

---

## 3. Data model

`backend/app/models/device.py` → table `devices` (Alembic revision
`c3f7a1b9d4e2_create_android_devices_table`).

| Column | Type | Notes |
| --- | --- | --- |
| `id` | integer PK | |
| `user_id` | integer FK → `users.id`, `ON DELETE CASCADE` | owner |
| `device_name` | string(100) | validated display label |
| `device_token_hash` | string(64), unique index | SHA-256 hex digest only |
| `created_at` | timestamptz | UTC |
| `expires_at` | timestamptz | UTC |
| `revoked_at` | timestamptz, nullable | soft revocation timestamp |
| `last_used_at` | timestamptz, nullable | updated by device auth |
| `is_active` | boolean | administrative state; false after revocation |

Indexes: `ix_devices_token_hash` (unique, used for every device-authenticated request),
`ix_devices_user_active` (`user_id`, `is_active`, used for listing and the device limit),
`ix_devices_expires_at`.

There is no column that can hold a raw token. `Device.__repr__` deliberately omits the
hash so it cannot leak through logs.

---

## 4. Endpoints

All management endpoints require `Authorization: Bearer <JWT>`.
Owner scoping is applied in every query; another user's device returns **404**, never
403, so existence is not confirmed.

### 4.1 Register a device

```http
POST /api/v1/devices/register
Authorization: Bearer <JWT>
Content-Type: application/json

{ "device_name": "Raj Android Phone" }
```

`201 Created`:

```json
{
  "success": true,
  "device": {
    "id": 1,
    "device_name": "Raj Android Phone",
    "created_at": "2026-11-14T10:00:00+00:00",
    "expires_at": "2027-02-12T10:00:00+00:00",
    "last_used_at": null,
    "revoked_at": null,
    "is_active": true
  },
  "token": "ssdev_9sQ...redacted...",
  "token_type": "device"
}
```

The raw `token` appears **only** in this response (and in a rotation response). It is
never returned by any other endpoint, and it is never logged.

| Status | Condition |
| --- | --- |
| 201 | device registered |
| 401 | missing/invalid JWT |
| 409 | active device limit reached |
| 422 | invalid `device_name` or unknown fields |

`device_name` validation: 1–100 characters, no control characters, whitespace collapsed,
unknown fields rejected (`extra="forbid"`).

### 4.2 List devices

```http
GET /api/v1/devices
Authorization: Bearer <JWT>
```

```json
{ "success": true, "devices": [ { "id": 1, "device_name": "Raj Android Phone", "...": "..." } ] }
```

Only the caller's devices are returned, newest first. Tokens and hashes are never
included.

### 4.3 Revoke a device

```http
DELETE /api/v1/devices/{device_id}
Authorization: Bearer <JWT>
```

```json
{ "success": true, "device_id": 1, "revoked_at": "2026-11-14T10:05:00+00:00" }
```

Revocation is immediate and soft: `revoked_at` is set and `is_active` becomes `false`,
but the row is kept for audit. Revoking an already revoked device is idempotent.
A device that belongs to another user (or does not exist) returns 404.

### 4.4 Rotate a device token

```http
POST /api/v1/devices/{device_id}/rotate
Authorization: Bearer <JWT>
```

```json
{
  "success": true,
  "device": { "id": 1, "device_name": "Raj Android Phone", "expires_at": "2027-02-12T10:10:00+00:00", "...": "..." },
  "token": "ssdev_new...redacted...",
  "token_type": "device"
}
```

Rotation replaces the stored hash and resets expiry in a single UPDATE, so the previous
token stops authenticating immediately. Rotating a **revoked** device returns `409`;
register a new device instead. Another user's device returns `404`.

---

## 5. Token generation

`backend/app/core/device_auth.py`:

```python
DEVICE_TOKEN_PREFIX = "ssdev_"
DEVICE_TOKEN_BYTES = 32  # 256 bits

def generate_device_token() -> str:
    return DEVICE_TOKEN_PREFIX + secrets.token_urlsafe(DEVICE_TOKEN_BYTES)
```

- `secrets.token_urlsafe(32)` → 256 bits of cryptographically secure entropy.
- The `ssdev_` prefix makes a leaked token easy to recognise in scanners and secret
  detectors, and prevents any confusion with JWTs.
- Tokens are generated fresh for registration and for every rotation.
- The token is **not** derived from `JWT_SECRET_KEY` and is unrelated to the user's
  session.

## 6. Token hashing

```python
def hash_device_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
```

- Only the lowercase hex SHA-256 digest (64 characters) is stored, in a unique index.
- SHA-256 is appropriate here because the token is already 256 bits of random data; a
  password KDF (Argon2/bcrypt) would add latency to every background notification check
  without a meaningful security gain.
- Lookup is by hash. The digest is then re-compared with
  `hmac.compare_digest(stored, computed)` as defence in depth, satisfying the
  constant-time comparison requirement.
- Hashing, storage and comparison all happen server-side. The hash is never returned by
  an API response.

---

## 7. Device authentication

Reusable FastAPI dependency: `app.core.device_auth.get_current_device`.

```http
GET /api/v1/<protected>
X-Device-Token: ssdev_...
```

The dependency:

1. requires the header (missing → 401),
2. validates the token shape (`ssdev_` prefix, URL-safe characters, ≤256 chars;
   malformed → 401),
3. hashes the token and looks the device up by digest,
4. constant-time compares the stored digest,
5. rejects revoked (`revoked_at` set or `is_active` false) and expired devices,
6. rejects devices whose owner account is missing or inactive,
7. updates `last_used_at` (at most once per 60 seconds per device, and a failed update
   never fails the request),
8. returns the `Device` row.

Every failure returns the same generic response, so callers cannot distinguish an
unknown token from a revoked or expired one:

```http
401 Unauthorized
WWW-Authenticate: DeviceToken

{ "status": "error", "detail": "Invalid or expired device token.", "path": "..." }
```

The dependency is the only intended way for a route to accept a device token. A device
token is never accepted in `Authorization`, and a JWT is never accepted in
`X-Device-Token`.

---

## 8. Lifecycle: expiry, revocation, rotation

```text
register ──► active (expires_at = now + DEVICE_TOKEN_EXPIRE_DAYS)
   │             │
   │             ├── rotate ──► new hash + new expiry, old token invalid immediately
   │             ├── revoke ──► revoked_at set, is_active = false, 401 on next call
   │             └── expire ──► 401 after expires_at
   └── 409 when MAX_ACTIVE_DEVICES_PER_USER live devices already exist
```

- **Expiry** is checked on every authenticated request with timezone-safe comparison
  (`app.core.time_utils.as_utc`), so SQLite's naive datetimes and PostgreSQL's aware
  datetimes behave identically.
- **Revocation** is the primary "lost/stolen phone" control. It takes effect on the next
  request; there is no token cache.
- **Rotation** is for suspected token compromise without changing device identity,
  including refreshing an expired device.
- **Device limit** counts only live devices (active, not revoked, not expired), so
  revoking frees a slot immediately. The limit is per user.

---

## 9. Security properties

| Requirement | Implementation |
| --- | --- |
| JWT required for enrollment/management | `Depends(get_current_user)` on every `/devices` management route |
| Only token hashes stored | SHA-256 digest column; no raw-token column anywhere |
| Never log tokens | Tokens are only written to HTTP responses; logs contain path/status and `device_id` only |
| User-level isolation | All device queries filter `user_id`; cross-user access → 404 |
| Reject revoked/expired | Checked in `resolve_device` before any protected work |
| No internal exception leakage | `SQLAlchemyError` is caught, rolled back and reported as a generic 500 |
| No shared device API key | Each installation gets its own random token |
| Untouched detection logic | No changes to rules, hybrid scoring, Gemini or OpenRouter |
| Existing auth unchanged | `/auth/*` routes and JWT handling are unmodified |

Operational notes:

- Rate limiting for these routes comes from the existing request guard
  (`RATE_LIMIT_API_PER_MINUTE`), keyed per client and path.
- Device tokens are bearer-style credentials: anyone who obtains one can act as that
  device until it is revoked or expires. Treat the token as sensitive on the device.
- Device-authenticated routes are not exposed to browser CORS flows; the header is added
  by the Android client only.

---

## 10. Android secure token storage (for Phase 8+)

The backend contract is ready; the Android app must store the returned token safely:

1. **Never** write the token to `SharedPreferences` in plaintext, logs, analytics,
   crash reports, or `local.properties`.
2. Generate an AES-256 key in the **Android Keystore**
   (`KeyGenParameterSpec`, `setUserAuthenticationRequired(false)`,
   `BLOCK_MODE_GCM`, `ENCRYPTION_PADDING_NONE`).
3. Encrypt the token with AES-GCM; store only the ciphertext and IV (for example in
   DataStore or an encrypted preference entry). The key never leaves the Keystore.
4. Attach it with an OkHttp interceptor:

   ```kotlin
   request.newBuilder().header("X-Device-Token", token)
   ```

   Never log the `X-Device-Token` header in the logging interceptor.
5. Handle `401` by clearing the stored token and prompting re-enrollment; do not
   silently fall back to an unauthenticated call.
6. Keep the user JWT in memory for the enrollment call only, then discard it. The device
   token is the only long-lived credential the app holds.
7. Use HTTPS in release builds (`cleartextTrafficPermitted="false"`); allow cleartext only
   for `10.0.2.2`/`localhost` in debug.

---

## 11. Verification

```bash
cd backend
./.venv/Scripts/python.exe -m compileall -q app
./.venv/Scripts/python.exe -m pytest -q tests/test_device_auth.py
./.venv/Scripts/python.exe -m pytest -q
./.venv/Scripts/python.exe -m alembic upgrade head
```

`tests/test_device_auth.py` covers: registration without/with JWT, token returned only
once, hash-only storage, valid/invalid/expired/revoked token authentication, per-user
listing, cross-user revocation, rotation invalidation, and the active-device limit.

Manual check with curl:

```bash
BASE=http://localhost:8000/api/v1
JWT=$(curl -s -X POST "$BASE/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"..."}' | python -c "import sys,json;print(json.load(sys.stdin)['access_token'])")

TOKEN=$(curl -s -X POST "$BASE/devices/register" -H "Authorization: Bearer $JWT" \
  -H 'Content-Type: application/json' -d '{"device_name":"Raj Android Phone"}' \
  | python -c "import sys,json;print(json.load(sys.stdin)['token'])")

curl -s "$BASE/devices" -H "Authorization: Bearer $JWT"
# Device-authenticated endpoint arrives in Phase 2; until then expect 404/401 paths only.
curl -s -X DELETE "$BASE/devices/1" -H "Authorization: Bearer $JWT"
```

Confirm the raw token is absent from the database:

```bash
python -c "import sqlite3;print(sqlite3.connect('scamshield.db').execute('select device_token_hash from devices').fetchall())"
```

---

## 12. Next step (Phase 2)

Implement `POST /api/v1/detect/quick` authenticated with
`Depends(get_current_device)` and `X-Device-Token`, per sections 3.2 and 3.3 of
`docs/ANDROID_IMPLEMENTATION_PLAN.md`. Do not add the endpoint before Phase 2: this phase
intentionally exposes only device management and the reusable authentication dependency.
