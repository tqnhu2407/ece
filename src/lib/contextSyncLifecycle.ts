import { ContextSource } from '../types';

export interface SyncLifecycleOptions {
  sourceType?: 'calendar' | 'doc' | 'github' | 'incident' | 'general';
  onStatusUpdate?: (status: string | null) => void;
  onSetSyncingState?: (isSyncing: boolean) => void;
  onSetNotice?: (notice: string | null) => void;
  onUpdateContextStore?: (sources: ContextSource[]) => void;
}

export interface IngestBatchResult {
  count: number;
  totalSources: number;
  sources: ContextSource[];
  isVerified: boolean;
}

export interface IngestSingleResult {
  success: boolean;
  source: ContextSource;
  totalSources: number;
  isVerified: boolean;
}

/**
 * Shared Context Ingestion & Verification Lifecycle Engine
 * Handles full end-to-end sync, backend persistence, client-side store refresh,
 * and pre-query verification for both Google Calendar events and Google Docs.
 */
export async function executeSingleContextIngestion(
  sourceData: Omit<ContextSource, 'id'>,
  options?: SyncLifecycleOptions
): Promise<IngestSingleResult> {
  const {
    sourceType = sourceData.type || 'general',
    onStatusUpdate,
    onSetSyncingState,
    onSetNotice,
    onUpdateContextStore,
  } = options || {};

  onSetSyncingState?.(true);
  const typeLabel = sourceType === 'calendar' ? 'Calendar event' : 'document';
  onStatusUpdate?.(`Updating Trace memory with ${typeLabel}…`);

  try {
    // Step 1: Server-side persistence
    const res = await fetch('/api/context/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sourceData),
    });

    if (!res.ok) {
      throw new Error(`Persistence failed for ${typeLabel}: ${res.statusText}`);
    }

    const payload = await res.json();
    const persistedSource: ContextSource = payload.source;

    // Step 2: Refresh exact context store used by Ask Why
    onStatusUpdate?.('Verifying context memory…');
    const refreshRes = await fetch('/api/context-sources');
    if (!refreshRes.ok) {
      throw new Error('Failed to refresh context sources from server');
    }
    const allRefreshed: ContextSource[] = await refreshRes.json();

    // Step 3: Verification gate - ensure the item exists in the refreshed queryable context
    const eventId = sourceData.metadata?.googleCalendarEventId;
    const docId = sourceData.metadata?.googleDocId;
    const isVerified = allRefreshed.some(
      (s) =>
        s.id === persistedSource?.id ||
        (eventId && s.metadata?.googleCalendarEventId === eventId) ||
        (docId && s.metadata?.googleDocId === docId) ||
        s.title === sourceData.title
    );

    if (!isVerified) {
      console.warn('Newly ingested source was not immediately verified in context store.');
    }

    // Step 4: Update React state with refreshed context store
    onUpdateContextStore?.(allRefreshed);

    const notice =
      sourceType === 'calendar'
        ? '1 calendar event synced and ready for Trace.'
        : '1 document synced and ready for Trace.';

    onSetNotice?.(notice);

    return {
      success: true,
      source: persistedSource || allRefreshed[0],
      totalSources: allRefreshed.length,
      isVerified,
    };
  } finally {
    onSetSyncingState?.(false);
    onStatusUpdate?.(null);
  }
}

export async function executeBatchContextIngestion(
  sourcesData: Array<Omit<ContextSource, 'id'>>,
  options?: SyncLifecycleOptions
): Promise<IngestBatchResult> {
  const {
    sourceType = sourcesData[0]?.type || 'general',
    onStatusUpdate,
    onSetSyncingState,
    onSetNotice,
    onUpdateContextStore,
  } = options || {};

  if (!sourcesData || sourcesData.length === 0) {
    return { count: 0, totalSources: 0, sources: [], isVerified: true };
  }

  onSetSyncingState?.(true);
  const typePlural = sourceType === 'calendar' ? 'calendar events' : 'documents';
  const typeSingle = sourceType === 'calendar' ? 'calendar event' : 'document';
  onStatusUpdate?.(`Updating Trace memory with ${sourcesData.length} ${typePlural}…`);

  try {
    // Step 1: Server-side batch persistence
    const res = await fetch('/api/context/batch-add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sources: sourcesData }),
    });

    if (!res.ok) {
      throw new Error(`Batch persistence failed for ${typePlural}: ${res.statusText}`);
    }

    const payload = await res.json();
    const persistedSources: ContextSource[] = payload.sources || [];

    // Step 2: Refresh exact context store used by Ask Why
    onStatusUpdate?.('Verifying context memory…');
    const refreshRes = await fetch('/api/context-sources');
    if (!refreshRes.ok) {
      throw new Error('Failed to refresh context sources from server');
    }
    const allRefreshed: ContextSource[] = await refreshRes.json();

    // Step 3: Verification gate - confirm all newly synced items exist in refreshed context
    const allVerified = sourcesData.every((src) => {
      const eventId = src.metadata?.googleCalendarEventId;
      const docId = src.metadata?.googleDocId;
      return allRefreshed.some(
        (s) =>
          (eventId && s.metadata?.googleCalendarEventId === eventId) ||
          (docId && s.metadata?.googleDocId === docId) ||
          s.title === src.title
      );
    });

    // Step 4: Update React state with refreshed context store
    onUpdateContextStore?.(allRefreshed);

    const count = payload.count || sourcesData.length;
    const notice =
      count === 1
        ? `1 ${typeSingle} synced and ready for Trace.`
        : `${count} ${typePlural} synced and ready to query.`;

    onSetNotice?.(notice);

    return {
      count,
      totalSources: allRefreshed.length,
      sources: persistedSources,
      isVerified: allVerified,
    };
  } finally {
    onSetSyncingState?.(false);
    onStatusUpdate?.(null);
  }
}
