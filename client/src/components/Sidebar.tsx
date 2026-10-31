import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  GitFork,
  MessageSquareText,
  BarChart3,
  BookOpen,
  Sliders,
  X,
  Sparkles,
  Shield,
  Smartphone,
  Cpu
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const navItems = [
    { to: '/', label: 'CX Overview', icon: LayoutDashboard },
    { to: '/journey', label: 'Journey Map', icon: GitFork },
    { to: '/interactions', label: 'Interaction Queue', icon: MessageSquareText },
    { to: '/analytics', label: 'CX Analytics', icon: BarChart3 },
    { to: '/knowledge-base', label: 'Knowledge Base', icon: BookOpen },
    { to: '/settings', label: 'System & AI Settings', icon: Sliders }
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop for Android Viewports */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-950/95 border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="flex items-center justify-between p-5 border-b border-slate-800/60">
            <NavLink to="/" onClick={onCloseMobile} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-white block">
                  OmniX<span className="text-sky-400">-AI</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">
                  Enterprise CX Suite
                </span>
              </div>
            </NavLink>

            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 mt-2">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-600/25'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer System Status Badge */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-sky-400" />
                Gemini Intelligence
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Cross-Platform Android & Web Auto-Triage Active
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

