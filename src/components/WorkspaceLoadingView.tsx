import React from 'react';
import { motion } from 'motion/react';
import { BrainCircuit, RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';

interface WorkspaceLoadingViewProps {
  isError?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
  onBackToSetup?: () => void;
}

export const WorkspaceLoadingView: React.FC<WorkspaceLoadingViewProps> = ({
  isError = false,
  errorMessage = null,
  onRetry,
  onBackToSetup,
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
        </div>
      </header>

      {/* Main Loading / Error Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.215, 0.61, 0.355, 1] }}
          className="max-w-md w-full text-center space-y-6 bg-[#0D1116] p-8 rounded-[8px] border border-[#21262d]"
        >
          {isError ? (
            <>
              <div className="w-12 h-12 rounded-[8px] bg-[#020408] border border-red-800/60 flex items-center justify-center mx-auto text-red-400">
                <AlertCircle className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <h1 className="text-[22px] font-extrabold text-[#F9FEFF] tracking-tight">
                  Initialization Failed
                </h1>
                <p className="text-[14px] text-zinc-400 leading-relaxed">
                  {errorMessage || 'Trace was unable to generate your Morning Brief from the connected sources.'}
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                {onRetry && (
                  <button
                    id="retry-init-btn"
                    onClick={onRetry}
                    className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-2.5 rounded-[8px] bg-[#F9FEFF] text-black hover:bg-zinc-200 text-[13px] font-bold transition cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 text-black" />
                    <span>Retry Initialization</span>
                  </button>
                )}

                {onBackToSetup && (
                  <button
                    id="back-to-setup-btn"
                    onClick={onBackToSetup}
                    className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-[8px] bg-[#020408] border border-[#21262d] text-zinc-300 hover:text-white hover:bg-[#161b22] text-[13px] font-semibold transition cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Setup</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-[8px] bg-[#020408] border border-[#21262d] flex items-center justify-center mx-auto relative">
                <BrainCircuit className="w-7 h-7 text-[#F9FEFF] animate-pulse" />
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-500 rounded-full animate-ping opacity-75" />
              </div>

              <div className="space-y-3">
                <h1 className="text-[22px] sm:text-[24px] font-extrabold text-[#F9FEFF] tracking-tight leading-snug">
                  Building your team's memory...
                </h1>
                <p className="text-[14px] text-zinc-400 leading-relaxed max-w-sm mx-auto font-normal">
                  Trace is analyzing your connected sources and reconstructing recent team context.
                </p>
              </div>

              {/* Animated Progress Pulse */}
              <div className="pt-2">
                <div className="w-full h-1.5 bg-[#020408] rounded-full overflow-hidden border border-[#21262d]">
                  <motion.div
                    className="h-full bg-[#F9FEFF]"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.6,
                      ease: 'easeInOut',
                    }}
                  />
                </div>
                <div className="flex items-center justify-center space-x-2 mt-3 text-[12px] text-zinc-500 font-mono">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                  <span>Synthesizing Morning Brief & decisions…</span>
                </div>
              </div>
            </>
          )}
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
