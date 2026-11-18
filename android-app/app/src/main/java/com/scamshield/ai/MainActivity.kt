package com.scamshield.ai

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.scamshield.ai.presentation.ScamShieldApp
import com.scamshield.ai.presentation.theme.ScamShieldTheme
import kotlinx.coroutines.flow.MutableStateFlow

class MainActivity : ComponentActivity() {

    private val pendingResultId = MutableStateFlow<Long?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val container = (application as ScamShieldApplication).container
        pendingResultId.value = resultIdOf(intent)

        setContent {
            ScamShieldTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background,
                ) {
                    ScamShieldApp(
                        container = container,
                        resultRequests = pendingResultId,
                        onResultRequestHandled = { pendingResultId.value = null },
                    )
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        pendingResultId.value = resultIdOf(intent)
    }

    companion object {
        const val EXTRA_RESULT_ID = "com.scamshield.ai.extra.RESULT_ID"

        /** Positive stored detection id from a warning notification, or null. */
        fun resultIdOf(intent: Intent?): Long? =
            intent?.getLongExtra(EXTRA_RESULT_ID, NO_RESULT_ID)?.takeIf { it > 0 }

        private const val NO_RESULT_ID = -1L
    }
}
