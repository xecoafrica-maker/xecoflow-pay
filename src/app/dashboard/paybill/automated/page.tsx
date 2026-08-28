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

  const GREEN = '#099447';
  const NAVY = '#0a2540';

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
      let w = pageWidth - 20;
      let h = w / ratio;
      if (h > pageHeight - 20) {
        h = pageHeight - 20;
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: GREEN }} />
      </div>
    );
  }

  const paybill = merchant?.shortcode || '4049263';
  const account = merchant?.virtualAccount || '—';
  const bizName = merchant?.businessName || 'Xeco BIZ Account';

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 no-print">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-gray-200"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">PayBill Sticker</h1>
              <p className="text-sm text-gray-500">Printable · A4 ready</p>
            </div>
          </div>
          <button
            onClick={handleCopyDetails}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        {/* Sticker preview */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-8 mb-6 no-print flex justify-center">
          <div ref={posterRef} className="sticker">
            {/* Header strip */}
            <div className="sticker-header">
              <div className="sticker-brand">
                <span className="sticker-brand-xeco">Xeco</span>
                <span className="sticker-brand-flow">Flow</span>
              </div>
              <div className="sticker-lipa">LIPA NA M-PESA</div>
            </div>

            {/* Paybill number — big */}
            <div className="sticker-paybill-wrap">
              <p className="sticker-label-top">PAYBILL</p>
              <p className="sticker-paybill-num">{paybill}</p>
            </div>

            {/* White boxes on green panel */}
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
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-white font-medium disabled:opacity-60"
            style={{ backgroundColor: GREEN }}
          >
            {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            {exporting ? 'Generating…' : 'Download PDF'}
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-gray-200 font-medium text-gray-800 hover:bg-gray-50"
          >
            <Printer className="w-5 h-5" />
            Print sticker
          </button>
          <button
            onClick={handleShareWhatsApp}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] text-white font-medium hover:bg-[#1da851]"
          >
            <Share2 className="w-5 h-5" />
            WhatsApp
          </button>
        </div>
      </div>

      <style jsx global>{`
        .sticker {
          width: 420px;
          max-width: 100%;
          background: #ffffff;
          border: 3px solid ${NAVY};
          font-family: Arial, Helvetica, sans-serif;
          overflow: hidden;
        }

        .sticker-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          background: ${NAVY};
        }
        .sticker-brand {
          display: flex;
          align-items: baseline;
          gap: 1px;
        }
        .sticker-brand-xeco {
          font-size: 22px;
          font-weight: 900;
          color: #ffffff;
          letter-spacing: -0.5px;
        }
        .sticker-brand-flow {
          font-size: 22px;
          font-weight: 900;
          color: ${GREEN};
          letter-spacing: -0.5px;
        }
        .sticker-lipa {
          font-size: 11px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 0.06em;
          border: 1.5px solid rgba(255, 255, 255, 0.5);
          padding: 4px 10px;
          border-radius: 4px;
        }

        .sticker-paybill-wrap {
          text-align: center;
          padding: 20px 16px 12px;
          background: #ffffff;
        }
        .sticker-label-top {
          margin: 0 0 4px;
          font-size: 13px;
          font-weight: 800;
          color: ${GREEN};
          letter-spacing: 0.12em;
        }
        .sticker-paybill-num {
          margin: 0;
          font-size: 52px;
          font-weight: 900;
          color: ${NAVY};
          letter-spacing: 0.08em;
          line-height: 1.1;
        }

        .sticker-panel {
          background: ${GREEN};
          padding: 16px 18px 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .sticker-box {
          background: #ffffff;
          border-radius: 6px;
          padding: 12px 14px 10px;
          text-align: center;
        }
        .sticker-box-value {
          margin: 0;
          font-size: 26px;
          font-weight: 900;
          color: #111827;
          line-height: 1.2;
          word-break: break-all;
        }
        .sticker-box-name {
          font-size: 18px;
          text-transform: uppercase;
        }
        .sticker-box-label {
          margin: 6px 0 0;
          font-size: 11px;
          font-weight: 800;
          color: ${GREEN};
          letter-spacing: 0.1em;
        }

        .sticker-footer {
          text-align: center;
          padding: 10px 16px;
          background: ${NAVY};
          color: rgba(255, 255, 255, 0.85);
          font-size: 12px;
        }
        .sticker-footer strong {
          color: #6ee7b7;
          font-weight: 800;
        }

        @media (max-width: 480px) {
          .sticker-paybill-num {
            font-size: 40px;
          }
          .sticker-box-value {
            font-size: 20px;
          }
          .sticker-box-name {
            font-size: 15px;
          }
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm;
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
            max-width: 160mm !important;
            margin: 0 auto;
            border-width: 3px !important;
          }
        }
      `}</style>
    </div>
  );
}