import React from 'react';

export function MetricCard({ icon, value, label }: { icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <div className="card metric metric-polished" tabIndex={0} role="group" aria-label={label}>
      <div className="metric-top">{icon}</div>
      <div className="metric-body">
        <div className="metric-value">{value}</div>
        <div className="metric-label muted">{label}</div>
      </div>
    </div>
  );
}
