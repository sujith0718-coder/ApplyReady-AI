import React from 'react';
import { CalendarClock, ArrowRight, Zap } from 'lucide-react';
import type { Report } from '../types';

export function OpportunityCard({ title, organization, deadline, readiness, risk, onAction }: { title: string; organization?: string; deadline: string; readiness: number; risk: string; onAction?: () => void; }) {
  const days = Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  return (
    <article className="opportunity-card card" tabIndex={0} aria-label={`Opportunity ${title}`}>
      <div className="opportunity-top">
        <div>
          <h3 className="op-title">{title}</h3>
          {organization && <div className="muted op-org">{organization}</div>}
        </div>
        <div className="op-right">
          <div className={`op-readiness ${readiness >= 75 ? 'high' : readiness >= 40 ? 'mid' : 'low'}`}>{readiness}%</div>
        </div>
      </div>
      <div className="op-bottom">
        <div className="op-meta">
          <CalendarClock size={14} /> <small className="muted">{days} days</small>
          <span className={`op-risk tag-${risk}`}>{risk}</span>
        </div>
        <div className="op-actions">
          <button className="btn btn-sm" onClick={onAction}><Zap size={14} /> Next action</button>
          <button className="btn btn-ghost btn-sm" onClick={() => onAction && onAction()} aria-label="Open opportunity"><ArrowRight size={14} /></button>
        </div>
      </div>
    </article>
  );
}
