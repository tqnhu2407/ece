import React, { useState } from 'react';
import { X, Calendar, FileText, GitPullRequest, AlertTriangle, Plus } from 'lucide-react';
import { ContextType } from '../types';

interface AddContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: {
    title: string;
    type: ContextType;
    summary: string;
    details: string;
    authorOrHost: string;
    date: string;
  }) => void;
}

export const AddContextModal: React.FC<AddContextModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ContextType>('doc');
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [authorOrHost, setAuthorOrHost] = useState('Nhu T.');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) return;

    onAdd({
      title: title.trim(),
      type,
      summary: summary.trim(),
      details: details.trim() || summary.trim(),
      authorOrHost: authorOrHost.trim() || 'Nhu T.',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    });

    setTitle('');
    setSummary('');
    setDetails('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#0D1116] rounded-2xl max-w-lg w-full p-6 border border-[#21262d] space-y-6">
        <div className="flex items-center justify-between border-b border-[#21262d] pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#020408] border border-[#21262d] flex items-center justify-center text-zinc-300">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[20px] font-bold text-[#F9FEFF]">Sync Engineering Context</h3>
              <p className="text-[12px] text-zinc-400">Inject meeting notes, RFCs, or PRs into team memory</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#020408] text-zinc-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Architecture Review: Session Management"
              className="w-full bg-[#020408] border border-[#21262d] rounded-xl px-3 py-2 text-[14px] text-white placeholder-zinc-500 outline-none focus:border-zinc-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Context Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ContextType)}
                className="w-full bg-[#020408] border border-[#21262d] rounded-xl px-3 py-2 text-[14px] text-white outline-none focus:border-zinc-500"
              >
                <option value="doc">Google Docs / RFC</option>
                <option value="calendar">Google Calendar Meeting</option>
                <option value="github">GitHub PR / Commit</option>
                <option value="incident">Incident Report</option>
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Author / Host
              </label>
              <input
                type="text"
                value={authorOrHost}
                onChange={(e) => setAuthorOrHost(e.target.value)}
                placeholder="e.g. Alex Rivers"
                className="w-full bg-[#020408] border border-[#21262d] rounded-xl px-3 py-2 text-[14px] text-white placeholder-zinc-500 outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Summary (1-2 sentences)
            </label>
            <textarea
              required
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief summary of key decisions, discussion points, or conclusions..."
              className="w-full bg-[#020408] border border-[#21262d] rounded-xl p-3 text-[14px] text-white placeholder-zinc-500 outline-none focus:border-zinc-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-[12px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Detailed Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Paste full raw discussion notes, benchmark results, or tradeoffs..."
              className="w-full bg-[#020408] border border-[#21262d] rounded-xl p-3 text-[14px] text-white placeholder-zinc-500 outline-none focus:border-zinc-500 resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-[12px] font-bold text-zinc-400 hover:text-white hover:bg-[#020408] transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-[12px] font-bold bg-[#F9FEFF] text-black hover:bg-zinc-200 transition cursor-pointer"
            >
              Sync Context
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
