package com.scamshield.ai.presentation.settings

import android.Manifest
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.scamshield.ai.AppContainer
import com.scamshield.ai.domain.model.AppSettings
import com.scamshield.ai.domain.model.DetectionSensitivity
import com.scamshield.ai.presentation.components.PageHeader
import com.scamshield.ai.presentation.components.SectionCard

@Composable
fun SettingsScreen(container: AppContainer) {
    val viewModel: SettingsViewModel = viewModel(factory = SettingsViewModel.factory(container))
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    SettingsContent(state = state, viewModel = viewModel)
}

@Composable
private fun SettingsContent(
    state: SettingsUiState,
    viewModel: SettingsViewModel,
) {
    val settings = state.settings
    val context = LocalContext.current
    var urlDraft by rememberSaveable(settings.backendUrl) { mutableStateOf(settings.backendUrl) }
    var urlError by remember { mutableStateOf<String?>(null) }
    var showClearDialog by remember { mutableStateOf(false) }
    // Credentials are intentionally not saveable: they live in memory for one call.
    var emailDraft by remember { mutableStateOf("") }
    var passwordDraft by remember { mutableStateOf("") }
    var deviceNameDraft by remember { mutableStateOf(viewModel.suggestedDeviceName) }

    // Drop the password from memory as soon as an enrollment action succeeds.
    LaunchedEffect(state.connection.message, state.connection.isError) {
        if (state.connection.message != null && !state.connection.isError) {
            passwordDraft = ""
        }
    }
    val notificationPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission(),
    ) { /* The setting is kept; the warning is skipped until permission is granted. */ }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 18.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        PageHeader(
            title = "Settings",
            subtitle = "Connection, detection and privacy controls.",
            eyebrow = "Control",
        )

        SectionCard {
            Text(text = "Backend connection", style = MaterialTheme.typography.titleMedium)
            OutlinedTextField(
                value = urlDraft,
                onValueChange = { value ->
                    urlDraft = value
                    urlError = null
                },
                label = { Text("Backend base URL") },
                singleLine = true,
                isError = urlError != null,
                supportingText = {
                    Text(
                        text = urlError
                            ?: "Emulator: http://10.0.2.2:8000/ · Release builds require HTTPS.",
                    )
                },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri),
                modifier = Modifier.fillMaxWidth(),
            )
            Button(onClick = { urlError = viewModel.saveBackendUrl(urlDraft) }) {
                Text("Save URL")
            }
        }

        DeviceConnectionCard(
            connection = state.connection,
            email = emailDraft,
            onEmailChange = { emailDraft = it },
            password = passwordDraft,
            onPasswordChange = { passwordDraft = it },
            deviceName = deviceNameDraft,
            onDeviceNameChange = { deviceNameDraft = it },
            onConnect = { viewModel.enroll(emailDraft, passwordDraft, deviceNameDraft) },
            onRotate = { viewModel.rotateToken(emailDraft, passwordDraft) },
            onForget = viewModel::forgetDevice,
        )

        SectionCard {
            Text(text = "Detection", style = MaterialTheme.typography.titleMedium)
            Text(text = "Sensitivity", style = MaterialTheme.typography.titleSmall)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                DetectionSensitivity.entries.forEach { option ->
                    FilterChip(
                        selected = settings.sensitivity == option,
                        onClick = { viewModel.setSensitivity(option) },
                        label = { Text(option.label) },
                    )
                }
            }
            Text(
                text = settings.sensitivity.description,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f))
            SettingSwitchRow(
                title = "Warning notifications",
                subtitle = "High and critical backend results show a security warning. " +
                    "Low and medium results are saved without an alert.",
                checked = settings.warningNotificationsEnabled,
                onCheckedChange = { enabled ->
                    if (enabled) requestNotificationPermission(notificationPermissionLauncher)
                    viewModel.setWarningNotificationsEnabled(enabled)
                },
            )
        }

        SectionCard {
            Text(text = "Monitoring", style = MaterialTheme.typography.titleMedium)
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(text = "Notification monitoring", style = MaterialTheme.typography.titleSmall)
                    Text(
                        text = if (settings.monitoringEnabled) {
                            "On. Selected notifications are filtered and masked on this device, " +
                                "then analyzed by the backend. Only metadata is stored."
                        } else {
                            "Off by default. No notifications are read until you enable " +
                                "monitoring and grant notification access."
                        },
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                Switch(
                    checked = settings.monitoringEnabled,
                    onCheckedChange = viewModel::setMonitoringEnabled,
                )
            }
            Button(
                onClick = { openNotificationListenerSettings(context) },
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.secondary,
                    contentColor = MaterialTheme.colorScheme.onSecondary,
                ),
            ) {
                Text("Grant notification access")
            }
            SettingSwitchRow(
                title = "Skip saved contacts",
                subtitle = "Saved preference. Contact access is never requested, so it is not applied yet.",
                checked = settings.skipSavedContacts,
                onCheckedChange = viewModel::setSkipSavedContacts,
            )
        }

        SectionCard {
            Text(text = "Monitored apps", style = MaterialTheme.typography.titleMedium)
            Text(
                text = "Select which source apps should be monitored for UPI/payment notifications.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            
            // Dynamically list curated packages with toggle switches.
            AppSettings.CURATED_PACKAGES.forEach { curated ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(text = curated.label, style = MaterialTheme.typography.titleSmall)
                        Text(
                            text = curated.packageName,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    Switch(
                        checked = settings.selectedPackages.contains(curated.packageName),
                        onCheckedChange = { viewModel.setSelectedPackage(curated.packageName) },
                    )
                }
            }
        }

        SectionCard {
            Text(text = "Privacy", style = MaterialTheme.typography.titleMedium)
            Text(
                text = "• Message text is never stored on this device or the backend.\n" +
                    "• OTPs, PINs, card numbers and passwords are masked before analysis.\n" +
                    "• The device token is encrypted with an Android Keystore key.\n" +
                    "• History contains only score, level, category, source app and time.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }

        SectionCard {
            Text(text = "Local data", style = MaterialTheme.typography.titleMedium)
            Button(
                onClick = { showClearDialog = true },
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.error,
                    contentColor = MaterialTheme.colorScheme.onError,
                ),
            ) {
                Text("Clear detection history")
            }
            Text(
                text = "Deletes all local detection history from this device. This cannot be undone.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }

        Text(
            text = "UPI ScamShield AI · Monitored notifications are filtered and masked on " +
                "this device; only detection metadata is stored.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }

    if (showClearDialog) {
        AlertDialog(
            onDismissRequest = { showClearDialog = false },
            title = { Text("Clear detection history?") },
            text = {
                Text("This deletes all local detection history from this device. It cannot be undone.")
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        viewModel.clearHistory()
                        showClearDialog = false
                    },
                ) {
                    Text("Clear")
                }
            },
            dismissButton = {
                TextButton(onClick = { showClearDialog = false }) {
                    Text("Cancel")
                }
            },
        )
    }
}

/**
 * Device enrollment section. Uses the existing user sign-in flow once; the JWT is
 * discarded by the repository and the device token is stored encrypted.
 */
@Composable
private fun DeviceConnectionCard(
    connection: ConnectionUiState,
    email: String,
    onEmailChange: (String) -> Unit,
    password: String,
    onPasswordChange: (String) -> Unit,
    deviceName: String,
    onDeviceNameChange: (String) -> Unit,
    onConnect: () -> Unit,
    onRotate: () -> Unit,
    onForget: () -> Unit,
) {
    SectionCard {
        Text(text = "Device connection", style = MaterialTheme.typography.titleMedium)
        Text(
            text = if (connection.enrolled) {
                "Connected. The device token is stored encrypted with the Android Keystore."
            } else {
                "Not connected. Connect this device before enabling notification monitoring."
            },
            style = MaterialTheme.typography.bodySmall,
            color = if (connection.enrolled) MaterialTheme.colorScheme.primary
            else MaterialTheme.colorScheme.onSurfaceVariant,
        )

        if (!connection.enrolled) {
            OutlinedTextField(
                value = deviceName,
                onValueChange = onDeviceNameChange,
                label = { Text("Device name") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
        }

        OutlinedTextField(
            value = email,
            onValueChange = onEmailChange,
            label = { Text("Account email") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
            value = password,
            onValueChange = onPasswordChange,
            label = { Text("Account password") },
            singleLine = true,
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
            modifier = Modifier.fillMaxWidth(),
        )
        Text(
            text = "Your password and sign-in token are used once for this request and are " +
                "never stored. The per-device token is encrypted with a Keystore key.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )

        if (connection.message != null) {
            Text(
                text = connection.message,
                style = MaterialTheme.typography.bodySmall,
                color = if (connection.isError) MaterialTheme.colorScheme.error
                else MaterialTheme.colorScheme.primary,
            )
        }

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            if (connection.enrolled) {
                OutlinedButton(onClick = onRotate, enabled = !connection.isWorking) {
                    Text(if (connection.isWorking) "Working…" else "Rotate device token")
                }
                TextButton(onClick = onForget, enabled = !connection.isWorking) {
                    Text("Remove token")
                }
            } else {
                Button(onClick = onConnect, enabled = !connection.isWorking) {
                    Text(if (connection.isWorking) "Connecting…" else "Connect device")
                }
            }
        }
    }
}

/** Requests POST_NOTIFICATIONS on API 33+; older versions do not need it. */
private fun requestNotificationPermission(launcher: ActivityResultLauncher<String>) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        launcher.launch(Manifest.permission.POST_NOTIFICATIONS)
    }
}

/** Opens the Android system screen where the user grants notification access. */
private fun openNotificationListenerSettings(context: Context) {
    val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    runCatching { context.startActivity(intent) }
}

@Composable
private fun SettingSwitchRow(
    title: String,
    subtitle: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(text = title, style = MaterialTheme.typography.titleSmall)
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        Switch(checked = checked, onCheckedChange = onCheckedChange)
    }
}
