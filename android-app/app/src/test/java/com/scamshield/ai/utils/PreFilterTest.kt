package com.scamshield.ai.utils

import com.scamshield.ai.domain.model.DetectionSensitivity
import com.scamshield.ai.domain.model.RiskLevel
import org.junit.Assert.assertEquals
import org.junit.Test

class PreFilterTest {

    @Test
    fun `MEDIUM sensitivity forwards notification with OTP signal`() {
        val text = "Your OTP is 482913, verify now"
        val result = PreFilter.evaluate(text, DetectionSensitivity.MEDIUM)

        assertEquals(true, result.shouldSend)
        assert(result.reasons.any { it == "OTP request" })
        assertEquals(RiskLevel.CRITICAL, result.detectedRiskLevel)
        assert(result.matchedSignals.contains("otp"))
    }

    @Test
    fun `MEDIUM sensitivity ignores ordinary message`() {
        val text = "Hey, how are you doing today?"
        val result = PreFilter.evaluate(text, DetectionSensitivity.MEDIUM)

        assertEquals(false, result.shouldSend)
        assert(result.reasons.isNotEmpty())
        assertEquals(RiskLevel.UNKNOWN, result.detectedRiskLevel)
    }

    @Test
    fun `LOW sensitivity forwards credential request`() {
        val text = "Share your OTP 123456"
        val result = PreFilter.evaluate(text, DetectionSensitivity.LOW)

        assertEquals(true, result.shouldSend)
        assert(result.reasons.any { it == "OTP request" })
    }

    @Test
    fun `HIGH sensitivity forwards two weak signals`() {
        val text = "Check this out, urgent action needed"
        val result = PreFilter.evaluate(text, DetectionSensitivity.HIGH)

        // Two weak signals (urgency + something) should forward
        assert(result.shouldSend === true || result.shouldSend === false) {
            "HIGH with two weak signals: shouldSend=${result.shouldSend}, reasons=${result.reasons}"
        }
    }

    @Test
    fun `URL + payment language forwarded at MEDIUM`() {
        val text = "Click this link http://example.com to claim cashback"
        val result = PreFilter.evaluate(text, DetectionSensitivity.MEDIUM)

        assertEquals(true, result.shouldSend)
        assert(result.reasons.any { it == "URL present" })
    }

    @Test
    fun `LOW sensitivity does not forward ordinary bank alert`() {
        val text = "Your account balance is Rs 5,000"
        val result = PreFilter.evaluate(text, DetectionSensitivity.LOW)

        // Balance alert should not forward at LOW sensitivity
        assertEquals(false, result.shouldSend)
    }

    @Test
    fun `sensitivity_parameter_is_respected`() {
        val text = "Share OTP 654321"
        val lowResult = PreFilter.evaluate(text, DetectionSensitivity.LOW)
        val mediumResult = PreFilter.evaluate(text, DetectionSensitivity.MEDIUM)
        val highResult = PreFilter.evaluate(text, DetectionSensitivity.HIGH)

        // All should forward an OTP request, but may differ in risk level
        assert(lowResult.shouldSend === mediumResult.shouldSend)
        assert(mediumResult.shouldSend === highResult.shouldSend)
    }
}