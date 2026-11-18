package com.scamshield.ai.presentation.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.scamshield.ai.AppContainer
import com.scamshield.ai.R
import com.scamshield.ai.domain.model.RiskLevel
import com.scamshield.ai.presentation.components.BrandMark
import com.scamshield.ai.presentation.components.DetectionRow
import com.scamshield.ai.presentation.components.EmptyState
import com.scamshield.ai.presentation.components.StatTile
import com.scamshield.ai.presentation.components.SectionCard
import com.scamshield.ai.presentation.components.riskColor
import com.scamshield.ai.presentation.theme.WarningAmber

@Composable
fun DashboardScreen(
    container: AppContainer,
    onOpenSettings: () -> Unit,
    onOpenHistory: () -> Unit,
    onOpenRecord: (Long) -> Unit,
) {
    val viewModel: DashboardViewModel = viewModel(factory = DashboardViewModel.factory(container))
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    DashboardContent(
        state = state,
        onOpenSettings = onOpenSettings,
        onOpenHistory = onOpenHistory,
        onOpenRecord = onOpenRecord,
    )
}

@Composable
private fun DashboardContent(
    state: DashboardUiState,
    onOpenSettings: () -> Unit,
    onOpenHistory: () -> Unit,
    onOpenRecord: (Long) -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 18.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            BrandMark()
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = stringResource(R.string.app_name),
                    style = MaterialTheme.typography.titleMedium,
                )
                Text(
                    text = stringResource(R.string.app_tagline),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.primary,
                )
            }
            IconButton(onClick = onOpenSettings) {
                Icon(
                    imageVector = Icons.Filled.Settings,
                    contentDescription = "Settings",
                )
            }
        }

        ProtectionStatusCard(
            monitoringEnabled = state.monitoringEnabled,
            notificationAccessGranted = state.notificationAccessGranted,
            selectedApps = state.selectedAppPackages,
        )

        // Risk distribution row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            StatTile(
                label = "Low",
                value = state.lowRiskCount.toString(),
                accent = riskColor(RiskLevel.LOW),
                caption = "Low-risk detections",
                modifier = Modifier.weight(1f),
            )
            StatTile(
                label = "Medium",
                value = state.mediumRiskCount.toString(),
                accent = riskColor(RiskLevel.MEDIUM),
                caption = "Medium-risk detections",
                modifier = Modifier.weight(1f),
            )
            StatTile(
                label = "High",
                value = state.highRiskCount.toString(),
                accent = riskColor(RiskLevel.HIGH),
                caption = "High-risk detections",
                modifier = Modifier.weight(1f),
            )
            StatTile(
                label = "Critical",
                value = state.criticalRiskCount.toString(),
                accent = riskColor(RiskLevel.CRITICAL),
                caption = "Critical-risk detections",
                modifier = Modifier.weight(1f),
            )
        }

        // Dashboard stats row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            StatTile(
                label = "Total checks",
                value = state.totalChecks.toString(),
                accent = MaterialTheme.colorScheme.secondary,
                caption = "Stored on device",
                modifier = Modifier.weight(1f),
            )
            StatTile(
                label = "Last analysis",
                value = if (state.lastAnalysisTimestamp > 0L) {
                    "${java.text.SimpleDateFormat("MMM dd, HH:mm", java.util.Locale.getDefault()).format(java.util.Date(state.lastAnalysisTimestamp))}"
                } else {
                    "Never"
                },
                accent = MaterialTheme.colorScheme.onSurfaceVariant,
                caption = "Most recent",
                modifier = Modifier.weight(1f),
            )
        }

        SectionCard {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "Recent detections",
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.weight(1f),
                )
                if (state.recentDetections.isNotEmpty()) {
                    TextButton(onClick = onOpenHistory) {
                        Text("View all")
                    }
                }
            }

            if (state.recentDetections.isEmpty()) {
                EmptyState(
                    title = "No detections yet",
                    message = "Checks will appear here once monitoring is on and notification " +
                        "access is granted. Only the apps you select are monitored.",
                )
            } else {
                state.recentDetections.forEach { record ->
                    DetectionRow(record = record, onClick = { onOpenRecord(record.id) })
                }
            }
        }

        Text(
            text = "Monitoring is off by default. Nothing is read until you enable it in " +
                "Settings and grant notification access. No SMS, contacts or accessibility access.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun ProtectionStatusCard(
    monitoringEnabled: Boolean,
    notificationAccessGranted: Boolean,
    selectedApps: Set<String>,
) {
    val accent = if (monitoringEnabled) WarningAmber else MaterialTheme.colorScheme.onSurfaceVariant

    SectionCard {
        Text(
            text = "PROTECTION STATUS",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Box(
                modifier = Modifier
                    .size(10.dp)
                    .clip(CircleShape)
                    .background(accent),
            )
            Text(
                text = if (monitoringEnabled) "Monitoring preference on" else "Monitoring off",
                style = MaterialTheme.typography.titleMedium,
            )
        }
        Text(
            text = when {
                !monitoringEnabled -> "No notifications are read while monitoring is off. Enable it in Settings and grant notification access to start."
                notificationAccessGranted -> "Monitoring is active. Selected apps: ${selectedApps.joinToString(", ")}."
                else -> "Monitoring preference on. Notification access not yet granted in system settings."
            },
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}
