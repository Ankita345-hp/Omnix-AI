import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { Interaction } from '../types';
import { InteractionTable } from '../components/InteractionTable';
import { InteractionCardList } from '../components/InteractionCardList';
import {
  Search,
  Filter,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  LayoutGrid,
  Table as TableIcon,
  AlertCircle
} from 'lucide-react';

interface InteractionQueueProps {
  onOpenNewInteraction: () => void;
  globalSearch: string;
}

export const InteractionQueue: React.FC<InteractionQueueProps> = ({
  onOpenNewInteraction,
  globalSearch
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'All');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || 'All');
  const [channelFilter, setChannelFilter] = useState(searchParams.get('channel') || 'All');
  const [deviceFilter, setDeviceFilter] = useState(searchParams.get('device') || 'All');
  const [sentimentFilter, setSentimentFilter] = useState(searchParams.get('sentiment') || 'All');
  const [searchQuery, setSearchQuery] = useState(globalSearch || '');

  // View mode: 'auto' | 'table' | 'cards'
  const [viewMode, setViewMode] = useState<'auto' | 'table' | 'cards'>('auto');

  const fetchInteractionsList = async () => {
    try {
      setRefreshing(true);
      const res = await api.getInteractions({
        status: statusFilter !== 'All' ? statusFilter : undefined,
        priority: priorityFilter !== 'All' ? priorityFilter : undefined,
        channel: channelFilter !== 'All' ? channelFilter : undefined,
        deviceType: deviceFilter !== 'All' ? deviceFilter : undefined,
        sentiment: sentimentFilter !== 'All' ? sentimentFilter : undefined,
        search: (searchQuery || globalSearch).trim() || undefined,
        page,
        limit: 25
      });
      setInteractions(res.data);
      setTotalCount(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch interactions queue');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInteractionsList();
  }, [statusFilter, priorityFilter, channelFilter, deviceFilter, sentimentFilter, searchQuery, globalSearch, page]);

  const handleResetFilters = () => {
    setStatusFilter('All');
    setPriorityFilter('All');
    setChannelFilter('All');
    setDeviceFilter('All');
    setSentimentFilter('All');
    setSearchQuery('');
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Page Title & Ingest Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Omnichannel Interaction Queue
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-sky-950 text-sky-400 border border-sky-500/30">
              {totalCount} Total Tickets
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Filter, triage, and route touchpoints across mobile app, chat, email, social, and voice
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View switcher (Table vs Card Mode) */}
          <div className="hidden sm:flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg flex items-center gap-1 transition-colors ${
                viewMode === 'table' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
              title="Table view"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg flex items-center gap-1 transition-colors ${
                viewMode === 'cards' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
              title="Mobile Card Stack view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={fetchInteractionsList}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
            title="Refresh Queue"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-sky-400' : ''}`} />
          </button>

          <button
            onClick={onOpenNewInteraction}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-sky-500/25 flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Ingest Interaction</span>
          </button>
        </div>
      </div>

      {/* Filter Bar Controls */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search box */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by customer, subject, issue..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Status: Open</option>
              <option value="In Progress">Status: In Progress</option>
              <option value="Escalated">Status: Escalated</option>
              <option value="Resolved">Status: Resolved</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={e => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="All">All Priorities</option>
              <option value="Urgent">Priority: Urgent</option>
              <option value="High">Priority: High</option>
              <option value="Medium">Priority: Medium</option>
              <option value="Low">Priority: Low</option>
            </select>
          </div>

          {/* Channel Filter */}
          <div>
            <select
              value={channelFilter}
              onChange={e => {
                setChannelFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="All">All Channels</option>
              <option value="Mobile App">Mobile App Support</option>
              <option value="Web Chat">Web Chat</option>
              <option value="Email">Email</option>
              <option value="Social">Social</option>
              <option value="Voice">Voice Transcript</option>
            </select>
          </div>

          {/* Device Filter (Android Focus) */}
          <div>
            <select
              value={deviceFilter}
              onChange={e => {
                setDeviceFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="All">All Devices</option>
              <option value="Android App">Android App Client</option>
              <option value="Desktop">Desktop Browser</option>
              <option value="Mobile Web">Mobile Web</option>
              <option value="iOS App">iOS App</option>
            </select>
          </div>
        </div>

        {/* Filter Summary & Reset Pill */}
        {(statusFilter !== 'All' || priorityFilter !== 'All' || channelFilter !== 'All' || deviceFilter !== 'All' || sentimentFilter !== 'All' || searchQuery) && (
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
            <span className="text-slate-400">
              Active Filters applied ({interactions.length} matching)
            </span>
            <button
              onClick={handleResetFilters}
              className="text-xs text-sky-400 hover:text-sky-300 font-semibold transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content: Auto-Adaptive View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-3">
          <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
          <p className="text-xs text-slate-400">Loading interactions...</p>
        </div>
      ) : interactions.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No Customer Touchpoints Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your active filters or ingest a new omnichannel inquiry using the button above.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          {/* Conditional or Auto Mode: Desktop Table vs Android Cards */}
          {viewMode === 'table' ? (
            <InteractionTable interactions={interactions} />
          ) : viewMode === 'cards' ? (
            <InteractionCardList interactions={interactions} />
          ) : (
            <>
              {/* Auto mode: Table on desktop (hidden on mobile), Cards on mobile (hidden on desktop) */}
              <div className="hidden lg:block">
                <InteractionTable interactions={interactions} />
              </div>
              <div className="block lg:hidden">
                <InteractionCardList interactions={interactions} />
              </div>
            </>
          )}

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 text-xs text-slate-400">
              <div>
                Page <span className="text-white font-medium">{page}</span> of{' '}
                <span className="text-white font-medium">{totalPages}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 transition-colors text-white"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 transition-colors text-white"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

