package com.scamshield.ai.utils

import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

object TimeFormat {
    private val formatter = DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm")

    fun format(timestampMillis: Long, zoneId: ZoneId = ZoneId.systemDefault()): String =
        Instant.ofEpochMilli(timestampMillis).atZone(zoneId).format(formatter)
}
