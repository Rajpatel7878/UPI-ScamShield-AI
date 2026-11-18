package com.scamshield.ai.presentation.result

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.scamshield.ai.AppContainer
import com.scamshield.ai.domain.model.DetectionRecord
import com.scamshield.ai.domain.repository.HistoryRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn

data class DetectionResultUiState(
    val record: DetectionRecord? = null,
    val isLoading: Boolean = true,
)

class DetectionResultViewModel(
    historyRepository: HistoryRepository,
    recordId: Long,
) : ViewModel() {

    val uiState: StateFlow<DetectionResultUiState> = historyRepository.observeById(recordId)
        .map { record -> DetectionResultUiState(record = record, isLoading = false) }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = DetectionResultUiState(),
        )

    companion object {
        fun factory(container: AppContainer, recordId: Long): ViewModelProvider.Factory =
            viewModelFactory {
                initializer {
                    DetectionResultViewModel(
                        historyRepository = container.historyRepository,
                        recordId = recordId,
                    )
                }
            }
    }
}
