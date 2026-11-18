package com.scamshield.ai.security

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.scamshield.ai.domain.model.EnrolledDevice
import java.io.IOException
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.enrolledDeviceDataStore: DataStore<Preferences> by preferencesDataStore(
    name = "scamshield_enrolled_device",
)

private val DEVICE_ID_KEY = longPreferencesKey("device_id")
private val DEVICE_NAME_KEY = stringPreferencesKey("device_name")

class DataStoreEnrolledDeviceStore(context: Context) : EnrolledDeviceStore {

    private val dataStore = context.applicationContext.enrolledDeviceDataStore

    override suspend fun save(device: EnrolledDevice) {
        dataStore.edit { preferences ->
            preferences[DEVICE_ID_KEY] = device.id
            preferences[DEVICE_NAME_KEY] = device.name
        }
    }

    override suspend fun read(): EnrolledDevice? = data()
        .map { preferences -> preferences.toDevice() }
        .first()

    override suspend fun clear() {
        dataStore.edit { preferences ->
            preferences.remove(DEVICE_ID_KEY)
            preferences.remove(DEVICE_NAME_KEY)
        }
    }

    override fun observe(): Flow<EnrolledDevice?> = data().map { preferences ->
        preferences.toDevice()
    }

    private fun data(): Flow<Preferences> = dataStore.data
        .catch { error -> if (error is IOException) emit(emptyPreferences()) else throw error }

    private fun Preferences.toDevice(): EnrolledDevice? {
        val id = this[DEVICE_ID_KEY]?.takeIf { it > 0 } ?: return null
        return EnrolledDevice(id = id, name = this[DEVICE_NAME_KEY] ?: "")
    }
}
