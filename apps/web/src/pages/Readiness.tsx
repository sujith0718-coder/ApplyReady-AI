import type { Report } from '../types';
import { PageHeader } from '../components/PageHeader';
import { Card, SectionTitle } from '../components/Card';
import { ScoreRing } from '../components/ScoreRing';
import { Printer, ArrowRight, TriangleAlert as AlertTriangle, Lightbulb, ArrowLeftRight } from 'lucide-react';

export function Readiness({
  report,
  onResolve,
}: {
  report: Report;
  onResolve: (id: string) => void;
}) {
  const docPct = report.requirements.some((x) => x.id === 'transcript' && x.status === 'completed') ? 100 : 40;
  const approvalPct = report.blockers.length ? 15 : 100;

  return (
    <>
      <PageHeader
        eyebrow="Readiness report"
        title="Readiness report"
        sub="A decision-ready map of evidence, risk, blockers, and recommendations."
        actions={<button className="btn btn-ghost" onClick={() => window.print()}><Printer size={15} />Print report</button>}
      />

      <section className="report-hero">
        <Card className="report-ring-card">
          <ScoreRing value={report.readiness} size={148} />
        </Card>
        <Card className="report-bars-card">
          <SectionTitle>Evidence-backed readiness</SectionTitle>
          <p className="muted">Critical documents and approvals receive the most weight. Nothing is marked complete from a weak inference.</p>
          <div className="bars">
            <span className="bar-row"><label>Eligibility</label><i style={{ width: '100%' }} /></span>
            <span className="bar-row"><label>Documents</label><i style={{ width: `${docPct}%` }} /></span>
            <span className="bar-row"><label>Approvals</label><i style={{ width: `${approvalPct}%` }} /></span>
          </div>
        </Card>
      </section>

      <section className="two-col">
        {report.blockers.length > 0 && (
          <Card className="blocker-card">
            <p className="eyebrow eyebrow-warn">Hidden blocker</p>
            <h2>{report.blockers[0].title}</h2>
            <div className="chain">
              {report.blockers[0].chain.map((s, i) => (
                <span key={s} className="chain-step">{s}{i < report.blockers[0].chain.length - 1 && <i>→</i>}</span>
              ))}
            </div>
            <button className="btn btn-primary" onClick={() => onResolve('endorsement')}>
              Start workflow <ArrowRight size={15} />
            </button>
          </Card>
        )}
        <Card className={report.blockers.length === 0 ? 'full-span' : ''}>
          <SectionTitle>Recommendations</SectionTitle>
          {report.recommendations.map((x) => (
            <div className="rec-row" key={x.action}>
              <Lightbulb size={16} />
              <div>
                <b>{x.action} <em>+{x.impact}%</em></b>
                <p>{x.reason}</p>
              </div>
            </div>
          ))}
          <button className="btn btn-ghost" onClick={() => window.print()}><Printer size={15} />Download / print report</button>
        </Card>
      </section>

      {report.contradictions.length > 0 && (
        <section className="contradiction-list">
          {report.contradictions.map((x) => (
            <Card key={x.field} className="review-card">
              <div className="review-head"><ArrowLeftRight size={16} /><b>{x.field} needs review</b></div>
              <p>{x.values.join(' vs ')}. {x.action}</p>
            </Card>
          ))}
        </section>
      )}
    </>
  );
}
