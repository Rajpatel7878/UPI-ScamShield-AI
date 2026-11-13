"""Detection analysis and scan history API routes."""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from math import ceil
from typing import Any, Optional
from urllib.parse import urlsplit

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, case, delete, func, or_, select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db_session
from app.models.scan import Scan
from app.models.user import User
from app.schemas.history import (
    HistoryDeleteResponse,
    HistoryItem,
    HistoryListResponse,
    HistoryPagination,
    ScanDetailResponse,
)
from app.schemas.detection import DetectionRequest, DetectionResponse
from app.services.detection.gemini_service import GeminiService, is_gemini_configured
from app.services.detection.openrouter_service import is_openrouter_configured as _is_openrouter_configured
from app.services.detection.hybrid_scorer import HybridScorer
from app.services.detection.risk_scorer import RiskScorer
from app.services.detection.rule_detector import RuleDetector
from app.services.detection.url_detector import URLDetector

logger = logging.getLogger(__name__)

# Provider check wrappers for test monkeypatching
def is_openrouter_configured() -> bool:
    return _is_openrouter_configured()

router = APIRouter(tags=["detection"])

ALLOWED_CONTENT_TYPES = {"sms", "whatsapp", "payment_request", "url", "general"}
ALLOWED_RISK_LEVELS = {"low", "medium", "high", "critical"}
ALLOWED_SORT_BY = {"created_at", "risk_score"}
ALLOWED_SORT_ORDER = {"asc", "desc"}

RISK_PRIORITY = {"low": 1, "medium": 2, "high": 3, "critical": 4}


def _normalize_risk_level(level: Optional[str]) -> Optional[str]:
    if not level:
        return None
    value = level.strip().lower()
    mapping = {"low": "Low", "medium": "Medium", "high": "High", "critical": "Critical"}
    return mapping.get(value)


def _safe_int(value: Any, default: int = 0) -> int:
    try:
        if value is None:
            return default
        return int(value)
    except Exception:
        return default


def _redact_url(url: str) -> str:
    """Return a display-safe URL with query values redacted.

    Host, path and parameter names are preserved for explainability. Parameter
    values may contain tokens, OTPs or credentials and are never returned.
    """
    try:
        parts = urlsplit(url)
    except Exception:
        return "[invalid-url]"

    if not parts.scheme or not parts.netloc:
        return "[invalid-url]"

    redacted = f"{parts.scheme}://{parts.netloc}{parts.path or '/'}"
    if parts.query:
        names = []
        for chunk in parts.query.split("&"):
            name = chunk.split("=", 1)[0]
            if name:
                names.append(f"{name}=[redacted]")
        if names:
            redacted += "?" + "&".join(names)
    return redacted[:300]


def _build_ai_analysis(
    ai_result: Optional[dict[str, Any]],
    ai_status: str,
) -> dict[str, Any]:
    """Build the ``ai_analysis`` response section.

    The provider and model always come from the service that produced the
    result, so an OpenRouter answer is never reported as Gemini. A result is
    only reported as completed when both the overall status and the provider
    result are present. Anything else is reported as unavailable so the client
    never treats missing AI analysis as a completed assessment.
    """
    provider = "none"
    model: Optional[str] = None
    if isinstance(ai_result, dict):
        provider = str(ai_result.get("provider") or "none")
        model = ai_result.get("model")

    completed = (
        ai_status == "completed"
        and isinstance(ai_result, dict)
        and ai_result.get("status") == "completed"
        and ai_result.get("result") is not None
    )
    if not completed:
        return {
            "status": "unavailable",
            "provider": provider,
            "model": model,
            "result": None,
        }

    result = ai_result.get("result")
    if hasattr(result, "model_dump"):
        result = result.model_dump()

    return {
        "status": "completed",
        "provider": provider,
        "model": model,
        "result": result,
    }


async def _analyze_with_gemini(content: str, content_type: str) -> Optional[dict[str, Any]]:
    """Run Gemini analysis off the event loop, with a hard wall-clock bound."""
    if not is_gemini_configured():
        return None

    service = GeminiService()
    if not service.is_available():
        return None

    try:
        return await asyncio.wait_for(
            asyncio.to_thread(service.analyze, content, content_type),
            timeout=35.0,
        )
    except asyncio.TimeoutError:
        logger.warning("Gemini analysis timed out")
        return None
    except Exception as exc:  # noqa: BLE001 - AI failure must never break rules
        logger.warning("Gemini analysis failed: %s", type(exc).__name__)
        return None


async def _analyze_with_openrouter(content: str, content_type: str) -> Optional[dict[str, Any]]:
    """Run OpenRouter analysis off the event loop, with a hard wall-clock bound."""
    from app.services.detection.openrouter_service import OpenRouterService, is_openrouter_configured

    if not is_openrouter_configured():
        return None

    service = OpenRouterService()
    if not service.is_available():
        return None

    try:
        return await asyncio.wait_for(
            asyncio.to_thread(service.analyze, content, content_type),
            timeout=35.0,
        )
    except asyncio.TimeoutError:
        logger.warning("OpenRouter analysis timed out")
        return None
    except Exception as exc:  # noqa: BLE001 - AI failure must never break rules
        logger.warning("OpenRouter analysis failed: %s", type(exc).__name__)
        return None


async def _analyze_with_ai(content: str, content_type: str) -> Optional[dict[str, Any]]:
    """Run AI analysis, trying OpenRouter then Gemini, falling back to rule-based."""
    # Try OpenRouter first if configured
    if is_openrouter_configured():
        openrouter_result = await _analyze_with_openrouter(content, content_type)
        if openrouter_result and openrouter_result.get("status") == "completed":
            return openrouter_result
    # Fall back to Gemini if configured
    if is_gemini_configured():
        gemini_result = await _analyze_with_gemini(content, content_type)
        if gemini_result and gemini_result.get("status") == "completed":
            return gemini_result
    # No AI provider configured
    return None


def _run_url_analysis(content: str, content_type: str) -> dict[str, Any]:
    """Run passive URL analysis and return a normalized result."""
    detector = URLDetector()
    result = detector.detect_urls_in_message(content)

    if content_type == "url" and result.get("urls_found", 0) == 0:
        single = detector.analyze_url(content.strip())
        hostname = single.get("hostname") or ""
        if not hostname or ('.' not in hostname and not single.get("indicators")):
            raise HTTPException(
                status_code=422,
                detail="Invalid URL. Provide a full URL with a hostname, for example https://example.com.",
            )
        return {
            "urls_found": 1,
            "url_results": [single],
            "overall_risk_score": single["risk_score"],
            "overall_risk_level": single["risk_level"],
            "overall_category": single["category"],
            "merged_recommendations": single["recommendations"],
            "summary": single["summary"],
        }

    return result


def _url_indicators(url_analysis: dict[str, Any]) -> list[dict[str, Any]]:
    """Flatten per-URL indicators into response indicators with redacted URLs."""
    flattened: list[dict[str, Any]] = []
    for url_result in url_analysis.get("url_results", []):
        safe_url = _redact_url(url_result.get("url", ""))
        for indicator in url_result.get("indicators", []):
            flattened.append(
                {
                    "rule_id": None,
                    "name": indicator.get("name", "URL indicator"),
                    "category": url_result.get("category", "Suspicious Link"),
                    "severity": indicator.get("severity", "medium"),
                    "description": indicator.get("description", ""),
                    "source": "url_based",
                    "url": safe_url,
                }
            )
    return flattened


def _merge_unique(items: list[str]) -> list[str]:
    merged: list[str] = []
    seen: set[str] = set()
    for item in items:
        text = str(item).strip()
        if not text:
            continue
        key = text.lower()
        if key not in seen:
            seen.add(key)
            merged.append(text)
    return merged


@router.post("/detect/analyze", response_model=DetectionResponse)
async def analyze(
    request: DetectionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> DetectionResponse:
    content_type = (request.content_type or "general").strip().lower()
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported content type. Allowed: {sorted(ALLOWED_CONTENT_TYPES)}",
        )

    detector = RuleDetector()
    analysis = detector.detect(request.content, content_type=content_type)
    if not isinstance(analysis, dict):
        analysis = {}

    matched_rule_names = analysis.get("matched_rule_names") or []
    scorer = RiskScorer()
    try:
        score_result = scorer.calculate_score(matched_rule_names)
    except Exception:
        logger.exception("Rule scoring failed")
        score_result = {"total_score": 0, "risk_level": "Low", "category": "General Scam"}

    rule_score = _safe_int(score_result.get("total_score", 0), 0)
    rule_level = _normalize_risk_level(score_result.get("risk_level")) or "Low"
    category = score_result.get("category") or "General Scam"

    indicators: list[dict[str, Any]] = []
    for name in matched_rule_names:
        indicators.append(
            {
                "rule_id": None,
                "name": name,
                "category": (analysis.get("categories") or {}).get(name, ""),
                "severity": (analysis.get("severities") or {}).get(name, ""),
                "description": (analysis.get("explanations") or {}).get(name, ""),
                "source": "rule_based",
            }
        )

    recommendations = analysis.get("recommendations") or []
    if not isinstance(recommendations, list):
        recommendations = []

    # Passive URL analysis. The rule engine stays the base score; when URL
    # analysis is more severe, the URL score is used because an explicit URL
    # submitted for analysis must not come back as zero-risk just because no
    # message rule matched.
    url_analysis = _run_url_analysis(request.content, content_type)
    url_score = _safe_int(url_analysis.get("overall_risk_score", 0), 0)
    url_level = _normalize_risk_level(url_analysis.get("overall_risk_level")) or "Low"
    url_indicators = _url_indicators(url_analysis)

    base_score = max(rule_score, url_score)
    base_level = rule_level
    if url_score > rule_score:
        base_level = url_level
        category = url_analysis.get("overall_category") or category

    indicators.extend(url_indicators)
    recommendations.extend(url_analysis.get("merged_recommendations") or [])

    ai_result = await _analyze_with_ai(request.content, content_type)
    ai_status = "completed" if ai_result and ai_result.get("status") == "completed" else "unavailable"
    ai_analysis = _build_ai_analysis(ai_result, ai_status)

    final_score = base_score
    final_level = base_level
    analysis_type = "rule_and_url" if url_indicators else "rule_based_only"
    summary = (
        f"Detected {len(indicators)} indicator(s) associated with potential fraud patterns."
        if indicators
        else "No strong fraud indicators were detected in the submitted content."
    )
    summary += f" URL analysis checked {url_analysis.get('urls_found', 0)} URL(s)."

    # The AI result is merged only when the provider returned a validated
    # result. HybridScorer uses the documented 60/40 weights and falls back
    # cleanly to rule and URL analysis.
    if ai_analysis["status"] == "completed":
        hybrid = HybridScorer().score(
            rule_score=base_score,
            rule_risk_level=base_level,
            rule_category=category,
            rule_indicators=indicators,
            rule_recommendations=recommendations,
            gemini_result=ai_result,
        )
        final_score = _safe_int(hybrid.get("hybrid_score", final_score), final_score)
        final_level = _normalize_risk_level(hybrid.get("risk_level")) or final_level
        category = hybrid.get("category") or category
        indicators = hybrid.get("indicators") or indicators
        recommendations = hybrid.get("recommendations") or recommendations
        analysis_type = hybrid.get("analysis_type") or "hybrid"
        summary = hybrid.get("summary") or summary

    recommendations = _merge_unique([str(item) for item in recommendations])[:10]
    if not recommendations:
        recommendations = [
            "Do not share your OTP or UPI PIN with anyone.",
            "Verify the request through your bank's official app or website.",
        ]

    created_at_dt = datetime.now(timezone.utc)
    scan = Scan(
        user_id=current_user.id,
        content_type=content_type,
        risk_score=final_score,
        risk_level=final_level,
        category=category,
        summary=summary[:500],
        indicators=indicators,
        recommendations=recommendations,
        content_hash=None,
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)

    return DetectionResponse(
        success=True,
        scan_id=str(scan.id),
        analysis_type=analysis_type,
        risk_score=final_score,
        risk_level=final_level,
        category=category,
        summary=summary,
        indicators=indicators,
        recommendations=recommendations,
        created_at=created_at_dt.isoformat(),
        ai_analysis=ai_analysis,
    )


def _scan_overview(db: Session, user_id: int) -> dict[str, Any]:
    """Return overview counts in a single aggregate query."""
    suspicious_levels = ("medium", "high", "critical")
    row = db.execute(
        select(
            func.count(Scan.id),
            func.coalesce(
                func.sum(
                    case(
                        (func.lower(Scan.risk_level).in_(suspicious_levels), 1),
                        else_=0,
                    )
                ),
                0,
            ),
            func.coalesce(
                func.sum(
                    case(
                        (func.lower(Scan.risk_level) == "critical", 1),
                        else_=0,
                    )
                ),
                0,
            ),
            func.max(Scan.created_at),
        ).where(Scan.user_id == user_id)
    ).one()

    total, suspicious, critical, most_recent = row
    return {
        "total_scans": int(total or 0),
        "suspicious_scans": int(suspicious or 0),
        "critical_scans": int(critical or 0),
        "most_recent_scan_date": most_recent.isoformat() if most_recent else None,
    }


@router.get("/detect/history", response_model=HistoryListResponse)
async def get_scan_history(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    risk_level: Optional[str] = Query(default=None),
    content_type: Optional[str] = Query(default=None),
    category: Optional[str] = Query(default=None),
    start_date: Optional[str] = Query(default=None),
    end_date: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None, max_length=200),
    sort_by: str = Query(default="created_at"),
    sort_order: str = Query(default="desc"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> HistoryListResponse:
    if sort_by not in ALLOWED_SORT_BY:
        raise HTTPException(status_code=422, detail="Invalid sort_by")
    if sort_order not in ALLOWED_SORT_ORDER:
        raise HTTPException(status_code=422, detail="Invalid sort_order")

    filters = [Scan.user_id == current_user.id]

    if risk_level:
        normalized = risk_level.strip().lower()
        if normalized not in ALLOWED_RISK_LEVELS:
            raise HTTPException(status_code=422, detail="Invalid risk_level")
        filters.append(func.lower(Scan.risk_level) == normalized)

    if content_type:
        normalized = content_type.strip().lower()
        if normalized not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(status_code=422, detail="Invalid content_type")
        filters.append(func.lower(Scan.content_type) == normalized)

    if category:
        filters.append(func.lower(Scan.category) == category.strip().lower())

    def parse_dt(value: Optional[str], end: bool = False) -> Optional[datetime]:
        if not value:
            return None
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=timezone.utc)
            if end:
                parsed = parsed.replace(hour=23, minute=59, second=59, microsecond=999999)
            return parsed
        except (ValueError, TypeError):
            raise HTTPException(status_code=422, detail="Invalid date format")

    start_dt = parse_dt(start_date, end=False)
    end_dt = parse_dt(end_date, end=True)
    if start_dt and end_dt and start_dt > end_dt:
        raise HTTPException(status_code=422, detail="start_date must be before end_date")
    if start_dt:
        filters.append(Scan.created_at >= start_dt)
    if end_dt:
        filters.append(Scan.created_at <= end_dt)

    if search:
        term = f"%{search.strip().lower()}%"
        filters.append(
            or_(
                func.lower(func.coalesce(Scan.content_type, "")).like(term),
                func.lower(func.coalesce(Scan.risk_level, "")).like(term),
                func.lower(func.coalesce(Scan.category, "")).like(term),
                func.lower(func.coalesce(Scan.summary, "")).like(term),
            )
        )

    total = db.execute(select(func.count()).select_from(Scan).where(and_(*filters))).scalar_one() or 0

    sort_col = Scan.created_at if sort_by == "created_at" else Scan.risk_score
    order_expr = sort_col.asc() if sort_order == "asc" else sort_col.desc()

    stmt = (
        select(Scan)
        .where(and_(*filters))
        .order_by(order_expr, Scan.id.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    rows = db.execute(stmt).scalars().all()

    items = [
        HistoryItem(
            id=scan.id,
            content_type=scan.content_type,
            risk_score=scan.risk_score,
            risk_level=scan.risk_level,
            category=scan.category,
            summary=scan.summary,
            created_at=scan.created_at,
        )
        for scan in rows
    ]
    total_pages = ceil(total / limit) if total else 0

    return HistoryListResponse(
        success=True,
        items=items,
        pagination=HistoryPagination(
            page=page,
            limit=limit,
            total=int(total),
            total_pages=int(total_pages),
        ),
        overview=_scan_overview(db, current_user.id),
    )


@router.get("/detect/history/{scan_id}", response_model=ScanDetailResponse)
async def get_scan_detail(
    scan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> ScanDetailResponse:
    scan = db.execute(
        select(Scan).where(Scan.id == scan_id, Scan.user_id == current_user.id)
    ).scalar_one_or_none()
    if scan is None:
        # Do not reveal whether another user's scan exists.
        raise HTTPException(status_code=404, detail="Scan not found")

    indicators = scan.indicators if isinstance(scan.indicators, list) else []
    sources = {
        str(item.get("source"))
        for item in indicators
        if isinstance(item, dict) and item.get("source")
    }
    has_gemini = "gemini" in sources
    has_url = "url_based" in sources
    analysis_type = "hybrid" if has_gemini and (has_url or indicators) else "rule_based_only"
    if has_url and not has_gemini:
        analysis_type = "rule_and_url"

    data = {
        "id": scan.id,
        "content_type": scan.content_type,
        "risk_score": scan.risk_score,
        "risk_level": scan.risk_level,
        "category": scan.category,
        "summary": scan.summary,
        "indicators": indicators,
        "recommendations": scan.recommendations if isinstance(scan.recommendations, list) else [],
        "analysis_type": analysis_type,
        "created_at": scan.created_at.isoformat() if scan.created_at else None,
        "rule_based_status": "completed",
        "gemini_status": "completed" if has_gemini else "unavailable",
        "url_status": "completed" if has_url else "not_applicable",
    }
    return ScanDetailResponse(success=True, scan=data)


@router.delete("/detect/history", response_model=HistoryDeleteResponse)
async def delete_scan_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> HistoryDeleteResponse:
    result = db.execute(delete(Scan).where(Scan.user_id == current_user.id))
    db.commit()
    deleted = result.rowcount or 0
    return HistoryDeleteResponse(success=True, deleted=int(deleted))
