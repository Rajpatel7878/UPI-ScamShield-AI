# UPI ScamShield AI — Android Privacy Pipeline (Phase 4)

This document describes the local filtering, masking, and processing pipeline
that runs entirely on the Android device before any network request.
It is designed to satisfy the privacy requirements specified in the project
guidelines: no raw notification content leaves the device, no credential values
are persisted, and all processing is local until explicitly integrated with
the backend in later phases.

## 1. Overview

The pipeline consists of three sequential stages:

1. **Pre-Filter** (`com.scamshield.ai.utils.PreFilter`) — Evaluates whether a
   notification is potentially relevant to UPI/payment scams based on local rule
   matching and user-configured sensitivity.
2. **Masker** (`com.scamshield.ai.utils.Masker`) — Masks sensitive data (OTPs,
   PINs, card numbers, CVV, account numbers) from the notification text so that
   only sanitized content is ever sent to the backend.
3. **Processor** (`com.scamshield.ai.utils.NotificationProcessor`) — Orchestrates
   the pipeline, returning a safe `AnalysisPayload` for a future API request.
   No network request is made in this phase.

## 2. Privacy Guarantees

| Item | Guarantee |
|------|-----------|
| **No raw notification text in logs** | `Masker.logMask()` outputs only a hash of the original content, never the text itself. |
| **No raw or masked notification text in Room** | `AnalysisPayload.maskedText` is never persisted to the Room database. Only metadata (risk score, level, category, source app, timestamp) is stored. |
| **No credential values persisted** | `Masker` replaces OTPs, PINs, card numbers, CVV, and account numbers with `[REDACTED]`. The original values are never stored on disk. |
| **No notification content in analytics/crash reports** | The pipeline never collects or forwards raw or masked notification text to crash reporting or analytics. |
| **No SMS, contacts, call logs, or accessibility permissions** | The pipeline works only with notification text exposed by the `NotificationListenerService`. No other system areas are accessed. |
| **No network requests in this phase** | `NotificationProcessor.process()` is a pure local function. It does not call Retrofit, OkHttp, or any backend endpoint. |
| **Masking is conservative** | Amounts (`Rs 5,000`), dates, OTP validity minutes, order IDs, and ordinary 4-8 digit numbers without credential context are **not** masked. |
| **User controls** | Monitoring is never auto-enabled. The user explicitly enables per-app monitoring via the Settings screen. Sensitivity (Low/Medium/High) is user-configurable. |

## 2. Component Details

### 2.1 Pre-Filter (`PreFilter`)

**Responsibility:** Evaluate whether a notification should proceed for analysis.

**Input:** Notification text (`String?`), user's `DetectionSensitivity`.

**Output:** `PreFilterResult` containing:
- `shouldSend: Boolean` — whether the notification should be sent for backend analysis.
- `reasons: List<String>` — human-readable reason(s) for the decision.
- `detectedRiskLevel: RiskLevel` — mapped risk level if a signal was detected.
- `matchedSignals: List<String>` — which signal types were matched (debugging/analytics).

**Signal categories (all evaluated on normalized lowercase text):**
- URL present
- OTP / verification code language
- UPI / payment / collect / refund / cashback / lottery / prize
- PIN / KYC / account block / suspend / SIM block / electricity disconnection
- Urgency language (`urgent`, `immediately`, `turant`, `abhi`)
- Hinglish equivalents from the backend rule list

**Sensitivity thresholds:**
| Sensitivity | Forward when |
|-------------|--------------|
| **High** | any strong signal, or two weak signals, or URL + payment |
| **Medium** (default) | a credential/payment signal, or a URL plus any signal, or three weak signals, or payment + urgency |
| **Low** | credential request, or payment + urgency, or a suspicious URL plus payment language |

**What is NOT forwarded (conservative guarantees):**
- Ordinary personal messages ("Hey, how are you?")
- Normal bank balance alerts ("Your account balance is Rs 5,000")
- Generic notification without scam-related language
- Messages where only generic words like `cashback`, `payment`, `KYC` appear alone (no compound phrase or second signal)

### 2.2 Masker (`Masker`)

**Responsibility:** Mask sensitive credential values from notification text.

**Masked types:**
- **OTP:** `"OTP 482913"` → `"OTP [REDACTED]"`
- **UPI PIN:** `"UPI PIN 1234"` / `"PIN enter karo 1234"` → `"UPI PIN [REDACTED]"`
- **Card number:** `"Card 4111 1111 1111 1111"` → masked (only with explicit card context)
- **CVV:** `"CVV 123"` → `"CVV [REDACTED]"`
- **Account number:** `"a/c 987654321"` → `"ACCOUNT [REDACTED]"`
- **Aadhaar:** `"Aadhaar 123456789012"` → `"Aadhaar [REDACTED]"`
- **Password:** `"password is secret123"` → `"password [REDACTED]"`

**What is NOT masked (to avoid destroying useful scam-related context):**
- Amounts: `"Rs 5,000"`, `"within 10 minutes"`
- Dates: `"meeting at 4:30"`, `"tomorrow"`
- Order IDs: `"order 123456"`
- Ordinary phone numbers without credential context
- Generic 4-8 digit numbers without OTP/PIN/PIN context

**Design principle:** Mask credential values, not every number. Preserve surrounding
words so rule detection still works (`"OTP 123456"` → `"OTP [REDACTED]"` still
matches the OTP rule).

**Replacement token:** `[REDACTED]`

### 2.3 Processor (`NotificationProcessor`)

**Responsibility:** Orchestrate the pipeline and return a safe payload.

**Input:** Notification text, user's `DetectionSensitivity` (default MEDIUM).

**Output:** `AnalysisPayload` containing:
- `maskedText: String` — the original text with credential values replaced by `[REDACTED]`
- `source: DetectionSource` — `OFFLINE_LOCAL`, `ONLINE_RULE_BASED`, or `ONLINE_HYBRID`
- `riskLevel: RiskLevel` — the locally detected risk level
- `reasons: List<String>` — up to 3 concise reasons for the classification
- `shouldSendToBackend: Boolean` — whether the pipeline recommends sending to the backend
- `metadata: Map<String, String>` — optional extras (e.g., `has_url`, `has_otp_signal`)

**Pipeline stages (in order):**
1. **Check monitoring setting** — Caller responsibility; pipeline assumes monitoring is ON.
2. **Apply local pre-filter** — `PreFilter.evaluate()`. If `shouldSend=false`, return an
   "ignored" payload with no masking and no backend send.
3. **Mask sensitive information** — `Masker.maskOtp()`, `.maskUpiPin()`, `.maskCardNumber()`,
   `.maskCvv()`, `.maskAccountNumber()` applied in sequence.
4. **Ignore irrelevant notifications** — If the pre-filter declined, return a minimal payload.
5. **Construct safe analysis payload** — Return `AnalysisPayload` with masked text, source,
   risk level, reasons, and `shouldSendToBackend` flag.
6. **No network request** — The pipeline completes entirely on the device.

**`DetectionSource` enum:**
- `OFFLINE_LOCAL` — No URL, no credential signals; local rules only.
- `ONLINE_RULE_BASED` — URL or credential signal detected; online but no AI provider result.
- `ONLINE_HYBRID` — (Future) validated AI result merged via HybridScorer logic.

## 3. Testing

### 3.1 Pre-Filter Tests
- Suspicious vs. ordinary messages at each sensitivity level (High/Medium/Low).
- OTP, PIN, URL, and payment language detection.
- Sensitivity parameters are respected (different results per level).
- Idempotent evaluation (same input → same output).

### 3.2 Masker Tests
- Positive cases: OTP, PIN, card, CVV, account, Aadhaar, password masking.
- Negative cases: amounts, dates, validity minutes, order IDs, ordinary chat numbers
  are left unchanged.
- Idempotence: masking twice does not corrupt the text.
- Mixed Hinglish text is handled correctly.

### 3.2 Processor Tests
- Irrelevant notification → ignored payload.
- OTP notification → forwarded with masking and `shouldSendToBackend=true`.
- URL + payment → forwarded at MEDIUM sensitivity.
- LOW sensitivity forwards credential requests only.
- HIGH sensitivity is at least as forward-leaning as MEDIUM.
- Multiple signal types are handled.
- Metadata correctly reports detected signals.
- No network request is made (contract check).

### 3.3 Test Data Conformance
All test vectors are shared with the backend masking tests (`backend/tests/test_masking.py`)
to ensure the Android and backend maskers produce consistent results for the same inputs.

## 4. Privacy Verification Checklist

Before promoting this code to the next phase, verify each item:

- [ ] `Masker.logMask()` never outputs original or masked content — only a hash.
- [ ] `AnalysisPayload.maskedText` is never stored in Room or written to logs.
- [ ] `PreFilter.evaluate()` never logs the notification text — only a hash in debug.
- [ ] `NotificationProcessor.process()` makes zero network calls (verified by unit test).
- [ ] The `reasons` list in `PreFilterResult` and `AnalysisPayload` contains no raw message content.
- [ ] No `NotificationListenerService`, `SMS`, `contacts`, `call logs`, or `accessibility` permissions are added.
- [ ] Sensitivity defaults to `MEDIUM`; user can toggle Low/High in Settings.
- [ ] Monitoring defaults to `OFF`; user explicitly enables it.
- [ ] The pipeline is the **only** path for notification processing; no backdoors.

## 5. Limitations

- **Coverage gap:** Notification access exposes only what an app chooses to post. Some apps
  hide content or show `"New message"` only. The pipeline cannot guarantee coverage of every
  message or conversation.
- **Heuristic nature:** Detection is heuristic; false positives and false negatives are possible.
  The pipeline never claims to detect every scam.
- **No AI in this phase:** AI provider calls are excluded. The `source` will be
  `OFFLINE_LOCAL` or `ONLINE_RULE_BASED` only.
- **Package selection:** Only notifications from packages the user explicitly selected in
  Settings are processed. Unselected apps are ignored even if they post notifications.

## 5. Integration Path to Later Phases

| Phase | Integration |
|-------|-------------|
| **Phase 5** | Add rate limiting + `STORE_QUICK_SCANS` flag. When `shouldSendToBackend=true`,
  the caller invokes `POST /api/v1/detect/quick` with the `maskedText` and `X-Device-Token`. |
| **Phase 6** | Backend tests and security review. Ensure new tests + existing suite are green. |
| **Phase 7** | Backend curl verification. Enroll, quick scan, 401, 422, 429, no raw content in DB. |
| **Phase 8** | Android notification listener (`ScamNotificationListener`) invokes `NotificationProcessor`
  in `onNotificationPosted`. |
| **Phase 10** | Full end-to-end: enroll → receive synthetic suspicious notification → backend called → warning at ≥60. |

---

*This document is part of the UPI ScamShield AI Phase 4 implementation. It must be kept
in sync with the source code in `android-app/app/src/main/java/com/scamshield/ai/utils/`
and the test files in `android-app/app/src/test/java/com/scamshield/ai/utils/`.*