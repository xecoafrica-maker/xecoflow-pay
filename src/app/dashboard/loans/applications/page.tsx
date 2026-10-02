// src/app/dashboard/loans/applications/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Inbox, ArrowRight } from 'lucide-react';
import PageHeader from '@/components/lending/PageHeader';
import ApplicationCard from '@/components/lending/ApplicationCard';
import RejectDialog from '@/components/lending/RejectDialog';
import Toast, { type ToastMessage } from '@/components/lending/Toast';
import {
  listApplications,
  approveLoan,
  rejectLoan,
  type Loan,
} from '@/lib/lending-api';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<
    Record<string, 'approve' | 'reject' | null>
  >({});
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Reject dialog state
  const [rejectTarget, setRejectTarget] = useState<Loan | null>(null);
  const [rejecting, setRejecting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listApplications({ limit: 50 });
      setApplications(result.loans);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleApprove(loan: Loan) {
    setProcessing((p) => ({ ...p, [loan.id]: 'approve' }));
    try {
      const updated = await approveLoan(loan.id);
      setApplications((list) => list.filter((l) => l.id !== loan.id));
      setToast({
        kind: 'success',
        title: 'Application approved',
        message:
          'Loan ' +
          (updated.loan_reference ?? loan.loan_reference) +
          ' is ready for disbursement.',
      });
    } catch (e: any) {
      setToast({
        kind: 'error',
        title: 'Failed to approve',
        message: e?.message ?? 'Please try again.',
      });
    } finally {
      setProcessing((p) => ({ ...p, [loan.id]: null }));
    }
  }

  async function handleRejectConfirm(reason: string) {
    if (!rejectTarget) return;
    const target = rejectTarget;
    setRejecting(true);
    setProcessing((p) => ({ ...p, [target.id]: 'reject' }));
    try {
      await rejectLoan(target.id, reason);
      setApplications((list) => list.filter((l) => l.id !== target.id));
      setRejectTarget(null);
      setToast({
        kind: 'info',
        title: 'Application rejected',
        message: 'Borrower will be notified.',
      });
    } catch (e: any) {
      setToast({
        kind: 'error',
        title: 'Failed to reject',
        message: e?.message ?? 'Please try again.',
      });
    } finally {
      setRejecting(false);
      setProcessing((p) => ({ ...p, [target.id]: null }));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader onRefresh={load} refreshing={loading} />

      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Pending Applications
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {loading
                ? 'Loading…'
                : applications.length === 0
                ? 'All caught up'
                : applications.length +
                  ' application' +
                  (applications.length === 1 ? '' : 's') +
                  ' awaiting review'}
            </p>
          </div>
        </div>

        {error && (
          <div className="border border-red-200 bg-red-50 text-red-800 rounded-lg px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-lg h-48 animate-pulse"
              />
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="text-center py-16 px-6">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                <Inbox className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">
                No pending applications
              </h3>
              <p className="text-xs text-gray-500 mt-1.5 max-w-md mx-auto">
                When borrowers apply for loans, their applications will appear
                here for your review.
              </p>
              <Link
                href="/dashboard/loans"
                className="inline-flex items-center gap-1.5 mt-5 text-xs font-medium text-emerald-700 hover:text-emerald-800"
              >
                Back to Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((loan) => (
              <ApplicationCard
                key={loan.id}
                loan={loan}
                processing={processing[loan.id] ?? null}
                onApprove={handleApprove}
                onReject={(l) => setRejectTarget(l)}
              />
            ))}
          </div>
        )}
      </section>

      <RejectDialog
        open={!!rejectTarget}
        loanReference={rejectTarget?.loan_reference}
        submitting={rejecting}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleRejectConfirm}
      />

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}