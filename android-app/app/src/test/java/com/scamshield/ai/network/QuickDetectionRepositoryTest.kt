package com.scamshield.ai.network

import com.scamshield.ai.data.repository.QuickDetectionRepositoryImpl
import com.scamshield.ai.domain.model.AppSettings
import com.scamshield.ai.domain.model.DetectionOutcome
import com.scamshield.ai.domain.model.DetectionSensitivity
import com.scamshield.ai.domain.model.DetectionSource
import com.scamshield.ai.domain.model.RiskLevel
import com.scamshield.ai.domain.repository.SettingsRepository
import com.scamshield.ai.network.dto.DeviceRegisterRequest
import com.scamshield.ai.network.dto.DeviceTokenResponse
import com.scamshield.ai.network.dto.LoginRequest
import com.scamshield.ai.network.dto.LoginResponse
import com.scamshield.ai.network.dto.QuickDetectionRequest
import com.scamshield.ai.network.dto.QuickDetectionResponse
import com.scamshield.ai.security.DeviceTokenStore
import java.net.SocketTimeoutException
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import retrofit2.Response

class QuickDetectionRepositoryTest {

    private lateinit var server: MockWebServer
    private lateinit var settingsRepository: FakeSettingsRepository
    private lateinit var tokenStore: FakeDeviceTokenStore

    @Before
    fun setUp() {
        server = MockWebServer().apply { start() }
        settingsRepository = FakeSettingsRepository(server.url("/").toString())
        tokenStore = FakeDeviceTokenStore("ssdev_test_token")
    }

    @After
    fun tearDown() {
        server.shutdown()
    }

    @Test
    fun `request uses device header and serializes masked text only`() = runBlocking {
        server.enqueue(jsonResponse(SUCCESS_BODY))

        val outcome = repository().analyze(
            maskedText = "Your KYC is expired. Share OTP [REDACTED].",
            sender = "BANK-ALERT",
            sourceApp = "com.google.android.apps.messaging",
            timestamp = 1_700_000_000_000L,
        )

        val request = server.takeRequest()
        assertEquals("/api/v1/detect/quick", request.path)
        assertEquals("ssdev_test_token", request.getHeader("X-Device-Token"))
        assertEquals("POST", request.method)

        val rawBody = request.body.readUtf8()
        val body = NetworkJson.parseToJsonElement(rawBody).jsonObject
        assertEquals(
            "Your KYC is expired. Share OTP [REDACTED].",
            body["text"]!!.jsonPrimitive.content,
        )
        assertEquals("BANK-ALERT", body["sender"]!!.jsonPrimitive.content)
        assertEquals(
            "com.google.android.apps.messaging",
            body["source_app"]!!.jsonPrimitive.content,
        )
        assertFalse("raw OTP digits must not appear in the request", rawBody.contains("482913"))

        val result = (outcome as DetectionOutcome.Analyzed).result
        assertEquals(100, result.riskScore)
        assertEquals(RiskLevel.CRITICAL, result.riskLevel)
        assertEquals("Credential Theft", result.category)
        assertEquals(2, result.reasons.size)
        assertEquals(DetectionSource.ONLINE_RULE_BASED, result.analysisSource)
        assertEquals("com.google.android.apps.messaging", result.sourceApp)
        assertEquals(1_700_000_000_000L, result.timestamp)
    }

    @Test
    fun `optional fields are omitted when absent`() = runBlocking {
        server.enqueue(jsonResponse(SUCCESS_BODY))

        repository().analyze(maskedText = "Suspicious message")

        val body = NetworkJson.parseToJsonElement(server.takeRequest().body.readUtf8()).jsonObject
        assertEquals("Suspicious message", body["text"]!!.jsonPrimitive.content)
        assertFalse(body.containsKey("sender"))
        assertFalse(body.containsKey("source_app"))
    }

    @Test
    fun `hybrid analysis type is mapped honestly`() = runBlocking {
        server.enqueue(
            jsonResponse(
                """
                {"risk_score":55,"risk_level":"Medium","category":"General Scam",
                 "warning_text":"Some scam indicators were found.",
                 "reasons":["Urgency language"],"analysis_type":"hybrid"}
                """.trimIndent(),
            ),
        )

        val result = (repository().analyze("Check this") as DetectionOutcome.Analyzed).result
        assertEquals(DetectionSource.ONLINE_HYBRID, result.analysisSource)
        assertEquals(RiskLevel.MEDIUM, result.riskLevel)
    }

    @Test
    fun `401 clears the stored token and reports not authorised`() = runBlocking {
        server.enqueue(MockResponse().setResponseCode(401).setBody("""{"detail":"Invalid"}"""))

        val outcome = repository().analyze("Suspicious message")

        assertEquals(DetectionOutcome.NotAuthorised, outcome)
        assertNull(tokenStore.token)
    }

    @Test
    fun `403 also clears the stored token`() = runBlocking {
        server.enqueue(MockResponse().setResponseCode(403))

        val outcome = repository().analyze("Suspicious message")

        assertEquals(DetectionOutcome.NotAuthorised, outcome)
        assertNull(tokenStore.token)
    }

    @Test
    fun `429 is reported with retry-after and the token is kept`() = runBlocking {
        server.enqueue(
            MockResponse()
                .setResponseCode(429)
                .setHeader("Retry-After", "30")
                .setBody("""{"detail":"Too many"}"""),
        )

        val outcome = repository().analyze("Suspicious message")

        assertEquals(DetectionOutcome.RateLimited(30L), outcome)
        assertEquals("ssdev_test_token", tokenStore.token)
    }

    @Test
    fun `unparseable response never produces a score`() = runBlocking {
        server.enqueue(jsonResponse("this is not json"))

        assertEquals(DetectionOutcome.Unavailable, repository().analyze("Suspicious message"))
    }

    @Test
    fun `out-of-range or unknown risk data is rejected`() = runBlocking {
        server.enqueue(
            jsonResponse(
                """
                {"risk_score":140,"risk_level":"Critical","category":"Credential Theft",
                 "warning_text":"High risk","reasons":[],"analysis_type":"rule_based_only"}
                """.trimIndent(),
            ),
        )

        assertEquals(DetectionOutcome.Unavailable, repository().analyze("Suspicious message"))
    }

    @Test
    fun `unknown risk label is rejected`() = runBlocking {
        server.enqueue(
            jsonResponse(
                """
                {"risk_score":80,"risk_level":"Severe","category":"Credential Theft",
                 "warning_text":"High risk","reasons":[],"analysis_type":"rule_based_only"}
                """.trimIndent(),
            ),
        )

        assertEquals(DetectionOutcome.Unavailable, repository().analyze("Suspicious message"))
    }

    @Test
    fun `blank text is not sent`() = runBlocking {
        val outcome = repository().analyze("   ")

        assertTrue(outcome is DetectionOutcome.Rejected)
        assertEquals(0, server.requestCount)
    }

    @Test
    fun `text over the backend limit is not sent`() = runBlocking {
        val outcome = repository().analyze("a".repeat(2_001))

        assertTrue(outcome is DetectionOutcome.Rejected)
        assertEquals(0, server.requestCount)
    }

    @Test
    fun `no token means no network request`() = runBlocking {
        tokenStore.token = null

        assertEquals(DetectionOutcome.NotEnrolled, repository().analyze("Suspicious message"))
        assertEquals(0, server.requestCount)
    }

    @Test
    fun `connection failure is unavailable and keeps the token`() = runBlocking {
        server.shutdown()

        assertEquals(DetectionOutcome.Unavailable, repository().analyze("Suspicious message"))
        assertEquals("ssdev_test_token", tokenStore.token)
    }

    @Test
    fun `timeout maps to unavailable`() = runBlocking {
        val repository = QuickDetectionRepositoryImpl(
            settingsRepository = settingsRepository,
            deviceTokenStore = tokenStore,
            apiFactory = { TimeoutApi },
        )

        assertEquals(DetectionOutcome.Unavailable, repository.analyze("Suspicious message"))
    }

    @Test
    fun `server error never invents a result`() = runBlocking {
        server.enqueue(MockResponse().setResponseCode(500).setBody("""{"detail":"boom"}"""))

        assertEquals(DetectionOutcome.Unavailable, repository().analyze("Suspicious message"))
    }

    private fun repository() = QuickDetectionRepositoryImpl(
        settingsRepository = settingsRepository,
        deviceTokenStore = tokenStore,
        apiFactory = { url -> ApiClientFactory.create(baseUrl = url, requireHttps = false) },
    )

    private fun jsonResponse(body: String): MockResponse = MockResponse()
        .setResponseCode(200)
        .setHeader("Content-Type", "application/json")
        .setBody(body)

    private class FakeDeviceTokenStore(var token: String?) : DeviceTokenStore {
        override suspend fun save(token: String) {
            this.token = token
        }

        override suspend fun read(): String? = token

        override suspend fun clear() {
            token = null
        }

        override fun observeHasToken(): Flow<Boolean> =
            MutableStateFlow(token).map { !it.isNullOrBlank() }
    }

    private class FakeSettingsRepository(baseUrl: String) : SettingsRepository {
        private val state = MutableStateFlow(AppSettings.defaults(backendUrl = baseUrl))

        override val settings: Flow<AppSettings> = state

        override suspend fun setBackendUrl(url: String) {
            state.value = state.value.copy(backendUrl = url)
        }

        override suspend fun setMonitoringEnabled(enabled: Boolean) = Unit
        override suspend fun setSensitivity(sensitivity: DetectionSensitivity) = Unit
        override suspend fun setSkipSavedContacts(skip: Boolean) = Unit
        override suspend fun setSelectedPackages(packages: Set<String>) = Unit
        override suspend fun setWarningNotificationsEnabled(enabled: Boolean) = Unit
        override suspend fun setOnboardingCompleted(completed: Boolean) = Unit
    }

    /** Every quick-detection call times out; enrollment calls are not used. */
    private object TimeoutApi : ScamShieldApi {
        override suspend fun login(request: LoginRequest): Response<LoginResponse> =
            throw IllegalStateException("not used")

        override suspend fun registerDevice(
            authorization: String,
            request: DeviceRegisterRequest,
        ): Response<DeviceTokenResponse> = throw IllegalStateException("not used")

        override suspend fun rotateDevice(
            authorization: String,
            deviceId: Long,
        ): Response<DeviceTokenResponse> = throw IllegalStateException("not used")

        override suspend fun quickDetect(
            deviceToken: String,
            request: QuickDetectionRequest,
        ): Response<QuickDetectionResponse> = throw SocketTimeoutException("timeout")
    }

    private companion object {
        const val SUCCESS_BODY = """
            {
              "risk_score": 100,
              "risk_level": "Critical",
              "category": "Credential Theft",
              "warning_text": "High scam risk. Do not share OTP or UPI PIN or pay. Verify independently.",
              "reasons": ["Asks for an OTP", "Asks for a UPI PIN"],
              "analysis_type": "rule_based_only"
            }
        """
    }
}
