package com.scamshield.ai.security

import kotlinx.coroutines.flow.Flow

interface DeviceTokenStore {
    suspend fun save(token: String)
    suspend fun read(): String?
    suspend fun clear()
    fun observeHasToken(): Flow<Boolean>
}
