"""Centralized rule definitions for the rule-based fraud detection engine.

Each rule contains:

- Unique rule ID
- Rule name
- Category
- Description
- Severity
- Detection pattern or matching function
- Explanation shown to the user
- Recommended safety action
- Score contribution

Rules are kept separate from scoring and response formatting so that Gemini
integration and hybrid scoring can be added in later phases.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable, Optional
import re

from .text_normalizer import normalize_text, extract_urls, is_suspicious_shortened_url


RULE_ID_COUNTER = 1000


def _next_rule_id() -> int:
    """Generate the next unique rule ID."""
    global RULE_ID_COUNTER
    RULE_ID_COUNTER += 1
    return RULE_ID_COUNTER


@dataclass
class DetectionRule:
    """A single detection rule for the fraud engine.

    Rules are data classes so they can be easily serialized, filtered,
    extended, or loaded from configuration files.
    """

    rule_id: int
    name: str
    category: str
    description: str
    severity: str  # low, medium, high, critical
    pattern: str  # regex pattern (applied to normalized text)
    explanation: str  # user-facing explanation
    action: str  # recommended safety action
    score_contribution: int  # points added if rule matches

    # Optional: case-insensitive flag; if None, pattern is treated as case-insensitive
    case_insensitive: bool = True

    # Optional: callback function for more complex matching
    callback: Optional[Callable[[str], bool]] = None


# =============================================================================
# Pre-defined Rule Registry
# =============================================================================

# All 10 detection categories from the Phase 10 specification:
# 1. UPI PIN or OTP requests
# 2. Requests to share bank credentials
# 3. Fake KYC verification or account-blocking threats
# 4. Urgent payment demands
# 5. Fake cashback, lottery, prize, or reward claims
# 6. Requests for advance processing fees
# 7. Suspicious collect requests or payment approval instructions
# 8. Impersonation of banks, payment support, or government authorities
# 9. Suspicious shortened-link references or links included in messages
# 10. Threatening language intended to create panic

RULES: list[DetectionRule] = [
    # --- Rule 1: UPI PIN or OTP request ---
    DetectionRule(
        rule_id=_next_rule_id(),
        name="OTP Request",
        category="Credential Theft",
        description="Message asks the recipient to share an OTP or one-time password",
        severity="critical",
        pattern=r'(?i)\b(otp|one.?time.?password)\b',
        explanation="The message asks you to share an OTP. Never share your OTP or one-time password with anyone.",
        action="Never share your OTP with anyone. UPI apps never ask for OTPs outside the app.",
        score_contribution=35,
    ),
    # --- Rule 2: Request for UPI PIN ---
    DetectionRule(
        rule_id=_next_rule_id(),
        name="UPI PIN Request",
        category="Credential Theft",
        description="Message asks the recipient to share their UPI PIN",
        severity="critical",
        pattern=r'(?i)\b(upi.*pin|pin.*upi|pin.*request|enter.*pin|share.*pin)\b',
        explanation="The message asks you to enter or share your UPI PIN. A UPI PIN should only be entered by you inside your trusted payment app when intentionally authorizing a payment.",
        action="Never share your UPI PIN. Enter it only inside your trusted payment app when authorizing your own payment.",
        score_contribution=35,
    ),
    # --- Rule 3: Request for bank credentials ---
    DetectionRule(
        rule_id=_next_rule_id(),
        name="Bank Credential Request",
        category="Credential Theft",
        description="Message asks the recipient to share bank account details or credentials",
        severity="critical",
        pattern=r'(?i)\b(bank.*credential|credential.*bank|account.*details|details.*account|bank.*account|account.*number|debit.*card|credit.*card|cvv|ifsc)\b',
        explanation="The message asks you to share your bank credentials or account details. Your bank will never ask you to share your password, PIN, or full account details via message.",
        action="Never share your bank credentials or account details. Contact your bank directly using official channels.",
        score_contribution=35,
    ),
    # --- Rule 4: Fake KYC verification or account-blocking threats ---
    DetectionRule(
        rule_id=_next_rule_id(),
        name="Fake KYC / Account Blocking",
        category="Fake Verification",
        description="Message threatens account blocking or suspension unless KYC is verified",
        severity="high",
        pattern=r'(?i)\b(kyc|know.?your.?client)\b',
        explanation="The message mentions KYC verification and threatens account blocking. Your bank contacts you officially for KYC - never via unsolicited messages with threats.",
        action="Contact your bank using its official website or app. Do not respond to threats of account suspension.",
        score_contribution=20,
    ),
    # --- Rule 5: Account blocking/suspension threat (broader) ---
    DetectionRule(
        rule_id=_next_rule_id(),
        name="Account Blocking Threat",
        category="Fake Verification",
        description="Message threatens account blocking or suspension to induce action",
        severity="high",
        pattern=r'(?i)\b(account.*suspend|suspend.*account|block.*account|account.*block|your.*account.*will.*be.*closed|will.*be.*deleted)\b',
        explanation="The message threatens to block or suspend your account. Banks and payment platforms do not suspend accounts via unsolicited messages with urgent demands.",
        action="Log in to your bank or payment app directly (via official app/website). Do not call numbers or click links from the message.",
        score_contribution=20,
    ),
    # --- Rule 6: Urgent payment demands ---
    DetectionRule(
        rule_id=_next_rule_id(),
        name="Urgent Payment Demand",
        category="Pressure Tactic",
        description="Message creates urgency to make an immediate payment",
        severity="medium",
        pattern=r'(?i)\b(urgent|immediately|right now|asap|quick|emergency)\b',
        explanation="The message creates pressure to pay immediately. Scammers use urgency to prevent you from thinking carefully or verifying independently.",
        action="Verify the request independently through your bank's official channel before transferring money.",
        score_contribution=15,
    ),
    # --- Rule 7: Fake cashback, lottery, prize, or reward claims ---
    DetectionRule(
        rule_id=_next_rule_id(),
        name="Fake Cashback / Lottery / Prize",
        category="Fake Reward",
        description="Message claims you've won a cashback, lottery, prize, or reward",
        severity="medium",
        pattern=r'(?i)\b(cashback|lottery|lotto|prize|reward|win.*won|won.*you|you.*won)\b',
        explanation="The message claims you've won a cashback, lottery prize, or reward. If you didn't enter a contest, it's likely a scam. Legitimate rewards come from programs you joined.",
        action="Do not click links or provide details. Verify any reward program through official channels.",
        score_contribution=20,
    ),
    # --- Rule 8: Advance processing fee request ---
    DetectionRule(
        rule_id=_next_rule_id(),
        name="Advance Processing Fee",
        category="Advance Fee",
        description="Message requests an advance processing fee or release fee",
        severity="high",
        pattern=r'(?i)\b(processing fee|release fee|clearance fee|administrative fee|handling fee|transfer fee|fee.*release|release.*fee)\b',
        explanation="The message requests an advance payment or processing fee. Legitimate services deduct fees from the amount due - they never ask you to pay upfront to receive money.",
        action="Never pay an advance processing fee. Legitimate organizations do not require upfront payments to release funds.",
        score_contribution=20,
    ),
    # --- Rule 9: Suspicious collect requests or payment approval instructions ---
    DetectionRule(
        rule_id=_next_rule_id(),
        name="Suspicious Collect Request",
        category="Payment Fraud",
        description="Message contains collect payment requests or payment approval instructions",
        severity="high",
        pattern=r'(?i)\b(collect|payment.*approve|approve.*payment|pay.*now|send.*money|transfer.*money)\b',
        explanation="The message contains a collect payment request or payment approval instruction. Only approve payments you consciously initiated through your trusted payment app.",
        action="Do not approve unknown collect requests. Verify payment requests independently through your bank.",
        score_contribution=25,
    ),
    # --- Rule 10: Impersonation indicators ---
    DetectionRule(
        rule_id=_next_rule_id(),
        name="Impersonation - Bank/Support/Government",
        category="Impersonation",
        description="Message impersonates banks, payment support, or government authorities",
        severity="high",
        pattern=r'(?i)\b(irs|income.?tax|police|cyber\.crime|bank.*support|support\.bank|upi\.help|scamshield|fraud\.alert)\b',
        explanation="The message impersonates an official authority (IRS, police, bank support). Government agencies and banks do not contact you via unsolicited messages to report fraud or demand payment.",
        action="Verify independently through official contact channels. Government and banks do not message you first about fraud.",
        score_contribution=15,
    ),
    # --- Rule 11: Suspicious URL indicators ---
    DetectionRule(
        rule_id=_next_rule_id(),
        name="Suspicious URL",
        category="Suspicious Link",
        description="Message contains suspicious or unexpected URLs",
        severity="medium",
        pattern=r'(?i)\b(https?://|www\.)\S+[^\s.,;!?\]\}>"]?\b',
        explanation="The message contains a URL link. Be cautious about clicking links from unknown senders. Verify the source before opening.",
        action="Do not open the link or enter personal information. Hover over links to inspect the destination.",
        score_contribution=15,
    ),
    # --- Rule 12: Threatening or panic language ---
    DetectionRule(
        rule_id=_next_rule_id(),
        name="Threatening Language",
        category="Pressure Tactic",
        description="Message uses threatening or panic-inducing language",
        severity="low",
        pattern=r'(?i)\b(freeze|lock|penalty|legal action|lawsuit|arrest|immediate|act now|or else|consequences|dire consequences)\b',
        explanation="The message uses threatening or panic-inducing language. Scammers use fear to make you act without thinking. Stay calm and verify independently.",
        action="Stay calm and verify the request independently through official channels. Do not act based on threats alone.",
        score_contribution=10,
    ),
]


# Rule name to rule object mapping for quick lookup
RULE_NAME_MAP: dict[str, DetectionRule] = {
    rule.name: rule for rule in RULES
}


# Category aggregation rules: which categories should be grouped together
CATEGORY_GROUPS = {
    "Credential Theft": [
        "OTP Request",
        "UPI PIN Request",
        "Bank Credential Request",
    ],
    "Fake Verification": [
        "Fake KYC / Account Blocking",
        "Account Blocking Threat",
    ],
    "Pressure Tactic": [
        "Urgent Payment Demand",
        "Threatening Language",
    ],
    "Fake Reward": [
        "Fake Cashback / Lottery / Prize",
    ],
    "Advance Fee": [
        "Advance Processing Fee",
    ],
    "Payment Fraud": [
        "Suspicious Collect Request",
    ],
    "Impersonation": [
        "Impersonation - Bank/Support/Government",
    ],
    "Suspicious Link": [
        "Suspicious URL",
    ],
}


def get_rule_by_id(rule_id: int) -> DetectionRule | None:
    """Get a rule by its unique ID."""
    for rule in RULES:
        if rule.rule_id == rule_id:
            return rule
    return None


def get_rules_by_category(category: str) -> list[DetectionRule]:
    """Get all rules belonging to a specific category."""
    return [rule for rule in RULES if rule.category == category]


def get_all_rules() -> list[DetectionRule]:
    """Get all registered detection rules."""
    return RULES.copy()


def get_rule_names_by_category(category: str) -> list[str]:
    """Get rule names belonging to a specific category."""
    rules = get_rules_by_category(category)
    return [rule.name for rule in rules]


# Score contribution mapping for quick lookup
SCORE_CONTRIBUTION_MAP: dict[str, int] = {
    rule.name: rule.score_contribution for rule in RULES
}


# Severity mapping for quick lookup
SEVERITY_MAP: dict[str, str] = {
    rule.name: rule.severity for rule in RULES
}
