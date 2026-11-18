package com.scamshield.ai.domain.model

/**
 * Result of a backend quick-detection analysis.
 *
 * Every field here comes from the server response (or the notification envelope for
 * [sourceApp] and [timestamp]). The app never calculates or guesses a score: if the
 * backend cannot be reached, no result exists and nothing is stored.
 */
data class DetectionResult(
    val riskScore: Int,
    val riskLevel: RiskLevel,
    val category: String,
    val warningText: String,
    val reasons: List<String>,
    val analysisSource: DetectionSource,
    val sourceApp: String?,
    val timestamp: Long,
)

/**
 * Outcome of one analysis attempt. Failures are explicit and content-free; no
 * failure branch carries a risk score.
 */
sealed interface DetectionOutcome {

    data class Analyzed(val result: DetectionResult) : DetectionOutcome

    /** No device token: the device has not been enrolled yet. */
    data object NotEnrolled : DetectionOutcome

    /** Token expired, revoked or rejected (401/403). The stored token was cleared. */
    data object NotAuthorised : DetectionOutcome

    data class RateLimited(val retryAfterSeconds: Long?) : DetectionOutcome

    /** Offline, timeout, server error or an unusable response. */
    data object Unavailable : DetectionOutcome

    /** The request was not sent because it could not be valid. */
    data class Rejected(val reason: String) : DetectionOutcome
}
