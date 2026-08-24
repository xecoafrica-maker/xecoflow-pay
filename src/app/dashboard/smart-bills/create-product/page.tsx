'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  FileText,
  Wifi,
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
} from 'lucide-react';
import { getStoredMerchant, getToken } from '@/lib/auth';
import OnboardingGuard, { useOnboarding } from '@/components/OnboardingGuard';

type FulfillmentType = 'physical' | 'digital' | 'airtime';

function InnerCreateProductLink() {
  const router = useRouter();
  const { isOnboarded, isLoading } = useOnboarding();
  const nameInputRef = useRef<HTMLInputElement>(null);

  // ─── Form State ──────────────────────────────────────────────────────
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>('physical');
  const [stockQuantity, setStockQuantity] = useState<string>('');
  const [customSlug, setCustomSlug] = useState('');
  const [deliveryAddressRequired, setDeliveryAddressRequired] = useState(true);
  const [productImage, setProductImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showOptional, setShowOptional] = useState(false);

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

  // ─── Handle Image Upload ──────────────────────────────────────────
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProductImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setProductImage(null);
    setImagePreview(null);
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

    setIsGenerating(true);
    setError(null);

    try {
      const token = getToken();
      
      // ─── Upload image if present ──────────────────────────────────
      let imageUrl = '';
      if (productImage) {
        const formData = new FormData();
        formData.append('file', productImage);
        formData.append('merchantId', String(merchantData?.merchant_id || merchantData?.merchantId));

        const uploadRes = await fetch('/api/products/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        });

        if (uploadRes.ok) {
          const data = await uploadRes.json();
          imageUrl = data.data?.fileUrl || data.fileUrl || '';
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
          fulfillmentType,
          stockQuantity: stockQuantity ? parseInt(stockQuantity) : null,
          slug: customSlug.trim() || undefined,
          deliveryAddressRequired,
          imageUrl,
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

      // ─── Auto-copy to clipboard ──────────────────────────────────
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

  const isFormValid = name.trim() && price && parseFloat(price) > 0;

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
          Sell products with a single reusable link
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
            placeholder="e.g. Air Force 1 Sneakers"
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

        {/* ─── 3. Fulfillment Type ───────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fulfillment Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'physical', label: '📦 Physical Good', desc: 'Ships to customer' },
              { id: 'digital', label: '📄 Digital File', desc: 'Instant download' },
              { id: 'airtime', label: '📡 Airtime', desc: 'Auto-delivery' },
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => setFulfillmentType(type.id as FulfillmentType)}
                className={`px-4 py-3 rounded-xl border text-center transition-all ${
                  fulfillmentType === type.id
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="text-sm font-medium">{type.label}</div>
                <div className="text-[10px] text-gray-400">{type.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ─── ⚙️ Optional Settings ──────────────────────────────────── */}
        <div>
          <button
            onClick={() => setShowOptional(!showOptional)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ⚙️ Optional Settings
            {showOptional ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showOptional && (
            <div className="mt-3 p-4 bg-gray-50 rounded-xl space-y-4 border border-gray-200">
              {/* Stock Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Quantity
                </label>
                <select
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                >
                  <option value="">Unlimited</option>
                  <option value="1">1</option>
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>

              {/* Custom Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Slug
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 whitespace-nowrap">xecoflow.com/p/</span>
                  <input
                    type="text"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value)}
                    placeholder="auto-generated"
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Leave blank for auto-generated slug
                </p>
              </div>

              {/* Product Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Image
                </label>
                {!imagePreview ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors cursor-pointer relative">
                    <input
                      type="file"
                      onChange={handleImageChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      accept=".jpg,.jpeg,.png,.webp"
                    />
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Upload image</p>
                    <p className="text-xs text-gray-400">JPG, PNG, WebP (Max 5MB)</p>
                  </div>
                ) : (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Product"
                      className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Delivery Address Required */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="deliveryAddress"
                  checked={deliveryAddressRequired}
                  onChange={(e) => setDeliveryAddressRequired(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="deliveryAddress" className="text-sm text-gray-700">
                  Request delivery address at checkout
                </label>
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
                setCustomSlug('');
                setStockQuantity('');
                setProductImage(null);
                setImagePreview(null);
                setCopied(false);
                setShowOptional(false);
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