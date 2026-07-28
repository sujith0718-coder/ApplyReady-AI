import { useEffect, useState, useCallback } from 'react';
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
  opportunity: Opportunity | null; // active opportunity
  opportunities: Opportunity[];
  requirements: Requirement[];
  documents: Document[];
  loading: boolean;
  error: string;
}

export function useAppData() {
  const [state, setState] = useState<AppState>({
    profile: null,
    opportunity: null,
    opportunities: [],
    requirements: [],
    documents: [],
    loading: true,
    error: '',
  });

  const setActive = useCallback(async (id: string | null) => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      // fetch details for active opportunity
      const [reqRes, docRes] = await Promise.all([
        id ? fetch(`${API_BASE}/api/v1/opportunities/${encodeURIComponent(id)}/requirements`) : Promise.resolve(new Response('[]', { status: 200 })),
        id ? fetch(`${API_BASE}/api/v1/opportunities/${encodeURIComponent(id)}/documents`) : Promise.resolve(new Response('[]', { status: 200 })),
      ]);
      const [reqJson, docJson] = await Promise.all([getJsonOrThrow(reqRes), getJsonOrThrow(docRes)]);

      setState((s) => ({
        ...s,
        opportunity: id ? s.opportunities.find((o) => o.id === id) ?? null : null,
        requirements: (reqJson ?? []).map(rowToRequirement),
        documents: (docJson ?? []).map(rowToDocument),
        loading: false,
        error: '',
      }));
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: e instanceof Error ? e.message : 'Failed to load data' }));
    }
  }, []);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const [profRes, oppsRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/profiles`),
        fetch(`${API_BASE}/api/v1/opportunities`),
      ]);

      const [profJson, oppsJson] = await Promise.all([getJsonOrThrow(profRes), getJsonOrThrow(oppsRes)]);
      const profData = Array.isArray(profJson) ? profJson[0] ?? null : profJson || null;
      const opps: Opportunity[] = Array.isArray(oppsJson) ? oppsJson : (oppsJson ? [oppsJson] : []);

      // choose active: keep previous if present else first
      const prevId = state.opportunity?.id ?? null;
      const activeId = prevId && opps.some((o) => o.id === prevId) ? prevId : (opps[0]?.id ?? null);

      setState((s) => ({
        ...s,
        profile: profData ? { name: profData.name, degree: profData.degree, year: profData.year, cgpa: profData.cgpa, skills: profData.skills } : null,
        opportunities: opps,
        loading: true,
        error: '',
      }));

      // load active details
      await setActive(activeId);
    } catch (e) {
      setState((s) => ({
        ...s,
        loading: false,
        error: e instanceof Error ? e.message : 'Failed to load data',
      }));
    }
  }, [setActive, state.opportunity]);

  useEffect(() => {
    load();
  }, [load]);

  const createOpportunityFromText = useCallback(async (text: string, opts?: { title?: string; deadline?: string }) => {
    const title = opts?.title || (text || '').slice(0, 80);
    const deadline = opts?.deadline || null;
    const res = await fetch(`${API_BASE}/api/v1/opportunities`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title, deadline, notice_text: text }) });
    if (!res.ok) throw new Error((await res.text()) || res.statusText);
    const created = await res.json();
    // reload list and set active to created.id
    await load();
    await setActive(created.id);
    return created;
  }, [load, setActive]);

  return { state, load, setActiveOpportunity: setActive, createOpportunityFromText };
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

export function useActions(getActiveId: () => string | null, load: () => Promise<void>) {
  const resolveRequirement = useCallback(async (reqKey: string) => {
    const id = getActiveId();
    if (!id) throw new Error('No active opportunity selected');
    const res = await fetch(`${API_BASE}/api/v1/opportunities/${encodeURIComponent(id)}/requirements/${encodeURIComponent(reqKey)}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    if (!res.ok) throw new Error((await res.text()) || res.statusText);

    // Convenience demo helpers: auto-add documents for common demo keys
    if (reqKey === 'transcript') {
      await fetch(`${API_BASE}/api/v1/opportunities/${encodeURIComponent(id)}/documents`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          opportunity_id: id,
          name: 'Official_Transcript.pdf',
          category: 'Transcript',
          verification_status: 'needs_review',
          extracted_text: 'CGPA: 8.3',
        }),
      });
    }
    if (reqKey === 'endorsement') {
      await fetch(`${API_BASE}/api/v1/opportunities/${encodeURIComponent(id)}/documents`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          opportunity_id: id,
          name: 'Institute_Endorsement.pdf',
          category: 'Endorsement',
          verification_status: 'verified',
          extracted_text: 'Signed by Principal, institutional seal applied',
        }),
      });
    }
    await load();
  }, [getActiveId, load]);

  const resetDemo = useCallback(async () => {
    const id = getActiveId();
    if (!id) throw new Error('No active opportunity');
    const res = await fetch(`${API_BASE}/api/v1/opportunities/${encodeURIComponent(id)}/reset-demo`, { method: 'POST' });
    if (!res.ok) throw new Error((await res.text()) || res.statusText);
    await load();
  }, [getActiveId, load]);

  const extractRequirements = useCallback(async (text: string): Promise<Requirement[]> => {
    const id = getActiveId();
    if (!id) throw new Error('No active opportunity');
    // Server can compute normalized requirements; fallback to local normalization if needed.
    const extractRes = await fetch(`${API_BASE}/api/v1/opportunities/extract`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const extractJson = extractRes.ok ? await extractRes.json() : { requirements: normalizeNotice(text) };
    const reqs = extractJson.requirements ?? extractJson;

    // replace stored requirements
    const delRes = await fetch(`${API_BASE}/api/v1/opportunities/${encodeURIComponent(id)}/requirements`, { method: 'DELETE' });
    if (!delRes.ok) throw new Error((await delRes.text()) || delRes.statusText);

    const rows = reqs.map((r: any) => ({
      opportunity_id: id,
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

    const insRes = await fetch(`${API_BASE}/api/v1/opportunities/${encodeURIComponent(id)}/requirements`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(rows),
    });
    if (!insRes.ok) throw new Error((await insRes.text()) || insRes.statusText);

    await load();
    return reqs;
  }, [getActiveId, load]);

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
      const id = getActiveId();
      if (!id) throw new Error('No active opportunity');
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

          xhr.open('POST', `${API_BASE}/api/v1/opportunities/${encodeURIComponent(id)}/documents`);
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
      const r = await fetch(`${API_BASE}/api/v1/opportunities/${encodeURIComponent(id)}/documents`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
          opportunity_id: id,
          name,
          category,
          verification_status: 'unverified',
          extracted_text: 'Upload pending text extraction',
        }),
      });
      if (!r.ok) throw new Error((await r.text()) || r.statusText);
      await load();
    }, [getActiveId, load]);

  const deleteDocument = useCallback(async (idArg: string) => {
    const r = await fetch(`${API_BASE}/api/v1/documents/${encodeURIComponent(idArg)}`, { method: 'DELETE' });
    if (!r.ok) throw new Error((await r.text()) || r.statusText);
    await load();
  }, [load]);

  return { resolveRequirement, resetDemo, extractRequirements, saveProfile, uploadDocument, deleteDocument };
}
