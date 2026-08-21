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
  Shield,
  Clock,
  Download,
  Calendar,
  Globe,
} from 'lucide-react';
import { getStoredMerchant, getToken } from '@/lib/auth';
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
  const [redirectUrl, setRedirectUrl] = useState('');
  const [expiryDays, setExpiryDays] = useState(7);
  const [maxDownloads, setMaxDownloads] = useState(3);
  const [sendSms, setSendSms] = useState(true);
  const [watermarkPreview, setWatermarkPreview] = useState(true);
  
  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [productLink, setProductLink] = useState('');
  const [productId, setProductId] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Auto-load Business Name ──────────────────────────────────────
  const merchantData = getStoredMerchant();
  const businessName = merchantData?.businessName || merchantData?.business_name || 'Your Business';

  // ─── Handle File Upload ──────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file size (25MB max)
      if (selectedFile.size > 25 * 1024 * 1024) {
        setError('File too large. Maximum size is 25MB.');
        return;
      }
      setFile(selectedFile);
      const objectUrl = URL.createObjectURL(selectedFile);
      setFilePreview(objectUrl);
      setError(null);
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
      setError('Please fill in all fields and upload a file.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // ─── 1. Upload file to Supabase Storage ─────────────────────────
      const formData = new FormData();
      formData.append('file', file);
      formData.append('merchantId', String(merchantData?.merchant_id || merchantData?.merchantId));

      const token = getToken();
      const uploadRes = await fetch('/api/products/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || 'Failed to upload file');
      }

      const uploadData = await uploadRes.json();
      const fileUrl = uploadData.data?.fileUrl || uploadData.fileUrl;

      if (!fileUrl) {
        throw new Error('File upload returned no URL');
      }

      // ─── 2. Create the Product Record ──────────────────────────────
      const createRes = await fetch('/api/digital/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchantId: merchantData?.merchant_id || merchantData?.merchantId,
          businessName: businessName,
          title: productName,
          description: description || '',
          price: Number(price),
          currency: currency,
          fileUrl: fileUrl,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          redirectUrl: redirectUrl || '',
          expiryDays: expiryDays,
          maxDownloads: maxDownloads,
          sendSms: sendSms,
          watermarkPreview: watermarkPreview,
        }),
      });

      const data = await createRes.json();

      if (!createRes.ok) {
        throw new Error(data.error || 'Failed to create product');
      }

      // ─── 3. Generate Shareable Link ────────────────────────────────
      const link = `${window.location.origin}/p/${data.data.product_id}`;
      setProductLink(link);
      setProductId(data.data.product_id);
      setGenerated(true);
      setCopied(false);

    } catch (error: any) {
      console.error('Error generating product:', error);
      setError(error.message || 'Failed to generate product link');
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

  // ─── ONBOARDING GUARD ──────────────────────────────────────────────
  if (!isLoading && !isOnboarded) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-8">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Setup Required</h2>
        <p className="text-gray-500 max-w-md mb-6">
          You need to complete your business details before you can create product pages.
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
            Upload a digital file and generate a secure pay-to-download link.
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/digital-products')}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
        >
          Cancel
        </button>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Professional CV Template"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price <span className="text-red-500">*</span>
                  </label>
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
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what the customer will get..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 h-24 resize-none"
                />
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2 mb-4">
              <Upload className="w-4 h-4 text-indigo-500" />
              Upload File <span className="text-red-500">*</span>
            </h2>
            
            {!file ? (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer bg-gray-50/50 relative">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                />
                <div className="flex flex-col items-center gap-2 pointer-events-none">
                  <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">Click to upload a file</p>
                  <p className="text-xs text-gray-400">PDF, Images, Documents (Max 25MB)</p>
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
                    <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
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

          {/* Security Settings */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-indigo-500" />
              Security & Delivery
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Clock className="w-3 h-3 inline mr-1" />
                    Link Expires
                  </label>
                  <select
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="1">1 day</option>
                    <option value="3">3 days</option>
                    <option value="7">7 days</option>
                    <option value="14">14 days</option>
                    <option value="30">30 days</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Download className="w-3 h-3 inline mr-1" />
                    Max Downloads
                  </label>
                  <select
                    value={maxDownloads}
                    onChange={(e) => setMaxDownloads(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="1">1</option>
                    <option value="3">3</option>
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="999">Unlimited</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="watermarkPreview"
                  checked={watermarkPreview}
                  onChange={(e) => setWatermarkPreview(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="watermarkPreview" className="text-sm text-gray-700">
                  Watermark/blur preview before payment
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="sendSms"
                  checked={sendSms}
                  onChange={(e) => setSendSms(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="sendSms" className="text-sm text-gray-700">
                  Send download link via SMS after payment
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Globe className="w-3 h-3 inline mr-1" />
                  Redirect URL (optional)
                </label>
                <input
                  type="url"
                  value={redirectUrl}
                  onChange={(e) => setRedirectUrl(e.target.value)}
                  placeholder="https://yourdomain.com/thank-you"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
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
                      <span className="text-gray-800">Price</span>
                      <span className="text-indigo-600">
                        {currency} {Number(price).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Expires in {expiryDays} days
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      Max {maxDownloads} downloads
                    </span>
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
                Creating Product...
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