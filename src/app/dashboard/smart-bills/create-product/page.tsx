'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  FileText,
  Upload,
  X,
  Loader2,
  ArrowRight,
  CheckCircle,
  Eye,
  Copy,
  Check,
  Lock,
  Globe,
  ChevronDown,
  ChevronUp,
  Rocket,
  Share2,
  File,
  Clock,
  Settings,
} from 'lucide-react';
import { getStoredMerchant, getToken } from '@/lib/auth';
import OnboardingGuard, { useOnboarding } from '@/components/OnboardingGuard';

function InnerCreateProductLink() {
  const router = useRouter();
  const { isOnboarded, isLoading } = useOnboarding();
  const nameInputRef = useRef<HTMLInputElement>(null);

  // ─── Form State ──────────────────────────────────────────────────────
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [digitalFile, setDigitalFile] = useState<File | null>(null);
  const [digitalFileName, setDigitalFileName] = useState<string>('');
  const [linkExpiry, setLinkExpiry] = useState('24 Hours');
  
  // ─── Advanced Options ──────────────────────────────────────────────
  const [showAdvanced, setShowAdvanced] = useState(false);

  // ─── Generation State ──────────────────────────────────────────────
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [productLink, setProductLink] = useState('');
  const [productId, setProductId] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Auto-load Business Data ──────────────────────────────────────
  const merchantData = getStoredMerchant();

  // ─── Auto-focus on mount ──────────────────────────────────────────
  useEffect(() => {
    if (!isLoading && isOnboarded) {
      setTimeout(() => nameInputRef.current?.focus(), 200);
    }
  }, [isLoading, isOnboarded]);

  // ─── Handle Digital File Upload ──────────────────────────────────
  const handleDigitalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        setError('File too large. Maximum size is 25MB.');
        return;
      }
      setDigitalFile(file);
      setDigitalFileName(file.name);
      setError(null);
    }
  };

  const removeDigitalFile = () => {
    setDigitalFile(null);
    setDigitalFileName('');
  };

  // ─── Get expiry days from selection ──────────────────────────────
  const getExpiryDays = (selection: string): number => {
    const map: Record<string, number> = {
      '1 Hour': 1/24,
      '6 Hours': 6/24,
      '24 Hours': 1,
      '3 Days': 3,
      '7 Days': 7,
      '30 Days': 30,
      'Never': 3650, // 10 years
    };
    return map[selection] || 7;
  };

  // ─── Generate Product Link ──────────────────────────────────────────
  const handleGenerate = async () => {
    if (!name.trim()) {
      setError('Product name is required');
      nameInputRef.current?.focus();
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      setError('Please enter a valid price');
      return;
    }

    if (!digitalFile) {
      setError('Please upload a digital file (PDF, DOCX, etc.)');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const token = getToken();
      
      // ─── Upload digital file ──────────────────────────────────────
      let fileUrl = '';
      if (digitalFile) {
        const formData = new FormData();
        formData.append('file', digitalFile);
        formData.append('merchantId', String(merchantData?.merchant_id || merchantData?.merchantId));

        const uploadRes = await fetch('/api/products/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        });

        if (uploadRes.ok) {
          const data = await uploadRes.json();
          fileUrl = data.data?.fileUrl || data.fileUrl || '';
        } else {
          throw new Error('Failed to upload digital file');
        }
      }

      // ─── Create Product Link ──────────────────────────────────────
      const createRes = await fetch('/api/product-links', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchantId: merchantData?.merchant_id || merchantData?.merchantId,
          name: name.trim(),
          price: parseFloat(price),
          fulfillmentType: 'digital',
          fileUrl: fileUrl,
          fileName: digitalFileName,
          expiryDays: getExpiryDays(linkExpiry),
        }),
      });

      const data = await createRes.json();

      if (!createRes.ok) {
        throw new Error(data.error || 'Failed to create product link');
      }

      const link = `${window.location.origin}/p/${data.data.slug}`;
      setProductLink(link);
      setProductId(data.data.id);
      setGenerated(true);

      await navigator.clipboard.writeText(link);
      setCopied(true);

    } catch (error: any) {
      setError(error.message || 'Failed to create product link');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(productLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const shareToWhatsApp = () => {
    if (!productLink) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(`🛍️ Check this out!\n${productLink}`)}`, '_blank');
  };

  const isFormValid = name.trim() && price && parseFloat(price) > 0 && digitalFile;

  // ─── ONBOARDING GUARD ──────────────────────────────────────────────
  if (!isLoading && !isOnboarded) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-8">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Setup Required</h2>
        <p className="text-gray-500 max-w-md mb-6">
          Complete your business details before creating product links.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Product Link</h1>
        <p className="text-sm text-gray-500 mt-1">
          Sell digital files with a single reusable link
        </p>
      </div>

      {/* ─── Error Message ───────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <div className="flex-1">
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── Form ────────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5">

        {/* ─── 1. Product Name ───────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            ref={nameInputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Professional CV Writing"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
        </div>

        {/* ─── 2. Price ───────────────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price (KES) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">KES</span>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="2,500"
              className="w-full pl-14 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
              min="1"
              step="1"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
          </div>
        </div>

        {/* ─── 3. Digital File Upload ─────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Digital File <span className="text-red-500">*</span>
          </label>
          {!digitalFile ? (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-indigo-400 transition-colors cursor-pointer relative">
              <input
                type="file"
                onChange={handleDigitalFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.txt,.zip"
              />
              <div className="flex flex-col items-center gap-2 pointer-events-none">
                <File className="w-10 h-10 text-gray-400" />
                <p className="text-sm text-gray-600">Upload your digital file</p>
                <p className="text-xs text-gray-400">
                  PDF, DOCX, XLSX, Images, ZIP (Max 25MB)
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-indigo-600" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{digitalFileName}</p>
                  <p className="text-xs text-gray-500">
                    {(digitalFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={removeDigitalFile}
                className="p-2 hover:bg-indigo-100 rounded-lg transition-colors text-gray-500 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Customers will download this file after payment
          </p>
        </div>

        {/* ─── ⚙️ Advanced Options ───────────────────────────────────── */}
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Advanced Options
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showAdvanced && (
            <div className="mt-3 p-4 bg-gray-50 rounded-xl space-y-4 border border-gray-200">
              {/* Link Expiry */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  Link Expiry
                </label>
                <select
                  value={linkExpiry}
                  onChange={(e) => setLinkExpiry(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                >
                  <option value="1 Hour">1 Hour</option>
                  <option value="6 Hours">6 Hours</option>
                  <option value="24 Hours">24 Hours</option>
                  <option value="3 Days">3 Days</option>
                  <option value="7 Days">7 Days</option>
                  <option value="30 Days">30 Days</option>
                  <option value="Never">Never</option>
                </select>
                <p className="text-[10px] text-gray-400 mt-1">
                  How long the link will remain active for customers
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Generate Button ─────────────────────────────────────────── */}
      <button
        onClick={handleGenerate}
        disabled={!isFormValid || isGenerating}
        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-base transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Creating...
          </>
        ) : (
          <>
            <Rocket className="w-5 h-5" />
            Generate Link & Copy
          </>
        )}
      </button>

      {/* ─── Success State ───────────────────────────────────────────── */}
      {generated && productLink && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">🎉 Link Created!</h3>
          <p className="text-sm text-gray-500 mt-1">Share this link with your customers</p>

          <div className="mt-4 bg-white rounded-xl p-3 flex items-center gap-2 border border-emerald-200">
            <input
              type="text"
              value={productLink}
              readOnly
              className="flex-1 bg-transparent text-sm text-gray-700 focus:outline-none"
            />
            <button
              onClick={copyToClipboard}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-gray-500" />}
            </button>
          </div>
          {copied && <p className="text-xs text-emerald-600 mt-1">✅ Copied to clipboard!</p>}

          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <button
              onClick={shareToWhatsApp}
              className="flex-1 py-2.5 bg-[#25D366] hover:bg-[#1DA851] text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all"
            >
              <Share2 className="w-4 h-4" />
              Share to WhatsApp
            </button>
            <button
              onClick={() => window.open(productLink, '_blank')}
              className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700 flex items-center justify-center gap-2 transition-all"
            >
              <Eye className="w-4 h-4" />
              View Page
            </button>
            <button
              onClick={() => {
                setGenerated(false);
                setProductLink('');
                setName('');
                setPrice('');
                setDigitalFile(null);
                setDigitalFileName('');
                setCopied(false);
                setShowAdvanced(false);
                setTimeout(() => nameInputRef.current?.focus(), 100);
              }}
              className="py-2.5 px-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Create Another
            </button>
          </div>
        </div>
      )}

      {/* ─── Footer ───────────────────────────────────────────────────── */}
      <p className="text-xs text-gray-400 text-center">
        🔒 Secure by XecoFlow · Instant payment via M-PESA
      </p>
    </div>
  );
}

// ─── Wrap with Onboarding Guard ──────────────────────────────────────
export default function WrappedCreateProductLink() {
  return (
    <OnboardingGuard>
      <InnerCreateProductLink />
    </OnboardingGuard>
  );
}