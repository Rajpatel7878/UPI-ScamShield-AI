package com.scamshield.ai.domain.model

/** A curated app that can be offered for future notification monitoring. */
data class CuratedPackage(val packageName: String, val label: String)

/**
 * Non-sensitive user settings. Safe defaults: monitoring off, onboarding not
 * completed, no packages selected, medium sensitivity.
 */
data class AppSettings(
    val backendUrl: String,
    val monitoringEnabled: Boolean,
    val sensitivity: DetectionSensitivity,
    val skipSavedContacts: Boolean,
    val selectedPackages: Set<String>,
    val warningNotificationsEnabled: Boolean,
    val onboardingCompleted: Boolean,
) {
    companion object {
        /** Android emulator loopback to the host machine. */
        const val DEFAULT_BACKEND_URL: String = "http://10.0.2.2:8000/"

        val CURATED_PACKAGES: List<CuratedPackage> = listOf(
            CuratedPackage("com.google.android.apps.messaging", "Messages (SMS)"),
            CuratedPackage("com.whatsapp", "WhatsApp"),
            CuratedPackage("org.telegram.messenger", "Telegram"),
        )

        fun defaults(backendUrl: String = DEFAULT_BACKEND_URL): AppSettings = AppSettings(
            backendUrl = backendUrl,
            monitoringEnabled = false,
            sensitivity = DetectionSensitivity.DEFAULT,
            skipSavedContacts = false,
            selectedPackages = emptySet(),
            warningNotificationsEnabled = true,
            onboardingCompleted = false,
        )
    }
}
