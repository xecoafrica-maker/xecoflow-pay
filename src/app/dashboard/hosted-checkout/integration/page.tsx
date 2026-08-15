'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import crypto from 'crypto';
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
} from 'lucide-react';
import { getToken, getStoredMerchant } from '@/lib/auth';
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
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [paymentResponse, setPaymentResponse] = useState<PaymentResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [userAmount, setUserAmount] = useState<string>('');

  const amount = Number(searchParams.get('amount')) || Number(userAmount) || 10;
  const currency = searchParams.get('currency') || 'KES';
  const businessName = searchParams.get('merchant') || merchantName || 'XecoFlow Merchant';
  const customerName = searchParams.get('customer') || 'Customer';
  const customerEmail = searchParams.get('email') || 'customer@example.com';
  const customerPhone = searchParams.get('phone') || '254708050827';
  const customerRef = searchParams.get('reference') || ('REF-' + Date.now());
  const returnUrl = searchParams.get('return_url') || '/dashboard/transactions';

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.length <= 12 ? cleaned : cleaned.slice(0, 12);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(formatPhoneNumber(e.target.value));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    // Allow only valid number format
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setUserAmount(value);
    }
  };

  // ─── Fetch Credentials from Database ──────────────────────────────
  const fetchCredentials = async (token: string, merchantId: string) => {
    try {
      console.log('🔍 Fetching credentials for merchant:', merchantId);
      
      const response = await fetch(`/api/auth/credentials?merchantId=${merchantId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Credentials fetched successfully');
        setApiKey(data.data.apiKey);
        setApiSecret(data.data.apiSecret);
        setMerchantId(String(data.data.merchantId));
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

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const storedMerchant = getStoredMerchant();
    let id = '';
    
    if (storedMerchant) {
      id = String(storedMerchant.merchantId || storedMerchant.merchant_id || '');
      if (id) {
        setMerchantId(id);
        setMerchantName(storedMerchant.businessName || storedMerchant.business_name || 'Merchant');
      }
    }

    getMerchantProfile(token)
      .then((profile) => {
        if (profile?.merchant_id) {
          const profileId = String(profile.merchant_id);
          setMerchantId(profileId);
          setMerchantName(profile.business_name || 'Merchant');
          localStorage.setItem('merchant', JSON.stringify(profile));
          fetchCredentials(token, profileId);
        } else if (id) {
          fetchCredentials(token, id);
        } else {
          setError('No merchant ID found');
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch profile:', err);
        if (id) {
          fetchCredentials(token, id);
        } else {
          setError('Failed to fetch merchant profile');
          setLoading(false);
        }
      });
  }, []);

  const handleProceed = async () => {
    console.log('🔄 Proceed clicked!');

    // Validate amount
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
      setErrorMessage('API credentials not found');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');
    setErrorMessage('');

    try {
      // 1. Build the request body as per Unified Gateway documentation
      const body = {
        action: 'charge',
        method: 'mpesa',
        phone: phone,
        amount: finalAmount,
        shortcode: merchantId,
        idempotencyKey: 'key-' + crypto.randomBytes(8).toString('hex'),
      };

      // 2. Sort keys alphabetically and stringify for signature
      const sorted: Record<string, any> = {};
      Object.keys(body).sort().forEach((k) => {
        sorted[k] = body[k as keyof typeof body];
      });
      const bodyString = JSON.stringify(sorted);

      // 3. Generate timestamp and nonce
      const timestamp = Math.floor(Date.now() / 1000);
      const nonce = crypto.randomBytes(16).toString('hex');

      // 4. ✅ CORRECT: Match backend EXACTLY with '/' (not '/v1/payments')
      const canonicalString = `${timestamp}.${nonce}.POST./.${bodyString}`;

      // 5. Generate HMAC-SHA256 signature over the canonical string
      const signature = crypto
        .createHmac('sha256', apiSecret)
        .update(canonicalString)
        .digest('hex');

      // 6. Send the request to the Unified Gateway
      const response = await fetch('/v1/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'x-signature': signature,
          'x-timestamp': String(timestamp),
          'x-nonce': nonce,
        },
        body: bodyString,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPaymentStatus('success');
        setPaymentResponse(data);
        setTimeout(() => {
          if (returnUrl) router.push(returnUrl);
        }, 3000);
      } else {
        setPaymentStatus('error');
        setErrorMessage(data.error || 'Payment failed');
        setPaymentResponse(data);
      }
    } catch (error: any) {
      setPaymentStatus('error');
      setErrorMessage(error.message || 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderPaymentStatus = () => {
    if (paymentStatus === 'idle') return null;
    const configs = {
      processing: {
        icon: <Loader2 className="w-8 h-8 animate-spin text-blue-500" />,
        title: 'Processing your payment...',
        description: 'Please wait while we initiate your payment',
        color: 'text-blue-500',
        bg: 'bg-blue-50 border-blue-200',
      },
      success: {
        icon: <CheckCircle className="w-8 h-8 text-emerald-500" />,
        title: 'Payment Initiated!',
        description: `Checkout ID: ${paymentResponse?.data?.checkoutRequestId || 'N/A'}`,
        color: 'text-emerald-500',
        bg: 'bg-emerald-50 border-emerald-200',
      },
      error: {
        icon: <XCircle className="w-8 h-8 text-red-500" />,
        title: 'Payment Failed',
        description: errorMessage || 'Please try again',
        color: 'text-red-500',
        bg: 'bg-red-50 border-red-200',
      },
    };
    const config = configs[paymentStatus];
    return (
      <div className={`border rounded-xl p-6 mb-6 ${config.bg}`}>
        <div className="flex items-center gap-4">
          {config.icon}
          <div>
            <h3 className={`font-semibold ${config.color}`}>{config.title}</h3>
            <p className="text-sm text-gray-600">{config.description}</p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f2f2f2]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#8b1a1a] mx-auto" />
          <p className="mt-4 text-gray-500">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f2f2f2]">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Checkout</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#8b1a1a] hover:bg-[#701515] text-white px-6 py-2 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f2f2]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Globe className="w-6 h-6 text-[#8b1a1a]" />
              XecoFlow Checkout
            </h1>
            <p className="text-sm text-gray-500 mt-1">Accept payments globally with XecoFlow</p>
          </div>
          <Link href="/developers/introduction" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8b1a1a] hover:bg-[#701515] text-white rounded-lg text-sm font-semibold transition-all shadow-sm">
            Learn More <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Status Bar */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-800">Live Payment for {businessName}</p>
              <p className="text-xs text-blue-600">Amount: {currency} {amount.toFixed(2)} | Merchant: {merchantName || businessName}</p>
            </div>
          </div>
          {merchantId && <span className="text-xs bg-white px-3 py-1 rounded-full text-gray-600 border border-gray-200">Merchant: {merchantId}</span>}
          {isReady && <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">✅ API Ready</span>}
        </div>
      </div>

      {/* Checkout */}
      <div className="max-w-7xl mx-auto px-6 pb-10">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Checkout Header */}
          <div className="bg-[#1a1a2e] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-[#8b1a1a] flex items-center justify-center text-white font-bold text-sm">X</div>
              <span className="text-white font-semibold tracking-wide text-lg">Xecoflow <span className="text-[#e0b0b0] font-light">Gateway</span></span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <ShieldCheck size={14} className="text-green-400" /> Secure Checkout
            </div>
          </div>

          {/* Step Indicator */}
          <div className="px-6 md:px-8 pt-6 pb-4 border-b border-gray-200">
            <div className="flex items-center">
              {['Enter Details', 'Make Payment', 'Confirmation'].map((label, i) => {
                const isComplete = paymentStatus === 'success' && i < 2;
                const isActive = i === 0 || (i === 1 && paymentStatus === 'processing');
                const stepNumber = i + 1;
                const status = isComplete ? 'complete' : isActive ? 'active' : 'inactive';
                return (
                  <div key={label} className="flex-1 flex items-center">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${status === 'complete' ? 'bg-emerald-500 text-white' : status === 'active' ? 'bg-[#8b1a1a] text-white' : 'bg-gray-200 text-gray-500'}`}>
                        {status === 'complete' ? <CheckCircle className="w-4 h-4" /> : stepNumber}
                      </div>
                      <span className={`mt-1.5 text-xs whitespace-nowrap ${status === 'active' ? 'text-[#8b1a1a] font-medium' : 'text-gray-400'}`}>{label}</span>
                    </div>
                    {i < 2 && <div className={`h-[2px] flex-1 mx-2 -mt-5 ${status === 'complete' || status === 'active' ? 'bg-[#8b1a1a]' : 'bg-gray-200'}`} />}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-0">
            {/* Left Column */}
            <div className="order-1 px-6 md:px-8 py-6 md:py-10 lg:border-r border-gray-200">
              <h2 className="text-xl font-light text-gray-700 tracking-wide mb-5">PAYMENT DETAILS</h2>
              <p className="text-sm text-gray-800 mb-4">Reference: {customerRef || '—'}</p>
              
              {/* Amount Input Field - Added here */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Enter Amount ({currency})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                    {currency}
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={userAmount}
                    onChange={handleAmountChange}
                    placeholder="0.00"
                    disabled={isProcessing || paymentStatus === 'success'}
                    className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#8b1a1a] focus:border-transparent bg-gray-50 focus:bg-white transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Enter the amount you wish to pay</p>
              </div>

              <div className="flex justify-between text-sm text-gray-700 mb-2">
                <span>Amount</span>
                <span>{currency} {amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center bg-gray-100 px-4 py-2.5 rounded">
                <span className="text-sm font-semibold text-gray-800">Total Amount</span>
                <span className="text-sm font-semibold text-gray-800">{currency} {amount.toFixed(2)}</span>
              </div>
              <hr className="border-gray-200 my-5" />
              <h3 className="text-sm font-bold text-gray-800 mb-3">CUSTOMER DETAILS</h3>
              <div className="text-sm text-gray-700">
                <p className="font-semibold">{customerName}</p>
                <p>{customerEmail}</p>
                <p>{customerPhone}</p>
                {customerRef && <p className="text-xs text-gray-400 mt-1">Reference: {customerRef}</p>}
              </div>
              <hr className="border-gray-200 my-5" />
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Lock size={12} className="text-green-600" /> Payments are encrypted and processed securely
              </div>
            </div>

            {/* Right Column */}
            <div className="order-2 lg:col-span-2 px-6 md:px-8 py-6 md:py-8 pb-8">
              {renderPaymentStatus()}

              {paymentStatus !== 'success' && (
                <>
                  <h2 className="font-semibold text-gray-800 mb-4">Select Payment Method</h2>
                  <div className="flex flex-wrap gap-3 mb-5">
                    {PAYMENT_METHODS.map((m) => {
                      const Icon = m.icon;
                      return (
                        <label key={m.id} className={`flex items-center gap-2 border rounded px-4 py-2.5 cursor-pointer text-sm font-medium ${method === m.id ? 'border-[#8b1a1a] bg-[#fdf3f3]' : 'border-gray-300'}`}>
                          <input type="radio" checked={method === m.id} onChange={() => setMethod(m.id)} className="accent-[#8b1a1a]" />
                          <Icon size={14} /> {m.label}
                        </label>
                      );
                    })}
                  </div>

                  <p className="text-sm text-gray-800 mb-5">Pay <span className="italic font-semibold">"{businessName}"</span> <span className="font-semibold">{currency} {amount.toFixed(2)}</span></p>

                  {(method === 'mpesa' || method === 'airtel') && (
                    <>
                      <ol className="text-sm text-gray-700 space-y-1 mb-5 list-decimal pl-5">
                        <li>Provide your {method === 'mpesa' ? 'MPESA' : 'Airtel Money'} mobile number</li>
                        <li>Click Proceed to receive a prompt on your phone</li>
                        <li>Enter your PIN to confirm payment</li>
                      </ol>
                      <div className="border border-gray-300 rounded mb-5">
                        <div className="flex items-center gap-2 border-b border-gray-300 px-4 py-3 bg-white">
                          <Lock size={15} className="text-green-600" />
                          <span className="text-sm font-semibold text-gray-800">Mobile Number</span>
                        </div>
                        <div className="flex">
                          <div className="w-24 flex items-center justify-center gap-1 border-r border-gray-300 py-3 text-sm text-gray-700">
                            <Smartphone size={14} /> +254
                          </div>
                          <input type="tel" value={phoneNumber || customerPhone} onChange={handlePhoneChange} className="flex-1 px-4 py-3 text-sm outline-none bg-gray-50 focus:bg-white transition-colors" placeholder="708050827" disabled={isProcessing} />
                        </div>
                      </div>
                    </>
                  )}

                  <button
                    onClick={handleProceed}
                    disabled={isProcessing}
                    className={`bg-[#8b1a1a] hover:bg-[#701515] text-white text-sm font-medium px-8 py-2.5 rounded transition-colors ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isProcessing ? 'Processing...' : 'Proceed'}
                  </button>

                  {errorMessage && paymentStatus === 'error' && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-600">{errorMessage}</p>
                    </div>
                  )}
                </>
              )}

              {paymentStatus === 'success' && (
                <div className="mt-4">
                  <Link href={returnUrl} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-6 py-2.5 rounded transition-colors">
                    <CheckCircle className="w-4 h-4" /> View Transactions
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 text-center text-xs text-gray-400">
          Powered by XecoFlow · Secure &amp; PCI-DSS compliant
        </div>
      </div>
    </div>
  );
}