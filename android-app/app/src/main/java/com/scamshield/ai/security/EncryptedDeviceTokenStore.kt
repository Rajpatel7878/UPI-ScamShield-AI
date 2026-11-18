package com.scamshield.ai.security

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

/**
 * Saves, reads and deletes the device token. The token is encrypted before it is
 * handed to persistence, and a corrupt or undecryptable payload is reported as
 * "no token" instead of crashing.
 *
 * Nothing in this class logs the token.
 */
class EncryptedDeviceTokenStore(
    private val persistence: TokenPersistence,
    private val cipher: TokenCipher,
) : DeviceTokenStore {

    override suspend fun save(token: String) {
        require(token.isNotBlank()) { "Device token must not be blank" }
        persistence.save(cipher.encrypt(token.trim()))
    }

    override suspend fun read(): String? {
        val payload = persistence.read() ?: return null
        val decrypted = runCatching { cipher.decrypt(payload) }.getOrNull() ?: return null
        return decrypted.takeIf { it.isNotBlank() }
    }

    override suspend fun clear() {
        persistence.clear()
    }

    override fun observeHasToken(): Flow<Boolean> =
        persistence.observe().map { payload -> !payload.isNullOrBlank() }
}
