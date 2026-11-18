package com.scamshield.ai.network

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ApiResultTest {

    @Test
    fun `Success carries data`() {
        val success = ApiResult.Success(42)
        assertTrue(success is ApiResult.Success)
        assertEquals(42, success.data)
    }

    @Test
    fun `Failure has message`() {
        val failure = ApiResult.Failure.Unauthorized()
        assertTrue(failure is ApiResult.Failure)
        assertTrue(failure.message.isNotBlank())
    }

    @Test
    fun `Failure Unauthorized has default message`() {
        val failure = ApiResult.Failure.Unauthorized()
        assertEquals("This device is not authorised. Re-enrol it to continue.", failure.message)
    }

    @Test
    fun `Failure RateLimited carries retryAfter`() {
        val failure = ApiResult.Failure.RateLimited(retryAfterSeconds = 300)
        assertEquals(300L, failure.retryAfterSeconds)
        assertEquals("Too many checks. Please wait a moment and try again.", failure.message)
    }

    @Test
    fun `Failure Validation carries details`() {
        val failure = ApiResult.Failure.Validation(details = listOf("field required", "must be positive"))
        assertEquals(2, failure.details.size)
    }
}