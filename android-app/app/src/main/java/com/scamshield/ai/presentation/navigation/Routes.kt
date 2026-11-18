package com.scamshield.ai.presentation.navigation

object Routes {
    const val ONBOARDING = "onboarding"
    const val DASHBOARD = "dashboard"
    const val HISTORY = "history"
    const val SETTINGS = "settings"

    const val RESULT_ARG_ID = "recordId"
    const val RESULT_PATTERN = "result/{$RESULT_ARG_ID}"

    fun result(recordId: Long): String = "result/$recordId"

    /** Routes that show the bottom navigation bar. */
    val bottomBarRoutes: Set<String> = setOf(DASHBOARD, HISTORY, SETTINGS)

    /**
     * The app opens on the dashboard once onboarding has been completed, and on
     * onboarding for a fresh install.
     */
    fun startDestination(onboardingCompleted: Boolean): String =
        if (onboardingCompleted) DASHBOARD else ONBOARDING
}
