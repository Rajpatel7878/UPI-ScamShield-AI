package com.scamshield.ai.presentation.history

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.scamshield.ai.AppContainer
import com.scamshield.ai.domain.model.DetectionRecord
import com.scamshield.ai.domain.model.RiskLevel
import com.scamshield.ai.presentation.components.DetectionRow
import com.scamshield.ai.presentation.components.EmptyState
import com.scamshield.ai.presentation.components.PageHeader
import com.scamshield.ai.presentation.dashboard.DropdownRiskFilter
import com.scamshield.ai.presentation.dashboard.DropdownSortOrder
import com.scamshield.ai.presentation.dashboard.HistorySortOrder

@Composable
fun HistoryScreen(
    container: AppContainer,
    onOpenRecord: (Long) -> Unit,
) {
    val viewModel: HistoryViewModel = viewModel(factory = HistoryViewModel.factory(container))
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    HistoryContent(state = state, onOpenRecord = onOpenRecord)
}

@Composable
private fun HistoryContent(
    state: HistoryUiState,
    onOpenRecord: (Long) -> Unit,
) {
    var riskFilter by remember { mutableStateOf(RiskLevel.UNKNOWN) }
    var sortOrder by remember { mutableStateOf(HistorySortOrder.NEWEST_FIRST) }
    var searchText by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 20.dp, vertical = 18.dp),
    ) {
        PageHeader(
            title = "History",
            subtitle = "Metadata only. Message text is never stored.",
            eyebrow = "Detections",
        )

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            DropdownRiskFilter(
                riskFilter = riskFilter,
                onRiskFilterChange = { riskFilter = it },
            )
            DropdownSortOrder(
                sortOrder = sortOrder,
                onSortOrderChange = { sortOrder = it },
            )
        }

        // Search only ever matches stored metadata: category, risk label, source app.
        OutlinedTextField(
            value = searchText,
            onValueChange = { searchText = it },
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 8.dp),
            label = { Text("Search category or app") },
            singleLine = true,
            textStyle = MaterialTheme.typography.bodyMedium,
        )

        val records = remember(state.records, riskFilter, sortOrder, searchText) {
            state.records
                .filter { riskFilter == RiskLevel.UNKNOWN || it.riskLevel == riskFilter }
                .filter { matchesQuery(it, searchText) }
                .sortedWith(comparatorFor(sortOrder))
        }

        when {
            state.isLoading -> Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center,
            ) {
                CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
            }

            records.isEmpty() -> EmptyState(
                title = if (state.records.isEmpty()) "No detections yet" else "No matches",
                message = if (state.records.isEmpty()) {
                    "When monitoring is connected, each check stores the score, level, " +
                        "category, source app and time. Nothing else is kept."
                } else {
                    "No stored detection matches the selected risk level or search text."
                },
                modifier = Modifier.fillMaxWidth(),
            )

            else -> LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                contentPadding = PaddingValues(top = 18.dp, bottom = 24.dp),
            ) {
                items(items = records, key = { record -> record.id }) { record ->
                    DetectionRow(record = record, onClick = { onOpenRecord(record.id) })
                }
            }
        }
    }
}

private fun matchesQuery(record: DetectionRecord, query: String): Boolean {
    val trimmed = query.trim()
    if (trimmed.isEmpty()) return true
    return record.category.contains(trimmed, ignoreCase = true) ||
        record.riskLevel.label.contains(trimmed, ignoreCase = true) ||
        record.sourceApp?.contains(trimmed, ignoreCase = true) == true
}

private fun comparatorFor(sortOrder: String): Comparator<DetectionRecord> = when (sortOrder) {
    HistorySortOrder.OLDEST_FIRST -> compareBy { it.timestamp }
    HistorySortOrder.HIGHEST_RISK_FIRST ->
        compareByDescending<DetectionRecord> { it.riskScore }.thenByDescending { it.timestamp }
    else -> compareByDescending { it.timestamp }
}
