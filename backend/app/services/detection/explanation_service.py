"""Explanation service for the rule-based fraud detection engine.

Provides clear explanations and relevant recommendations for every matched
indicator. Ensures that every matched indicator has a clear explanation and
that recommendations are relevant to the matched indicators.
"""
from __future__ import annotations

from typing import Any

from .rules import DetectionRule, get_all_rules, RULE_NAME_MAP, SCORE_CONTRIBUTION_MAP


class ExplanationService:
    """Provides explanations and recommendations for detection rules."""

    # Pre-computed explanations and actions keyed by rule name
    _rule_explanations: dict[str, str] = {
        rule.name: rule.explanation for rule in get_all_rules()
    }

    _rule_actions: dict[str, str] = {
        rule.name: rule.action for rule in get_all_rules()
    }

    _rule_severities: dict[str, str] = {
        rule.name: rule.severity for rule in get_all_rules()
    }

    _rule_categories: dict[str, str] = {
        rule.name: rule.category for rule in get_all_rules()
    }

    _rule_score_contributions: dict[str, int] = {
        rule.name: rule.score_contribution for rule in get_all_rules()
    }

    @classmethod
    def get_explanation(cls, rule_name: str) -> str | None:
        """Get the user-facing explanation for a matched rule.

        Args:
            rule_name: The name of the matched detection rule.

        Returns:
            The explanation string, or None if the rule is not recognized.
        """
        return cls._rule_explanations.get(rule_name)

    @classmethod
    def get_action(cls, rule_name: str) -> str | None:
        """Get the recommended safety action for a matched rule.

        Args:
            rule_name: The name of the matched detection rule.

        Returns:
            The action string, or None if the rule is not recognized.
        """
        return cls._rule_actions.get(rule_name)

    @classmethod
    def get_severity(cls, rule_name: str) -> str | None:
        """Get the severity level for a matched rule.

        Args:
            rule_name: The name of the matched detection rule.

        Returns:
            The severity string (low/medium/high/critical), or None if not recognized.
        """
        return cls._rule_severities.get(rule_name)

    @classmethod
    def get_category(cls, rule_name: str) -> str | None:
        """Get the category for a matched rule.

        Args:
            rule_name: The name of the matched detection rule.

        Returns:
            The category string, or None if not recognized.
        """
        return cls._rule_categories.get(rule_name)

    @classmethod
    def get_score_contribution(cls, rule_name: str) -> int | None:
        """Get the score contribution for a matched rule.

        Args:
            rule_name: The name of the matched detection rule.

        Returns:
            The score points contribution, or None if not recognized.
        """
        return cls._rule_score_contributions.get(rule_name)

    @classmethod
    def get_all_rule_names(cls) -> list[str]:
        """Get all registered rule names."""
        return list(cls._rule_explanations.keys())

    @classmethod
    def get_rules_for_categories(cls, category: str) -> dict[str, str]:
        """Get all rules belonging to a specific category with their details.

        Args:
            category: The category to filter by.

        Returns:
            Dict mapping rule names to their explanation strings.
        """
        result: dict[str, str] = {}
        for rule in get_all_rules():
            if rule.category == category:
                result[rule.name] = rule.explanation
        return result

    @classmethod
    def get_sample_recommendations(cls, matched_rule_names: list[str]) -> list[str]:
        """Get sample recommendations based on matched rules.

        Args:
            matched_rule_names: List of rule names that matched the message.

        Returns:
            List of recommended safety actions relevant to the matched indicators.
        """
        recommendations: list[str] = []

        for rule_name in matched_rule_names:
            action = cls.get_action(rule_name)
            if action and action not in recommendations:
                recommendations.append(action)

        # If no specific recommendations, provide general guidance
        if not recommendations:
            recommendations = [
                "Be cautious with unsolicited messages asking for financial information.",
                "Verify any request independently through official channels.",
                "Never share OTPs, UPI PINs, or bank credentials with anyone.",
            ]

        return recommendations
