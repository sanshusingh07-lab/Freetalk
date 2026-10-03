import re
from typing import Tuple, List

SPAM_KEYWORDS = [
    r"\b(free\s+crypto|airdrop|guaranteed\s+profit|invest\s+now|earn\s+\$\d+)\b",
    r"\b(telegram\s+channel|t\.me\/|wa\.me\/|dm\s+for\s+crypto|whatsapp\s+group)\b",
    r"\b(click\s+here\s+now|limited\s+time\s+offer|claim\s+your\s+reward|winner\s+selected)\b",
    r"\b(casino|viagra|cialis|replica\s+watches|buy\s+followers|seo\s+service)\b"
]

def analyze_spam(text: str) -> Tuple[float, List[str]]:
    text_lower = text.lower()
    flagged = []
    spam_points = 0.0

    # Keyword scanning
    for pattern in SPAM_KEYWORDS:
        matches = re.findall(pattern, text_lower)
        if matches:
            spam_points += len(matches) * 0.3
            for m in matches:
                flagged.append(m if isinstance(m, str) else m[0])

    # Excessive URLs
    urls = re.findall(r"https?://[^\s]+", text)
    if len(urls) > 2:
        spam_points += 0.35 + (len(urls) * 0.1)
        flagged.append(f"{len(urls)}_urls_detected")

    # Character repetition (e.g. "aaaaaaaahhhhhhh" or "buy buy buy buy buy")
    repeats = re.findall(r"(.)\1{4,}", text_lower)
    if repeats:
        spam_points += 0.2
        flagged.append("character_repetition")

    words = re.findall(r"\b\w+\b", text_lower)
    if len(words) > 8:
        unique_ratio = len(set(words)) / len(words)
        if unique_ratio < 0.35:
            spam_points += 0.35
            flagged.append("word_repetition")

    score = min(1.0, spam_points)
    return round(score, 3), list(set(flagged))
