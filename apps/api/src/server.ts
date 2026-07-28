import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import { normalizeNotice } from './domain.js';

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/v1/health', (_, res) => {
  res.json({ ok: true, mode: process.env.OPENAI_API_KEY ? 'provider-ready' : 'deterministic-demo' });
});

app.post('/api/v1/opportunities/extract', (req, res) => {
  const p = z.object({ text: z.string().min(30).max(25000) }).safeParse(req.body);
  if (!p.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Please provide at least 30 characters of notice text.' } });
  }
  res.json({ provider: 'deterministic-mock', requirements: normalizeNotice(p.data.text) });
});

app.use((_, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => console.log(`ApplyReady API listening on :${port}`));
