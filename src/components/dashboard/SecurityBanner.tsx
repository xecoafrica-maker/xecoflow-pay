// src/components/dashboard/SecurityBanner.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function SecurityBanner() {
  const [show, setShow] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      // Session-scoped cache: check once every 5 minutes at most.
      const lastCheck = sessionStorage.getItem('security_banner_checked');
      const lastResult = sessionStorage.getItem('security_banner_result');
      const now = Date.now();

      if (lastCheck && now - Number(lastCheck) < 5 * 60 * 1000) {
        if (!cancelled) {
          setShow(lastResult === 'missing');
          setChecked(true);
        }
        return;
      }

      try {
        const res = await fetch('/api/security-questions/status', {
          credentials: 'include',
          cache: 'no-store',
        });

        if (cancelled) return;

        if (!res.ok) {
          // Fail soft — don't show the banner if we can't check.
          setChecked(true);
          return;
        }

        const data = (await res.json()) as { hasRecovery?: boolean };
        const missing = data.hasRecovery !== true;

        sessionStorage.setItem('security_banner_checked', String(now));
        sessionStorage.setItem(
          'security_banner_result',
          missing ? 'missing' : 'ok'
        );

        if (!cancelled) setShow(missing);
      } catch {
        // Silent fail — the banner is non-critical.
      } finally {
        if (!cancelled) setChecked(true);
      }
    };

    check();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!checked || !show) return null;

  return (
    <Link
      href="/dashboard/settings/security"
      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-center border-b border-rose-100 bg-rose-50 hover:bg-rose-100 transition-colors group"
    >
      <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
      <span className="text-sm text-rose-700 group-hover:text-rose-800">
        Set up account security to further protect your account
      </span>
    </Link>
  );
}