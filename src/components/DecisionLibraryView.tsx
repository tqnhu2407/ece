import React, { useState } from 'react';
import { DecisionItem } from '../types';
import { Search, BookOpen, ArrowRight, Tag, Calendar, User, CheckCircle2, Clock } from 'lucide-react';

interface DecisionLibraryViewProps {
  decisions: DecisionItem[];
  onSelectDecision: (decisionId: string) => void;
}

export const DecisionLibraryView: React.FC<DecisionLibraryViewProps> = ({
  decisions,
  onSelectDecision,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Architecture', 'Data Pipeline', 'AI / ML', 'API', 'Infrastructure'];

  const filteredDecisions = decisions.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (status: DecisionItem['status']) => {
    switch (status) {
      case 'Implemented':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Implemented</span>;
      case 'Awaiting Implementation':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">Awaiting Implementation</span>;
      case 'Under Review':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">Under Review</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">Deprecated</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      
      {/* Title & Description */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-indigo-600 font-semibold text-xs uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          <span>Collective Engineering Memory</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Decision Library
        </h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-2xl">
          Curated record of engineering architectural choices, rationale, and context timelines across your team.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-4">
        <div className="relative">
          <input
            id="search-decisions-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search decisions, technologies, or topics..."
            className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm outline-none transition"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Decisions Cards List */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {filteredDecisions.length} Recent Engineering Decisions
        </h2>

        {filteredDecisions.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
            <p className="text-slate-500 text-sm">No decisions found matching your filter criteria.</p>
            <button
              onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDecisions.map((dec) => (
              <div
                key={dec.id}
                onClick={() => onSelectDecision(dec.id)}
                className="bg-white hover:bg-slate-50/80 rounded-2xl p-6 border border-slate-200 hover:border-indigo-300 transition shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 rounded border border-indigo-100">
                      {dec.category}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-400 font-mono">{dec.date}</span>
                      {getStatusBadge(dec.status)}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {dec.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {dec.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex flex-wrap gap-1">
                    {dec.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-medium">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDecision(dec.id);
                    }}
                    className="flex items-center space-x-1 text-indigo-600 font-bold group-hover:translate-x-0.5 transition"
                  >
                    <span>View decision</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
