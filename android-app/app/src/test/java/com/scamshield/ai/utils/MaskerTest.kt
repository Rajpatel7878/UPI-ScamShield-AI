package com.scamshield.ai.utils

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class MaskerTest {

    @Test
    fun `maskOtp masks OTP digits`() {
        val input = "Your OTP is 482913"
        val output = Masker.maskOtp(input)
        assertEquals("Your OTP is [REDACTED]", output)
        assertTrue(output.none { it.isDigit() })
    }

    @Test
    fun `maskOtp preserves surrounding text`() {
        val input = "The OTP is 482913 thanks"
        val output = Masker.maskOtp(input)
        assertTrue(output.contains("OTP"))
        assertTrue(output.contains("[REDACTED]"))
    }

    @Test
    fun `maskUpiPin masks PIN digits`() {
        val input = "Enter UPI PIN 1234"
        val output = Masker.maskUpiPin(input)
        assertEquals("Enter UPI PIN [REDACTED]", output)
    }

    @Test
    fun `maskUpiPin preserves text without PIN`() {
        val input = "Hello how are you"
        val output = Masker.maskUpiPin(input)
        assertEquals(input, output)
    }

    @Test
    fun `maskCardNumber with card context masks`() {
        val input = "Card 4111 1111 1111 1111"
        val output = Masker.maskCardNumber(input)
        assertTrue(output.contains("[REDACTED]"))
    }

    @Test
    fun `maskCardNumber without card context leaves long numbers`() {
        // An ordinary 13-19 digit number without "card" context should be left alone
        val input = "Meeting at 1234567890123"
        val output = Masker.maskCardNumber(input)
        // Should NOT have [REDACTED] since there's no card context
        assertEquals(input, output)
    }

    @Test
    fun `maskCvv masks CVV`() {
        val input = "CVV 123"
        val output = Masker.maskCvv(input)
        assertEquals("CVV [REDACTED]", output)
    }

    @Test
    fun `maskAccountNumber masks account`() {
        val input = "a/c 987654321"
        val output = Masker.maskAccountNumber(input)
        assertTrue(output.contains("[REDACTED]"))
    }

    @Test
    fun `maskPassword masks password`() {
        val input = "password is secret123"
        val output = Masker.maskPassword(input)
        assertTrue(output.contains("[REDACTED]"))
    }

    @Test
    fun `masking_is_idempotent`() {
        val input = "OTP 482913 and UPI PIN 1234"
        val first = Masker.maskOtp(input)
        val second = Masker.maskOtp(first)
        assertEquals(first, second)
    }

    @Test
    fun `mixed Hinglish text is preserved`() {
        val input = "KYC update karo, OTP aaya 4567"
        val output = Masker.maskOtp(input)
        assertTrue(output.contains("[REDACTED]"))
        assertTrue(output.contains("KYC"))
    }
}