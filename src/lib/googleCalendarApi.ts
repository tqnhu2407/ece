export interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  timeZone?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  accessRole?: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  htmlLink?: string;
  hangoutLink?: string;
  conferenceData?: {
    entryPoints?: Array<{
      entryPointType: string;
      uri: string;
      label?: string;
    }>;
  };
  creator?: {
    email?: string;
    displayName?: string;
  };
  organizer?: {
    email?: string;
    displayName?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
    organizer?: boolean;
    self?: boolean;
  }>;
  status?: string;
  created?: string;
  updated?: string;
}

export interface CreateEventParams {
  calendarId?: string;
  summary: string;
  description?: string;
  location?: string;
  startDateTime: string; // ISO string
  endDateTime: string;   // ISO string
  timeZone?: string;
  attendees?: string[];  // Email list
}

/**
 * Lists the user's Google Calendars.
 */
export async function listGoogleCalendars(accessToken: string): Promise<GoogleCalendar[]> {
  try {
    const url = 'https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader';
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Failed to fetch calendars (${res.status})`);
    }

    const data = await res.json();
    return (data.items || []).map((item: any) => ({
      id: item.id,
      summary: item.summaryOverride || item.summary || 'Untitled Calendar',
      description: item.description,
      primary: Boolean(item.primary),
      timeZone: item.timeZone,
      backgroundColor: item.backgroundColor,
      foregroundColor: item.foregroundColor,
      accessRole: item.accessRole,
    }));
  } catch (error: any) {
    console.error('Error fetching Google Calendars:', error);
    throw error;
  }
}

/**
 * Lists Google Calendar events for a given calendar ID within a date window.
 */
export async function listGoogleCalendarEvents(
  accessToken: string,
  calendarId: string = 'primary',
  options?: {
    timeMin?: string;
    timeMax?: string;
    query?: string;
    maxResults?: number;
  }
): Promise<GoogleCalendarEvent[]> {
  try {
    const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`);
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');
    url.searchParams.set('maxResults', String(options?.maxResults || 50));

    // Default to from 30 days ago to 30 days in future if not specified
    if (options?.timeMin) {
      url.searchParams.set('timeMin', options.timeMin);
    } else {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      url.searchParams.set('timeMin', thirtyDaysAgo.toISOString());
    }

    if (options?.timeMax) {
      url.searchParams.set('timeMax', options.timeMax);
    }

    if (options?.query && options.query.trim()) {
      url.searchParams.set('q', options.query.trim());
    }

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Failed to fetch calendar events (${res.status})`);
    }

    const data = await res.json();
    return data.items || [];
  } catch (error: any) {
    console.error(`Error fetching calendar events for ${calendarId}:`, error);
    throw error;
  }
}

/**
 * Creates a new event on Google Calendar (e.g. Decision Review, Architecture Sync).
 */
export async function createGoogleCalendarEvent(
  accessToken: string,
  params: CreateEventParams
): Promise<GoogleCalendarEvent> {
  try {
    const calendarId = params.calendarId || 'primary';
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1`;

    const timeZone = params.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

    const eventPayload: any = {
      summary: params.summary,
      description: params.description,
      location: params.location,
      start: {
        dateTime: params.startDateTime,
        timeZone,
      },
      end: {
        dateTime: params.endDateTime,
        timeZone,
      },
      reminders: {
        useDefault: true,
      },
    };

    if (params.attendees && params.attendees.length > 0) {
      eventPayload.attendees = params.attendees.map((email) => ({ email: email.trim() }));
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Failed to create calendar event (${res.status})`);
    }

    return await res.json();
  } catch (error: any) {
    console.error('Error creating Google Calendar event:', error);
    throw error;
  }
}

/**
 * Deletes an event from Google Calendar.
 */
export async function deleteGoogleCalendarEvent(
  accessToken: string,
  eventId: string,
  calendarId: string = 'primary'
): Promise<boolean> {
  try {
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Failed to delete calendar event (${res.status})`);
    }

    return true;
  } catch (error: any) {
    console.error(`Error deleting calendar event ${eventId}:`, error);
    throw error;
  }
}
