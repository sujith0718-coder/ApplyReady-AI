export type Status = 'completed' | 'pending' | 'missing' | 'blocked' | 'needs_review';
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export interface Requirement { id:string; title:string; description:string; type:string; priority:Priority; status:Status; deadline?:string; sourceText:string; confidence:number; dependencies:string[] }
export interface Document { id:string; name:string; category:string; verificationStatus:'verified'|'unverified'|'needs_review'; extractedText:string; uploadedAt:string }
export interface Match { requirementId:string; evidence:string; confidence:number; verified:boolean; explanation:string }
export interface Recommendation { action:string; impact:number; reason:string; urgency:'Now'|'Today'|'This week' }
export interface Report { readiness:number; requirements:Requirement[]; documents:Document[]; matches:Match[]; risk:'low'|'medium'|'high'; riskReasons:string[]; blockers:{title:string; chain:string[]; risk:'high'|'medium'}[]; contradictions:{field:string; values:string[]; action:string}[]; recommendations:Recommendation[] }
const weights: Record<Priority, number> = { critical: 32, high: 22, medium: 12, low: 6 };
export function readiness(requirements: Requirement[]) { const total=requirements.reduce((n,r)=>n+weights[r.priority],0); const earned=requirements.reduce((n,r)=>n+(r.status==='completed'?weights[r.priority]:0),0); return Math.round(earned/total*100); }
export function deadlineRisk(requirements: Requirement[]) { const urgent=requirements.filter(r=>r.priority==='critical'&&r.status!=='completed').length; return urgent>=2?'high':urgent===1?'medium':'low'; }
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

