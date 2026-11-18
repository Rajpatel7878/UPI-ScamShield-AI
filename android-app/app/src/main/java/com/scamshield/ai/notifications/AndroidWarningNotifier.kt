package com.scamshield.ai.notifications

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.scamshield.ai.MainActivity
import com.scamshield.ai.R
import com.scamshield.ai.domain.model.DetectionRecord

/**
 * Posts High/Critical warnings with a tap target that opens the in-app result screen.
 *
 * - Contains no message content: only the backend's generic warning, score and category.
 * - Uses two dedicated channels, both high importance; Critical is additionally marked
 *   as an alarm-category, max-priority alert.
 * - Respects `POST_NOTIFICATIONS`/system notification settings.
 * - Suppresses duplicates for the same detection event.
 */
class AndroidWarningNotifier(
    private val context: Context,
    private val deduplicator: WarningDeduplicator = WarningDeduplicator(),
) : WarningNotifier {

    override fun notify(record: DetectionRecord) {
        val content = WarningPolicy.build(record) ?: return
        if (!WarningPolicy.shouldWarn(
                level = record.riskLevel,
                warningsEnabled = true,
                notificationsAllowed = notificationsAllowed(),
            )
        ) {
            return
        }
        if (!deduplicator.firstTime(record.id)) return

        ensureChannels()

        val pendingIntent = PendingIntent.getActivity(
            context,
            notificationId(record.id),
            Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                putExtra(MainActivity.EXTRA_RESULT_ID, record.id)
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        val isCritical = content.urgency == WarningUrgency.PROMINENT
        val builder = NotificationCompat.Builder(context, content.channelId)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentTitle(content.title)
            .setContentText(content.text)
            .setStyle(NotificationCompat.BigTextStyle().bigText(content.text))
            .setPriority(
                if (isCritical) NotificationCompat.PRIORITY_MAX else NotificationCompat.PRIORITY_HIGH,
            )
            .setCategory(
                if (isCritical) NotificationCompat.CATEGORY_ALARM else NotificationCompat.CATEGORY_MESSAGE,
            )
            .setColor(if (isCritical) CRITICAL_COLOR else HIGH_COLOR)
            .setAutoCancel(true)
            .setOnlyAlertOnce(true)
            .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
            .setContentIntent(pendingIntent)

        try {
            NotificationManagerCompat.from(context).notify(notificationId(record.id), builder.build())
        } catch (error: SecurityException) {
            // Permission was revoked between the check and the post; allow a later retry.
            deduplicator.forget(record.id)
        }
    }

    private fun notificationsAllowed(): Boolean {
        val permissionGranted = Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS,
            ) == PackageManager.PERMISSION_GRANTED
        return permissionGranted && NotificationManagerCompat.from(context).areNotificationsEnabled()
    }

    private fun ensureChannels() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = context.getSystemService(NotificationManager::class.java) ?: return

        manager.createNotificationChannel(
            NotificationChannel(
                WarningPolicy.CHANNEL_HIGH,
                "Scam warnings",
                NotificationManager.IMPORTANCE_HIGH,
            ).apply {
                description = "Warnings for high-risk scam notifications."
                enableVibration(true)
                setShowBadge(true)
            },
        )

        manager.createNotificationChannel(
            NotificationChannel(
                WarningPolicy.CHANNEL_CRITICAL,
                "Critical fraud warnings",
                NotificationManager.IMPORTANCE_HIGH,
            ).apply {
                description = "Prominent warnings for critical fraud risk."
                enableVibration(true)
                enableLights(true)
                setShowBadge(true)
            },
        )
    }

    private fun notificationId(recordId: Long): Int =
        (WARNING_NOTIFICATION_BASE + (recordId % 100_000)).toInt()

    private companion object {
        const val WARNING_NOTIFICATION_BASE = 20_000L
        const val CRITICAL_COLOR = 0xFFEF4444.toInt()
        const val HIGH_COLOR = 0xFFF97316.toInt()
    }
}
