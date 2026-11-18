package com.scamshield.ai.data.repository

import com.scamshield.ai.data.local.DetectionHistoryDao
import com.scamshield.ai.data.local.DetectionHistoryEntity
import com.scamshield.ai.domain.model.DetectionRecord
import com.scamshield.ai.domain.model.DetectionSource
import com.scamshield.ai.domain.model.RiskLevel
import com.scamshield.ai.domain.repository.HistoryRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class HistoryRepositoryImpl(
    private val dao: DetectionHistoryDao,
) : HistoryRepository {

    override fun observeHistory(): Flow<List<DetectionRecord>> =
        dao.observeAll().map { entities -> entities.map(DetectionHistoryEntity::toDomain) }

    override fun observeById(id: Long): Flow<DetectionRecord?> =
        dao.observeById(id).map { entity -> entity?.toDomain() }

    override fun observeRecent(limit: Int): Flow<List<DetectionRecord>> =
        dao.observeRecent(limit).map { entities -> entities.map(DetectionHistoryEntity::toDomain) }

    override fun observeTotalChecks(): Flow<Int> = dao.observeTotalChecks()

    override fun observeLowRiskCount(): Flow<Int> = dao.observeLowRiskCount()

    override fun observeMediumRiskCount(): Flow<Int> = dao.observeMediumRiskCount()

    override fun observeHighRiskCount(): Flow<Int> = dao.observeHighRiskCount()

    override fun observeCriticalRiskCount(): Flow<Int> = dao.observeCriticalRiskCount()

    override suspend fun add(record: DetectionRecord): Long = dao.insert(record.toEntity())

    override suspend fun clearAll() = dao.deleteAll()
}

private fun DetectionHistoryEntity.toDomain(): DetectionRecord = DetectionRecord(
    id = id,
    riskScore = riskScore,
    riskLevel = RiskLevel.fromStorage(riskLevel),
    category = category,
    sourceApp = sourceApp,
    timestamp = timestamp,
    analysisSource = DetectionSource.fromStorage(analysisSource),
    warningText = warningText,
    reasons = reasons.split(REASONS_SEPARATOR).filter { it.isNotBlank() },
)

private fun DetectionRecord.toEntity(): DetectionHistoryEntity = DetectionHistoryEntity(
    id = id,
    riskScore = riskScore,
    riskLevel = riskLevel.name,
    category = category,
    sourceApp = sourceApp,
    timestamp = timestamp,
    analysisSource = analysisSource.name,
    warningText = warningText,
    reasons = reasons
        .take(MAX_REASONS)
        .joinToString(REASONS_SEPARATOR) { it.replace(REASONS_SEPARATOR, " ") },
)

private const val REASONS_SEPARATOR = "\u001F"
private const val MAX_REASONS = 3
