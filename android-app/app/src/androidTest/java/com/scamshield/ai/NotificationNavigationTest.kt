package com.scamshield.ai

import android.content.Intent
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class NotificationNavigationTest {

    @Test
    fun warningIntentCarriesTheStoredResultId() {
        val intent = Intent().putExtra(MainActivity.EXTRA_RESULT_ID, 42L)

        assertEquals(42L, MainActivity.resultIdOf(intent))
    }

    @Test
    fun normalLaunchHasNoResultTarget() {
        assertNull(MainActivity.resultIdOf(Intent()))
        assertNull(MainActivity.resultIdOf(null))
        assertNull(MainActivity.resultIdOf(Intent().putExtra(MainActivity.EXTRA_RESULT_ID, 0L)))
    }
}
