from typing import Dict, Any
from app.models.schemas import ModerationResponse, RiskLevel, ActionRecommended, InstantAction
from app.classifiers.toxicity import analyze_toxicity
from app.classifiers.harassment import analyze_harassment
from app.classifiers.spam import analyze_spam
from app.classifiers.badwords import detect_badwords, censor_text, calculate_negativity

def evaluate_content(content: str, title: str = None, target_type: str = "post") -> ModerationResponse:
    full_text = f"{title}\n{content}" if title else content

    tox_score, tox_flags = analyze_toxicity(full_text)
    harass_score, threat_score, harass_flags = analyze_harassment(full_text)
    spam_score, spam_flags = analyze_spam(full_text)
    negativity_score = calculate_negativity(full_text)
    badwords = detect_badwords(full_text)
    cleaned_content = censor_text(content)

    all_flags = list(set(tox_flags + harass_flags + spam_flags + badwords))

    # Calculate aggregate max risk
    primary_risk_score = max(tox_score, harass_score, threat_score, spam_score)

    # Determine Instant Action:
    # If explicit bad words, violent threats, or severe toxicity (> 0.70) are detected:
    # INSTANT ACTION: BLOCKED!
    instant_action = InstantAction.PASSED
    block_reason = None

    if len(badwords) > 0 or threat_score >= 0.70 or tox_score >= 0.70:
        risk_level = RiskLevel.HIGH
        recommended_action = ActionRecommended.BLOCK
        instant_action = InstantAction.BLOCKED
        is_safe = False
        reasons = []
        if badwords:
            reasons.append(f"Prohibited language detected: {', '.join(badwords[:4])}")
        if threat_score >= 0.70:
            reasons.append("Violent threat detected")
        if tox_score >= 0.70:
            reasons.append("Severe toxicity detected")
        block_reason = "; ".join(reasons)
        summary = f"Blocked instantly: {block_reason}"
    elif primary_risk_score >= 0.40 or negativity_score >= 0.60:
        risk_level = RiskLevel.MEDIUM
        recommended_action = ActionRecommended.REVIEW
        instant_action = InstantAction.CLEANED if badwords else InstantAction.PASSED
        summary = "Medium negativity or risk detected. Flagged for review."
        is_safe = False
    else:
        risk_level = RiskLevel.LOW
        recommended_action = ActionRecommended.PUBLISH
        instant_action = InstantAction.PASSED
        summary = "Content is clean, positive, and compliant."
        is_safe = True

    return ModerationResponse(
        toxicity_score=tox_score,
        harassment_score=harass_score,
        spam_score=spam_score,
        threat_score=threat_score,
        negativity_score=negativity_score,
        risk_level=risk_level,
        recommended_action=recommended_action,
        instant_action=instant_action,
        flagged_keywords=all_flags,
        detected_badwords=badwords,
        cleaned_content=cleaned_content,
        is_safe=is_safe,
        summary=summary,
        block_reason=block_reason
    )
