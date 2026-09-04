'use client';

import { useState, useEffect, useRef } from 'react';
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
  XCircle,
  Wifi,
  WifiOff,
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
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error' | 'pending'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [brokenLogos, setBrokenLogos] = useState<Record<string, boolean>>({});
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [pollingCount, setPollingCount] = useState(0);
  const [showRetry, setShowRetry] = useState(false);

  // ─── WebSocket State ──────────────────────────────────────────────
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isWebSocketAvailable, setIsWebSocketAvailable] = useState(true);
  const socketRef = useRef<any>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const MAX_POLLING_ATTEMPTS = 30;
  const POLLING_INTERVAL = 3000;
  const isConnectingRef = useRef(false);

  // ─── 1. FETCH PAYMENT LINK DATA ──────────────────────────────────
  useEffect(() => {
    if (!slug) return;

    let isMounted = true;

    const fetchPaymentLink = async () => {
      try {
        setLoading(true);
        console.log('🔍 Fetching payment link for slug:', slug);

        const res = await fetch(`/v1/payment-links/${slug}`);
        console.log('📡 Response status:', res.status);

        const data = await res.json();
        console.log('📦 Response data:', data);

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Payment link not found');
        }

        if (isMounted) {
          setPaymentLink(data.data);
          if (data.data.price > 0) {
            setAmount(data.data.price.toString());
          }
          setLoading(false);
        }
      } catch (err: any) {
        console.error('❌ Error loading payment link:', err.message);
        if (isMounted) {
          setError(err.message || 'Failed to load payment link');
          setLoading(false);
        }
      }
    };

    fetchPaymentLink();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // ─── 2. WEBSOCKET CONNECTION ─────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;
    let socketInstance: any = null;

    const initWebSocket = async () => {
      // Prevent multiple connection attempts
      if (isConnectingRef.current) {
        console.log('⏳ WebSocket connection already in progress');
        return;
      }

      isConnectingRef.current = true;

      try {
        // Use the same origin for WebSocket connection
        const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 
                       (typeof window !== 'undefined' && window.location.origin) ||
                       'wss://xecoflow-2gen.onrender.com';

        console.log('🔌 [WS] Connecting to:', WS_URL);

        const { io } = await import('socket.io-client');

        socketInstance = io(WS_URL, {
          transports: ['websocket', 'polling'],
          withCredentials: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 10000,
          autoConnect: true
        });

        // ─── Connection Events ──────────────────────────────────────
        socketInstance.on('connect', () => {
          if (isMounted) {
            console.log('✅ [WS] Connected:', socketInstance.id);
            setIsSocketConnected(true);
            setIsWebSocketAvailable(true);
            isConnectingRef.current = false;
          }
        });

        socketInstance.on('disconnect', (reason: string) => {
          if (isMounted) {
            console.log('❌ [WS] Disconnected:', reason);
            setIsSocketConnected(false);
          }
        });

        socketInstance.on('connect_error', (error: any) => {
          console.warn('⚠️ [WS] Connection error:', error?.message);
          if (isMounted) {
            setIsSocketConnected(false);
            // Don't mark as unavailable on first error, let it retry
          }
        });

        socketInstance.on('connect_timeout', () => {
          console.warn('⏰ [WS] Connection timeout');
          if (isMounted) {
            setIsSocketConnected(false);
          }
        });

        // ─── Payment Status Events ──────────────────────────────────
        socketInstance.on('payment:status', (data: any) => {
          console.log('📡 [WS] Payment status update:', data);
          
          if (isMounted) {
            if (data.status === 'COMPLETED' || data.status === 'SETTLED') {
              setPaymentStatus('success');
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

        // ─── Error Events ────────────────────────────────────────────
        socketInstance.on('error', (error: any) => {
          console.error('❌ [WS] Socket error:', error);
        });

        socketRef.current = socketInstance;

      } catch (error) {
        console.warn('⚠️ [WS] WebSocket not available, using polling fallback only');
        if (isMounted) {
          setIsWebSocketAvailable(false);
          setIsSocketConnected(false);
          isConnectingRef.current = false;
        }
      }
    };

    // Delay connection to allow page to load
    const timeoutId = setTimeout(() => {
      initWebSocket();
    }, 1000);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      isConnectingRef.current = false;
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
      // Check if socket exists and is connected
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('register:payment', {
          checkoutId: checkoutId,
          transactionId: transactionId,
        });
        console.log(`📡 [WS] Registered for checkout: ${checkoutId}, transaction: ${transactionId}`);
        return true;
      } else {
        console.warn('⚠️ [WS] Socket not connected, state:', {
          hasSocket: !!socketRef.current,
          connected: socketRef.current?.connected || false
        });
      }
    } catch (error) {
      console.warn('⚠️ [WS] Registration failed (non-blocking):', error);
    }
    console.warn('⚠️ [WS] Using polling fallback');
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

  const formatPrice = (value: number, currency: string) =>
    `${currency} ${Number(value).toLocaleString('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // ─── Handle Payment ───────────────────────────────────────────────
  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();

    let phone = phoneNumber.replace(/\D/g, '');
    
    if (phone.startsWith('0')) {
      phone = '254' + phone.slice(1);
    } else if (phone.startsWith('254')) {
      phone = phone;
    } else if (phone.length === 9 || phone.length === 10) {
      if (phone.length === 9) {
        phone = '254' + phone;
      } else {
        phone = '254' + phone.slice(-9);
      }
    } else {
      phone = '254' + phone;
    }
    
    phone = phone.replace(/\D/g, '');
    
    if (!phone || phone.length < 12) {
      setErrorMessage('Enter a valid 9-digit phone number (e.g., 712345678)');
      setPaymentStatus('error');
      return;
    }

    const amountToPay = Number(amount);
    if (!amountToPay || amountToPay <= 0) {
      setErrorMessage('Please enter a valid amount');
      setPaymentStatus('error');
      return;
    }

    if (paymentLink?.price && paymentLink.price > 0 && amountToPay !== paymentLink.price) {
      setErrorMessage(`Amount must be exactly ${formatPrice(paymentLink.price, paymentLink.currency)}`);
      setPaymentStatus('error');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');
    setErrorMessage('');
    setShowRetry(false);

    try {
      const res = await fetch('/v1/product-links/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: paymentLink?.billId,
          phone: phone,
          email: email || undefined,
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
          
          // ─── 🔥 TRY WEBSOCKET (non-blocking) ─────────────────────
          let wsRegistered = false;
          if (ckId && isWebSocketAvailable) {
            try {
              wsRegistered = registerForPaymentUpdates(ckId, txId);
            } catch (wsError) {
              console.warn('WebSocket registration failed, using polling');
            }
          }
          
          // ─── START POLLING (always) ─────────────────────────────
          pollPaymentStatus(txId);
          
          console.log(`📡 Payment initiated. WebSocket: ${wsRegistered ? '✅' : '❌'}, Polling: ✅`);
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

  const retryPayment = () => {
    setPaymentStatus('idle');
    setErrorMessage('');
    setShowRetry(false);
    setTransactionId(null);
    setCheckoutId(null);
    setPollingCount(0);
  };

  // ─── Cleanup on unmount ───────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  // ─── Payment Status Rendering ────────────────────────────────────
  const renderPaymentStatus = () => {
    if (paymentStatus === 'processing') {
      return (
        <div className="flex items-start gap-3 text-sm text-blue-800 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
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
        <div className="flex flex-col items-start gap-2.5 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-3">
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
        <div className="flex flex-col gap-2.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-3">
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

    if (paymentStatus === 'success') {
      return (
        <div className="flex items-start gap-3 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
          <div>
            <p className="font-medium text-[13px]">Payment Successful!</p>
            <p className="text-emerald-600 text-[12px] mt-0.5">
              {formatPrice(Number(amount || paymentLink?.price || 0), paymentLink?.currency || 'KES')} paid successfully
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  // ─── Loading State ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
      </div>
    );
  }

  // ─── Error State ──────────────────────────────────────────────────
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

          <div className="mt-10 hidden lg:block">{poweredBy}</div>
        </div>

        {/* ── RIGHT: Pay form ── */}
        <div className="px-6 py-8 sm:px-10 lg:px-16 lg:py-12 flex flex-col justify-center">
          <div className="w-full max-w-[420px] mx-auto">
            {/* WebSocket Connection Status */}
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

                {renderPaymentStatus()}

                {(paymentStatus === 'idle' || paymentStatus === 'error') && (
                  <>
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
                        You'll be redirected to PayPal to complete payment securely.
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
                  </>
                )}
              </form>
            )}
          </div>
        </div>
      </div>

      <footer className="lg:hidden border-t border-gray-100 px-6 py-5">
        {poweredBy}
      </footer>
    </div>
  );
}