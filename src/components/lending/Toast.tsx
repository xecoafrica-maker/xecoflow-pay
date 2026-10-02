// src/components/lending/Toast.tsx
'use client';

import { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastMessage {
  kind: ToastKind;
  title: string;
  message?: string;
}

interface Props {
  toast: ToastMessage | null;
  onDismiss: () => void;
  durationMs?: number;
}

export function Toast({ toast, onDismiss, durationMs = 4000 }: Props) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(t);
  }, [toast, durationMs, onDismiss]);

  if (!toast) return null;

  const styles = {
    success: {
      border: 'border-emerald-200',
      bg: 'bg-white',
      icon: 'text-emerald-600',
      Icon: CheckCircle2,
    },
    error: {
      border: 'border-red-200',
      bg: 'bg-white',
      icon: 'text-red-600',
      Icon: AlertCircle,
    },
    info: {
      border: 'border-blue-200',
      bg: 'bg-white',
      icon: 'text-blue-600',
      Icon: AlertCircle,
    },
  }[toast.kind];

  const Icon = styles.Icon;

  return (
    <div className="fixed top-6 right-6 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
      <div
        className={
          'flex items-start gap-3 min-w-[320px] max-w-md px-4 py-3 rounded-lg border shadow-lg ' +
          styles.border +
          ' ' +
          styles.bg
        }
      >
        <Icon className={'w-4 h-4 mt-0.5 flex-shrink-0 ' + styles.icon} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900">{toast.title}</div>
          {toast.message && (
            <div className="text-xs text-gray-500 mt-0.5">{toast.message}</div>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="p-0.5 rounded hover:bg-gray-100 transition-colors flex-shrink-0"
        >
          <X className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>
    </div>
  );
}

export default Toast;