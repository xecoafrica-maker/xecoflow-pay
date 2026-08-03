'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Upload,
  FileText,
  Image as ImageIcon,
  X,
  Loader2,
  ArrowRight,
  CheckCircle,
  Eye,
  Copy,
  Check,
  Lock,
} from 'lucide-react';
import { getStoredMerchant } from '@/lib/auth';
import OnboardingGuard, { useOnboarding } from '@/components/OnboardingGuard';

function InnerCreateProductPage() {
  const router = useRouter();
  const { isOnboarded, isLoading } = useOnboarding();
  
  // ─── State ──────────────────────────────────────────────────────────
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState('KES');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  
  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [productLink, setProductLink] = useState('');
  const [productId, setProductId] = useState('');
  const [copied, setCopied] = useState(false);

  // ─── Auto-load Business Name ──────────────────────────────────────
  const merchantData = getStoredMerchant();
  const businessName = merchantData?.businessName || merchantData?.business_name || 'Your Business';

  // ─── Handle File Upload ──────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Create a local preview URL for the UI
      const objectUrl = URL.createObjectURL(selectedFile);
      setFilePreview(objectUrl);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
  };

  // ─── Cleanup preview URL on unmount ──────────────────────────────
  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  // ─── Generate Product Link ────────────────────────────────────────
  const handleGenerate = async () => {
    if (!productName || !price || !file) {
      alert('Please fill in all fields and upload a file.');
      return;
    }

    setIsGenerating(true);

    // 1. Upload file to Supabase Storage
    const formData = new FormData();
    formData.append('file', file);
    formData.append('merchantId', String(merchantData?.merchant_id || merchantData?.merchantId));

    try {
      // Upload API call
      const uploadRes = await fetch('/api/products/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload file');
      }

      const uploadData = await uploadRes.json();
      const fileUrl = uploadData.fileUrl; // The public URL of the file

      // 2. Create the Product Record in the database (We reuse the `bills` table)
      const createRes = await fetch('/api/bills/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: merchantData?.merchant_id || merchantData?.merchantId,
          businessName: businessName,
          customerName: 'Product Customer', // Placeholder for product pages
          items: [{ description: productName, quantity: 1, unitPrice: Number(price) }],
          subtotal: Number(price),
          tax: 0,
          total: Number(price),
          currency: currency,
          taxRate: 0,
          expiryDays: 30, // Products last longer than bills
          description: description,
          returnUrl: `${window.location.origin}/dashboard/transactions`,
          fileUrl: fileUrl,
          billType: 'PRODUCT',
        }),
      });

      const data = await createRes.json();

      if (data.success) {
        const link = `${window.location.origin}/products/${data.data.bill_id}`;
        setProductLink(link);
        setProductId(data.data.bill_id);
        setGenerated(true);
        setCopied(false);
      } else {
        alert('Failed to generate product link: ' + data.error);
      }
    } catch (error: any) {
      console.error('Error generating product:', error);
      alert(error.message || 'Failed to generate product link');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard?.writeText(productLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isFormValid = productName && price && file;

  // ─── ONBOARDING GUARD: BLOCK THE PAGE IF NOT FULLY ONBOARDED ────
  if (!isLoading && !isOnboarded) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-8">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Setup Required</h2>
        <p className="text-gray-500 max-w-md mb-6">
          You need to complete your business details and settlement preferences before you can create product pages.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
        >
          Go to Dashboard to Setup
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Product Page</h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload a digital file and generate a secure payment & download link.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/dashboard/smart-bills/pages')}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ─── LEFT: Form ────────────────────────────────────────────── */}
        <div className="space-y-6">
          
          {/* Business Details (Read-Only) */}
          <div className="bg-gray-50/80 border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2 mb-4">
              <Building2 className="w-4 h-4 text-indigo-500" />
              Business
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
              <input
                type="text"
                value={businessName}
                readOnly
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-600 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Product Details */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-indigo-500" />
              Product Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. CV Template, Invoice Design"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="KES">KES</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe what the customer is buying..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 h-24 resize-none"
                />
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2 mb-4">
              <Upload className="w-4 h-4 text-indigo-500" />
              Upload File
            </h2>
            
            {!file ? (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer bg-gray-50/50">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                <div className="flex flex-col items-center gap-2 pointer-events-none">
                  <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">Click to upload a file</p>
                  <p className="text-xs text-gray-400">PDF, Images, or Documents (Max 10MB)</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{file.name}</p>
                    <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
                <button
                  onClick={removeFile}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ─── RIGHT: Preview & Actions ─────────────────────────────── */}
        <div className="space-y-6">
          {/* Preview Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm sticky top-4">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-500" />
              Preview
            </h2>

            {!generated ? (
              <div className="text-center py-8 text-gray-400">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-sm">Fill in the details and upload a file</p>
                <p className="text-xs mt-1">A preview of your product page will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Product Preview */}
                <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {productName}
                      </h3>
                      <p className="text-xs text-gray-500">Digital Product</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono text-gray-400">#{productId}</div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{description}</p>

                  <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-2 text-xs text-gray-500 border border-gray-200">
                    <FileText className="w-3 h-3" />
                    <span>{file?.name || 'File attached'}</span>
                  </div>

                  <div className="border-t border-gray-200 mt-3 pt-3 space-y-1">
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-gray-800">Total</span>
                      <span className="text-indigo-600">
                        {currency} {Number(price).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Shareable Link */}
                <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                  <p className="text-xs font-medium text-indigo-900 mb-2">Shareable Link</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={productLink}
                      readOnly
                      className="flex-1 px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-sm text-gray-700 focus:outline-none"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  {copied && <p className="text-xs text-green-600 mt-1">Copied to clipboard!</p>}
                </div>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!isFormValid || isGenerating}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Product...
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4" />
                Generate Product Link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Wrap the page in the Onboarding Guard ──────────────────────────
export default function WrappedCreateProductPage() {
  return (
    <OnboardingGuard>
      <InnerCreateProductPage />
    </OnboardingGuard>
  );
}