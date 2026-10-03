import axios from 'axios';
import { MODERATION_THRESHOLDS } from '../config/constants.js';

const MODERATION_URL = process.env.MODERATION_SERVICE_URL || 'http://localhost:8000';

export async function analyzeContent(content, title = null, targetType = 'post') {
  try {
    const response = await axios.post(`${MODERATION_URL}/api/v1/moderate`, {
      content,
      title,
      target_type: targetType
    }, { timeout: 3500 });

    const data = response.data;
    return {
      toxicityScore: data.toxicity_score,
      harassmentScore: data.harassment_score,
      spamScore: data.spam_score,
      threatScore: data.threat_score,
      riskLevel: data.risk_level.toUpperCase(),
      recommendedAction: data.recommended_action,
      flaggedKeywords: data.flagged_keywords || [],
      isSafe: data.is_safe,
      summary: data.summary
    };
  } catch (err) {
    console.warn(`[ModerationService] Python service fallback (${err.message}). Using local rule engine.`);
    return localRuleFallback(content, title);
  }
}

function localRuleFallback(content, title) {
  const fullText = (title ? `${title} ${content}` : content).toLowerCase();
  
  const severeToxicity = /(hate\s+all|kill\s+yourself|kys|die\s+in\s+a\s+fire|subhuman|nazi)/i;
  const threatPattern = /(i\s+will\s+kill\s+you|hunt\s+you\s+down|shoot\s+you|slit\s+your\s+throat)/i;
  const mildToxicity = /(idiot|moron|stupid|dumbass|retard|loser|fuck\s+off)/i;
  const spamPattern = /(free\s+crypto|airdrop|guaranteed\s+profit|telegram\s+channel|t\.me\/)/i;

  let tox = 0.0, harass = 0.0, threat = 0.0, spam = 0.0;
  const flagged = [];

  if (threatPattern.test(fullText)) {
    threat = 0.90;
    harass = 0.85;
    flagged.push("threat");
  } else if (severeToxicity.test(fullText)) {
    tox = 0.80;
    flagged.push("severe_toxicity");
  } else if (mildToxicity.test(fullText)) {
    tox = 0.50;
    flagged.push("mild_toxicity");
  }

  if (spamPattern.test(fullText)) {
    spam = 0.75;
    flagged.push("spam");
  }

  const maxRisk = Math.max(tox, harass, threat, spam);
  let riskLevel = 'LOW';
  let recommendedAction = 'publish';
  let isSafe = true;

  if (maxRisk >= MODERATION_THRESHOLDS.HIGH_RISK_MIN) {
    riskLevel = 'HIGH';
    recommendedAction = 'block';
    isSafe = false;
  } else if (maxRisk >= MODERATION_THRESHOLDS.LOW_RISK_MAX) {
    riskLevel = 'MEDIUM';
    recommendedAction = 'review';
    isSafe = false;
  }

  return {
    toxicityScore: tox,
    harassmentScore: harass,
    spamScore: spam,
    threatScore: threat,
    riskLevel,
    recommendedAction,
    flaggedKeywords: flagged,
    isSafe,
    summary: isSafe ? "Compliant" : "Potential risk detected"
  };
}
