package com.scamshield.ai.network

/**
 * Result of a backend call. Failures carry safe, user-facing messages only; raw
 * provider errors, tokens and message content are never exposed.
 */
sealed interface ApiResult<out T> {

    data class Success<T>(val data: T) : ApiResult<T>

    sealed interface Failure : ApiResult<Nothing> {
        val message: String

        data class Unauthorized(
            override val message: String = "This device is not authorised. Re-enrol it to continue.",
        ) : Failure

        data class Forbidden(
            override val message: String = "This device is not allowed to use the analysis service.",
        ) : Failure

        data class Conflict(
            override val message: String = "The device could not be registered. Revoke an old device and try again.",
        ) : Failure

        data class NotFound(
            override val message: String = "The requested resource was not found.",
        ) : Failure

        data class RateLimited(
            val retryAfterSeconds: Long? = null,
            override val message: String = "Too many checks. Please wait a moment and try again.",
        ) : Failure

        data class Validation(
            override val message: String = "The message could not be validated.",
            val details: List<String> = emptyList(),
        ) : Failure

        data class Server(
            override val message: String = "The analysis service is unavailable right now.",
        ) : Failure

        data class Network(
            override val message: String = "No connection to the analysis service.",
        ) : Failure

        data class Unknown(
            override val message: String = "Unexpected response from the analysis service.",
        ) : Failure
    }
}
