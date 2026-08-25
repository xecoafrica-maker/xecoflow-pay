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
  File,
  Package,
} from 'lucide-react';
import { getStoredMerchant } from '@/lib/auth';
import CreateBillModal from '../components/CreateBillModal';

// ─── Types ──────────────────────────────────────────────────────────
interface PageItem {
  id: string;
  page_id: string;        // bill_id or product_id
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
  page_type: 'bill' | 'product';  // ✅ NEW: Distinguish between bill and product
  file_url?: string;              // ✅ For products
  file_name?: string;             // ✅ For products
}

export default function SmartBillPages() {
  const router = useRouter();
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ─── Fetch Bills & Products ──────────────────────────────────────
  const fetchPages = async () => {
    const merchantData = getStoredMerchant();
    const merchantId = merchantData?.merchantId || merchantData?.merchant_id || '';

    if (!merchantId) {
      setLoading(false);
      return;
    }

    try {
      // ─── Fetch Bills ──────────────────────────────────────────────
      const billsRes = await fetch(`/api/bills/merchant?merchantId=${merchantId}`);
      const billsData = await billsRes.json();
      const bills = (billsData.data || [])
        .filter((b: any) => !b.bill_id?.startsWith('PROD-')) // Exclude products from bills
        .map((b: any) => ({
          ...b,
          page_type: 'bill' as const,
          page_id: b.bill_id,
        }));

      // ─── Fetch Products ────────────────────────────────────────────
      // Option 1: If you have a separate API endpoint
      // const productsRes = await fetch(`/api/products/merchant?merchantId=${merchantId}`);
      // const productsData = await productsRes.json();

      // Option 2: Filter from bills where bill_id starts with 'PROD-'
      const allBillsRes = await fetch(`/api/bills/merchant?merchantId=${merchantId}`);
      const allBillsData = await allBillsRes.json();
      const products = (allBillsData.data || [])
        .filter((b: any) => b.bill_id?.startsWith('PROD-'))
        .map((b: any) => ({
          ...b,
          page_type: 'product' as const,
          page_id: b.bill_id,
        }));

      // ─── Combine and sort ─────────────────────────────────────────
      const allPages = [...bills, ...products].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setPages(allPages);
    } catch (error) {
      console.error('Error fetching pages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const filteredPages = pages.filter(
    (page) =>
      page.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.page_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.customer_email?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'product':
        return <Package className="w-3 h-3" />;
      case 'bill':
      default:
        return <FileText className="w-3 h-3" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'product':
        return 'Product';
      case 'bill':
      default:
        return 'Bill';
    }
  };

  // ─── Get the correct preview URL ──────────────────────────────────
  const getPreviewUrl = (page: PageItem) => {
    if (page.page_type === 'product') {
      // Products use /p/ with the slug (description field)
      return `/p/${page.description || page.page_id}`;
    }
    // Bills use /bill/ with bill_id
    return `/bill/${page.page_id}`;
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
              {filteredPages.length === 0 ? (
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
                filteredPages.map((page) => (
                  <tr key={page.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors group">
                    
                    {/* Status Dot */}
                    <td className="px-6 py-4">
                      {getStatusDot(page.status)}
                    </td>

                    {/* Name */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">
                          {page.page_type === 'product' ? page.description || page.customer_name : page.customer_name}
                        </span>
                        <span className="text-xs text-gray-400">{page.page_id}</span>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        page.page_type === 'product' 
                          ? 'border-purple-200 text-purple-700 bg-purple-50' 
                          : 'border-gray-200 text-gray-600 bg-white'
                      }`}>
                        {getTypeIcon(page.page_type)}
                        {getTypeLabel(page.page_type)}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4 text-gray-900">
                      {formatCurrency(Number(page.amount))}
                    </td>

                    {/* Created */}
                    <td className="px-6 py-4 text-gray-500">
                      {formatDate(page.created_at)}
                    </td>

                    {/* Link */}
                    <td className="px-6 py-4">
                      <Link 
                        href={getPreviewUrl(page)} 
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

      {/* ─── Creation Modal ─────────────────────────────────────────── */}
      <CreateBillModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}