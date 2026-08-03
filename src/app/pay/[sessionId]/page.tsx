// src/app/pay/[sessionId]/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Lock,
  Smartphone,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  Building2,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────
interface CardDetails {
  number: string;
  name: string;
  expiry: string;
  cvv: string;
}

interface PaymentSession {
  id: string;
  amount: number;
  currency: string;
  description: string;
  merchantName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerRef?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, any>;
}

type PaymentStatus = 'form' | 'loading' | 'success' | 'failed';

// ─── Constants ──────────────────────────────────────────────────────
const STEPS = ['Enter Details', 'Make Payment', 'Confirmation'];

const PAYMENT_METHODS = [
  { id: 'mpesa', label: 'M-PESA', icon: Smartphone },
  { id: 'airtel', label: 'Airtel Money', icon: Smartphone },
  { id: 'cards', label: 'VISA / Mastercard / AMEX', icon: CreditCard },
  { id: 'visa-ewallet', label: 'Visa via Pesapal', icon: Building2 },
];

// ─── Helper Functions ──────────────────────────────────────────────
const formatPhone = (value: string) => value.replace(/\D/g, '').slice(0, 9);
const formatCardNumber = (value: string) => {
  const cleaned = value.replace(/\D/g, '');
  const groups = cleaned.match(/.{1,4}/g) || [];
  return groups.join(' ').slice(0, 19);
};
const formatExpiry = (value: string) => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length >= 2) {
    return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
  }
  return cleaned;
};

// ─── Main Component ─────────────────────────────────────────────────
export default function XecoflowGateway() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  // ─── State ────────────────────────────────────────────────────────
  const [session, setSession] = useState<PaymentSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState('mpesa');
  const [phone, setPhone] = useState('');
  const [card, setCard] = useState<CardDetails>({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  });
  const [status, setStatus] = useState<PaymentStatus>('form');
  const [errors, setErrors] = useState<{ phone?: string; card?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ─── Fetch Session ────────────────────────────────────────────────
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/payment-session/${sessionId}`);
        if (!res.ok) throw new Error('Session not found');
        const data = await res.json();
        setSession(data);
        setPhone(data.customerPhone || '');
        setCard((prev) => ({ ...prev, name: data.customerName || '' }));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching session:', error);
        setLoading(false);
      }
    };
    fetchSession();
  }, [sessionId]);

  // ─── Focus Management ─────────────────────────────────────────────
  useEffect(() => {
    if (status === 'form' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [status]);

  // ─── Form Handlers ────────────────────────────────────────────────
  const updateCard = (field: keyof CardDetails, value: string) => {
    setCard((prev) => ({ ...prev, [field]: value }));
    if (errors.card) setErrors({ ...errors, card: undefined });
  };

  // ─── Validation ────────────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: { phone?: string; card?: string } = {};
    if (method === 'mpesa' || method === 'airtel') {
      if (phone.length < 9) {
        newErrors.phone = 'Please enter a valid 9-digit phone number.';
      }
    }
    if (method === 'cards') {
      if (card.number.replace(/\s/g, '').length < 16) {
        newErrors.card = 'Please enter a valid card number.';
      } else if (!card.name.trim()) {
        newErrors.card = 'Name on card is required.';
      } else if (card.expiry.replace('/', '').length < 4) {
        newErrors.card = 'Please enter a valid expiry date (MM/YY).';
      } else if (card.cvv.length < 3) {
        newErrors.card = 'Please enter a valid CVV.';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Process Payment ──────────────────────────────────────────────
  const handleProceed = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    setStatus('loading');

    try {
      const payload = {
        sessionId,
        method,
        phone: method === 'mpesa' || method === 'airtel' ? phone : undefined,
        card: method === 'cards' ? card : undefined,
      };

      const res = await fetch('/api/payments/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (result.success) {
        setStatus('success');
        // Redirect to merchant's success URL after a short delay
        setTimeout(() => {
          if (session?.successUrl) {
            router.push(`${session.successUrl}?sessionId=${sessionId}&status=success`);
          }
        }, 2000);
      } else {
        setStatus('failed');
        setErrors({ card: result.error || 'Payment failed. Please try again.' });
      }
    } catch (error) {
      console.error('Payment error:', error);
      setStatus('failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetToForm = () => {
    setStatus('form');
    setErrors({});
  };

  // ─── Loading State ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f2f2f2] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-[#8b1a1a] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#f2f2f2] flex items-center justify-center">
        <div className="text-center">
          <XCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Session not found</h2>
          <p className="text-sm text-gray-500 mt-2">The payment session may have expired.</p>
        </div>
      </div>
    );
  }

  const { amount, currency, description, merchantName, customerName, customerEmail, customerPhone, customerRef } = session;

  // ─── Render: Form ──────────────────────────────────────────────────
  const renderForm = () => (
    <>
      {/* ─── Step Indicator ────────────────────────────────────────── */}
      <div className="px-6 md:px-8 pt-6 pb-4">
        <div className="flex items-center">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1 flex items-center">
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                    i <= 1 ? 'bg-[#8b1a1a] text-white' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {i + 1}
                </div>
                <span
                  className={`mt-1.5 text-xs whitespace-nowrap ${
                    i <= 1 ? 'text-[#8b1a1a] font-medium' : 'text-gray-400'
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-[2px] flex-1 mx-2 -mt-5 ${
                    i === 0 ? 'bg-[#8b1a1a]' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-3">
        {/* ─── LEFT COLUMN: Payment & Customer Details ───────────── */}
        <div className="order-1 px-6 md:px-8 py-6 md:py-10 lg:border-r border-gray-200">
          <h2 className="text-xl font-light text-gray-700 tracking-wide mb-5">
            PAYMENT DETAILS
          </h2>

          <p className="text-sm text-gray-800 mb-4 tracking-wide">
            :::: | {customerRef || '—'}
          </p>

          <div className="flex justify-between text-sm text-gray-700 mb-2">
            <span>Amount</span>
            <span>
              {currency} {amount.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between items-center bg-gray-100 px-4 py-2.5 rounded">
            <span className="text-sm font-semibold text-gray-800">Total Amount</span>
            <span className="text-sm font-semibold text-gray-800">
              {currency} {amount.toFixed(2)}
            </span>
          </div>

          <hr className="border-gray-200 my-5" />

          <h3 className="text-sm font-bold text-gray-800 mb-3">CUSTOMER DETAILS</h3>

          <div className="text-sm text-gray-700 space-y-0.5">
            <p className="font-semibold">{customerName}</p>
            <p>{customerEmail}</p>
            <p>{customerPhone}</p>
            {customerRef && (
              <p className="text-xs text-gray-400 mt-1">
                Student Admission No: {customerRef}
              </p>
            )}
          </div>

          <hr className="border-gray-200 my-5" />

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Lock size={12} className="text-green-600" />
            Payments are encrypted and processed securely by Xecoflow.
          </div>
        </div>

        {/* ─── RIGHT COLUMN: Payment Options ───────────────────────── */}
        <div className="order-2 lg:col-span-2 px-6 md:px-8 pb-8">
          <h2 className="font-semibold text-gray-800 mb-4 pt-4 lg:pt-0">
            Please select your preferred payment option
          </h2>

          {/* Payment Methods */}
          <div className="flex flex-wrap gap-3 mb-5">
            {PAYMENT_METHODS.map((m) => {
              const Icon = m.icon;
              return (
                <label
                  key={m.id}
                  className={`flex items-center gap-2 border rounded px-4 py-2.5 cursor-pointer text-sm font-medium ${
                    method === m.id ? 'border-[#8b1a1a] bg-[#fdf3f3]' : 'border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    checked={method === m.id}
                    onChange={() => setMethod(m.id)}
                    className="accent-[#8b1a1a]"
                  />
                  <Icon size={14} />
                  {m.label}
                </label>
              );
            })}
          </div>

          {/* Amount */}
          <p className="text-sm text-gray-800 mb-5">
            Pay <span className="italic font-semibold">"{merchantName}"</span>{' '}
            <span className="font-semibold">
              {currency} {amount.toFixed(2)}
            </span>
          </p>

          {/* ─── M-PESA / Airtel Money ────────────────────────────── */}
          {(method === 'mpesa' || method === 'airtel') && (
            <>
              <ol className="text-sm text-gray-700 space-y-1 mb-5 list-decimal pl-5">
                <li>
                  Provide your {method === 'mpesa' ? 'MPESA' : 'Airtel Money'} [KE] mobile
                  number below
                </li>
                <li>
                  Click Proceed and a prompt will appear on your phone requesting you to
                  confirm transaction by providing your PIN
                </li>
                <li>
                  Once completed, you will receive the confirmation SMS for this transaction
                </li>
              </ol>

              <div className="border border-gray-300 rounded mb-5">
                <div className="flex items-center gap-2 border-b border-gray-300 px-4 py-3 bg-white">
                  <Lock size={15} className="text-green-600" />
                  <span className="text-sm font-semibold text-gray-800">
                    Provide your {method === 'mpesa' ? 'Mpesa' : 'Airtel'} [KE] Mobile number
                  </span>
                </div>
                <div className="flex">
                  <div className="w-24 flex items-center justify-center gap-1 border-r border-gray-300 py-3 text-sm text-gray-700">
                    <Smartphone size={14} />
                    +254
                  </div>
                  <input
                    ref={inputRef}
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(formatPhone(e.target.value));
                      if (errors.phone) setErrors({ ...errors, phone: undefined });
                    }}
                    placeholder="712 071 385"
                    className={`flex-1 px-4 py-3 text-sm outline-none ${
                      errors.phone ? 'border-red-500 ring-1 ring-red-500' : ''
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-red-600 px-4 py-1 bg-red-50">{errors.phone}</p>
                )}
              </div>
            </>
          )}

          {/* ─── Card Payment ──────────────────────────────────────── */}
          {method === 'cards' && (
            <div className="border border-gray-300 rounded mb-5 overflow-hidden">
              <div className="flex items-center gap-2 border-b border-gray-300 px-4 py-3 bg-white">
                <CreditCard size={15} className="text-gray-600" />
                <span className="text-sm font-semibold text-gray-800">
                  Enter your card details
                </span>
              </div>
              <div className="p-4 space-y-4 bg-white">
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">
                    Card number
                  </label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={card.number}
                    onChange={(e) => updateCard('number', formatCardNumber(e.target.value))}
                    className={`w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-[#8b1a1a] ${
                      errors.card ? 'border-red-500 ring-1 ring-red-500' : ''
                    }`}
                    maxLength={19}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">
                    Name on card
                  </label>
                  <input
                    type="text"
                    placeholder="SAMUEL CHAGA"
                    value={card.name}
                    onChange={(e) => updateCard('name', e.target.value.toUpperCase())}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-[#8b1a1a]"
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-gray-600 mb-1 block">
                      Expiry date
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={card.expiry}
                      onChange={(e) => updateCard('expiry', formatExpiry(e.target.value))}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-[#8b1a1a]"
                      maxLength={5}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-600 mb-1 block">CVV</label>
                    <input
                      type="text"
                      placeholder="123"
                      value={card.cvv}
                      onChange={(e) =>
                        updateCard('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))
                      }
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-[#8b1a1a]"
                      maxLength={4}
                    />
                  </div>
                </div>
                {errors.card && (
                  <p className="text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded">
                    {errors.card}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ─── Visa via Pesapal ──────────────────────────────────── */}
          {method === 'visa-ewallet' && (
            <div className="border border-gray-300 rounded mb-5 p-4 bg-white text-sm text-gray-700">
              You'll be redirected to the Visa e-wallet Pesapal portal to complete this
              payment securely.
            </div>
          )}

          <button
            onClick={handleProceed}
            disabled={isSubmitting}
            className="bg-[#8b1a1a] hover:bg-[#701515] disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium px-8 py-2.5 rounded transition-colors"
          >
            {isSubmitting ? 'Processing...' : 'Proceed'}
          </button>
        </div>
      </div>
    </>
  );

  // ─── Loading ──────────────────────────────────────────────────────
  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center min-h-[480px] px-8 text-center">
      <div className="relative w-20 h-20 mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
        <Loader2 size={80} strokeWidth={3} className="text-[#8b1a1a] animate-spin" />
      </div>
      <h2 className="text-lg font-semibold text-gray-800 mb-2">
        Verifying your payment
      </h2>
      <p className="text-sm text-gray-500 max-w-xs">
        Please wait while we confirm your transaction with your payment provider.
      </p>
      <div className="flex gap-1.5 mt-6">
        <span className="w-1.5 h-1.5 rounded-full bg-[#8b1a1a] animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-[#8b1a1a] animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-[#8b1a1a] animate-bounce" />
      </div>
    </div>
  );

  // ─── Success ──────────────────────────────────────────────────────
  const renderSuccess = () => (
    <div className="flex flex-col items-center justify-center min-h-[480px] px-8 text-center">
      <CheckCircle2 size={72} strokeWidth={1.5} className="text-green-600 mb-5" />
      <h2 className="text-xl font-semibold text-gray-800 mb-2">Payment Successful</h2>
      <p className="text-sm text-gray-500 max-w-sm mb-6">
        Your payment of{' '}
        <span className="font-semibold text-gray-700">
          {currency} {amount.toFixed(2)}
        </span>{' '}
        for "{merchantName}" has been received.
      </p>
      <div className="w-full max-w-sm border border-gray-200 rounded text-left text-sm text-gray-600 divide-y divide-gray-100 mb-6">
        <div className="flex justify-between px-4 py-2.5">
          <span>Reference</span>
          <span className="font-medium text-gray-800">{customerRef || '—'}</span>
        </div>
        <div className="flex justify-between px-4 py-2.5">
          <span>Amount</span>
          <span className="font-medium text-gray-800">
            {currency} {amount.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between px-4 py-2.5">
          <span>Method</span>
          <span className="font-medium text-gray-800 capitalize">{method}</span>
        </div>
      </div>
      <button
        onClick={resetToForm}
        className="bg-[#8b1a1a] hover:bg-[#701515] text-white text-sm font-medium px-8 py-2.5 rounded transition-colors"
      >
        Done
      </button>
    </div>
  );

  // ─── Failed ───────────────────────────────────────────────────────
  const renderFailed = () => (
    <div className="flex flex-col items-center justify-center min-h-[480px] px-8 text-center">
      <XCircle size={72} strokeWidth={1.5} className="text-red-600 mb-5" />
      <h2 className="text-xl font-semibold text-gray-800 mb-2">Payment Failed</h2>
      <p className="text-sm text-gray-500 max-w-sm mb-6">
        We couldn't confirm your payment of{' '}
        <span className="font-semibold text-gray-700">
          {currency} {amount.toFixed(2)}
        </span>
        . No funds were deducted.
      </p>
      <button
        onClick={resetToForm}
        className="bg-[#8b1a1a] hover:bg-[#701515] text-white text-sm font-medium px-8 py-2.5 rounded transition-colors"
      >
        Try Again
      </button>
    </div>
  );

  // ─── Main Render ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f2f2f2]">
      {/* ─── Top Header Bar ────────────────────────────────────────── */}
      <div className="bg-[#1a1a2e] px-6 py-4 flex items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-[#8b1a1a] flex items-center justify-center text-white font-bold text-sm">
            X
          </div>
          <span className="text-white font-semibold tracking-wide text-lg">
            Xecoflow <span className="text-[#e0b0b0] font-light">Gateway</span>
          </span>
        </div>
      </div>

      {/* ─── Main Content ───────────────────────────────────────────── */}
      <div className="py-6 md:py-8 px-4">
        <div className="mx-auto max-w-6xl bg-white shadow-sm min-h-[480px]">
          {status === 'form' && renderForm()}
          {status === 'loading' && renderLoading()}
          {status === 'success' && renderSuccess()}
          {status === 'failed' && renderFailed()}
        </div>
      </div>
    </div>
  );
}