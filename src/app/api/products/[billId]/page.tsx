'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Lock,
  Smartphone,
  CheckCircle,
  Loader2,
  AlertCircle,
  ChevronDown,
  ArrowRight,
  FileText,
  Download,
} from 'lucide-react';

interface ProductBill {
  bill_id: string;
  merchant_id: string;
  business_name: string;
  customer_name: string;
  amount: number;
  currency: string;
  description: string;
  file_url: string;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED' | 'PROCESSING';
  expiry_date: string;
  return_url: string | null;
}

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const billId = params.billId as string;

  const [bill, setBill] = useState<ProductBill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  // ─── Fetch Bill Data ──────────────────────────────────────────────
  const fetchBill = async () => {
    try {
      const response = await fetch(`/api/bills/${billId}`);
      const data = await response.json();

      if (data.success) {
        setBill(data.data);
        if (data.data.customer_phone) setPhoneNumber(data.data.customer_phone);
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
    if (billId) fetchBill();
  }, [billId]);

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
      const response = await fetch('/api/bills/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billId: bill?.bill_id, phone }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setPaymentStatus('success');
        
        // Poll for status update
        setTimeout(async () => {
          const updatedRes = await fetch(`/api/bills/${billId}`);
          const updatedData = await updatedRes.json();
          if (updatedData.success && updatedData.data.status === 'PAID') {
            setBill(updatedData.data);
            triggerDownload(updatedData.data.file_url);
          }
        }, 3000);
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
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsDownloading(false);
  };

  // ─── Loading State ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // ─── Error State ──────────────────────────────────────────────────
  if (error || !bill) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Product Unavailable</h2>
          <p className="text-gray-500 mt-2">{error || 'This product link is invalid or expired.'}</p>
        </div>
      </div>
    );
  }

  const isExpired = new Date(bill.expiry_date) < new Date();
  const isPaid = bill.status === 'PAID';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 md:p-8">
      <div className="max-w-6xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[600px]">
        
        {/* ─── LEFT SIDE: PREVIEW ────────────────────────────────────── */}
        <div className="lg:w-1/2 p-8 bg-gray-50/50 border-r border-gray-200 flex flex-col items-center justify-center relative min-h-[300px] lg:min-h-auto">
          <div className="w-full max-w-md text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">{bill.business_name}</h2>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">{bill.description || 'Digital Product'}</h3>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6">
              {isPaid ? (
                <div className="py-12 flex flex-col items-center gap-3">
                  <CheckCircle className="w-16 h-16 text-emerald-500" />
                  <p className="text-lg font-medium text-gray-900">Payment Successful!</p>
                  <p className="text-sm text-gray-500">Your download will start automatically.</p>
                  {bill.file_url && (
                    <button 
                      onClick={() => triggerDownload(bill.file_url)}
                      className="mt-4 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" /> Download Now
                    </button>
                  )}
                </div>
              ) : (
                <div className="aspect-[4/3] bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                  <div className="text-center p-6">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Preview locked</p>
                    <p className="text-xs text-gray-400 mt-1">Complete payment to unlock</p>
                  </div>
                </div>
              )}
            </div>

            <p className="text-sm text-gray-500">
              {isPaid ? '✅ Payment completed. Thank you!' : '🔒 Payment required to download this file.'}
            </p>
          </div>
        </div>

        {/* ─── RIGHT SIDE: CHECKOUT ──────────────────────────────────── */}
        <div className="lg:w-1/2 p-8 flex flex-col justify-center">
          
          {isPaid ? (
            <div className="text-center py-8">
              <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900">Download Ready</h3>
              <p className="text-gray-600 mt-2">Your file has been unlocked. You may download it now.</p>
              {bill.return_url && (
                <button 
                  onClick={() => router.push(bill.return_url!)}
                  className="mt-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium"
                >
                  Go Back to Merchant
                </button>
              )}
            </div>
          ) : isExpired ? (
            <div className="text-center py-8">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900">Link Expired</h3>
              <p className="text-gray-600 mt-2">This product link is no longer active.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Payment Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div>
                  <p className="text-xs text-gray-400">Amount Due</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {bill.currency} {Number(bill.amount).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs bg-emerald-50 px-3 py-1.5 rounded-full text-emerald-700">
                  <Lock className="w-3 h-3" /> Secured
                </div>
              </div>

              {/* Payment Status */}
              {paymentStatus === 'processing' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  <span className="text-sm text-blue-700">Initiating payment...</span>
                </div>
              )}
              {paymentStatus === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-sm text-red-700">{errorMessage}</span>
                </div>
              )}

              {paymentStatus !== 'success' && (
                <>
                  {/* Phone Input */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      M-PESA Mobile Number
                    </label>
                    <div className="flex border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
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
                      <Lock className="w-3 h-3" /> We will send an STK push to your phone.
                    </p>
                  </div>

                  <button
                    onClick={handlePay}
                    disabled={isProcessing}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Pay {bill.currency} {Number(bill.amount).toFixed(2)}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}