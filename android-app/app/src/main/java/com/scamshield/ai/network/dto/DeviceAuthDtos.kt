package com.scamshield.ai.network.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * Mirrors `UserLogin` in `backend/app/schemas/auth.py`.
 */
@Serializable
data class LoginRequest(
    val email: String,
    val password: String,
)

/**
 * Mirrors `Token` in `backend/app/schemas/auth.py`. The JWT is kept in memory for
 * the enrollment call only and is never persisted.
 */
@Serializable
data class LoginResponse(
    @SerialName("access_token") val accessToken: String,
    @SerialName("token_type") val tokenType: String = "bearer",
)

/**
 * Mirrors `DeviceRegisterRequest` in `backend/app/schemas/device.py`
 * (`extra="forbid"`; only `device_name` is accepted).
 */
@Serializable
data class DeviceRegisterRequest(
    @SerialName("device_name") val deviceName: String,
)

/**
 * Subset of `DeviceInfo` in `backend/app/schemas/device.py` that the app needs.
 * The backend never returns a token or token hash here.
 */
@Serializable
data class DeviceInfoDto(
    val id: Long,
    @SerialName("device_name") val deviceName: String,
    @SerialName("expires_at") val expiresAt: String? = null,
    @SerialName("is_active") val isActive: Boolean = true,
)

/**
 * Mirrors `DeviceRegistrationResponse` / `DeviceTokenRotationResponse`.
 * `token` is present only in these responses and is stored encrypted.
 */
@Serializable
data class DeviceTokenResponse(
    val success: Boolean = true,
    val device: DeviceInfoDto,
    val token: String,
    @SerialName("token_type") val tokenType: String = "device",
)
