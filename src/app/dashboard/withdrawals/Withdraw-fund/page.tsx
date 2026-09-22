'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Smartphone,
  Landmark,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  Shield,
  Check,
  Loader2,
  Mail,
  X,
  ChevronLeft,
  Briefcase,
  Store,
  Users,
  RefreshCw,
  Info,
} from 'lucide-react';
import { useSession } from '@/hooks/useSession';

// ─── Channel definition ─────────────────────────────────────────────
type ChannelStatus = 'live' | 'soon';

interface WithdrawChannel {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: ChannelStatus;
}

const CHANNELS: WithdrawChannel[] = [
  {
    id: 'mpesa',
    name: 'M-PESA',
    description: 'Instant transfer',
    icon: Smartphone,
    status: 'live',
  },
  {
    id: 'airtel',
    name: 'Airtel Money',
    description: 'Coming soon',
    icon: Smartphone,
    status: 'soon',
  },
  {
    id: 'tkash',
    name: 'T-Kash',
    description: 'Coming soon',
    icon: Smartphone,
    status: 'soon',
  },
  {
    id: 'bank',
    name: 'Bank Transfer',
    description: 'Coming soon',
    icon: Landmark,
    status: 'soon',
  },
  {
    id: 'paybill',
    name: 'Paybill',
    description: 'Coming soon',
    icon: Briefcase,
    status: 'soon',
  },
  {
    id: 'till',
    name: 'Till (Buy Goods)',
    description: 'Coming soon',
    icon: Store,
    status: 'soon',
  },
  {
    id: 'internal',
    name: 'XecoFlow Account',
    description: 'Coming soon',
    icon: RefreshCw,
    status: 'soon',
  },
  {
    id: 'pochi',
    name: 'Pochi la Biashara',
    description: 'Coming soon',
    icon: Wallet,
    status: 'soon',
  },
];

// ─── Helpers ────────────────────────────────────────────────────────
function normalizeKenyanPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0') && cleaned.length === 10) return `254${cleaned.slice(1)}`;
  if (cleaned.startsWith('7') && cleaned.length === 9) return `254${cleaned}`;
  if (cleaned.startsWith('254') && cleaned.length === 12) return cleaned;
  throw new Error('Invalid Kenyan phone number');
}

function formatKes(value: number): string {
  return value.toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ─── Modal step type ────────────────────────────────────────────────
type ModalStep = 'details' | 'code' | 'success';

interface TransactionDetails {
  amount: number;
  phoneNumber: string;
  reference: string;
}

// ─── Main component ─────────────────────────────────────────────────
export default function WithdrawFundPage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();

  // ─── Page state ───────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'withdraw' | 'deposit'>('withdraw');
  const [depositAmount, setDepositAmount] = useState('');

  const [loading, setLoading] = useState(true);
  const [availableBalance, setAvailableBalance] = useState(0);

  // ─── Modal state ──────────────────────────────────────────────────
  const [openChannel, setOpenChannel] = useState<WithdrawChannel | null>(null);
  const [modalStep, setModalStep] = useState<ModalStep>('details');

  // Step 1: details
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPhone, setWithdrawPhone] = useState('');
  const [detailsError, setDetailsError] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);

  // Step 2: code
  const [requestId, setRequestId] = useState('');
  const [authorizationCode, setAuthorizationCode] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [codeError, setCodeError] = useState('');
  const [codeAttemptsRemaining, setCodeAttemptsRemaining] = useState<number | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Step 3: success
  const [transactionDetails, setTransactionDetails] = useState<TransactionDetails | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);

  // ─── Fetch balance + settlement details ───────────────────────────
  const fetchData = useCallback(async () => {
    if (!user?.merchantId) return;

    try {
      const paddedId = String(user.merchantId).padStart(8, '0');
      const accountNumber = `1-1001-${paddedId}`;

      const [identityRes, balanceRes] = await Promise.all([
        fetch('/api/business-account/identity', {
          credentials: 'include',
          cache: 'no-store',
        }),
        fetch(`/api/ledger/accounts/${accountNumber}/balance`, {
          credentials: 'include',
          cache: 'no-store',
        }),
      ]);

      if (identityRes.ok) {
        const identityData = await identityRes.json();
        if (identityData?.settlement_phone) {
          setWithdrawPhone(identityData.settlement_phone);
        }
      }

      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        if (balanceData.success) {
          setAvailableBalance(Number(balanceData.balance) || 0);
        }
      }
    } catch {
      // Silent fail — the modal will show current defaults
    } finally {
      setLoading(false);
    }
  }, [user?.merchantId]);

  useEffect(() => {
    if (!sessionLoading && user?.merchantId) {
      fetchData();
    }
  }, [sessionLoading, user?.merchantId, fetchData]);

  // ─── Resend countdown ─────────────────────────────────────────────
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  // ─── Esc closes the modal ─────────────────────────────────────────
  useEffect(() => {
    if (!openChannel) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSendingCode && !isVerifying && !isResending) {
        closeModal();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openChannel, isSendingCode, isVerifying, isResending]);

  // ─── Modal controls ───────────────────────────────────────────────
  const openModal = (channel: WithdrawChannel) => {
    if (channel.status !== 'live') return;
    setOpenChannel(channel);
    setModalStep('details');
    resetModalState();
  };

  const resetModalState = () => {
    setWithdrawAmount('');
    setDetailsError('');
    setAuthorizationCode('');
    setCodeError('');
    setCodeAttemptsRemaining(null);
    setRequestId('');
    setMaskedEmail('');
    setResendCountdown(0);
    setTransactionDetails(null);
  };

  const closeModal = () => {
    if (isSendingCode || isVerifying || isResending) return;
    setOpenChannel(null);
    setModalStep('details');
    resetModalState();
  };

  const backToDetails = () => {
    setModalStep('details');
    setAuthorizationCode('');
    setCodeError('');
    setCodeAttemptsRemaining(null);
  };

  // ─── Step 1: submit details ───────────────────────────────────────
  const submitDetails = async () => {
    if (!openChannel) return;

    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      setDetailsError('Please enter a valid amount');
      return;
    }
    if (amount > availableBalance) {
      setDetailsError(`Insufficient balance. Available: KES ${formatKes(availableBalance)}`);
      return;
    }
    if (!withdrawPhone || withdrawPhone.length < 10) {
      setDetailsError('Please enter a valid phone number');
      return;
    }

    setDetailsError('');
    setIsSendingCode(true);

    try {
      const normalizedPhone = normalizeKenyanPhone(withdrawPhone);

      const res = await fetch('/api/withdrawals/request-code', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          phoneNumber: normalizedPhone,
          withdrawTo: 'mobile',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to send authorization code');
      }

      setRequestId(data.data.requestId);
      setMaskedEmail(data.data.maskedEmail || '');
      setAuthorizationCode('');
      setCodeError('');
      setCodeAttemptsRemaining(null);
      setResendCountdown(30);
      setModalStep('code');
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : 'Failed to send code');
    } finally {
      setIsSendingCode(false);
    }
  };

  // ─── Step 2: verify code ──────────────────────────────────────────
  const submitCode = async () => {
    if (!authorizationCode || authorizationCode.length !== 6) {
      setCodeError('Please enter the 6-digit code');
      return;
    }

    setIsVerifying(true);
    setCodeError('');

    try {
      const res = await fetch('/api/withdrawals/confirm', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, code: authorizationCode.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (typeof data.attemptsRemaining === 'number') {
          setCodeAttemptsRemaining(data.attemptsRemaining);
        }
        if (data.attemptsRemaining === 0) {
          setCodeError('Too many failed attempts. Please start a new withdrawal.');
        } else {
          setCodeError(data.message || 'Invalid code. Please try again.');
        }
        setAuthorizationCode('');
        return;
      }

      const amount = parseFloat(withdrawAmount);
      const normalizedPhone = normalizeKenyanPhone(withdrawPhone);

      setTransactionDetails({
        amount,
        phoneNumber: normalizedPhone,
        reference: `WD-${Date.now().toString().slice(-6)}`,
      });

      setAvailableBalance((prev) => Math.max(0, prev - amount));
      setModalStep('success');
    } catch (err) {
      setCodeError(err instanceof Error ? err.message : 'Failed to verify code');
    } finally {
      setIsVerifying(false);
    }
  };

  // ─── Step 2: resend code ──────────────────────────────────────────
  const resendCode = async () => {
    if (resendCountdown > 0 || isResending) return;

    setIsResending(true);
    setCodeError('');

    try {
      const res = await fetch('/api/withdrawals/resend-code', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to resend code');
      }

      setResendCountdown(30);
      setCodeAttemptsRemaining(null);
      setAuthorizationCode('');
      setCodeError('');
    } catch (err) {
      setCodeError(err instanceof Error ? err.message : 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  // ─── Loading states ───────────────────────────────────────────────
  if (sessionLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (!user) return null;

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div className="max-w-[1400px] mx-auto space-y-5 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl shadow-sm bg-gradient-to-br from-rose-500 to-rose-600 shadow-rose-200">
            <ArrowUpRight className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Withdraw Funds</h1>
            <p className="text-sm text-gray-500">
              Send money from your XecoFlow wallet to any destination
            </p>
          </div>
        </div>
      </div>

      {/* Balance card */}
      <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Available Balance
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              KES {formatKes(availableBalance)}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50">
            <Wallet className="w-6 h-6 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Channel selector */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 mb-1">
          Where would you like to send?
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          Choose a destination. Live channels are available now; more coming soon.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {CHANNELS.map((channel) => {
            const Icon = channel.icon;
            const isLive = channel.status === 'live';
            return (
              <button
                key={channel.id}
                type="button"
                onClick={() => openModal(channel)}
                disabled={!isLive}
                className={`relative flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-all ${
                  isLive
                    ? 'border-gray-200 bg-white hover:border-rose-400 hover:shadow-md cursor-pointer'
                    : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-70'
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    isLive ? 'bg-rose-50' : 'bg-gray-100'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isLive ? 'text-rose-600' : 'text-gray-400'
                    }`}
                  />
                </div>
                <div className="w-full">
                  <p
                    className={`text-sm font-semibold ${
                      isLive ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {channel.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {channel.description}
                  </p>
                </div>
                {!isLive && (
                  <span className="absolute top-2 right-2 text-[10px] font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    Soon
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Info panel */}
      <div className="bg-gradient-to-br from-amber-50 to-amber-100/30 border border-amber-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-amber-900">
              Important Information
            </h4>
            <ul className="text-xs text-amber-800 mt-2 space-y-1">
              <li>• M-PESA withdrawals are processed in 5–30 seconds.</li>
              <li>• Minimum withdrawal: KES 10. Maximum: KES 250,000.</li>
              <li>• An authorization code will be sent to your email.</li>
              <li>• Verify the phone number before confirming.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ═══════════════ Withdrawal Modal (Option C) ═══════════════ */}
      {openChannel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            ref={modalRef}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200"
          >
            {/* ─── Modal header ──────────────────────────────── */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                {modalStep === 'code' && (
                  <button
                    type="button"
                    onClick={backToDetails}
                    disabled={isVerifying || isResending}
                    className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors"
                    aria-label="Back"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                )}
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-rose-50">
                    <openChannel.icon className="w-4 h-4 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {modalStep === 'details' && `${openChannel.name} Withdrawal`}
                      {modalStep === 'code' && 'Verify Withdrawal'}
                      {modalStep === 'success' && 'Withdrawal Initiated'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {modalStep === 'details' && 'Enter destination and amount'}
                      {modalStep === 'code' && 'Enter the code from your email'}
                      {modalStep === 'success' && 'Confirmation sent to your email'}
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={isSendingCode || isVerifying || isResending}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* ─── Step 1: Details ───────────────────────────── */}
            {modalStep === 'details' && (
              <div className="p-5 space-y-5">
                {/* Destination section */}
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Destination
                  </p>

                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="tel"
                      value={withdrawPhone}
                      onChange={(e) => {
                        setWithdrawPhone(e.target.value);
                        if (detailsError) setDetailsError('');
                      }}
                      placeholder="0712071385"
                      disabled={isSendingCode}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all outline-none disabled:opacity-60"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    The M-PESA number to receive the funds.
                  </p>
                </div>

                {/* Amount section */}
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Amount
                  </p>

                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Amount (KES) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">
                      KES
                    </span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={withdrawAmount}
                      onChange={(e) => {
                        setWithdrawAmount(e.target.value);
                        if (detailsError) setDetailsError('');
                      }}
                      disabled={isSendingCode}
                      className="w-full pl-14 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base font-semibold focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all outline-none disabled:opacity-60"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    Min: KES 10 · Max: KES 250,000
                  </p>
                </div>

                {/* Fee preview */}
                <div className="bg-gray-50 rounded-xl p-3.5 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fee</span>
                    <span className="text-gray-700 font-medium">KES 0.00</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-1.5">
                    <span className="text-gray-500">Total</span>
                    <span className="text-gray-900 font-bold">
                      KES{' '}
                      {formatKes(
                        parseFloat(withdrawAmount || '0') || 0
                      )}
                    </span>
                  </div>
                </div>

                {detailsError && (
                  <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{detailsError}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={submitDetails}
                  disabled={isSendingCode}
                  className="w-full py-3 bg-gradient-to-r from-rose-500 to-rose-600 hover:shadow-lg hover:shadow-rose-200 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSendingCode ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending code…
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Withdraw Funds
                    </>
                  )}
                </button>
              </div>
            )}

            {/* ─── Step 2: Code ──────────────────────────────── */}
            {modalStep === 'code' && (
              <div className="p-5 space-y-5">
                <div className="flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-rose-500" />
                  </div>
                </div>

                {maskedEmail && (
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg py-2 px-3">
                    <Mail className="w-3.5 h-3.5" />
                    <span>
                      Code sent to <strong className="text-gray-700">{maskedEmail}</strong>
                    </span>
                  </div>
                )}

                {/* Transaction summary */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount</span>
                    <span className="text-lg font-bold text-rose-600">
                      KES {formatKes(parseFloat(withdrawAmount) || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">To</span>
                    <span className="font-medium text-gray-900">
                      {withdrawPhone}
                    </span>
                  </div>
                </div>

                {/* Code input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                    Authorization Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={authorizationCode}
                    onChange={(e) => {
                      setAuthorizationCode(e.target.value.replace(/\D/g, ''));
                      if (codeError) setCodeError('');
                    }}
                    placeholder="000000"
                    autoFocus
                    disabled={isVerifying}
                    className="w-full text-center text-3xl font-mono tracking-[0.5em] py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all disabled:opacity-60"
                  />
                  {codeError && (
                    <div className="mt-2 flex items-center justify-center gap-2 text-sm text-red-600">
                      <XCircle className="w-4 h-4" />
                      <span>{codeError}</span>
                    </div>
                  )}
                  {codeAttemptsRemaining !== null && codeAttemptsRemaining > 0 && (
                    <p className="mt-1 text-xs text-amber-600 text-center">
                      {codeAttemptsRemaining} attempt
                      {codeAttemptsRemaining !== 1 ? 's' : ''} remaining
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={submitCode}
                    disabled={isVerifying || authorizationCode.length !== 6}
                    className="w-full py-3 bg-gradient-to-r from-rose-500 to-rose-600 hover:shadow-lg hover:shadow-rose-200 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verifying…
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Verify & Withdraw
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={resendCode}
                    disabled={resendCountdown > 0 || isResending}
                    className="w-full py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isResending
                      ? 'Sending…'
                      : resendCountdown > 0
                      ? `Resend code in ${resendCountdown}s`
                      : 'Resend code'}
                  </button>
                </div>
              </div>
            )}

            {/* ─── Step 3: Success ───────────────────────────── */}
            {modalStep === 'success' && transactionDetails && (
              <div className="p-6 text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Withdrawal Initiated
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  A confirmation has been sent to your email.
                </p>

                <div className="mt-5 bg-gray-50 rounded-xl p-4 text-left space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Amount</span>
                    <span className="text-lg font-bold text-emerald-600">
                      KES {formatKes(transactionDetails.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">To</span>
                    <span className="text-sm font-medium text-gray-900">
                      {transactionDetails.phoneNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Reference</span>
                    <span className="text-sm font-mono text-gray-600">
                      {transactionDetails.reference}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Date</span>
                    <span className="text-sm text-gray-600">
                      {new Date().toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    closeModal();
                    router.push('/dashboard');
                  }}
                  className="w-full mt-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-all"
                >
                  Back to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}