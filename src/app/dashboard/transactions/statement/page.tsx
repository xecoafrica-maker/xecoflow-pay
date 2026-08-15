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
import { getToken, getStoredMerchant } from '@/lib/auth';
import { getMerchantProfile } from '@/lib/auth-api';
import { useActivityLogger } from '@/hooks/useActivityLogger';

// ─── Types ──────────────────────────────────────────────────────────
interface Transaction {
  id: string;
  user_id: string;
  amount: string;
  phone_number: string;
  business_shortcode: string;
  status: string;
  payment_status: string;
  source: string;
  request_type: string;
  checkout_id: string;
  mpesa_receipt: string | null;
  result_code: string | null;
  result_desc: string | null;
  created_at: string;
  completed_at: string | null;
  updated_at: string;
}

interface MerchantProfile {
  merchant_id: number;
  business_name: string;
  email: string;
  phone?: string;
  settlement_phone?: string;
  status: string;
  created_at: string;
}

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

export default function StatementPage() {
  const router = useRouter();
  const { log, ActivityActions } = useActivityLogger();
  const [merchant, setMerchant] = useState<MerchantProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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

  // ✅ Prevent duplicate logging
  const hasLoggedView = useRef(false);
  const isLoggingView = useRef(false);

  // ─── Fetch Merchant and All Transactions ──────────────────────────
  const fetchData = async () => {
    try {
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const cached = getStoredMerchant();
      let merchantId = cached?.merchant_id || cached?.merchantId;

      if (!merchantId) {
        const profile = await getMerchantProfile(token);
        if (profile) {
          const merchantData: MerchantProfile = {
            merchant_id: profile.merchant_id,
            business_name: profile.business_name,
            email: profile.email,
            phone: profile.phone || profile.settlement_phone || '',
            settlement_phone: profile.settlement_phone || profile.phone || '',
            status: profile.status,
            created_at: profile.created_at,
          };
          setMerchant(merchantData);
          merchantId = profile.merchant_id;
          localStorage.setItem('merchant', JSON.stringify(merchantData));
        }
      } else {
        try {
          const profile = await getMerchantProfile(token);
          if (profile) {
            const merchantData: MerchantProfile = {
              merchant_id: profile.merchant_id,
              business_name: profile.business_name,
              email: profile.email,
              phone: profile.phone || profile.settlement_phone || '',
              settlement_phone: profile.settlement_phone || profile.phone || '',
              status: profile.status,
              created_at: profile.created_at,
            };
            setMerchant(merchantData);
          } else if (cached) {
            const merchantData: MerchantProfile = {
              merchant_id: cached.merchant_id || cached.merchantId,
              business_name: cached.business_name || cached.businessName || '',
              email: cached.email || '',
              phone: cached.phone || '',
              settlement_phone: cached.phone || '',
              status: cached.status || 'Active',
              created_at: new Date().toISOString(),
            };
            setMerchant(merchantData);
          }
        } catch (err) {
          console.error('Error fetching profile:', err);
          if (cached) {
            const merchantData: MerchantProfile = {
              merchant_id: cached.merchant_id || cached.merchantId,
              business_name: cached.business_name || cached.businessName || '',
              email: cached.email || '',
              phone: cached.phone || '',
              settlement_phone: cached.phone || '',
              status: cached.status || 'Active',
              created_at: new Date().toISOString(),
            };
            setMerchant(merchantData);
          }
        }
      }

      if (merchantId) {
        const params = new URLSearchParams();
        params.append('merchantId', String(merchantId));
        params.append('limit', '500');

        // ─── Fetch all transaction types ────────────────────────────
        const responses = await Promise.all([
          fetch(`/api/transactions?${params.toString()}`),
          fetch(`/api/b2c-transactions?${params.toString()}`),
          fetch(`/api/c2b-transactions?${params.toString()}`),
        ]);

        const allData = await Promise.all(responses.map(r => r.json()));
        
        // Combine all transactions
        let allTransactions: Transaction[] = [];
        
        allData.forEach((data) => {
          if (data.success) {
            allTransactions = [...allTransactions, ...(data.data || [])];
          }
        });

        // Sort by created_at (newest first)
        allTransactions.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setTransactions(allTransactions);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  // ─── Log View - Only once per page visit ──────────────────────
  useEffect(() => {
    const logView = async () => {
      if (isLoggingView.current || hasLoggedView.current || loading) {
        return;
      }
      
      try {
        isLoggingView.current = true;
        
        const merchantName = merchant?.business_name || 'business';
        await log(
          ActivityActions.GENERATE_STATEMENT,
          `Viewed statement page for ${merchantName}`
        );
        hasLoggedView.current = true;
        console.log('✅ Statement page view logged');
      } catch (error) {
        console.debug('Statement view logging skipped:', error);
      } finally {
        isLoggingView.current = false;
      }
    };
    
    if (!loading && !hasLoggedView.current) {
      logView();
    }
  }, [loading, merchant, log]);

  // ─── Generate PDF Statement ────────────────────────────────────────
  const generatePDF = (data: any) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = 25;

    // ─── Colors ──────────────────────────────────────────────────────
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
    
    // Tagline
    yPos += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text('Secure Payment Solutions', margin, yPos);
    
    // Statement label - right aligned
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text('Transaction Statement', pageWidth - margin - 40, yPos - 2);
    
    // Decorative line
    yPos += 8;
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(1);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    
    // Thin line below
    yPos += 1.5;
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // ─── Merchant Info ──────────────────────────────────────────────
    const merchantName = data.merchant?.business_name || 'N/A';
    const merchantPhone = data.merchant?.phone || data.merchant?.settlement_phone || 'N/A';
    const merchantEmail = data.merchant?.email || 'N/A';
    const startDate = new Date(data.period.start).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const endDate = new Date(data.period.end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

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

    // ─── Status Badges ──────────────────────────────────────────────
    const statuses = [
      { label: 'Completed', count: data.summary.completedCount, color: primaryColor },
      { label: 'Pending', count: data.summary.pendingCount, color: amberColor },
      { label: 'Failed', count: data.summary.failedCount, color: redColor },
    ];

    const statusWidth = (pageWidth - margin * 2 - 8) / 3;
    statuses.forEach((item, index) => {
      const x = margin + index * (statusWidth + 4);
      
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.roundedRect(x, yPos, statusWidth, 10, 2, 2, 'F');
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text(`${item.label}: ${item.count}`, x + 4, yPos + 7);
    });

    yPos += 14;

    // ─── Detailed Statement Table ──────────────────────────────────
    const tableHeaders = ['Receipt No.', 'Date & Time', 'Details', 'Status', 'Paid In', 'Paid Out'];
    const tableRows = data.transactions.map((tx: any) => {
      let statusDisplay = tx.status || 'PENDING';
      const statusUpper = statusDisplay.toUpperCase();
      if (statusUpper.includes('COMPLETED') || statusUpper.includes('SUCCESS')) {
        statusDisplay = 'Completed';
      } else if (statusUpper.includes('PENDING') || statusUpper.includes('AWAITING')) {
        statusDisplay = 'Pending';
      } else if (statusUpper.includes('FAILED') || statusUpper.includes('ERROR')) {
        statusDisplay = 'Failed';
      }
      
      const isPaidIn = tx.paidIn > 0;
      const paidIn = isPaidIn ? `KES ${tx.paidIn.toFixed(2)}` : '-';
      const paidOut = !isPaidIn && tx.withdrawn > 0 ? `KES ${tx.withdrawn.toFixed(2)}` : '-';
      
      return [
        tx.receipt,
        new Date(tx.date).toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        tx.details,
        statusDisplay,
        paidIn,
        paidOut,
      ];
    });

    let totalPages = 1;

    autoTable(doc, {
      startY: yPos,
      head: [tableHeaders],
      body: tableRows.length > 0 ? tableRows : [['No transactions found for this period', '', '', '', '', '']],
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
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate.setMonth(quarter * 3, 1);
        break;
      case 'custom':
        if (formData.startDate) startDate = new Date(formData.startDate);
        if (formData.endDate) endDate = new Date(formData.endDate);
        break;
    }

    const filtered = transactions.filter(t => {
      const date = new Date(t.created_at);
      return date >= startDate && date <= endDate;
    });

    let totalInflow = 0;
    let totalOutflow = 0;
    let completedCount = 0;
    let pendingCount = 0;
    let failedCount = 0;

    filtered.forEach(t => {
      const amount = parseFloat(t.amount) || 0;
      const status = t.status?.toUpperCase() || t.payment_status?.toUpperCase() || '';
      
      // Determine if inflow or outflow
      if (t.source?.toUpperCase() === 'EXTERNAL' || 
          t.request_type?.toUpperCase().includes('RECEIVE') ||
          t.request_type?.toUpperCase().includes('C2B')) {
        totalInflow += amount;
      } else {
        totalOutflow += amount;
      }

      if (status.includes('COMPLETED') || status.includes('SUCCESS')) {
        completedCount++;
      } else if (status.includes('PENDING') || status.includes('AWAITING')) {
        pendingCount++;
      } else if (status.includes('FAILED') || status.includes('ERROR')) {
        failedCount++;
      }
    });

    const summary = {
      totalInflow,
      totalOutflow,
      netBalance: totalInflow - totalOutflow,
      totalTransactions: filtered.length,
      completedCount,
      pendingCount,
      failedCount,
    };

    return {
      merchant,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      summary,
      transactions: filtered.map(t => {
        const isInflow = t.source?.toUpperCase() === 'EXTERNAL' || 
                         t.request_type?.toUpperCase().includes('RECEIVE') ||
                         t.request_type?.toUpperCase().includes('C2B');
        const amount = parseFloat(t.amount) || 0;
        
        return {
          id: t.id,
          receipt: t.mpesa_receipt || t.checkout_id?.slice(0, 10) || t.id.slice(0, 8),
          date: t.created_at,
          details: `${t.request_type || 'Payment'} - ${t.phone_number || t.user_id || ''}`,
          status: t.status || t.payment_status || 'PENDING',
          paidIn: isInflow ? amount : 0,
          withdrawn: !isInflow ? amount : 0,
          balance: 0,
        };
      }),
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

  // ─── Loading State ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading statement data...</p>
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
              <p className="text-sm text-gray-500">Request and download your transaction statement as PDF</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Include in Statement</label>
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
              <button className="w-full py-2.5 px-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-medium text-gray-700 transition-all flex items-center gap-3">
                <FileText className="w-4 h-4 text-gray-400" />
                View Sample
              </button>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <p className="text-sm text-emerald-800 font-medium">💡 Tip</p>
            <p className="text-xs text-emerald-700 mt-1">
              Your statement will be downloaded as a professional PDF file with all transaction details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}