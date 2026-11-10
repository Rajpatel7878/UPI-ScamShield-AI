"""Pydantic schemas for the rule-based fraud detection engine.

Defines request and response models for the /api/v1/detect/analyze endpoint.
"""
from __future__ import annotations

from pydantic import BaseModel, Field, field_validator, ValidationInfo
from typing import List, Optional, Literal


class GeminiIndicator(BaseModel):
    """A single indicator from Gemini analysis."""
    name: str
    severity: Literal["low", "medium", "high", "critical"]
    explanation: str


class GeminiAnalysisResult(BaseModel):
    """Structured result from Gemini AI analysis."""
    is_suspicious: bool
    risk_level: Literal["low", "medium", "high", "critical"]
    category: str
    summary: str
    indicators: list[GeminiIndicator]
    recommendations: list[str]
    confidence: float = Field(..., ge=0.0, le=1.0, description="Model's self-reported confidence (0-1)")


class AIAnalysis(BaseModel):
    """AI analysis section in the detection response."""
    status: str = Field(description="Analysis status: completed, unavailable, or failed")
    provider: str = Field(description="AI provider name, e.g., gemini")
    model: Optional[str] = Field(default=None, description="Model name used")
    result: Optional[GeminiAnalysisResult] = Field(
        default=None,
        description="Structured Gemini analysis result, or null if unavailable/failed",
    )


class DetectionRequest(BaseModel):
    """Request schema for the detection analysis endpoint.

    - **content**: Submitted text message to analyze for fraud indicators.
    - **content_type**: Type of content (sms, whatsapp, payment_request, general).
    """

    content: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="Submitted text message to analyze for fraud indicators.",
    )

    content_type: str = Field(
        ...,
        description="Type of content (sms, whatsapp, payment_request, general, url).",
    )

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        """Reject blank content and NUL bytes; preserve the original message."""
        if not v or not v.strip():
            raise ValueError("Content must not be empty")
        if "\x00" in v:
            raise ValueError("Content contains invalid control characters")
        return v

    @field_validator("content_type")
    def validate_content_type(cls, v: str, info: ValidationInfo) -> str:
        """Validate that content_type is one of the supported types."""
        supported_types = ["sms", "whatsapp", "payment_request", "general", "url"]
        if v.lower() not in supported_types:
            raise ValueError(
                f"Unsupported content type. Must be one of: {', '.join(supported_types)}"
            )
        return v.lower()


class DetectionResponse(BaseModel):
    """Response schema for the detection analysis endpoint.

    Returns structured analysis results including risk score, risk level,
    category, matched indicators, and recommendations.
    """
    success: bool = Field(
        ...,
        description="Whether the analysis was successful.",
    )
    scan_id: str = Field(
        ...,
        description="Database scan ID for the analysis record.",
    )
    analysis_type: str = Field(
        ...,
        description="Type of analysis performed (hybrid, rule_and_url, rule_based_only, ai_only, analysis_failed).",
    )
    risk_score: int = Field(
        ...,
        description="Final calculated risk score (0-100).",
    )
    risk_level: str = Field(
        ...,
        description="Final risk level band (Low/Medium/High/Critical).",
    )
    category: str = Field(
        ...,
        description="Final primary risk category.",
    )
    summary: str = Field(
        ...,
        description="Human-readable summary of the analysis.",
    )
    indicators: List[dict] = Field(
        default_factory=list,
        description="List of matched detection indicators (merged from rule-based and Gemini).",
    )
    recommendations: List[str] = Field(
        default_factory=list,
        description="Merged safety recommendations from all available sources.",
    )
    created_at: str = Field(
        ...,
        description="ISO-8601 timestamp of when the scan was created.",
    )
    ai_analysis: AIAnalysis = Field(
        description="Optional AI analysis section with status/provider/model/result.",
    )


class DetectionErrorResponse(BaseModel):
    """Error response schema for detection endpoint validation failures."""
    success: bool = Field(False, description="Always false for errors")
    detail: str = Field(..., description="Description of the validation error.")
    path: str = Field(..., description="API path where the error occurred.")


# Supported content types for the detection endpoint
SUPPORTED_CONTENT_TYPES = ["sms", "whatsapp", "payment_request", "general", "url"]
