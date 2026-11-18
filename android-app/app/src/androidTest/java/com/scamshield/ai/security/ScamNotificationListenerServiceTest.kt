package com.scamshield.ai.security

import android.app.Notification
import android.os.Bundle
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.scamshield.ai.ScamShieldApplication
import com.scamshield.ai.domain.model.DetectionOutcome
import com.scamshield.ai.domain.model.DetectionRecord
import com.scamshield.ai.domain.model.DetectionResult
import com.scamshield.ai.domain.model.DetectionSource
import com.scamshield.ai.domain.model.RiskLevel
import com.scamshield.ai.domain.repository.QuickDetectionRepository
import com.scamshield.ai.notifications.WarningNotifier
import java.util.Collections
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeout
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Instrumented tests for [ScamNotificationListenerService].
 *
 * `StatusBarNotification` has no public constructor, so the tests cannot build one.
 * They drive the service through [ScamNotificationListenerService.handlePosted], the
 * framework-independent core of `onNotificationPosted`, and use the real application
 * container (DataStore settings + Room history) plus a fake backend repository and a
 * recording warning notifier.
 *
 * The service is attached to the application context with `attachBaseContext`, which is
 * how the system attaches it in production too — without binding a real notification
 * listener (that requires a user-granted notification-access approval).
 */
@RunWith(AndroidJUnit4::class)
class ScamNotificationListenerServiceTest {

    private lateinit var app: ScamShieldApplication
    private lateinit var service: ScamNotificationListenerService
    private lateinit var backend: FakeQuickDetectionRepository
    private lateinit var warnings: RecordingWarningNotifier

    @Before
    fun setUp() {
        app = ApplicationProvider.getApplicationContext()
        backend = FakeQuickDetectionRepository(outcome = analyzed(CRITICAL_RESULT))
        warnings = RecordingWarningNotifier()
        service = ScamNotificationListenerService().apply {
            attachContextForTest(app)
            quickDetectionRepositoryOverride = backend
            warningNotifierOverride = warnings
        }
        runBlocking {
            app.container.historyRepository.clearAll()
            app.container.settingsRepository.apply {
                setMonitoringEnabled(true)
                setSelectedPackages(setOf(MONITORED_PACKAGE))
                setWarningNotificationsEnabled(true)
            }
        }
    }

    @After
    fun tearDown() = runBlocking {
        app.container.settingsRepository.apply {
            setMonitoringEnabled(false)
            setSelectedPackages(emptySet())
            setWarningNotificationsEnabled(true)
        }
        app.container.historyRepository.clearAll()
    }

    @Test
    fun onNotificationPosted_excludesOwnAppPackage() {
        val accepted = service.handlePosted(
            packageName = app.packageName,
            notificationId = 1,
            text = OTP_TEXT,
        )

        assertFalse("own notifications must be ignored", accepted)
        assertTrue(
            "own notifications must never reach the history",
            history().none { it.sourceApp == app.packageName },
        )
    }

    @Test
    fun onNotificationPosted_storesBackendMetadataOnly() {
        val accepted = service.handlePosted(
            packageName = MONITORED_PACKAGE,
            notificationId = 2,
            text = OTP_TEXT,
            postTime = 1_700_000_000_000L,
        )

        assertTrue("a monitored package must be accepted", accepted)

        val record = awaitRecord()
        assertNotNull("metadata must be written for a successful analysis", record)
        assertEquals(RiskLevel.CRITICAL, record!!.riskLevel)
        assertEquals(100, record.riskScore)
        assertEquals("Credential Theft", record.category)
        assertEquals(DetectionSource.ONLINE_RULE_BASED, record.analysisSource)
        assertEquals(1_700_000_000_000L, record.timestamp)
        assertEquals("High scam risk. Do not share OTP or UPI PIN.", record.warningText)
        assertEquals(listOf("Asks for an OTP", "Asks for a UPI PIN"), record.reasons)
    }

    @Test
    fun maskedTextIsSentToBackendNeverRawOtp() {
        service.handlePosted(MONITORED_PACKAGE, 3, OTP_TEXT, postTime = 1L)
        awaitRecord()

        assertEquals(1, backend.calls.size)
        val sent = backend.calls.first()
        assertTrue("masked credential marker must be sent", sent.contains("[REDACTED]"))
        assertFalse("raw OTP digits must never be sent", sent.contains("482913"))
        assertFalse("raw text must never be sent", sent.contains(OTP_TEXT))
    }

    @Test
    fun criticalResultProducesOneWarning() {
        service.handlePosted(MONITORED_PACKAGE, 4, OTP_TEXT)

        val record = awaitRecord()
        val warning = awaitWarning()

        assertNotNull(record)
        assertNotNull(warning)
        assertEquals(record!!.id, warning!!.id)
        assertEquals(RiskLevel.CRITICAL, warning.riskLevel)
        assertEquals(1, warnings.records.size)
    }

    @Test
    fun highResultProducesWarning() {
        backend.outcome = analyzed(highResult())

        service.handlePosted(MONITORED_PACKAGE, 5, OTP_TEXT)

        assertNotNull(awaitRecord())
        val warning = awaitWarning()
        assertEquals(RiskLevel.HIGH, warning!!.riskLevel)
        assertEquals(72, warning.riskScore)
    }

    @Test
    fun lowResultIsStoredWithoutWarning() {
        backend.outcome = analyzed(lowResult())

        service.handlePosted(MONITORED_PACKAGE, 6, OTP_TEXT)

        val record = awaitRecord()
        assertNotNull(record)
        assertEquals(RiskLevel.LOW, record!!.riskLevel)
        Thread.sleep(NO_WARNING_WINDOW_MS)
        assertTrue("low risk must not notify", warnings.records.isEmpty())
    }

    @Test
    fun mediumResultIsStoredWithoutWarning() {
        backend.outcome = analyzed(mediumResult())

        service.handlePosted(MONITORED_PACKAGE, 7, OTP_TEXT)

        val record = awaitRecord()
        assertNotNull(record)
        assertEquals(RiskLevel.MEDIUM, record!!.riskLevel)
        Thread.sleep(NO_WARNING_WINDOW_MS)
        assertTrue("medium risk must not notify", warnings.records.isEmpty())
    }

    @Test
    fun warningPreferenceOffSuppressesWarning() = runBlocking {
        app.container.settingsRepository.setWarningNotificationsEnabled(false)
        backend.outcome = analyzed(highResult())

        service.handlePosted(MONITORED_PACKAGE, 8, OTP_TEXT)

        assertNotNull(awaitRecord())
        Thread.sleep(NO_WARNING_WINDOW_MS)
        assertTrue(warnings.records.isEmpty())
    }

    @Test
    fun duplicateNotificationIsSentOnlyOnce() {
        val first = service.handlePosted(MONITORED_PACKAGE, 9, OTP_TEXT)
        val second = service.handlePosted(MONITORED_PACKAGE, 9, OTP_TEXT)

        assertTrue(first)
        assertFalse("the same notification key must only be processed once", second)
        assertNotNull(awaitRecord())
        Thread.sleep(NO_WARNING_WINDOW_MS)
        assertEquals(1, history().size)
        assertEquals(1, backend.calls.size)
        assertEquals(1, warnings.records.size)
    }

    @Test
    fun notificationRemovalAllowsReprocessingAfterDedup() {
        assertTrue(service.handlePosted(MONITORED_PACKAGE, 10, OTP_TEXT))
        assertNotNull(awaitRecord())
        service.forgetPosted(MONITORED_PACKAGE, 10)
        assertTrue(service.handlePosted(MONITORED_PACKAGE, 10, OTP_TEXT))

        awaitRecordCount(2)
    }

    @Test
    fun notEnrolledDeviceStoresNothingAndDoesNotCrash() {
        backend.outcome = DetectionOutcome.NotEnrolled

        service.handlePosted(MONITORED_PACKAGE, 11, OTP_TEXT)

        Thread.sleep(FAILURE_WINDOW_MS)
        assertTrue("no fabricated result may be stored", history().isEmpty())
        assertTrue(warnings.records.isEmpty())
    }

    @Test
    fun expiredTokenStoresNothingAndServiceKeepsRunning() {
        backend.outcome = DetectionOutcome.NotAuthorised
        service.handlePosted(MONITORED_PACKAGE, 12, OTP_TEXT)
        Thread.sleep(FAILURE_WINDOW_MS)
        assertTrue(history().isEmpty())

        backend.outcome = analyzed(CRITICAL_RESULT)
        service.handlePosted(MONITORED_PACKAGE, 13, OTP_TEXT)
        assertNotNull("service must keep processing after auth failures", awaitRecord())
    }

    @Test
    fun offlineFailureStoresNothingAndServiceKeepsRunning() {
        backend.outcome = DetectionOutcome.Unavailable
        service.handlePosted(MONITORED_PACKAGE, 14, OTP_TEXT)
        Thread.sleep(FAILURE_WINDOW_MS)
        assertTrue(history().isEmpty())
        assertTrue(warnings.records.isEmpty())

        backend.outcome = analyzed(highResult())
        service.handlePosted(MONITORED_PACKAGE, 15, OTP_TEXT)
        assertNotNull(awaitRecord())
    }

    @Test
    fun unselectedPackageIsIgnored() {
        service.handlePosted("com.example.unselected", 16, OTP_TEXT)

        Thread.sleep(FAILURE_WINDOW_MS)
        assertTrue(history().isEmpty())
        assertTrue(backend.calls.isEmpty())
    }

    @Test
    fun extractNotificationText_nullIsSafe() {
        assertNull(service.extractNotificationText(null))
    }

    @Test
    fun extractNotificationText_emptyOrBlankIsIgnored() {
        assertNull(service.extractText(null))
        assertNull(service.extractText(Bundle()))

        val emptyExtras = Bundle().apply { putCharSequence(Notification.EXTRA_TEXT, "") }
        assertNull(service.extractText(emptyExtras))

        val blankExtras = Bundle().apply { putCharSequence(Notification.EXTRA_TEXT, "   ") }
        assertNull(service.extractText(blankExtras))

        val validExtras = Bundle().apply {
            putCharSequence(Notification.EXTRA_TEXT, "  $OTP_TEXT  ")
        }
        assertEquals(OTP_TEXT, service.extractText(validExtras))
    }

    private fun history(): List<DetectionRecord> = runBlocking {
        app.container.historyRepository.observeHistory().first()
    }

    private fun awaitRecord(): DetectionRecord? = runBlocking {
        withTimeout(RECORD_TIMEOUT_MS) {
            app.container.historyRepository.observeHistory().first { it.isNotEmpty() }
        }.first()
    }

    private fun awaitRecordCount(count: Int): List<DetectionRecord> = runBlocking {
        withTimeout(RECORD_TIMEOUT_MS) {
            app.container.historyRepository.observeHistory().first { it.size >= count }
        }
    }

    private fun awaitWarning(): DetectionRecord? {
        val deadline = System.currentTimeMillis() + RECORD_TIMEOUT_MS
        while (System.currentTimeMillis() < deadline) {
            warnings.records.firstOrNull()?.let { return it }
            Thread.sleep(POLL_INTERVAL_MS)
        }
        return null
    }

    private fun analyzed(result: DetectionResult): DetectionOutcome = DetectionOutcome.Analyzed(result)

    private fun highResult(): DetectionResult = DetectionResult(
        riskScore = 72,
        riskLevel = RiskLevel.HIGH,
        category = "Fake Verification",
        warningText = "High scam risk. Do not share OTP or UPI PIN.",
        reasons = listOf("Urgency language"),
        analysisSource = DetectionSource.ONLINE_RULE_BASED,
        sourceApp = MONITORED_PACKAGE,
        timestamp = 1L,
    )

    private fun mediumResult(): DetectionResult = DetectionResult(
        riskScore = 45,
        riskLevel = RiskLevel.MEDIUM,
        category = "General Scam",
        warningText = "Some scam indicators were found.",
        reasons = listOf("Payment language"),
        analysisSource = DetectionSource.ONLINE_RULE_BASED,
        sourceApp = MONITORED_PACKAGE,
        timestamp = 1L,
    )

    private fun lowResult(): DetectionResult = DetectionResult(
        riskScore = 12,
        riskLevel = RiskLevel.LOW,
        category = "General Scam",
        warningText = "",
        reasons = emptyList(),
        analysisSource = DetectionSource.ONLINE_RULE_BASED,
        sourceApp = MONITORED_PACKAGE,
        timestamp = 1L,
    )

    private class FakeQuickDetectionRepository(
        var outcome: DetectionOutcome,
    ) : QuickDetectionRepository {
        val calls: MutableList<String> = Collections.synchronizedList(mutableListOf())

        override suspend fun analyze(
            maskedText: String,
            sender: String?,
            sourceApp: String?,
            timestamp: Long,
        ): DetectionOutcome {
            calls.add(maskedText)
            return outcome
        }
    }

    private class RecordingWarningNotifier : WarningNotifier {
        val records: MutableList<DetectionRecord> = Collections.synchronizedList(mutableListOf())

        override fun notify(record: DetectionRecord) {
            records.add(record)
        }
    }

    private companion object {
        const val MONITORED_PACKAGE = "com.google.android.apps.messaging"
        const val OTP_TEXT = "Your OTP is 482913"
        const val RECORD_TIMEOUT_MS = 5_000L
        const val NO_WARNING_WINDOW_MS = 500L
        const val FAILURE_WINDOW_MS = 700L
        const val POLL_INTERVAL_MS = 25L

        val CRITICAL_RESULT = DetectionResult(
            riskScore = 100,
            riskLevel = RiskLevel.CRITICAL,
            category = "Credential Theft",
            warningText = "High scam risk. Do not share OTP or UPI PIN.",
            reasons = listOf("Asks for an OTP", "Asks for a UPI PIN"),
            analysisSource = DetectionSource.ONLINE_RULE_BASED,
            sourceApp = MONITORED_PACKAGE,
            timestamp = 1_700_000_000_000L,
        )
    }
}
