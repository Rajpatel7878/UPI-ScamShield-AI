package com.scamshield.ai.domain.model

/**
 * How a detection result was produced. Labels are deliberately honest about
 * online AI-assisted versus rule-only results.
 */
enum class DetectionSource(val label: String) {
    ONLINE_HYBRID("Online, AI-assisted"),
    ONLINE_RULE_BASED("Online, rule-based"),
    OFFLINE_LOCAL("Offline, local rules"),
    UNKNOWN("Unknown source");

    companion object {
        fun fromApiType(value: String?): DetectionSource = when (value?.trim()?.lowercase()) {
            "hybrid" -> ONLINE_HYBRID
            "rule_and_url", "rule_based_only" -> ONLINE_RULE_BASED
            else -> UNKNOWN
        }

        fun fromStorage(value: String?): DetectionSource =
            entries.firstOrNull { it.name == value } ?: UNKNOWN
    }
}
