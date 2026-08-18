import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MorningBriefData } from '../types';
import { 
  Sparkles, 
  ArrowRight, 
  Search, 
  HelpCircle,
  Layers,
  FileText,
  RefreshCw,
  CheckCircle2,
  CheckCircle,
  Clock
} from 'lucide-react';

interface MorningBriefViewProps {
  brief: MorningBriefData;
  onAskWhy: (question: string) => void;
  onSelectDecision: (decisionId: string) => void;
  isAsking: boolean;
  isSyncingContext?: boolean;
  syncStatusMessage?: string | null;
  lastSyncedNotice?: string | null;
  onDismissSyncedNotice?: () => void;
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
  isSyncingContext = false,
  syncStatusMessage = null,
  lastSyncedNotice = null,
  onDismissSyncedNotice,
}) => {
  const [query, setQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isAsking && !isSyncingContext) {
      onAskWhy(query.trim());
    }
  };

  const handlePresetClick = (q: string) => {
    if (isAsking || isSyncingContext) return;
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
      <motion.div variants={itemVariants} className="pb-4 border-b border-[#21262d]">
        <h1 className="text-[32px] font-extrabold text-[#F9FEFF] tracking-tight leading-tight mt-0.5">
          Understand the why behind every change.
        </h1>
        <p className="text-zinc-400 text-[14px] font-normal mt-2">
          Trace every decision, discussion, and change across your team.
        </p>
      </motion.div>

      {/* Sync Readiness & Completion Notices */}
      {isSyncingContext && (
        <motion.div 
          variants={itemVariants}
          className="p-3 bg-[#0D1116] border border-blue-800/60 rounded-[8px] flex items-center justify-between text-[13px] text-blue-300 shadow-sm"
        >
          <div className="flex items-center space-x-2.5">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-400 shrink-0" />
            <span className="font-semibold">{syncStatusMessage || 'Syncing Google Docs & updating Trace memory…'}</span>
          </div>
          <span className="text-[11px] text-blue-400/80 font-mono hidden sm:inline">
            Ask Why will automatically unlock once memory sync completes
          </span>
        </motion.div>
      )}

      {lastSyncedNotice && !isSyncingContext && (
        <motion.div 
          variants={itemVariants}
          className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-[8px] flex items-center justify-between text-[13px] text-emerald-300 shadow-sm"
        >
          <div className="flex items-center space-x-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{lastSyncedNotice}</span>
          </div>
          <span className="text-[11px] text-emerald-400/80 font-mono hidden sm:inline">
            Ready to query in Ask Why
          </span>
        </motion.div>
      )}

      {/* Ask Why Search Console */}
      <motion.div 
        variants={itemVariants} 
        className="bg-[#0D1116] rounded-[8px] p-6 text-white border border-[#21262d] relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-[8px] bg-[#020408] border border-[#21262d] flex items-center justify-center text-zinc-300">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-[20px] text-[#F9FEFF] flex items-center space-x-2">
                <span>Ask Why</span>
              </h2>
            </div>
          </div>

          {isSyncingContext && (
            <div className="flex items-center space-x-1.5 text-[11px] font-mono text-blue-400 bg-blue-950/30 border border-blue-800/40 px-2.5 py-1 rounded-[6px]">
              <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
              <span>Sync in progress</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            id="ask-why-input"
            type="text"
            value={query}
            disabled={isAsking || isSyncingContext}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              isSyncingContext
                ? 'Updating Trace memory… (Ask Why will resume when ready)'
                : 'Ask why decisions were made.'
            }
            className="w-full bg-[#020408] text-[#F9FEFF] placeholder-zinc-500 pl-12 pr-44 py-3.5 rounded-[8px] border border-[#21262d] focus:border-zinc-500 text-[14px] outline-none transition disabled:opacity-60 disabled:cursor-not-allowed"
          />
          <Search className="w-5 h-5 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          
          <button
            id="ask-why-submit-btn"
            type="submit"
            disabled={isAsking || isSyncingContext || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#F9FEFF] hover:bg-zinc-200 disabled:opacity-50 text-black text-[14px] font-semibold px-4 py-2 rounded-[8px] flex items-center space-x-2 transition cursor-pointer disabled:cursor-not-allowed"
          >
            {isAsking ? (
              <span>Reconstructing...</span>
            ) : isSyncingContext ? (
              <span className="flex items-center space-x-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Updating memory…</span>
              </span>
            ) : (
              <>
                <span>Ask Why</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Suggested Prompt Chips */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {brief.suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              id={`suggested-question-${idx}`}
              disabled={isAsking || isSyncingContext}
              onClick={() => handlePresetClick(q)}
              className="text-[12px] bg-[#020408] hover:bg-[#161b22] hover:text-white text-zinc-400 px-4 py-2 rounded-[8px] border border-[#21262d] hover:border-zinc-600 transition-all font-medium text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {q}
            </button>
          ))}
        </div>
      </motion.div>

      {/* 2-COLUMN GRID FOR BRIEF SUMMARY & WHAT CHANGED */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Morning Briefing Narrative */}
        <motion.div 
          variants={itemVariants}
          className="lg:col-span-7 bg-[#0D1116] rounded-[8px] p-6 border border-[#21262d] flex flex-col justify-between relative overflow-hidden"
        >
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#21262d]">
              <div className="flex items-center space-x-2 text-zinc-300 font-bold text-[20px] tracking-tight">
                <Sparkles className="w-5 h-5 text-zinc-300" />
                <span className="text-[#F9FEFF]">Morning Brief</span>
                <span className="text-zinc-400 font-normal text-[12px] normal-case">· {brief.period}</span>
              </div>
            </div>

            <p className="text-[14px] text-zinc-300 font-normal leading-relaxed whitespace-pre-line">
              {brief.summaryText}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[#21262d] flex items-center justify-between text-[12px] text-zinc-500">
            <span>Aggregated from 4 context sources</span>
            <span className="text-zinc-500 font-mono">Updated today</span>
          </div>
        </motion.div>

        {/* Right Column: What Changed List */}
        <motion.div 
          variants={itemVariants} 
          className="lg:col-span-5 bg-[#0D1116] rounded-[8px] p-6 border border-[#21262d] flex flex-col justify-between space-y-4"
        >
          <div>
            <div className="flex items-start justify-between pb-4 mb-2 border-b border-[#21262d]">
              <div>
                <h2 className="text-[20px] font-bold text-[#F9FEFF] tracking-tight flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-zinc-300" />
                  <span>What Changed</span>
                </h2>
                <p className="text-[12px] text-zinc-400 font-normal mt-1">
                  The decisions and changes you may have missed.
                </p>
              </div>
              <span className="text-[12px] text-zinc-500 font-medium shrink-0 pt-0.5">
                {brief.changes.length} updates
              </span>
            </div>

            <div className="space-y-2 mt-2">
              {brief.changes.map((item) => (
                <div
                  key={item.id}
                  onClick={() => item.decisionId && onSelectDecision(item.decisionId)}
                  className="flex items-center justify-between p-3 rounded-[8px] border border-[#21262d] bg-[#020408] hover:border-zinc-600 hover:bg-[#161b22] transition cursor-pointer group"
                >
                  <div className="flex items-center min-w-0 pr-2">
                    <span className="text-[14px] font-semibold text-zinc-200 group-hover:text-white transition-colors truncate">
                      {item.title}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="px-2 py-0.5 text-[12px] font-medium rounded-[8px] bg-[#0D1116] text-zinc-400 border border-[#21262d]">
                      {item.category}
                    </span>
                    <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[12px] text-zinc-500 text-center pt-3 border-t border-[#21262d]">
            Click any item to view full decision rationale
          </p>
        </motion.div>

      </div>

    </motion.div>
  );
};

