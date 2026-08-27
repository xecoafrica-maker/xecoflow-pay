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
  Building2,
  FileText,
  Zap,
  BadgeCheck,
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
  verified?: boolean;
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
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/v1/payment-links/${slug}`);
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Payment link not found');
        setPaymentLink(data.data);
        if (data.data.price > 0) setAmount(data.data.price.toString());
      } catch (err: any) {
        setError(err.message || 'Failed to load payment link');
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const formatPrice = (value: number, currency: string) =>
    `${currency} ${Number(value).toLocaleString('en-KE', {
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
      setErrorMessage(
        `Amount must be exactly ${formatPrice(paymentLink.price, paymentLink.currency)}`
      );
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
          phone,
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
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <Loader2 className="w-7 h-7 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !paymentLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] p-4">
        <div className="max-w-sm w-full text-center bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h1 className="text-lg font-semibold text-[#0a2540]">Link unavailable</h1>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            {error || 'This payment link may have expired or been cancelled.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="mt-6 text-sm font-medium text-[#635bff] hover:underline"
          >
            Go home
          </button>
        </div>
      </div>
    );
  }

  const isExpired = new Date(paymentLink.expiryDate) < new Date();
  const isPaid = paymentLink.status === 'PAID' || paymentLink.status === 'COMPLETED';
  const isFixedAmount = paymentLink.price > 0;
  const isVerified = paymentLink.verified === true;
  const displayAmount = Number(amount || paymentLink.price || 0);

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      {/* Nav */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[18px] sm:text-[20px] font-bold tracking-tight">
              <span className="text-[#0a2540]">Xeco</span>
              <span className="text-[#10B981]">Flow</span>
            </span>
            <span className="hidden sm:inline text-gray-300 text-sm">·</span>
            <span className="hidden sm:inline text-[13px] text-gray-400 font-medium">
              Secure payment
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-gray-400">
            <Lock className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Encrypted</span>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-12">
        {/* Title */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-[22px] sm:text-[28px] font-semibold text-[#0a2540] tracking-tight leading-tight">
            {paymentLink.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-gray-500">
            <span className="font-medium text-gray-700">
              {paymentLink.businessName || 'Merchant'}
            </span>
            {isVerified && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                <BadgeCheck className="w-3 h-3" />
                Verified
              </span>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6 lg:gap-10 items-start">
          {/* ── Left: summary ── */}
          <div className="lg:col-span-2 space-y-4 order-2 lg:order-1">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Payment summary
              </p>

              <dl className="space-y-3 text-[14px]">
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500 flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-gray-400" />
                    Merchant
                  </dt>
                  <dd className="font-medium text-gray-900 text-right">
                    {paymentLink.businessName || 'Merchant'}
                  </dd>
                </div>

                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-gray-400" />
                    Description
                  </dt>
                  <dd className="font-medium text-gray-900 text-right max-w-[60%]">
                    {paymentLink.name}
                  </dd>
                </div>

                <div className="flex justify-between gap-4 items-center">
                  <dt className="text-gray-500">Type</dt>
                  <dd>
                    <span
                      className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
                        isFixedAmount
                          ? 'text-gray-600 bg-gray-100'
                          : 'text-amber-700 bg-amber-50'
                      }`}
                    >
                      {isFixedAmount ? 'Fixed amount' : 'Open amount'}
                    </span>
                  </dd>
                </div>

                <div className="pt-3 mt-1 border-t border-gray-100 flex justify-between items-baseline">
                  <dt className="text-gray-500 text-[13px]">Total</dt>
                  <dd className="text-xl font-semibold text-[#0a2540] tracking-tight">
                    {formatPrice(displayAmount, paymentLink.currency)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-gray-900">Pay with M-PESA</p>
                <p className="text-[12px] text-gray-500 mt-0.5 leading-relaxed">
                  You’ll receive an STK push on your phone. Enter your PIN to complete payment.
                </p>
              </div>
            </div>
          </div>

          {/* ── Right: checkout ── */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              {isPaid ? (
                <div className="p-8 sm:p-10 text-center">
                  <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-7 h-7 text-emerald-500" />
                  </div>
                  <h2 className="text-xl font-semibold text-[#0a2540]">Payment successful</h2>
                  <p className="text-sm text-gray-500 mt-2">
                    {formatPrice(displayAmount, paymentLink.currency)} paid to{' '}
                    {paymentLink.businessName || 'merchant'}
                  </p>
                  {paymentLink.returnUrl ? (
                    <p className="text-xs text-gray-400 mt-4">Redirecting you back…</p>
                  ) : (
                    <button
                      onClick={() => router.push('/')}
                      className="mt-6 text-sm font-medium text-[#635bff] hover:underline"
                    >
                      Done
                    </button>
                  )}
                </div>
              ) : isExpired ? (
                <div className="p-8 sm:p-10 text-center">
                  <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                  <h2 className="text-lg font-semibold text-[#0a2540]">Link expired</h2>
                  <p className="text-sm text-gray-500 mt-2">
                    Contact the merchant for a new payment link.
                  </p>
                </div>
              ) : (
                <form onSubmit={handlePay} className="p-5 sm:p-7">
                  {/* Amount */}
                  <div className="pb-5 mb-5 border-b border-gray-100">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      Amount due
                    </p>
                    <p className="text-[32px] font-semibold text-[#0a2540] mt-1 tracking-tight leading-none">
                      {formatPrice(displayAmount, paymentLink.currency)}
                    </p>
                  </div>

                  {paymentStatus === 'processing' && (
                    <div className="mb-5 flex items-start gap-3 text-sm text-blue-800 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3.5">
                      <Loader2 className="w-4 h-4 animate-spin shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-[13px]">Waiting for M-PESA</p>
                        <p className="text-blue-600 text-[12px] mt-0.5">
                          Check your phone and enter your PIN
                        </p>
                      </div>
                    </div>
                  )}

                  {paymentStatus === 'error' && (
                    <div className="mb-5 flex items-start gap-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p className="text-[13px]">{errorMessage}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    {!isFixedAmount && (
                      <div>
                        <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                          Amount ({paymentLink.currency}) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="Enter amount"
                          min={1}
                          step="0.01"
                          required
                          disabled={isProcessing}
                          className="w-full h-11 px-3.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/25 focus:border-[#635bff] disabled:opacity-60"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                        M-PESA number <span className="text-red-500">*</span>
                      </label>
                      <div className="flex h-11 rounded-xl border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-[#635bff]/25 focus-within:border-[#635bff]">
                        <span className="flex items-center gap-1.5 px-3 bg-gray-50 border-r border-gray-200 text-[13px] text-gray-500 shrink-0">
                          <Smartphone className="w-4 h-4" />
                          +254
                        </span>
                        <input
                          type="tel"
                          inputMode="numeric"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="712071385"
                          disabled={isProcessing}
                          className="flex-1 min-w-0 px-3 text-sm outline-none disabled:opacity-60"
                        />
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1.5">
                        STK push will be sent to this number
                      </p>
                    </div>

                    <div>
                      <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                        Name <span className="text-gray-400 font-normal">optional</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Your full name"
                          disabled={isProcessing}
                          className="w-full h-11 pl-10 pr-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/25 focus:border-[#635bff] disabled:opacity-60"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                        Email <span className="text-gray-400 font-normal">for receipt</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          disabled={isProcessing}
                          className="w-full h-11 pl-10 pr-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/25 focus:border-[#635bff] disabled:opacity-60"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full h-12 bg-[#0a2540] hover:bg-[#152a45] active:scale-[0.99] text-white rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing…
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          Pay {formatPrice(displayAmount, paymentLink.currency)}
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-center gap-1.5 text-[12px] text-gray-400 pt-0.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-500" />
                      Payments are encrypted and secure
                    </div>

                    <p className="text-center text-[12px] text-gray-400">
                      Need help?{' '}
                      <Link
                        href="/help-centre"
                        className="text-[#635bff] font-medium hover:underline"
                      >
                        Contact support
                      </Link>
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap items-center justify-center gap-x-3 text-[11px] text-gray-400">
          <span>
            Powered by{' '}
            <span className="font-semibold">
              <span className="text-[#0a2540]">Xeco</span>
              <span className="text-[#10B981]">Flow</span>
            </span>
          </span>
          <span className="text-gray-200">·</span>
          <Link href="/terms" className="hover:text-gray-600">
            Terms
          </Link>
          <span className="text-gray-200">·</span>
          <Link href="/privacy" className="hover:text-gray-600">
            Privacy
          </Link>
        </div>
      </footer>
    </div>
  );
}