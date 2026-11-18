package com.scamshield.ai.data.repository

import com.scamshield.ai.domain.model.EnrollmentResult
import com.scamshield.ai.domain.model.EnrolledDevice
import com.scamshield.ai.domain.repository.DeviceEnrollmentRepository
import com.scamshield.ai.domain.repository.SettingsRepository
import com.scamshield.ai.network.ApiExecutor
import com.scamshield.ai.network.ApiResult
import com.scamshield.ai.network.ScamShieldApi
import com.scamshield.ai.network.dto.DeviceRegisterRequest
import com.scamshield.ai.network.dto.LoginRequest
import com.scamshield.ai.security.DeviceNames
import com.scamshield.ai.security.DeviceTokenStore
import com.scamshield.ai.security.EnrolledDeviceStore
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first

/**
 * Enrolls and rotates this installation's device credential against the Phase 1
 * backend contract:
 *
 * `POST /api/v1/auth/login` (user JWT, in memory only)
 * → `POST /api/v1/devices/register` (or `/devices/{id}/rotate`)
 * → device token stored through the Keystore-backed [DeviceTokenStore].
 *
 * The JWT and password are local variables that go out of scope; neither is persisted
 * or logged, and neither is ever placed in an error message.
 */
class DeviceEnrollmentRepositoryImpl(
    private val settingsRepository: SettingsRepository,
    private val apiFactory: (String) -> ScamShieldApi,
    private val deviceTokenStore: DeviceTokenStore,
    private val enrolledDeviceStore: EnrolledDeviceStore,
) : DeviceEnrollmentRepository {

    override fun observeEnrolled(): Flow<Boolean> = deviceTokenStore.observeHasToken()

    override suspend fun enroll(
        email: String,
        password: String,
        deviceName: String,
    ): EnrollmentResult {
        val cleanedEmail = email.trim()
        if (cleanedEmail.isEmpty() || password.isEmpty()) {
            return EnrollmentResult.Failure("Enter your account email and password.")
        }
        val name = DeviceNames.normalize(deviceName)
            ?: return EnrollmentResult.Failure("Enter a device name (1-100 printable characters).")

        val jwt = when (val signIn = signIn(cleanedEmail, password)) {
            is LoginOutcome.Success -> signIn.token
            is LoginOutcome.Failed -> return EnrollmentResult.Failure(signIn.message)
        }
        return try {
            val api = apiForCurrentBackend() ?: return EnrollmentResult.Failure(BACKEND_URL_ERROR)
            when (val response = ApiExecutor.execute {
                api.registerDevice(
                    authorization = "Bearer $jwt",
                    request = DeviceRegisterRequest(deviceName = name),
                )
            }) {
                is ApiResult.Success -> {
                    val body = response.data
                    if (body.token.isBlank() || body.device.id <= 0) {
                        EnrollmentResult.Failure("The backend returned an unusable device registration.")
                    } else {
                        persist(body.token, EnrolledDevice(id = body.device.id, name = body.device.deviceName))
                    }
                }
                is ApiResult.Failure -> EnrollmentResult.Failure(registerErrorMessage(response))
            }
        } catch (cancellation: CancellationException) {
            throw cancellation
        } catch (error: Exception) {
            EnrollmentResult.Failure("Device registration failed. Check the backend and try again.")
        }
    }

    override suspend fun rotate(email: String, password: String): EnrollmentResult {
        val cleanedEmail = email.trim()
        if (cleanedEmail.isEmpty() || password.isEmpty()) {
            return EnrollmentResult.Failure("Enter your account email and password.")
        }
        val device = enrolledDeviceStore.read()
            ?: return EnrollmentResult.Failure("Connect this device before rotating its token.")

        val jwt = when (val signIn = signIn(cleanedEmail, password)) {
            is LoginOutcome.Success -> signIn.token
            is LoginOutcome.Failed -> return EnrollmentResult.Failure(signIn.message)
        }
        return try {
            val api = apiForCurrentBackend() ?: return EnrollmentResult.Failure(BACKEND_URL_ERROR)
            when (val response = ApiExecutor.execute {
                api.rotateDevice(authorization = "Bearer $jwt", deviceId = device.id)
            }) {
                is ApiResult.Success -> {
                    val body = response.data
                    if (body.token.isBlank()) {
                        EnrollmentResult.Failure("The backend returned an unusable device token.")
                    } else {
                        persist(
                            token = body.token,
                            device = EnrolledDevice(id = body.device.id, name = body.device.deviceName),
                        )
                    }
                }
                is ApiResult.Failure -> EnrollmentResult.Failure(rotationErrorMessage(response))
            }
        } catch (cancellation: CancellationException) {
            throw cancellation
        } catch (error: Exception) {
            EnrollmentResult.Failure("Token rotation failed. Check the backend and try again.")
        }
    }

    override suspend fun forgetDevice() {
        deviceTokenStore.clear()
        enrolledDeviceStore.clear()
    }

    /** Signs in and keeps the JWT only for the duration of the caller's request. */
    private suspend fun signIn(email: String, password: String): LoginOutcome {
        return try {
            val api = apiForCurrentBackend()
                ?: return LoginOutcome.Failed(BACKEND_URL_ERROR)
            when (val response = ApiExecutor.execute {
                api.login(LoginRequest(email = email, password = password))
            }) {
                is ApiResult.Success -> {
                    val token = response.data.accessToken
                    if (token.isBlank()) {
                        LoginOutcome.Failed("The backend returned an unusable sign-in response.")
                    } else {
                        LoginOutcome.Success(token)
                    }
                }
                is ApiResult.Failure -> LoginOutcome.Failed(loginErrorMessage(response))
            }
        } catch (cancellation: CancellationException) {
            throw cancellation
        } catch (error: Exception) {
            LoginOutcome.Failed("Sign-in failed. Check the backend URL and your connection.")
        }
    }

    private sealed interface LoginOutcome {
        data class Success(val token: String) : LoginOutcome
        data class Failed(val message: String) : LoginOutcome
    }

    private suspend fun apiForCurrentBackend(): ScamShieldApi? = try {
        apiFactory(settingsRepository.settings.first().backendUrl)
    } catch (error: Exception) {
        null
    }

    private suspend fun persist(token: String, device: EnrolledDevice): EnrollmentResult = try {
        deviceTokenStore.save(token)
        enrolledDeviceStore.save(device)
        EnrollmentResult.Success
    } catch (cancellation: CancellationException) {
        throw cancellation
    } catch (error: Exception) {
        // A failed save must not leave a half-enrolled state behind.
        runCatching { deviceTokenStore.clear() }
        runCatching { enrolledDeviceStore.clear() }
        EnrollmentResult.Failure("The device token could not be stored securely on this device.")
    }

    private fun loginErrorMessage(failure: ApiResult.Failure): String = when (failure) {
        is ApiResult.Failure.Unauthorized,
        is ApiResult.Failure.Forbidden,
        -> "Incorrect email or password."
        is ApiResult.Failure.Network -> NETWORK_ERROR
        is ApiResult.Failure.RateLimited -> "Too many sign-in attempts. Please wait a moment."
        is ApiResult.Failure.Validation -> "Enter a valid email address and password."
        is ApiResult.Failure.Server,
        is ApiResult.Failure.Unknown,
        is ApiResult.Failure.Conflict,
        is ApiResult.Failure.NotFound,
        -> "The backend could not complete sign-in. Try again later."
    }

    private fun registerErrorMessage(failure: ApiResult.Failure): String = when (failure) {
        is ApiResult.Failure.Unauthorized,
        is ApiResult.Failure.Forbidden,
        -> "The backend rejected the sign-in session. Try signing in again."
        is ApiResult.Failure.Conflict ->
            "Active device limit reached. Revoke an old device in the web dashboard and try again."
        is ApiResult.Failure.Validation -> "The backend rejected the device name. Enter a shorter name."
        is ApiResult.Failure.RateLimited -> "Too many attempts. Please wait a moment."
        is ApiResult.Failure.Network -> NETWORK_ERROR
        is ApiResult.Failure.NotFound,
        is ApiResult.Failure.Server,
        is ApiResult.Failure.Unknown,
        -> "The backend could not register this device. Try again later."
    }

    private fun rotationErrorMessage(failure: ApiResult.Failure): String = when (failure) {
        is ApiResult.Failure.Conflict ->
            "This device was revoked and cannot be rotated. Connect it again."
        is ApiResult.Failure.NotFound ->
            "This device is no longer registered on the backend. Connect it again."
        is ApiResult.Failure.Unauthorized,
        is ApiResult.Failure.Forbidden,
        -> "The backend rejected the sign-in session. Try signing in again."
        is ApiResult.Failure.Network -> NETWORK_ERROR
        is ApiResult.Failure.RateLimited -> "Too many attempts. Please wait a moment."
        is ApiResult.Failure.Validation -> "The backend rejected the rotation request."
        is ApiResult.Failure.Server,
        is ApiResult.Failure.Unknown,
        -> "The backend could not rotate the token. Try again later."
    }

    private companion object {
        const val NETWORK_ERROR =
            "Cannot reach the backend. Check the backend URL and your connection."
        const val BACKEND_URL_ERROR =
            "The configured backend URL is invalid. Fix it in Settings and try again."
    }
}
