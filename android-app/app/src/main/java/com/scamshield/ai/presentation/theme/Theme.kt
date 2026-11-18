package com.scamshield.ai.presentation.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = BrandRed,
    onPrimary = Color.White,
    primaryContainer = Color(0xFF3A0A14),
    onPrimaryContainer = Color(0xFFFFD9E0),
    secondary = ElectricBlue,
    onSecondary = Color.White,
    secondaryContainer = Color(0xFF11213F),
    onSecondaryContainer = Color(0xFFD7E3FF),
    tertiary = Magenta,
    onTertiary = Color.White,
    background = BackgroundDark,
    onBackground = InkDark,
    surface = SurfaceDark,
    onSurface = InkDark,
    surfaceVariant = SurfaceVariantDark,
    onSurfaceVariant = MutedDark,
    outline = OutlineDark,
    error = DangerRed,
    onError = Color.White,
)

private val LightColorScheme = lightColorScheme(
    primary = BrandRedStrong,
    onPrimary = Color.White,
    primaryContainer = Color(0xFFFFE1E7),
    onPrimaryContainer = Color(0xFF4A0011),
    secondary = Color(0xFF1F5FE0),
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFDCE6FF),
    onSecondaryContainer = Color(0xFF001A43),
    tertiary = Color(0xFFA21CAF),
    onTertiary = Color.White,
    background = BackgroundLight,
    onBackground = InkLight,
    surface = SurfaceLight,
    onSurface = InkLight,
    surfaceVariant = SurfaceVariantLight,
    onSurfaceVariant = MutedLight,
    outline = OutlineLight,
    error = Color(0xFFB3261E),
    onError = Color.White,
)

@Composable
fun ScamShieldTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme,
        typography = ScamShieldTypography,
        content = content,
    )
}
