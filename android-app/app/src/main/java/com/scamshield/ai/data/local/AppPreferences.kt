package com.scamshield.ai.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.MutablePreferences
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.core.stringSetPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.scamshield.ai.BuildConfig
import com.scamshield.ai.domain.model.AppSettings
import com.scamshield.ai.domain.model.DetectionSensitivity
import java.io.IOException
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map

private val Context.settingsDataStore: DataStore<Preferences> by preferencesDataStore(
    name = "scamshield_settings",
)

/**
 * Non-sensitive settings only. Device tokens live in the Keystore-encrypted store.
 *
 * Defaults are deliberately conservative: monitoring off, onboarding not completed,
 * no apps selected and medium sensitivity.
 */
class AppPreferences(context: Context) {

    private val dataStore = context.applicationContext.settingsDataStore

    val settings: Flow<AppSettings> = dataStore.data
        .catch { error -> if (error is IOException) emit(emptyPreferences()) else throw error }
        .map { preferences -> preferences.toSettings() }

    suspend fun setBackendUrl(url: String) = update { it[Keys.BACKEND_URL] = url }

    suspend fun setMonitoringEnabled(enabled: Boolean) = update { it[Keys.MONITORING_ENABLED] = enabled }

    suspend fun setSensitivity(sensitivity: DetectionSensitivity) =
        update { it[Keys.SENSITIVITY] = sensitivity.name }

    suspend fun setSkipSavedContacts(skip: Boolean) = update { it[Keys.SKIP_SAVED_CONTACTS] = skip }

    suspend fun setSelectedPackages(packages: Set<String>) =
        update { it[Keys.SELECTED_PACKAGES] = packages }

    suspend fun setWarningNotificationsEnabled(enabled: Boolean) =
        update { it[Keys.WARNING_NOTIFICATIONS] = enabled }

    suspend fun setOnboardingCompleted(completed: Boolean) =
        update { it[Keys.ONBOARDING_COMPLETED] = completed }

    private suspend fun update(block: (MutablePreferences) -> Unit) {
        dataStore.edit { preferences -> block(preferences) }
    }

    private fun Preferences.toSettings(): AppSettings = AppSettings(
        backendUrl = this[Keys.BACKEND_URL]?.takeIf { it.isNotBlank() } ?: BuildConfig.DEFAULT_BASE_URL,
        monitoringEnabled = this[Keys.MONITORING_ENABLED] ?: false,
        sensitivity = DetectionSensitivity.fromStorage(this[Keys.SENSITIVITY]),
        skipSavedContacts = this[Keys.SKIP_SAVED_CONTACTS] ?: false,
        selectedPackages = this[Keys.SELECTED_PACKAGES] ?: emptySet(),
        warningNotificationsEnabled = this[Keys.WARNING_NOTIFICATIONS] ?: true,
        onboardingCompleted = this[Keys.ONBOARDING_COMPLETED] ?: false,
    )

    private object Keys {
        val BACKEND_URL = stringPreferencesKey("backend_url")
        val MONITORING_ENABLED = booleanPreferencesKey("monitoring_enabled")
        val SENSITIVITY = stringPreferencesKey("detection_sensitivity")
        val SKIP_SAVED_CONTACTS = booleanPreferencesKey("skip_saved_contacts")
        val SELECTED_PACKAGES = stringSetPreferencesKey("selected_packages")
        val WARNING_NOTIFICATIONS = booleanPreferencesKey("warning_notifications")
        val ONBOARDING_COMPLETED = booleanPreferencesKey("onboarding_completed")
    }
}
