package com.scamshield.ai.data.local

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Verifies the Room schema never grows a column for notification text, sender, OTP,
 * PIN or any other message content.
 */
@RunWith(AndroidJUnit4::class)
class MetadataOnlyHistoryTest {

    @Test
    fun historyColumnsAreMetadataOnly() = runBlocking {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val database = Room.inMemoryDatabaseBuilder(context, ScamShieldDatabase::class.java)
            .allowMainThreadQueries()
            .build()

        try {
            val dao = database.detectionHistoryDao()
            dao.insert(
                DetectionHistoryEntity(
                    riskScore = 88,
                    riskLevel = "HIGH",
                    category = "Credential Theft",
                    sourceApp = "com.whatsapp",
                    timestamp = 1_700_000_000_000L,
                    analysisSource = "ONLINE_RULE_BASED",
                    warningText = "High scam risk. Do not share OTP or UPI PIN.",
                    reasons = "Asks for an OTP",
                ),
            )

            val stored = dao.getAll()
            assertEquals(1, stored.size)
            assertEquals(88, stored[0].riskScore)
            assertEquals("HIGH", stored[0].riskLevel)
            assertEquals("Credential Theft", stored[0].category)

            val cursor = database.openHelper.readableDatabase
                .query("PRAGMA table_info(detection_history)")
            val columns = buildSet {
                cursor.use {
                    while (it.moveToNext()) {
                        add(it.getString(it.getColumnIndexOrThrow("name")))
                    }
                }
            }

            assertEquals(
                setOf(
                    "id",
                    "riskScore",
                    "riskLevel",
                    "category",
                    "sourceApp",
                    "timestamp",
                    "analysisSource",
                    "warningText",
                    "reasons",
                ),
                columns,
            )

            // No column can hold the message body, sender, OTP, PIN or credentials.
            val forbidden = listOf("text", "message", "body", "otp", "pin", "sender", "content", "token")
            columns.forEach { column ->
                forbidden.forEach { word ->
                    assertFalse(
                        "column $column must not store notification content",
                        column.lowercase() == word || column.lowercase().endsWith("_$word"),
                    )
                }
            }
            assertTrue(columns.none { it == "rawText" || it == "maskedText" })
        } finally {
            database.close()
        }
    }
}
