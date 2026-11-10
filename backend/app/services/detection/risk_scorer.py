"""Risk scorer for the rule-based fraud detection engine.

Implements a transparent weighted scoring approach where each matched rule
contributes a predefined number of points. The total score is capped at 100,
and risk bands are defined as:
- 0â29: Low
- 30â59: Medium
- 60â79: High
- 80â100: Critical

Keep thresholds centralized so they can be calibrated later.
"""
from __future__ import annotations

from collections.abc import Iterable
from typing import Any

from .rules import DetectionRule, get_all_rules, RULE_NAME_MAP, SCORE_CONTRIBUTION_MAP, CATEGORY_GROUPS


# Risk band thresholds - keep centralized for calibration
RISK_BANDS: dict[str, tuple[int, int]] = {
    "Critical": (80, 100),
    "High": (60, 79),
    "Medium": (30, 59),
    "Low": (0, 29),
}


class RiskScorer:
    """Calculates risk scores based on matched detection rules."""

    def __init__(self):
        self._rule_cache: dict[str, DetectionRule] = {
            rule.name: rule for rule in get_all_rules()
        }

    def calculate_score(
        self,
        matched_rule_names: list[str],
        total_possible: int | None = None,
    ) -> dict[str, Any]:
        """Calculate the total risk score from matched rule names.

        Args:
            matched_rule_names: List of rule names that matched the message.
            total_possible: Optional maximum possible score. If not provided,
                uses the rule-defined contributions capped at 100.

        Returns:
            Dict with score details:
                - total_score: The calculated risk score (capped at 100)
                - matched_rules: List of matched rule names
                - risk_level: The risk level band (Low/Medium/High/Critical)
                - category: The primary risk category
        """
        # Sum the score contributions for matched rules
        total = 0
        matched_rules: list[str] = []
        seen: set[str] = set()

        for rule_name in matched_rule_names:
            # Prevent duplicate matches - each rule only counts once
            if rule_name in seen:
                continue
            seen.add(rule_name)

            # Get the rule's score contribution
            contribution = SCORE_CONTRIBUTION_MAP.get(rule_name, 0)
            total += contribution
            matched_rules.append(rule_name)

        # Cap the score at 100 to prevent excessive inflation
        total = min(total, 100)

        # Determine risk level based on total score
        risk_level = self._score_to_risk_level(total)

        # Determine primary category from matched rules
        category = self._determine_primary_category(matched_rules)

        return {
            "total_score": total,
            "matched_rules": matched_rules,
            "risk_level": risk_level,
            "category": category,
        }

    def _score_to_risk_level(self, score: int) -> str:
        """Convert a numeric score to a risk level band."""
        for level in ("Critical", "High", "Medium", "Low"):
            min_score, max_score = RISK_BANDS[level]
            if min_score <= score <= max_score:
                return level
        return "Low"

    def _determine_primary_category(self, matched_rule_names: list[str]) -> str:
        """Determine the primary risk category from matched rule names.

        Uses category aggregation rules defined in rules.py.
        If no category matches, returns "General Scam".
        """
        if not matched_rule_names:
            return "General Scam"

        # Count matches per aggregated category
        category_counts: dict[str, int] = {}

        for category, rule_names in CATEGORY_GROUPS.items():
            count = sum(1 for name in matched_rule_names if name in rule_names)
            if count > 0:
                category_counts[category] = count

        if not category_counts:
            # Fall back to the first matched rule's category
            first_rule = self._rule_cache.get(matched_rule_names[0])
            if first_rule:
                return first_rule.category
            return "General Scam"

        # Return the category with the most matches
        primary = max(category_counts, key=category_counts.get)
        return primary

    def get_risk_band_info(self, level: str) -> dict[str, int]:
        """Get the min/max score range for a risk level band."""
        return dict(RISK_BANDS.get(level, RISK_BANDS["Low"]))

    def get_all_risk_bands(self) -> dict[str, tuple[int, int]]:
        """Get all risk band thresholds."""
        return dict(RISK_BANDS)