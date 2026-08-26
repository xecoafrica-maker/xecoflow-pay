'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Smartphone,
  CheckCircle,
  Loader2,
  AlertCircle,
  Mail,
  User,
  Shield,
  CreditCard,
  Building2,
  Clock,
  ArrowLeft,
  Lock,
  FileText,
} from 'lucide-react';
import Link from 'next/link';

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
      // If fixed amount, pre-fill the amount
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

    // Format phone number
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

    // For fixed amount, check if customer entered correct amount
    if (paymentLink?.price && paymentLink.price > 0 && amountToPay !== paymentLink.price) {
      setErrorMessage(`Amount must be exactly ${formatPrice(paymentLink.price, paymentLink.currency)}`);
      setPaymentStatus('error');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');
    setErrorMessage('');

    try {
      const res = await fetch('/v1/payments/initiate', {
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
        // Redirect to return URL if provided
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
        <div className="max-w-sm w-full text-center bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Session Not Found</h1>
          <p className="text-sm text-gray-500 mt-2">
            {error || 'The payment session may have expired or been cancelled.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="mt-5 px-6 py-2.5 bg-[#635bff] hover:bg-[#5548e8] text-white rounded-xl text-sm font-medium transition-colors"
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
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      {/* Nav */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-12 sm:h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[18px] sm:text-[20px] font-bold tracking-tight">
              <span className="text-[#0a2540]">Xeco</span>
              <span className="text-[#10B981]">Flow</span>
            </span>
            <span className="hidden sm:inline text-gray-300 text-sm">·</span>
            <span className="hidden sm:inline text-[13px] text-gray-400 font-medium">
              Secure payment
            </span>
          </div>
          <span className="text-xs text-gray-400">
            {paymentLink.businessName || 'Merchant'}
          </span>
        </div>
      </header>

      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-6 sm:py-10">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Payment Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-5 sm:px-6 py-4 bg-[#0a2540] text-white">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">PAYMENT DETAILS</span>
              <span className="text-xs opacity-70">POWERED BY XECOFLOW</span>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {/* Amount Display */}
            <div className="mb-5 pb-5 border-b border-gray-100">
              <p className="text-sm text-gray-500">{paymentLink.name}</p>
              <p className="text-3xl font-bold text-[#0a2540] mt-1">
                {formatPrice(Number(amount || paymentLink.price), paymentLink.currency)}
              </p>
              {isFixedAmount ? (
                <span className="inline-block mt-1.5 text-xs text-gray-400 bg-gray-50 px-2.5 py-0.5 rounded-full">
                  Fixed amount
                </span>
              ) : (
                <span className="inline-block mt-1.5 text-xs text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full">
                  Enter amount
                </span>
              )}
            </div>

            {isPaid ? (
              /* Success State */
              <div className="text-center py-6">
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
              /* Expired State */
              <div className="text-center py-6">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900">Link Expired</h3>
                <p className="text-sm text-gray-500 mt-2">
                  This payment link has expired. Please contact the merchant.
                </p>
              </div>
            ) : (
              /* Payment Form */
              <form onSubmit={handlePay} className="space-y-4">
                {/* Payment Channel */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Payment Channel <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/25 focus:border-[#635bff]"
                    >
                      <option value="mpesa">M-PESA</option>
                      <option value="card">Card</option>
                      <option value="bank">Bank Transfer</option>
                    </select>
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex h-11 rounded-xl border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-[#635bff]/25 focus-within:border-[#635bff]">
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
                  <p className="text-xs text-gray-400 mt-1.5">STK push will be sent to this number</p>
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
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/25 focus:border-[#635bff] disabled:opacity-60"
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
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/25 focus:border-[#635bff] disabled:opacity-60"
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
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                        {paymentLink.currency}
                      </span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                        min={1}
                        step="0.01"
                        required
                        disabled={isProcessing}
                        className="w-full pl-14 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/25 focus:border-[#635bff] disabled:opacity-60"
                      />
                    </div>
                  </div>
                )}

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
                  className="w-full h-11 sm:h-12 bg-[#0a2540] hover:bg-[#152a45] active:scale-[0.99] text-white rounded-xl font-semibold text-sm sm:text-[15px] flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      Processing…
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Pay {formatPrice(Number(amount || paymentLink.price), paymentLink.currency)}
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[11px] sm:text-[12px] text-gray-400">
                  <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500" />
                  <span>Payments are encrypted and secure</span>
                </div>

                <p className="text-center text-[11px] sm:text-[12px] text-gray-400">
                  Need help?{' '}
                  <Link href="/help-centre" className="text-[#635bff] font-medium hover:underline">
                    Contact support
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-400">
            Powered by <span className="font-medium text-gray-600">XecoFlow</span>
          </p>
        </div>
      </main>
    </div>
  );
}