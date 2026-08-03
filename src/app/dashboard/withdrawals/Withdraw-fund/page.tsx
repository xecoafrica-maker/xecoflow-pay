// src/app/dashboard/withdrawals/Withdraw-fund/page.tsx
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
} from 'lucide-react';
import { getToken, getStoredMerchant } from '@/lib/auth';
import { useActivityLogger } from '@/hooks/useActivityLogger';

// ─── Mock User Data ──────────────────────────────────────────────────
const userProfile = {
  name: 'JOAN HOME LTD',
  email: 'joan@example.com',
  phone: '254712345678',
  bankAccounts: [
    {
      id: 1,
      bankName: 'KCB Bank Kenya',
      accountNumber: '1234567890',
      accountName: 'JOAN HOME LTD',
      isDefault: true,
    },
  ],
  mobileMoney: {
    provider: 'M-PESA',
    number: '254712345678',
    isDefault: true,
  },
};

// Helper function to mask phone number
const maskPhoneNumber = (phone: string) => {
  if (phone.length <= 6) return phone;
  const start = phone.slice(0, 6);
  const end = phone.slice(-2);
  return `${start}xxxxx${end}`;
};

// Helper function to mask account number
const maskAccountNumber = (account: string) => {
  if (account.length <= 6) return account;
  const start = account.slice(0, 4);
  const end = account.slice(-3);
  return `${start}xxxxx${end}`;
};

// ─── Colors ──────────────────────────────────────────────────────────
const statusColors = {
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Failed: 'bg-red-50 text-red-700 border-red-200',
};

const statusIcons = {
  Completed: CheckCircle,
  Pending: Clock,
  Failed: XCircle,
};

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
  const [depositMethod, setDepositMethod] = useState('M-PESA');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositPhone, setDepositPhone] = useState('');
  const [selectedBankAccount, setSelectedBankAccount] = useState(userProfile.bankAccounts[0]?.id || 1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [withdrawTo, setWithdrawTo] = useState<'bank' | 'mobile'>('mobile');
  const [merchantId, setMerchantId] = useState<string>('');
  const [merchantName, setMerchantName] = useState<string>('');

  // ✅ Prevent duplicate logging
  const hasLoggedView = useRef(false);
  const isLoggingView = useRef(false);

  // ─── Load Merchant Data ──────────────────────────────────────────
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const cached = getStoredMerchant();
    if (cached) {
      const id = String(cached.merchant_id || cached.merchantId);
      if (id) {
        setMerchantId(id);
        setMerchantName(cached.business_name || cached.businessName || '');
      }
    }
  }, [router]);

  // ─── Log View - Only once per page visit ──────────────────────
  useEffect(() => {
    const logView = async () => {
      if (isLoggingView.current || hasLoggedView.current) {
        return;
      }
      
      try {
        isLoggingView.current = true;
        
        if (merchantId) {
          await log(
            ActivityActions.VIEW_WITHDRAW_HISTORY,
            `Viewed withdraw funds page for ${merchantName || 'business'}`
          );
          hasLoggedView.current = true;
          console.log('✅ Withdraw funds view logged');
        }
      } catch (error) {
        console.debug('Withdraw funds view logging skipped:', error);
      } finally {
        isLoggingView.current = false;
      }
    };
    
    if (merchantId && !hasLoggedView.current) {
      logView();
    }
  }, [merchantId, merchantName, log]);

  // ─── Handlers ──────────────────────────────────────────────────────
  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    let recipient = '';
    let method = '';

    if (withdrawTo === 'mobile') {
      recipient = `${userProfile.mobileMoney.provider} - ${userProfile.mobileMoney.number}`;
      method = userProfile.mobileMoney.provider;
    } else {
      const bank = userProfile.bankAccounts.find(b => b.id === selectedBankAccount);
      recipient = `${bank?.bankName} - ${bank?.accountNumber}`;
      method = 'Bank Transfer';
    }

    setTransactionDetails({
      type: 'Withdrawal',
      method: method,
      amount: amount,
      recipient: recipient,
      reference: `WD-${Date.now().toString().slice(-6)}`,
      withdrawTo: withdrawTo,
    });
    setShowConfirmModal(true);
  };

  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if ((depositMethod === 'M-PESA' || depositMethod === 'Airtel Money') && !depositPhone) {
      alert('Please enter your phone number');
      return;
    }

    setTransactionDetails({
      type: 'Deposit',
      method: depositMethod,
      amount: amount,
      recipient: depositMethod === 'M-PESA' || depositMethod === 'Airtel Money' ? depositPhone : 'Bank Transfer',
      reference: `DEP-${Date.now().toString().slice(-6)}`,
    });
    setShowConfirmModal(true);
  };

  const confirmTransaction = async () => {
    setIsProcessing(true);
    
    // Log the transaction
    if (transactionDetails) {
      await log(
        transactionDetails.type === 'Withdrawal' 
          ? ActivityActions.CREATE_WITHDRAWAL 
          : 'Deposit initiated',
        `${transactionDetails.type} of KES ${transactionDetails.amount.toLocaleString()} via ${transactionDetails.method}`
      );
    }
    
    setTimeout(() => {
      setIsProcessing(false);
      setShowConfirmModal(false);
      setShowSuccessModal(true);
      if (activeTab === 'withdraw') {
        setWithdrawAmount('');
      } else {
        setDepositAmount('');
        setDepositPhone('');
      }
    }, 2000);
  };

  const getSelectedBank = () => {
    return userProfile.bankAccounts.find(b => b.id === selectedBankAccount);
  };

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
                  ? 'Transfer funds from your wallet to your registered accounts' 
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

      {/* ─── Main Action Card ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ─── Withdraw/Deposit Form ────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {activeTab === 'withdraw' ? 'Withdraw Funds' : 'Deposit Funds'}
          </h2>

          {activeTab === 'withdraw' && (
            <div className="space-y-4">
              {/* Withdraw To Selection */}
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
                      <div className="font-medium">Mobile Money</div>
                      <div className="text-xs text-gray-400">{maskPhoneNumber(userProfile.mobileMoney.number)}</div>
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
                      <div className="font-medium">Bank Account</div>
                      <div className="text-xs text-gray-400">{getSelectedBank()?.bankName}</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Bank Account Selection (if bank selected) */}
              {withdrawTo === 'bank' && (
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Select Bank Account
                  </label>
                  <div className="space-y-2">
                    {userProfile.bankAccounts.map((bank) => (
                      <button
                        key={bank.id}
                        onClick={() => setSelectedBankAccount(bank.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all ${
                          selectedBankAccount === bank.id
                            ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-500/20'
                            : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Landmark className="w-4 h-4 text-gray-400" />
                          <div className="text-left">
                            <p className="font-medium text-gray-900">{bank.bankName}</p>
                            <p className="text-xs text-gray-500">Account: {maskAccountNumber(bank.accountNumber)}</p>
                          </div>
                        </div>
                        {selectedBankAccount === bank.id && (
                          <Check className="w-4 h-4 text-rose-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile Money Display (if mobile selected) */}
              {withdrawTo === 'mobile' && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{userProfile.mobileMoney.provider}</p>
                      <p className="text-sm text-gray-600">{maskPhoneNumber(userProfile.mobileMoney.number)}</p>
                      <p className="text-xs text-emerald-600 flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5" />
                        Registered number
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Amount Input */}
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
              </div>

              {/* Submit Button */}
              <button
                onClick={handleWithdraw}
                className="w-full py-3 bg-gradient-to-r from-rose-500 to-rose-600 hover:shadow-lg hover:shadow-rose-200 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Withdraw Funds
              </button>

              <p className="text-xs text-gray-400 text-center">
                Minimum withdrawal: KES 100. Maximum: KES 500,000 per transaction
              </p>
            </div>
          )}

          {/* ─── Deposit Form ─────────────────────────────────────────── */}
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

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['M-PESA', 'Bank Transfer', 'Airtel Money', 'Credit Card'].map((method) => {
                    const Icon = methodIcons[method as keyof typeof methodIcons] || CreditCard;
                    const isSelected = depositMethod === method;
                    return (
                      <button
                        key={method}
                        onClick={() => setDepositMethod(method)}
                        className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20'
                            : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {method}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Phone Number Input for Mobile Money */}
              {(depositMethod === 'M-PESA' || depositMethod === 'Airtel Money') && (
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="Enter phone number (e.g., 2547xxxxxxxx)"
                    value={depositPhone}
                    onChange={(e) => setDepositPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Enter the phone number you'll be sending money from
                  </p>
                </div>
              )}

              {/* Bank Transfer Info */}
              {depositMethod === 'Bank Transfer' && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-start gap-3">
                    <Landmark className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Bank Transfer Details</p>
                      <p className="text-xs text-blue-700 mt-1">
                        Please transfer to the following account and the funds will be credited automatically:
                      </p>
                      <div className="mt-2 space-y-1 text-sm text-blue-700">
                        <p><span className="font-medium">Bank:</span> KCB Bank Kenya</p>
                        <p><span className="font-medium">Account:</span> 1234567890</p>
                        <p><span className="font-medium">Name:</span> XecoFlow Limited</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleDeposit}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-lg hover:shadow-emerald-200 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Deposit Funds
              </button>

              <p className="text-xs text-gray-400 text-center">
                Minimum deposit: KES 100. Maximum: KES 1,000,000 per transaction
              </p>
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
                <span className="text-xs text-gray-400">{maskPhoneNumber(userProfile.mobileMoney.number)}</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('withdraw');
                  setWithdrawTo('bank');
                }}
                className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-200 hover:shadow-md transition-all"
              >
                <ArrowUpRight className="w-6 h-6 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Withdraw to Bank</span>
                <span className="text-xs text-gray-400">{getSelectedBank()?.bankName}</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('deposit');
                  setDepositMethod('M-PESA');
                }}
                className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl border border-emerald-200 hover:shadow-md transition-all"
              >
                <ArrowDownLeft className="w-6 h-6 text-emerald-600" />
                <span className="text-sm font-medium text-gray-700">Deposit from Mobile</span>
                <span className="text-xs text-gray-400">M-PESA</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('deposit');
                  setDepositMethod('Bank Transfer');
                }}
                className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl border border-purple-200 hover:shadow-md transition-all"
              >
                <ArrowDownLeft className="w-6 h-6 text-purple-600" />
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
                  <li>• Withdrawals are processed within 24-48 hours</li>
                  <li>• Bank transfers may take 1-3 business days</li>
                  <li>• M-PESA withdrawals are instant (subject to network)</li>
                  <li>• Funds are sent to your registered accounts only</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Confirm Modal ───────────────────────────────────────────── */}
      {showConfirmModal && transactionDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-amber-500" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center">Confirm Transaction</h3>
              <p className="text-sm text-gray-500 text-center mt-1">
                Please review the details below before confirming
              </p>

              <div className="mt-6 space-y-3 bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Type</span>
                  <span className="text-sm font-medium text-gray-900">{transactionDetails.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Method</span>
                  <span className="text-sm font-medium text-gray-900">{transactionDetails.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Amount</span>
                  <span className="text-xl font-bold text-rose-600">KES {transactionDetails.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Recipient</span>
                  <span className="text-sm font-medium text-gray-900">{transactionDetails.recipient}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Reference</span>
                  <span className="text-sm font-mono text-gray-600">{transactionDetails.reference}</span>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmTransaction}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Confirm'
                  )}
                </button>
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
              <h3 className="text-xl font-bold text-gray-900">Transaction Successful!</h3>
              <p className="text-sm text-gray-500 mt-1">
                Your {transactionDetails.type.toLowerCase()} has been processed successfully
              </p>

              <div className="mt-6 bg-gray-50 rounded-xl p-4 text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Amount</span>
                  <span className="text-xl font-bold text-emerald-600">KES {transactionDetails.amount.toLocaleString()}</span>
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
                onClick={() => setShowSuccessModal(false)}
                className="w-full mt-6 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}