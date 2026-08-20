// src/app/dashboard/paybill/automated/page.tsx
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
import { getStoredMerchant } from '@/lib/auth';

interface MerchantData {
  businessName: string;
  virtualAccount: string;
  shortcode: string;
}

export default function AutomatedPayBillPage() {
  const router = useRouter();
  const posterRef = useRef<HTMLDivElement>(null);

  const [merchant, setMerchant] = useState<MerchantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  /*
   * Tower SACCO branding colors
   */
  const TOWER_GREEN = '#099447';
  const TOWER_PINK = '#ec0878';

  // ─────────────────────────────────────────────────────────────
  // Load merchant details
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchMerchantData = async () => {
      try {
        const stored = getStoredMerchant();

        setMerchant({
          businessName: stored?.businessName || 'TOWER SACCO',
          virtualAccount:
            stored?.virtualAccount || '01500520015312',
          shortcode: '506900',
        });
      } catch (error) {
        console.error('Error fetching merchant data:', error);

        setMerchant({
          businessName: 'TOWER SACCO',
          virtualAccount: '01500520015312',
          shortcode: '506900',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMerchantData();
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Copy details
  // ─────────────────────────────────────────────────────────────
  const handleCopyDetails = useCallback(() => {
    if (!merchant) return;

    const text =
      `LIPA NA MPESA\n` +
      `PayBill: ${merchant.shortcode}\n` +
      `Account Number: ${merchant.virtualAccount}\n` +
      `Business: ${merchant.businessName}`;

    navigator.clipboard.writeText(text);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 3000);
  }, [merchant]);

  // ─────────────────────────────────────────────────────────────
  // Download PDF
  // ─────────────────────────────────────────────────────────────
  const handleDownloadPDF = useCallback(async () => {
    if (!posterRef.current || !merchant) return;

    setExporting(true);

    try {
      const canvas = await html2canvas(posterRef.current, {
        scale: 4,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

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

      pdf.addImage(
        imgData,
        'PNG',
        x,
        y,
        pdfWidth,
        pdfHeight
      );

      pdf.save(
        `tower-saccco-paybill-${merchant.virtualAccount}.pdf`
      );
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setExporting(false);
    }
  }, [merchant]);

  // ─────────────────────────────────────────────────────────────
  // Print
  // ─────────────────────────────────────────────────────────────
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // ─────────────────────────────────────────────────────────────
  // WhatsApp
  // ─────────────────────────────────────────────────────────────
  const handleShareWhatsApp = useCallback(() => {
    if (!merchant) return;

    const message = encodeURIComponent(
      `LIPA NA MPESA\n\n` +
        `PayBill: ${merchant.shortcode}\n` +
        `Account Number: ${merchant.virtualAccount}\n` +
        `Tower SACCO`
    );

    window.open(
      `https://api.whatsapp.com/send?text=${message}`,
      '_blank'
    );
  }, [merchant]);

  // ─────────────────────────────────────────────────────────────
  // Loading
  // ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2
            className="w-10 h-10 animate-spin mx-auto mb-4"
            style={{ color: TOWER_GREEN }}
          />

          <p className="text-gray-600">
            Loading your Tower SACCO PayBill...
          </p>
        </div>
      </div>
    );
  }

  const paybillDigits = (
    merchant?.shortcode || '506900'
  ).split('');

  const accountDigits = (
    merchant?.virtualAccount || '01500520015312'
  ).split('');

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">

        {/* ─────────────────────────────────────────────────────── */}
        {/* Header */}
        {/* ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6 no-print">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Tower SACCO PayBill
              </h1>

              <p className="text-sm text-gray-500">
                Lipa na M-Pesa PayBill Poster
              </p>
            </div>
          </div>

          <button
            onClick={handleCopyDetails}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
          >
            {copied ? (
              <Check
                className="w-4 h-4"
                style={{ color: TOWER_GREEN }}
              />
            ) : (
              <Copy className="w-4 h-4" />
            )}

            {copied ? 'Copied!' : 'Copy Details'}
          </button>
        </div>

        {/* ─────────────────────────────────────────────────────── */}
        {/* Poster */}
        {/* ─────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 no-print">
          <div className="flex justify-center">

            <div
              ref={posterRef}
              className="tower-poster"
            >

              {/* ──────────────────────────────────────────────── */}
              {/* Tower SACCO Logo */}
              {/* ──────────────────────────────────────────────── */}
              <div className="tower-logo-container">

                {/* 
                  Put your actual Tower SACCO logo here:

                  public/tower-sacco-logo.png
                */}

                <img
                  src="/tower-sacco-logo.png"
                  alt="Tower SACCO"
                  className="tower-logo"
                  crossOrigin="anonymous"
                />

                {/* Fallback text if logo image is unavailable */}
                <div className="tower-logo-fallback">
                  <div className="tower-icon">
                    <span>♟</span>
                  </div>

                  <div>
                    <div className="tower-name">
                      TOWER SACCO
                    </div>

                    <div className="tower-tagline">
                      A better life for your financial needs
                    </div>
                  </div>
                </div>
              </div>

              {/* ──────────────────────────────────────────────── */}
              {/* LIPA NA MPESA */}
              {/* ──────────────────────────────────────────────── */}
              <div className="lipa-title">
                LIPA NA MPESA
              </div>

              {/* ──────────────────────────────────────────────── */}
              {/* PAYBILL */}
              {/* ──────────────────────────────────────────────── */}
              <div
                className="paybill-title"
                style={{ color: TOWER_GREEN }}
              >
                PAYBILL
              </div>

              {/* ──────────────────────────────────────────────── */}
              {/* PayBill Number */}
              {/* ──────────────────────────────────────────────── */}
              <div className="digit-row">
                {paybillDigits.map((digit, index) => (
                  <div
                    key={`paybill-${index}`}
                    className="digit-box"
                    style={{
                      color: TOWER_PINK,
                    }}
                  >
                    {digit}
                  </div>
                ))}
              </div>

              {/* ──────────────────────────────────────────────── */}
              {/* Account Number Label */}
              {/* ──────────────────────────────────────────────── */}
              <div
                className="account-title"
                style={{ color: TOWER_GREEN }}
              >
                ACCOUNT NUMBER
              </div>

              {/* ──────────────────────────────────────────────── */}
              {/* Account Number */}
              {/* ──────────────────────────────────────────────── */}
              <div className="digit-row account-row">
                {accountDigits.map((digit, index) => (
                  <div
                    key={`account-${index}`}
                    className="digit-box account-digit"
                    style={{
                      color: TOWER_PINK,
                    }}
                  >
                    {digit}
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────── */}
        {/* Actions */}
        {/* ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 no-print">

          <button
            onClick={handleDownloadPDF}
            disabled={exporting}
            className="flex items-center justify-center gap-2 px-4 py-3 text-white rounded-xl font-medium transition-colors shadow-sm disabled:opacity-60"
            style={{
              backgroundColor: TOWER_GREEN,
            }}
          >
            {exporting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}

            {exporting
              ? 'Generating...'
              : 'Download PDF'}
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-medium transition-colors"
          >
            <Printer className="w-5 h-5" />
            Print Poster
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors shadow-sm"
          >
            <Share2 className="w-5 h-5" />
            Share via WhatsApp
          </button>

        </div>

        {/* ─────────────────────────────────────────────────────── */}
        {/* Details */}
        {/* ─────────────────────────────────────────────────────── */}
        <div className="mt-6 bg-white rounded-xl p-5 border border-gray-200 no-print">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            Tower SACCO PayBill Details
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">

            <div>
              <p className="text-gray-400 text-xs">
                PAYBILL
              </p>

              <p
                className="font-bold text-lg"
                style={{ color: TOWER_GREEN }}
              >
                {merchant?.shortcode}
              </p>
            </div>

            <div>
              <p className="text-gray-400 text-xs">
                ACCOUNT NUMBER
              </p>

              <p className="font-bold text-lg text-gray-800">
                {merchant?.virtualAccount}
              </p>
            </div>

            <div>
              <p className="text-gray-400 text-xs">
                BUSINESS
              </p>

              <p className="font-bold text-lg text-gray-800">
                {merchant?.businessName}
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* ───────────────────────────────────────────────────────── */}
      {/* Styling */}
      {/* ───────────────────────────────────────────────────────── */}
      <style jsx global>{`

        /*
         * Main Tower SACCO poster
         */
        .tower-poster {
          width: 800px;
          max-width: 100%;
          aspect-ratio: 3 / 2;

          background: #ffffff;

          display: flex;
          flex-direction: column;
          align-items: center;

          overflow: hidden;

          padding:
            clamp(20px, 4vw, 38px)
            clamp(18px, 4vw, 42px);

          box-sizing: border-box;
        }

        /*
         * Logo
         */
        .tower-logo-container {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;

          min-height: 72px;

          margin-bottom: 8px;
        }

        .tower-logo {
          display: block;

          width: 190px;
          height: auto;

          object-fit: contain;
        }

        /*
         * Only show this if you don't have the actual
         * tower-sacco-logo.png.
         */
        .tower-logo-fallback {
          display: none;
          align-items: center;
          gap: 8px;
        }

        .tower-icon {
          width: 34px;
          height: 42px;

          border: 3px solid ${TOWER_GREEN};

          border-radius: 50% 50% 45% 45%;

          display: flex;
          align-items: center;
          justify-content: center;

          color: ${TOWER_PINK};
        }

        .tower-name {
          color: ${TOWER_PINK};

          font-size: 25px;
          font-weight: 700;

          line-height: 1;
        }

        .tower-tagline {
          color: ${TOWER_GREEN};

          font-size: 7px;

          margin-top: 3px;
        }

        /*
         * LIPA NA MPESA
         */
        .lipa-title {
          color: #050505;

          font-size: clamp(28px, 5vw, 52px);

          font-weight: 900;

          letter-spacing: -1.5px;

          line-height: 1;

          text-align: center;

          margin-top: 4px;
        }

        /*
         * PAYBILL
         */
        .paybill-title {
          font-size: clamp(24px, 4.5vw, 43px);

          font-weight: 800;

          line-height: 1;

          text-align: center;

          margin-top: 13px;

          margin-bottom: 14px;
        }

        /*
         * Number boxes
         */
        .digit-row {
          display: flex;

          justify-content: center;
          align-items: stretch;

          width: 100%;

          max-width: 620px;

          margin: 0 auto;
        }

        .digit-box {
          flex: 1;

          min-width: 0;

          height: clamp(48px, 8vw, 76px);

          border: 1.5px solid #333;

          display: flex;

          align-items: center;
          justify-content: center;

          background: #fff;

          font-size: clamp(31px, 6vw, 57px);

          font-weight: 800;

          line-height: 1;

          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        /*
         * Account label
         */
        .account-title {
          font-size: clamp(22px, 4vw, 39px);

          font-weight: 800;

          line-height: 1;

          text-align: center;

          margin-top: 17px;

          margin-bottom: 13px;
        }

        /*
         * Account number row
         */
        .account-row {
          max-width: 100%;
        }

        .account-digit {
          font-size: clamp(20px, 4vw, 40px);

          height: clamp(42px, 7vw, 65px);

          font-weight: 800;
        }

        /*
         * Mobile
         */
        @media (max-width: 640px) {

          .tower-poster {
            aspect-ratio: 3 / 2;

            padding: 18px 10px;
          }

          .tower-logo-container {
            min-height: 45px;
          }

          .tower-logo {
            width: 125px;
          }

          .lipa-title {
            font-size: 25px;
            letter-spacing: -0.5px;
          }

          .paybill-title {
            font-size: 23px;
            margin-top: 8px;
            margin-bottom: 8px;
          }

          .digit-box {
            height: 43px;
            font-size: 28px;
          }

          .account-title {
            font-size: 21px;
            margin-top: 11px;
            margin-bottom: 8px;
          }

          .account-digit {
            height: 38px;
            font-size: 18px;
          }
        }

        /*
         * Print
         */
        @media print {

          @page {
            size: A4 portrait;
            margin: 0;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;

            background: white !important;
          }

          .no-print {
            display: none !important;
          }

          .tower-poster {
            width: 100vw !important;
            height: 100vh !important;

            max-width: none !important;

            aspect-ratio: auto !important;

            box-shadow: none !important;

            padding: 10vh 5vw !important;
          }

          .tower-logo {
            width: 240px !important;
          }

          .lipa-title {
            font-size: 58px !important;
          }

          .paybill-title {
            font-size: 50px !important;
          }

          .digit-box {
            height: 85px !important;
            font-size: 65px !important;
          }

          .account-title {
            font-size: 46px !important;
          }

          .account-digit {
            font-size: 42px !important;
            height: 72px !important;
          }
        }
      `}</style>
    </div>
  );
}