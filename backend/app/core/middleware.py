"""Request guards: body-size limits, rate limiting and security headers.

The rate limiter is an in-process sliding window. It is intentionally simple and
dependency-free, and is suitable for a single-instance deployment. Multi-worker
deployments need a shared store (for example Redis) so limits apply globally;
this limitation is documented in the README.
"""
from __future__ import annotations

import logging
import time
from collections import defaultdict, deque

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_WINDOW_SECONDS = 60


class RequestGuardMiddleware(BaseHTTPMiddleware):
    """Apply cheap abuse protection before a request reaches the application."""

    def __init__(self, app) -> None:
        super().__init__(app)
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._request_count = 0

    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        settings = get_settings()
        started = time.perf_counter()

        # 1. Reject oversized declared bodies before parsing them.
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                if int(content_length) > settings.max_request_bytes:
                    return self._log_response(
                        request, started, self._error(request, 413, "Request body is too large.")
                    )
            except ValueError:
                return self._log_response(
                    request, started, self._error(request, 400, "Invalid Content-Length header.")
                )

        # 2. Rate limit mutation endpoints. Health checks and reads are excluded
        #    from the strict buckets but still bounded by the general API bucket.
        if request.method in {"POST", "PUT", "PATCH", "DELETE"}:
            limit, window = self._limit_for(request.url.path)
            if limit and self._is_limited(self._client_key(request), request.url.path, limit, window):
                return self._log_response(
                    request,
                    started,
                    self._error(
                        request,
                        429,
                        "Too many requests. Please wait and try again.",
                        headers={"Retry-After": str(window)},
                    ),
                )

        response = await call_next(request)

        # 3. Conservative security headers for all responses.
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        response.headers.setdefault(
            "Permissions-Policy",
            "geolocation=(), microphone=(), camera=()",
        )
        if request.url.path.startswith(settings.api_v1_prefix):
            response.headers.setdefault("Cache-Control", "no-store")
        if settings.is_production:
            response.headers.setdefault(
                "Strict-Transport-Security",
                "max-age=31536000; includeSubDomains",
            )

        return self._log_response(request, started, response)

    def _log_response(self, request: Request, started: float, response: Response) -> Response:
        """Emit one access log line. Request bodies and query strings are omitted."""
        duration_ms = (time.perf_counter() - started) * 1000
        logger.info(
            "%s %s -> %s (%.1f ms)",
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
        )
        return response

    def _limit_for(self, path: str) -> tuple[int, int]:
        settings = get_settings()
        if path.endswith("/auth/login"):
            return settings.rate_limit_login_per_minute, 60
        if path.endswith("/auth/register"):
            return settings.rate_limit_register_per_5_minutes, 300
        if path.endswith("/detect/analyze"):
            return settings.rate_limit_analyze_per_minute, 60
        if path.startswith(settings.api_v1_prefix):
            return settings.rate_limit_api_per_minute, 60
        return 0, 0

    def _client_key(self, request: Request) -> str:
        settings = get_settings()
        if settings.trust_proxy_headers:
            forwarded = request.headers.get("x-forwarded-for", "")
            if forwarded:
                return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def _is_limited(self, client: str, path: str, limit: int, window: int) -> bool:
        now = time.monotonic()
        bucket_key = f"{client}:{path}"
        bucket = self._hits[bucket_key]

        while bucket and now - bucket[0] > window:
            bucket.popleft()

        self._request_count += 1
        if self._request_count % 1000 == 0:
            self._prune(now, window)

        if len(bucket) >= limit:
            return True

        bucket.append(now)
        return False

    def _prune(self, now: float, window: int) -> None:
        """Drop empty/stale buckets so the limiter cannot grow without bound."""
        stale = [
            key
            for key, bucket in self._hits.items()
            if not bucket or now - bucket[-1] > max(window, _WINDOW_SECONDS)
        ]
        for key in stale:
            self._hits.pop(key, None)

    def _error(
        self,
        request: Request,
        status_code: int,
        detail: str,
        headers: dict[str, str] | None = None,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status_code,
            content={
                "status": "error",
                "detail": detail,
                "path": request.url.path,
            },
            headers=headers or {},
        )
