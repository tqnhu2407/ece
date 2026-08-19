import React, { useState, useRef, useEffect } from 'react';
import { BrainCircuit, BookOpen, Sparkles, FileText, Calendar, LogOut, ChevronDown, Settings2, User as UserIcon } from 'lucide-react';
import { User } from 'firebase/auth';

interface NavbarProps {
  activeTab: 'brief' | 'library';
  setActiveTab: (tab: 'brief' | 'library') => void;
  onOpenGoogleDocs: () => void;
  onOpenGoogleCalendar: () => void;
  onSignOut: () => void;
  user: User | null;
  userName: string;
  contextCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenGoogleDocs,
  onOpenGoogleCalendar,
  onSignOut,
  user,
  userName,
  contextCount = 0,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#0D1116] text-[#F9FEFF] border-b border-[#21262d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name */}
          <div 
            className="flex items-center space-x-3 cursor-pointer" 
            onClick={() => setActiveTab('brief')}
          >
            <div className="w-10 h-10 rounded-[8px] bg-[#020408] border border-[#21262d] flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-[#F9FEFF]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-[18px] tracking-tight text-[#F9FEFF]">
                  Trace
                </span>
              </div>
              <p className="text-[12px] text-zinc-400 hidden sm:block">
                Trace decisions. Preserve knowledge.
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs: Morning Brief | Decision Library */}
          <nav className="flex items-center space-x-1 sm:space-x-2 bg-[#020408] p-1 rounded-[8px] border border-[#21262d]">
            <button
              id="nav-brief-tab"
              onClick={() => setActiveTab('brief')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-[8px] text-[14px] font-medium transition-all cursor-pointer ${
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
              className={`flex items-center space-x-2 px-4 py-2 rounded-[8px] text-[14px] font-medium transition-all cursor-pointer ${
                activeTab === 'library'
                  ? 'bg-[#F9FEFF] text-black shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-[#0D1116]'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Decision Library</span>
            </button>
          </nav>

          {/* Right: User Avatar Menu */}
          <div className="relative" ref={menuRef}>
            <button
              id="user-profile-menu-btn"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center space-x-2 bg-[#020408] hover:bg-[#161b22] px-3 py-1.5 rounded-[8px] border border-[#21262d] transition cursor-pointer"
            >
              <div className="w-7 h-7 rounded-[6px] bg-zinc-800 flex items-center justify-center text-[12px] font-bold text-zinc-200">
                {user?.displayName ? user.displayName.charAt(0) : userName.charAt(0)}
              </div>
              <span className="text-[13px] font-medium text-zinc-300 hidden md:inline-block max-w-[120px] truncate">
                {user?.displayName || userName}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[#0D1116] border border-[#21262d] rounded-[8px] shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3.5 py-2 border-b border-[#21262d]">
                  <p className="text-[13px] font-semibold text-[#F9FEFF] truncate">
                    {user?.displayName || userName}
                  </p>
                  <p className="text-[11px] text-zinc-400 truncate">
                    {user?.email || 'Connected to Workspace'}
                  </p>
                  <div className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-[4px] bg-[#020408] border border-[#21262d] text-[10px] text-zinc-400 font-mono">
                    {contextCount} context {contextCount === 1 ? 'source' : 'sources'} synced
                  </div>
                </div>

                {/* Manage Sources Section */}
                <div className="py-1">
                  <div className="px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-zinc-500 flex items-center space-x-1.5">
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>Manage Sources</span>
                  </div>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenGoogleDocs();
                    }}
                    className="w-full px-3.5 py-2 text-left text-[13px] text-zinc-300 hover:text-white hover:bg-[#161b22] flex items-center space-x-2.5 transition cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span>Sync Google Docs</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenGoogleCalendar();
                    }}
                    className="w-full px-3.5 py-2 text-left text-[13px] text-zinc-300 hover:text-white hover:bg-[#161b22] flex items-center space-x-2.5 transition cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span>Sync Google Calendar</span>
                  </button>
                </div>

                {/* Sign Out Section */}
                <div className="pt-1 border-t border-[#21262d]">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onSignOut();
                    }}
                    className="w-full px-3.5 py-2 text-left text-[13px] text-red-400 hover:bg-[#161b22] flex items-center space-x-2.5 transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-red-400" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
