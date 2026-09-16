'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { getStoredMerchant } from '@/lib/auth';

export default function SecurityBanner() {
  const [show, setShow] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const check = async () => {
      const cached = getStoredMerchant();
      const merchantId = cached?.merchant_id || cached?.merchantId;

      if (!merchantId) {
        setChecked(true);
        return;
      }

      // Session-based throttle: only check once per hour
      const lastCheck = sessionStorage.getItem('security_banner_checked');
      const lastResult = sessionStorage.getItem('security_banner_result');
      const now = Date.now();

      if (lastCheck && now - Number(lastCheck) < 60 * 60 * 1000) {
        setShow(lastResult === 'missing');
        setChecked(true);
        return;
      }

      try {
        const res = await fetch(
          `/api/security-questions/status?merchantId=${merchantId}`,
          { credentials: 'include' }
        );

        if (!res.ok) {
          setChecked(true);
          return;
        }

        const data = await res.json();
        const missing = !data.hasRecovery;

        sessionStorage.setItem('security_banner_checked', String(now));
        sessionStorage.setItem(
          'security_banner_result',
          missing ? 'missing' : 'ok'
        );

        setShow(missing);
      } catch {
        // Silent fail
      } finally {
        setChecked(true);
      }
    };

    check();
  }, []);

  if (!checked || !show) return null;

  return (
    <Link
      href="/components/dashboard/SecurityBanner"
      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-center border-b border-rose-100 bg-rose-50 hover:bg-rose-100 transition-colors group"
    >
      <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
      <span className="text-sm text-rose-700 group-hover:text-rose-800">
        Set up account security to further protect your account
      </span>
    </Link>
  );
}