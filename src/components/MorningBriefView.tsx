import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MorningBriefData } from '../types';
import { 
  Sparkles, 
  ArrowRight, 
  Search, 
  HelpCircle,
  Layers,
  FileText
} from 'lucide-react';

interface MorningBriefViewProps {
  brief: MorningBriefData;
  onAskWhy: (question: string) => void;
  onSelectDecision: (decisionId: string) => void;
  isAsking: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.02
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.215, 0.61, 0.355, 1]
    }
  }
};

export const MorningBriefView: React.FC<MorningBriefViewProps> = ({
  brief,
  onAskWhy,
  onSelectDecision,
  isAsking,
}) => {
  const [query, setQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onAskWhy(query.trim());
    }
  };

  const handlePresetClick = (q: string) => {
    setQuery(q);
    onAskWhy(q);
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6"
    >
      
      {/* Top Header Greeting */}
      <motion.div variants={itemVariants} className="pb-2 border-b border-slate-200/60">
        <h1 className="font-handwriting text-3xl sm:text-4xl font-bold text-slate-900 tracking-wide mt-0.5">
          Maintain your team's knowledge.
        </h1>
        <p className="text-slate-600 text-sm sm:text-base font-medium mt-1">
          Your team has context. We make sure you don't lose it.
        </p>
      </motion.div>

      {/* HEART OF THE WEBSITE: Ask Why Natural Language Reasoning Search Console */}
      <motion.div 
        variants={itemVariants} 
        className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-lg shadow-indigo-950/10 border border-indigo-500/30 relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg text-slate-100 flex items-center space-x-2">
                <span>Ask Why</span>
              </h2>
            </div>
          </div>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            id="ask-why-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask your team's context anything"
            className="w-full bg-slate-950/90 text-white placeholder-slate-400 pl-11 pr-32 py-3.5 rounded-xl border border-indigo-500/40 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 text-sm sm:text-base outline-none transition shadow-inner"
          />
          <Search className="w-5 h-5 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          
          <button
            id="ask-why-submit-btn"
            type="submit"
            disabled={isAsking || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
          >
            {isAsking ? (
              <span>Reconstructing...</span>
            ) : (
              <>
                <span>Ask Why</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Suggested Prompt Chips */}
        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          {brief.suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              id={`suggested-question-${idx}`}
              onClick={() => handlePresetClick(q)}
              className="text-xs bg-slate-800/90 hover:bg-indigo-600 hover:text-white text-slate-300 px-3 py-1 rounded-lg border border-slate-700/80 hover:border-indigo-400 transition-all font-medium text-left cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      </motion.div>

      {/* 2-COLUMN GRID FOR BRIEF SUMMARY & WHAT CHANGED (Compact, Balanced) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Morning Briefing Narrative */}
        <motion.div 
          variants={itemVariants}
          className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden"
        >
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-indigo-600 font-semibold text-xs uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Morning Brief</span>
                <span className="text-slate-400 font-normal normal-case">· {brief.period}</span>
              </div>
            </div>

            <p className="font-editorial text-base sm:text-lg text-slate-800 font-normal leading-relaxed whitespace-pre-line tracking-wide">
              {brief.summaryText}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Aggregated from 4 context sources</span>
            <span className="text-slate-400 font-mono">Updated today</span>
          </div>
        </motion.div>

        {/* Right Column: What Changed List */}
        <motion.div 
          variants={itemVariants} 
          className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-3"
        >
          <div>
            <div className="flex items-start justify-between pb-3 mb-1 border-b border-slate-100">
              <div>
                <h2 className="text-xs font-bold text-slate-900 tracking-wider flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>What Changed</span>
                </h2>
                <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                  The decisions and changes you may have missed.
                </p>
              </div>
              <span className="text-[11px] text-slate-500 font-medium shrink-0 pt-0.5">
                {brief.changes.length} updates
              </span>
            </div>

            <div className="space-y-2 mt-2">
              {brief.changes.map((item) => (
                <div
                  key={item.id}
                  onClick={() => item.decisionId && onSelectDecision(item.decisionId)}
                  className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50/80 transition cursor-pointer group"
                >
                  <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 group-hover:scale-125 transition-transform" />
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                      {item.title}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-100 text-slate-600">
                      {item.category}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 text-center pt-2 border-t border-slate-100">
            Click any item to view full decision rationale
          </p>
        </motion.div>

      </div>

    </motion.div>
  );
};

