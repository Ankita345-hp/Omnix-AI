import React, { useState } from 'react';
import { KbArticle } from '../types';
import { BookOpen, Copy, Check, Tag, ChevronDown, ChevronUp } from 'lucide-react';

interface KnowledgeBaseCardProps {
  article: KbArticle;
}

export const KnowledgeBaseCard: React.FC<KnowledgeBaseCardProps> = ({ article }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(article.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all shadow-md space-y-3">
      {/* Category & Action */}
      <div className="flex items-center justify-between gap-2">
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-950/80 text-sky-300 border border-sky-500/30">
          {article.category}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Solution</span>
            </>
          )}
        </button>
      </div>

      {/* Title */}
      <h4 className="text-sm sm:text-base font-bold text-white leading-snug">
        {article.title}
      </h4>

      {/* Content */}
      <p className={`text-xs text-slate-300 leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>
        {article.content}
      </p>

      {/* Toggle Expand if content is long */}
      {article.content.length > 180 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium transition-colors"
        >
          {expanded ? (
            <>
              <span>Show Less</span>
              <ChevronUp className="w-3 h-3" />
            </>
          ) : (
            <>
              <span>Read Full Article</span>
              <ChevronDown className="w-3 h-3" />
            </>
          )}
        </button>
      )}

      {/* Tags & Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
        <div className="flex flex-wrap items-center gap-1.5">
          <Tag className="w-3 h-3 text-slate-600" />
          {article.tags.map((t, idx) => (
            <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              #{t}
            </span>
          ))}
        </div>
        <div>
          By {article.author_name || 'OmniX Support'}
        </div>
      </div>
    </div>
  );
};

