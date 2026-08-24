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
  Mail,  // ✅ Added Mail import
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

    if (!customerName) {
      setErrorMessage('Please enter your name');
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
          customerName,
        }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setPaymentStatus('success');
        setProduct(data.data);
        
        // Auto-download after payment
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
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto" />
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
            className="mt-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all"
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 md:p-8">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        
        {/* ─── LEFT: Product Info ────────────────────────────────────── */}
        <div className="md:w-1/2 p-8 bg-gradient-to-br from-gray-50 to-white border-b md:border-r border-gray-200 flex flex-col">
          <div className="mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Building2 className="w-4 h-4" />
              {product.businessName || 'XecoFlow'}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-3xl font-bold text-indigo-600 mt-2">
              {product.currency} {Number(product.price).toFixed(2)}
            </p>
          </div>

          {/* File Info */}
          <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center justify-center">
            {isPaid ? (
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900">🎉 Purchase Complete!</h3>
                <p className="text-gray-500 text-sm mt-1">Your file is ready to download</p>
                <button
                  onClick={() => triggerDownload(product.fileUrl)}
                  disabled={isDownloading}
                  className="mt-6 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium flex items-center gap-2 mx-auto transition-all"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download {product.fileName || 'File'}
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-sm text-gray-500">Pay to unlock and download</p>
                {product.fileName && (
                  <p className="text-xs text-gray-400 mt-1">📄 {product.fileName}</p>
                )}
                <div className="mt-4 flex items-center gap-4 justify-center text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Expires: {formatDate(product.expiryDate)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Share buttons */}
          <div className="mt-4 flex items-center gap-2 justify-center">
            <button
              onClick={copyLink}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Copy link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={shareToWhatsApp}
              className="p-2 text-gray-400 hover:text-[#25D366] transition-colors"
              title="Share to WhatsApp"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ─── RIGHT: Checkout ───────────────────────────────────────── */}
        <div className="md:w-1/2 p-8 flex flex-col justify-center bg-white">
          
          {isPaid ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Payment Successful! 🎉</h3>
              <p className="text-gray-600 mt-2">Your file has been unlocked.</p>
              <p className="text-xs text-gray-400 mt-4">
                📧 A download link has been sent to your email.
              </p>
              {product.returnUrl && (
                <button
                  onClick={() => router.push(product.returnUrl)}
                  className="mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  ← Back to Merchant
                </button>
              )}
            </div>
          ) : isExpired ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Link Expired</h3>
              <p className="text-gray-600 mt-2">This product link is no longer active.</p>
            </div>
          ) : (
            <div className="space-y-6">
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
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                        disabled={isProcessing}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                      Email <span className="text-gray-400 text-xs">(for receipt)</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                        disabled={isProcessing}
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                      M-PESA Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="flex border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
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
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Send className="w-3 h-3" /> We'll send an STK push to your phone
                    </p>
                  </div>

                  {/* Pay Button */}
                  <button
                    onClick={handlePay}
                    disabled={isProcessing}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-base transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

                  {/* Security */}
                  <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Secure
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3" /> PCI-DSS
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}