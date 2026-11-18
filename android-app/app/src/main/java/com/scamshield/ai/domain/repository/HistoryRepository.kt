package com.scamshield.ai.domain.repository

import com.scamshield.ai.domain.model.DetectionRecord
import kotlinx.coroutines.flow.Flow

interface HistoryRepository {
    fun observeHistory(): Flow<List<DetectionRecord>>
    fun observeById(id: Long): Flow<DetectionRecord?>
    fun observeRecent(limit: Int): Flow<List<DetectionRecord>>
    fun observeTotalChecks(): Flow<Int>
    fun observeLowRiskCount(): Flow<Int>
    fun observeMediumRiskCount(): Flow<Int>
    fun observeHighRiskCount(): Flow<Int>
    fun observeCriticalRiskCount(): Flow<Int>

    suspend fun add(record: DetectionRecord): Long
    suspend fun clearAll()
}
