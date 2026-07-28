import type { Report, Profile } from '../types';
import { PageHeader } from '../components/PageHeader';
import { ScoreRing } from '../components/ScoreRing';
import { Card, SectionTitle } from '../components/Card';
import { StatusBadge } from '../components/Badges';
import { daysUntilDeadline } from '../lib/engine';
import { ArrowRight, CalendarClock, TrendingUp, TriangleAlert as AlertTriangle, ShieldCheck, FileCheck as FileCheck2, Ban, Activity } from 'lucide-react';

export function Dashboard({
  report,
  profile,
  opportunityTitle,
  deadline,
  onResolve,
  onNavigate,
}: {
  report: Report;
  profile: Profile;
  opportunityTitle: string;
  deadline: string;
  onResolve: (id: string) => void;
  onNavigate: (key: string) => void;
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
        sub={`Closes ${new Date(deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} · ${days} days remaining`}
        actions={<button className="btn btn-ghost" onClick={() => onNavigate('readiness')}><TrendingUp size={15} />View full report</button>}
      />

      <section className="hero-grid">
        <Card className="hero-score">
          <p className="eyebrow">Readiness score</p>
          <ScoreRing value={report.readiness} />
          <p className="hero-score-sub">{completed} of {report.requirements.length} verified</p>
        </Card>

        <Card className={`hero-risk ${riskTone}`}>
          <div className="hero-risk-head">
            <AlertTriangle size={18} />
            <b>{report.risk} deadline risk</b>
          </div>
          <p>{report.riskReasons.join(' ')}</p>
          <div className="risk-meter">
            <i style={{ width: `${report.readiness}%` }} />
          </div>
        </Card>

        <Card className="hero-action">
          <p className="eyebrow">Next best action</p>
          <b className="hero-action-title">{action?.action || 'Ready to submit'}</b>
          <p>{action?.reason}</p>
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
        <Card className="metric"><FileCheck2 size={18} /><b>{completed}</b><span>Completed</span></Card>
        <Card className="metric"><AlertTriangle size={18} /><b>{missing}</b><span>Missing documents</span></Card>
        <Card className="metric"><Ban size={18} /><b>{report.blockers.length}</b><span>Critical blockers</span></Card>
        <Card className="metric"><CalendarClock size={18} /><b>{days}</b><span>Days remaining</span></Card>
      </section>

      <section className="two-col">
        <Card>
          <SectionTitle hint={`${report.requirements.length} steps`}>Opportunity timeline</SectionTitle>
          <ul className="timeline">
            {report.requirements.map((x) => (
              <li key={x.id} className="timeline-item">
                <span className={`dot dot-${x.status}`} />
                <div className="timeline-text">
                  <b>{x.title}</b>
                  <p>{x.type} · {Math.round(x.confidence * 100)}% confidence</p>
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
              <p>{report.requirements.filter((r) => r.status === 'completed').length} requirements completed, {report.requirements.length - completed} remaining.</p>
            </div>
          </div>
        </Card>
      </section>
    </>
  );
}
