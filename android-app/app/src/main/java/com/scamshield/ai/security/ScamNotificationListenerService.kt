package com.scamshield.ai.security

import android.app.Notification
import android.content.Context
import android.os.Bundle
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import com.scamshield.ai.AppContainer
import com.scamshield.ai.ScamShieldApplication
import com.scamshield.ai.domain.model.DetectionOutcome
import com.scamshield.ai.domain.model.DetectionRecord
import com.scamshield.ai.domain.repository.HistoryRepository
import com.scamshield.ai.domain.repository.QuickDetectionRepository
import com.scamshield.ai.domain.repository.SettingsRepository
import com.scamshield.ai.notifications.WarningNotifier
import com.scamshield.ai.utils.NotificationProcessor
import java.util.Collections
import java.util.concurrent.ConcurrentHashMap
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

/**
 * NotificationListenerService that analyzes UPI/payment-related notifications.
 *
 * Pipeline:
 *
 * `onNotificationPosted → PreFilter → Masker → QuickDetectionRepository → backend
 * → metadata-only Room record → optional High/Critical warning`
 *
 * Privacy and safety:
 * - Only user-selected source apps are processed, and only while monitoring is enabled.
 * - Raw and masked text stay in memory; neither is logged or persisted.
 * - The backend result is the only source of a risk score. When analysis fails, no
 *   record and no warning are produced — the app never invents a score.
 * - All work runs on a background dispatcher; the service never crashes on errors.
 * - Duplicate notifications are suppressed in memory.
 */
class ScamNotificationListenerService : NotificationListenerService() {

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    /** Bounded in-memory dedup set. Guarded by its own monitor. */
    private val processedNotifications: MutableSet<String> =
        Collections.synchronizedSet(LinkedHashSet<String>())

    /** Rate-limits repeated failure log lines without ever logging content. */
    private val lastFailureLogAt = ConcurrentHashMap<String, Long>()

    /** Test seams. Production resolves these from [AppContainer]. */
    internal var quickDetectionRepositoryOverride: QuickDetectionRepository? = null
    internal var warningNotifierOverride: WarningNotifier? = null

    /** Resolved through the base context so it also works for an attached test service. */
    private val container: AppContainer?
        get() = (applicationContext as? ScamShieldApplication)?.container

    /**
     * Attaches the application context explicitly. The system does this through the same
     * protected hook when it binds the service; instrumentation tests cannot call it
     * directly, and the service needs a context to resolve its repositories.
     */
    internal fun attachContextForTest(context: Context) {
        attachBaseContext(context)
    }

    private val settingsRepository: SettingsRepository?
        get() = container?.settingsRepository

    private val historyRepository: HistoryRepository?
        get() = container?.historyRepository

    private val quickDetectionRepository: QuickDetectionRepository?
        get() = quickDetectionRepositoryOverride ?: container?.quickDetectionRepository

    private val warningNotifier: WarningNotifier?
        get() = warningNotifierOverride ?: container?.warningNotifier

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        handlePosted(
            packageName = sbn.packageName,
            notificationId = sbn.id,
            postTime = sbn.postTime,
            text = extractNotificationText(sbn),
        )
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification) {
        forgetPosted(packageName = sbn.packageName, notificationId = sbn.id)
    }

    /**
     * Framework-independent core of [onNotificationPosted]. Returns true when the
     * notification was accepted for background processing.
     *
     * Kept separate from the override because `StatusBarNotification` has no public
     * constructor, which makes it impossible to build one in an instrumented test.
     */
    internal fun handlePosted(
        packageName: String,
        notificationId: Int,
        text: String?,
        postTime: Long = System.currentTimeMillis(),
    ): Boolean {
        // Never process our own notifications (prevents feedback loops).
        if (packageName == this.packageName) return false

        val body = text?.trim().orEmpty()
        if (body.isEmpty()) return false

        if (!remember(dedupKey(packageName, notificationId, body))) return false

        serviceScope.launch { processNotification(packageName, postTime, body) }
        return true
    }

    /** Core of [onNotificationRemoved]: lets an identical notification be processed again. */
    internal fun forgetPosted(packageName: String, notificationId: Int) {
        val prefix = "$packageName:$notificationId:"
        synchronized(processedNotifications) {
            processedNotifications.removeIf { it.startsWith(prefix) }
        }
    }

    private fun dedupKey(packageName: String, notificationId: Int, text: String): String =
        "$packageName:$notificationId:${text.hashCode()}"

    override fun onDestroy() {
        serviceScope.cancel()
        super.onDestroy()
    }

    /**
     * Extracts the notification body text without touching unsupported notification types.
     * Only the system-provided text extras are read; no SMS, contacts or accessibility data.
     */
    internal fun extractNotificationText(sbn: StatusBarNotification?): String? =
        extractText(sbn?.notification?.extras)

    /** Reads only the system-provided text extras of a posted notification. */
    internal fun extractText(extras: Bundle?): String? {
        if (extras == null) return null
        val candidates = listOf(
            extras.getCharSequence(Notification.EXTRA_TEXT),
            extras.getCharSequence(Notification.EXTRA_BIG_TEXT),
            extras.getCharSequence(Notification.EXTRA_SUMMARY_TEXT),
        )
        return candidates.firstOrNull { !it.isNullOrBlank() }?.toString()?.trim()
    }

    private fun remember(key: String): Boolean = synchronized(processedNotifications) {
        if (!processedNotifications.add(key)) return false
        while (processedNotifications.size > MAX_TRACKED_NOTIFICATIONS) {
            val oldest = processedNotifications.iterator()
            if (!oldest.hasNext()) break
            oldest.next()
            oldest.remove()
        }
        true
    }

    /** Runs the local pipeline, calls the backend and stores metadata only. */
    private suspend fun processNotification(packageName: String, postTime: Long, text: String) {
        try {
            val settings = settingsRepository?.settings?.first() ?: return
            if (!settings.monitoringEnabled) return
            if (packageName !in settings.selectedPackages) return

            // Local filtering and masking happen before any network request.
            val payload = NotificationProcessor.process(text, settings.sensitivity)
            if (!payload.shouldSendToBackend) {
                Log.d(TAG, "Notification filtered locally; no backend request")
                return
            }

            val repository = quickDetectionRepository ?: return
            when (val outcome = repository.analyze(
                maskedText = payload.maskedText,
                sender = null, // Notification titles can carry message content; omitted.
                sourceApp = packageName,
                timestamp = postTime,
            )) {
                is DetectionOutcome.Analyzed -> storeResult(outcome, packageName, postTime, settings.warningNotificationsEnabled)
                DetectionOutcome.NotEnrolled -> logFailureOnce("not_enrolled")
                DetectionOutcome.NotAuthorised -> logFailureOnce("unauthorised")
                is DetectionOutcome.RateLimited -> logFailureOnce("rate_limited")
                DetectionOutcome.Unavailable -> logFailureOnce("unavailable")
                is DetectionOutcome.Rejected -> logFailureOnce("rejected")
            }
        } catch (e: Exception) {
            // Never crash the service; no content or message text in the log line.
            Log.d(TAG, "Notification processing failed: ${e.javaClass.simpleName}")
        }
    }

    private suspend fun storeResult(
        outcome: DetectionOutcome.Analyzed,
        packageName: String,
        postTime: Long,
        warningsEnabled: Boolean,
    ) {
        val result = outcome.result
        val record = DetectionRecord(
            riskScore = result.riskScore,
            riskLevel = result.riskLevel,
            category = result.category,
            sourceApp = packageName,
            timestamp = postTime,
            analysisSource = result.analysisSource,
            warningText = result.warningText,
            reasons = result.reasons,
        )

        val recordId = historyRepository?.add(record) ?: return
        // Only the backend's own result labels reach the log.
        Log.d(
            TAG,
            "Analysis stored: score=${result.riskScore} level=${result.riskLevel} " +
                "source=${result.analysisSource}",
        )

        // Only backend High/Critical results are eligible for a warning.
        if (recordId > 0 && warningsEnabled && result.riskLevel.isHighRisk) {
            warningNotifier?.notify(record.copy(id = recordId))
        }
    }

    /** Logs at most one line per failure kind per ten minutes; never logs content. */
    private fun logFailureOnce(kind: String) {
        val now = System.currentTimeMillis()
        val previous = lastFailureLogAt[kind]
        if (previous != null && now - previous < FAILURE_LOG_INTERVAL_MS) return
        lastFailureLogAt[kind] = now
        Log.d(TAG, "Analysis unavailable ($kind); no result stored")
    }

    private companion object {
        const val TAG = "ScamNotificationListener"
        const val MAX_TRACKED_NOTIFICATIONS = 500
        const val FAILURE_LOG_INTERVAL_MS = 10 * 60 * 1000L
    }
}
