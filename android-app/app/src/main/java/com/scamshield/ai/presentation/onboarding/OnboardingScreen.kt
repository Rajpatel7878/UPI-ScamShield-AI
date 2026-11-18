package com.scamshield.ai.presentation.onboarding

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.scamshield.ai.R
import com.scamshield.ai.presentation.components.BrandMark
import com.scamshield.ai.presentation.components.SectionCard

/**
 * First-run introduction. No permission is requested here: notification access
 * is a deliberate later step, not part of onboarding.
 */
@Composable
fun OnboardingScreen(
    onContinue: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp, vertical = 24.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp),
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            BrandMark()
            Column {
                Text(
                    text = stringResource(R.string.app_name),
                    style = MaterialTheme.typography.titleLarge,
                )
                Text(
                    text = stringResource(R.string.app_tagline),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.primary,
                )
            }
        }

        Text(
            text = "Scam protection for the messages that matter.",
            style = MaterialTheme.typography.displaySmall,
        )
        Text(
            text = "UPI ScamShield AI checks suspicious payment, KYC and credential " +
                "requests against an explainable detection engine and shows a plain-language warning.",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )

        SectionCard {
            Text(text = "How it works", style = MaterialTheme.typography.titleMedium)
            OnboardingPoint(
                title = "Choose what to monitor",
                body = "Only notifications from apps you explicitly select would be checked. " +
                    "Monitoring stays off until you turn it on.",
            )
            OnboardingPoint(
                title = "Detect with clear reasons",
                body = "Each check returns a risk score, a risk level and up to three concise " +
                    "reasons, using the same detection engine as the web dashboard.",
            )
            OnboardingPoint(
                title = "Protect without blocking",
                body = "The app warns you. It never blocks payments, messages or apps, and it " +
                    "never acts on your behalf.",
            )
        }

        SectionCard {
            Text(text = "Important limitations", style = MaterialTheme.typography.titleMedium)
            OnboardingPoint(
                title = "Notification access is limited",
                body = "Android only exposes what an app chooses to post. Some apps hide content, " +
                    "so coverage cannot be guaranteed for every message.",
            )
            OnboardingPoint(
                title = "Detection is heuristic",
                body = "A low score means no strong signals were found, not that a message is " +
                    "definitely safe. A high score is a warning, not proof of fraud.",
            )
            OnboardingPoint(
                title = "No automatic protection",
                body = "You stay in control. The app cannot stop a transaction or read your bank app.",
            )
        }

        SectionCard {
            Text(text = "What is processed", style = MaterialTheme.typography.titleMedium)
            OnboardingPoint(
                title = "Credential values are masked",
                body = "OTPs, UPI PINs, card numbers and passwords are masked before any analysis " +
                    "and before anything is sent to an AI provider.",
            )
            OnboardingPoint(
                title = "Message text is not stored",
                body = "Detection history keeps only the score, risk level, category, source app " +
                    "and timestamp. Message text is never saved on the device or the server.",
            )
            OnboardingPoint(
                title = "No secrets in the app",
                body = "The app contains no API keys. A per-device token, encrypted with the Android " +
                    "Keystore, is issued when you enrol a device.",
            )
        }

        SectionCard {
            Text(text = "Privacy first", style = MaterialTheme.typography.titleMedium)
            Text(
                text = "Nothing is read until you enable monitoring and grant notification access, " +
                    "and message text never leaves your phone. No contact access, no SMS access " +
                    "and no accessibility service.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }

        Spacer(modifier = Modifier.height(4.dp))

        Button(
            onClick = onContinue,
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
        ) {
            Text(
                text = "Continue",
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.SemiBold,
            )
        }

        Text(
            text = "You can review or change every setting later. Notification access is never " +
                "requested automatically.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

@Composable
private fun OnboardingPoint(title: String, body: String) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        verticalAlignment = Alignment.Top,
    ) {
        Box(
            modifier = Modifier
                .padding(top = 7.dp)
                .size(6.dp)
                .clip(CircleShape)
                .background(MaterialTheme.colorScheme.primary),
        )
        Column {
            Text(text = title, style = MaterialTheme.typography.titleSmall)
            Text(
                text = body,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}
