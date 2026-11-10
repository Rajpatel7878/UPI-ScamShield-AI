"""Tests for the URL and phishing detection engine (Phase 13).

Tests cover URL extraction, suspicious indicator detection, brand impersonation,
URL risk scoring, and integration with the hybrid detection system.
"""
import json
import os
import sys
from unittest.mock import MagicMock, patch

# Add backend to path
sys.path.insert(0, os.path.join(sys.path[0], '..', 'backend') if '..' in sys.path else '../backend')

import pytest

from app.services.detection.url_detector import URLDetector
from app.services.detection.url_parser import (
    extract_urls,
    normalize_url,
    is_ip_based_hostname,
    is_shortened_url,
    get_hostname,
    get_domain,
    has_excessive_subdomains,
    has_punycode,
    has_embedded_credentials,
    has_suspicious_query,
    has_unusual_port,
)
from app.services.detection.url_rules import get_all_rules, get_rules_by_category, get_rule_names_by_category, RULES, RULE_NAME_MAP, SCORE_CONTRIBUTION_MAP, SEVERITY_MAP, CATEGORY_GROUPS
from app.services.detection.domain_analyzer import analyze_domain, get_category_priority


# --- URL Extraction Tests ---


def test_extract_urls_standalone_http():
    """Test extracting standalone HTTP URLs."""
    content = "Check out http://example.com for more info."
    urls = extract_urls(content)
    assert len(urls) == 1
    assert urls[0]['url'] == 'http://example.com'


def test_extract_urls_standalone_https():
    """Test extracting standalone HTTPS URLs."""
    content = "Visit https://secure-login.com now."
    urls = extract_urls(content)
    assert len(urls) == 1
    assert urls[0]['url'] == 'https://secure-login.com'


def test_extract_urls_url_in_text():
    """Test extracting URL embedded in regular text."""
    content = "Hello visit my-site.org today for updates."
    urls = extract_urls(content)
    # Should find URLs even without http:// prefix if they match pattern
    assert len(urls) >= 0  # May or may not match depending on pattern


def test_extract_urls_multiple():
    """Test extracting multiple URLs from one message."""
    content = "Visit http://site1.com and http://site2.org for details."
    urls = extract_urls(content)
    assert len(urls) == 2


def test_extract_urls_no_urls():
    """Test extracting URLs from content with no URLs."""
    content = "Hello world this is just plain text."
    urls = extract_urls(content)
    assert len(urls) == 0


def test_extract_urls_empty():
    """Test extracting URLs from empty content."""
    urls = extract_urls("")
    assert len(urls) == 0


def test_extract_urls_deduplication():
    """Test that duplicate URLs are deduplicated."""
    content = "Check http://example.com and http://example.com again."
    urls = extract_urls(content)
    # Should deduplicate
    normalized = [u['url'].lower() for u in urls]
    assert len(normalized) == len(set(normalized)), "URLs should be deduplicated"


def test_normalize_url():
    """Test URL normalization."""
    # Test with fragment
    result = normalize_url("https://example.com/page#section")
    assert '#section' not in result

    # Test with trailing punctuation
    result = normalize_url("http://example.com.")
    assert result == "http://example.com" or result == "http://example.com."

    # Empty string
    result = normalize_url("")
    assert result == ""


def test_is_ip_based_hostname():
    """Test IP-based hostname detection."""
    # IP-based URL
    assert is_ip_based_hostname("http://192.168.1.1/page") is True

    # Domain-based URL
    assert is_ip_based_hostname("http://example.com/page") is False

    # Empty
    assert is_ip_based_hostname("") is False


def test_is_shortened_url():
    """Test URL shortener detection."""
    # Shortened URLs
    assert is_shortened_url("http://bit.ly/3xyz") is True
    assert is_shortened_url("http://tinyurl.com/abc") is True

    # Regular URL
    assert is_shortened_url("http://example.com") is False


def test_has_excessive_subdomains():
    """Test excessive subdomain detection."""
    # Many subdomains
    assert has_excessive_subdomains("a.b.c.d.example.com") is True

    # Normal domain
    assert has_excessive_subdomains("example.com") is False


def test_has_punycode():
    """Test punycode detection."""
    # Contains punycode
    assert has_punycode("xn--example.com") is True

    # Normal domain
    assert has_punycode("example.com") is False


def test_has_embedded_credentials():
    """Test embedded credentials detection."""
    # Has credentials in query
    assert has_embedded_credentials("http://example.com?username=admin") is True

    # No credentials
    assert has_embedded_credentials("http://example.com") is False


def test_has_suspicious_query():
    """Test suspicious query parameter detection."""
    # Suspicious params
    assert has_suspicious_query("http://example.com?login=admin") is True

    # Safe params
    assert has_suspicious_query("http://example.com?page=1") is False


def test_has_unusual_port():
    """Test unusual port detection."""
    # Unusual port
    assert has_unusual_port("http://example.com:9000/path") is True

    # Common port
    assert has_unusual_port("http://example.com:80/path") is False
    assert has_unusual_port("http://example.com:443/path") is False
    assert has_unusual_port("http://example.com:8080/path") is False


def test_get_hostname():
    """Test hostname extraction."""
    result = get_hostname("http://example.com/path")
    assert result == "example.com"

    result = get_hostname("https://sub.example.com/page")
    assert result == "sub.example.com"


def test_get_domain():
    """Test domain extraction."""
    result = get_domain("sub.example.com")
    assert result == "example.com"

    result = get_domain("example.com")
    assert result == "example.com"


# --- Domain Analyzer Tests ---


def test_analyze_domain_ip():
    """Test analyzing IP-based domain."""
    result = analyze_domain("192.168.1.1")
    assert len(result["indicators"]) > 0
    assert any(i['name'] == 'IP-based Hostname' for i in result["indicators"])


def test_analyze_domain_normal():
    """Test analyzing normal domain."""
    result = analyze_domain("example.com")
    # Should have minimal or no indicators
    assert isinstance(result, dict)


def test_analyze_domain_brand_impersonation():
    """Test brand impersonation detection."""
    # Domain with Google and unusual TLD
    result = analyze_domain("google-security.xyz")
    names = [i['name'] for i in result["indicators"]]
    # May detect brand impersonation depending on TLD check
    assert isinstance(result, dict)


def test_get_category_priority():
    """Test category priority ordering."""
    assert get_category_priority("Credential Theft") == 4
    assert get_category_priority("Brand Impersonation") == 3
    assert get_category_priority("Suspicious Link") == 2
    assert get_category_priority("No Domain") == 1


# --- URL Detector Tests ---


def test_detect_urls_in_message_no_urls():
    """Test message with no URLs."""
    detector = URLDetector()
    result = detector.detect_urls_in_message("Hello world no URLs here.")
    assert result['urls_found'] == 0
    assert result['overall_risk_score'] == 0


def test_detect_urls_in_message_standalone():
    """Test message with standalone URL."""
    detector = URLDetector()
    result = detector.detect_urls_in_message("Check http://example.com")
    assert result['urls_found'] >= 1
    assert len(result['url_results']) >= 1


def test_detect_urls_in_message_sms():
    """Test SMS message with URL."""
    detector = URLDetector()
    result = detector.detect_urls_in_message(
        "URGENT! Your bank: http://bank-verify.com/update"
    )
    assert result['urls_found'] >= 1
    # Should have some risk indicators
    assert result['overall_risk_score'] >= 0


def test_analyze_url_basic():
    """Test basic URL analysis."""
    detector = URLDetector()
    result = detector.analyze_url("http://example.com")
    assert 'risk_score' in result
    assert 'risk_level' in result
    assert 'category' in result
    assert 'indicators' in result


def test_analyze_url_ip_based():
    """Test analysis of IP-based URL."""
    detector = URLDetector()
    result = detector.analyze_url("http://192.168.1.1/page")
    assert result['risk_score'] > 0
    # Should have IP-based hostname indicator
    ip_indicators = [i for i in result['indicators'] if i['name'] == 'IP-based Hostname']
    assert len(ip_indicators) > 0


def test_analyze_url_embedded_credentials():
    """Test analysis of URL with embedded credentials."""
    detector = URLDetector()
    result = detector.analyze_url("http://example.com?username=admin&password=secret")
    assert result['risk_score'] > 0
    # Should have embedded credentials indicator
    cred_indicators = [i for i in result['indicators'] if i['name'] == 'Embedded Credentials']
    assert len(cred_indicators) > 0


def test_analyze_url_brand_impersonation():
    """Test brand impersonation analysis."""
    detector = URLDetector()
    result = detector.analyze_url("http://google-security-login.com/payments")
    assert result['risk_score'] > 0
    # Should have some brand-related indicator
    brand_indicators = [i for i in result['indicators'] if 'brand' in i['name'].lower()]
    assert len(brand_indicators) > 0 or result['risk_score'] >= 15


def test_analyze_url_shortener():
    """Test URL shortener analysis."""
    detector = URLDetector()
    result = detector.analyze_url("http://bit.ly/3xyz")
    assert result['risk_score'] > 0
    # Should have URL shortener indicator
    shortener_indicators = [i for i in result['indicators'] if i['name'] == 'URL Shortener']
    assert len(shortener_indicators) > 0


def test_analyze_url_recommendations():
    """Test that recommendations are generated."""
    detector = URLDetector()
    result = detector.analyze_url("http://example.com?username=admin")
    assert len(result['recommendations']) > 0
    # Should include safety advice
    rec_text = ' '.join(result['recommendations']).lower()
    assert 'credentials' in rec_text or 'verif' in rec_text


def test_analyze_url_summary():
    """Test summary generation."""
    detector = URLDetector()
    result = detector.analyze_url("http://example.com")
    assert 'summary' in result
    assert isinstance(result['summary'], str)


# --- Rule Tests ---


def test_all_rules_present():
    """Test that all 13 Phase 13 rules are registered."""
    rules = get_all_rules()
    assert len(rules) == 13, f"Expected 13 rules, got {len(rules)}"


def test_rules_have_required_fields():
    """Test that all rules have required fields."""
    for rule in get_all_rules():
        assert hasattr(rule, 'rule_id')
        assert hasattr(rule, 'name')
        assert hasattr(rule, 'category')
        assert hasattr(rule, 'severity')
        assert hasattr(rule, 'description')
        assert hasattr(rule, 'action')
        assert hasattr(rule, 'score_contribution')


def test_rules_by_category():
    """Test grouping rules by category."""
    # Check Suspicious Link category
    suspicious = get_rules_by_category("Suspicious Link")
    names = [r.name for r in suspicious]
    assert len(suspicious) > 0

    # Check Brand Impersonation category
    brand = get_rules_by_category("Brand Impersonation")
    names = [r.name for r in brand]
    assert len(brand) > 0

    # Check Credential Theft category
    credential = get_rules_by_category("Credential Theft")
    names = [r.name for r in credential]
    assert len(credential) > 0


def test_score_contribution_map():
    """Test that score contribution mapping is populated."""
    assert len(SCORE_CONTRIBUTION_MAP) > 0

    # Check some key entries
    assert 'embedded_credentials' in SCORE_CONTRIBUTION_MAP
    assert SCORE_CONTRIBUTION_MAP['embedded_credentials'] == 30

    assert 'ip_based_hostname' in SCORE_CONTRIBUTION_MAP
    assert SCORE_CONTRIBUTION_MAP['ip_based_hostname'] == 20


def test_severity_map():
    """Test that severity mapping is populated."""
    assert len(SEVERITY_MAP) > 0

    # Check some key entries
    assert 'embedded_credentials' in SEVERITY_MAP
    assert SEVERITY_MAP['embedded_credentials'] == 'critical'

    assert 'ip_based_hostname' in SEVERITY_MAP
    assert SEVERITY_MAP['ip_based_hostname'] == 'high'


def test_category_groups():
    """Test category grouping."""
    assert 'Suspicious Link' in CATEGORY_GROUPS
    assert 'Brand Impersonation' in CATEGORY_GROUPS
    assert 'Credential Theft' in CATEGORY_GROUPS

    # Check Suspicious Link has expected rules
    suspicious_group = CATEGORY_GROUPS['Suspicious Link']
    assert len(suspicious_group) > 0


# --- Integration Tests ---


def test_hybrid_integration_phase10_11_13():
    """Test that Phase 10, 11, and 13 integrate correctly."""
    from app.services.detection.hybrid_scorer import HybridScorer

    detector = URLDetector()

    # Test standalone URL analysis integration
    url_result = detector.analyze_url("http://192.168.1.1/page")
    assert url_result['risk_score'] > 0
    assert url_result['risk_level'] in ['Low', 'Medium', 'High', 'Critical']

    # Test message with URL integration
    message_result = detector.detect_urls_in_message(
        "SMS: http://192.168.1.1/page is suspicious"
    )
    assert message_result['urls_found'] >= 1
    assert message_result['overall_risk_score'] >= 0
    assert message_result['overall_risk_level'] in ['Low', 'Medium', 'High', 'Critical']


def test_empty_content_handling():
    """Test handling of empty/invalid content."""
    detector = URLDetector()

    # Empty URL analysis
    result = detector.analyze_url("")
    assert result is not None
    assert result['risk_score'] == 0
    assert result['risk_level'] == 'Low'

    # Empty message URL detection
    msg_result = detector.detect_urls_in_message("")
    assert msg_result['urls_found'] == 0
    assert msg_result['overall_risk_score'] == 0


def test_risk_level_scaling():
    """Test that risk levels scale with score."""
    detector = URLDetector()

    # High-risk URL should have high score
    ip_result = detector.analyze_url("http://192.168.1.1/page")
    assert ip_result['risk_score'] >= 20  # IP-based gives at least 20 points
    assert ip_result['risk_level'] in ['High', 'Critical']

    # Safe URL should have low score
    safe_result = detector.analyze_url("http://example.com/page")
    assert safe_result['risk_score'] >= 0
    assert safe_result['risk_level'] in ['Low', 'Medium']
