import axios from 'axios';

const MODERATION_URL = process.env.MODERATION_SERVICE_URL || 'http://localhost:8000';

// Native Node.js Badwords, profanity & toxic terms dictionary
const BADWORDS_REGEX = [
  /\b(fuck|fucking|fucker|fucked|motherfucker|shit|bullshit|bitch|bastard|asshole|dipshit|dick|cunt|slut|whore)\b/gi,
  /\b(idiot|moron|stupid|dumbass|retard|retarded|loser|worthless|scum|freak|garbage\s+person|clown)\b/gi,
  /\b(kill\s+yourself|kys|die\s+in\s+a\s+fire|burn\s+in\s+hell|i\s+will\s+kill\s+you|hunt\s+you\s+down)\b/gi,
  /\b(hate\s+you|hate\s+all|nazi|hitler|subhuman|vermin)\b/gi,
  /\b(scammer|scam|stfu|shut\s+the\s+fuck\s+up|piss\s+off|get\s+lost)\b/gi
];

const NEGATIVE_TERMS = [
  /\b(hate|terrible|awful|worst|horrible|disgusting|useless|pathetic|fail|ruined|trash)\b/gi,
  /\b(hopeless|worthless|corrupt|evil|stupid|liar|fraud)\b/gi
];

// Scam / Phishing patterns (Feature 10)
const SCAM_REGEX = [
  /\b(congratulations!?\s+you\s+(have\s+)?won|claim\s+your\s+(prize|reward|cash)|cash\s+prize|jackpot|free\s+money)\b/gi,
  /\b(₹\s*[0-9,]{3,}|(?:rs\.?|inr)\s*[0-9,]{3,})\b.*?\b(click|claim|transfer|won|deposit)\b/gi,
  /\b(double\s+your\s+(money|crypto|investment|bitcoin)|crypto\s+giveaway|guaranteed\s+(returns|profits)|100%\s+daily\s+profit)\b/gi,
  /\b(send\s+(money|otp|pin|crypto|btc)|verify\s+your\s+(bank|account|wallet)|click\s+here\s+to\s+claim)\b/gi,
  /\b(bit\.ly|tinyurl\.com|t\.me\/[a-zA-Z0-9_]+|wa\.me\/[0-9]+)\b/gi
];

export function detectScamOrPhishing(text) {
  for (const regex of SCAM_REGEX) {
    if (regex.test(text)) {
      return {
        isPotentialScam: true,
        scamReason: "This discussion contains suspicious promotional or payment-related content."
      };
    }
  }
  return { isPotentialScam: false, scamReason: null };
}

export function detectBadwordsNative(text) {
  const flagged = new Set();
  for (const regex of BADWORDS_REGEX) {
    const matches = text.match(regex);
    if (matches) {
      matches.forEach(m => flagged.add(m.toLowerCase()));
    }
  }
  return Array.from(flagged);
}

export function censorTextNative(text) {
  let cleaned = text;
  for (const regex of BADWORDS_REGEX) {
    cleaned = cleaned.replace(regex, (match) => {
      if (match.length <= 2) return "**";
      return match[0] + '*'.repeat(match.length - 2) + match[match.length - 1];
    });
  }
  return cleaned;
}

export function calculateNegativityNative(text) {
  let count = 0;
  for (const regex of NEGATIVE_TERMS) {
    const matches = text.match(regex);
    if (matches) count += matches.length;
  }
  const badwords = detectBadwordsNative(text);
  count += badwords.length * 2;
  const score = Math.min(1.0, count * 0.2);
  return parseFloat(score.toFixed(2));
}

export async function analyzeContentWithAI(content, title = null, targetType = 'post') {
  const fullText = title ? `${title}\n${content}` : content;

  // 1. Check local native detection first for instantaneous response
  const nativeBadwords = detectBadwordsNative(fullText);
  const nativeNegativity = calculateNegativityNative(fullText);
  const nativeCleaned = censorTextNative(content);
  const scamCheck = detectScamOrPhishing(fullText);

  const requiresConfirmation = nativeBadwords.length === 0 && nativeNegativity >= 0.40;
  const confirmationPrompt = requiresConfirmation
    ? "This message may come across as aggressive. Would you like to edit it, or post anyway?"
    : null;

  // If severe badwords detected natively, we can instantly block
  if (nativeBadwords.length > 0) {
    return {
      toxicityScore: 0.85,
      harassmentScore: 0.75,
      spamScore: scamCheck.isPotentialScam ? 0.9 : 0.0,
      threatScore: 0.0,
      negativityScore: nativeNegativity,
      riskLevel: 'HIGH',
      recommendedAction: 'block',
      instantAction: 'BLOCKED',
      flaggedKeywords: nativeBadwords,
      detectedBadwords: nativeBadwords,
      cleanedContent: nativeCleaned,
      isSafe: false,
      summary: `Prohibited language detected: ${nativeBadwords.join(', ')}`,
      blockReason: `Prohibited language detected: ${nativeBadwords.join(', ')}`,
      isPotentialScam: scamCheck.isPotentialScam,
      scamReason: scamCheck.scamReason,
      requiresConfirmation: false,
      confirmationPrompt: null
    };
  }

  // 2. Query Python FastAPI service for advanced NLP analysis if available
  try {
    const res = await axios.post(`${MODERATION_URL}/api/v1/moderate`, {
      content,
      title,
      target_type: targetType
    }, { timeout: 2500 });

    const data = res.data;
    return {
      toxicityScore: data.toxicity_score,
      harassmentScore: data.harassment_score,
      spamScore: scamCheck.isPotentialScam ? 0.95 : data.spam_score,
      threatScore: data.threat_score,
      negativityScore: data.negativity_score || nativeNegativity,
      riskLevel: data.risk_level.toUpperCase(),
      recommendedAction: data.recommended_action,
      instantAction: data.instant_action || (data.is_safe ? 'PASSED' : 'BLOCKED'),
      flaggedKeywords: data.flagged_keywords || [],
      detectedBadwords: data.detected_badwords || nativeBadwords,
      cleanedContent: data.cleaned_content || nativeCleaned,
      isSafe: data.is_safe,
      summary: data.summary,
      blockReason: data.block_reason,
      isPotentialScam: scamCheck.isPotentialScam,
      scamReason: scamCheck.scamReason,
      requiresConfirmation,
      confirmationPrompt
    };
  } catch (err) {
    // Graceful fallback to native AI engine
    const isSafe = nativeNegativity < 0.60;
    return {
      toxicityScore: nativeNegativity * 0.8,
      harassmentScore: 0.0,
      spamScore: scamCheck.isPotentialScam ? 0.95 : 0.0,
      threatScore: 0.0,
      negativityScore: nativeNegativity,
      riskLevel: isSafe ? 'LOW' : 'MEDIUM',
      recommendedAction: isSafe ? 'publish' : 'review',
      instantAction: isSafe ? 'PASSED' : 'CLEANED',
      flaggedKeywords: [],
      detectedBadwords: [],
      cleanedContent: nativeCleaned,
      isSafe,
      summary: isSafe ? "Content compliant" : "Mild negativity detected",
      blockReason: null,
      isPotentialScam: scamCheck.isPotentialScam,
      scamReason: scamCheck.scamReason,
      requiresConfirmation,
      confirmationPrompt
    };
  }
}
