'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { ComponentType } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  AlertCircle,
  Banknote,
  Briefcase,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Info,
  Landmark,
  Loader2,
  Mail,
  RefreshCw,
  Send,
  ShieldCheck,
  Smartphone,
  Store,
  Wallet,
  X,
  XCircle,
} from 'lucide-react';
import { useSession } from '@/hooks/useSession';

type ChannelStatus = 'live' | 'soon';

interface WithdrawChannel {
  id: string;
  name: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
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

const MIN_WITHDRAWAL = 10;
const MAX_WITHDRAWAL = 250_000;

function normalizeKenyanPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `254${cleaned.slice(1)}`;
  }

  if (cleaned.startsWith('7') && cleaned.length === 9) {
    return `254${cleaned}`;
  }

  if (cleaned.startsWith('254') && cleaned.length === 12) {
    return cleaned;
  }

  throw new Error('Invalid Kenyan phone number');
}

function formatKes(value: number): string {
  return value.toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPhoneForDisplay(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('254') && cleaned.length === 12) {
    return `+254 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  }

  return phone;
}

type ModalStep = 'details' | 'code' | 'success';

interface TransactionDetails {
  amount: number;
  phoneNumber: string;
  reference: string;
}

export default function WithdrawFundPage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();

  const [loading, setLoading] = useState(true);
  const [availableBalance, setAvailableBalance] = useState(0);

  // Destination selection
  const [selectedChannelId, setSelectedChannelId] = useState('mpesa');

  // Withdrawal modal
  const [openChannel, setOpenChannel] = useState<WithdrawChannel | null>(null);
  const [modalStep, setModalStep] = useState<ModalStep>('details');

  // Step 1: details
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPhone, setWithdrawPhone] = useState('');
  const [detailsError, setDetailsError] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);

  // Step 2: authorization code
  const [requestId, setRequestId] = useState('');
  const [authorizationCode, setAuthorizationCode] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [codeError, setCodeError] = useState('');
  const [codeAttemptsRemaining, setCodeAttemptsRemaining] = useState<number | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Step 3: success
  const [transactionDetails, setTransactionDetails] =
    useState<TransactionDetails | null>(null);

  const selectedChannel = useMemo(
    () => CHANNELS.find((channel) => channel.id === selectedChannelId) ?? CHANNELS[0],
    [selectedChannelId]
  );

  const enteredAmount = Number.parseFloat(withdrawAmount) || 0;
  const remainingAfterWithdrawal = Math.max(0, availableBalance - enteredAmount);

  // Fetch balance + settlement details.
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
      // Keep the UI usable with the current defaults.
    } finally {
      setLoading(false);
    }
  }, [user?.merchantId]);

  useEffect(() => {
    if (!sessionLoading && user?.merchantId) {
      fetchData();
    }
  }, [sessionLoading, user?.merchantId, fetchData]);

  useEffect(() => {
    if (resendCountdown <= 0) return;

    const timer = window.setTimeout(
      () => setResendCountdown((current) => current - 1),
      1000
    );

    return () => window.clearTimeout(timer);
  }, [resendCountdown]);

  // Escape closes the modal when no request is in progress.
  useEffect(() => {
    if (!openChannel) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === 'Escape' &&
        !isSendingCode &&
        !isVerifying &&
        !isResending
      ) {
        closeModal();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);

    // Modal state intentionally controls this listener.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openChannel, isSendingCode, isVerifying, isResending]);

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

  const openModal = (channel: WithdrawChannel) => {
    if (channel.status !== 'live') return;

    resetModalState();
    setSelectedChannelId(channel.id);
    setOpenChannel(channel);
    setModalStep('details');
  };

  const continueToWithdrawal = () => {
    if (selectedChannel.status !== 'live') return;
    openModal(selectedChannel);
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

  const submitDetails = async () => {
    if (!openChannel) return;

    const amount = Number.parseFloat(withdrawAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setDetailsError('Enter the amount you want to withdraw.');
      return;
    }

    if (amount < MIN_WITHDRAWAL) {
      setDetailsError(`Minimum withdrawal amount is KES ${formatKes(MIN_WITHDRAWAL)}.`);
      return;
    }

    if (amount > MAX_WITHDRAWAL) {
      setDetailsError(`Maximum withdrawal amount is KES ${formatKes(MAX_WITHDRAWAL)}.`);
      return;
    }

    if (amount > availableBalance) {
      setDetailsError(
        `Insufficient balance. Available: KES ${formatKes(availableBalance)}.`
      );
      return;
    }

    if (!withdrawPhone || withdrawPhone.replace(/\D/g, '').length < 10) {
      setDetailsError('Enter a valid M-PESA phone number.');
      return;
    }

    setDetailsError('');
    setIsSendingCode(true);

    try {
      const normalizedPhone = normalizeKenyanPhone(withdrawPhone);

      const response = await fetch('/api/withdrawals/request-code', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          phoneNumber: normalizedPhone,
          withdrawTo: 'mobile',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || data.error || 'Failed to send authorization code'
        );
      }

      setRequestId(data.data.requestId);
      setMaskedEmail(data.data.maskedEmail || '');
      setAuthorizationCode('');
      setCodeError('');
      setCodeAttemptsRemaining(null);
      setResendCountdown(30);
      setModalStep('code');
    } catch (error) {
      setDetailsError(
        error instanceof Error ? error.message : 'Failed to send authorization code'
      );
    } finally {
      setIsSendingCode(false);
    }
  };

  const submitCode = async () => {
    if (!authorizationCode || authorizationCode.length !== 6) {
      setCodeError('Enter the 6-digit authorization code.');
      return;
    }

    setIsVerifying(true);
    setCodeError('');

    try {
      const response = await fetch('/api/withdrawals/confirm', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          code: authorizationCode.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
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

      const amount = Number.parseFloat(withdrawAmount);
      const normalizedPhone = normalizeKenyanPhone(withdrawPhone);

      setTransactionDetails({
        amount,
        phoneNumber: normalizedPhone,
        reference: `WD-${Date.now().toString().slice(-6)}`,
      });

      setAvailableBalance((previous) => Math.max(0, previous - amount));
      setModalStep('success');
    } catch (error) {
      setCodeError(
        error instanceof Error ? error.message : 'Failed to verify authorization code'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const resendCode = async () => {
    if (resendCountdown > 0 || isResending) return;

    setIsResending(true);
    setCodeError('');

    try {
      const response = await fetch('/api/withdrawals/resend-code', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to resend code');
      }

      setResendCountdown(30);
      setCodeAttemptsRemaining(null);
      setAuthorizationCode('');
      setCodeError('');
    } catch (error) {
      setCodeError(
        error instanceof Error ? error.message : 'Failed to resend code'
      );
    } finally {
      setIsResending(false);
    }
  };

  if (sessionLoading || loading) {
    return (
      <div className="min-h-[520px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-11 w-11 rounded-full border-2 border-rose-100 border-t-rose-500 animate-spin" />
          <p className="text-sm text-slate-500">Loading withdrawal details…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <main className="mx-auto w-full max-w-[1380px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[27px] font-bold tracking-[-0.02em] text-slate-950">
                  Withdraw Funds
                </h1>
                <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 sm:inline-flex">
                  Secure
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Send money from your XecoFlow wallet to an available destination.
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-500 shadow-sm md:flex">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Protected withdrawal
          </div>
        </div>

        {/* Balance */}
        <section className="relative mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-rose-50/70 to-transparent" />

          <div className="relative flex items-center justify-between gap-4 px-5 py-5 sm:px-7 sm:py-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50">
                <Wallet className="h-6 w-6 text-rose-600" />
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Available balance
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  KES {formatKes(availableBalance)}
                </p>
              </div>
            </div>

            <div className="hidden rounded-xl border border-rose-100 bg-white/80 px-4 py-3 text-right sm:block">
              <p className="text-[11px] font-medium text-slate-500">Withdrawal limit</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">
                Up to KES {formatKes(MAX_WITHDRAWAL)}
              </p>
            </div>
          </div>
        </section>

        {/* Main content */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6">
            <div className="mb-5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                  1
                </span>
                <h2 className="text-base font-bold text-slate-950">
                  Choose a destination
                </h2>
              </div>

              <p className="mt-1 pl-9 text-sm text-slate-500">
                Select where you want the funds to be sent.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {CHANNELS.map((channel) => {
                const Icon = channel.icon;
                const isLive = channel.status === 'live';
                const isSelected = selectedChannelId === channel.id && isLive;

                return (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => isLive && setSelectedChannelId(channel.id)}
                    disabled={!isLive}
                    aria-pressed={isSelected}
                    className={[
                      'group relative min-h-[142px] rounded-2xl border p-4 text-left transition-all',
                      isSelected
                        ? 'border-rose-500 bg-rose-50/50 shadow-[0_8px_24px_rgba(244,63,94,0.10)]'
                        : isLive
                          ? 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-rose-300 hover:shadow-md'
                          : 'cursor-not-allowed border-slate-100 bg-slate-50/80',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={[
                          'flex h-10 w-10 items-center justify-center rounded-xl',
                          isSelected
                            ? 'bg-rose-100 text-rose-600'
                            : isLive
                              ? 'bg-slate-100 text-slate-600 group-hover:bg-rose-50 group-hover:text-rose-600'
                              : 'bg-slate-100 text-slate-400',
                        ].join(' ')}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      {isSelected ? (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                      ) : !isLive ? (
                        <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">
                          Soon
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                          Available
                        </span>
                      )}
                    </div>

                    <div className="mt-5">
                      <p
                        className={[
                          'text-sm font-bold',
                          isLive ? 'text-slate-900' : 'text-slate-500',
                        ].join(' ')}
                      >
                        {channel.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {channel.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Information */}
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm">
                  <Info className="h-4 w-4" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Before you withdraw
                  </h3>

                  <div className="mt-2 grid gap-2 text-xs leading-5 text-slate-500 sm:grid-cols-2">
                    <p className="flex gap-2">
                      <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                      M-PESA withdrawals are normally processed in 5–30 seconds.
                    </p>
                    <p className="flex gap-2">
                      <Banknote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                      Minimum KES {formatKes(MIN_WITHDRAWAL)} · Maximum KES{' '}
                      {formatKes(MAX_WITHDRAWAL)}.
                    </p>
                    <p className="flex gap-2">
                      <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                      An authorization code will be sent to your email.
                    </p>
                    <p className="flex gap-2">
                      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                      Confirm the phone number before completing the withdrawal.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Withdrawal summary */}
          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)] lg:sticky lg:top-6">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
              Withdrawal details
            </p>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <selectedChannel.icon className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-bold text-slate-900">
                  {selectedChannel.name}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {selectedChannel.description}
                </p>
              </div>
            </div>

            <div className="my-5 border-t border-slate-100" />

            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500">Available balance</p>
                <p className="mt-1 text-xl font-bold text-slate-950">
                  KES {formatKes(availableBalance)}
                </p>
              </div>

              <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-3.5">
                <div className="flex gap-2.5">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                  <p className="text-xs leading-5 text-slate-600">
                    Your withdrawal will be protected by an email authorization
                    code before it is submitted.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={continueToWithdrawal}
                disabled={selectedChannel.status !== 'live'}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-200 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </button>

              <p className="text-center text-[11px] leading-4 text-slate-400">
                You will review the amount and destination before authorization.
              </p>
            </div>
          </aside>
        </div>
      </main>

      {/* Withdrawal modal */}
      {openChannel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Withdrawal"
        >
          <div className="max-h-[92vh] w-full max-w-[470px] overflow-y-auto rounded-2xl border border-white/70 bg-white shadow-2xl">
            {/* Modal header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
              <div className="flex items-center gap-3">
                {modalStep === 'code' && (
                  <button
                    type="button"
                    onClick={backToDetails}
                    disabled={isVerifying || isResending}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-40"
                    aria-label="Back"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                )}

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <openChannel.icon className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {modalStep === 'details' && `${openChannel.name} withdrawal`}
                    {modalStep === 'code' && 'Verify withdrawal'}
                    {modalStep === 'success' && 'Withdrawal initiated'}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {modalStep === 'details' && 'Enter the withdrawal details'}
                    {modalStep === 'code' && 'Confirm the authorization code'}
                    {modalStep === 'success' && 'Your request has been submitted'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isSendingCode || isVerifying || isResending}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Details step */}
            {modalStep === 'details' && (
              <div className="space-y-5 p-5 sm:p-6">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Available balance
                      </p>
                      <p className="mt-1 text-base font-bold text-slate-950">
                        KES {formatKes(availableBalance)}
                      </p>
                    </div>

                    <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-emerald-700 shadow-sm">
                      Ready
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="withdraw-phone"
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    M-PESA phone number
                    <span className="ml-1 text-rose-500">*</span>
                  </label>

                  <div className="relative">
                    <Smartphone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="withdraw-phone"
                      type="tel"
                      value={withdrawPhone}
                      onChange={(event) => {
                        setWithdrawPhone(event.target.value);
                        if (detailsError) setDetailsError('');
                      }}
                      placeholder="0712 071 385"
                      disabled={isSendingCode}
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 disabled:opacity-60"
                    />
                  </div>

                  <p className="mt-1.5 text-xs text-slate-400">
                    Enter the number that should receive the funds.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="withdraw-amount"
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    Withdrawal amount
                    <span className="ml-1 text-rose-500">*</span>
                  </label>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                      KES
                    </span>

                    <input
                      id="withdraw-amount"
                      type="number"
                      min={MIN_WITHDRAWAL}
                      max={MAX_WITHDRAWAL}
                      step="0.01"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={withdrawAmount}
                      onChange={(event) => {
                        setWithdrawAmount(event.target.value);
                        if (detailsError) setDetailsError('');
                      }}
                      disabled={isSendingCode}
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-14 pr-4 text-lg font-bold text-slate-950 outline-none transition placeholder:text-slate-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 disabled:opacity-60"
                    />
                  </div>

                  <div className="mt-1.5 flex items-center justify-between text-xs text-slate-400">
                    <span>Min KES {formatKes(MIN_WITHDRAWAL)}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setWithdrawAmount(
                          Math.min(availableBalance, MAX_WITHDRAWAL).toFixed(2)
                        )
                      }
                      disabled={isSendingCode || availableBalance <= 0}
                      className="font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-40"
                    >
                      Use available balance
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Withdrawal amount</span>
                      <span className="font-semibold text-slate-900">
                        KES {formatKes(enteredAmount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Fee</span>
                      <span className="font-semibold text-slate-900">KES 0.00</span>
                    </div>

                    <div className="border-t border-slate-200 pt-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">Total</span>
                        <span className="text-base font-bold text-slate-950">
                          KES {formatKes(enteredAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {enteredAmount > 0 && enteredAmount <= availableBalance && (
                  <p className="text-xs text-slate-400">
                    Estimated remaining balance:{' '}
                    <span className="font-semibold text-slate-600">
                      KES {formatKes(remainingAfterWithdrawal)}
                    </span>
                  </p>
                )}

                {detailsError && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{detailsError}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={submitDetails}
                  disabled={isSendingCode}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-3.5 text-sm font-bold text-white transition hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSendingCode ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending authorization code…
                    </>
                  ) : (
                    <>
                      Continue to verification
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-[11px] leading-4 text-slate-400">
                  Your withdrawal will require a one-time authorization code.
                </p>
              </div>
            )}

            {/* Verification step */}
            {modalStep === 'code' && (
              <div className="space-y-5 p-5 sm:p-6">
                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                    <ShieldCheck className="h-7 w-7" />
                  </div>

                  <h3 className="mt-4 text-base font-bold text-slate-950">
                    Confirm this withdrawal
                  </h3>

                  <p className="mx-auto mt-1 max-w-sm text-sm leading-5 text-slate-500">
                    Enter the 6-digit code we sent to your email to authorize
                    this transaction.
                  </p>
                </div>

                {maskedEmail && (
                  <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
                    <Mail className="h-3.5 w-3.5" />
                    Code sent to{' '}
                    <strong className="font-semibold text-slate-700">
                      {maskedEmail}
                    </strong>
                  </div>
                )}

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Amount</span>
                    <span className="text-lg font-bold text-slate-950">
                      KES {formatKes(enteredAmount)}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-xs text-slate-500">M-PESA number</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {formatPhoneForDisplay(withdrawPhone)}
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="authorization-code"
                    className="mb-2 block text-center text-sm font-semibold text-slate-800"
                  >
                    Authorization code
                  </label>

                  <input
                    id="authorization-code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={authorizationCode}
                    onChange={(event) => {
                      setAuthorizationCode(
                        event.target.value.replace(/\D/g, '').slice(0, 6)
                      );
                      if (codeError) setCodeError('');
                    }}
                    placeholder="000000"
                    autoFocus
                    disabled={isVerifying}
                    className="w-full rounded-xl border-2 border-slate-200 bg-white py-3.5 text-center font-mono text-3xl font-bold tracking-[0.45em] text-slate-950 outline-none transition placeholder:text-slate-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 disabled:opacity-60"
                  />

                  {codeError && (
                    <div className="mt-2 flex items-center justify-center gap-2 text-sm text-red-600">
                      <XCircle className="h-4 w-4" />
                      <span>{codeError}</span>
                    </div>
                  )}

                  {codeAttemptsRemaining !== null &&
                    codeAttemptsRemaining > 0 && (
                      <p className="mt-2 text-center text-xs text-amber-600">
                        {codeAttemptsRemaining} attempt
                        {codeAttemptsRemaining !== 1 ? 's' : ''} remaining
                      </p>
                    )}
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={submitCode}
                    disabled={isVerifying || authorizationCode.length !== 6}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-3.5 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verifying…
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Verify & withdraw
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={resendCode}
                    disabled={resendCountdown > 0 || isResending}
                    className="w-full rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isResending
                      ? 'Sending new code…'
                      : resendCountdown > 0
                        ? `Resend code in ${resendCountdown}s`
                        : 'Resend authorization code'}
                  </button>
                </div>
              </div>
            )}

            {/* Success step */}
            {modalStep === 'success' && transactionDetails && (
              <div className="p-6 text-center sm:p-7">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle className="h-9 w-9" />
                </div>

                <h3 className="mt-5 text-xl font-bold text-slate-950">
                  Withdrawal initiated
                </h3>

                <p className="mx-auto mt-1 max-w-sm text-sm leading-5 text-slate-500">
                  Your withdrawal request has been submitted successfully. A
                  confirmation has been sent to your email.
                </p>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Amount</span>
                    <span className="text-lg font-bold text-emerald-600">
                      KES {formatKes(transactionDetails.amount)}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2.5 border-t border-slate-200 pt-3">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs text-slate-500">Destination</span>
                      <span className="text-sm font-semibold text-slate-900">
                        M-PESA
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs text-slate-500">Phone</span>
                      <span className="text-sm font-semibold text-slate-900">
                        {formatPhoneForDisplay(transactionDetails.phoneNumber)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs text-slate-500">Reference</span>
                      <span className="font-mono text-xs font-semibold text-slate-700">
                        {transactionDetails.reference}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs text-slate-500">Status</span>
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                        Processing
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    closeModal();
                    router.push('/dashboard');
                  }}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  Back to dashboard
                  <ArrowRightIcon />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ArrowRightIcon() {
  return <ArrowUpRight className="h-4 w-4" />;
}
