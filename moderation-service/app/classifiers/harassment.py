import re
from typing import Tuple, List

# Threat patterns
THREAT_PATTERNS = [
    r"\b(i\s+will\s+kill\s+you|gonna\s+hunt\s+you\s+down|shoot\s+you|slit\s+your\s+throat)\b",
    r"\b(beat\s+the\s+shit\s+out\s+of\s+you|break\s+your\s+neck|punch\s+your\s+face)\b",
    r"\b(watch\s+your\s+back|you\s+won'?t\s+survive|you\s+are\s+dead\s+meat)\b"
]

# Doxxing / privacy invasion patterns
DOXXING_PATTERNS = [
    r"\b(his\s+real\s+name\s+is|her\s+real\s+name\s+is|their\s+real\s+name\s+is)\b",
    r"\b(lives\s+at|address\s+is|phone\s+number\s+is|ssn\s+is|credit\s+card)\b",
    r"\b\d{3}[-.\s]??\d{3}[-.\s]??\d{4}\b", # Phone numbers
    r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b" # Email disclosure
]

# Targeted persistent harassment
HARASSMENT_PATTERNS = [
    r"\b(stalking\s+you|found\s+where\s+you\s+live|leaking\s+your|exposing\s+you)\b",
    r"\b(nobody\s+likes\s+you|everyone\s+hates\s+you|worthless\s+freak)\b"
]

def analyze_harassment(text: str) -> Tuple[float, float, List[str]]:
    text_lower = text.lower()
    flagged = []
    threat_score = 0.0
    harassment_score = 0.0

    # Threats
    threat_matches = 0
    for pattern in THREAT_PATTERNS:
        matches = re.findall(pattern, text_lower)
        if matches:
            threat_matches += len(matches)
            for m in matches:
                flagged.append(m if isinstance(m, str) else m[0])

    if threat_matches > 0:
        threat_score = min(1.0, 0.70 + (threat_matches * 0.15))

    # Harassment & Doxxing
    harass_matches = 0
    for pattern in HARASSMENT_PATTERNS:
        matches = re.findall(pattern, text_lower)
        if matches:
            harass_matches += len(matches)
            for m in matches:
                flagged.append(m if isinstance(m, str) else m[0])

    for pattern in DOXXING_PATTERNS:
        matches = re.findall(pattern, text)
        if matches:
            harass_matches += len(matches)
            flagged.append("private_data_leakage")

    if harass_matches > 0:
        harassment_score = min(1.0, 0.50 + (harass_matches * 0.20))
    elif threat_score > 0:
        harassment_score = threat_score * 0.85

    return round(harassment_score, 3), round(threat_score, 3), list(set(flagged))
