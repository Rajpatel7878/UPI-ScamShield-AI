package com.scamshield.ai.utils

import android.util.Log

/**
 * Conservative sensitive-data masking for notification content.
 * Masks credential values (OTPs, PINs, card numbers, CVV, account numbers)
 * while preserving surrounding context so rule detection still works.
 *
 * Principles:
 * - Mask credential values, not every number.
 * - Preserve surrounding words so rule detection still works
 *   ("OTP 123456" → "OTP [REDACTED]" still matches the OTP rule).
 * - Never mask amounts (Rs 5,000), dates, OTP validity ("10 minutes"),
 *   order IDs, or ordinary 4-8 digit numbers without credential context.
 * - The replacement token is [REDACTED].
 *
 * Important: The existing backend redact_credentials() is NOT removed or rewritten.
 * It remains the final safety net inside provider services. The quick pipeline
 * pre-masks before provider calls.
 */
object Masker {

    private const val TAG = "Masker"
    private const val REDACTED = "[REDACTED]"

    /** A short run of non-digit characters between a credential keyword and its value. */
    private const val GAP = "([^\\d\\n\\[\\]]{0,24}?)"

    private const val OTP_KEYWORDS =
        "otp|one[\\s-]?time[\\s-]?(?:password|code)|verification\\s+(?:code|number)|authentication\\s+code"

    private const val UPI_PIN_KEYWORDS = "upi[\\s-]?pin|m[\\s.-]?pin|mpin|pin"

    private const val CARD_KEYWORDS = "card|credit\\s+card|debit\\s+card"

    private const val CARD_NUMBER = "\\d{4}[ -]?\\d{4}[ -]?\\d{4}[ -]?\\d{1,7}"

    private const val ACCOUNT_KEYWORDS =
        "a\\s*[/.]?\\s*c(?:\\s*(?:no\\.?|number))?|account\\s*(?:no\\.?|number)?"

    /**
     * Masks OTP/verification codes in the text.
     * Triggers on "OTP", "one-time password", "verification code", "authentication code"
     * near 4-8 digit numbers. Only the digits are replaced.
     */
    fun maskOtp(text: String): String {
        val result = maskDigitsAfterKeyword(text, OTP_KEYWORDS, "\\d{4,8}")
        logMask("OTP", text, result)
        return result
    }

    /**
     * Masks UPI PINs in the text.
     * Triggers on "UPI PIN", "M-PIN", "MPIN", or "PIN" near 4-6 digit numbers.
     * Only the digits are replaced.
     */
    fun maskUpiPin(text: String): String {
        val result = maskDigitsAfterKeyword(text, UPI_PIN_KEYWORDS, "\\d{4,6}")
        logMask("UPI PIN", text, result)
        return result
    }

    /**
     * Masks card numbers (13-19 digits, optionally grouped with spaces/hyphens).
     * Only masks when the notification explicitly talks about a card, so ordinary
     * 13-19 digit numbers (order IDs, timestamps) are left alone.
     */
    fun maskCardNumber(text: String): String {
        val result = if (hasCardContext(text)) {
            maskDigitsAfterKeyword(text, CARD_KEYWORDS, CARD_NUMBER)
        } else {
            text
        }
        logMask("Card", text, result)
        return result
    }

    /** Masks CVV/CVC values in the text. */
    fun maskCvv(text: String): String {
        val result = maskDigitsAfterKeyword(text, "cvv|cvc|security\\s*code", "\\d{3,4}")
        logMask("CVV", text, result)
        return result
    }

    /** Masks account numbers in the text. */
    fun maskAccountNumber(text: String): String {
        val result = maskDigitsAfterKeyword(text, ACCOUNT_KEYWORDS, "\\d{9,18}")
        logMask("Account", text, result)
        return result
    }

    /** Masks Aadhaar numbers in the text. */
    fun maskAadhaar(text: String): String {
        val result = maskDigitsAfterKeyword(text, "aadhaar|aadhar|uid", "(?:\\d{4}\\s?){3}")
        logMask("Aadhaar", text, result)
        return result
    }

    /** Masks passwords/authentication secrets in the text. */
    fun maskPassword(text: String): String {
        val regex = Regex("(?i)\\b((?:password|pass)\\s*(?:is|:)\\s*)(\\S+)")
        val result = regex.replace(text) { match -> match.groupValues[1] + REDACTED }
        logMask("Password", text, result)
        return result
    }

    /** Returns true when the text explicitly mentions a card. */
    private fun hasCardContext(text: String): Boolean {
        val lower = text.lowercase()
        return listOf("card", "credit", "debit").any { lower.contains(it) }
    }

    /**
     * Replaces the digit value that follows a credential keyword with [REDACTED],
     * keeping the keyword and its surrounding context untouched.
     */
    private fun maskDigitsAfterKeyword(text: String, keywords: String, digits: String): String {
        val regex = Regex("(?i)\\b($keywords)$GAP($digits)\\b")
        return regex.replace(text) { match ->
            val keyword = match.groupValues[1]
            val gap = match.groupValues[2]
            "$keyword$gap$REDACTED"
        }
    }

    /** Logs masking activity without ever outputting original or masked content. */
    private fun logMask(component: String, original: String, masked: String) {
        if (Log.isLoggable(TAG, Log.DEBUG)) {
            val applied = original != masked
            val hash = original.hashCode() and 0x7FFFFFFF
            Log.d(TAG, "$component maskingApplied=$applied originalHash=$hash")
        }
    }
}
