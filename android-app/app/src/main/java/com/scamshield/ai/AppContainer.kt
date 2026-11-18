package com.scamshield.ai

import android.content.Context
import com.scamshield.ai.data.local.AppPreferences
import com.scamshield.ai.data.local.ScamShieldDatabase
import com.scamshield.ai.data.repository.DeviceEnrollmentRepositoryImpl
import com.scamshield.ai.data.repository.HistoryRepositoryImpl
import com.scamshield.ai.data.repository.QuickDetectionRepositoryImpl
import com.scamshield.ai.data.repository.SettingsRepositoryImpl
import com.scamshield.ai.domain.repository.DeviceEnrollmentRepository
import com.scamshield.ai.domain.repository.HistoryRepository
import com.scamshield.ai.domain.repository.QuickDetectionRepository
import com.scamshield.ai.domain.repository.SettingsRepository
import com.scamshield.ai.network.NetworkModule
import com.scamshield.ai.notifications.AndroidWarningNotifier
import com.scamshield.ai.notifications.WarningNotifier
import com.scamshield.ai.security.DataStoreEnrolledDeviceStore
import com.scamshield.ai.security.DataStoreTokenPersistence
import com.scamshield.ai.security.DeviceTokenStore
import com.scamshield.ai.security.EncryptedDeviceTokenStore
import com.scamshield.ai.security.EnrolledDeviceStore
import com.scamshield.ai.security.KeystoreTokenCipher

/**
 * Manual dependency container. Deliberately small: repositories, Room, the secure
 * token store and the network module. No token or key is created at startup.
 */
class AppContainer(context: Context) {

    private val appContext: Context = context.applicationContext

    private val database: ScamShieldDatabase by lazy { ScamShieldDatabase.build(appContext) }
    private val preferences: AppPreferences by lazy { AppPreferences(appContext) }

    val settingsRepository: SettingsRepository by lazy { SettingsRepositoryImpl(preferences) }

    val historyRepository: HistoryRepository by lazy {
        HistoryRepositoryImpl(database.detectionHistoryDao())
    }

    val deviceTokenStore: DeviceTokenStore by lazy {
        EncryptedDeviceTokenStore(
            persistence = DataStoreTokenPersistence(appContext),
            cipher = KeystoreTokenCipher(),
        )
    }

    val networkModule: NetworkModule by lazy {
        NetworkModule(
            defaultBaseUrl = BuildConfig.DEFAULT_BASE_URL,
            requireHttps = BuildConfig.REQUIRE_HTTPS,
        )
    }

    private val enrolledDeviceStore: EnrolledDeviceStore by lazy {
        DataStoreEnrolledDeviceStore(appContext)
    }

    val enrollmentRepository: DeviceEnrollmentRepository by lazy {
        DeviceEnrollmentRepositoryImpl(
            settingsRepository = settingsRepository,
            apiFactory = { baseUrl -> networkModule.createApi(baseUrl) },
            deviceTokenStore = deviceTokenStore,
            enrolledDeviceStore = enrolledDeviceStore,
        )
    }

    val quickDetectionRepository: QuickDetectionRepository by lazy {
        QuickDetectionRepositoryImpl(
            settingsRepository = settingsRepository,
            deviceTokenStore = deviceTokenStore,
            apiFactory = { baseUrl -> networkModule.createApi(baseUrl) },
        )
    }

    val warningNotifier: WarningNotifier by lazy { AndroidWarningNotifier(appContext) }
}
