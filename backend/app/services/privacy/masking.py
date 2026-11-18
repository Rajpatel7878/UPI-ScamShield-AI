"""Conservative credential masking for quick notification analysis.

This module masks *credential values*, not every number:

* the surrounding words are preserved so rule detection still works
  (``"OTP 123456"`` becomes ``"OTP [REDACTED]"`` and still matches the OTP rule),
* amounts (``Rs 5,000``), dates, validity minutes (``10 minutes``) and ordinary
  order numbers are left alone.

It complements, and does not replace, ``redact_credentials`` in
``app.services.detection.gemini_service``: that function remains the final
safety net inside every AI provider request. The quick pipeline masks once
before rules run, so providers and the AI never receive OTPs, PINs, card
numbers or passwords.

The replacement token is always ``[REDACTED]`` and masking is idempotent.
"""

from __future__ import annotations

import re

REDACTED = "[REDACTED]"

# A credential label may be followed by up to N characters of filler before the
# value ("OTP is", "OTP: ", "UPI PIN "). Sentence punctuation ends the window so
# a label cannot capture a number from the next sentence.
_FILLER = r"[^0-9\n.!?]{0,20}"

_OTP_PATTERN = re.compile(
    r"(?i)\b(otp|o\.t\.p\.?|one[-\s]?time\s+(?:password|code)|"
    r"verification\s+code|authentication\s+code)\b"
    r"(" + _FILLER + r")(\d{4,8})\b"
)

_UPI_PIN_PATTERN = re.compile(
    r"(?i)\b(upi\s*pin|upi\s*password|m[-\s]?pin|mpin)\b"
    r"(" + _FILLER + r")(\d{4,6})\b"
)
_PIN_BEFORE_VERB_PATTERN = re.compile(
    r"(?i)\bpin\b([^.\n]{0,40}?)"
    r"\b(enter|share|verify|type|send|batao|daalo|daal)\b"
    r"(" + _FILLER + r")(\d{4,6})\b"
)
_PIN_AFTER_VERB_PATTERN = re.compile(
    r"(?i)\b(enter|share|verify|type|send|batao|daalo|daal)\b"
    r"([^.\n]{0,40}?)\bpin\b"
    r"(" + _FILLER + r")(\d{4,6})\b"
)

_CVV_PATTERN = re.compile(
    r"(?i)\b(cvv|cvc|card\s+security\s+code|security\s+code)\b"
    r"(" + _FILLER + r")(\d{3,4})\b"
)

# Only mask a password when an explicit value separator is present.
_PASSWORD_PATTERN = re.compile(
    r"(?i)\b(password|passcode|pwd)\b(\s*(?:is|:|=)\s*)(\S{3,64})"
)

_ACCOUNT_PATTERN = re.compile(
    r"(?i)\b(a/c|a\.c\.|account\s*(?:no\.?|number)|acc(?:ount)?\s*no\.?)\b"
    r"(" + _FILLER + r")(\d{9,18})\b"
)

_AADHAAR_PATTERN = re.compile(
    r"(?i)\b(aadhaar|aadhar|uidai|uid)\b"
    r"([^0-9\n]{0,15})(\d{4}[\s-]?\d{4}[\s-]?\d{4})\b"
)

# Candidate card numbers: 13-19 digits, optionally grouped with spaces/hyphens.
_CARD_CANDIDATE = re.compile(r"(?<![\d])(?:\d[ -]?){12,18}\d(?![\d])")

_CARD_CONTEXT = re.compile(r"(?i)\b(card|debit|credit|visa|mastercard|rupay)\b")

_PASSWORD_STOPWORDS = {"the", "your", "my", "a", "an", "is", "was", "not", "required", "incorrect"}


def _redact_value(match: re.Match[str]) -> str:
    """Keep everything before the final captured group, replace that value.

    Every credential pattern captures the secret as its last group, so the text
    (labels, verbs and filler) is preserved verbatim for rule matching.
    """
    last_group = match.lastindex
    if last_group is None:
        return match.group(0)
    prefix = match.string[match.start() : match.start(last_group)]
    return prefix + REDACTED


def _luhn_valid(digits: str) -> bool:
    """Return True when ``digits`` passes the Luhn checksum."""
    total = 0
    reverse = digits[::-1]
    for index, char in enumerate(reverse):
        value = int(char)
        if index % 2 == 1:
            value *= 2
            if value > 9:
                value -= 9
        total += value
    return total % 10 == 0


def _mask_cards(text: str) -> str:
    """Mask card numbers, preferring Luhn-valid candidates or explicit context."""

    def replace(match: re.Match[str]) -> str:
        candidate = match.group(0)
        digits = re.sub(r"\D", "", candidate)
        if not 13 <= len(digits) <= 19:
            return candidate
        start = max(0, match.start() - 24)
        context = text[start : match.start()]
        if _luhn_valid(digits) or _CARD_CONTEXT.search(context):
            return REDACTED
        return candidate

    return _CARD_CANDIDATE.sub(replace, text)


def _mask_passwords(text: str) -> str:
    """Mask a password value that follows an explicit separator."""

    def replace(match: re.Match[str]) -> str:
        value = match.group(3)
        if value == REDACTED or value.lower() in _PASSWORD_STOPWORDS:
            return match.group(0)
        return f"{match.group(1)}{match.group(2)}{REDACTED}"

    return _PASSWORD_PATTERN.sub(replace, text)


def mask_sensitive_text(text: str) -> str:
    """Return ``text`` with credential values replaced by ``[REDACTED]``.

    The function is safe to call on already masked text: it produces the same
    result on a second pass.
    """
    if not text or not isinstance(text, str):
        return text

    masked = _OTP_PATTERN.sub(_redact_value, text)
    masked = _UPI_PIN_PATTERN.sub(_redact_value, masked)
    masked = _PIN_BEFORE_VERB_PATTERN.sub(_redact_value, masked)
    masked = _PIN_AFTER_VERB_PATTERN.sub(_redact_value, masked)
    masked = _CVV_PATTERN.sub(_redact_value, masked)
    masked = _mask_passwords(masked)
    masked = _ACCOUNT_PATTERN.sub(_redact_value, masked)
    masked = _AADHAAR_PATTERN.sub(_redact_value, masked)
    masked = _mask_cards(masked)
    return masked
