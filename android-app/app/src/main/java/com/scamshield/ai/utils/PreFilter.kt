package com.scamshield.ai.utils

import com.scamshield.ai.domain.model.DetectionSensitivity
import com.scamshield.ai.domain.model.RiskLevel

/**
 * Lightweight local pre-filter for incoming notifications.
 * Runs on the device before any network or AI calls.
 * Returns a structured result indicating whether the notification
 * should proceed for analysis and why.
 *
 * Design decisions:
 * - No access to SMS, contacts, call logs, or accessibility services.
 * - Works only with the notification text that the listener exposes.
 * - Sensitivity configuration from AppSettings is respected.
 * - The result is intentionally small for logging/debugging; no raw message content.
 */
data class PreFilterResult(
    /** True if the notification should be sent for further analysis. */
    val shouldSend: Boolean,
    /** Human-readable reason(s) for the decision. */
    val reasons: List<String>,
    /** Mapped risk level if a signal was detected; otherwise UNKNOWN. */
    val detectedRiskLevel: RiskLevel,
    /** Which signal types were matched (for debugging/analytics). */
    val matchedSignals: List<String>,
)

/**
 * Detects whether a notification is potentially relevant to UPI/payment scams.
 * Supports configurable sensitivity: Low, Medium, High.
 * Ignores clearly irrelevant notifications.
 *
 * Signal categories (all evaluated on normalized lowercase text):
 * - URL present
 * - OTP / verification code language
 * - UPI / payment / collect / refund / cashback / lottery / prize
 * - PIN / KYC / account block / suspend / SIM block / electricity disconnection
 * - Urgency language (urgent, immediately, turant, abhi)
 * - Hinglish equivalents from the backend rule list
 *
 * Sensitivity thresholds:
 * - High: any strong signal, or two weak signals
 * - Medium (default): a credential/payment signal, or a URL plus any signal, or three weak signals
 * - Low: credential request, or payment + urgency, or a suspicious URL plus payment language
 *
 * Ordinary personal messages and normal bank balance alerts must not be forwarded.
 * The filter is deliberately conservative; its thresholds are documented and unit-tested.
 */
object PreFilter {

    private val urlRegex = Regex("(?i)\\b(?:https?://|www\\.)\\S+")

    private val otpRegex = Regex(
        "(?i)\\b(?:otp|one[\\s-]?time[\\s-]?(?:password|code)|verification\\s+(?:code|number)|" +
            "authentication\\s+code)\\b|\\b(?:code|verify|auth)\\s+\\d{4,8}\\b|" +
            "\\b\\d{4,8}\\s+(?:otp|code)\\b",
    )

    private val paymentRegex = Regex(
        "(?i)\\b(?:upi|payment|collect|refund|cashback|lottery|prize|reward|qr\\s*code|" +
            "scan\\s*(?:and|&)?\\s*pay)\\b|\\b(?:bank|transfer|send|receive|pay)\\b",
    )

    private val pinRegex = Regex(
        "(?i)\\b(?:pin|upi[\\s-]?pin|m[\\s.-]?pin)\\b|\\b(?:kyc|block|suspend|suspended|frozen|" +
            "sim\\s*block|electricity\\s*disconnect)\\b",
    )

    private val urgencyRegex = Regex("(?i)\\b(?:urgent|immediately|turant|abhi|right now|asap)\\b")

    /** Evaluate a notification text and return a structured result. */
    fun evaluate(
        text: String?,
        sensitivity: DetectionSensitivity = DetectionSensitivity.MEDIUM,
    ): PreFilterResult {
        val normalized = text?.trim().orEmpty()
        if (normalized.isEmpty()) {
            return PreFilterResult(
                shouldSend = false,
                reasons = listOf(IRRELEVANT_REASON),
                detectedRiskLevel = RiskLevel.UNKNOWN,
                matchedSignals = emptyList(),
            )
        }

        val strongSignals = mutableListOf<String>()
        val weakSignals = mutableListOf<String>()

        val urlPresent = urlRegex.containsMatchIn(normalized)
        if (urlPresent) strongSignals.add("url")
        if (otpRegex.containsMatchIn(normalized)) strongSignals.add("otp")
        if (paymentRegex.containsMatchIn(normalized)) strongSignals.add("payment")
        if (pinRegex.containsMatchIn(normalized)) strongSignals.add("pin")
        if (urgencyRegex.containsMatchIn(normalized)) weakSignals.add("urgency")

        val shouldSend = when (sensitivity) {
            DetectionSensitivity.HIGH ->
                strongSignals.isNotEmpty() || weakSignals.size >= 2

            DetectionSensitivity.MEDIUM ->
                strongSignals.any { it in CREDENTIAL_OR_PAYMENT } ||
                    urlPresent ||
                    weakSignals.size >= 3

            DetectionSensitivity.LOW ->
                strongSignals.any { it == "otp" || it == "pin" } ||
                    ("payment" in strongSignals && "urgency" in weakSignals) ||
                    (urlPresent && "payment" in strongSignals)
        }

        val riskLevel = when {
            "otp" in strongSignals -> RiskLevel.CRITICAL
            "pin" in strongSignals -> RiskLevel.HIGH
            "payment" in strongSignals || urlPresent -> RiskLevel.MEDIUM
            else -> RiskLevel.UNKNOWN
        }

        return PreFilterResult(
            shouldSend = shouldSend,
            reasons = if (shouldSend) {
                buildReasons(strongSignals, weakSignals, urlPresent)
            } else {
                listOf(IRRELEVANT_REASON)
            },
            detectedRiskLevel = if (shouldSend) riskLevel else RiskLevel.UNKNOWN,
            matchedSignals = strongSignals + weakSignals,
        )
    }

    /** Builds a short, human-readable reason list for the decision. */
    private fun buildReasons(
        strongSignals: List<String>,
        weakSignals: List<String>,
        urlPresent: Boolean,
    ): List<String> {
        val reasons = mutableListOf<String>()
        if ("otp" in strongSignals) reasons.add("OTP request")
        if ("pin" in strongSignals) reasons.add("PIN request")
        if ("payment" in strongSignals) reasons.add("Payment-related language")
        if (urlPresent) reasons.add("URL present")
        if ("urgency" in weakSignals) reasons.add("Urgency language")
        if (weakSignals.size >= 3) reasons.add("Multiple weak signals")
        return if (reasons.isEmpty()) listOf(IRRELEVANT_REASON) else reasons
    }

    private const val IRRELEVANT_REASON = "Irrelevant notification — filtered out"

    private val CREDENTIAL_OR_PAYMENT = setOf("otp", "pin", "payment")
}
