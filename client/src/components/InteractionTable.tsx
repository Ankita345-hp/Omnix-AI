import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Interaction, ChannelType, DeviceType } from '../types';
import { SentimentBadge } from './SentimentBadge';
import {
  MessageSquare,
  Smartphone,
  Mail,
  Share2,
  PhoneCall,
  Laptop,
  Flame,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

interface InteractionTableProps {
  interactions: Interaction[];
  onSelect?: (interaction: Interaction) => void;
}

export const ChannelIcon: React.FC<{ channel: ChannelType; className?: string }> = ({ channel, className = 'w-4 h-4' }) => {
  switch (channel) {
    case 'Mobile App':
      return <Smartphone className={`${className} text-sky-400`} />;
    case 'Web Chat':
      return <MessageSquare className={`${className} text-emerald-400`} />;
    case 'Email':
      return <Mail className={`${className} text-amber-400`} />;
    case 'Social':
      return <Share2 className={`${className} text-pink-400`} />;
    case 'Voice':
      return <PhoneCall className={`${className} text-purple-400`} />;
    default:
      return <MessageSquare className={className} />;
  }
};

export const DeviceBadge: React.FC<{ device: DeviceType }> = ({ device }) => {
  const isAndroid = device === 'Android App';
  const isMobile = device === 'Mobile Web' || device === 'iOS App' || isAndroid;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-mono ${
        isAndroid
          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
          : isMobile
          ? 'bg-sky-950/80 text-sky-300 border border-sky-500/30'
          : 'bg-slate-800 text-slate-400 border border-slate-700/60'
      }`}
    >
      {isMobile ? <Smartphone className="w-3 h-3" /> : <Laptop className="w-3 h-3" />}
      <span>{device}</span>
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  const styles: Record<string, string> = {
    Urgent: 'bg-red-950/80 text-red-300 border-red-500/40',
    High: 'bg-rose-950/80 text-rose-300 border-rose-500/40',
    Medium: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
    Low: 'bg-slate-800 text-slate-300 border-slate-700'
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${styles[priority] || styles.Medium}`}>
      {priority}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    Escalated: 'bg-red-500/20 text-red-300 border-red-500/50',
    Open: 'bg-sky-500/20 text-sky-300 border-sky-500/50',
    'In Progress': 'bg-amber-500/20 text-amber-300 border-amber-500/50',
    Resolved: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.Open}`}>
      {status}
    </span>
  );
};

export const InteractionTable: React.FC<InteractionTableProps> = ({ interactions }) => {
  const navigate = useNavigate();

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold text-[11px]">
          <tr>
            <th className="py-3.5 px-4">Customer</th>
            <th className="py-3.5 px-4">Channel & Device</th>
            <th className="py-3.5 px-4">Subject & AI Summary</th>
            <th className="py-3.5 px-4">Sentiment</th>
            <th className="py-3.5 px-4">Churn Risk</th>
            <th className="py-3.5 px-4">Priority</th>
            <th className="py-3.5 px-4">Status</th>
            <th className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 text-slate-300">
          {interactions.map(item => {
            const timeAgo = formatTimeAgo(item.created_at);
            return (
              <tr
                key={item.id}
                onClick={() => navigate(`/interactions/${item.id}`)}
                className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
              >
                {/* Customer */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="font-semibold text-white group-hover:text-sky-400 transition-colors">
                    {item.customer_name || 'Anonymous User'}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span>{item.customer_company || item.customer_email || 'Direct Ingestion'}</span>
                    {item.customer_tier && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300 font-medium">
                        {item.customer_tier}
                      </span>
                    )}
                  </div>
                </td>

                {/* Channel & Device */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <ChannelIcon channel={item.channel} />
                    <span className="font-medium text-slate-200">{item.channel}</span>
                  </div>
                  <div className="mt-1">
                    <DeviceBadge device={item.device_type} />
                  </div>
                </td>

                {/* Subject & Summary */}
                <td className="py-3.5 px-4 max-w-xs md:max-w-sm">
                  <div className="font-medium text-white truncate">{item.subject}</div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">
                    {item.ai_summary || item.raw_message}
                  </div>
                </td>

                {/* Sentiment */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <SentimentBadge label={item.sentiment_label} score={item.sentiment_score} size="sm" />
                </td>

                {/* Churn Risk */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      item.churn_risk === 'Critical'
                        ? 'bg-red-950 text-red-300 border border-red-500/50'
                        : item.churn_risk === 'High'
                        ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                        : item.churn_risk === 'Medium'
                        ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {item.churn_risk === 'Critical' && <Flame className="w-3 h-3 text-red-400" />}
                    {item.churn_risk}
                  </span>
                </td>

                {/* Priority */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <PriorityBadge priority={item.priority} />
                </td>

                {/* Status */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <StatusBadge status={item.status} />
                </td>

                {/* Action */}
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-[11px] text-slate-500">{timeAgo}</span>
                    <div className="p-1.5 rounded-lg bg-slate-800 text-slate-400 group-hover:text-white group-hover:bg-sky-600 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

function formatTimeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

