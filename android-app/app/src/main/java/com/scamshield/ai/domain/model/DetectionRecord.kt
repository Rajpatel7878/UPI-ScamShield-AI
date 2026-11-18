package com.scamshield.ai.domain.model

/**
 * Local history entry. Deliberately contains no message text, sender, OTP, PIN
 * or any other notification content.
 */
data class DetectionRecord(
    val id: Long = 0,
    val riskScore: Int,
    val riskLevel: RiskLevel,
    val category: String,
    val sourceApp: String?,
    val timestamp: Long,
    val analysisSource: DetectionSource,
    /** Generic, content-free warning returned by the backend. */
    val warningText: String = "",
    /** Up to three backend reason labels (never message content). */
    val reasons: List<String> = emptyList(),
)
