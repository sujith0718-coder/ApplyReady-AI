import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import { normalizeNotice, detectDeadline } from './domain.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { load } from 'cheerio/slim';


// In-memory demo datastore that mimics the Supabase tables used by the frontend.
const DEMO_OPPORTUNITY_ID = 'a0000000-0000-0000-0000-000000000001';
let idSeq = 1;
const genId = () => `${Date.now()}-${idSeq++}`;

let profiles: any[] = [
  { id: genId(), name: 'Demo User', degree: 'BSc', year: 3, cgpa: 8.5, skills: ['AI', 'ML'] },
];

let opportunities: any[] = [
  { id: DEMO_OPPORTUNITY_ID, title: 'Demo Opportunity', deadline: '2026-12-31', notice_text: 'This is a sample notice used for the demo.' },
];

let requirements: any[] = normalizeNotice(opportunities[0].notice_text).map((r, i) => ({
  id: genId(),
  opportunity_id: DEMO_OPPORTUNITY_ID,
  req_key: r.id,
  title: r.title,
  description: r.description,
  type: r.type,
  priority: r.priority,
  status: r.status,
  source_text: r.sourceText,
  confidence: r.confidence,
  dependencies: r.dependencies,
  created_at: new Date(Date.now() - i * 1000).toISOString(),
}));

let documents: any[] = []; 

// Prepare uploads directory and multer
const UPLOAD_DIR = path.join(process.cwd(), 'apps', 'api', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => cb(null, UPLOAD_DIR),
  filename: (_req: any, file: any, cb: any) => {
    const ext = path.extname(file.originalname) || '';
    const fname = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, fname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req: any, file: any, cb: any) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type'));
  },
});

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

// Serve uploaded files for preview (secure enough for demo)
app.use('/uploads', express.static(UPLOAD_DIR));

// helper libs for extraction
import pdfParse from 'pdf-parse';
import Tesseract from 'tesseract.js';



async function extractTextFromFile(filePath: string, mimetype: string) {
  try {
    if (mimetype === 'application/pdf') {
      const data = await fs.promises.readFile(filePath);
      const parsed: any = await pdfParse(data);
      const txt = (parsed && parsed.text) ? String(parsed.text).trim() : '';
      if (!txt) return { text: '', confidence: 0 };
      return { text: txt, confidence: 0.9 };
    }
    if (mimetype.startsWith('image/')) {
      // perform OCR using tesseract.js on the image file path
      try {
        const result = await Tesseract.recognize(filePath, 'eng', { logger: () => {} });
        const txt = (result && result.data && result.data.text) ? String(result.data.text).trim() : '';
        const conf = (result && result.data && typeof result.data.confidence === 'number') ? Number(result.data.confidence) / 100 : 0;
        return { text: txt, confidence: conf || 0 };
      } catch (e) {
        return { text: '', confidence: 0 };
      }
    }
  } catch (e) {
    console.warn('Extraction failed:', (e as any)?.message || e);
    return { text: '', confidence: 0 };
  }
  return { text: '', confidence: 0 };
}

// Attempt MongoDB connection (non-blocking fallback)
import { connectToMongo, dbConnected } from './db.js';
import * as models from './models/index.js';

let _dbReady = false;
(async () => {
  const uri = process.env.MONGODB_URI;
  try {
    const ok = await connectToMongo(uri, 5000);
    if (ok) {
      console.log('Connected to MongoDB Atlas');
      _dbReady = true;
      // seed demo data if missing
      try {
        const existingOp = await models.OpportunityModel.findOne({ id: DEMO_OPPORTUNITY_ID }).lean().exec();
        if (!existingOp) {
          const opp = await models.OpportunityModel.create({ id: DEMO_OPPORTUNITY_ID, title: 'Demo Opportunity', deadline: '2026-12-31', notice_text: 'This is a sample notice used for the demo.' });
          const reqs = normalizeNotice(opp.notice_text);
          const rows = reqs.map((r: any, i: number) => ({ opportunity_id: DEMO_OPPORTUNITY_ID, req_key: r.id, title: r.title, description: r.description, type: r.type, priority: r.priority, status: r.status, source_text: r.sourceText, confidence: r.confidence, dependencies: r.dependencies }));
          if (rows.length) await models.RequirementModel.insertMany(rows).catch(() => {});
          // seed profile if none
          const profCount = await models.ProfileModel.countDocuments().exec();
          if (profCount === 0) {
            await models.ProfileModel.create({ name: 'Demo User', degree: 'BSc', year: 3, cgpa: 8.5, skills: ['AI','ML'] });
          }
        }
      } catch (e: any) {
        console.warn('Seeding skipped:', (e as any)?.message || e);
      }
    } else {
      console.log('Running in Demo Mode (In-Memory)');
      _dbReady = false;
    }
  } catch (err: any) {
    console.log('Running in Demo Mode (In-Memory)');
    _dbReady = false;
  }
})();

// Health
app.get('/api/v1/health', (_, res) => {
  res.json({ ok: true, mode: _dbReady ? 'provider-ready' : 'deterministic-demo' });
});
// Extract (existing behavior)
app.post('/api/v1/opportunities/extract', (req, res) => {
  const p = z.object({ text: z.string().min(1).max(25000) }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Please provide notice text.' } });
  res.json({ provider: 'deterministic-mock', requirements: normalizeNotice(p.data.text) });
});

// Profiles - simple list / upsert / patch
app.get('/api/v1/profiles', async (_, res) => {
  if (_dbReady) {
    const docs = await models.ProfileModel.find().lean().exec();
    return res.json(docs);
  }
  return res.json(profiles);
});

app.post('/api/v1/profiles', async (req, res) => {
  const body = req.body;
  if (_dbReady) {
    // Replace existing profile(s) with this one (demo semantics)
    await models.ProfileModel.deleteMany({}).exec();
    const created = await models.ProfileModel.create(body);
    return res.status(201).json(created.toObject());
  }
  const p = { id: genId(), ...body };
  profiles.splice(0, profiles.length, p);
  res.status(201).json(p);
});

app.patch('/api/v1/profiles/:id', async (req, res) => {
  if (_dbReady) {
    const updated = await models.ProfileModel.findOneAndUpdate({ $or: [{ id: req.params.id }, { _id: req.params.id }] }, req.body, { new: true }).lean().exec();
    if (!updated) return res.status(404).json({ error: 'not_found' });
    return res.json(updated);
  }
  const idx = profiles.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not_found' });
  profiles[idx] = { ...profiles[idx], ...req.body };
  res.json(profiles[idx]);
});

// Opportunities
// List all opportunities
app.get('/api/v1/opportunities', async (req, res) => {
  if (_dbReady) {
    const list = await models.OpportunityModel.find().sort({ createdAt: -1 }).lean().exec();
    return res.json(list);
  }
  return res.json(opportunities.slice().sort((a, b) => (a.created_at || '') < (b.created_at || '') ? 1 : -1));
});

app.get('/api/v1/opportunities/:id', async (req, res) => {
  if (_dbReady) {
    const o = await models.OpportunityModel.findOne({ id: req.params.id }).lean().exec();
    if (!o) return res.status(404).json({ error: 'not_found' });
    return res.json(o);
  }
  const o = opportunities.find((x) => x.id === req.params.id);
  if (!o) return res.status(404).json({ error: 'not_found' });
  res.json(o);
});

// Create a new opportunity and extract requirements for it
app.post('/api/v1/opportunities', async (req, res) => {
  const body = req.body;
  if (!body || typeof body.notice_text !== 'string' || body.notice_text.trim().length === 0) {
    return res.status(400).json({ error: 'Please provide notice_text' });
  }
  const title = body.title || (body.notice_text || '').slice(0, 80);
  const deadline = body.deadline || null;

  if (_dbReady) {
    const created = await models.OpportunityModel.create({ id: body.id || genId(), title, deadline, notice_text: body.notice_text });
    const reqs = normalizeNotice(body.notice_text);
    const rows = reqs.map((r: any) => ({ opportunity_id: created.id, req_key: r.id, title: r.title, description: r.description, type: r.type, priority: r.priority, status: r.status, source_text: r.sourceText, confidence: r.confidence, dependencies: r.dependencies }));
    if (rows.length) await models.RequirementModel.insertMany(rows).catch(() => {});
    return res.status(201).json(created.toObject());
  }

  const id = genId();
  const opp = { id, title, deadline, notice_text: body.notice_text, created_at: new Date().toISOString() };
  opportunities.push(opp);
  const reqs = normalizeNotice(body.notice_text);
  reqs.forEach((r: any, i: number) => {
    requirements.push({ id: genId(), opportunity_id: id, req_key: r.id, title: r.title, description: r.description, type: r.type, priority: r.priority, status: r.status, source_text: r.sourceText, confidence: r.confidence, dependencies: r.dependencies, created_at: new Date(Date.now() - i * 1000).toISOString() });
  });
  res.status(201).json(opp);
});

// Create opportunity from uploaded file (PDF / Image) — extracts text, then creates opportunity and requirements
app.post('/api/v1/opportunities/from-file', upload.single('file'), async (req, res) => {
  const anyReq: any = req as any;
  if (!anyReq.file) return res.status(400).json({ error: 'no_file', message: 'Please attach a file.' });
  const file = anyReq.file as any;
  // Extract text from file
  const fp = path.join(process.cwd(), 'apps', 'api', 'uploads', file.filename);
  const extracted = await extractTextFromFile(fp, file.mimetype).catch(() => ({ text: '', confidence: 0 }));
  const text = extracted.text || '';
  const titleFromFile = anyReq.body.title || (text.split('\n').find((l:any)=>l.trim().length>3)?.trim() || path.basename(file.originalname, path.extname(file.originalname)));
  const title = (titleFromFile && titleFromFile.length<=120 && !/applications?/i.test(titleFromFile)) ? String(titleFromFile).slice(0,120) : 'Untitled Opportunity';
  const deadline = detectDeadline(text);

  const payload = { title, deadline, notice_text: text };

  if (_dbReady) {
    const created = await models.OpportunityModel.create({ id: anyReq.body.id || genId(), ...payload });
    const reqs = normalizeNotice(text);
    const rows = reqs.map((r: any) => ({ opportunity_id: created.id, req_key: r.id, title: r.title, description: r.description, type: r.type, priority: r.priority, status: r.status, source_text: r.sourceText, confidence: r.confidence, dependencies: r.dependencies }));
    if (rows.length) await models.RequirementModel.insertMany(rows).catch(() => {});
    // also persist the uploaded document record
    await models.DocumentModel.create({ opportunity_id: created.id, name: file.originalname, category: anyReq.body.category || 'Uploaded document', verification_status: 'unverified', extracted_text: text || '', extracted_confidence: extracted.confidence || 0, mime_type: file.mimetype, size: file.size, path: path.join('apps','api','uploads', file.filename), uploaded_at: new Date().toISOString() });
    return res.status(201).json(created.toObject());
  }

  // demo fallback
  const id = genId();
  const opp = { id, title, deadline, notice_text: text, created_at: new Date().toISOString() };
  opportunities.push(opp);
  const reqs = normalizeNotice(text);
  reqs.forEach((r:any,i:number)=>{
    requirements.push({ id: genId(), opportunity_id: id, req_key: r.id, title: r.title, description: r.description, type: r.type, priority: r.priority, status: r.status, source_text: r.sourceText, confidence: r.confidence, dependencies: r.dependencies, created_at: new Date(Date.now()-i*1000).toISOString() });
  });
  // persist document record in demo
  documents.push({ id: genId(), opportunity_id: id, name: file.originalname, category: anyReq.body.category || 'Uploaded document', verification_status: 'unverified', extracted_text: text || '', extracted_confidence: extracted.confidence || 0, mime_type: file.mimetype, size: file.size, path: path.join('apps','api','uploads', file.filename), uploaded_at: new Date().toISOString() });
  res.status(201).json(opp);
});

// Create opportunity from URL
app.post('/api/v1/opportunities/from-url', async (req, res) => {
  const body = req.body;
  if (!body || typeof body.url !== 'string' || !body.url) return res.status(400).json({ error: 'invalid', message: 'Please provide url' });
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const fetched = await fetch(body.url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!fetched.ok) return res.status(400).json({ error: 'fetch_failed', message: `Failed to fetch URL: ${fetched.status}` });
   const html = await fetched.text();
const $ = load(html);
    const titleCandidates: string[] = [
  $('title').first().text().trim(),
  $('meta[name="description"]').attr('content')?.trim() ?? '',
  $('h1').first().text().trim(),
  $('h2').first().text().trim(),
  $('h3').first().text().trim(),
].filter(Boolean);
    // heuristic: prefer <main> or <article>, otherwise take largest <p> clusters
    let content = '';
    if ($('main').length) content = $('main').text();
    else if ($('article').length) content = $('article').text();
    else {
      // collect paragraphs and choose the largest continuous block
      const ps = $('p').map((i:any, el:any) => $(el).text().trim()).get().filter(Boolean);
      let acc = '';
      for (const p of ps) {
        // skip tiny paragraphs that are likely navigation
        if (p.length < 40) continue;
        acc += p + '\n\n';
        if (acc.length > 300) break;
      }
      content = acc;
    }

    // append a content-based candidate (first heading-like paragraph)
    const contentText = (content || '').trim();
    if (contentText) titleCandidates.push(contentText.split('\n').find((l:any)=>l.trim().length>3)?.trim() || '');

    // choose first meaningful candidate conservatively
    const chooseTitle = (s?: string) => {
      if (!s) return null;
      const cleaned = String(s).replace(/\s+/g, ' ').trim();
      if (cleaned.length < 4) return null;
      const words = cleaned.split(/\s+/).length;
      if (words >= 2 && words <= 8 && cleaned.length >= 6) return cleaned.slice(0, 120);
      if (/\d{4}/.test(cleaned) && cleaned.length >= 6) return cleaned.slice(0,120);
      return null;
    };

    let titleFromPage: string | null = null;
    for (const c of titleCandidates) {
      const t = chooseTitle(c);
      if (t) { titleFromPage = t; break; }
    }

    const text = contentText;
    if (!text || text.length < 30) return res.status(400).json({ error: 'no_text', message: 'No readable text detected on the page.' });
    const title = titleFromPage || 'Untitled Opportunity';
    const deadline = detectDeadline(text);
    const payload = { title, deadline, notice_text: text };
    if (_dbReady) {
      const created = await models.OpportunityModel.create({ id: body.id || genId(), ...payload });
      const reqs = normalizeNotice(text);
      const rows = reqs.map((r:any) => ({ opportunity_id: created.id, req_key: r.id, title: r.title, description: r.description, type: r.type, priority: r.priority, status: r.status, source_text: r.sourceText, confidence: r.confidence, dependencies: r.dependencies }));
      if (rows.length) await models.RequirementModel.insertMany(rows).catch(() => {});
      return res.status(201).json(created.toObject());
    }
    const id = genId();
    const opp = { id, title, deadline, notice_text: text, created_at: new Date().toISOString() };
    opportunities.push(opp);
    const reqs = normalizeNotice(text);
    reqs.forEach((r:any,i:number)=>{
      requirements.push({ id: genId(), opportunity_id: id, req_key: r.id, title: r.title, description: r.description, type: r.type, priority: r.priority, status: r.status, source_text: r.sourceText, confidence: r.confidence, dependencies: r.dependencies, created_at: new Date(Date.now()-i*1000).toISOString() });
    });
    res.status(201).json(opp);
  } catch (e:any) {
    return res.status(400).json({ error: 'fetch_error', message: e?.message || 'Failed to fetch URL' });
  }
});

// Requirements for an opportunity
app.get('/api/v1/opportunities/:id/requirements', async (req, res) => {
  if (_dbReady) {
    const list = await models.RequirementModel.find({ opportunity_id: req.params.id }).sort({ createdAt: 1 }).lean().exec();
    return res.json(list);
  }
  const list = requirements.filter((r) => r.opportunity_id === req.params.id).sort((a, b) => (a.created_at || '') > (b.created_at || '') ? 1 : -1);
  res.json(list);
});

app.delete('/api/v1/opportunities/:id/requirements', async (req, res) => {
  if (_dbReady) {
    await models.RequirementModel.deleteMany({ opportunity_id: req.params.id }).exec();
    return res.status(204).end();
  }
  for (let i = requirements.length - 1; i >= 0; i--) {
    if (requirements[i].opportunity_id === req.params.id) requirements.splice(i, 1);
  }
  res.status(204).end();
});

app.post('/api/v1/opportunities/:id/requirements', async (req, res) => {
  const rows = Array.isArray(req.body) ? req.body : [req.body];
  if (_dbReady) {
    const created = await models.RequirementModel.insertMany(rows.map((r: any) => ({ ...r })), { ordered: false }).catch((e) => {
      // ignore duplicate key errors during inserts to match demo behavior
      if (e && e.code !== 11000) throw e;
      return e && e.insertedDocs ? e.insertedDocs : [];
    });
    return res.status(201).json(created);
  }
  const inserted = rows.map((r: any) => {
    const row = { id: genId(), ...r };
    requirements.push(row);
    return row;
  });
  res.status(201).json(inserted);
});

// Update a specific requirement by req_key under an opportunity
app.patch('/api/v1/opportunities/:id/requirements/:reqKey', async (req, res) => {
  const id = req.params.id;
  const reqKey = req.params.reqKey;
  // Prevent marking completed when no verified evidence exists
  if (req.body && req.body.status === 'completed') {
    if (_dbReady) {
      const docCount = await models.DocumentModel.countDocuments({ opportunity_id: id, verification_status: 'verified' }).exec();
      if (!docCount) return res.status(400).json({ error: 'no_verified_evidence', message: 'Upload supporting evidence before marking complete.' });
    } else {
      const hasVerified = documents.some((d) => d.opportunity_id === id && d.verification_status === 'verified');
      if (!hasVerified) return res.status(400).json({ error: 'no_verified_evidence', message: 'Upload supporting evidence before marking complete.' });
    }
  }

  if (_dbReady) {
    const row = await models.RequirementModel.findOneAndUpdate({ opportunity_id: id, req_key: reqKey }, req.body, { new: true }).lean().exec();
    if (!row) return res.status(404).json({ error: 'not_found' });
    return res.json(row);
  }
  const row = requirements.find((r) => r.opportunity_id === id && r.req_key === reqKey);
  if (!row) return res.status(404).json({ error: 'not_found' });
  Object.assign(row, req.body);
  res.json(row);
});
// Documents endpoints
app.get('/api/v1/opportunities/:id/documents', async (req, res) => {
  if (_dbReady) {
    const list = await models.DocumentModel.find({ opportunity_id: req.params.id }).sort({ createdAt: 1 }).lean().exec();
    return res.json(list);
  }
  const list = documents.filter((d) => d.opportunity_id === req.params.id).sort((a, b) => (a.uploaded_at || '') > (b.uploaded_at || '') ? 1 : -1);
  res.json(list);
});

app.post('/api/v1/opportunities/:id/documents', upload.single('file'), async (req, res) => {
  // If a file was uploaded via multipart form, handle file metadata + save
  const anyReq: any = req as any;
  if (anyReq.file) {
    const file = anyReq.file as any;
    const storedPath = path.join('apps', 'api', 'uploads', file.filename);
    const meta: any = {
      opportunity_id: req.params.id,
      name: req.body.name || file.originalname,
      category: req.body.category || file.originalname || 'Unknown',
      verification_status: req.body.verification_status || 'unverified',
      extracted_text: req.body.extracted_text || 'Upload pending text extraction',
      mime_type: file.mimetype,
      size: file.size,
      path: storedPath,
      uploaded_at: new Date().toISOString(),
    };

    // attempt server-side extraction (PDF / image)
    try {
      const fp = path.join(process.cwd(), 'apps', 'api', 'uploads', file.filename);
      const extracted = await extractTextFromFile(fp, file.mimetype);
      if (extracted && extracted.text) {
        meta.extracted_text = extracted.text;
        meta.extracted_confidence = extracted.confidence || 0;
      } else {
        meta.extracted_text = ''; // explicitly empty to indicate no readable text
        meta.extracted_confidence = 0;
      }
    } catch (e) {
      meta.extracted_text = '';
      meta.extracted_confidence = 0;
    }

    if (_dbReady) {
      const doc = await models.DocumentModel.create({ ...meta, opportunity_id: req.params.id });
      return res.status(201).json(doc.toObject());
    }

    const doc = { id: genId(), ...meta };
    documents.push(doc);
    return res.status(201).json(doc);
  }

  // Fallback: support existing JSON API for backward compatibility
  const body = req.body;
  if (_dbReady) {
    const doc = await models.DocumentModel.create({ ...body, opportunity_id: req.params.id });
    return res.status(201).json(doc.toObject());
  }
  const doc = { id: genId(), uploaded_at: new Date().toISOString(), ...body };
  documents.push(doc);
  res.status(201).json(doc);
});

app.patch('/api/v1/documents/:id', async (req, res) => {
  const id = req.params.id;
  if (_dbReady) {
    const updated = await models.DocumentModel.findOneAndUpdate({ $or: [{ id }, { _id: id }] }, req.body, { new: true }).lean().exec();
    if (!updated) return res.status(404).json({ error: 'not_found' });
    return res.json(updated);
  }
  const idx = documents.findIndex((d) => d.id === id);
  if (idx === -1) return res.status(404).json({ error: 'not_found' });
  documents[idx] = { ...documents[idx], ...req.body };
  res.json(documents[idx]);
});

// delete document
app.delete('/api/v1/documents/:id', async (req, res) => {
  if (_dbReady) {
    const r = await models.DocumentModel.findOneAndDelete({ $or: [{ id: req.params.id }, { _id: req.params.id }] }).lean().exec();
    if (!r) return res.status(404).json({ error: 'not_found' });
    // attempt to remove stored file if present
    try {
      if (r.path) {
        const fp = path.isAbsolute(r.path) ? r.path : path.join(process.cwd(), r.path);
        if (fs.existsSync(fp)) fs.unlinkSync(fp);
      }
    } catch (e) {
      console.warn('Failed to remove file:', (e as any)?.message || e);
    }
    return res.status(204).end();
  }
  const idx = documents.findIndex((d) => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not_found' });
  // remove local file if present
  try {
    const doc = documents[idx];
    if (doc.path) {
      const fp = path.isAbsolute(doc.path) ? doc.path : path.join(process.cwd(), doc.path);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }
  } catch (e) {
    console.warn('Failed to remove demo file:', (e as any)?.message || e);
  }
  documents.splice(idx, 1);
  res.status(204).end();
});
// Reset demo endpoint (convenience)
app.post('/api/v1/opportunities/:id/reset-demo', async (req, res) => {
  const id = req.params.id;
  if (_dbReady) {
    // set statuses according to domain defaults
    await models.RequirementModel.updateMany({ opportunity_id: id, req_key: 'transcript' }, { $set: { status: 'missing' } }).exec();
    await models.RequirementModel.updateMany({ opportunity_id: id, req_key: 'endorsement' }, { $set: { status: 'blocked' } }).exec();
    await models.RequirementModel.updateMany({ opportunity_id: id, req_key: 'submission' }, { $set: { status: 'pending' } }).exec();
    // remove demo docs by name
    await models.DocumentModel.deleteMany({ opportunity_id: id, name: { $in: ['Official_Transcript.pdf', 'Institute_Endorsement.pdf'] } }).exec();
    return res.json({ ok: true });
  }
  // in-memory fallback
  for (const r of requirements.filter((x) => x.opportunity_id === id)) {
    if (r.req_key === 'transcript') r.status = 'missing';
    if (r.req_key === 'endorsement') r.status = 'blocked';
    if (r.req_key === 'submission') r.status = 'pending';
  }
  for (let i = documents.length - 1; i >= 0; i--) {
    if (documents[i].opportunity_id === id && (documents[i].name === 'Official_Transcript.pdf' || documents[i].name === 'Institute_Endorsement.pdf')) documents.splice(i, 1);
  }
  res.json({ ok: true });
});

app.use((_, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => console.log(`ApplyReady API listening on :${port}`));
