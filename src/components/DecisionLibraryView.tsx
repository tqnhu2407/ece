import React, { useState } from 'react';
import { DecisionItem } from '../types';
import { Search, BookOpen, ArrowRight, Tag, Calendar, User, CheckCircle2, Clock, FileText } from 'lucide-react';

interface DecisionLibraryViewProps {
  decisions: DecisionItem[];
  onSelectDecision: (decisionId: string) => void;
  onOpenGoogleDocs?: () => void;
}

export const DecisionLibraryView: React.FC<DecisionLibraryViewProps> = ({
  decisions,
  onSelectDecision,
  onOpenGoogleDocs,
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
    return (
      <span className="px-2.5 py-0.5 rounded-[8px] text-[12px] font-semibold bg-[#020408] text-zinc-300 border border-[#21262d]">
        {status}
      </span>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      
      {/* Title & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-zinc-400 font-semibold text-[12px] uppercase tracking-wider">
            <BookOpen className="w-4 h-4 text-zinc-400" />
            <span>Collective Engineering Memory</span>
          </div>
          <h1 className="text-[32px] font-extrabold text-[#F9FEFF] tracking-tight leading-tight">
            Decision Library
          </h1>
          <p className="text-zinc-400 text-[14px] max-w-2xl font-normal">
            Curated record of engineering architectural choices, rationale, and context timelines across your team.
          </p>
        </div>

        {onOpenGoogleDocs && (
          <button
            onClick={onOpenGoogleDocs}
            className="self-start sm:self-auto flex items-center space-x-2 bg-[#0D1116] hover:bg-[#161b22] text-zinc-200 hover:text-white px-4 py-2 rounded-[8px] border border-[#21262d] text-[12px] font-semibold transition cursor-pointer"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Import Google Doc</span>
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-[#0D1116] rounded-[8px] p-4 sm:p-6 border border-[#21262d] space-y-4">
        <div className="relative">
          <input
            id="search-decisions-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search decisions, technologies, or topics..."
            className="w-full bg-[#020408] text-[#F9FEFF] placeholder-zinc-500 pl-12 pr-4 py-3 rounded-[8px] border border-[#21262d] focus:border-zinc-500 text-[14px] outline-none transition"
          />
          <Search className="w-5 h-5 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#21262d]">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-[8px] text-[12px] font-semibold transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#F9FEFF] text-black font-bold'
                  : 'bg-[#020408] text-zinc-400 hover:text-white hover:bg-[#161b22] border border-[#21262d]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Decisions Cards List */}
      <div className="space-y-4">
        <h2 className="text-[12px] font-bold uppercase tracking-wider text-zinc-400">
          {filteredDecisions.length} Recent Engineering Decisions
        </h2>

        {filteredDecisions.length === 0 ? (
          <div className="bg-[#0D1116] rounded-[8px] p-8 text-center border border-[#21262d] space-y-4">
            <p className="text-zinc-400 text-[14px]">No decisions found matching your filter criteria.</p>
            <button
              onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
              className="text-[12px] font-bold text-[#5991F1] hover:underline cursor-pointer"
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
                className="bg-[#0D1116] hover:bg-[#161b22]/70 rounded-[8px] p-6 border border-[#21262d] hover:border-zinc-600 transition cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="px-2.5 py-0.5 text-[12px] font-bold uppercase tracking-wider bg-[#020408] text-zinc-300 rounded-[8px] border border-[#21262d]">
                      {dec.category}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-[12px] text-zinc-500 font-mono">{dec.date}</span>
                      {getStatusBadge(dec.status)}
                    </div>
                  </div>

                  <h3 className="text-[20px] font-bold text-[#F9FEFF] group-hover:text-zinc-200 transition-colors leading-snug">
                    {dec.title}
                  </h3>

                  <p className="text-[14px] text-zinc-400 leading-relaxed line-clamp-2">
                    {dec.summary}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#21262d] flex items-center justify-between text-[12px]">
                  <div className="flex flex-wrap gap-1.5">
                    {dec.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-[#020408] text-zinc-400 border border-[#21262d] rounded-[8px] text-[12px] font-medium">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDecision(dec.id);
                    }}
                    className="flex items-center space-x-1 text-[#5991F1] font-bold hover:text-[#8bb6ff] group-hover:translate-x-0.5 transition text-[12px] cursor-pointer"
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
