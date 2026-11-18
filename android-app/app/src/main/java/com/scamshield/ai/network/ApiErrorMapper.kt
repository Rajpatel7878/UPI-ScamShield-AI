package com.scamshield.ai.network

import java.io.IOException
import kotlinx.serialization.SerializationException
import kotlinx.serialization.Serializable

/**
 * Maps HTTP and transport failures to a small set of typed failures. Error bodies
 * are parsed defensively and never surfaced verbatim beyond the backend's own
 * validation messages.
 */
internal object ApiErrorMapper {

    fun fromHttp(
        code: Int,
        errorBody: String?,
        retryAfterHeader: String?,
    ): ApiResult.Failure = when {
        code == 401 -> ApiResult.Failure.Unauthorized()
        code == 403 -> ApiResult.Failure.Forbidden()
        code == 409 -> ApiResult.Failure.Conflict()
        code == 404 -> ApiResult.Failure.NotFound()
        code == 429 -> ApiResult.Failure.RateLimited(
            retryAfterSeconds = retryAfterHeader?.trim()?.toLongOrNull()?.coerceAtLeast(1),
        )
        code == 422 -> ApiResult.Failure.Validation(
            details = parse(errorBody)?.errors?.mapNotNull { it.msg }?.take(3).orEmpty(),
        )
        // The backend reports analysis failures as 500. Other 5xx responses come from
        // an unexpected proxy/gateway layer, so they are surfaced as unknown failures.
        code == 500 -> ApiResult.Failure.Server()
        else -> ApiResult.Failure.Unknown()
    }

    fun fromException(error: Throwable): ApiResult.Failure = when (error) {
        is SerializationException -> ApiResult.Failure.Unknown()
        is IOException -> ApiResult.Failure.Network()
        else -> ApiResult.Failure.Unknown()
    }

    private fun parse(body: String?): ErrorEnvelope? {
        val trimmed = body?.trim()
        if (trimmed.isNullOrEmpty()) return null
        return runCatching { NetworkJson.decodeFromString<ErrorEnvelope>(trimmed) }.getOrNull()
    }

    @Serializable
    private data class ErrorEnvelope(
        val detail: String? = null,
        val errors: List<ValidationItem> = emptyList(),
    )

    @Serializable
    private data class ValidationItem(
        val msg: String? = null,
        val type: String? = null,
    )
}
