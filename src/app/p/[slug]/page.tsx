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
  Shield,
  Clock,
  Building2,
  ArrowRight,
  CreditCard,
  Sparkles,
  Check,
  Copy,
  Share2,
  Eye,
  ChevronDown,
  ChevronUp,
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
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [phoneValid, setPhoneValid] = useState(true);

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

  const validatePhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) return cleaned.length === 10;
    if (cleaned.startsWith('254')) return cleaned.length === 12;
    return cleaned.length === 9 || cleaned.length === 10;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setPhoneNumber(value);
    if (phoneTouched) {
      setPhoneValid(validatePhone(value));
    }
  };

  const handlePhoneBlur = () => {
    setPhoneTouched(true);
    setPhoneValid(validatePhone(phoneNumber));
  };

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
    setTimeout(() => setCopied(false), 3000);
  };

  const shareToWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`🛍️ ${product?.name}\n${window.location.href}`)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-4 border-gray-200 border-t-purple-600 animate-spin mx-auto" />
          <p className="mt-4 text-sm text-gray-500">Loading your document...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white p-6">
        <div className="max-w-sm w-full text-center">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Product Unavailable</h1>
          <p className="text-gray-500 mt-2 text-sm">{error || 'This link is invalid or has expired.'}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-6 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-purple-600/25"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const isExpired = new Date(product.expiryDate) < new Date();
  const isPaid = product.status === 'PAID' || product.status === 'COMPLETED';
  const merchantName = product.businessName || 'Merchant';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
      
      {/* ─── Header ────────────────────────────────────────────────────── */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-gray-800">Xeco<span className="text-purple-600">Flow</span></span>
            <span className="hidden md:inline text-xs text-gray-400 ml-2 font-medium">Secure Checkout</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5 text-emerald-600">
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Secured</span>
            </span>
            <span className="hidden sm:inline text-gray-200">|</span>
            <span className="hidden sm:inline flex items-center gap-1.5 text-emerald-600">
              <Lock className="w-3.5 h-3.5" />
              PCI-DSS
            </span>
          </div>
        </div>
      </header>

      {/* ─── Mobile Sticky Checkout Bar ────────────────────────────── */}
      {!isPaid && !isExpired && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200/80 p-4 shadow-2xl z-50">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Total</p>
              <p className="text-xl font-bold text-gray-900">
                {formatPrice(product.price, product.currency)}
              </p>
            </div>
            <button
              onClick={handlePay}
              disabled={isProcessing}
              className="flex-1 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl font-semibold text-sm transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Pay Now
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10 pb-28 md:pb-10">
        <div className="grid md:grid-cols-5 gap-8 md:gap-12">
          
          {/* ─── LEFT: Document Preview (3/5) ────────────────────────── */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/80 overflow-hidden transition-shadow hover:shadow-2xl">
              
              {/* Product Header */}
              <div className="p-5 md:p-7 border-b border-gray-100/80 bg-gradient-to-r from-gray-50/50 to-white">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1.5">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{merchantName}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-400 text-xs">Digital Product</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                  {product.name}
                </h1>
                <p className="text-sm text-gray-500 mt-1.5 truncate">
                  {product.fileName || 'Digital Document'}
                </p>
              </div>

              {/* ─── Document Preview ───────────────────────────────────── */}
              <div className="relative bg-gray-50/80">
                <div className="aspect-[4/3] relative overflow-hidden">
                  {product.fileUrl ? (
                    <iframe
                      src={`${product.fileUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                      className="w-full h-full"
                      style={{ 
                        pointerEvents: 'none',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                      }}
                      onLoad={() => setPdfLoaded(true)}
                      sandbox="allow-same-origin"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <FileText className="w-16 h-16 text-gray-300" />
                    </div>
                  )}

                  {/* ─── Blur Overlay ───────────────────────────────────── */}
                  {!isPaid && !isExpired && (
                    <div className="absolute bottom-0 left-0 right-0 h-[65%]">
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white backdrop-blur-md" />
                      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
                        <div className="bg-gray-900/90 text-white px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 backdrop-blur-sm shadow-xl">
                          <Lock className="w-4 h-4 text-purple-300" />
                          <span>Locked · Pay to unlock</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2.5 flex items-center gap-1.5 bg-white/80 px-3 py-1 rounded-full shadow-sm">
                          <Eye className="w-3 h-3" />
                          Complete payment on the right
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Loading state */}
                  {!pdfLoaded && product.fileUrl && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm">
                      <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-purple-600 animate-spin" />
                    </div>
                  )}
                </div>

                {/* File Info Footer */}
                <div className="p-4 bg-gray-50/80 border-t border-gray-100/80 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Expires: {new Date(product.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1.5 truncate max-w-[55%]">
                    <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{product.fileName || 'Document'}</span>
                  </span>
                </div>
              </div>

              {/* Share Actions */}
              <div className="p-4 border-t border-gray-100/80 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={copyLink}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-xl hover:bg-gray-100/80"
                    title="Copy link"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={shareToWhatsApp}
                    className="p-2 text-gray-400 hover:text-[#25D366] transition-colors rounded-xl hover:bg-gray-100/80"
                    title="Share to WhatsApp"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
                {copied && <span className="text-xs text-emerald-600 font-medium">✓ Copied!</span>}
              </div>
            </div>
          </div>

          {/* ─── RIGHT: Checkout (2/5) ───────────────────────────────── */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/80 p-6 md:p-8 sticky top-24">
              
              {isPaid ? (
                // ─── PAID STATE ──────────────────────────────────────────
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5 ring-8 ring-emerald-50/50">
                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Payment Successful! 🎉</h2>
                  <p className="text-gray-500 text-sm mt-2">Your file has been unlocked.</p>
                  <button
                    onClick={() => triggerDownload(product.fileUrl)}
                    disabled={isDownloading}
                    className="mt-6 w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-semibold text-sm transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2.5 disabled:opacity-60"
                  >
                    {isDownloading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Download File
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-400 mt-4 flex items-center justify-center gap-1.5">
                    <Mail className="w-3 h-3" />
                    Link sent to your email
                  </p>
                  {product.returnUrl && (
                    <button
                      onClick={() => router.push(product.returnUrl)}
                      className="mt-4 text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
                    >
                      ← Back to Merchant
                    </button>
                  )}
                </div>
              ) : isExpired ? (
                // ─── EXPIRED STATE ────────────────────────────────────────
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5 ring-8 ring-red-50/50">
                    <AlertCircle className="w-10 h-10 text-red-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Link Expired</h2>
                  <p className="text-gray-500 text-sm mt-2">This product is no longer available.</p>
                </div>
              ) : (
                // ─── CHECKOUT FORM ────────────────────────────────────────
                <div className="space-y-6">
                  
                  {/* Price */}
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Total</p>
                    <p className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mt-1">
                      {formatPrice(product.price, product.currency)}
                    </p>
                  </div>

                  {/* Payment Status */}
                  {paymentStatus === 'processing' && (
                    <div className="flex items-center gap-3 text-sm text-blue-700 bg-blue-50/80 rounded-2xl px-4 py-3.5 border border-blue-100/80">
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>Waiting for M-PESA confirmation…</span>
                    </div>
                  )}
                  {paymentStatus === 'error' && (
                    <div className="flex items-start gap-3 text-sm text-red-700 bg-red-50/80 rounded-2xl px-4 py-3.5 border border-red-100/80">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* ─── Name (Optional) ──────────────────────────────── */}
                  <div>
                    <button
                      onClick={() => setShowNameField(!showNameField)}
                      className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors group"
                    >
                      <User className="w-4 h-4 group-hover:text-purple-500 transition-colors" />
                      <span>{showNameField ? 'Hide name' : 'Add your name (optional)'}</span>
                      {showNameField ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                    {showNameField && (
                      <div className="mt-2.5 relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Your name"
                          disabled={isProcessing}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50/80 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-gray-400"
                        />
                      </div>
                    )}
                  </div>

                  {/* ─── Email ──────────────────────────────────────────── */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email <span className="text-gray-400 font-normal text-xs">(for receipt)</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        disabled={isProcessing}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50/80 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  {/* ─── M-PESA Phone ──────────────────────────────────── */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      M-PESA Number <span className="text-red-500">*</span>
                    </label>
                    <div className={`flex border rounded-2xl overflow-hidden transition-all ${
                      phoneTouched && !phoneValid 
                        ? 'border-red-400 ring-2 ring-red-500/20' 
                        : 'border-gray-200 focus-within:ring-2 focus-within:ring-purple-500/20 focus-within:border-purple-500'
                    }`}>
                      <span className="bg-gray-50/80 px-3.5 py-3 text-sm text-gray-500 border-r border-gray-200 flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4" />
                        +254
                      </span>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={handlePhoneChange}
                        onBlur={handlePhoneBlur}
                        placeholder="712 071 385"
                        disabled={isProcessing}
                        className="flex-1 px-3.5 py-3 text-sm outline-none bg-transparent placeholder:text-gray-400"
                      />
                    </div>
                    {phoneTouched && !phoneValid && (
                      <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Enter a valid M-PESA number (e.g., 0712071385)
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-purple-400" />
                      STK push will be sent to this number
                    </p>
                  </div>

                  {/* ─── Pay Button ──────────────────────────────────────── */}
                  <button
                    onClick={handlePay}
                    disabled={isProcessing}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl font-semibold text-base transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] group"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        Pay {formatPrice(product.price, product.currency)}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>

                  {/* ─── Trust Badges ─────────────────────────────────────── */}
                  <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-gray-400 pt-1">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-500" />
                      Encrypted
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-500" />
                      PCI-DSS
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-500" />
                      Instant
                    </span>
                  </div>

                  {/* ─── Support Link ─────────────────────────────────────── */}
                  <p className="text-center text-xs text-gray-400">
                    Need help?{' '}
                    <Link href="/help-centre" className="text-purple-600 hover:text-purple-700 font-medium transition-colors">
                      Contact support
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ─── Acquisition Banner ────────────────────────────────────────── */}
      <section className="border-t border-gray-200/80 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="text-center md:text-left">
            <p className="text-base font-semibold flex items-center justify-center md:justify-start gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Sell digital products with XecoFlow
            </p>
            <p className="text-sm text-white/60 mt-1 max-w-md">
              Accept instant M-PESA payments and automate file delivery. Create your first payment link in minutes.
            </p>
          </div>
          <a
            href="/dashboard/products/create"
            className="inline-flex items-center justify-center w-full md:w-auto px-6 py-3 rounded-full bg-white text-gray-900 text-sm font-semibold hover:bg-gray-100 transition-colors shadow-xl shadow-black/20"
          >
            Start selling free →
          </a>
        </div>
      </section>

      {/* ─── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200/80 bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-5">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-gray-400">
            <span>© 2026 XecoFlow. All rights reserved.</span>
            <span className="hidden sm:inline text-gray-300">·</span>
            <Link href="/terms" className="hover:text-gray-600 transition-colors">
              Terms
            </Link>
            <span className="hidden sm:inline text-gray-300">·</span>
            <Link href="/privacy" className="hover:text-gray-600 transition-colors">
              Privacy
            </Link>
            <span className="hidden sm:inline text-gray-300">·</span>
            <Link href="/help-centre" className="hover:text-gray-600 transition-colors">
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}