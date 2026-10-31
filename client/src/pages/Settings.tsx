import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SystemSettings } from '../types';
import {
  Sliders,
  Cpu,
  Key,
  Database,
  Users,
  Shield,
  Save,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Zap,
  Smartphone
} from 'lucide-react';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Form Fields
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [modelName, setModelName] = useState('gemini-2.5-flash');
  const [temperature, setTemperature] = useState(0.2);
  const [autoPersonalization, setAutoPersonalization] = useState(true);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.getSettings();
      setSettings(res);
      setModelName(res.ai.modelName);
      setTemperature(res.ai.temperature);
      setAutoPersonalization(res.ai.autoPersonalization);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      await api.updateSettings({
        geminiApiKey: apiKeyInput.trim() || undefined,
        modelName,
        temperature,
        autoPersonalization
      });
      setSaveSuccess(true);
      setApiKeyInput('');
      fetchSettings();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTestKey = async () => {
    setTestingKey(true);
    setTestResult(null);
    try {
      const res = await api.testGeminiKey(apiKeyInput.trim());
      setTestResult({
        success: true,
        message: `Key Verified! Model: ${res.model} responded in ${res.latencyMs}ms.`
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Key test failed.'
      });
    } finally {
      setTestingKey(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-xs text-slate-400">Loading system architecture & Gemini configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            System & AI Intelligence Settings
          </h2>
          <span className="p-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/30 text-xs font-mono">
            Config
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Tune Google Gemini SDK parameters, manage PostgreSQL connection, and configure auto-triage rules
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 shadow-lg">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>System configuration updated and persisted successfully!</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* 1. Google Gemini AI Engine Configuration */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/30">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Google Gemini SDK & Model Tuning</h3>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              @google/genai SDK
            </span>
          </div>

          <div className="space-y-4 text-xs">
            {/* API Key Status / Entry */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 flex items-center justify-between">
                <span>Gemini API Key</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Current: {settings.ai.maskedApiKey}
                </span>
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={e => setApiKeyInput(e.target.value)}
                  placeholder="Enter new Gemini API key to update (.env fallback active)..."
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:border-sky-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleTestKey}
                  disabled={testingKey}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors disabled:opacity-40"
                >
                  {testingKey ? 'Verifying...' : 'Test Key'}
                </button>
              </div>

              {testResult && (
                <div
                  className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 mt-2 ${
                    testResult.success
                      ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                      : 'bg-red-950/70 border-red-500/40 text-red-300'
                  }`}
                >
                  {testResult.success ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>

            {/* Model Name Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Triage Model Selection</label>
                <select
                  value={modelName}
                  onChange={e => setModelName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-sky-500 outline-none cursor-pointer"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast Real-time Triage)</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Strategic Analysis)</option>
                  <option value="gemini-fallback-engine">OmniX Resilient Heuristic Engine (Offline)</option>
                </select>
                <p className="text-[10px] text-slate-500">
                  Recommended: `gemini-2.5-flash` for high-concurrency real-time stream ingestion
                </p>
              </div>

              {/* Temperature Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-300">Sampling Temperature</label>
                  <span className="font-mono text-sky-400 font-bold">{temperature}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={temperature}
                  onChange={e => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>0.0 (Deterministic / JSON)</span>
                  <span>1.0 (Creative)</span>
                </div>
              </div>
            </div>

            {/* Auto Personalization Toggle */}
            <div className="pt-2 flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div>
                <span className="font-semibold text-white block">Auto-Personalize Inbound Responses</span>
                <span className="text-[11px] text-slate-400">
                  Inject account tier, lifetime value, and historical sentiment into prompt context
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAutoPersonalization(!autoPersonalization)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  autoPersonalization ? 'bg-sky-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                    autoPersonalization ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* 2. Supabase Backend & Render Cloud Status */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Supabase & Render Cloud Architecture</h3>
                <p className="text-[11px] text-slate-400">Direct PostgreSQL Pool & Supabase Client Integration</p>
              </div>
            </div>
            <span
              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                settings.supabase?.configured
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-950 text-amber-300 border-amber-500/40'
              }`}
            >
              {settings.supabase?.configured ? 'Supabase Linked' : 'Supabase Ready'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <span className="text-slate-400 text-[10px] block">Supabase Service URL</span>
              <span className="text-xs font-mono font-bold text-white truncate block">
                {settings.supabase?.url || 'https://your-project.supabase.co'}
              </span>
              <span className="text-[10px] text-emerald-400">
                {settings.supabase?.hasAnonKey ? '✓ Anon Key Present' : 'Anon Key in client/.env'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <span className="text-slate-400 text-[10px] block">Render Backend Host</span>
              <span className="text-xs font-mono font-bold text-white truncate block">
                {settings.render?.serviceUrl || 'http://localhost:5000'}
              </span>
              <span className="text-[10px] text-sky-400">
                Environment: {settings.render?.environment || 'production'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <span className="text-slate-400 text-[10px] block">Active Database Engine</span>
              <span className="text-xs font-mono font-bold text-white truncate block">
                {settings.database.mode}
              </span>
              <span className="text-[10px] text-slate-400">
                {settings.database.metrics?.interactionsCount || 0} Synced Interactions
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-[11px] text-slate-400 space-y-1">
            <div className="text-slate-300 font-semibold">Separate Environment Separation:</div>
            <div>• <b>Client (Vercel):</b> Uses <code className="text-sky-300">VITE_SUPABASE_URL</code> and <code className="text-sky-300">VITE_SUPABASE_ANON_KEY</code> in <code className="text-slate-200">client/.env</code>.</div>
            <div>• <b>Backend (Render):</b> Uses <code className="text-emerald-300">SUPABASE_SERVICE_ROLE_KEY</code>, <code className="text-emerald-300">SUPABASE_SERVICE_URL</code>, and <code className="text-emerald-300">DATABASE_URL</code> in <code className="text-slate-200">server/.env</code>.</div>
          </div>
        </div>

        {/* 3. Database & Data Isolation Status */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/30">
                <Database className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Database Engine & Schema Isolation</h3>
            </div>
            <span
              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                settings.database.connected
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-950 text-amber-300 border-amber-500/40'
              }`}
            >
              {settings.database.mode}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400 text-[10px] block">Active Interactions</span>
              <span className="text-base font-bold text-white font-mono">
                {settings.database.metrics?.interactionsCount || 0}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400 text-[10px] block">Customer Accounts</span>
              <span className="text-base font-bold text-white font-mono">
                {settings.database.metrics?.customersCount || 0}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400 text-[10px] block">Audit Log Entries</span>
              <span className="text-base font-bold text-white font-mono">
                {settings.database.metrics?.responsesCount || 0}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400 text-[10px] block">Knowledge Base</span>
              <span className="text-base font-bold text-white font-mono">
                {settings.database.metrics?.kbArticlesCount || 0}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            Status: {settings.database.message}. Strict schema migrations in `migrations/001_init.sql`.
          </p>
        </div>

        {/* 3. Team & Role-Based Access Control (RLS) */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/30">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">CX Engineering Team & Roles</h3>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              {settings.team.length} Members
            </span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {settings.team.map(member => (
              <div key={member.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <img
                    src={member.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={member.name}
                    className="w-7 h-7 rounded-full object-cover border border-slate-700"
                  />
                  <div>
                    <span className="font-semibold text-white block">{member.name}</span>
                    <span className="text-[11px] text-slate-400">{member.department}</span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Save */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-sky-500/25 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Persisting Changes...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

