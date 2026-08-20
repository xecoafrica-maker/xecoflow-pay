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

  // ─────────────────────────────────────────────────────────────
  // BRAND COLORS
  // ─────────────────────────────────────────────────────────────

  const XECOfLOW_GREEN = '#099447';
  const XECOfLOW_PINK = '#EC0878';
  const DARK_BLUE = '#073B73';

  // ─────────────────────────────────────────────────────────────
  // Load merchant data
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchMerchantData = async () => {
      try {
        const stored = getStoredMerchant();

        setMerchant({
          businessName:
            stored?.businessName || 'Xecoflow Smart PayBill',

          virtualAccount:
            stored?.virtualAccount || '01500520015312',

          shortcode: '4049263',
        });
      } catch (error) {
        console.error('Error fetching merchant data:', error);

        setMerchant({
          businessName: 'Xecoflow Smart PayBill',
          virtualAccount: '01500520015312',
          shortcode: '4049263',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMerchantData();
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Copy PayBill details
  // ─────────────────────────────────────────────────────────────

  const handleCopyDetails = useCallback(() => {
    if (!merchant) return;

    const text =
      `PayBill: ${merchant.shortcode}\n` +
      `Account Number: ${merchant.virtualAccount}\n` +
      `Business: Xecoflow Smart PayBill`;

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
        `xecoflow-smart-paybill-${merchant.shortcode}.pdf`
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
  // Share via WhatsApp
  // ─────────────────────────────────────────────────────────────

  const handleShareWhatsApp = useCallback(() => {
    if (!merchant) return;

    const message = encodeURIComponent(
      `Xecoflow Smart PayBill\n\n` +
        `PayBill Number: ${merchant.shortcode}\n` +
        `Account Number: ${merchant.virtualAccount}`
    );

    window.open(
      `https://api.whatsapp.com/send?text=${message}`,
      '_blank'
    );
  }, [merchant]);

  // ─────────────────────────────────────────────────────────────
  // Loading state
  // ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2
            className="w-12 h-12 animate-spin mx-auto mb-4"
            style={{ color: XECOfLOW_GREEN }}
          />

          <p className="text-gray-600">
            Loading your PayBill details...
          </p>
        </div>
      </div>
    );
  }

  const paybillDigits = (
    merchant?.shortcode || '4049263'
  ).split('');

  const accountDigits = (
    merchant?.virtualAccount || '01500520015312'
  ).split('');

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">

      <div className="max-w-5xl mx-auto">

        {/* ───────────────────────────────────────────────────── */}
        {/* HEADER */}
        {/* ───────────────────────────────────────────────────── */}

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
                Xecoflow Smart PayBill
              </h1>

              <p className="text-sm text-gray-500">
                PayBill Poster
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
                style={{ color: XECOfLOW_GREEN }}
              />
            ) : (
              <Copy className="w-4 h-4" />
            )}

            {copied ? 'Copied!' : 'Copy Details'}
          </button>

        </div>

        {/* ───────────────────────────────────────────────────── */}
        {/* POSTER PREVIEW */}
        {/* ───────────────────────────────────────────────────── */}

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 no-print">

          <div className="flex justify-center">

            <div
              ref={posterRef}
              className="xecoflow-poster"
            >

              {/* ─────────────────────────────────────────────── */}
              {/* XECOfLOW BRANDING */}
              {/* ─────────────────────────────────────────────── */}

              <div className="xecoflow-brand">

                <div
                  className="xecoflow-main"
                  style={{ color: XECOfLOW_GREEN }}
                >
                  Xecoflow
                </div>

                <div
                  className="xecoflow-smart"
                  style={{ color: XECOfLOW_PINK }}
                >
                  Smart PayBill
                </div>

              </div>

              {/* ─────────────────────────────────────────────── */}
              {/* PAYBILL */}
              {/* ─────────────────────────────────────────────── */}

              <div
                className="paybill-title"
                style={{
                  color: XECOfLOW_GREEN,
                }}
              >
                PAYBILL
              </div>

              {/* ─────────────────────────────────────────────── */}
              {/* PAYBILL NUMBER */}
              {/* ─────────────────────────────────────────────── */}

              <div className="digit-row paybill-row">

                {paybillDigits.map((digit, index) => (
                  <div
                    key={`paybill-${index}`}
                    className="digit-box"
                    style={{
                      color: DARK_BLUE,
                    }}
                  >
                    {digit}
                  </div>
                ))}

              </div>

              {/* ─────────────────────────────────────────────── */}
              {/* ACCOUNT NUMBER TITLE */}
              {/* ─────────────────────────────────────────────── */}

              <div
                className="account-title"
                style={{
                  color: XECOfLOW_GREEN,
                }}
              >
                ACCOUNT NUMBER
              </div>

              {/* ─────────────────────────────────────────────── */}
              {/* ACCOUNT NUMBER */}
              {/* ─────────────────────────────────────────────── */}

              <div className="digit-row account-row">

                {accountDigits.map((digit, index) => (
                  <div
                    key={`account-${index}`}
                    className="digit-box account-digit"
                    style={{
                      color: DARK_BLUE,
                    }}
                  >
                    {digit}
                  </div>
                ))}

              </div>

            </div>

          </div>

        </div>

        {/* ───────────────────────────────────────────────────── */}
        {/* ACTION BUTTONS */}
        {/* ───────────────────────────────────────────────────── */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 no-print">

          {/* Download */}

          <button
            onClick={handleDownloadPDF}
            disabled={exporting}
            className="flex items-center justify-center gap-2 px-4 py-3 text-white rounded-xl font-medium transition-colors shadow-sm disabled:opacity-60"
            style={{
              backgroundColor: XECOfLOW_GREEN,
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

          {/* Print */}

          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-medium transition-colors"
          >

            <Printer className="w-5 h-5" />

            Print Poster

          </button>

          {/* WhatsApp */}

          <button
            onClick={handleShareWhatsApp}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors shadow-sm"
          >

            <Share2 className="w-5 h-5" />

            Share via WhatsApp

          </button>

        </div>

        {/* ───────────────────────────────────────────────────── */}
        {/* DETAILS */}
        {/* ───────────────────────────────────────────────────── */}

        <div className="mt-6 bg-white rounded-xl p-5 border border-gray-200 no-print">

          <p className="text-sm font-semibold text-gray-700 mb-4">
            Xecoflow Smart PayBill Details
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            <div>
              <p className="text-gray-400 text-xs">
                PAYBILL
              </p>

              <p
                className="font-bold text-lg"
                style={{
                  color: DARK_BLUE,
                }}
              >
                {merchant?.shortcode}
              </p>
            </div>

            <div>
              <p className="text-gray-400 text-xs">
                ACCOUNT NUMBER
              </p>

              <p
                className="font-bold text-lg"
                style={{
                  color: DARK_BLUE,
                }}
              >
                {merchant?.virtualAccount}
              </p>
            </div>

            <div>
              <p className="text-gray-400 text-xs">
                SERVICE
              </p>

              <p
                className="font-bold text-lg"
                style={{
                  color: XECOfLOW_GREEN,
                }}
              >
                Smart PayBill
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* ───────────────────────────────────────────────────────── */}
      {/* POSTER + PRINT STYLES */}
      {/* ───────────────────────────────────────────────────────── */}

      <style jsx global>{`

        /* ========================================================
           MAIN POSTER
        ======================================================== */

        .xecoflow-poster {

          width: 800px;
          max-width: 100%;

          aspect-ratio: 3 / 2;

          background: #ffffff;

          display: flex;
          flex-direction: column;

          align-items: center;

          justify-content: center;

          overflow: hidden;

          padding: 35px 42px;

          box-sizing: border-box;

        }


        /* ========================================================
           XECOfLOW BRAND
        ======================================================== */

        .xecoflow-brand {

          width: 100%;

          text-align: center;

          margin-bottom: 15px;

        }


        .xecoflow-main {

          font-size: clamp(
            52px,
            9vw,
            86px
          );

          font-weight: 900;

          line-height: 0.95;

          letter-spacing: -2px;

        }


        .xecoflow-smart {

          font-size: clamp(
            28px,
            5vw,
            46px
          );

          font-weight: 800;

          line-height: 1;

          margin-top: 8px;

          letter-spacing: -0.5px;

        }


        /* ========================================================
           PAYBILL
        ======================================================== */

        .paybill-title {

          font-size: clamp(
            26px,
            4.5vw,
            40px
          );

          font-weight: 800;

          line-height: 1;

          text-align: center;

          margin-top: 13px;

          margin-bottom: 14px;

        }


        /* ========================================================
           NUMBER ROW
        ======================================================== */

        .digit-row {

          display: flex;

          justify-content: center;

          align-items: stretch;

          width: 100%;

          max-width: 620px;

          margin: 0 auto;

        }


        /* ========================================================
           NUMBER BOX
        ======================================================== */

        .digit-box {

          flex: 1;

          min-width: 0;

          height: clamp(
            48px,
            8vw,
            76px
          );

          border: 1.5px solid #333333;

          display: flex;

          align-items: center;

          justify-content: center;

          background: #ffffff;

          font-size: clamp(
            31px,
            6vw,
            57px
          );

          font-weight: 900;

          line-height: 1;

          font-family:
            Arial,
            Helvetica,
            sans-serif;

        }


        /* ========================================================
           ACCOUNT NUMBER
        ======================================================== */

        .account-title {

          font-size: clamp(
            23px,
            4vw,
            38px
          );

          font-weight: 800;

          line-height: 1;

          text-align: center;

          margin-top: 18px;

          margin-bottom: 13px;

        }


        .account-row {

          max-width: 100%;

        }


        .account-digit {

          height: clamp(
            42px,
            7vw,
            65px
          );

          font-size: clamp(
            20px,
            4vw,
            39px
          );

          font-weight: 900;

        }


        /* ========================================================
           TABLET
        ======================================================== */

        @media (max-width: 768px) {

          .xecoflow-poster {

            padding: 28px 20px;

          }

          .xecoflow-main {

            font-size: 55px;

          }

          .xecoflow-smart {

            font-size: 30px;

          }

          .paybill-title {

            font-size: 27px;

          }

        }


        /* ========================================================
           MOBILE
        ======================================================== */

        @media (max-width: 640px) {

          .xecoflow-poster {

            aspect-ratio: 3 / 2;

            padding: 18px 8px;

          }


          .xecoflow-brand {

            margin-bottom: 7px;

          }


          .xecoflow-main {

            font-size: 38px;

            letter-spacing: -1px;

          }


          .xecoflow-smart {

            font-size: 22px;

            margin-top: 4px;

          }


          .paybill-title {

            font-size: 22px;

            margin-top: 8px;

            margin-bottom: 8px;

          }


          .digit-box {

            height: 43px;

            font-size: 27px;

          }


          .account-title {

            font-size: 20px;

            margin-top: 11px;

            margin-bottom: 8px;

          }


          .account-digit {

            height: 38px;

            font-size: 17px;

          }

        }


        /* ========================================================
           PRINT
        ======================================================== */

        @media print {

          @page {

            size: A4 portrait;

            margin: 0;

          }


          html,
          body {

            margin: 0 !important;

            padding: 0 !important;

            background: #ffffff !important;

          }


          .no-print {

            display: none !important;

          }


          .xecoflow-poster {

            width: 100vw !important;

            height: 100vh !important;

            max-width: none !important;

            aspect-ratio: auto !important;

            box-shadow: none !important;

            padding: 9vh 5vw !important;

          }


          .xecoflow-main {

            font-size: 90px !important;

          }


          .xecoflow-smart {

            font-size: 52px !important;

          }


          .paybill-title {

            font-size: 48px !important;

          }


          .digit-box {

            height: 85px !important;

            font-size: 64px !important;

          }


          .account-title {

            font-size: 45px !important;

          }


          .account-digit {

            height: 72px !important;

            font-size: 42px !important;

          }

        }

      `}</style>

    </div>
  );
}