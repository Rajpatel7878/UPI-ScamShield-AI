"""URL detector for the URL and phishing detection engine.

Analyzes URLs found in messages for suspicious indicators, performs brand
impersonation checks, and computes a URL risk score. URL analysis is entirely
passive: extracted URLs are never fetched, opened, or resolved, and redirects
are never followed.
"""
from __future__ import annotations

import logging
from typing import Any, Optional

from .url_parser import (
    extract_urls,
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
from .domain_analyzer import analyze_domain

logger = logging.getLogger(__name__)


# --- URL Risk Scoring Weights (per Phase 13 spec) ---
#
# Indicator weights are keyed by the human-readable indicator names emitted by
# this module and the domain analyzer. Each indicator name is counted once.
URL_INDICATOR_WEIGHTS: dict[str, int] = {
    "Embedded Credentials": 30,
    "IP-based Hostname": 20,
    "Brand Impersonation (Lookalike)": 30,
    "Brand Name in Unrelated Domain": 20,
    "URL Shortener": 10,
    "Unusual Port": 15,
    "Excessively Long URL": 10,
    "Excessive Subdomains": 10,
    "Suspicious Query Parameters": 15,
    "Misleading URL Path": 15,
    "Unusual TLD": 5,
    "Punycode / Homograph": 20,
    "HTTPS Misconception": 5,
}

# Cap the total URL score at 100.
URL_SCORE_CAP = 100

# URL risk bands intentionally differ from the message rule bands: a single
# high-severity URL indicator (for example an IP-based host) is enough to label
# the URL as High risk. This matches the Phase 13 requirements.
URL_RISK_BANDS = {
    "Critical": 80,
    "High": 20,
    "Medium": 10,
    "Low": 0,
}


def _score_to_url_risk_level(score: int) -> str:
    """Map a URL score to a risk level using the URL-specific bands."""
    if score >= URL_RISK_BANDS["Critical"]:
        return "Critical"
    if score >= URL_RISK_BANDS["High"]:
        return "High"
    if score >= URL_RISK_BANDS["Medium"]:
        return "Medium"
    return "Low"


class URLDetector:
    """Orchestrates passive URL analysis and risk scoring."""

    def detect_urls(self, content: str) -> list[dict[str, Any]]:
        """Extract all URLs from the given content."""
        if not content:
            return []
        return extract_urls(content)

    def analyze_url(self, url: str) -> dict[str, Any]:
        """Analyze a single URL for suspicious phishing indicators."""
        if not url or not url.strip():
            return self._empty_result("")

        normalized = normalize_url(url)
        if not normalized:
            return self._empty_result("")

        hostname = get_hostname(normalized) or ""
        domain = get_domain(hostname) if hostname else None

        domain_result = analyze_domain(hostname) if hostname else {
            "indicators": [],
            "risk_level": "low",
            "category": "No Domain",
            "summary": "",
        }
        indicators: list[dict[str, Any]] = list(domain_result["indicators"])

        def add(name: str, severity: str, description: str) -> None:
            if not any(item['name'] == name for item in indicators):
                indicators.append(
                    {"name": name, "severity": severity, "description": description}
                )

        if is_ip_based_hostname(normalized):
            add(
                "IP-based Hostname",
                "high",
                "The URL hostname is an IP address rather than a domain name.",
            )

        if is_shortened_url(normalized):
            add(
                "URL Shortener",
                "medium",
                "The URL uses a known URL shortener service.",
            )

        if has_unusual_port(normalized):
            add(
                "Unusual Port",
                "medium",
                "The URL uses a port outside the common 80, 443 and 8080 ports.",
            )

        if has_punycode(normalized):
            add(
                "Punycode / Homograph",
                "medium",
                "The URL hostname contains punycode encoding (xn--).",
            )

        if has_embedded_credentials(normalized):
            add(
                "Embedded Credentials",
                "critical",
                "The URL contains embedded credentials in query parameters.",
            )

        if has_suspicious_query(normalized):
            add(
                "Suspicious Query Parameters",
                "medium",
                "The URL query string contains phishing-related terms.",
            )

        if has_excessive_subdomains(normalized):
            add(
                "Excessive Subdomains",
                "medium",
                "The URL hostname has 3 or more subdomain levels.",
            )

        if len(normalized) > 200:
            add(
                "Excessively Long URL",
                "low",
                "The URL string exceeds 200 characters.",
            )

        # Inspect only the path component. Parsing the authority separately avoids
        # treating the slashes in "http://" as a path.
        value = normalized
        if value.lower().startswith('https://'):
            value = value[8:]
        elif value.lower().startswith('http://'):
            value = value[7:]
        authority_and_rest = value.split('/', 1)
        path = '/' + authority_and_rest[1] if len(authority_and_rest) == 2 else ''
        path = path.split('?', 1)[0]
        misleading_terms = ('secure', 'bank', 'login', 'verify', 'admin')
        matched_terms = [term for term in misleading_terms if term in path.lower()]
        if matched_terms:
            add(
                "Misleading URL Path",
                "medium",
                "The URL path contains terms commonly used to mislead users: "
                + ', '.join(matched_terms)
                + ".",
            )

        url_score = self._compute_url_score(indicators)
        risk_level = _score_to_url_risk_level(url_score)
        category = self._determine_category(indicators)
        recommendations = self._build_recommendations(indicators)
        summary = self._build_summary(indicators, url_score, risk_level)

        return {
            "url": normalized,
            "hostname": hostname,
            "domain": domain,
            "risk_score": url_score,
            "risk_level": risk_level,
            "category": category,
            "indicators": indicators,
            "recommendations": recommendations,
            "summary": summary,
        }

    def _compute_url_score(self, indicators: list[dict[str, Any]]) -> int:
        """Compute the URL risk score, counting each indicator name once."""
        total = 0
        seen: set[str] = set()
        for indicator in indicators:
            name = indicator.get('name', '')
            if not name or name in seen:
                continue
            seen.add(name)
            total += URL_INDICATOR_WEIGHTS.get(name, 0)
        return min(total, URL_SCORE_CAP)

    def _determine_category(self, indicators: list[dict[str, Any]]) -> str:
        """Determine the primary category from detected indicators."""
        names = {ind.get('name') for ind in indicators}
        if "Embedded Credentials" in names:
            return "Credential Theft"
        if any('Brand' in (name or '') for name in names):
            return "Brand Impersonation"
        return "Suspicious Link"

    def _build_recommendations(self, indicators: list[dict[str, Any]]) -> list[str]:
        """Build deduplicated safety recommendations from indicators."""
        recommendations: list[str] = []
        seen: set[str] = set()

        for severity in ("critical", "high", "medium", "low"):
            for indicator in indicators:
                if indicator.get('severity') != severity:
                    continue
                recommendation = self._recommendation_for(indicator.get('name', ''))
                if recommendation and recommendation not in seen:
                    seen.add(recommendation)
                    recommendations.append(recommendation)

        if not recommendations:
            recommendations = [
                "Be cautious with unknown URLs.",
                "Do not enter credentials from links in messages.",
            ]

        return recommendations[:10]

    def _recommendation_for(self, name: str) -> Optional[str]:
        """Return a safety recommendation for an indicator name."""
        mapping = {
            "Embedded Credentials": (
                "Never enter credentials from a URL. Legitimate services never ask "
                "you to paste credentials from a link."
            ),
            "IP-based Hostname": (
                "Do not enter credentials. Verify the website through your bank's "
                "official app or website."
            ),
            "Brand Impersonation (Lookalike)": (
                "Do not enter credentials. Access the service directly through its "
                "official app or website."
            ),
            "Brand Name in Unrelated Domain": (
                "Verify the website domain independently through the brand's "
                "official app or website."
            ),
            "URL Shortener": (
                "Do not click the link. Visit the service directly through your "
                "official app or website."
            ),
            "Unusual Port": (
                "Verify the service legitimacy before entering any information."
            ),
            "Punycode / Homograph": (
                "Be cautious of internationalized domain names. Verify the site "
                "through its official app or website."
            ),
            "Suspicious Query Parameters": (
                "Do not enter credentials. Verify the request independently through "
                "your bank's official channel."
            ),
            "Excessive Subdomains": (
                "Verify the website domain. Be cautious of URLs with many subdomain "
                "levels."
            ),
            "Excessively Long URL": (
                "Inspect the full destination before clicking; long URLs can hide "
                "the real target."
            ),
            "Unusual TLD": (
                "Verify the website legitimacy independently before sharing any "
                "information."
            ),
            "Misleading URL Path": (
                "Do not assume terms like 'secure' or 'bank' guarantee legitimacy. "
                "Verify the actual destination."
            ),
        }
        return mapping.get(name)

    def _build_summary(
        self,
        indicators: list[dict[str, Any]],
        score: int,
        risk_level: str,
    ) -> str:
        """Build a human-readable summary of the URL analysis."""
        if not indicators:
            return (
                f"No suspicious indicators found in URL. Risk score: {score} "
                f"({risk_level})."
            )

        counts = {
            severity: sum(1 for ind in indicators if ind.get('severity') == severity)
            for severity in ("critical", "high", "medium", "low")
        }
        parts = [
            f"{counts[severity]} {severity} indicator"
            for severity in ("critical", "high", "medium", "low")
            if counts[severity]
        ]
        return (
            f"URL analysis found {len(indicators)} indicators "
            f"({', '.join(parts)}). Risk score: {score} ({risk_level})."
        )

    def _empty_result(self, url: str) -> dict[str, Any]:
        """Return an empty result for an empty or invalid URL."""
        return {
            "url": url,
            "hostname": url,
            "domain": None,
            "risk_score": 0,
            "risk_level": "Low",
            "category": "No URL",
            "indicators": [],
            "recommendations": [
                "Provide a URL to analyze for phishing indicators.",
            ],
            "summary": "No URL provided for analysis.",
        }

    def detect_urls_in_message(self, content: str) -> dict[str, Any]:
        """Detect and analyze all unique URLs in a message."""
        if not content:
            return self._no_urls_result()

        extracted = extract_urls(content)
        if not extracted:
            return self._no_urls_result()

        seen: set[str] = set()
        url_results: list[dict[str, Any]] = []
        total_score = 0

        for item in extracted:
            key = normalize_url(item['url']).lower()
            if not key or key in seen:
                continue
            seen.add(key)
            analysis = self.analyze_url(item['url'])
            url_results.append(analysis)
            total_score += analysis['risk_score']

        if not url_results:
            return self._no_urls_result()

        overall_score = min(total_score, URL_SCORE_CAP)
        overall_level = _score_to_url_risk_level(overall_score)

        recommendations: list[str] = []
        rec_seen: set[str] = set()
        for result in url_results:
            for recommendation in result.get('recommendations', []):
                if recommendation not in rec_seen:
                    rec_seen.add(recommendation)
                    recommendations.append(recommendation)

        if not recommendations:
            recommendations = [
                "Be cautious with unknown URLs.",
                "Do not enter credentials from links in messages.",
            ]

        if any(r.get('category') == 'Credential Theft' for r in url_results):
            overall_category = "Credential Theft"
        elif any(r.get('category') == 'Brand Impersonation' for r in url_results):
            overall_category = "Brand Impersonation"
        else:
            overall_category = "Suspicious Link"

        if len(url_results) == 1:
            summary = f"1 URL found in message. {url_results[0]['summary']}"
        else:
            summary = f"{len(url_results)} URLs found in message."

        return {
            "urls_found": len(url_results),
            "url_results": url_results,
            "overall_risk_score": overall_score,
            "overall_risk_level": overall_level,
            "overall_category": overall_category,
            "merged_recommendations": recommendations,
            "summary": summary,
        }

    def _no_urls_result(self) -> dict[str, Any]:
        """Result used when a message contains no URLs."""
        return {
            "urls_found": 0,
            "url_results": [],
            "overall_risk_score": 0,
            "overall_risk_level": "Low",
            "overall_category": "No URL",
            "merged_recommendations": [
                "Be cautious with unknown URLs.",
                "Do not enter credentials from links in messages.",
            ],
            "summary": "No URLs found in the message.",
        }


def detect_urls_in_message(content: str) -> dict[str, Any]:
    """Backward-compatible module-level wrapper for message URL analysis."""
    return URLDetector().detect_urls_in_message(content)


def integrate_with_gemini(
    url: str,
    gemini_service: object | None = None,
) -> dict[str, Any] | None:
    """Optionally integrate URL analysis with Gemini AI.

    Gemini is only used when explicitly provided and available; rule-based URL
    analysis remains fully operational without it.
    """
    if gemini_service is None:
        return None
    if not gemini_service.is_available():
        return None
    return None
