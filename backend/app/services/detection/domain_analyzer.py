"""Domain analyzer for the URL and phishing detection engine.

Analyzes extracted hostnames and domains for suspicious indicators including
brand impersonation, IP-based hostnames, punycode/homograph attacks, and other
phishing indicators. All checks are local, explainable heuristics; no network
requests are made.
"""
from __future__ import annotations

from typing import Any

from .url_parser import (
    IP_HOSTNAME_PATTERN,
    LEGITIMATE_TLDS,
    get_domain,
    get_hostname,
    has_embedded_credentials,
    has_excessive_subdomains,
    has_punycode,
    has_suspicious_query,
    has_unusual_port,
)

# Brand name to official registered domain. Used to flag brand names that appear
# in unrelated domains. Kept small and conservative on purpose.
BRAND_DOMAINS: dict[str, str] = {
    'google': 'google.com',
    'paypal': 'paypal.com',
    'amazon': 'amazon.com',
    'microsoft': 'microsoft.com',
    'apple': 'apple.com',
    'phonepe': 'phonepe.com',
    'paytm': 'paytm.com',
    'bhim': 'bhimupi.org.in',
    'sbi': 'sbi.co.in',
    'hdfc': 'hdfcbank.com',
    'icici': 'icicibank.com',
    'axis': 'axisbank.com',
}


def _add_indicator(
    indicators: list[dict[str, Any]],
    name: str,
    severity: str,
    description: str,
) -> None:
    """Append an indicator once, preserving order."""
    if not any(item['name'] == name for item in indicators):
        indicators.append(
            {"name": name, "severity": severity, "description": description}
        )


def analyze_domain(hostname: str) -> dict[str, Any]:
    """Analyze a hostname for suspicious phishing indicators.

    Args:
        hostname: The hostname to analyze (extracted from a URL).

    Returns:
        Dict with ``indicators``, ``risk_level``, ``category`` and ``summary``.
    """
    if not hostname:
        return {
            "indicators": [],
            "risk_level": "low",
            "category": "No Domain",
            "summary": "No hostname provided for analysis.",
        }

    host = (get_hostname(hostname) if '://' in hostname else hostname).strip().lower()
    if not host:
        return {
            "indicators": [],
            "risk_level": "low",
            "category": "No Domain",
            "summary": "No hostname provided for analysis.",
        }

    indicators: list[dict[str, Any]] = []
    is_ip = bool(IP_HOSTNAME_PATTERN.fullmatch(host))

    # 1. IP-based hostname
    if is_ip:
        _add_indicator(
            indicators,
            "IP-based Hostname",
            "high",
            "The hostname is an IP address rather than a domain name.",
        )

    # 2. Excessive subdomains
    if has_excessive_subdomains(host):
        _add_indicator(
            indicators,
            "Excessive Subdomains",
            "medium",
            "The hostname has 3 or more subdomain levels.",
        )

    # 3. Punycode / homograph
    if has_punycode(host):
        _add_indicator(
            indicators,
            "Punycode / Homograph",
            "medium",
            "The hostname contains punycode encoding (xn--), which can indicate "
            "internationalized domain spoofing.",
        )

    # 4. Embedded credentials
    if has_embedded_credentials(host):
        _add_indicator(
            indicators,
            "Embedded Credentials",
            "critical",
            "The hostname contains embedded username, password, or token parameters.",
        )

    # 5. Unusual port
    if has_unusual_port(host):
        _add_indicator(
            indicators,
            "Unusual Port",
            "medium",
            "The hostname uses a port outside the common 80, 443 and 8080 ports.",
        )

    # 6. Suspicious query parameters
    if has_suspicious_query(host):
        _add_indicator(
            indicators,
            "Suspicious Query Parameters",
            "medium",
            "The hostname contains terms commonly used in phishing query strings.",
        )

    domain = get_domain(host)
    tld = domain.rsplit('.', 1)[-1].lower() if domain and '.' in domain else ''

    # 7. Unusual TLD
    if tld and tld not in LEGITIMATE_TLDS and len(tld) > 2:
        _add_indicator(
            indicators,
            "Unusual TLD",
            "low",
            f"The domain uses TLD '.{tld}', which is not among the most common "
            "top-level domains.",
        )

    # 8. Brand name used in an unrelated domain
    if not is_ip and domain:
        for brand, official_domain in BRAND_DOMAINS.items():
            if brand not in host:
                continue
            if domain == official_domain or domain.endswith('.' + official_domain):
                continue
            _add_indicator(
                indicators,
                "Brand Name in Unrelated Domain",
                "medium",
                f"The hostname contains the brand name '{brand}' but is not on "
                f"{official_domain}.",
            )
            break

    severity_weights = {"critical": 4, "high": 3, "medium": 2, "low": 1}
    max_severity = max(
        (severity_weights.get(ind['severity'], 0) for ind in indicators),
        default=0,
    )

    if max_severity >= 4:
        risk_level = "critical"
    elif max_severity == 3:
        risk_level = "high"
    elif max_severity == 2:
        risk_level = "medium"
    else:
        risk_level = "low"

    if any(ind['name'] == 'Embedded Credentials' for ind in indicators):
        category = "Credential Theft"
    elif any('Brand' in ind['name'] for ind in indicators):
        category = "Brand Impersonation"
    else:
        category = "Suspicious Link"

    if not indicators:
        summary = f"The hostname '{host}' appears unremarkable based on standard checks."
    elif len(indicators) == 1:
        summary = f"The hostname '{host}' has 1 suspicious indicator: {indicators[0]['name']}."
    else:
        summary = f"The hostname '{host}' has {len(indicators)} suspicious indicators."

    return {
        "indicators": indicators,
        "risk_level": risk_level,
        "category": category,
        "summary": summary,
    }


def get_category_priority(category: str) -> int:
    """Get the priority order for categories."""
    priority_map = {
        "Credential Theft": 4,
        "Brand Impersonation": 3,
        "Suspicious Link": 2,
        "No Domain": 1,
    }
    return priority_map.get(category, 0)
