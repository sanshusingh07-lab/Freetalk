import { analyzeContentWithAI } from './aiModerator.js';
import { analyzeTopicTrends } from './aiTopicAnalyzer.js';

export async function processAssistantQuery(query, chatHistory = [], userContext = null) {
  const queryLower = query.toLowerCase().trim();

  // 1. Check if user is asking to analyze or improve a post draft
  const isDraftCheck = queryLower.includes('check my draft') || 
                       queryLower.includes('analyze this') || 
                       queryLower.includes('is this safe') ||
                       queryLower.includes('review my post') ||
                       queryLower.startsWith('draft:') ||
                       queryLower.startsWith('text:');

  if (isDraftCheck) {
    const rawText = query.replace(/^(check my draft|analyze this|is this safe to post|review my post|draft:|text:)/i, '').trim();
    const analysis = await analyzeContentWithAI(rawText || query);

    let advice = "";
    if (analysis.detectedBadwords.length > 0) {
      advice = `⚠️ **Flagged Prohibited Language**: I detected prohibited or abusive terms (${analysis.detectedBadwords.join(', ')}). FreeTalk's safety filter will immediately block this content.\n\n💡 **Suggested Constructive Rephrase**:\n> "${analysis.cleanedContent.replace(/\*{2,}/g, '[constructive term]')}"`;
    } else if (analysis.negativityScore > 0.6) {
      advice = `⚠️ **High Negativity Detected**: Your draft carries a hostile or aggressive tone. While strong disagreement is welcomed, focus on challenging the premise rather than attacking the speaker.`;
    } else {
      advice = `✅ **Clean & Compliant**: Your draft has low toxicity (score: ${Math.round(analysis.toxicityScore * 100)}%) and is ready for anonymous publishing!`;
    }

    return {
      reply: `Here is my AI Safety & Quality Audit of your draft:\n\n${advice}`,
      actionType: "DRAFT_AUDIT",
      data: {
        isSafe: analysis.isSafe,
        detectedBadwords: analysis.detectedBadwords,
        negativityScore: analysis.negativityScore,
        cleanedContent: analysis.cleanedContent
      }
    };
  }

  // 2. Privacy & Anonymity inquiries
  if (queryLower.includes('privacy') || queryLower.includes('anonymous') || queryLower.includes('identity') || queryLower.includes('real name')) {
    return {
      reply: `🔒 **How FreeTalk Guarantees Your Privacy**:\n\n1. **Zero Credential Exposure**: Your internal email and credentials are encrypted using Argon2 and never included in public API payloads.\n2. **Abstract Personas**: You interact exclusively via generated identities like **${userContext?.activeIdentity?.displayName || "Anonymous Fox"}** with geometric SVG avatars.\n3. **Disappearing Identities**: When creating sensitive discussions, toggle "Use Temporary Alias" so the post cannot be connected to your other activities.\n4. **No Follower Culture**: There are no follower counts or popularity contests.\n\nTo view your personal audit, visit the **Privacy Center** (your Privacy Score is currently **94/100**)!`,
      actionType: "PRIVACY_GUIDE",
      suggestedLinks: [{ label: "Open Privacy Center", to: "/privacy-center" }]
    };
  }

  // 3. Trending Topics inquiries
  if (queryLower.includes('trending') || queryLower.includes('popular') || queryLower.includes('topics')) {
    const trends = await analyzeTopicTrends();
    const top3 = trends.slice(0, 3).map(t => `#${t.name} (${t.velocityScore} velocity points - ${t.aiSummary})`).join('\n• ');

    return {
      reply: `🔥 **AI Topic Trend Telemetry**:\n\nHere are the most active discussions being analyzed right now across the network:\n\n• ${top3}\n\nJoin these communities to share your perspective!`,
      actionType: "TRENDING_TOPICS",
      suggestedLinks: [{ label: "Browse All Topics", to: "/topics" }]
    };
  }

  // 4. Blind Debate inquiries
  if (queryLower.includes('debate') || queryLower.includes('blind debate') || queryLower.includes('idea vs idea')) {
    return {
      reply: `⚖️ **Blind Debate & Idea vs. Idea**:\n\nFreeTalk features two innovative formats that test the core philosophy: **"Judge the argument, not the person."**\n\n• **Blind Debate**: Two users debate an ethical or technical proposition. Both identities are shielded, and community members vote purely on rhetorical strength.\n• **Idea vs Idea**: Compare two methodologies (e.g. Remote Work vs Office Work) side by side.\n\nReady to cast your votes?`,
      actionType: "DEBATE_GUIDE",
      suggestedLinks: [{ label: "Enter Debate Arena", to: "/debates" }]
    };
  }

  // 5. Default General Assistant response
  return {
    reply: `👋 Hello! I am your **FreeTalk AI Assistant**.\n\nI can help you with:\n• 🛡️ **Draft Safety Check**: Paste a draft to verify it won't trigger badword or toxicity blocks.\n• 🔒 **Privacy Guidance**: Learn how your anonymous identity is shielded.\n• 🔥 **Trending Topics**: Discover what is being most actively discussed right now.\n• ✍️ **Constructive Debating**: Tips for presenting contrarian ideas effectively.\n\nWhat would you like assistance with?`,
    actionType: "GENERAL_HELP",
    suggestedChips: [
      "🛡️ Check my draft for badwords",
      "🔒 How does my identity stay anonymous?",
      "🔥 What topics are trending right now?",
      "⚖️ How does Blind Debate work?"
    ]
  };
}
