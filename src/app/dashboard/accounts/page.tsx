// src/app/dashboard/accounts/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  Building2,
  Shield,
  Smartphone,
  Clock,
  AlertCircle,
  Copy,
  Check,
  Loader2,
  Trash2,
  X,
  AlertTriangle,
} from 'lucide-react';
import { getStoredMerchant, getToken } from '@/lib/auth';
import { getMerchantProfile, MerchantProfile } from '@/lib/auth-api';

export default function AccountsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // ─── Delete Account State ────────────────────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  // ─── Load Profile ────────────────────────────────────────────────
  useEffect(() => {
    // ✅ EXACT same pattern as Withdraw Funds page
    const cached = getStoredMerchant();
    const id = cached?.merchant_id || cached?.merchantId;
    const token = getToken();

    // ✅ Only redirect if BOTH token and merchant are missing
    if (!token || !id) {
      console.warn('⚠️ Missing session, redirecting to login');
      router.push('/login?session=expired');
      return;
    }

    const load = async () => {
      try {
        const data = await getMerchantProfile(token);
        setProfile(data);
      } catch (err: any) {
        console.error('Failed to load account details:', err);
        setError(err.message || 'Failed to load account details');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  // ─── Copy to Clipboard ───────────────────────────────────────────
  const copyToClipboard = (text: string | number | undefined, id: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(String(text));
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // ─── Delete Account Handler ──────────────────────────────────────
  const handleDeleteAccount = async () => {
    setDeleteError('');

    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Please type DELETE in capital letters to confirm');
      return;
    }
    if (!deletePassword) {
      setDeleteError('Please enter your password');
      return;
    }

    setDeleting(true);
    try {
      // ✅ Same session check as Withdraw page
      const token = getToken();
      const cached = getStoredMerchant();
      const id = cached?.merchant_id || cached?.merchantId;

      if (!token || !id) {
        router.push('/login?session=expired');
        return;
      }

      // TODO: wire to real endpoint
      // const res = await fetch('/v1/auth/delete-account', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     Authorization: `Bearer ${token}`,
      //   },
      //   body: JSON.stringify({ password: deletePassword, confirm: 'DELETE' }),
      // });

      await new Promise((r) => setTimeout(r, 1200));

      // Clear session and redirect
      localStorage.clear();
      sessionStorage.clear();
      router.push('/login?deleted=true');
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  // ─── Loading State ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // ─── Derived Values ──────────────────────────────────────────────
  const cachedMerchant = getStoredMerchant();
  const businessName =
    profile?.business_name || cachedMerchant?.business_name || '—';
  const merchantId =
    profile?.merchant_id ||
    cachedMerchant?.merchant_id ||
    cachedMerchant?.merchantId ||
    '—';
  const status = (profile?.status || 'PENDING').toUpperCase();
  const businessType = profile?.business_type || '—';
  const createdAt = profile?.created_at;

  const settlementMethod = profile?.settlement_method || 'mpesa';
  const settlementPhone = profile?.settlement_phone || profile?.phone || '—';
  const bankName = profile?.bank_name || '';
  const bankAccount = profile?.bank_account_number || '';
  const bankHolder = profile?.bank_account_holder || '';

  const isVerified = status === 'VERIFIED' || status === 'ACTIVE';

  const statusTone = isVerified
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'bg-amber-50 text-amber-700 border-amber-200';

  const payoutMethodLabel =
    settlementMethod === 'bank'
      ? 'Bank Transfer'
      : settlementMethod === 'airtel'
      ? 'Airtel Money B2C'
      : 'M-Pesa Express / B2C';

  const destinationLabel =
    settlementMethod === 'bank'
      ? bankAccount || '—'
      : settlementPhone;

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* ─── Page Header ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-sm shadow-indigo-200">
          <Wallet className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
          <p className="text-sm text-gray-500">
            Manage your business and settlement accounts
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-6">
        {/* ─── Business Account ─────────────────────────────────────── */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <span className="font-medium text-gray-900">Business Account</span>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusTone}`}
            >
              <Shield className="w-3 h-3" />
              {status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 font-medium uppercase tracking-wider">
                Account Name
              </label>
              <p className="text-sm font-semibold text-gray-900 mt-1">
                {businessName}
              </p>
            </div>

            <div>
              <label className="block text-xs text-gray-500 font-medium uppercase tracking-wider">
                Account Number
              </label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-mono font-semibold text-gray-900">
                  {merchantId}
                </span>
                <button
                  onClick={() => copyToClipboard(merchantId, 'account')}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Copy account number"
                >
                  {copied === 'account' ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 font-medium uppercase tracking-wider">
                Business Type
              </label>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {businessType}
              </p>
            </div>

            <div>
              <label className="block text-xs text-gray-500 font-medium uppercase tracking-wider">
                Registration Date
              </label>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {createdAt
                  ? new Date(createdAt).toLocaleDateString('en-KE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* ─── Settlement Details ───────────────────────────────────── */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <Smartphone className="w-5 h-5 text-indigo-600" />
            <span className="font-medium text-gray-900">Settlement Details</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 font-medium uppercase tracking-wider">
                Payout Method
              </label>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {payoutMethodLabel}
              </p>
            </div>

            <div>
              <label className="block text-xs text-gray-500 font-medium uppercase tracking-wider">
                {settlementMethod === 'bank' ? 'Bank Account' : 'Destination'}
              </label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-medium text-gray-900">
                  {destinationLabel}
                </span>
                <button
                  onClick={() => copyToClipboard(destinationLabel, 'destination')}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Copy destination"
                >
                  {copied === 'destination' ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {settlementMethod === 'bank'
                  ? bankHolder || 'Registered Owner Account'
                  : 'Registered Owner Wallet'}
              </p>
              {settlementMethod === 'bank' && bankName && (
                <p className="text-xs text-gray-500 mt-0.5">{bankName}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 font-medium uppercase tracking-wider">
                Settlement Schedule
              </label>
              <p className="text-sm font-medium text-gray-900 mt-1 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                Nightly at 12:00 AM EAT
              </p>
            </div>
          </div>

          <div className="mt-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>
              Settlements are processed nightly. Ensure your{' '}
              {settlementMethod === 'bank' ? 'bank account' : 'M-PESA number'} is
              registered and active.
            </span>
          </div>
        </div>

        {/* ─── Danger Zone — Delete Account ─────────────────────────── */}
        <div className="border-t border-gray-200 pt-6">
          <div className="rounded-xl border border-red-200 bg-red-50/40 p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-lg shrink-0">
                <Trash2 className="w-4 h-4 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-900">
                  Delete Account
                </h3>
                <p className="text-xs text-red-700 mt-0.5 leading-relaxed">
                  Permanently delete your account and all associated data. This
                  action cannot be undone. Any pending settlements will be
                  cancelled and remaining funds must be withdrawn first.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(true);
                    setDeleteConfirmText('');
                    setDeletePassword('');
                    setDeleteError('');
                  }}
                  className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete My Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Delete Confirmation Modal ───────────────────────────────── */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => !deleting && setShowDeleteModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-gray-200 flex items-start justify-between gap-3 bg-red-50">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-100 rounded-lg shrink-0">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-red-900">
                    Delete Account?
                  </h3>
                  <p className="text-[12px] text-red-700 mt-0.5">
                    This action is permanent and irreversible.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !deleting && setShowDeleteModal(false)}
                className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                disabled={deleting}
              >
                <X className="w-4 h-4 text-red-600" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-[12px] text-red-800 leading-relaxed">
                <strong>Warning:</strong> All transactions, KYC documents, API
                keys, and settings will be permanently removed. Pending
                settlements will be cancelled.
              </div>

              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
                  Type <span className="font-mono text-red-600">DELETE</span> to
                  confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => {
                    setDeleteConfirmText(e.target.value);
                    setDeleteError('');
                  }}
                  placeholder="DELETE"
                  disabled={deleting}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-[13px] font-mono focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
                  Enter your password
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value);
                    setDeleteError('');
                  }}
                  placeholder="Your account password"
                  disabled={deleting}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-[13px] focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none disabled:bg-gray-50"
                />
              </div>

              {deleteError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-[12px] p-2.5 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {deleteError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={
                    deleting ||
                    deleteConfirmText !== 'DELETE' ||
                    !deletePassword
                  }
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[13px] font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Account
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}