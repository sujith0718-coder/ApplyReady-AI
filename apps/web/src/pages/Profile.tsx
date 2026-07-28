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
  onSave: (p: Profile) => void;
  setToast: (t: ToastState) => void;
}) {
  const [draft, setDraft] = useState<Profile>(profile);
  const filled = Object.values(draft).filter((v) => v.trim().length > 0).length;
  const completeness = Math.round((filled / FIELDS.length) * 100);

  const save = () => {
    onSave(draft);
    setToast({ kind: 'success', message: 'Profile saved.' });
  };

  return (
    <>
      <PageHeader eyebrow="Profile" title="Profile" sub="Maintain trusted facts for accurate matching." />
      <div className="profile-layout">
        <Card className="profile-form-card">
          {FIELDS.map(({ key, label, icon: Icon }) => (
            <label key={key} className="field-label">
              <span><Icon size={15} /> {label}</span>
              <input value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />
            </label>
          ))}
          <button className="btn btn-primary" onClick={save}><Save size={15} />Save profile</button>
        </Card>

        <Card className="profile-complete-card">
          <p className="eyebrow">Profile completeness</p>
          <div className="complete-ring">
            <b>{completeness}%</b>
          </div>
          <div className="meter"><i style={{ width: `${completeness}%` }} /></div>
          <p className="muted">{filled} of {FIELDS.length} fields completed.</p>
          <ul className="profile-checklist">
            <li>Verified resume on file</li>
            <li>Identity card confirmed</li>
            <li>Transcript pending upload</li>
          </ul>
        </Card>
      </div>
    </>
  );
}
