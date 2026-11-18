package com.scamshield.ai.network.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * Mirrors `QuickDetectionResponse` in `backend/app/schemas/quick_detection.py`.
 * The backend guarantees 0-100 score, three reasons at most and a warning of at
 * most 120 characters; the app validates defensively when mapping.
 */
@Serializable
data class QuickDetectionResponse(
    @SerialName("risk_score") val riskScore: Int,
    @SerialName("risk_level") val riskLevel: String,
    val category: String,
    @SerialName("warning_text") val warningText: String,
    val reasons: List<String> = emptyList(),
    @SerialName("analysis_type") val analysisType: String,
)
