import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Navbar } from './components/Navbar';
import { MorningBriefView } from './components/MorningBriefView';
import { AskWhyResultView } from './components/AskWhyResultView';
import { DecisionLibraryView } from './components/DecisionLibraryView';
import { DecisionDetailView } from './components/DecisionDetailView';
import { AddContextModal } from './components/AddContextModal';
import { SourceDetailModal } from './components/SourceDetailModal';
import { GoogleDocsModal } from './components/GoogleDocsModal';
import { ContextSource, DecisionItem, MorningBriefData, ReasoningResult } from './types';
import { INITIAL_MORNING_BRIEF } from './data/mockData';
import { initAuth } from './lib/firebaseAuth';

export default function App() {
  const [activeTab, setActiveTab] = useState<'brief' | 'library'>('brief');
  const [currentView, setCurrentView] = useState<'brief' | 'ask-why-result' | 'decision-detail'>('brief');

  const [brief, setBrief] = useState<MorningBriefData>(INITIAL_MORNING_BRIEF);
  const [decisions, setDecisions] = useState<DecisionItem[]>([]);
  const [contextSources, setContextSources] = useState<ContextSource[]>([]);
  
  const [selectedDecision, setSelectedDecision] = useState<DecisionItem | null>(null);
  const [reasoningResult, setReasoningResult] = useState<ReasoningResult | null>(null);
  const [inspectSource, setInspectSource] = useState<ContextSource | null>(null);

  const [isAsking, setIsAsking] = useState(false);
  const [isAddContextOpen, setIsAddContextOpen] = useState(false);
  
  // Google Docs & Workspace state
  const [user, setUser] = useState<User | null>(null);
  const [isGoogleDocsOpen, setIsGoogleDocsOpen] = useState(false);
  const [exportingDecision, setExportingDecision] = useState<DecisionItem | null>(null);

  // Initialize Firebase Auth listener on app load
  useEffect(() => {
    const unsubscribe = initAuth(
      (authenticatedUser) => {
        setUser(authenticatedUser);
      },
      () => {
        setUser(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Fetch initial data from Express backend API
  useEffect(() => {
    fetch('/api/decisions')
      .then((res) => res.json())
      .then((data) => setDecisions(data))
      .catch((err) => console.error('Failed to load decisions:', err));

    fetch('/api/context-sources')
      .then((res) => res.json())
      .then((data) => setContextSources(data))
      .catch((err) => console.error('Failed to load context sources:', err));
  }, []);

  // Handle Ask Why natural language query
  const handleAskWhy = async (question: string) => {
    setIsAsking(true);
    try {
      const res = await fetch('/api/ask-why', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      const data: ReasoningResult = await res.json();
      setReasoningResult(data);
      setCurrentView('ask-why-result');
    } catch (err) {
      console.error('Error asking why:', err);
    } finally {
      setIsAsking(false);
    }
  };

  // Handle decision selection
  const handleSelectDecision = (decisionId: string) => {
    const found = decisions.find((d) => d.id === decisionId);
    if (found) {
      setSelectedDecision(found);
      setCurrentView('decision-detail');
      setActiveTab('library');
    }
  };

  // Handle sync new context note (manual)
  const handleAddContext = async (newSourceData: any) => {
    try {
      const res = await fetch('/api/context/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSourceData)
      });
      const data = await res.json();
      if (data.source) {
        setContextSources((prev) => [data.source, ...prev]);
      }
    } catch (err) {
      console.error('Failed to add context source:', err);
    }
  };

  // Handle import Google Doc directly into Trace
  const handleImportDocAsContext = async (docSourceData: Omit<ContextSource, 'id'>) => {
    try {
      const res = await fetch('/api/context/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docSourceData)
      });
      const data = await res.json();
      if (data.source) {
        setContextSources((prev) => [data.source, ...prev]);
      }
    } catch (err) {
      console.error('Failed to import Google Doc to Trace:', err);
      throw err;
    }
  };

  // Handle export decision to Google Doc
  const handleStartExportDecision = (decision: DecisionItem) => {
    setExportingDecision(decision);
    setIsGoogleDocsOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#020408] text-[#F9FEFF] font-sans antialiased selection:bg-zinc-800 selection:text-white flex flex-col">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'brief') setCurrentView('brief');
          else if (tab === 'library') {
            if (!selectedDecision) setCurrentView('brief'); // Default to library list
          }
        }}
        onOpenGoogleDocs={() => {
          setExportingDecision(null);
          setIsGoogleDocsOpen(true);
        }}
        user={user}
        userName={user?.displayName || brief.user.name}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'brief' && currentView === 'brief' && (
          <MorningBriefView
            brief={brief}
            onAskWhy={handleAskWhy}
            onSelectDecision={handleSelectDecision}
            isAsking={isAsking}
          />
        )}

        {currentView === 'ask-why-result' && reasoningResult && (
          <AskWhyResultView
            result={reasoningResult}
            onBack={() => setCurrentView('brief')}
            onSelectDecision={handleSelectDecision}
            onSourceClick={(source) => setInspectSource(source)}
          />
        )}

        {activeTab === 'library' && currentView !== 'decision-detail' && (
          <DecisionLibraryView
            decisions={decisions}
            onSelectDecision={handleSelectDecision}
            onOpenGoogleDocs={() => {
              setExportingDecision(null);
              setIsGoogleDocsOpen(true);
            }}
          />
        )}

        {activeTab === 'library' && currentView === 'decision-detail' && selectedDecision && (
          <DecisionDetailView
            decision={selectedDecision}
            onBack={() => setCurrentView('brief')}
            onAskWhyAboutDecision={handleAskWhy}
            onSourceClick={(source) => setInspectSource(source)}
            onExportToGoogleDocs={handleStartExportDecision}
          />
        )}
      </main>

      {/* Modals */}
      <AddContextModal
        isOpen={isAddContextOpen}
        onClose={() => setIsAddContextOpen(false)}
        onAdd={handleAddContext}
      />

      <SourceDetailModal
        source={inspectSource}
        onClose={() => setInspectSource(null)}
      />

      <GoogleDocsModal
        isOpen={isGoogleDocsOpen}
        onClose={() => {
          setIsGoogleDocsOpen(false);
          setExportingDecision(null);
        }}
        user={user}
        onUserAuthChange={(newUser) => setUser(newUser)}
        onImportDocAsContext={handleImportDocAsContext}
        exportDecision={exportingDecision}
      />

      {/* Footer */}
      <footer className="border-t border-[#21262d] bg-[#020408] py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-[12px] text-zinc-500 space-y-1">
          <p className="font-semibold text-zinc-300 text-[12px]">Trace</p>
          <p className="text-zinc-500 text-[12px]">Trace decisions. Preserve knowledge.</p>
        </div>
      </footer>
    </div>
  );
}

