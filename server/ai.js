import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const SYSTEM_PROMPT = `You are OmniX-AI, an elite Enterprise Omnichannel Customer Experience Intelligence and Support Automation Engine. Your core objective is to analyze customer interactions across all channels (Web, Android, Email, Social, Voice) with absolute precision, evaluate emotional subtext, categorize root causes accurately, prioritize according to customer value (VIP/Enterprise tiers) and severity, and generate empathetic, professional, and brand-aligned response drafts.

CRITICAL TRIAGE & SENTIMENT CALIBRATION RULES:
1. MIXED & MILD COMPLIMENT/FEEDBACK CALIBRATION:
   - When a customer compliments the product but raises a minor issue (e.g., "the product is beautiful but there's only one small problem", "I like this app, but feature X isn't working for me"):
     * Sentiment is MILD: "Positive" (+0.30 to +0.45) or "Neutral" (+0.10 to +0.25). It is NEVER "Critical Rage" or "Critical Risk".
     * Urgency should be "High" (or "Urgent" if VIP tier) to acknowledge their attention, while Churn Risk remains "Low" or "Medium" because they like the product!
2. SHORT-TEXT SENSITIVITY:
   - Short praise ("Works great!", "Loving it!") -> Highly Positive (+0.80 to +0.95), Urgency: Low, Churn: Low.
   - Severe blockers ("App won't open", "keeps crashing", "locked out") -> Negative (-0.70) or Critical Rage (-0.85 to -0.92), Urgency: Urgent.
   - Minor glitch / small request ("one small problem", "minor bug", "one little question") -> Positive/Neutral/Frustrated (mild), Churn: Low.

Always output strictly valid JSON conforming to the requested schema.`;

function getClient(apiKeyOverride) {
  const key = apiKeyOverride || process.env.GEMINI_API_KEY;
  if (!key || key.trim() === '' || key === 'your_gemini_api_key_here' || key === 'your_actual_api_key_here') {
    return null;
  }
  return new GoogleGenAI({ apiKey: key.trim() });
}

/**
 * Prompt 1: Interaction Ingestion & Analysis
 */
export async function analyzeInteraction({ customerName, customerEmail, company, tier, channel, deviceType, rawMessage, apiKeyOverride, modelOverride }) {
  const client = getClient(apiKeyOverride);
  const modelName = modelOverride || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const customerTier = tier || 'Standard';

  if (client) {
    try {
      console.log(`[OmniX-AI Gemini] Invoking ${modelName} for interaction analysis (Customer Tier: ${customerTier})...`);
      const userPrompt = `Analyze the following customer interaction message:
Customer Name: ${customerName}
Customer Tier: ${customerTier}
Company: ${company || 'N/A'}
Channel: ${channel}
Device Type: ${deviceType}
Message: "${rawMessage}"

Return a JSON object conforming strictly to this schema:
{
  "subject": "Concise 5-8 word subject summary",
  "category": "One of [Mobile App Usability, Billing & Subscription, Account Authentication, Feature Request, Service Outage, Cancellation Threat]",
  "sentimentScore": -1.0 to 1.0 (float where -1.0 is extreme rage/severe disruption, 1.0 is extreme delight),
  "sentimentLabel": "One of [Highly Positive, Positive, Neutral, Frustrated, Negative, Critical Rage]",
  "urgency": "One of [Low, Medium, High, Urgent]",
  "churnRisk": "One of [Low, Medium, High, Critical]",
  "aiSummary": "2-3 sentence executive summary explaining the customer's core intent, emotional state, and account tier context."
}`;

      const response = await client.models.generateContent({
        model: modelName,
        contents: userPrompt,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      });

      const text = response.text;
      const cleanJson = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
      const parsed = JSON.parse(cleanJson);

      return {
        ...parsed,
        source: 'Google Gemini AI',
        modelUsed: modelName,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      console.warn(`[OmniX-AI Gemini] Live API call failed (${err.message}). Using enhanced heuristic fallback.`);
    }
  }

  // Enhanced heuristic analyzer
  return fallbackAnalyzeInteraction({ customerName, tier: customerTier, company, channel, deviceType, rawMessage });
}

/**
 * Prompt 2: Smart Response Generator
 */
export async function generateResponse({ customerName, tier, company, channel, deviceType, rawMessage, sentimentLabel, category, tone, agentInstructions, apiKeyOverride, modelOverride }) {
  const client = getClient(apiKeyOverride);
  const modelName = modelOverride || process.env.GEMINI_PRO_MODEL || 'gemini-2.5-pro';
  const customerTier = tier || 'Standard';

  if (client) {
    try {
      console.log(`[OmniX-AI Gemini] Invoking ${modelName} for smart response generation with tone "${tone}" (Tier: ${customerTier})...`);
      const userPrompt = `You are an expert customer experience specialist. Generate a professional reply to this customer.
Customer Name: ${customerName}
Account Tier: ${customerTier} ${customerTier === 'Enterprise' || customerTier === 'Gold' ? '(VIP Tier)' : ''}
Company: ${company || 'N/A'}
Channel: ${channel}
Device: ${deviceType}
Original Message: ${rawMessage}
Detected Sentiment: ${sentimentLabel}
Category: ${category}
Requested Tone: ${tone} (Empathetic, Executive, Consultative, De-escalation)
${agentInstructions ? `Special Agent Instructions: ${agentInstructions}` : ''}

Return a JSON object conforming strictly to this schema:
{
  "responseDraft": "The complete, polished response text ready to send to the customer.",
  "internalNotes": "Brief bullet points for the support team on root cause or technical troubleshooting steps."
}`;

      const response = await client.models.generateContent({
        model: modelName,
        contents: userPrompt,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0.3,
          responseMimeType: "application/json"
        }
      });

      const text = response.text;
      const cleanJson = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
      const parsed = JSON.parse(cleanJson);

      return {
        ...parsed,
        source: 'Google Gemini AI',
        modelUsed: modelName,
        toneApplied: tone,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      console.warn(`[OmniX-AI Gemini] Live API call failed (${err.message}). Using enhanced fallback response.`);
    }
  }

  // Enhanced fallback response generator
  return fallbackGenerateResponse({ customerName, tier: customerTier, channel, deviceType, rawMessage, sentimentLabel, category, tone, agentInstructions });
}

/**
 * Enhanced NLP & Heuristic Analysis Engine
 * Accurately balances praise, minor constructive problems, short phrases, and severe blockers.
 */
function fallbackAnalyzeInteraction({ customerName, tier = 'Standard', company, channel, deviceType, rawMessage }) {
  const rawClean = rawMessage.trim();
  const lower = rawClean.toLowerCase();
  const isVipTier = tier === 'Enterprise' || tier === 'Gold' || lower.includes('vip') || lower.includes('enterprise');

  // Tokenize words
  const words = lower.split(/[\s,.;:!?()"-]+/).filter(Boolean);
  const hasWord = (w) => words.includes(w) || lower.includes(w);

  // Punctuation signals
  const hasExclamation = rawClean.includes('!');
  const isAllUpper = rawClean.length > 5 && rawClean === rawClean.toUpperCase();

  // Detect praise / appreciation (including common typos like "beautifull")
  const praiseKeywords = [
    'amazing', 'awesome', 'excellent', 'fantastic', 'phenomenal', 'brilliant', 'delighted',
    'thrilled', 'impressed', 'stellar', 'perfect', 'exceptional', 'superb', 'flawless',
    'kudos', 'love', 'loved', 'loving', 'game changer', 'best app', 'wonderful', 'great',
    'works great', 'so good', 'very happy', 'beautiful', 'beautifull', 'pretty', 'good',
    'nice', 'like', 'liked', 'enjoy', 'smooth', 'seamless', 'helpful', 'well done',
    'thank', 'thanks', 'appreciate', 'appreciated'
  ];

  // Detect minor / constructive qualifiers (e.g. "one small problem", "minor issue", "just a question")
  const isMinorFriction =
    lower.includes('one small problem') ||
    lower.includes('small problem') ||
    lower.includes('minor problem') ||
    lower.includes('minor issue') ||
    lower.includes('small issue') ||
    lower.includes('little problem') ||
    lower.includes('small bug') ||
    lower.includes('minor bug') ||
    lower.includes('just one thing') ||
    lower.includes('only one') ||
    lower.includes('quick question');

  // Extreme Rage lexicon
  const rageKeywords = [
    'rage', 'lawsuit', 'unacceptable', 'cancel', 'immediately', 'furious', 'broken',
    'worst', 'locked', 'refused', 'nightmare', 'disaster', 'useless', 'ridiculous',
    'horrible', 'abysmal', 'garbage', 'scam', 'fraud', 'terrible', 'pathetic', 'awful',
    'hate', 'pissed', 'disgusted', 'waste of money'
  ];

  // Negative / Friction lexicon
  const actualNegativeKeywords = [
    'error', 'frustrated', 'annoyed', 'fail', 'failed', 'failing', 'waiting too long',
    'slow', 'delay', 'delayed', 'buggy', 'cannot work', 'cant work', 'problem', 'trouble',
    'stuck', 'not working', 'stops working', 'crash', 'crashing', 'crashed', 'freeze', 'freezing',
    'frozen', 'wont open', "won't open", 'blank screen', 'black screen', 'glitch', 'down',
    'cannot login', 'cant login', 'denied', 'locked out', 'timeout', 'timed out'
  ];

  // Constructive / benign phrases that shouldn't be penalized
  const isHelpFriendly = lower.includes('thanks for your help') || lower.includes('thank you for helping') || lower.includes('help us explore') || lower.includes('appreciate the help') || lower.includes('your help was');
  const isNoIssue = lower.includes('no issue') || lower.includes('no problem') || lower.includes('without any issue') || lower.includes('fixed now') || lower.includes('resolved now');

  const praiseMatches = praiseKeywords.filter(w => hasWord(w)).length;
  const rageMatches = rageKeywords.filter(w => hasWord(w)).length;
  let negMatches = actualNegativeKeywords.filter(w => hasWord(w)).length;

  if (isHelpFriendly || isNoIssue) {
    negMatches = 0;
  }

  // Crash & Blocker analysis
  const isSevereCrash = (hasWord('crash') || hasWord('crashing') || hasWord('freeze') || hasWord('frozen') || lower.includes('wont open') || lower.includes("won't open")) && !isNoIssue;
  const isRecurring = hasWord('everytime') || lower.includes('every time') || hasWord('constantly') || hasWord('always') || hasWord('repeatedly') || hasWord('keeps');
  const isTeamImpacted = lower.includes('my team') || lower.includes('our team') || lower.includes('all users') || lower.includes('everyone') || lower.includes('blocked');
  const isImmediate = lower.includes('immediately') || lower.includes('asap') || lower.includes('urgent') || lower.includes('right now') || lower.includes('emergency');

  // Category determination
  let category = 'Feature Request';
  if (lower.includes('cancel') || lower.includes('contract') || lower.includes('terminate') || lower.includes('switch to competitor') || lower.includes('leaving') || lower.includes('refund')) {
    category = lower.includes('refund') ? 'Billing & Subscription' : 'Cancellation Threat';
  } else if (lower.includes('bill') || lower.includes('charge') || lower.includes('subscription') || lower.includes('invoice') || lower.includes('payment') || lower.includes('pricing') || lower.includes('card')) {
    category = 'Billing & Subscription';
  } else if (lower.includes('login') || lower.includes('sso') || lower.includes('saml') || lower.includes('password') || lower.includes('auth') || lower.includes('token') || lower.includes('403') || lower.includes('access')) {
    category = 'Account Authentication';
  } else if (lower.includes('outage') || lower.includes('server down') || lower.includes('500') || lower.includes('service unavailable') || lower.includes('system down')) {
    category = 'Service Outage';
  } else if (lower.includes('screen') || lower.includes('button') || lower.includes('ui') || lower.includes('mobile') || hasWord('app') || lower.includes('android') || isSevereCrash) {
    category = 'Mobile App Usability';
  } else if (praiseMatches >= 1 || lower.includes('feature') || lower.includes('feedback') || lower.includes('suggestion') || lower.includes('would like') || lower.includes('how to')) {
    category = 'Feature Request';
  }

  let sentimentScore = 0.0;
  let sentimentLabel = 'Neutral';
  let churnRisk = 'Low';
  let urgency = 'Medium';

  // EVALUATION LOGIC
  if (isMinorFriction && praiseMatches > 0) {
    // SPECIAL HANDLER FOR: "the product is beautiful but there's only one small problem"
    // The customer genuinely likes the product, but needs support on one point.
    // Score should be mild positive / constructive, urgency High (to deliver white-glove care), churn risk LOW.
    sentimentScore = 0.35;
    sentimentLabel = 'Positive';
    urgency = 'High';
    churnRisk = 'Low';
  } else if (isMinorFriction && praiseMatches === 0) {
    // "theres only one small problem" (without explicit praise words)
    sentimentScore = -0.15;
    sentimentLabel = 'Neutral';
    urgency = isVipTier ? 'High' : 'Medium';
    churnRisk = 'Low';
  } else if (praiseMatches > 0 && negMatches === 0 && rageMatches === 0 && !isSevereCrash) {
    // PURE POSITIVE PATH
    if (praiseMatches >= 2 || hasExclamation) {
      sentimentScore = Math.min(0.95, 0.75 + praiseMatches * 0.08);
      sentimentLabel = 'Highly Positive';
      urgency = 'Low';
      churnRisk = 'Low';
    } else {
      sentimentScore = 0.55;
      sentimentLabel = 'Positive';
      urgency = 'Low';
      churnRisk = 'Low';
    }
  } else if (rageMatches > 0 || isImmediate || (isSevereCrash && (isRecurring || isTeamImpacted))) {
    // CRITICAL RAGE PATH (Only for genuine rage / total blocker)
    sentimentScore = isVipTier ? -0.92 : -0.85;
    sentimentLabel = 'Critical Rage';
    churnRisk = isVipTier ? 'Critical' : 'High';
    urgency = 'Urgent';
  } else if (isSevereCrash || negMatches >= 1 || isAllUpper) {
    // NEGATIVE / FRUSTRATED PATH
    if (isSevereCrash || negMatches >= 2) {
      sentimentScore = isVipTier ? -0.80 : -0.68;
      sentimentLabel = 'Negative';
      churnRisk = isVipTier ? 'High' : 'Medium';
      urgency = isVipTier ? 'Urgent' : 'High';
    } else {
      sentimentScore = isVipTier ? -0.55 : -0.42;
      sentimentLabel = 'Frustrated';
      churnRisk = isVipTier ? 'Medium' : 'Low';
      urgency = isVipTier ? 'High' : 'Medium';
    }
  } else if (praiseMatches > 0 && negMatches > 0) {
    // MIXED SENTIMENT
    sentimentScore = 0.30;
    sentimentLabel = 'Positive';
    urgency = 'High';
    churnRisk = 'Low';
  } else {
    // OBJECTIVE / NEUTRAL
    sentimentScore = 0.05;
    sentimentLabel = 'Neutral';
    churnRisk = 'Low';
    urgency = isVipTier ? 'Medium' : 'Low';
  }

  // VIP Tier Priority Elevation Rule
  if (isVipTier) {
    // If VIP customer has an issue, ensure priority is at least High
    if (sentimentScore < 0.40) {
      if (urgency === 'Medium' || urgency === 'Low') urgency = 'High';
      if (isSevereCrash || isTeamImpacted || isRecurring || isImmediate) urgency = 'Urgent';
    }
    // Only escalate churn risk if sentiment is genuinely negative
    if (sentimentScore < -0.30) {
      if (churnRisk === 'Low') churnRisk = 'Medium';
      if (isSevereCrash || isRecurring) churnRisk = 'High';
      if (isSevereCrash && isTeamImpacted) churnRisk = 'Critical';
    }
  }

  const cleanSnippet = rawMessage.replace(/[\r\n]+/g, ' ').slice(0, 60);
  const subject = `${category}: ${cleanSnippet}...`;

  const vipPill = isVipTier ? `[${tier} VIP Account]` : `[${tier}]`;

  let aiSummary = '';
  if (isMinorFriction && praiseMatches > 0) {
    aiSummary = `${customerName} ${vipPill} expressed appreciation for the product while reporting a specific minor issue. Assessed sentiment as constructive Positive (+${sentimentScore.toFixed(2)}) with Low churn risk. Flagged as High priority for prompt agent assistance.`;
  } else if (sentimentLabel === 'Highly Positive' || sentimentLabel === 'Positive') {
    aiSummary = `${customerName} ${vipPill} shared positive feedback via ${channel} (${deviceType}). Identified ${category.toLowerCase()} with expressed satisfaction. Sentiment assessed as ${sentimentLabel} (+${sentimentScore.toFixed(2)}) with Low churn risk.`;
  } else if (sentimentLabel === 'Neutral') {
    aiSummary = `${customerName} ${vipPill} submitted an inquiry via ${channel} (${deviceType}) regarding ${category.toLowerCase()}. Standard assistance required.`;
  } else {
    aiSummary = `${customerName} ${vipPill} reported a touchpoint via ${channel} (${deviceType}). Identified ${category.toLowerCase()}${isSevereCrash ? ' with application friction' : ''}${isTeamImpacted ? ' affecting their team' : ''}. Assessed sentiment as ${sentimentLabel} (${sentimentScore.toFixed(2)}) with ${churnRisk} churn vulnerability requiring ${urgency} priority triage.`;
  }

  return {
    subject,
    category,
    sentimentScore,
    sentimentLabel,
    urgency,
    churnRisk,
    aiSummary,
    source: 'OmniX Enhanced Contextual Engine',
    modelUsed: 'gemini-fallback-engine',
    timestamp: new Date().toISOString()
  };
}

/**
 * Intelligent Fallback Response Synthesizer
 */
function fallbackGenerateResponse({ customerName, tier = 'Standard', channel, deviceType, rawMessage, sentimentLabel, category, tone, agentInstructions }) {
  const firstName = customerName.split(' ')[0] || customerName;
  const isPositive = sentimentLabel === 'Highly Positive' || sentimentLabel === 'Positive';

  let greeting = `Dear ${firstName},`;
  let closing = `Warm regards,\nOmniX Customer Experience Team`;

  let responseBody = '';
  let internalNotes = '';

  if (isPositive) {
    greeting = `Hello ${firstName},`;
    responseBody = `Thank you so much for the kind words about our product! We're glad you're enjoying it, and we want to ensure everything runs completely seamlessly for you on ${deviceType}. I'd be more than happy to help you sort out the issue you mentioned—could you share a few more details so we can get it resolved right away?`;
    internalNotes = `• Customer likes the product but identified a minor friction point.\n• Account: ${tier} tier.\n• High Priority follow-up: Resolve the single issue to maintain loyalty.`;
  } else {
    switch (tone) {
      case 'De-escalation':
        greeting = `Dear ${firstName},`;
        responseBody = `I want to personally apologize for the disruption and frustration this has caused you and your team. As a valued ${tier} partner, we hold your operational stability to the highest standard. I have escalated this issue directly to our Principal Engineering Pod with P0 priority to address the ${deviceType} issue immediately. We have also placed a dedicated engineering monitor on your account.`;
        internalNotes = `• IMMEDIATE ESCALATION: ${tier} VIP account reporting issue on ${deviceType}.\n• Dedicated architect assigned. Offer SLA credit or billing waiver.`;
        break;

      case 'Executive':
        greeting = `Dear ${customerName},`;
        responseBody = `Thank you for bringing this critical issue to our executive attention. Uninterrupted service is our foremost commitment to our ${tier} clients. I am coordinating directly with our engineering leadership to diagnose the root cause and provide you with an expedited patch today.`;
        internalNotes = `• High-touch Executive communication dispatched.\n• Coordinate with Client Executive for ${tier} retention.`;
        break;

      case 'Consultative':
        responseBody = `Thank you for reaching out regarding your ${deviceType} experience. We have documented recommended best practices for ${category.toLowerCase()} and our engineering team is reviewing your configuration to ensure optimal stability.`;
        internalNotes = `• Consultative resolution provided.\n• Provide relevant documentation link for ${category}.\n• Follow up in 24 hours to confirm customer satisfaction.`;
        break;

      case 'Empathetic':
      default:
        responseBody = `Thank you so much for reaching out to us, and please accept our sincere apologies for any inconvenience this has caused your team. We know how critical this is for your daily workflow, and we are actively investigating this right now to make sure you are taken care of.`;
        internalNotes = `• High-empathy tone applied to alleviate customer anxiety.\n• Review logs and verify resolution status before closing ticket.`;
        break;
    }
  }

  if (agentInstructions) {
    responseBody += `\n\nAdditionally, per your specific scenario: ${agentInstructions}`;
  }

  const responseDraft = `${greeting}\n\n${responseBody}\n\n${closing}`;

  return {
    responseDraft,
    internalNotes,
    source: 'OmniX Enhanced Contextual Engine',
    modelUsed: 'gemini-fallback-engine',
    toneApplied: tone,
    timestamp: new Date().toISOString()
  };
}
