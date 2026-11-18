package com.scamshield.ai.network

import kotlinx.coroutines.CancellationException
import retrofit2.Response

object ApiExecutor {

    /**
     * Executes a Retrofit call and converts the outcome into [ApiResult].
     *
     * Cancellation is rethrown so structured concurrency keeps working; every
     * other failure becomes a typed, safe failure.
     */
    suspend fun <T : Any> execute(call: suspend () -> Response<T>): ApiResult<T> = try {
        val response = call()
        val body = response.body()
        when {
            response.isSuccessful && body != null -> ApiResult.Success(body)
            else -> {
                val rawError = runCatching { response.errorBody()?.string() }.getOrNull()
                ApiErrorMapper.fromHttp(
                    code = response.code(),
                    errorBody = rawError,
                    retryAfterHeader = response.headers()["Retry-After"],
                )
            }
        }
    } catch (cancellation: CancellationException) {
        throw cancellation
    } catch (error: Exception) {
        ApiErrorMapper.fromException(error)
    }
}
