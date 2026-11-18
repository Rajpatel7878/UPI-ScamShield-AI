package com.scamshield.ai.domain.repository

import com.scamshield.ai.domain.model.AppSettings
import com.scamshield.ai.domain.model.DetectionSensitivity
import kotlinx.coroutines.flow.Flow

interface SettingsRepository {
    val settings: Flow<AppSettings>

    suspend fun setBackendUrl(url: String)
    suspend fun setMonitoringEnabled(enabled: Boolean)
    suspend fun setSensitivity(sensitivity: DetectionSensitivity)
    suspend fun setSkipSavedContacts(skip: Boolean)
    suspend fun setSelectedPackages(packages: Set<String>)
    suspend fun setWarningNotificationsEnabled(enabled: Boolean)
    suspend fun setOnboardingCompleted(completed: Boolean)
}
