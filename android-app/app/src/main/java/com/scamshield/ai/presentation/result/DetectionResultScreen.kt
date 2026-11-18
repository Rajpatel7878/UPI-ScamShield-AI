package com.scamshield.ai.presentation.result

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.scamshield.ai.AppContainer
import com.scamshield.ai.domain.model.AppSettings
import com.scamshield.ai.domain.model.DetectionRecord
import com.scamshield.ai.presentation.components.EmptyState
import com.scamshield.ai.presentation.components.PageHeader
import com.scamshield.ai.presentation.components.RiskBadge
import com.scamshield.ai.presentation.components.SectionCard
import com.scamshield.ai.presentation.components.riskColor
import com.scamshield.ai.utils.TimeFormat

/**
 * In-app analysis result. Shows only stored metadata: score, level, category, the
 * backend's generic warning, up to three reason labels, timestamp and source app.
 * No notification content is stored or displayed.
 */
@Composable
fun DetectionResultScreen(
    container: AppContainer,
    recordId: Long,
    onBack: () -> Unit,
) {
    val viewModel: DetectionResultViewModel = viewModel(
        factory = DetectionResultViewModel.factory(container, recordId),
    )
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    DetectionResultContent(state = state, onBack = onBack)
}

@Composable
private fun DetectionResultContent(
    state: DetectionResultUiState,
    onBack: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 18.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack) {
                Icon(imageVector = Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
            }
            PageHeader(
                title = "Analysis result",
                subtitle = "Server analysis. Nothing from the message itself is shown.",
                eyebrow = "Detection",
            )
        }

        when {
            state.isLoading -> Box(
                modifier = Modifier.fillMaxWidth().padding(vertical = 40.dp),
                contentAlignment = Alignment.Center,
            ) {
                CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
            }

            state.record == null -> EmptyState(
                title = "Result not available",
                message = "This detection is no longer stored on the device. " +
                    "History can be cleared in Settings.",
            )

            else -> ResultDetails(record = state.record)
        }
    }
}

@Composable
private fun ResultDetails(record: DetectionRecord) {
    val accent = riskColor(record.riskLevel)

    SectionCard {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(16.dp))
                    .background(accent.copy(alpha = 0.14f))
                    .padding(horizontal = 18.dp, vertical = 12.dp),
                contentAlignment = Alignment.Center,
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "${record.riskScore}",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold,
                        color = accent,
                    )
                    Text(
                        text = "out of 100",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                RiskBadge(level = record.riskLevel)
                Text(
                    text = record.category,
                    style = MaterialTheme.typography.titleMedium,
                )
                Text(
                    text = record.analysisSource.label,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }

    SectionCard {
        Text(text = "What this means", style = MaterialTheme.typography.titleMedium)
        Text(
            text = record.warningText.ifBlank {
                "This notification matched scam patterns. Verify it independently before acting."
            },
            style = MaterialTheme.typography.bodyMedium,
        )
        Text(
            text = "A high score is a warning, not proof of fraud. A low score does not " +
                "guarantee that a message is safe.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }

    SectionCard {
        Text(text = "Detection reasons", style = MaterialTheme.typography.titleMedium)
        if (record.reasons.isEmpty()) {
            Text(
                text = "No specific reason labels were returned.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        } else {
            record.reasons.take(3).forEach { reason ->
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.Top,
                ) {
                    Text(
                        text = "•",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.primary,
                    )
                    Text(text = reason, style = MaterialTheme.typography.bodyMedium)
                }
            }
        }
    }

    SectionCard {
        Text(text = "Recommended actions", style = MaterialTheme.typography.titleMedium)
        SafetyAction("Do not share an OTP, UPI PIN, card number, CVV or password.")
        SafetyAction("Do not approve an unknown UPI collect request or pay to \"unblock\" anything.")
        SafetyAction("Verify with your bank using its official app or a number you look up yourself.")
        SafetyAction("Report the message to your bank and, if money was lost, to cybercrime.gov.in.")
    }

    SectionCard {
        Text(text = "Details", style = MaterialTheme.typography.titleMedium)
        DetailRow("Detected", TimeFormat.format(record.timestamp))
        DetailRow("Source app", packageLabel(record.sourceApp))
        DetailRow("Analysis", record.analysisSource.label)
        Text(
            text = "ScamShield AI only warns you. It does not block transactions, messages " +
                "or apps, and it cannot guarantee that every scam is detected.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            letterSpacing = 0.2.sp,
        )
    }
}

@Composable
private fun SafetyAction(text: String) {
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.Top) {
        Text(text = "•", style = MaterialTheme.typography.bodyMedium)
        Text(text = text, style = MaterialTheme.typography.bodyMedium)
    }
}

@Composable
private fun DetailRow(label: String, value: String) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.weight(1f),
        )
        Text(text = value, style = MaterialTheme.typography.bodySmall)
    }
}

private fun packageLabel(packageName: String?): String {
    if (packageName.isNullOrBlank()) return "Unknown app"
    return AppSettings.CURATED_PACKAGES
        .firstOrNull { it.packageName == packageName }
        ?.label
        ?: packageName
}
