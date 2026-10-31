import React from 'react';
import { SentimentLabelType } from '../types';
import { Smile, Frown, AlertOctagon, Meh, Sparkles } from 'lucide-react';

interface SentimentBadgeProps {
  label: SentimentLabelType | string;
  score?: number | string | null;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
}

export const SentimentBadge: React.FC<SentimentBadgeProps> = ({
  label,
  score,
  size = 'md',
  showScore = true
}) => {
  const numericScore = score !== undefined && score !== null ? parseFloat(score.toString()) : null;

  const getConfig = () => {
    switch (label) {
      case 'Highly Positive':
        return {
          bg: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300',
          dot: 'bg-emerald-400',
          icon: <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
        };
      case 'Positive':
        return {
          bg: 'bg-teal-950/70 border-teal-500/40 text-teal-300',
          dot: 'bg-teal-400',
          icon: <Smile className="w-3.5 h-3.5 text-teal-400" />
        };
      case 'Neutral':
        return {
          bg: 'bg-slate-800/80 border-slate-600/40 text-slate-300',
          dot: 'bg-slate-400',
          icon: <Meh className="w-3.5 h-3.5 text-slate-400" />
        };
      case 'Frustrated':
        return {
          bg: 'bg-amber-950/70 border-amber-500/40 text-amber-300',
          dot: 'bg-amber-400',
          icon: <Frown className="w-3.5 h-3.5 text-amber-400" />
        };
      case 'Negative':
        return {
          bg: 'bg-rose-950/70 border-rose-500/40 text-rose-300',
          dot: 'bg-rose-400',
          icon: <Frown className="w-3.5 h-3.5 text-rose-400" />
        };
      case 'Critical Rage':
        return {
          bg: 'bg-red-950/80 border-red-500/60 text-red-300 animate-pulse-subtle',
          dot: 'bg-red-500 ring-2 ring-red-400/50',
          icon: <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
        };
      default:
        return {
          bg: 'bg-slate-800 border-slate-700 text-slate-300',
          dot: 'bg-slate-400',
          icon: <Meh className="w-3.5 h-3.5 text-slate-400" />
        };
    }
  };

  const config = getConfig();
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
    lg: 'text-sm px-3 py-1.5 gap-2.5 font-medium'
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border backdrop-blur-sm transition-all duration-200 ${config.bg} ${sizeClasses}`}
    >
      {config.icon}
      <span>{label}</span>
      {showScore && numericScore !== null && !isNaN(numericScore) && (
        <span className="font-mono text-[10px] opacity-75 border-l border-current/20 pl-1.5">
          {numericScore > 0 ? `+${numericScore.toFixed(2)}` : numericScore.toFixed(2)}
        </span>
      )}
    </span>
  );
};

