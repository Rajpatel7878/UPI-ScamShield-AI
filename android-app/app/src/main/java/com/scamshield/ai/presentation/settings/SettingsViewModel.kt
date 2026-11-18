package com.scamshield.ai.presentation.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.scamshield.ai.AppContainer
import com.scamshield.ai.BuildConfig
import com.scamshield.ai.domain.model.AppSettings
import com.scamshield.ai.domain.model.DetectionSensitivity
import com.scamshield.ai.domain.model.EnrollmentResult
import com.scamshield.ai.domain.repository.DeviceEnrollmentRepository
import com.scamshield.ai.domain.repository.HistoryRepository
import com.scamshield.ai.domain.repository.SettingsRepository
import com.scamshield.ai.security.DeviceNames
import com.scamshield.ai.utils.BackendUrlPolicy
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class AppSelection(
    val isSelected: Boolean,
)

data class ConnectionUiState(
    val enrolled: Boolean = false,
    val isWorking: Boolean = false,
    val message: String? = null,
    val isError: Boolean = false,
)

data class SettingsUiState(
    val settings: AppSettings = AppSettings.defaults(),
    val appSelections: Map<String, AppSelection> = emptyMap(),
    val connection: ConnectionUiState = ConnectionUiState(),
)

private data class ConnectionWork(
    val isWorking: Boolean = false,
    val message: String? = null,
    val isError: Boolean = false,
)

class SettingsViewModel(
    private val settingsRepository: SettingsRepository,
    private val historyRepository: HistoryRepository,
    private val enrollmentRepository: DeviceEnrollmentRepository,
) : ViewModel() {

    private val connectionWork = MutableStateFlow(ConnectionWork())

    /** Default label sent to the backend; the user may edit it. */
    val suggestedDeviceName: String = DeviceNames.thisDevice()

    val uiState: StateFlow<SettingsUiState> = combine(
        settingsRepository.settings,
        enrollmentRepository.observeEnrolled(),
        connectionWork,
    ) { settings, enrolled, work ->
        SettingsUiState(
            settings = settings,
            connection = ConnectionUiState(
                enrolled = enrolled,
                isWorking = work.isWorking,
                message = work.message,
                isError = work.isError,
            ),
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = SettingsUiState(),
    )

    /**
     * Validates and persists the backend URL.
     *
     * @return a user-facing error message, or null when the URL was saved.
     */
    fun saveBackendUrl(raw: String): String? =
        when (val result = BackendUrlPolicy.normalize(raw, BuildConfig.REQUIRE_HTTPS)) {
            is BackendUrlPolicy.Result.Invalid -> result.reason
            is BackendUrlPolicy.Result.Valid -> {
                viewModelScope.launch { settingsRepository.setBackendUrl(result.url) }
                null
            }
        }

    fun enroll(email: String, password: String, deviceName: String) {
        if (connectionWork.value.isWorking) return
        connectionWork.value = ConnectionWork(isWorking = true)
        viewModelScope.launch {
            connectionWork.value = when (
                val result = enrollmentRepository.enroll(email, password, deviceName)
            ) {
                EnrollmentResult.Success -> ConnectionWork(
                    message = "Device connected. Backend analysis is ready.",
                )
                is EnrollmentResult.Failure -> ConnectionWork(
                    message = result.message,
                    isError = true,
                )
            }
        }
    }

    fun rotateToken(email: String, password: String) {
        if (connectionWork.value.isWorking) return
        connectionWork.value = ConnectionWork(isWorking = true)
        viewModelScope.launch {
            connectionWork.value = when (val result = enrollmentRepository.rotate(email, password)) {
                EnrollmentResult.Success -> ConnectionWork(
                    message = "Device token rotated. The previous token no longer works.",
                )
                is EnrollmentResult.Failure -> ConnectionWork(
                    message = result.message,
                    isError = true,
                )
            }
        }
    }

    fun forgetDevice() {
        viewModelScope.launch {
            enrollmentRepository.forgetDevice()
            connectionWork.value = ConnectionWork(
                message = "Device token removed from this device.",
            )
        }
    }

    fun setMonitoringEnabled(enabled: Boolean) {
        viewModelScope.launch { settingsRepository.setMonitoringEnabled(enabled) }
    }

    fun setSensitivity(sensitivity: DetectionSensitivity) {
        viewModelScope.launch { settingsRepository.setSensitivity(sensitivity) }
    }

    fun setSkipSavedContacts(skip: Boolean) {
        viewModelScope.launch { settingsRepository.setSkipSavedContacts(skip) }
    }

    fun setWarningNotificationsEnabled(enabled: Boolean) {
        viewModelScope.launch { settingsRepository.setWarningNotificationsEnabled(enabled) }
    }

    fun setSelectedPackage(packageName: String) {
        val current = uiState.value.settings.selectedPackages
        val updated = if (packageName in current) current - packageName else current + packageName
        viewModelScope.launch { settingsRepository.setSelectedPackages(updated) }
    }

    fun clearHistory() {
        viewModelScope.launch { historyRepository.clearAll() }
    }

    companion object {
        fun factory(container: AppContainer): ViewModelProvider.Factory = viewModelFactory {
            initializer {
                SettingsViewModel(
                    settingsRepository = container.settingsRepository,
                    historyRepository = container.historyRepository,
                    enrollmentRepository = container.enrollmentRepository,
                )
            }
        }
    }
}
