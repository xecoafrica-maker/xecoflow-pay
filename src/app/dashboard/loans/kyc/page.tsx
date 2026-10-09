// src/app/dashboard/loans/kyc/page.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  RefreshCw,
  ShieldCheck,
  X,
  User,
  MapPin,
  Briefcase,
  Users,
} from 'lucide-react';
import {
  listPending,
  getKycDetail,
  verifyKyc,
  rejectKyc,
  KycApiError,
  employmentLabel,
  incomeLabel,
  formatKes,
  formatDate,
  formatDateTime,
  type KycSubmission,
  type KycDetailResponse,
} from '@/lib/kyc-api';

// ─── Utilities ──────────────────────────────────────────────────

function initialsOf(name: string | null, email: string): string {
  const source = name || email;
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// ─── Small presentational pieces ────────────────────────────────

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-500 shrink-0">{label}</span>
      <span
        className={
          'text-xs text-right text-gray-900 ' +
          (mono ? 'font-mono' : 'font-medium')
        }
      >
        {value || '—'}
      </span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
      {children}
    </div>
  );
}

// ─── Detail drawer ──────────────────────────────────────────────

function DetailDrawer({
  borrowerId,
  onClose,
  onActionComplete,
}: {
  borrowerId: number;
  onClose: () => void;
  onActionComplete: () => void;
}) {
  const [detail, setDetail] = useState<KycDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  // Load detail
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getKycDetail(borrowerId);
        if (!cancelled) setDetail(data);
      } catch (e: any) {
        if (cancelled) return;
        if (e instanceof KycApiError) setError(e.message);
        else setError('Failed to load KYC detail.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [borrowerId]);

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleVerify = async () => {
    setSubmitting(true);
    setActionError(null);
    try {
      await verifyKyc(borrowerId);
      onActionComplete();
    } catch (e: any) {
      setActionError(e?.message || 'Failed to verify KYC.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    const reason = rejectReason.trim();
    if (reason.length < 3) {
      setActionError('Please provide a reason (3+ characters).');
      return;
    }
    setSubmitting(true);
    setActionError(null);
    try {
      await rejectKyc(borrowerId, reason);
      onActionComplete();
    } catch (e: any) {
      setActionError(e?.message || 'Failed to reject KYC.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="relative ml-auto h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <h2 className="text-sm font-semibold text-gray-900 truncate">
              KYC review
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && (
            <div className="py-16 text-center text-sm text-gray-500">
              Loading submission…
            </div>
          )}

          {!loading && error && (
            <div className="flex items-start gap-2 border border-red-200 bg-red-50 text-red-800 rounded-md px-3 py-2 text-xs">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && detail && (
            <div className="space-y-5">
              {/* Borrower summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center text-sm font-bold shrink-0">
                    {initialsOf(detail.borrower.fullName, detail.borrower.email)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-gray-900 truncate">
                      {detail.borrower.fullName || '—'}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {detail.borrower.email}
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      Borrower ID
                    </div>
                    <div className="text-gray-900 font-mono mt-0.5">
                      #{detail.borrower.borrowerId}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      External ID
                    </div>
                    <div className="text-gray-900 font-mono mt-0.5 truncate">
                      {detail.identity.externalCustomerId}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submitted fields */}
              <div>
                <SectionLabel>
                  <span className="inline-flex items-center gap-1.5">
                    <User className="w-3 h-3" /> Personal
                  </span>
                </SectionLabel>
                <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                  <InfoRow label="Full name" value={detail.borrower.fullName} />
                  <InfoRow
                    label="National ID"
                    value={detail.borrower.idNumber}
                    mono
                  />
                  <InfoRow
                    label="Date of birth"
                    value={
                      detail.kyc.dateOfBirth
                        ? formatDate(detail.kyc.dateOfBirth)
                        : null
                    }
                  />
                </div>
              </div>

              <div>
                <SectionLabel>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" /> Address
                  </span>
                </SectionLabel>
                <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                  <InfoRow label="County" value={detail.kyc.county} />
                  <InfoRow label="Town" value={detail.kyc.town} />
                  <InfoRow
                    label="Street"
                    value={detail.kyc.streetAddress}
                  />
                </div>
              </div>

              <div>
                <SectionLabel>
                  <span className="inline-flex items-center gap-1.5">
                    <Briefcase className="w-3 h-3" /> Employment
                  </span>
                </SectionLabel>
                <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                  <InfoRow
                    label="Status"
                    value={employmentLabel(detail.kyc.employmentStatus)}
                  />
                  <InfoRow
                    label="Income range"
                    value={incomeLabel(detail.kyc.monthlyIncomeRange)}
                  />
                </div>
              </div>

              <div>
                <SectionLabel>
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="w-3 h-3" /> Next of kin
                  </span>
                </SectionLabel>
                <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                  <InfoRow
                    label="Name"
                    value={detail.kyc.nextOfKinName}
                  />
                  <InfoRow
                    label="Phone"
                    value={detail.kyc.nextOfKinPhone}
                    mono
                  />
                  <InfoRow
                    label="Relationship"
                    value={detail.kyc.nextOfKinRelationship}
                  />
                </div>
              </div>

              {/* Credit limit context */}
              {detail.creditLimit && (
                <div>
                  <SectionLabel>Credit limit</SectionLabel>
                  <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                    <InfoRow
                      label="Max limit"
                      value={formatKes(detail.creditLimit.maxLimit)}
                    />
                    <InfoRow
                      label="Available"
                      value={formatKes(detail.creditLimit.availableLimit)}
                    />
                  </div>
                </div>
              )}

              {/* Submitted at */}
              <div className="text-[11px] text-gray-400 text-center">
                Submitted {formatDateTime(detail.identity.kycSubmittedAt)}
              </div>

              {/* Action error */}
              {actionError && (
                <div className="flex items-start gap-2 border border-red-200 bg-red-50 text-red-800 rounded-md px-3 py-2 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Reject inline form */}
              {rejectMode && (
                <div className="bg-red-50/50 border border-red-200 rounded-lg px-3 py-3">
                  <div className="text-xs font-semibold text-red-900 mb-1.5">
                    Reason for rejection
                  </div>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={3}
                    placeholder="e.g. National ID number does not match the name provided."
                    className="w-full px-3 py-2 text-sm border border-red-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400 bg-white resize-none"
                  />
                  <div className="mt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRejectMode(false);
                        setRejectReason('');
                        setActionError(null);
                      }}
                      disabled={submitting}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleReject}
                      disabled={submitting}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-md"
                    >
                      {submitting ? 'Rejecting…' : 'Confirm rejection'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action bar */}
        {!loading && !error && detail && detail.identity.kycStatus === 'SUBMITTED' && (
          <div className="border-t border-gray-200 px-5 py-3 shrink-0 bg-gray-50">
            {!rejectMode ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRejectMode(true)}
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 bg-white border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" />
                  Reject
                </button>
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-md"
                >
                  <Check className="w-3.5 h-3.5" />
                  {submitting ? 'Verifying…' : 'Verify KYC'}
                </button>
              </div>
            ) : (
              <div className="text-center text-[11px] text-gray-500">
                Enter a reason and confirm rejection above.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Table row ──────────────────────────────────────────────────

function SubmissionRow({
  submission,
  onOpen,
}: {
  submission: KycSubmission;
  onOpen: () => void;
}) {
  const initials = initialsOf(submission.borrower.fullName, submission.borrower.email);

  return (
    <tr
      onClick={onOpen}
      className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60 cursor-pointer transition-colors"
    >
      <td className="px-4 py-3 align-top">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 grid place-items-center text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">
              {submission.borrower.fullName || '—'}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {submission.borrower.email}
            </div>
          </div>
        </div>
      </td>

      <td className="px-4 py-3 align-top text-sm text-gray-700">
        {submission.borrower.phone || '—'}
      </td>

      <td className="px-4 py-3 align-top text-xs text-gray-500 font-mono">
        {submission.externalCustomerId}
      </td>

      <td className="px-4 py-3 align-top">
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border rounded-full bg-blue-50 text-blue-700 border-blue-200">
          <Clock className="w-3 h-3" />
          Awaiting review
        </div>
      </td>

      <td className="px-4 py-3 align-top text-xs text-gray-500 text-right">
        {submission.submittedAt ? formatDate(submission.submittedAt) : '—'}
      </td>
    </tr>
  );
}

// ─── Page ───────────────────────────────────────────────────────

export default function KycReviewsPage() {
  const [submissions, setSubmissions] = useState<KycSubmission[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const [activeBorrowerId, setActiveBorrowerId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listPending({ limit: 100, offset: 0 });
      setSubmissions(res.submissions);
      setTotal(res.total);
      setLastUpdated(
        new Date().toLocaleTimeString('en-KE', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
    } catch (e: any) {
      setError(e?.message || 'Failed to load pending KYC submissions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      {/* ─── Page header ────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
            KYC Reviews
          </h1>
          <div className="mt-1 text-sm text-gray-500">
            Review and approve borrower identity submissions.
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-gray-400 tabular-nums">
              Updated {lastUpdated} EAT
            </span>
          )}
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ─── Error banner ───────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-3 border border-red-200 bg-red-50 text-red-800 rounded-lg px-4 py-3 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div className="flex-1">
            <div className="font-medium">Unable to load KYC submissions</div>
            <div className="text-xs text-red-700/80 mt-0.5">{error}</div>
          </div>
        </div>
      )}

      {/* ─── Table ───────────────────────────────────────────── */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            {total === 0
              ? 'No pending reviews'
              : `${total} submission${total === 1 ? '' : 's'} awaiting review`}
          </h2>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {loading && submissions.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-500">
              Loading submissions…
            </div>
          ) : submissions.length === 0 ? (
            <div className="py-16 px-6 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">
                All caught up
              </h3>
              <p className="text-xs text-gray-500 mt-1.5 max-w-md mx-auto">
                No KYC submissions are waiting for review. New submissions will
                appear here automatically.
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500 px-4 py-2.5">
                    Borrower
                  </th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500 px-4 py-2.5">
                    Phone
                  </th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500 px-4 py-2.5">
                    External ID
                  </th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500 px-4 py-2.5">
                    Status
                  </th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-gray-500 px-4 py-2.5">
                    Submitted
                  </th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <SubmissionRow
                    key={s.identityId}
                    submission={s}
                    onOpen={() => setActiveBorrowerId(s.borrowerId)}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ─── Drawer ──────────────────────────────────────────── */}
      {activeBorrowerId !== null && (
        <DetailDrawer
          borrowerId={activeBorrowerId}
          onClose={() => setActiveBorrowerId(null)}
          onActionComplete={async () => {
            setActiveBorrowerId(null);
            await load();
          }}
        />
      )}
    </div>
  );
}