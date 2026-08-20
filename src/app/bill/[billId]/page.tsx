'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
  Mail,
  Phone,
  User,
  RefreshCw,
} from 'lucide-react';

const PAYMENT_METHODS = [
  { id: 'mpesa', label: 'M-PESA', icon: Smartphone, available: true },
  { id: 'airtel', label: 'Airtel Money', icon: Smartphone, available: true },
  { id: 'cards', label: 'VISA / Mastercard / AMEX', icon: CreditCard, available: true },
  { id: 'visa-ewallet', label: 'Visa via Pesapal', icon: Building2, available: true },
];

interface BillData {
  bill_id: string;
  merchant_id: string;
  business_name: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  amount: number;
  currency: string;
  description: string;
  items: any[];
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED' | 'PROCESSING';
  expiry_date: string;
  created_at: string;
  paid_at: string | null;
  return_url?: string;
}

interface PaymentResponse {
  success: boolean;
  data?: { transactionId: string; checkoutRequestId: string };
  error?: string;
}

export default function BillViewPage() {
  const params = useParams();
  const router = useRouter();
  const billId = params.billId as string;

  const [bill, setBill] = useState<BillData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [method, setMethod] = useState('mpesa');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [paymentResponse, setPaymentResponse] = useState<PaymentResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.length <= 12 ? cleaned : cleaned.slice(0, 12);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(formatPhoneNumber(e.target.value));
  };

  useEffect(() => {
    if (billId) {
      fetchBill();
    }
  }, [billId]);

  // ✅ FIXED: Changed /v1/ to /api/
  const fetchBill = async () => {
    try {
      const response = await fetch(`/api/bills/${billId}`);
      const data = await response.json();

      if (data.success) {
        setBill(data.data);
        if (data.data.customer_phone) {
          setPhoneNumber(data.data.customer_phone);
        }
      } else {
        setError(data.error || 'Bill not found');
      }
    } catch (err) {
      setError('Failed to load bill');
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = async () => {
    let phone = phoneNumber;
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

    try {
      // ✅ FIXED: Changed /v1/ to /api/
      const response = await fetch('/api/bills/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billId: bill?.bill_id,
          phone: phone,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPaymentStatus('success');
        setPaymentResponse(data);
        setTimeout(() => {
          if (bill?.return_url) {
            router.push(bill.return_url);
          } else {
            router.push('/');
          }
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

  // ✅ FIXED: Changed /v1/ to /api/
  const resetProcessing = async () => {
    if (!bill) return;
    const res = await fetch(`/api/bills/reset-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ billId: bill.bill_id }),
    });
    if (res.ok) {
      fetchBill();
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

  if (error || !bill) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f2f2f2]">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bill Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The bill you are looking for does not exist.'}</p>
          <Link href="/" className="bg-[#8b1a1a] hover:bg-[#701515] text-white px-6 py-2 rounded-lg inline-block">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const isExpired = new Date(bill.expiry_date) < new Date();
  const canPay = bill.status === 'PENDING' && !isExpired;

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
              <p className="text-sm font-semibold text-blue-800">Live Payment for {bill.business_name}</p>
              <p className="text-xs text-blue-600">Amount: {bill.currency} {Number(bill.amount).toFixed(2)} | Bill: {bill.bill_id}</p>
            </div>
          </div>
          {bill.status === 'PAID' ? (
            <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">✅ Paid</span>
          ) : bill.status === 'PROCESSING' ? (
            <span className="text-xs bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-200">⏳ Processing</span>
          ) : isExpired ? (
            <span className="text-xs bg-red-50 text-red-700 px-3 py-1 rounded-full border border-red-200">❌ Expired</span>
          ) : (
            <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">✅ API Ready</span>
          )}
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
              <p className="text-sm text-gray-800 mb-4">Reference: {bill.bill_id || '—'}</p>
              <div className="flex justify-between text-sm text-gray-700 mb-2"><span>Amount</span><span>{bill.currency} {Number(bill.amount).toFixed(2)}</span></div>
              <div className="flex justify-between items-center bg-gray-100 px-4 py-2.5 rounded">
                <span className="text-sm font-semibold text-gray-800">Total Amount</span>
                <span className="text-sm font-semibold text-gray-800">{bill.currency} {Number(bill.amount).toFixed(2)}</span>
              </div>
              <hr className="border-gray-200 my-5" />
              <h3 className="text-sm font-bold text-gray-800 mb-3">CUSTOMER DETAILS</h3>
              <div className="text-sm text-gray-700">
                <p className="font-semibold flex items-center gap-2"><User className="w-3 h-3" /> {bill.customer_name}</p>
                {bill.customer_email && <p className="flex items-center gap-2"><Mail className="w-3 h-3" /> {bill.customer_email}</p>}
                {bill.customer_phone && <p className="flex items-center gap-2"><Phone className="w-3 h-3" /> {bill.customer_phone}</p>}
                <p className="text-xs text-gray-400 mt-1">Reference: {bill.bill_id}</p>
              </div>
              <hr className="border-gray-200 my-5" />
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Lock size={12} className="text-green-600" /> Payments are encrypted and processed securely
              </div>
            </div>

            {/* Right Column */}
            <div className="order-2 lg:col-span-2 px-6 md:px-8 py-6 md:py-8 pb-8">
              {renderPaymentStatus()}

              {(!canPay || bill.status === 'PAID' || bill.status === 'PROCESSING') && paymentStatus === 'idle' && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
                  {bill.status === 'PAID' ? (
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle className="w-12 h-12 text-emerald-500" />
                      <h3 className="text-lg font-bold text-gray-900">Payment Completed</h3>
                      <p className="text-gray-600">This bill has already been paid.</p>
                    </div>
                  ) : bill.status === 'PROCESSING' ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center justify-center gap-2 text-amber-500 mb-2">
                        <Loader2 className="w-8 h-8 animate-spin" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Previous Payment Stuck</h3>
                      <p className="text-gray-600">Your previous payment attempt is still processing or timed out.</p>
                      <button
                        onClick={resetProcessing}
                        className="mt-4 px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Reset & Try Again
                      </button>
                    </div>
                  ) : isExpired ? (
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="w-12 h-12 text-red-500" />
                      <h3 className="text-lg font-bold text-gray-900">Bill Expired</h3>
                      <p className="text-gray-600">This bill has expired and can no longer be paid.</p>
                    </div>
                  ) : null}
                </div>
              )}

              {canPay && paymentStatus !== 'success' && (
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

                  <p className="text-sm text-gray-800 mb-5">Pay <span className="italic font-semibold">"{bill.business_name}"</span> <span className="font-semibold">{bill.currency} {Number(bill.amount).toFixed(2)}</span></p>

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
                          <input type="tel" value={phoneNumber} onChange={handlePhoneChange} className="flex-1 px-4 py-3 text-sm outline-none bg-gray-50 focus:bg-white transition-colors" placeholder="708050827" disabled={isProcessing} />
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
                  <Link href={bill.return_url || '/'} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-6 py-2.5 rounded transition-colors">
                    <CheckCircle className="w-4 h-4" /> Continue
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