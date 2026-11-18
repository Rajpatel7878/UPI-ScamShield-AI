package com.scamshield.ai.notifications

import com.scamshield.ai.domain.model.DetectionRecord

/**
 * Shows an Android warning for a backend detection result. Only High and Critical
 * results are ever shown, and the notification contains no message content.
 */
interface WarningNotifier {
    fun notify(record: DetectionRecord)
}
