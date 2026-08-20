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

  // ------------------------------------------------------------
  // Brand colors
  // ------------------------------------------------------------

  const GREEN = '#079447';
  const DARK_BLUE = '#063B70';
  const BORDER = '#AEB7BD';

  // ------------------------------------------------------------
  // Load merchant
  // ------------------------------------------------------------

  useEffect(() => {
    const loadMerchant = async () => {
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
        console.error('Failed to load merchant:', error);

        setMerchant({
          businessName: 'Xecoflow Smart PayBill',
          virtualAccount: '01500520015312',
          shortcode: '4049263',
        });
      } finally {
        setLoading(false);
      }
    };

    loadMerchant();
  }, []);

  // ------------------------------------------------------------
  // Copy details
  // ------------------------------------------------------------

  const handleCopyDetails = useCallback(() => {
    if (!merchant) return;

    const text = [
      'XECO SMART PAYBILL',
      '',
      `PayBill Number: ${merchant.shortcode}`,
      `Account Name: ${merchant.businessName}`,
      `Account Number: ${merchant.virtualAccount}`,
    ].join('\n');

    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);

        window.setTimeout(() => {
          setCopied(false);
        }, 3000);
      })
      .catch((error) => {
        console.error('Failed to copy:', error);
      });
  }, [merchant]);

  // ------------------------------------------------------------
  // Download PDF
  // ------------------------------------------------------------

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

      const imageData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imageRatio = canvas.width / canvas.height;

      let imageWidth = pageWidth;
      let imageHeight = imageWidth / imageRatio;

      if (imageHeight > pageHeight) {
        imageHeight = pageHeight;
        imageWidth = imageHeight * imageRatio;
      }

      const x = (pageWidth - imageWidth) / 2;
      const y = (pageHeight - imageHeight) / 2;

      pdf.addImage(
        imageData,
        'PNG',
        x,
        y,
        imageWidth,
        imageHeight
      );

      pdf.save(
        `xecoflow-smart-paybill-${merchant.shortcode}.pdf`
      );
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setExporting(false);
    }
  }, [merchant]);

  // ------------------------------------------------------------
  // Print
  // ------------------------------------------------------------

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // ------------------------------------------------------------
  // WhatsApp
  // ------------------------------------------------------------

  const handleShareWhatsApp = useCallback(() => {
    if (!merchant) return;

    const message = [
      'XECO SMART PAYBILL',
      '',
      `PayBill Number: ${merchant.shortcode}`,
      `Account Name: ${merchant.businessName}`,
      `Account Number: ${merchant.virtualAccount}`,
    ].join('\n');

    const whatsappUrl =
      `https://api.whatsapp.com/send?text=${encodeURIComponent(
        message
      )}`;

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }, [merchant]);

  // ------------------------------------------------------------
  // Loading
  // ------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
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

  const shortcode = merchant?.shortcode || '4049263';

  const virtualAccount =
    merchant?.virtualAccount || '01500520015312';

  const businessName =
    merchant?.businessName || 'Xecoflow Smart PayBill';

  const paybillDigits = shortcode.split('');
  const accountDigits = virtualAccount.split('');

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">

        {/* ======================================================
            PAGE HEADER
        ====================================================== */}

        <div className="flex items-center justify-between mb-6 no-print">
          <div className="flex items-center gap-4">

            <button
              type="button"
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
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
            type="button"
            onClick={handleCopyDetails}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
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

        {/* ======================================================
            POSTER PREVIEW
        ====================================================== */}

        <div className="bg-white rounded-xl shadow-lg p-4 md:p-8 mb-6 no-print">
          <div className="flex justify-center">

            <div
              ref={posterRef}
              className="xecoflow-poster"
            >

              {/* ==================================================
                  BRAND
              ================================================== */}

              <div
                className="xecoflow-brand"
                style={{ color: GREEN }}
              >
                XECO SMART PAYBILL
              </div>

              {/* ==================================================
                  PAYBILL NUMBER LABEL
              ================================================== */}

              <div
                className="field-title"
                style={{ color: GREEN }}
              >
                PAYBILL NUMBER
              </div>

              {/* ==================================================
                  PAYBILL NUMBER
              ================================================== */}

              <div className="digit-row paybill-digits">
                {paybillDigits.map((digit, index) => (
                  <div
                    key={`paybill-${index}`}
                    className="digit-box"
                    style={{ color: DARK_BLUE }}
                  >
                    {digit}
                  </div>
                ))}
              </div>

              {/* ==================================================
                  ACCOUNT NAME LABEL
              ================================================== */}

              <div
                className="field-title account-title"
                style={{ color: GREEN }}
              >
                ACCOUNT NAME
              </div>

              {/* ==================================================
                  ACCOUNT NAME
              ================================================== */}

              <div
                className="business-box"
                style={{ color: DARK_BLUE }}
              >
                {businessName}
              </div>

              {/* ==================================================
                  ACCOUNT NUMBER LABEL
              ================================================== */}

              <div
                className="field-title account-number-title"
                style={{ color: GREEN }}
              >
                ACCOUNT NUMBER
              </div>

              {/* ==================================================
                  ACCOUNT NUMBER
              ================================================== */}

              <div className="digit-row account-digits">
                {accountDigits.map((digit, index) => (
                  <div
                    key={`account-${index}`}
                    className="digit-box account-digit"
                    style={{ color: DARK_BLUE }}
                  >
                    {digit}
                  </div>
                ))}
              </div>

              {/* ==================================================
                  FOOTER
              ================================================== */}

              <div className="poster-footer">
                Xecoflow Smart PayBill
              </div>

            </div>
          </div>
        </div>

        {/* ======================================================
            ACTION BUTTONS
        ====================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 no-print">

          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={exporting}
            className="flex items-center justify-center gap-2 px-4 py-3 text-white rounded-xl font-medium shadow-sm transition-colors disabled:opacity-60"
            style={{ backgroundColor: GREEN }}
          >
            {exporting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}

            {exporting ? 'Generating...' : 'Download PDF'}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-medium transition-colors"
          >
            <Printer className="w-5 h-5" />
            Print Poster
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors shadow-sm"
          >
            <Share2 className="w-5 h-5" />
            Share via WhatsApp
          </button>

        </div>

        {/* ======================================================
            DETAILS
        ====================================================== */}

        <div className="mt-6 bg-white rounded-xl p-5 border border-gray-200 no-print">

          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Xecoflow Smart PayBill Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            <div>
              <p className="text-xs text-gray-400 uppercase">
                PayBill Number
              </p>

              <p
                className="text-xl font-bold mt-1"
                style={{ color: DARK_BLUE }}
              >
                {shortcode}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400 uppercase">
                Account Name
              </p>

              <p
                className="text-xl font-bold mt-1 break-words"
                style={{ color: DARK_BLUE }}
              >
                {businessName}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400 uppercase">
                Account Number
              </p>

              <p
                className="text-xl font-bold mt-1"
                style={{ color: DARK_BLUE }}
              >
                {virtualAccount}
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* ========================================================
          POSTER STYLES
      ======================================================== */}

      <style jsx global>{`
        .xecoflow-poster {
          width: 800px;
          max-width: 100%;
          aspect-ratio: 1.45 / 1;
          background: #ffffff;
          box-sizing: border-box;
          padding: 42px 55px 25px;
          display: flex;
          flex-direction: column;
          align-items: center;
          overflow: hidden;
          font-family: Arial, Helvetica, sans-serif;
        }

        .xecoflow-brand {
          width: 100%;
          text-align: center;
          font-size: 52px;
          font-weight: 900;
          letter-spacing: -1.5px;
          line-height: 1;
          margin-bottom: 28px;
        }

        .field-title {
          width: 100%;
          text-align: center;
          font-size: 27px;
          font-weight: 900;
          line-height: 1;
          margin-bottom: 10px;
        }

        .digit-row {
          width: 100%;
          display: flex;
          align-items: stretch;
          justify-content: center;
        }

        .digit-box {
          flex: 1;
          min-width: 0;
          height: 68px;
          border: 1.5px solid ${BORDER};
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          font-size: 50px;
          font-weight: 900;
          line-height: 1;
        }

        .account-title {
          margin-top: 25px;
          margin-bottom: 10px;
        }

        .business-box {
          width: 100%;
          min-height: 68px;
          border: 1.5px solid ${BORDER};
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          box-sizing: border-box;
          padding: 8px 15px;
          font-size: 34px;
          font-weight: 900;
          text-transform: uppercase;
          line-height: 1.1;
          overflow: hidden;
        }

        .account-number-title {
          margin-top: 25px;
          margin-bottom: 10px;
        }

        .account-digit {
          height: 62px;
          font-size: 42px;
        }

        .poster-footer {
          width: 100%;
          text-align: right;
          color: ${GREEN};
          font-size: 9px;
          font-weight: 700;
          margin-top: auto;
        }

        @media (max-width: 768px) {
          .xecoflow-poster {
            padding: 30px 25px 18px;
          }

          .xecoflow-brand {
            font-size: 40px;
            margin-bottom: 20px;
          }

          .field-title {
            font-size: 21px;
          }

          .digit-box {
            height: 54px;
            font-size: 38px;
          }

          .business-box {
            min-height: 54px;
            font-size: 25px;
          }

          .account-digit {
            height: 50px;
            font-size: 30px;
          }
        }

        @media (max-width: 640px) {
          .xecoflow-poster {
            aspect-ratio: 1.05 / 1;
            padding: 22px 8px 10px;
          }

          .xecoflow-brand {
            font-size: 27px;
            letter-spacing: -0.8px;
            margin-bottom: 13px;
          }

          .field-title {
            font-size: 14px;
            margin-bottom: 5px;
          }

          .digit-box {
            height: 37px;
            font-size: 25px;
          }

          .account-title {
            margin-top: 11px;
          }

          .business-box {
            min-height: 38px;
            font-size: 16px;
            padding: 4px 6px;
          }

          .account-number-title {
            margin-top: 11px;
          }

          .account-digit {
            height: 34px;
            font-size: 18px;
          }

          .poster-footer {
            font-size: 5px;
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
            padding: 10vh 6vw 5vh !important;
          }

          .xecoflow-brand {
            font-size: 76px !important;
            margin-bottom: 35px !important;
          }

          .field-title {
            font-size: 40px !important;
            margin-bottom: 15px !important;
          }

          .digit-box {
            height: 90px !important;
            font-size: 68px !important;
          }

          .account-title {
            margin-top: 35px !important;
          }

          .business-box {
            min-height: 90px !important;
            font-size: 50px !important;
          }

          .account-number-title {
            margin-top: 35px !important;
          }

          .account-digit {
            height: 78px !important;
            font-size: 50px !important;
          }

          .poster-footer {
            font-size: 11px !important;
          }
        }
      `}</style>
    </div>
  );
}