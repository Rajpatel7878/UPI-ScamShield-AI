package com.scamshield.ai.security

/**
 * Symmetric encryption for the stored device token. The production implementation
 * is backed by the Android Keystore; tests use a fake.
 */
interface TokenCipher {
    fun encrypt(plainText: String): String
    fun decrypt(payload: String): String
}
