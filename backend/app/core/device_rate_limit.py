"""Per-device rate limiting for quick detection.

The existing request guard (``app.core.middleware``) limits requests per client
IP before authentication, so it cannot identify a device. This limiter runs
after device authentication and keys the sliding window on the authenticated
device id, which is the unit that matters for a background notification listener.

It follows the same in-process sliding-window design as the existing guard, so
the same deployment limitation applies: the window is per worker. A multi-worker
or multi-instance deployment needs a shared store (for example Redis) for an
exactly global limit. This is documented in the README and API docs.

The limiter only affects the quick detection route; existing endpoint limits are
unchanged.
"""

from __future__ import annotations

import math
import threading
import time
from collections import defaultdict, deque

DEFAULT_WINDOW_SECONDS = 60.0
MAX_TRACKED_KEYS = 10_000


class DeviceRateLimiter:
    """Thread-safe sliding-window limiter keyed by an arbitrary device key."""

    def __init__(self) -> None:
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def check(
        self,
        key: str,
        limit: int,
        window_seconds: float = DEFAULT_WINDOW_SECONDS,
    ) -> int | None:
        """Record a request and return ``Retry-After`` seconds when limited.

        Returns ``None`` when the request is allowed.
        """
        if limit <= 0:
            return None

        now = time.monotonic()
        with self._lock:
            bucket = self._hits[key]
            while bucket and now - bucket[0] >= window_seconds:
                bucket.popleft()

            if len(bucket) >= limit:
                # Seconds until the oldest request leaves the window.
                retry_after = window_seconds - (now - bucket[0])
                return max(1, math.ceil(retry_after))

            bucket.append(now)
            if len(self._hits) > MAX_TRACKED_KEYS:
                self._prune(now, window_seconds)
            return None

    def _prune(self, now: float, window_seconds: float) -> None:
        """Drop empty or fully expired buckets so memory stays bounded."""
        stale = [
            key
            for key, bucket in self._hits.items()
            if not bucket or now - bucket[-1] >= window_seconds
        ]
        for key in stale:
            self._hits.pop(key, None)

    def reset(self) -> None:
        """Clear all windows. Used by tests only."""
        with self._lock:
            self._hits.clear()


# One limiter shared by the process; tests reset it explicitly.
quick_scan_limiter = DeviceRateLimiter()
