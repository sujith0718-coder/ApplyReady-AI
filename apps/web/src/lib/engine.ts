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
  deadline: string,
): Report {
  const readiness = computeReadiness(requirements);
  const risk = computeRisk(requirements);
  const blockers = computeBlockers(requirements);
  const matches = computeMatches(requirements, documents, profile);
  const contradictions = computeContradictions(documents, profile);
  const recommendations = computeRecommendations(requirements);

  const daysLeft = Math.ceil(
    (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );

  const riskReasons: string[] = [
    `${daysLeft} days remain before the application closes.`,
    ...blockers.map((b) => `${b.title} has ${b.chain.length} approval steps blocking it.`),
  ];

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
  const source = text.slice(0, 160) || 'Submitted opportunity notice';
  return [
    { id: 'eligibility', title: 'Student eligibility', description: 'Must be a currently enrolled undergraduate student.', type: 'eligibility', priority: 'critical', status: 'completed', sourceText: source, confidence: 0.96, dependencies: [] },
    { id: 'transcript', title: 'Official transcript', description: 'Upload latest official academic transcript.', type: 'document', priority: 'critical', status: 'missing', sourceText: source, confidence: 0.98, dependencies: [] },
    { id: 'endorsement', title: 'Institute endorsement', description: 'Signed and sealed institute endorsement is mandatory.', type: 'approval', priority: 'critical', status: 'blocked', sourceText: source, confidence: 0.95, dependencies: ['Tutor approval', 'HOD approval', 'Principal signature', 'Institutional seal'] },
    { id: 'resume', title: 'Resume', description: 'Upload a current one-page resume.', type: 'document', priority: 'high', status: 'completed', sourceText: source, confidence: 0.94, dependencies: [] },
    { id: 'submission', title: 'Submit application', description: 'Complete final submission before deadline.', type: 'submission', priority: 'high', status: 'pending', sourceText: source, confidence: 0.91, dependencies: ['Official transcript', 'Institute endorsement'] },
  ];
}

export function daysUntilDeadline(deadline: string): number {
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}
