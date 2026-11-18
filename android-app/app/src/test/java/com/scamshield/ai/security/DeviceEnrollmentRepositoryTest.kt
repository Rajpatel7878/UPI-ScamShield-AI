package com.scamshield.ai.security

import com.scamshield.ai.data.repository.DeviceEnrollmentRepositoryImpl
import com.scamshield.ai.domain.model.AppSettings
import com.scamshield.ai.domain.model.DetectionSensitivity
import com.scamshield.ai.domain.model.EnrolledDevice
import com.scamshield.ai.domain.model.EnrollmentResult
import com.scamshield.ai.domain.repository.SettingsRepository
import com.scamshield.ai.network.ApiClientFactory
import com.scamshield.ai.network.NetworkJson
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
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

class DeviceEnrollmentRepositoryTest {

    private lateinit var server: MockWebServer
    private lateinit var settingsRepository: FakeSettingsRepository
    private lateinit var tokenStore: FakeDeviceTokenStore
    private lateinit var enrolledStore: FakeEnrolledDeviceStore

    @Before
    fun setUp() {
        server = MockWebServer().apply { start() }
        settingsRepository = FakeSettingsRepository(server.url("/").toString())
        tokenStore = FakeDeviceTokenStore()
        enrolledStore = FakeEnrolledDeviceStore()
    }

    @After
    fun tearDown() {
        server.shutdown()
    }

    @Test
    fun `enrollment signs in then registers with a bearer JWT`() = runBlocking {
        server.enqueue(loginResponse())
        server.enqueue(registrationResponse(token = "ssdev_registered_token", deviceId = 7))

        val result = repository().enroll("user@example.com", "secret-password", "Pixel 7")

        assertEquals(EnrollmentResult.Success, result)

        val login = server.takeRequest()
        assertEquals("/api/v1/auth/login", login.path)
        val loginBody = NetworkJson.parseToJsonElement(login.body.readUtf8()).jsonObject
        assertEquals("user@example.com", loginBody["email"]!!.jsonPrimitive.content)
        assertEquals("secret-password", loginBody["password"]!!.jsonPrimitive.content)

        val register = server.takeRequest()
        assertEquals("/api/v1/devices/register", register.path)
        assertEquals("Bearer jwt-for-enrollment", register.getHeader("Authorization"))
        val registerBody = NetworkJson.parseToJsonElement(register.body.readUtf8()).jsonObject
        assertEquals("Pixel 7", registerBody["device_name"]!!.jsonPrimitive.content)

        assertEquals("ssdev_registered_token", tokenStore.token)
        assertEquals(7L, enrolledStore.device?.id)
        assertEquals("Pixel 7", enrolledStore.device?.name)

        // The JWT is never persisted.
        assertFalse(tokenStore.token!!.contains("jwt-for-enrollment"))
        assertFalse(enrolledStore.device.toString().contains("jwt-for-enrollment"))
    }

    @Test
    fun `wrong credentials return a clear message and store nothing`() = runBlocking {
        server.enqueue(MockResponse().setResponseCode(401).setBody("""{"detail":"Incorrect"}"""))

        val result = repository().enroll("user@example.com", "wrong", "Pixel 7")

        assertTrue(result is EnrollmentResult.Failure)
        assertEquals("Incorrect email or password.", (result as EnrollmentResult.Failure).message)
        assertNull(tokenStore.token)
        assertNull(enrolledStore.device)
        assertEquals(1, server.requestCount)
    }

    @Test
    fun `device limit conflict is explained`() = runBlocking {
        server.enqueue(loginResponse())
        server.enqueue(MockResponse().setResponseCode(409).setBody("""{"detail":"limit"}"""))

        val result = repository().enroll("user@example.com", "secret-password", "Pixel 7")

        val message = (result as EnrollmentResult.Failure).message
        assertTrue(message.contains("Active device limit"))
        assertNull(tokenStore.token)
    }

    @Test
    fun `registration without a token is treated as a failure`() = runBlocking {
        server.enqueue(loginResponse())
        server.enqueue(
            MockResponse()
                .setResponseCode(201)
                .setHeader("Content-Type", "application/json")
                .setBody(
                    """{"success":true,"device":{"id":9,"device_name":"Pixel 7","is_active":true},
                       "token":"","token_type":"device"}""",
                ),
        )

        val result = repository().enroll("user@example.com", "secret-password", "Pixel 7")

        assertTrue(result is EnrollmentResult.Failure)
        assertNull(tokenStore.token)
        assertNull(enrolledStore.device)
    }

    @Test
    fun `blank credentials are rejected before any request`() = runBlocking {
        val result = repository().enroll(" ", "secret-password", "Pixel 7")

        assertTrue(result is EnrollmentResult.Failure)
        assertEquals(0, server.requestCount)
    }

    @Test
    fun `invalid device name is rejected before any request`() = runBlocking {
        val result = repository().enroll("user@example.com", "secret-password", "  ")

        assertTrue(result is EnrollmentResult.Failure)
        assertEquals(0, server.requestCount)
    }

    @Test
    fun `network failure during sign-in is reported safely`() = runBlocking {
        server.shutdown()

        val result = repository().enroll("user@example.com", "secret-password", "Pixel 7")

        val message = (result as EnrollmentResult.Failure).message
        assertTrue(message.contains("Cannot reach the backend"))
        assertNull(tokenStore.token)
    }

    @Test
    fun `rotation uses the stored device id and replaces the token`() = runBlocking {
        enrolledStore.device = EnrolledDevice(id = 42, name = "Pixel 7")
        server.enqueue(loginResponse())
        server.enqueue(registrationResponse(token = "ssdev_rotated_token", deviceId = 42))

        val result = repository().rotate("user@example.com", "secret-password")

        assertEquals(EnrollmentResult.Success, result)
        server.takeRequest()
        val rotate = server.takeRequest()
        assertEquals("/api/v1/devices/42/rotate", rotate.path)
        assertEquals("Bearer jwt-for-enrollment", rotate.getHeader("Authorization"))
        assertEquals("ssdev_rotated_token", tokenStore.token)
    }

    @Test
    fun `rotation without an enrolled device sends nothing`() = runBlocking {
        val result = repository().rotate("user@example.com", "secret-password")

        assertTrue(result is EnrollmentResult.Failure)
        assertEquals(0, server.requestCount)
    }

    @Test
    fun `rotating a revoked device explains that it must be reconnected`() = runBlocking {
        enrolledStore.device = EnrolledDevice(id = 42, name = "Pixel 7")
        server.enqueue(loginResponse())
        server.enqueue(MockResponse().setResponseCode(409).setBody("""{"detail":"revoked"}"""))

        val result = repository().rotate("user@example.com", "secret-password")

        val message = (result as EnrollmentResult.Failure).message
        assertTrue(message.contains("revoked"))
    }

    @Test
    fun `rotating an unknown device explains that it must be reconnected`() = runBlocking {
        enrolledStore.device = EnrolledDevice(id = 42, name = "Pixel 7")
        server.enqueue(loginResponse())
        server.enqueue(MockResponse().setResponseCode(404).setBody("""{"detail":"missing"}"""))

        val result = repository().rotate("user@example.com", "secret-password")

        val message = (result as EnrollmentResult.Failure).message
        assertTrue(message.contains("no longer registered"))
    }

    @Test
    fun `forgetting the device clears the token and metadata`() = runBlocking {
        tokenStore.token = "ssdev_saved"
        enrolledStore.device = EnrolledDevice(id = 1, name = "Pixel 7")

        repository().forgetDevice()

        assertNull(tokenStore.token)
        assertNull(enrolledStore.device)
    }

    private fun repository() = DeviceEnrollmentRepositoryImpl(
        settingsRepository = settingsRepository,
        apiFactory = { url -> ApiClientFactory.create(baseUrl = url, requireHttps = false) },
        deviceTokenStore = tokenStore,
        enrolledDeviceStore = enrolledStore,
    )

    private fun loginResponse(): MockResponse = MockResponse()
        .setResponseCode(200)
        .setHeader("Content-Type", "application/json")
        .setBody("""{"access_token":"jwt-for-enrollment","token_type":"bearer"}""")

    private fun registrationResponse(token: String, deviceId: Long): MockResponse = MockResponse()
        .setResponseCode(201)
        .setHeader("Content-Type", "application/json")
        .setBody(
            """
            {"success":true,
             "device":{"id":$deviceId,"device_name":"Pixel 7","is_active":true},
             "token":"$token","token_type":"device"}
            """.trimIndent(),
        )

    private class FakeDeviceTokenStore(var token: String? = null) : DeviceTokenStore {
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

    private class FakeEnrolledDeviceStore(var device: EnrolledDevice? = null) : EnrolledDeviceStore {
        override suspend fun save(device: EnrolledDevice) {
            this.device = device
        }

        override suspend fun read(): EnrolledDevice? = device

        override suspend fun clear() {
            device = null
        }

        override fun observe(): Flow<EnrolledDevice?> = MutableStateFlow(device)
    }

    private class FakeSettingsRepository(baseUrl: String) : SettingsRepository {
        private val state = MutableStateFlow(AppSettings.defaults(backendUrl = baseUrl))

        override val settings: Flow<AppSettings> = state

        override suspend fun setBackendUrl(url: String) = Unit
        override suspend fun setMonitoringEnabled(enabled: Boolean) = Unit
        override suspend fun setSensitivity(sensitivity: DetectionSensitivity) = Unit
        override suspend fun setSkipSavedContacts(skip: Boolean) = Unit
        override suspend fun setSelectedPackages(packages: Set<String>) = Unit
        override suspend fun setWarningNotificationsEnabled(enabled: Boolean) = Unit
        override suspend fun setOnboardingCompleted(completed: Boolean) = Unit
    }
}
