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
  Smartphone,
  Shield,
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
  const PINK = '#EC0878';
  const NAVY = '#0a2540';
  const BLUE = '#073B73';

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
    const text =
      `PayBill: ${merchant.shortcode}\n` +
      `Account Number: ${merchant.virtualAccount}\n` +
      `Business: ${merchant.businessName}`;
    navigator.clipboard.writeText(text);
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
      const imageRatio = canvas.width / canvas.height;
      let pdfWidth = pageWidth;
      let pdfHeight = pdfWidth / imageRatio;
      if (pdfHeight > pageHeight) {
        pdfHeight = pageHeight;
        pdfWidth = pdfHeight * imageRatio;
      }
      const x = (pageWidth - pdfWidth) / 2;
      const y = (pageHeight - pdfHeight) / 2;
      pdf.addImage(imgData, 'PNG', x, y, pdfWidth, pdfHeight);
      pdf.save(`xeco-biz-paybill-${merchant.shortcode}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  }, [merchant]);

  const handlePrint = useCallback(() => window.print(), []);

  const handleShareWhatsApp = useCallback(() => {
    if (!merchant) return;
    const message = encodeURIComponent(
      `Pay via XecoFlow BIZ Account\n\n` +
        `PayBill: ${merchant.shortcode}\n` +
        `Account: ${merchant.virtualAccount}\n\n` +
        `Get your PayBill at xecoflowpay.com`
    );
    window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');
  }, [merchant]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3" style={{ color: GREEN }} />
          <p className="text-sm text-gray-500">Loading your PayBill details…</p>
        </div>
      </div>
    );
  }

  const paybillDigits = (merchant?.shortcode || '4049263').split('');
  const accountDigits = (merchant?.virtualAccount || '01500520015312').split('');

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 no-print">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-gray-200"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Xeco BIZ Account</h1>
              <p className="text-sm text-gray-500">PayBill poster</p>
            </div>
          </div>
          <button
            onClick={handleCopyDetails}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors"
          >
            {copied ? (
              <Check className="w-4 h-4" style={{ color: GREEN }} />
            ) : (
              <Copy className="w-4 h-4 text-gray-500" />
            )}
            {copied ? 'Copied!' : 'Copy details'}
          </button>
        </div>

        {/* Poster preview */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6 no-print overflow-x-auto">
          <div className="flex justify-center min-w-[320px]">
            <div ref={posterRef} className="poster-root">
              {/* Top accent bar */}
              <div className="poster-top-bar">
                <div className="poster-top-bar-green" />
                <div className="poster-top-bar-pink" />
              </div>

              {/* Brand header */}
              <div className="poster-header">
                <div className="poster-logo-row">
                  <span className="poster-logo-xeco">Xeco</span>
                  <span className="poster-logo-flow">Flow</span>
                </div>
                <p className="poster-tagline">BIZ Account · Instant payments</p>
              </div>

              {/* Business name chip */}
              <div className="poster-biz-chip">
                <span className="poster-biz-label">Pay</span>
                <span className="poster-biz-name">
                  {merchant?.businessName || 'Xeco BIZ Account'}
                </span>
              </div>

              {/* PayBill block */}
              <div className="poster-section">
                <div className="poster-section-label">
                  <span className="poster-step">1</span>
                  PAYBILL NUMBER
                </div>
                <div className="poster-digits">
                  {paybillDigits.map((d, i) => (
                    <div key={`pb-${i}`} className="poster-digit">
                      {d}
                    </div>
                  ))}
                </div>
              </div>

              {/* Account block */}
              <div className="poster-section">
                <div className="poster-section-label">
                  <span className="poster-step">2</span>
                  ACCOUNT NUMBER
                </div>
                <div className="poster-digits poster-digits-account">
                  {accountDigits.map((d, i) => (
                    <div key={`ac-${i}`} className="poster-digit poster-digit-sm">
                      {d}
                    </div>
                  ))}
                </div>
              </div>

              {/* How to pay */}
              <div className="poster-howto">
                <div className="poster-howto-title">
                  <Smartphone className="poster-howto-icon" />
                  How to pay
                </div>
                <ol className="poster-howto-list">
                  <li>Lipa na M-PESA → Pay Bill</li>
                  <li>
                    Enter PayBill <strong>{merchant?.shortcode}</strong>
                  </li>
                  <li>
                    Enter Account <strong>{merchant?.virtualAccount}</strong>
                  </li>
                  <li>Enter amount → PIN → Confirm</li>
                </ol>
              </div>

              {/* CTA banner */}
              <div className="poster-cta">
                <p className="poster-cta-main">
                  Get your XecoFlow PayBill now — instant
                </p>
                <p className="poster-cta-url">xecoflowpay.com</p>
              </div>

              {/* Footer trust */}
              <div className="poster-footer">
                <Shield className="poster-footer-icon" />
                <span>Secure payments powered by XecoFlow</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 no-print">
          <button
            onClick={handleDownloadPDF}
            disabled={exporting}
            className="flex items-center justify-center gap-2 px-4 py-3 text-white rounded-xl font-medium transition-colors shadow-sm disabled:opacity-60"
            style={{ backgroundColor: GREEN }}
          >
            {exporting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            {exporting ? 'Generating…' : 'Download PDF'}
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-xl font-medium transition-colors"
          >
            <Printer className="w-5 h-5" />
            Print poster
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] hover:bg-[#1da851] text-white rounded-xl font-medium transition-colors shadow-sm"
          >
            <Share2 className="w-5 h-5" />
            Share WhatsApp
          </button>
        </div>

        {/* Details card */}
        <div className="mt-6 bg-white rounded-2xl p-5 border border-gray-200 no-print">
          <p className="text-sm font-semibold text-gray-800 mb-4">Account details</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide">PayBill</p>
              <p className="font-bold text-lg mt-0.5" style={{ color: BLUE }}>
                {merchant?.shortcode}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide">Account number</p>
              <p className="font-bold text-lg mt-0.5" style={{ color: BLUE }}>
                {merchant?.virtualAccount}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide">Business</p>
              <p className="font-bold text-lg mt-0.5 truncate" style={{ color: GREEN }}>
                {merchant?.businessName}
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .poster-root {
          width: 720px;
          max-width: 100%;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          font-family: system-ui, -apple-system, 'Segoe UI', Arial, sans-serif;
        }

        .poster-top-bar {
          display: flex;
          height: 8px;
        }
        .poster-top-bar-green {
          flex: 2;
          background: ${GREEN};
        }
        .poster-top-bar-pink {
          flex: 1;
          background: ${PINK};
        }

        .poster-header {
          text-align: center;
          padding: 28px 32px 12px;
          background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%);
        }
        .poster-logo-row {
          display: flex;
          justify-content: center;
          align-items: baseline;
          gap: 2px;
        }
        .poster-logo-xeco {
          font-size: 42px;
          font-weight: 900;
          color: ${NAVY};
          letter-spacing: -1.5px;
          line-height: 1;
        }
        .poster-logo-flow {
          font-size: 42px;
          font-weight: 900;
          color: ${GREEN};
          letter-spacing: -1.5px;
          line-height: 1;
        }
        .poster-tagline {
          margin-top: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #6b7280;
          letter-spacing: 0.02em;
        }

        .poster-biz-chip {
          margin: 8px 32px 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 16px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
        }
        .poster-biz-label {
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
        }
        .poster-biz-name {
          font-size: 15px;
          font-weight: 700;
          color: ${NAVY};
        }

        .poster-section {
          padding: 18px 32px 0;
        }
        .poster-section-label {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 800;
          color: ${GREEN};
          letter-spacing: 0.06em;
          margin-bottom: 12px;
        }
        .poster-step {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: ${GREEN};
          color: #fff;
          font-size: 12px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .poster-digits {
          display: flex;
          justify-content: center;
          gap: 0;
          max-width: 420px;
          margin: 0 auto;
        }
        .poster-digit {
          flex: 1;
          min-width: 0;
          height: 64px;
          border: 2px solid ${NAVY};
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff;
          font-size: 36px;
          font-weight: 900;
          color: ${BLUE};
          font-family: Arial, Helvetica, sans-serif;
        }
        .poster-digit + .poster-digit {
          border-left: none;
        }
        .poster-digits-account {
          max-width: 100%;
        }
        .poster-digit-sm {
          height: 52px;
          font-size: 22px;
        }

        .poster-howto {
          margin: 22px 32px 0;
          padding: 14px 16px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
        }
        .poster-howto-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          color: ${NAVY};
          margin-bottom: 8px;
        }
        .poster-howto-icon {
          width: 16px;
          height: 16px;
          color: ${GREEN};
        }
        .poster-howto-list {
          margin: 0;
          padding-left: 18px;
          font-size: 12px;
          color: #475569;
          line-height: 1.65;
        }
        .poster-howto-list strong {
          color: ${NAVY};
        }

        .poster-cta {
          margin: 18px 32px 0;
          padding: 16px;
          text-align: center;
          background: linear-gradient(135deg, ${NAVY} 0%, #152a45 100%);
          border-radius: 12px;
          color: #fff;
        }
        .poster-cta-main {
          font-size: 14px;
          font-weight: 700;
          margin: 0 0 4px;
        }
        .poster-cta-url {
          font-size: 18px;
          font-weight: 900;
          color: #6ee7b7;
          margin: 0;
          letter-spacing: 0.02em;
        }

        .poster-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 14px 32px 20px;
          font-size: 11px;
          color: #94a3b8;
          font-weight: 500;
        }
        .poster-footer-icon {
          width: 12px;
          height: 12px;
          color: ${GREEN};
        }

        @media (max-width: 640px) {
          .poster-header {
            padding: 20px 16px 8px;
          }
          .poster-logo-xeco,
          .poster-logo-flow {
            font-size: 32px;
          }
          .poster-biz-chip,
          .poster-section,
          .poster-howto,
          .poster-cta {
            margin-left: 16px;
            margin-right: 16px;
          }
          .poster-section {
            padding-left: 16px;
            padding-right: 16px;
          }
          .poster-digit {
            height: 48px;
            font-size: 26px;
          }
          .poster-digit-sm {
            height: 40px;
            font-size: 16px;
          }
          .poster-footer {
            padding: 12px 16px 16px;
          }
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
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
          .poster-root {
            width: 100vw !important;
            max-width: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}