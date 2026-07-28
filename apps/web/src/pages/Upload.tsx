import { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { FileText, Sparkles, Loader as Loader2, CircleCheck as CheckCircle2 } from 'lucide-react';
import type { ToastState } from '../components/Toast';

export function Upload({
  onExtract,
  setToast,
  onNavigate,
}: {
  onExtract: (text: string) => Promise<boolean>;
  setToast: (t: ToastState) => void;
  onNavigate: (key: string) => void;
}) {
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (notice.length < 30) {
      setToast({ kind: 'error', message: 'Paste at least 30 characters of notice text.' });
      return;
    }
    setBusy(true);
    const ok = await onExtract(notice);
    setBusy(false);
    if (ok) {
      setToast({ kind: 'success', message: 'Requirements extracted and ready for review.' });
      onNavigate('requirements');
    }
  };

  return (
    <>
      <PageHeader eyebrow="Opportunity intake" title="Upload opportunity" sub="Paste a notice to create a structured requirement list." />
      <Card className="upload-card">
        <label className="field-label">
          <span><FileText size={15} /> Opportunity notice text</span>
          <textarea
            value={notice}
            onChange={(e) => setNotice(e.target.value)}
            placeholder="Paste a hackathon, internship, or scholarship notice…"
            rows={10}
          />
        </label>
        <p className="muted upload-hint">
          <Sparkles size={14} /> Text extraction is active. PDF, image, and URL import will be available with the connected document provider.
        </p>
        <div className="upload-actions">
          <span className="char-count">{notice.length} characters</span>
          <button className="btn btn-primary" onClick={submit} disabled={busy}>
            {busy ? <Loader2 size={15} className="spin" /> : <Sparkles size={15} />}
            {busy ? 'Extracting…' : 'Extract requirements'}
          </button>
        </div>
      </Card>
      <Card className="upload-checklist">
        <h2>What you can paste</h2>
        <ul>
          <li><CheckCircle2 size={15} />Hackathon participation notices</li>
          <li><CheckCircle2 size={15} />Internship eligibility criteria</li>
          <li><CheckCircle2 size={15} />Scholarship application instructions</li>
        </ul>
      </Card>
    </>
  );
}
