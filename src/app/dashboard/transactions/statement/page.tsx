// src/app/dashboard/transactions/statement/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Download,
  FileText,
  Calendar,
  Printer,
  Mail,
  CheckCircle,
  FileSpreadsheet,
  File,
  Loader2,
  Building,
} from 'lucide-react';
import { getStoredMerchant } from '@/lib/auth';
import { useActivityLogger } from '@/hooks/useActivityLogger';

// ─── Types ──────────────────────────────────────────────────────────
interface MerchantProfile {
  merchant_id: number;
  business_name: string;
  email: string;
  phone?: string;
  settlement_phone?: string;
  status: string;
  created_at: string;
}

interface StatementTransaction {
  id: string;
  receipt: string;
  date: string;
  details: string;
  status: 'Completed';
  paidIn: number;
  withdrawn: number;
  source: 'INFLOW' | 'OUTFLOW' | 'WALLET';
}

// ─── Status derivation (same as Inflow/Outflow) ─────────────────────
const COMPLETED_KEYWORDS = ['COMPLETED', 'SUCCESS', 'SETTLED', 'PAID', 'POSTED'];
const FAILED_KEYWORDS = ['FAILED', 'ERROR', 'DECLINED', 'CANCELLED', 'CANCELED', 'REVERSED'];
const PENDING_KEYWORDS = ['PENDING', 'AWAITING', 'PROCESSING', 'INITIATED'];

const deriveStatus = (raw: string): 'Completed' | 'Pending' | 'Failed' => {
  const s = (raw || '').toUpperCase();
  if (FAILED_KEYWORDS.some((k) => s.includes(k))) return 'Failed';
  if (COMPLETED_KEYWORDS.some((k) => s.includes(k))) return 'Completed';
  if (PENDING_KEYWORDS.some((k) => s.includes(k))) return 'Pending';
  return 'Pending';
};

// ─── Format Options ──────────────────────────────────────────────────
const formatOptions = [
  { value: 'pdf', label: 'PDF', icon: File },
  { value: 'csv', label: 'CSV', icon: FileSpreadsheet },
  { value: 'excel', label: 'Excel', icon: FileSpreadsheet },
];

const periodOptions = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'custom', label: 'Custom Range' },
];

// ─── Skeleton Components ─────────────────────────────────────────────
const SkeletonBlock = ({ className = '' }: { className?: string }) => (
  <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
);

export default function StatementPage() {
  const router = useRouter();
  const { log, ActivityActions } = useActivityLogger();
  const [merchant, setMerchant] = useState<MerchantProfile | null>(null);
  const [transactions, setTransactions] = useState<StatementTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    period: 'month',
    startDate: '',
    endDate: '',
    format: 'pdf',
    includeInflow: true,
    includeOutflow: true,
    includeWallet: true,
  });

  const hasLoggedView = useRef(false);
  const isLoggingView = useRef(false);

  // ─── Fetch Merchant and All Transactions ──────────────────────────
  const fetchData = async () => {
    try {
      // ✅ Same session method as all other pages
      const cached = getStoredMerchant();
      const merchantId = cached?.merchant_id || cached?.merchantId;

      if (!merchantId) {
        console.warn('No merchant found in localStorage');
        router.push('/login?session=expired');
        return;
      }

      // Build merchant profile from cache
      const merchantData: MerchantProfile = {
        merchant_id: Number(merchantId),
        business_name: cached?.business_name || cached?.businessName || '',
        email: cached?.email || '',
        phone: cached?.phone || '',
        settlement_phone: cached?.phone || '',
        status: cached?.status || 'Active',
        created_at: cached?.created_at || new Date().toISOString(),
      };
      setMerchant(merchantData);

      // Account number for ledger lookups — same format as Wallet page
      const paddedId = String(merchantId).padStart(8, '0');
      const accountNumber = `1-1001-${paddedId}`;

      const params = new URLSearchParams();
      params.append('merchantId', String(merchantId));
      params.append('limit', '1000');

      // ✅ Pull from the three real endpoints
      const [inflowRes, outflowRes, walletRes] = await Promise.allSettled([
        fetch(`/api/transactions/inflow?${params.toString()}`, { credentials: 'include' }),
        fetch(`/api/transactions/outflow?${params.toString()}`, { credentials: 'include' }),
        fetch(`/api/ledger/accounts/${accountNumber}/entries`, { credentials: 'include' }),
      ]);

      const inflowData =
        inflowRes.status === 'fulfilled' && inflowRes.value.ok
          ? await inflowRes.value.json()
          : { success: false, data: [] };

      const outflowData =
        outflowRes.status === 'fulfilled' && outflowRes.value.ok
          ? await outflowRes.value.json()
          : { success: false, data: [] };

      const walletData =
        walletRes.status === 'fulfilled' && walletRes.value.ok
          ? await walletRes.value.json()
          : { success: false, data: [] };

      // ─── Normalize each source ─────────────────────────────────
      const normalized: StatementTransaction[] = [];
      const seenReceipts = new Set<string>();

      // Inflow (STK + C2B credits)
      if (inflowData.success) {
        for (const item of inflowData.data || []) {
          const status = deriveStatus(item.status || item.payment_status || '');
          if (status !== 'Completed') continue;

          const receipt =
            item.mpesa_receipt || item.checkout_id?.slice(0, 12) || item.id?.slice(0, 8) || '—';

          if (receipt !== '—') seenReceipts.add(receipt);

          normalized.push({
            id: item.id,
            receipt,
            date: item.created_at,
            details: `Inflow - ${item.request_type || 'Payment'}${
              item.phone_number ? ` - ${item.phone_number}` : ''
            }`,
            status: 'Completed',
            paidIn: Number(item.amount) || 0,
            withdrawn: 0,
            source: 'INFLOW',
          });
        }
      }

      // Outflow (B2C withdrawals)
      if (outflowData.success) {
        for (const item of outflowData.data || []) {
          const status = deriveStatus(item.status || '');
          if (status !== 'Completed') continue;

          const receipt = item.mpesa_receipt || item.transaction_id || item.id?.slice(0, 8) || '—';
          if (receipt !== '—') seenReceipts.add(receipt);

          normalized.push({
            id: item.id,
            receipt,
            date: item.created_at,
            details: `Outflow - ${item.receiver_name || item.phone_number || 'Withdrawal'}`,
            status: 'Completed',
            paidIn: 0,
            withdrawn: Number(item.amount) || 0,
            source: 'OUTFLOW',
          });
        }
      }

      // Wallet (journal_entries) — skip receipts we already have
      if (walletData.success) {
        for (const item of walletData.data || []) {
          const status = deriveStatus(item.status || '');
          if (status !== 'Completed') continue;

          const receipt = item.reference_id || item.id?.slice(0, 8) || '—';
          if (receipt !== '—' && seenReceipts.has(receipt)) continue;
          if (receipt !== '—') seenReceipts.add(receipt);

          const isCredit = (item.entry_type || '').toUpperCase() === 'CREDIT';
          const desc = item.description || (isCredit ? 'Wallet credit' : 'Wallet debit');

          normalized.push({
            id: item.id,
            receipt,
            date: item.created_at,
            details: `Wallet - ${desc}`,
            status: 'Completed',
            paidIn: isCredit ? Number(item.amount) || 0 : 0,
            withdrawn: !isCredit ? Number(item.amount) || 0 : 0,
            source: 'WALLET',
          });
        }
      }

      // Sort newest first
      normalized.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setTransactions(normalized);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  // ─── Auth ─────────────────────────────────────────────────────────
  useEffect(() => {
    const cached = getStoredMerchant();
    const merchantId = cached?.merchant_id || cached?.merchantId;

    if (!merchantId) {
      console.warn('No merchant found, redirecting to login');
      router.push('/login?session=expired');
      return;
    }

    fetchData();
  }, [router]);

  // ─── Log View ──────────────────────────────────────────────────────
  useEffect(() => {
    const logView = async () => {
      if (isLoggingView.current || hasLoggedView.current || loading) return;

      try {
        isLoggingView.current = true;
        const merchantName = merchant?.business_name || 'business';
        await log(
          ActivityActions.GENERATE_STATEMENT,
          `Viewed statement page for ${merchantName}`
        );
        hasLoggedView.current = true;
      } catch (error) {
        console.debug('Statement view logging skipped:', error);
      } finally {
        isLoggingView.current = false;
      }
    };

    if (!loading && !hasLoggedView.current) {
      logView();
    }
  }, [loading, merchant, log, ActivityActions.GENERATE_STATEMENT]);

  // ─── Generate PDF Statement ────────────────────────────────────────
  const generatePDF = (data: any) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = 25;

    const primaryColor: [number, number, number] = [16, 185, 129];
    const darkColor: [number, number, number] = [10, 37, 64];
    const grayColor: [number, number, number] = [107, 114, 128];
    const lightGray: [number, number, number] = [249, 250, 251];
    const borderColor: [number, number, number] = [229, 231, 235];
    const redColor: [number, number, number] = [239, 68, 68];
    const blueColor: [number, number, number] = [37, 99, 235];
    const amberColor: [number, number, number] = [245, 158, 11];
    const whiteColor: [number, number, number] = [255, 255, 255];

    // ─── Header with Logo ───────────────────────────────────────────
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text('Xeco', margin, yPos);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Flow', margin + 38, yPos);

    yPos += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text('Secure Payment Solutions', margin, yPos);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text('Transaction Statement', pageWidth - margin - 40, yPos - 2);

    yPos += 8;
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(1);
    doc.line(margin, yPos, pageWidth - margin, yPos);

    yPos += 1.5;
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // ─── Merchant Info ──────────────────────────────────────────────
    const merchantName = data.merchant?.business_name || 'N/A';
    const merchantPhone = data.merchant?.phone || data.merchant?.settlement_phone || 'N/A';
    const merchantEmail = data.merchant?.email || 'N/A';
    const startDate = new Date(data.period.start).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    const endDate = new Date(data.period.end).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const infoItems = [
      { label: 'Customer Name', value: merchantName },
      { label: 'Mobile Number', value: merchantPhone },
      { label: 'Email Address', value: merchantEmail },
      { label: 'Statement Period', value: `${startDate} - ${endDate}` },
    ];

    const boxWidth = (pageWidth - margin * 2) / 2;
    const boxHeight = 14;

    infoItems.forEach((item, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = margin + col * (boxWidth + 4);
      const y = yPos + row * (boxHeight + 4);

      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.roundedRect(x, y, boxWidth, boxHeight, 2, 2, 'F');

      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.setLineWidth(0.2);
      doc.roundedRect(x, y, boxWidth, boxHeight, 2, 2, 'S');

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text(item.label, x + 5, y + 4);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text(item.value, x + 5, y + 10);
    });

    yPos += (infoItems.length / 2) * (boxHeight + 4) + 10;

    // ─── Summary Cards ──────────────────────────────────────────────
    const summaries = [
      { label: 'Total Inflow', value: `KES ${data.summary.totalInflow.toFixed(2)}`, color: primaryColor },
      { label: 'Total Outflow', value: `KES ${data.summary.totalOutflow.toFixed(2)}`, color: redColor },
      { label: 'Net Balance', value: `KES ${data.summary.netBalance.toFixed(2)}`, color: blueColor },
      { label: 'Total Transactions', value: data.summary.totalTransactions.toString(), color: darkColor },
    ];

    const cardWidth = (pageWidth - margin * 2 - 12) / 4;
    const cardHeight = 22;

    summaries.forEach((item, index) => {
      const x = margin + index * (cardWidth + 4);

      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.roundedRect(x, yPos, cardWidth, cardHeight, 3, 3, 'F');

      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.setLineWidth(0.2);
      doc.roundedRect(x, yPos, cardWidth, cardHeight, 3, 3, 'S');

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text(item.label, x + 4, yPos + 6);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(item.color[0], item.color[1], item.color[2]);
      doc.text(item.value, x + 4, yPos + 17);
    });

    yPos += cardHeight + 10;

    // ─── Status Badges (Completed only, per statement policy) ───────
    const statuses = [
      { label: 'Completed', count: data.summary.completedCount, color: primaryColor },
    ];

    const statusWidth = pageWidth - margin * 2;
    statuses.forEach((item) => {
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.roundedRect(margin, yPos, statusWidth, 10, 2, 2, 'F');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text(`${item.label}: ${item.count}`, margin + 4, yPos + 7);
    });

    yPos += 14;

    // ─── Detailed Statement Table ──────────────────────────────────
    const tableHeaders = ['Receipt No.', 'Date & Time', 'Details', 'Status', 'Paid In', 'Paid Out'];
    const tableRows = data.transactions.map((tx: any) => {
      const paidIn = tx.paidIn > 0 ? `KES ${tx.paidIn.toFixed(2)}` : '-';
      const paidOut = tx.withdrawn > 0 ? `KES ${tx.withdrawn.toFixed(2)}` : '-';

      return [
        tx.receipt,
        new Date(tx.date).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        tx.details,
        tx.status,
        paidIn,
        paidOut,
      ];
    });

    let totalPages = 1;

    autoTable(doc, {
      startY: yPos,
      head: [tableHeaders],
      body:
        tableRows.length > 0
          ? tableRows
          : [['No completed transactions for this period', '', '', '', '', '']],
      theme: 'striped',
      headStyles: {
        fillColor: darkColor,
        textColor: whiteColor,
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'left',
        valign: 'middle',
      },
      styles: {
        fontSize: 7,
        cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
        valign: 'middle',
      },
      alternateRowStyles: {
        fillColor: lightGray,
      },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 42 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 22 },
        4: { cellWidth: 28, halign: 'right' },
        5: { cellWidth: 28, halign: 'right' },
      },
      margin: { left: margin, right: margin },
      didDrawPage: (data) => {
        const footerY = pageHeight - 12;
        const currentPage = data.pageNumber;

        totalPages = Math.max(totalPages, currentPage);

        doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        doc.setLineWidth(0.3);
        doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text(`Generated: ${new Date().toLocaleString()}`, margin, footerY + 2);
        doc.text('XecoFlow - Secure Payment Solutions', pageWidth - margin - 55, footerY + 2);
        doc.text(`Page ${currentPage} of ${totalPages}`, pageWidth / 2, footerY + 2, { align: 'center' });
      },
    });

    doc.save(`statement-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // ─── Build Statement Data ─────────────────────────────────────────
  const buildStatementData = () => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (formData.period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(1);
        break;
      case 'last-month':
        startDate.setMonth(now.getMonth() - 1);
        startDate.setDate(1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'quarter': {
        const quarter = Math.floor(now.getMonth() / 3);
        startDate.setMonth(quarter * 3, 1);
        break;
      }
      case 'custom':
        if (formData.startDate) startDate = new Date(formData.startDate);
        if (formData.endDate) endDate = new Date(formData.endDate);
        break;
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // ─── Apply period + source filters ────────────────────────────
    const filtered = transactions.filter((t) => {
      const date = new Date(t.date);
      if (date < startDate || date > endDate) return false;

      if (t.source === 'INFLOW' && !formData.includeInflow) return false;
      if (t.source === 'OUTFLOW' && !formData.includeOutflow) return false;
      if (t.source === 'WALLET' && !formData.includeWallet) return false;

      return true;
    });

    let totalInflow = 0;
    let totalOutflow = 0;

    filtered.forEach((t) => {
      totalInflow += t.paidIn;
      totalOutflow += t.withdrawn;
    });

    const summary = {
      totalInflow,
      totalOutflow,
      netBalance: totalInflow - totalOutflow,
      totalTransactions: filtered.length,
      completedCount: filtered.length, // all rows are Completed by construction
      pendingCount: 0,
      failedCount: 0,
    };

    return {
      merchant,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      summary,
      transactions: filtered,
    };
  };

  // ─── Handle Generate ──────────────────────────────────────────────
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);

    await log(
      ActivityActions.GENERATE_STATEMENT,
      `Generating statement for period: ${formData.period}`
    );

    setTimeout(() => {
      const statement = buildStatementData();
      setGenerating(false);
      setShowSuccess(true);

      generatePDF(statement);

      setTimeout(() => setShowSuccess(false), 5000);
    }, 1500);
  };

  // ─── Loading Skeleton ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto space-y-6 px-4 sm:px-6">
        {/* Header skeleton */}
        <div className="flex items-center gap-3">
          <SkeletonBlock className="w-10 h-10 rounded-xl" />
          <div>
            <SkeletonBlock className="h-6 w-56 mb-2" />
            <SkeletonBlock className="h-4 w-80" />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Form skeleton */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
            <SkeletonBlock className="h-6 w-40" />
            <div className="space-y-2">
              <SkeletonBlock className="h-4 w-20" />
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <SkeletonBlock key={i} className="h-10 rounded-lg" />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <SkeletonBlock className="h-4 w-20" />
              <div className="flex gap-3">
                {[1, 2, 3].map((i) => (
                  <SkeletonBlock key={i} className="h-10 w-28 rounded-xl" />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <SkeletonBlock className="h-4 w-40" />
              <SkeletonBlock className="h-4 w-56" />
              <SkeletonBlock className="h-4 w-56" />
              <SkeletonBlock className="h-4 w-56" />
            </div>
            <SkeletonBlock className="h-12 w-full rounded-xl" />
          </div>

          {/* Sidebar skeleton */}
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-3">
              <SkeletonBlock className="h-4 w-32" />
              <SkeletonBlock className="h-10 rounded-xl" />
              <SkeletonBlock className="h-10 rounded-xl" />
            </div>
            <SkeletonBlock className="h-20 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-sm shadow-emerald-200">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Generate Statement</h1>
              <p className="text-sm text-gray-500">
                Request and download your transaction statement as PDF
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Statement Request Form ────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Statement Details</h2>

          <form onSubmit={handleGenerate} className="space-y-5">
            {/* Period Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Period</label>
              <div className="grid grid-cols-3 gap-2">
                {periodOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, period: option.value })}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      formData.period === option.value
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date Range */}
            {formData.period === 'custom' && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Format</label>
              <div className="flex gap-3">
                {formatOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, format: option.value })}
                    className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                      formData.format === option.value
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <option.icon className="w-4 h-4" />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Include Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Include in Statement
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.includeInflow}
                    onChange={(e) => setFormData({ ...formData, includeInflow: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">Inflow Transactions</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.includeOutflow}
                    onChange={(e) => setFormData({ ...formData, includeOutflow: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">Outflow Transactions</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.includeWallet}
                    onChange={(e) => setFormData({ ...formData, includeWallet: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">Wallet Transactions</span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={generating}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-sm shadow-emerald-200 flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download PDF Statement
                </>
              )}
            </button>

            {/* Success Message */}
            {showSuccess && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                PDF generated successfully! Downloading...
              </div>
            )}
          </form>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full py-2.5 px-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-medium text-gray-700 transition-all flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                Email Statement
              </button>
              <button className="w-2.5 px-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-medium text-gray-700 transition-all flex items-center gap-3"></button>
              <button className="w-full py-2.5 px-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-medium text-gray-700 transition-all flex items-center gap-3">
                <FileText className="w-4 h-4 text-gray-400" />
                View Sample
              </button>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <p className="text-sm text-emerald-800 font-medium">💡 Tip</p>
            <p className="text-xs text-emerald-700 mt-1">
              Your statement will be downloaded as a professional PDF file.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}