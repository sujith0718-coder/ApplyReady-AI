import React, { KeyboardEvent } from 'react';
import { CalendarClock, ArrowRight, Zap } from 'lucide-react';

export function OpportunityCard({ id, activeId, title, organization, deadline, readiness, risk, onAction }: { id?: string; activeId?: string | null; title: string; organization?: string; deadline?: string; readiness: number; risk: string; onAction?: () => void; }) {
  const hasDeadline = deadline && !isNaN(new Date(deadline).getTime());
  let daysDisplay = 'Not detected';
  if (hasDeadline) {
    const days = Math.max(0, Math.ceil((new Date(deadline!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    daysDisplay = `${days} days`;
  }

  const isActive = id && activeId && id === activeId;

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onAction && onAction();
    }
  };

  return (
    <article
      className={`opportunity-card card ${isActive ? 'active' : ''}`}
      tabIndex={0}
      role="button"
      aria-pressed={!!isActive}
      aria-label={`Opportunity ${title}`}
      onClick={() => onAction && onAction()}
      onKeyDown={handleKey}
    >
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
          <CalendarClock size={14} /> <small className="muted">{daysDisplay}</small>
          <span className={`op-risk tag-${risk}`}>{risk}</span>
        </div>
        <div className="op-actions">
          <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); onAction && onAction(); }}><Zap size={14} /> Next action</button>
          <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); onAction && onAction(); }} aria-label="Open opportunity"><ArrowRight size={14} /></button>
        </div>
      </div>
    </article>
  );
}
