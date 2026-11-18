package com.scamshield.ai.network

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ApiErrorMapperTest {

    @Test
    fun `fromHttp maps 401 to Unauthorized`() {
        val failure = ApiErrorMapper.fromHttp(401, null, null)
        assertEquals("This device is not authorised. Re-enrol it to continue.", failure.message)
    }

    @Test
    fun `fromHttp maps 403 to Forbidden`() {
        val failure = ApiErrorMapper.fromHttp(403, null, null)
        assertTrue(failure is ApiResult.Failure.Forbidden)
    }

    @Test
    fun `fromHttp maps 409 to Conflict`() {
        val failure = ApiErrorMapper.fromHttp(409, null, null)
        assertTrue(failure is ApiResult.Failure.Conflict)
        assertTrue(failure.message.contains("Revoke"))
    }

    @Test
    fun `fromHttp maps 404 to NotFound`() {
        val failure = ApiErrorMapper.fromHttp(404, null, null)
        assertTrue(failure is ApiResult.Failure.NotFound)
    }

    @Test
    fun `fromHttp maps 429 to RateLimited with retryAfter from header`() {
        val failure = ApiErrorMapper.fromHttp(429, null, "120")
        assertTrue(failure is ApiResult.Failure.RateLimited)
        assertEquals(120L, (failure as ApiResult.Failure.RateLimited).retryAfterSeconds)
        assertEquals("Too many checks. Please wait a moment and try again.", failure.message)
    }

    @Test
    fun `fromHttp maps 422 to Validation with error details`() {
        val failure = ApiErrorMapper.fromHttp(422, """{"errors": [{"msg": "field required", "type": "validation"}]}""", null)
        assertTrue(failure is ApiResult.Failure.Validation)
        assertEquals("The message could not be validated.", failure.message)
        assertEquals(1, (failure as ApiResult.Failure.Validation).details.size)
        assertEquals("field required", failure.details[0])
    }

    @Test
    fun `fromHttp maps 500 to Server`() {
        val failure = ApiErrorMapper.fromHttp(500, null, null)
        assertEquals("The analysis service is unavailable right now.", failure.message)
    }

    @Test
    fun `fromHttp maps other server error to Unknown`() {
        val failure = ApiErrorMapper.fromHttp(503, null, null)
        assertEquals("Unexpected response from the analysis service.", failure.message)
    }

    @Test
    fun `fromHttp maps IOException to Network`() {
        val failure = ApiErrorMapper.fromException(java.io.IOException("no route"))
        assertEquals("No connection to the analysis service.", failure.message)
    }

    @Test
    fun `fromException maps SerializationException to Unknown`() {
        val failure = ApiErrorMapper.fromException(kotlinx.serialization.SerializationException("bad json"))
        assertEquals("Unexpected response from the analysis service.", failure.message)
    }
}