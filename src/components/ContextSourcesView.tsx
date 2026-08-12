import React, { useState } from 'react';
import { ContextSource } from '../types';
import { Layers, Calendar, FileText, GitPullRequest, AlertTriangle, Plus, ExternalLink, Search, User } from 'lucide-react';

interface ContextSourcesViewProps {
  sources: ContextSource[];
  onOpenAddContext: () => void;
  onSourceClick: (source: ContextSource) => void;
}

export const ContextSourcesView: React.FC<ContextSourcesViewProps> = ({
  sources,
  onOpenAddContext,
  onSourceClick,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSources = sources.filter((s) => {
    const matchesType = filterType === 'all' || s.type === filterType;
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.authorOrHost && s.authorOrHost.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const getSourceIcon = (type: ContextSource['type']) => {
    switch (type) {
      case 'calendar': return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'doc': return <FileText className="w-4 h-4 text-emerald-500" />;
      case 'github': return <GitPullRequest className="w-4 h-4 text-purple-500" />;
      case 'incident': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    }
  };

  const getSourceBadgeText = (type: ContextSource['type']) => {
    switch (type) {
      case 'calendar': return 'Google Calendar';
      case 'doc': return 'Google Docs';
      case 'github': return 'GitHub';
      case 'incident': return 'Incident Report';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-indigo-600 font-semibold text-xs uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Google Ecosystem & Context Ingestion</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Team Context Memory
          </h1>
          <p className="text-slate-600 text-sm">
            Primary context sources (Google Calendar meetings, Google Docs review notes, GitHub PRs) linked into ECE.
          </p>
        </div>

        <button
          onClick={onOpenAddContext}
          className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>Sync New Context Note</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-4">
        <div className="relative">
          <input
            id="search-context-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter context notes, PRs, or meetings..."
            className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition focus:border-indigo-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>

        {/* Source Type Filter Tabs */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100 text-xs">
          {[
            { id: 'all', label: 'All Sources' },
            { id: 'calendar', label: 'Google Calendar' },
            { id: 'doc', label: 'Google Docs' },
            { id: 'github', label: 'GitHub PRs' },
            { id: 'incident', label: 'Incidents' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                filterType === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Context Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSources.map((source) => (
          <div
            key={source.id}
            onClick={() => onSourceClick(source)}
            className="bg-white hover:bg-slate-50/90 rounded-2xl p-5 border border-slate-200 hover:border-indigo-300 transition shadow-sm cursor-pointer space-y-3 flex flex-col justify-between group"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getSourceIcon(source.type)}
                  <span className="text-xs font-bold text-slate-700">
                    {getSourceBadgeText(source.type)}
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-400">{source.date}</span>
              </div>

              <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                {source.title}
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                {source.summary}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium text-slate-600">
                {source.authorOrHost ? `Host/Author: ${source.authorOrHost}` : 'Team Context'}
              </span>
              <div className="flex items-center space-x-1 text-indigo-600 font-bold group-hover:translate-x-0.5 transition">
                <span>Inspect</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
