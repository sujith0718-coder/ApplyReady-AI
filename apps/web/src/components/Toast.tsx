import { useEffect } from 'react';
import { CircleCheck as CheckCircle2, TriangleAlert as AlertTriangle, X } from 'lucide-react';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastState {
  kind: ToastKind;
  message: string;
}

export function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4200);
    return () => clearTimeout(t);
  }, [onClose, toast.message]);

  const Icon = toast.kind === 'error' ? AlertTriangle : CheckCircle2;
  return (
    <div className={`toast toast-${toast.kind}`} role="status">
      <Icon size={16} />
      <span>{toast.message}</span>
      <button className="toast-close" onClick={onClose} aria-label="Dismiss">
        <X size={15} />
      </button>
    </div>
  );
}
