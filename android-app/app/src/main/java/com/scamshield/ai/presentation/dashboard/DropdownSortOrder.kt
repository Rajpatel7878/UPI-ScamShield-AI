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

/** Sort orders understood by the history list. */
object HistorySortOrder {
    const val NEWEST_FIRST = "newest_first"
    const val OLDEST_FIRST = "oldest_first"
    const val HIGHEST_RISK_FIRST = "highest_risk_first"

    val options: List<Pair<String, String>> = listOf(
        NEWEST_FIRST to "Newest first",
        OLDEST_FIRST to "Oldest first",
        HIGHEST_RISK_FIRST to "Highest risk first",
    )

    fun label(sortOrder: String): String =
        options.firstOrNull { it.first == sortOrder }?.second ?: options.first().second
}

@Composable
fun DropdownSortOrder(
    sortOrder: String,
    onSortOrderChange: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    var expanded by remember { mutableStateOf(false) }

    Box(modifier = modifier) {
        TextButton(onClick = { expanded = true }) {
            Text(
                text = "Sort: ${HistorySortOrder.label(sortOrder)}",
                style = MaterialTheme.typography.bodySmall,
            )
            Icon(
                imageVector = Icons.Filled.ArrowDropDown,
                contentDescription = "Sort order",
            )
        }

        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            HistorySortOrder.options.forEach { (value, label) ->
                DropdownMenuItem(
                    text = { Text(label) },
                    onClick = {
                        expanded = false
                        onSortOrderChange(value)
                    },
                )
            }
        }
    }
}
