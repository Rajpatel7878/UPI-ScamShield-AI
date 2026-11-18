package com.scamshield.ai.presentation.navigation

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class RoutesTest {

    @Test
    fun `result route carries the record id`() {
        assertEquals("result/42", Routes.result(42))
        assertEquals("result/{recordId}", Routes.RESULT_PATTERN)
    }

    @Test
    fun `result screen does not show the bottom bar`() {
        assertFalse(Routes.result(1) in Routes.bottomBarRoutes)
        assertTrue(Routes.DASHBOARD in Routes.bottomBarRoutes)
    }
}
