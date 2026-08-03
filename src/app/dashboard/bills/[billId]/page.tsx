// src/app/bill/[billId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CreditCard,
  CheckCircle,
  Loader2,
  AlertCircle,
  Printer,
  Download,
  Share2,
  Shield,
} from 'lucide-react';

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
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED';
  expiry_date: string;
  created_at: string;
  paid_at: string | null;
  total: number;
  subtotal: number;
  tax: number;
  tax_rate: number;
}

export default function BillViewPage() {
  const params = useParams();
  const router = useRouter();
  const billId = params.billId as string;

  const [bill, setBill] = useState<BillData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    if (billId) {
      fetchBill();
    }
  }, [billId]);

  const fetchBill = async () => {
    try {
      const response = await fetch(`/api/bills/${billId}`);
      const data = await response.json();

      if (data.success) {
        setBill(data.data);
      } else {
        setError(data.error || 'Bill not found');
      }
    } catch (err) {
      setError('Failed to load bill');
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = () => {
    if (bill) {
      const checkoutUrl = `/dashboard/hosted-checkout/integration?amount=${bill.amount}&merchant=${encodeURIComponent(bill.business_name)}&reference=${bill.bill_id}&customer=${encodeURIComponent(bill.customer_name)}&email=${bill.customer_email}&phone=${bill.customer_phone}`;
      router.push(checkoutUrl);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading bill...</p>
        </div>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bill Not Found</h2>
          <p className="text-gray-600">{error || 'The bill you are looking for does not exist.'}</p>
        </div>
      </div>
    );
  }

  const isExpired = new Date(bill.expiry_date) < new Date();
  const canPay = bill.status === 'PENDING' && !isExpired;

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* ─── Bill Container ────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="p-6 md:p-8 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {bill.business_name || 'XecoFlow'}
                </h1>
                <p className="text-sm text-gray-500">Smart Bill</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-mono text-gray-400">#{bill.bill_id}</div>
                <div className="text-xs text-gray-400 flex items-center justify-end gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(bill.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="px-6 md:px-8 py-3 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                bill.status === 'PAID' ? 'bg-emerald-500' :
                bill.status === 'EXPIRED' ? 'bg-red-500' :
                bill.status === 'CANCELLED' ? 'bg-gray-500' :
                'bg-amber-500'
              }`} />
              <span className="text-sm font-medium">
                {bill.status === 'PAID' ? 'Paid' :
                 bill.status === 'EXPIRED' ? 'Expired' :
                 bill.status === 'CANCELLED' ? 'Cancelled' :
                 'Pending Payment'}
              </span>
            </div>
            {isExpired && bill.status !== 'PAID' && (
              <span className="text-xs text-red-500 font-medium">Expired</span>
            )}
          </div>

          {/* Content */}
          <div className="p-6 md:p-8 space-y-6">
            {/* Bill Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Info */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-500" />
                  Customer
                </h3>
                <div className="space-y-1">
                  <p className="font-medium text-gray-900">{bill.customer_name}</p>
                  {bill.customer_email && (
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <Mail className="w-3 h-3" />
                      {bill.customer_email}
                    </p>
                  )}
                  {bill.customer_phone && (
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <Phone className="w-3 h-3" />
                      {bill.customer_phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Bill Info */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  Bill Information
                </h3>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Bill ID</span>
                    <span className="font-mono text-gray-900">{bill.bill_id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Created</span>
                    <span className="text-gray-900">{new Date(bill.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Expires</span>
                    <span className={`${isExpired ? 'text-red-500' : 'text-gray-900'}`}>
                      {new Date(bill.expiry_date).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Amount */}
            <div className="border-t border-gray-200 pt-6">
              <div className="space-y-2">
                {bill.items && bill.items.length > 0 && (
                  <div className="space-y-1">
                    {bill.items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.description} x{item.quantity}</span>
                        <span className="text-gray-900">{bill.currency} {(item.quantity * item.unitPrice).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="text-gray-900">{bill.currency} {bill.subtotal?.toFixed(2) || (bill.amount * 0.84).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tax</span>
                    <span className="text-gray-900">{bill.currency} {bill.tax?.toFixed(2) || (bill.amount * 0.16).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                    <span className="text-gray-900">Total</span>
                    <span className="text-indigo-600">{bill.currency} {bill.amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pay Now Button */}
            {canPay ? (
              <button
                onClick={handlePayNow}
                disabled={isPaying}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
              >
                {isPaying ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Pay Now
                  </>
                )}
              </button>
            ) : bill.status === 'PAID' ? (
              <div className="w-full py-4 bg-emerald-100 text-emerald-700 rounded-xl font-semibold text-base flex items-center justify-center gap-3">
                <CheckCircle className="w-5 h-5" />
                Payment Completed
              </div>
            ) : (
              <div className="w-full py-4 bg-gray-100 text-gray-500 rounded-xl font-semibold text-base flex items-center justify-center gap-3 cursor-not-allowed">
                <AlertCircle className="w-5 h-5" />
                {isExpired ? 'Bill Expired' : 'Payment Unavailable'}
              </div>
            )}

            {/* Security Footer */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 pt-4 border-t border-gray-200">
              <Shield className="w-3 h-3" />
              Secured by XecoFlow Payment Gateway
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-gray-400">
          Powered by XecoFlow · Secure &amp; PCI-DSS compliant
        </div>
      </div>
    </div>
  );
}