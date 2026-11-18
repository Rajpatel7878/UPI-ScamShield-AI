package com.scamshield.ai.notifications

import com.scamshield.ai.domain.model.DetectionRecord
import com.scamshield.ai.domain.model.DetectionSource
import com.scamshield.ai.domain.model.RiskLevel
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class WarningPolicyTest {

    @Test
    fun `high and critical results are eligible`() {
        assertTrue(WarningPolicy.shouldWarn(RiskLevel.HIGH, true, true))
        assertTrue(WarningPolicy.shouldWarn(RiskLevel.CRITICAL, true, true))
    }

    @Test
    fun `low medium and unknown results are suppressed`() {
        assertFalse(WarningPolicy.shouldWarn(RiskLevel.LOW, true, true))
        assertFalse(WarningPolicy.shouldWarn(RiskLevel.MEDIUM, true, true))
        assertFalse(WarningPolicy.shouldWarn(RiskLevel.UNKNOWN, true, true))
    }

    @Test
    fun `user setting and notification permission are respected`() {
        assertFalse(WarningPolicy.shouldWarn(RiskLevel.CRITICAL, warningsEnabled = false, notificationsAllowed = true))
        assertFalse(WarningPolicy.shouldWarn(RiskLevel.CRITICAL, warningsEnabled = true, notificationsAllowed = false))
    }

    @Test
    fun `warning titles match the required wording`() {
        assertEquals("Potential Scam Detected", WarningPolicy.build(record(RiskLevel.HIGH, 72))!!.title)
        assertEquals("Critical Fraud Warning", WarningPolicy.build(record(RiskLevel.CRITICAL, 95))!!.title)
    }

    @Test
    fun `low and medium results build no notification content`() {
        assertNull(WarningPolicy.build(record(RiskLevel.LOW, 10)))
        assertNull(WarningPolicy.build(record(RiskLevel.MEDIUM, 45)))
    }

    @Test
    fun `channels and urgency differ between high and critical`() {
        val high = WarningPolicy.build(record(RiskLevel.HIGH, 70))!!
        val critical = WarningPolicy.build(record(RiskLevel.CRITICAL, 90))!!

        assertNotEquals(high.channelId, critical.channelId)
        assertEquals(WarningUrgency.WARNING, high.urgency)
        assertEquals(WarningUrgency.PROMINENT, critical.urgency)
    }

    @Test
    fun `content carries only score category and the generic backend warning`() {
        val content = WarningPolicy.build(record(RiskLevel.CRITICAL, 91))!!

        assertTrue(content.text.contains("91/100"))
        assertTrue(content.text.contains("Credential Theft"))
        assertTrue(content.text.contains("Do not share OTP"))
        assertFalse("reason labels are not needed in the notification", content.text.contains("Asks for an OTP"))
    }

    @Test
    fun `blank backend warning falls back to a safe generic message`() {
        val content = WarningPolicy.build(record(RiskLevel.HIGH, 65, warning = "  \n "))!!

        assertTrue(content.text.contains("shows scam warning signs"))
        assertFalse(content.text.contains("\n"))
    }

    @Test
    fun `control characters and newlines are stripped`() {
        val content = WarningPolicy.build(record(RiskLevel.HIGH, 66, warning = "Line one\nline two\u0000"))!!

        assertFalse(content.text.contains("\n"))
        assertFalse(content.text.contains("\u0000"))
        assertTrue(content.text.contains("Line one line two"))
    }

    @Test
    fun `duplicate events only warn once`() {
        val deduplicator = WarningDeduplicator(maxEntries = 2)

        assertTrue(deduplicator.firstTime(1))
        assertFalse(deduplicator.firstTime(1))
        assertTrue(deduplicator.firstTime(2))
        assertTrue(deduplicator.firstTime(3))
        // Entry 1 was evicted once the bounded set filled up.
        assertTrue(deduplicator.firstTime(1))
    }

    @Test
    fun `forgotten events can warn again`() {
        val deduplicator = WarningDeduplicator()

        assertTrue(deduplicator.firstTime(9))
        deduplicator.forget(9)
        assertTrue(deduplicator.firstTime(9))
    }

    private fun record(
        level: RiskLevel,
        score: Int,
        warning: String = "Do not share OTP or UPI PIN or pay. Verify independently.",
    ): DetectionRecord = DetectionRecord(
        id = 1,
        riskScore = score,
        riskLevel = level,
        category = "Credential Theft",
        sourceApp = "com.whatsapp",
        timestamp = 1_700_000_000_000L,
        analysisSource = DetectionSource.ONLINE_RULE_BASED,
        warningText = warning,
        reasons = listOf("Asks for an OTP", "Asks for a UPI PIN"),
    )
}
