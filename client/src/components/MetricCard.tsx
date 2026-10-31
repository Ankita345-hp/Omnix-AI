import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label?: string;
    isPositive?: boolean;
    neutral?: boolean;
  };
  accentColor?: 'blue' | 'emerald' | 'amber' | 'rose' | 'purple';
  progress?: number;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  accentColor = 'blue',
  progress
}) => {
  const colorMap = {
    blue: 'from-sky-500/10 to-blue-600/5 border-sky-500/20 text-sky-400',
    emerald: 'from-emerald-500/10 to-teal-600/5 border-emerald-500/20 text-emerald-400',
    amber: 'from-amber-500/10 to-orange-600/5 border-amber-500/20 text-amber-400',
    rose: 'from-rose-500/10 to-red-600/5 border-rose-500/20 text-rose-400',
    purple: 'from-purple-500/10 to-indigo-600/5 border-purple-500/20 text-purple-400'
  };

  const barColor = {
    blue: 'bg-sky-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    purple: 'bg-purple-500'
  }[accentColor];

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-slate-900/80 border p-5 transition-all duration-300 hover:border-slate-600 hover:shadow-lg hover:shadow-slate-950/50 ${colorMap[accentColor]}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{value}</div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-inner">
          {icon}
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 flex items-center justify-between text-xs">
          {subtitle && <span className="text-slate-400 truncate">{subtitle}</span>}
          {trend && (
            <div
              className={`flex items-center gap-0.5 font-medium px-2 py-0.5 rounded-full ${
                trend.neutral
                  ? 'bg-slate-800 text-slate-300'
                  : trend.isPositive
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-950/80 text-rose-400 border border-rose-500/30'
              }`}
            >
              {trend.neutral ? (
                <Minus className="w-3 h-3" />
              ) : trend.isPositive ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              <span>{Math.abs(trend.value)}%</span>
              {trend.label && <span className="text-[10px] text-slate-400 ml-0.5">{trend.label}</span>}
            </div>
          )}
        </div>
      )}

      {progress !== undefined && (
        <div className="mt-3.5 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </div>
  );
};

