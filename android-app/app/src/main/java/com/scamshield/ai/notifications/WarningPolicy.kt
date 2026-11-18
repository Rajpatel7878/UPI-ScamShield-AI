package com.scamshield.ai.notifications

import com.scamshield.ai.domain.model.DetectionRecord
import com.scamshield.ai.domain.model.RiskLevel

/** How prominent a warning should be. */
enum class WarningUrgency { WARNING, PROMINENT }

/** Fully resolved, content-free notification content. */
data class WarningContent(
    val channelId: String,
    val title: String,
    val text: String,
    val urgency: WarningUrgency,
)

/**
 * Pure warning rules, independent of the Android notification framework so they can be
 * unit tested.
 *
 * Warnings are only produced for backend High/Critical results, only when the user has
 * enabled warnings and only when notifications are permitted. The text is built from
 * the backend's generic warning, the score and the category. Raw or masked message text
 * is never available to this class.
 */
object WarningPolicy {

    const val CHANNEL_HIGH = "scamshield_warning_high"
    const val CHANNEL_CRITICAL = "scamshield_warning_critical"

    private const val FALLBACK_WARNING =
        "This message shows scam warning signs. Verify independently before acting."
    private const val MAX_WARNING_LENGTH = 140

    fun shouldWarn(
        level: RiskLevel,
        warningsEnabled: Boolean,
        notificationsAllowed: Boolean,
    ): Boolean = warningsEnabled && notificationsAllowed && level.isHighRisk

    /** Returns null for Low/Medium/Unknown results. */
    fun build(record: DetectionRecord): WarningContent? {
        if (!record.riskLevel.isHighRisk) return null

        val warning = sanitize(record.warningText)
        val category = record.category
            .replace(Regex("\\s+"), " ")
            .trim()
            .take(60)
        val score = record.riskScore.coerceIn(0, 100)

        return when (record.riskLevel) {
            RiskLevel.CRITICAL -> WarningContent(
                channelId = CHANNEL_CRITICAL,
                title = "Critical Fraud Warning",
                text = "$warning Risk $score/100" +
                    (if (category.isNotEmpty()) " · $category" else "") +
                    ". Open ScamShield AI for safe details.",
                urgency = WarningUrgency.PROMINENT,
            )
            RiskLevel.HIGH -> WarningContent(
                channelId = CHANNEL_HIGH,
                title = "Potential Scam Detected",
                text = "$warning Risk $score/100" +
                    (if (category.isNotEmpty()) " · $category" else "") +
                    ". Tap for details.",
                urgency = WarningUrgency.WARNING,
            )
            else -> null
        }
    }

    /**
     * Collapses whitespace and strips control characters. The backend warning is already
     * content-free; this is defence in depth so a malformed value cannot break the
     * notification or add line breaks.
     */
    private fun sanitize(warningText: String): String {
        val cleaned = warningText
            .map { character -> if (character.isWhitespace()) ' ' else character }
            .filter { character -> character.isLetterOrDigit() || character in ALLOWED_CHARS }
            .joinToString("")
            .replace(Regex("\\s+"), " ")
            .trim()
            .take(MAX_WARNING_LENGTH)
        return cleaned.ifBlank { FALLBACK_WARNING }
    }

    private const val ALLOWED_CHARS = " .,:;!?()'-/%+&"
}
