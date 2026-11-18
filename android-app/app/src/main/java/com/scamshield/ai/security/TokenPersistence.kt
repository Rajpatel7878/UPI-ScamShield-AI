package com.scamshield.ai.security

import kotlinx.coroutines.flow.Flow

/**
 * Stores only the encrypted token payload. Implementations must never persist a
 * plaintext token or log its value.
 */
interface TokenPersistence {
    suspend fun save(payload: String)
    suspend fun read(): String?
    suspend fun clear()
    fun observe(): Flow<String?>
}
