package com.scamshield.ai.security

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class DeviceNamesTest {

    @Test
    fun `names collapse whitespace and keep safe punctuation`() {
        assertEquals("Raj Android Phone", DeviceNames.normalize("  Raj   Android   Phone  "))
        assertEquals("Pixel 7 (work)", DeviceNames.normalize("Pixel 7 (work)"))
    }

    @Test
    fun `control characters are removed`() {
        val cleaned = DeviceNames.normalize("Pixel\u0000 7\nPro")!!
        assertTrue(!cleaned.contains("\u0000"))
        assertTrue(!cleaned.contains("\n"))
    }

    @Test
    fun `blank names are rejected`() {
        assertNull(DeviceNames.normalize("   "))
        assertNull(DeviceNames.normalize(null))
        assertNull(DeviceNames.normalize("\u0000\n"))
    }

    @Test
    fun `names are capped at the backend limit`() {
        val cleaned = DeviceNames.normalize("a".repeat(200))!!
        assertEquals(100, cleaned.length)
    }
}
