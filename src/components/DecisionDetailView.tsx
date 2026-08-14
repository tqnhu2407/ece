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
  ArrowRight
} from 'lucide-react';

interface DecisionDetailViewProps {
  decision: DecisionItem;
  onBack: () => void;
  onAskWhyAboutDecision: (question: string) => void;
  onSourceClick: (source: ContextSource) => void;
}

export const DecisionDetailView: React.FC<DecisionDetailViewProps> = ({
  decision,
  onBack,
  onAskWhyAboutDecision,
  onSourceClick,
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
      <span className="px-2 py-0.5 text-[12px] font-bold uppercase tracking-wider bg-[#020408] text-zinc-300 border border-[#21262d] rounded">
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
      
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-[14px] font-semibold text-zinc-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Decision Library</span>
      </button>

      {/* Decision Header */}
      <div className="bg-[#0D1116] rounded-2xl p-6 sm:p-8 border border-[#21262d] space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-md text-[12px] font-bold uppercase tracking-wider bg-[#020408] text-zinc-300 border border-[#21262d]">
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
        <div className="flex flex-wrap gap-1.5 pt-1">
          {decision.tags.map((tag, idx) => (
            <span key={idx} className="px-2.5 py-1 bg-[#020408] text-zinc-400 border border-[#21262d] text-[12px] font-medium rounded-md">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Decision Statement */}
      <div className="bg-[#0D1116] rounded-2xl p-6 sm:p-8 border border-[#21262d] space-y-3">
        <h2 className="text-[20px] font-bold uppercase tracking-tight text-[#F9FEFF]">
          DECISION SUMMARY
        </h2>
        <p className="text-zinc-200 text-[14px] sm:text-[15px] leading-relaxed font-normal">
          {decision.summary}
        </p>
      </div>

      {/* Why Rationale */}
      <div className="bg-[#0D1116] rounded-2xl p-6 sm:p-8 border border-[#21262d] space-y-3">
        <h2 className="text-[20px] font-bold uppercase tracking-tight text-[#F9FEFF]">
          WHY THIS DECISION WAS MADE
        </h2>
        <p className="text-zinc-300 text-[14px] sm:text-[15px] leading-relaxed">
          {decision.why}
        </p>
      </div>

      {/* Context Timeline with Integrated Evidence */}
      <div className="bg-[#0D1116] rounded-2xl p-6 sm:p-8 border border-[#21262d] space-y-6">
        <div>
          <h2 className="text-[22px] font-bold text-[#F9FEFF] flex items-center space-x-2">
            <Clock className="w-5 h-5 text-zinc-400" />
            <span>Context Timeline</span>
          </h2>
          <p className="text-[12px] text-zinc-400 mt-0.5">
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
                  className={`bg-[#020408] rounded-xl p-4 sm:p-5 border transition-all ${
                    matchedSource 
                      ? 'cursor-pointer border-[#21262d] hover:border-zinc-600 hover:bg-[#161b22]' 
                      : 'border-[#21262d]'
                  } space-y-2.5`}
                  title={matchedSource ? `Click to inspect: ${matchedSource.title}` : undefined}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-[12px] font-mono font-semibold text-zinc-400">{step.date}</span>
                      {getStepTypeBadge(step.type)}
                    </div>

                    {matchedSource && (
                      <span className="inline-flex items-center space-x-1 text-[12px] font-semibold text-zinc-300 bg-[#0D1116] border border-[#21262d] px-2 py-0.5 rounded-full group-hover:bg-white group-hover:text-black transition-colors">
                        <span>Inspect Evidence</span>
                        <ExternalLink className="w-3 h-3" />
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
                    <div className="pt-2.5 mt-1 border-t border-[#21262d] flex items-center justify-between gap-2 text-[12px]">
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-[#0D1116] border border-[#21262d] text-zinc-300 font-semibold shrink-0">
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
      <div className="bg-[#0D1116] text-white rounded-2xl p-6 text-center space-y-4 border border-[#21262d]">
        <div className="max-w-md mx-auto space-y-1">
          <div className="inline-flex items-center space-x-1.5 text-zinc-400 text-[12px] font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-zinc-400" />
            <span>Deep Context Reconstruction</span>
          </div>
          <h3 className="text-[20px] font-bold text-[#F9FEFF]">
            Want to understand the underlying rationale deeper?
          </h3>
          <p className="text-[14px] text-zinc-400">
            Let the Context Engine synthesize all linked meetings, incident reports, and review notes in natural language.
          </p>
        </div>

        <button
          id="ask-why-about-decision-btn"
          onClick={handleTriggerAskWhy}
          className="inline-flex items-center space-x-2 bg-[#F9FEFF] hover:bg-zinc-200 text-black text-[14px] font-bold px-6 py-3 rounded-xl transition cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-black" />
          <span>Ask Why about this decision</span>
          <ArrowRight className="w-4 h-4 text-black" />
        </button>
      </div>

    </div>
  );
};
