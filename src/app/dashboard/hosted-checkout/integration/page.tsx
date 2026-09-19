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
import { useSession } from '@/hooks/useSession';

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
  const { user, loading: sessionLoading } = useSession();

  const [merchantName, setMerchantName] = useState<string>('');
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

  // ── WebSocket Connection ─────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;
    let socketInstance: any = null;

    const initWebSocket = async () => {
      try {
        const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 
                       (typeof window !== 'undefined' && window.location.origin) ||
                       'https://xecoflow-2gen.onrender.com';

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
          if (isMounted) setIsSocketConnected(true);
        });

        socketInstance.on('disconnect', () => {
          if (isMounted) setIsSocketConnected(false);
        });

        socketInstance.on('connect_error', () => {
          if (isMounted) setIsSocketConnected(false);
        });

        socketInstance.on('payment:status', (data: any) => {
          if (isMounted) {
            if (data.status === 'COMPLETED' || data.status === 'SETTLED') {
              setPaymentStatus('success');
              if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            } else if (data.status === 'FAILED' || data.status === 'DECLINED') {
              setPaymentStatus('error');
              setErrorMessage(data.resultDesc || 'Payment failed. Please try again.');
              setShowRetry(true);
              if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            }
          }
        });

        socketRef.current = socketInstance;
      } catch {
        setIsWebSocketAvailable(false);
        setIsSocketConnected(false);
      }
    };

    const timeoutId = setTimeout(initWebSocket, 500);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if (socketInstance) socketInstance.disconnect();
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  // ── Register for Payment Updates ────────────────────────────────
  const registerForPaymentUpdates = (checkoutId: string, transactionId: string) => {
    try {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('register:payment', { checkoutId, transactionId });
        return true;
      }
    } catch {
      // Fallback to polling
    }
    return false;
  };

  // ─── Poll Payment Status (Fallback) ──────────────────────────────
  const pollPaymentStatus = (txId: string) => {
    setPollingCount(0);
    setShowRetry(false);
    
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

    pollingIntervalRef.current = setInterval(async () => {
      setPollingCount((prev) => {
        const newCount = prev + 1;
        
        if (newCount >= MAX_POLLING_ATTEMPTS) {
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          setPaymentStatus('error');
          setErrorMessage('Payment is taking longer than expected. Please check your M-PESA app.');
          setShowRetry(true);
          return newCount;
        }
        return newCount;
      });

      try {
        const res = await fetch(`/api/product-links/status/${txId}`, { credentials: 'include', cache: 'no-store' });
        const data = await res.json();

        if (data.success && data.data) {
          const status = data.data;
          
          if (status.status === 'SETTLED' || status.status === 'COMPLETED') {
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            setPaymentStatus('success');
          } else if (['FAILED', 'DECLINED', 'TERMINATED_BY_TIMEOUT'].includes(status.status)) {
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            setPaymentStatus('error');
            setErrorMessage(status.resultDesc || 'Payment failed. Please try again.');
            setShowRetry(true);
          }
        }
      } catch {
        // Silent fail — polling continues
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
    if (value === '' || /^\d*\.?\d*$/.test(value)) setUserAmount(value);
  };

  // ─── Load Merchant Data Securely ─────────────────────────────────
  useEffect(() => {
    if (!sessionLoading && user?.merchantId) {
      setMerchantName(user.businessName || 'Merchant');
      setIsReady(true);
      setLoading(false);
    } else if (!sessionLoading && !user) {
      // useSession already redirects, but guard against race conditions
      setError('Authentication required');
      setLoading(false);
    }
  }, [sessionLoading, user]);

  // ─── Cleanup polling on unmount ────────────────────────────────
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, []);

  const handleProceed = async () => {
    if (!user?.merchantId) {
      setErrorMessage('Authentication required. Please log in again.');
      return;
    }

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

    setIsProcessing(true);
    setPaymentStatus('processing');
    setErrorMessage('');
    setShowRetry(false);

    try {
      // ✅ Credentials are now handled server-side via HttpOnly cookies
      // The BFF validates the session and injects the API key/secret
      const body = {
        action: 'charge',
        method: 'mpesa',
        phone: phone,
        amount: finalAmount,
        shortcode: user.merchantId,
        idempotencyKey: 'key-' + globalThis.crypto.randomUUID().slice(0, 16),
      };

      const sorted: Record<string, any> = {};
      Object.keys(body).sort().forEach((k) => { sorted[k] = body[k as keyof typeof body]; });
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

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-timestamp': String(timestamp),
          'x-nonce': nonce,
          'x-signature': signature,
        },
        credentials: 'include',
        body: bodyString,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const txId = data.data?.transactionId;
        const ckId = data.data?.checkoutRequestId;
        
        if (txId) {
          setTransactionId(txId);
          setCheckoutId(ckId || null);
          setPaymentStatus('pending');
          setPaymentResponse(data);
          
          if (ckId && isWebSocketAvailable) {
            try { registerForPaymentUpdates(ckId, txId); } catch {}
          }
          
          pollPaymentStatus(txId);
          
          setTimeout(() => {
            if (paymentStatus === 'success' && returnUrl) router.push(returnUrl);
          }, 3000);
        } else {
          setPaymentStatus('error');
          setErrorMessage('No transaction ID received. Please try again.');
        }
      } else {
        setPaymentStatus('error');
        setErrorMessage(data.error || data.message || 'Payment failed');
        setPaymentResponse(data);
        setShowRetry(true);
      }
    } catch (err: any) {
      setPaymentStatus('error');
      setErrorMessage(err.message || 'An error occurred');
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
        <div className="border border-[#D8D4C9] bg-white px-5 py-4 mb-6">
          <div className="flex items-center gap-4">
            <Loader2 className="w-5 h-5 animate-spin text-[#0B1526] shrink-0" />
            <div>
              <p className="text-sm font-medium text-[#0B1526]">Submitting your payment instruction</p>
              <p className="text-xs text-[#5B6B82] mt-0.5">This will only take a moment.</p>
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
        <div className="border border-[#D8D4C9] bg-white mb-6">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#EDEAE2]">
            <div className="flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-[#8A6A2A]" />
              <span className="text-sm font-medium text-[#0B1526]">Awaiting confirmation on your device</span>
            </div>
            {isSocketConnected ? (
              <Wifi className="w-4 h-4 text-[#1F6F4E]" aria-label="Live connection active" />
            ) : (
              <WifiOff className="w-4 h-4 text-[#8A6A2A]" aria-label="Checking status periodically" />
            )}
          </div>
          <div className="px-5 py-4">
            <p className="text-sm text-[#5B6B82] mb-3">Check your phone and enter your PIN to authorize the transaction.</p>
            <div className="flex justify-between text-xs text-[#5B6B82] tabular-nums mb-1.5">
              <span>Elapsed</span><span>{elapsedMin}m {elapsedSec}s</span>
            </div>
            <div className="w-full h-1 bg-[#EDEAE2]">
              <div className="h-full bg-[#8A6A2A] transition-all duration-1000" style={{ width: `${progressPct}%` }} />
            </div>
            {!isSocketConnected && (
              <p className="text-xs text-[#8A6A2A] mt-2.5">Live updates unavailable — status is being checked automatically.</p>
            )}
          </div>
        </div>
      );
    }

    if (paymentStatus === 'success') {
      return (
        <div className="border border-[#1F6F4E]/30 bg-[#F3F8F5] px-5 py-4 mb-6">
          <div className="flex items-start gap-4">
            <CheckCircle className="w-5 h-5 text-[#1F6F4E] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[#123C2D]">Payment instruction confirmed</p>
              <p className="text-xs text-[#5B6B82] mt-1 tabular-nums">Checkout reference: {paymentResponse?.data?.checkoutRequestId || 'N/A'}</p>
            </div>
          </div>
        </div>
      );
    }

    if (paymentStatus === 'error') {
      return (
        <div className="border border-[#9B3232]/30 bg-[#FBF3F3] px-5 py-4 mb-6">
          <div className="flex items-start gap-4">
            <XCircle className="w-5 h-5 text-[#9B3232] shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-[#6E2323]">Payment not completed</p>
              <p className="text-sm text-[#5B6B82] mt-1">{errorMessage}</p>
              {showRetry && (
                <button onClick={retryPayment} className="mt-3 text-xs font-medium text-[#9B3232] border border-[#9B3232]/40 px-3.5 py-1.5 hover:bg-[#9B3232] hover:text-white transition-colors">Try again</button>
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
      <div className="min-h-screen flex items-center justify-center bg-[#F7F6F0]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0B1526] mx-auto" />
          <p className="mt-4 text-sm text-[#5B6B82]">Preparing your secure checkout…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F6F0] px-6">
        <div className="max-w-sm w-full bg-white border border-[#D8D4C9] p-8 text-center">
          <AlertCircle className="w-10 h-10 text-[#9B3232] mx-auto mb-4" />
          <h2 className="text-lg font-serif text-[#0B1526] mb-2">We couldn't load this checkout</h2>
          <p className="text-sm text-[#5B6B82] mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-[#0B1526] hover:bg-[#16233B] text-white text-sm font-medium px-6 py-2.5 transition-colors">Try again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F6F0]">
      {/* Header */}
      <header className="bg-[#0B1526]">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-[#3A4A63] flex items-center justify-center text-[#D9C48A] font-serif text-sm">X</div>
            <div>
              <p className="font-serif text-lg text-white leading-none">Xecoflow</p>
              <p className="text-[11px] text-[#8FA0B8] mt-1">Secure payment terminal</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#8FA0B8]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D9C48A]" />
            256-bit encrypted
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Checkout document */}
        <div className="border border-[#D8D4C9] bg-white">
          <div className="grid lg:grid-cols-5">
            {/* Ledger stub */}
            <div className="lg:col-span-2 px-6 md:px-8 py-8 border-b lg:border-b-0 lg:border-r border-dashed border-[#D8D4C9]">
              <p className="text-xs uppercase tracking-wide text-[#9AA5B4] mb-1">Transaction record</p>
              <p className="text-xs text-[#5B6B82] mb-6 tabular-nums">Ref. {customerRef || '—'}</p>

              <label htmlFor="checkout-amount" className="block text-xs text-[#5B6B82] mb-1.5">Amount to pay ({currency})</label>
              <div className="flex items-baseline border-b border-[#0B1526] pb-2 mb-1">
                <span className="text-sm text-[#5B6B82] mr-2">{currency}</span>
                <input
                  id="checkout-amount"
                  type="text"
                  inputMode="decimal"
                  value={userAmount}
                  onChange={handleAmountChange}
                  placeholder={amount.toFixed(2)}
                  disabled={isProcessing || paymentStatus === 'success'}
                  className="w-full bg-transparent text-2xl font-serif text-[#0B1526] tabular-nums outline-none disabled:opacity-60"
                />
              </div>
              <p className="text-xs text-[#9AA5B4] mb-6">Leave blank to use the requested amount.</p>

              <div className="flex justify-between text-sm text-[#0B1526] py-2 border-t border-[#EDEAE2] tabular-nums">
                <span className="text-[#5B6B82]">Total due</span>
                <span className="font-medium">{currency} {amount.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment action panel */}
            <div className="lg:col-span-3 px-6 md:px-8 py-8">
              {renderPaymentStatus()}

              {paymentStatus !== 'success' && paymentStatus !== 'pending' && (
                <>
                  <p className="text-xs uppercase tracking-wide text-[#9AA5B4] mb-3">Payment method</p>
                  <div className="border border-[#D8D4C9] mb-6">
                    {PAYMENT_METHODS.map((m, idx) => {
                      const Icon = m.icon;
                      const selected = method === m.id;
                      return (
                        <label key={m.id} className={`flex items-center gap-3 px-4 py-3 cursor-pointer text-sm ${idx !== 0 ? 'border-t border-[#EDEAE2]' : ''} ${selected ? 'bg-[#F7F6F0]' : 'bg-white'}`}>
                          <input type="radio" checked={selected} onChange={() => setMethod(m.id)} className="accent-[#0B1526]" />
                          <Icon size={15} className="text-[#5B6B82]" />
                          <span className={selected ? 'text-[#0B1526] font-medium' : 'text-[#0B1526]'}>{m.label}</span>
                        </label>
                      );
                    })}
                  </div>

                  <p className="text-sm text-[#0B1526] mb-5">
                    You're paying <span className="font-medium">{businessName}</span>{' '}
                    <span className="font-medium tabular-nums">{currency} {amount.toFixed(2)}</span>
                  </p>

                  {(method === 'mpesa' || method === 'airtel') && (
                    <>
                      <ol className="text-sm text-[#5B6B82] space-y-1 mb-5 list-decimal pl-5">
                        <li>Confirm your {method === 'mpesa' ? 'M-PESA' : 'Airtel Money'} mobile number below</li>
                        <li>Select "Send payment request" to trigger a prompt on your phone</li>
                        <li>Enter your PIN on your device to authorize the payment</li>
                      </ol>

                      <label className="block text-xs text-[#5B6B82] mb-1.5">Mobile number</label>
                      <div className="flex border border-[#D8D4C9] mb-6">
                        <span className="flex items-center gap-1.5 px-3.5 border-r border-[#D8D4C9] text-sm text-[#5B6B82] bg-[#F7F6F0]">
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
                    className={`w-full sm:w-auto bg-[#0B1526] hover:bg-[#16233B] text-white text-sm font-medium px-8 py-3 transition-colors ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isProcessing ? 'Sending request…' : 'Send payment request'}
                  </button>

                  {errorMessage && paymentStatus === 'error' && (
                    <div className="mt-4 flex items-start gap-2 text-sm text-[#9B3232]">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p>{errorMessage}</p>
                    </div>
                  )}
                </>
              )}

              {paymentStatus === 'success' && (
                <Link href={returnUrl} className="inline-flex items-center gap-2 bg-[#1F6F4E] hover:bg-[#185C40] text-white text-sm font-medium px-6 py-2.5 transition-colors">
                  <CheckCircle className="w-4 h-4" /> View transaction
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-[#9AA5B4] mt-6">
          <Globe className="w-3.5 h-3.5" /> Powered by Xecoflow · Secure and PCI-DSS compliant
        </div>
      </main>
    </div>
  );
}