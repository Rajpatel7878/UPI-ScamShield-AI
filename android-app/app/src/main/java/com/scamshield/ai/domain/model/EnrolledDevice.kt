package com.scamshield.ai.domain.model

/** Non-sensitive identity of the device registered with the backend. */
data class EnrolledDevice(
    val id: Long,
    val name: String,
)

/** Result of a device enrollment or token rotation attempt. */
sealed interface EnrollmentResult {

    data object Success : EnrollmentResult

    /** A safe, user-facing message. Never contains a token or JWT. */
    data class Failure(val message: String) : EnrollmentResult
}
