"""OpenRouter AI service for UPI ScamShield AI.

OpenRouter exposes an OpenAI-compatible chat completions API. This service
returns the same result contract as ``GeminiService`` so the hybrid scorer and
API response format stay unchanged, and Gemini remains available as a fallback.

Security:
- The API key is read from the backend environment and never exposed.
- Submitted text is redacted and delimited by the shared prompt builder.
- Provider errors are sanitized before logging; message content is never logged.
- Credentials (UPI PIN, OTP) are masked before AI requests.
"""
from __future__ import annotations

import logging
import os
import re
import time
from typing import Any, Optional

logger = logging.getLogger(__name__)

import httpx

from app.core.config import get_settings
from app.services.detection.gemini_service import GeminiResponse, GeminiIndicator, validate_risk_level, validate_severity, build_analysis_prompt, parse_structured_analysis


DEFAULT_BASE_URL = "https://openrouter.ai/api/v1"
DEFAULT_MODEL = "google/gemini-3.5-flash"
MAX_OUTPUT_TOKENS = 2048


def _env_or_setting(env_name: str, setting_name: str, default: str) -> str:
    """Resolve a value from the process env, then backend/.env settings."""
    value = os.getenv(env_name)
    if value is None or not str(value).strip():
        value = getattr(get_settings(), setting_name, None)
    if value is None or not str(value).strip():
        return default
    return str(value).strip()


def _openrouter_api_key() -> str:
    """Return the configured OpenRouter API key, if any."""
    return _env_or_setting("OPENROUTER_API_KEY", "openrouter_api_key", "")


def is_openrouter_configured() -> bool:
    """Check whether an OpenRouter API key is configured."""
    return bool(_openrouter_api_key())


def get_openrouter_settings() -> dict[str, Any]:
    """Get OpenRouter configuration without exposing the key value."""
    settings = get_settings()
    return {
        "api_key": _openrouter_api_key() or None,
        "base_url": _env_or_setting(
            "OPENROUTER_BASE_URL", "openrouter_base_url", DEFAULT_BASE_URL
        ).rstrip("/"),
        "model": _env_or_setting("OPENROUTER_MODEL", "openrouter_model", DEFAULT_MODEL),
        "timeout_seconds": int(
            float(
                _env_or_setting(
                    "OPENROUTER_TIMEOUT_SECONDS", "openrouter_timeout_seconds", "30"
                )
            )
        ),
        "max_retries": int(
            _env_or_setting(
                "OPENROUTER_MAX_RETRIES", "openrouter_max_retries", str(settings.openrouter_max_retries)
            )
        ),
    }


def _sanitize_error_message(error: Exception) -> str:
    """Return an error message with credentials removed.

    OpenRouter errors can echo request metadata, so the configured key is
    scrubbed explicitly along with any token-shaped string.
    """
    message = str(error)
    api_key = _openrouter_api_key()
    if api_key:
        message = message.replace(api_key, "[REDACTED]")
    message = re.sub(r"sk-or-v1-[0-9A-Za-z]+", "[REDACTED_KEY]", message)
    message = re.sub(
        r"(?i)(bearer\s+)[^\s,;]+", r"\1[REDACTED]", message
    )
    message = re.sub(r"(?i)(key=)[^\s&]+", r"\1[REDACTED]", message)
    return message[:300]


def _redact_credentials(content: str) -> str:
    """Mask UPI PIN and OTP values in content before AI requests.

    Security: credentials are never sent to the AI provider. Patterns like
    ``UPI PIN 1234`` or ``OTP 123456`` are replaced with ``[REDACTED]``.
    """
    # Mask UPI PIN patterns (e.g., "UPI PIN 4321")
    content = re.sub(r"[Uu][Pp][Ii]\s+PIN\s+\d+", "UPI PIN [REDACTED]", content)
    # Mask OTP patterns (e.g., "OTP 998877")
    content = re.sub(r"[Oo][Tt][Pp]\s+\d+", "OTP [REDACTED]", content)
    # Mask standalone 4-6 digit PINs that appear in context
    content = re.sub(r"\b\d{4,6}\b", "[REDACTED]", content)
    return content


class OpenRouterService:
    """OpenRouter chat-completions client for UPI scam analysis.

    Returns the same result contract as ``GeminiService`` so the hybrid scorer
    and API response format stay unchanged, and Gemini remains available as a
    fallback.
    """

    def __init__(self, transport: Optional[httpx.BaseTransport] = None) -> None:
        """Create the service.

        Args:
            transport: Optional HTTP transport. Tests inject ``MockTransport``
                here so no network request is made; production leaves it None.
        """
        self._settings = get_settings()
        self._transport = transport
        self._client_ready = False
        self._api_key = ""
        self._base_url = DEFAULT_BASE_URL
        self._model_name = DEFAULT_MODEL
        self._timeout = 30.0
        self._max_retries = 2
        self._ensure_initialized()

    def _ensure_initialized(self) -> None:
        """Load configuration. Constructing the service performs no network I/O."""
        if self._client_ready:
            return

        api_key = _openrouter_api_key()
        if not api_key:
            logger.debug("OpenRouter API key not configured - service unavailable")
            return

        config = get_openrouter_settings()
        self._api_key = api_key
        self._base_url = config["base_url"]
        self._model_name = config["model"]
        self._timeout = float(config["timeout_seconds"])
        self._max_retries = int(config["max_retries"])
        self._client_ready = True
        logger.info("OpenRouter service initialized with model: %s", self._model_name)

    def is_available(self) -> bool:
        """Whether the service has a key and can make requests."""
        self._ensure_initialized()
        return self._client_ready

    def get_model_name(self) -> str:
        """Get the configured OpenRouter model id."""
        return self._model_name

    def analyze(
        self,
        content: str,
        content_type: str = "text",
        timeout: float | None = None,
    ) -> dict[str, Any]:
        """Analyze message content through OpenRouter.

        Returns the same shape as ``GeminiService.analyze``:
        status (completed|unavailable|failed), provider, model, result, error.

        Security:
        - Treats all submitted messages as untrusted data.
        - Credentials (UPI PIN, OTP) are masked before AI requests.
        - Uses the shared prompt builder so instructions embedded in the message
          cannot break out of the data block.
        - Errors are sanitized; message content is never logged.
        """
        self._ensure_initialized()

        if not self._client_ready:
            return {
                "status": "unavailable",
                "provider": "openrouter",
                "model": "none",
                "result": None,
            }

        # Redact credentials before building the prompt
        safe_content = _redact_credentials(content)
        prompt = build_analysis_prompt(safe_content, content_type)
        call_timeout = timeout if timeout is not None else self._timeout

        last_error: Optional[Exception] = None
        for attempt in range(self._max_retries + 1):
            try:
                result = self._call_openrouter(prompt, timeout=call_timeout)
                if result is not None:
                    return {
                        "status": "completed",
                        "provider": "openrouter",
                        "model": self._model_name,
                        "result": result,
                    }
                last_error = ValueError("OpenRouter returned an invalid response")
            except Exception as exc:  # noqa: BLE001 - normalized below
                last_error = exc
                safe_error = _sanitize_error_message(exc)
                if self._is_retryable_error(exc) and attempt < self._max_retries:
                    wait_time = min(2 ** attempt, 10)
                    logger.warning(
                        "OpenRouter attempt %d failed: %s. Retrying in %ds...",
                        attempt + 1,
                        safe_error[:100],
                        wait_time,
                    )
                    time.sleep(wait_time)
                    continue
                else:
                    # Not retryable or exhausted retries
                    logger.error(
                        "OpenRouter analysis failed after %d attempts: %s",
                        attempt + 1,
                        safe_error,
                    )
                    break

        # All attempts failed or were skipped
        return {
            "status": "failed",
            "provider": "openrouter",
            "model": self._model_name,
            "result": None,
            "error": _sanitize_error_message(last_error) if last_error else "Unknown error",
        }

    def _is_retryable_error(self, error: Exception) -> bool:
        """Retry transient provider/network failures only.

        Only retry on 429 (rate limit), 500, 502, 503, 504, TimeoutException,
        and TransportError. Do NOT retry on 402 (insufficient credits), 401
        (authentication failure), or other non-retryable errors.
        """
        if isinstance(error, httpx.HTTPStatusError):
            return error.response.status_code in {429, 500, 502, 503, 504}
        if isinstance(error, (httpx.TimeoutException, httpx.TransportError)):
            return True
        return False

    def _call_openrouter(
        self,
        prompt: str,
        timeout: float | None = None,
    ) -> Optional[GeminiResponse]:
        """POST one chat-completion request and validate the JSON output.

        Returns a ``GeminiResponse`` pydantic object so the hybrid scorer and
        API response format stay compatible with the Gemini code path.
        """
        request_timeout = timeout or self._timeout
        payload = {
            "model": self._model_name,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.0,
            "max_tokens": MAX_OUTPUT_TOKENS,
            "response_format": {"type": "json_object"},
        }
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
            "X-Title": self._settings.app_name,
        }

        try:
            with httpx.Client(
                timeout=request_timeout,
                transport=self._transport,
            ) as client:
                response = client.post(
                    f"{self._base_url}/chat/completions",
                    headers=headers,
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()
                if not isinstance(data, dict):
                    return None

                choices = data.get("choices") or []
                if not isinstance(choices, list) or not choices:
                    logger.warning("OpenRouter returned no choices")
                    return None

                message = choices[0].get("message") if isinstance(choices[0], dict) else None
                content = message.get("content") if isinstance(message, dict) else None
                if isinstance(content, list):
                    # Some providers return content as typed parts.
                    content = "\n".join(
                        part.get("text", "")
                        for part in content
                        if isinstance(part, dict)
                    )

                parsed = parse_structured_analysis(content)
                if parsed is None:
                    return None
                # Construct a GeminiResponse from the parsed dict
                risk_level = validate_risk_level(str(parsed.get("risk_level", "low")))
                category = str(parsed.get("category", "General Scam")).strip()[:100] or "General Scam"
                summary = str(parsed.get("summary", "")).strip()[:500]
                indicators_raw = parsed.get("indicators", [])
                if not isinstance(indicators_raw, list):
                    indicators = []
                else:
                    indicators: list[GeminiIndicator] = []
                    for ind in indicators_raw:
                        if not isinstance(ind, dict):
                            continue
                        name = str(ind.get("name", "")).strip()[:120]
                        if not name:
                            continue
                        severity = validate_severity(str(ind.get("severity", "")))
                        explanation = str(ind.get("explanation", "")).strip()[:500]
                        indicators.append(GeminiIndicator(
                            name=name,
                            severity=severity,
                            explanation=explanation,
                        ))
                recommendations_raw = parsed.get("recommendations", [])
                if not isinstance(recommendations_raw, list):
                    recommendations = []
                else:
                    recommendations = [str(r).strip()[:200] for r in recommendations_raw if str(r).strip()][:10]
                confidence = float(parsed.get("confidence", 0.9))
                if not 0.0 <= confidence <= 1.0:
                    confidence = 0.9
                is_suspicious = parsed.get("is_suspicious", False)
                return GeminiResponse(
                    is_suspicious=is_suspicious,
                    risk_level=risk_level,
                    category=category,
                    summary=summary,
                    indicators=indicators,
                    recommendations=recommendations,
                    confidence=confidence,
                )

        except Exception as exc:  # noqa: BLE001 - re-raised and sanitized by caller
            logger.error(
                "OpenRouter API call failed: %s", _sanitize_error_message(exc)
            )
            raise