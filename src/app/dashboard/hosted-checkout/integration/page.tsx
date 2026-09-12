'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import {
  Lock,
  Smartphone,
  CreditCard,
  ShieldCheck,
  Building2,
  ArrowRight,
  Globe,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { getStoredMerchant } from '@/lib/auth';
import { getMerchantProfile } from '@/lib/auth-api';

const PAYMENT_METHODS = [
  { id: 'mpesa', label: 'M-PESA', icon: Smartphone, available: true },
  { id: 'airtel', label: 'Airtel Money', icon: Smartphone, available: true },
  { id: 'cards', label: 'VISA / Mastercard / AMEX', icon: CreditCard, available: true },
  { id: 'visa-ewallet', label: 'Visa via Pesapal', icon: Building2, available: true },
];

interface PaymentResponse {
  success: boolean;
  data?: { transactionId: string; checkoutRequestId: string };
  error?: string;
  correlationId?: string;
}

export default function HostedCheckoutIntegration() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [merchantId, setMerchantId] = useState<string>('');
  const [merchantName, setMerchantName] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [apiSecret, setApiSecret] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState('mpesa');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error' | 'pending'>('idle');
  const [paymentResponse, setPaymentResponse] = useState<PaymentResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [userAmount, setUserAmount] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [pollingCount, setPollingCount] = useState(0);
  const [showRetry, setShowRetry] = useState(false);

  // ─── WebSocket State ──────────────────────────────────────────────
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isWebSocketAvailable, setIsWebSocketAvailable] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const MAX_POLLING_ATTEMPTS = 30;
  const POLLING_INTERVAL = 3000;

  const amount = Number(searchParams.get('amount')) || Number(userAmount) || 10;
  const currency = searchParams.get('currency') || 'KES';
  const businessName = searchParams.get('merchant') || merchantName || 'XecoFlow Merchant';
  const customerName = searchParams.get('customer') || 'Customer';
  const customerEmail = searchParams.get('email') || 'customer@example.com';
  const customerPhone = searchParams.get('phone') || '254708050827';
  const customerRef = searchParams.get('reference') || ('REF-' + Date.now());
  const returnUrl = searchParams.get('return_url') || '/dashboard/transactions';

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
        const res = await fetch(`/api/product-links/status/${txId}`, {
          credentials: 'include',
        });
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

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.length <= 12 ? cleaned : cleaned.slice(0, 12);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(formatPhoneNumber(e.target.value));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setUserAmount(value);
    }
  };

  // ─── Fetch Credentials from Database ──────────────────────────────
  const fetchCredentials = async (merchantId: string) => {
    try {
      console.log('🔍 Fetching credentials for merchant:', merchantId);
      
      const response = await fetch(`/api/auth/credentials?merchantId=${merchantId}`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Credentials fetched successfully');
        setApiKey(data.data.apiKey || data.data.api_key || '');
        setApiSecret(data.data.apiSecret || data.data.api_secret || '');
        setMerchantId(String(data.data.merchantId || data.data.merchant_id || merchantId));
        setIsReady(true);
        setLoading(false);
        setError(null);
        return true;
      } else {
        console.error('❌ Failed to fetch credentials:', data.error);
        setError(data.error || 'Credentials not found');
        setLoading(false);
        return false;
      }
    } catch (error) {
      console.error('❌ Error fetching credentials:', error);
      setError('Failed to connect to server');
      setLoading(false);
      return false;
    }
  };

  // ─── Load Merchant Data ──────────────────────────────────────────
  useEffect(() => {
    // ✅ Read merchant data from localStorage
    let merchant = null;
    let id = '';
    
    try {
      const stored = localStorage.getItem('merchant');
      if (stored) {
        merchant = JSON.parse(stored);
        id = String(merchant.merchant_id || merchant.merchantId || '');
      }
    } catch (e) {
      console.error('Failed to parse merchant data', e);
    }

    // ❌ If no merchant data, redirect to login
    if (!merchant || !id) {
      console.warn('⚠️ No merchant found in localStorage, redirecting to login');
      router.push('/login?session=expired');
      return;
    }

    // ✅ Merchant data found
    console.log('✅ Merchant data loaded:', merchant);
    setMerchantId(id);
    setMerchantName(merchant.business_name || merchant.businessName || 'Merchant');

    // ─── Fetch credentials ──────────────────────────────────────
    fetchCredentials(id);

  }, [router]);

  // ─── Cleanup polling on unmount ─────────────────────────────────
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const handleProceed = async () => {
    console.log('🔄 Proceed clicked!');

    const finalAmount = Number(userAmount) || Number(amount);
    if (finalAmount <= 0) {
      setErrorMessage('Please enter a valid amount greater than 0');
      return;
    }

    let phone = phoneNumber || customerPhone;
    phone = phone.replace(/\D/g, '');
    
    if (phone.startsWith('0')) phone = '254' + phone.slice(1);
    if (!phone.startsWith('254') && phone.length === 10) phone = '254' + phone;
    if (!phone.startsWith('254') && phone.length === 9) phone = '254' + phone;

    if (!phone || phone.length < 10) {
      setErrorMessage('Please enter a valid phone number');
      return;
    }

    if (!apiKey || !apiSecret) {
      setErrorMessage('API credentials not found. Please contact support.');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');
    setErrorMessage('');
    setShowRetry(false);

    try {
      const body = {
        action: 'charge',
        method: 'mpesa',
        phone: phone,
        amount: finalAmount,
        shortcode: merchantId,
        idempotencyKey: 'key-' + globalThis.crypto.randomUUID().slice(0, 16),
      };

      const sorted: Record<string, any> = {};
      Object.keys(body).sort().forEach((k) => {
        sorted[k] = body[k as keyof typeof body];
      });
      const bodyString = JSON.stringify(sorted);

      const timestamp = Math.floor(Date.now() / 1000);
      const nonce = globalThis.crypto.randomUUID().replace(/-/g, '');

      const canonicalString = `${timestamp}.${nonce}.POST./.${bodyString}`;

      const signature = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(canonicalString)
      ).then(buffer => {
        const hashArray = Array.from(new Uint8Array(buffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      });

      console.log('🔑 Request details:');
      console.log('  API Key:', apiKey);
      console.log('  Signature:', signature);

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'x-signature': signature,
          'x-timestamp': String(timestamp),
          'x-nonce': nonce,
        },
        credentials: 'include',
        body: bodyString,
      });

      const data = await response.json();

      console.log('📡 Response:', data);

      if (response.ok && data.success) {
        const txId = data.data?.transactionId;
        const ckId = data.data?.checkoutRequestId;
        
        if (txId) {
          setTransactionId(txId);
          setCheckoutId(ckId || null);
          setPaymentStatus('pending');
          setPaymentResponse(data);
          
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
          
          // Auto redirect after 3 seconds if successful
          setTimeout(() => {
            if (paymentStatus === 'success' && returnUrl) {
              router.push(returnUrl);
            }
          }, 3000);
        } else {
          setPaymentStatus('error');
          setErrorMessage('No transaction ID received. Please try again.');
        }
      } else {
        setPaymentStatus('error');
        const errorMsg = data.error || data.message || 'Payment failed';
        setErrorMessage(errorMsg);
        setPaymentResponse(data);
        setShowRetry(true);
      }
    } catch (error: any) {
      console.error('❌ Payment error:', error);
      setPaymentStatus('error');
      setErrorMessage(error.message || 'An error occurred');
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

  // ─────────────────────────────────────────────────────────────────
  // UI ONLY — presentation layer restructured below. No state, effects,
  // or handlers above this line were changed.
  // ─────────────────────────────────────────────────────────────────

  const renderPaymentStatus = () => {
    if (paymentStatus === 'idle') return null;

    if (paymentStatus === 'processing') {
      return (
        <div className="rounded-xl border border-[#E5E7EB] bg-white px-5 py-4 mb-6">
          <div className="flex items-center gap-4">
            <Loader2 className="w-5 h-5 animate-spin text-[#111827] shrink-0" />
            <div>
              <p className="text-sm font-medium text-[#111827]">Submitting your payment instruction</p>
              <p className="text-xs text-[#6B7280] mt-0.5">This will only take a moment.</p>
            </div>
          </div>
        </div>
      );
    }

    if (paymentStatus === 'pending') {
      const elapsedMin = Math.floor(pollingCount * 3 / 60);
      const elapsedSec = (pollingCount * 3) % 60;
      const progressPct = Math.min((pollingCount / MAX_POLLING_ATTEMPTS) * 100, 95);

      return (
        <div className="rounded-xl border border-[#E5E7EB] bg-white mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#F3F4F6]">
            <div className="flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-[#F59E0B]" />
              <span className="text-sm font-medium text-[#111827]">Awaiting confirmation on your device</span>
            </div>
            {isSocketConnected ? (
              <Wifi className="w-4 h-4 text-[#10B981]" aria-label="Live connection active" />
            ) : (
              <WifiOff className="w-4 h-4 text-[#F59E0B]" aria-label="Checking status periodically" />
            )}
          </div>
          <div className="px-5 py-4">
            <p className="text-sm text-[#6B7280] mb-3">
              Check your phone and enter your PIN to authorize the transaction.
            </p>
            <div className="flex justify-between text-xs text-[#6B7280] tabular-nums mb-1.5">
              <span>Elapsed</span>
              <span>{elapsedMin}m {elapsedSec}s</span>
            </div>
            <div className="w-full h-1 bg-[#F3F4F6]">
              <div
                className="h-full bg-[#F59E0B] transition-all duration-1000"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            {!isSocketConnected && (
              <p className="text-xs text-[#F59E0B] mt-2.5">
                Live updates unavailable — status is being checked automatically.
              </p>
            )}
          </div>
        </div>
      );
    }

    if (paymentStatus === 'success') {
      return (
        <div className="rounded-xl border border-[#10B981]/30 bg-[#ECFDF5] px-5 py-4 mb-6">
          <div className="flex items-start gap-4">
            <CheckCircle className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[#065F46]">Payment instruction confirmed</p>
              <p className="text-xs text-[#6B7280] mt-1 tabular-nums">
                Checkout reference: {paymentResponse?.data?.checkoutRequestId || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (paymentStatus === 'error') {
      return (
        <div className="rounded-xl border border-[#EF4444]/30 bg-[#FEF2F2] px-5 py-4 mb-6">
          <div className="flex items-start gap-4">
            <XCircle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-[#B91C1C]">Payment not completed</p>
              <p className="text-sm text-[#6B7280] mt-1">{errorMessage}</p>
              {showRetry && (
                <button
                  onClick={retryPayment}
                  className="mt-3 text-xs font-medium text-[#EF4444] rounded-lg border border-[#EF4444]/40 px-3.5 py-1.5 hover:bg-[#EF4444] hover:text-white transition-colors"
                >
                  Try again
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F6F8]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#10B981] mx-auto" />
          <p className="mt-4 text-sm text-[#6B7280]">Preparing your secure checkout…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F6F8] px-6">
        <div className="max-w-sm w-full bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 text-center">
          <AlertCircle className="w-10 h-10 text-[#EF4444] mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-[#111827] mb-2">We couldn't load this checkout</h2>
          <p className="text-sm text-[#6B7280] mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-sm font-medium px-6 py-2.5 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#ECFDF5] flex items-center justify-center text-[#10B981] font-semibold text-sm">X</div>
            <div>
              <p className="text-base font-semibold text-[#111827] leading-none">Xecoflow</p>
              <p className="text-[11px] text-[#9CA3AF] mt-1">Secure payment checkout</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#6B7280]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
            256-bit encrypted
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Checkout card */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
          <div className="grid lg:grid-cols-5">
            {/* Summary panel */}
            <div className="lg:col-span-2 px-6 md:px-8 py-8 border-b lg:border-b-0 lg:border-r border-[#F3F4F6] bg-[#FAFBFC]">
              <p className="text-xs uppercase tracking-wide text-[#9CA3AF] mb-1">Transaction record</p>
              <p className="text-xs text-[#6B7280] mb-6 tabular-nums">Ref. {customerRef || '—'}</p>

              <label htmlFor="checkout-amount" className="block text-xs text-[#6B7280] mb-1.5">
                Amount to pay ({currency})
              </label>
              <div className="flex items-baseline border-b-2 border-[#10B981] pb-2 mb-1">
                <span className="text-sm text-[#6B7280] mr-2">{currency}</span>
                <input
                  id="checkout-amount"
                  type="text"
                  inputMode="decimal"
                  value={userAmount}
                  onChange={handleAmountChange}
                  placeholder={amount.toFixed(2)}
                  disabled={isProcessing || paymentStatus === 'success'}
                  className="w-full bg-transparent text-2xl font-semibold text-[#111827] tabular-nums outline-none disabled:opacity-60"
                />
              </div>
              <p className="text-xs text-[#9CA3AF] mb-6">Leave blank to use the requested amount.</p>

              <div className="flex justify-between text-sm text-[#111827] py-2 border-t border-[#F3F4F6] tabular-nums">
                <span className="text-[#6B7280]">Total due</span>
                <span className="font-medium">{currency} {amount.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment action panel */}
            <div className="lg:col-span-3 px-6 md:px-8 py-8">
              {renderPaymentStatus()}

              {paymentStatus !== 'success' && paymentStatus !== 'pending' && (
                <>
                  <p className="text-xs uppercase tracking-wide text-[#9CA3AF] mb-3">Payment method</p>
                  <div className="rounded-xl border border-[#E5E7EB] mb-6 overflow-hidden">
                    {PAYMENT_METHODS.map((m, idx) => {
                      const Icon = m.icon;
                      const selected = method === m.id;
                      return (
                        <label
                          key={m.id}
                          className={`flex items-center gap-3 px-4 py-3 cursor-pointer text-sm ${idx !== 0 ? 'border-t border-[#F3F4F6]' : ''} ${selected ? 'bg-[#ECFDF5]' : 'bg-white'}`}
                        >
                          <input
                            type="radio"
                            checked={selected}
                            onChange={() => setMethod(m.id)}
                            className="accent-[#10B981]"
                          />
                          <Icon size={15} className={selected ? 'text-[#10B981]' : 'text-[#6B7280]'} />
                          <span className={selected ? 'text-[#111827] font-medium' : 'text-[#111827]'}>{m.label}</span>
                        </label>
                      );
                    })}
                  </div>

                  <p className="text-sm text-[#111827] mb-5">
                    You're paying <span className="font-medium">{businessName}</span>{' '}
                    <span className="font-medium tabular-nums">{currency} {amount.toFixed(2)}</span>
                  </p>

                  {(method === 'mpesa' || method === 'airtel') && (
                    <>
                      <ol className="text-sm text-[#6B7280] space-y-1 mb-5 list-decimal pl-5">
                        <li>Confirm your {method === 'mpesa' ? 'M-PESA' : 'Airtel Money'} mobile number below</li>
                        <li>Select "Send payment request" to trigger a prompt on your phone</li>
                        <li>Enter your PIN on your device to authorize the payment</li>
                      </ol>

                      <label className="block text-xs text-[#6B7280] mb-1.5">Mobile number</label>
                      <div className="flex rounded-xl border border-[#E5E7EB] mb-6 overflow-hidden focus-within:border-[#10B981]">
                        <span className="flex items-center gap-1.5 px-3.5 border-r border-[#E5E7EB] text-sm text-[#6B7280] bg-[#F5F6F8]">
                          <Smartphone size={13} /> +254
                        </span>
                        <input
                          type="tel"
                          value={phoneNumber || customerPhone}
                          onChange={handlePhoneChange}
                          className="flex-1 px-4 py-2.5 text-sm outline-none tabular-nums"
                          placeholder="708050827"
                          disabled={isProcessing}
                        />
                      </div>
                    </>
                  )}

                  <button
                    onClick={handleProceed}
                    disabled={isProcessing}
                    className={`w-full sm:w-auto rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-sm font-medium px-8 py-3 transition-colors ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isProcessing ? 'Sending request…' : 'Send payment request'}
                  </button>

                  {errorMessage && paymentStatus === 'error' && (
                    <div className="mt-4 flex items-start gap-2 text-sm text-[#EF4444]">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p>{errorMessage}</p>
                    </div>
                  )}
                </>
              )}

              {paymentStatus === 'success' && (
                <Link
                  href={returnUrl}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-sm font-medium px-6 py-2.5 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" /> View transaction
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-[#9CA3AF] mt-6">
          <Globe className="w-3.5 h-3.5" /> Powered by Xecoflow · Secure and PCI-DSS compliant
        </div>
      </main>
    </div>
  );
}