import { useEffect, useState, useCallback } from 'react';
import { Menu, Loader as Loader2, CircleAlert as AlertCircle } from 'lucide-react';
import type { Report, Profile } from './types';
import * as api from './api';
import { Sidebar } from './components/Sidebar';
import { Toast, type ToastState } from './components/Toast';
import { Dashboard } from './pages/Dashboard';
import { Upload } from './pages/Upload';
import { Requirements } from './pages/Requirements';
import { Vault } from './pages/Vault';
import { Readiness } from './pages/Readiness';
import { ProfilePage } from './pages/Profile';
import { Settings } from './pages/Settings';

export function App() {
  const [page, setPage] = useState('dashboard');
  const [report, setReport] = useState<Report | null>(null);
  const [profile, setProfile] = useState<Profile>({ name: 'Aarav Kumar', degree: 'B.Tech Computer Science', year: '3', cgpa: '8.6', skills: 'React, Python, Figma' });
  const [error, setError] = useState('');
  const [toast, setToast] = useState<ToastState | null>(null);
  const [mobileNav, setMobileNav] = useState(false);

  const load = useCallback(async (reset = false) => {
    try {
      setError('');
      const r = reset ? await api.resetDemo() : await api.fetchDemo();
      setReport(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reach the local API.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resolve = useCallback(async (id: string) => {
    try {
      const r = await api.resolveRequirement(id);
      setReport(r);
      setToast({ kind: 'success', message: 'Readiness recalculated from verified evidence.' });
    } catch (e) {
      setToast({ kind: 'error', message: e instanceof Error ? e.message : 'Action failed.' });
    }
  }, []);

  const extract = useCallback(async (text: string) => {
    try {
      const reqs = await api.extractRequirements(text);
      setReport((old) => (old ? { ...old, requirements: reqs } : old));
      return true;
    } catch (e) {
      setToast({ kind: 'error', message: e instanceof Error ? e.message : 'Extraction failed.' });
      return false;
    }
  }, []);

  const navigate = (key: string) => {
    setPage(key);
    setMobileNav(false);
  };

  if (error && !report) {
    return (
      <div className="full-state">
        <AlertCircle size={28} />
        <b>ApplyReady AI</b>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => load()}>Retry</button>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="full-state">
        <Loader2 size={28} className="spin" />
        <b>ApplyReady AI</b>
        <p>Preparing your workspace…</p>
      </div>
    );
  }

  return (
    <div className="shell">
      <Sidebar
        active={page}
        onNavigate={navigate}
        onReset={() => load(true)}
        profile={profile}
        mobileOpen={mobileNav}
        onCloseMobile={() => setMobileNav(false)}
      />
      <main>
        <button className="mobile-nav-toggle" onClick={() => setMobileNav(true)} aria-label="Open navigation">
          <Menu size={20} />
        </button>
        <div className="main-inner">
          {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
          {page === 'dashboard' && <Dashboard report={report} profile={profile} onResolve={resolve} onNavigate={navigate} />}
          {page === 'upload' && <Upload onExtract={extract} setToast={setToast} onNavigate={navigate} />}
          {page === 'requirements' && <Requirements report={report} onResolve={resolve} />}
          {page === 'vault' && <Vault report={report} onAddTranscript={() => resolve('transcript')} />}
          {page === 'readiness' && <Readiness report={report} onResolve={resolve} />}
          {page === 'profile' && <ProfilePage profile={profile} onSave={setProfile} setToast={setToast} />}
          {page === 'settings' && <Settings setToast={setToast} />}
        </div>
      </main>
    </div>
  );
}
