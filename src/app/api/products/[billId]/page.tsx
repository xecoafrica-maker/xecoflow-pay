'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Lock,
  Smartphone,
  CheckCircle,
  Loader2,
  AlertCircle,
  ArrowRight,
  FileText,
  Download,
  Eye,
  Shield,
  Mail,
  Send,
  Clock,
  Building2,
  User,
  CreditCard,
} from 'lucide-react';

interface ProductData {
  id: string;
  product_id: string;
  merchant_id: string;
  business_name: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  file_url: string;
  file_name: string;
  preview_image_url: string;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED' | 'PROCESSING';
  expiry_date: string;
  created_at: string;
  customer_email?: string;
  customer_phone?: string;
  customer_name?: string;
  download_token?: string;
  download_count?: number;
  max_downloads?: number;
  return_url?: string;
}

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.billId as string;

  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  // ─── Fetch Product Data ──────────────────────────────────────────────
  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/digital/products/${productId}`);
      const data = await response.json();

      if (data.success) {
        setProduct(data.data);
        if (data.data.customer_phone) setPhoneNumber(data.data.customer_phone);
        if (data.data.customer_email) setEmail(data.data.customer_email);
        if (data.data.customer_name) setCustomerName(data.data.customer_name);
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
    if (productId) fetchProduct();
  }, [productId]);

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
      const response = await fetch('/api/digital/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product?.product_id,
          phone,
          email,
          customerName,
        }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setPaymentStatus('success');
        setProduct(data.data);
        
        setTimeout(() => {
          if (data.data?.file_url) {
            triggerDownload(data.data.file_url);
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
    link.download = product?.file_name || '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsDownloading(false);
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
          <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Loading product...</p>
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
        </div>
      </div>
    );
  }

  const isExpired = new Date(product.expiry_date) < new Date();
  const isPaid = product.status === 'PAID';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 md:p-8">
      <div className="max-w-6xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[600px]">
        
        {/* ─── LEFT SIDE: PREVIEW ────────────────────────────────────── */}
        <div className="lg:w-1/2 p-8 bg-gradient-to-br from-gray-50 to-white border-r border-gray-200 flex flex-col">
          {/* Product Header */}
          <div className="mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Building2 className="w-4 h-4" />
              {product.business_name || 'XecoFlow'}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{product.title || product.description}</h1>
            <p className="text-sm text-gray-500 mt-1">{product.description}</p>
          </div>

          {/* Preview Area */}
          <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden relative min-h-[300px]">
            {isPaid ? (
              // ─── PAID: Show file ready ──────────────────────────────
              <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">File Unlocked! 🎉</h3>
                <p className="text-gray-500 text-sm mt-1">
                  Your file is ready for download.
                </p>
                {product.file_name && (
                  <p className="text-xs text-gray-400 mt-2">
                    📄 {product.file_name}
                  </p>
                )}
                <button
                  onClick={() => triggerDownload(product.file_url)}
                  disabled={isDownloading}
                  className="mt-6 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/25"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download Now
                    </>
                  )}
                </button>
                {product.download_count !== undefined && product.max_downloads && (
                  <p className="text-xs text-gray-400 mt-3">
                    Downloads remaining: {product.max_downloads - product.download_count}
                  </p>
                )}
              </div>
            ) : (
              // ─── NOT PAID: Show locked preview ──────────────────────
              <div className="h-full flex flex-col">
                {/* Preview Image with Watermark Overlay */}
                <div className="relative flex-1 bg-gray-100">
                  {product.preview_image_url ? (
                    <img
                      src={product.preview_image_url}
                      alt="Product preview"
                      className="w-full h-full object-contain opacity-50 blur-sm"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <FileText className="w-16 h-16 text-gray-300" />
                    </div>
                  )}
                  
                  {/* Lock Overlay */}
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 text-center max-w-xs">
                      <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Lock className="w-7 h-7 text-emerald-600" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900">Preview Locked</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Pay to unlock and download
                      </p>
                    </div>
                  </div>
                </div>

                {/* Preview Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Expires: {formatDate(product.expiry_date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Secure payment
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Features / Benefits */}
          {!isPaid && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <Shield className="w-4 h-4 text-emerald-500 mx-auto" />
                <p className="text-xs text-gray-500 mt-1">Secure</p>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <Clock className="w-4 h-4 text-emerald-500 mx-auto" />
                <p className="text-xs text-gray-500 mt-1">Instant</p>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />
                <p className="text-xs text-gray-500 mt-1">Verified</p>
              </div>
            </div>
          )}
        </div>

        {/* ─── RIGHT SIDE: CHECKOUT ──────────────────────────────────── */}
        <div className="lg:w-1/2 p-8 flex flex-col justify-center bg-white">
          
          {isPaid ? (
            // ─── PAID STATE ──────────────────────────────────────────
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Payment Successful! 🎉</h3>
              <p className="text-gray-600 mt-2">
                Your file has been unlocked. You can download it now.
              </p>
              {product.file_url && (
                <button
                  onClick={() => triggerDownload(product.file_url)}
                  className="mt-6 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium flex items-center gap-2 mx-auto transition-all"
                >
                  <Download className="w-4 h-4" />
                  Download File
                </button>
              )}
              <p className="text-xs text-gray-400 mt-4">
                📧 A download link has also been sent to your email.
              </p>
              {/* ✅ Fixed: Type-safe return_url handling */}
              {product.return_url && (
                <button
                  onClick={() => {
                    if (product.return_url) {
                      router.push(product.return_url);
                    }
                  }}
                  className="mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
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
              <p className="text-xs text-gray-400 mt-1">
                Expired on: {formatDate(product.expiry_date)}
              </p>
            </div>
          ) : (
            // ─── CHECKOUT FORM ────────────────────────────────────────
            <div className="space-y-6">
              {/* Price Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Amount Due</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {product.currency} {Number(product.amount).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs bg-emerald-50 px-3 py-1.5 rounded-full text-emerald-700">
                  <Lock className="w-3 h-3" /> Secured
                </div>
              </div>

              {/* Payment Status Messages */}
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
                  {/* Customer Name */}
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
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                        disabled={isProcessing}
                      />
                    </div>
                  </div>

                  {/* Email (Optional) */}
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
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                        disabled={isProcessing}
                      />
                    </div>
                  </div>

                  {/* M-PESA Phone */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                      M-PESA Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="flex border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
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
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-base transition-all shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        Pay {product.currency} {Number(product.amount).toFixed(2)}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {/* Security & Trust */}
                  <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Secure
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3" /> PCI-DSS
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
  );
}