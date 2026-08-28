'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  Printer,
  Share2,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { getStoredMerchant, getToken } from '@/lib/auth';
import { getMerchantProfile } from '@/lib/auth-api';

interface MerchantData {
  businessName: string;
  virtualAccount: string;
  shortcode: string;
  merchantId: string;
}

export default function AutomatedPayBillPage() {
  const router = useRouter();
  const posterRef = useRef<HTMLDivElement>(null);

  const [merchant, setMerchant] = useState<MerchantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const GREEN = '#0D9488'; // teal — fintech
  const NAVY = '#0f172a';
  const ACCENT = '#10B981';

  useEffect(() => {
    const fetchMerchantData = async () => {
      try {
        const token = getToken();
        if (!token) {
          router.push('/login');
          return;
        }
        const profile = await getMerchantProfile(token);
        const stored = getStoredMerchant();
        const merchantId =
          profile?.merchant_id || stored?.merchantId || stored?.merchant_id || '';

        setMerchant({
          businessName:
            profile?.business_name ||
            stored?.businessName ||
            stored?.business_name ||
            'Xeco BIZ Account',
          virtualAccount: String(merchantId),
          shortcode: '4049263',
          merchantId: String(merchantId),
        });
      } catch {
        const stored = getStoredMerchant();
        const merchantId = stored?.merchantId || stored?.merchant_id || '';
        setMerchant({
          businessName:
            stored?.businessName || stored?.business_name || 'Xeco BIZ Account',
          virtualAccount: String(merchantId),
          shortcode: '4049263',
          merchantId: String(merchantId),
        });
      } finally {
        setLoading(false);
      }
    };
    fetchMerchantData();
  }, [router]);

  const handleCopyDetails = useCallback(() => {
    if (!merchant) return;
    navigator.clipboard.writeText(
      `PayBill: ${merchant.shortcode}\nAccount: ${merchant.virtualAccount}\nBusiness: ${merchant.businessName}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }, [merchant]);

  const handleDownloadPDF = useCallback(async () => {
    if (!posterRef.current || !merchant) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(posterRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const ratio = canvas.width / canvas.height;
      let w = pageWidth - 16;
      let h = w / ratio;
      if (h > pageHeight - 16) {
        h = pageHeight - 16;
        w = h * ratio;
      }
      pdf.addImage(imgData, 'PNG', (pageWidth - w) / 2, (pageHeight - h) / 2, w, h);
      pdf.save(`xeco-paybill-${merchant.shortcode}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  }, [merchant]);

  const handlePrint = useCallback(() => window.print(), []);

  const handleShareWhatsApp = useCallback(() => {
    if (!merchant) return;
    const msg = encodeURIComponent(
      `Pay via M-PESA\nPayBill: ${merchant.shortcode}\nAccount: ${merchant.virtualAccount}\n${merchant.businessName}\n\nxecoflowpay.com`
    );
    window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
  }, [merchant]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
      </div>
    );
  }

  const paybill = merchant?.shortcode || '4049263';
  const account = merchant?.virtualAccount || '—';
  const bizName = merchant?.businessName || 'Xeco BIZ Account';

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 no-print">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">PayBill Sticker</h1>
              <p className="text-xs text-slate-500">Printable · A4 ready</p>
            </div>
          </div>
          <button
            onClick={handleCopyDetails}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        {/* Full-width sticker card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-3 sm:p-5 mb-5 no-print">
          <div ref={posterRef} className="sticker">
            {/* Header */}
            <div className="sticker-header">
              <div className="sticker-brand">
                <span className="sticker-brand-xeco">Xeco</span>
                <span className="sticker-brand-flow">Flow</span>
              </div>
              <div className="sticker-lipa">LIPA NA M-PESA</div>
            </div>

            {/* Paybill */}
            <div className="sticker-paybill-wrap">
              <p className="sticker-label-top">PAYBILL</p>
              <p className="sticker-paybill-num">{paybill}</p>
            </div>

            {/* Account panel */}
            <div className="sticker-panel">
              <div className="sticker-box">
                <p className="sticker-box-value">{account}</p>
                <p className="sticker-box-label">ACCOUNT NUMBER</p>
              </div>
              <div className="sticker-box">
                <p className="sticker-box-value sticker-box-name">{bizName}</p>
                <p className="sticker-box-label">ACCOUNT NAME</p>
              </div>
            </div>

            {/* Footer */}
            <div className="sticker-footer">
              <span>Get your PayBill at</span>
              <strong> xecoflowpay.com</strong>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 no-print">
          <button
            onClick={handleDownloadPDF}
            disabled={exporting}
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-60 bg-teal-600 hover:bg-teal-700 transition-colors"
          >
            {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            {exporting ? 'Generating…' : 'Download PDF'}
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-slate-200 font-semibold text-sm text-slate-800 hover:bg-slate-50 transition-colors"
          >
            <Printer className="w-5 h-5" />
            Print sticker
          </button>
          <button
            onClick={handleShareWhatsApp}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-colors"
          >
            <Share2 className="w-5 h-5" />
            WhatsApp
          </button>
        </div>
      </div>

      <style jsx global>{`
        .sticker {
          width: 100%;
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          font-family: Arial, Helvetica, 'Segoe UI', sans-serif;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
        }

        .sticker-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 28px;
          background: ${NAVY};
        }
        .sticker-brand {
          display: flex;
          align-items: baseline;
          gap: 1px;
        }
        .sticker-brand-xeco {
          font-size: 26px;
          font-weight: 900;
          color: #ffffff;
          letter-spacing: -0.6px;
        }
        .sticker-brand-flow {
          font-size: 26px;
          font-weight: 900;
          color: ${ACCENT};
          letter-spacing: -0.6px;
        }
        .sticker-lipa {
          font-size: 11px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 0.08em;
          border: 1.5px solid rgba(255, 255, 255, 0.35);
          padding: 6px 12px;
          border-radius: 6px;
        }

        .sticker-paybill-wrap {
          text-align: center;
          padding: 32px 24px 24px;
          background: #ffffff;
        }
        .sticker-label-top {
          margin: 0 0 8px;
          font-size: 14px;
          font-weight: 800;
          color: ${GREEN};
          letter-spacing: 0.16em;
        }
        .sticker-paybill-num {
          margin: 0;
          font-size: 64px;
          font-weight: 900;
          color: ${NAVY};
          letter-spacing: 0.06em;
          line-height: 1;
        }

        .sticker-panel {
          background: ${GREEN};
          padding: 20px 28px 24px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .sticker-box {
          background: #ffffff;
          border-radius: 10px;
          padding: 18px 20px 14px;
          text-align: center;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }
        .sticker-box-value {
          margin: 0;
          font-size: 32px;
          font-weight: 900;
          color: ${NAVY};
          line-height: 1.15;
          word-break: break-all;
        }
        .sticker-box-name {
          font-size: 22px;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .sticker-box-label {
          margin: 8px 0 0;
          font-size: 12px;
          font-weight: 800;
          color: ${GREEN};
          letter-spacing: 0.12em;
        }

        .sticker-footer {
          text-align: center;
          padding: 14px 24px;
          background: ${NAVY};
          color: rgba(255, 255, 255, 0.75);
          font-size: 13px;
        }
        .sticker-footer strong {
          color: ${ACCENT};
          font-weight: 800;
        }

        @media (max-width: 640px) {
          .sticker-header {
            padding: 14px 16px;
          }
          .sticker-brand-xeco,
          .sticker-brand-flow {
            font-size: 20px;
          }
          .sticker-paybill-wrap {
            padding: 24px 16px 18px;
          }
          .sticker-paybill-num {
            font-size: 44px;
          }
          .sticker-panel {
            padding: 14px 16px 18px;
            gap: 10px;
          }
          .sticker-box {
            padding: 14px 12px 12px;
          }
          .sticker-box-value {
            font-size: 24px;
          }
          .sticker-box-name {
            font-size: 16px;
          }
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          .no-print {
            display: none !important;
          }
          .sticker {
            width: 100% !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}