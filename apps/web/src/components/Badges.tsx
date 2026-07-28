import type { Status } from '../types';
import { CircleCheck as CheckCircle2, CircleAlert as AlertCircle, Clock, Lock, Circle as HelpCircle } from 'lucide-react';
import type { ComponentType } from 'react';

export const STATUS_LABEL: Record<Status, string> = {
  completed: 'Completed',
  pending: 'Pending',
  missing: 'Missing',
  blocked: 'Blocked',
  needs_review: 'Needs review',
};

export const STATUS_META: Record<Status, { icon: ComponentType<{ size?: number; className?: string }>; className: string }> = {
  completed: { icon: CheckCircle2, className: 'completed' },
  pending: { icon: Clock, className: 'pending' },
  missing: { icon: AlertCircle, className: 'missing' },
  blocked: { icon: Lock, className: 'blocked' },
  needs_review: { icon: HelpCircle, className: 'needs_review' },
};

export function StatusBadge({ status }: { status: Status }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span className={`badge badge-${meta.className}`}>
      <Icon size={13} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function PriorityTag({ priority }: { priority: string }) {
  return <span className={`tag tag-${priority}`}>{priority} priority</span>;
}
