import { useEffect, useState, useCallback } from 'react';
import { supabase, DEMO_OPPORTUNITY_ID } from './supabase';
import type { Profile, Requirement, Document } from '../types';
import { buildReport, normalizeNotice } from './engine';

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
        supabase.from('profiles').select('*').limit(1).maybeSingle(),
        supabase.from('opportunities').select('*').eq('id', DEMO_OPPORTUNITY_ID).maybeSingle(),
        supabase.from('requirements').select('*').eq('opportunity_id', DEMO_OPPORTUNITY_ID).order('created_at'),
        supabase.from('documents').select('*').eq('opportunity_id', DEMO_OPPORTUNITY_ID).order('uploaded_at'),
      ]);

      if (profRes.error) throw profRes.error;
      if (oppRes.error) throw oppRes.error;
      if (reqRes.error) throw reqRes.error;
      if (docRes.error) throw docRes.error;

      setState({
        profile: profRes.data
          ? { name: profRes.data.name, degree: profRes.data.degree, year: profRes.data.year, cgpa: profRes.data.cgpa, skills: profRes.data.skills }
          : null,
        opportunity: oppRes.data as Opportunity | null,
        requirements: (reqRes.data ?? []).map(rowToRequirement),
        documents: (docRes.data ?? []).map(rowToDocument),
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
    id: row.req_key,
    title: row.title,
    description: row.description,
    type: row.type,
    priority: row.priority,
    status: row.status,
    sourceText: row.source_text,
    confidence: Number(row.confidence),
    dependencies: row.dependencies ?? [],
  };
}

function rowToDocument(row: any): Document {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    verificationStatus: row.verification_status,
    extractedText: row.extracted_text,
    uploadedAt: row.uploaded_at,
  };
}

export function useActions(load: () => Promise<void>) {
  const resolveRequirement = useCallback(async (reqKey: string) => {
    const { error } = await supabase
      .from('requirements')
      .update({ status: 'completed' })
      .eq('opportunity_id', DEMO_OPPORTUNITY_ID)
      .eq('req_key', reqKey);
    if (error) throw error;

    if (reqKey === 'transcript') {
      await supabase.from('documents').upsert({
        opportunity_id: DEMO_OPPORTUNITY_ID,
        name: 'Official_Transcript.pdf',
        category: 'Transcript',
        verification_status: 'needs_review',
        extracted_text: 'CGPA: 8.3',
      });
    }
    if (reqKey === 'endorsement') {
      await supabase.from('documents').upsert({
        opportunity_id: DEMO_OPPORTUNITY_ID,
        name: 'Institute_Endorsement.pdf',
        category: 'Endorsement',
        verification_status: 'verified',
        extracted_text: 'Signed by Principal, institutional seal applied',
      });
    }
    await load();
  }, [load]);

  const resetDemo = useCallback(async () => {
    await supabase.from('requirements').update({ status: 'missing' }).eq('opportunity_id', DEMO_OPPORTUNITY_ID).eq('req_key', 'transcript');
    await supabase.from('requirements').update({ status: 'blocked' }).eq('opportunity_id', DEMO_OPPORTUNITY_ID).eq('req_key', 'endorsement');
    await supabase.from('requirements').update({ status: 'pending' }).eq('opportunity_id', DEMO_OPPORTUNITY_ID).eq('req_key', 'submission');
    await supabase.from('documents').delete().eq('opportunity_id', DEMO_OPPORTUNITY_ID).eq('name', 'Official_Transcript.pdf');
    await supabase.from('documents').delete().eq('opportunity_id', DEMO_OPPORTUNITY_ID).eq('name', 'Institute_Endorsement.pdf');
    await load();
  }, [load]);

  const extractRequirements = useCallback(async (text: string): Promise<Requirement[]> => {
    const reqs = normalizeNotice(text);
    const { error: delErr } = await supabase.from('requirements').delete().eq('opportunity_id', DEMO_OPPORTUNITY_ID);
    if (delErr) throw delErr;
    const rows = reqs.map((r) => ({
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
    const { error: insErr } = await supabase.from('requirements').insert(rows);
    if (insErr) throw insErr;
    await load();
    return reqs;
  }, [load]);

  const saveProfile = useCallback(async (profile: Profile) => {
    const { data: existing } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
    if (existing) {
      const { error } = await supabase.from('profiles').update({
        name: profile.name, degree: profile.degree, year: profile.year, cgpa: profile.cgpa, skills: profile.skills,
      }).eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('profiles').insert(profile);
      if (error) throw error;
    }
    await load();
  }, [load]);

  const uploadDocument = useCallback(async (name: string, category: string) => {
    const { error } = await supabase.from('documents').insert({
      opportunity_id: DEMO_OPPORTUNITY_ID,
      name,
      category,
      verification_status: 'unverified',
      extracted_text: 'Upload pending text extraction',
    });
    if (error) throw error;
    await load();
  }, [load]);

  const deleteDocument = useCallback(async (id: string) => {
    const { error } = await supabase.from('documents').delete().eq('id', id);
    if (error) throw error;
    await load();
  }, [load]);

  return { resolveRequirement, resetDemo, extractRequirements, saveProfile, uploadDocument, deleteDocument };
}
