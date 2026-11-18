# UPI ScamShield AI — Android Notification Listener (Phase 5)

This document describes the `NotificationListenerService` implementation added in Phase 5,
which connects the existing Phase 4 privacy pipeline to the Android notification system.

## 1. Overview

The `ScamNotificationListenerService` (defined in
`android-app/app/src/main/java/com/scamshield/ai/security/ScamNotificationListenerService.kt`)
monitors incoming notifications for UPI/payment-related content using the local
pre-filter and masking pipeline already established in Phase 4.

**Key design points:**
- The service does **not** read SMS, contacts, call logs, or accessibility data.
- It only processes notifications from user-selected source apps (WhatsApp, Messages, Telegram).
- All filtering and masking is performed locally; no notification content is sent to the
  backend in this phase (Phase 6+).
- The user must manually enable notification access through Android system settings.
- Monitoring is **OFF by default**; the user explicitly enables it via the Settings screen.

## 2. AndroidManifest.xml Changes

The following additions were made to `android-app/app/src/main/AndroidManifest.xml`:

1. **No permission request** — `BIND_NOTIFICATION_LISTENER_SERVICE` is a signature-level
   system permission, so it must not be requested with `<uses-permission>` (lint rejects it
   as `ProtectedPermissions`). The system grants notification access to the service when the
   user enables it in Settings.

2. **Service registration** — The `ScamNotificationListenerService` is registered as a
   `NotificationListenerService`, protected by the `BIND_NOTIFICATION_LISTENER_SERVICE`
   permission. The service is `exported=false`, meaning it can only be started by the system
   when the user grants permission.

```xml
<service
    android:name=".security.ScamNotificationListenerService"
    android:permission="android.permission.BIND_NOTIFICATION_LISTENER_SERVICE"
    android:exported="false">
    <intent-filter>
        <action android:name="android.service.notification.NotificationListenerService" />
    </intent-filter>
</service>
```

## 3. User Consent and App Selection Flow

### 3.1 First-run experience
- On a fresh install, the app opens to the **Onboarding** screen.
- Onboarding explains that the app can monitor UPI/payment notifications **only after**
  the user grants notification access in Android settings.
- Onboarding completes when the user taps "Continue"; `onboardingCompleted` is saved to
  `DataStore` and the app navigates to the **Dashboard**.

### 3.2 Settings → Notification monitoring
In the **Settings** screen, the user finds:

- **Toggle: "Notification monitoring"** — OFF by default (per `AppSettings.defaults()`).
  - When OFF: a clear message explains that no notifications are read.
  - When ON: the user is prompted to grant access.

- **Button: "Grant"** — When monitoring is OFF, this button opens
  `android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS`, taking the user directly
  to the Android system settings where they can enable notification access for *ScamShield AI*.

- **Permission status indicator** — On the Dashboard, a card shows:
  - *"Monitoring is active. Selected apps: Messages, WhatsApp."*
  - *"Monitoring preference on. Notification access not yet granted in system settings."*
  - *"No notifications are read. You can change this in Settings..."*

- **Monitored apps section** — A list of curated packages (Messages, WhatsApp, Telegram)
  with individual toggle switches. The user selects which apps to monitor. By default,
  no packages are selected.

### 3.3 What notification access means (user-facing text)
> "Notification access allows ScamShield AI to read the text of incoming notifications
> from the apps you select. We only look at UPI, payment, OTP, and KYC-related language.
> Your message content is never stored on the device or sent to the backend during Phase 5.
> You can disable this at any time in Settings."

## 4. Connecting the Phase 4 Privacy Pipeline

For every eligible notification, the listener performs these steps **on a background
dispatcher** (`Dispatchers.IO`):

1. **Verify monitoring is enabled** — If the user has disabled monitoring in Settings, the
   service immediately returns without processing.

2. **Check that the source app is selected** — The listener only processes notifications
   from packages the user has toggled on in the *Monitored apps* section of Settings.
   Notifications from unselected apps are silently ignored.

3. **Extract notification text safely** — The `extractNotificationText()` method handles:
   - Null notifications, empty text, grouped/summary notifications,
   - Unsupported notification types.
   - Never crashes on unsupported notifications.

4. **Pass through the existing Phase 4 local pre-filter** — `PreFilter.evaluate()` with
   the user's selected sensitivity (Low/Medium/High). If the pre-filter returns
   `shouldSend=false`, the notification is ignored (irrelevant).

5. **Apply Phase 4 sensitive-data masking** — `Masker.maskOtp()`, `.maskUpiPin()`,
   `.maskCardNumber()`, `.maskCvv()`, `.maskAccountNumber()` are applied in sequence.
   Only credential values are replaced with `[REDACTED]`; amounts, dates, and ordinary
   numbers are preserved.

6. **Produce a safe payload for the next phase** — `NotificationProcessor.process()` returns
   an `AnalysisPayload` containing:
   - `maskedText` — the original text with credential values redacted.
   - `source` — `OFFLINE_LOCAL` or `ONLINE_RULE_BASED`.
   - `riskLevel` — `UNKNOWN`, `LOW`, `HIGH`, or `CRITICAL`.
   - `reasons` — up to 3 concise reasons for the classification.
   - `shouldSendToBackend` — `true` if the pipeline recommends sending to the backend
     (Phase 6+). In Phase 5 this is `false`; the payload is for local analysis only.

7. **Persist only metadata to Room** — If `shouldSendToBackend` is `true`, only the
   following metadata is stored in the Room database (`DetectionRecord`):
   - `riskScore`, `riskLevel`, `category`, `sourceApp`, `timestamp`, `analysisSource`
   - **NOT** the raw notification text, and **NOT** the masked notification content.

## 5. Duplicate and Loop Prevention

### 5.1 In-memory deduplication
- A `mutableSetOf<String>` tracks processed notification keys in memory.
- The dedup key is `"${packageName}:${id}:${textHash}"`.
- Maximum size is bounded at 500 entries; oldest entries are evicted when the limit is exceeded.
- **On notification removal** (`onNotificationRemoved`), the entry is cleaned from the set.

### 5.2 Own-app exclusion
- Notifications from the app's own package (`com.scamshield.ai`) are silently discarded.
- This prevents the service from processing its own synthetic test notifications.

### 5.3 Notification update handling
- When a notification is removed from the status bar (`onNotificationRemoved`), the
  in-memory dedup entry is cleared, allowing a future identical notification to be
  processed again if needed.

### 5.4 What is NOT persisted
- No notification text (raw or masked) is written to Room or SharedPreferences.
- No sensitive data (OTPs, PINs, card numbers) is persisted beyond the current session.
- The only persisted items are `DetectionRecord` metadata rows, which contain the risk
  score, level, category, source app, and timestamp — no message content.

## 6. Background Processing

- The listener uses `CoroutineScope(Dispatchers.IO).launch { }` for all pipeline work.
- The `onNotificationPosted` and `onNotificationRemoved` callback methods **always run
  on the main thread** (as required by the Android framework), but they offload all
  processing to the IO dispatcher immediately.
- The service is **not** a foreground service. It runs as a background system service;
  Android manages its lifecycle.
- The listener is lightweight: string operations, pattern matching, and a single
  `NotificationProcessor.process()` call. No network calls, no file I/O, no heavy
  computation.
- Battery impact is minimal: the system only delivers notifications to the service when
  they are posted/removed; there is no polling or periodic timer.

## 7. Dashboard and Settings Integration

### 7.1 Dashboard (`DashboardScreen`)
The protection status card now displays:

| State | Shown text |
|-------|-----------|
| Monitoring OFF, access not granted | "No notifications are read. You can change this in Settings, but this build does not connect to notifications." |
| Monitoring ON, access not granted | "Monitoring preference on. Notification access not yet granted in system settings." |
| Monitoring ON, access granted | "Monitoring active. Selected app: <app>." (shows selected package names) |

The recent detections list shows real Room data (risk score, level, category, source app,
timestamp) — no message content.

### 7.2 Settings (`SettingsScreen`)
Key additions:

- **Notification monitoring toggle** with clear on/off state and explanation text.
- **"Grant" button** (visible only when monitoring is OFF) that opens
  `android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS`.
- **Monitored apps list** — checkboxes for each curated package. Selections are saved
  via `SettingsRepository.setSelectedPackages()`.
- **Subtitle explanations** — e.g., *"Applies only when monitoring is connected.
  Contact access is not requested in this build."*

### 7.3 No fake monitoring statistics
- The dashboard displays **real app state** from Room (`totalChecks`, `highRiskCount`,
  `recentDetections`).
- If monitoring is OFF or access is unavailable, the UI honestly states that no messages
  are being read. There are no simulated or made-up counts.

## 8. Testing

### 8.1 Instrumented tests
- `ScamNotificationListenerServiceTest` (`androidTest`) tests:
  - Own-app package exclusion.
  - Notification posted/removed lifecycle.
  - Empty/null text handling.
  - Deduplication basic behavior.

### 8.2 JVM unit tests
- `NotificationListenerIntegrationTest` (`test`) tests the Phase 4 pipeline integration:
  - Monitoring disabled contract.
  - Selected/unselected source app behavior.
  - Irrelevant notification rejection at all sensitivity levels.
  - Duplicate notification prevention logic.
  - Empty notification content handling.
  - Masking integration with pipeline.
  - Amount-preserving conservative masking.
  - Hinglish text preservation.
  - No network request from `process()`.

### 8.3 Test coverage goals
- All `PreFilter.evaluate()` paths covered (Low/Medium/HIGH sensitivities).
- All `Masker` mask types covered with positive and negative cases.
- `NotificationProcessor.process()` contract verified (no network, valid payload).
- Lifecycle events (post, remove) verified for crash-free operation.

## 9. Privacy and Permission Verification

| Item | Guarantee |
|------|-----------|
| **No raw notification text in logs** | `Log.d()` only outputs a hash of the original text. |
| **No raw/masked text in Room** | Only `DetectionRecord` metadata is stored; `maskedText` is never persisted. |
| **No credential values persisted** | All masked with `[REDACTED]`; originals are discarded after pipeline. |
| **No SMS/contacts/call logs/accessibility** | The service only reads `NotificationListenerService` exposed text. |
| **User must manually enable** | Access is via Android Settings → Apps → ScamShield AI → Notification access. |
| **Monitoring OFF by default** | `AppSettings.defaults()` has `monitoringEnabled = false`. |
| **No network requests in Phase 5** | `process()` is local; `shouldSendToBackend` is `false` in Phase 5. |
| **Selected apps only** | Configurable via Settings; unselected apps are ignored. |
| **Own-app exclusion** | Notifications from `com.scamshield.ai` are discarded. |

## 10. Known Limitations and Blockers

- **Android SDK required** to verify the exact permission-checking flow and run instrumented
  tests. Without the SDK, the logic is expressed in source and verified via JVM unit tests.
- **Notification text exposure varies** — some apps hide notification content or show only
  "New message". The pipeline cannot guarantee coverage of every message.
- **Hinglish/regional language coverage** — the pre-filter patterns cover common Hinglish
  terms but may not cover every dialect or shorthand.
- **In-memory dedup is not persistent** — if the process is killed and restarted, the dedup
  set is cleared. This is acceptable for Phase 5; persistent dedup can be added in Phase 6+.
- **No backend integration yet** — `shouldSendToBackend` is `false`; network calls belong to Phase 6.
- **Permission grant flow is manual** — the app cannot programmatically grant notification
  access; the user must do it in Android settings.

## 11. Integration Path to Later Phases

| Phase | Integration |
|-------|-------------|
| **Phase 6** | When the user has granted notification access and selected apps, and `shouldSendToBackend=true`,
  the caller invokes `POST /api/v1/detect/quick` with the `maskedText` and `X-Device-Token`. |
| **Phase 7** | Backend tests and security review. Ensure new end-to-end flow works. |
| **Phase 8** | The `ScamNotificationListenerService` `onNotificationPosted` is the entry point:
  it calls the pipeline, persists metadata, and optionally triggers the backend. |
| **Phase 9** | Warning notifications are shown in the UI when the backend returns risk score ≥ 60. |
| **Phase 10** | Full end-to-end: receive synthetic UPI notification → pre-filter → mask → backend → warning. |

---

*This document is part of the UPI ScamShield AI Phase 5 implementation. It must be kept in sync
with the source code in `android-app/app/src/main/java/com/scamshield/ai/security/`
and the test files in `android-app/app/src/test/` and `android-app/app/src/androidTest/`.*