package com.scamshield.ai.security

import android.os.Build

/**
 * Produces the backend's `device_name` value: 1-100 printable characters, no control
 * characters, whitespace collapsed (matching `DeviceRegisterRequest` validation).
 */
object DeviceNames {

    private const val MAX_LENGTH = 100
    private const val FALLBACK = "Android device"

    /** Best-effort label for this device, safe for the backend validator. */
    fun thisDevice(): String {
        val manufacturer = Build.MANUFACTURER.orEmpty().trim()
        val model = Build.MODEL.orEmpty().trim()
        val combined = listOf(manufacturer, model)
            .filter { it.isNotEmpty() && !it.equals("unknown", ignoreCase = true) }
            .joinToString(" ")
        return normalize(combined) ?: FALLBACK
    }

    /** Returns a cleaned name, or null when nothing valid remains. */
    fun normalize(raw: String?): String? {
        if (raw == null) return null
        val printable = raw.filter { character -> character.isLetterOrDigit() || character in ALLOWED }
        val collapsed = printable.split(Regex("\\s+"))
            .filter { it.isNotBlank() }
            .joinToString(" ")
        if (collapsed.isBlank()) return null
        return collapsed.take(MAX_LENGTH).trim().ifEmpty { null }
    }

    private const val ALLOWED = " ._-()+/@&':"
}
