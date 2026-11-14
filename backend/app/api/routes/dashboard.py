"""Dashboard and analytics API routes."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db_session
from app.core.time_utils import utc_iso
from app.models.scan import Scan
from app.models.user import User
from app.schemas.history import AnalyticsOverviewResponse, DashboardStatsResponse

router = APIRouter(tags=["dashboard", "analytics"])


def _risk_key(level: Optional[str]) -> str:
    if not level:
        return "Unknown"
    l = level.strip().lower()
    mapping = {"low": "Low", "medium": "Medium", "high": "High", "critical": "Critical"}
    return mapping.get(l, level.strip().title() or "Unknown")


def _is_suspicious(level: Optional[str]) -> bool:
    return (level or "").strip().lower() in {"medium", "high", "critical"}


def _period_start(days: Optional[int]) -> Optional[datetime]:
    if days is None:
        return None
    return datetime.now(timezone.utc) - timedelta(days=days)


def _scan_day_expression(session: Any) -> Any:
    """Return a SQL expression to extract the date from Scan.created_at.

    For PostgreSQL, wraps created_at with timezone('UTC', ...) then date().
    For SQLite, uses date() directly since SQLite stores datetime without timezone.
    """
    from sqlalchemy.dialects import postgresql, sqlite

    created = None  # will be set via SQL expression
    # We construct a column expression that references Scan.created_at
    # The session isn't used directly to get the model, but we need the column
    # This function is tested by compiling the expression against a dialect
    from app.models.scan import Scan
    col = Scan.created_at

    dialect = session.get_bind().dialect
    if isinstance(dialect, postgresql.dialect):
        # PostgreSQL: wrap with timezone then extract date
        return func.date(func.timezone("UTC", col))
    elif isinstance(dialect, sqlite.dialect):
        # SQLite: date() works directly on the column
        return func.date(col)
    else:
        # Fallback: try timezone-aware then date
        return func.date(func.timezone("UTC", col))


def _compute_stats(db: Session, user_id: int, days: Optional[int] = None) -> dict[str, Any]:
    start = _period_start(days)
    base_filters = [Scan.user_id == user_id]
    if start is not None:
        base_filters.append(Scan.created_at >= start)

    scans = db.execute(
        select(Scan).where(*base_filters).order_by(Scan.created_at.desc())
    ).scalars().all()
    total = len(scans)
    risk_distribution = {"Low": 0, "Medium": 0, "High": 0, "Critical": 0}
    content_type_distribution: dict[str, int] = {}
    category_distribution: dict[str, int] = {}
    daily_counts: dict[str, int] = {}
    indicator_counts: dict[str, int] = {}
    risk_sum = 0
    risk_count = 0
    suspicious = 0
    critical = 0
    most_recent = None

    for s in scans:
        rk = _risk_key(s.risk_level)
        if rk in risk_distribution:
            risk_distribution[rk] += 1
        if _is_suspicious(s.risk_level):
            suspicious += 1
        if (s.risk_level or "").strip().lower() == "critical":
            critical += 1
        if s.risk_score is not None:
            try:
                risk_sum += int(s.risk_score)
                risk_count += 1
            except Exception:
                pass
        ct = (s.content_type or "unknown").strip().lower() or "unknown"
        content_type_distribution[ct] = content_type_distribution.get(ct, 0) + 1
        cat = (s.category or "Unknown").strip() or "Unknown"
        category_distribution[cat] = category_distribution.get(cat, 0) + 1
        if s.created_at:
            created = s.created_at
            if getattr(created, "tzinfo", None) is None:
                created = created.replace(tzinfo=timezone.utc)
            day = created.astimezone(timezone.utc).date().isoformat()
            daily_counts[day] = daily_counts.get(day, 0) + 1
            if most_recent is None or created > most_recent:
                most_recent = created
        if isinstance(s.indicators, list):
            for ind in s.indicators:
                if isinstance(ind, dict):
                    name = ind.get("name") or ind.get("rule_id") or ind.get("indicator")
                    if name:
                        key = str(name)
                        indicator_counts[key] = indicator_counts.get(key, 0) + 1

    daily_scan_activity = [{"date": d, "count": c} for d, c in sorted(daily_counts.items())]
    weekly: dict[str, int] = {}
    monthly: dict[str, int] = {}
    for d, c in daily_counts.items():
        try:
            dt = datetime.fromisoformat(d).date()
            iso = dt.isocalendar()
            wk = f"{iso.year}-W{iso.week:02d}"
            mo = dt.strftime("%Y-%m")
            weekly[wk] = weekly.get(wk, 0) + c
            monthly[mo] = monthly.get(mo, 0) + c
        except Exception:
            continue
    weekly_trends = [{"period": k, "count": v} for k, v in sorted(weekly.items())]
    monthly_trends = [{"period": k, "count": v} for k, v in sorted(monthly.items())]
    most_frequent_indicators = [
        {"name": k, "count": v}
        for k, v in sorted(indicator_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    ]

    recent_scans = [
        {
            "id": s.id,
            "content_type": s.content_type,
            "risk_score": s.risk_score,
            "risk_level": s.risk_level,
            "category": s.category,
            "summary": s.summary,
            "created_at": utc_iso(s.created_at),
        }
        for s in scans[:5]
    ]

    avg_risk = round(risk_sum / risk_count, 2) if risk_count else 0.0

    insights: list[str] = []
    if total == 0:
        insights.append("No scans recorded yet. Run your first analysis to see security insights.")
    else:
        if content_type_distribution:
            top_ct = max(content_type_distribution.items(), key=lambda x: x[1])[0]
            insights.append(f"Most of your scans involved {top_ct.replace('_', ' ')} content.")
        if category_distribution:
            top_cat = max(category_distribution.items(), key=lambda x: x[1])[0]
            insights.append(f"{top_cat} was the most frequently detected category.")
        if suspicious > 0:
            insights.append(f"{suspicious} of {total} scans were flagged as suspicious or higher risk.")
        if critical > 0:
            insights.append(f"{critical} critical-risk scan(s) were detected in this period.")
        if not insights:
            insights.append("Scan activity is being tracked. Run more analyses to generate detailed insights.")

    return {
        "total_scans": total,
        "suspicious_scans": suspicious,
        "critical_alerts": critical,
        "average_risk_score": avg_risk,
        "risk_distribution": {k: risk_distribution.get(k, 0) for k in ("Low", "Medium", "High", "Critical")},
        "content_type_distribution": content_type_distribution,
        "detection_category_distribution": category_distribution,
        "daily_scan_activity": daily_scan_activity,
        "weekly_trends": weekly_trends,
        "monthly_trends": monthly_trends,
        "most_frequent_indicators": most_frequent_indicators,
        "recent_scans": recent_scans,
        "most_recent_scan_date": most_recent,
        "security_insights": insights,
        "risk_insights": insights,
        "recent_activity": daily_scan_activity,
    }


@router.get("/dashboard/stats", response_model=DashboardStatsResponse)
async def dashboard_stats(
    days: Optional[int] = Query(default=None, ge=1, le=3660),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> DashboardStatsResponse:
    data = _compute_stats(db, current_user.id, days)
    return DashboardStatsResponse(
        success=True,
        total_scans=data["total_scans"],
        suspicious_scans=data["suspicious_scans"],
        critical_alerts=data["critical_alerts"],
        average_risk_score=data["average_risk_score"],
        risk_distribution=data["risk_distribution"],
        content_type_distribution=data["content_type_distribution"],
        detection_category_distribution=data["detection_category_distribution"],
        daily_scan_activity=data["daily_scan_activity"],
        recent_scans=data["recent_scans"],
        risk_insights=data["risk_insights"],
        most_recent_scan_date=data["most_recent_scan_date"],
    )


@router.get("/analytics/overview", response_model=AnalyticsOverviewResponse)
async def analytics_overview(
    days: Optional[int] = Query(default=None, ge=1, le=3660),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> AnalyticsOverviewResponse:
    data = _compute_stats(db, current_user.id, days)
    return AnalyticsOverviewResponse(
        success=True,
        total_scans=data["total_scans"],
        suspicious_scans=data["suspicious_scans"],
        critical_alerts=data["critical_alerts"],
        average_risk_score=data["average_risk_score"],
        risk_distribution=data["risk_distribution"],
        content_type_distribution=data["content_type_distribution"],
        detection_category_distribution=data["detection_category_distribution"],
        daily_scan_activity=data["daily_scan_activity"],
        recent_scans=data["recent_scans"],
        risk_insights=data["risk_insights"],
        most_recent_scan_date=data["most_recent_scan_date"],
        period_days=days,
        weekly_trends=data["weekly_trends"],
        monthly_trends=data["monthly_trends"],
        most_frequent_indicators=data["most_frequent_indicators"],
        security_insights=data["security_insights"],
    )
