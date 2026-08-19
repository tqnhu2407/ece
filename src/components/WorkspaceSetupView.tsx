import React from 'react';
import { motion } from 'motion/react';
import { BrainCircuit, FileText, Calendar, ArrowRight, CheckCircle2, RefreshCw, LogOut, User as UserIcon } from 'lucide-react';
import { User } from 'firebase/auth';

interface WorkspaceSetupViewProps {
  user: User | null;
  docsCount: number;
  calendarCount: number;
  totalContextCount: number;
  onOpenGoogleDocs: () => void;
  onOpenGoogleCalendar: () => void;
  onEnterTrace: () => void;
  onSignOut: () => void;
  isSyncing?: boolean;
  syncStatusMessage?: string | null;
  lastSyncedNotice?: string | null;
}

export const WorkspaceSetupView: React.FC<WorkspaceSetupViewProps> = ({
  user,
  docsCount,
  calendarCount,
  totalContextCount,
  onOpenGoogleDocs,
  onOpenGoogleCalendar,
  onEnterTrace,
  onSignOut,
  isSyncing = false,
  syncStatusMessage = null,
  lastSyncedNotice = null,
}) => {
  return (
    <div className="min-h-screen bg-[#020408] text-[#F9FEFF] font-sans antialiased flex flex-col justify-between selection:bg-zinc-800 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-[#21262d] bg-[#0D1116]/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-[8px] bg-[#020408] border border-[#21262d] flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-[#F9FEFF]" />
            </div>
            <span className="font-bold text-[18px] tracking-tight text-[#F9FEFF]">
              Trace
            </span>
          </div>

          {/* User Profile & Sign Out */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-[#020408] px-3 py-1.5 rounded-[8px] border border-[#21262d]">
              <div className="w-6 h-6 rounded-[6px] bg-zinc-800 flex items-center justify-center text-[11px] font-bold text-zinc-200">
                {user?.displayName ? user.displayName.charAt(0) : <UserIcon className="w-3.5 h-3.5" />}
              </div>
              <span className="text-[12px] font-medium text-zinc-300 hidden sm:inline">
                {user?.displayName || user?.email || 'User'}
              </span>
            </div>

            <button
              onClick={onSignOut}
              className="flex items-center space-x-1.5 text-zinc-400 hover:text-white text-[12px] font-medium px-2.5 py-1.5 rounded-[8px] hover:bg-[#161b22] transition cursor-pointer"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Setup Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.215, 0.61, 0.355, 1] }}
          className="max-w-2xl w-full space-y-8"
        >
          {/* Headline & Description */}
          <div className="text-center space-y-3">
            <h1 className="text-[32px] sm:text-[36px] font-extrabold text-[#F9FEFF] tracking-tight leading-tight">
              Build your team's memory
            </h1>
            <p className="text-[15px] text-zinc-400 max-w-xl mx-auto font-normal leading-relaxed">
              Connect the sources where your team already works. Trace will use them to reconstruct decisions, changes, and context.
            </p>
          </div>

          {/* Sync status notices */}
          {isSyncing && (
            <div className="p-3.5 bg-[#0D1116] border border-blue-800/60 rounded-[8px] flex items-center justify-between text-[13px] text-blue-300 shadow-sm">
              <div className="flex items-center space-x-2.5">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-400 shrink-0" />
                <span className="font-semibold">{syncStatusMessage || 'Updating Trace memory…'}</span>
              </div>
            </div>
          )}

          {lastSyncedNotice && !isSyncing && (
            <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/60 rounded-[8px] flex items-center justify-between text-[13px] text-emerald-300 shadow-sm">
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold">{lastSyncedNotice}</span>
              </div>
            </div>
          )}

          {/* Integration Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Google Docs Card */}
            <div className="bg-[#0D1116] rounded-[8px] p-6 border border-[#21262d] flex flex-col justify-between space-y-5 hover:border-zinc-600 transition">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-[8px] bg-[#020408] border border-[#21262d] flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-[17px] font-bold text-[#F9FEFF]">Google Drive & Docs</h2>
                  <p className="text-[13px] text-zinc-400 mt-1 leading-relaxed">
                    Import RFCs, architecture notes, incident reports, and onboarding docs.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#21262d] flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-zinc-500 font-medium">Synced Docs:</span>
                  <span className={`font-bold font-mono ${docsCount > 0 ? 'text-emerald-400' : 'text-zinc-400'}`}>
                    {docsCount} {docsCount === 1 ? 'doc' : 'docs'}
                  </span>
                </div>

                <button
                  id="setup-sync-docs-btn"
                  onClick={onOpenGoogleDocs}
                  className="w-full flex items-center justify-center space-x-2 bg-[#020408] hover:bg-[#161b22] text-zinc-200 hover:text-white px-4 py-2.5 rounded-[8px] border border-[#21262d] text-[13px] font-semibold transition cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>{docsCount > 0 ? 'Sync More Docs' : 'Connect Google Docs'}</span>
                </button>
              </div>
            </div>

            {/* Google Calendar Card */}
            <div className="bg-[#0D1116] rounded-[8px] p-6 border border-[#21262d] flex flex-col justify-between space-y-5 hover:border-zinc-600 transition">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-[8px] bg-[#020408] border border-[#21262d] flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-[17px] font-bold text-[#F9FEFF]">Google Calendar</h2>
                  <p className="text-[13px] text-zinc-400 mt-1 leading-relaxed">
                    Sync architecture reviews, product discussions, and team sync meetings.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#21262d] flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-zinc-500 font-medium">Synced Events:</span>
                  <span className={`font-bold font-mono ${calendarCount > 0 ? 'text-emerald-400' : 'text-zinc-400'}`}>
                    {calendarCount} {calendarCount === 1 ? 'event' : 'events'}
                  </span>
                </div>

                <button
                  id="setup-sync-calendar-btn"
                  onClick={onOpenGoogleCalendar}
                  className="w-full flex items-center justify-center space-x-2 bg-[#020408] hover:bg-[#161b22] text-zinc-200 hover:text-white px-4 py-2.5 rounded-[8px] border border-[#21262d] text-[13px] font-semibold transition cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>{calendarCount > 0 ? 'Sync More Events' : 'Connect Google Calendar'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Enter Trace CTA Button (Active when context items exist) */}
          <div className="pt-4 flex flex-col items-center gap-2">
            <button
              id="enter-trace-btn"
              onClick={onEnterTrace}
              disabled={totalContextCount === 0 || isSyncing}
              className={`w-full sm:w-auto flex items-center justify-center space-x-2.5 px-8 py-3.5 rounded-[8px] text-[14px] font-bold transition-all cursor-pointer ${
                totalContextCount > 0 && !isSyncing
                  ? 'bg-[#F9FEFF] hover:bg-zinc-200 text-black shadow-lg cursor-pointer'
                  : 'bg-[#0D1116] text-zinc-500 border border-[#21262d] opacity-60 cursor-not-allowed'
              }`}
            >
              <span>
                {totalContextCount > 0
                  ? `Enter Trace (${totalContextCount} connected)`
                  : 'Connect at least 1 source to continue'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {totalContextCount === 0 && (
              <p className="text-[12px] text-zinc-500 text-center">
                Select and sync Google Docs or Calendar events from above to build team memory.
              </p>
            )}
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#21262d] bg-[#0D1116]/40 py-6">
        <div className="max-w-5xl mx-auto px-4 text-center text-[12px] text-zinc-500 space-y-1">
          <p className="font-semibold text-zinc-400 text-[12px]">Trace</p>
          <p className="text-zinc-500 text-[12px]">Trace decisions. Preserve knowledge.</p>
        </div>
      </footer>
    </div>
  );
};
