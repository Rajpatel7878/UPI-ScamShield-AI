"""Hybrid AI risk scoring engine for UPI ScamShield AI.

Combines rule-based fraud detection from Phase 10 with Gemini AI contextual
analysis from Phase 11 to generate one consistent, explainable risk assessment.
Weights are initial engineering heuristics (60% rule-based, 40% AI), not scientifically
validated, and are configurable in one central location.
"""
from __future__ import annotations

import logging
from typing import Any
from typing import Dict
from typing import List
from typing import Optional
from typing import Tuple

from app.services.detection.gemini_service import GeminiService, is_gemini_configured
from app.services.detection.risk_scorer import RiskScorer
from app.services.detection.rules import get_all_rules, RULE_NAME_MAP, SCORE_CONTRIBUTION_MAP
from app.schemas.detection import (
    GeminiIndicator,
    GeminiAnalysisResult,
    AIAnalysis,
    DetectionResponse,
)


logger = logging.getLogger(__name__)


# --- Configuration ---

# Initial weighted hybrid scoring approach (per Phase 12 spec)
# These weights are engineering heuristics, not scientifically validated
HYBRID_WEIGHTS = {
    "rule_based": 0.60,  # 60% weight for rule-based score
    "gemini": 0.40,  # 40% weight for AI analysis score
}

# Centralized Gemini risk-level to numeric score mapping (per Phase 12 spec)
# These are starting values for converting Gemini's risk_level into a numeric score
GEMINI_RISK_LEVEL_SCORES: dict[str, int] = {
    "low": 15,
    "medium": 45,
    "high": 70,
    "critical": 90,
}

# Centralized risk thresholds (per Phase 12 spec)
# Final classification based on final combined score, not whichever source reports highest
RISK_THRESHOLDS: dict[str, tuple[int, int]] = {
    "Critical": (80, 100),
    "High": (60, 79),
    "Medium": (30, 59),
    "Low": (0, 29),
}


class HybridScorer:
    """Hybrid risk scoring engine combining rule-based and Gemini AI analysis.

    Responsibilities:
    - Accept rule-based results and Gemini analysis results
    - Evaluate availability and validity of both results
    - Calculate a combined risk score using weighted formula
    - Determine the final risk category
    - Generate a unified explanation
    - Merge duplicate indicators
    - Generate prioritized recommendations
    - Return a validated structured result
    """

    def __init__(self) -> None:
        self._risk_scorer = RiskScorer()
        self._gemini_service = GeminiService()

    def score(
        self,
        rule_score: int,
        rule_risk_level: str,
        rule_category: str,
        rule_indicators: list[dict],
        rule_recommendations: list[str],
        gemini_result: Optional[dict] = None,
    ) -> dict[str, Any]:
        """Calculate the hybrid risk score and unified analysis.

        This method handles all source availability combinations:
        - Both sources available: weighted hybrid score
        - Rule-based only: use rule-based score, mark as rule_based_only
        - Gemini only: use mapped Gemini score, mark as ai_only
        - Neither source available: safe failure response

        Args:
            rule_score: Rule-based risk score (0-100)
            rule_risk_level: Rule-based risk level (Low/Medium/High/Critical)
            rule_category: Rule-based primary category
            rule_indicators: Matched indicators from rule detector
            rule_recommendations: Recommendations from rule detector
            gemini_result: Optional Gemini analysis result from Phase 11

        Returns:
            Dict with hybrid analysis result:
                - hybrid_score: Final combined risk score (0-100, integer)
                - risk_level: Final risk level (Low/Medium/High/Critical)
                - category: Final primary category
                - summary: Human-readable summary
                - indicators: Merged indicators list
                - recommendations: Merged recommendations list
                - analysis_type: "hybrid" | "rule_based_only" | "ai_only" | "analysis_failed"
                - source_status: Dict with status of each source
        """
        # Handle each source availability combination
        source_status: dict[str, str] = {
            "rule_based": "completed",
            "gemini": "unavailable",
        }

        # Case 1: Both sources available
        if gemini_result is not None:
            source_status["gemini"] = gemini_result.get("status", "unavailable")

            if source_status["gemini"] == "completed" and gemini_result.get("result"):
                return self._both_sources_available(
                    rule_score=rule_score,
                    rule_risk_level=rule_risk_level,
                    rule_category=rule_category,
                    rule_indicators=rule_indicators,
                    rule_recommendations=rule_recommendations,
                    gemini_result=gemini_result,
                )
            else:
                # Gemini was attempted but failed/unavailable
                # Fall back to rule-based only
                source_status["gemini"] = "unavailable"

        # Case 2: Rule-based only (Gemini unavailable or not configured)
        if source_status["gemini"] == "unavailable":
            return self._rule_based_only(
                rule_score=rule_score,
                rule_risk_level=rule_risk_level,
                rule_category=rule_category,
                rule_indicators=rule_indicators,
                rule_recommendations=rule_recommendations,
            )

        # Case 3: Neither source available
        return self._neither_source_available()

    def _both_sources_available(
        self,
        rule_score: int,
        rule_risk_level: str,
        rule_category: str,
        rule_indicators: list[dict],
        rule_recommendations: list[str],
        gemini_result: dict,
    ) -> dict[str, Any]:
        """Calculate hybrid score when both sources are available."""
        # Extract Gemini result components
        gemini_result_obj = gemini_result["result"]

        # Get AI score: use validated numeric score if available, otherwise map from risk level
        ai_score = self._get_ai_score(gemini_result_obj)

        # Calculate weighted hybrid score
        # Hybrid Score = (Rule Score Ã 0.60) + (AI Score Ã 0.40)
        raw_hybrid = (rule_score * HYBRID_WEIGHTS["rule_based"]) + (ai_score * HYBRID_WEIGHTS["gemini"])

        # Round to integer between 0 and 100
        hybrid_score = max(0, min(100, round(raw_hybrid)))

        # Determine final risk classification based on combined score
        risk_level = self._classify_risk_level(hybrid_score)

        # Determine final category (prefer rule-based category, fallback to Gemini)
        category = rule_category
        if gemini_result_obj and gemini_result_obj.category:
            # Only override if Gemini has a meaningful category
            category = gemini_result_obj.category

        # Merge indicators from both sources
        merged_indicators = self._merge_indicators(
            rule_indicators=rule_indicators,
            gemini_indicators=gemini_result_obj.indicators if gemini_result_obj else [],
        )

        # Merge recommendations from both sources
        merged_recommendations = self._merge_recommendations(
            rule_recommendations=rule_recommendations,
            gemini_recommendations=gemini_result_obj.recommendations if gemini_result_obj else [],
        )

        # Build summary
        summary = self._build_summary(hybrid_score, risk_level, category, len(merged_indicators))

        return {
            "hybrid_score": hybrid_score,
            "risk_level": risk_level,
            "category": category,
            "summary": summary,
            "indicators": merged_indicators,
            "recommendations": merged_recommendations,
            "analysis_type": "hybrid",
            "source_status": {
                "rule_based": "completed",
                "gemini": "completed",
            },
        }

    def _rule_based_only(
        self,
        rule_score: int,
        rule_risk_level: str,
        rule_category: str,
        rule_indicators: list[dict],
        rule_recommendations: list[str],
    ) -> dict[str, Any]:
        """Handle case where only rule-based analysis is available."""
        # Use rule-based score directly
        risk_level = rule_risk_level
        category = rule_category

        # Classify risk level if not already in proper format
        if risk_level and risk_level.lower() in ["low", "medium", "high", "critical"]:
            risk_level = risk_level.capitalize()

        # Merge indicators (just rule-based ones)
        merged_indicators = rule_indicators

        # Merge recommendations (just rule-based ones)
        merged_recommendations = rule_recommendations

        # Build summary
        summary = self._build_summary(rule_score, risk_level, category, len(merged_indicators))

        return {
            "hybrid_score": rule_score,
            "risk_level": risk_level,
            "category": category,
            "summary": summary,
            "indicators": merged_indicators,
            "recommendations": merged_recommendations,
            "analysis_type": "rule_based_only",
            "source_status": {
                "rule_based": "completed",
                "gemini": "unavailable",
            },
        }

    def _ai_only(self, gemini_score: int, gemini_risk_level: str, gemini_category: str, gemini_indicators: list, gemini_recommendations: list) -> dict[str, Any]:
        """Handle case where only Gemini analysis is available."""
        risk_level = gemini_risk_level.capitalize() if gemini_risk_level else "Low"
        category = gemini_category or "General Scam"

        merged_indicators = gemini_indicators
        merged_recommendations = gemini_recommendations

        summary = self._build_summary(gemini_score, risk_level, category, len(merged_indicators))

        return {
            "hybrid_score": gemini_score,
            "risk_level": risk_level,
            "category": category,
            "summary": summary,
            "indicators": merged_indicators,
            "recommendations": merged_recommendations,
            "analysis_type": "ai_only",
            "source_status": {
                "rule_based": "unavailable",
                "gemini": "completed",
            },
        }

    def _neither_source_available(self) -> dict[str, Any]:
        """Handle case where neither source has valid results."""
        # Do not fabricate a score
        # Return a safe analysis failure response
        return {
            "hybrid_score": 0,
            "risk_level": "Low",
            "category": "Analysis Unavailable",
            "summary": "Analysis could not be completed. No detection sources available.",
            "indicators": [],
            "recommendations": [
                "Please try again later or contact your bank directly."
            ],
            "analysis_type": "analysis_failed",
            "source_status": {
                "rule_based": "unavailable",
                "gemini": "unavailable",
            },
        }

    def _get_ai_score(self, gemini_result_obj) -> int:
        """Extract or compute a numeric AI score from Gemini result."""
        # If Gemini returns a validated numeric score, use it (if scale is consistent)
        # Per Phase 12 spec: only reuse if meaning and scale are explicitly defined
        # For now, map from risk level since Gemini returns risk_level not numeric score
        if gemini_result_obj and hasattr(gemini_result_obj, "risk_level"):
            risk_level = gemini_result_obj.risk_level
            if risk_level in GEMINI_RISK_LEVEL_SCORES:
                return GEMINI_RISK_LEVEL_SCORES[risk_level]

        # Fallback: map risk level from the GeminiAnalysisResult schema
        if gemini_result_obj and gemini_result_obj.risk_level:
            risk_level = gemini_result_obj.risk_level.lower()
            if risk_level in GEMINI_RISK_LEVEL_SCORES:
                return GEMINI_RISK_LEVEL_SCORES[risk_level]

        # Default fallback score
        return 45  # Medium default

    def _classify_risk_level(self, score: int) -> str:
        """Classify a numeric score into a risk level band."""
        for level in ("Critical", "High", "Medium", "Low"):
            min_score, max_score = RISK_THRESHOLDS[level]
            if min_score <= score <= max_score:
                return level
        return "Low"

    def _merge_indicators(
        self,
        rule_indicators: list[dict],
        gemini_indicators: list[GeminiIndicator],
    ) -> list[dict]:
        """Merge indicators from rule-based and Gemini systems.

        Requirements (per Phase 12 spec):
        - Avoid duplicate indicators
        - Preserve rule IDs when available
        - Preserve source information (rule_based or gemini)
        - Merge equivalent findings
        - Preserve meaningful severity
        - Do not invent evidence
        - Do not let unsupported Gemini claims override actual rule-based findings
        """
        merged: list[dict] = []
        seen: set[str] = set()

        # First, add all rule-based indicators
        for rule_ind in rule_indicators:
            # Create a key for deduplication
            key = rule_ind.get("name", "")
            if key not in seen:
                seen.add(key)
                merged.append({
                    "rule_id": rule_ind.get("rule_id"),
                    "name": rule_ind.get("name"),
                    "category": rule_ind.get("category", ""),
                    "severity": rule_ind.get("severity"),
                    "description": rule_ind.get("description"),
                    "source": "rule_based",
                })

        # Then, add Gemini indicators, avoiding duplicates
        for gemini_ind in gemini_indicators:
            key = gemini_ind.name
            if key not in seen:
                seen.add(key)
                merged.append({
                    "rule_id": None,
                    "name": gemini_ind.name,
                    "category": getattr(gemini_ind, "category", ""),
                    "severity": gemini_ind.severity,
                    "description": gemini_ind.explanation,
                    "source": "gemini",
                })

        return merged

    def _merge_recommendations(
        self,
        rule_recommendations: list[str],
        gemini_recommendations: list[str],
    ) -> list[str]:
        """Merge recommendations from both sources.

        Requirements (per Phase 12 spec):
        - Remove duplicates
        - Prioritize immediate security actions
        - Keep recommendations short and actionable
        - Avoid contradictory advice
        - Include a general safety recommendation when relevant
        - Never instruct users to share OTPs, UPI PINs, passwords, or bank credentials
        """
        merged: list[str] = []
        seen: set[str] = set()

        # Add rule-based recommendations first (prioritize immediate security actions)
        for rec in rule_recommendations:
            rec_lower = rec.lower().strip()
            if rec_lower not in seen and not any(
                forbidden in rec_lower
                for forbidden in ["share your otp", "share your pin", "share your password", "enter your pin"]
            ):
                seen.add(rec_lower)
                merged.append(rec)

        # Add Gemini recommendations, avoiding duplicates
        for rec in gemini_recommendations:
            rec_lower = rec.lower().strip()
            if rec_lower not in seen and not any(
                forbidden in rec_lower
                for forbidden in ["share your otp", "share your pin", "share your password", "enter your pin"]
            ):
                seen.add(rec_lower)
                merged.append(rec)

        # Ensure a general safety recommendation is included if no indicators matched
        if not merged:
            merged = [
                "Do not share your OTP or UPI PIN with anyone.",
                "Do not approve an unknown payment request.",
                "Verify the request through your bank's official channel.",
            ]

        return merged[:10]  # Cap at 10 recommendations

    def _build_summary(
        self,
        score: int,
        risk_level: str,
        category: str,
        indicator_count: int,
    ) -> str:
        """Build a human-readable summary of the analysis."""
        if indicator_count == 0:
            return f"The message does not contain indicators commonly associated with UPI scams. (Risk score: {score}, {risk_level.lower()})"

        if indicator_count == 1:
            return f"The message contains 1 indicator commonly associated with {category.lower()}. (Risk score: {score}, {risk_level.lower()})"

        return f"The message contains {indicator_count} indicators commonly associated with multiple fraud categories. (Risk score: {score}, {risk_level.lower()})"