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

  // ============================================================
  // BRAND COLORS
  // ============================================================

  const GREEN = '#099447';
  const DARK_BLUE = '#073B73';
  const LIGHT_GREEN = '#EAF6EF';
  const BORDER = '#B8B8B8';

  // ============================================================
  // LOAD MERCHANT DATA
  // ============================================================

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

  // ============================================================
  // COPY DETAILS
  // ============================================================

  const handleCopyDetails = useCallback(() => {
    if (!merchant) return;

    const text =
      `XECO SMART PAYBILL\n\n` +
      `PayBill Number: ${merchant.shortcode}\n` +
      `Account Name: ${merchant.businessName}\n` +
      `Account Number: ${merchant.virtualAccount}`;

    navigator.clipboard.writeText(text);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 3000);
  }, [merchant]);

  // ============================================================
  // DOWNLOAD PDF
  // ============================================================

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

  // ============================================================
  // PRINT
  // ============================================================

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // ============================================================
  // WHATSAPP
  // ============================================================

  const handleShareWhatsApp = useCallback(() => {
    if (!merchant) return;

    const message = encodeURIComponent(
      `XECO SMART PAYBILL\n\n` +
        `PayBill Number: ${merchant.shortcode}\n` +
        `Account Name: ${merchant.businessName}\n` +
        `Account Number: ${merchant.virtualAccount}`
    );

    window.open(
      `https://api.whatsapp.com/send?text=${message}`,
      '_blank'
    );
  }, [merchant]);

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">

        <div className="text-center">

          <Loader2
            className="w-12 h-12 animate-spin mx-auto mb-4"
            style={{ color: GREEN }}
          />

          <p className="text-gray-600">
            Loading your PayBill details...
          </p>

        </div>

      </div>
    );
  }

  // ============================================================
  // DIGITS
  // ============================================================

  const paybillDigits = (
    merchant?.shortcode || '4049263'
  ).split('');

  const accountDigits = (
    merchant?.virtualAccount || '01500520015312'
  ).split('');

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">

      <div className="max-w-5xl mx-auto">

        {/* ====================================================== */}
        {/* HEADER */}
        {/* ====================================================== */}

        <div className="flex items-center justify-between mb-6 no-print">

          <div className="flex items-center gap-4">

            <button
              onClick={() => router.back()}
              className="
                p-2
                hover:bg-gray-200
                rounded-lg
                transition-colors
              "
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>

            <div>

              <h1 className="text-2xl font-bold text-gray-900">
                Xecoflow Smart PayBill
              </h1>

              <p className="text-sm text-gray-500">
                Simple PayBill Poster
              </p>

            </div>

          </div>

          <button
            onClick={handleCopyDetails}
            className="
              flex
              items-center
              gap-2
              px-4
              py-2
              text-sm
              bg-gray-200
              hover:bg-gray-300
              rounded-lg
              transition-colors
            "
          >

            {copied ? (
              <Check
                className="w-4 h-4"
                style={{ color: GREEN }}
              />
            ) : (
              <Copy className="w-4 h-4" />
            )}

            {copied ? 'Copied!' : 'Copy Details'}

          </button>

        </div>


        {/* ====================================================== */}
        {/* POSTER PREVIEW */}
        {/* ====================================================== */}

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 no-print">

          <div className="flex justify-center">

            <div
              ref={posterRef}
              className="xecoflow-simple-poster"
            >

              {/* ================================================= */}
              {/* XECO SMART PAYBILL */}
              {/* ================================================= */}

              <div
                className="xecoflow-title"
                style={{
                  color: GREEN,
                }}
              >
                XECO SMART PAYBILL
              </div>


              {/* ================================================= */}
              {/* PAYBILL NUMBER LABEL */}
              {/* ================================================= */}

              <div
                className="field-label"
                style={{
                  color: GREEN,
                }}
              >
                PAYBILL NUMBER
              </div>


              {/* ================================================= */}
              {/* PAYBILL NUMBER */}
              {/* ================================================= */}

              <div className="number-row paybill-row">

                {paybillDigits.map((digit, index) => (
                  <div
                    key={`paybill-${index}`}
                    className="number-box"
                    style={{
                      color: DARK_BLUE,
                    }}
                  >
                    {digit}
                  </div>
                ))}

              </div>


              {/* ================================================= */}
              {/* ACCOUNT NAME */}
              {/* ================================================= */}

              <div
                className="field-label account-name-label"
                style={{
                  color: GREEN,
                }}
              >
                ACCOUNT NAME
              </div>


              {/* ================================================= */}
              {/* BUSINESS NAME */}
              {/* ================================================= */}

              <div
                className="business-name-box"
                style={{
                  color: DARK_BLUE,
                }}
              >
                {merchant?.businessName ||
                  'Xecoflow Smart PayBill'}
              </div>


              {/* ================================================= */}
              {/* ACCOUNT NUMBER */}
              {/* ================================================= */}

              <div
                className="field-label account-number-label"
                style={{
                  color: GREEN,
                }}
              >
                ACCOUNT NUMBER
              </div>


              {/* ================================================= */}
              {/* ACCOUNT NUMBER DIGITS */}
              {/* ================================================= */}

              <div className="number-row account-row">

                {accountDigits.map((digit, index) => (
                  <div
                    key={`account-${index}`}
                    className="number-box account-box"
                    style={{
                      color: DARK_BLUE,
                    }}
                  >
                    {digit}
                  </div>
                ))}

              </div>


              {/* ================================================= */}
              {/* FOOTER */}
              {/* ================================================= */}

              <div className="poster-footer">

                <span>
                  Powered by
                </span>

                <strong>
                  Xecoflow Smart PayBill
                </strong>

              </div>

            </div>

          </div>

        </div>


        {/* ====================================================== */}
        {/* ACTION BUTTONS */}
        {/* ====================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 no-print">

          {/* DOWNLOAD */}

          <button
            onClick={handleDownloadPDF}
            disabled={exporting}
            className="
              flex
              items-center
              justify-center
              gap-2
              px-4
              py-3
              text-white
              rounded-xl
              font-medium
              transition-colors
              shadow-sm
              disabled:opacity-60
            "
            style={{
              backgroundColor: GREEN,
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


          {/* PRINT */}

          <button
            onClick={handlePrint}
            className="
              flex
              items-center
              justify-center
              gap-2
              px-4
              py-3
              bg-gray-200
              hover:bg-gray-300
              text-gray-800
              rounded-xl
              font-medium
              transition-colors
            "
          >

            <Printer className="w-5 h-5" />

            Print Poster

          </button>


          {/* WHATSAPP */}

          <button
            onClick={handleShareWhatsApp}
            className="
              flex
              items-center
              justify-center
              gap-2
              px-4
              py-3
              bg-green-500
              hover:bg-green-600
              text-white
              rounded-xl
              font-medium
              transition-colors
              shadow-sm
            "
          >

            <Share2 className="w-5 h-5" />

            Share via WhatsApp

          </button>

        </div>


        {/* ====================================================== */}
        {/* DETAILS CARD */}
        {/* ====================================================== */}

        <div className="mt-6 bg-white rounded-xl p-5 border border-gray-200 no-print">

          <p className="text-sm font-semibold text-gray-700 mb-4">
            Xecoflow Smart PayBill Details
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            <div>

              <p className="text-gray-400 text-xs">
                PAYBILL NUMBER
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
                ACCOUNT NAME
              </p>

              <p
                className="font-bold text-lg"
                style={{
                  color: DARK_BLUE,
                }}
              >
                {merchant?.businessName}
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

          </div>

        </div>

      </div>


      {/* ======================================================== */}
      {/* POSTER CSS */}
      {/* ======================================================== */}

      <style jsx global>{`

        /* ========================================================
           MAIN POSTER
        ======================================================== */

        .xecoflow-simple-poster {

          width: 800px;

          max-width: 100%;

          aspect-ratio: 1.55 / 1;

          background: #ffffff;

          box-sizing: border-box;

          padding: 45px 55px 25px;

          display: flex;

          flex-direction: column;

          align-items: center;

          overflow: hidden;

          font-family:
            Arial,
            Helvetica,
            sans-serif;

        }


        /* ========================================================
           XECO SMART PAYBILL
        ======================================================== */

        .xecoflow-title {

          width: 100%;

          text-align: center;

          font-size: clamp(
            36px,
            7vw,
            68px
          );

          font-weight: 900;

          letter-spacing: -1.5px;

          line-height: 1;

          margin-bottom: 20px;

        }


        /* ========================================================
           FIELD LABELS
        ======================================================== */

        .field-label {

          width: 100%;

          text-align: center;

          font-size: clamp(
            19px,
            3.5vw,
            31px
          );

          font-weight: 900;

          line-height: 1;

          margin-bottom: 10px;

        }


        /* ========================================================
           NUMBER ROW
        ======================================================== */

        .number-row {

          width: 100%;

          display: flex;

          justify-content: center;

          align-items: stretch;

        }


        /* ========================================================
           NUMBER BOX
        ======================================================== */

        .number-box {

          flex: 1;

          min-width: 0;

          height: 65px;

          border: 1.5px solid ${BORDER};

          background: #ffffff;

          display: flex;

          align-items: center;

          justify-content: center;

          font-size: 48px;

          font-weight: 900;

          line-height: 1;

          box-sizing: border-box;

        }


        /* ========================================================
           ACCOUNT NAME
        ======================================================== */

        .account-name-label {

          margin-top: 20px;

          margin-bottom: 9px;

        }


        .business-name-box {

          width: 100%;

          min-height: 64px;

          border: 1.5px solid ${BORDER};

          background: #ffffff;

          display: flex;

          align-items: center;

          justify-content: center;

          text-align: center;

          padding: 7px 15px;

          box-sizing: border-box;

          font-size: clamp(
            23px,
            4vw,
            40px
          );

          font-weight: 900;

          text-transform: uppercase;

          line-height: 1.1;

          overflow: hidden;

        }


        /* ========================================================
           ACCOUNT NUMBER
        ======================================================== */

        .account-number-label {

          margin-top: 19px;

          margin-bottom: 9px;

        }


        .account-row {

          width: 100%;

        }


        .account-box {

          height: 58px;

          font-size: clamp(
            22px,
            4vw,
            38px
          );

        }


        /* ========================================================
           FOOTER
        ======================================================== */

        .poster-footer {

          margin-top: auto;

          width: 100%;

          display: flex;

          justify-content: flex-end;

          align-items: center;

          gap: 4px;

          color: #999999;

          font-size: 8px;

        }


        .poster-footer strong {

          color: ${GREEN};

        }


        /* ========================================================
           TABLET
        ======================================================== */

        @media (max-width: 768px) {

          .xecoflow-simple-poster {

            padding: 30px 25px 18px;

          }


          .xecoflow-title {

            font-size: 42px;

            margin-bottom: 14px;

          }


          .field-label {

            font-size: 23px;

          }


          .number-box {

            height: 53px;

            font-size: 38px;

          }


          .business-name-box {

            min-height: 52px;

            font-size: 27px;

          }


          .account-box {

            height: 48px;

            font-size: 29px;

          }

        }


        /* ========================================================
           MOBILE
        ======================================================== */

        @media (max-width: 640px) {

          .xecoflow-simple-poster {

            aspect-ratio: 1.05 / 1;

            padding: 22px 9px 10px;

          }


          .xecoflow-title {

            font-size: 28px;

            letter-spacing: -0.8px;

            margin-bottom: 12px;

          }


          .field-label {

            font-size: 15px;

            margin-bottom: 5px;

          }


          .number-box {

            height: 38px;

            font-size: 26px;

          }


          .account-name-label {

            margin-top: 11px;

          }


          .business-name-box {

            min-height: 38px;

            font-size: 17px;

            padding: 4px 7px;

          }


          .account-number-label {

            margin-top: 11px;

          }


          .account-box {

            height: 34px;

            font-size: 18px;

          }


          .poster-footer {

            font-size: 5px;

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


          .xecoflow-simple-poster {

            width: 100vw !important;

            height: 100vh !important;

            max-width: none !important;

            aspect-ratio: auto !important;

            padding: 10vh 6vw 5vh !important;

          }


          .xecoflow-title {

            font-size: 75px !important;

            margin-bottom: 30px !important;

          }


          .field-label {

            font-size: 38px !important;

            margin-bottom: 14px !important;

          }


          .number-box {

            height: 85px !important;

            font-size: 65px !important;

          }


          .account-name-label {

            margin-top: 30px !important;

          }


          .business-name-box {

            min-height: 82px !important;

            font-size: 48px !important;

          }


          .account-number-label {

            margin-top: 28px !important;

          }


          .account-box {

            height: 75px !important;

            font-size: 48px !important;

          }


          .poster-footer {

            font-size: 10px !important;

          }

        }

      `}</style>

    </div>
  );
}