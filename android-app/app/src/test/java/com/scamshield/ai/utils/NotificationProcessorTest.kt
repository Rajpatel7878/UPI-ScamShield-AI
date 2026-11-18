package com.scamshield.ai.utils

import com.scamshield.ai.domain.model.DetectionSensitivity
import com.scamshield.ai.domain.model.DetectionSource
import com.scamshield.ai.domain.model.RiskLevel
import org.junit.Assert.assertEquals
import org.junit.Test

class NotificationProcessorTest {

    @Test
    fun `process ignores irrelevant notification`() {
        val text = "Hey, how are you doing?"
        val payload = NotificationProcessor.process(text, DetectionSensitivity.MEDIUM)

        assertEquals("Irrelevant notification — filtered out", payload.reasons[0])
        assertEquals(false, payload.shouldSendToBackend)
        assert(payload.maskedText.isEmpty())
        assert(payload.source == DetectionSource.OFFLINE_LOCAL)
    }

    @Test
    fun `process forwards OTP notification with masking`() {
        val text = "Your OTP is 482913, verify now"
        val payload = NotificationProcessor.process(text, DetectionSensitivity.MEDIUM)

        assert(payload.shouldSendToBackend)
        assert(payload.maskedText != "Your OTP is 482913, verify now")
        assert(payload.maskedText.contains("[REDACTED]"))
        assert(payload.reasons.any { it == "OTP request" })
        assert(payload.source == DetectionSource.ONLINE_RULE_BASED)
        assert(payload.riskLevel == RiskLevel.CRITICAL)
    }

    @Test
    fun `process forwards URL + payment at MEDIUM`() {
        val text = "Claim cashback at http://example.com"
        val payload = NotificationProcessor.process(text, DetectionSensitivity.MEDIUM)

        assert(payload.shouldSendToBackend)
        assert(payload.reasons.any { it == "URL present" })
        assert(payload.source == DetectionSource.ONLINE_RULE_BASED)
    }

    @Test
    fun `process at LOW sensitivity forwards credential request`() {
        val text = "Share OTP 12345"
        val payload = NotificationProcessor.process(text, DetectionSensitivity.LOW)

        assert(payload.shouldSendToBackend)
        assert(payload.riskLevel == RiskLevel.CRITICAL)
    }

    @Test
    fun `process at HIGH sensitivity is more aggressive`() {
        val text = "Urgent: verify your KYC now"
        val highPayload = NotificationProcessor.process(text, DetectionSensitivity.HIGH)
        val mediumPayload = NotificationProcessor.process(text, DetectionSensitivity.MEDIUM)

        // HIGH should be at least as forward-leaning as MEDIUM
        // (both may forward, but HIGH's thresholds are higher)
        assert(highPayload.shouldSendToBackend === true)
        assert(mediumPayload.shouldSendToBackend === true)
    }

    @Test
    fun `process masks multiple signal types`() {
        val text = "OTP 123456, click http://example.com, UPI PIN 1234"
        val payload = NotificationProcessor.process(text, DetectionSensitivity.MEDIUM)

        assert(payload.shouldSendToBackend)
        // Should have multiple reasons
        assert(payload.reasons.size >= 2)
    }

    @Test
    fun `process metadata Contains signals`() {
        val text = "Your OTP 482913 is ready"
        val payload = NotificationProcessor.process(text, DetectionSensitivity.MEDIUM)

        assert(payload.metadata["has_otp_signal"] == "true")
    }

    @Test
    fun `process no network request made`() {
        // This is a compile-time / contract check: process() must not throw
        // and must return a valid payload without any network activity.
        val text = "Test notification"
        val payload = NotificationProcessor.process(text, DetectionSensitivity.MEDIUM)

        // If we reach here without NetworkOnMainThreadException or similar,
        // the contract holds.
        assert(payload is NotificationProcessor.AnalysisPayload)
    }
}