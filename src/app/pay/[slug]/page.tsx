'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Smartphone,
  CheckCircle,
  Loader2,
  AlertCircle,
  Lock,
  Mail,
  User,
  Shield,
  CreditCard,
  Building2,
  Clock,
  ArrowLeft,
  Check,
  X,
  FileText,
  Banknote,
  Zap,
} from 'lucide-react';

interface PaymentLinkData {
  id: string;
  billId: string;
  merchantId: string;
  businessName: string;
  name: string;
  price: number;
  currency: string;
  status: string;
  createdAt: string;
  expiryDate: string;
  returnUrl: string;
  linkType: string;
}

export default function PaymentLinkPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [paymentLink, setPaymentLink] = useState<PaymentLinkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!slug) return;
    fetchPaymentLink();
  }, [slug]);

  const fetchPaymentLink = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/v1/payment-links/${slug}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Payment link not found');
      }

      setPaymentLink(data.data);
      if (data.data.price > 0) {
        setAmount(data.data.price.toString());
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load payment link');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount: number, currency: string) =>
    `${currency} ${Number(amount).toLocaleString('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();

    let phone = phoneNumber.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '254' + phone.slice(1);
    if (!phone.startsWith('254') && (phone.length === 9 || phone.length === 10)) {
      phone = '254' + phone.slice(-9);
    }

    if (!phone || phone.length < 12) {
      setErrorMessage('Enter a valid 9-digit M-PESA number');
      setPaymentStatus('error');
      return;
    }

    const amountToPay = Number(amount);
    if (!amountToPay || amountToPay <= 0) {
      setErrorMessage('Please enter a valid amount');
      setPaymentStatus('error');
      return;
    }

    if (paymentLink?.price && paymentLink.price > 0 && amountToPay !== paymentLink.price) {
      setErrorMessage(`Amount must be exactly ${formatPrice(paymentLink.price, paymentLink.currency)}`);
      setPaymentStatus('error');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');
    setErrorMessage('');

    try {
      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billId: paymentLink?.billId,
          merchantId: paymentLink?.merchantId,
          amount: amountToPay,
          phone: phone,
          customerName: customerName || 'Customer',
          email: email || undefined,
          currency: paymentLink?.currency || 'KES',
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setPaymentStatus('success');
        if (paymentLink?.returnUrl) {
          setTimeout(() => {
            window.location.href = paymentLink.returnUrl!;
          }, 3000);
        }
      } else {
        setPaymentStatus('error');
        setErrorMessage(data.error || 'Payment failed. Please try again.');
      }
    } catch (err: any) {
      setPaymentStatus('error');
      setErrorMessage(err.message || 'Something went wrong.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-7 h-7 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !paymentLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-sm w-full text-center bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Session Not Found</h1>
          <p className="text-sm text-gray-500 mt-2">
            {error || 'The payment session may have expired or been cancelled.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="mt-5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const isExpired = new Date(paymentLink.expiryDate) < new Date();
  const isPaid = paymentLink.status === 'PAID' || paymentLink.status === 'COMPLETED';
  const isFixedAmount = paymentLink.price > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ─── Navigation ────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight">
              <span className="text-[#0a2540]">Xeco</span>
              <span className="text-emerald-500">Flow</span>
            </span>
            <span className="hidden sm:inline text-gray-300 text-sm">·</span>
            <span className="hidden sm:inline text-sm text-gray-400 font-medium">
              Secure Payment
            </span>
          </div>
          <span className="text-sm text-gray-500 font-medium">
            {paymentLink.businessName || 'Merchant'}
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* ─── Back Button ───────────────────────────────────────────── */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* ─── Two Column Layout ────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* ─── LEFT COLUMN: Merchant & Item Details ──────────────── */}
          <div className="space-y-6">
            {/* Merchant Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  <h2 className="text-sm font-semibold text-gray-700">Merchant Details</h2>
                </div>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Business Name</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {paymentLink.businessName || 'XecoFlow'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    <Check className="w-3 h-3" />
                    Verified
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Payment Type</span>
                  <span className="text-sm text-gray-700">One-time payment</span>
                </div>
              </div>
            </div>

            {/* Item Details Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <h2 className="text-sm font-semibold text-gray-700">Item Details</h2>
                </div>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Description</span>
                  <span className="text-sm font-medium text-gray-900 text-right">
                    {paymentLink.name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Amount</span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatPrice(Number(amount || paymentLink.price), paymentLink.currency)}
                  </span>
                </div>
                {isFixedAmount ? (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Type</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                      Fixed Amount
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Type</span>
                    <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full">
                      Open Amount
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Created</span>
                  <span className="text-sm text-gray-500">
                    {new Date(paymentLink.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                {paymentLink.returnUrl && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Redirect</span>
                    <span className="text-xs text-gray-400 truncate max-w-[140px]">
                      {paymentLink.returnUrl}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─── RIGHT COLUMN: Payment Card ─────────────────────────── */}
          <div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden sticky top-24">
              {/* Header */}
              <div className="px-6 py-4 bg-[#0a2540] text-white">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">PAYMENT DETAILS</span>
                  <span className="text-xs opacity-70">M-PESA</span>
                </div>
              </div>

              <div className="p-6">
                {isPaid ? (
                  /* ─── Success State ────────────────────────────── */
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Payment Successful!</h3>
                    <p className="text-sm text-gray-500 mt-2">
                      Thank you for your payment of {formatPrice(Number(amount), paymentLink.currency)}
                    </p>
                    {paymentLink.returnUrl && (
                      <p className="text-xs text-gray-400 mt-4">
                        Redirecting to {paymentLink.businessName}...
                      </p>
                    )}
                    {!paymentLink.returnUrl && (
                      <button
                        onClick={() => router.push('/')}
                        className="mt-4 px-6 py-2.5 bg-[#0a2540] hover:bg-[#152a45] text-white rounded-xl text-sm font-medium transition-colors"
                      >
                        Go Home
                      </button>
                    )}
                  </div>
                ) : isExpired ? (
                  /* ─── Expired State ────────────────────────────── */
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-900">Link Expired</h3>
                    <p className="text-sm text-gray-500 mt-2">
                      This payment link has expired. Please contact the merchant.
                    </p>
                  </div>
                ) : (
                  /* ─── Payment Form ──────────────────────────────── */
                  <form onSubmit={handlePay} className="space-y-5">
                    {/* Amount Display */}
                    <div className="pb-4 border-b border-gray-100">
                      <p className="text-sm text-gray-500">Total Amount</p>
                      <p className="text-3xl font-bold text-[#0a2540] mt-1">
                        {formatPrice(Number(amount || paymentLink.price), paymentLink.currency)}
                      </p>
                      {isFixedAmount ? (
                        <span className="inline-block mt-1.5 text-xs text-gray-400 bg-gray-50 px-2.5 py-0.5 rounded-full">
                          Fixed amount
                        </span>
                      ) : (
                        <span className="inline-block mt-1.5 text-xs text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full">
                          Enter amount below
                        </span>
                      )}
                    </div>

                    {/* Payment Channel - M-PESA only */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Payment Channel <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <Smartphone className="w-5 h-5 text-emerald-600" />
                        <span className="font-medium text-gray-900">M-PESA</span>
                        <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Recommended
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5">
                        STK push will be sent to your phone
                      </p>
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <div className="flex h-11 rounded-xl border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/25 focus-within:border-indigo-500">
                        <span className="flex items-center gap-1 px-3 bg-gray-50 border-r border-gray-200 text-sm text-gray-500 shrink-0">
                          <Smartphone className="w-3.5 h-3.5" />
                          +254
                        </span>
                        <input
                          type="tel"
                          inputMode="numeric"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="712345678"
                          disabled={isProcessing}
                          className="flex-1 min-w-0 px-3.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 disabled:opacity-60"
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5">Enter your M-PESA registered number</p>
                    </div>

                    {/* Customer Name (optional) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Your Name <span className="text-gray-400 text-xs">(optional)</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="John Doe"
                          disabled={isProcessing}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 disabled:opacity-60"
                        />
                      </div>
                    </div>

                    {/* Email (optional) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Email <span className="text-gray-400 text-xs">(optional)</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="customer@email.com"
                          disabled={isProcessing}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 disabled:opacity-60"
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5">Receipt will be sent to this email</p>
                    </div>

                    {/* Amount (if open amount) */}
                    {!isFixedAmount && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Amount ({paymentLink.currency}) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Banknote className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter amount"
                            min={1}
                            step="0.01"
                            required
                            disabled={isProcessing}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 disabled:opacity-60"
                          />
                        </div>
                      </div>
                    )}

                    {/* Status Messages */}
                    {paymentStatus === 'processing' && (
                      <div className="flex items-start gap-2.5 text-sm text-blue-800 bg-blue-50 border border-blue-100 rounded-xl px-3.5 py-3">
                        <Loader2 className="w-4 h-4 animate-spin shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-[13px]">Waiting for M-PESA</p>
                          <p className="text-blue-600 text-[12px] mt-0.5">Enter your PIN on your phone</p>
                        </div>
                      </div>
                    )}

                    {paymentStatus === 'error' && (
                      <div className="flex items-start gap-2.5 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3.5 py-3">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <p className="text-[13px]">{errorMessage}</p>
                      </div>
                    )}

                    {/* Pay Button */}
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing…
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          Pay {formatPrice(Number(amount || paymentLink.price), paymentLink.currency)}
                        </>
                      )}
                    </button>

                    {/* Security & Support */}
                    <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
                      <Shield className="w-3 h-3 text-emerald-500" />
                      <span>Payments are encrypted and secure</span>
                    </div>

                    <p className="text-center text-xs text-gray-400">
                      Need help?{' '}
                      <Link href="/help-centre" className="text-indigo-600 font-medium hover:underline">
                        Contact support
                      </Link>
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Footer ───────────────────────────────────────────────── */}
        <div className="text-center mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-400">
            Powered by <span className="font-medium text-gray-600">XecoFlow</span>
          </p>
        </div>
      </main>
    </div>
  );
}