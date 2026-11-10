\"\"\"Text normalizer for the rule-based detection engine.\n\nNormalizes whitespace and text case before analysis. Supports English and
common Hinglish expressions. Does not modify the original submitted text.\n\"\"\"\nimport re\nfrom typing import Optional


def normalize_text(content: str) -> str:
    """Normalize submitted text for analysis.

    - Strips leading/trailing whitespace
    - Collapses multiple internal whitespace sections to single space
    - Converts to lowercase for consistent pattern matching
    - Preserves the original content unchanged

    Args:
        content: The raw submitted text message.

    Returns:
        Normalized text ready for pattern matching.
    """
    if not content:
        return content

    # Strip leading/trailing whitespace
    normalized = content.strip()

    # Collapse multiple whitespace sections to single space
    normalized = re.sub(r'\s+', ' ', normalized)

    # Convert to lowercase for consistent pattern matching
    normalized = normalized.lower()

    return normalized


def normalize_whitespace_only(content: str) -> str:
    """Normalize only whitespace without case conversion.

    Useful when case matters but extra whitespace should be collapsed.

    Args:
        content: The raw submitted text.

    Returns:
        Text with collapsed whitespace, original case preserved.
    """
    if not content:
        return content
    return re.sub(r'\s+', ' ', content.strip())


def extract_urls(content: str) -> list[str]:
    """Extract URL-like strings from content for suspicious link detection.

    Uses a simple regex to find patterns that look like URLs.
    Does not fetch or validate the URLs.

    Args:
        content: The text to search for URLs.

    Returns:
        List of URL-like strings found in the content.
    """
    if not content:
        return []

    # Match common URL patterns
    url_pattern = r'(?:https?://|www\.)\S+[^\s.,;!\?\]\}\>"]?'
    urls = re.findall(url_pattern, content)
    return urls


def is_suspicious_shortened_url(text: str) -> bool """Check if text contains suspicious shortened URL indicators.

    Looks for common URL shorteners and suspicious link patterns.

    Args:
        text: The text to check.

    Returns:
        True if suspicious shortened URL indicators are found.
    """
    if not text:
        return False

    lowered = text.lower()
    shorteners = ['bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'is.gd', 'buff.ly', 'adf.ly']

    for s in shorteners:
        if s in lowered:
            return True

    # Check for generic https links without domain context
    if 'http://' in lowered or 'https://' in lowered:
        # Could be suspicious if no obvious trusted domain
        import re
        # Exclude common trusted domains
        trusted_patterns = [
            r'https?://(?:www\.)?\(bhabhi\)\.?\w+',
            r'https?://(?:www\.)?google\.',
            r'https?://(?:www\.)?github\.',
        ]
        for tp in trusted_patterns:
            if re.search(tp, lowered):
                return False
        # If there's a link but no trusted domain pattern, consider it suspicious
        if re.search(r'https?://\S+', lowered):
            return True

    return False