# UPI ScamShield AI — Android Project Setup (Phase 3)

## Prerequisites

| Item | Minimum version | Notes |
|------|----------------|-------|
| **Android Studio** | 2024.2.x (or newer) | Includes the Android SDK and emulator. |
| **JDK** | JDK 21 | Required by AGP 9.5.1 / Kotlin 2.2.10 (`gradle/libs.versions.toml`); the JDK bundled with current Android Studio (JBR 21) is sufficient. |
| **Git** | Any recent version | For cloning / checking the repo. |

## 1. Install Android Studio

1. Download from <https://developer.android.com/studio>.
2. Run the installer and accept the defaults.
3. On first launch, **accept the SDK licenses**:

   ```bash
   # Find the SDK directory (default on macOS):
   $ ls ~/Library/Android/sdk

   # Accept all licenses:
   $ cd ~/Library/Android/sdk
   $ bin/sdkmanager --install "platforms;android-35"
   $ bin/sdkmanager --install "build-tools;35.0.0"
   $ yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses
   ```

   On Windows use `%LOCALAPPDATA%\Android\Sdk\cmdline-tools\latest\bin\sdkmanager --licenses`.

## 2. Clone / open the project

```bash
git clone <repo-url>
cd UPI-ScamShield-AI
```

The project root contains:

- `android-app/` — the Android module
- `backend/` — the FastAPI backend (Phases 1–2)
- `docs/` — this and other spec documents
- `frontend/` — the React + Vite UI (unchanged)

## 3. Set up the backend URL

Create `android-app/local.properties` (never commit this file!) with the host backend address:

```properties
SCAMSHIELD_BASE_URL=http://10.0.2.2:8000/
```

- `10.0.2.2` is the special address that the Android emulator uses to reach the host machine.
- On a physical device connected to the same LAN, replace `10.0.2.2` with the laptop’s LAN IP.
- In **release builds** the app enforces HTTPS (`BuildConfig.REQUIRE_HTTPS = true`). Use `https://` in `local.properties` for release testing.

> **Do not** commit `local.properties`. It is listed in `android-app/.gitignore`.

## 4. Gradle sync

1. Open `android-app/` in Android Studio.
2. Click **File → Sync Project with Gradle Files** (or press `Ctrl+Alt+S` → `Gradle Sync`).
3. The first sync downloads dependency JARs and plugin code. This may take a few minutes on a fresh machine.

If the sync fails:

- Verify that `JAVA_HOME` points to JDK 21 (the project pins a JetBrains 21 daemon toolchain in `gradle/gradle-daemon-jvm.properties`; the JDK bundled with current Android Studio works).
- Ensure `ANDROID_HOME` (or `LOCAL_ANDROID_SDK`) is set, or let Android Studio use its bundled SDK.
- Check that `local.properties` exists and `SCAMSHIELD_BASE_URL` is set correctly.

### If `:app:kspDebugKotlin` or `:app:compileDebugKotlin` fails unexpectedly

Room generates its DAO/database implementations during `:app:kspDebugKotlin`. If that task aborts, every
`:app:compileDebugKotlin` after it reports unresolved `*_Impl` symbols, so the Gradle summary only shows a
generic `GradleKotlinCompilerWorkAction … Compilation error`. A typical KSP-level cause is:

```
e: [ksp] java.lang.IllegalStateException: unexpected jvm signature V
```

This means the Room/KSP annotation processor crashed on **stale generated output or a stale daemon from an
older dependency set**, not that the Kotlin sources are invalid. Discard the build state and rebuild:

```powershell
# PowerShell, from android-app/
.\gradlew --stop
Remove-Item -Recurse -Force .gradle, build, app\build, .kotlin
.\gradlew :app:kspDebugKotlin --rerun-tasks
```

```bash
# Git Bash / macOS / Linux, from android-app/
./gradlew --stop
rm -rf .gradle build app/build .kotlin
./gradlew :app:kspDebugKotlin --rerun-tasks
```

In Android Studio, **File → Invalidate Caches / Restart** has the same effect. If the crash survives a pristine
rebuild, treat it as a real processor bug and report the `kspDebugKotlin` stack trace rather than the
`compileDebugKotlin` message.

## 5. Emulator configuration

### Create a device (if you don't have one)

```bash
# From Android Studio → Device Manager → Create Device
# Pick a Pixel model, API level 30 or 31 (compatible with minSdk 26).
```

### Start the emulator

```bash
$ ANDROID_HOME/emulator/emulator -avemem 2048 -avd <avd-name>
```

The emulator will use `10.0.2.2` as its gateway to the host.

### Connect a physical device via USB

```bash
$ adb start-server
$ adb devices          # verify the device appears
$ adb reverse tcp:8000 tcp:8000   # forward host:8000 -> device:8000 (optional)
```

## 6. Build and run

### Debug build (HTTP allowed)

```bash
# From the project root:
$ cd android-app
$ ./gradlew assembleDebug   # produces app-debug.apk
$ ./gradlew installDebug    # installs on emulator/device connected via ADB
```

### Release build (HTTPS required)

```bash
$ ./gradlew assembleRelease   # produces app-release.apk
```

### Run unit tests

```bash
$ ./gradlew testDebugUnitTest   # JVM tests only (no device needed)
```

### Run lint

```bash
$ ./gradlew lintDebug
```

## 7. Verification checklist

| Item | Expected |
|------|----------|
| **Gradle sync** | Completes without errors |
| **Debug APK** | `assembleDebug` succeeds |
| **Kotlin compilation** | `testDebugUnitTest` passes (unit tests) |
| **Lint** | No new warnings introduced by this phase |
| **Monitoring defaults to OFF** | `AppSettings.defaults().monitoringEnabled == false` |
| **Onboarding flow** | Fresh install opens OnboardingScreen → Dashboard after Continue |
| **Navigation** | Bottom bar shows on Dashboard/History/Settings; disappears on Onboarding |
| **Room database** | Detection history stored with: id, riskScore, riskLevel, category, sourceApp, timestamp, analysisSource |
| **Device token storage** | Keystore-backed, encrypted, never plaintext in preferences or logs |
| **Networking** | `POST /api/v1/detect/quick` with header `X-Device-Token`; Retrofit + OkHttp with 5s connect / 12s read timeout |
| **No secrets in APK** | `BuildConfig` contains only `DEFAULT_BASE_URL` and `REQUIRE_HTTPS`; no API keys or tokens |

## 8. Known limitations (Phase 3 only)

- No NotificationListenerService is included — monitoring can be toggled in Settings but no messages are read.
- No SMS, contacts, or accessibility permissions are requested.
- The device token is encrypted with an Android Keystore key; losing the data directory or the keystore key means the token cannot be recovered.
- The app does not perform real AI‑assisted detection without a running backend at the configured URL.
- Debug builds allow cleartext (`http://10.0.2.2:8000/`); release builds require HTTPS.

## 9. FAQ

**Q: Can I use a tunnel service (ngrok, Cloudflare Tunnel, etc.)?** \
A: Yes. Set `SCAMSHIELD_BASE_URL` in `local.properties` to the tunnel's public HTTPS URL, e.g.
`SCAMSHIELD_BASE_URL=https://abc123.ngrok.io/`. Release builds will then require that URL to be HTTPS.

**Q: Why is `local.properties` gitignored?** \
A: It contains the per-developer backend URL and possibly credential hints. Committing it would force every contributor to use the same endpoint, which is not practical.

**Q: Does this app work without a backend?** \
A: The UI builds and navigation works offline. Network calls fail gracefully with user‑friendly error messages. Real detection requires the FastAPI backend at the configured URL.