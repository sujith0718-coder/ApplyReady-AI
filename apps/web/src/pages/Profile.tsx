import { useState } from 'react';
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
  const filled = Object.values(draft).filter((v) => {
  if (typeof v === "string") return v.trim().length > 0;

  if (Array.isArray(v)) return v.length > 0;

  return v !== null && v !== undefined && String(v).trim().length > 0;
}).length;
  const completeness = Math.round((filled / FIELDS.length) * 100);

  const save = async () => {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setToast({ kind: 'success', message: 'Profile saved to database.' });
  };

  return (
    <>
      <PageHeader eyebrow="Profile" title="Profile" sub="Maintain trusted facts for accurate matching." />
      <div className="profile-layout">
        <Card className="profile-form-card">
          {FIELDS.map(({ key, label, icon: Icon }) => (
            <label key={key} className="field-label">
              <span><Icon size={15} /> {label}</span>
              <input
  value={String(draft[key] ?? "")}
  onChange={(e) => {
    const value = e.target.value;

    setDraft({
      ...draft,
      [key]:
        key === "cgpa"
          ? Number(value)
          : key === "year"
          ? Number(value)
          : value,
    });
  }}
/>
            </label>
          ))}
          <button className="btn btn-primary" onClick={save} disabled={saving}>
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
