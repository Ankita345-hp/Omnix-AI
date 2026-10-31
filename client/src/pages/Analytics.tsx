import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { DashboardMetrics } from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  LineChart,
  Line,
  Legend
} from 'recharts';
import {
  BarChart3,
  TrendingDown,
  AlertOctagon,
  Clock,
  Layers,
  Sparkles,
  RefreshCw,
  Smartphone,
  ShieldCheck
} from 'lucide-react';

export const Analytics: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await api.getDashboardMetrics();
        setMetrics(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  // Department Workloads
  const departmentWorkloadData = [
    { department: 'Mobile & App Support', tickets: 38, avgResolutionHours: 2.1, csat: 89 },
    { department: 'Billing & Retention', tickets: 27, avgResolutionHours: 4.8, csat: 76 },
    { department: 'Enterprise Triage', tickets: 19, avgResolutionHours: 1.4, csat: 94 },
    { department: 'Identity & SSO', tickets: 15, avgResolutionHours: 3.2, csat: 86 }
  ];

  // Resolution Bottlenecks
  const bottlenecksData = [
    { issue: 'Android Google Pay Intent Freeze', frequency: 18, churnCorrelation: 92, avgDelayMin: 45 },
    { issue: 'SAML 2.0 Cert Fingerprint Mismatch', frequency: 12, churnCorrelation: 68, avgDelayMin: 32 },
    { issue: 'CSV Export Queue Latency Spike', frequency: 9, churnCorrelation: 54, avgDelayMin: 55 },
    { issue: 'Webhook 429 Throttle Rate Limit', frequency: 7, churnCorrelation: 28, avgDelayMin: 18 }
  ];

  // Channel SLA Performance
  const channelSlaData = [
    { channel: 'Mobile App', firstResponseSec: 42, slaTargetMet: 98 },
    { channel: 'Web Chat', firstResponseSec: 35, slaTargetMet: 99 },
    { channel: 'Email Inbound', firstResponseSec: 240, slaTargetMet: 91 },
    { channel: 'Social Mention', firstResponseSec: 75, slaTargetMet: 95 },
    { channel: 'Voice Call', firstResponseSec: 20, slaTargetMet: 97 }
  ];

  if (loading || !metrics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-xs text-slate-400">Synthesizing deep CX analytics & SLA metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Advanced CX Intelligence & Root Cause Analytics
          </h2>
          <span className="p-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/30 text-xs font-mono">
            Deep Analysis
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Resolution bottlenecks, department workload balancing, and mobile client friction correlation
        </p>
      </div>

      {/* Grid Charts: Department Workload & Channel SLA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Department Workload */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                Department Ticket Distribution & Workload
              </h3>
              <p className="text-xs text-slate-400">Active queue allocation by specialized engineering pods</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentWorkloadData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="department" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    fontSize: '11px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="tickets" name="Active Tickets" fill="#0284c7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Channel SLA & Response Speed */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                Channel SLA Target Adherence (%)
              </h3>
              <p className="text-xs text-slate-400">First-response benchmark compliance across touchpoints</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold">96.2% Avg SLA</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={channelSlaData}
                margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis type="number" domain={[80, 100]} stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis dataKey="channel" type="category" stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    fontSize: '11px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="slaTargetMet" name="SLA Compliance %" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Root Cause Bottlenecks Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              Primary Customer Friction Bottlenecks & Churn Risk Drivers
            </h3>
            <p className="text-xs text-slate-400">
              Heuristic and Gemini correlation ranking of issues causing churn intent
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Friction Root Cause</th>
                <th className="py-3 px-3">Detected Frequency</th>
                <th className="py-3 px-3">Avg Resolution Delay</th>
                <th className="py-3 px-3">Churn Correlation Impact</th>
                <th className="py-3 px-3 text-right">Strategic Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {bottlenecksData.map((b, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-semibold text-white flex items-center gap-2">
                    <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                    <span>{b.issue}</span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300">{b.frequency} incidents</td>
                  <td className="py-3 px-3 font-mono text-slate-300">{b.avgDelayMin} mins</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            b.churnCorrelation > 80 ? 'bg-red-500' : b.churnCorrelation > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${b.churnCorrelation}%` }}
                        />
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">{b.churnCorrelation}% Risk</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-sky-950 text-sky-300 border border-sky-500/30">
                      Auto-De-escalate
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

