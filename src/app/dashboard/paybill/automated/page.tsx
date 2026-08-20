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

  const DARK_BLUE = '#073B73';
  const BLUE = '#0A4D8C';
  const GREEN = '#099447';
  const LIGHT_BLUE = '#EAF2F8';
  const BORDER = '#B9C5CF';

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
      `Xecoflow Smart PayBill\n\n` +
      `PAY WITH: M-PESA\n` +
      `PayBill Number: ${merchant.shortcode}\n` +
      `Account Number: ${merchant.virtualAccount}\n` +
      `Business Name: ${merchant.businessName}`;

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
        orientation: 'landscape',
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
      `Xecoflow Smart PayBill\n\n` +
        `PAY WITH: M-PESA\n` +
        `PayBill Number: ${merchant.shortcode}\n` +
        `Account Number: ${merchant.virtualAccount}\n` +
        `Business Name: ${merchant.businessName}`
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

  const paybillDigits = (
    merchant?.shortcode || '4049263'
  ).split('');

  const accountDigits = (
    merchant?.virtualAccount || '01500520015312'
  ).split('');

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">

      <div className="max-w-6xl mx-auto">

        {/* ====================================================== */}
        {/* PAGE HEADER */}
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
                M-PESA PayBill Poster
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
        {/* POSTER CONTAINER */}
        {/* ====================================================== */}

        <div className="bg-white rounded-xl shadow-lg p-5 md:p-8 mb-6 no-print">

          <div className="flex justify-center">

            <div
              ref={posterRef}
              className="xecoflow-poster"
            >

              {/* ================================================= */}
              {/* TOP HEADER */}
              {/* ================================================= */}

              <div className="poster-top">

                {/* Xecoflow corner branding */}

                <div className="xecoflow-corner">

                  <div className="xecoflow-name">
                    Xecoflow
                  </div>

                  <div className="xecoflow-paybill">
                    Smart PayBill
                  </div>

                </div>


                {/* PAY WITH */}

                <div className="pay-with">

                  <div className="pay-with-label">
                    PAY WITH
                  </div>

                  <div className="mpesa-brand">

                    <img
                      src="/mpesa-logo.png"
                      alt="M-PESA"
                      className="mpesa-logo"
                      crossOrigin="anonymous"
                    />

                    <span className="mpesa-text">
                      M-PESA
                    </span>

                  </div>

                </div>

              </div>


              {/* ================================================= */}
              {/* PAYMENT OPTIONS / PAYBILL */}
              {/* ================================================= */}

              <div className="payment-area">

                {/* PAYBILL LABEL */}

                <div className="payment-heading">
                  PAYBILL
                </div>


                {/* PAYBILL NUMBER */}

                <div className="paybill-number">

                  {paybillDigits.map((digit, index) => (
                    <div
                      key={`paybill-${index}`}
                      className="large-digit"
                    >
                      {digit}
                    </div>
                  ))}

                </div>


                {/* SMALL INFORMATION */}

                <div className="charge-note">
                  Use M-PESA to make your payment
                </div>

              </div>


              {/* ================================================= */}
              {/* ACCOUNT NUMBER HEADER */}
              {/* ================================================= */}

              <div className="section-label">
                ACCOUNT / TILL NUMBER
              </div>


              {/* ================================================= */}
              {/* ACCOUNT NUMBER */}
              {/* ================================================= */}

              <div className="account-number">

                {accountDigits.map((digit, index) => (
                  <div
                    key={`account-${index}`}
                    className="account-digit"
                  >
                    {digit}
                  </div>
                ))}

              </div>


              {/* ================================================= */}
              {/* BUSINESS NAME HEADER */}
              {/* ================================================= */}

              <div className="section-label business-label">
                BUSINESS NAME
              </div>


              {/* ================================================= */}
              {/* BUSINESS NAME */}
              {/* ================================================= */}

              <div className="business-name">
                {merchant?.businessName ||
                  'Xecoflow Smart PayBill'}
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
        {/* DETAILS */}
        {/* ====================================================== */}

        <div className="mt-6 bg-white rounded-xl p-5 border border-gray-200 no-print">

          <p className="text-sm font-semibold text-gray-700 mb-4">
            Xecoflow Smart PayBill Details
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            <div>
              <p className="text-gray-400 text-xs uppercase">
                PayBill Number
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
              <p className="text-gray-400 text-xs uppercase">
                Account / Till Number
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
              <p className="text-gray-400 text-xs uppercase">
                Payment Method
              </p>

              <p
                className="font-bold text-lg"
                style={{
                  color: GREEN,
                }}
              >
                M-PESA
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
           POSTER
        ======================================================== */

        .xecoflow-poster {

          width: 900px;

          max-width: 100%;

          aspect-ratio: 1.65 / 1;

          background: #ffffff;

          overflow: hidden;

          padding: 30px 38px 18px;

          box-sizing: border-box;

          display: flex;

          flex-direction: column;

          color: ${DARK_BLUE};

          font-family:
            Arial,
            Helvetica,
            sans-serif;

        }


        /* ========================================================
           TOP
        ======================================================== */

        .poster-top {

          width: 100%;

          display: flex;

          align-items: flex-start;

          justify-content: space-between;

          margin-bottom: 10px;

        }


        /* ========================================================
           XECOfLOW CORNER
        ======================================================== */

        .xecoflow-corner {

          text-align: left;

          padding-top: 2px;

        }


        .xecoflow-name {

          color: ${GREEN};

          font-size: 38px;

          font-weight: 900;

          line-height: 0.95;

          letter-spacing: -1.5px;

        }


        .xecoflow-paybill {

          color: ${DARK_BLUE};

          font-size: 18px;

          font-weight: 800;

          margin-top: 5px;

          letter-spacing: 0.2px;

        }


        /* ========================================================
           PAY WITH
        ======================================================== */

        .pay-with {

          text-align: center;

          min-width: 260px;

        }


        .pay-with-label {

          color: ${DARK_BLUE};

          font-size: 27px;

          font-weight: 900;

          line-height: 1;

          margin-bottom: 7px;

        }


        .mpesa-brand {

          display: flex;

          align-items: center;

          justify-content: center;

          gap: 9px;

        }


        .mpesa-logo {

          width: 42px;

          height: 32px;

          object-fit: contain;

        }


        .mpesa-text {

          color: #00A651;

          font-size: 30px;

          font-weight: 900;

          letter-spacing: -1px;

        }


        /* ========================================================
           PAYMENT AREA
        ======================================================== */

        .payment-area {

          width: 100%;

          text-align: center;

          margin-top: 2px;

          margin-bottom: 14px;

        }


        .payment-heading {

          color: ${DARK_BLUE};

          font-size: 34px;

          font-weight: 900;

          line-height: 1;

          margin-bottom: 9px;

        }


        /* ========================================================
           PAYBILL DIGITS
        ======================================================== */

        .paybill-number {

          display: flex;

          justify-content: center;

          align-items: stretch;

          width: 100%;

          max-width: 620px;

          margin: auto;

        }


        .large-digit {

          flex: 1;

          height: 72px;

          display: flex;

          align-items: center;

          justify-content: center;

          border: 1.5px solid ${BORDER};

          background: #f8fbfd;

          color: ${DARK_BLUE};

          font-size: 55px;

          font-weight: 900;

          line-height: 1;

        }


        /* ========================================================
           NOTE
        ======================================================== */

        .charge-note {

          color: #777;

          font-size: 12px;

          margin-top: 7px;

        }


        /* ========================================================
           BLUE SECTION LABEL
        ======================================================== */

        .section-label {

          width: 100%;

          background: ${DARK_BLUE};

          color: #ffffff;

          text-align: center;

          font-size: 21px;

          font-weight: 900;

          letter-spacing: 0.4px;

          line-height: 1;

          padding: 7px 10px;

          box-sizing: border-box;

        }


        /* ========================================================
           ACCOUNT NUMBER
        ======================================================== */

        .account-number {

          width: 100%;

          display: flex;

          justify-content: center;

          align-items: stretch;

          margin-bottom: 9px;

        }


        .account-digit {

          flex: 1;

          min-width: 0;

          height: 61px;

          border-left: 1.5px solid ${BORDER};

          border-right: 1.5px solid ${BORDER};

          border-bottom: 1.5px solid ${BORDER};

          background: #ffffff;

          display: flex;

          align-items: center;

          justify-content: center;

          color: ${DARK_BLUE};

          font-size: 40px;

          font-weight: 900;

          line-height: 1;

        }


        /* ========================================================
           BUSINESS
        ======================================================== */

        .business-label {

          margin-top: 1px;

        }


        .business-name {

          width: 100%;

          min-height: 55px;

          border-left: 1.5px solid ${BORDER};

          border-right: 1.5px solid ${BORDER};

          border-bottom: 1.5px solid ${BORDER};

          background: #ffffff;

          color: ${DARK_BLUE};

          display: flex;

          align-items: center;

          justify-content: center;

          text-align: center;

          font-size: 31px;

          font-weight: 900;

          text-transform: uppercase;

          letter-spacing: 1px;

          padding: 5px 12px;

          box-sizing: border-box;

        }


        /* ========================================================
           FOOTER
        ======================================================== */

        .poster-footer {

          display: flex;

          justify-content: flex-end;

          align-items: center;

          gap: 5px;

          margin-top: auto;

          color: #8a8a8a;

          font-size: 8px;

        }


        .poster-footer strong {

          color: ${GREEN};

        }


        /* ========================================================
           TABLET
        ======================================================== */

        @media (max-width: 768px) {

          .xecoflow-poster {

            padding: 22px 20px 12px;

          }


          .xecoflow-name {

            font-size: 31px;

          }


          .xecoflow-paybill {

            font-size: 15px;

          }


          .pay-with-label {

            font-size: 22px;

          }


          .mpesa-text {

            font-size: 25px;

          }


          .payment-heading {

            font-size: 28px;

          }


          .large-digit {

            height: 58px;

            font-size: 43px;

          }


          .section-label {

            font-size: 17px;

          }


          .account-digit {

            height: 50px;

            font-size: 31px;

          }


          .business-name {

            font-size: 23px;

          }

        }


        /* ========================================================
           MOBILE
        ======================================================== */

        @media (max-width: 640px) {

          .xecoflow-poster {

            aspect-ratio: 1.1 / 1;

            padding: 16px 8px 8px;

          }


          .poster-top {

            margin-bottom: 7px;

          }


          .xecoflow-name {

            font-size: 22px;

          }


          .xecoflow-paybill {

            font-size: 10px;

            margin-top: 2px;

          }


          .pay-with {

            min-width: 145px;

          }


          .pay-with-label {

            font-size: 16px;

            margin-bottom: 3px;

          }


          .mpesa-logo {

            width: 27px;

            height: 21px;

          }


          .mpesa-text {

            font-size: 17px;

          }


          .payment-area {

            margin-bottom: 8px;

          }


          .payment-heading {

            font-size: 20px;

            margin-bottom: 5px;

          }


          .large-digit {

            height: 40px;

            font-size: 28px;

          }


          .charge-note {

            font-size: 7px;

            margin-top: 3px;

          }


          .section-label {

            font-size: 11px;

            padding: 4px 5px;

          }


          .account-number {

            margin-bottom: 5px;

          }


          .account-digit {

            height: 34px;

            font-size: 19px;

          }


          .business-name {

            min-height: 32px;

            font-size: 14px;

            letter-spacing: 0.5px;

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

            size: A4 landscape;

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

            padding: 6vh 5vw 3vh !important;

          }


          .xecoflow-name {

            font-size: 62px !important;

          }


          .xecoflow-paybill {

            font-size: 28px !important;

          }


          .pay-with-label {

            font-size: 39px !important;

          }


          .mpesa-text {

            font-size: 42px !important;

          }


          .payment-heading {

            font-size: 48px !important;

          }


          .large-digit {

            height: 92px !important;

            font-size: 72px !important;

          }


          .section-label {

            font-size: 28px !important;

            padding: 10px !important;

          }


          .account-digit {

            height: 80px !important;

            font-size: 52px !important;

          }


          .business-name {

            min-height: 72px !important;

            font-size: 42px !important;

          }


          .charge-note {

            font-size: 14px !important;

          }

        }

      `}</style>

    </div>
  );
}