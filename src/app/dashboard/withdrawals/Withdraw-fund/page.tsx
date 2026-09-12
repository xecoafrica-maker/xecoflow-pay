'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  CreditCard,
  Smartphone,
  Landmark,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Send,
  RefreshCw,
  Shield,
  Check,
  Loader2,
  Mail,
} from 'lucide-react';
import { useActivityLogger } from '@/hooks/useActivityLogger';

// ─── Helper Functions ──────────────────────────────────────────────
const maskAccountNumber = (account: string) => {
  if (!account || account.length <= 6) return account;
  const start = account.slice(0, 4);
  const end = account.slice(-3);
  return `${start}xxxxx${end}`;
};

const normalizeKenyanPhone = (phone: string): string => {
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
};

// ─── Colors & Icons ──────────────────────────────────────────────────
const methodIcons = {
  'M-PESA': Smartphone,
  'Bank Transfer': Landmark,
  'Airtel Money': Smartphone,
  'Credit Card': CreditCard,
};

export default function WithdrawFundPage() {
  const router = useRouter();
  const { log, ActivityActions } = useActivityLogger();

  // ─── State ────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'withdraw' | 'deposit'>('withdraw');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPhone, setWithdrawPhone] = useState('');
  const [depositAmount, setDepositAmount] = useState('');

  // Real Data State
  const [loading, setLoading] = useState(true);
  const [merchantData, setMerchantData] = useState<any>(null);
  const [settlementData, setSettlementData] = useState<any>(null);
  const [availableBalance, setAvailableBalance] = useState(0);

  // UI State
  const [withdrawTo, setWithdrawTo] = useState<'mobile' | 'bank'>('mobile');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // ─── Authorization Flow State (NEW) ───────────────────────────────
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [requestId, setRequestId] = useState('');
  const [authorizationCode, setAuthorizationCode] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [codeError, setCodeError] = useState('');
  const [codeAttemptsRemaining, setCodeAttemptsRemaining] = useState<number | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // ✅ Prevent duplicate logging
  const hasLoggedView = useRef(false);
  const isLoggingView = useRef(false);

  // ─── Auth & Profile ────────────────────────────────────────────────
  useEffect(() => {
    let merchant = null;
    let id = '';

    try {
      const stored = localStorage.getItem('merchant');
      if (stored) {
        merchant = JSON.parse(stored);
        id = String(merchant.merchant_id || merchant.merchantId || '');
      }
    } catch (e) {
      console.error('Failed to parse merchant data', e);
    }

    if (!merchant || !id) {
      console.warn('⚠️ No merchant found in localStorage, redirecting to login');
      router.push('/login?session=expired');
      return;
    }

    console.log('✅ Merchant data loaded:', merchant);
    setMerchantData(merchant);

    const fetchData = async () => {
      try {
        const merchantId = merchant.merchant_id || merchant.merchantId;
        if (!merchantId) {
          setLoading(false);
          return;
        }

        const paddedId = String(merchantId).padStart(8, '0');
        const accountNumber = `1-1001-${paddedId}`;

        const [identityRes, balanceRes] = await Promise.all([
          fetch('/api/business-account/identity', {
            credentials: 'include',
          }),
          fetch(`/api/ledger/accounts/${accountNumber}/balance`, {
            credentials: 'include',
          })
        ]);

        const identityData = await identityRes.json();
        if (identityData) {
          setSettlementData({
            settlement_method: identityData.settlement_method || 'mpesa',
            settlement_phone: identityData.settlement_phone || '',
            bank_name: identityData.bank_name || '',
            bank_account_number: identityData.bank_account_number || '',
            bank_account_holder: identityData.bank_account_holder || '',
          });
          if (identityData.settlement_phone) {
            setWithdrawPhone(identityData.settlement_phone);
          }
        }

        const balanceData = await balanceRes.json();
        if (balanceData.success) {
          setAvailableBalance(balanceData.balance);
        }

      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // ─── Log View - Only once per page visit ──────────────────────
  useEffect(() => {
    const logView = async () => {
      if (isLoggingView.current || hasLoggedView.current || !merchantData) return;

      try {
        isLoggingView.current = true;
        await log(
          ActivityActions.VIEW_WITHDRAW_HISTORY,
          `Viewed withdraw funds page for ${merchantData?.business_name || merchantData?.businessName || 'business'}`
        );
        hasLoggedView.current = true;
      } catch (error) {
        console.debug('Withdraw funds view logging skipped:', error);
      } finally {
        isLoggingView.current = false;
      }
    };

    if (merchantData && !hasLoggedView.current) {
      logView();
    }
  }, [merchantData, log]);

  // ─── Resend countdown timer ───────────────────────────────────────
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  // ─── Handlers ──────────────────────────────────────────────────────

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (amount > availableBalance) {
      setError(`Insufficient balance. Available: KES ${availableBalance.toLocaleString()}`);
      return;
    }
    if (!withdrawPhone || withdrawPhone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setError('');
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
          withdrawTo,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to send authorization code');
      }

      // Store the transaction details for later
      setTransactionDetails({
        type: 'Withdrawal',
        method: withdrawTo === 'mobile' ? 'M-PESA' : 'Bank Transfer',
        amount,
        recipient: `M-PESA - ${normalizedPhone}`,
        reference: `WD-${Date.now().toString().slice(-6)}`,
        withdrawTo,
        phoneNumber: normalizedPhone,
      });

      // Store authorization state
      setRequestId(data.data.requestId);
      setMaskedEmail(data.data.maskedEmail);
      setAuthorizationCode('');
      setCodeError('');
      setCodeAttemptsRemaining(null);
      setResendCountdown(30); // 30s throttle
      setShowCodeModal(true);

    } catch (err: any) {
      setError(err.message || 'Failed to send authorization code');
    } finally {
      setIsSendingCode(false);
    }
  };

  const verifyCodeAndWithdraw = async () => {
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
        body: JSON.stringify({
          requestId,
          code: authorizationCode.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        // Check for attempts remaining
        if (typeof data.attemptsRemaining === 'number') {
          setCodeAttemptsRemaining(data.attemptsRemaining);
        }

        // If out of attempts, close modal and reset
        if (data.attemptsRemaining === 0) {
          setCodeError('Too many failed attempts. Please start a new withdrawal.');
        } else {
          setCodeError(data.message || 'Invalid code. Please try again.');
        }
        setAuthorizationCode('');
        return;
      }

      // Success
      await log(
        ActivityActions.CREATE_WITHDRAWAL,
        `Withdrawal of KES ${transactionDetails.amount.toLocaleString()} via ${transactionDetails.method}`
      );

      setShowCodeModal(false);
      setShowSuccessModal(true);
      setWithdrawAmount('');
      setWithdrawPhone('');
      setRequestId('');
      setAuthorizationCode('');
      setMaskedEmail('');
      setAvailableBalance(prev => prev - transactionDetails.amount);

    } catch (err: any) {
      setCodeError(err.message || 'Failed to verify code');
    } finally {
      setIsVerifying(false);
    }
  };

  const resendCode = async () => {
    if (resendCountdown > 0) return;

    setIsSendingCode(true);
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

    } catch (err: any) {
      setCodeError(err.message || 'Failed to resend code');
    } finally {
      setIsSendingCode(false);
    }
  };

  const cancelCodeModal = () => {
    setShowCodeModal(false);
    setRequestId('');
    setAuthorizationCode('');
    setCodeError('');
    setMaskedEmail('');
    setCodeAttemptsRemaining(null);
    setResendCountdown(0);
  };

  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    alert('Deposit functionality coming soon!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl shadow-sm ${activeTab === 'withdraw' ? 'bg-gradient-to-br from-rose-500 to-rose-600 shadow-rose-200' : 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-200'}`}>
              {activeTab === 'withdraw' ? (
                <ArrowUpRight className="w-5 h-5 text-white" />
              ) : (
                <ArrowDownLeft className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {activeTab === 'withdraw' ? 'Withdraw Funds' : 'Fund Wallet'}
              </h1>
              <p className="text-sm text-gray-500">
                {activeTab === 'withdraw'
                  ? 'Transfer funds from your wallet to any M-PESA number'
                  : 'Add funds to your wallet via various payment methods'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('withdraw')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'withdraw'
                ? 'bg-rose-500 text-white shadow-sm shadow-rose-200'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            Withdraw
          </button>
          <button
            onClick={() => setActiveTab('deposit')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'deposit'
                ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            Deposit
          </button>
        </div>
      </div>

      {/* ─── Error Display ───────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* ─── Main Action Card ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ─── Withdraw Form ─────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              {activeTab === 'withdraw' ? 'Withdraw Funds' : 'Deposit Funds'}
            </h2>
            {activeTab === 'withdraw' && (
              <div className="text-right">
                <p className="text-xs text-gray-400">Available Balance</p>
                <p className="text-lg font-bold text-emerald-600">KES {availableBalance.toLocaleString()}</p>
              </div>
            )}
          </div>

          {activeTab === 'withdraw' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Withdraw To
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setWithdrawTo('mobile')}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      withdrawTo === 'mobile'
                        ? 'border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-500/20'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <div className="text-left">
                      <div className="font-medium">M-PESA</div>
                      <div className="text-xs text-gray-400">Enter number below</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setWithdrawTo('bank')}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      withdrawTo === 'bank'
                        ? 'border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-500/20'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Landmark className="w-4 h-4" />
                    <div className="text-left">
                      <div className="font-medium">Bank Transfer</div>
                      <div className="text-xs text-gray-400">(Coming Soon)</div>
                    </div>
                  </button>
                </div>
              </div>

              {withdrawTo === 'mobile' && (
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={withdrawPhone}
                      onChange={(e) => setWithdrawPhone(e.target.value)}
                      placeholder="0712071385"
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all outline-none"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Enter the M-PESA number you want to withdraw to (e.g. 0712xxxxxx)
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Amount (KES)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">KES</span>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full pl-14 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base font-semibold focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all outline-none"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Min: KES 10 | Max: KES 250,000
                </p>
              </div>

              <button
                onClick={handleWithdraw}
                disabled={isSendingCode}
                className="w-full py-3 bg-gradient-to-r from-rose-500 to-rose-600 hover:shadow-lg hover:shadow-rose-200 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSendingCode ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending code...
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

          {activeTab === 'deposit' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Amount (KES)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">KES</span>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full pl-14 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                  />
                </div>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-start gap-3">
                  <Landmark className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Deposit via Bank Transfer</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Transfer to the account below and the funds will be credited automatically:
                    </p>
                    <div className="mt-2 space-y-1 text-sm text-blue-700">
                      <p><span className="font-medium">Bank:</span> KCB Bank Kenya</p>
                      <p><span className="font-medium">Account:</span> 1234567890</p>
                      <p><span className="font-medium">Name:</span> XecoFlow Limited</p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleDeposit}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-lg hover:shadow-emerald-200 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                I've Made the Transfer
              </button>
            </div>
          )}
        </div>

        {/* ─── Quick Actions & Info ─────────────────────────────────── */}
        <div className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setActiveTab('withdraw');
                  setWithdrawTo('mobile');
                }}
                className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl border border-green-200 hover:shadow-md transition-all"
              >
                <ArrowUpRight className="w-6 h-6 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Withdraw to Mobile</span>
                <span className="text-xs text-gray-400">Enter number below</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('deposit');
                }}
                className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl border border-emerald-200 hover:shadow-md transition-all"
              >
                <ArrowDownLeft className="w-6 h-6 text-emerald-600" />
                <span className="text-sm font-medium text-gray-700">Deposit from Bank</span>
                <span className="text-xs text-gray-400">Bank Transfer</span>
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100/30 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-amber-800">Important Information</h4>
                <ul className="text-xs text-amber-700 mt-1 space-y-1">
                  <li>• Withdrawals to M-PESA are processed within 5-30 seconds.</li>
                  <li>• You must have sufficient balance in your utility account.</li>
                  <li>• Minimum withdrawal is KES 10. Maximum is KES 250,000.</li>
                  <li>• Ensure the phone number is correct before sending.</li>
                  <li>• An authorization code will be sent to your email.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Code Authorization Modal (NEW) ─────────────────────────── */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-rose-500" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center">Verify Withdrawal</h3>
              <p className="text-sm text-gray-500 text-center mt-1">
                Enter the 6-digit authorization code
              </p>

              {maskedEmail && (
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg py-2 px-3">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Code sent to <strong className="text-gray-700">{maskedEmail}</strong></span>
                </div>
              )}

              <div className="mt-6 space-y-3 bg-gray-50 rounded-xl p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount</span>
                  <span className="text-lg font-bold text-rose-600">
                    KES {transactionDetails?.amount?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">To</span>
                  <span className="font-medium text-gray-900">
                    {transactionDetails?.phoneNumber}
                  </span>
                </div>
              </div>

              {/* Code Input */}
              <div className="mt-6">
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
                    {codeAttemptsRemaining} attempt{codeAttemptsRemaining !== 1 ? 's' : ''} remaining
                  </p>
                )}
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <button
                  onClick={verifyCodeAndWithdraw}
                  disabled={isVerifying || authorizationCode.length !== 6}
                  className="w-full px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Verify & Withdraw
                    </>
                  )}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={resendCode}
                    disabled={resendCountdown > 0 || isSendingCode}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSendingCode ? (
                      'Sending...'
                    ) : resendCountdown > 0 ? (
                      `Resend in ${resendCountdown}s`
                    ) : (
                      'Resend code'
                    )}
                  </button>
                  <button
                    onClick={cancelCodeModal}
                    disabled={isVerifying}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Success Modal ──────────────────────────────────────────── */}
      {showSuccessModal && transactionDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Withdrawal Initiated!</h3>
              <p className="text-sm text-gray-500 mt-1">
                A confirmation email has been sent.
              </p>

              <div className="mt-6 bg-gray-50 rounded-xl p-4 text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Amount</span>
                  <span className="text-xl font-bold text-emerald-600">
                    KES {transactionDetails.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">To</span>
                  <span className="text-sm font-medium text-gray-900">{transactionDetails.phoneNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Reference</span>
                  <span className="text-sm font-mono text-gray-600">{transactionDetails.reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Date</span>
                  <span className="text-sm text-gray-600">{new Date().toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push('/dashboard');
                }}
                className="w-full mt-6 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-all"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}