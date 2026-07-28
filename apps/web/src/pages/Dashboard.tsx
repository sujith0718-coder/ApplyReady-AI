import type { Report, Profile } from '../types';
import { PageHeader } from '../components/PageHeader';
import { ScoreRing } from '../components/ScoreRing';
import { Card, SectionTitle } from '../components/Card';
import { StatusBadge } from '../components/Badges';
import { ArrowRight, CalendarClock, TrendingUp, TriangleAlert as AlertTriangle, ShieldCheck, FileCheck as FileCheck2, Ban } from 'lucide-react';

export function Dashboard({
  report,
  profile,
  onResolve,
  onNavigate,
}: {
  report: Report;
  profile: Profile;
  onResolve: (id: string) => void;
  onNavigate: (key: string) => void;
}) {
  const completed = report.requirements.filter((x) => x.status === 'completed').length;
  const missing = report.requirements.filter((x) => x.status === 'missing').length;
  const action = report.recommendations[0];
  const riskTone = report.risk === 'high' ? 'risk-high' : report.risk === 'medium' ? 'risk-mid' : 'risk-low';

  return (
    <>
      <PageHeader
        eyebrow="Application workspace"
        title="National Student Innovation Hackathon"
        sub="Closes 15 August 2026 · 18 days remaining"
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
            <button className="btn btn-primary" onClick={() => onResolve(action.action.includes('transcript') ? 'transcript' : 'endorsement')}>
              Resolve now <ArrowRight size={15} />
            </button>
          )}
        </Card>
      </section>

      <section className="metric-row">
        <Card className="metric"><FileCheck2 size={18} /><b>{completed}</b><span>Completed</span></Card>
        <Card className="metric"><AlertTriangle size={18} /><b>{missing}</b><span>Missing documents</span></Card>
        <Card className="metric"><Ban size={18} /><b>{report.blockers.length}</b><span>Critical blockers</span></Card>
        <Card className="metric"><CalendarClock size={18} /><b>18</b><span>Days remaining</span></Card>
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
          <SectionTitle>Dependency preview</SectionTitle>
          <p className="muted">Approval workflow is the current critical path.</p>
          <div className="chain">
            {['Tutor', 'HOD', 'Principal', 'Seal'].map((s, i) => (
              <span key={s} className="chain-step">{s}{i < 3 && <i>→</i>}</span>
            ))}
          </div>
          <SectionTitle>Recent activity</SectionTitle>
          <div className="activity">
            <ShieldCheck size={16} />
            <div>
              <b>Evidence check complete</b>
              <p>Resume and identity card verified.</p>
            </div>
          </div>
        </Card>
      </section>
    </>
  );
}
