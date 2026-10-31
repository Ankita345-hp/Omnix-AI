import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const SYSTEM_PROMPT = `You are OmniX-AI, an elite Enterprise Omnichannel Customer Experience Intelligence and Support Automation Engine. Your core objective is to analyze customer interactions across all channels (Web, Android, Email, Social) with absolute precision, evaluate emotional subtext, categorize root causes accurately, and generate empathetic, professional, and brand-aligned response drafts. Always output strictly valid JSON when requested, adhering precisely to the specified schema without markdown code block pollution unless requested.`;

let genAiClient = null;

function getClient(apiKeyOverride) {
  const key = apiKeyOverride || process.env.GEMINI_API_KEY;
  if (!key || key.trim() === '' || key === 'your_gemini_api_key_here') {
    return null;
  }
  return new GoogleGenAI({ apiKey: key.trim() });
}

/**
 * Prompt 1: Interaction Ingestion & Analysis
 */
export async function analyzeInteraction({ customerName, channel, deviceType, rawMessage, apiKeyOverride, modelOverride }) {
  const client = getClient(apiKeyOverride);
  const modelName = modelOverride || process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (client) {
    try {
      console.log(`[OmniX-AI Gemini] Invoking ${modelName} for interaction analysis...`);
      const userPrompt = `Analyze the following customer interaction message:
Customer Name: ${customerName}
Channel: ${channel}
Device Type: ${deviceType}
Message: "${rawMessage}"

Return a JSON object conforming strictly to this schema:
{
  "subject": "Concise 5-8 word subject summary",
  "category": "One of [Mobile App Usability, Billing & Subscription, Account Authentication, Feature Request, Service Outage, Cancellation Threat]",
  "sentimentScore": -1.0 to 1.0 (float where -1 is extreme rage, 1 is extreme delight),
  "sentimentLabel": "One of [Highly Positive, Positive, Neutral, Frustrated, Negative, Critical Rage]",
  "urgency": "One of [Low, Medium, High, Urgent]",
  "churnRisk": "One of [Low, Medium, High, Critical]",
  "aiSummary": "2-3 sentence executive summary of the customer's core issue, device context, and emotional state."
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
      console.warn(`[OmniX-AI Gemini] Live API call failed (${err.message}). Using intelligent heuristic fallback.`);
    }
  }

  // High-fidelity fallback analyzer
  return fallbackAnalyzeInteraction({ customerName, channel, deviceType, rawMessage });
}

/**
 * Prompt 2: Smart Response Generator
 */
export async function generateResponse({ customerName, channel, deviceType, rawMessage, sentimentLabel, category, tone, agentInstructions, apiKeyOverride, modelOverride }) {
  const client = getClient(apiKeyOverride);
  const modelName = modelOverride || process.env.GEMINI_PRO_MODEL || 'gemini-2.5-pro';

  if (client) {
    try {
      console.log(`[OmniX-AI Gemini] Invoking ${modelName} for smart response generation with tone "${tone}"...`);
      const userPrompt = `You are an expert customer experience specialist. Generate a professional reply to this customer.
Customer Name: ${customerName}
Channel: ${channel}
Device: ${deviceType}
Original Issue: ${rawMessage}
Detected Sentiment: ${sentimentLabel}
Category: ${category}
Requested Tone: ${tone} (e.g., Empathetic, Executive, Consultative, De-escalation)
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
      console.warn(`[OmniX-AI Gemini] Live API call failed (${err.message}). Using intelligent response synthesizer fallback.`);
    }
  }

  // High-fidelity fallback response generator
  return fallbackGenerateResponse({ customerName, channel, deviceType, rawMessage, sentimentLabel, category, tone, agentInstructions });
}

/**
 * Intelligent NLP & Heuristic Fallback Analysis Engine
 */
function fallbackAnalyzeInteraction({ customerName, channel, deviceType, rawMessage }) {
  const lower = rawMessage.toLowerCase();

  // Category determination
  let category = 'Feature Request';
  if (lower.includes('cancel') || lower.includes('contract') || lower.includes('terminate') || lower.includes('switch to competitor')) {
    category = 'Cancellation Threat';
  } else if (lower.includes('outage') || lower.includes('down') || lower.includes('crash') || lower.includes('500') || lower.includes('latency')) {
    category = 'Service Outage';
  } else if (lower.includes('bill') || lower.includes('charge') || lower.includes('subscription') || lower.includes('invoice') || lower.includes('refund') || lower.includes('payment') || lower.includes('google pay')) {
    category = 'Billing & Subscription';
  } else if (lower.includes('login') || lower.includes('sso') || lower.includes('saml') || lower.includes('password') || lower.includes('auth') || lower.includes('token') || lower.includes('403')) {
    category = 'Account Authentication';
  } else if (lower.includes('app') || lower.includes('android') || lower.includes('ios') || lower.includes('screen') || lower.includes('button') || lower.includes('freeze') || lower.includes('mobile')) {
    category = 'Mobile App Usability';
  }

  // Sentiment scoring
  let sentimentScore = 0.0;
  let sentimentLabel = 'Neutral';
  let churnRisk = 'Low';
  let urgency = 'Medium';

  const rageWords = ['rage', 'lawsuit', 'unacceptable', 'cancel', 'immediately', 'furious', 'broken', 'worst', 'locked', 'refused', 'nightmare'];
  const negativeWords = ['error', 'frustrated', 'annoyed', 'fail', 'waiting', 'slow', 'delay', 'issue', 'bug', 'cannot', 'cant', 'help'];
  const positiveWords = ['great', 'love', 'amazing', 'thank', 'thanks', 'quick', 'kudos', 'appreciate', 'smooth', 'helpful'];

  const rageMatches = rageWords.filter(w => lower.includes(w)).length;
  const negMatches = negativeWords.filter(w => lower.includes(w)).length;
  const posMatches = positiveWords.filter(w => lower.includes(w)).length;

  if (rageMatches > 0 || (negMatches >= 2 && lower.includes('!'))) {
    sentimentScore = -0.90;
    sentimentLabel = 'Critical Rage';
    churnRisk = 'Critical';
    urgency = 'Urgent';
  } else if (negMatches >= 2) {
    sentimentScore = -0.65;
    sentimentLabel = 'Negative';
    churnRisk = 'High';
    urgency = 'High';
  } else if (negMatches === 1) {
    sentimentScore = -0.35;
    sentimentLabel = 'Frustrated';
    churnRisk = 'Medium';
    urgency = 'Medium';
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

  // Extract concise subject
  const cleanSnippet = rawMessage.replace(/[\r\n]+/g, ' ').slice(0, 60);
  const subject = `${category}: ${cleanSnippet}...`;

  const aiSummary = `${customerName} reached out via ${channel} (${deviceType}) regarding ${category.toLowerCase()}. Detected ${sentimentLabel.toLowerCase()} sentiment with ${churnRisk.toLowerCase()} churn risk requiring ${urgency.toLowerCase()} priority handling.`;

  return {
    subject,
    category,
    sentimentScore,
    sentimentLabel,
    urgency,
    churnRisk,
    aiSummary,
    source: 'OmniX Intelligence Heuristic Engine',
    modelUsed: 'gemini-fallback-engine',
    timestamp: new Date().toISOString()
  };
}

/**
 * Intelligent Fallback Response Synthesizer
 */
function fallbackGenerateResponse({ customerName, channel, deviceType, rawMessage, sentimentLabel, category, tone, agentInstructions }) {
  const firstName = customerName.split(' ')[0] || customerName;

  let greeting = `Hello ${firstName},`;
  let closing = `Warm regards,\nOmniX Customer Experience Team`;

  let responseBody = '';
  let internalNotes = '';

  switch (tone) {
    case 'De-escalation':
      greeting = `Dear ${firstName},`;
      responseBody = `I want to personally apologize for the friction and frustration you experienced with our platform. We completely recognize how critical this is to your operations, especially when using our ${deviceType} client. I have immediately elevated your ticket to our senior tier engineering team and removed any temporary service lockouts on your account while we verify the root cause. You will receive an update within 60 minutes.`;
      internalNotes = `• Immediate de-escalation protocol engaged for ${customerName}.\n• Root cause linked to ${category} on ${deviceType}.\n• Check server logs and gateway authorizations for affected user UUID.\n• Apply service credit or grace waiver if SLA breach occurred.`;
      break;

    case 'Executive':
      greeting = `Dear ${customerName},`;
      responseBody = `Thank you for bringing this matter to our executive leadership team's attention. Delivering flawless reliability across all touchpoints is our core priority. I have assigned a dedicated Principal Solutions Architect to review your account configuration, resolve the bottleneck reported in your ${channel} communication, and verify complete resolution today.`;
      internalNotes = `• High-touch Executive communication dispatched.\n• Coordinate with Customer Success Lead for Enterprise account review.\n• Verify contract renewal date and NPS history.`;
      break;

    case 'Consultative':
      responseBody = `Thank you for contacting us regarding your ${deviceType} experience. Based on your note regarding ${category.toLowerCase()}, our recommended best practice is to verify client network credentials and ensure the latest security patch is installed. I have also cross-referenced our knowledge base article to provide you with step-by-step guidance below.`;
      internalNotes = `• Consultative walkthrough provided.\n• Provide relevant documentation link for ${category}.\n• Follow up in 24 hours to confirm customer satisfaction.`;
      break;

    case 'Empathetic':
    default:
      responseBody = `Thank you so much for reaching out to us. I understand how stressful it can be to encounter unexpected obstacles with your ${deviceType} workflow, and I am here to help you get this resolved smoothly and swiftly. We are actively investigating this right now and will make sure you are taken care of every step of the way.`;
      internalNotes = `• High-empathy tone applied to alleviate customer anxiety.\n• Review thread logs and verify resolution status before closing ticket.`;
      break;
  }

  if (agentInstructions) {
    responseBody += `\n\nAdditionally, per your specific scenario: ${agentInstructions}`;
  }

  const responseDraft = `${greeting}\n\n${responseBody}\n\n${closing}`;

  return {
    responseDraft,
    internalNotes,
    source: 'OmniX Intelligence Heuristic Engine',
    modelUsed: 'gemini-fallback-engine',
    toneApplied: tone,
    timestamp: new Date().toISOString()
  };
}

