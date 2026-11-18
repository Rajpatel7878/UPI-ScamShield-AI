package com.scamshield.ai.domain.repository

import com.scamshield.ai.domain.model.DetectionOutcome

/**
 * Sends one already-masked notification to `POST /api/v1/detect/quick`.
 *
 * Implementations must never block the main thread, never retry indefinitely and
 * never invent a result when the backend is unreachable.
 */
interface QuickDetectionRepository {
    suspend fun analyze(
        maskedText: String,
        sender: String? = null,
        sourceApp: String? = null,
        timestamp: Long = System.currentTimeMillis(),
    ): DetectionOutcome
}
