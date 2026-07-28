import React, { useMemo } from 'react';
import { ScoreRing } from './ScoreRing';
import type { Report } from '../types';
import { CalendarClock } from 'lucide-react';

export function ReadinessCard({ report, deadline }: { report: Report; deadline?: string }) {
  const completed = useMemo(() => report.requirements.filter((x) => x.status === 'completed').length, [report.requirements]);
  const pending = useMemo(() => report.requirements.filter((x) => x.status === 'pending').length, [report.requirements]);
  const blocked = useMemo(() => report.requirements.filter((x) => x.status === 'blocked').length, [report.requirements]);
  const needsReview = useMemo(() => report.requirements.filter((x) => x.status === 'needs_review').length, [report.requirements]);

  return (
    <article className="card readiness-card" aria-label="Readiness summary">
      <div className="readiness-top">
        <div className="readiness-ring">
          <ScoreRing value={report.readiness} size={150} />
        </div>
        <div className="readiness-meta">
          <div className="readiness-row">
            <div>
              <small className="muted">Confidence</small>
              <div className="readiness-value">{Math.round((report.requirements.reduce((s, r) => s + (r.confidence || 0), 0) / Math.max(1, report.requirements.length)) * 100)}%</div>
            </div>
            <div>
              <small className="muted">Risk</small>
              <div className="readiness-value">{report.risk}</div>
            </div>
            <div>
              <small className="muted"><CalendarClock size={12} /> Deadline</small>
              <div className="readiness-value">{deadline && !isNaN(new Date(deadline).getTime()) ? new Date(deadline).toLocaleDateString() : 'Not detected'}</div>
            </div>
          </div>
          <div className="readiness-stats">
            <div className="stat"><b>{completed}</b><span>Completed</span></div>
            <div className="stat"><b>{pending}</b><span>Pending</span></div>
            <div className="stat"><b>{blocked}</b><span>Blocked</span></div>
            <div className="stat"><b>{needsReview}</b><span>Needs review</span></div>
          </div>
        </div>
      </div>
    </article>
  );
}
