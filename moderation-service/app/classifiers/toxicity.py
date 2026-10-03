import re
from typing import Tuple, List

# Core high-severity toxic/hate patterns
SEVERE_TOXIC_TERMS = [
    r"\b(hate\s+all|kill\s+yourself|kys|die\s+in\s+a\s+fire|you\s+should\s+die)\b",
    r"\b(subhuman|vermin|filth|scum\s+of\s+the\s+earth)\b",
    r"\b(slut|whore|bitch|bastard|asshole|motherfucker|dipshit)\b",
    r"\b(nazi|hitler\s+was\s+right|white\s+supremacy|terrorist\s+scum)\b"
]

# Medium toxicity / offensive profanity
MILD_TOXIC_TERMS = [
    r"\b(idiot|moron|stupid|dumbass|retard|retarded|pathetic|loser|clown|piece\s+of\s+shit)\b",
    r"\b(fuck\s+off|shut\s+up|get\s+lost|screw\s+you|piss\s+off)\b",
    r"\b(bullshit|crap|damn|garbage\s+opinion)\b"
]

def analyze_toxicity(text: str) -> Tuple[float, List[str]]:
    text_lower = text.lower()
    flagged = []
    severe_matches = 0
    mild_matches = 0

    for pattern in SEVERE_TOXIC_TERMS:
        matches = re.findall(pattern, text_lower)
        if matches:
            severe_matches += len(matches)
            for m in matches:
                flagged.append(m if isinstance(m, str) else m[0])

    for pattern in MILD_TOXIC_TERMS:
        matches = re.findall(pattern, text_lower)
        if matches:
            mild_matches += len(matches)
            for m in matches:
                flagged.append(m if isinstance(m, str) else m[0])

    # Calculate score
    score = 0.0
    if severe_matches > 0:
        score = min(1.0, 0.65 + (severe_matches * 0.15))
    elif mild_matches > 0:
        score = min(0.60, 0.25 + (mild_matches * 0.12))

    # Aggressive punctuation/caps boost
    caps_ratio = sum(1 for c in text if c.isupper()) / (len(text) + 1)
    if caps_ratio > 0.4 and len(text) > 15:
        score = min(1.0, score + 0.15)

    return round(score, 3), list(set(flagged))
