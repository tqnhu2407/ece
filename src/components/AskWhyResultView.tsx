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
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'doc':
        return <FileText className="w-4 h-4 text-emerald-500" />;
      case 'github':
        return <GitPullRequest className="w-4 h-4 text-purple-500" />;
      case 'incident':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
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
    switch (type) {
      case 'incident':
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 rounded">Production Incident</span>;
      case 'investigation':
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 rounded">Investigation</span>;
      case 'review':
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 rounded">Architecture Review</span>;
      case 'decision':
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded">Decision</span>;
      case 'implementation':
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 rounded">Implementation</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 rounded">{type}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      
      {/* Top Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Morning Brief</span>
        </button>

        <div className="flex items-center space-x-2">
          {result.relatedDecisionId && onSelectDecision && (
            <button
              onClick={() => onSelectDecision(result.relatedDecisionId!)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold border border-indigo-200 transition"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>View in Decision Library</span>
            </button>
          )}

          <button
            onClick={handleCopyReasoning}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copied ? 'Copied!' : 'Copy Reasoning'}</span>
          </button>
        </div>
      </div>

      {/* Question Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2 text-indigo-400 text-xs font-mono tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Ask Why · Reconstructed Context</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {result.question}
        </h1>

        {/* AI Answer Box */}
        <div className="bg-slate-950/80 rounded-xl p-5 border border-indigo-500/30 text-slate-100 leading-relaxed text-base sm:text-lg font-normal shadow-inner">
          <p>{result.answer}</p>
        </div>

        {/* Confidence Indicator */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-medium">Evidence Strength:</span>
            <span
              className={`px-2.5 py-1 rounded-full font-bold flex items-center space-x-1.5 ${
                result.confidence === 'High'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : result.confidence === 'Medium'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{result.confidence}</span>
            </span>
          </div>

          <div className="text-slate-400 flex items-center space-x-1">
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <span>{result.confidenceReason}</span>
          </div>
        </div>
      </div>

      {/* Reasoning Timeline Section */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <span>Decision Timeline</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Reconstructed chronological sequence of events, reviews, and implementations leading to this decision.
          </p>
        </div>

        {/* Vertical Timeline Steps */}
        <div className="relative pl-6 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-100">
          {result.reasoningTimeline.map((step, idx) => (
            <div key={idx} className="relative group">
              {/* Timeline Node Dot */}
              <div className="absolute -left-6 top-1 w-6 h-6 rounded-full bg-indigo-600 border-4 border-white shadow flex items-center justify-center text-white text-[10px] font-bold">
                {idx + 1}
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-indigo-200 hover:bg-slate-50/90 transition space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-slate-500 font-mono">{step.date}</span>
                    {getStepTypeBadge(step.type)}
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900">{step.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Evidence Sources Section */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span>Evidence & Context Sources</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Underlying Google Calendar syncs, Google Docs notes, and GitHub PRs utilized by AI to reconstruct reasoning.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {result.evidence.map((source) => (
            <div
              key={source.id}
              onClick={() => onSourceClick(source)}
              className="bg-slate-50 hover:bg-indigo-50/50 rounded-xl p-4 border border-slate-200 hover:border-indigo-300 transition cursor-pointer space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getSourceIcon(source.type)}
                  <span className="text-xs font-semibold text-slate-700">{getSourceBadgeText(source.type)}</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">{source.date}</span>
              </div>

              <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                {source.title}
              </h4>

              <p className="text-xs text-slate-600 line-clamp-2">
                {source.summary}
              </p>

              <div className="flex items-center justify-between pt-2 text-[11px] text-indigo-600 font-semibold">
                <span>{source.authorOrHost ? `By ${source.authorOrHost}` : 'View Source Details'}</span>
                <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
