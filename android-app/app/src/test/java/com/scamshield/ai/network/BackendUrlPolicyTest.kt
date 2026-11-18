package com.scamshield.ai.utils

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class BackendUrlPolicyTest {

    @Test
    fun `valid http URL accepted in debug mode`() {
        val result = BackendUrlPolicy.normalize("http://10.0.2.2:8000/", requireHttps = false)
        assertTrue(result is BackendUrlPolicy.Result.Valid)
        assertEquals("http://10.0.2.2:8000/", (result as BackendUrlPolicy.Result.Valid).url)
    }

    @Test
    fun `valid https URL accepted in release mode`() {
        val result = BackendUrlPolicy.normalize("https://my.backend:8080", requireHttps = true)
        assertTrue(result is BackendUrlPolicy.Result.Valid)
        assertEquals("https://my.backend:8080/", (result as BackendUrlPolicy.Result.Valid).url)
    }

    @Test
    fun `empty URL is invalid`() {
        val result = BackendUrlPolicy.normalize("", requireHttps = true)
        assertTrue(result is BackendUrlPolicy.Result.Invalid)
    }

    @Test
    fun `non-http URL is invalid`() {
        val result = BackendUrlPolicy.normalize("not-a-url", requireHttps = true)
        assertTrue(result is BackendUrlPolicy.Result.Invalid)
    }

    @Test
    fun `https URL rejected in release mode`() {
        val result = BackendUrlPolicy.normalize("http://10.0.2.2:8000/", requireHttps = true)
        assertTrue(result is BackendUrlPolicy.Result.Invalid)
    }

    @Test
    fun `username in URL is rejected`() {
        val result = BackendUrlPolicy.normalize("http://user:pass@example.com/", requireHttps = false)
        assertTrue(result is BackendUrlPolicy.Result.Invalid)
    }

    @Test
    fun `trailing slash is normalized away`() {
        val result = BackendUrlPolicy.normalize("http://10.0.2.2:8000", requireHttps = false)
        assertTrue(result is BackendUrlPolicy.Result.Valid)
        assertEquals("http://10.0.2.2:8000/", (result as BackendUrlPolicy.Result.Valid).url)
    }
}
