'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Lock,
  CheckCircle,
  Loader2,
  AlertCircle,
  ArrowRight,
  FileText,
  Download,
  Lock as LockIcon,
  Globe,
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
  const [isDownloading, setIsDownloading] = useState(false);

  // ─── Fetch Bill Data ──────────────────────────────────────────────
  const fetchBill = async () => {
    try {
      const response = await fetch(`/api/bills/${billId}`);
      const data = await response.json();

      if (data.success) {
        setBill(data.data);
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

  // ─── Redirect to the Public Bill Checkout ────────────────────────
  const redirectToBillCheckout = () => {
    if (!bill) return;
    
    // ✅ Redirect straight to the public /bill page
    window.location.href = `/bill/${bill.bill_id}`;
  };

  // ─── Trigger File Download ────────────────────────────────────────
  const triggerDownload = (url: string) => {
    if (!url) return;
    setIsDownloading(true);
    const link = document.createElement('a');
    link.href = url;
    link.download = ''; // Forces browser to download instead of opening
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsDownloading(false);
  };

  // ✅ MOVE THIS UP: The download useEffect MUST be placed here, 
  // before any conditional return statements!
  const isPaid = bill?.status === 'PAID';
  
  useEffect(() => {
    if (isPaid && bill?.file_url) {
      // Add a small delay so the UI updates before download starts
      const timer = setTimeout(() => {
        triggerDownload(bill.file_url!);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isPaid, bill?.file_url]);

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

        {/* ─── RIGHT SIDE: REDIRECT TO PUBLIC BILL CHECKOUT ────────── */}
        <div className="lg:w-1/2 p-8 flex flex-col justify-center relative">
          
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
            <div className="space-y-8 max-w-md mx-auto w-full flex flex-col justify-center h-full">
              
              {/* Payment Header */}
              <div className="text-center border-b border-gray-100 pb-6">
                <h2 className="text-2xl font-bold text-gray-900">Unlock Your Download</h2>
                <p className="text-gray-500 mt-1">Secure payment via XecoFlow Gateway</p>
              </div>

              {/* Amount Card */}
              <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-200">
                <p className="text-sm text-gray-500 mb-1">Total Payment</p>
                <p className="text-4xl font-bold text-emerald-600">
                  {bill.currency} {Number(bill.amount).toFixed(2)}
                </p>
                <div className="flex items-center justify-center gap-1 mt-2 text-xs text-emerald-700">
                  <LockIcon className="w-3 h-3" />
                  <span>Secured by XecoFlow</span>
                </div>
              </div>

              {/* What they get */}
              <div className="text-sm text-gray-600 text-center">
                <p>You will be redirected to our secure hosted checkout.</p>
                <p className="text-xs text-gray-400 mt-1">M-PESA, Airtel Money, Visa & Cards accepted.</p>
              </div>

              {/* Action Button */}
              <button
                onClick={redirectToBillCheckout}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-base transition-all shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 flex items-center justify-center gap-2"
              >
                Proceed to Checkout <ArrowRight className="w-5 h-5" />
              </button>

              <p className="text-xs text-gray-400 text-center mt-2">
                You will be redirected to our secure payment gateway.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}