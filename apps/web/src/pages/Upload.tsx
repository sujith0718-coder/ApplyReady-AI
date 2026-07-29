import { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { FileText, Sparkles, Loader as Loader2, CircleCheck as CheckCircle2 } from 'lucide-react';
import type { ToastState } from '../components/Toast';

export function Upload({
  onExtract,
  setToast,
  onNavigate,
  createFromFile,
  createFromUrl,
}: {
  onExtract: (text: string) => Promise<boolean>;
  setToast: (t: ToastState) => void;
  onNavigate: (key: string) => void;
  createFromFile?: (file: File, category?: string) => Promise<any>;
  createFromUrl?: (url: string) => Promise<any>;
}) {
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'text'|'file'|'url'>('text');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');

  const submit = async () => {
    if (mode === 'text') {
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
    } else if (mode === 'file') {
      if (!file) { setToast({ kind: 'error', message: 'Please choose a file to upload.' }); return; }
      if (!createFromFile) { setToast({ kind: 'error', message: 'File import not available.' }); return; }
      setBusy(true);
      try {
        const created = await createFromFile(file);
        setToast({ kind: 'success', message: 'Opportunity created from file.' });
        onNavigate('requirements');
      } catch (e:any) {
        setToast({ kind: 'error', message: e?.message || 'File import failed.' });
      } finally { setBusy(false); }
    } else if (mode === 'url') {
      if (!url || !createFromUrl) { setToast({ kind: 'error', message: 'Please enter a valid URL.' }); return; }
      setBusy(true);
      try {
        const created = await createFromUrl(url);
        setToast({ kind: 'success', message: 'Opportunity created from URL.' });
        onNavigate('requirements');
      } catch (e:any) {
        setToast({ kind: 'error', message: e?.message || 'URL import failed.' });
      } finally { setBusy(false); }
    }
  };

  return (
    <>
      <PageHeader eyebrow="Opportunity intake" title="Upload opportunity" sub="Paste, upload, or import an opportunity notice." />
      <Card className="upload-card">
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button className={`chip ${mode==='text' ? 'active' : ''}`} onClick={() => setMode('text')}>Paste text</button>
          <button className={`chip ${mode==='file' ? 'active' : ''}`} onClick={() => setMode('file')}>Upload PDF / Image</button>
          <button className={`chip ${mode==='url' ? 'active' : ''}`} onClick={() => setMode('url')}>Import URL</button>
        </div>

        {mode === 'text' && (
          <label className="field-label">
            <span><FileText size={15} /> Opportunity notice text</span>
            <textarea
              value={notice}
              onChange={(e) => setNotice(e.target.value)}
              placeholder="Paste a hackathon, internship, or scholarship notice…"
              rows={10}
            />
          </label>
        )}

        {mode === 'file' && (
          <label className="field-label">
            <span><FileText size={15} /> Choose PDF or image</span>
            <input type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <p className="muted">PDF and image OCR supported. The file will be scanned and text extracted conservatively.</p>
          </label>
        )}

        {mode === 'url' && (
          <label className="field-label">
            <span><FileText size={15} /> Web page URL</span>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/opportunity" />
            <p className="muted">The page content will be extracted (main/article). Navigation and footer are ignored.</p>
          </label>
        )}

        <div className="upload-actions">
          <span className="char-count">{mode === 'text' ? `${notice.length} characters` : mode === 'file' ? (file ? file.name : 'No file selected') : url ? url : 'No URL'}</span>
          <button className="btn btn-primary" onClick={submit} disabled={busy}>
            {busy ? <Loader2 size={15} className="spin" /> : <Sparkles size={15} />}
            {busy ? 'Processing…' : mode === 'text' ? 'Extract requirements' : mode === 'file' ? 'Import file' : 'Import URL'}
          </button>
        </div>
      </Card>
      <Card className="upload-checklist">
        <h2>What you can paste or upload</h2>
        <ul>
          <li><CheckCircle2 size={15} />Hackathon participation notices</li>
          <li><CheckCircle2 size={15} />Internship eligibility criteria</li>
          <li><CheckCircle2 size={15} />Scholarship application instructions</li>
        </ul>
      </Card>
    </>
  );
}
