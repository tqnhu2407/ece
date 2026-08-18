import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  Calendar as CalendarIcon, 
  X, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  Clock, 
  Users, 
  MapPin, 
  Video, 
  Plus, 
  Search, 
  Trash2, 
  CheckSquare, 
  Square, 
  FolderSync,
  Sparkles,
  CalendarCheck,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { 
  listGoogleCalendars, 
  listGoogleCalendarEvents, 
  createGoogleCalendarEvent, 
  deleteGoogleCalendarEvent,
  GoogleCalendar, 
  GoogleCalendarEvent 
} from '../lib/googleCalendarApi';
import { googleSignIn, getAccessToken, logout } from '../lib/firebaseAuth';
import { ContextSource, DecisionItem } from '../types';

interface GoogleCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUserAuthChange: (user: User | null) => void;
  onImportEventAsContext: (eventSource: Omit<ContextSource, 'id'>) => Promise<any>;
  onImportBatchEventsAsContext?: (eventSources: Array<Omit<ContextSource, 'id'>>) => Promise<{ count: number; totalSources: number; isVerified?: boolean }>;
  onSyncStatusUpdate?: (status: string | null) => void;
  scheduleForDecision?: DecisionItem | null;
}

export const GoogleCalendarModal: React.FC<GoogleCalendarModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserAuthChange,
  onImportEventAsContext,
  onImportBatchEventsAsContext,
  onSyncStatusUpdate,
  scheduleForDecision,
}) => {
  const [activeTab, setActiveTab] = useState<'events' | 'schedule'>('events');

  // Calendar & Event data state
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('primary');
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isLoadingCalendars, setIsLoadingCalendars] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');

  // Selection & Batch Sync
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  const [isBatchSyncing, setIsBatchSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{
    current: number;
    total: number;
    currentTitle: string;
    stage: 'extracting' | 'persisting' | 'ready';
    statusText: string;
  }>({
    current: 0,
    total: 0,
    currentTitle: '',
    stage: 'extracting',
    statusText: '',
  });
  const [batchSyncSuccessMsg, setBatchSyncSuccessMsg] = useState<string | null>(null);

  // Single event detail & sync
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [syncingSingleId, setSyncingSingleId] = useState<string | null>(null);
  const [singleSyncSuccessId, setSingleSyncSuccessId] = useState<string | null>(null);

  // Delete event confirmation state (Destructive operation requirement)
  const [eventToDelete, setEventToDelete] = useState<GoogleCalendarEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Schedule Event Form State
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleDescription, setScheduleDescription] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('10:00');
  const [scheduleDuration, setScheduleDuration] = useState('30'); // minutes
  const [scheduleAttendees, setScheduleAttendees] = useState('');
  const [scheduleLocation, setScheduleLocation] = useState('');
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [createdEvent, setCreatedEvent] = useState<GoogleCalendarEvent | null>(null);
  const [showCreateConfirmation, setShowCreateConfirmation] = useState(false);

  // Auth / general error state
  const [authError, setAuthError] = useState<string | null>(null);

  // Reset or initialize when modal opens or decision changes
  useEffect(() => {
    if (isOpen) {
      setAuthError(null);
      setBatchSyncSuccessMsg(null);
      setCreatedEvent(null);
      setShowCreateConfirmation(false);

      if (scheduleForDecision) {
        setActiveTab('schedule');
        setScheduleTitle(`Decision Review: ${scheduleForDecision.title}`);
        setScheduleDescription(
          `Review & alignment session regarding the architecture decision: "${scheduleForDecision.title}"\n\nSummary:\n${scheduleForDecision.summary}\n\nRationale:\n${scheduleForDecision.why}\n\nStatus: ${scheduleForDecision.status}`
        );
        // Default to tomorrow 10:00 AM
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setScheduleDate(tomorrow.toISOString().split('T')[0]);
      } else {
        const today = new Date();
        setScheduleDate(today.toISOString().split('T')[0]);
      }

      loadCalendars();
    }
  }, [isOpen, scheduleForDecision]);

  // Load events whenever calendar or time filter changes
  useEffect(() => {
    if (isOpen && selectedCalendarId) {
      loadEvents();
    }
  }, [isOpen, selectedCalendarId, timeFilter]);

  const loadCalendars = async () => {
    const token = await getAccessToken();
    if (!token) return;

    setIsLoadingCalendars(true);
    setAuthError(null);
    try {
      const list = await listGoogleCalendars(token);
      setCalendars(list);
      if (list.length > 0 && !list.some(c => c.id === selectedCalendarId)) {
        const primary = list.find(c => c.primary) || list[0];
        setSelectedCalendarId(primary.id);
      }
    } catch (err: any) {
      console.error('Failed to load Google Calendars:', err);
      setAuthError(err.message || 'Could not load Google Calendars');
    } finally {
      setIsLoadingCalendars(false);
    }
  };

  const loadEvents = async () => {
    const token = await getAccessToken();
    if (!token) return;

    setIsLoadingEvents(true);
    setAuthError(null);
    setSelectedEventIds(new Set());

    try {
      const now = new Date();
      let timeMin: string | undefined;
      let timeMax: string | undefined;

      if (timeFilter === 'upcoming') {
        timeMin = now.toISOString();
        const future = new Date();
        future.setDate(future.getDate() + 30);
        timeMax = future.toISOString();
      } else if (timeFilter === 'past') {
        const past = new Date();
        past.setDate(past.getDate() - 30);
        timeMin = past.toISOString();
        timeMax = now.toISOString();
      } else {
        const past = new Date();
        past.setDate(past.getDate() - 30);
        timeMin = past.toISOString();
      }

      const list = await listGoogleCalendarEvents(token, selectedCalendarId, {
        timeMin,
        timeMax,
        query: searchQuery,
        maxResults: 50,
      });

      setEvents(list);
    } catch (err: any) {
      console.error('Failed to load Calendar events:', err);
      setAuthError(err.message || 'Could not load calendar events');
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const handleSignIn = async () => {
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        onUserAuthChange(res.user);
        setIsLoadingCalendars(true);
        const calList = await listGoogleCalendars(res.accessToken);
        setCalendars(calList);
        const evList = await listGoogleCalendarEvents(res.accessToken, 'primary');
        setEvents(evList);
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
      setIsLoadingCalendars(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onUserAuthChange(null);
    setCalendars([]);
    setEvents([]);
  };

  // Convert a Google Calendar event into a Trace ContextSource object
  const formatEventAsContext = (event: GoogleCalendarEvent): Omit<ContextSource, 'id'> => {
    const startDateStr = event.start.dateTime || event.start.date;
    const formattedDate = startDateStr
      ? new Date(startDateStr).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: event.start.dateTime ? 'numeric' : undefined,
          minute: event.start.dateTime ? '2-digit' : undefined,
        })
      : new Date().toLocaleDateString('en-US');

    const organizer =
      event.organizer?.displayName ||
      event.organizer?.email ||
      event.creator?.displayName ||
      'Calendar Organizer';

    const attendeesList = (event.attendees || [])
      .map((a) => a.displayName || a.email)
      .join(', ');

    const description = event.description || 'No description provided.';
    const location = event.location ? `Location: ${event.location}` : '';
    const meetLink = event.hangoutLink ? `Meeting Link: ${event.hangoutLink}` : '';

    const summary = `${event.summary} (${formattedDate}). Hosted by ${organizer}.${
      attendeesList ? ` Attendees: ${attendeesList}.` : ''
    } ${description.slice(0, 200)}`;

    const details = `Event: ${event.summary}\nDate & Time: ${formattedDate}\nOrganizer: ${organizer}\nAttendees: ${
      attendeesList || 'None specified'
    }\n${location}\n${meetLink}\n\nAgenda / Description:\n${description}`;

    return {
      type: 'calendar',
      title: event.summary || 'Untitled Meeting',
      date: formattedDate,
      authorOrHost: organizer,
      summary,
      details,
      url: event.htmlLink || 'https://calendar.google.com/calendar',
      metadata: {
        googleCalendarEventId: event.id,
        calendarId: selectedCalendarId,
        meetLink: event.hangoutLink || '',
        status: event.status || 'confirmed',
      },
    };
  };

  // Sync single event to Trace
  const handleSyncSingleEvent = async (event: GoogleCalendarEvent) => {
    setSyncingSingleId(event.id);
    setAuthError(null);
    onSyncStatusUpdate?.('Updating Trace memory…');

    try {
      const source = formatEventAsContext(event);
      await onImportEventAsContext(source);

      onSyncStatusUpdate?.(null);
      setSingleSyncSuccessId(event.id);
      setTimeout(() => {
        setSingleSyncSuccessId((prev) => (prev === event.id ? null : prev));
      }, 4000);
    } catch (err: any) {
      console.error('Failed to sync calendar event to Trace:', err);
      setAuthError(err.message || 'Failed to sync calendar event into Trace');
      onSyncStatusUpdate?.(null);
    } finally {
      setSyncingSingleId(null);
    }
  };

  // Batch sync selected events
  const handleBatchSyncEvents = async () => {
    const eventsToSync = events.filter((e) => selectedEventIds.has(e.id));
    if (eventsToSync.length === 0) return;

    setIsBatchSyncing(true);
    setBatchSyncSuccessMsg(null);
    setAuthError(null);

    try {
      const extractedSources: Array<Omit<ContextSource, 'id'>> = [];

      for (let i = 0; i < eventsToSync.length; i++) {
        const ev = eventsToSync[i];
        const statusText = `Syncing ${i + 1}/${eventsToSync.length} calendar events…`;
        setSyncProgress({
          current: i + 1,
          total: eventsToSync.length,
          currentTitle: ev.summary || 'Event',
          stage: 'extracting',
          statusText,
        });
        onSyncStatusUpdate?.(statusText);

        extractedSources.push(formatEventAsContext(ev));
      }

      setSyncProgress({
        current: extractedSources.length,
        total: eventsToSync.length,
        currentTitle: '',
        stage: 'persisting',
        statusText: 'Updating Trace memory…',
      });
      onSyncStatusUpdate?.('Updating Trace memory…');

      let syncedCount = extractedSources.length;
      if (onImportBatchEventsAsContext) {
        const result = await onImportBatchEventsAsContext(extractedSources);
        if (result && typeof result.count === 'number') {
          syncedCount = result.count;
        }
      } else {
        for (const src of extractedSources) {
          await onImportEventAsContext(src);
        }
      }

      const readyMsg =
        syncedCount === 1
          ? '1 calendar event synced and ready for Trace.'
          : `${syncedCount} calendar events synced and ready to query.`;

      setSyncProgress({
        current: syncedCount,
        total: eventsToSync.length,
        currentTitle: '',
        stage: 'ready',
        statusText: readyMsg,
      });
      onSyncStatusUpdate?.(null);
      setBatchSyncSuccessMsg(readyMsg);
      setSelectedEventIds(new Set());
    } catch (err: any) {
      console.error('Failed to batch sync calendar events:', err);
      setAuthError(err.message || 'Failed to sync calendar events');
      onSyncStatusUpdate?.(null);
    } finally {
      setIsBatchSyncing(false);
    }
  };

  // Toggle event selection
  const toggleSelectEvent = (id: string) => {
    setSelectedEventIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedEventIds.size === events.length) {
      setSelectedEventIds(new Set());
    } else {
      setSelectedEventIds(new Set(events.map((e) => e.id)));
    }
  };

  // Schedule Event Submit
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleTitle.trim() || !scheduleDate || !scheduleTime) return;
    setShowCreateConfirmation(true);
  };

  const confirmCreateEvent = async () => {
    setShowCreateConfirmation(false);
    setIsCreatingEvent(true);
    setAuthError(null);
    setCreatedEvent(null);

    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Authentication expired. Please sign in again.');

      const startDateTime = new Date(`${scheduleDate}T${scheduleTime}:00`);
      const durationMinutes = parseInt(scheduleDuration, 10) || 30;
      const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);

      const attendees = scheduleAttendees
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a.length > 0 && a.includes('@'));

      const newEvent = await createGoogleCalendarEvent(token, {
        calendarId: selectedCalendarId,
        summary: scheduleTitle,
        description: scheduleDescription,
        location: scheduleLocation,
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        attendees,
      });

      setCreatedEvent(newEvent);
      // Refresh event list
      loadEvents();
    } catch (err: any) {
      console.error('Failed to create calendar event:', err);
      setAuthError(err.message || 'Failed to create calendar event');
    } finally {
      setIsCreatingEvent(false);
    }
  };

  // Delete event with confirmation
  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    setIsDeleting(true);
    setAuthError(null);

    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Authentication expired. Please sign in again.');

      await deleteGoogleCalendarEvent(token, eventToDelete.id, selectedCalendarId);
      setEvents((prev) => prev.filter((e) => e.id !== eventToDelete.id));
      setSelectedEventIds((prev) => {
        const next = new Set(prev);
        next.delete(eventToDelete.id);
        return next;
      });
      setEventToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete calendar event:', err);
      setAuthError(err.message || 'Failed to delete calendar event');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  const filteredEvents = events.filter((ev) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchSummary = (ev.summary || '').toLowerCase().includes(q);
    const matchDesc = (ev.description || '').toLowerCase().includes(q);
    const matchAttendee = (ev.attendees || []).some(
      (a) => (a.displayName || '').toLowerCase().includes(q) || a.email.toLowerCase().includes(q)
    );
    return matchSummary || matchDesc || matchAttendee;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0D1116] border border-[#21262d] rounded-[12px] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#21262d] flex items-center justify-between bg-[#020408]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-[8px] bg-blue-950/40 border border-blue-800/50 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-[16px] sm:text-[18px] font-bold text-[#F9FEFF]">
                  Google Calendar
                </h2>
                <span className="px-2 py-0.5 rounded-[6px] text-[11px] font-semibold bg-blue-950/60 text-blue-300 border border-blue-800/40">
                  Google Workspace
                </span>
              </div>
              <p className="text-[12px] text-zinc-400">
                Sync meetings, architecture reviews, and schedule alignment sessions directly with Trace.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-[8px] text-zinc-400 hover:text-white hover:bg-[#161b22] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab & Account Bar */}
        <div className="px-5 py-3 border-b border-[#21262d] bg-[#090D13] flex items-center justify-between flex-wrap gap-3">
          {/* Tabs */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('events')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-[8px] text-[13px] font-semibold transition cursor-pointer ${
                activeTab === 'events'
                  ? 'bg-[#F9FEFF] text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-[#161b22]'
              }`}
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Calendar Events</span>
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-[8px] text-[13px] font-semibold transition cursor-pointer ${
                activeTab === 'schedule'
                  ? 'bg-[#F9FEFF] text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-[#161b22]'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Review</span>
              {scheduleForDecision && (
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
              )}
            </button>
          </div>

          {/* Account Status / Login */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-2">
                <span className="text-[12px] text-zinc-400 hidden sm:inline">
                  Connected as <span className="font-semibold text-zinc-200">{user.email || user.displayName}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="px-2.5 py-1 rounded-[6px] text-[11px] font-medium text-zinc-400 hover:text-red-400 hover:bg-red-950/20 border border-[#21262d] transition cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="flex items-center space-x-2 bg-white hover:bg-zinc-100 text-black px-3.5 py-1.5 rounded-[8px] text-[12px] font-bold shadow-sm transition cursor-pointer"
              >
                {/* Official Google Icon */}
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>Sign in with Google</span>
              </button>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {authError && (
          <div className="mx-5 mt-4 p-3 bg-red-950/40 border border-red-800/50 rounded-[8px] flex items-center space-x-2 text-[12px] text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {!user ? (
            <div className="py-12 text-center space-y-4 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-blue-950/30 border border-blue-800/50 mx-auto flex items-center justify-center">
                <CalendarIcon className="w-7 h-7 text-blue-400" />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-white">Connect Google Calendar</h3>
                <p className="text-[13px] text-zinc-400 mt-1">
                  Authenticate with your Google account to view scheduled meetings, import meeting transcripts as context, and schedule architecture reviews.
                </p>
              </div>
              <button
                onClick={handleSignIn}
                className="inline-flex items-center space-x-2 bg-[#F9FEFF] hover:bg-zinc-200 text-black px-6 py-2.5 rounded-[8px] text-[13px] font-bold shadow transition cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>Sign in with Google</span>
              </button>
            </div>
          ) : activeTab === 'events' ? (
            <div className="space-y-4">
              
              {/* Controls bar: Calendar Selector, Date filter, Search, Refresh */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Calendar Dropdown */}
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Calendar</label>
                  <select
                    value={selectedCalendarId}
                    onChange={(e) => setSelectedCalendarId(e.target.value)}
                    className="w-full bg-[#020408] border border-[#21262d] rounded-[8px] px-3 py-2 text-[12px] text-zinc-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {calendars.map((cal) => (
                      <option key={cal.id} value={cal.id}>
                        {cal.summary} {cal.primary ? '(Primary)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Window Filter */}
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Time Window</label>
                  <div className="flex bg-[#020408] border border-[#21262d] rounded-[8px] p-0.5">
                    <button
                      onClick={() => setTimeFilter('upcoming')}
                      className={`flex-1 py-1.5 text-[11px] font-semibold rounded-[6px] transition cursor-pointer ${
                        timeFilter === 'upcoming' ? 'bg-[#F9FEFF] text-black' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Upcoming
                    </button>
                    <button
                      onClick={() => setTimeFilter('past')}
                      className={`flex-1 py-1.5 text-[11px] font-semibold rounded-[6px] transition cursor-pointer ${
                        timeFilter === 'past' ? 'bg-[#F9FEFF] text-black' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Past 30d
                    </button>
                    <button
                      onClick={() => setTimeFilter('all')}
                      className={`flex-1 py-1.5 text-[11px] font-semibold rounded-[6px] transition cursor-pointer ${
                        timeFilter === 'all' ? 'bg-[#F9FEFF] text-black' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      All
                    </button>
                  </div>
                </div>

                {/* Search */}
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Search Events</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter by title or attendee..."
                      className="w-full bg-[#020408] border border-[#21262d] rounded-[8px] pl-8 pr-3 py-1.5 text-[12px] text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                    />
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
                  </div>
                </div>
              </div>

              {/* Batch sync banner / success message */}
              {isBatchSyncing && (
                <div className="p-3 bg-[#0D1116] rounded-[8px] border border-blue-900/50 text-[12px] text-blue-300 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{syncProgress.statusText}</span>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  </div>
                  {syncProgress.currentTitle && (
                    <p className="text-[11px] text-zinc-400 truncate font-mono">
                      Extracting: {syncProgress.currentTitle}
                    </p>
                  )}
                </div>
              )}

              {batchSyncSuccessMsg && !isBatchSyncing && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-[8px] flex items-center space-x-2 text-[12px] text-emerald-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-medium">{batchSyncSuccessMsg}</span>
                </div>
              )}

              {/* Events Action Header: Select All + Batch Sync button */}
              <div className="flex items-center justify-between py-2 border-b border-[#21262d]">
                <button
                  onClick={toggleSelectAll}
                  disabled={filteredEvents.length === 0}
                  className="flex items-center space-x-2 text-[12px] font-semibold text-zinc-300 hover:text-white cursor-pointer disabled:opacity-50"
                >
                  {selectedEventIds.size === filteredEvents.length && filteredEvents.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-blue-400" />
                  ) : (
                    <Square className="w-4 h-4 text-zinc-500" />
                  )}
                  <span>
                    Select All ({selectedEventIds.size} of {filteredEvents.length} selected)
                  </span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={loadEvents}
                    disabled={isLoadingEvents}
                    className="p-1.5 rounded-[8px] text-zinc-400 hover:text-white hover:bg-[#161b22] transition cursor-pointer"
                    title="Refresh calendar events"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingEvents ? 'animate-spin' : ''}`} />
                  </button>

                  <button
                    onClick={handleBatchSyncEvents}
                    disabled={isBatchSyncing || selectedEventIds.size === 0}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-[8px] bg-[#F9FEFF] hover:bg-zinc-200 text-black text-[12px] font-bold transition cursor-pointer disabled:opacity-50"
                  >
                    <FolderSync className="w-3.5 h-3.5" />
                    <span>
                      {isBatchSyncing ? 'Syncing…' : `Sync ${selectedEventIds.size} Events to Trace`}
                    </span>
                  </button>
                </div>
              </div>

              {/* Event Cards List */}
              {isLoadingEvents ? (
                <div className="py-12 text-center text-zinc-400 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-400 mx-auto" />
                  <p className="text-[12px]">Loading events from Google Calendar...</p>
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 space-y-2">
                  <CalendarIcon className="w-8 h-8 mx-auto text-zinc-600" />
                  <p className="text-[13px] font-medium text-zinc-400">No events found</p>
                  <p className="text-[12px]">Try selecting a different time window or calendar.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredEvents.map((ev) => {
                    const isSelected = selectedEventIds.has(ev.id);
                    const isExpanded = expandedEventId === ev.id;
                    const isSyncingThis = syncingSingleId === ev.id;
                    const isSuccessThis = singleSyncSuccessId === ev.id;

                    const startDateStr = ev.start.dateTime || ev.start.date;
                    const dateObj = startDateStr ? new Date(startDateStr) : null;
                    const timeFormatted = dateObj
                      ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '';
                    const dateFormatted = dateObj
                      ? dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                      : 'Date unset';

                    return (
                      <div
                        key={ev.id}
                        className={`rounded-[8px] border transition-all ${
                          isSelected
                            ? 'bg-blue-950/20 border-blue-800/60'
                            : 'bg-[#020408] border-[#21262d] hover:border-zinc-700'
                        }`}
                      >
                        {/* Summary Bar */}
                        <div className="p-3.5 flex items-center justify-between gap-3">
                          <div className="flex items-center space-x-3 min-w-0">
                            <button
                              onClick={() => toggleSelectEvent(ev.id)}
                              className="text-zinc-400 hover:text-white cursor-pointer shrink-0"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-blue-400" />
                              ) : (
                                <Square className="w-4 h-4 text-zinc-500" />
                              )}
                            </button>

                            <div className="min-w-0 cursor-pointer" onClick={() => setExpandedEventId(isExpanded ? null : ev.id)}>
                              <div className="flex items-center space-x-2 flex-wrap">
                                <span className="text-[13px] font-bold text-zinc-100 truncate">
                                  {ev.summary || 'Untitled Event'}
                                </span>
                                {ev.hangoutLink && (
                                  <span className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40 text-[10px] text-emerald-300 font-semibold">
                                    <Video className="w-3 h-3" />
                                    <span>Meet</span>
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-3 text-[11px] text-zinc-400 mt-0.5">
                                <span className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3 text-zinc-500" />
                                  <span>{dateFormatted} {timeFormatted && `• ${timeFormatted}`}</span>
                                </span>
                                {ev.attendees && ev.attendees.length > 0 && (
                                  <span className="flex items-center space-x-1">
                                    <Users className="w-3 h-3 text-zinc-500" />
                                    <span>{ev.attendees.length} attendees</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center space-x-2 shrink-0">
                            {ev.htmlLink && (
                              <a
                                href={ev.htmlLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-[6px] bg-[#0D1116] border border-[#21262d] text-zinc-400 hover:text-blue-400 transition"
                                title="Open in Google Calendar"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}

                            <button
                              onClick={() => handleSyncSingleEvent(ev)}
                              disabled={isSyncingThis}
                              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-[6px] text-[11px] font-semibold border transition cursor-pointer ${
                                isSuccessThis
                                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                                  : 'bg-[#0D1116] border-[#21262d] text-zinc-300 hover:bg-[#161b22]'
                              }`}
                            >
                              {isSuccessThis ? (
                                <>
                                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                                  <span>Synced</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className={`w-3 h-3 ${isSyncingThis ? 'animate-spin text-blue-400' : 'text-zinc-400'}`} />
                                  <span>{isSyncingThis ? 'Syncing…' : 'Sync to Trace'}</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => setEventToDelete(ev)}
                              className="p-1.5 rounded-[6px] bg-[#0D1116] border border-[#21262d] text-zinc-500 hover:text-red-400 hover:bg-red-950/20 transition cursor-pointer"
                              title="Delete event from Google Calendar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setExpandedEventId(isExpanded ? null : ev.id)}
                              className="p-1.5 text-zinc-400 hover:text-white cursor-pointer"
                            >
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-2 border-t border-[#21262d] bg-[#070A0F] text-[12px] space-y-2.5">
                            {ev.description && (
                              <div>
                                <span className="font-semibold text-zinc-400 text-[11px]">Agenda / Description:</span>
                                <p className="text-zinc-300 mt-0.5 whitespace-pre-wrap">{ev.description}</p>
                              </div>
                            )}

                            {ev.location && (
                              <div className="flex items-center space-x-1.5 text-zinc-400">
                                <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                                <span>{ev.location}</span>
                              </div>
                            )}

                            {ev.hangoutLink && (
                              <div className="flex items-center space-x-2">
                                <Video className="w-3.5 h-3.5 text-emerald-400" />
                                <a
                                  href={ev.hangoutLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-400 hover:underline font-mono text-[11px]"
                                >
                                  Join Google Meet
                                </a>
                              </div>
                            )}

                            {ev.attendees && ev.attendees.length > 0 && (
                              <div>
                                <span className="font-semibold text-zinc-400 text-[11px]">Attendees:</span>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  {ev.attendees.map((att, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-0.5 rounded-[6px] bg-[#0D1116] border border-[#21262d] text-[11px] text-zinc-300"
                                      title={att.responseStatus || 'invited'}
                                    >
                                      {att.displayName || att.email}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          ) : (
            /* Schedule Tab */
            <div className="max-w-2xl mx-auto space-y-4">
              
              {createdEvent ? (
                <div className="p-5 bg-emerald-950/30 border border-emerald-800/50 rounded-[10px] text-center space-y-3">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                  <div>
                    <h4 className="text-[15px] font-bold text-white">Event Created Successfully!</h4>
                    <p className="text-[12px] text-zinc-300 mt-1 font-medium">"{createdEvent.summary}"</p>
                  </div>
                  <div className="flex items-center justify-center space-x-3 pt-2">
                    {createdEvent.htmlLink && (
                      <a
                        href={createdEvent.htmlLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1.5 px-4 py-2 rounded-[8px] bg-blue-600 hover:bg-blue-500 text-white text-[12px] font-bold transition"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Open in Google Calendar</span>
                      </a>
                    )}
                    <button
                      onClick={() => handleSyncSingleEvent(createdEvent)}
                      className="flex items-center space-x-1.5 px-4 py-2 rounded-[8px] bg-[#020408] border border-[#21262d] text-zinc-200 hover:text-white text-[12px] font-bold transition cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-zinc-400" />
                      <span>Sync to Trace Context</span>
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleScheduleSubmit} className="space-y-4">
                  <div className="border-b border-[#21262d] pb-3">
                    <h3 className="text-[15px] font-bold text-white flex items-center space-x-2">
                      <Plus className="w-4 h-4 text-blue-400" />
                      <span>Schedule Decision Review Session</span>
                    </h3>
                    <p className="text-[12px] text-zinc-400 mt-0.5">
                      Create an architecture alignment meeting directly in Google Calendar with agenda notes.
                    </p>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-[12px] font-semibold text-zinc-300 mb-1">
                      Event Title <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={scheduleTitle}
                      onChange={(e) => setScheduleTitle(e.target.value)}
                      placeholder="e.g. Architecture Alignment: Redis Migration Review"
                      required
                      className="w-full bg-[#020408] border border-[#21262d] rounded-[8px] px-3.5 py-2 text-[13px] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Date & Time Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[12px] font-semibold text-zinc-300 mb-1">Date</label>
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        required
                        className="w-full bg-[#020408] border border-[#21262d] rounded-[8px] px-3 py-2 text-[12px] text-zinc-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[12px] font-semibold text-zinc-300 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        required
                        className="w-full bg-[#020408] border border-[#21262d] rounded-[8px] px-3 py-2 text-[12px] text-zinc-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[12px] font-semibold text-zinc-300 mb-1">Duration</label>
                      <select
                        value={scheduleDuration}
                        onChange={(e) => setScheduleDuration(e.target.value)}
                        className="w-full bg-[#020408] border border-[#21262d] rounded-[8px] px-3 py-2 text-[12px] text-zinc-200 focus:outline-none focus:border-blue-500"
                      >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="45">45 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="90">1.5 hours</option>
                      </select>
                    </div>
                  </div>

                  {/* Attendees */}
                  <div>
                    <label className="block text-[12px] font-semibold text-zinc-300 mb-1">
                      Attendees (Comma-separated emails)
                    </label>
                    <input
                      type="text"
                      value={scheduleAttendees}
                      onChange={(e) => setScheduleAttendees(e.target.value)}
                      placeholder="alex@team.internal, sarah@team.internal"
                      className="w-full bg-[#020408] border border-[#21262d] rounded-[8px] px-3.5 py-2 text-[12px] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-[12px] font-semibold text-zinc-300 mb-1">Location / Room</label>
                    <input
                      type="text"
                      value={scheduleLocation}
                      onChange={(e) => setScheduleLocation(e.target.value)}
                      placeholder="Google Meet / Architecture War Room"
                      className="w-full bg-[#020408] border border-[#21262d] rounded-[8px] px-3.5 py-2 text-[12px] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Description / Agenda */}
                  <div>
                    <label className="block text-[12px] font-semibold text-zinc-300 mb-1">
                      Agenda & Decision Context
                    </label>
                    <textarea
                      value={scheduleDescription}
                      onChange={(e) => setScheduleDescription(e.target.value)}
                      rows={5}
                      placeholder="Outline decision items, background incident context, and questions for discussion..."
                      className="w-full bg-[#020408] border border-[#21262d] rounded-[8px] p-3 text-[12px] text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500 font-mono leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#21262d]">
                    <button
                      type="button"
                      onClick={() => setActiveTab('events')}
                      className="px-4 py-2 rounded-[8px] border border-[#21262d] text-zinc-400 hover:text-white text-[12px] font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingEvent || !scheduleTitle.trim()}
                      className="flex items-center space-x-1.5 px-5 py-2 rounded-[8px] bg-[#F9FEFF] hover:bg-zinc-200 text-black text-[12px] font-bold transition cursor-pointer disabled:opacity-50"
                    >
                      <CalendarCheck className="w-4 h-4" />
                      <span>{isCreatingEvent ? 'Scheduling…' : 'Schedule on Google Calendar'}</span>
                    </button>
                  </div>
                </form>
              )}

            </div>
          )}

        </div>

      </div>

      {/* Confirmation Dialog for Creating Calendar Event */}
      {showCreateConfirmation && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85">
          <div className="bg-[#0D1116] border border-[#21262d] rounded-[10px] max-w-md w-full p-5 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-blue-950/60 border border-blue-800/40 flex items-center justify-center">
                <CalendarIcon className="w-4 h-4 text-blue-400" />
              </div>
              <h3 className="text-[15px] font-bold text-white">Create Google Calendar Event?</h3>
            </div>
            <p className="text-[12px] text-zinc-300 leading-relaxed">
              This will create the event <span className="font-semibold text-white">"{scheduleTitle}"</span> on your primary Google Calendar for <span className="font-semibold text-white">{scheduleDate} at {scheduleTime}</span>.
            </p>
            <div className="flex items-center justify-end space-x-2.5 pt-2">
              <button
                onClick={() => setShowCreateConfirmation(false)}
                className="px-3.5 py-1.5 rounded-[8px] border border-[#21262d] text-zinc-400 hover:text-white text-[12px] font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmCreateEvent}
                className="px-4 py-1.5 rounded-[8px] bg-[#F9FEFF] hover:bg-zinc-200 text-black text-[12px] font-bold cursor-pointer"
              >
                Confirm & Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Deleting Calendar Event (MANDATORY destructive confirmation) */}
      {eventToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85">
          <div className="bg-[#0D1116] border border-red-900/60 rounded-[10px] max-w-md w-full p-5 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-red-950/60 border border-red-800/40 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-red-400" />
              </div>
              <h3 className="text-[15px] font-bold text-white">Delete Calendar Event?</h3>
            </div>
            <p className="text-[12px] text-zinc-300 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-white">"{eventToDelete.summary || 'Untitled Event'}"</span> from your Google Calendar? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-2.5 pt-2">
              <button
                onClick={() => setEventToDelete(null)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-[8px] border border-[#21262d] text-zinc-400 hover:text-white text-[12px] font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteEvent}
                disabled={isDeleting}
                className="px-4 py-1.5 rounded-[8px] bg-red-600 hover:bg-red-500 text-white text-[12px] font-bold cursor-pointer"
              >
                {isDeleting ? 'Deleting…' : 'Delete Event'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
