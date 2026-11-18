package com.scamshield.ai.notifications

/**
 * Remembers which detection events already produced a warning so the same result can
 * never notify twice. Bounded, in-memory and thread-safe.
 */
class WarningDeduplicator(private val maxEntries: Int = 200) {

    private val shown = LinkedHashSet<Long>()

    /** Returns true the first time an event id is seen, false afterwards. */
    @Synchronized
    fun firstTime(eventId: Long): Boolean {
        if (!shown.add(eventId)) return false
        while (shown.size > maxEntries) {
            val iterator = shown.iterator()
            if (!iterator.hasNext()) break
            iterator.next()
            iterator.remove()
        }
        return true
    }

    @Synchronized
    fun forget(eventId: Long) {
        shown.remove(eventId)
    }
}
