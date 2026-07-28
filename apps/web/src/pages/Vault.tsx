import { useState } from 'react';
import type { Report } from '../types';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Search, X, FileText, ShieldCheck, ShieldAlert, ShieldQuestionMark as ShieldQuestion, Plus } from 'lucide-react';

const VERIFIED_ICON = { verified: ShieldCheck, unverified: ShieldAlert, needs_review: ShieldQuestion } as const;

export function Vault({
  report,
  onAddTranscript,
}: {
  report: Report;
  onAddTranscript: () => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = report.documents.filter((x) => x.name.toLowerCase().includes(search.toLowerCase()) || x.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <PageHeader
        eyebrow="Evidence vault"
        title="Evidence vault"
        sub="Evidence is matched only when a verified document is present."
        actions={<button className="btn btn-primary" onClick={onAddTranscript}><Plus size={15} />Add transcript</button>}
      />
      <div className="toolbar">
        <div className="search-wrap">
          <Search size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documents" aria-label="Search documents" />
          {search && <button className="search-clear" onClick={() => setSearch('')} aria-label="Clear search"><X size={14} /></button>}
        </div>
        <span className="toolbar-count">{filtered.length} documents</span>
      </div>

      {filtered.length === 0 ? (
        <Card className="empty-state">No documents match your search.</Card>
      ) : (
        <div className="doc-grid">
          {filtered.map((x) => {
            const Icon = VERIFIED_ICON[x.verificationStatus] ?? FileText;
            return (
              <Card key={x.id} className="doc-card">
                <div className="doc-icon-row">
                  <FileText size={20} />
                  <span className={`pill pill-${x.verificationStatus}`}>{x.verificationStatus.replace('_', ' ')}</span>
                </div>
                <h2>{x.name}</h2>
                <p className="muted">{x.category}</p>
                <small className="doc-extract">{x.extractedText}</small>
                <div className="doc-footer">
                  <Icon size={14} />
                  <span>{x.uploadedAt}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
