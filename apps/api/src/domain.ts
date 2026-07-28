export type Status = 'completed' | 'pending' | 'missing' | 'blocked' | 'needs_review';
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export interface Requirement { id:string; title:string; description:string; type:string; priority:Priority; status:Status; deadline?:string; sourceText:string; confidence:number; dependencies:string[] }
export interface Document { id:string; name:string; category:string; verificationStatus:'verified'|'unverified'|'needs_review'; extractedText:string; extractedConfidence?:number; path?:string; uploadedAt:string }
export interface Match { requirementId:string; evidence:string; confidence:number; verified:boolean; explanation:string }
export interface Recommendation { action:string; impact:number; reason:string; urgency:'Now'|'Today'|'This week' }
export interface Report { readiness:number; requirements:Requirement[]; documents:Document[]; matches:Match[]; risk:'low'|'medium'|'high'; riskReasons:string[]; blockers:{title:string; chain:string[]; risk:'high'|'medium'}[]; contradictions:{field:string; values:string[]; action:string}[]; recommendations:Recommendation[] }
const weights: Record<Priority, number> = { critical: 32, high: 22, medium: 12, low: 6 };
export function readiness(requirements: Requirement[]) { const total=requirements.reduce((n,r)=>n+weights[r.priority],0); const earned=requirements.reduce((n,r)=>n+(r.status==='completed'?weights[r.priority]:0),0); return Math.round(earned/total*100); }
export function deadlineRisk(requirements: Requirement[]) { const urgent=requirements.filter(r=>r.priority==='critical'&&r.status!=='completed').length; return urgent>=2?'high':urgent===1?'medium':'low'; }

// Conservative deadline detection. Return ISO date string or null.
export function detectDeadline(text:string): string | null {
  if (!text) return null;
  const monthNames = '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
  // Patterns: 31 July 2026 | July 31, 2026
  const re1 = new RegExp(`\\b(\\d{1,2})\\s+(${monthNames}),?\\s+(\\d{4})\\b`, 'i');
  const re2 = new RegExp(`\\b(${monthNames})\\s+(\\d{1,2}),?\\s+(\\d{4})\\b`, 'i');
  const re3 = /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/; // dd/mm/yyyy or dd-mm-yyyy (assume dd/mm)
  const lower = text;
  let m = lower.match(re1) || lower.match(re2);
  if (m) {
    try {
      const d = new Date(m[0]);
      if (!isNaN(d.getTime())) return d.toISOString();
    } catch {}
  }
  m = lower.match(re3);
  if (m) {
    // treat as dd/mm/yyyy
    const day = Number(m[1]); const month = Number(m[2]); const year = Number(m[3].length === 2 ? '20'+m[3] : m[3]);
    if (day >=1 && day<=31 && month>=1 && month<=12) {
      const d = new Date(year, month-1, day);
      if (!isNaN(d.getTime())) return d.toISOString();
    }
  }

  // look for contextual phrases near dates
  const ctx = /(?:deadline|last date|applications close|register by|registration closes|closing date)[:\s\-]*([^\n]+)/i;
  const cm = text.match(ctx);
  if (cm) {
    const maybe = cm[1].slice(0,60);
    // attempt to find date inside
    const m2 = maybe.match(new RegExp(`(\\d{1,2}\\s+${monthNames}\\s+\\d{4}|${monthNames}\\s+\\d{1,2},?\\s+\\d{4}|\\d{1,2}[\\/\\-]\d{1,2}[\\/\\-]\d{2,4})`, 'i'));
    if (m2) {
      try { const d = new Date(m2[0]); if (!isNaN(d.getTime())) return d.toISOString(); } catch {}
    }
  }
  return null;
}

export function normalizeNotice(text:string): Requirement[] {
  const trimmed = (text || '').trim();
  if (!trimmed || trimmed.length < 20) return [];

  const paragraphs = trimmed.split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean);
  const sentences: string[] = [];
  paragraphs.forEach(p=>{ const s = p.match(/[^.!?]+[.!?]?/g) || [p]; s.forEach(ss=>sentences.push(ss.trim())); });

  const found: {id:string; title:string; type:string; priority:Priority; sentence:string; paragraph:string; confidence:number}[] = [];
  const pushIfNotExists = (id:string,title:string,type:string,priority:Priority,sentence:string,paragraph:string,confidence:number)=>{ if(!found.some(f=>f.id===id)) found.push({id,title,type,priority,sentence,paragraph,confidence}); };

  sentences.forEach(s=>{
    const lower = s.toLowerCase();
    const para = paragraphs.find(p=>p.includes(s))||'';
    if(/resume|cv\b/.test(lower)) pushIfNotExists('resume','Resume','document','high',s,para,0.9);
    if(/cover letter/.test(lower)) pushIfNotExists('cover_letter','Cover Letter','document','high',s,para,0.9);
    if(/transcript|marksheet|mark sheet|academic transcript/.test(lower)) pushIfNotExists('transcript','Official transcript','document','critical',s,para,0.95);
    if(/endorse|endorsement|signed by|institute endorsement|principal signature|institutional seal/.test(lower)) pushIfNotExists('endorsement','Institute endorsement','approval','critical',s,para,0.9);
    if(/submit (your )?application|submission deadline|submit by|last date to submit|apply by/.test(lower)) pushIfNotExists('submission','Submit application','submission','high',s,para,0.85);
    if(/cgpa|gpa|grade point/.test(lower)) pushIfNotExists('eligibility','Eligibility (CGPA)','eligibility','critical',s,para,0.8);
    if(/bonafide|bonafide certificate/.test(lower)) pushIfNotExists('bonafide','Bonafide certificate','document','high',s,para,0.85);
    if(/photograph|passport photo|photo/.test(lower)) pushIfNotExists('photo','Photograph','document','low',s,para,0.7);
    if(/recommendation|reference letter/.test(lower)) pushIfNotExists('recommendation','Recommendation letter','document','high',s,para,0.85);
  });

  return found.map(f=>({ id:f.id, title:f.title, description:f.sentence, type:f.type, priority:f.priority, status: f.type==='document'?'missing':'pending', sourceText: `${f.sentence} — ${f.paragraph}`, confidence:f.confidence, dependencies: [] }));
}

