package com.scamshield.ai.network

import com.scamshield.ai.network.dto.QuickDetectionRequest
import com.scamshield.ai.network.dto.QuickDetectionResponse
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class NetworkJsonTest {

    private val json = NetworkJson

    @Test
    fun `QuickDetectionResponse deserializes correctly`() {
        val body = """{"risk_score":73,"risk_level":"HIGH","category":"Phishing","warning_text":"Be careful with this request.","reasons":["suspicious sender","urgent language"],"analysis_type":"hybrid"}"""
        val response = json.decodeFromString<QuickDetectionResponse>(body)
        assertEquals(73, response.riskScore)
        assertEquals("HIGH", response.riskLevel)
        assertEquals("Phishing", response.category)
        assertEquals("Be careful with this request.", response.warningText)
        assertEquals(2, response.reasons.size)
        assertEquals("hybrid", response.analysisType)
    }

    @Test
    fun `QuickDetectionRequest serializes correctly`() {
        val request = QuickDetectionRequest(text = "Send OTP to 1234", sender = "WhatsApp")
        val body = json.encodeToString(request)
        assertTrue(body.contains(""""text":"Send OTP to 1234""""))
        assertTrue(body.contains(""""sender":"WhatsApp""""))
    }

    @Test
    fun `QuickDetectionRequest without optional fields`() {
        val request = QuickDetectionRequest(text = "Just text")
        val body = json.encodeToString(request)
        assertTrue(body.contains(""""text":"Just text""""))
        assertFalse(body.contains(""""sender""""))
    }

    @Test
    fun `ignoreUnknownKeys tolerates extra fields`() {
        val body = """{"risk_score":1,"risk_level":"LOW","category":"Unknown","warning_text":"","reasons":[],"analysis_type":"offline","extra_field":"ignored"}"""
        val response = json.decodeFromString<QuickDetectionResponse>(body)
        assertEquals("LOW", response.riskLevel)
        assertEquals("Unknown", response.category)
    }
}
