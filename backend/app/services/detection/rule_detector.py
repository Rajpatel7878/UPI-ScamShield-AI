"""Rule detector for the rule-based fraud detection engine.

Analyzes submitted text against all registered detection rules and returns
matched indicators with explanations, severities, and score contributions.

Rules are kept separate from scoring and response formatting so that Gemini
integration and hybrid scoring can be added in later phases.
"""
from __future__ import annotations

import re
from collections.abc import Set
from typing import Any

from .explanation_service import ExplanationService
from .risk_scorer import RiskScorer
from .rules import DetectionRule, get_all_rules, RULE_NAME_MAP, normalize_text, extract_urls, is_suspicious_shortened_url


class RuleDetector:
    """Detects fraud indicators in submitted text using registered rules."""

    def __init__(self):
        self._rules: dict[int, DetectionRule] = {
            rule.rule_id: rule for rule in get_all_rules()
        }
        self._scorer = RiskScorer()
        self._explainer = ExplanationService()

    def detect(self, content: str, content_type: str = "general") -> dict[str, Any]:
        """Analyze text for fraud indicators using all registered rules.

        Args:
            content: The submitted text message to analyze.
            content_type: Type of content (sms, whatsapp, payment_request, general).

        Returns:
            Dict with detection results:
                - matched_rule_names: List of rule names that matched
                - explanations: Dict mapping rule names to explanations
                - severities: Dict mapping rule names to severity levels
                - categories: Dict mapping rule names to categories
                - score_contributions: Dict mapping rule names to score points
                - total_score: The calculated risk score (capped at 100)
                - risk_level: The risk level band (Low/Medium/High/Critical)
                - category: The primary risk category
                - recommendations: Relevant safety recommendations
                - normalized_text: The normalized version of the content used for analysis
        """
        if not content:
            return self._empty_result(content_type)

        # Normalize the text for analysis (does not modify original)
        normalized = normalize_text(content)

        # Apply each rule and collect matches
        matched_rule_names: list[str] = []
        explanations: dict[str, str] = {}
        severities: dict[str, str] = {}
        categories: dict[str, str] = {}
        score_contributions: dict[str, int] = {}

        for rule in get_all_rules():
            # Check regex pattern match
            pattern_matches = self._match_pattern(rule.pattern, normalized)

            # Check callback if defined
            callback_matches = False
            if rule.callback:
                callback_matches = rule.callback(normalized)

            # Rule matches if either pattern or callback matches
            if pattern_matches or callback_matches:
                # Duplicates are removed by name after the loop.
                matched_rule_names.append(rule.name)
                explanations[rule.name] = self._explainer.get_explanation(rule.name) or rule.explanation
                severities[rule.name] = self._explainer.get_severity(rule.name) or rule.severity
                categories[rule.name] = self._explainer.get_category(rule.name) or rule.category
                score_contributions[rule.name] = self._explainer.get_score_contribution(rule.name) or rule.score_contribution

        # Remove duplicate rule names while preserving order
        seen: set[str] = set()
        unique_matched: list[str] = []
        for name in matched_rule_names:
            if name not in seen:
                seen.add(name)
                unique_matched.append(name)

        # Calculate risk score using the scorer
        score_result = self._scorer.calculate_score(unique_matched)

        # Get recommendations
        recommendations = self._explainer.get_sample_recommendations(unique_matched)

        # Determine primary category
        primary_category = self._scorer._determine_primary_category(unique_matched) if unique_matched else "General Scam"

        return {
            "matched_rule_names": unique_matched,
            "explanations": explanations,
            "severities": severities,
            "categories": categories,
            "score_contributions": score_contributions,
            "total_score": score_result["total_score"],
            "risk_level": score_result["risk_level"],
            "category": primary_category,
            "recommendations": recommendations,
            "normalized_text": normalized,
        }

    def _match_pattern(self, pattern: str, text: str) -> bool:
        """Match a regex pattern against normalized text.

        Args:
            pattern: The regex pattern from the rule.
            text: The normalized text to match against.

        Returns:
            True if the pattern matches, False otherwise.
        """
        try:
            flags = re.IGNORECASE if not pattern.startswith("(?i)") else 0
            # Handle the (?i) inline flag - strip it for our check
            clean_pattern = pattern.replace("(?i)", "", 1) if "(?i)" in pattern else pattern
            return bool(re.search(clean_pattern, text, flags))
        except re.error:
            # If pattern is invalid, don't match
            return False

    def _empty_result(self, content_type: str) -> dict[str, Any]:
        """Return an empty result for empty or whitespace-only content."""
        return {
            "matched_rule_names": [],
            "explanations": {},
            "severities": {},
            "categories": {},
            "score_contributions": {},
            "total_score": 0,
            "risk_level": "Low",
            "category": "General Scam",
            "recommendations": [
                "Provide a message to analyze for fraud indicators."
            ],
            "normalized_text": "",
        }

    def get_rule(self, rule_id: int) -> DetectionRule | None:
        """Get a rule by its unique ID."""
        return self._rules.get(rule_id)

    def get_all_rules(self) -> list[DetectionRule]:
        """Get all registered detection rules."""
        return list(self._rules.values())

    def get_rules_by_category(self, category: str) -> list[DetectionRule]:
        """Get all rules belonging to a specific category."""
        return [rule for rule in self._rules.values() if rule.category == category]