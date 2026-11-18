"""Quick notification analysis pipeline for the Android app.

Order of operations (see docs/ANDROID_QUICK_DETECTION_API.md):

1. mask credential values with the conservative privacy masker,
2. run the existing ``RuleDetector`` / ``RiskScorer`` rules on the masked text,
3. run the existing passive ``URLDetector`` and take the higher base score,
4. optionally call the existing AI provider chain (OpenRouter -> Gemini) only
   for mid-range base scores,
5. merge a validated AI result through the existing ``HybridScorer`` (60/40),
6. derive a short warning and at most three reasons from matched rule names.

No new thresholds, categories, scoring weights or AI providers are introduced.
"""

from __future__ import annotations

import logging
from typing import Any, Awaitable, Callable, Optional

from app.core.config import get_settings
from app.services.detection.hybrid_scorer import HybridScorer
from app.services.detection.risk_scorer import RISK_BANDS
from app.services.detection.rule_detector import RuleDetector
from app.services.detection.url_detector import URLDetector
from app.services.privacy.masking import mask_sensitive_text

logger = logging.getLogger(__name__)

# AI invocation policy. These bounds control AI usage only; they are not risk
# classification thresholds and do not affect RISK_BANDS.
AI_MIN_SCORE = 35
AI_MAX_SCORE = 75

MAX_REASONS = 3
MAX_WARNING_LENGTH = 120
QUICK_CONTENT_TYPE = "sms"

AIAnalyzer = Callable[..., Awaitable[Optional[dict[str, Any]]]]

# Short, user-facing descriptions of existing rule names. AI text is never used
# here because provider output could echo message content back to the client.
RULE_REASON_LABELS: dict[str, str] = {
    "OTP Request": "Asks for an OTP",
    "UPI PIN Request": "Asks for a UPI PIN",
    "Bank Credential Request": "Asks for bank or card details",
    "Fake KYC / Account Blocking": "Mentions KYC or account blocking",
    "Account Blocking Threat": "Threatens to block your account",
    "Urgent Payment Demand": "Uses urgent payment language",
    "Fake Cashback / Lottery / Prize": "Promises a cashback or prize",
    "Advance Processing Fee": "Asks for an upfront fee",
    "Suspicious Collect Request": "Contains payment instructions",
    "Impersonation - Bank/Support/Government": "Impersonates an official authority",
    "Suspicious URL": "Contains a suspicious link",
    "Threatening Language": "Uses threatening language",
}
URL_REASON = "Contains a suspicious link"

# Level-based warnings contain no message content and make no certainty claims.
WARNING_TEXTS: dict[str, str] = {
    "Critical": "High scam risk. Do not share OTP or UPI PIN or pay. Verify independently.",
    "High": "This message shows strong scam signals. Verify the sender before acting.",
    "Medium": "Suspicious message. Avoid links and verify the sender independently.",
    "Low": "No strong scam signals found. Stay cautious with links and payment requests.",
}


def risk_level_for_score(score: int) -> str:
    """Classify a score with the existing project risk bands."""
    for level in ("Critical", "High", "Medium", "Low"):
        minimum, maximum = RISK_BANDS[level]
        if minimum <= score <= maximum:
            return level
    return "Low"


def should_use_ai(base_score: int) -> bool:
    """Return True when the AI invocation policy allows a provider request."""
    return AI_MIN_SCORE <= base_score <= AI_MAX_SCORE


def _clamp_score(value: Any) -> int:
    try:
        score = int(value)
    except (TypeError, ValueError):
        return 0
    return max(0, min(100, score))


def _build_reasons(matched_rule_names: list[str], has_url: bool) -> list[str]:
    """Build at most three concise reasons from matched rule names only."""
    reasons: list[str] = []
    for name in matched_rule_names:
        label = RULE_REASON_LABELS.get(name, name)
        if label and label not in reasons:
            reasons.append(label)
    if has_url and URL_REASON not in reasons:
        reasons.append(URL_REASON)
    return reasons[:MAX_REASONS]


def _warning_text(risk_level: str) -> str:
    """Return a short, content-free warning for the risk level."""
    warning = WARNING_TEXTS.get(risk_level, WARNING_TEXTS["Low"])
    return warning[:MAX_WARNING_LENGTH]


def _url_result_has_content(url_analysis: dict[str, Any]) -> bool:
    return bool(url_analysis.get("url_results"))


async def analyze_quick_scan(
    text: str,
    ai_analyzer: AIAnalyzer | None = None,
    ai_timeout: float | None = None,
    content_type: str = QUICK_CONTENT_TYPE,
) -> dict[str, Any]:
    """Analyze one notification and return the quick detection payload.

    ``ai_analyzer`` is the existing provider chain injected by the route. When it
    is omitted, is not called, fails or times out, the rule/URL result is
    returned unchanged.
    """
    masked_text = mask_sensitive_text(text)

    detector = RuleDetector()
    analysis = detector.detect(masked_text, content_type=content_type)
    if not isinstance(analysis, dict):
        analysis = {}

    matched_rule_names = [
        str(name) for name in (analysis.get("matched_rule_names") or [])
    ]
    severities = analysis.get("severities") or {}
    categories = analysis.get("categories") or {}
    recommendations = [str(item) for item in (analysis.get("recommendations") or [])]

    rule_score = _clamp_score(analysis.get("total_score", 0))
    category = str(analysis.get("category") or "General Scam")

    indicators = [
        {
            "rule_id": None,
            "name": name,
            "category": str(categories.get(name, "") or ""),
            "severity": str(severities.get(name, "") or ""),
            "description": "",
            "source": "rule_based",
        }
        for name in matched_rule_names
    ]

    # Passive URL analysis reuses the existing detector; no second engine.
    url_analysis = URLDetector().detect_urls_in_message(masked_text)
    if not isinstance(url_analysis, dict):
        url_analysis = {}
    url_score = _clamp_score(url_analysis.get("overall_risk_score", 0))
    has_url = _url_result_has_content(url_analysis)

    base_score = max(rule_score, url_score)
    if url_score > rule_score:
        category = str(url_analysis.get("overall_category") or category)

    analysis_type = "rule_and_url" if has_url else "rule_based_only"
    final_score = base_score

    if ai_analyzer is not None and should_use_ai(base_score):
        timeout = (
            ai_timeout
            if ai_timeout is not None
            else get_settings().quick_scan_ai_timeout_seconds
        )
        ai_result: Optional[dict[str, Any]] = None
        try:
            ai_result = await ai_analyzer(
                masked_text,
                content_type,
                timeout=timeout,
            )
        except Exception:  # noqa: BLE001 - AI failure must never break the rules
            # Only the exception type is logged; message content is never logged.
            logger.warning("Quick scan AI analysis failed")

        if (
            isinstance(ai_result, dict)
            and ai_result.get("status") == "completed"
            and ai_result.get("result") is not None
        ):
            hybrid = HybridScorer().score(
                rule_score=base_score,
                rule_risk_level=risk_level_for_score(base_score),
                rule_category=category,
                rule_indicators=indicators,
                rule_recommendations=recommendations,
                gemini_result=ai_result,
            )
            final_score = _clamp_score(hybrid.get("hybrid_score", final_score))
            category = str(hybrid.get("category") or category)
            analysis_type = str(hybrid.get("analysis_type") or "hybrid")

    risk_level = risk_level_for_score(final_score)
    return {
        "risk_score": final_score,
        "risk_level": risk_level,
        "category": category,
        "warning_text": _warning_text(risk_level),
        "reasons": _build_reasons(matched_rule_names, has_url),
        "analysis_type": analysis_type,
    }
