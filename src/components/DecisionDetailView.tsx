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
  User, 
  CheckCircle2, 
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

  const handleTriggerAskWhy = () => {
    const question = `Why did we ${decision.title.toLowerCase()}?`;
    onAskWhyAboutDecision(question);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Decision Library</span>
      </button>

      {/* Decision Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
              {decision.category}
            </span>
            <span className="text-xs text-slate-400 font-mono">{decision.date}</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500">Owner:</span>
            <span className="text-xs font-semibold text-slate-800">{decision.author}</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {decision.title}
        </h1>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {decision.tags.map((tag, idx) => (
            <span key={idx} className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-md">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Decision Statement */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600">
          DECISION SUMMARY
        </h2>
        <p className="text-slate-800 text-base sm:text-lg leading-relaxed font-semibold">
          {decision.summary}
        </p>
      </div>

      {/* Why Rationale */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-amber-600">
          WHY THIS DECISION WAS MADE
        </h2>
        <p className="text-slate-700 text-base leading-relaxed">
          {decision.why}
        </p>
      </div>

      {/* Context Timeline */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <span>Context Timeline</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Historical progression of events, reviews, and implementations.
          </p>
        </div>

        <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-100">
          {decision.timeline.map((step, idx) => (
            <div key={idx} className="relative group">
              <div className="absolute -left-6 top-1 w-6 h-6 rounded-full bg-indigo-600 border-4 border-white shadow flex items-center justify-center text-white text-[10px] font-bold">
                {idx + 1}
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-semibold text-slate-500">{step.date}</span>
                  <span className="text-xs font-bold text-indigo-700 uppercase">{step.title}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Evidence */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          <span>Evidence Sources</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {decision.evidence.map((source) => (
            <div
              key={source.id}
              onClick={() => onSourceClick(source)}
              className="p-3.5 bg-slate-50 hover:bg-indigo-50/50 rounded-xl border border-slate-200 hover:border-indigo-300 transition cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center space-x-3">
                {getSourceIcon(source.type)}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    {getSourceBadgeText(source.type)}
                  </span>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {source.title}
                  </span>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition" />
            </div>
          ))}
        </div>
      </div>

      {/* Prominent Ask Why Button */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 text-center space-y-4 shadow-xl border border-indigo-500/30">
        <div className="max-w-md mx-auto space-y-1">
          <div className="inline-flex items-center space-x-1.5 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Deep Context Reconstruction</span>
          </div>
          <h3 className="text-lg font-bold text-white">
            Want to understand the underlying rationale deeper?
          </h3>
          <p className="text-xs text-slate-300">
            Let Gemini synthesize all linked meetings, incident reports, and review notes in natural language.
          </p>
        </div>

        <button
          id="ask-why-about-decision-btn"
          onClick={handleTriggerAskWhy}
          className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-6 py-3 rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Ask Why about this decision</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
