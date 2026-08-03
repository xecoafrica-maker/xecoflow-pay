'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Search,
  Filter,
  ExternalLink,
  MoreHorizontal,
  FileText,
  ShoppingCart,
  CreditCard,
  Loader2,
  Globe,
} from 'lucide-react';
import { getStoredMerchant } from '@/lib/auth';
import CreateBillModal from '../components/CreateBillModal'; // ✅ Import the modal

// ─── Types ──────────────────────────────────────────────────────────
interface Bill {
  id: string;
  bill_id: string;
  merchant_id: string;
  business_name: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  amount: number;
  currency: string;
  description: string;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED' | 'PROCESSING';
  created_at: string;
}

export default function SmartBillPages() {
  const router = useRouter();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // ✅ NEW: State to control the modal popup
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ─── Fetch Bills ──────────────────────────────────────────────────
  const fetchBills = async () => {
    const merchantData = getStoredMerchant();
    const merchantId = merchantData?.merchantId || merchantData?.merchant_id || '';

    if (!merchantId) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/bills/merchant?merchantId=${merchantId}`);
      const data = await response.json();
      if (data.success) {
        setBills(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const filteredBills = bills.filter(
    (bill) =>
      bill.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.bill_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.customer_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'PAID': return <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />;
      case 'PROCESSING': return <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />;
      case 'EXPIRED': return <span className="w-2.5 h-2.5 rounded-full bg-red-500" />;
      default: return <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      
      {/* ─── TOP BAR ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Pages</h1>
          <p className="text-sm text-gray-500">Manage your payment links and product pages.</p>
        </div>
        
        {/* ✅ UPDATED: Opens the Modal instead of redirecting directly */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Page
        </button>
      </div>

      {/* ─── FILTERS & SEARCH ──────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Filters</span>
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search pages"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* ─── TABLE ──────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12"></th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Link</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Globe className="w-10 h-10 text-gray-300" />
                      <p className="text-gray-500 font-medium">No pages created yet</p>
                      <p className="text-sm text-gray-400">Create your first payment page</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => (
                  <tr key={bill.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors group">
                    
                    {/* Status Dot */}
                    <td className="px-6 py-4">
                      {getStatusDot(bill.status)}
                    </td>

                    {/* Name */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{bill.customer_name}</span>
                        <span className="text-xs text-gray-400">{bill.bill_id}</span>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-gray-200 text-gray-600 bg-white">
                        Payment
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4 text-gray-900">
                      {formatCurrency(Number(bill.amount))}
                    </td>

                    {/* Created */}
                    <td className="px-6 py-4 text-gray-500">
                      {formatDate(bill.created_at)}
                    </td>

                    {/* Link */}
                    <td className="px-6 py-4">
                      <Link 
                        href={`/bill/${bill.bill_id}`} 
                        target="_blank"
                        className="text-indigo-600 hover:text-indigo-700 hover:underline text-sm font-medium flex items-center gap-1 w-fit"
                      >
                        Preview <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✅ ADD THIS AT THE BOTTOM: The Creation Modal */}
      <CreateBillModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}