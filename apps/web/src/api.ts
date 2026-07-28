import type { Report, Requirement } from './types';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body?.error?.message || `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

export async function fetchDemo(): Promise<Report> {
  const res = await fetch(`${API}/api/v1/demo`);
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return data.report as Report;
}

export async function resetDemo(): Promise<Report> {
  const res = await fetch(`${API}/api/v1/demo/reset`, { method: 'POST' });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return data.report as Report;
}

export async function resolveRequirement(id: string): Promise<Report> {
  const res = await fetch(`${API}/api/v1/demo/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requirementId: id }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return data.report as Report;
}

export async function extractRequirements(text: string): Promise<Requirement[]> {
  const res = await fetch(`${API}/api/v1/opportunities/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return data.requirements as Requirement[];
}
