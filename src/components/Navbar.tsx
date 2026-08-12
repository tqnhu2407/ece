import React from 'react';
import { BrainCircuit, BookOpen, Layers, Plus, Sparkles } from 'lucide-react';

interface NavbarProps {
  activeTab: 'brief' | 'library' | 'sources';
  setActiveTab: (tab: 'brief' | 'library' | 'sources') => void;
  onOpenAddContext: () => void;
  userName: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddContext,
  userName,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-slate-100 border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('brief')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <BrainCircuit className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  Engineering Context Engine
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded">
                  ECE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Maintain Understanding · Prevent Context Decay
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2 bg-slate-950/60 p-1 rounded-lg border border-slate-800">
            <button
              id="nav-brief-tab"
              onClick={() => setActiveTab('brief')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'brief'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Morning Brief</span>
            </button>

            <button
              id="nav-library-tab"
              onClick={() => setActiveTab('library')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'library'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Decision Library</span>
            </button>

            <button
              id="nav-sources-tab"
              onClick={() => setActiveTab('sources')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'sources'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Context Memory</span>
            </button>
          </nav>

          {/* Right Actions & User Profile */}
          <div className="flex items-center space-x-3">
            <button
              id="add-context-btn"
              onClick={onOpenAddContext}
              className="hidden md:flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition"
              title="Add a meeting note, RFC, or incident report into team context"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sync Context</span>
            </button>

            {/* User Avatar */}
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-xs font-bold text-indigo-200">
                {userName.charAt(0)}
              </div>
              <span className="text-xs font-medium text-slate-300 hidden sm:inline-block">{userName}</span>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
