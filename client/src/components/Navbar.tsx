import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  Menu,
  Plus,
  Sparkles,
  Search,
  Cpu,
  Layers,
  Smartphone,
  ShieldCheck
} from 'lucide-react';

interface NavbarProps {
  onToggleMobileMenu: () => void;
  onOpenNewInteraction: () => void;
  globalSearch: string;
  onGlobalSearchChange: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileMenu,
  onOpenNewInteraction,
  globalSearch,
  onGlobalSearchChange
}) => {
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Executive CX Overview';
    if (path.startsWith('/journey')) return 'Customer Journey Map';
    if (path === '/interactions') return 'Omnichannel Interaction Queue';
    if (path.startsWith('/interactions/')) return 'Interaction Workspace & AI Studio';
    if (path.startsWith('/analytics')) return 'Advanced CX Analytics';
    if (path.startsWith('/knowledge-base')) return 'Knowledge Base & RAG Assistant';
    if (path.startsWith('/settings')) return 'System & AI Configuration';
    return 'OmniX-AI Platform';
  };

  return (
    <header className="sticky top-0 z-30 w-full glass-panel px-4 sm:px-6 py-3 transition-all">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Mobile Drawer Button & Route Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            aria-label="Toggle navigation drawer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {getPageTitle()}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-950/80 text-sky-400 border border-sky-500/30">
                <Sparkles className="w-2.5 h-2.5" /> Gemini 2.5
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Continuous omnichannel triage & customer experience intelligence
            </p>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={globalSearch}
              onChange={e => onGlobalSearchChange(e.target.value)}
              placeholder="Search across all customer tickets, channels, or churn alerts..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Right: Ingest Action & Agent Pill */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenNewInteraction}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-sky-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">New Interaction</span>
            <span className="xs:hidden">New</span>
          </button>

          {/* Active Agent Profile Pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"
                alt="Agent Avatar"
                className="w-8 h-8 rounded-full object-cover border border-slate-700"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
            </div>
            <div className="hidden xl:block text-left text-xs">
              <div className="font-semibold text-white leading-tight">Elena Rostova</div>
              <div className="text-[10px] text-slate-400">Mobile Triage Agent</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

