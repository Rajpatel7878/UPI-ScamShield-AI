package com.scamshield.ai.network

import com.scamshield.ai.network.dto.DeviceRegisterRequest
import com.scamshield.ai.network.dto.DeviceTokenResponse
import com.scamshield.ai.network.dto.LoginRequest
import com.scamshield.ai.network.dto.LoginResponse
import com.scamshield.ai.network.dto.QuickDetectionRequest
import com.scamshield.ai.network.dto.QuickDetectionResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Path

interface ScamShieldApi {

    /** User login. The JWT is used once for enrollment and never persisted. */
    @POST("api/v1/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    /**
     * Register this Android installation for the authenticated user.
     * Requires the short-lived user JWT; the response carries the device token once.
     */
    @POST("api/v1/devices/register")
    suspend fun registerDevice(
        @Header(AUTHORIZATION_HEADER) authorization: String,
        @Body request: DeviceRegisterRequest,
    ): Response<DeviceTokenResponse>

    /**
     * Rotate the device token. The previous token stops authenticating immediately.
     * A revoked device returns 409; register a new device instead.
     */
    @POST("api/v1/devices/{deviceId}/rotate")
    suspend fun rotateDevice(
        @Header(AUTHORIZATION_HEADER) authorization: String,
        @Path("deviceId") deviceId: Long,
    ): Response<DeviceTokenResponse>

    /**
     * Device-authenticated quick check. The device token is passed explicitly and
     * is never written to logs.
     */
    @POST("api/v1/detect/quick")
    suspend fun quickDetect(
        @Header(DEVICE_TOKEN_HEADER) deviceToken: String,
        @Body request: QuickDetectionRequest,
    ): Response<QuickDetectionResponse>

    companion object {
        const val DEVICE_TOKEN_HEADER = "X-Device-Token"
        const val AUTHORIZATION_HEADER = "Authorization"
    }
}
