import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { INITIAL_CONTEXT_SOURCES, INITIAL_DECISIONS, INITIAL_MORNING_BRIEF } from './src/data/mockData';
import { reconstructReasoning } from './src/lib/geminiServer';
import { ContextSource, DecisionItem } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory runtime state (supports adding custom context sources)
let customSources: ContextSource[] = [];
let allDecisionsState: DecisionItem[] = [...INITIAL_DECISIONS];

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasGeminiKey: !!process.env.GEMINI_API_KEY });
});

app.get('/api/brief', (req, res) => {
  res.json(INITIAL_MORNING_BRIEF);
});

app.get('/api/decisions', (req, res) => {
  res.json(allDecisionsState);
});

app.get('/api/decisions/:id', (req, res) => {
  const decision = allDecisionsState.find(d => d.id === req.params.id);
  if (!decision) {
    res.status(404).json({ error: 'Decision not found' });
    return;
  }
  res.json(decision);
});

app.get('/api/context-sources', (req, res) => {
  res.json([...INITIAL_CONTEXT_SOURCES, ...customSources]);
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
    } else if (type === 'github') {
      resolvedUrl = 'https://github.com/org/repo';
    } else if (type === 'calendar') {
      resolvedUrl = 'https://calendar.google.com';
    } else {
      resolvedUrl = 'https://docs.google.com';
    }
  }

  const newSource: ContextSource = {
    id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: ['calendar', 'doc', 'github', 'incident'].includes(type) ? type : 'doc',
    title,
    date: date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    authorOrHost: authorOrHost || 'Dũng Trần Chí',
    summary,
    details: details || summary,
    url: resolvedUrl,
    metadata: metadata || {}
  };

  customSources.unshift(newSource);
  res.json({ success: true, source: newSource });
});

app.post('/api/ask-why', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question || typeof question !== 'string') {
      res.status(400).json({ error: 'Question is required' });
      return;
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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Trace running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
