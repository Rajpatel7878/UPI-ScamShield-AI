"""Tests for conservative credential masking before rule and AI analysis."""

import pytest

from app.services.privacy.masking import REDACTED, mask_sensitive_text


@pytest.mark.parametrize(
    ("message", "secret"),
    [
        ("Your OTP is 482913", "482913"),
        ("OTP 123456 to verify your account", "123456"),
        ("Your one-time password: 7712", "7712"),
        ("Verification code 556677", "556677"),
    ],
)
def test_otp_values_are_masked(message, secret):
    masked = mask_sensitive_text(message)

    assert secret not in masked
    assert REDACTED in masked
    # The credential label survives so rule detection still matches.
    assert "otp" in masked.lower() or "one-time" in masked.lower() or "code" in masked.lower()


@pytest.mark.parametrize(
    ("message", "secret"),
    [
        ("Your UPI PIN is 1234", "1234"),
        ("Enter UPI PIN 4821 to approve", "4821"),
        ("M-PIN 7788 for this payment", "7788"),
        ("PIN enter karo 1234", "1234"),
        ("Please share pin 9091 with support", "9091"),
    ],
)
def test_upi_pin_values_are_masked(message, secret):
    masked = mask_sensitive_text(message)

    assert secret not in masked
    assert REDACTED in masked


@pytest.mark.parametrize(
    ("message"),
    [
        "Card 4111 1111 1111 1111 was used",
        "Your debit card 4111-1111-1111-1111 expired",
        "Use card 5555 5555 5555 4444 now",
    ],
)
def test_card_numbers_are_masked(message):
    masked = mask_sensitive_text(message)

    assert "4111" not in masked
    assert "5555" not in masked
    assert REDACTED in masked


def test_non_luhn_card_with_explicit_context_is_masked():
    masked = mask_sensitive_text("Debit card 1111 2222 3333 4445 blocked")

    assert "1111" not in masked
    assert REDACTED in masked


def test_cvv_password_account_and_aadhaar_are_masked():
    cvv = mask_sensitive_text("CVV 987 for your card")
    password = mask_sensitive_text("Your password is Secret123 please change it")
    account = mask_sensitive_text("Account number 123456789012 is unverified")
    aadhaar = mask_sensitive_text("Aadhaar 1234 5678 9012 linked")

    assert "987" not in cvv
    assert "Secret123" not in password
    assert "123456789012" not in account
    assert "1234 5678 9012" not in aadhaar
    assert "1234" not in aadhaar
    for masked in (cvv, password, account, aadhaar):
        assert REDACTED in masked
        # Labels are preserved for rule matching.
        assert masked.strip()


@pytest.mark.parametrize(
    "message",
    [
        "Your payment of Rs 5,000 was successful",
        "Order 123456 has been shipped",
        "The link is valid for 10 minutes",
        "Let us meet at 4:30 near the bank",
        "Your OTP has been generated",
        "You won a cashback of 200 on order 778899",
        "Flight AI 202 departs at 6",
    ],
)
def test_ordinary_numbers_are_not_masked(message):
    assert mask_sensitive_text(message) == message


def test_masking_is_idempotent():
    once = mask_sensitive_text("OTP 482913, UPI PIN 1234, card 4111 1111 1111 1111")
    twice = mask_sensitive_text(once)

    assert once == twice
    assert "482913" not in once
    assert "1234" not in once
    assert "4111" not in once
