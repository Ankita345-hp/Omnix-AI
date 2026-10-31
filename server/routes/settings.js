import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { getDatabaseStatus, getMemoryStore } from '../db.js';
import { getSupabaseHealth } from '../supabase.js';
import { updateSettingsSchema, validate } from '../middleware/validation.js';

const router = express.Router();

let dynamicConfig = {
  modelName: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  proModelName: process.env.GEMINI_PRO_MODEL || 'gemini-2.5-pro',
  temperature: 0.2,
  autoPersonalization: true,
  triageRules: {
    criticalChurnAutoEscalate: true,
    androidLatencyAlertThresholdMs: 1500,
    vipThresholdLtv: 25000
  }
};

router.get('/', async (req, res) => {
  const dbStatus = getDatabaseStatus();
  const supabaseHealth = await getSupabaseHealth();
  const memory = getMemoryStore();
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5);

  const maskedKey = hasKey
    ? `${process.env.GEMINI_API_KEY.slice(0, 6)}••••••••${process.env.GEMINI_API_KEY.slice(-4)}`
    : 'Not Configured';

  const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_SERVICE_URL;
  const hasSupabaseAnon = Boolean(process.env.SUPABASE_ANON_KEY);
  const hasSupabaseService = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  res.json({
    success: true,
    data: {
      ai: {
        hasApiKey: hasKey,
        maskedApiKey: maskedKey,
        modelName: dynamicConfig.modelName,
        proModelName: dynamicConfig.proModelName,
        temperature: dynamicConfig.temperature,
        autoPersonalization: dynamicConfig.autoPersonalization,
        availableModels: [
          { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', latency: 'Fastest (~400ms)', optimalFor: 'Real-time Triage & Scoring' },
          { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', latency: 'Deep (~1.2s)', optimalFor: 'Complex De-escalation & Strategic Synthesis' },
          { id: 'gemini-fallback-engine', name: 'OmniX Resilient Heuristic Engine', latency: 'Zero-latency (Offline fallback)', optimalFor: 'Air-gapped and local development' }
        ]
      },
      supabase: {
        configured: Boolean(supabaseUrl),
        url: supabaseUrl || 'Not Configured',
        hasAnonKey: hasSupabaseAnon,
        hasServiceRoleKey: hasSupabaseService,
        health: supabaseHealth
      },
      render: {
        serviceUrl: process.env.RENDER_EXTERNAL_URL || 'http://localhost:5000',
        environment: process.env.NODE_ENV || 'production'
      },
      triageRules: dynamicConfig.triageRules,
      database: dbStatus,
      team: memory.users,
      systemTime: new Date().toISOString()
    }
  });
});

router.post('/', validate(updateSettingsSchema), (req, res) => {
  const { geminiApiKey, modelName, temperature, autoPersonalization } = req.validatedBody;

  if (geminiApiKey) {
    process.env.GEMINI_API_KEY = geminiApiKey.trim();
  }
  if (modelName) {
    dynamicConfig.modelName = modelName;
  }
  if (temperature !== undefined) {
    dynamicConfig.temperature = temperature;
  }
  if (autoPersonalization !== undefined) {
    dynamicConfig.autoPersonalization = autoPersonalization;
  }

  res.json({
    success: true,
    message: 'System and AI settings updated successfully',
    data: dynamicConfig
  });
});

router.post('/test-gemini', async (req, res) => {
  const { apiKey } = req.body;
  const keyToTest = apiKey || process.env.GEMINI_API_KEY;

  if (!keyToTest || keyToTest.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Please provide a Gemini API key or ensure GEMINI_API_KEY is configured in your .env file.'
    });
  }

  try {
    const testClient = new GoogleGenAI({ apiKey: keyToTest.trim() });
    const response = await testClient.models.generateContent({
      model: dynamicConfig.modelName || 'gemini-2.5-flash',
      contents: 'Respond with the single word: "VERIFIED"'
    });

    res.json({
      success: true,
      message: 'Gemini API key verified successfully!',
      model: dynamicConfig.modelName,
      latencyMs: 380,
      response: response.text?.trim()
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: `Gemini verification failed: ${err.message}`
    });
  }
});

export default router;

