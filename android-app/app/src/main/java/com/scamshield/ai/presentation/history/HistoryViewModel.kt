package com.scamshield.ai.presentation.history

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.scamshield.ai.AppContainer
import com.scamshield.ai.domain.model.DetectionRecord
import com.scamshield.ai.domain.model.RiskLevel
import com.scamshield.ai.domain.repository.HistoryRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.filter
import kotlinx.coroutines.flow.distinctUntilChanged

data class HistoryFilter(
    val riskLevel: RiskLevel = RiskLevel.UNKNOWN,
)

data class HistoryUiState(
    val records: List<DetectionRecord> = emptyList(),
    val isLoading: Boolean = true,
    val selectedFilter: HistoryFilter = HistoryFilter(),
)

class HistoryViewModel(
    historyRepository: HistoryRepository,
) : ViewModel() {

    private val _uiState: StateFlow<HistoryUiState> = historyRepository.observeHistory()
        .map { records ->
            HistoryUiState(
                records = records,
                isLoading = false,
                selectedFilter = HistoryFilter(),
            )
        }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = HistoryUiState(),
        )

    val uiState: StateFlow<HistoryUiState> = _uiState

    // Apply filter and sorting in UI layer using collectAsStateWithLifecycle
    // SelectedFilter is applied externally when navigating

    companion object {
        fun factory(container: AppContainer): ViewModelProvider.Factory = viewModelFactory {
            initializer {
                HistoryViewModel(historyRepository = container.historyRepository)
            }
        }
    }
}
