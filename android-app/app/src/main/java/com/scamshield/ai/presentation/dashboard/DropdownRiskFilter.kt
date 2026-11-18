package com.scamshield.ai.presentation.dashboard

import androidx.compose.foundation.layout.Box
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.scamshield.ai.domain.model.RiskLevel

private val FILTER_OPTIONS: List<RiskLevel> = listOf(
    RiskLevel.UNKNOWN,
    RiskLevel.LOW,
    RiskLevel.MEDIUM,
    RiskLevel.HIGH,
    RiskLevel.CRITICAL,
)

/** "All" reads better than "Unknown" for the unfiltered option. */
private fun RiskLevel.filterLabel(): String =
    if (this == RiskLevel.UNKNOWN) "All" else label

@Composable
fun DropdownRiskFilter(
    riskFilter: RiskLevel,
    onRiskFilterChange: (RiskLevel) -> Unit,
    modifier: Modifier = Modifier,
) {
    var expanded by remember { mutableStateOf(false) }

    Box(modifier = modifier) {
        TextButton(onClick = { expanded = true }) {
            Text(
                text = "Risk: ${riskFilter.filterLabel()}",
                style = MaterialTheme.typography.bodySmall,
            )
            Icon(
                imageVector = Icons.Filled.ArrowDropDown,
                contentDescription = "Filter risk level",
            )
        }

        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            FILTER_OPTIONS.forEach { option ->
                DropdownMenuItem(
                    text = { Text(option.filterLabel()) },
                    onClick = {
                        expanded = false
                        onRiskFilterChange(option)
                    },
                )
            }
        }
    }
}
