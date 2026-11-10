"""URL parser for the URL and phishing detection engine.

Provides robust URL extraction and normalization without modifying original
content, executing JavaScript, or following redirects. This module never
performs network requests.
"""
from __future__ import annotations

import re
from typing import Optional


# Regex pattern for URL extraction (per Phase 13 spec).
# Matches http/https URLs embedded in text, with support for subdomains,
# query parameters, ports, and various URL formats.
URL_PATTERN = re.compile(
    r'(?i)\bhttps?://'  # http:// or https://
    r'(?:'
    r'(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}'  # domain name
    r'|'
    r'(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}'
    r'(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)'  # IPv4
    r'|'
    r'localhost'
    r')'
    r'(?::[0-9]{1,5})?'  # optional port
    r'(?:/[^\s]*)?',  # path/query
)


# Pattern for standalone URLs that start with www and no scheme.
STANDALONE_URL_PATTERN = re.compile(
    r'(?i)\bwww\.[a-zA-Z0-9][a-zA-Z0-9-]*(?:\.[a-zA-Z]{2,})+[^\s]*',
)


# Pattern for detecting IP-based hostnames (not domain names).
IP_HOSTNAME_PATTERN = re.compile(
    r'(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}'
    r'(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)',
)


# Pattern for detecting URL shorteners.
SHORTENER_PATTERN = re.compile(
    r'(?i)(?:^|\.)(?:bit\.ly|tinyurl\.com|goo\.gl|t\.co|is\.gd|buff\.ly|adf\.ly)(?:/|$)',
)


# Pattern for detecting excessive subdomains (3+ subdomain levels).
EXCESSIVE_SUBDOMAIN_PATTERN = re.compile(
    r'(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.){3,}[a-zA-Z]{2,}',
)


# Pattern for detecting punycode/homograph indicators.
PUNYCODE_PATTERN = re.compile(r'(?i)xn--')


# Pattern for detecting embedded credentials in URLs.
CREDENTIAL_PATTERN = re.compile(
    r'(?i)(?:username|user|password|passwd|token|secret|api_key|apikey)=[^&\s]+',
)


# Pattern for detecting suspicious query parameters.
SUSPICIOUS_QUERY_PATTERN = re.compile(
    r'(?i)(?:login|verify|signin|signout|session|token|passwd|credential)',
)


# Common legitimate TLDs (for conservative matching).
LEGITIMATE_TLDS = {
    'com', 'org', 'net', 'edu', 'gov', 'mil', 'int',
    'co', 'ai', 'io', 'app', 'dev', 'blog', 'info', 'biz',
    'in', 'us', 'uk', 'de', 'jp', 'cn', 'fr', 'ca', 'au',
}


def _strip_trailing_punctuation(value: str) -> str:
    """Trim punctuation that commonly follows a URL in prose."""
    return value.rstrip('.,;:!?)]}\'"')


def extract_urls(content: str) -> list[dict[str, str]]:
    """Extract URLs from content without modifying the original text.

    Identifies HTTP/HTTPS URLs and standalone ``www.`` URLs embedded in text.
    Returns extracted URLs with their position and normalized form, deduplicated
    case-insensitively by URL string.

    Args:
        content: The text content to search for URLs.

    Returns:
        List of dicts with ``url``, ``start``, ``end`` and
        ``original_segment`` keys.
    """
    if not content:
        return []

    urls: list[dict[str, str]] = []
    occupied: list[tuple[int, int]] = []

    for match in URL_PATTERN.finditer(content):
        raw = match.group(0)
        start, end = match.start(), match.end()
        occupied.append((start, end))
        normalized = _strip_trailing_punctuation(raw)
        urls.append({
            'url': normalized,
            'start': str(start),
            'end': str(end),
            'original_segment': raw,
        })

    for match in STANDALONE_URL_PATTERN.finditer(content):
        start, end = match.start(), match.end()
        # A www URL inside an already matched http(s) URL must not be counted twice.
        if any(existing_start <= start < existing_end for existing_start, existing_end in occupied):
            continue
        raw = match.group(0)
        normalized = _strip_trailing_punctuation(raw)
        urls.append({
            'url': normalized,
            'start': str(start),
            'end': str(end),
            'original_segment': raw,
        })

    seen: set[str] = set()
    unique_urls: list[dict[str, str]] = []
    for item in urls:
        key = item['url'].lower()
        if key not in seen:
            seen.add(key)
            unique_urls.append(item)

    return unique_urls


def normalize_url(url: str) -> str:
    """Normalize a URL safely for analysis.

    Removes the fragment, surrounding whitespace, and trailing punctuation while
    preserving the scheme, host, port, path and query string. The original string
    is never modified in place.

    Args:
        url: The URL to normalize.

    Returns:
        Normalized URL string suitable for analysis.
    """
    if not url:
        return ""

    normalized = url.strip()

    # Remove fragment (#section).
    if '#' in normalized:
        normalized = normalized.split('#', 1)[0]

    # Remove trailing punctuation that is usually sentence punctuation.
    normalized = _strip_trailing_punctuation(normalized).strip()
    return normalized


def get_hostname(url: str) -> Optional[str]:
    """Extract the lowercase hostname from a URL, without scheme or port."""
    if not url:
        return None

    value = url.strip()
    if value.lower().startswith('https://'):
        value = value[8:]
    elif value.lower().startswith('http://'):
        value = value[7:]

    # Remove userinfo (user:pass@host).
    if '@' in value:
        value = value.rsplit('@', 1)[1]

    # Stop at path, query or fragment.
    host = re.split(r'[/?#]', value, maxsplit=1)[0]

    # Strip port. IPv6 literals are not supported by this conservative parser.
    host = re.sub(r':[0-9]{1,5}$', '', host)

    host = host.strip(' .').lower()
    return host or None


def get_domain(hostname: str) -> Optional[str]:
    """Extract the registered domain from a hostname.

    Uses a conservative last-two-labels approach. Public-suffix handling is
    intentionally out of scope; the result is used only for explainable
    heuristics, never for authorization decisions.
    """
    if not hostname:
        return None

    host = get_hostname(hostname) if '://' in hostname else hostname.strip().strip('.').lower()
    if not host or IP_HOSTNAME_PATTERN.fullmatch(host):
        return None

    parts = host.split('.')
    if len(parts) >= 2:
        return '.'.join(parts[-2:])
    return host


def is_ip_based_hostname(url: str) -> bool:
    """Check if the URL hostname is an IPv4 address rather than a domain."""
    if not url:
        return False
    host = get_hostname(url) or ''
    return bool(IP_HOSTNAME_PATTERN.fullmatch(host))


def is_shortened_url(url: str) -> bool:
    """Check if the URL uses a known URL shortener."""
    if not url:
        return False
    host = get_hostname(url) or ''
    return bool(SHORTENER_PATTERN.search(host))


def has_excessive_subdomains(hostname: str) -> bool:
    """Check if the hostname has three or more subdomain levels."""
    if not hostname:
        return False
    host = get_hostname(hostname) or ''
    if IP_HOSTNAME_PATTERN.fullmatch(host):
        return False
    labels = [label for label in host.split('.') if label]
    # label + domain + tld => 3 labels; 4+ labels means 3+ subdomains.
    return len(labels) >= 4


def has_punycode(hostname: str) -> bool:
    """Check if the hostname contains punycode indicators."""
    if not hostname:
        return False
    host = get_hostname(hostname) or ''
    return bool(PUNYCODE_PATTERN.search(host))


def has_embedded_credentials(url: str) -> bool:
    """Check if the URL has embedded credentials (username/password/token)."""
    if not url:
        return False
    return bool(CREDENTIAL_PATTERN.search(url))


def has_suspicious_query(url: str) -> bool:
    """Check if the URL query string has suspicious parameter names."""
    if not url or '?' not in url:
        return False
    query = url.split('?', 1)[1]
    return bool(SUSPICIOUS_QUERY_PATTERN.search(query))


def has_unusual_port(url: str) -> bool:
    """Check if the URL uses a port outside 80, 443 or 8080."""
    if not url:
        return False

    value = url.strip()
    if value.lower().startswith('https://'):
        value = value[8:]
    elif value.lower().startswith('http://'):
        value = value[7:]

    if '@' in value:
        value = value.rsplit('@', 1)[1]

    authority = re.split(r'[/?#]', value, maxsplit=1)[0]
    match = re.search(r':([0-9]{1,5})$', authority)
    if not match:
        return False

    port = int(match.group(1))
    return port not in (80, 443, 8080) and 1 <= port <= 65535
