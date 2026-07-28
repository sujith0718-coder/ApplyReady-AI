import { useState } from 'react';
import type { Report } from '../types';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { StatusBadge, PriorityTag } from '../components/Badges';
import { Search, ArrowRight, X, ChevronDown as Chevron, ShieldCheck, ShieldAlert } from 'lucide-react';

export function Requirements({
  report,
  onResolve,
}: {
  report: Report;
  onResolve: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = report.requirements.filter((x) => {
    const matchesSearch = x.title.toLowerCase().includes(search.toLowerCase()) || x.description.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || x.status === filter;
    return matchesSearch && matchesFilter;
  });

  const filters: { key: string; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: report.requirements.length },
    { key: 'missing', label: 'Missing', count: report.requirements.filter((x) => x.status === 'missing').length },
    { key: 'blocked', label: 'Blocked', count: report.requirements.filter((x) => x.status === 'blocked').length },
    { key: 'pending', label: 'Pending', count: report.requirements.filter((x) => x.status === 'pending').length },
    { key: 'completed', label: 'Completed', count: report.requirements.filter((x) => x.status === 'completed').length },
  ];

  const matchFor = (reqId: string) => report.matches.find((m) => m.requirementId === reqId);

  return (
    <>
      <PageHeader eyebrow="Requirements" title="Requirements" sub="Source-linked, confidence-aware application requirements." />
      <div className="toolbar">
        <div className="search-wrap">
          <Search size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search requirements" aria-label="Search requirements" />
          {search && <button className="search-clear" onClick={() => setSearch('')} aria-label="Clear search"><X size={14} /></button>}
        </div>
        <div className="filter-chips">
          {filters.map((f) => (
            <button key={f.key} className={`chip ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>
              {f.label} <span className="chip-count">{f.count}</span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="empty-state">No requirements match your search.</Card>
      ) : (
        <div className="req-list">
          {filtered.map((x) => {
            const match = matchFor(x.id);
            const isOpen = expanded === x.id;
            return (
              <Card key={x.id} className="req-card">
                <div className="req-main">
                  <StatusBadge status={x.status} />
                  <h2>{x.title}</h2>
                  <p className="muted">{x.description}</p>
                  <div className="tag-row">
                    <PriorityTag priority={x.priority} />
                    <span className="tag tag-neutral">{x.type}</span>
                    <span className="tag tag-neutral">{Math.round(x.confidence * 100)}% confidence</span>
                  </div>
                  {match && (
                    <button className="req-expand" onClick={() => setExpanded(isOpen ? null : x.id)}>
                      <span className="match-preview">
                        {match.verified ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                        {match.evidence}
                      </span>
                      <Chevron size={16} className={isOpen ? 'chev-open' : ''} />
                    </button>
                  )}
                  {isOpen && match && (
                    <div className="match-detail">
                      <div className="match-row"><b>Confidence</b><span>{Math.round(match.confidence * 100)}%</span></div>
                      <div className="match-row"><b>Verified</b><span>{match.verified ? 'Yes' : 'No'}</span></div>
                      <div className="match-row"><b>Reason</b><span>{match.explanation}</span></div>
                      <div className="match-row"><b>Source text</b><span className="req-source">{x.sourceText}</span></div>
                    </div>
                  )}
                </div>
                <aside className="req-aside">
                  <b>Dependencies</b>
                  <small>{x.dependencies.length ? x.dependencies.join(' → ') : 'No dependencies'}</small>
                  {x.status !== 'completed' && (
                    <button className="btn btn-primary btn-sm" onClick={() => onResolve(x.id)}>
                      Take action <ArrowRight size={14} />
                    </button>
                  )}
                </aside>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
