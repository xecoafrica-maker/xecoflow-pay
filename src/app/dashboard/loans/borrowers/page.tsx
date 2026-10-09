// src/app/dashboard/loans/borrowers/page.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus,
  RefreshCw,
  KeyRound,
  UserPlus,
  AlertTriangle,
  Users,
} from 'lucide-react';
import CreateBorrowerModal from '@/components/lending/CreateBorrowerModal';
import CreateLoanForBorrowerModal from '@/components/lending/CreateLoanForBorrowerModal';
import {
  listBorrowers,
  formatKES,
  type Borrower,
} from '@/lib/borrowers-api';

// ─── Presentational helpers ──────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    SUSPENDED: 'bg-red-50 text-red-700 border-red-200',
  };
  const cls = map[status] || 'bg-gray-50 text-gray-700 border-gray-200';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border rounded-full ${cls}`}
    >
      {status}
    </span>
  );
}

function KycBadge({ status }: { status: string | null | undefined }) {
  if (!status) return <span className="text-xs text-gray-400">—</span>;
  const isVerified = status === 'VERIFIED';
  const cls = isVerified
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'bg-gray-50 text-gray-600 border-gray-200';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border rounded-full ${cls}`}
    >
      KYC {status}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────

export default function BorrowersPage() {
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loanFor, setLoanFor] = useState<Borrower | null>(null);
  const [busyReissueId, setBusyReissueId] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listBorrowers({ limit: 100, offset: 0 });
      setBorrowers(res.borrowers);
      setTotal(res.total);
      const now = new Date();
      setLastUpdated(
        now.toLocaleTimeString('en-KE', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
    } catch (e: any) {
      setError(e?.message || 'Failed to load borrowers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleReissue = useCallback(
    async (b: Borrower) => {
      const confirmed = window.confirm(
        `Reissue login credentials for ${b.fullName || b.email}?\n\n` +
          'This will generate a new temporary password and email it to them.'
      );
      if (!confirmed) return;

      setBusyReissueId(b.borrowerId);
      setError(null);
      try {
        const { reissueCredentials } = await import('@/lib/borrowers-api');
        await reissueCredentials(b.borrowerId);
        await load();
      } catch (e: any) {
        setError(e?.message || 'Failed to reissue credentials');
      } finally {
        setBusyReissueId(null);
      }
    },
    [load]
  );

  const columns = useMemo(
    () => [
      { key: 'borrower', label: 'Borrower', className: 'w-[28%]' },
      { key: 'phone', label: 'Phone', className: 'w-[14%]' },
      { key: 'limit', label: 'Credit limit', className: 'w-[14%] text-right' },
      { key: 'available', label: 'Available', className: 'w-[14%] text-right' },
      { key: 'status', label: 'Status', className: 'w-[12%]' },
      { key: 'actions', label: 'Actions', className: 'w-[18%] text-right' },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* ─── Page header ─────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
            Borrowers
          </h1>
          <div className="mt-1 text-sm text-gray-500">
            Directory of your customers with credit limits and KYC status.
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
            <RefreshCw className={'w-3.5 h-3.5 ' + (loading ? 'animate-spin' : '')} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Borrower
          </button>
        </div>
      </div>

      {/* ─── Error banner ────────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-3 border border-red-200 bg-red-50 text-red-800 rounded-lg px-4 py-3 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div className="flex-1">
            <div className="font-medium">Unable to complete request</div>
            <div className="text-xs text-red-700/80 mt-0.5">{error}</div>
          </div>
        </div>
      )}

      {/* ─── Table ───────────────────────────────────────────── */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            {total === 0 ? 'No borrowers' : `${total} borrower${total === 1 ? '' : 's'}`}
          </h2>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {loading && borrowers.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-500">
              Loading borrowers…
            </div>
          ) : borrowers.length === 0 ? (
            <div className="py-16 px-6 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Users className="w-5 h-5 text-gray-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">
                No borrowers yet
              </h3>
              <p className="text-xs text-gray-500 mt-1.5 max-w-md mx-auto">
                Create your first borrower. They will receive an email with login
                credentials for the Imara borrower app.
              </p>
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 mt-5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Create your first borrower
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      className={`text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500 px-4 py-2.5 ${
                        c.className || ''
                      }`}
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {borrowers.map((b) => {
                  const limit = b.creditLimit;
                  const available = limit?.availableLimit ?? null;
                  const maxLimit = limit?.maxLimit ?? null;

                  return (
                    <tr
                      key={b.borrowerId}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50/40"
                    >
                      <td className="px-4 py-3 align-top">
                        <div className="text-sm font-medium text-gray-900">
                          {b.fullName || '—'}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{b.email}</div>
                        {b.identity && (
                          <div className="text-[10px] text-gray-400 mt-1 font-mono">
                            {b.identity.externalCustomerId}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 align-top text-sm text-gray-700">
                        {b.phone || <span className="text-gray-400">—</span>}
                      </td>

                      <td className="px-4 py-3 align-top text-right text-sm tabular-nums">
                        {maxLimit !== null ? (
                          <span className="text-gray-900 font-medium">
                            {formatKES(maxLimit)}
                          </span>
                        ) : (
                          <span className="text-gray-400">Not set</span>
                        )}
                      </td>

                      <td className="px-4 py-3 align-top text-right text-sm tabular-nums">
                        {available !== null ? (
                          <span
                            className={
                              'font-medium ' +
                              (available > 0 ? 'text-emerald-700' : 'text-gray-500')
                            }
                          >
                            {formatKES(available)}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-col gap-1">
                          <StatusBadge status={b.status} />
                          <KycBadge status={b.identity?.kycStatus} />
                          {b.mustChangePassword && (
                            <span className="text-[10px] text-amber-700 mt-0.5">
                              {b.tempPasswordExpired
                                ? 'Temp expired'
                                : 'Awaiting 1st login'}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 align-top text-right">
                        <div className="inline-flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleReissue(b)}
                            disabled={
                              busyReissueId === b.borrowerId || !b.mustChangePassword
                            }
                            title={
                              !b.mustChangePassword
                                ? 'Borrower already has a permanent password'
                                : 'Regenerate temp password and resend welcome email'
                            }
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            {busyReissueId === b.borrowerId ? 'Sending…' : 'Reissue'}
                          </button>

                          <button
                            type="button"
                            onClick={() => setLoanFor(b)}
                            disabled={!b.identity}
                            title={
                              !b.identity
                                ? 'Borrower has no credit identity'
                                : 'Create a loan for this borrower'
                            }
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-md transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            New Loan
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ─── Modals ──────────────────────────────────────────── */}
      <CreateBorrowerModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={async () => {
          setShowCreate(false);
          await load();
        }}
      />

      <CreateLoanForBorrowerModal
        open={!!loanFor}
        borrower={loanFor}
        onClose={() => setLoanFor(null)}
        onCreated={async () => {
          setLoanFor(null);
          await load();
        }}
      />
    </div>
  );
}