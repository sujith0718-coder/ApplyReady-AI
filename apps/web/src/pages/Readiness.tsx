import { useState, useMemo } from 'react';
import type { Report } from '../types';
import { PageHeader } from '../components/PageHeader';
import { Card, SectionTitle } from '../components/Card';
import { ScoreRing } from '../components/ScoreRing';
import { StatusBadge } from '../components/Badges';
import { Printer, ArrowRight, TriangleAlert as AlertTriangle, Lightbulb, ArrowLeftRight, ChevronDown as Chevron, Sparkles, Network } from 'lucide-react';

// Helper types
type ScoreComponent = { name: string; weight: number; earned: number; reason: string; confidence: number };

export function Readiness({
  report,
  onResolve,
}: {
  report: Report;
  onResolve: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  // Score breakdown calculation (weights sum to 100)
  const breakdown = useMemo(() => {
    const weights = { eligibility: 25, documents: 35, approvals: 20, deadline: 20 };
    // Eligibility: percent of eligibility-type requirements completed
    const eligibilityReqs = report.requirements.filter((r) => r.type === 'eligibility');
    const eligibilityCompleted = eligibilityReqs.filter((r) => r.status === 'completed').length;
    const eligibilityPct = eligibilityReqs.length ? Math.round((eligibilityCompleted / eligibilityReqs.length) * 100) : 100;

    // Documents: percent of document-type requirements completed (weighted by confidence)
    const docReqs = report.requirements.filter((r) => r.type === 'document');
    const docCompleted = docReqs.filter((r) => r.status === 'completed').length;
    const docPct = docReqs.length ? Math.round((docCompleted / docReqs.length) * 100) : 100;

    // Approvals: inverse of number of blockers relative to total (simple heuristic)
    const blockers = report.blockers.length;
    const approvalsScore = blockers === 0 ? 100 : Math.max(10, 100 - blockers * 35);

    // Deadline: days until deadline vs remaining work
    const daysLeft = (() => {
      const o = report; // no op, keep signature
      return  Math.max(0, Math.ceil((new Date(report.requirements[0]?.deadline ?? Date.now()).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    })();
    // fallback: use 14 days if none
    const deadlineDays = Math.max(0, ((): number => {
      try {
        const d = new Date(report.requirements.length ? report.requirements[0].deadline || Date.now() : Date.now());
        return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      } catch { return 14; }
    })());
    const remainingItems = report.requirements.filter((r) => r.status !== 'completed').length;
    const estNeededDays = Math.max(1, Math.ceil(remainingItems * 0.5)); // heuristic: 0.5 day per item
    let deadlineScore = 100;
    if (deadlineDays <= 0) deadlineScore = 0;
    else deadlineScore = Math.max(0, Math.min(100, Math.round((deadlineDays / Math.max(estNeededDays, deadlineDays)) * 100)));

    const components: ScoreComponent[] = [
      { name: 'Eligibility', weight: weights.eligibility, earned: eligibilityPct, reason: `${eligibilityCompleted}/${eligibilityReqs.length} eligibility checks passed`, confidence: eligibilityReqs.length ? Math.round((eligibilityReqs.reduce((s, r) => s + (r.confidence || 0), 0) / eligibilityReqs.length) * 100) : 90 },
      { name: 'Documents', weight: weights.documents, earned: docPct, reason: `${docCompleted}/${docReqs.length} documents present`, confidence: docReqs.length ? Math.round((docReqs.reduce((s, r) => s + (r.confidence || 0), 0) / docReqs.length) * 100) : 80 },
      { name: 'Approvals', weight: weights.approvals, earned: approvalsScore, reason: blockers ? `${blockers} blocking approval step(s)` : 'No approval blockers', confidence: blockers ? 65 : 90 },
      { name: 'Deadline', weight: weights.deadline, earned: deadlineScore, reason: `${remainingItems} items vs ${deadlineDays} days left (est ${estNeededDays} days needed)`, confidence: 70 },
    ];

    const final = Math.round(components.reduce((sum, c) => sum + (c.earned * c.weight) / 100, 0));

    return { components, final };
  }, [report]);

  // Requirement timeline sorting: critical blockers first, then blocked, needs_review, pending, completed
  const timeline = useMemo(() => {
    const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    const statusOrder: Record<string, number> = { blocked: 0, needs_review: 1, pending: 2, missing: 3, completed: 4 };
    return [...report.requirements].sort((a, b) => {
      const aCritical = a.priority === 'critical' ? 0 : 1;
      const bCritical = b.priority === 'critical' ? 0 : 1;
      if (aCritical !== bCritical) return aCritical - bCritical;
      const sa = statusOrder[a.status] ?? 10;
      const sb = statusOrder[b.status] ?? 10;
      if (sa !== sb) return sa - sb;
      const pa = priorityOrder[a.priority] ?? 5;
      const pb = priorityOrder[b.priority] ?? 5;
      if (pa !== pb) return pa - pb;
      return (a.title || '').localeCompare(b.title || '');
    });
  }, [report.requirements]);

  // Smart single recommendation generator (deterministic heuristics)
  const recommendation = useMemo(() => {
    // If there are blockers, recommend the top blocker resolution
    if (report.blockers && report.blockers.length > 0) {
      const b = report.blockers[0];
      const blockingNode = b.chain && b.chain.length ? b.chain[0] : null;
      const daysLeft = Math.max(0, Math.ceil((Date.now() - Date.now()) / (1000 * 60 * 60 * 24)));
      return {
        text: `${b.title} is blocking submission. Prioritize resolving ${blockingNode ?? 'approval'} now.`,
        reason: `This blocker (${b.title}) prevents final approval and typically requires dependent approvals: ${b.chain.join(' → ')}`,
        dependencies: b.chain,
        impact: Math.min(40, Math.max(10, 20 + (b.chain.length * 5))),
        timeMinutes: 60 * Math.max(1, b.chain.length),
        priority: 'High',
      };
    }

    // Else pick the highest priority pending requirement
    const pending = report.requirements.filter((r) => r.status !== 'completed').sort((a, b) => (a.priority === b.priority ? b.confidence - a.confidence : (a.priority === 'critical' ? -1 : 1)));
    if (pending.length > 0) {
      const top = pending[0];
      const deps = top.dependencies ?? [];
      return {
        text: `Complete "${top.title}" — it's ${top.priority} priority and improves readiness.`,
        reason: `Requirement confidence ${Math.round(top.confidence * 100)}%. ${deps.length ? `Depends on: ${deps.join(' → ')}` : 'No dependencies detected.'}`,
        dependencies: deps,
        impact: top.priority === 'critical' ? 30 : top.priority === 'high' ? 20 : 10,
        timeMinutes: top.type === 'document' ? 30 : 120,
        priority: top.priority === 'critical' ? 'High' : top.priority === 'high' ? 'Medium' : 'Low',
      };
    }

    return { text: 'All items completed or no actionable recommendation', reason: '', dependencies: [], impact: 0, timeMinutes: 5, priority: 'Low' };
  }, [report]);

  // Deadline intelligence
  const deadlineIntelligence = useMemo(() => {
    const daysLeft = (() => {
      // find opportunity deadline if present in document or requirements; fallback: 14 days
      const guess = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);
      return Math.max(0, Math.ceil((guess.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    })();
    const remaining = report.requirements.filter((r) => r.status !== 'completed').length;
    const estDays = Math.max(1, Math.ceil(remaining * 0.5));
    const risk = estDays > daysLeft ? 'High' : estDays === daysLeft ? 'Medium' : 'Low';
    const explanation = `Estimated remaining work: ${remaining} items (${estDays} days). Approval delays: ${report.blockers.length} blocker(s) may add days. Submission risk: ${risk}.`;
    return { daysLeft, remaining, estDays, risk, explanation };
  }, [report]);

  // Enhanced contradictions mapping
  const contradictions = useMemo(() => report.contradictions.map((c) => {
    const severity = c.field.toLowerCase().includes('cgpa') || c.field.toLowerCase().includes('endorse') ? 'High' : 'Medium';
    const suggestion = c.field.toLowerCase().includes('cgpa') ? 'Update resume or upload official transcript.' : c.field.toLowerCase().includes('name') ? 'Confirm your profile name matches documents.' : 'Please upload the missing or corrected document.';
    return { ...c, severity, suggestion };
  }), [report.contradictions]);

  return (
    <>
      <PageHeader
        eyebrow="Readiness report"
        title="Readiness report"
        sub="Explainable readiness, dependency chains, and a single prioritized action to get you submission-ready."
        actions={<button className="btn btn-ghost" onClick={() => window.print()}><Printer size={15} />Print report</button>}
      />

      <section className="report-hero">
        <Card className="report-ring-card">
          <ScoreRing value={breakdown.final} size={148} />
          <div style={{ marginTop: 8, textAlign: 'center' }}>
            <div className="muted">Overall Readiness</div>
            <div style={{ fontFamily: 'Fraunces', fontSize: 18, fontWeight: 700 }}>{breakdown.final}%</div>
          </div>
        </Card>

        <Card className="report-bars-card">
          <SectionTitle>Explainable score</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {breakdown.components.map((c) => (
              <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: '0 0 100px' }}><b>{c.name}</b></div>
                <div style={{ flex: '1 1 auto' }}>
                  <div className="bar-row"><label>{c.reason}</label><i style={{ width: `${c.earned}%` }} /><small>{c.earned}%</small></div>
                </div>
                <div style={{ flex: '0 0 80px', textAlign: 'right' }}><small className="muted">Conf: {c.confidence}%</small></div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <Card className="ai-explanation-card">
        <div className="ai-head"><Sparkles size={18} /><b>AI explanation</b></div>
        <p className="ai-text">The readiness score is a weighted combination of eligibility, documents, approvals, and deadline health. Each component shows why it earned its value and how confident the system is.</p>
      </Card>

      <section className="two-col">
        <Card>
          <SectionTitle>Requirement timeline</SectionTitle>
          <ul className="timeline" aria-label="Requirement timeline">
            {timeline.map((x) => (
              <li key={x.id} className="timeline-item" tabIndex={0}>
                <span className={`dot dot-${x.status}`} />
                <div className="timeline-text">
                  <b>{x.title}</b>
                  <p className="muted">{x.type} · {Math.round(x.confidence * 100)}% · {x.priority}</p>
                </div>
                <StatusBadge status={x.status} />
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <SectionTitle>Hidden dependency</SectionTitle>
          {report.blockers.length === 0 ? (
            <p className="muted">No hidden blockers detected.</p>
          ) : (
            report.blockers.map((b) => (
              <div key={b.title} style={{ marginBottom: 12 }}>
                <b>{b.title}</b>
                <div className="dep-graph">
                  {b.chain.map((n, i) => (
                    <div key={n} className={`dep-sequence`}>
                      <div className="dep-arrow">↓</div>
                      <div className={`dep-node ${i === 0 ? 'blocking' : ''}`}>{n}</div>
                    </div>
                  ))}
                </div>
                <div className="muted" style={{ marginTop: 6 }}>{b.chain.length ? `Blocking node: ${b.chain[0]}` : 'No chain available'}</div>
              </div>
            ))
          )}
        </Card>
      </section>

      <section className="two-col">
        <Card>
          <SectionTitle>Smart next best action</SectionTitle>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ flex: '1 1 auto' }}>
              <b>{recommendation.text}</b>
              <p className="muted">{recommendation.reason}</p>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <div className="tag-neutral">Impact: +{recommendation.impact}%</div>
                <div className="tag-neutral">Est time: {Math.round(recommendation.timeMinutes/60)}h</div>
                <div className="tag-neutral">Priority: {recommendation.priority}</div>
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => { if (recommendation.dependencies && recommendation.dependencies.length) alert('Follow dependencies: ' + recommendation.dependencies.join(' -> ')); }}>{recommendation.priority === 'High' ? 'Resolve now' : 'Plan'}</button>
          </div>
        </Card>

        <Card>
          <SectionTitle>Deadline intelligence</SectionTitle>
          <p className="muted">{deadlineIntelligence.explanation}</p>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <div className="tag-neutral">{deadlineIntelligence.remaining} items</div>
            <div className="tag-neutral">Est: {deadlineIntelligence.estDays} days</div>
            <div className={`tag-${deadlineIntelligence.risk === 'High' ? 'high' : deadlineIntelligence.risk === 'Medium' ? 'medium' : 'low'}`}>{deadlineIntelligence.risk} risk</div>
          </div>
        </Card>
      </section>

      <Card>
        <SectionTitle hint={`${report.requirements.length} items`}>Requirement detail (click to expand)</SectionTitle>
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
                {isOpen && (
                  <div className="matrix-detail">
                    <div className="match-row"><b>Original excerpt</b><span className="req-source">{r.sourceText}</span></div>
                    <div className="match-row"><b>AI interpretation</b><span>{r.description}</span></div>
                    {match ? (
                      <>
                        <div className="match-row"><b>Matched evidence</b><span>{match.evidence}</span></div>
                        <div className="match-row"><b>Match confidence</b><span>{Math.round(match.confidence * 100)}%</span></div>
                        <div className="match-row"><b>Explanation</b><span>{match.explanation}</span></div>
                        <div className="match-row"><b>Verified</b><span>{match.verified ? 'Yes' : 'No'}</span></div>
                      </>
                    ) : (
                      <div className="match-row"><b>Matched evidence</b><span>None</span></div>
                    )}
                    <div className="match-row"><b>Missing information</b><span>{r.status !== 'completed' ? 'Required document or approval' : 'None'}</span></div>
                    <div className="match-row"><b>Dependencies</b><span>{r.dependencies.length ? r.dependencies.join(' → ') : 'None'}</span></div>
                    <div className="match-row"><b>Reason for status</b><span>{r.status === 'completed' ? 'Verified by evidence' : r.status === 'blocked' ? 'Blocked by upstream approval' : 'Awaiting evidence or action'}</span></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {contradictions.length > 0 && (
        <section className="contradiction-list">
          {contradictions.map((x) => (
            <Card key={x.field} className="review-card">
              <div className="review-head"><ArrowLeftRight size={16} /><b>{x.field} — {x.severity}</b></div>
              <p>{x.values.join(' vs ')}.</p>
              <p className="muted">Suggested fix: {x.suggestion}</p>
            </Card>
          ))}
        </section>
      )}
    </>
  );
}
