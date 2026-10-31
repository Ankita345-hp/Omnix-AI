import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Interaction } from '../types';
import { SentimentBadge } from './SentimentBadge';
import { ChannelIcon, DeviceBadge, PriorityBadge, StatusBadge } from './InteractionTable';
import { ChevronRight, Flame, Clock, User } from 'lucide-react';

interface InteractionCardListProps {
  interactions: Interaction[];
}

export const InteractionCardList: React.FC<InteractionCardListProps> = ({ interactions }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-3 sm:space-y-4">
      {interactions.map(item => {
        const timeAgo = formatTimeAgo(item.created_at);
        const isCritical = item.churn_risk === 'Critical' || item.priority === 'Urgent';

        return (
          <div
            key={item.id}
            onClick={() => navigate(`/interactions/${item.id}`)}
            className={`p-4 rounded-2xl bg-slate-900 border transition-all active:scale-[0.99] cursor-pointer shadow-md ${
              isCritical
                ? 'border-red-500/40 bg-gradient-to-r from-red-950/20 to-slate-900'
                : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            {/* Top Bar: Channel, Device, Status */}
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
                  <ChannelIcon channel={item.channel} className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-white">{item.channel}</span>
                <DeviceBadge device={item.device_type} />
              </div>
              <StatusBadge status={item.status} />
            </div>

            {/* Subject and Customer */}
            <div className="py-2.5 space-y-1">
              <h4 className="text-sm font-semibold text-white leading-snug line-clamp-2">
                {item.subject}
              </h4>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {item.ai_summary || item.raw_message}
              </p>
            </div>

            {/* Badges Row: Sentiment, Churn Risk, Priority */}
            <div className="flex flex-wrap items-center gap-2 pt-1 pb-2">
              <SentimentBadge label={item.sentiment_label} score={item.sentiment_score} size="sm" />
              <span
                className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                  item.churn_risk === 'Critical'
                    ? 'bg-red-950/80 text-red-300 border border-red-500/50'
                    : item.churn_risk === 'High'
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                    : item.churn_risk === 'Medium'
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {item.churn_risk === 'Critical' && <Flame className="w-3 h-3 text-red-400" />}
                {item.churn_risk} Churn Risk
              </span>
              <PriorityBadge priority={item.priority} />
            </div>

            {/* Footer: Customer Info & Timestamp */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60 mt-1">
              <div className="flex items-center gap-1.5 truncate pr-2">
                <User className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                <span className="font-medium text-slate-300 truncate">
                  {item.customer_name || 'Customer'}
                </span>
                {item.customer_company && (
                  <span className="text-slate-500 truncate hidden xs:inline">
                    • {item.customer_company}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0 text-[11px] text-slate-500">
                <Clock className="w-3 h-3" />
                <span>{timeAgo}</span>
                <ChevronRight className="w-4 h-4 text-slate-400 ml-1" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

function formatTimeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

