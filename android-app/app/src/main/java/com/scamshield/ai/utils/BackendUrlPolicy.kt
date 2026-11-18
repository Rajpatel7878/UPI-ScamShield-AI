package com.scamshield.ai.utils

import okhttp3.HttpUrl.Companion.toHttpUrlOrNull

/**
 * Validates and normalizes the user-configured backend base URL.
 *
 * Release builds require HTTPS. Debug builds may use HTTP for the emulator
 * (`10.0.2.2`), a LAN address or a local tunnel.
 */
object BackendUrlPolicy {

    sealed interface Result {
        data class Valid(val url: String) : Result
        data class Invalid(val reason: String) : Result
    }

    fun normalize(raw: String, requireHttps: Boolean): Result {
        val trimmed = raw.trim()
        if (trimmed.isEmpty()) {
            return Result.Invalid("Enter the backend URL.")
        }

        val parsed = trimmed.toHttpUrlOrNull()
            ?: return Result.Invalid("Enter a full URL, for example http://10.0.2.2:8000/")

        if (parsed.username.isNotEmpty() || parsed.password.isNotEmpty()) {
            return Result.Invalid("The URL must not contain a username or password.")
        }
        if (requireHttps && !parsed.isHttps) {
            return Result.Invalid("Release builds require an HTTPS backend URL.")
        }

        val cleaned = parsed.newBuilder()
            .query(null)
            .fragment(null)
            .build()

        val value = cleaned.toString().let { if (it.endsWith("/")) it else "$it/" }
        return Result.Valid(value)
    }
}
