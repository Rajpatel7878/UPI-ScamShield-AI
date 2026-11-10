"""URL rules for the URL and phishing detection engine.

Centralized, maintainable rule definitions for detecting suspicious URL indicators.
Each rule contains a unique rule ID, name, category, description, severity,
detection pattern, explanation, recommended safety action, and score contribution.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable, Optional
import re

from .url_parser import (
    EXCESSIVE_SUBDOMAIN_PATTERN,
    CREDENTIAL_PATTERN,
    IP_HOSTNAME_PATTERN,
    SHORTENER_PATTERN,
    LEGITIMATE_TLDS,
    get_domain,
    get_hostname,
    has_embedded_credentials,
    has_excessive_subdomains,
    has_punycode,
    has_suspicious_query,
    has_unusual_port,
    is_ip_based_hostname,
    is_shortened_url,
    normalize_url,
)


RULE_ID_COUNTER = 2000


def _next_rule_id() -> int:
    """Generate the next unique rule ID."""
    global RULE_ID_COUNTER
    RULE_ID_COUNTER += 1
    return RULE_ID_COUNTER


@dataclass
class URLDetectionRule:
    """A single URL detection rule for the phishing engine.

    Rules are data classes so they can be easily serialized, filtered,
extended, or loaded from configuration files.
    """
    rule_id: int
    name: str
    category: str
    description: str
    severity: str  # low, medium, high, critical
    pattern: str  # regex pattern or rule type
    explanation: str  # user-facing explanation
    action: str  # recommended safety action
    score_contribution: int  # points added if rule matches

    # Rule type: 'pattern', 'ip_based', 'shortener', 'brand', 'punycode', etc.
    rule_type: str = "pattern"

    # Optional: case-insensitive flag
    case_insensitive: bool = True


# =============================================================================
# URL Detection Rule Registry
# =============================================================================

# All 13 detection categories from the Phase 13 specification:
# 1. IP address used instead of a normal domain
# 2. Excessive or unusual subdomains
# 3. Lookalike brand names and common misspellings
# 4. Suspicious use of brand names in unrelated domains
# 5. URL shorteners
# 6. Unusual top-level domains
# 7. Excessive URL length
# 8. Misleading URL paths
# 9. Suspicious query parameters
# 10. Embedded username/password credentials
# 11. Unusual ports
# 12. Homograph and punycode indicators
# 13. HTTPS-related misconceptions

RULES: list[URLDetectionRule] = [
    # --- Rule 1: IP address used instead of a normal domain ---
    URLDetectionRule(
        rule_id=_next_rule_id(),
        name="IP-based Hostname",
        category="Suspicious Link",
        description="URL hostname is an IP address rather than a domain name",
        severity="high",
        pattern="ip_based_hostname",
        explanation="The URL uses an IP address as the hostname. This is suspicious in context and may indicate a phishing attempt.",
        action="Do not enter credentials. Verify the website through your bank's official app or website.",
        score_contribution=20,
    ),

    # --- Rule 2: Excessive or unusual subdomains ---
    URLDetectionRule(
        rule_id=_next_rule_id(),
        name="Excessive Subdomains",
        category="Suspicious Link",
        description="URL hostname has 3+ subdomain levels",
        severity="medium",
        pattern="excessive_subdomains",
        explanation="The URL has an unusual number of subdomains (3+ levels). This can indicate a spoofed or malicious domain.",
        action="Verify the website domain. Be cautious of URLs with many subdomain levels.",
        score_contribution=10,
    ),

    # --- Rule 3: Lookalike brand names and common misspellings ---
    URLDetectionRule(
        rule_id=_next_rule_id(),
        name="Brand Impersonation (Lookalike)",
        category="Brand Impersonation",
        description="URL hostname contains a brand name with common misspelling or slight variation",
        severity="high",
        pattern="brand_impersonation",
        explanation="The URL hostname impersonates a well-known brand with a slight spelling variation. This is a common phishing technique.",
        action="Do not enter credentials. Access the service directly through your official app or website.",
        score_contribution=30,
    ),

    # --- Rule 4: Suspicious use of brand names in unrelated domains ---
    URLDetectionRule(
        rule_id=_next_rule_id(),
        name="Brand Name in Unrelated Domain",
        category="Brand Impersonation",
        description="URL hostname contains a brand name not related to the actual service",
        severity="medium",
        pattern="unrelated_brand",
        explanation="The URL contains a brand name (e.g., Google, PayPal) in a domain that doesn't belong to that brand. This may be impersonation.",
        action="Verify the website legitimacy. Do not enter credentials unless you've confirmed the site's authenticity.",
        score_contribution=20,
    ),

    # --- Rule 5: URL shorteners ---
    URLDetectionRule(
        rule_id=_next_rule_id(),
        name="URL Shortener",
        category="Suspicious Link",
        description="URL uses a known URL shortener service",
        severity="medium",
        pattern="shortener",
        explanation="The URL uses a shortening service (e.g., bit.ly, tinyurl.com). URL shorteners hide the true destination and are a common phishing tactic.",
        action="Do not click the link. Visit the service directly through your official app or website.",
        score_contribution=10,
    ),

    # --- Rule 6: Unusual TLD ---
    URLDetectionRule(
        rule_id=_next_rule_id(),
        name="Unusual TLD",
        category="Suspicious Link",
        description="URL hostname has a non-standard or unusual top-level domain",
        severity="low",
        pattern="unusual_tld",
        explanation="The URL uses a top-level domain that is not among the most common (e.g., .xyz, .top, .club). While not inherently malicious, it can be suspicious in context.",
        action="Verify the website legitimacy. Unusual TLDs can be used by both legitimate and illegitimate sites.",
        score_contribution=5,
    ),

    # --- Rule 7: Excessive URL length ---
    URLDetectionRule(
        rule_id=_next_rule_id(),
        name="Excessively Long URL",
        category="Suspicious Link",
        description="URL string exceeds 200 characters",
        severity="low",
        pattern="long_url",
        explanation="The URL is excessively long (over 200 characters). Very long URLs can be used to hide malicious content or confuse users.",
        action="Be cautious. Hover over the link to inspect the full destination before clicking.",
        score_contribution=10,
    ),

    # --- Rule 8: Misleading URL path ---
    URLDetectionRule(
        rule_id=_next_rule_id(),
        name="Misleading URL Path",
        category="Suspicious Link",
        description="URL path contains terms that mislead about the actual destination",
        severity="medium",
        pattern="misleading_path",
        explanation="The URL path contains terms designed to mislead about the destination (e.g., 'secure', 'bank', 'login' leading to a non-financial site).",
        action="Verify the actual destination. Do not assume terms like 'secure' or 'bank' guarantee legitimacy.",
        score_contribution=15,
    ),

    # --- Rule 9: Suspicious query parameters ---
    URLDetectionRule(
        rule_id=_next_rule_id(),
        name="Suspicious Query Parameters",
        category="Suspicious Link",
        description="URL query parameters include suspicious terms (login, verify, session, etc.)",
        severity="medium",
        pattern="suspicious_query",
        explanation="The URL query string contains terms commonly used in phishing (e.g., login, verify, session, signin). These may be attempting to steal credentials.",
        action="Do not enter credentials. Verify the request independently through your bank's official channel.",
        score_contribution=15,
    ),

    # --- Rule 10: Embedded credentials ---
    URLDetectionRule(
        rule_id=_next_rule_id(),
        name="Embedded Credentials",
        category="Credential Theft",
        description="URL contains embedded username, password, token, or secret parameters",
        severity="critical",
        pattern="embedded_credentials",
        explanation="The URL contains embedded credentials (username, password, token, or secret) in query parameters. This is a direct attempt to obtain sensitive authentication information.",
        action="Never enter credentials from a URL. Legitimate services never ask you to paste credentials from a link.",
        score_contribution=30,
    ),

    # --- Rule 11: Unusual port ---
    URLDetectionRule(
        rule_id=_next_rule_id(),
        name="Unusual Port",
        category="Suspicious Link",
        description="URL uses a port outside the common 80, 443, 8080",
        severity="medium",
        pattern="unusual_port",
        explanation="The URL uses a non-standard port. While some legitimate services use unusual ports, this can also indicate a custom or potentially malicious server.",
        action="Verify the service legitimacy. Unusual ports can be used by both legitimate and illegitimate services.",
        score_contribution=15,
    ),

    # --- Rule 12: Punycode / Homograph ---
    URLDetectionRule(
        rule_id=_next_rule_id(),
        name="Punycode / Homograph",
        category="Suspicious Link",
        description="URL hostname contains punycode (xn--) indicator",
        severity="medium",
        pattern="punycode",
        explanation="The URL hostname contains punycode encoding (xn--). This can indicate internationalized domain name spoofing or homograph attacks.",
        action="Be cautious of internationalized domain names. Verify the site through your official app or website.",
        score_contribution=20,
    ),

    # --- Rule 13: HTTPS misconception ---
    URLDetectionRule(
        rule_id=_next_rule_id(),
        name="HTTPS Misconception",
        category="Suspicious Link",
        description="URL uses HTTPS but may still be malicious",
        severity="low",
        pattern="https_misconception",
        explanation="The URL uses HTTPS (HTTPS://), but HTTPS alone does not prove a website is safe or legitimate. Scammers also use HTTPS to appear trustworthy.",
        action="Do not assume HTTPS means the site is safe. Always verify the domain and sender independently.",
        score_contribution=5,
    ),
]


# Rule name to rule object mapping for quick lookup
RULE_NAME_MAP: dict[str, URLDetectionRule] = {
    rule.name: rule for rule in RULES
}


# Category aggregation rules: which categories should be grouped together
CATEGORY_GROUPS = {
    "Suspicious Link": [
        "IP-based Hostname",
        "Excessive Subdomains",
        "URL Shortener",
        "Unusual TLD",
        "Excessively Long URL",
        "Misleading URL Path",
        "Suspicious Query Parameters",
        "Unusual Port",
        "Punycode / Homograph",
        "HTTPS Misconception",
    ],
    "Brand Impersonation": [
        "Brand Impersonation (Lookalike)",
        "Brand Name in Unrelated Domain",
    ],
    "Credential Theft": [
        "Embedded Credentials",
    ],
}


def get_rule_by_id(rule_id: int) -> URLDetectionRule | None:
    """Get a rule by its unique ID."""
    for rule in RULES:
        if rule.rule_id == rule_id:
            return rule
    return None


def get_rules_by_category(category: str) -> list[URLDetectionRule]:
    """Get all rules belonging to a specific category."""
    return [rule for rule in RULES if rule.category == category]


def get_all_rules() -> list[URLDetectionRule]:
    """Get all registered URL detection rules."""
    return RULES.copy()


def get_rule_names_by_category(category: str) -> list[str]:
    """Get rule names belonging to a specific category."""
    rules = get_rules_by_category(category)
    return [rule.name for rule in rules]


# Score contribution and severity maps, keyed by the stable rule pattern
# (snake_case) rather than the display name. Display names are user-facing and
# may be reworded; the pattern is the machine-readable rule identifier.
SCORE_CONTRIBUTION_MAP: dict[str, int] = {
    rule.pattern: rule.score_contribution for rule in RULES
}

SEVERITY_MAP: dict[str, str] = {
    rule.pattern: rule.severity for rule in RULES
}


def validate_rule_severity(severity: str) -> str:
    """Validate URL detection rule severity."""
    valid_severities = {"low", "medium", "high", "critical"}
    sev_lower = severity.lower().strip()
    if sev_lower not in valid_severities:
        raise ValueError(f"Invalid severity: {severity}. Must be one of {valid_severities}")
    return sev_lower


def validate_rule_type(rule_type: str) -> str:
    """Validate URL detection rule type."""
    valid_types = {
        "pattern", "ip_based", "shortener", "brand", "brand_impersonation",
        "unrelated_brand", "punycode", "long_url", "misleading_path",
        "suspicious_query", "embedded_credentials", "unusual_port",
        "unusual_tld", "excessive_subdomains", "https_misconception",
    }
    if rule_type not in valid_types:
        raise ValueError(f"Invalid rule type: {rule_type}. Must be one of {valid_types}")
    return rule_type
