import re
from typing import Tuple, List

# Comprehensive list of badwords, profanities, slurs, and hostile attacks
BADWORDS_LIST = [
    # Severe profanities and slurs
    r"\b(fuck|fucking|fucker|fucked|motherfucker|shit|bullshit|bitch|bastard|asshole|dipshit|dick|cunt|slut|whore)\b",
    # Hostile insults and derogatory attacks
    r"\b(idiot|moron|stupid|dumbass|retard|retarded|loser|worthless|scum|freak|garbage\s+person|clown)\b",
    # Hate and violence
    r"\b(kill\s+yourself|kys|die|die\s+in\s+a\s+fire|burn\s+in\s+hell|i\s+will\s+kill\s+you|hunt\s+you\s+down)\b",
    r"\b(hate\s+you|hate\s+all|nazi|hitler|subhuman|vermin)\b",
    # Scams and shady abuse
    r"\b(scammer|scam|stfu|shut\s+the\s+fuck\s+up|piss\s+off|get\s+lost)\b"
]

def detect_badwords(text: str) -> List[str]:
    text_lower = text.lower()
    flagged = []
    for pattern in BADWORDS_LIST:
        matches = re.findall(pattern, text_lower)
        if matches:
            for m in matches:
                flagged.append(m if isinstance(m, str) else m[0])
    return list(set(flagged))

def censor_text(text: str) -> str:
    cleaned = text
    for pattern in BADWORDS_LIST:
        def replace_match(match):
            word = match.group(0)
            if len(word) <= 2:
                return "**"
            return word[0] + ("*" * (len(word) - 2)) + word[-1]
        cleaned = re.sub(pattern, replace_match, cleaned, flags=re.IGNORECASE)
    return cleaned

def calculate_negativity(text: str) -> float:
    text_lower = text.lower()
    negative_signals = [
        r"\b(hate|terrible|awful|worst|horrible|disgusting|useless|pathetic|fail|ruined|trash)\b",
        r"\b(never|cannot|impossible|hopeless|worthless|corrupt|evil|stupid|liar|fraud)\b",
        r"(!{2,}|\?{2,})"
    ]
    points = 0.0
    for pattern in negative_signals:
        matches = re.findall(pattern, text_lower)
        points += len(matches) * 0.15

    badwords = detect_badwords(text)
    if badwords:
        points += len(badwords) * 0.35

    return round(min(1.0, points), 3)
