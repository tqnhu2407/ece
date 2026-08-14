import React from 'react';
import { BrainCircuit, BookOpen, Plus, Sparkles } from 'lucide-react';

interface NavbarProps {
  activeTab: 'brief' | 'library';
  setActiveTab: (tab: 'brief' | 'library') => void;
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
    <header className="sticky top-0 z-40 bg-[#0D1116] text-[#F9FEFF] border-b border-[#21262d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('brief')}>
            <div className="w-10 h-10 rounded-[8px] bg-[#020408] border border-[#21262d] flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-[#F9FEFF]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-[18px] tracking-tight text-[#F9FEFF]">
                  Engineering Context Engine
                </span>
                <span className="px-2 py-0.5 text-[12px] font-mono font-semibold bg-[#020408] text-zinc-400 border border-[#21262d] rounded-[8px]">
                  ECE
                </span>
              </div>
              <p className="text-[12px] text-zinc-400 hidden sm:block">
                Maintain Understanding · Prevent Context Decay
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2 bg-[#020408] p-1 rounded-[8px] border border-[#21262d]">
            <button
              id="nav-brief-tab"
              onClick={() => setActiveTab('brief')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-[8px] text-[14px] font-medium transition-all ${
                activeTab === 'brief'
                  ? 'bg-[#F9FEFF] text-black shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-[#0D1116]'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Morning Brief</span>
            </button>

            <button
              id="nav-library-tab"
              onClick={() => setActiveTab('library')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-[8px] text-[14px] font-medium transition-all ${
                activeTab === 'library'
                  ? 'bg-[#F9FEFF] text-black shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-[#0D1116]'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Decision Library</span>
            </button>
          </nav>

          {/* Right Actions & User Profile */}
          <div className="flex items-center space-x-3">
            <button
              id="add-context-btn"
              onClick={onOpenAddContext}
              className="hidden md:flex items-center space-x-2 bg-[#020408] hover:bg-[#161b22] text-zinc-200 text-[12px] font-semibold px-4 py-2 rounded-[8px] border border-[#21262d] transition cursor-pointer"
              title="Add a meeting note, RFC, or incident report into team context"
            >
              <Plus className="w-4 h-4 text-zinc-400" />
              <span>Connect Sources</span>
            </button>

            {/* User Avatar */}
            <div className="flex items-center space-x-2 pl-2 border-l border-[#21262d]">
              <div className="w-8 h-8 rounded-[8px] bg-[#020408] border border-[#21262d] flex items-center justify-center text-[12px] font-bold text-zinc-200">
                {userName.charAt(0)}
              </div>
              <span className="text-[12px] font-medium text-zinc-400 hidden sm:inline-block">{userName}</span>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
