package com.scamshield.ai.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface DetectionHistoryDao {

    @Insert
    suspend fun insert(entity: DetectionHistoryEntity): Long

    @Query("SELECT * FROM detection_history ORDER BY timestamp DESC")
    fun observeAll(): Flow<List<DetectionHistoryEntity>>

    @Query("SELECT * FROM detection_history WHERE id = :id LIMIT 1")
    fun observeById(id: Long): Flow<DetectionHistoryEntity?>

    @Query("SELECT * FROM detection_history ORDER BY timestamp DESC LIMIT :limit")
    fun observeRecent(limit: Int): Flow<List<DetectionHistoryEntity>>

    @Query("SELECT COUNT(*) FROM detection_history")
    fun observeTotalChecks(): Flow<Int>

    @Query("SELECT COUNT(*) FROM detection_history WHERE riskLevel = 'LOW'")
    fun observeLowRiskCount(): Flow<Int>

    @Query("SELECT COUNT(*) FROM detection_history WHERE riskLevel = 'MEDIUM'")
    fun observeMediumRiskCount(): Flow<Int>

    @Query("SELECT COUNT(*) FROM detection_history WHERE riskLevel = 'HIGH'")
    fun observeHighRiskCount(): Flow<Int>

    @Query("SELECT COUNT(*) FROM detection_history WHERE riskLevel = 'CRITICAL'")
    fun observeCriticalRiskCount(): Flow<Int>

    /** Used by tests and future exports. */
    @Query("SELECT * FROM detection_history ORDER BY timestamp DESC")
    suspend fun getAll(): List<DetectionHistoryEntity>

    @Query("DELETE FROM detection_history")
    suspend fun deleteAll()

    @Query("DELETE FROM detection_history WHERE id = :id")
    suspend fun deleteById(id: Long)
}

