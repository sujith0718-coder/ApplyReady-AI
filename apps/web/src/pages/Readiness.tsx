import { useState } from 'react';
import type { Report } from '../types';
import { PageHeader } from '../components/PageHeader';
import { Card, SectionTitle } from '../components/Card';
import { ScoreRing } from '../components/ScoreRing';
import { StatusBadge } from '../components/Badges';
import { Printer, ArrowRight, TriangleAlert as AlertTriangle, Lightbulb, ArrowLeftRight, ChevronDown as Chevron, Sparkles, Network } from 'lucide-react';

export function Readiness({
  report,
  onResolve,
}: {
  report: Report;
  onResolve: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const completedDocs = report.requirements.filter((r) => r.type === 'document' && r.status === 'completed').length;
  const totalDocs = report.requirements.filter((r) => r.type === 'document').length;
  const docPct = totalDocs > 0 ? Math.round((completedDocs / totalDocs) * 100) : 0;
  const approvalPct = report.blockers.length ? 15 : 100;
  const eligibilityPct = report.requirements.filter((r) => r.type === 'eligibility' && r.status === 'completed').length > 0 ? 100 : 0;

  const aiExplanation = `Based on ${report.requirements.length} extracted requirements from your opportunity notice, ${report.requirements.filter((r) => r.status === 'completed').length} are verified with evidence. ${report.blockers.length} critical blocker${report.blockers.length === 1 ? '' : 's'} remain${report.blockers.length === 0 ? '' : 's'}. ${report.contradictions.length > 0 ? 'A data contradiction was detected that requires your review before submission.' : 'No contradictions detected.'} Confidence is weighted by priority — critical items carry the most readiness impact.`;

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
          <SectionTitle>Score breakdown</SectionTitle>
          <div className="bars">
            <span className="bar-row"><label>Eligibility</label><i style={{ width: `${eligibilityPct}%` }} /><small>{eligibilityPct}%</small></span>
            <span className="bar-row"><label>Documents ({completedDocs}/{totalDocs})</label><i style={{ width: `${docPct}%` }} /><small>{docPct}%</small></span>
            <span className="bar-row"><label>Approvals</label><i style={{ width: `${approvalPct}%` }} /><small>{approvalPct}%</small></span>
          </div>
        </Card>
      </section>

      <Card className="ai-explanation-card">
        <div className="ai-head"><Sparkles size={18} /><b>AI explanation</b></div>
        <p className="ai-text">{aiExplanation}</p>
      </Card>

      <section className="two-col">
        {report.blockers.length > 0 && (
          <Card className="blocker-card">
            <p className="eyebrow eyebrow-warn">Hidden blocker</p>
            <h2>{report.blockers[0].title}</h2>
            <div className="dep-graph">
              <div className="dep-node start">Start</div>
              {report.blockers[0].chain.map((s, i) => (
                <div key={s} className="dep-sequence">
                  <div className="dep-arrow">↓</div>
                  <div className="dep-node">{s}</div>
                </div>
              ))}
              <div className="dep-sequence">
                <div className="dep-arrow">↓</div>
                <div className="dep-node done">Ready</div>
              </div>
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
                <span className="rec-urgency">{x.urgency}</span>
              </div>
            </div>
          ))}
        </Card>
      </section>

      <Card>
        <SectionTitle hint={`${report.requirements.length} items`}>Requirement evidence matrix</SectionTitle>
        <div className="matrix">
          {report.requirements.map((r) => {
            const match = report.matches.find((m) => m.requirementId === r.id);
            const isOpen = expanded === r.id;
            return (
              <div key={r.id} className="matrix-row">
                <button className="matrix-head" onClick={() => setExpanded(isOpen ? null : r.id)}>
                  <StatusBadge status={r.status} />
                  <b>{r.title}</b>
                  <span className="matrix-conf">{Math.round(r.confidence * 100)}%</span>
                  <Chevron size={16} className={isOpen ? 'chev-open' : ''} />
                </button>
                {isOpen && match && (
                  <div className="matrix-detail">
                    <div className="match-row"><b>Evidence</b><span>{match.evidence}</span></div>
                    <div className="match-row"><b>Confidence</b><span>{Math.round(match.confidence * 100)}%</span></div>
                    <div className="match-row"><b>Verified</b><span>{match.verified ? 'Yes' : 'No'}</span></div>
                    <div className="match-row"><b>Reason</b><span>{match.explanation}</span></div>
                    <div className="match-row"><b>Source</b><span className="req-source">{r.sourceText}</span></div>
                    <div className="match-row"><b>Dependencies</b><span>{r.dependencies.length ? r.dependencies.join(' → ') : 'None'}</span></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

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
