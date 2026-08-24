'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Smartphone,
  CheckCircle,
  Loader2,
  AlertCircle,
  FileText,
  Download,
  Shield,
  Lock,
  Copy,
  Check,
  Mail,
  User,
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
  const [copied, setCopied] = useState(false);

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

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-[15px] font-bold tracking-tight">
            <span className="text-[#0a2540]">Xeco</span>
            <span className="text-[#10B981]">Flow</span>
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <Shield className="w-3.5 h-3.5" />
            Secure checkout
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

      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12 pb-28 md:pb-12">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16">
          {/* Document */}
          <div>
            <p className="text-xs text-gray-400 mb-1">{product.businessName}</p>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
              {product.name}
            </h1>
            {product.fileName && (
              <p className="text-sm text-gray-400 mt-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                {product.fileName}
              </p>
            )}

            <div className="mt-6 relative rounded-lg border border-gray-200 overflow-hidden bg-gray-50 aspect-[3/4]">
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
                <div className="absolute inset-x-0 bottom-0 h-[50%] bg-gradient-to-t from-white via-white/90 to-transparent flex flex-col items-center justify-end pb-8">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm">
                    <Lock className="w-3.5 h-3.5" />
                    Unlock after payment
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={copyLink}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1.5 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy link
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Checkout */}
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
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}