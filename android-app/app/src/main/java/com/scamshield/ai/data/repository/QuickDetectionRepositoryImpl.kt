package com.scamshield.ai.data.repository

import com.scamshield.ai.domain.model.DetectionOutcome
import com.scamshield.ai.domain.model.DetectionResult
import com.scamshield.ai.domain.model.DetectionSource
import com.scamshield.ai.domain.model.RiskLevel
import com.scamshield.ai.domain.repository.QuickDetectionRepository
import com.scamshield.ai.domain.repository.SettingsRepository
import com.scamshield.ai.network.ApiExecutor
import com.scamshield.ai.network.ApiResult
import com.scamshield.ai.network.ScamShieldApi
import com.scamshield.ai.network.dto.QuickDetectionRequest
import com.scamshield.ai.network.dto.QuickDetectionResponse
import com.scamshield.ai.security.DeviceTokenStore
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.first

/**
 * Device-authenticated quick detection.
 *
 * - Reads the current backend URL from settings for every call (configurable at runtime).
 * - Sends `X-Device-Token`; the token is never logged.
 * - Clears the stored token on 401/403 so the user can re-enroll.
 * - Performs no retries of its own. OkHttp's connection-retry flag is transport-level and
 *   bounded by the configured call timeout.
 * - Never fabricates a score: every failure maps to an explicit [DetectionOutcome].
 */
class QuickDetectionRepositoryImpl(
    private val settingsRepository: SettingsRepository,
    private val deviceTokenStore: DeviceTokenStore,
    private val apiFactory: (String) -> ScamShieldApi,
) : QuickDetectionRepository {

    override suspend fun analyze(
        maskedText: String,
        sender: String?,
        sourceApp: String?,
        timestamp: Long,
    ): DetectionOutcome {
        if (maskedText.isBlank()) {
            return DetectionOutcome.Rejected("The notification had no analyzable text.")
        }
        if (maskedText.length > MAX_TEXT_LENGTH) {
            return DetectionOutcome.Rejected("The notification was too long to analyze.")
        }

        val token = deviceTokenStore.read() ?: return DetectionOutcome.NotEnrolled

        return try {
            val baseUrl = settingsRepository.settings.first().backendUrl
            val api = apiFactory(baseUrl)
            val request = QuickDetectionRequest(
                text = maskedText,
                sender = sender?.trim()?.takeIf { it.isNotEmpty() },
                sourceApp = sourceApp?.trim()?.takeIf { it.isNotEmpty() },
            )

            when (val outcome = ApiExecutor.execute { api.quickDetect(token, request) }) {
                is ApiResult.Success -> mapSuccess(outcome.data, sourceApp, timestamp)
                is ApiResult.Failure.Unauthorized -> {
                    deviceTokenStore.clear()
                    DetectionOutcome.NotAuthorised
                }
                is ApiResult.Failure.Forbidden -> {
                    deviceTokenStore.clear()
                    DetectionOutcome.NotAuthorised
                }
                is ApiResult.Failure.RateLimited -> DetectionOutcome.RateLimited(outcome.retryAfterSeconds)
                is ApiResult.Failure.Validation -> DetectionOutcome.Rejected(
                    "The analysis service rejected the notification.",
                )
                is ApiResult.Failure.Conflict,
                is ApiResult.Failure.NotFound,
                is ApiResult.Failure.Server,
                is ApiResult.Failure.Network,
                is ApiResult.Failure.Unknown,
                -> DetectionOutcome.Unavailable
            }
        } catch (cancellation: CancellationException) {
            throw cancellation
        } catch (error: Exception) {
            // Includes malformed URLs, serialization failures and transport errors.
            // Only the exception type would be useful, and even that is not logged here.
            DetectionOutcome.Unavailable
        }
    }

    private fun mapSuccess(
        response: QuickDetectionResponse,
        sourceApp: String?,
        timestamp: Long,
    ): DetectionOutcome {
        val level = RiskLevel.fromApi(response.riskLevel)
        val valid = response.riskScore in 0..100 &&
            level != RiskLevel.UNKNOWN &&
            response.category.isNotBlank() &&
            (response.warningText.isNotBlank() || level == RiskLevel.LOW)
        if (!valid) return DetectionOutcome.Unavailable

        return DetectionOutcome.Analyzed(
            DetectionResult(
                riskScore = response.riskScore,
                riskLevel = level,
                category = response.category.take(MAX_CATEGORY_LENGTH),
                warningText = response.warningText.take(MAX_WARNING_LENGTH),
                reasons = response.reasons
                    .asSequence()
                    .map { it.trim() }
                    .filter { it.isNotEmpty() }
                    .take(MAX_REASONS)
                    .toList(),
                analysisSource = DetectionSource.fromApiType(response.analysisType),
                sourceApp = sourceApp,
                timestamp = timestamp,
            ),
        )
    }

    private companion object {
        const val MAX_TEXT_LENGTH = 2_000
        const val MAX_REASONS = 3
        const val MAX_WARNING_LENGTH = 120
        const val MAX_CATEGORY_LENGTH = 100
    }
}
