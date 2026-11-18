package com.scamshield.ai.security

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class EncryptedDeviceTokenStoreTest {

    private val persistence = FakeTokenPersistence()
    private val cipher = ReversingCipher()
    private val store = EncryptedDeviceTokenStore(persistence = persistence, cipher = cipher)

    @Test
    fun `saving a token never persists plaintext`() = runTest {
        store.save("device-token-abc")

        assertEquals("enc:cba-nekot-ecived", persistence.saved.value)
        assertFalse(persistence.saved.value!!.contains("device-token-abc"))
        assertEquals("device-token-abc", store.read())
    }

    @Test
    fun `tokens are trimmed before encryption`() = runTest {
        store.save("  token-with-space  ")

        assertEquals("token-with-space", cipher.decrypt(persistence.saved.value!!))
    }

    @Test
    fun `missing token reads as null`() = runTest {
        assertNull(store.read())
        assertFalse(store.observeHasToken().first())
    }

    @Test
    fun `corrupt payload reads as null instead of crashing`() = runTest {
        persistence.save("payload-without-expected-shape")

        assertNull(store.read())
    }

    @Test
    fun `blank decrypted payload is treated as missing`() = runTest {
        persistence.save(cipher.encrypt(""))

        assertNull(store.read())
    }

    @Test
    fun `clearing removes the stored payload`() = runTest {
        store.save("device-token-abc")
        assertTrue(store.observeHasToken().first())

        store.clear()

        assertNull(persistence.saved.value)
        assertNull(store.read())
    }

    @Test(expected = IllegalArgumentException::class)
    fun `blank tokens cannot be saved`() = runTest {
        store.save("   ")
    }

    private class FakeTokenPersistence : TokenPersistence {
        val saved = MutableStateFlow<String?>(null)

        override suspend fun save(payload: String) {
            saved.value = payload
        }

        override suspend fun read(): String? = saved.value

        override suspend fun clear() {
            saved.value = null
        }

        override fun observe(): Flow<String?> = saved
    }

    /** Reverses the payload so a plaintext value can never be mistaken for ciphertext. */
    private class ReversingCipher : TokenCipher {
        override fun encrypt(plainText: String): String =
            "enc:" + plainText.reversed()

        override fun decrypt(payload: String): String {
            require(payload.startsWith("enc:")) { "Not an encrypted payload" }
            return payload.removePrefix("enc:").reversed()
        }
    }
}
