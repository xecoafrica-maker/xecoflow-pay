// src/app/dashboard/loans/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Truck,
  Zap,
  Loader2,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import StatusBadge from '@/components/lending/StatusBadge';
import Toast, { type ToastMessage } from '@/components/lending/Toast';
import RejectDialog from '@/components/lending/RejectDialog';
import {
  getLoan,
  approveLoan,
  rejectLoan,
  disburseLoan,
  activateLoan,
  formatKES,
  formatDate,
  type Loan,
  type LoanScheduleRow,
} from '@/lib/lending-api';

type ActionKey = 'approve' | 'reject' | 'disburse' | 'activate' | null;

export default function LoanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;

  const [loan, setLoan] = useState<Loan | null>(null);
  const [schedule, setSchedule] = useState<LoanScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [action, setAction] = useState<ActionKey>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const load = async () => {
    if (!id) {
      setLoadError('Missing loan ID');
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const detail = await getLoan(id);
      setLoan(detail.loan);
      setSchedule(detail.schedule || []);
    } catch (e: any) {
      setLoadError(e?.message ?? 'Failed to load loan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function runAction(key: Exclude<ActionKey, null>) {
    if (!loan) return;
    setAction(key);
    try {
      let updated: Loan = loan;
      switch (key) {
        case 'approve':
          updated = await approveLoan(loan.id);
          setToast({
            kind: 'success',
            title: 'Loan approved',
            message: `${updated.loan_reference} is ready for disbursement.`,
          });
          break;
        case 'disburse':
          updated = await disburseLoan(
            loan.id,
            `disburse-${loan.id}-${Date.now()}`
          );
          setToast({
            kind: 'success',
            title: 'Loan disbursed',
            message: `${updated.loan_reference} is disbursed and ready to activate.`,
          });
          break;
        case 'activate':
          updated = await activateLoan(loan.id);
          setToast({
            kind: 'success',
            title: 'Loan activated',
            message: `${updated.loan_reference} is now active.`,
          });
          break;
      }
      setLoan(updated);
      try {
        const detail = await getLoan(updated.id);
        setSchedule(detail.schedule || []);
      } catch {
        /* ignore */
      }
    } catch (e: any) {
      setToast({
        kind: 'error',
        title: `Failed to ${key}`,
        message: e?.message ?? 'Please try again.',
      });
    } finally {
      setAction(null);
    }
  }

  async function handleRejectConfirm(reason: string) {
    if (!loan) return;
    setRejecting(true);
    try {
      const updated = await rejectLoan(loan.id, reason);
      setLoan(updated);
      setRejectOpen(false);
      setToast({
        kind: 'info',
        title: 'Loan rejected',
        message: 'The borrower will be notified.',
      });
    } catch (e: any) {
      setToast({
        kind: 'error',
        title: 'Failed to reject',
        message: e?.message ?? 'Please try again.',
      });
    } finally {
      setRejecting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="bg-white border border-gray-200 rounded-lg h-64 animate-pulse" />
        <div className="bg-white border border-gray-200 rounded-lg h-40 animate-pulse" />
      </div>
    );
  }

  if (loadError || !loan) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/loans"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to dashboard
        </Link>
        <div className="border border-red-200 bg-red-50 text-red-800 rounded-lg px-4 py-3 text-sm flex items-start gap-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>{loadError || 'Loan not found.'}</div>
        </div>
      </div>
    );
  }

  const isPending = loan.status === 'PENDING';
  const isApproved = loan.status === 'APPROVED';
  const isDisbursed = loan.status === 'DISBURSED';
  const isActive = loan.status === 'ACTIVE' || loan.status === 'OVERDUE';
  const isOverdue = loan.status === 'OVERDUE';
  const isTerminal =
    loan.status === 'PAID' ||
    loan.status === 'REJECTED' ||
    loan.status === 'DEFAULTED' ||
    loan.status === 'WRITTEN_OFF';

  const busy = action !== null;

  // The BFF normalizes the credit engine's flat row into a nested
  // shape. `outstanding.penalty` is a string like "150.0000".
  const outstandingPenalty = Number(loan.outstanding.penalty || 0);
  const hasPenalty = Number.isFinite(outstandingPenalty) && outstandingPenalty > 0;

  // Whether any schedule row has a penalty — controls if the
  // penalty column is meaningful.
  const scheduleHasPenalty = schedule.some(
    (r) => Number((r as any).penalty_due || 0) > 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/loans"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to dashboard
        </Link>
        <div className="flex items-start justify-between gap-4 mt-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight font-mono tabular-nums">
              {loan.loan_reference}
            </h1>
            <div className="flex items-center gap-2 mt-1.5">
              <StatusBadge status={loan.status} />
              <span className="text-xs text-gray-500">
                Requested {formatDate(loan.timeline.requested_at)}
              </span>
            </div>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Overdue / penalty alert banner */}
      {isOverdue && hasPenalty && (
        <div className="flex items-start gap-3 border border-red-200 bg-red-50 text-red-900 rounded-lg px-4 py-3.5">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-red-700" />
          <div className="flex-1">
            <div className="text-sm font-semibold">Loan overdue — penalty applied</div>
            <div className="text-xs text-red-800/90 mt-0.5">
              A late payment fee of{' '}
              <strong className="text-red-900">
                {formatKES(outstandingPenalty)}
              </strong>{' '}
              has been added to this loan&apos;s outstanding balance. The fee
              was applied automatically because an instalment was paid past its
              due date.
            </div>
          </div>
        </div>
      )}

      {/* Action bar */}
      <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex flex-wrap items-center gap-2">
        {isPending && (
          <>
            <button
              onClick={() => runAction('approve')}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors disabled:opacity-60"
            >
              {action === 'approve' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              Approve
            </button>
            <button
              onClick={() => setRejectOpen(true)}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-white border border-red-200 hover:bg-red-50 rounded-md transition-colors disabled:opacity-60"
            >
              <XCircle className="w-3.5 h-3.5" />
              Reject
            </button>
          </>
        )}

        {isApproved && (
          <button
            onClick={() => runAction('disburse')}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors disabled:opacity-60"
          >
            {action === 'disburse' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Truck className="w-3.5 h-3.5" />
            )}
            Disburse
          </button>
        )}

        {isDisbursed && (
          <button
            onClick={() => runAction('activate')}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors disabled:opacity-60"
          >
            {action === 'activate' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5" />
            )}
            Activate
          </button>
        )}

        {isActive && (
          <span className="text-xs text-gray-500">
            This loan is active. Repayments and schedule are read-only here.
          </span>
        )}

        {isTerminal && (
          <span className="text-xs text-gray-500">
            This loan is closed. No further actions are available.
          </span>
        )}
      </div>

      {/* Summary */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200 px-5 py-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Summary
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-5 py-5">
          <Field label="Principal" value={formatKES(loan.principal_amount)} />
          <Field label="Interest" value={formatKES(loan.interest_amount)} />
          <Field label="Fees" value={formatKES(loan.fees_amount)} />
          <Field label="Total due" value={formatKES(loan.total_due)} />
          <Field label="Outstanding" value={formatKES(loan.outstanding.total)} />
          <Field label="Term" value={`${loan.terms.term_days} days`} />
          <Field label="Interest rate" value={`${loan.terms.interest_rate}%`} />
          <Field label="Repayment" value={loan.terms.repayment_frequency} />
        </div>

        {/* Outstanding breakdown — shows the penalty line when present */}
        <div className="border-t border-gray-200 px-5 py-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Outstanding breakdown
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <BreakdownCell
              label="Principal"
              value={formatKES(loan.outstanding.principal)}
            />
            <BreakdownCell
              label="Interest"
              value={formatKES(loan.outstanding.interest)}
            />
            <BreakdownCell
              label="Fees"
              value={formatKES(loan.outstanding.fees)}
            />
            {hasPenalty ? (
              <BreakdownCell
                label="Late payment fee"
                value={formatKES(outstandingPenalty)}
                tone="red"
              />
            ) : (
              <BreakdownCell
                label="Penalty"
                value={formatKES(loan.outstanding.penalty)}
              />
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-900">
              Total outstanding
            </span>
            <span className="text-sm font-bold text-gray-900 tabular-nums">
              {formatKES(loan.outstanding.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200 px-5 py-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Timeline
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-5 py-5">
          <Field
            label="Requested"
            value={formatDate(loan.timeline.requested_at)}
          />
          <Field
            label="Approved"
            value={formatDate(loan.timeline.approved_at)}
          />
          <Field
            label="Disbursed"
            value={formatDate(loan.timeline.disbursed_at)}
          />
          <Field
            label="Maturity"
            value={formatDate(loan.timeline.maturity_date)}
          />
          <Field
            label="First due"
            value={formatDate(loan.timeline.first_due_date)}
          />
          <Field
            label="Last payment"
            value={formatDate(loan.timeline.last_payment_at)}
          />
          <Field
            label="Closed"
            value={formatDate(loan.timeline.closed_at)}
          />
        </div>
      </div>

      {/* Schedule */}
      {schedule.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="border-b border-gray-200 px-5 py-3 flex items-center justify-between">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Repayment Schedule
            </h2>
            {scheduleHasPenalty && (
              <span className="text-[10px] text-red-700 font-semibold uppercase tracking-wider">
                Contains penalty
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-2">#</th>
                  <th className="px-4 py-2">Due</th>
                  <th className="px-4 py-2">Principal</th>
                  <th className="px-4 py-2">Interest</th>
                  <th className="px-4 py-2">Fees</th>
                  <th className="px-4 py-2">Penalty</th>
                  <th className="px-4 py-2">Total</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((row) => {
                  const rowPenalty = Number((row as any).penalty_due || 0);
                  const hasRowPenalty = rowPenalty > 0;
                  return (
                    <tr
                      key={row.installment_no}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <td className="px-4 py-2 tabular-nums text-gray-500">
                        {row.installment_no}
                      </td>
                      <td className="px-4 py-2 tabular-nums text-gray-700">
                        {formatDate(row.due_date)}
                      </td>
                      <td className="px-4 py-2 tabular-nums">
                        {formatKES(row.principal_due)}
                      </td>
                      <td className="px-4 py-2 tabular-nums">
                        {formatKES(row.interest_due)}
                      </td>
                      <td className="px-4 py-2 tabular-nums">
                        {formatKES(row.fees_due)}
                      </td>
                      <td
                        className={
                          'px-4 py-2 tabular-nums ' +
                          (hasRowPenalty
                            ? 'text-red-700 font-semibold'
                            : 'text-gray-400')
                        }
                      >
                        {hasRowPenalty ? formatKES(rowPenalty) : '—'}
                      </td>
                      <td className="px-4 py-2 tabular-nums font-medium">
                        {formatKES(row.total_due)}
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <RejectDialog
        open={rejectOpen}
        loanReference={loan.loan_reference}
        submitting={rejecting}
        onClose={() => setRejectOpen(false)}
        onConfirm={handleRejectConfirm}
      />

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-medium text-gray-900 tabular-nums">
        {value}
      </div>
    </div>
  );
}

function BreakdownCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'red';
}) {
  return (
    <div className="bg-gray-50 rounded-md px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </div>
      <div
        className={
          'mt-0.5 text-sm font-semibold tabular-nums ' +
          (tone === 'red' ? 'text-red-700' : 'text-gray-900')
        }
      >
        {value}
      </div>
    </div>
  );
}