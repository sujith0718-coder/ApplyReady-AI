import { useEffect, useState, useCallback } from 'react';
import { DEMO_OPPORTUNITY_ID } from './supabase';
import type { Profile, Requirement, Document } from '../types';
import { buildReport, normalizeNotice } from './engine';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

async function getJsonOrThrow(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text || '{}');
  } catch {
    throw new Error(text || res.statusText);
  }
}

export interface Opportunity {
  id: string;
  title: string;
  deadline: string;
  notice_text: string;
}

export interface AppState {
  profile: Profile | null;
  opportunity: Opportunity | null;
  requirements: Requirement[];
  documents: Document[];
  loading: boolean;
  error: string;
}

export function useAppData() {
  const [state, setState] = useState<AppState>({
    profile: null,
    opportunity: null,
    requirements: [],
    documents: [],
    loading: true,
    error: '',
  });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const [profRes, oppRes, reqRes, docRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/profiles`),
        fetch(`${API_BASE}/api/v1/opportunities/${DEMO_OPPORTUNITY_ID}`),
        fetch(`${API_BASE}/api/v1/opportunities/${DEMO_OPPORTUNITY_ID}/requirements`),
        fetch(`${API_BASE}/api/v1/opportunities/${DEMO_OPPORTUNITY_ID}/documents`),
      ]);

      const [profJson, oppJson, reqJson, docJson] = await Promise.all([
        getJsonOrThrow(profRes),
        getJsonOrThrow(oppRes),
        getJsonOrThrow(reqRes),
        getJsonOrThrow(docRes),
      ]);

      const profData = Array.isArray(profJson) ? profJson[0] ?? null : profJson || null;

      setState({
        profile: profData
          ? { name: profData.name, degree: profData.degree, year: profData.year, cgpa: profData.cgpa, skills: profData.skills }
          : null,
        opportunity: oppJson || null,
        requirements: (reqJson ?? []).map(rowToRequirement),
        documents: (docJson ?? []).map(rowToDocument),
        loading: false,
        error: '',
      });
    } catch (e) {
      setState((s) => ({
        ...s,
        loading: false,
        error: e instanceof Error ? e.message : 'Failed to load data',
      }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { state, load };
}

function rowToRequirement(row: any): Requirement {
  return {
    id: row.req_key ?? row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    priority: row.priority,
    status: row.status,
    sourceText: row.source_text ?? row.sourceText,
    confidence: Number(row.confidence ?? row.confidence),
    dependencies: row.dependencies ?? [],
  };
}

function rowToDocument(row: any): Document {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    verificationStatus: row.verification_status ?? row.verificationStatus,
    extractedText: row.extracted_text ?? row.extractedText,
    uploadedAt: row.uploaded_at ?? row.uploadedAt,
  };
}

export function useActions(load: () => Promise<void>) {
  const resolveRequirement = useCallback(async (reqKey: string) => {
    const res = await fetch(`${API_BASE}/api/v1/opportunities/${DEMO_OPPORTUNITY_ID}/requirements/${encodeURIComponent(reqKey)}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    if (!res.ok) throw new Error((await res.text()) || res.statusText);

    if (reqKey === 'transcript') {
      await fetch(`${API_BASE}/api/v1/opportunities/${DEMO_OPPORTUNITY_ID}/documents`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          opportunity_id: DEMO_OPPORTUNITY_ID,
          name: 'Official_Transcript.pdf',
          category: 'Transcript',
          verification_status: 'needs_review',
          extracted_text: 'CGPA: 8.3',
        }),
      });
    }
    if (reqKey === 'endorsement') {
      await fetch(`${API_BASE}/api/v1/opportunities/${DEMO_OPPORTUNITY_ID}/documents`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          opportunity_id: DEMO_OPPORTUNITY_ID,
          name: 'Institute_Endorsement.pdf',
          category: 'Endorsement',
          verification_status: 'verified',
          extracted_text: 'Signed by Principal, institutional seal applied',
        }),
      });
    }
    await load();
  }, [load]);

  const resetDemo = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/v1/opportunities/${DEMO_OPPORTUNITY_ID}/reset-demo`, { method: 'POST' });
    if (!res.ok) throw new Error((await res.text()) || res.statusText);
    await load();
  }, [load]);

  const extractRequirements = useCallback(async (text: string): Promise<Requirement[]> => {
    // Server can compute normalized requirements; fallback to local normalization if needed.
    const extractRes = await fetch(`${API_BASE}/api/v1/opportunities/extract`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const extractJson = extractRes.ok ? await extractRes.json() : { requirements: normalizeNotice(text) };
    const reqs = extractJson.requirements ?? extractJson;

    // replace stored requirements
    const delRes = await fetch(`${API_BASE}/api/v1/opportunities/${DEMO_OPPORTUNITY_ID}/requirements`, { method: 'DELETE' });
    if (!delRes.ok) throw new Error((await delRes.text()) || delRes.statusText);

    const rows = reqs.map((r: any) => ({
      opportunity_id: DEMO_OPPORTUNITY_ID,
      req_key: r.id,
      title: r.title,
      description: r.description,
      type: r.type,
      priority: r.priority,
      status: r.status,
      confidence: r.confidence,
      source_text: r.sourceText,
      dependencies: r.dependencies,
    }));

    const insRes = await fetch(`${API_BASE}/api/v1/opportunities/${DEMO_OPPORTUNITY_ID}/requirements`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(rows),
    });
    if (!insRes.ok) throw new Error((await insRes.text()) || insRes.statusText);

    await load();
    return reqs;
  }, [load]);

  const saveProfile = useCallback(async (profile: Profile) => {
    const res = await fetch(`${API_BASE}/api/v1/profiles`);
    const arr = await getJsonOrThrow(res);
    const existing = Array.isArray(arr) ? arr[0] ?? null : arr ?? null;
    if (existing && existing.id) {
      const r = await fetch(`${API_BASE}/api/v1/profiles/${existing.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(profile) });
      if (!r.ok) throw new Error((await r.text()) || r.statusText);
    } else {
      const r = await fetch(`${API_BASE}/api/v1/profiles`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(profile) });
      if (!r.ok) throw new Error((await r.text()) || r.statusText);
    }
    await load();
  }, [load]);

  const uploadDocument = useCallback(async (name: string, category: string, file?: File, onProgress?: (p: number) => void) => {
      // If a file is provided, upload via multipart/form-data with progress
      if (file) {
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          const fd = new FormData();
          fd.append('file', file);
          fd.append('name', name);
          fd.append('category', category);
          fd.append('verification_status', 'unverified');
          fd.append('extracted_text', 'Upload pending text extraction');

          xhr.open('POST', `${API_BASE}/api/v1/opportunities/${DEMO_OPPORTUNITY_ID}/documents`);
          xhr.onload = async () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try { await load(); } catch (_) {}
              resolve();
            } else {
              reject(new Error(xhr.responseText || xhr.statusText));
            }
          };
          xhr.onerror = () => reject(new Error('Upload failed'));
          if (xhr.upload && onProgress) {
            xhr.upload.onprogress = (ev) => {
              if (ev.lengthComputable) {
                const p = Math.round((ev.loaded / ev.total) * 100);
                try { onProgress(p); } catch (_) {}
              }
            };
          }
          xhr.send(fd);
        });
        return;
      }

      // Fallback: previous JSON metadata-only behavior
      const r = await fetch(`${API_BASE}/api/v1/opportunities/${DEMO_OPPORTUNITY_ID}/documents`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
          opportunity_id: DEMO_OPPORTUNITY_ID,
          name,
          category,
          verification_status: 'unverified',
          extracted_text: 'Upload pending text extraction',
        }),
      });
      if (!r.ok) throw new Error((await r.text()) || r.statusText);
      await load();
    }, [load]);

  const deleteDocument = useCallback(async (id: string) => {
    const r = await fetch(`${API_BASE}/api/v1/documents/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!r.ok) throw new Error((await r.text()) || r.statusText);
    await load();
  }, [load]);

  return { resolveRequirement, resetDemo, extractRequirements, saveProfile, uploadDocument, deleteDocument };
}
