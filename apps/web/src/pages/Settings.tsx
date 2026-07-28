import { PageHeader } from '../components/PageHeader';
import { Card, SectionTitle } from '../components/Card';
import { Bot, Bell, Palette, Cpu, Check, Shield } from 'lucide-react';
import type { ToastState } from '../components/Toast';

export function Settings({ setToast }: { setToast: (t: ToastState) => void }) {
  return (
    <>
      <PageHeader eyebrow="Settings" title="Settings" sub="Account preferences and demo controls." />
      <div className="settings-grid">
        <Card>
          <div className="settings-head"><Bot size={18} /><h2>AI provider</h2></div>
          <p className="muted">Deterministic demo mode. API keys remain server-side and never reach the browser.</p>
          <div className="settings-status">
            <span className="pill pill-verified"><Shield size={13} /> verified</span>
            <span>Deterministic demo mode</span>
          </div>
        </Card>

        <Card>
          <div className="settings-head"><Bell size={18} /><h2>Notifications</h2></div>
          <p className="muted">Deadline and evidence reminders enabled.</p>
          <button className="btn btn-ghost btn-sm" onClick={() => setToast({ kind: 'info', message: 'Notification preference saved.' })}>Manage</button>
        </Card>

        <Card>
          <div className="settings-head"><Palette size={18} /><h2>Theme</h2></div>
          <p className="muted">Light theme selected for the demo.</p>
          <button className="btn btn-ghost btn-sm" onClick={() => setToast({ kind: 'info', message: 'Theme controls are coming with the next UI release.' })}>Theme preference</button>
        </Card>

        <Card>
          <div className="settings-head"><Cpu size={18} /><h2>System</h2></div>
          <ul className="settings-list">
            <li><Check size={14} /> Extraction engine: deterministic mock</li>
            <li><Check size={14} /> Evidence matching: profile + documents</li>
            <li><Check size={14} /> Persistence: in-memory demo</li>
          </ul>
        </Card>
      </div>
    </>
  );
}
