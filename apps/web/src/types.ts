export type Status = 'completed' | 'pending' | 'missing' | 'blocked' | 'needs_review';
export type Priority = 'critical' | 'high' | 'medium' | 'low';

export interface Requirement {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: Priority;
  status: Status;
  deadline?: string;
  sourceText: string;
  confidence: number;
  dependencies: string[];
}

export interface Document {
  id: string;
  name: string;
  category: string;
  verificationStatus: 'verified' | 'unverified' | 'needs_review';
  extractedText: string;
  uploadedAt: string;
}

export interface Match {
  requirementId: string;
  evidence: string;
  confidence: number;
  verified: boolean;
  explanation: string;
}

export interface Recommendation {
  action: string;
  impact: number;
  reason: string;
  urgency: 'Now' | 'Today' | 'This week';
}

export interface Blocker {
  title: string;
  chain: string[];
  risk: 'high' | 'medium';
}

export interface Contradiction {
  field: string;
  values: string[];
  action: string;
}

export interface Report {
  readiness: number;
  requirements: Requirement[];
  documents: Document[];
  matches: Match[];
  risk: 'low' | 'medium' | 'high';
  riskReasons: string[];
  blockers: Blocker[];
  contradictions: Contradiction[];
  recommendations: Recommendation[];
}

export interface Profile {
  name: string;
  degree: string;
  year: string;
  cgpa: string;
  skills: string;
}
