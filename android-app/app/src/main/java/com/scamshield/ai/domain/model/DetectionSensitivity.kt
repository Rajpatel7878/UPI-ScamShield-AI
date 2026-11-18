package com.scamshield.ai.domain.model

enum class DetectionSensitivity(val label: String, val description: String) {
    LOW(
        "Low",
        "Only strong credential or payment-request signals should be surfaced.",
    ),
    MEDIUM(
        "Medium",
        "Balanced checks for most suspicious notifications. Recommended.",
    ),
    HIGH(
        "High",
        "Weaker signals are surfaced too. Expect more false positives.",
    );

    companion object {
        val DEFAULT: DetectionSensitivity = MEDIUM

        fun fromStorage(value: String?): DetectionSensitivity =
            entries.firstOrNull { it.name.equals(value, ignoreCase = true) } ?: DEFAULT
    }
}
