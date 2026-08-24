'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Smartphone,
  CheckCircle,
  Loader2,
  AlertCircle,
  ArrowRight,
  FileText,
  Download,
  Shield,
  Send,
  Clock,
  Building2,
  User,
  CreditCard,
  Lock,
  Share2,
  Copy,
  Check,
  Mail,
  Eye,
  ChevronDown,
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
  const [showNameField, setShowNameField] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pdfLoaded, setPdfLoaded] = useState(false);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/product-links/${slug}`);
      const data = await response.json();
      if (data.success) {
        setProduct(data.data);
      } else {
        setError(data.error || 'Product not found');
      }
    } catch {
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) fetchProduct();
  }, [slug]);

  const handlePay = async () => {
    let phone = phoneNumber.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '254' + phone.slice(1);
    if (!phone.startsWith('254') && phone.length === 10) phone = '254' + phone;
    if (!phone.startsWith('254') && phone.length === 9) phone = '254' + phone;

    if (!phone || phone.length < 10) {
      setErrorMessage('Please enter a valid M-PESA number');
      setPaymentStatus('error');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');
    setErrorMessage('');

    try {
      const response = await fetch('/api/product-links/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product?.productId,
          phone,
          email,
          customerName: customerName || 'Customer',
        }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setPaymentStatus('success');
        setProduct(data.data);
        setTimeout(() => {
          if (data.data?.fileUrl) triggerDownload(data.data.fileUrl);
        }, 1500);
      } else {
        setPaymentStatus('error');
        setErrorMessage(data.error || 'Payment failed. Please try again.');
      }
    } catch (err: any) {
      setPaymentStatus('error');
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerDownload = (url: string) => {
    if (!url) return;
    setIsDownloading(true);
    const link = document.createElement('a');
    link.href = url;
    link.download = product?.fileName || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsDownloading(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareToWhatsApp = () => {
    const text = `${product?.name}\n${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const formatPrice = (amount: number, currency: string) =>
    `${currency} ${Number(amount).toLocaleString('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // ─── Loading ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#635bff] mx-auto" />
          <p className="mt-4 text-sm text-gray-500">Loading product…</p>
        </div>
      </div>
    );
  }

  // ─── Error ──────────────────────────────────────────────────────────
  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc] p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-[#0a2540]">Product unavailable</h2>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            {error || 'This link is invalid or has expired.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="mt-6 px-6 py-2.5 bg-[#0a2540] hover:bg-[#1a365d] text-white rounded-full text-sm font-medium transition-colors"
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
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-bold tracking-tight">
              <span className="text-[#0a2540]">Xeco</span>
              <span className="text-[#10B981]">Flow</span>
            </span>
            <span className="hidden sm:inline text-gray-300">|</span>
            <span className="hidden sm:inline text-xs text-gray-400">Secure checkout</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>Secured by XecoFlow</span>
          </div>
        </div>
      </header>

      {/* Mobile sticky bar */}
      {!isPaid && !isExpired && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] z-50">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-gray-400">Amount due</p>
              <p className="text-lg font-bold text-[#0a2540] truncate">
                {formatPrice(product.price, product.currency)}
              </p>
            </div>
            <button
              onClick={handlePay}
              disabled={isProcessing}
              className="px-6 py-3 bg-[#635bff] hover:bg-[#5851db] text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#635bff]/25"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Pay now
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10 pb-28 md:pb-10">
        <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
          {/* ─── LEFT: Document ─────────────────────────────────────── */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="px-5 md:px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-1.5 text-[12px] text-gray-400 mb-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {product.businessName || 'Merchant'}
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-[#0a2540] tracking-tight">
                  {product.name}
                </h1>
                {product.fileName && (
                  <p className="text-[13px] text-gray-400 mt-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    {product.fileName}
                  </p>
                )}
              </div>

              {/* Preview */}
              <div className="relative aspect-[3/4] bg-gray-50">
                {product.fileUrl ? (
                  <iframe
                    src={`${product.fileUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                    className="w-full h-full"
                    style={{ pointerEvents: 'none' }}
                    onLoad={() => setPdfLoaded(true)}
                    title="Document preview"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <FileText className="w-14 h-14 text-gray-200" />
                    <p className="text-sm text-gray-400 mt-3">No preview available</p>
                  </div>
                )}

                {/* Locked overlay */}
                {!isPaid && (
                  <div className="absolute bottom-0 left-0 right-0 h-[55%]">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/80 to-white backdrop-blur-[6px]" />
                    <div className="absolute bottom-0 left-0 right-0 pb-8 pt-12 flex flex-col items-center px-4">
                      <div className="bg-[#0a2540] text-white px-5 py-2.5 rounded-full text-[13px] font-semibold shadow-lg flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5" />
                        Pay {formatPrice(product.price, product.currency)} to unlock
                      </div>
                      <p className="text-[12px] text-gray-400 mt-2.5 flex items-center gap-1.5">
                        <Eye className="w-3 h-3" />
                        Full document available after payment
                      </p>
                    </div>
                  </div>
                )}

                {!pdfLoaded && product.fileUrl && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                    <Loader2 className="w-7 h-7 animate-spin text-[#635bff]" />
                  </div>
                )}
              </div>

              {/* Footer meta */}
              <div className="px-5 py-3 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  Expires {formatDate(product.expiryDate)}
                </span>
                <span className="flex items-center gap-1.5 truncate max-w-[50%]">
                  <FileText className="w-3 h-3 shrink-0" />
                  <span className="truncate">{product.fileName}</span>
                </span>
              </div>
            </div>

            {/* Share */}
            <div className="mt-3 flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-2.5">
              <div className="flex items-center gap-1">
                <button
                  onClick={copyLink}
                  className="p-2 text-gray-400 hover:text-[#0a2540] hover:bg-gray-50 rounded-lg transition-colors"
                  title="Copy link"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={shareToWhatsApp}
                  className="p-2 text-gray-400 hover:text-[#25D366] hover:bg-gray-50 rounded-lg transition-colors"
                  title="Share on WhatsApp"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
              {copied && (
                <span className="text-[12px] text-emerald-600 font-medium">Link copied</span>
              )}
            </div>
          </div>

          {/* ─── RIGHT: Checkout ────────────────────────────────────── */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100 p-5 md:p-6 sticky top-6">
              {isPaid ? (
                /* ── Paid ─────────────────────────────────────────── */
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-bold text-[#0a2540]">Payment successful</h3>
                  <p className="text-sm text-gray-500 mt-1.5">
                    Your file is unlocked and ready to download.
                  </p>
                  <button
                    onClick={() => triggerDownload(product.fileUrl)}
                    disabled={isDownloading}
                    className="mt-6 w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Downloading…
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Download file
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-gray-400 mt-3">
                    A download link was also sent to your email if provided.
                  </p>
                  {product.returnUrl && (
                    <button
                      onClick={() => router.push(product.returnUrl)}
                      className="mt-4 text-sm text-[#635bff] hover:underline font-medium"
                    >
                      ← Back to merchant
                    </button>
                  )}
                </div>
              ) : isExpired ? (
                /* ── Expired ──────────────────────────────────────── */
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-lg font-bold text-[#0a2540]">Link expired</h3>
                  <p className="text-sm text-gray-500 mt-1.5">
                    This product link is no longer active.
                  </p>
                </div>
              ) : (
                /* ── Checkout form ────────────────────────────────── */
                <div className="space-y-4">
                  {/* Price */}
                  <div className="flex items-start justify-between pb-4 border-b border-gray-100">
                    <div>
                      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                        Amount due
                      </p>
                      <p className="text-2xl md:text-3xl font-bold text-[#0a2540] mt-0.5 tracking-tight">
                        {formatPrice(product.price, product.currency)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-medium bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">
                      <Lock className="w-3 h-3" />
                      Secured
                    </div>
                  </div>

                  {/* Status banners */}
                  {paymentStatus === 'processing' && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-3">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">Waiting for M-PESA</p>
                        <p className="text-[12px] text-blue-600">Check your phone and enter your PIN</p>
                      </div>
                    </div>
                  )}
                  {paymentStatus === 'error' && (
                    <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-3">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <p className="text-sm text-red-700">{errorMessage}</p>
                    </div>
                  )}

                  {paymentStatus !== 'success' && (
                    <>
                      {/* Optional name */}
                      <div>
                        <button
                          type="button"
                          onClick={() => setShowNameField(!showNameField)}
                          className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-[#0a2540] transition-colors"
                        >
                          <User className="w-3.5 h-3.5" />
                          {showNameField ? 'Hide name' : 'Add your name (optional)'}
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${showNameField ? 'rotate-180' : ''}`}
                          />
                        </button>
                        {showNameField && (
                          <div className="mt-2 relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              placeholder="Your full name"
                              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-[#0a2540] placeholder:text-gray-400 focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all"
                              disabled={isProcessing}
                            />
                          </div>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                          Email <span className="text-gray-400 font-normal">(for receipt)</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-[#0a2540] placeholder:text-gray-400 focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] outline-none transition-all"
                            disabled={isProcessing}
                          />
                        </div>
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                          M-PESA number <span className="text-red-500">*</span>
                        </label>
                        <div className="flex border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#635bff]/20 focus-within:border-[#635bff] transition-all">
                          <div className="bg-gray-50 px-3.5 py-2.5 border-r border-gray-200 flex items-center gap-1.5 text-sm text-gray-600 shrink-0">
                            <Smartphone className="w-4 h-4 text-gray-400" />
                            +254
                          </div>
                          <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="712 071 385"
                            className="flex-1 px-3.5 py-2.5 text-sm text-[#0a2540] outline-none placeholder:text-gray-400"
                            disabled={isProcessing}
                          />
                        </div>
                        <p className="text-[11px] text-gray-400 flex items-center gap-1.5 mt-1.5">
                          <Send className="w-3 h-3" />
                          We’ll send an STK push to this number
                        </p>
                      </div>

                      {/* Pay CTA – desktop */}
                      <button
                        onClick={handlePay}
                        disabled={isProcessing}
                        className="hidden md:flex w-full py-3.5 bg-[#635bff] hover:bg-[#5851db] text-white rounded-xl font-semibold text-[15px] transition-all shadow-lg shadow-[#635bff]/20 items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing…
                          </>
                        ) : (
                          <>
                            Pay {formatPrice(product.price, product.currency)}
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      {/* Trust row */}
                      <div className="flex items-center justify-center gap-3 pt-1 text-[11px] text-gray-400">
                        <span className="flex items-center gap-1">
                          <Shield className="w-3 h-3" /> Secure
                        </span>
                        <span className="text-gray-200">·</span>
                        <span className="flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Encrypted
                        </span>
                        <span className="text-gray-200">·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Instant access
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Powered by */}
            <p className="text-center text-[11px] text-gray-400 mt-4">
              Powered by{' '}
              <span className="font-semibold text-gray-500">
                <span className="text-[#0a2540]">Xeco</span>
                <span className="text-[#10B981]">Flow</span>
              </span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}