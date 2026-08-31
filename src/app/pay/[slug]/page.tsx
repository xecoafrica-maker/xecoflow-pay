'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Smartphone,
  CheckCircle,
  Loader2,
  AlertCircle,
  Mail,
  User,
  Shield,
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
  logoUrl?: string;
}

type PayMethod = 'mpesa' | 'airtel' | 'tkash' | 'card' | 'paypal';

const METHOD_LOGOS: Record<PayMethod, { src: string; label: string; activeBorder: string }> = {
  mpesa: {
    src: 'https://swalanyeti.co.ke/storage/uploads/2020/12/IMG-20201203204210.jpg',
    label: 'M-PESA',
    activeBorder: 'border-[#09A747]',
  },
  airtel: {
    src: 'https://www.pngall.com/wp-content/uploads/17/Airtel-Money-Logo-Vector-PNG.png',
    label: 'Airtel',
    activeBorder: 'border-[#ED1C24]',
  },
  tkash: {
    src: 'https://tech-ish.com/wp-content/uploads/2020/04/Telkom-Kenya-Tkash.jpg',
    label: 'T-Kash',
    activeBorder: 'border-[#FF6B00]',
  },
  card: {
    src: 'https://static.vecteezy.com/system/resources/previews/066/705/796/non_2x/visa-and-mastercard-logo-featuring-overlapping-circles-on-a-white-background-free-vector.jpg',
    label: 'Card',
    activeBorder: 'border-[#1A1F36]',
  },
  paypal: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/1280px-PayPal.svg.png',
    label: 'PayPal',
    activeBorder: 'border-[#003087]',
  },
};

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
  const [method, setMethod] = useState<PayMethod>('mpesa');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [brokenLogos, setBrokenLogos] = useState<Record<string, boolean>>({});

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

    if (method === 'mpesa' || method === 'airtel' || method === 'tkash') {
      let phone = phoneNumber.replace(/\D/g, '');
      if (phone.startsWith('0')) phone = '254' + phone.slice(1);
      if (!phone.startsWith('254') && (phone.length === 9 || phone.length === 10)) {
        phone = '254' + phone.slice(-9);
      }
      if (!phone || phone.length < 12) {
        setErrorMessage('Enter a valid 9-digit phone number');
        setPaymentStatus('error');
        return;
      }
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
      // ✅ FIXED: Use /v1/product-links/pay for payment initiation
      const res = await fetch('/v1/product-links/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: paymentLink?.billId,  // billId is the product ID
          phone: phoneNumber,
          email: email || undefined,
          customerName: customerName || 'Customer',
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
      </div>
    );
  }

  if (error || !paymentLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="max-w-sm w-full text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h1 className="text-lg font-semibold text-gray-900">Link unavailable</h1>
          <p className="text-sm text-gray-500 mt-2">
            {error || 'This payment link may have expired.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="mt-5 text-sm font-medium text-[#635bff] hover:underline"
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
  const displayAmount = Number(amount || paymentLink.price || 0);
  const merchantName = paymentLink.businessName || 'Merchant';
  const isVerified = paymentLink.verified === true;
  const isMobileMoney = method === 'mpesa' || method === 'airtel' || method === 'tkash';

  const poweredBy = (
    <p className="text-[12px] text-gray-400 text-center lg:text-left">
      Powered by{' '}
      <span className="font-semibold text-gray-500">
        <span className="text-[#0a2540]">Xeco</span>
        <span className="text-[#10B981]">Flow</span>
      </span>
      <span className="mx-1.5">·</span>
      <Link href="/terms" className="hover:text-gray-600">
        Terms
      </Link>
      <span className="mx-1.5">·</span>
      <Link href="/privacy" className="hover:text-gray-600">
        Privacy
      </Link>
    </p>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 grid lg:grid-cols-2">
        {/* ── LEFT: Merchant + summary ── */}
        <div className="bg-[#f6f9fc] px-6 py-8 sm:px-10 lg:px-16 lg:py-12 flex flex-col">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#0a2540] flex items-center justify-center shrink-0 overflow-hidden shadow-sm ring-2 ring-white">
                {paymentLink.logoUrl ? (
                  <img
                    src={paymentLink.logoUrl}
                    alt={merchantName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-bold text-white">
                    {merchantName.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-gray-900 truncate">
                  {merchantName}
                </p>
                {isVerified ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 mt-0.5">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    Verified merchant
                  </span>
                ) : (
                  <span className="text-[11px] text-gray-400 mt-0.5 block">Merchant</span>
                )}
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-1">Pay {merchantName}</p>
          <p className="text-[36px] sm:text-[40px] font-semibold text-gray-900 tracking-tight leading-none">
            {formatPrice(displayAmount, paymentLink.currency)}
          </p>

          <div className="mt-10 space-y-4 flex-1">
            <div className="flex justify-between text-[14px]">
              <span className="text-gray-600">{paymentLink.name}</span>
              <span className="text-gray-900 font-medium tabular-nums">
                {formatPrice(displayAmount, paymentLink.currency)}
              </span>
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-3">
              <div className="flex justify-between text-[14px]">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900 tabular-nums">
                  {formatPrice(displayAmount, paymentLink.currency)}
                </span>
              </div>
              <div className="flex justify-between text-[15px] font-semibold">
                <span className="text-gray-900">Total due</span>
                <span className="text-gray-900 tabular-nums">
                  {formatPrice(displayAmount, paymentLink.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Desktop only — stays at bottom of left panel */}
          <div className="mt-10 hidden lg:block">{poweredBy}</div>
        </div>

        {/* ── RIGHT: Pay form ── */}
        <div className="px-6 py-8 sm:px-10 lg:px-16 lg:py-12 flex flex-col justify-center">
          <div className="w-full max-w-[420px] mx-auto">
            {isPaid ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-7 h-7 text-emerald-500" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Payment successful</h2>
                <p className="text-sm text-gray-500 mt-2">
                  {formatPrice(displayAmount, paymentLink.currency)} paid to {merchantName}
                </p>
              </div>
            ) : isExpired ? (
              <div className="text-center py-6">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <h2 className="text-lg font-semibold text-gray-900">Link expired</h2>
                <p className="text-sm text-gray-500 mt-2">Contact the merchant for a new link.</p>
              </div>
            ) : (
              <form onSubmit={handlePay} className="space-y-5">
                <div>
                  <p className="text-[13px] font-medium text-gray-700 mb-2.5">Pay with</p>
                  <div className="grid grid-cols-5 gap-2">
                    {(Object.keys(METHOD_LOGOS) as PayMethod[]).map((id) => {
                      const m = METHOD_LOGOS[id];
                      const active = method === id;
                      const broken = brokenLogos[id];
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            setMethod(id);
                            setPaymentStatus('idle');
                            setErrorMessage('');
                          }}
                          className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl border-2 transition-all ${
                            active
                              ? `${m.activeBorder} bg-white shadow-sm`
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center overflow-hidden">
                            {!broken ? (
                              <img
                                src={m.src}
                                alt={m.label}
                                className="w-7 h-7 object-contain"
                                onError={() =>
                                  setBrokenLogos((prev) => ({ ...prev, [id]: true }))
                                }
                              />
                            ) : (
                              <span className="text-[10px] font-bold text-gray-600">
                                {m.label.slice(0, 2)}
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-[10px] font-semibold ${
                              active ? 'text-gray-900' : 'text-gray-500'
                            }`}
                          >
                            {m.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {paymentStatus === 'processing' && (
                  <div className="flex items-start gap-3 text-sm text-blue-800 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-[13px]">
                        {isMobileMoney ? 'Waiting for confirmation' : 'Processing payment'}
                      </p>
                      <p className="text-blue-600 text-[12px] mt-0.5">
                        {isMobileMoney ? 'Enter your PIN on your phone' : 'Please wait…'}
                      </p>
                    </div>
                  </div>
                )}

                {paymentStatus === 'error' && (
                  <div className="flex items-start gap-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p className="text-[13px]">{errorMessage}</p>
                  </div>
                )}

                {!isFixedAmount && (
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                      Amount
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      min={1}
                      step="0.01"
                      required
                      disabled={isProcessing}
                      className="w-full h-11 px-3.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/30 focus:border-[#635bff] disabled:opacity-60"
                    />
                  </div>
                )}

                {isMobileMoney && (
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                      {method === 'mpesa'
                        ? 'M-PESA number'
                        : method === 'airtel'
                        ? 'Airtel Money number'
                        : 'T-Kash number'}
                    </label>
                    <div className="flex h-11 rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-[#635bff]/30 focus-within:border-[#635bff]">
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
                  </div>
                )}

                {method === 'card' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                        Card number
                      </label>
                      <input
                        type="text"
                        placeholder="4242 4242 4242 4242"
                        disabled={isProcessing}
                        className="w-full h-11 px-3.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/30 focus:border-[#635bff] disabled:opacity-60"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                          Expiry
                        </label>
                        <input
                          type="text"
                          placeholder="MM / YY"
                          disabled={isProcessing}
                          className="w-full h-11 px-3.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/30 focus:border-[#635bff] disabled:opacity-60"
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                          CVC
                        </label>
                        <input
                          type="text"
                          placeholder="123"
                          disabled={isProcessing}
                          className="w-full h-11 px-3.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/30 focus:border-[#635bff] disabled:opacity-60"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {method === 'paypal' && (
                  <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-[13px] text-blue-800">
                    You’ll be redirected to PayPal to complete payment securely.
                  </div>
                )}

                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      disabled={isProcessing}
                      className="w-full h-11 pl-10 pr-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/30 focus:border-[#635bff] disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                    Name <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Full name"
                      disabled={isProcessing}
                      className="w-full h-11 pl-10 pr-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/30 focus:border-[#635bff] disabled:opacity-60"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full h-11 bg-[#0a2540] hover:bg-[#152a45] text-white rounded-lg font-semibold text-[15px] flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing…
                    </>
                  ) : (
                    <>Pay {formatPrice(displayAmount, paymentLink.currency)}</>
                  )}
                </button>

                <p className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
                  <Shield className="w-3 h-3 text-emerald-500" />
                  Secure payment
                </p>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Mobile only — bottom of page, centered */}
      <footer className="lg:hidden border-t border-gray-100 px-6 py-5">
        {poweredBy}
      </footer>
    </div>
  );
}