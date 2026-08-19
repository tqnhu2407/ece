import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BrainCircuit, ArrowRight, ShieldCheck, Sparkles, BookOpen, HelpCircle } from 'lucide-react';

interface LandingViewProps {
  onSignIn: () => Promise<void>;
  isLoading?: boolean;
}

export const LandingView: React.FC<LandingViewProps> = ({ onSignIn, isLoading = false }) => {
  const [signingIn, setSigningIn] = useState(false);

  const handleSignInClick = async () => {
    if (signingIn || isLoading) return;
    setSigningIn(true);
    try {
      await onSignIn();
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020408] text-[#F9FEFF] font-sans antialiased flex flex-col justify-between selection:bg-zinc-800 selection:text-white">
      {/* Top Minimal Header */}
      <header className="border-b border-[#21262d] bg-[#0D1116]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-[8px] bg-[#020408] border border-[#21262d] flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-[#F9FEFF]" />
            </div>
            <span className="font-bold text-[18px] tracking-tight text-[#F9FEFF]">
              Trace
            </span>
          </div>

          <button
            id="landing-signin-btn-header"
            onClick={handleSignInClick}
            disabled={signingIn || isLoading}
            className="flex items-center space-x-2 bg-[#020408] hover:bg-[#161b22] text-zinc-200 hover:text-white text-[13px] font-semibold px-3.5 py-1.5 rounded-[8px] border border-[#21262d] transition cursor-pointer disabled:opacity-50"
          >
            <span>Continue with Google</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-16">
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.215, 0.61, 0.355, 1] }}
          className="max-w-3xl w-full text-center space-y-8"
        >
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-[8px] bg-[#0D1116] border border-[#21262d] text-zinc-300 text-[12px] font-medium">
            <BrainCircuit className="w-4 h-4 text-zinc-400" />
            <span>Collective Engineering Memory</span>
          </div>

          {/* Core Headlines */}
          <div className="space-y-4">
            <h1 className="text-[38px] sm:text-[48px] font-extrabold text-[#F9FEFF] tracking-tight leading-[1.12]">
              Understand the why behind every change.
            </h1>
            <p className="text-[16px] sm:text-[18px] text-zinc-400 max-w-2xl mx-auto font-normal leading-relaxed">
              Connect your engineering workspace and turn scattered team knowledge into traceable context.
            </p>
          </div>

          {/* Primary Action Button */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              id="landing-signin-btn-primary"
              onClick={handleSignInClick}
              disabled={signingIn || isLoading}
              className="w-full sm:w-auto flex items-center justify-center space-x-3 bg-[#F9FEFF] hover:bg-zinc-200 text-black text-[15px] font-bold px-8 py-3.5 rounded-[8px] shadow-lg transition-all cursor-pointer disabled:opacity-50 active:scale-[0.99]"
            >
              {/* Google G Logo */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{signingIn || isLoading ? 'Connecting to Google…' : 'Continue with Google'}</span>
            </button>
          </div>

          {/* Value Pillars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-12 text-left">
            <div className="bg-[#0D1116] p-5 rounded-[8px] border border-[#21262d] space-y-2">
              <div className="w-8 h-8 rounded-[8px] bg-[#020408] border border-[#21262d] flex items-center justify-center text-zinc-300">
                <Sparkles className="w-4 h-4 text-blue-400" />
              </div>
              <h2 className="text-[15px] font-bold text-[#F9FEFF]">Morning Briefs</h2>
              <p className="text-[13px] text-zinc-400 leading-relaxed">
                Catch up on architectural decisions, team meetings, and pipeline changes across your team.
              </p>
            </div>

            <div className="bg-[#0D1116] p-5 rounded-[8px] border border-[#21262d] space-y-2">
              <div className="w-8 h-8 rounded-[8px] bg-[#020408] border border-[#21262d] flex items-center justify-center text-zinc-300">
                <HelpCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <h2 className="text-[15px] font-bold text-[#F9FEFF]">Ask Why</h2>
              <p className="text-[13px] text-zinc-400 leading-relaxed">
                Reconstruct reasoning from actual Docs and Calendar events with verifiable evidence links.
              </p>
            </div>

            <div className="bg-[#0D1116] p-5 rounded-[8px] border border-[#21262d] space-y-2">
              <div className="w-8 h-8 rounded-[8px] bg-[#020408] border border-[#21262d] flex items-center justify-center text-zinc-300">
                <BookOpen className="w-4 h-4 text-purple-400" />
              </div>
              <h2 className="text-[15px] font-bold text-[#F9FEFF]">Decision Library</h2>
              <p className="text-[13px] text-zinc-400 leading-relaxed">
                Preserve collective engineering memory and never lose the context behind key technical choices.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-2 text-[12px] text-zinc-500 pt-4">
            <ShieldCheck className="w-4 h-4 text-zinc-500" />
            <span>Secure integration with Google Drive, Docs, and Google Calendar</span>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#21262d] bg-[#0D1116]/40 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center text-[12px] text-zinc-500 space-y-1">
          <p className="font-semibold text-zinc-400 text-[12px]">Trace</p>
          <p className="text-zinc-500 text-[12px]">Trace decisions. Preserve knowledge.</p>
        </div>
      </footer>
    </div>
  );
};
