package com.scamshield.ai.domain.repository

import com.scamshield.ai.domain.model.EnrollmentResult
import kotlinx.coroutines.flow.Flow

/**
 * Enrolls this installation with the Phase 1 device-auth backend.
 *
 * The user's JWT is requested from `/auth/login`, used once and discarded. Only the
 * returned device token is kept, encrypted by the Keystore-backed store.
 */
interface DeviceEnrollmentRepository {

    /** True when an encrypted device token is present. */
    fun observeEnrolled(): Flow<Boolean>

    /** Registers a new device and stores its token. */
    suspend fun enroll(email: String, password: String, deviceName: String): EnrollmentResult

    /**
     * Rotates the stored device's token (the backend requires a user JWT, so the
     * credentials are needed again).
     */
    suspend fun rotate(email: String, password: String): EnrollmentResult

    /** Deletes the local device token and registration metadata. */
    suspend fun forgetDevice()
}
