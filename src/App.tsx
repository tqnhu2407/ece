import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { Navbar } from './components/Navbar';
import { LandingView } from './components/LandingView';
import { WorkspaceSetupView } from './components/WorkspaceSetupView';
import { MorningBriefView } from './components/MorningBriefView';
import { AskWhyResultView } from './components/AskWhyResultView';
import { DecisionLibraryView } from './components/DecisionLibraryView';
import { DecisionDetailView } from './components/DecisionDetailView';
import { AddContextModal } from './components/AddContextModal';
import { SourceDetailModal } from './components/SourceDetailModal';
import { GoogleDocsModal } from './components/GoogleDocsModal';
import { GoogleCalendarModal } from './components/GoogleCalendarModal';
import { ContextSource, DecisionItem, MorningBriefData, ReasoningResult } from './types';
import { initAuth, googleSignIn, logout } from './lib/firebaseAuth';
import {
  executeSingleContextIngestion,
  executeBatchContextIngestion,
} from './lib/contextSyncLifecycle';

export default function App() {
  const [activeTab, setActiveTab] = useState<'brief' | 'library'>('brief');
  const [currentView, setCurrentView] = useState<'brief' | 'ask-why-result' | 'decision-detail'>('brief');

  const [brief, setBrief] = useState<MorningBriefData | null>(null);
  const [decisions, setDecisions] = useState<DecisionItem[]>([]);
  const [contextSources, setContextSources] = useState<ContextSource[]>([]);
  
  const [selectedDecision, setSelectedDecision] = useState<DecisionItem | null>(null);
  const [reasoningResult, setReasoningResult] = useState<ReasoningResult | null>(null);
  const [inspectSource, setInspectSource] = useState<ContextSource | null>(null);

  const [isAsking, setIsAsking] = useState(false);
  const [isAddContextOpen, setIsAddContextOpen] = useState(false);

  // Sync lifecycle state
  const [isSyncingContext, setIsSyncingContext] = useState(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);
  const [lastSyncedNotice, setLastSyncedNotice] = useState<string | null>(null);
  
  // Google Docs & Workspace state
  const [user, setUser] = useState<User | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isGoogleDocsOpen, setIsGoogleDocsOpen] = useState(false);
  const [exportingDecision, setExportingDecision] = useState<DecisionItem | null>(null);

  // Google Calendar state
  const [isGoogleCalendarOpen, setIsGoogleCalendarOpen] = useState(false);
  const [schedulingDecision, setSchedulingDecision] = useState<DecisionItem | null>(null);

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

  // Fetch context sources & decisions from Express backend API
  const refreshData = useCallback(async (currentUserName?: string) => {
    try {
      const [sourcesRes, decisionsRes] = await Promise.all([
        fetch('/api/context-sources'),
        fetch('/api/decisions')
      ]);
      const sourcesData: ContextSource[] = await sourcesRes.json();
      const decisionsData: DecisionItem[] = await decisionsRes.json();
      setContextSources(sourcesData);
      setDecisions(decisionsData);

      if (sourcesData.length > 0) {
        const uName = currentUserName || user?.displayName || 'Engineering Team';
        const briefRes = await fetch(`/api/morning-brief?userName=${encodeURIComponent(uName)}`);
        if (briefRes.ok) {
          const briefData = await briefRes.json();
          if (briefData) {
            setBrief(briefData);
          }
        }
      } else {
        setBrief(null);
      }
    } catch (err) {
      console.error('Failed to load workspace data:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshData(user.displayName || undefined);
    }
  }, [user, refreshData]);

  // Handle Google Sign In from Landing View
  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        await refreshData(result.user.displayName || undefined);
      }
    } catch (err) {
      console.error('Google Sign In failed:', err);
    } finally {
      setIsSigningIn(false);
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      await logout();
      setUser(null);
      setContextSources([]);
      setDecisions([]);
      setBrief(null);
      setCurrentView('brief');
      setActiveTab('brief');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Handle Ask Why natural language query
  const handleAskWhy = async (question: string) => {
    if (isSyncingContext) return;
    setIsAsking(true);
    try {
      const res = await fetch('/api/ask-why', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          clientContextSources: contextSources,
        })
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
        await refreshData();
      }
    } catch (err) {
      console.error('Failed to add context source:', err);
    }
  };

  // Handle single Google Doc import directly into Trace
  const handleImportDocAsContext = async (docSourceData: Omit<ContextSource, 'id'>) => {
    const result = await executeSingleContextIngestion(docSourceData, {
      sourceType: 'doc',
      onStatusUpdate: (status) => setSyncStatusMessage(status),
      onSetSyncingState: (syncing) => setIsSyncingContext(syncing),
      onSetNotice: (notice) => setLastSyncedNotice(notice),
      onUpdateContextStore: (updated) => setContextSources(updated),
    });
    await refreshData();
    return result;
  };

  // Handle batch Google Docs import directly into Trace
  const handleImportBatchDocsAsContext = async (
    docsSourceData: Array<Omit<ContextSource, 'id'>>
  ): Promise<{ count: number; totalSources: number; isVerified: boolean }> => {
    const result = await executeBatchContextIngestion(docsSourceData, {
      sourceType: 'doc',
      onStatusUpdate: (status) => setSyncStatusMessage(status),
      onSetSyncingState: (syncing) => setIsSyncingContext(syncing),
      onSetNotice: (notice) => setLastSyncedNotice(notice),
      onUpdateContextStore: (updated) => setContextSources(updated),
    });
    await refreshData();
    return result;
  };

  // Handle single Google Calendar event import directly into Trace
  const handleImportCalendarEventAsContext = async (eventSourceData: Omit<ContextSource, 'id'>) => {
    const result = await executeSingleContextIngestion(eventSourceData, {
      sourceType: 'calendar',
      onStatusUpdate: (status) => setSyncStatusMessage(status),
      onSetSyncingState: (syncing) => setIsSyncingContext(syncing),
      onSetNotice: (notice) => setLastSyncedNotice(notice),
      onUpdateContextStore: (updated) => setContextSources(updated),
    });
    await refreshData();
    return result;
  };

  // Handle batch Google Calendar events import directly into Trace
  const handleImportBatchCalendarEventsAsContext = async (
    eventsSourceData: Array<Omit<ContextSource, 'id'>>
  ): Promise<{ count: number; totalSources: number; isVerified: boolean }> => {
    const result = await executeBatchContextIngestion(eventsSourceData, {
      sourceType: 'calendar',
      onStatusUpdate: (status) => setSyncStatusMessage(status),
      onSetSyncingState: (syncing) => setIsSyncingContext(syncing),
      onSetNotice: (notice) => setLastSyncedNotice(notice),
      onUpdateContextStore: (updated) => setContextSources(updated),
    });
    await refreshData();
    return result;
  };

  // Handle export decision to Google Doc
  const handleStartExportDecision = (decision: DecisionItem) => {
    setExportingDecision(decision);
    setIsGoogleDocsOpen(true);
  };

  const docsCount = contextSources.filter((s) => s.type === 'doc').length;
  const calendarCount = contextSources.filter((s) => s.type === 'calendar').length;

  // -------------------------------------------------------------
  // STATE A: Unauthenticated user -> Minimal Landing Page
  // -------------------------------------------------------------
  if (!user) {
    return (
      <LandingView
        onSignIn={handleGoogleSignIn}
        isLoading={isSigningIn}
      />
    );
  }

  // -------------------------------------------------------------
  // STATE B: Authenticated user with 0 synced sources -> Setup Page
  // -------------------------------------------------------------
  if (contextSources.length === 0) {
    return (
      <>
        <WorkspaceSetupView
          user={user}
          docsCount={docsCount}
          calendarCount={calendarCount}
          totalContextCount={contextSources.length}
          onOpenGoogleDocs={() => {
            setExportingDecision(null);
            setIsGoogleDocsOpen(true);
          }}
          onOpenGoogleCalendar={() => {
            setSchedulingDecision(null);
            setIsGoogleCalendarOpen(true);
          }}
          onEnterTrace={() => {
            if (contextSources.length > 0) {
              refreshData();
            }
          }}
          onSignOut={handleSignOut}
          isSyncing={isSyncingContext}
          syncStatusMessage={syncStatusMessage}
          lastSyncedNotice={lastSyncedNotice}
        />

        {/* Sync Modals */}
        <GoogleDocsModal
          isOpen={isGoogleDocsOpen}
          onClose={() => {
            setIsGoogleDocsOpen(false);
            setExportingDecision(null);
          }}
          user={user}
          onUserAuthChange={(newUser) => setUser(newUser)}
          onImportDocAsContext={handleImportDocAsContext}
          onImportBatchDocsAsContext={handleImportBatchDocsAsContext}
          onSyncStatusUpdate={(status) => setSyncStatusMessage(status)}
          exportDecision={exportingDecision}
        />

        <GoogleCalendarModal
          isOpen={isGoogleCalendarOpen}
          onClose={() => {
            setIsGoogleCalendarOpen(false);
            setSchedulingDecision(null);
          }}
          user={user}
          onUserAuthChange={(newUser) => setUser(newUser)}
          onImportEventAsContext={handleImportCalendarEventAsContext}
          onImportBatchEventsAsContext={handleImportBatchCalendarEventsAsContext}
          onSyncStatusUpdate={(status) => setSyncStatusMessage(status)}
          scheduleForDecision={schedulingDecision}
        />
      </>
    );
  }

  // -------------------------------------------------------------
  // STATE C: Authenticated user with synced context -> Main Application
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#020408] text-[#F9FEFF] font-sans antialiased selection:bg-zinc-800 selection:text-white flex flex-col">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'brief') setCurrentView('brief');
          else if (tab === 'library') {
            if (!selectedDecision) setCurrentView('brief');
          }
        }}
        onOpenGoogleDocs={() => {
          setExportingDecision(null);
          setIsGoogleDocsOpen(true);
        }}
        onOpenGoogleCalendar={() => {
          setSchedulingDecision(null);
          setIsGoogleCalendarOpen(true);
        }}
        onSignOut={handleSignOut}
        user={user}
        userName={user?.displayName || 'User'}
        contextCount={contextSources.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'brief' && currentView === 'brief' && brief && (
          <MorningBriefView
            brief={brief}
            onAskWhy={handleAskWhy}
            onSelectDecision={handleSelectDecision}
            isAsking={isAsking}
            isSyncingContext={isSyncingContext}
            syncStatusMessage={syncStatusMessage}
            lastSyncedNotice={lastSyncedNotice}
            onDismissSyncedNotice={() => setLastSyncedNotice(null)}
            contextSourcesCount={contextSources.length}
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
          />
        )}

        {activeTab === 'library' && currentView === 'decision-detail' && selectedDecision && (
          <DecisionDetailView
            decision={selectedDecision}
            onBack={() => setCurrentView('brief')}
            onAskWhyAboutDecision={handleAskWhy}
            onSourceClick={(source) => setInspectSource(source)}
            onExportToGoogleDocs={handleStartExportDecision}
            onScheduleReviewMeeting={(dec) => {
              setSchedulingDecision(dec);
              setIsGoogleCalendarOpen(true);
            }}
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
        onImportBatchDocsAsContext={handleImportBatchDocsAsContext}
        onSyncStatusUpdate={(status) => setSyncStatusMessage(status)}
        exportDecision={exportingDecision}
      />

      <GoogleCalendarModal
        isOpen={isGoogleCalendarOpen}
        onClose={() => {
          setIsGoogleCalendarOpen(false);
          setSchedulingDecision(null);
        }}
        user={user}
        onUserAuthChange={(newUser) => setUser(newUser)}
        onImportEventAsContext={handleImportCalendarEventAsContext}
        onImportBatchEventsAsContext={handleImportBatchCalendarEventsAsContext}
        onSyncStatusUpdate={(status) => setSyncStatusMessage(status)}
        scheduleForDecision={schedulingDecision}
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
