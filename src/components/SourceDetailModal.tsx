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
      case 'calendar': return <Calendar className="w-5 h-5 text-zinc-400" />;
      case 'doc': return <FileText className="w-5 h-5 text-zinc-400" />;
      case 'github': return <GitPullRequest className="w-5 h-5 text-zinc-400" />;
      case 'incident': return <AlertTriangle className="w-5 h-5 text-zinc-400" />;
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#0D1116] rounded-2xl max-w-lg w-full p-6 border border-[#21262d] space-y-6">
        <div className="flex items-start justify-between border-b border-[#21262d] pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-[#020408] border border-[#21262d]">
              {getSourceIcon(source.type)}
            </div>
            <div>
              <span className="text-[12px] font-bold uppercase tracking-wider text-zinc-400 block">
                {getSourceBadgeText(source.type)} · {source.date}
              </span>
              <h3 className="text-[20px] font-bold text-[#F9FEFF] leading-snug">{source.title}</h3>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#020408] text-zinc-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-[14px]">
          {source.authorOrHost && (
            <div className="flex items-center space-x-2 text-zinc-400">
              <User className="w-4 h-4 text-zinc-500" />
              <span className="font-semibold text-[14px]">Host / Author: {source.authorOrHost}</span>
            </div>
          )}

          <div className="space-y-1">
            <span className="text-[12px] font-bold text-zinc-400 uppercase tracking-wider">Summary</span>
            <p className="p-3 bg-[#020408] rounded-xl border border-[#21262d] text-zinc-300 leading-relaxed text-[14px]">
              {source.summary}
            </p>
          </div>

          {source.details && (
            <div className="space-y-1">
              <span className="text-[12px] font-bold text-zinc-400 uppercase tracking-wider">Full Notes / Context Payload</span>
              <p className="p-3 bg-[#020408] text-zinc-300 font-mono text-[12px] rounded-xl border border-[#21262d] leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto">
                {source.details}
              </p>
            </div>
          )}
        </div>

        <div className="pt-2 flex justify-between items-center border-t border-[#21262d]">
          <a
            href={source.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 text-[12px] font-bold text-[#5991F1] hover:text-[#8bb6ff] transition"
          >
            <span>Open in {getSourceBadgeText(source.type)}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[12px] font-bold bg-[#F9FEFF] text-black hover:bg-zinc-200 transition cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
