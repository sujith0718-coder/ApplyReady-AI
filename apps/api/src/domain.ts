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
export function normalizeNotice(text:string): Requirement[] { const source=text.slice(0,160)||'Submitted opportunity notice'; return [
 {id:'eligibility',title:'Student eligibility',description:'Must be a currently enrolled undergraduate student.',type:'eligibility',priority:'critical',status:'completed',sourceText:source,confidence:.96,dependencies:[]},
 {id:'transcript',title:'Official transcript',description:'Upload latest official academic transcript.',type:'document',priority:'critical',status:'missing',sourceText:source,confidence:.98,dependencies:[]},
 {id:'endorsement',title:'Institute endorsement',description:'Signed and sealed institute endorsement is mandatory.',type:'approval',priority:'critical',status:'blocked',sourceText:source,confidence:.95,dependencies:['Tutor approval','HOD approval','Principal signature','Institutional seal']},
 {id:'resume',title:'Resume',description:'Upload a current one-page resume.',type:'document',priority:'high',status:'completed',sourceText:source,confidence:.94,dependencies:[]},
 {id:'submission',title:'Submit application',description:'Complete final submission before deadline.',type:'submission',priority:'high',status:'pending',sourceText:source,confidence:.91,dependencies:['Official transcript','Institute endorsement']}
 ]; }
