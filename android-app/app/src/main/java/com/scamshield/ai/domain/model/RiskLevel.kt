package com.scamshield.ai.domain.model

/**
 * Risk bands returned by the backend. The backend remains the source of truth for
 * thresholds; the app only maps the four documented labels and never recalculates them.
 */
enum class RiskLevel(val label: String) {
    LOW("Low"),
    MEDIUM("Medium"),
    HIGH("High"),
    CRITICAL("Critical"),
    UNKNOWN("Unknown");

    val isHighRisk: Boolean
        get() = this == HIGH || this == CRITICAL

    companion object {
        fun fromApi(value: String?): RiskLevel = when (value?.trim()?.lowercase()) {
            "low" -> LOW
            "medium" -> MEDIUM
            "high" -> HIGH
            "critical" -> CRITICAL
            else -> UNKNOWN
        }

        fun fromStorage(value: String?): RiskLevel =
            entries.firstOrNull { it.name.equals(value, ignoreCase = true) } ?: UNKNOWN
    }
}
