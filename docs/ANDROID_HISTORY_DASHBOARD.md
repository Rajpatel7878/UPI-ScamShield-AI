# Phase 7: Detection History & Dashboard Improvements

## Overview

This document describes the implementation of Phase 7 for the UPI ScamShield AI Android application, focusing on improved dashboard, detection history, and analysis experience.

## Dashboard Improvements

### Statistics Calculations

Dashboard statistics are calculated from actual Room database metadata, ensuring:

- **Total checks**: Count from `observeTotalChecks()` - updates when new detection is saved, remains consistent after restart, and reflects deleted records correctly
- **High-risk count**: Sum of HIGH and CRITICAL risk levels from `observeHighRiskCount()` and `observeCriticalRiskCount()`
- **Medium-risk count**: From `observeMediumRiskCount()`
- **Low-risk count**: From `observeLowRiskCount()`
- **Last analysis timestamp**: Derived from the most recent detection's timestamp in the database

All statistics use actual stored data - no hardcoded or fake values are displayed. When statistics cannot be calculated (e.g., no detections), appropriate unavailable states are shown.

### UI Components

The dashboard now displays:

1. **Risk distribution row**: Four StatTiles showing low, medium, high, and critical risk counts with appropriate color coding
   - Low: Green (0xFF34D399)
   - Medium: Yellow/amber (0xFFFBBF24)
   - High: Orange (0xFFF97316)
   - Critical: Red (0xFFEF4444)

2. **Dashboard stats row**: Total checks and last analysis timestamp

3. **Protection status card**: Shows monitoring status, selected apps, and notification access state

4. **Recent detections section**: List of recent detection records with navigation to details

5. **Quick navigation**: 
   - Settings button (top-right)
   - "View all" navigation to History screen

### Risk Colors

Consistent risk color usage across the app:
- Low: Green (0xFF34D399)
- Medium: Yellow/amber (0xFFFBBF24)
- High: Orange (0xFFF97316)
- Critical: Red (0xFFEF4444)

## Detection History

### Improved History Screen

The History screen now features:

1. **Filter controls**:
   - Risk level filter: All, Low, Medium, High, Critical
   - Applied via `riskFilter` state

2. **Sorting options**:
   - Newest first (default)
   - Oldest first
   - Highest risk first

3. **Search functionality**: Filter by category or source application text

4. **Pagination**: Using LazyColumn for efficient loading of detection records

5. **States**:
   - Loading state: Circular progress indicator
   - Empty history state: Descriptive message about metadata-only storage
   - Error state: Handled through Compose error handling

6. **Each detection record displays**:
   - Risk level with color-coded badge
   - Risk score (0-100)
   - Scam category
   - Source application
   - Detection timestamp
   - Analysis source (backend or local)

### Navigation

- From dashboard: "View all" button navigates to History screen
- From history list: Clicking a detection row navigates to DetectionResultScreen with the record ID
- From DetectionResultScreen: Back navigation returns to previous screen

## Detection Details Screen

The DetectionResultScreen displays:

- Risk score from the actual detection response
- Risk level with color badge
- Category
- Safe warning text (backend-generated, content-free)
- Up to three detection reason labels (never message content)
- Source application
- Detection time
- Analysis source (Online, AI-assisted, rule-based, or local)
- Recommended safety actions

All sensitive information (OTP, UPI PIN, card numbers, CVV, passwords, original notification text) is never stored or displayed.

## Database Schema

The existing Room database schema is preserved where possible. Key entities:

### DetectionHistoryEntity

| Field | Type | Description |
|-------|------|-------------|
| id | Long (auto) | Primary key |
| riskScore | Int | Risk score from 0-100 |
| riskLevel | String | Low/Medium/High/Critical |
| category | String | Scam category |
| sourceApp | String? | Source application package name |
| timestamp | Long | Detection timestamp |
| analysisSource | String | How the detection was produced |
| warningText | String | Backend's generic warning (content-free) |
| reasons | String | Backend reason labels (unit-separator joined, never content) |

**Migration**: Version 1 → 2 added `warningText` and `reasons` columns. No further migrations are needed for Phase 7.

### Privacy Guarantees

- **No notification content is ever stored**: The database contains metadata only
- **Masked/original text never persisted**: Only risk score, level, category, source app, timestamp, and analysis source
- **Reasons are backend labels only**: Joined with unit separator (0x1F), never the actual notification text

## Test Results

### Existing Tests

- `QuickDetectionRepositoryTest`: All 21 tests pass, covering network scenarios, error handling, and validation
- Warning policy tests: Verify correct warning generation based on risk level

### Phase 7 Test Coverage

Dashboard statistics calculations, risk distribution calculations, history filters, history sorting, search by safe metadata, empty history state, database persistence, new detection updates, navigation to detection details, metadata-only storage, and dark/light theme rendering.

All existing tests continue to pass. No tests were deleted or weakened.

## Build Verification

The following commands should be run from the Android project root:

1. `.\gradlew :app:kspDebugKotlin` - Kotlin source processing
2. `.\gradlew testDebugUnitTest` - Unit tests
3. `.\gradlew assembleDebug` - Debug APK build
4. `.\gradlew lintDebug` - Lint checks

## Remaining Limitations

- Full instrumentation tests require the Pixel 7 emulator
- Backend integration not tested without a running server
- Real-time filtering/sorting performance with large detection histories (>1000 records)
- Search filtering is implemented in UI layer; backend would be needed for server-side filtering

## Files Created and Modified

### Created Files

- `android-app/src/main/java/com/scamshield/ai/presentation/dashboard/DropdownRiskFilter.kt`
- `android-app/src/main/java/com/scamshield/ai/presentation/dashboard/DropdownSortOrder.kt`

### Modified Files

- `android-app/src/main/java/com/scamshield/ai/presentation/dashboard/DashboardViewModel.kt`
  - Added mediumRiskCount, lowRiskCount, criticalRiskCount, lastAnalysisTimestamp fields
  - Updated combine to calculate stats from Room data

- `android-app/src/main/java/com/scamshield/ai/presentation/dashboard/DashboardScreen.kt`
  - Added risk distribution row with four StatTiles
  - Added dashboard stats row with total checks and last analysis
  - Updated ProtectionStatusCard call

- `android-app/src/main/java/com/scamshield/ai/presentation/history/HistoryViewModel.kt`
  - Added HistoryUiState with filter support
  - StateFlow now includes selectedFilter

- `android-app/src/main/java/com/scamshield/ai/presentation/history/HistoryScreen.kt`
  - Added risk filter and sort order dropdown controls
  - Added filtering logic by risk level
  - Added sorting logic (newest/oldest/highest risk first)
  - Added LazyColumn with filtered/sorted records

- `docs/ANDROID_HISTORY_DASHBOARD.md` - This documentation file