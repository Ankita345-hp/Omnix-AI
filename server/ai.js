import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const SYSTEM_PROMPT = `You are OmniX-AI, an elite Enterprise Omnichannel Customer Experience Intelligence and Support Automation Engine. Your core objective is to analyze customer interactions across all channels (Web, Android, Email, Social, Voice) with absolute precision, evaluate emotional subtext, categorize root causes accurately, prioritize according to customer value (VIP/Enterprise tiers) and severity (e.g. repeated crashes, operational stoppage), and generate empathetic, professional, and brand-aligned response drafts.

CRITICAL TRIAGE & PRIORITY RULES:
1. CUSTOMER TIER & VIP IMPORTANCE:
   - Enterprise or Gold tier customers experiencing disruptions MUST be prioritized immediately.
   - Any crash or outage affecting a VIP or Enterprise account is automatically High or Urgent priority.
2. INCIDENT SEVERITY:
   - Repeated app crashes, inability to open the app, payment failures, or dashboard lockouts represent severe friction (High to Urgent priority).
   - Casual inquiries, compliments, or minor cosmetic feedback are Low to Medium priority.
3. SENTIMENT EVALUATION:
   - "Critical Rage" (-0.80 to -1.00): App crashes, threats to cancel, locked out, extreme disruption.
   - "Negative" (-0.50 to -0.79): Significant bugs, broken features, repeated issues, severe inconvenience.
   - "Frustrated" (-0.20 to -0.49): Annoyance, delays, unexpected behavior.
   - "Neutral" (-0.19 to +0.20): Objective questions, procedural queries.
   - "Positive" (+0.21 to +0.60): Helpful, satisfied, constructive.
   - "Highly Positive" (+0.61 to +1.00): Enthusiastic delight, praise.

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
Customer Tier: ${customerTier} (Note: Enterprise/Gold are VIP high-value accounts)
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
  "aiSummary": "2-3 sentence executive summary explaining the customer's core issue, impact on their team/work, and their account tier context."
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

  // Enhanced heuristic analyzer considering VIP tiers, crashes, team impact
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
Account Tier: ${customerTier} ${customerTier === 'Enterprise' || customerTier === 'Gold' ? '(VIP Tier - treat with highest priority)' : ''}
Company: ${company || 'N/A'}
Channel: ${channel}
Device: ${deviceType}
Original Issue: ${rawMessage}
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
 * Taking into account VIP/Enterprise tiers, crash frequency, team impact, and sentiment depth.
 */
function fallbackAnalyzeInteraction({ customerName, tier = 'Standard', company, channel, deviceType, rawMessage }) {
  const lower = rawMessage.toLowerCase();
  const isVipTier = tier === 'Enterprise' || tier === 'Gold' || lower.includes('vip') || lower.includes('enterprise');

  // Category determination
  let category = 'Mobile App Usability';
  if (lower.includes('cancel') || lower.includes('contract') || lower.includes('terminate') || lower.includes('switch to competitor') || lower.includes('leaving')) {
    category = 'Cancellation Threat';
  } else if (lower.includes('bill') || lower.includes('charge') || lower.includes('subscription') || lower.includes('invoice') || lower.includes('refund') || lower.includes('payment') || lower.includes('google pay')) {
    category = 'Billing & Subscription';
  } else if (lower.includes('login') || lower.includes('sso') || lower.includes('saml') || lower.includes('password') || lower.includes('auth') || lower.includes('token') || lower.includes('403') || lower.includes('locked out')) {
    category = 'Account Authentication';
  } else if (lower.includes('outage') || lower.includes('server down') || lower.includes('500') || lower.includes('system down') || lower.includes('service unavailable')) {
    category = 'Service Outage';
  } else if (lower.includes('crash') || lower.includes('crashing') || lower.includes('freeze') || lower.includes('wont open') || lower.includes("won't open") || lower.includes('closes') || lower.includes('screen') || lower.includes('mobile') || lower.includes('app')) {
    category = 'Mobile App Usability';
  } else if (lower.includes('feature') || lower.includes('suggestion') || lower.includes('request') || lower.includes('would like') || lower.includes('kafka') || lower.includes('api')) {
    category = 'Feature Request';
  }

  // Severity & Negative triggers
  const isSevereCrash = lower.includes('crash') || lower.includes('crashing') || lower.includes('freeze') || lower.includes('frozen') || lower.includes('stops working') || lower.includes('keeps closing') || lower.includes('black screen');
  const isRecurring = lower.includes('everytime') || lower.includes('every time') || lower.includes('constantly') || lower.includes('always') || lower.includes('repeatedly') || lower.includes('2 days') || lower.includes('multiple times');
  const isTeamImpacted = lower.includes('my team') || lower.includes('our team') || lower.includes('all users') || lower.includes('everyone') || lower.includes('whole company') || lower.includes('cannot work') || lower.includes('blocked');

  const rageWords = ['rage', 'lawsuit', 'unacceptable', 'cancel', 'immediately', 'furious', 'broken', 'worst', 'locked', 'refused', 'nightmare', 'disaster', 'useless', 'ridiculous', 'urgent', 'horrible'];
  const negativeWords = ['error', 'frustrated', 'annoyed', 'fail', 'waiting', 'slow', 'delay', 'issue', 'bug', 'cannot', 'cant', 'help', 'problem', 'trouble', 'stuck', 'not working'];
  const positiveWords = ['great', 'love', 'amazing', 'thank', 'thanks', 'quick', 'kudos', 'appreciate', 'smooth', 'helpful', 'delighted', 'awesome'];

  const rageMatches = rageWords.filter(w => lower.includes(w)).length;
  const negMatches = negativeWords.filter(w => lower.includes(w)).length;
  const posMatches = positiveWords.filter(w => lower.includes(w)).length;

  let sentimentScore = 0.0;
  let sentimentLabel = 'Neutral';
  let churnRisk = 'Low';
  let urgency = 'Medium';

  // Comprehensive Sentiment Calculation
  if (rageMatches > 0 || (isSevereCrash && isRecurring) || (isSevereCrash && isTeamImpacted)) {
    sentimentScore = isVipTier ? -0.92 : -0.85;
    sentimentLabel = 'Critical Rage';
    churnRisk = isVipTier ? 'Critical' : 'High';
    urgency = 'Urgent';
  } else if (isSevereCrash || negMatches >= 2 || (isTeamImpacted && negMatches >= 1)) {
    sentimentScore = isVipTier ? -0.75 : -0.65;
    sentimentLabel = 'Negative';
    churnRisk = isVipTier ? 'High' : 'Medium';
    urgency = isVipTier ? 'Urgent' : 'High';
  } else if (negMatches >= 1 || lower.includes('issue') || lower.includes('problem') || lower.includes('bug')) {
    sentimentScore = -0.40;
    sentimentLabel = 'Frustrated';
    churnRisk = isVipTier ? 'Medium' : 'Low';
    urgency = isVipTier ? 'High' : 'Medium';
  } else if (posMatches >= 2) {
    sentimentScore = 0.85;
    sentimentLabel = 'Highly Positive';
    churnRisk = 'Low';
    urgency = 'Low';
  } else if (posMatches === 1) {
    sentimentScore = 0.50;
    sentimentLabel = 'Positive';
    churnRisk = 'Low';
    urgency = 'Low';
  }

  // VIP Tier Priority Elevation Rule:
  // Any VIP (Enterprise / Gold) reporting an issue automatically gets elevated priority
  if (isVipTier && sentimentScore < 0) {
    if (urgency === 'Medium') urgency = 'High';
    if (urgency === 'High' && (isSevereCrash || isTeamImpacted || isRecurring)) urgency = 'Urgent';
    if (churnRisk === 'Medium' && (isSevereCrash || isRecurring)) churnRisk = 'High';
    if (churnRisk === 'High' && (isSevereCrash && isTeamImpacted)) churnRisk = 'Critical';
  }

  const cleanSnippet = rawMessage.replace(/[\r\n]+/g, ' ').slice(0, 60);
  const subject = `${category}: ${cleanSnippet}...`;

  const vipPill = isVipTier ? `[${tier} VIP Account]` : `[${tier}]`;
  const aiSummary = `${customerName} ${vipPill} reported a critical friction point via ${channel} (${deviceType}). Identified ${category.toLowerCase()}${isSevereCrash ? ' with repeated application crashes' : ''}${isTeamImpacted ? ' affecting their entire team' : ''}. Assessed sentiment as ${sentimentLabel} (${sentimentScore.toFixed(2)}) with ${churnRisk} churn vulnerability requiring ${urgency} priority triage.`;

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
  const isVipTier = tier === 'Enterprise' || tier === 'Gold';

  let greeting = `Dear ${firstName},`;
  let closing = `Warm regards,\nOmniX Senior Customer Success Team`;

  let responseBody = '';
  let internalNotes = '';

  switch (tone) {
    case 'De-escalation':
      greeting = `Dear ${firstName},`;
      responseBody = `I want to personally apologize for the disruption and frustration this has caused you and your team. As a valued ${tier} partner, we hold your operational stability to the highest standard. I have escalated this issue directly to our Principal Mobile Engineering Pod with P0 priority to hotfix the ${deviceType} startup crash immediately. We have also placed a dedicated engineering monitor on your account.`;
      internalNotes = `• IMMEDIATE ESCALATION: ${tier} VIP account reporting repeated crashes on ${deviceType}.\n• Check hardware keystore and splash screen initialization crash logs.\n• Dedicated architect assigned. Offer SLA credit or billing waiver.`;
      break;

    case 'Executive':
      greeting = `Dear ${customerName},`;
      responseBody = `Thank you for bringing this critical issue to our executive attention. Uninterrupted service is our foremost commitment to our ${tier} clients. I am coordinating directly with our VP of Engineering to diagnose the root cause of the startup crash reported by your team and provide you with an expedited patch today.`;
      internalNotes = `• High-touch Executive communication dispatched.\n• Coordinate with Client Executive for ${tier} retention.\n• Verify crash telemetry in Firebase/Sentry for affected account UUID.`;
      break;

    case 'Consultative':
      responseBody = `Thank you for reaching out regarding the ${deviceType} experience. We have identified that startup crashes under specific OS updates can be temporarily mitigated by clearing the local biometric/keystore cache while our mobile team prepares the upcoming patch. I have detailed the step-by-step resolution below.`;
      internalNotes = `• Consultative resolution provided.\n• Provide relevant documentation link for ${category}.\n• Follow up in 24 hours to confirm customer satisfaction.`;
      break;

    case 'Empathetic':
    default:
      responseBody = `Thank you so much for reaching out to us, and please accept our sincere apologies for the stress this crash has caused your team. We know how critical it is for your daily workflow, and having the app fail on launch is completely unacceptable. We are actively investigating this right now and will keep you updated every step of the way until it is 100% resolved.`;
      internalNotes = `• High-empathy tone applied to alleviate customer anxiety.\n• High-priority customer ${tier} account.\n• Review crash logs and verify resolution status before closing ticket.`;
      break;
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
