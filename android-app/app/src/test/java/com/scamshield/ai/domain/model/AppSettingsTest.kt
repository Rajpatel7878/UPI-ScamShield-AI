package com.scamshield.ai.domain.model

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AppSettingsTest {

    @Test
    fun `defaults are safe and privacy preserving`() {
        val defaults = AppSettings.defaults()

        assertFalse("Monitoring must default to off", defaults.monitoringEnabled)
        assertFalse("Onboarding must default to not completed", defaults.onboardingCompleted)
        assertFalse("Saved contacts must not be skipped without consent", defaults.skipSavedContacts)
        assertTrue("No monitored apps are selected by default", defaults.selectedPackages.isEmpty())
        assertEquals(DetectionSensitivity.MEDIUM, defaults.sensitivity)
        assertEquals(AppSettings.DEFAULT_BACKEND_URL, defaults.backendUrl)
        assertEquals("http://10.0.2.2:8000/", AppSettings.DEFAULT_BACKEND_URL)
    }

    @Test
    fun `every curated package is a real package name`() {
        assertTrue(AppSettings.CURATED_PACKAGES.isNotEmpty())
        AppSettings.CURATED_PACKAGES.forEach { curated ->
            assertTrue(curated.packageName.contains('.'))
            assertTrue(curated.label.isNotBlank())
        }
    }

    @Test
    fun `risk level mapping is defensive`() {
        assertEquals(RiskLevel.HIGH, RiskLevel.fromApi("High"))
        assertEquals(RiskLevel.CRITICAL, RiskLevel.fromApi(" critical "))
        assertEquals(RiskLevel.UNKNOWN, RiskLevel.fromApi(null))
        assertEquals(RiskLevel.UNKNOWN, RiskLevel.fromApi("severe"))
        assertTrue(RiskLevel.CRITICAL.isHighRisk)
        assertFalse(RiskLevel.MEDIUM.isHighRisk)
    }

    @Test
    fun `stored sensitivity falls back to medium`() {
        assertEquals(DetectionSensitivity.HIGH, DetectionSensitivity.fromStorage("HIGH"))
        assertEquals(DetectionSensitivity.DEFAULT, DetectionSensitivity.fromStorage("nonsense"))
        assertEquals(DetectionSensitivity.DEFAULT, DetectionSensitivity.fromStorage(null))
    }
}
