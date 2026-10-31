import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { CustomerSummary, CustomerJourneyDetail, Interaction } from '../types';
import { SentimentBadge } from '../components/SentimentBadge';
import { ChannelIcon, DeviceBadge, PriorityBadge, StatusBadge } from '../components/InteractionTable';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import {
  GitFork,
  User,
  Building,
  DollarSign,
  Smartphone,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Flame,
  ArrowRight,
  ShieldAlert,
  Clock
} from 'lucide-react';

export const JourneyMap: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [journeyDetail, setJourneyDetail] = useState<CustomerJourneyDetail | null>(null);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingJourney, setLoadingJourney] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load customer list
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const list = await api.getCustomers();
        setCustomers(list);
        const queryId = searchParams.get('customerId');
        if (queryId && list.some(c => c.id === queryId)) {
          setSelectedCustomerId(queryId);
        } else if (list.length > 0) {
          setSelectedCustomerId(list[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load customers');
      } finally {
        setLoadingCustomers(false);
      }
    };
    loadCustomers();
  }, [searchParams]);

  // Load selected customer's journey
  useEffect(() => {
    if (!selectedCustomerId) return;
    const loadJourney = async () => {
      setLoadingJourney(true);
      try {
        const detail = await api.getCustomerJourney(selectedCustomerId);
        setJourneyDetail(detail);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load journey map');
      } finally {
        setLoadingJourney(false);
      }
    };
    loadJourney();
  }, [selectedCustomerId]);

  const handleSelectCustomer = (id: string) => {
    setSelectedCustomerId(id);
    setSearchParams({ customerId: id });
  };

  if (loadingCustomers) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-xs text-slate-400">Mapping omnichannel customer journeys...</p>
      </div>
    );
  }

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const journeyStages = [
    { label: 'Onboarding', desc: 'Initial Setup' },
    { label: 'Active Usage', desc: 'Regular Feature Usage' },
    { label: 'Friction Point', desc: 'Latency / Gateway Errors' },
    { label: 'De-escalation', desc: 'Gemini AI Intervention' },
    { label: 'Advocacy', desc: 'Retention & Loyalty' }
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Omnichannel Customer Journey Map
            </h2>
            <span className="p-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/30 text-xs font-mono">
              Timeline Tracking
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Visualize multi-touchpoint progression, channel-switching habits, and emotional shifts
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs">
          {error}
        </div>
      )}

      {/* Main Grid: Customer Selector on Left / Timeline on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Customer Selector Sidebar */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Customer Accounts</span>
            <span className="text-[11px] font-mono text-slate-500">{customers.length} total</span>
          </h3>

          <div className="space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
            {customers.map(c => {
              const isSelected = c.id === selectedCustomerId;
              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectCustomer(c.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-sky-500 shadow-lg shadow-sky-950/40 ring-1 ring-sky-500/40'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-0.5">
                      <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                        <span>{c.name}</span>
                        {c.overallChurnRisk === 'Critical' && (
                          <Flame className="w-3.5 h-3.5 text-red-400 animate-pulse flex-shrink-0" />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {c.company || c.email}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                      {c.tier}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2.5 mt-2 border-t border-slate-800/80">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">LTV:</span>
                      <span className="text-emerald-400 font-mono font-medium">
                        ${c.lifetimeValue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px]">
                      <span className="text-slate-500">Touchpoints:</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-white font-mono font-bold">
                        {c.totalTouchpoints}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Customer Journey Dashboard & Timeline */}
        <div className="lg:col-span-8 space-y-5">
          {loadingJourney || !journeyDetail ? (
            <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <RefreshCw className="w-6 h-6 text-sky-400 animate-spin" />
              <p className="text-xs text-slate-400">Loading customer timeline and touchpoints...</p>
            </div>
          ) : (
            <>
              {/* Customer Header Card */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">{journeyDetail.customer.name}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-500/30">
                        {journeyDetail.customer.tier} Tier
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {journeyDetail.customer.company} • {journeyDetail.customer.email}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-semibold text-slate-400">Account Value</div>
                      <div className="text-base font-bold text-emerald-400 font-mono">
                        ${journeyDetail.customer.lifetimeValue.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Journey Progression Stage Tracker */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">Journey Progression Phase</span>
                    <span className="font-mono text-sky-400 text-[11px] font-bold">
                      Current: {journeyDetail.currentStage}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                    {journeyStages.map((stg, idx) => {
                      const isActive =
                        journeyDetail.currentStage.includes('Friction') && idx === 2
                          ? true
                          : journeyDetail.currentStage.includes('Advocacy') && idx === 4
                          ? true
                          : idx <= 2;

                      return (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl border text-center transition-all ${
                            isActive
                              ? 'bg-sky-950/50 border-sky-500/50 text-sky-200'
                              : 'bg-slate-950/50 border-slate-800/80 text-slate-500'
                          }`}
                        >
                          <div className="text-[11px] font-bold truncate">{stg.label}</div>
                          <div className="text-[9px] text-slate-400 truncate mt-0.5">{stg.desc}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Sentiment Trajectory Chart */}
              {journeyDetail.sentimentTrajectory.length > 1 && (
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                        Multi-touchpoint Sentiment Trajectory
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Tracks emotional shifts from positive inquiry to critical bottlenecks
                      </p>
                    </div>
                  </div>

                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={journeyDetail.sentimentTrajectory} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorSent" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                        <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
                        <YAxis stroke="#64748b" domain={[-1, 1]} tick={{ fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            border: '1px solid #334155',
                            borderRadius: '10px',
                            fontSize: '11px',
                            color: '#fff'
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="score"
                          name="Sentiment Score"
                          stroke="#38bdf8"
                          strokeWidth={2}
                          fill="url(#colorSent)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Visual Sequential Touchpoint Timeline */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-sky-400" />
                    Touchpoint Chronicle ({journeyDetail.timeline.length} Ingested Engagements)
                  </h4>
                </div>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
                  {journeyDetail.timeline.map((item, idx) => (
                    <div key={item.id} className="relative group">
                      {/* Timeline Dot Indicator */}
                      <div
                        className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          item.churn_risk === 'Critical'
                            ? 'bg-red-950 border-red-500 ring-4 ring-red-500/20'
                            : item.status === 'Resolved'
                            ? 'bg-emerald-950 border-emerald-500'
                            : 'bg-sky-950 border-sky-500'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>

                      {/* Touchpoint Card */}
                      <div
                        onClick={() => navigate(`/interactions/${item.id}`)}
                        className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-all space-y-2 group-hover:bg-slate-950"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <ChannelIcon channel={item.channel} />
                            <span className="text-xs font-bold text-white">{item.channel}</span>
                            <DeviceBadge device={item.device_type} />
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {new Date(item.created_at).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <h5 className="text-xs font-bold text-white group-hover:text-sky-400 transition-colors">
                            {item.subject}
                          </h5>
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {item.ai_summary || item.raw_message}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-900">
                          <div className="flex items-center gap-2">
                            <SentimentBadge label={item.sentiment_label} score={item.sentiment_score} size="sm" />
                            <PriorityBadge priority={item.priority} />
                            <StatusBadge status={item.status} />
                          </div>

                          <div className="text-xs text-sky-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-semibold">
                            <span>Open Studio</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

