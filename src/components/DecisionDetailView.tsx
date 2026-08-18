import React from 'react';
import { ContextSource, DecisionItem } from '../types';
import { 
  ArrowLeft, 
  HelpCircle, 
  Calendar, 
  FileText, 
  GitPullRequest, 
  AlertTriangle, 
  Clock, 
  ExternalLink,
  Sparkles,
  ArrowRight,
  UploadCloud
} from 'lucide-react';

interface DecisionDetailViewProps {
  decision: DecisionItem;
  onBack: () => void;
  onAskWhyAboutDecision: (question: string) => void;
  onSourceClick: (source: ContextSource) => void;
  onExportToGoogleDocs?: (decision: DecisionItem) => void;
}

export const DecisionDetailView: React.FC<DecisionDetailViewProps> = ({
  decision,
  onBack,
  onAskWhyAboutDecision,
  onSourceClick,
  onExportToGoogleDocs,
}) => {

  const getSourceIcon = (type: ContextSource['type']) => {
    switch (type) {
      case 'calendar': return <Calendar className="w-4 h-4 text-zinc-400" />;
      case 'doc': return <FileText className="w-4 h-4 text-zinc-400" />;
      case 'github': return <GitPullRequest className="w-4 h-4 text-zinc-400" />;
      case 'incident': return <AlertTriangle className="w-4 h-4 text-zinc-400" />;
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

  const handleTriggerAskWhy = () => {
    const question = `Why did we ${decision.title.toLowerCase()}?`;
    onAskWhyAboutDecision(question);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-[14px] font-semibold text-zinc-400 hover:text-[#5991F1] transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Decision Library</span>
        </button>

        {onExportToGoogleDocs && (
          <button
            onClick={() => onExportToGoogleDocs(decision)}
            className="flex items-center space-x-2 bg-[#0D1116] hover:bg-[#161b22] text-zinc-200 hover:text-white px-3.5 py-1.5 rounded-[8px] border border-[#21262d] text-[12px] font-semibold transition cursor-pointer"
            title="Export this decision as an Architecture Decision Record (ADR) in Google Docs"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Export to Google Docs</span>
          </button>
        )}
      </div>

      {/* Decision Header */}
      <div className="bg-[#0D1116] rounded-[8px] p-6 sm:p-8 border border-[#21262d] space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-[8px] text-[12px] font-bold uppercase tracking-wider bg-[#020408] text-zinc-300 border border-[#21262d]">
              {decision.category}
            </span>
            <span className="text-[12px] text-zinc-500 font-mono">{decision.date}</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[12px] text-zinc-500">Owner:</span>
            <span className="text-[12px] font-semibold text-zinc-300">{decision.author}</span>
          </div>
        </div>

        <h1 className="text-[32px] font-extrabold text-[#F9FEFF] tracking-tight leading-tight">
          {decision.title}
        </h1>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 pt-1">
          {decision.tags.map((tag, idx) => (
            <span key={idx} className="px-2.5 py-1 bg-[#020408] text-zinc-400 border border-[#21262d] text-[12px] font-medium rounded-[8px]">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Decision Summary & Why Rationale Side-by-Side Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Decision Summary (Left) */}
        <div className="bg-[#0D1116] rounded-[8px] p-6 sm:p-8 border border-[#21262d] space-y-3 flex flex-col">
          <h2 className="text-[20px] font-bold uppercase tracking-tight text-[#F9FEFF]">
            DECISION SUMMARY
          </h2>
          <p className="text-zinc-200 text-[14px] sm:text-[15px] leading-relaxed font-normal">
            {decision.summary}
          </p>
        </div>

        {/* Why Rationale (Right) */}
        <div className="bg-[#0D1116] rounded-[8px] p-6 sm:p-8 border border-[#21262d] space-y-3 flex flex-col">
          <h2 className="text-[20px] font-bold uppercase tracking-tight text-[#F9FEFF]">
            WHY THIS DECISION WAS MADE
          </h2>
          <p className="text-zinc-300 text-[14px] sm:text-[15px] leading-relaxed">
            {decision.why}
          </p>
        </div>
      </div>

      {/* Context Timeline with Integrated Evidence */}
      <div className="bg-[#0D1116] rounded-[8px] p-6 sm:p-8 border border-[#21262d] space-y-6">
        <div>
          <h2 className="text-[22px] font-bold text-[#F9FEFF] flex items-center space-x-2">
            <Clock className="w-5 h-5 text-zinc-400" />
            <span>Context Timeline</span>
          </h2>
          <p className="text-[12px] text-zinc-400 mt-1">
            Historical progression of events, reviews, and implementations. Click any item in the timeline to inspect its underlying evidence.
          </p>
        </div>

        <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#21262d]">
          {decision.timeline.map((step, idx) => {
            const matchedSource = decision.evidence.find(s => s.id === step.sourceId) || decision.evidence[idx] || null;

            return (
              <div key={idx} className="relative group">
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
                      <span className="text-[12px] font-mono font-semibold text-zinc-400">{step.date}</span>
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

      {/* Prominent Ask Why Button */}
      <div className="bg-[#0D1116] text-white rounded-[8px] p-6 sm:p-8 text-center space-y-4 border border-[#21262d]">
        <div className="max-w-md mx-auto space-y-2">
          <div className="inline-flex items-center space-x-2 text-zinc-400 text-[12px] font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-zinc-400" />
            <span>Understand the full story</span>
          </div>
          <h3 className="text-[20px] font-bold text-[#F9FEFF]">
            Need the complete rationale?
          </h3>
          <p className="text-[14px] text-zinc-400">
            Trace linked meetings, incidents, documents, and pull requests to understand the decision.
          </p>
        </div>

        <button
          id="ask-why-about-decision-btn"
          onClick={handleTriggerAskWhy}
          className="inline-flex items-center space-x-2 bg-[#F9FEFF] hover:bg-zinc-200 text-black text-[14px] font-bold px-6 py-3 rounded-[8px] transition cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-black" />
          <span>Ask Why about this decision</span>
          <ArrowRight className="w-4 h-4 text-black" />
        </button>
      </div>

    </div>
  );
};
