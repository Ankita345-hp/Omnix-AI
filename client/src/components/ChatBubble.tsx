import React, { useState } from 'react';
import { InteractionResponse } from '../types';
import { Bot, User, ShieldCheck, Copy, Check } from 'lucide-react';

interface ChatBubbleProps {
  response: InteractionResponse;
  customerName?: string;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ response, customerName }) => {
  const [copied, setCopied] = useState(false);
  const isCustomer = response.responder_type === 'Customer';
  const isAiDraft = response.responder_type === 'AI_Draft';
  const isAgent = response.responder_type === 'Agent';

  const handleCopy = () => {
    navigator.clipboard.writeText(response.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedTime = new Date(response.created_at).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className={`flex gap-3 my-3.5 group ${isCustomer ? 'justify-start' : 'justify-end'}`}>
      {/* Customer Avatar on Left */}
      {isCustomer && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shadow-md">
          <User className="w-4 h-4" />
        </div>
      )}

      {/* Bubble Container */}
      <div className={`max-w-[85%] sm:max-w-[75%] space-y-1.5`}>
        {/* Header Metadata */}
        <div className={`flex items-center gap-2 text-xs px-1 ${isCustomer ? 'justify-start' : 'justify-end'}`}>
          <span className="font-semibold text-slate-300">
            {isCustomer
              ? customerName || response.sender_name || 'Customer'
              : isAiDraft
              ? 'OmniX Gemini Co-Pilot'
              : response.sender_name || 'Support Agent'}
          </span>

          {response.tone_used && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-sky-950/80 text-sky-300 border border-sky-500/30">
              Tone: {response.tone_used}
            </span>
          )}

          {isAiDraft && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-950/80 text-purple-300 border border-purple-500/40">
              <Bot className="w-3 h-3" /> AI Draft
            </span>
          )}

          <span className="text-[11px] text-slate-500">{formattedTime}</span>
        </div>

        {/* Message Box */}
        <div
          className={`relative rounded-2xl p-4 text-sm leading-relaxed shadow-md transition-all ${
            isCustomer
              ? 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-sm'
              : isAiDraft
              ? 'bg-purple-950/40 border border-purple-500/40 text-purple-100 rounded-tr-sm ring-1 ring-purple-500/20'
              : 'bg-sky-600 text-white rounded-tr-sm shadow-sky-900/30'
          }`}
        >
          <div className="whitespace-pre-wrap break-words">{response.message}</div>

          {/* Quick Copy Tooltip */}
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 hover:bg-black/60 text-slate-200"
            title="Copy message"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Agent/AI Avatar on Right */}
      {!isCustomer && (
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
            isAiDraft
              ? 'bg-purple-900/80 border border-purple-500/50 text-purple-300'
              : 'bg-sky-500/20 border border-sky-500/40 text-sky-400'
          }`}
        >
          {isAiDraft ? <Bot className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
        </div>
      )}
    </div>
  );
};

