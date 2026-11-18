package com.scamshield.ai.data.repository

import com.scamshield.ai.data.local.AppPreferences
import com.scamshield.ai.domain.model.AppSettings
import com.scamshield.ai.domain.model.DetectionSensitivity
import com.scamshield.ai.domain.repository.SettingsRepository
import kotlinx.coroutines.flow.Flow

class SettingsRepositoryImpl(
    private val preferences: AppPreferences,
) : SettingsRepository {

    override val settings: Flow<AppSettings> = preferences.settings

    override suspend fun setBackendUrl(url: String) = preferences.setBackendUrl(url)

    override suspend fun setMonitoringEnabled(enabled: Boolean) = preferences.setMonitoringEnabled(enabled)

    override suspend fun setSensitivity(sensitivity: DetectionSensitivity) =
        preferences.setSensitivity(sensitivity)

    override suspend fun setSkipSavedContacts(skip: Boolean) = preferences.setSkipSavedContacts(skip)

    override suspend fun setSelectedPackages(packages: Set<String>) =
        preferences.setSelectedPackages(packages)

    override suspend fun setWarningNotificationsEnabled(enabled: Boolean) =
        preferences.setWarningNotificationsEnabled(enabled)

    override suspend fun setOnboardingCompleted(completed: Boolean) =
        preferences.setOnboardingCompleted(completed)
}
