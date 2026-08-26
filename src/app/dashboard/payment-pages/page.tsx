'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Search,
  Globe,
  CreditCard,
  Link2,
  Copy,
  Check,
  Eye,
  MoreHorizontal,
  Loader2,
  Calendar,
} from 'lucide-react';
import { getStoredMerchant, getToken } from '@/lib/auth';

interface PaymentPage {
  id: string;
  name: string;
  description: string;
  slug: string;
  amountType: 'fixed' | 'open';
  amount: number;
  currency: string;
  status: 'active' | 'inactive';
  createdAt: string;
  totalPayments: number;
  totalAmount: number;
}

export default function PaymentPagesList() {
  const router = useRouter();
  const [pages, setPages] = useState<PaymentPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const merchantData = getStoredMerchant();

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const token = getToken();
      const response = await fetch('/api/payment-pages', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setPages(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching payment pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (slug: string) => {
    const link = `${window.location.origin}/pay/${slug}`;
    await navigator.clipboard.writeText(link);
    setCopiedId(slug);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredPages = pages.filter(
    (page) =>
      page.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* ─── Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Pages</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your custom payment pages</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/payment-pages/create')}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-sm shadow-indigo-200"
        >
          <Plus className="w-4 h-4" />
          Create Payment Page
        </button>
      </div>

      {/* ─── Search ───────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search payment pages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* ─── Empty State ─────────────────────────────────────────────── */}
      {filteredPages.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Globe className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No payment pages yet</h3>
          <p className="text-sm text-gray-500 mt-1">Create your first payment page to accept payments</p>
          <button
            onClick={() => router.push('/dashboard/payment-pages/create')}
            className="mt-4 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Payment Page
          </button>
        </div>
      ) : (
        // ─── Table ─────────────────────────────────────────────────────
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payments
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPages.map((page) => (
                  <tr key={page.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{page.name}</p>
                          <p className="text-xs text-gray-400">/{page.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {page.amountType === 'fixed' ? (
                        <span className="font-medium text-gray-900">{formatCurrency(page.amount)}</span>
                      ) : (
                        <span className="text-gray-500 text-xs bg-gray-100 px-2 py-0.5 rounded-full">Open</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {formatDate(page.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{page.totalPayments || 0}</span>
                        <span className="text-xs text-gray-400">
                          ({formatCurrency(page.totalAmount || 0)})
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ● Active
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => copyToClipboard(page.slug)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                          title="Copy link"
                        >
                          {copiedId === page.slug ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <Link
                          href={`/pay/${page.slug}`}
                          target="_blank"
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                          title="View page"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/dashboard/payment-pages/${page.id}/edit`}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                          title="Edit"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}