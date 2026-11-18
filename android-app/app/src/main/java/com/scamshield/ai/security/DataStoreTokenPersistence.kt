package com.scamshield.ai.security

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import java.io.IOException
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.deviceTokenDataStore: DataStore<Preferences> by preferencesDataStore(
    name = "scamshield_device_token",
)

private val TOKEN_PAYLOAD_KEY = stringPreferencesKey("device_token_payload")

/**
 * Persists the encrypted token payload. Plaintext tokens never reach DataStore.
 */
class DataStoreTokenPersistence(context: Context) : TokenPersistence {

    private val dataStore = context.applicationContext.deviceTokenDataStore

    override suspend fun save(payload: String) {
        dataStore.edit { preferences -> preferences[TOKEN_PAYLOAD_KEY] = payload }
    }

    override suspend fun read(): String? = dataStore.data
        .catch { error -> if (error is IOException) emit(emptyPreferences()) else throw error }
        .map { preferences -> preferences[TOKEN_PAYLOAD_KEY] }
        .first()

    override suspend fun clear() {
        dataStore.edit { preferences -> preferences.remove(TOKEN_PAYLOAD_KEY) }
    }

    override fun observe(): Flow<String?> = dataStore.data
        .catch { error -> if (error is IOException) emit(emptyPreferences()) else throw error }
        .map { preferences -> preferences[TOKEN_PAYLOAD_KEY] }
}
