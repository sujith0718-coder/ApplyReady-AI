import { useState } from 'react';
import type { Report } from '../types';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Search, X, FileText, ShieldCheck, ShieldAlert, ShieldQuestion, Plus, Trash2, Upload as UploadIcon, Loader as Loader2 } from 'lucide-react';

const VERIFIED_ICON = { verified: ShieldCheck, unverified: ShieldAlert, needs_review: ShieldQuestion } as const;

const CATEGORIES = ['Resume', 'Transcript', 'Certificate', 'Recommendation Letter', 'Endorsement', 'Identity'];

export function Vault({
  report,
  onUpload,
  onDeleteDoc,
  onResolve,
}: {
  report: Report;
  onUpload: (name: string, category: string) => Promise<void>;
  onDeleteDoc: (id: string) => Promise<void>;
  onResolve: (id: string) => Promise<void>;
}) {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadCat, setUploadCat] = useState('Resume');
  const [busy, setBusy] = useState(false);

  const filtered = report.documents.filter(
    (x) => x.name.toLowerCase().includes(search.toLowerCase()) || x.category.toLowerCase().includes(search.toLowerCase()),
  );

  const submitUpload = async () => {
    if (!uploadName.trim()) return;
    setBusy(true);
    await onUpload(uploadName.trim(), uploadCat);
    setBusy(false);
    setShowModal(false);
    setUploadName('');
    if (uploadCat === 'Transcript') onResolve('transcript');
  };

  return (
    <>
      <PageHeader
        eyebrow="Evidence vault"
        title="Evidence vault"
        sub="Evidence is matched only when a verified document is present."
        actions={<button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={15} />Add document</button>}
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
        <Card className="empty-state">
          <FileText size={32} className="empty-icon" />
          <p>No documents found. Upload your first evidence to get started.</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><UploadIcon size={15} />Upload document</button>
        </Card>
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
                  <span>{new Date(x.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  <button className="doc-delete" onClick={() => onDeleteDoc(x.id)} aria-label="Delete document">
                    <Trash2 size={13} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Upload document</h2>
              <button className="modal-close" onClick={() => setShowModal(false)} aria-label="Close"><X size={18} /></button>
            </div>
            <label className="field-label">
              <span><FileText size={15} /> Document name</span>
              <input value={uploadName} onChange={(e) => setUploadName(e.target.value)} placeholder="e.g. Official_Transcript.pdf" />
            </label>
            <label className="field-label">
              <span>Category</span>
              <select value={uploadCat} onChange={(e) => setUploadCat(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <p className="muted upload-modal-hint"><UploadIcon size={13} /> File upload connects to the document provider. Metadata is stored immediately.</p>
            <button className="btn btn-primary" onClick={submitUpload} disabled={busy || !uploadName.trim()}>
              {busy ? <Loader2 size={15} className="spin" /> : <UploadIcon size={15} />}
              {busy ? 'Uploading…' : 'Add to vault'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
