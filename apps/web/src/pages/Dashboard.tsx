import type { Report, Profile } from '../types';
import { PageHeader } from '../components/PageHeader';
import { ScoreRing } from '../components/ScoreRing';
import { Card, SectionTitle } from '../components/Card';
import { StatusBadge } from '../components/Badges';
import { daysUntilDeadline } from '../lib/engine';
import { ArrowRight, CalendarClock, TrendingUp, TriangleAlert as AlertTriangle, ShieldCheck, FileCheck as FileCheck2, Ban, Activity } from 'lucide-react';
import { ReadinessCard } from '../components/ReadinessCard';
import { OpportunityCard } from '../components/OpportunityCard';
import { MetricCard } from '../components/Metrics';
import React, { useMemo } from 'react';

export function Dashboard({
  report,
  profile,
  opportunityTitle,
  deadline,
  onResolve,
  onNavigate,
  opportunities,
  onSelectOpportunity,
  activeId,
}: {
  report: Report;
  profile: Profile;
  opportunityTitle: string;
  deadline: string;
  onResolve: (id: string) => void;
  onNavigate: (key: string) => void;
  opportunities: { id: string; title: string; deadline?: string; notice_text?: string }[];
  onSelectOpportunity: (id: string) => void;
  activeId?: string | null;
}) {
  const completed = report.requirements.filter((x) => x.status === 'completed').length;
  const missing = report.requirements.filter((x) => x.status === 'missing').length;
  const action = report.recommendations[0];
  const riskTone = report.risk === 'high' ? 'risk-high' : report.risk === 'medium' ? 'risk-mid' : 'risk-low';
  const days = daysUntilDeadline(deadline);
  const verifiedDocs = report.documents.filter((d) => d.verificationStatus === 'verified');

  return (
    <>
      <PageHeader
        eyebrow="Application workspace"
        title={opportunityTitle}
        sub={deadline && !isNaN(new Date(deadline).getTime()) ? `Closes ${new Date(deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} · ${days} days remaining` : 'Deadline: Not detected'}
        actions={<button className="btn btn-ghost" onClick={() => onNavigate('readiness')}><TrendingUp size={15} />View full report</button>}
      />

      <section className="hero-grid">
        <ReadinessCard report={report} deadline={deadline} />

        <Card className={`hero-risk ${riskTone}`}>
          <div className="hero-risk-head">
            <AlertTriangle size={18} />
            <b className="cap">{report.risk} deadline risk</b>
          </div>
          <p className="muted">{report.riskReasons.join(' ')}</p>
          <div className="risk-meter">
            <i style={{ width: `${100 - report.readiness}%` }} />
          </div>
        </Card>

        <Card className="hero-action">
          <p className="eyebrow">Next best action</p>
          <b className="hero-action-title">{action?.action || 'Ready to submit'}</b>
          <p className="muted">{action?.reason}</p>
          {action && (
            <button className="btn btn-primary" onClick={() => {
              const target = report.requirements.find((r) => action.action.toLowerCase().includes(r.id.toLowerCase()) || action.action.toLowerCase().includes(r.title.toLowerCase()));
              if (target) onResolve(target.id);
            }}>
              Resolve now <ArrowRight size={15} />
            </button>
          )}
        </Card>
      </section>

      <section className="metric-row">
        <MetricCard icon={<FileCheck2 size={20} />} value={<span>{completed}</span>} label="Completed" />
        <MetricCard icon={<AlertTriangle size={20} />} value={<span>{missing}</span>} label="Missing" />
        <MetricCard icon={<Ban size={20} />} value={<span>{report.blockers.length}</span>} label="Blockers" />
        <MetricCard icon={<CalendarClock size={20} />} value={<span>{days}d</span>} label="Deadline" />
      </section>

      <section className="two-col">
        <Card>
          <SectionTitle hint={`${report.requirements.length} steps`}>Opportunity timeline</SectionTitle>
          <ul className="timeline">
            {report.requirements.map((x) => (
              <li key={x.id} className="timeline-item" tabIndex={0}>
                <span className={`dot dot-${x.status}`} />
                <div className="timeline-text">
                  <b>{x.title}</b>
                  <p className="muted">{x.type} · {Math.round(x.confidence * 100)}% confidence</p>
                </div>
                <StatusBadge status={x.status} />
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <SectionTitle>Critical blockers</SectionTitle>
          {report.blockers.length === 0 ? (
            <p className="muted">No blockers detected. You're on track.</p>
          ) : (
            report.blockers.map((b) => (
              <div key={b.title} className="blocker-mini">
                <AlertTriangle size={16} className="blocker-icon" />
                <div>
                  <b>{b.title}</b>
                  <div className="chain">
                    {b.chain.map((s, i) => (
                      <span key={s} className="chain-step">{s}{i < b.chain.length - 1 && <i>→</i>}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
          <SectionTitle>Recent evidence</SectionTitle>
          <div className="recent-evidence">
            {verifiedDocs.map((d) => (
              <div key={d.id} className="evidence-item">
                <ShieldCheck size={15} />
                <span>{d.name}</span>
              </div>
            ))}
            {verifiedDocs.length === 0 && <p className="muted">No verified documents yet.</p>}
          </div>
          <div className="activity">
            <Activity size={16} />
            <div>
              <b>Latest activity</b>
              <p className="muted">{report.requirements.filter((r) => r.status === 'completed').length} requirements completed, {report.requirements.length - completed} remaining.</p>
            </div>
          </div>
        </Card>
      </section>

      <section style={{ marginTop: 20 }}>
        <SectionTitle>Other opportunities</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {opportunities.map((o) => (
            <OpportunityCard
              key={o.id}
              id={o.id}
              activeId={activeId ?? null}
              title={o.title || 'Untitled Opportunity'}
              organization=""
              deadline={o.deadline || ''}
              readiness={o.id === activeId ? report.readiness : 0}
              risk={report.risk}
              onAction={() => { onSelectOpportunity(o.id); onNavigate('readiness'); }}
            />
          ))}
          {opportunities.length === 0 && <div className="empty-col muted">No opportunities yet. Upload one to get started.</div>}
        </div>
      </section>
    </>
  );
}
