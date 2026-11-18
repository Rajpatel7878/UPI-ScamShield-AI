package com.scamshield.ai.data.local

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * Local detection history. There is intentionally no column for notification text,
 * sender, OTP, PIN, password or card data.
 */
@Entity(
    tableName = "detection_history",
    indices = [
        Index(value = ["timestamp"]),
        Index(value = ["riskLevel"]),
    ],
)
data class DetectionHistoryEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val riskScore: Int,
    val riskLevel: String,
    val category: String,
    val sourceApp: String?,
    val timestamp: Long,
    val analysisSource: String,
    val warningText: String = "",
    /** Backend reason labels joined with the unit separator; never message content. */
    val reasons: String = "",
)
