import React, { useState } from 'react';
import { ContextSource, ReasoningResult } from '../types';
import { 
  ArrowLeft, 
  Sparkles, 
  Calendar, 
  FileText, 
  GitPullRequest, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink,
  ShieldCheck,
  Share2,
  BookOpen,
  Info,
  Clock
} from 'lucide-react';

interface AskWhyResultViewProps {
  result: ReasoningResult;
  onBack: () => void;
  onSelectDecision?: (decisionId: string) => void;
  onSourceClick: (source: ContextSource) => void;
}

export const AskWhyResultView: React.FC<AskWhyResultViewProps> = ({
  result,
  onBack,
  onSelectDecision,
  onSourceClick,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyReasoning = () => {
    const textToCopy = `Question: ${result.question}\n\nAI Reconstructed Reasoning:\n${result.answer}\n\nConfidence: ${result.confidence}\nReason: ${result.confidenceReason}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSourceIcon = (type: ContextSource['type']) => {
    switch (type) {
      case 'calendar':
        return <Calendar className="w-4 h-4 text-zinc-400" />;
      case 'doc':
        return <FileText className="w-4 h-4 text-zinc-400" />;
      case 'github':
        return <GitPullRequest className="w-4 h-4 text-zinc-400" />;
      case 'incident':
        return <AlertTriangle className="w-4 h-4 text-zinc-400" />;
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

  const getStepTypeBadge = (type: string) => {
    const labelMap: Record<string, string> = {
      incident: 'Incident',
      investigation: 'Investigation',
      review: 'Review',
      decision: 'Decision',
      implementation: 'Implementation'
    };
    return (
      <span className="px-2 py-0.5 text-[12px] font-bold uppercase tracking-wider bg-[#020408] text-zinc-300 border border-[#21262d] rounded-[8px]">
        {labelMap[type] || type}
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      
      {/* Top Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-[14px] font-semibold text-zinc-400 hover:text-[#5991F1] transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Morning Brief</span>
        </button>

        <div className="flex items-center space-x-2">
          {result.relatedDecisionId && onSelectDecision && (
            <button
              onClick={() => onSelectDecision(result.relatedDecisionId!)}
              className="flex items-center space-x-2 px-4 py-2 rounded-[8px] bg-[#0D1116] text-zinc-200 hover:bg-[#161b22] text-[12px] font-semibold border border-[#21262d] transition cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-zinc-400" />
              <span>View in Decision Library</span>
            </button>
          )}

          <button
            onClick={handleCopyReasoning}
            className="flex items-center space-x-2 px-4 py-2 rounded-[8px] bg-[#0D1116] text-zinc-200 hover:bg-[#161b22] text-[12px] font-semibold border border-[#21262d] transition cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-zinc-400" />
            <span>{copied ? 'Copied!' : 'Copy Reasoning'}</span>
          </button>
        </div>
      </div>

      {/* Question Header */}
      <div className="bg-[#0D1116] text-white rounded-[8px] p-6 sm:p-8 border border-[#21262d] space-y-4">
        <div className="flex items-center space-x-2 text-zinc-400 text-[12px] font-mono tracking-wider">
          <Sparkles className="w-4 h-4 text-zinc-400" />
          <span>Ask Why · Reconstructed Context</span>
        </div>

        <h1 className="text-[32px] font-extrabold text-[#F9FEFF] tracking-tight leading-tight">
          {result.question}
        </h1>

        {/* AI Answer Box */}
        <div className="bg-[#020408] rounded-[8px] p-6 border border-[#21262d] text-[#F9FEFF] leading-relaxed text-[14px] sm:text-[15px] font-normal">
          <p>{result.answer}</p>
        </div>

        {/* Confidence Indicator */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#21262d] text-[12px]">
          <div className="flex items-center space-x-2">
            <span className="text-zinc-400 font-medium">Evidence Strength:</span>
            <span className="px-3 py-1 rounded-[8px] font-bold flex items-center space-x-2 bg-[#020408] text-zinc-200 border border-[#21262d]">
              <ShieldCheck className="w-4 h-4 text-zinc-400" />
              <span>{result.confidence}</span>
            </span>
          </div>

          <div className="text-zinc-400 flex items-center space-x-1.5">
            <Info className="w-4 h-4 text-zinc-500" />
            <span>{result.confidenceReason}</span>
          </div>
        </div>
      </div>

      {/* Reasoning Timeline Section with Integrated Evidence */}
      <div className="bg-[#0D1116] rounded-[8px] p-6 sm:p-8 border border-[#21262d] space-y-6">
        <div>
          <h2 className="text-[22px] font-bold text-[#F9FEFF] flex items-center space-x-2">
            <Clock className="w-5 h-5 text-zinc-400" />
            <span>Decision Timeline</span>
          </h2>
          <p className="text-[12px] text-zinc-400 mt-1">
            Reconstructed chronological sequence of events, reviews, and implementations. Click any item in the timeline to inspect its underlying evidence source.
          </p>
        </div>

        {/* Vertical Timeline Steps */}
        <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#21262d]">
          {result.reasoningTimeline.map((step, idx) => {
            const matchedSource = result.evidence.find(s => s.id === step.sourceId) || result.evidence[idx] || null;

            return (
              <div key={idx} className="relative group">
                {/* Timeline Node Dot */}
                <div className="absolute -left-6 top-1 w-6 h-6 rounded-full bg-white text-black border-4 border-black shadow flex items-center justify-center text-[10px] font-bold group-hover:scale-110 transition-transform">
                  {idx + 1}
                </div>

                <div 
                  onClick={() => matchedSource && onSourceClick(matchedSource)}
                  className={`bg-[#020408] rounded-[8px] p-4 sm:p-6 border transition-all ${
                    matchedSource 
                      ? 'cursor-pointer border-[#21262d] hover:border-zinc-600 hover:bg-[#161b22]' 
                      : 'border-[#21262d]'
                  } space-y-3`}
                  title={matchedSource ? `Click to inspect: ${matchedSource.title}` : undefined}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-[12px] font-semibold text-zinc-400 font-mono">{step.date}</span>
                      {getStepTypeBadge(step.type)}
                    </div>

                    {matchedSource && (
                      <span className="inline-flex items-center space-x-1.5 text-[12px] font-semibold text-[#5991F1] bg-[#0D1116] border border-[#21262d] px-3 py-1 rounded-[8px] group-hover:bg-[#5991F1] group-hover:text-black transition-colors">
                        <span>Inspect Evidence</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  <h3 className="text-[20px] font-bold text-[#F9FEFF] group-hover:text-zinc-100 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-[14px] text-zinc-300 leading-relaxed">
                    {step.description}
                  </p>

                  {/* Integrated Evidence Source Badge */}
                  {matchedSource && (
                    <div className="pt-3 mt-1 border-t border-[#21262d] flex items-center justify-between gap-2 text-[12px]">
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-[8px] bg-[#0D1116] border border-[#21262d] text-zinc-300 font-semibold shrink-0">
                          {getSourceIcon(matchedSource.type)}
                          <span className="text-[12px]">{getSourceBadgeText(matchedSource.type)}</span>
                        </span>
                        <span className="text-zinc-400 font-medium truncate text-[12px] group-hover:text-zinc-200 transition-colors">
                          {matchedSource.title}
                        </span>
                      </div>
                      <span className="text-[12px] text-zinc-500 font-mono shrink-0 hidden sm:inline-block">
                        {matchedSource.date}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
