package com.scamshield.ai.network

/**
 * Thin wrapper used by the app container. The API is created on demand so the
 * backend URL can change at runtime from Settings, and cached per base URL so a
 * notification check does not build a new OkHttp client every time.
 */
class NetworkModule(
    private val defaultBaseUrl: String,
    private val requireHttps: Boolean,
) {

    private val lock = Any()

    @Volatile
    private var cachedBaseUrl: String? = null

    @Volatile
    private var cachedApi: ScamShieldApi? = null

    fun createApi(baseUrl: String = defaultBaseUrl): ScamShieldApi {
        cachedApi?.takeIf { cachedBaseUrl == baseUrl }?.let { return it }
        return synchronized(lock) {
            cachedApi?.takeIf { cachedBaseUrl == baseUrl } ?: ApiClientFactory
                .create(baseUrl = baseUrl, requireHttps = requireHttps)
                .also { api ->
                    cachedBaseUrl = baseUrl
                    cachedApi = api
                }
        }
    }
}
