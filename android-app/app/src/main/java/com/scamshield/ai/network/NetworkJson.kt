package com.scamshield.ai.network

import kotlinx.serialization.json.Json

/**
 * Shared JSON configuration: tolerate additive backend fields and omit null
 * optional request fields.
 */
val NetworkJson: Json = Json {
    ignoreUnknownKeys = true
    explicitNulls = false
    encodeDefaults = false
}
