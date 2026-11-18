# UPI ScamShield AI — Android Backend Integration (Phase 6)

**Scope:** Android app only (`android-app/`). Phase 1–5 behaviour, the backend, the AI
providers, the scoring formula and the React/Vite frontends are unchanged.

Phase 6 connects the Phase 5 notification listener to the existing backend and adds
reliable warning notifications and an in-app result screen.

---

## 1. Pipeline

```text
NotificationListenerService
  → validate monitoring + selected package
  → PreFilter (local)
  → Masker (local: OTP, UPI PIN, card, CVV, account/Aadhaar, password)
  → QuickDetectionRepository
  → POST /api/v1/detect/quick   (X-Device-Token)
  → backend rule/URL/AI pipeline (unchanged)
  → DetectionOutcome
  → metadata-only Room record
  → High/Critical warning notification
  → tap → in-app result screen
```

Filtering and masking always happen on the device before any network call.
Irrelevant notifications produce no request.

---

## 2. Backend contracts used (verified in source)

| Endpoint | Auth | Body | Success |
| --- | --- | --- | --- |
| `POST /api/v1/auth/login` | none | `{email, password}` | `200 {access_token, token_type}` |
| `POST /api/v1/devices/register` | `Authorization: Bearer <JWT>` | `{device_name}` | `201 {success, device{id,…}, token, token_type}` |
| `POST /api/v1/devices/{id}/rotate` | `Authorization: Bearer <JWT>` | none | `200` with a new `token` |
| `POST /api/v1/detect/quick` | `X-Device-Token: ssdev_…` | `{text, sender?, source_app?}` | `200 {risk_score, risk_level, category, warning_text, reasons, analysis_type}` |

Sources: `backend/app/api/routes/auth.py`, `devices.py`, `quick_detection.py`,
`backend/app/schemas/{auth,device,quick_detection}.py`.

Status handling relied on by the app:

- device registration limit → `409`
- unknown/revoked device, expired token → `401` (identical generic response)
- rate limit → `429` with `Retry-After`
- validation → `422`

The quick-detection request is built from the masked text only. `sender` is
intentionally omitted: an Android notification title can contain message content, and
the backend does not need it for scoring. `source_app` is the monitored package name.
`analysis_type` is mapped honestly (`hybrid` / `rule_and_url` / `rule_based_only`).

---

## 3. Device registration and authentication

### Enrollment flow

1. The user enters account email, password and a device name in **Settings → Device
   connection**.
2. `DeviceEnrollmentRepositoryImpl` calls `/auth/login` and keeps the JWT in a local
   variable for the duration of the request only.
3. It calls `/devices/register` with `Authorization: Bearer <JWT>`.
4. The returned device token is encrypted with AES-256-GCM using an Android Keystore
   key (`KeystoreTokenCipher`) and stored through `DataStoreTokenPersistence`.
5. The JWT and password are discarded; neither is persisted, logged or placed in an
   error message.
6. The device id and display name (non-sensitive) are stored in a separate DataStore
   (`DataStoreEnrolledDeviceStore`) so the token can be rotated later.

### Secure storage

- The token payload on disk is `base64(iv):base64(ciphertext)`. The Keystore key is
  generated on first use and is not backed up.
- No token or token hash is written to Room, SharedPreferences, `local.properties`,
  logs or analytics.
- The device id/name DataStore contains no credential.
- `observeHasToken()` drives the connected/not-connected UI.

### Rotation, expiry and revocation

- **Rotate**: Settings calls `/devices/{id}/rotate` after a fresh login. The backend
  invalidates the previous token immediately.
- **401/403 on quick detection**: `QuickDetectionRepositoryImpl` clears the stored token
  and returns `NotAuthorised`. No retry and no unauthenticated fallback happens.
- **409 while rotating** (revoked device): clear explanation to connect again.
- **404 while rotating** (device removed server-side): connect again.
- A missing token yields `NotEnrolled` and no network request.

No shared API key is embedded in the APK. The only long-lived credential is the
per-install device token.

### Backend URL

- Configurable in Settings; validated by `BackendUrlPolicy`.
- Debug allows `http://10.0.2.2:8000/` for the emulator and LAN/tunnel hosts.
- Release builds (`REQUIRE_HTTPS = true` plus the release network-security config)
  reject cleartext URLs.

---

## 4. Quick detection client

`QuickDetectionRepositoryImpl`:

- reads the current backend URL per call (Settings changes apply without restart);
- uses the existing `ApiClientFactory`/Retrofit client with bounded timeouts
  (5 s connect, 12 s read/write, 17 s call);
- sets `X-Device-Token` explicitly per request;
- imposes no application-level retries; OkHttp's bounded connection retry remains;
- validates locally before sending: blank text or text over 2,000 characters is
  rejected without a request;
- validates the response defensively: score must be 0–100, level must map to
  Low/Medium/High/Critical, category/warning must be usable, reasons are capped at
  three;
- never logs a request/response body or the token (there is no HTTP logging
  interceptor).

`NetworkModule` caches the Retrofit API per base URL.

---

## 5. Notification processing

`ScamNotificationListenerService` remains the only listener (Phase 5 service is reused;
no second listener exists).

For each posted notification:

1. Own-app notifications are discarded.
2. Empty notifications are discarded.
3. An in-memory key `package:id:textHash` suppresses duplicates; removal frees the key.
4. Monitoring must be ON and the package must be in `selectedPackages`.
5. `NotificationProcessor.process()` runs the Phase 4 pre-filter and masker.
6. If the pre-filter declines, no backend request is made.
7. The masked text is sent to the backend with the monitored package and the
   notification post time.
8. On success, a metadata-only `DetectionRecord` is stored.
9. High/Critical results additionally produce a warning when warning notifications are
   enabled.

All work runs on `Dispatchers.IO`. The service catches every processing exception and
never crashes. Failure logs contain only a failure kind, at most once per ten minutes
per kind, and no content.

**No local score fallback:** when the backend is unreachable, times out, returns 5xx/429
or an unusable payload, the app stores nothing and shows no warning. The UI
distinguishes stored backend analysis (`Online, …`) from the local filtering stage.

---

## 6. Warning notifications

Thresholds are the backend's (unchanged):

| Score | Level | Behaviour |
| --- | --- | --- |
| 0–29 | Low | Metadata stored; no warning |
| 30–59 | Medium | Metadata stored; no warning by default |
| 60–79 | High | Warning notification |
| 80–100 | Critical | Prominent warning notification |

Rules (`WarningPolicy`, unit-tested):

- High title: **“Potential Scam Detected”**.
- Critical title: **“Critical Fraud Warning”**.
- Body contains only the backend's generic warning, score and category, plus an action
  hint. It never contains the message, sender, OTP, PIN, card/CVV, account details or
  any masked message text.
- Two dedicated channels, both `IMPORTANCE_HIGH`: `scamshield_warning_high` and
  `scamshield_warning_critical`; Critical is also `CATEGORY_ALARM` and max priority.
- Notifications are `PRIVATE`, `AUTO_CANCEL`, `ONLY_ALERT_ONCE`.
- Duplicate suppression is bounded and keyed by the stored detection id, so the same
  event cannot warn twice.
- `POST_NOTIFICATIONS` is declared and requested when the user enables warnings
  (API 33+). Posting is skipped if notifications are disabled system-wide.
- If permission is revoked between check and post, the event is not marked as shown, so
  a later attempt can still notify.
- The notification text never claims that the app blocks payments or prevents scams.

---

## 7. Result screen and navigation

A warning tap opens `MainActivity` with
`com.scamshield.ai.extra.RESULT_ID` and the stored record id. `MainActivity`
(`singleTop`) and `ScamShieldApp` navigate to `result/{recordId}`.

The Compose result screen shows:

- risk score and risk level;
- category;
- the backend's safe warning text;
- up to three reason labels;
- recommended safety actions;
- detection timestamp and source app;
- analysis source (hybrid / rule+URL / rule-only).

It shows no notification content. If the record was cleared, it says the result is no
longer available. The screen states that the app only warns and cannot block
transactions or guarantee that every scam is detected.

Room migration `1 → 2` adds only `warningText` and `reasons` (backend labels). There is
still no column for raw or masked notification text, sender, OTP, PIN, card data or
tokens.

---

## 8. Error handling

| Situation | Behaviour |
| --- | --- |
| Backend URL unreachable / offline | `Unavailable`; no record; no warning; service stays alive |
| Timeout | `Unavailable`; no record; no warning |
| 401 / 403 | Token cleared, `NotAuthorised`; no record; no retry loop |
| 429 | `RateLimited`; no record; no user spam |
| 5xx | `Unavailable` |
| Malformed JSON / unknown risk label / score out of range | `Unavailable`; no fabricated score |
| 422 | `Rejected`; no record |
| Device not enrolled | `NotEnrolled`; no request |
| JSON/parsing error | `Unavailable` |
| Notification listener exception | Caught; a single class-name log line; service continues |

No failure branch carries a risk score. Failures are not reported to the user as a
successful analysis, and repeated network failures do not produce repeated
notifications.

---

## 9. Privacy guarantees

| Requirement | Implementation |
| --- | --- |
| No raw notification text in Room | Room stores only score, level, category, source app, timestamp, analysis source, warning text and reason labels |
| No masked text in Room | `AnalysisPayload.maskedText` is a local variable |
| No notification content in logs | Logs contain hashes/labels/failure kinds only |
| No OTP/PIN in network logs | No HTTP body/header logging interceptor exists |
| No device token in logs | Token is only set on the request header; never logged |
| Monitoring OFF by default | `AppSettings.defaults()` |
| Only selected apps monitored | Package check before processing |
| Notification access user-controlled | Granted in Android settings; never auto-requested |
| No SMS/contacts/call log/accessibility access | Only notification extras are read |
| No secrets in APK | No AI keys or shared API key; per-device token only |
| Backend unchanged | No scoring, thresholds, provider order or detection rules modified |

---

## 10. Tests

### JVM (MockWebServer and fakes)

- `QuickDetectionRepositoryTest`: header, request serialization, response
  deserialization, hybrid mapping, 401/403 token clearing, 429 with `Retry-After`,
  malformed body, out-of-range/unknown risk, blank/oversized text, no token, offline,
  timeout, 500.
- `DeviceEnrollmentRepositoryTest`: login → register with Bearer JWT, device token
  stored, JWT not persisted, wrong credentials, 409 limit, empty token response,
  blank input, network failure, rotation success, rotation without device, revoked
  (409), unknown (404), forget.
- `WarningPolicyTest`: High/Critical eligibility, Low/Medium/Unknown suppression,
  setting/permission gating, titles, channels/urgency, safe body, blank/control-char
  fallback, duplicate suppression and eviction.
- `DeviceNamesTest`, `RoutesTest`, plus updated `ApiErrorMapperTest`.
- Existing Phase 4/5 tests remain (masking, pre-filter, processor, token store,
  network JSON, URL policy).

### Instrumentation (Pixel 7, API 35)

- `ScamNotificationListenerServiceTest`: backend metadata stored, masked text sent (raw
  OTP never), Critical/High warnings, Low/Medium suppression, warning setting off,
  duplicates, removal/repost, not enrolled, expired token, offline, unselected package,
  own package, text extraction.
- `MetadataOnlyHistoryTest`: exact Room column set; no content column.
- `NotificationNavigationTest`: warning intent carries the result id; normal launch has
  none.

Run:

```bash
cd android-app
JAVA_HOME="<JDK 17+>" ./gradlew :app:testDebugUnitTest
JAVA_HOME="<JDK 17+>" ./gradlew :app:assembleDebug
JAVA_HOME="<JDK 17+>" ./gradlew :app:lintDebug
JAVA_HOME="<JDK 17+>" ./gradlew :app:connectedDebugAndroidTest   # emulator required
```

APK: `android-app/app/build/outputs/apk/debug/app-debug.apk`.

---

## 11. Emulator testing instructions

1. Start the backend on the host:
   ```bash
   cd backend
   ./.venv/Scripts/python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```
2. Start an emulator and install the APK:
   ```bash
   emulator -avd Pixel_7
   adb install -r android-app/app/build/outputs/apk/debug/app-debug.apk
   ```
3. Create/choose an account, open **Settings → Device connection**, enter the email,
   password and device name, then **Connect device**. Expect
   “Device connected…”.
4. Grant notification access:
   ```bash
   adb shell cmd notification allow_listener \
     com.scamshield.ai/com.scamshield.ai.security.ScamNotificationListenerService
   adb shell pm grant com.scamshield.ai android.permission.POST_NOTIFICATIONS
   ```
5. In Settings, enable monitoring, select the source app, enable warning
   notifications, and grant access in the system screen if prompted.
6. Send controlled test text (never real OTPs/PINs/credentials). For example, with a
   test SMS app selected, use the emulator console; or use instrumentation tests with
   the fake backend for deterministic coverage.
7. Verify:
   ```bash
   adb logcat | grep ScamNotificationListener
   adb shell dumpsys notification --noredact | grep -A4 com.scamshield.ai
   ```
8. Tap a warning, or reproduce the tap target:
   ```bash
   adb shell am start -n com.scamshield.ai/.MainActivity \
     --el com.scamshield.ai.extra.RESULT_ID <recordId>
   ```
9. Inspect the encrypted token store (debuggable build):
   ```bash
   adb shell run-as com.scamshield.ai ls files/datastore
   ```
   The token file must not contain a readable `ssdev_…` string.

### Runtime results recorded for this phase

- App launched on Pixel 7 API 35 without crashes.
- Device enrollment through the real UI produced
  `/auth/login 200` → `/devices/register 201`.
- The token DataStore file contained no plaintext `ssdev_` token; logcat contained no
  token and no test OTP digits.
- A real posted notification reached `/api/v1/detect/quick`; the backend returned
  `65 / High / Fake Reward` and the app posted a High warning with the correct title and
  content-free body.
- Medium results (50/55) were stored without a warning.
- A Critical warning was posted on-device with channel
  `scamshield_warning_critical`, `category=alarm`, title “Critical Fraud Warning”.
- Opening the result id displayed score 65, High, Fake Reward, the warning, three
  reason labels, timestamp/source and safety actions.
- With the backend stopped, the listener logged only
  `Analysis unavailable (unavailable); no result stored`, stored nothing, posted no
  warning and did not crash.

---

## 12. Remaining limitations

- **Sender is not sent.** Notification titles can contain message content, so the
  optional `sender` field is deliberately omitted.
- **Coverage depends on notification access.** Apps that hide content or post only
  “New message” cannot be analyzed.
- **Detection is heuristic.** High/Critical is a warning, not proof; Low is not a
  guarantee of safety.
- **Warnings require permission.** Without `POST_NOTIFICATIONS`/system notifications,
  results are stored but no warning is shown.
- **In-memory dedup** resets when the process is killed. Warning dedup is also
  in-memory (bounded).
- **No background queue/retry.** Offline notifications are dropped rather than queued.
  This avoids stale or duplicate analysis and unbounded retries.
- **Backend rate limits apply** (30/minute/device per worker); the app does not retry
  `429`.
- **Device limit** is enforced by the backend (default 5 active devices).
- **AI-assisted latency** depends on the provider; the backend bounds it and falls back
  to rules.
- **Instrumentation tests use a fake backend**, except where the runtime checks above
  used the live local backend.
- **The synthetic shell notification** used for manual runtime input is auto-grouped by
  Android; the grouped-summary text is not the posted body, so only warnings whose text
  the listener actually received were asserted. Deterministic Critical/Low/Medium
  coverage lives in the instrumentation tests and the real notifier probe.
