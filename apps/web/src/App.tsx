import { useMemo, useState } from 'react';
import { Menu, Loader as Loader2, CircleAlert as AlertCircle, Moon, Sun } from 'lucide-react';
import type { Profile } from './types';
import { useAppData, useActions } from './lib/hooks';
import { buildReport } from './lib/engine';
import { Sidebar } from './components/Sidebar';
import { Toast, type ToastState } from './components/Toast';
import { Skeleton } from './components/Skeleton';
import { Dashboard } from './pages/Dashboard';
import { Upload } from './pages/Upload';
import { Requirements } from './pages/Requirements';
import { Vault } from './pages/Vault';
import { Readiness } from './pages/Readiness';
import { ProfilePage } from './pages/Profile';
import { Settings } from './pages/Settings';

export function App() {
  const { state, load } = useAppData();
  const actions = useActions(load);
  const [page, setPage] = useState('dashboard');
  const [toast, setToast] = useState<ToastState | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [dark, setDark] = useState(false);

  const profile: Profile = state.profile ?? { name: 'Aarav Kumar', degree: 'B.Tech Computer Science', year: '3', cgpa: '8.6', skills: 'React, Python, Figma' };
  const deadline = state.opportunity?.deadline ?? '2026-08-15';
  const title = state.opportunity?.title ?? 'National Student Innovation Hackathon';

  const report = useMemo(
    () => buildReport(state.requirements, state.documents, profile, deadline),
    [state.requirements, state.documents, profile, deadline],
  );

  const navigate = (key: string) => { setPage(key); setMobileNav(false); };

  const handleResolve = async (id: string) => {
    try {
      await actions.resolveRequirement(id);
      setToast({ kind: 'success', message: 'Readiness recalculated from verified evidence.' });
    } catch (e) {
      setToast({ kind: 'error', message: e instanceof Error ? e.message : 'Action failed.' });
    }
  };

  const handleExtract = async (text: string) => {
    try {
      await actions.extractRequirements(text);
      return true;
    } catch (e) {
      setToast({ kind: 'error', message: e instanceof Error ? e.message : 'Extraction failed.' });
      return false;
    }
  };

  const handleReset = async () => {
    try {
      await actions.resetDemo();
      setToast({ kind: 'success', message: 'Demo reset to original state.' });
    } catch (e) {
      setToast({ kind: 'error', message: e instanceof Error ? e.message : 'Reset failed.' });
    }
  };

  const handleSaveProfile = async (p: Profile) => {
    try {
      await actions.saveProfile(p);
    } catch (e) {
      setToast({ kind: 'error', message: e instanceof Error ? e.message : 'Save failed.' });
    }
  };

  const handleUpload = async (name: string, category: string) => {
    try {
      await actions.uploadDocument(name, category);
      setToast({ kind: 'success', message: `${name} added to evidence vault.` });
    } catch (e) {
      setToast({ kind: 'error', message: e instanceof Error ? e.message : 'Upload failed.' });
    }
  };

  const handleDeleteDoc = async (id: string) => {
    try {
      await actions.deleteDocument(id);
      setToast({ kind: 'success', message: 'Document removed.' });
    } catch (e) {
      setToast({ kind: 'error', message: e instanceof Error ? e.message : 'Delete failed.' });
    }
  };

  if (state.error && !state.profile) {
    return (
      <div className="full-state">
        <AlertCircle size={28} />
        <b>ApplyReady AI</b>
        <p>{state.error}</p>
        <button className="btn btn-primary" onClick={() => load()}>Retry</button>
      </div>
    );
  }

  if (state.loading) {
    return (
      <div className="shell">
        <Sidebar active={page} onNavigate={navigate} onReset={handleReset} profile={profile} mobileOpen={false} onCloseMobile={() => {}} dark={dark} onToggleDark={() => setDark(!dark)} />
        <main>
          <div className="main-inner">
            <Skeleton />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`shell ${dark ? 'dark' : ''}`}>
      <Sidebar
        active={page}
        onNavigate={navigate}
        onReset={handleReset}
        profile={profile}
        mobileOpen={mobileNav}
        onCloseMobile={() => setMobileNav(false)}
        dark={dark}
        onToggleDark={() => setDark(!dark)}
      />
      <main>
        <button className="mobile-nav-toggle" onClick={() => setMobileNav(true)} aria-label="Open navigation">
          <Menu size={20} />
        </button>
        <div className="main-inner">
          {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
          {page === 'dashboard' && <Dashboard report={report} profile={profile} opportunityTitle={title} deadline={deadline} onResolve={handleResolve} onNavigate={navigate} />}
          {page === 'upload' && <Upload onExtract={handleExtract} setToast={setToast} onNavigate={navigate} />}
          {page === 'requirements' && <Requirements report={report} onResolve={handleResolve} />}
          {page === 'vault' && <Vault report={report} onUpload={handleUpload} onDeleteDoc={handleDeleteDoc} onResolve={handleResolve} />}
          {page === 'readiness' && <Readiness report={report} onResolve={handleResolve} />}
          {page === 'profile' && <ProfilePage profile={profile} onSave={handleSaveProfile} setToast={setToast} />}
          {page === 'settings' && <Settings setToast={setToast} dark={dark} onToggleDark={() => setDark(!dark)} />}
        </div>
      </main>
    </div>
  );
}
