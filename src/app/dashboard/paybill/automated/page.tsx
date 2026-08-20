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
  Building2,
  Smartphone,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
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
  const [qrValue, setQrValue] = useState('');

  // ─── Load merchant data ──────────────────────────────────────────
  useEffect(() => {
    const fetchMerchantData = async () => {
      try {
        const stored = getStoredMerchant();
        
        const mockData = {
          businessName: stored?.businessName || 'BRIANONUONGA',
          virtualAccount: stored?.virtualAccount || '742790442',
          shortcode: '247247',
        };
        
        setMerchant(mockData);
        setQrValue(`mpesa://paybill?shortcode=${mockData.shortcode}&account=${mockData.virtualAccount}`);
      } catch (error) {
        console.error('Error fetching merchant data:', error);
        setMerchant({
          businessName: 'BRIANONUONGA',
          virtualAccount: '742790442',
          shortcode: '247247',
        });
        setQrValue('mpesa://paybill?shortcode=247247&account=742790442');
      } finally {
        setLoading(false);
      }
    };

    fetchMerchantData();
  }, []);

  // ─── Generate QR Code value ──────────────────────────────────────
  useEffect(() => {
    if (merchant) {
      setQrValue(`mpesa://paybill?shortcode=${merchant.shortcode}&account=${merchant.virtualAccount}`);
    }
  }, [merchant]);

  // ─── Copy PayBill details ────────────────────────────────────────
  const handleCopyDetails = useCallback(() => {
    if (!merchant) return;
    const text = `PAY WITH M-PESA\nPayBill: ${merchant.shortcode}\nAccount: ${merchant.virtualAccount}\nBusiness: ${merchant.businessName}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }, [merchant]);

  // ─── Download PDF ─────────────────────────────────────────────────
  const handleDownloadPDF = useCallback(async () => {
    if (!posterRef.current || !merchant) return;

    setExporting(true);
    try {
      const canvas = await html2canvas(posterRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 600,
        height: 800,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`paybill-${merchant.virtualAccount}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setExporting(false);
    }
  }, [merchant]);

  // ─── Print ────────────────────────────────────────────────────────
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // ─── Share via WhatsApp ───────────────────────────────────────────
  const handleShareWhatsApp = useCallback(() => {
    if (!merchant) return;
    
    const message = encodeURIComponent(
      `📱 PAY WITH M-PESA\n\n` +
      `PayBill Number: ${merchant.shortcode}\n` +
      `Account Number: ${merchant.virtualAccount}\n` +
      `Business: ${merchant.businessName}\n\n` +
      `Scan QR Code or use the details above to pay.`
    );
    
    const url = `https://api.whatsapp.com/send?text=${message}`;
    window.open(url, '_blank');
  }, [merchant]);

  // ─── Loading state ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your PayBill details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* ─── Header ────────────────────────────────────────────────── */}
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
              <h1 className="text-2xl font-bold text-gray-900">Xeco V-PayBill</h1>
              <p className="text-sm text-gray-500">Automated Virtual PayBill Poster</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyDetails}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Details'}
            </button>
          </div>
        </div>

        {/* ─── Poster Preview ───────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 no-print">
          <div className="flex justify-center">
            <div 
              ref={posterRef}
              className="w-full max-w-[400px] aspect-[9/16] bg-white rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none"
            >
              {/* Poster Content - M-PESA Style */}
              <div className="h-full flex flex-col bg-gradient-to-b from-emerald-600 to-emerald-700 p-6">
                {/* PAY WITH M-PESA Header */}
                <div className="text-center mb-2">
                  <p className="text-white/80 text-xs font-medium tracking-wider">PAY WITH</p>
                  <div className="flex items-center justify-center gap-3 mt-1">
                    <span className="text-white font-bold text-2xl">M-PESA</span>
                    <span className="text-white/50 text-xl font-light">/</span>
                    <span className="text-white font-bold text-2xl">Equity</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-white/20 my-3" />

                {/* PAYBILL Section */}
                <div className="text-center">
                  <p className="text-white/70 text-[10px] font-medium tracking-[0.2em]">PAYBILL</p>
                  <p className="text-white font-bold text-4xl tracking-[0.3em] mt-1">
                    {merchant?.shortcode || '247247'}
                  </p>
                </div>

                {/* Divider */}
                <div className="border-t border-white/20 my-3" />

                {/* Account Number Section */}
                <div className="text-center">
                  <p className="text-white/70 text-[10px] font-medium tracking-[0.2em]">EQUITYTILLNO./ACCOUNTNO</p>
                  <div className="flex justify-center gap-1 mt-1">
                    {(merchant?.virtualAccount || '742790442').split('').map((digit, index) => (
                      <span 
                        key={index} 
                        className="text-white font-bold text-3xl tracking-wider"
                      >
                        {digit}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-white/20 my-3" />

                {/* Account Name */}
                <div className="text-center">
                  <p className="text-white/70 text-[10px] font-medium tracking-[0.2em]">ACCOUNTNAME</p>
                  <p className="text-white font-bold text-xl tracking-wider mt-1">
                    {merchant?.businessName || 'BRIANONUONGA'}
                  </p>
                </div>

                {/* Divider */}
                <div className="border-t border-white/20 my-3" />

                {/* QR Code and Mobile App Section */}
                <div className="flex-1 flex items-center justify-between mt-2">
                  {/* QR Code */}
                  <div className="bg-white rounded-xl p-2 shadow-lg">
                    <QRCodeSVG
                      value={qrValue}
                      size={120}
                      level="H"
                      includeMargin={false}
                      className="w-[120px] h-[120px]"
                    />
                  </div>

                  {/* Mobile App Info */}
                  <div className="text-right">
                    <p className="text-white/70 text-[10px] font-medium tracking-[0.2em]">MOBILEAPP</p>
                    <p className="text-white font-bold text-xl">EQUITY</p>
                    <div className="flex items-center justify-end gap-2 mt-1">
                      <span className="text-white font-semibold text-sm">Equitel</span>
                      <span className="text-white/50 text-xs">money</span>
                    </div>
                    <div className="mt-2">
                      <p className="text-white/50 text-[10px]">DIAL</p>
                      <p className="text-white font-bold text-lg">*247#</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Action Buttons ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 no-print">
          <button
            onClick={handleDownloadPDF}
            disabled={exporting}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white rounded-xl font-medium transition-colors shadow-sm"
          >
            {exporting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            {exporting ? 'Generating...' : 'Download PDF'}
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

        {/* ─── Additional Info ──────────────────────────────────────── */}
        <div className="mt-6 bg-white rounded-xl p-4 border border-gray-200 no-print">
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700">Virtual Account Details</p>
              <p className="text-xs text-gray-500 mt-1">
                <span className="font-medium">PayBill:</span> {merchant?.shortcode || '247247'} &bull;{' '}
                <span className="font-medium">Account:</span> {merchant?.virtualAccount || '742790442'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Share these details with your customers for seamless M-PESA payments.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Print Styles ───────────────────────────────────────────── */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          [ref="posterRef"] {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 100%;
            max-width: 400px;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          [ref="posterRef"] * {
            visibility: visible !important;
          }
        }
      `}</style>
    </div>
  );
}