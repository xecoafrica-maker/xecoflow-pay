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
      setErrorMessage('Enter a valid M-PESA number');
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
        setErrorMessage(data.error || 'Payment failed. Try again.');
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="max-w-sm w-full text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h1 className="text-lg font-semibold text-gray-900">Unavailable</h1>
          <p className="text-sm text-gray-500 mt-2">
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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header — larger logo */}
      <header className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center">
          <span className="text-[22px] font-bold tracking-tight">
            <span className="text-[#0a2540]">Xeco</span>
            <span className="text-[#10B981]">Flow</span>
          </span>
        </div>
      </header>

      {/* Mobile pay bar */}
      {!isPaid && !isExpired && (
        <div className="md:hidden fixed bottom-0 inset-x-0 border-t border-gray-200 bg-white p-4 z-50">
          <button
            onClick={handlePay}
            disabled={isProcessing}
            className="w-full py-3.5 bg-[#0a2540] text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>Pay {formatPrice(product.price, product.currency)}</>
            )}
          </button>
        </div>
      )}

      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 md:py-12 pb-28 md:pb-12 w-full">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16">
          {/* Left — Preview first, then details */}
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight mb-5">
              {product.name}
            </h1>

            {/* 1. Document Preview (top) */}
            <div className="relative rounded-lg border border-gray-200 overflow-hidden bg-gray-50 h-[240px] md:h-[280px]">
              {product.fileUrl ? (
                <iframe
                  src={`${product.fileUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                  className="w-full h-full"
                  style={{ pointerEvents: 'none' }}
                  title="Preview"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FileText className="w-12 h-12 text-gray-200" />
                </div>
              )}

              {!isPaid && (
                <>
                  <div className="absolute inset-0 top-[12%] bg-white/50 backdrop-blur-md" />
                  <div className="absolute inset-x-0 bottom-0 h-[80%] bg-gradient-to-t from-white via-white/95 to-transparent flex flex-col items-center justify-end pb-7">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm">
                      <Lock className="w-3.5 h-3.5" />
                      Unlock after payment
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 2. Merchant & item details (below preview) */}
            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Merchant & item details
              </p>

              <div className="grid grid-cols-[110px_1fr] gap-y-2.5 text-sm">
                <span className="text-gray-500">Merchant</span>
                <span className="font-medium text-gray-900">{merchantName}</span>

                {/* Only show status when verified */}
                {isVerified && (
                  <>
                    <span className="text-gray-500">Status</span>
                    <span>
                      <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                        <BadgeCheck className="w-3.5 h-3.5" />
                        Verified Merchant
                      </span>
                    </span>
                  </>
                )}

                <span className="text-gray-500">File format</span>
                <span className="text-gray-800">{fileMeta || 'PDF Document'}</span>

                <span className="text-gray-500">Fulfillment</span>
                <span className="inline-flex items-center gap-1.5 text-gray-800">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Instant auto-download
                </span>
              </div>

              <p className="text-[12px] text-gray-400 pt-1 border-t border-gray-100">
                Receipt and file link sent to your email after payment.
              </p>
            </div>
          </div>

          {/* Right — Checkout */}
          <div>
            {isPaid ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900">Payment successful</h2>
                <p className="text-sm text-gray-500 mt-2">Your file is ready to download.</p>
                <button
                  onClick={() => triggerDownload(product.fileUrl)}
                  disabled={isDownloading}
                  className="mt-6 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                >
                  {isDownloading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download
                    </>
                  )}
                </button>
                {product.returnUrl && (
                  <button
                    onClick={() => router.push(product.returnUrl)}
                    className="mt-4 text-sm text-gray-500 hover:text-gray-700"
                  >
                    ← Back to merchant
                  </button>
                )}
              </div>
            ) : isExpired ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900">Link expired</h2>
                <p className="text-sm text-gray-500 mt-2">This product is no longer available.</p>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Amount</p>
                  <p className="text-3xl font-semibold text-gray-900 mt-1 tracking-tight">
                    {formatPrice(product.price, product.currency)}
                  </p>
                </div>

                {paymentStatus === 'processing' && (
                  <div className="flex items-center gap-3 text-sm text-blue-700 bg-blue-50 rounded-lg px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    Waiting for M-PESA confirmation…
                  </div>
                )}

                {paymentStatus === 'error' && (
                  <div className="flex items-center gap-3 text-sm text-red-700 bg-red-50 rounded-lg px-4 py-3">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {errorMessage}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Name <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Your name"
                      disabled={isProcessing}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/30 focus:border-[#635bff]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email <span className="text-gray-400 font-normal">(for receipt)</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      disabled={isProcessing}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/30 focus:border-[#635bff]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    M-PESA number
                  </label>
                  <div className="flex border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#635bff]/30 focus-within:border-[#635bff]">
                    <span className="bg-gray-50 px-3 py-2.5 text-sm text-gray-500 border-r border-gray-200 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4" />
                      +254
                    </span>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="712071385"
                      disabled={isProcessing}
                      className="flex-1 px-3 py-2.5 text-sm outline-none"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    STK push will be sent to this number
                  </p>
                </div>

                <button
                  onClick={handlePay}
                  disabled={isProcessing}
                  className="hidden md:flex w-full py-3.5 bg-[#0a2540] hover:bg-[#1a365d] text-white rounded-lg font-medium text-sm items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing…
                    </>
                  ) : (
                    <>Pay {formatPrice(product.price, product.currency)}</>
                  )}
                </button>

                <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
                  <Lock className="w-3 h-3" />
                  Payments are encrypted and secure
                </p>

                <p className="text-center text-[12px] text-gray-400">
                  Need help?{' '}
                  <Link href="/help-centre" className="text-[#635bff] hover:underline">
                    Contact support
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Acquisition banner — stacks cleanly on mobile */}
      <section className="border-t border-gray-100 bg-[#0a2540] text-white">
        <div className="max-w-5xl mx-auto px-4 py-8 md:py-10 flex flex-col items-center text-center md:flex-row md:items-center md:text-left md:justify-between gap-5">
          <div>
            <p className="text-[15px] font-semibold flex items-center justify-center md:justify-start gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Sell digital products with XecoFlow
            </p>
            <p className="text-sm text-white/60 mt-1 max-w-md">
              Accept instant M-PESA payments and automate file delivery. Create your first payment link in minutes.
            </p>
          </div>
          <a
            href="https://xecoflow-pay.onrender.com/products/payment-links"
            className="inline-flex items-center justify-center w-full md:w-auto px-5 py-2.5 rounded-full bg-white text-[#0a2540] text-sm font-semibold hover:bg-gray-100 transition-colors shrink-0"
          >
            Start selling free →
          </a>
        </div>
      </section>

      {/* Minimal legal footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-5">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-gray-400">
            <span>© 2026 XecoFlow. All rights reserved.</span>
            <span className="hidden sm:inline text-gray-200">·</span>
            <Link href="/terms" className="hover:text-gray-600">
              Terms
            </Link>
            <span className="hidden sm:inline text-gray-200">·</span>
            <Link href="/privacy" className="hover:text-gray-600">
              Privacy
            </Link>
            <span className="hidden sm:inline text-gray-200">·</span>
            <Link href="/help-centre" className="hover:text-gray-600">
              Report link
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}