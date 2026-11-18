package com.scamshield.ai.presentation.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.scamshield.ai.AppContainer
import com.scamshield.ai.presentation.dashboard.DashboardScreen
import com.scamshield.ai.presentation.history.HistoryScreen
import com.scamshield.ai.presentation.onboarding.OnboardingScreen
import com.scamshield.ai.presentation.result.DetectionResultScreen
import com.scamshield.ai.presentation.settings.SettingsScreen
import kotlinx.coroutines.launch

@Composable
fun ScamShieldNavHost(
    navController: NavHostController,
    startDestination: String,
    container: AppContainer,
    modifier: Modifier = Modifier,
) {
    val scope = rememberCoroutineScope()

    NavHost(
        navController = navController,
        startDestination = startDestination,
        modifier = modifier,
    ) {
        composable(Routes.ONBOARDING) {
            OnboardingScreen(
                onContinue = {
                    scope.launch { container.settingsRepository.setOnboardingCompleted(true) }
                    navController.navigate(Routes.DASHBOARD) {
                        popUpTo(Routes.ONBOARDING) { inclusive = true }
                        launchSingleTop = true
                    }
                },
            )
        }

        composable(Routes.DASHBOARD) {
            DashboardScreen(
                container = container,
                onOpenSettings = { navController.navigateFromBottomBar(Routes.SETTINGS) },
                onOpenHistory = { navController.navigateFromBottomBar(Routes.HISTORY) },
                onOpenRecord = navController::openRecord,
            )
        }

        composable(Routes.HISTORY) {
            HistoryScreen(container = container, onOpenRecord = navController::openRecord)
        }

        composable(Routes.SETTINGS) {
            SettingsScreen(container = container)
        }

        composable(
            route = Routes.RESULT_PATTERN,
            arguments = listOf(
                navArgument(Routes.RESULT_ARG_ID) { type = NavType.LongType },
            ),
        ) { backStackEntry ->
            val recordId = backStackEntry.arguments?.getLong(Routes.RESULT_ARG_ID) ?: 0L
            DetectionResultScreen(
                container = container,
                recordId = recordId,
                onBack = { navController.popBackStack() },
            )
        }
    }
}

internal fun NavHostController.openRecord(recordId: Long) {
    navigate(Routes.result(recordId)) { launchSingleTop = true }
}

internal fun NavHostController.navigateFromBottomBar(route: String) {
    navigate(route) {
        popUpTo(graph.findStartDestination().id) { saveState = true }
        launchSingleTop = true
        restoreState = true
    }
}
