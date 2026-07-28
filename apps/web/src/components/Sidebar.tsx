import { LayoutDashboard, Upload as UploadIcon, ListChecks, FolderLock, Gauge, User, Settings as SettingsIcon, RefreshCw, X, Moon, Sun } from 'lucide-react';
import type { ComponentType } from 'react';

export interface NavItem {
  key: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}

export const NAV: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'upload', label: 'Opportunity Upload', icon: UploadIcon },
  { key: 'requirements', label: 'Requirements', icon: ListChecks },
  { key: 'vault', label: 'Evidence Vault', icon: FolderLock },
  { key: 'readiness', label: 'Readiness Report', icon: Gauge },
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'settings', label: 'Settings', icon: SettingsIcon },
];

export function Sidebar({
  active,
  onNavigate,
  onReset,
  profile,
  mobileOpen,
  onCloseMobile,
  dark,
  onToggleDark,
}: {
  active: string;
  onNavigate: (key: string) => void;
  onReset: () => void;
  profile: { name: string; degree: string; year: string };
  mobileOpen: boolean;
  onCloseMobile: () => void;
  dark: boolean;
  onToggleDark: () => void;
}) {
  const initials = profile.name.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase();
  return (
    <>
      {mobileOpen && <div className="scrim" onClick={onCloseMobile} aria-hidden="true" />}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`} aria-label="Primary navigation">
        <div className="brand">
          <div className="brand-mark">✦</div>
          <div className="brand-text">
            <span>ApplyReady</span>
            <small>AI</small>
          </div>
        </div>
        <p className="brand-tag">Application readiness,<br />not just summaries.</p>

        <nav className="nav-list">
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => onNavigate(item.key)}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={17} className="nav-icon" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <button className="nav-reset" onClick={onReset}>
          <RefreshCw size={15} />
          Reset demo
        </button>

        <button className="nav-reset" onClick={onToggleDark}>
          {dark ? <Sun size={15} /> : <Moon size={15} />}
          {dark ? 'Light mode' : 'Dark mode'}
        </button>

        <div className="sidebar-profile">
          <div className="avatar">{initials}</div>
          <div className="sidebar-profile-text">
            <b>{profile.name}</b>
            <small>{profile.degree} · Year {profile.year}</small>
          </div>
        </div>

        <button className="sidebar-close" onClick={onCloseMobile} aria-label="Close navigation">
          <X size={18} />
        </button>
      </aside>
    </>
  );
}
