import type { Requirement, Document, Profile, Report, Match, Recommendation, Blocker, Contradiction } from '../types';

const weights: Record<string, number> = { critical: 32, high: 22, medium: 12, low: 6 };

export function computeReadiness(requirements: Requirement[]): number {
  const total = requirements.reduce((n, r) => n + (weights[r.priority] ?? 6), 0);
  const earned = requirements.reduce(
    (n, r) => n + (r.status === 'completed' ? (weights[r.priority] ?? 6) : 0),
    0,
  );
  return total > 0 ? Math.round((earned / total) * 100) : 0;
}

export function computeRisk(requirements: Requirement[]): 'low' | 'medium' | 'high' {
  const urgent = requirements.filter(
    (r) => r.priority === 'critical' && r.status !== 'completed',
  ).length;
  if (urgent >= 2) return 'high';
  if (urgent === 1) return 'medium';
  return 'low';
}

export function computeBlockers(requirements: Requirement[]): Blocker[] {
  return requirements
    .filter((r) => r.status === 'blocked' && r.dependencies.length > 0)
    .map((r) => ({ title: r.title, chain: r.dependencies, risk: r.priority === 'critical' ? 'high' : 'medium' as 'high' | 'medium' }));
}

export function computeMatches(
  requirements: Requirement[],
  documents: Document[],
  profile: Profile,
): Match[] {
  return requirements.map((r) => {
    const doc = documents.find(
      (d) =>
        d.category.toLowerCase().includes(r.type.toLowerCase()) ||
        r.id.toLowerCase().includes(d.category.toLowerCase().split(' ')[0]) ||
        d.name.toLowerCase().includes(r.id.toLowerCase()),
    );
    if (r.status === 'completed' || (doc && doc.verificationStatus === 'verified')) {
      if (r.id === 'eligibility') {
        return {
          requirementId: r.id,
          evidence: `Profile: ${profile.degree}, Year ${profile.year}`,
          confidence: 0.98,
          verified: true,
          explanation: 'Enrollment details from your profile meet the stated eligibility criteria.',
        };
      }
      if (doc) {
        return {
          requirementId: r.id,
          evidence: doc.name,
          confidence: 0.95,
          verified: doc.verificationStatus === 'verified',
          explanation: `Verified ${doc.category.toLowerCase()} document is present in your evidence vault.`,
        };
      }
    }
    return {
      requirementId: r.id,
      evidence: 'No matching evidence',
      confidence: 0,
      verified: false,
      explanation: `No verified document found for "${r.title}". Upload one to complete this requirement.`,
    };
  });
}

export function computeContradictions(
  documents: Document[],
  profile: Profile,
): Contradiction[] {
  const contradictions: Contradiction[] = [];
  const transcriptDoc = documents.find((d) => d.category.toLowerCase().includes('transcript'));
  if (transcriptDoc) {
    const tcgpa = transcriptDoc.extractedText.match(/CGPA:\s*([\d.]+)/)?.[1];
    if (tcgpa && tcgpa !== profile.cgpa) {
      contradictions.push({
        field: 'CGPA',
        values: [`Resume/Profile: ${profile.cgpa}`, `Official transcript: ${tcgpa}`],
        action: 'Confirm the official transcript value before submitting.',
      });
    }
  }
  return contradictions;
}

export function computeRecommendations(requirements: Requirement[]): Recommendation[] {
  return requirements
    .filter((r) => r.status !== 'completed')
    .sort((a, b) => (weights[b.priority] ?? 6) - (weights[a.priority] ?? 6))
    .slice(0, 3)
    .map((r) => ({
      action:
        r.type === 'document'
          ? `Upload ${r.title.toLowerCase()}`
          : r.type === 'approval'
            ? `Start ${r.title.toLowerCase()} workflow`
            : `Complete ${r.title.toLowerCase()}`,
      impact: weights[r.priority] ?? 6,
      reason: r.description,
      urgency: r.priority === 'critical' ? 'Now' : r.priority === 'high' ? 'Today' : 'This week',
    }));
}

export function buildReport(
  requirements: Requirement[],
  documents: Document[],
  profile: Profile,
  deadline?: string,
): Report {
  const readiness = computeReadiness(requirements);
  const risk = computeRisk(requirements);
  const blockers = computeBlockers(requirements);
  const matches = computeMatches(requirements, documents, profile);
  const contradictions = computeContradictions(documents, profile);
  const recommendations = computeRecommendations(requirements);

  const hasDeadline = !!deadline && !isNaN(new Date(deadline).getTime());
  const daysLeft = hasDeadline ? Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  const riskReasons: string[] = [];
  if (hasDeadline && daysLeft !== null) {
    riskReasons.push(`${daysLeft} days remain before the application closes.`);
  } else {
    riskReasons.push('Deadline not detected for this opportunity.');
  }
  riskReasons.push(...blockers.map((b) => `${b.title} has ${b.chain.length} approval steps blocking it.`));

  return {
    readiness,
    requirements,
    documents,
    matches,
    risk,
    riskReasons,
    blockers,
    contradictions,
    recommendations,
  };
}

export function normalizeNotice(text: string): Requirement[] {
  const trimmed = (text || '').trim();
  if (!trimmed || trimmed.length < 20) return [];

  const paragraphs = trimmed.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const sentences: string[] = [];
  paragraphs.forEach((p) => {
    const s = p.match(/[^.!?]+[.!?]?/g) || [p];
    s.forEach((ss) => sentences.push(ss.trim()));
  });

  const found: { id: string; title: string; type: string; priority: any; sentence: string; paragraph: string; confidence: number }[] = [];

  const pushIfNotExists = (id: string, title: string, type: string, priority: any, sentence: string, paragraph: string, confidence: number) => {
    if (!found.some((f) => f.id === id)) found.push({ id, title, type, priority, sentence, paragraph, confidence });
  };

  sentences.forEach((s, idx) => {
    const lower = s.toLowerCase();
    const para = paragraphs.find((p) => p.includes(s)) || '';

    if (/resume|cv\b/.test(lower)) pushIfNotExists('resume', 'Resume', 'document', 'high', s, para, 0.9);
    if (/cover letter/.test(lower)) pushIfNotExists('cover_letter', 'Cover Letter', 'document', 'high', s, para, 0.9);
    if (/transcript|marksheet|mark sheet|academic transcript/.test(lower)) pushIfNotExists('transcript', 'Official transcript', 'document', 'critical', s, para, 0.95);
    if (/endorse|endorsement|signed by|institute endorsement|principal signature|institutional seal/.test(lower)) pushIfNotExists('endorsement', 'Institute endorsement', 'approval', 'critical', s, para, 0.9);
    if (/submit (your )?application|submission deadline|submit by|last date to submit|apply by/.test(lower)) pushIfNotExists('submission', 'Submit application', 'submission', 'high', s, para, 0.85);
    if (/cgpa|gpa|grade point/.test(lower)) pushIfNotExists('eligibility', 'Eligibility (CGPA)', 'eligibility', 'critical', s, para, 0.8);
    if (/bonafide|bonafide certificate/.test(lower)) pushIfNotExists('bonafide', 'Bonafide certificate', 'document', 'high', s, para, 0.85);
    if (/photograph|passport photo|photo/.test(lower)) pushIfNotExists('photo', 'Photograph', 'document', 'low', s, para, 0.7);
    if (/recommendation|reference letter/.test(lower)) pushIfNotExists('recommendation', 'Recommendation letter', 'document', 'high', s, para, 0.85);
  });

  // Map found to Requirement[]
  const reqs: Requirement[] = found.map((f) => ({
    id: f.id,
    title: f.title,
    description: f.sentence,
    type: f.type,
    priority: f.priority as any,
    status: f.type === 'document' ? 'missing' : 'pending',
    sourceText: `${f.sentence} — ${f.paragraph}`,
    confidence: f.confidence,
    dependencies: [],
  }));

  return reqs;
}

export function daysUntilDeadline(deadline: string): number {
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}
