'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Smartphone,
  CheckCircle,
  Loader2,
  AlertCircle,
  FileText,
  Download,
  Lock,
  Mail,
  User,
  Zap,
  BadgeCheck,
  Shield,
} from 'lucide-react';

interface ProductData {
  id: string;
  productId: string;
  merchantId: string;
  businessName: string;
  name: string;
  price: number;
  currency: string;
  fileUrl: string;
  fileName: string;
  status: string;
  createdAt: string;
  expiryDate: string;
  returnUrl: string;
  verified?: boolean;
  pageCount?: number;
  fileSizeMb?: number;
}

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const res = await fetch(`/api/product-links/${slug}`);
        const data = await res.json();
        if (data.success) setProduct(data.data);
        else setError(data.error || 'Product not found');
      } catch {
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const formatPrice = (amount: number, currency: string) =>
    `${currency} ${Number(amount).toLocaleString('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const handlePay = async () => {
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

    setIsProcessing(true);
    setPaymentStatus('processing');
    setErrorMessage('');

    try {
      const res = await fetch('/api/product-links/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product?.productId,
          phone,
          email,
          customerName: customerName || 'Customer',
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setPaymentStatus('success');
        setProduct(data.data);
        setTimeout(() => {
          if (data.data?.fileUrl) triggerDownload(data.data.fileUrl);
        }, 1200);
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

  const triggerDownload = (url: string) => {
    if (!url) return;
    setIsDownloading(true);
    const a = document.createElement('a');
    a.href = url;
    a.download = product?.fileName || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setIsDownloading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] p-6">
        <div className="max-w-sm w-full text-center bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h1 className="text-lg font-semibold text-gray-900">Unavailable</h1>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            {error || 'This link is invalid or has expired.'}
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

  const isExpired = new Date(product.expiryDate) < new Date();
  const isPaid = product.status === 'PAID' || product.status === 'COMPLETED';
  const merchantName = product.businessName || 'Merchant';
  const isVerified = product.verified === true;
  const pageCount = product.pageCount;
  const fileSizeMb = product.fileSizeMb;

  const fileMeta = [
    'PDF Document',
    pageCount ? `${pageCount} ${pageCount === 1 ? 'Page' : 'Pages'}` : null,
    fileSizeMb ? `${fileSizeMb} MB` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      {/* Payment-link nav — minimal, trust-focused */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[20px] font-bold tracking-tight">
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
            <span>Secured</span>
          </div>
        </div>
      </header>

      {/* Mobile sticky CTA */}
      {!isPaid && !isExpired && (
        <div className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
          <button
            onClick={handlePay}
            disabled={isProcessing}
            className="w-full h-12 bg-[#0a2540] hover:bg-[#152a45] active:scale-[0.98] text-white rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>Pay {formatPrice(product.price, product.currency)}</>
            )}
          </button>
        </div>
      )}

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12 pb-28 md:pb-16">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-14 items-start">
          {/* ── LEFT ─────────────────────────────────────────────── */}
          <div className="space-y-5">
            <h1 className="text-[26px] md:text-[28px] font-semibold text-[#0a2540] tracking-tight leading-tight">
              {product.name}
            </h1>

            {/* Preview card */}
            <div className="relative rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm h-[240px] md:h-[300px]">
              {product.fileUrl ? (
                <iframe
                  src={`${product.fileUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                  className="w-full h-full"
                  style={{ pointerEvents: 'none' }}
                  title="Preview"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                  <FileText className="w-14 h-14 text-gray-200" />
                </div>
              )}

              {!isPaid && (
                <>
                  <div className="absolute inset-0 top-[10%] bg-white/55 backdrop-blur-[8px]" />
                  <div className="absolute inset-x-0 bottom-0 h-[82%] bg-gradient-to-t from-white via-white/90 to-transparent flex items-end justify-center pb-8">
                    <div className="flex items-center gap-2 text-[13px] font-medium text-gray-700 bg-white border border-gray-200 px-4 py-2.5 rounded-full shadow-md">
                      <Lock className="w-3.5 h-3.5 text-gray-500" />
                      Unlock after payment
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Merchant card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Merchant & item details
              </p>

              <dl className="space-y-3 text-[14px]">
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500 shrink-0">Merchant</dt>
                  <dd className="font-medium text-gray-900 text-right">{merchantName}</dd>
                </div>

                {isVerified && (
                  <div className="flex justify-between gap-4 items-center">
                    <dt className="text-gray-500 shrink-0">Status</dt>
                    <dd>
                      <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                        <BadgeCheck className="w-3.5 h-3.5" />
                        Verified Merchant
                      </span>
                    </dd>
                  </div>
                )}

                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500 shrink-0">File format</dt>
                  <dd className="text-gray-800 text-right">{fileMeta || 'PDF Document'}</dd>
                </div>

                <div className="flex justify-between gap-4 items-center">
                  <dt className="text-gray-500 shrink-0">Fulfillment</dt>
                  <dd className="inline-flex items-center gap-1.5 text-gray-800">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    Instant auto-download
                  </dd>
                </div>
              </dl>

              <p className="text-[12px] text-gray-400 mt-4 pt-4 border-t border-gray-100">
                Receipt and download link sent to your email after payment.
              </p>
            </div>
          </div>

          {/* ── RIGHT ────────────────────────────────────────────── */}
          <div>
            {isPaid ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
                <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-7 h-7 text-emerald-500" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Payment successful</h2>
                <p className="text-sm text-gray-500 mt-2">Your file is ready to download.</p>
                <button
                  onClick={() => triggerDownload(product.fileUrl)}
                  disabled={isDownloading}
                  className="mt-6 w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                >
                  {isDownloading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download file
                    </>
                  )}
                </button>
                {product.returnUrl && (
                  <button
                    onClick={() => router.push(product.returnUrl)}
                    className="mt-4 text-sm text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    ← Back to merchant
                  </button>
                )}
              </div>
            ) : isExpired ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900">Link expired</h2>
                <p className="text-sm text-gray-500 mt-2">This product is no longer available.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
                <div className="pb-6 border-b border-gray-100">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Amount due
                  </p>
                  <p className="text-[32px] font-semibold text-[#0a2540] mt-1 tracking-tight leading-none">
                    {formatPrice(product.price, product.currency)}
                  </p>
                </div>

                {paymentStatus === 'processing' && (
                  <div className="mt-5 flex items-start gap-3 text-sm text-blue-800 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3.5">
                    <Loader2 className="w-4 h-4 animate-spin shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Waiting for M-PESA</p>
                      <p className="text-blue-600 text-[13px] mt-0.5">
                        Check your phone and enter your PIN
                      </p>
                    </div>
                  </div>
                )}

                {paymentStatus === 'error' && (
                  <div className="mt-5 flex items-start gap-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>{errorMessage}</p>
                  </div>
                )}

                <div className="mt-6 space-y-5">
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                      Name <span className="text-gray-400 font-normal">optional</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Your full name"
                        disabled={isProcessing}
                        className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-gray-200 bg-white text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#635bff]/25 focus:border-[#635bff] transition-shadow disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                      Email <span className="text-gray-400 font-normal">for receipt</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        disabled={isProcessing}
                        className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-gray-200 bg-white text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#635bff]/25 focus:border-[#635bff] transition-shadow disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                      M-PESA number
                    </label>
                    <div className="flex h-11 rounded-xl border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-[#635bff]/25 focus-within:border-[#635bff] transition-shadow">
                      <span className="flex items-center gap-1.5 px-3.5 bg-gray-50 border-r border-gray-200 text-[13px] text-gray-500 shrink-0">
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
                        className="flex-1 px-3.5 text-[14px] text-gray-900 outline-none placeholder:text-gray-400 disabled:opacity-60"
                      />
                    </div>
                    <p className="text-[12px] text-gray-400 mt-1.5">
                      We’ll send an STK push to this number
                    </p>
                  </div>

                  <button
                    onClick={handlePay}
                    disabled={isProcessing}
                    className="hidden md:flex w-full h-12 bg-[#0a2540] hover:bg-[#152a45] active:scale-[0.99] text-white rounded-xl font-semibold text-[15px] items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing…
                      </>
                    ) : (
                      <>Pay {formatPrice(product.price, product.currency)}</>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-[12px] text-gray-400 pt-1">
                    <Shield className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Payments are encrypted and secure</span>
                  </div>

                  <p className="text-center text-[12px] text-gray-400">
                    Need help?{' '}
                    <Link href="/help-centre" className="text-[#635bff] font-medium hover:underline">
                      Contact support
                    </Link>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Acquisition banner */}
      <section className="bg-[#0a2540] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-9 md:py-11 flex flex-col items-center text-center md:flex-row md:text-left md:justify-between gap-6">
          <div className="max-w-md">
            <p className="text-[15px] font-semibold flex items-center justify-center md:justify-start gap-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              Sell digital products with XecoFlow
            </p>
            <p className="text-sm text-white/55 mt-1.5 leading-relaxed">
              Accept instant M-PESA payments and automate file delivery. Create your first payment link in minutes.
            </p>
          </div>
          <a
            href="https://xecoflow-pay.onrender.com/products/payment-links"
            className="inline-flex items-center justify-center w-full md:w-auto h-11 px-6 rounded-full bg-white text-[#0a2540] text-sm font-semibold hover:bg-gray-100 transition-colors shrink-0"
          >
            Start selling free →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-gray-400">
            <span>© 2026 XecoFlow. All rights reserved.</span>
            <span className="hidden sm:inline text-gray-200">·</span>
            <Link href="/terms" className="hover:text-gray-600 transition-colors">
              Terms
            </Link>
            <span className="hidden sm:inline text-gray-200">·</span>
            <Link href="/privacy" className="hover:text-gray-600 transition-colors">
              Privacy
            </Link>
            <span className="hidden sm:inline text-gray-200">·</span>
            <Link href="/help-centre" className="hover:text-gray-600 transition-colors">
              Report link
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}