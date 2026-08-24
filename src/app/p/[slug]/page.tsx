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
  Globe,
  Zap,
  Sparkles,
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

  // ─── Fetch Product ──────────────────────────────────────────────────
  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/product-links/${slug}`);
      const data = await response.json();

      if (data.success) {
        setProduct(data.data);
      } else {
        setError(data.error || 'Product not found');
      }
    } catch (err) {
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) fetchProduct();
  }, [slug]);

  // ─── Handle Payment ──────────────────────────────────────────────
  const handlePay = async () => {
    let phone = phoneNumber.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '254' + phone.slice(1);
    if (!phone.startsWith('254') && phone.length === 10) phone = '254' + phone;
    if (!phone.startsWith('254') && phone.length === 9) phone = '254' + phone;

    if (!phone || phone.length < 10) {
      setErrorMessage('Please enter a valid phone number');
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
          if (data.data?.fileUrl) {
            triggerDownload(data.data.fileUrl);
          }
        }, 1500);
      } else {
        setPaymentStatus('error');
        setErrorMessage(data.error || 'Payment failed');
      }
    } catch (error: any) {
      setPaymentStatus('error');
      setErrorMessage(error.message || 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── Trigger File Download ────────────────────────────────────────
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

  // ─── Copy Link to Clipboard ────────────────────────────────────────
  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // ─── Share to WhatsApp ─────────────────────────────────────────────
  const shareToWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`🛍️ ${product?.name}\n${window.location.href}`)}`, '_blank');
  };

  // ─── Format Date ──────────────────────────────────────────────────
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // ─── Loading State ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  // ─── Error State ──────────────────────────────────────────────────
  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Product Unavailable</h2>
          <p className="text-gray-500 mt-2">{error || 'This product link is invalid or expired.'}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-6 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-all"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const isExpired = new Date(product.expiryDate) < new Date();
  const isPaid = product.status === 'PAID' || product.status === 'COMPLETED';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      
      {/* ─── HEADER ────────────────────────────────────────────────────── */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-800">Xeco<span className="text-purple-600">Flow</span></span>
            <span className="hidden md:inline text-xs text-gray-400 ml-2">Secure Checkout</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-500" />
              Secured
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-500" />
              PCI-DSS
            </span>
          </div>
        </div>
      </header>

      {/* ─── Mobile Sticky Checkout Bar ────────────────────────────── */}
      {!isPaid && !isExpired && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-50">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-gray-500">Amount Due</p>
              <p className="text-lg font-bold text-purple-600">
                {product.currency} {Number(product.price).toFixed(2)}
              </p>
            </div>
            <button
              onClick={handlePay}
              disabled={isProcessing}
              className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

      <div className="max-w-6xl mx-auto p-4 md:p-8 pb-32 md:pb-8">
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          
          {/* ─── LEFT: Document Preview ────────────────────────────── */}
          <div className="order-2 md:order-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              
              {/* Product Header */}
              <div className="p-4 md:p-6 border-b border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <Building2 className="w-4 h-4" />
                  {product.businessName || 'XecoFlow'}
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">{product.name}</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {product.fileName || 'Digital Document'}
                </p>
              </div>

              {/* ─── ACTUAL PDF PREVIEW ───────────────────────────────────── */}
              <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {product.fileUrl ? (
                  <iframe
                    src={`${product.fileUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                    className="w-full h-full overflow-hidden"
                    style={{ 
                      pointerEvents: 'none',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                    }}
                    onLoad={() => setPdfLoaded(true)}
                    sandbox="allow-same-origin"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <FileText className="w-16 h-16 text-gray-300" />
                  </div>
                )}

                {/* ─── Blur Overlay - Bottom 60% ─────────────────────────── */}
                {!isPaid && !isExpired && (
                  <div className="absolute bottom-0 left-0 right-0 h-[60%]">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/60 to-white backdrop-blur-md"></div>
                    
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
                      <div className="bg-gray-900/80 text-white px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 backdrop-blur-sm">
                        <Lock className="w-4 h-4 text-purple-300" />
                        <span>Full Document Locked</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1 bg-white/80 px-3 py-1 rounded-full">
                        <Eye className="w-3 h-3" />
                        Pay on the right to unlock
                      </p>
                    </div>
                  </div>
                )}

                {/* Loading state for PDF */}
                {!pdfLoaded && product.fileUrl && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                  </div>
                )}
              </div>

              {/* File Info Footer */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Expires: {formatDate(product.expiryDate)}
                </span>
                <span className="flex items-center gap-1 truncate max-w-[60%]">
                  <FileText className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{product.fileName || 'Document'}</span>
                </span>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="mt-4 flex items-center justify-between bg-white rounded-xl border border-gray-200 p-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={copyLink}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                  title="Copy link"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={shareToWhatsApp}
                  className="p-2 text-gray-400 hover:text-[#25D366] transition-colors rounded-lg hover:bg-gray-100"
                  title="Share to WhatsApp"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
              {copied && <span className="text-xs text-emerald-600">Copied!</span>}
            </div>
          </div>

          {/* ─── RIGHT: Checkout ────────────────────────────────────── */}
          <div className="order-1 md:order-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8 sticky top-4">
              
              {isPaid ? (
                // ─── PAID STATE ──────────────────────────────────────────
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">🎉 Payment Successful!</h3>
                  <p className="text-gray-600 mt-2">Your file has been unlocked.</p>
                  <button
                    onClick={() => triggerDownload(product.fileUrl)}
                    disabled={isDownloading}
                    className="mt-6 w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        Download {product.fileName || 'File'}
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-400 mt-4">
                    📧 A download link has been sent to your email.
                  </p>
                  {product.returnUrl && (
                    <button
                      onClick={() => router.push(product.returnUrl)}
                      className="mt-4 text-sm text-purple-600 hover:text-purple-700 font-medium"
                    >
                      ← Back to Merchant
                    </button>
                  )}
                </div>
              ) : isExpired ? (
                // ─── EXPIRED STATE ────────────────────────────────────────
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Link Expired</h3>
                  <p className="text-gray-600 mt-2">This product link is no longer active.</p>
                </div>
              ) : (
                // ─── CHECKOUT FORM ────────────────────────────────────────
                <div className="space-y-5">
                  {/* Price Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">Amount Due</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {product.currency} {Number(product.price).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs bg-emerald-50 px-3 py-1.5 rounded-full text-emerald-700">
                      <Lock className="w-3 h-3" /> Secured
                    </div>
                  </div>

                  {/* Payment Status */}
                  {paymentStatus === 'processing' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                      <span className="text-sm text-blue-700">Initiating payment...</span>
                    </div>
                  )}
                  {paymentStatus === 'error' && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <span className="text-sm text-red-700">{errorMessage}</span>
                    </div>
                  )}

                  {paymentStatus !== 'success' && (
                    <>
                      {/* ─── Name (Optional) ──────────────────────────────── */}
                      <div>
                        <button
                          onClick={() => setShowNameField(!showNameField)}
                          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          {showNameField ? 'Hide name' : 'Add your name (optional)'}
                          <ChevronDown className={`w-4 h-4 transition-transform ${showNameField ? 'rotate-180' : ''}`} />
                        </button>
                        {showNameField && (
                          <div className="mt-2 relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              placeholder="Your name"
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
                              disabled={isProcessing}
                            />
                          </div>
                        )}
                      </div>

                      {/* ─── Email (Optional) ──────────────────────────────── */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Email <span className="text-gray-400 text-xs">(for receipt)</span>
                        </label>
                        <div className="relative mt-1">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
                            disabled={isProcessing}
                          />
                        </div>
                      </div>

                      {/* ─── M-PESA Phone ──────────────────────────────────── */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          M-PESA Mobile Number <span className="text-red-500">*</span>
                        </label>
                        <div className="flex border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-purple-500/20 focus-within:border-purple-500 transition-all mt-1">
                          <div className="bg-gray-50 px-4 py-3 border-r border-gray-200 flex items-center text-sm text-gray-700">
                            <Smartphone className="w-4 h-4 mr-2" />
                            +254
                          </div>
                          <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="712 071 385"
                            className="flex-1 px-4 py-3 text-sm outline-none"
                            disabled={isProcessing}
                          />
                        </div>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-1.5">
                          <Send className="w-3 h-3" /> We'll send an STK push to your phone
                        </p>
                      </div>

                      {/* ─── Pay Button (Desktop) ───────────────────────────── */}
                      <button
                        onClick={handlePay}
                        disabled={isProcessing}
                        className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-base transition-all shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-5 h-5" />
                            Pay {product.currency} {Number(product.price).toFixed(2)}
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      {/* ─── Security Badges ─────────────────────────────────── */}
                      <div className="flex items-center justify-center gap-4 text-xs text-gray-400 pt-2">
                        <span className="flex items-center gap-1">
                          <Shield className="w-3 h-3" /> Secure
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Lock className="w-3 h-3" /> PCI-DSS
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Instant
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                <Zap className="w-3 h-3 text-white" />
              </div>
              <span className="text-gray-600">Xeco<span className="text-purple-600">Flow</span></span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">Secure Digital Delivery</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-500" />
                Encrypted
              </span>
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-500" />
                Trusted
              </span>
              <span>© 2026 XecoFlow</span>
            </div>
          </div>
          <div className="mt-3 text-center text-[10px] text-gray-300">
            Powered by XecoFlow Payment Gateway · Instant delivery after payment confirmation
          </div>
        </div>
      </footer>
    </div>
  );
}