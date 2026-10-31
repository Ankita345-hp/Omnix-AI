import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ChannelType, DeviceType, TierType } from '../types';
import {
  X,
  Sparkles,
  RefreshCw,
  AlertCircle,
  MessageSquare,
  Smartphone,
  Mail,
  Share2,
  PhoneCall,
  Laptop
} from 'lucide-react';

interface NewInteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export const NewInteractionModal: React.FC<NewInteractionModalProps> = ({
  isOpen,
  onClose,
  onCreated
}) => {
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [company, setCompany] = useState('');
  const [tier, setTier] = useState<TierType>('Standard');
  const [channel, setChannel] = useState<ChannelType>('Mobile App');
  const [deviceType, setDeviceType] = useState<DeviceType>('Android App');
  const [rawMessage, setRawMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const samplePresets = [
    {
      label: 'Team Crash on Open (VIP Enterprise - Urgent)',
      name: 'Jordan Miller',
      email: 'jmiller@vanguard-holdings.com',
      company: 'Vanguard Holdings LLC',
      tier: 'Enterprise' as TierType,
      channel: 'Mobile App' as ChannelType,
      device: 'Android App' as DeviceType,
      message: 'My team reported that the app was crashing everytime while opening. We are on the VIP Enterprise tier and this is blocking all field operations today!'
    },
    {
      label: 'Android In-App Crash (Critical Rage)',
      name: 'Alexander Hayes',
      email: 'alexander.hayes@apexfintech.io',
      company: 'Apex Global FinTech',
      tier: 'Enterprise' as TierType,
      channel: 'Mobile App' as ChannelType,
      device: 'Android App' as DeviceType,
      message: "I've been trying to upgrade my enterprise subscription on the Android mobile app for 2 days and kept getting payment errors! The app freezes and locks our team dashboard. Fix this immediately or we will cancel our annual contract!"
    },
    {
      label: 'SSO Okta Token Failure (High Urgency)',
      name: 'Dr. Maya Patel',
      email: 'mpatel@biovista-labs.com',
      company: 'BioVista Diagnostics',
      tier: 'Gold' as TierType,
      channel: 'Email' as ChannelType,
      device: 'Desktop' as DeviceType,
      message: "Good morning team. We noticed our lab scientists are getting 'Error 403: Token Invalid' when logging in via Okta SAML since the 08:00 UTC maintenance. Could your identity engineering team investigate the cert fingerprint?"
    },
    {
      label: 'Feature & Kafka Scaling (Delighted)',
      name: 'Lucas Tremblay',
      email: 'lucas@quantumcloud.ca',
      company: 'Quantum Cloud Networks',
      tier: 'Silver' as TierType,
      channel: 'Web Chat' as ChannelType,
      device: 'Desktop' as DeviceType,
      message: "Hi, love the platform! Quick question: what is the concurrent outbound webhook throughput for Silver accounts? We are streaming events into our Apache Kafka cluster and want to prevent 429 throttling."
    }
  ];

  const handleApplyPreset = (p: typeof samplePresets[0]) => {
    setCustomerName(p.name);
    setCustomerEmail(p.email);
    setCompany(p.company);
    setTier(p.tier);
    setChannel(p.channel);
    setDeviceType(p.device);
    setRawMessage(p.message);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (customerName.trim().length < 2) {
      setErrorMsg('Customer name must be at least 2 characters.');
      return;
    }
    if (!customerEmail.includes('@') || !customerEmail.includes('.')) {
      setErrorMsg('Please enter a valid customer email.');
      return;
    }
    if (rawMessage.trim().length < 10) {
      setErrorMsg('Message must be at least 10 characters.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const created = await api.createInteraction({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        company: company.trim() || undefined,
        tier,
        channel,
        deviceType,
        rawMessage: rawMessage.trim()
      });

      onClose();
      if (onCreated) onCreated();
      navigate(`/interactions/${created.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit interaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Ingest Omnichannel Interaction</h3>
              <p className="text-xs text-slate-400">Trigger synchronous Google Gemini sentiment & triage analysis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets Carousel */}
        <div className="px-5 pt-3 pb-1 border-b border-slate-800/60 bg-slate-950/30">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
            Quick Pre-fills / Realistic Scenarios:
          </span>
          <div className="flex flex-wrap gap-2 pb-2">
            {samplePresets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-colors flex items-center gap-1.5"
              >
                <span>⚡</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Customer Name *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Alexander Hayes"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-white placeholder-slate-600 outline-none"
              />
            </div>

            {/* Customer Email */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Customer Email *</label>
              <input
                type="email"
                required
                value={customerEmail}
                onChange={e => setCustomerEmail(e.target.value)}
                placeholder="alexander@apexfintech.io"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-white placeholder-slate-600 outline-none"
              />
            </div>

            {/* Company */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Company (Optional)</label>
              <input
                type="text"
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="Apex Global FinTech"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-white placeholder-slate-600 outline-none"
              />
            </div>

            {/* Account Tier */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Customer Tier</label>
              <select
                value={tier}
                onChange={e => setTier(e.target.value as TierType)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-white outline-none cursor-pointer"
              >
                <option value="Standard">Standard Tier</option>
                <option value="Silver">Silver Tier</option>
                <option value="Gold">Gold Tier</option>
                <option value="Enterprise">Enterprise Tier (VIP)</option>
              </select>
            </div>
          </div>

          {/* Channel & Device Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Ingestion Channel</label>
              <select
                value={channel}
                onChange={e => setChannel(e.target.value as ChannelType)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-white outline-none cursor-pointer"
              >
                <option value="Mobile App">Mobile App Support</option>
                <option value="Web Chat">Live Web Chat</option>
                <option value="Email">Direct Email Inbound</option>
                <option value="Social">Social Mention (Twitter / LinkedIn)</option>
                <option value="Voice">Voice Call Transcript</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Client Device Type</label>
              <select
                value={deviceType}
                onChange={e => setDeviceType(e.target.value as DeviceType)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-white outline-none cursor-pointer"
              >
                <option value="Android App">Android App (Mobile Client)</option>
                <option value="Desktop">Desktop Browser</option>
                <option value="Mobile Web">Mobile Web Browser</option>
                <option value="iOS App">iOS App</option>
              </select>
            </div>
          </div>

          {/* Raw Message */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-300">Customer Message / Voice Transcript *</label>
              <span className={`font-mono text-[11px] ${rawMessage.length > 1800 ? 'text-amber-400' : 'text-slate-500'}`}>
                {rawMessage.length}/2000
              </span>
            </div>
            <textarea
              required
              rows={4}
              value={rawMessage}
              onChange={e => setRawMessage(e.target.value)}
              placeholder="Enter the customer message, feedback, or call transcript..."
              className="w-full text-xs p-3.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-white placeholder-slate-600 outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-sky-500/25 flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Ingest & Run AI Analysis</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

