package com.scamshield.ai.network

import com.scamshield.ai.utils.BackendUrlPolicy
import java.util.concurrent.TimeUnit
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory

/**
 * Builds the API client.
 *
 * - Timeouts are bounded: 5 s connect, 12 s read/write (the quick endpoint bounds AI
 *   to 4.5 s server-side, so 12 s leaves room for slow mobile networks).
 * - No HTTP logging interceptor exists, so request bodies, message text and the
 *   `X-Device-Token` header can never reach Logcat through this client.
 * - Release builds reject non-HTTPS base URLs.
 */
object ApiClientFactory {

    private const val CONNECT_TIMEOUT_SECONDS = 5L
    private const val READ_TIMEOUT_SECONDS = 12L

    fun create(
        baseUrl: String,
        requireHttps: Boolean,
    ): ScamShieldApi {
        val normalizedBaseUrl = when (val result = BackendUrlPolicy.normalize(baseUrl, requireHttps)) {
            is BackendUrlPolicy.Result.Valid -> result.url
            is BackendUrlPolicy.Result.Invalid ->
                throw IllegalArgumentException(result.reason)
        }

        val client = OkHttpClient.Builder()
            .connectTimeout(CONNECT_TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .readTimeout(READ_TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .writeTimeout(READ_TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .callTimeout(READ_TIMEOUT_SECONDS + CONNECT_TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
            .build()

        return Retrofit.Builder()
            .baseUrl(normalizedBaseUrl)
            .client(client)
            .addConverterFactory(
                NetworkJson.asConverterFactory("application/json".toMediaType()),
            )
            .build()
            .create(ScamShieldApi::class.java)
    }
}
