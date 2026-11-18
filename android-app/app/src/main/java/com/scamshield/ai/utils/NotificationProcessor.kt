package com.scamshield.ai.utils

import com.scamshield.ai.domain.model.DetectionSensitivity
import com.scamshield.ai.domain.model.DetectionSource
import com.scamshield.ai.domain.model.RiskLevel

/**
 * The reusable processing pipeline as specified in Phase 4.
 *
 * Pipeline stages (in order):
 *   1. Receive notification text as input from the notification listener.
 *   2. Check the monitoring setting.  (Caller responsibility; pipeline assumes monitoring is ON.)
 *   3. Apply the local pre-filter.
 *   4. Ignore irrelevant notifications (pre-filter returns shouldSend=false).
 *   5. Mask sensitive information.
 *   6. Return a safe analysis payload for the API request.
 *   7. Do not make network requests in this phase.
 *
 * Monitoring must remain OFF by default. The caller checks monitoring state before invoking.
 */
object NotificationProcessor {

    private const val IRRELEVANT_REASON = "Irrelevant notification — filtered out"

    /**
     * Safe result of the local pipeline. [maskedText] must never be persisted or logged;
     * only metadata derived from it may reach the Room history.
     */
    data class AnalysisPayload(
        /** The masked message text safe to send to the backend. */
        val maskedText: String,
        /** The source of the analysis (online AI-assisted / online rule-based / offline local). */
        val source: DetectionSource,
        /** The risk level detected locally. */
        val riskLevel: RiskLevel,
        /** Human-readable reasons for the classification. */
        val reasons: List<String>,
        /** Whether the pipeline recommended sending this to the backend. */
        val shouldSendToBackend: Boolean,
        /** Optional extra metadata (URL/credential signal flags). */
        val metadata: Map<String, String>,
    )

    /**
     * Runs the full pipeline on notification text.
     *  1. Pre-filter evaluation.
     *  2. Masking of sensitive data (if the pre-filter says send).
     *  3. Construction of a safe payload.
     *
     * @param text the raw notification text from the listener
     * @param sensitivity the user's selected detection sensitivity
     * @return a payload containing the masked text, risk level, reasons, and source
     */
    fun process(
        text: String?,
        sensitivity: DetectionSensitivity = DetectionSensitivity.MEDIUM,
    ): AnalysisPayload {
        // Stage 3: Apply the local pre-filter.
        val preFilterResult = PreFilter.evaluate(text, sensitivity)

        // Stage 4: Irrelevant (or empty) notifications never reach masking or the backend.
        if (!preFilterResult.shouldSend || text.isNullOrBlank()) {
            return AnalysisPayload(
                maskedText = "",
                source = DetectionSource.OFFLINE_LOCAL,
                riskLevel = preFilterResult.detectedRiskLevel,
                reasons = listOf(IRRELEVANT_REASON),
                shouldSendToBackend = false,
                metadata = emptyMap(),
            )
        }

        // Stage 5: Mask sensitive information before anything can leave the pipeline.
        val maskedText = mask(text)
        val maskingReasons = buildReasonsFromMask(maskedText, text)
        val reasons = (preFilterResult.reasons + maskingReasons)
            .distinct()
            .take(MAX_REASONS)

        // Stage 6: Return payload (no network request made).
        return AnalysisPayload(
            maskedText = maskedText,
            source = resolveSource(preFilterResult.matchedSignals),
            riskLevel = preFilterResult.detectedRiskLevel,
            reasons = reasons,
            shouldSendToBackend = true,
            metadata = buildMetadata(text),
        )
    }

    /** Applies every masking step in sequence. */
    private fun mask(text: String): String =
        Masker.maskOtp(text)
            .let { Masker.maskUpiPin(it) }
            .let { Masker.maskCardNumber(it) }
            .let { Masker.maskCvv(it) }
            .let { Masker.maskAccountNumber(it) }

    /**
     * Labels the result honestly: a local match that will be sent to the rule-based
     * backend is ONLINE_RULE_BASED; anything else is OFFLINE_LOCAL.
     */
    private fun resolveSource(matchedSignals: List<String>): DetectionSource {
        val ruleSignals = matchedSignals.filter { it != "urgency" }
        return if (ruleSignals.isEmpty()) {
            DetectionSource.OFFLINE_LOCAL
        } else {
            DetectionSource.ONLINE_RULE_BASED
        }
    }

    /** Content-free metadata flags for the payload. */
    private fun buildMetadata(text: String): Map<String, String> = buildMap {
        if (text.contains("http", ignoreCase = true)) put("has_url", "true")
        if (text.contains("otp", ignoreCase = true)) put("has_otp_signal", "true")
        if (text.contains("pin", ignoreCase = true)) put("has_pin_signal", "true")
    }

    /** Builds reasons from what masking actually changed, never from the values themselves. */
    private fun buildReasonsFromMask(masked: String, original: String): List<String> =
        if (original != masked) listOf("Sensitive value masked") else emptyList()

    private const val MAX_REASONS = 3
}
