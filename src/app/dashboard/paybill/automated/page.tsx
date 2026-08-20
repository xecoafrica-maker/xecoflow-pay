// src/app/dashboard/paybill/automated/page.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  Download,
  Printer,
  Share2,
  QrCode,
  Copy,
  Check,
  Loader2,
  Building2,
  Smartphone,
  Send,
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
        // Replace with your actual API call
        // const response = await fetch('/api/merchant/profile');
        // const data = await response.json();
        
        // Using stored merchant data from auth
        const stored = getStoredMerchant();
        
        // Mock data - replace with actual API response
        const mockData = {
          businessName: stored?.businessName || 'KIAMBU HARDWARE STORES',
          virtualAccount: stored?.virtualAccount || 'XC-102-KIAMBU',
          shortcode: '404926',
        };
        
        setMerchant(mockData);
        setQrValue(`mpesa://paybill?shortcode=${mockData.shortcode}&account=${mockData.virtualAccount}`);
      } catch (error) {
        console.error('Error fetching merchant data:', error);
        // Fallback default values
        setMerchant({
          businessName: 'BUSINESS NAME',
          virtualAccount: 'XC-000-DEFAULT',
          shortcode: '404926',
        });
        setQrValue('mpesa://paybill?shortcode=404926&account=XC-000-DEFAULT');
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
        <div className="flex items-center justify-between mb-6">
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
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-center">
            <div 
              ref={posterRef}
              className="w-full max-w-[500px] aspect-[3/4] bg-gradient-to-br from-emerald-50 to-white rounded-2xl border-2 border-emerald-200 shadow-xl overflow-hidden print:border-2 print:border-emerald-300"
            >
              {/* Poster Content */}
              <div className="h-full flex flex-col p-6">
                {/* Top Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
                      PAY WITH M-PESA
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-bold text-gray-900">Xeco</span>
                    <span className="text-lg font-bold text-emerald-500">Flow</span>
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                  {/* PayBill Number */}
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">PayBill Number</p>
                    <p className="text-4xl md:text-5xl font-bold text-gray-900 tracking-widest">
                      {merchant?.shortcode || '404926'}
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="w-16 h-0.5 bg-emerald-300 rounded-full" />

                  {/* Account Number */}
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Account Number</p>
                    <p className="text-xl md:text-2xl font-bold text-emerald-600 tracking-wide">
                      {merchant?.virtualAccount || 'XC-000-DEFAULT'}
                    </p>
                  </div>

                  {/* Account Name */}
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Account Name</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {merchant?.businessName || 'BUSINESS NAME'}
                    </p>
                  </div>

                  {/* QR Code */}
                  <div className="mt-2 p-3 bg-white rounded-xl shadow-md">
                    <QRCodeSVG
                      value={qrValue}
                      size={140}
                      level="H"
                      includeMargin
                      className="w-32 h-32"
                    />
                  </div>

                  {/* Footer */}
                  <div className="text-center mt-auto pt-2">
                    <p className="text-[10px] text-gray-400">
                      Scan to pay securely via M-PESA
                    </p>
                    <div className="flex items-center justify-center gap-4 mt-1">
                      <span className="text-[10px] text-gray-400">✓ Secure</span>
                      <span className="text-[10px] text-gray-400">✓ Instant</span>
                      <span className="text-[10px] text-gray-400">✓ Reliable</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Action Buttons ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
        <div className="mt-6 bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700">Virtual Account Details</p>
              <p className="text-xs text-gray-500 mt-1">
                <span className="font-medium">PayBill:</span> {merchant?.shortcode || '404926'} &bull;{' '}
                <span className="font-medium">Account:</span> {merchant?.virtualAccount || 'XC-000-DEFAULT'}
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
          body * {
            visibility: hidden;
          }
          [ref="posterRef"] * {
            visibility: visible;
          }
          [ref="posterRef"] {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 100%;
            max-width: 500px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}