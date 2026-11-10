"""Schemas for scan history and analytics APIs."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


class HistoryPagination(BaseModel):
    page: int
    limit: int
    total: int
    total_pages: int


class HistoryItem(BaseModel):
    id: int | str
    content_type: Optional[str] = None
    risk_score: Optional[int] = None
    risk_level: Optional[str] = None
    category: Optional[str] = None
    summary: Optional[str] = None
    created_at: Optional[datetime] = None


class HistoryListResponse(BaseModel):
    success: bool = True
    items: list[HistoryItem] = Field(default_factory=list)
    pagination: HistoryPagination
    overview: dict[str, Any] = Field(default_factory=dict)


class ScanDetailResponse(BaseModel):
    success: bool = True
    scan: dict[str, Any]


class HistoryDeleteResponse(BaseModel):
    success: bool = True
    deleted: int


class DashboardStatsResponse(BaseModel):
    success: bool = True
    total_scans: int = 0
    suspicious_scans: int = 0
    critical_alerts: int = 0
    average_risk_score: float = 0.0
    risk_distribution: dict[str, int] = Field(default_factory=dict)
    content_type_distribution: dict[str, int] = Field(default_factory=dict)
    detection_category_distribution: dict[str, int] = Field(default_factory=dict)
    daily_scan_activity: list[dict[str, Any]] = Field(default_factory=list)
    recent_scans: list[dict[str, Any]] = Field(default_factory=list)
    risk_insights: list[str] = Field(default_factory=list)
    most_recent_scan_date: Optional[datetime] = None


class AnalyticsOverviewResponse(DashboardStatsResponse):
    period_days: Optional[int] = None
    weekly_trends: list[dict[str, Any]] = Field(default_factory=list)
    monthly_trends: list[dict[str, Any]] = Field(default_factory=list)
    most_frequent_indicators: list[dict[str, Any]] = Field(default_factory=list)
    security_insights: list[str] = Field(default_factory=list)
