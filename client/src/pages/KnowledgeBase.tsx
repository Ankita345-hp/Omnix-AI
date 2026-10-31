import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { KbArticle } from '../types';
import { KnowledgeBaseCard } from '../components/KnowledgeBaseCard';
import {
  BookOpen,
  Search,
  Plus,
  RefreshCw,
  Tag,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export const KnowledgeBase: React.FC = () => {
  const [articles, setArticles] = useState<KbArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Article Form
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Mobile & Billing');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const categories = [
    'All',
    'Mobile & Billing',
    'Authentication & Security',
    'API & Integrations',
    'Mobile & Security'
  ];

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const data = await api.getKbArticles(
        searchQuery.trim() || undefined,
        selectedCategory !== 'All' ? selectedCategory : undefined
      );
      setArticles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [searchQuery, selectedCategory]);

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim().length < 3) {
      setFormError('Title must be at least 3 characters.');
      return;
    }
    if (newContent.trim().length < 10) {
      setFormError('Content must be at least 10 characters.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const tagsArray = newTags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      await api.createKbArticle({
        title: newTitle.trim(),
        category: newCategory,
        content: newContent.trim(),
        tags: tagsArray
      });

      setIsModalOpen(false);
      setNewTitle('');
      setNewContent('');
      setNewTags('');
      fetchArticles();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create knowledge base article');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Knowledge Base & Contextual RAG
            </h2>
            <span className="p-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/30 text-xs font-mono">
              Co-Pilot Library
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Internal support playbooks, Android keystore recovery steps, and engineering resolutions
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-sky-500/25 flex items-center gap-2 transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Playbook Article</span>
        </button>
      </div>

      {/* Search & Category Pills */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-md">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search playbooks by keywords, Android error codes, or Okta cert guidelines..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Categories Carousel */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Article Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-3">
          <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
          <p className="text-xs text-slate-400">Querying knowledge repository...</p>
        </div>
      ) : articles.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <BookOpen className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Matching Articles</h3>
          <p className="text-xs text-slate-400">
            No playbook articles matched your criteria. You can create one above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {articles.map(article => (
            <KnowledgeBaseCard key={article.id} article={article} />
          ))}
        </div>
      )}

      {/* Create Article Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-sky-400" />
                Add Internal Playbook Article
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateArticle} className="p-4 space-y-3">
              {formError && (
                <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Article Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Resolving Android In-App Payment Crash on Android 14"
                  className="w-full text-xs px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-sky-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Category *</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-sky-500 outline-none"
                >
                  <option value="Mobile & Billing">Mobile & Billing</option>
                  <option value="Authentication & Security">Authentication & Security</option>
                  <option value="API & Integrations">API & Integrations</option>
                  <option value="Mobile & Security">Mobile & Security</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Resolution Content / Steps *</label>
                <textarea
                  required
                  rows={5}
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  placeholder="Enter detailed troubleshooting instructions, root cause steps, or solution code..."
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-sky-500 outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={e => setNewTags(e.target.value)}
                  placeholder="Android, Billing, Google Pay, Crash"
                  className="w-full text-xs px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-sky-500 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  {isSubmitting ? 'Saving...' : 'Save Playbook'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

