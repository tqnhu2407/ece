import React, { useState, useEffect } from 'react';
import {
  Folder,
  FolderOpen,
  FolderSync,
  FileText,
  Search,
  ExternalLink,
  CheckCircle,
  RefreshCw,
  Plus,
  X,
  UploadCloud,
  Layers,
  Sparkles,
  AlertCircle,
  CheckSquare,
  Square,
  ArrowRight
} from 'lucide-react';
import { User } from 'firebase/auth';
import { googleSignIn, getAccessToken } from '../lib/firebaseAuth';
import {
  listGoogleDriveFolders,
  listGoogleDocsInFolder,
  listGoogleDocs,
  getGoogleDoc,
  createGoogleDoc,
  GoogleDriveFolder,
  GoogleDocSummary,
  GoogleDocContent
} from '../lib/googleDocsApi';
import { ContextSource, DecisionItem } from '../types';

interface GoogleDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUserAuthChange: (user: User | null) => void;
  onImportDocAsContext: (docSource: Omit<ContextSource, 'id'>) => Promise<any>;
  onImportBatchDocsAsContext?: (docSources: Array<Omit<ContextSource, 'id'>>) => Promise<{ count: number; totalSources: number; isVerified?: boolean }>;
  onSyncStatusUpdate?: (status: string | null) => void;
  exportDecision?: DecisionItem | null;
  onExportComplete?: (docUrl: string) => void;
}

export const GoogleDocsModal: React.FC<GoogleDocsModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserAuthChange,
  onImportDocAsContext,
  onImportBatchDocsAsContext,
  onSyncStatusUpdate,
  exportDecision,
  onExportComplete,
}) => {
  const [viewMode, setViewMode] = useState<'folder' | 'file'>('folder');

  // Folder Sync states
  const [folders, setFolders] = useState<GoogleDriveFolder[]>([]);
  const [folderSearchQuery, setFolderSearchQuery] = useState('');
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<GoogleDriveFolder | null>(null);
  const [folderDocs, setFolderDocs] = useState<GoogleDocSummary[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [isLoadingFolderDocs, setIsLoadingFolderDocs] = useState(false);

  // Batch Sync progress states
  const [isBatchSyncing, setIsBatchSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{
    current: number;
    total: number;
    currentTitle: string;
    stage: 'idle' | 'extracting' | 'persisting' | 'verifying' | 'ready';
    statusText: string;
  }>({
    current: 0,
    total: 0,
    currentTitle: '',
    stage: 'idle',
    statusText: '',
  });
  const [syncSuccessCount, setSyncSuccessCount] = useState<number | null>(null);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);

  // Individual Doc states
  const [individualDocs, setIndividualDocs] = useState<GoogleDocSummary[]>([]);
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [isLoadingIndividualDocs, setIsLoadingIndividualDocs] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<GoogleDocSummary | null>(null);
  const [selectedDocContent, setSelectedDocContent] = useState<GoogleDocContent | null>(null);
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);
  const [isImportingSingle, setIsImportingSingle] = useState(false);
  const [singleImportSuccess, setSingleImportSuccess] = useState(false);

  const [authError, setAuthError] = useState<string | null>(null);

  // Export flow states
  const [isExporting, setIsExporting] = useState(false);
  const [showExportConfirmation, setShowExportConfirmation] = useState(false);
  const [exportedDocUrl, setExportedDocUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSingleImportSuccess(false);
      setSyncSuccessCount(null);
      setAuthError(null);
      setExportedDocUrl(null);
      if (exportDecision) {
        setShowExportConfirmation(true);
      } else {
        setShowExportConfirmation(false);
      }
      loadFoldersList();
      loadIndividualDocsList();
    }
  }, [isOpen, exportDecision]);

  const loadFoldersList = async () => {
    const token = await getAccessToken();
    if (!token) return;

    setIsLoadingFolders(true);
    setAuthError(null);
    try {
      const list = await listGoogleDriveFolders(token, folderSearchQuery);
      setFolders(list);
    } catch (err: any) {
      console.error('Failed to load Google Drive folders:', err);
      setAuthError(err.message || 'Could not load Google Drive folders');
    } finally {
      setIsLoadingFolders(false);
    }
  };

  const loadIndividualDocsList = async () => {
    const token = await getAccessToken();
    if (!token) return;

    setIsLoadingIndividualDocs(true);
    try {
      const list = await listGoogleDocs(token, docSearchQuery);
      setIndividualDocs(list);
    } catch (err: any) {
      console.error('Failed to load Google Docs:', err);
    } finally {
      setIsLoadingIndividualDocs(false);
    }
  };

  const handleSignIn = async () => {
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        onUserAuthChange(res.user);
        setIsLoadingFolders(true);
        const folderList = await listGoogleDriveFolders(res.accessToken, folderSearchQuery);
        setFolders(folderList);
        const docList = await listGoogleDocs(res.accessToken, docSearchQuery);
        setIndividualDocs(docList);
      }
    } catch (err: any) {
      const isCancelled =
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        String(err?.message || '').includes('popup-closed-by-user') ||
        String(err?.message || '').includes('cancelled-popup-request');

      if (!isCancelled) {
        console.error('Sign-in failed:', err);
        setAuthError(err.message || 'Authentication failed');
      }
    } finally {
      setIsLoadingFolders(false);
    }
  };

  const handleSelectFolder = async (folder: GoogleDriveFolder) => {
    setSelectedFolder(folder);
    setFolderDocs([]);
    setSelectedDocIds(new Set());
    setSyncSuccessCount(null);
    setIsLoadingFolderDocs(true);
    setAuthError(null);

    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Authentication expired. Please sign in again.');

      const docsInFolder = await listGoogleDocsInFolder(folder.id, token);
      setFolderDocs(docsInFolder);
      // Select all docs in this folder by default
      setSelectedDocIds(new Set(docsInFolder.map((d) => d.id)));
    } catch (err: any) {
      console.error('Failed to load docs in folder:', err);
      setAuthError(err.message || 'Failed to inspect folder contents');
    } finally {
      setIsLoadingFolderDocs(false);
    }
  };

  const toggleSelectDocId = (id: string) => {
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAllDocs = () => {
    if (selectedDocIds.size === folderDocs.length) {
      setSelectedDocIds(new Set());
    } else {
      setSelectedDocIds(new Set(folderDocs.map((d) => d.id)));
    }
  };

  // Bulk / Folder Sync Executor
  const handleSyncEntireFolder = async () => {
    if (!selectedFolder || folderDocs.length === 0) return;
    const docsToSync = folderDocs.filter((d) => selectedDocIds.has(d.id));
    if (docsToSync.length === 0) return;

    setIsBatchSyncing(true);
    setSyncSuccessCount(null);
    setSyncSuccessMessage(null);
    setAuthError(null);

    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Authentication expired. Please sign in again.');

      const extractedDocSources: Array<Omit<ContextSource, 'id'>> = [];

      // Step 1: Sequential document fetch & content extraction
      for (let i = 0; i < docsToSync.length; i++) {
        const doc = docsToSync[i];
        const statusText = `Syncing ${i + 1}/${docsToSync.length} documents…`;
        setSyncProgress({
          current: i + 1,
          total: docsToSync.length,
          currentTitle: doc.name,
          stage: 'extracting',
          statusText,
        });
        onSyncStatusUpdate?.(statusText);

        try {
          const docContent = await getGoogleDoc(doc.id, token);
          const summaryText = docContent.extractedText.slice(0, 300) + '...';
          const docOwner =
            doc.owners?.[0]?.displayName ||
            doc.owners?.[0]?.emailAddress ||
            user?.displayName ||
            'Google Docs';

          extractedDocSources.push({
            type: 'doc',
            title: doc.name,
            date: doc.modifiedTime
              ? new Date(doc.modifiedTime).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : new Date().toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                }),
            authorOrHost: docOwner,
            summary: summaryText,
            details: docContent.extractedText,
            url: doc.webViewLink || `https://docs.google.com/document/d/${doc.id}/edit`,
            metadata: {
              googleDocId: doc.id,
              folderName: selectedFolder.name,
              folderId: selectedFolder.id,
              headingsCount: String(docContent.headings.length),
            },
          });
        } catch (singleDocErr) {
          console.warn(`Failed to extract doc ${doc.name}:`, singleDocErr);
        }
      }

      if (extractedDocSources.length === 0) {
        throw new Error('No valid documents could be extracted from the selected list.');
      }

      // Step 2: Ingestion & memory persistence
      setSyncProgress({
        current: extractedDocSources.length,
        total: docsToSync.length,
        currentTitle: '',
        stage: 'persisting',
        statusText: 'Updating Trace memory…',
      });
      onSyncStatusUpdate?.('Updating Trace memory…');

      if (onImportBatchDocsAsContext) {
        await onImportBatchDocsAsContext(extractedDocSources);
      } else {
        for (const docSrc of extractedDocSources) {
          await onImportDocAsContext(docSrc);
        }
      }

      // Step 3: Verified query readiness
      const syncedCount = extractedDocSources.length;
      const readyMsg =
        syncedCount === 1
          ? '1 document synced and ready for Trace.'
          : `${syncedCount} documents synced and ready to query.`;

      setSyncProgress({
        current: syncedCount,
        total: docsToSync.length,
        currentTitle: '',
        stage: 'ready',
        statusText: readyMsg,
      });
      onSyncStatusUpdate?.(null);
      setSyncSuccessCount(syncedCount);
      setSyncSuccessMessage(readyMsg);
    } catch (err: any) {
      console.error('Failed batch sync of folder:', err);
      setAuthError(err.message || 'Failed to sync folder contents');
      onSyncStatusUpdate?.(null);
    } finally {
      setIsBatchSyncing(false);
    }
  };

  // Single doc inspection
  const handleSelectSingleDoc = async (doc: GoogleDocSummary) => {
    setSelectedDoc(doc);
    setSelectedDocContent(null);
    setSingleImportSuccess(false);
    setIsLoadingDoc(true);

    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Authentication expired. Please sign in again.');

      const content = await getGoogleDoc(doc.id, token);
      setSelectedDocContent(content);
    } catch (err: any) {
      console.error('Failed to load doc detail:', err);
      setAuthError(err.message || 'Failed to read document content');
    } finally {
      setIsLoadingDoc(false);
    }
  };

  const handleImportSingleToTrace = async () => {
    if (!selectedDoc || !selectedDocContent) return;
    setIsImportingSingle(true);
    setSingleImportSuccess(false);
    setAuthError(null);

    try {
      const summaryText = selectedDocContent.extractedText.slice(0, 300) + '...';
      const docOwner =
        selectedDoc.owners?.[0]?.displayName ||
        selectedDoc.owners?.[0]?.emailAddress ||
        user?.displayName ||
        'Google Docs';

      onSyncStatusUpdate?.('Updating Trace memory…');

      await onImportDocAsContext({
        type: 'doc',
        title: selectedDoc.name,
        date: selectedDoc.modifiedTime
          ? new Date(selectedDoc.modifiedTime).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : new Date().toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
        authorOrHost: docOwner,
        summary: summaryText,
        details: selectedDocContent.extractedText,
        url: selectedDoc.webViewLink || `https://docs.google.com/document/d/${selectedDoc.id}/edit`,
        metadata: {
          googleDocId: selectedDoc.id,
          headingsCount: String(selectedDocContent.headings.length),
        },
      });

      onSyncStatusUpdate?.(null);
      setSingleImportSuccess(true);
      setTimeout(() => {
        setSingleImportSuccess(false);
      }, 4000);
    } catch (err: any) {
      console.error('Failed to import document into Trace:', err);
      setAuthError(err.message || 'Failed to sync Google Doc into Trace');
      onSyncStatusUpdate?.(null);
    } finally {
      setIsImportingSingle(false);
    }
  };

  // Export decision to ADR
  const handleConfirmExport = async () => {
    if (!exportDecision) return;
    const token = await getAccessToken();
    if (!token) {
      setAuthError('Please sign in with Google to create a Google Doc.');
      return;
    }

    setIsExporting(true);
    setAuthError(null);

    try {
      const docTitle = `[ADR] ${exportDecision.title}`;
      const docBody = `ARCHITECTURE DECISION RECORD (ADR)
=====================================
Title: ${exportDecision.title}
Category: ${exportDecision.category}
Status: ${exportDecision.status}
Author: ${exportDecision.author}
Date: ${exportDecision.date}
Tags: ${exportDecision.tags.join(', ')}

DECISION SUMMARY
----------------
${exportDecision.summary}

WHY THIS DECISION WAS MADE (RATIONALE)
--------------------------------------
${exportDecision.why}

TIMELINE & EVIDENCE
-------------------
${exportDecision.timeline.map((t) => `• [${t.date}] (${t.type.toUpperCase()}) ${t.title}: ${t.description}`).join('\n')}

Synthesized by Trace Context Engine
`;

      const result = await createGoogleDoc(docTitle, docBody, token);
      setExportedDocUrl(result.url);
      if (onExportComplete) onExportComplete(result.url);
      setShowExportConfirmation(false);
    } catch (err: any) {
      console.error('Failed to export decision to Google Doc:', err);
      setAuthError(err.message || 'Failed to export document');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0D1116] rounded-[8px] max-w-4xl w-full p-6 border border-[#21262d] space-y-5 max-h-[90vh] flex flex-col justify-between">
        
        {/* Top Header */}
        <div className="flex items-start justify-between border-b border-[#21262d] pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-[8px] bg-[#020408] border border-[#21262d] flex items-center justify-center text-blue-400">
              <FolderSync className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-[20px] font-bold text-[#F9FEFF]">
                  {exportDecision ? 'Export Decision to Google Docs' : 'Google Drive & Docs Sync'}
                </h2>
                <span className="px-2 py-0.5 text-[12px] font-semibold bg-[#020408] text-blue-400 border border-[#21262d] rounded-[8px]">
                  Google Workspace
                </span>
              </div>
              <p className="text-[12px] text-zinc-400 mt-0.5">
                {exportDecision
                  ? 'Generate an Architecture Decision Record (ADR) document directly in your Google Drive.'
                  : 'Select an entire folder or individual docs to sync engineering context into Trace.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-[8px] hover:bg-[#020408] text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Notification */}
        {authError && (
          <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-[8px] flex items-start space-x-2 text-[13px] text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{authError}</span>
          </div>
        )}

        {/* Not Logged In State */}
        {!user ? (
          <div className="p-8 bg-[#020408] rounded-[8px] border border-[#21262d] text-center space-y-4 my-4">
            <div className="max-w-md mx-auto space-y-2">
              <Sparkles className="w-6 h-6 text-zinc-400 mx-auto" />
              <h3 className="text-[16px] font-bold text-[#F9FEFF]">
                Connect your Google Workspace
              </h3>
              <p className="text-[13px] text-zinc-400">
                Grant Trace permission to access your Google Drive folders and Docs to sync engineering context automatically.
              </p>
            </div>

            <div className="flex justify-center pt-2">
              <button
                onClick={handleSignIn}
                disabled={isLoadingFolders}
                className="flex items-center space-x-3 bg-white hover:bg-zinc-100 text-zinc-800 font-semibold px-5 py-2.5 rounded-[8px] border border-zinc-300 shadow-sm transition cursor-pointer text-[14px]"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
                <span>{isLoadingFolders ? 'Connecting...' : 'Sign in with Google'}</span>
              </button>
            </div>
          </div>
        ) : exportDecision && showExportConfirmation ? (
          /* Export Confirmation Dialog */
          <div className="p-6 bg-[#020408] rounded-[8px] border border-[#21262d] space-y-4">
            <div className="space-y-2">
              <span className="text-[12px] font-bold text-blue-400 uppercase tracking-wider">Confirm Document Creation</span>
              <h3 className="text-[18px] font-bold text-[#F9FEFF]">
                Create new Google Doc: "[ADR] {exportDecision.title}"?
              </h3>
              <p className="text-[13px] text-zinc-400 leading-relaxed">
                This will create a structured Architecture Decision Record document in your Google Drive with the full decision summary, rationale, and context timeline.
              </p>
            </div>

            <div className="p-3 bg-[#0D1116] rounded-[8px] border border-[#21262d] text-[12px] text-zinc-300 space-y-1">
              <div><strong className="text-zinc-400">Target File:</strong> [ADR] {exportDecision.title}</div>
              <div><strong className="text-zinc-400">Author:</strong> {user.displayName || user.email}</div>
              <div><strong className="text-zinc-400">Destination:</strong> Google Drive (Root folder)</div>
            </div>

            <div className="pt-2 flex justify-end space-x-3">
              <button
                onClick={() => setShowExportConfirmation(false)}
                className="px-4 py-2 rounded-[8px] text-[12px] font-bold text-zinc-400 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmExport}
                disabled={isExporting}
                className="flex items-center space-x-2 px-5 py-2 rounded-[8px] text-[12px] font-bold bg-[#F9FEFF] text-black hover:bg-zinc-200 transition cursor-pointer"
              >
                {isExporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                <span>{isExporting ? 'Creating Google Doc...' : 'Create & Export to Docs'}</span>
              </button>
            </div>
          </div>
        ) : exportedDocUrl ? (
          /* Export Complete Screen */
          <div className="p-6 bg-[#020408] rounded-[8px] border border-[#21262d] text-center space-y-4">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
            <div>
              <h3 className="text-[18px] font-bold text-[#F9FEFF]">Google Doc Created Successfully!</h3>
              <p className="text-[13px] text-zinc-400 mt-1">Your Architecture Decision Record has been saved to Google Drive.</p>
            </div>
            <div className="pt-2 flex justify-center space-x-3">
              <a
                href={exportedDocUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-[8px] bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-bold transition"
              >
                <span>Open in Google Docs</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-[8px] bg-[#0D1116] border border-[#21262d] text-zinc-300 hover:text-white text-[13px] font-semibold transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Main Import Interface with Mode Toggle */
          <div className="space-y-4 flex-1 flex flex-col min-h-0">
            {/* Mode Switcher Tabs */}
            <div className="flex items-center justify-between border-b border-[#21262d] pb-2">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('folder')}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-[8px] text-[13px] font-semibold transition cursor-pointer ${
                    viewMode === 'folder'
                      ? 'bg-[#F9FEFF] text-black shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-[#020408]'
                  }`}
                >
                  <Folder className="w-4 h-4 text-amber-400" />
                  <span>Sync Entire Folder</span>
                </button>

                <button
                  onClick={() => setViewMode('file')}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-[8px] text-[13px] font-semibold transition cursor-pointer ${
                    viewMode === 'file'
                      ? 'bg-[#F9FEFF] text-black shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-[#020408]'
                  }`}
                >
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>Individual Docs</span>
                </button>
              </div>

              <span className="text-[11px] text-zinc-500 font-mono hidden sm:inline-block">
                Drive API v3 & Docs v1
              </span>
            </div>

            {/* FOLDER SYNC MODE */}
            {viewMode === 'folder' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
                {/* Left: Folder Picker */}
                <div className="flex flex-col space-y-3 min-h-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-zinc-400 uppercase tracking-wider">
                      Select Drive Folder
                    </span>
                    <button
                      onClick={loadFoldersList}
                      disabled={isLoadingFolders}
                      className="flex items-center space-x-1 text-[12px] text-zinc-400 hover:text-white transition cursor-pointer"
                      title="Refresh folders list"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingFolders ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {/* Search Folders */}
                  <div className="relative">
                    <input
                      type="text"
                      value={folderSearchQuery}
                      onChange={(e) => setFolderSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && loadFoldersList()}
                      placeholder="Search Google Drive folders..."
                      className="w-full bg-[#020408] text-[#F9FEFF] placeholder-zinc-500 pl-9 pr-3 py-2 rounded-[8px] border border-[#21262d] text-[13px] outline-none focus:border-zinc-500"
                    />
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>

                  {/* Folder List */}
                  <div className="flex-1 overflow-y-auto space-y-2 max-h-72 pr-1">
                    {isLoadingFolders ? (
                      <div className="p-6 text-center text-[12px] text-zinc-500">Loading Drive folders...</div>
                    ) : folders.length === 0 ? (
                      <div className="p-6 text-center text-[12px] text-zinc-500 border border-dashed border-[#21262d] rounded-[8px]">
                        No Google Drive folders found.
                      </div>
                    ) : (
                      folders.map((folder) => (
                        <div
                          key={folder.id}
                          onClick={() => handleSelectFolder(folder)}
                          className={`p-3 rounded-[8px] border transition cursor-pointer flex items-center justify-between ${
                            selectedFolder?.id === folder.id
                              ? 'bg-[#161b22] border-amber-500'
                              : 'bg-[#020408] border-[#21262d] hover:border-zinc-600'
                          }`}
                        >
                          <div className="flex items-center space-x-3 min-w-0 pr-2">
                            {selectedFolder?.id === folder.id ? (
                              <FolderOpen className="w-5 h-5 text-amber-400 shrink-0" />
                            ) : (
                              <Folder className="w-5 h-5 text-amber-400/80 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <div className="text-[13px] font-semibold text-zinc-200 truncate">{folder.name}</div>
                              <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                                {folder.modifiedTime ? new Date(folder.modifiedTime).toLocaleDateString() : 'Drive Folder'}
                              </div>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-zinc-500 shrink-0" />
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Right: Folder Inspection & Batch Sync */}
                <div className="bg-[#020408] rounded-[8px] p-4 border border-[#21262d] flex flex-col justify-between space-y-3 min-h-0">
                  {selectedFolder ? (
                    <>
                      <div className="space-y-3 min-h-0 flex-1 flex flex-col">
                        {/* Folder Header */}
                        <div className="flex items-center justify-between border-b border-[#21262d] pb-2">
                          <div className="min-w-0 pr-2">
                            <span className="text-[11px] text-zinc-500 font-mono uppercase">Folder Contents</span>
                            <h4 className="text-[14px] font-bold text-[#F9FEFF] truncate flex items-center space-x-1.5">
                              <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
                              <span>{selectedFolder.name}</span>
                            </h4>
                          </div>

                          {folderDocs.length > 0 && (
                            <button
                              onClick={toggleSelectAllDocs}
                              className="text-[11px] font-semibold text-zinc-400 hover:text-white transition cursor-pointer"
                            >
                              {selectedDocIds.size === folderDocs.length ? 'Deselect All' : 'Select All'}
                            </button>
                          )}
                        </div>

                        {/* Loading / Docs list inside Folder */}
                        {isLoadingFolderDocs ? (
                          <div className="flex-1 flex items-center justify-center text-[12px] text-zinc-500">
                            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                            Scanning folder for Google Docs...
                          </div>
                        ) : folderDocs.length === 0 ? (
                          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-500 space-y-2">
                            <FileText className="w-8 h-8 text-zinc-600" />
                            <p className="text-[13px]">No Google Docs found directly in this folder.</p>
                          </div>
                        ) : (
                          <div className="flex-1 overflow-y-auto space-y-2 max-h-56 pr-1">
                            {folderDocs.map((doc) => {
                              const isChecked = selectedDocIds.has(doc.id);
                              return (
                                <div
                                  key={doc.id}
                                  onClick={() => toggleSelectDocId(doc.id)}
                                  className={`p-2.5 rounded-[8px] border transition cursor-pointer flex items-center justify-between ${
                                    isChecked
                                      ? 'bg-[#0D1116] border-zinc-500'
                                      : 'bg-[#020408] border-[#21262d] opacity-60'
                                  }`}
                                >
                                  <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                                    {isChecked ? (
                                      <CheckSquare className="w-4 h-4 text-blue-400 shrink-0" />
                                    ) : (
                                      <Square className="w-4 h-4 text-zinc-500 shrink-0" />
                                    )}
                                    <div className="min-w-0">
                                      <div className="text-[12px] font-semibold text-zinc-200 truncate">{doc.name}</div>
                                      <div className="text-[10px] text-zinc-500 font-mono">
                                        {doc.modifiedTime ? new Date(doc.modifiedTime).toLocaleDateString() : 'Doc'}
                                      </div>
                                    </div>
                                  </div>
                                  <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Sync Footer Action & Live Progress */}
                      <div className="pt-3 border-t border-[#21262d] space-y-2">
                        {isBatchSyncing && (
                          <div className="p-2.5 bg-[#0D1116] rounded-[8px] border border-blue-900/50 text-[12px] text-blue-300 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">
                                {syncProgress.statusText || `Syncing doc ${syncProgress.current} of ${syncProgress.total}...`}
                              </span>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                            </div>
                            {syncProgress.currentTitle && (
                              <p className="text-[11px] text-zinc-400 truncate font-mono">
                                Extracting: {syncProgress.currentTitle}
                              </p>
                            )}
                          </div>
                        )}

                        {syncSuccessMessage && !isBatchSyncing && (
                          <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/50 rounded-[8px] flex items-center space-x-2 text-[12px] text-emerald-300">
                            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="font-medium">{syncSuccessMessage}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-zinc-500">
                            {selectedDocIds.size} of {folderDocs.length} docs selected
                          </span>

                          <button
                            onClick={handleSyncEntireFolder}
                            disabled={isBatchSyncing || selectedDocIds.size === 0 || folderDocs.length === 0}
                            className="flex items-center space-x-1.5 px-4 py-2 rounded-[8px] bg-[#F9FEFF] hover:bg-zinc-200 text-black text-[12px] font-bold transition cursor-pointer disabled:opacity-50"
                          >
                            <FolderSync className="w-4 h-4" />
                            <span>
                              {isBatchSyncing
                                ? 'Syncing Folder…'
                                : `Sync Folder (${selectedDocIds.size} Docs)`}
                            </span>
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-500 space-y-2">
                      <Folder className="w-10 h-10 text-zinc-600" />
                      <p className="text-[13px]">
                        Select a folder on the left to sync all of its Google Docs directly into Trace in one batch.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* INDIVIDUAL DOCS MODE */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
                {/* Left: Document List */}
                <div className="flex flex-col space-y-3 min-h-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-zinc-400 uppercase tracking-wider">Your Google Docs</span>
                    <button
                      onClick={loadIndividualDocsList}
                      disabled={isLoadingIndividualDocs}
                      className="flex items-center space-x-1 text-[12px] text-zinc-400 hover:text-white transition cursor-pointer"
                      title="Refresh document list"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingIndividualDocs ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={docSearchQuery}
                      onChange={(e) => setDocSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && loadIndividualDocsList()}
                      placeholder="Search docs in Drive..."
                      className="w-full bg-[#020408] text-[#F9FEFF] placeholder-zinc-500 pl-9 pr-3 py-2 rounded-[8px] border border-[#21262d] text-[13px] outline-none focus:border-zinc-500"
                    />
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 max-h-64 pr-1">
                    {isLoadingIndividualDocs ? (
                      <div className="p-6 text-center text-[12px] text-zinc-500">Loading Google Docs...</div>
                    ) : individualDocs.length === 0 ? (
                      <div className="p-6 text-center text-[12px] text-zinc-500 border border-dashed border-[#21262d] rounded-[8px]">
                        No Google Docs found matching query.
                      </div>
                    ) : (
                      individualDocs.map((doc) => (
                        <div
                          key={doc.id}
                          onClick={() => handleSelectSingleDoc(doc)}
                          className={`p-3 rounded-[8px] border transition cursor-pointer flex items-center justify-between ${
                            selectedDoc?.id === doc.id
                              ? 'bg-[#161b22] border-blue-500'
                              : 'bg-[#020408] border-[#21262d] hover:border-zinc-600'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="text-[13px] font-semibold text-zinc-200 truncate">{doc.name}</div>
                            <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                              {doc.modifiedTime ? new Date(doc.modifiedTime).toLocaleDateString() : 'Recent'}
                            </div>
                          </div>
                          <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Right: Selected Document Preview & Import */}
                <div className="bg-[#020408] rounded-[8px] p-4 border border-[#21262d] flex flex-col justify-between space-y-3 min-h-0">
                  {selectedDoc ? (
                    <>
                      <div className="space-y-2 min-h-0 flex-1 flex flex-col">
                        <div className="flex items-center justify-between border-b border-[#21262d] pb-2">
                          <div className="min-w-0 pr-2">
                            <span className="text-[11px] text-zinc-500 font-mono uppercase">Document Preview</span>
                            <h4 className="text-[14px] font-bold text-[#F9FEFF] truncate">{selectedDoc.name}</h4>
                          </div>
                          {selectedDoc.webViewLink && (
                            <a
                              href={selectedDoc.webViewLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-400 hover:text-blue-300 p-1"
                              title="Open original doc in new tab"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>

                        {isLoadingDoc ? (
                          <div className="flex-1 flex items-center justify-center text-[12px] text-zinc-500">
                            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                            Extracting content from Google Docs...
                          </div>
                        ) : selectedDocContent ? (
                          <div className="flex-1 overflow-y-auto text-[12px] text-zinc-300 font-mono p-2 bg-[#0D1116] rounded-[6px] border border-[#21262d] max-h-48 whitespace-pre-line leading-relaxed">
                            {selectedDocContent.extractedText}
                          </div>
                        ) : (
                          <div className="text-[12px] text-zinc-500">Select a document to inspect its content</div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-[#21262d] flex items-center justify-between">
                        {singleImportSuccess ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-400 text-[12px] font-semibold">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Synced into Trace!</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-zinc-500">Adds to Trace context memory</span>
                        )}

                        <button
                          onClick={handleImportSingleToTrace}
                          disabled={isImportingSingle || !selectedDocContent}
                          className="flex items-center space-x-1.5 px-4 py-2 rounded-[8px] bg-[#F9FEFF] hover:bg-zinc-200 text-black text-[12px] font-bold transition cursor-pointer disabled:opacity-50"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{isImportingSingle ? 'Syncing...' : 'Sync to Trace'}</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-500 space-y-2">
                      <FileText className="w-8 h-8 text-zinc-600" />
                      <p className="text-[13px]">Select a Google Doc from the list to preview extracted text.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-[#21262d] flex items-center justify-between text-[12px] text-zinc-500">
          <div className="flex items-center space-x-2">
            {user ? (
              <span className="text-zinc-400 font-medium">
                Signed in as <strong className="text-zinc-200">{user.displayName || user.email}</strong>
              </span>
            ) : (
              <span>Google Docs & Drive API Connected</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-[8px] bg-[#020408] hover:bg-[#161b22] text-zinc-300 border border-[#21262d] font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
