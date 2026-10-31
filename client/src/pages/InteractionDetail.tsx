import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Interaction, InteractionResponse, StatusType, PriorityType } from '../types';
import { ChatBubble } from '../components/ChatBubble';
import { AiStudioPanel } from '../components/AiStudioPanel';
import { ChannelIcon, DeviceBadge, PriorityBadge, StatusBadge } from '../components/InteractionTable';
import { SentimentBadge } from '../components/SentimentBadge';
import {
  ArrowLeft,
  User,
  Building,
  Mail,
  Phone,
  Send,
  CheckCircle,
  RefreshCw,
  Sparkles,
  Flame,
  MessageSquare,
  Cpu,
  Clock
} from 'lucide-react';

export const InteractionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [interaction, setInteraction] = useState<Interaction | null>(null);
  const [responses, setResponses] = useState<InteractionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Manual reply state
  const [manualReply, setManualReply] = useState('');
  const [isSendingManual, setIsSendingManual] = useState(false);

  // Mobile tab state: 'thread' | 'ai'
  const [mobileTab, setMobileTab] = useState<'thread' | 'ai'>('thread');

  const loadInteraction = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.getInteraction(id);
      setInteraction(res.interaction);
      setResponses(res.responses);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load interaction thread');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInteraction();
  }, [id]);

  const handleStatusChange = async (newStatus: StatusType) => {
    if (!id || !interaction) return;
    try {
      const updated = await api.updateInteraction(id, { status: newStatus });
      setInteraction(prev => (prev ? { ...prev, status: newStatus } : null));
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const handlePriorityChange = async (newPriority: PriorityType) => {
    if (!id || !interaction) return;
    try {
      await api.updateInteraction(id, { priority: newPriority });
      setInteraction(prev => (prev ? { ...prev, priority: newPriority } : null));
    } catch (err: any) {
      alert(`Priority update failed: ${err.message}`);
    }
  };

  const handleSendManual = async (markResolved: boolean = false) => {
    if (!id || !manualReply.trim()) return;
    setIsSendingManual(true);
    try {
      const newResp = await api.sendResponse(id, {
        message: manualReply.trim(),
        responderType: 'Agent',
        markResolved
      });
      setResponses(prev => [...prev, newResp]);
      setManualReply('');
      if (markResolved && interaction) {
        setInteraction({ ...interaction, status: 'Resolved' });
      }
    } catch (err: any) {
      alert(`Failed to send message: ${err.message}`);
    } finally {
      setIsSendingManual(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-xs text-slate-400">Loading customer workspace & Gemini Studio...</p>
      </div>
    );
  }

  if (error || !interaction) {
    return (
      <div className="p-8 rounded-2xl bg-red-950/40 border border-red-500/30 text-center space-y-4 max-w-lg mx-auto mt-10">
        <h3 className="text-base font-bold text-white">Interaction Not Found</h3>
        <p className="text-xs text-slate-300">{error || 'Unable to find interaction details.'}</p>
        <button
          onClick={() => navigate('/interactions')}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
        >
          Return to Queue
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in pb-16">
      {/* Top Breadcrumb & Status Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/interactions')}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500">#{interaction.id.slice(0, 8)}</span>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-semibold text-slate-400">{interaction.category}</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white leading-tight truncate max-w-xl">
              {interaction.subject}
            </h2>
          </div>
        </div>

        {/* Status & Priority Selectors */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <select
            value={interaction.status}
            onChange={e => handleStatusChange(e.target.value as StatusType)}
            className="text-xs px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-medium focus:border-sky-500 outline-none cursor-pointer"
          >
            <option value="Open">Status: Open</option>
            <option value="In Progress">Status: In Progress</option>
            <option value="Escalated">Status: Escalated</option>
            <option value="Resolved">Status: Resolved</option>
          </select>

          <select
            value={interaction.priority}
            onChange={e => handlePriorityChange(e.target.value as PriorityType)}
            className="text-xs px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-medium focus:border-sky-500 outline-none cursor-pointer"
          >
            <option value="Low">Priority: Low</option>
            <option value="Medium">Priority: Medium</option>
            <option value="High">Priority: High</option>
            <option value="Urgent">Priority: Urgent</option>
          </select>
        </div>
      </div>

      {/* Customer Quick Profile Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-sm">
            {interaction.customer_name?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">{interaction.customer_name}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                {interaction.customer_tier || 'Standard'} Tier
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
              <span>{interaction.customer_company || 'Independent'}</span>
              <span>•</span>
              <span>{interaction.customer_email}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <ChannelIcon channel={interaction.channel} />
            <span className="font-semibold text-white">{interaction.channel}</span>
            <DeviceBadge device={interaction.device_type} />
          </div>

          <div className="pl-3 border-l border-slate-800">
            <SentimentBadge label={interaction.sentiment_label} score={interaction.sentiment_score} size="sm" />
          </div>
        </div>
      </div>

      {/* Mobile Tab Switcher (Visible on smartphone screens) */}
      <div className="flex lg:hidden p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
        <button
          onClick={() => setMobileTab('thread')}
          className={`flex-1 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
            mobileTab === 'thread'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Thread History ({responses.length})</span>
        </button>

        <button
          onClick={() => setMobileTab('ai')}
          className={`flex-1 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
            mobileTab === 'ai'
              ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-sky-400" />
          <span>Gemini AI Studio</span>
        </button>
      </div>

      {/* Main 2-Column Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Conversation Thread & Manual Reply Box */}
        <div className={`lg:col-span-7 space-y-4 ${mobileTab === 'ai' ? 'hidden lg:block' : 'block'}`}>
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-400" />
                Customer Thread History
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                {responses.length} Messages
              </span>
            </div>

            {/* Conversation Messages */}
            <div className="space-y-2 min-h-[320px] max-h-[550px] overflow-y-auto pr-1">
              {responses.map(resp => (
                <ChatBubble
                  key={resp.id}
                  response={resp}
                  customerName={interaction.customer_name}
                />
              ))}
            </div>

            {/* Manual Reply Form */}
            <div className="pt-3 border-t border-slate-800 space-y-2.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Direct Agent Reply (or use Gemini Studio on right)
              </label>
              <textarea
                rows={3}
                value={manualReply}
                onChange={e => setManualReply(e.target.value)}
                placeholder="Type your response to the customer..."
                className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-white placeholder-slate-600 outline-none resize-none leading-relaxed"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleSendManual(false)}
                  disabled={isSendingManual || !manualReply.trim()}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSendManual(true)}
                  disabled={isSendingManual || !manualReply.trim()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950 disabled:opacity-40"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Send & Resolve</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Studio Panel */}
        <div className={`lg:col-span-5 ${mobileTab === 'thread' ? 'hidden lg:block' : 'block'}`}>
          <AiStudioPanel
            interaction={interaction}
            onResponseSent={loadInteraction}
            onAnalysisUpdated={updated => setInteraction(updated)}
          />
        </div>
      </div>
    </div>
  );
};

