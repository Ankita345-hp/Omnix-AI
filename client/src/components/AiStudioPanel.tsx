import React, { useState } from 'react';
import { Interaction, ToneType } from '../types';
import { SentimentBadge } from './SentimentBadge';
import { api } from '../services/api';
import {
  Sparkles,
  Send,
  CheckCircle,
  RefreshCw,
  AlertTriangle,
  Lightbulb,
  Cpu,
  ChevronDown,
  Layers,
  Flame,
  ShieldAlert
} from 'lucide-react';

interface AiStudioPanelProps {
  interaction: Interaction;
  onResponseSent: () => void;
  onAnalysisUpdated: (updated: Interaction) => void;
}

export const AiStudioPanel: React.FC<AiStudioPanelProps> = ({
  interaction,
  onResponseSent,
  onAnalysisUpdated
}) => {
  const [selectedTone, setSelectedTone] = useState<ToneType>('Empathetic');
  const [agentInstructions, setAgentInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [responseDraft, setResponseDraft] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [aiSource, setAiSource] = useState<string | null>(null);

  const tones: { type: ToneType; desc: string; icon: string }[] = [
    { type: 'Empathetic', desc: 'Warm, reassuring & patient', icon: '💙' },
    { type: 'De-escalation', desc: 'Calms critical frustration & offers immediate relief', icon: '🛡️' },
    { type: 'Executive', desc: 'Strategic, authoritative & concise for leaders', icon: '👔' },
    { type: 'Consultative', desc: 'Technical troubleshooting & best practices', icon: '💡' }
  ];

  const handleGenerateDraft = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const result = await api.generateAiResponse(interaction.id, {
        tone: selectedTone,
        agentInstructions: agentInstructions.trim() || undefined
      });
      setResponseDraft(result.responseDraft);
      setInternalNotes(result.internalNotes);
      setAiSource(result.modelUsed || result.source);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate AI response draft');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReanalyze = async () => {
    setIsAnalyzing(true);
    setErrorMsg(null);
    try {
      const res = await api.reanalyzeInteraction(interaction.id);
      onAnalysisUpdated(res.data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to re-analyze interaction');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendResponse = async (markResolved: boolean = false) => {
    if (!responseDraft.trim()) {
      setErrorMsg('Response draft cannot be empty before sending.');
      return;
    }
    setIsSending(true);
    setErrorMsg(null);
    try {
      await api.sendResponse(interaction.id, {
        message: responseDraft.trim(),
        responderType: 'Agent',
        toneUsed: selectedTone,
        markResolved
      });
      setResponseDraft('');
      setInternalNotes('');
      onResponseSent();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch response');
    } finally {
      setIsSending(false);
    }
  };

  const numericScore = parseFloat(interaction.sentiment_score?.toString() || '0');
  const normalizedMeter = Math.round(((numericScore + 1) / 2) * 100);

  const getChurnBadge = () => {
    switch (interaction.churn_risk) {
      case 'Critical':
        return 'bg-red-950/80 text-red-300 border-red-500/50 ring-1 ring-red-500/30';
      case 'High':
        return 'bg-rose-950/80 text-rose-300 border-rose-500/40';
      case 'Medium':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/40';
      case 'Low':
      default:
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Gemini AI Studio
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-sky-950 text-sky-400 border border-sky-500/30">
                Live Co-Pilot
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Real-time Intent, Sentiment & Response Synthesizer</p>
          </div>
        </div>

        <button
          onClick={handleReanalyze}
          disabled={isAnalyzing}
          title="Force Gemini Re-analysis"
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700 text-xs flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin text-sky-400' : ''}`} />
          <span className="hidden sm:inline">Re-analyze</span>
        </button>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        {/* Intelligence Cards Section */}
        <div className="grid grid-cols-2 gap-3">
          {/* Sentiment Gauge */}
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium">Sentiment State</span>
              <span className="font-mono text-[10px]">{interaction.sentiment_score}</span>
            </div>
            <div>
              <SentimentBadge label={interaction.sentiment_label} score={interaction.sentiment_score} size="sm" />
            </div>
            {/* Visual meter bar */}
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden flex">
              <div
                className={`h-full transition-all duration-500 ${
                  numericScore > 0.3 ? 'bg-emerald-500' : numericScore < -0.3 ? 'bg-red-500' : 'bg-amber-500'
                }`}
                style={{ width: `${normalizedMeter}%` }}
              />
            </div>
          </div>

          {/* Churn Risk */}
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium">Churn Vulnerability</span>
              {interaction.churn_risk === 'Critical' && <Flame className="w-3.5 h-3.5 text-red-400 animate-bounce" />}
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-semibold ${getChurnBadge()}`}>
                <ShieldAlert className="w-3 h-3" />
                {interaction.churn_risk} Risk
              </span>
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              Priority: <span className="text-white font-medium">{interaction.priority}</span>
            </div>
          </div>
        </div>

        {/* AI Executive Summary */}
        {interaction.ai_summary && (
          <div className="p-3.5 rounded-xl bg-sky-950/20 border border-sky-500/20 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-sky-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gemini Issue Synthesis</span>
            </div>
            <p className="text-slate-300 leading-relaxed">{interaction.ai_summary}</p>
          </div>
        )}

        {/* Tone Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 block">
            Select Response Tone Strategy
          </label>
          <div className="grid grid-cols-2 gap-2">
            {tones.map(t => (
              <button
                key={t.type}
                type="button"
                onClick={() => setSelectedTone(t.type)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  selectedTone === t.type
                    ? 'bg-sky-600/20 border-sky-500 text-sky-200 ring-1 ring-sky-500/50'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-medium text-xs text-white">
                  <span>{t.icon}</span>
                  <span>{t.type}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Agent Instructions */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400 flex items-center justify-between">
            <span>Special Guidance for AI (Optional)</span>
            <span className="text-[10px] text-slate-500">e.g., mention 1 month free credit</span>
          </label>
          <input
            type="text"
            value={agentInstructions}
            onChange={e => setAgentInstructions(e.target.value)}
            placeholder="e.g. Offer 20% discount code SAVE20 and invite to executive call..."
            className="w-full text-xs px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-slate-200 placeholder-slate-600 outline-none"
          />
        </div>

        {/* Generate AI Draft CTA */}
        <button
          onClick={handleGenerateDraft}
          disabled={isGenerating}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Generating with Google Gemini...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate Smart Response Draft</span>
            </>
          )}
        </button>

        {/* Draft Output Area */}
        {responseDraft && (
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  AI Suggested Reply
                </span>
                {aiSource && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    Model: {aiSource}
                  </span>
                )}
              </div>
              <textarea
                rows={6}
                value={responseDraft}
                onChange={e => setResponseDraft(e.target.value)}
                className="w-full p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 text-slate-100 text-xs leading-relaxed focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none resize-none font-sans"
              />
            </div>

            {/* Internal Technical Notes */}
            {internalNotes && (
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs space-y-1">
                <div className="flex items-center gap-1 text-amber-400 font-semibold">
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Support Engineering Next Steps</span>
                </div>
                <div className="text-slate-300 text-[11px] whitespace-pre-wrap leading-relaxed">
                  {internalNotes}
                </div>
              </div>
            )}

            {/* Action Buttons: Send & Send + Resolve */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => handleSendResponse(false)}
                disabled={isSending}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Reply</span>
              </button>
              <button
                onClick={() => handleSendResponse(true)}
                disabled={isSending}
                className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950 transition-all active:scale-[0.98]"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Send & Resolve</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

