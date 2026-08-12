import React from 'react';
import { X, Calendar, FileText, GitPullRequest, AlertTriangle, ExternalLink, User } from 'lucide-react';
import { ContextSource } from '../types';

interface SourceDetailModalProps {
  source: ContextSource | null;
  onClose: () => void;
}

export const SourceDetailModal: React.FC<SourceDetailModalProps> = ({
  source,
  onClose,
}) => {
  if (!source) return null;

  const getSourceIcon = (type: ContextSource['type']) => {
    switch (type) {
      case 'calendar': return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'doc': return <FileText className="w-5 h-5 text-emerald-500" />;
      case 'github': return <GitPullRequest className="w-5 h-5 text-purple-500" />;
      case 'incident': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-6">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-slate-100">
              {getSourceIcon(source.type)}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                {getSourceBadgeText(source.type)} · {source.date}
              </span>
              <h3 className="text-lg font-bold text-slate-900 leading-snug">{source.title}</h3>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs sm:text-sm">
          {source.authorOrHost && (
            <div className="flex items-center space-x-2 text-slate-600">
              <User className="w-4 h-4 text-slate-400" />
              <span className="font-semibold">Host / Author: {source.authorOrHost}</span>
            </div>
          )}

          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Summary</span>
            <p className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 leading-relaxed">
              {source.summary}
            </p>
          </div>

          {source.details && (
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Notes / Context Payload</span>
              <p className="p-3 bg-slate-900 text-slate-200 font-mono text-xs rounded-xl border border-slate-800 leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto">
                {source.details}
              </p>
            </div>
          )}
        </div>

        <div className="pt-2 flex justify-between items-center border-t border-slate-100">
          <a
            href={source.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-500"
          >
            <span>Open in {getSourceBadgeText(source.type)}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
