package com.scamshield.ai.presentation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.scamshield.ai.AppContainer
import com.scamshield.ai.domain.model.AppSettings
import com.scamshield.ai.presentation.navigation.Routes
import com.scamshield.ai.presentation.navigation.ScamShieldNavHost
import com.scamshield.ai.presentation.navigation.navigateFromBottomBar
import kotlinx.coroutines.flow.StateFlow

@Composable
fun ScamShieldApp(
    container: AppContainer,
    resultRequests: StateFlow<Long?>,
    onResultRequestHandled: () -> Unit,
) {
    val settingsState = produceState<AppSettings?>(initialValue = null) {
        container.settingsRepository.settings.collect { settings -> value = settings }
    }
    val settings = settingsState.value

    if (settings == null) {
        LoadingScreen()
        return
    }

    // Computed once from the first loaded settings so later preference changes do
    // not recreate the navigation graph.
    val startDestination = remember { Routes.startDestination(settings.onboardingCompleted) }

    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route
    val showBottomBar = currentRoute in Routes.bottomBarRoutes

    // A warning notification tap opens the stored result for that detection.
    val pendingResultId by resultRequests.collectAsStateWithLifecycle()
    LaunchedEffect(pendingResultId) {
        val recordId = pendingResultId ?: return@LaunchedEffect
        navController.navigate(Routes.result(recordId)) { launchSingleTop = true }
        onResultRequestHandled()
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        bottomBar = {
            if (showBottomBar) {
                NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
                    BottomDestination.entries.forEach { destination ->
                        NavigationBarItem(
                            selected = currentRoute == destination.route,
                            onClick = { navController.navigateFromBottomBar(destination.route) },
                            icon = {
                                Icon(
                                    imageVector = destination.icon,
                                    contentDescription = destination.label,
                                )
                            },
                            label = { Text(destination.label) },
                        )
                    }
                }
            }
        },
    ) { padding ->
        ScamShieldNavHost(
            navController = navController,
            startDestination = startDestination,
            container = container,
            modifier = Modifier.padding(padding),
        )
    }
}

@Composable
private fun LoadingScreen() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center,
    ) {
        CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
    }
}

private enum class BottomDestination(
    val route: String,
    val label: String,
    val icon: ImageVector,
) {
    Dashboard(Routes.DASHBOARD, "Dashboard", Icons.Filled.Home),
    History(Routes.HISTORY, "History", Icons.Filled.List),
    Settings(Routes.SETTINGS, "Settings", Icons.Filled.Settings),
}
