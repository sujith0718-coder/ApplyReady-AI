import { useState, useEffect } from 'react';
import type { Profile } from '../types';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Save, User, GraduationCap, Star, Award } from 'lucide-react';
import type { ToastState } from '../components/Toast';

const FIELDS: { key: keyof Profile; label: string; icon: typeof User }[] = [
  { key: 'name', label: 'Full name', icon: User },
  { key: 'degree', label: 'Degree', icon: GraduationCap },
  { key: 'year', label: 'Year', icon: Star },
  { key: 'cgpa', label: 'CGPA', icon: Award },
  { key: 'skills', label: 'Skills', icon: Star },
];

export function ProfilePage({
  profile,
  onSave,
  setToast,
}: {
  profile: Profile;
  onSave: (p: Profile) => Promise<void>;
  setToast: (t: ToastState) => void;
}) {
  const [draft, setDraft] = useState<Profile>(profile);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    const av = typeof window !== 'undefined' ? localStorage.getItem('profile_avatar') : null;
    if (av) setAvatarPreview(av);
  }, []);

  const filled = Object.values(draft).filter((v) => {
    if (typeof v === 'string') return v.trim().length > 0;
    if (Array.isArray(v)) return v.length > 0;
    return v !== null && v !== undefined && String(v).trim().length > 0;
  }).length;
  const completeness = Math.round((filled / FIELDS.length) * 100);

  const onFile = (f?: File) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      setAvatarPreview(res);
    };
    reader.readAsDataURL(f);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      // persist avatar locally for now
      if (avatarPreview) localStorage.setItem('profile_avatar', avatarPreview);
      setToast({ kind: 'success', message: 'Profile saved.' });
    } catch (e) {
      setToast({ kind: 'error', message: e instanceof Error ? e.message : 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  const removeAvatar = () => {
    setAvatarPreview(null);
    localStorage.removeItem('profile_avatar');
    setToast({ kind: 'info', message: 'Profile picture removed.' });
  };

  return (
    <>
      <PageHeader eyebrow="Profile" title="Profile" sub="Maintain trusted facts for accurate matching." />
      <div className="profile-layout">
        <Card className="profile-form-card">
          <label className="field-label profile-avatar-field">
            <span>Profile picture</span>
            <div className="avatar-upload-row">
              {avatarPreview ? <img src={avatarPreview} alt="Avatar preview" className="avatar-large" /> : <div className="avatar-large placeholder">No image</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-sm" onClick={() => document.querySelector<HTMLInputElement>('input[type=file]')?.click()}>Choose</button>
                  <button className="btn btn-ghost btn-sm" onClick={removeAvatar} disabled={!avatarPreview}>Remove</button>
                </div>
              </div>
            </div>
          </label>

          {FIELDS.map(({ key, label, icon: Icon }) => (
            <label key={key} className="field-label">
              <span><Icon size={15} /> {label}</span>
              <input
                value={String(draft[key] ?? '')}
                onChange={(e) => {
                  const value = e.target.value;
                  setDraft({
                    ...draft,
                    [key]: key === 'cgpa' ? Number(value) : key === 'year' ? Number(value) : value,
                  });
                }}
              />
            </label>
          ))}
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={15} /> {saving ? 'Saving…' : 'Save profile'}
          </button>
        </Card>

        <Card className="profile-complete-card">
          <p className="eyebrow">Profile completeness</p>
          <div className="complete-ring">
            <b>{completeness}%</b>
          </div>
          <div className="meter"><i style={{ width: `${completeness}%` }} /></div>
          <p className="muted">{filled} of {FIELDS.length} fields completed.</p>
          <ul className="profile-checklist">
            <li>Profile stored in MongoDB (or Demo Mode)</li>
            <li>Used for eligibility and CGPA matching</li>
            <li>Contradictions flagged automatically</li>
          </ul>
        </Card>
      </div>
    </>
  );
}
