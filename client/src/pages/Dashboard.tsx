import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { DashboardMetrics, Interaction } from '../types';
import { MetricCard } from '../components/MetricCard';
import { DashboardCharts } from '../components/DashboardCharts';
import { SentimentBadge } from '../components/SentimentBadge';
import { ChannelIcon, DeviceBadge, PriorityBadge } from '../components/InteractionTable';
import {
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Flame,
  Plus,
  RefreshCw,
  Smartphone
} from 'lucide-react';

interface DashboardProps {
  onOpenNewInteraction: () => void;
  globalSearch: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenNewInteraction, globalSearch }) => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentInteractions, setRecentInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [m, recents] = await Promise.all([
        api.getDashboardMetrics(),
        api.getInteractions({ limit: 5 })
      ]);
      setMetrics(m);
      setRecentInteractions(recents.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Aggregating omnichannel intelligence...</p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-6 rounded-2xl bg-red-950/40 border border-red-500/30 text-center space-y-3 max-w-lg mx-auto mt-10">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
        <h3 className="text-base font-bold text-white">Dashboard Load Error</h3>
        <p className="text-xs text-slate-300">{error || 'Unable to retrieve metrics'}</p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { summary, recentHighRiskAlerts } = metrics;

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Executive CX Command Center
            </h2>
            <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono">
              Live
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time intent personalization, churn risk prediction, and Android touchpoint triage
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-xs flex items-center gap-1.5"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-sky-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={onOpenNewInteraction}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-sky-500/25 flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Interaction</span>
          </button>
        </div>
      </div>

      {/* High-Risk Churn Alerts Banner */}
      {recentHighRiskAlerts.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-950/60 via-slate-900 to-slate-900 border border-red-500/40 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                <Flame className="w-4 h-4" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-red-200 uppercase tracking-wide">
                Urgent Attention Required: {recentHighRiskAlerts.length} High Churn Risk Accounts Detected
              </h3>
            </div>
            <button
              onClick={() => navigate('/interactions?priority=Urgent')}
              className="text-xs text-red-300 hover:text-white flex items-center gap-1 font-semibold transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {recentHighRiskAlerts.map(alert => (
              <div
                key={alert.id}
                onClick={() => navigate(`/interactions/${alert.id}`)}
                className="p-3 rounded-xl bg-slate-950/70 border border-red-500/30 hover:border-red-400 cursor-pointer transition-all flex items-center justify-between gap-3 group"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <ChannelIcon channel={alert.channel} className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold text-white truncate group-hover:text-red-300 transition-colors">
                      {alert.subject}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <DeviceBadge device={alert.deviceType} />
                    <span className="text-red-400 font-bold">{alert.churnRisk} Churn</span>
                  </div>
                </div>
                <SentimentBadge label={alert.sentimentLabel} size="sm" showScore={false} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <MetricCard
          title="Total Ingested Interactions"
          value={summary.totalInteractions}
          subtitle="Across 5 channels"
          icon={<MessageSquare className="w-5 h-5" />}
          accentColor="blue"
          trend={{ value: 14.8, isPositive: true, label: 'vs last week' }}
        />
        <MetricCard
          title="Executive CSAT Score"
          value={`${summary.csatPercentage}%`}
          subtitle="Derived via Gemini sentiment"
          icon={<Sparkles className="w-5 h-5" />}
          accentColor="emerald"
          progress={summary.csatPercentage}
          trend={{ value: 3.2, isPositive: true }}
        />
        <MetricCard
          title="High Churn Vulnerability"
          value={summary.highRiskChurnCount}
          subtitle="Critical accounts at risk"
          icon={<AlertTriangle className="w-5 h-5 text-rose-400" />}
          accentColor="rose"
          trend={{ value: -12.5, isPositive: true, label: 'drop-off' }}
        />
        <MetricCard
          title="Resolution Velocity"
          value={`${summary.resolutionRate}%`}
          subtitle={`Avg ${summary.avgResponseTimeMinutes}m response`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          accentColor="purple"
          progress={summary.resolutionRate}
          trend={{ value: 8.4, isPositive: true }}
        />
      </div>

      {/* Recharts Analytics Section */}
      <DashboardCharts metrics={metrics} />

      {/* Recent OmniChannel Interactions Section */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              Latest Ingested Customer Engagements
            </h3>
            <p className="text-xs text-slate-400">Touchpoints triaged across mobile app, chat, email and voice</p>
          </div>
          <button
            onClick={() => navigate('/interactions')}
            className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 transition-colors"
          >
            <span>Open Interaction Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-800/80">
          {recentInteractions.map(item => (
            <div
              key={item.id}
              onClick={() => navigate(`/interactions/${item.id}`)}
              className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-800/40 rounded-xl cursor-pointer transition-colors"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <ChannelIcon channel={item.channel} />
                  <span className="text-xs font-bold text-white truncate hover:text-sky-400 transition-colors">
                    {item.subject}
                  </span>
                  <DeviceBadge device={item.device_type} />
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-2 truncate">
                  <span className="font-medium text-slate-300">{item.customer_name}</span>
                  <span>•</span>
                  <span className="truncate">{item.customer_company || item.customer_email}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
                <SentimentBadge label={item.sentiment_label} score={item.sentiment_score} size="sm" />
                <PriorityBadge priority={item.priority} />
                <span className="text-[11px] text-slate-500 font-mono">
                  {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

