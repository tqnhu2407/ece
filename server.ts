import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  getCuratedDecisionsFromSources,
  reconstructReasoning,
  generateDynamicMorningBrief
} from './src/lib/geminiServer';
import { ContextSource } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory runtime state for synced Google Workspace sources
let customSources: ContextSource[] = [];

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasGeminiKey: !!process.env.GEMINI_API_KEY });
});

app.get('/api/morning-brief', async (req, res) => {
  try {
    const userName = (req.query.userName as string) || 'Engineering Team';
    const brief = await generateDynamicMorningBrief(customSources, userName);
    res.json(brief);
  } catch (err: any) {
    console.error('Error generating morning brief:', err);
    res.status(500).json({ error: err.message || 'Failed to generate morning brief' });
  }
});

app.get('/api/decisions', (req, res) => {
  const curated = getCuratedDecisionsFromSources(customSources);
  res.json(curated);
});

app.get('/api/decisions/:id', (req, res) => {
  const curated = getCuratedDecisionsFromSources(customSources);
  const decision = curated.find((d) => d.id === req.params.id);
  if (!decision) {
    res.status(404).json({ error: 'Decision not found' });
    return;
  }
  res.json(decision);
});

app.get('/api/context-sources', (req, res) => {
  res.json(customSources);
});

app.post('/api/context/add', (req, res) => {
  const { title, type, summary, details, authorOrHost, date, url, metadata } = req.body;
  if (!title || !type || !summary) {
    res.status(400).json({ error: 'Missing required fields: title, type, summary' });
    return;
  }

  let resolvedUrl = url;
  if (!resolvedUrl || resolvedUrl === 'https://docs.google.com' || resolvedUrl === 'https://docs.google.com/') {
    if (metadata?.googleDocId) {
      resolvedUrl = `https://docs.google.com/document/d/${metadata.googleDocId}/edit`;
    } else if (metadata?.googleCalendarEventId) {
      resolvedUrl = metadata.meetLink || 'https://calendar.google.com';
    } else if (type === 'github') {
      resolvedUrl = 'https://github.com/org/repo';
    } else if (type === 'calendar') {
      resolvedUrl = 'https://calendar.google.com';
    } else {
      resolvedUrl = 'https://docs.google.com';
    }
  }

  const calendarEventId = metadata?.googleCalendarEventId;
  const docId = metadata?.googleDocId;
  const existingIndex = customSources.findIndex(
    (s) =>
      (calendarEventId && s.metadata?.googleCalendarEventId === calendarEventId) ||
      (docId && s.metadata?.googleDocId === docId) ||
      s.title === title
  );

  const newSource: ContextSource = {
    id: existingIndex >= 0 ? customSources[existingIndex].id : `src-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: ['calendar', 'doc', 'github', 'incident'].includes(type) ? type : 'doc',
    title,
    date: date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    authorOrHost: authorOrHost || 'Dũng Trần Chí',
    summary,
    details: details || summary,
    url: resolvedUrl,
    metadata: metadata || {}
  };

  if (existingIndex >= 0) {
    customSources[existingIndex] = newSource;
  } else {
    customSources.unshift(newSource);
  }
  res.json({ success: true, source: newSource, totalSources: customSources.length });
});

app.post('/api/context/batch-add', (req, res) => {
  const { sources } = req.body;
  if (!Array.isArray(sources) || sources.length === 0) {
    res.status(400).json({ error: 'Array of sources is required' });
    return;
  }

  const addedSources: ContextSource[] = [];

  for (const src of sources) {
    if (!src.title || !src.summary) continue;

    let resolvedUrl = src.url;
    if (!resolvedUrl || resolvedUrl === 'https://docs.google.com' || resolvedUrl === 'https://docs.google.com/') {
      if (src.metadata?.googleDocId) {
        resolvedUrl = `https://docs.google.com/document/d/${src.metadata.googleDocId}/edit`;
      } else if (src.metadata?.googleCalendarEventId) {
        resolvedUrl = src.metadata.meetLink || 'https://calendar.google.com';
      } else if (src.type === 'github') {
        resolvedUrl = 'https://github.com/org/repo';
      } else if (src.type === 'calendar') {
        resolvedUrl = 'https://calendar.google.com';
      } else {
        resolvedUrl = 'https://docs.google.com';
      }
    }

    const docId = src.metadata?.googleDocId;
    const calendarEventId = src.metadata?.googleCalendarEventId;
    const existingIndex = customSources.findIndex(
      (s) =>
        (calendarEventId && s.metadata?.googleCalendarEventId === calendarEventId) ||
        (docId && s.metadata?.googleDocId === docId) ||
        s.title === src.title
    );

    const newSource: ContextSource = {
      id: existingIndex >= 0 ? customSources[existingIndex].id : `src-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: ['calendar', 'doc', 'github', 'incident'].includes(src.type) ? src.type : 'doc',
      title: src.title,
      date: src.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      authorOrHost: src.authorOrHost || 'Dũng Trần Chí',
      summary: src.summary,
      details: src.details || src.summary,
      url: resolvedUrl,
      metadata: src.metadata || {}
    };

    if (existingIndex >= 0) {
      customSources[existingIndex] = newSource;
    } else {
      customSources.unshift(newSource);
    }
    addedSources.push(newSource);
  }

  res.json({
    success: true,
    count: addedSources.length,
    sources: addedSources,
    totalSources: customSources.length
  });
});

app.post('/api/ask-why', async (req, res) => {
  try {
    const { question, clientContextSources } = req.body;
    if (!question || typeof question !== 'string') {
      res.status(400).json({ error: 'Question is required' });
      return;
    }

    // Reconcile server state with client-supplied context if any
    if (Array.isArray(clientContextSources) && clientContextSources.length > 0) {
      for (const clientSrc of clientContextSources) {
        const calId = clientSrc.metadata?.googleCalendarEventId;
        const dId = clientSrc.metadata?.googleDocId;
        const exists = customSources.some(
          (s) =>
            s.id === clientSrc.id ||
            (calId && s.metadata?.googleCalendarEventId === calId) ||
            (dId && s.metadata?.googleDocId === dId) ||
            s.title === clientSrc.title
        );
        if (!exists) {
          customSources.unshift(clientSrc);
        }
      }
    }

    const reasoning = await reconstructReasoning(question, customSources);
    res.json(reasoning);
  } catch (err: any) {
    console.error('Error in /api/ask-why:', err);
    res.status(500).json({ error: err.message || 'Failed to reconstruct reasoning' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Trace running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
