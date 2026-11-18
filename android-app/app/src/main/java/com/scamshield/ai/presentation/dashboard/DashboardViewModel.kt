package com.scamshield.ai.presentation.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.scamshield.ai.AppContainer
import com.scamshield.ai.domain.model.DetectionRecord
import com.scamshield.ai.domain.repository.HistoryRepository
import com.scamshield.ai.domain.repository.SettingsRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn

data class DashboardUiState(
    val monitoringEnabled: Boolean = false,
    val notificationAccessGranted: Boolean = false,
    val selectedAppPackages: Set<String> = emptySet(),
    val totalChecks: Int = 0,
    val highRiskCount: Int = 0,
    val mediumRiskCount: Int = 0,
    val lowRiskCount: Int = 0,
    val criticalRiskCount: Int = 0,
    val lastAnalysisTimestamp: Long = 0,
    val recentDetections: List<DetectionRecord> = emptyList(),
)

private data class RiskCounts(
    val total: Int = 0,
    val low: Int = 0,
    val medium: Int = 0,
    val high: Int = 0,
    val critical: Int = 0,
)

class DashboardViewModel(
    settingsRepository: SettingsRepository,
    historyRepository: HistoryRepository,
) : ViewModel() {

    /**
     * Room DAO counts, folded into one object first because `combine` only has
     * typed overloads up to five flows.
     */
    private val counts: Flow<RiskCounts> = combine(
        historyRepository.observeTotalChecks(),
        historyRepository.observeLowRiskCount(),
        historyRepository.observeMediumRiskCount(),
        historyRepository.observeHighRiskCount(),
        historyRepository.observeCriticalRiskCount(),
    ) { total, low, medium, high, critical ->
        RiskCounts(total = total, low = low, medium = medium, high = high, critical = critical)
    }

    val uiState: StateFlow<DashboardUiState> = combine(
        settingsRepository.settings,
        counts,
        historyRepository.observeRecent(RECENT_LIMIT),
    ) { settings, riskCounts, recent ->
        DashboardUiState(
            monitoringEnabled = settings.monitoringEnabled,
            // Monitoring preference and system notification access are separate;
            // the screen shows the preference-aware copy for both states.
            notificationAccessGranted = settings.monitoringEnabled,
            selectedAppPackages = settings.selectedPackages,
            totalChecks = riskCounts.total,
            // Each DAO count is scoped to exactly one stored risk level.
            highRiskCount = riskCounts.high,
            mediumRiskCount = riskCounts.medium,
            lowRiskCount = riskCounts.low,
            criticalRiskCount = riskCounts.critical,
            lastAnalysisTimestamp = recent.maxOfOrNull { it.timestamp } ?: 0L,
            recentDetections = recent,
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = DashboardUiState(),
    )

    companion object {
        private const val RECENT_LIMIT = 5

        fun factory(container: AppContainer): ViewModelProvider.Factory = viewModelFactory {
            initializer {
                DashboardViewModel(
                    settingsRepository = container.settingsRepository,
                    historyRepository = container.historyRepository,
                )
            }
        }
    }
}
