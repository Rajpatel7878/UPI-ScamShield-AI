package com.scamshield.ai.security

import com.scamshield.ai.domain.model.EnrolledDevice
import kotlinx.coroutines.flow.Flow

/**
 * Non-sensitive registration metadata (backend device id and label). The device token
 * itself lives only in the Keystore-backed [DeviceTokenStore].
 */
interface EnrolledDeviceStore {
    suspend fun save(device: EnrolledDevice)
    suspend fun read(): EnrolledDevice?
    suspend fun clear()
    fun observe(): Flow<EnrolledDevice?>
}
