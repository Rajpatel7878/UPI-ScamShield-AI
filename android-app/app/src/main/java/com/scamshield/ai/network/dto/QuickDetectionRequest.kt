package com.scamshield.ai.network.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * Mirrors `QuickDetectionRequest` in `backend/app/schemas/quick_detection.py`:
 * `text` (1-2000 chars) is required, `sender` and `source_app` are optional.
 */
@Serializable
data class QuickDetectionRequest(
    val text: String,
    val sender: String? = null,
    @SerialName("source_app") val sourceApp: String? = null,
)
