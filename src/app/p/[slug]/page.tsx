'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';
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
  XCircle,
  Clock,
  Wifi,
  WifiOff,
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

interface TransactionStatus {
  transactionId: string;
  status: string;
  paymentStatus: string;
  mpesaReceipt: string | null;
  resultCode: number | null;
  resultDesc: string | null;
  createdAt: string;
  completedAt: string | null;
  product: {
    productId: string;
    status: string;
    fileUrl: string;
    fileName: string;
  };
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
  
  // ─── Payment State ──────────────────────────────────────────────
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error' | 'pending'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pollingCount, setPollingCount] = useState(0);
  const [showRetry, setShowRetry] = useState(false);

  // ─── WebSocket State ──────────────────────────────────────────────
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isWebSocketAvailable, setIsWebSocketAvailable] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const MAX_POLLING_ATTEMPTS = 30;
  const POLLING_INTERVAL = 3000;

  // ─── Fetch Product ──────────────────────────────────────────────
  useEffect(() => {
    if (!slug) return;
    fetchProduct();
  }, [slug]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/product-links/${slug}`);
      const data = await res.json();
      if (data.success) {
        setProduct(data.data);
        if (data.data.status === 'PAID' || data.data.status === 'COMPLETED') {
          setPaymentStatus('success');
          setFileUrl(data.data.fileUrl);
          setFileName(data.data.fileName);
        }
      } else {
        setError(data.error || 'Product not found');
      }
    } catch {
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  // ─── WebSocket Connection ─────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;
    let socketInstance: any = null;

    const initWebSocket = async () => {
      try {
        const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 
                       (typeof window !== 'undefined' && window.location.origin) ||
                       'https://xecoflow-2gen.onrender.com';

        console.log('🔌 [WS] Connecting to:', WS_URL);

        const { io } = await import('socket.io-client');

        socketInstance = io(WS_URL, {
          transports: ['websocket', 'polling'],
          withCredentials: true,
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 1000,
          timeout: 5000,
        });

        socketInstance.on('connect', () => {
          if (isMounted) {
            console.log('✅ [WS] Connected:', socketInstance.id);
            setIsSocketConnected(true);
          }
        });

        socketInstance.on('disconnect', () => {
          if (isMounted) {
            console.log('❌ [WS] Disconnected');
            setIsSocketConnected(false);
          }
        });

        socketInstance.on('connect_error', (error: any) => {
          console.warn('⚠️ [WS] Connection error (non-blocking):', error?.message);
          if (isMounted) {
            setIsSocketConnected(false);
          }
        });

        socketInstance.on('payment:status', (data: any) => {
          console.log('📡 [WS] Payment status update:', data);
          
          if (isMounted) {
            if (data.status === 'COMPLETED' || data.status === 'SETTLED') {
              setPaymentStatus('success');
              setFileUrl(data.fileUrl || product?.fileUrl || null);
              setFileName(data.fileName || product?.fileName || null);
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
              if (data.mpesaReceipt) {
                console.log('📋 Receipt:', data.mpesaReceipt);
              }
            } else if (data.status === 'FAILED' || data.status === 'DECLINED') {
              setPaymentStatus('error');
              setErrorMessage(data.resultDesc || 'Payment failed. Please try again.');
              setShowRetry(true);
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
            }
          }
        });

        socketRef.current = socketInstance;

      } catch (error) {
        console.warn('⚠️ [WS] WebSocket not available, using polling fallback only');
        setIsWebSocketAvailable(false);
        setIsSocketConnected(false);
      }
    };

    const timeoutId = setTimeout(() => {
      initWebSocket();
    }, 500);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // ─── Register for Payment Updates ────────────────────────────────
  const registerForPaymentUpdates = (checkoutId: string, transactionId: string) => {
    try {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('register:payment', {
          checkoutId: checkoutId,
          transactionId: transactionId,
        });
        console.log(`📡 [WS] Registered for checkout: ${checkoutId}, transaction: ${transactionId}`);
        return true;
      }
    } catch (error) {
      console.warn('⚠️ [WS] Registration failed (non-blocking):', error);
    }
    console.warn('⚠️ [WS] Socket not connected, using polling fallback');
    return false;
  };

  // ─── Poll Payment Status (Fallback) ──────────────────────────────
  const pollPaymentStatus = (txId: string) => {
    setPollingCount(0);
    setShowRetry(false);
    
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(async () => {
      setPollingCount((prev) => {
        const newCount = prev + 1;
        
        if (newCount >= MAX_POLLING_ATTEMPTS) {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setPaymentStatus('error');
          setErrorMessage('Payment is taking longer than expected. Please check your M-PESA app.');
          setShowRetry(true);
          return newCount;
        }
        return newCount;
      });

      try {
        const res = await fetch(`/v1/product-links/status/${txId}`);
        const data = await res.json();

        if (data.success && data.data) {
          const status = data.data;
          
          if (status.status === 'SETTLED' || status.status === 'COMPLETED') {
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            setPaymentStatus('success');
            setFileUrl(status.product?.fileUrl || null);
            setFileName(status.product?.fileName || null);
          } else if (status.status === 'FAILED' || status.status === 'DECLINED' || status.status === 'TERMINATED_BY_TIMEOUT') {
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            setPaymentStatus('error');
            setErrorMessage(status.resultDesc || 'Payment failed. Please try again.');
            setShowRetry(true);
          }
        }
      } catch (error) {
        console.error('Status polling error:', error);
      }
    }, POLLING_INTERVAL);
  };

  // ─── Handle Payment ──────────────────────────────────────────────
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
    setShowRetry(false);

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
        const txId = data.data?.transactionId;
        const ckId = data.data?.checkoutRequestId;
        
        if (txId) {
          setTransactionId(txId);
          setCheckoutId(ckId || null);
          setPaymentStatus('pending');
          
          // ─── 🔥 TRY WEBSOCKET ─────────────────────────────────────
          if (ckId && isWebSocketAvailable) {
            try {
              registerForPaymentUpdates(ckId, txId);
            } catch (wsError) {
              console.warn('WebSocket registration failed, using polling');
            }
          }
          
          // ─── START POLLING ────────────────────────────────────────
          pollPaymentStatus(txId);
          
          console.log(`📡 Payment initiated. WebSocket: ${isSocketConnected ? '✅' : '❌'}, Polling: ✅`);
        } else {
          setPaymentStatus('error');
          setErrorMessage('No transaction ID received. Please try again.');
        }
      } else {
        setPaymentStatus('error');
        setErrorMessage(data.error || 'Payment failed. Please try again.');
        setShowRetry(true);
      }
    } catch (err: any) {
      setPaymentStatus('error');
      setErrorMessage(err.message || 'Something went wrong.');
      setShowRetry(true);
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── Download File ──────────────────────────────────────────────
  const triggerDownload = () => {
    const url = fileUrl || product?.fileUrl;
    if (!url) return;
    
    setIsDownloading(true);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || product?.fileName || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setIsDownloading(false);
  };

  // ─── Retry Payment ──────────────────────────────────────────────
  const retryPayment = () => {
    setPaymentStatus('idle');
    setErrorMessage('');
    setShowRetry(false);
    setTransactionId(null);
    setCheckoutId(null);
  };

  // ─── Cleanup ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // ─── Render Helpers ──────────────────────────────────────────────
  const formatPrice = (amount: number, currency: string) =>
    `${currency} ${Number(amount).toLocaleString('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <Loader2 className="w-7 h-7 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] p-4">
        <div className="max-w-sm w-full text-center bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <AlertCircle className="w-9 h-9 text-red-500 mx-auto mb-3" />
          <h1 className="text-base font-semibold text-gray-900">Unavailable</h1>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            {error || 'This link is invalid or has expired.'}
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

  const isExpired = new Date(product.expiryDate) < new Date();
  const isPaid = paymentStatus === 'success' || product.status === 'PAID' || product.status === 'COMPLETED';
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

  // ─── Payment Status Rendering ────────────────────────────────────
  const renderPaymentStatus = () => {
    if (paymentStatus === 'processing') {
      return (
        <div className="mt-4 flex items-start gap-2.5 text-sm text-blue-800 bg-blue-50 border border-blue-100 rounded-xl px-3.5 py-3">
          <Loader2 className="w-4 h-4 animate-spin shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-[13px]">Initiating payment...</p>
            <p className="text-blue-600 text-[12px] mt-0.5">Please wait while we connect to M-PESA</p>
          </div>
        </div>
      );
    }

    if (paymentStatus === 'pending') {
      return (
        <div className="mt-4 flex flex-col items-start gap-2.5 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-3">
          <div className="flex items-center gap-2.5 w-full">
            <Loader2 className="w-4 h-4 animate-spin shrink-0 text-amber-600" />
            <div className="flex-1">
              <p className="font-medium text-[13px]">Waiting for payment confirmation</p>
              <p className="text-amber-600 text-[12px] mt-0.5">
                Please check your phone and enter your PIN
              </p>
            </div>
            {isSocketConnected ? (
              <Wifi className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            )}
          </div>
          <div className="w-full mt-1">
            <div className="flex justify-between text-[10px] text-amber-600">
              <span>Processing...</span>
              <span>{Math.min(Math.round(pollingCount * 3 / 60), 2)}m {pollingCount * 3 % 60}s</span>
            </div>
            <div className="w-full h-1 bg-amber-200 rounded-full mt-1 overflow-hidden">
              <div 
                className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min((pollingCount / MAX_POLLING_ATTEMPTS) * 100, 95)}%` }}
              />
            </div>
          </div>
          {!isSocketConnected && (
            <p className="text-[10px] text-amber-500 mt-0.5">
              ⚡ Live updates unavailable - checking status automatically
            </p>
          )}
        </div>
      );
    }

    if (paymentStatus === 'error') {
      return (
        <div className="mt-4 flex flex-col gap-2.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-3">
          <div className="flex items-start gap-2.5">
            <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <div>
              <p className="font-medium text-[13px]">Payment Failed</p>
              <p className="text-red-600 text-[12px] mt-0.5">{errorMessage}</p>
            </div>
          </div>
          {showRetry && (
            <button
              onClick={retryPayment}
              className="mt-1 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors self-start"
            >
              Try Again
            </button>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      {/* Nav */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-12 sm:h-14 flex items-center">
          <span className="text-[18px] sm:text-[20px] font-bold tracking-tight">
            <span className="text-[#0a2540]">Xeco</span>
            <span className="text-[#10B981]">Flow</span>
          </span>
          <span className="hidden sm:inline text-gray-300 text-sm ml-2">·</span>
          <span className="hidden sm:inline text-[13px] text-gray-400 font-medium ml-2">
            Secure payment
          </span>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-5 sm:py-8 md:py-12 pb-10 md:pb-16">
        <div className="grid md:grid-cols-2 gap-5 md:gap-10 lg:gap-14 items-start">
          {/* ── LEFT ─────────────────────────────────────────────── */}
          <div className="space-y-4">
            <h1 className="text-xl sm:text-2xl md:text-[28px] font-semibold text-[#0a2540] tracking-tight leading-snug">
              {product.name}
            </h1>

            {/* Preview */}
            <div className="relative rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm h-[220px] sm:h-[260px] md:h-[300px]">
              {product.fileUrl ? (
                <>
                  <iframe
                    src={`https://docs.google.com/gview?url=${encodeURIComponent(product.fileUrl)}&embedded=true`}
                    className="md:hidden w-full h-full border-0"
                    title="Preview"
                  />
                  <iframe
                    src={`${product.fileUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                    className="hidden md:block w-full h-full border-0"
                    style={{ pointerEvents: 'none' }}
                    title="Preview"
                  />
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
                  <FileText className="w-12 h-12 text-gray-200" />
                  <p className="text-sm text-gray-400 mt-2">No preview available</p>
                </div>
              )}

              {!isPaid && (
                <>
                  <div className="absolute inset-0 top-[12%] bg-white/50 backdrop-blur-[5px]" />
                  <div className="absolute inset-x-0 bottom-0 h-[80%] bg-gradient-to-t from-white via-white/90 to-transparent flex items-end justify-center pb-6 sm:pb-8">
                    <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-medium text-gray-700 bg-white border border-gray-200 px-3.5 sm:px-4 py-2 rounded-full shadow-sm">
                      <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-500" />
                      Unlock after payment
                    </div>
                  </div>
                </>
              )}

              {isPaid && (
                <div className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  ✓ PAID
                </div>
              )}
            </div>

            {/* Merchant details */}
            <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
              <p className="text-[10px] sm:text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Merchant & item details
              </p>

              <dl className="space-y-2.5 text-[13px] sm:text-[14px]">
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-500 shrink-0">Merchant</dt>
                  <dd className="font-medium text-gray-900 text-right truncate">{merchantName}</dd>
                </div>

                {isVerified && (
                  <div className="flex justify-between gap-3 items-center">
                    <dt className="text-gray-500 shrink-0">Status</dt>
                    <dd>
                      <span className="inline-flex items-center gap-1 text-[11px] sm:text-[12px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                        <BadgeCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        Verified
                      </span>
                    </dd>
                  </div>
                )}

                <div className="flex justify-between gap-3">
                  <dt className="text-gray-500 shrink-0">File format</dt>
                  <dd className="text-gray-800 text-right text-[12px] sm:text-[14px]">
                    {fileMeta || 'PDF Document'}
                  </dd>
                </div>

                <div className="flex justify-between gap-3 items-center">
                  <dt className="text-gray-500 shrink-0">Fulfillment</dt>
                  <dd className="inline-flex items-center gap-1 text-gray-800 text-[12px] sm:text-[14px]">
                    <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500" />
                    Instant download
                  </dd>
                </div>
              </dl>

              <p className="text-[11px] sm:text-[12px] text-gray-400 mt-3 pt-3 border-t border-gray-100">
                Receipt and file link sent to your email after payment.
              </p>
            </div>
          </div>

          {/* ── RIGHT ────────────────────────────────────────────── */}
          <div>
            {isPaid ? (
              <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-500" />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Payment successful</h2>
                <p className="text-sm text-gray-500 mt-1.5">Your file is ready to download.</p>
                <button
                  onClick={triggerDownload}
                  disabled={isDownloading}
                  className="mt-5 w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                >
                  {isDownloading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
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
                    className="mt-3 text-sm text-gray-500 hover:text-gray-800"
                  >
                    ← Back to merchant
                  </button>
                )}
              </div>
            ) : isExpired ? (
              <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 text-center">
                <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <h2 className="text-lg font-semibold text-gray-900">Link expired</h2>
                <p className="text-sm text-gray-500 mt-1.5">This product is no longer available.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6 md:p-8">
                <div className="flex items-center justify-end gap-2 mb-3">
                  {isSocketConnected ? (
                    <span className="flex items-center gap-1.5 text-[10px] text-emerald-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[10px] text-amber-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Polling
                    </span>
                  )}
                </div>

                <div className="pb-4 sm:pb-6 border-b border-gray-100">
                  <p className="text-[10px] sm:text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Amount due
                  </p>
                  <p className="text-[28px] sm:text-[32px] font-semibold text-[#0a2540] mt-1 tracking-tight leading-none">
                    {formatPrice(product.price, product.currency)}
                  </p>
                </div>

                {/* ─── Payment Status ─────────────────────────────────── */}
                {renderPaymentStatus()}

                {/* ─── Payment Form ───────────────────────────────────── */}
                {(paymentStatus === 'idle' || paymentStatus === 'error') && (
                  <div className="mt-5 space-y-4">
                    <div>
                      <label className="block text-[12px] sm:text-[13px] font-medium text-gray-700 mb-1.5">
                        Name <span className="text-gray-400 font-normal">optional</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Your full name"
                          disabled={isProcessing}
                          className="w-full h-10 sm:h-11 pl-9 pr-3 rounded-xl border border-gray-200 bg-white text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#635bff]/25 focus:border-[#635bff] disabled:opacity-60"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[12px] sm:text-[13px] font-medium text-gray-700 mb-1.5">
                        Email <span className="text-gray-400 font-normal">for receipt</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          disabled={isProcessing}
                          className="w-full h-10 sm:h-11 pl-9 pr-3 rounded-xl border border-gray-200 bg-white text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#635bff]/25 focus:border-[#635bff] disabled:opacity-60"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[12px] sm:text-[13px] font-medium text-gray-700 mb-1.5">
                        M-PESA number
                      </label>
                      <div className="flex h-10 sm:h-11 rounded-xl border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-[#635bff]/25 focus-within:border-[#635bff]">
                        <span className="flex items-center gap-1 px-2.5 sm:px-3.5 bg-gray-50 border-r border-gray-200 text-[12px] sm:text-[13px] text-gray-500 shrink-0">
                          <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          +254
                        </span>
                        <input
                          type="tel"
                          inputMode="numeric"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="712071385"
                          disabled={isProcessing}
                          className="flex-1 min-w-0 px-2.5 sm:px-3.5 text-[14px] text-gray-900 outline-none placeholder:text-gray-400 disabled:opacity-60"
                        />
                      </div>
                      <p className="text-[11px] sm:text-[12px] text-gray-400 mt-1.5">
                        STK push will be sent to this number
                      </p>
                    </div>

                    <button
                      onClick={handlePay}
                      disabled={isProcessing}
                      className="w-full h-11 sm:h-12 bg-[#0a2540] hover:bg-[#152a45] active:scale-[0.99] text-white rounded-xl font-semibold text-sm sm:text-[15px] flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                          Processing…
                        </>
                      ) : (
                        <>Pay {formatPrice(product.price, product.currency)}</>
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
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <section className="bg-[#0a2540] text-white">
        <div className="max-w-5xl mx-auto px-4 py-6 sm:py-9 md:py-11 flex flex-col items-center text-center md:flex-row md:text-left md:justify-between gap-4 sm:gap-6">
          <div className="max-w-md">
            <p className="text-[13px] sm:text-[15px] font-semibold flex items-center justify-center md:justify-start gap-1.5">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
              Sell digital products with XecoFlow
            </p>
            <p className="text-[12px] sm:text-sm text-white/55 mt-1 leading-relaxed">
              Accept M-PESA and automate file delivery in minutes.
            </p>
          </div>
          <a
            href="https://xecoflow-pay.onrender.com/products/payment-links"
            className="inline-flex items-center justify-center w-full md:w-auto h-10 sm:h-11 px-5 rounded-full bg-white text-[#0a2540] text-[13px] sm:text-sm font-semibold hover:bg-gray-100 transition-colors shrink-0"
          >
            Start selling free →
          </a>
        </div>
      </section>

      <footer className="bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4 sm:py-5">
          <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[10px] sm:text-[11px] text-gray-400">
            <span>© 2026 XecoFlow</span>
            <span className="text-gray-200">·</span>
            <Link href="/terms" className="hover:text-gray-600">Terms</Link>
            <span className="text-gray-200">·</span>
            <Link href="/privacy" className="hover:text-gray-600">Privacy</Link>
            <span className="text-gray-200">·</span>
            <Link href="/help-centre" className="hover:text-gray-600">Report</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}