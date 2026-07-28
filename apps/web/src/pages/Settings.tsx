import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Bot, Bell, Palette, Cpu, Check, Shield, Moon, Sun, Database, Trash2, RefreshCw } from 'lucide-react';
import type { ToastState } from '../components/Toast';

export function Settings({
  setToast,
  dark,
  onToggleDark,
}: {
  setToast: (t: ToastState) => void;
  dark: boolean;
  onToggleDark: () => void;
}) {
  return (
    <>
      <PageHeader eyebrow="Settings" title="Settings" sub="Account preferences and system controls." />
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
          <div className="settings-head"><Palette size={18} /><h2>Theme</h2></div>
          <p className="muted">Toggle between light and dark appearance.</p>
          <button className="btn btn-ghost btn-sm" onClick={onToggleDark}>
            {dark ? <Sun size={14} /> : <Moon size={14} />}
            {dark ? 'Switch to light' : 'Switch to dark'}
          </button>
        </Card>

        <Card>
          <div className="settings-head"><Bell size={18} /><h2>Notifications</h2></div>
          <p className="muted">Deadline and evidence reminders enabled.</p>
          <button className="btn btn-ghost btn-sm" onClick={() => setToast({ kind: 'info', message: 'Notification preference saved.' })}>Manage</button>
        </Card>

        <Card>
          <div className="settings-head"><Database size={18} /><h2>Database</h2></div>
          <p className="muted">Data persists via MongoDB and Mongoose through the Express REST API.</p>
          <div className="settings-list">
            <li><Check size={14} /> MongoDB + Mongoose (recommended)</li>
            <li><Check size={14} /> Express REST API endpoints</li>
            <li><Check size={14} /> Profiles, opportunities, requirements, documents</li>
          </div>
        </Card>

        <Card>
          <div className="settings-head"><Cpu size={18} /><h2>System</h2></div>
          <ul className="settings-list">
            <li><Check size={14} /> Extraction engine: deterministic mock</li>
            <li><Check size={14} /> Evidence matching: profile + documents</li>
            <li><Check size={14} /> Readiness engine: priority-weighted scoring</li>
          </ul>
        </Card>

        <Card className="settings-danger">
          <div className="settings-head"><Trash2 size={18} /><h2>Danger zone</h2></div>
          <p className="muted">Reset all demo data to its original seeded state.</p>
          <button className="btn btn-danger btn-sm" onClick={() => setToast({ kind: 'info', message: 'Use "Reset demo" in the sidebar to restore original state.' })}>
            <RefreshCw size={14} /> Reset demo data
          </button>
        </Card>
      </div>
    </>
  );
}
