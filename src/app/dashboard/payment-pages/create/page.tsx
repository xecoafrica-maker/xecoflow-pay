'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  Globe,
  Palette,
  Mail,
  User,
  Phone,
  Link2,
  Check,
  Copy,
  Loader2,
  ArrowLeft,
  Eye,
  X,
  Plus,
  Trash2,
  Image as ImageIcon,
  Upload,
  Lock,
  CheckCircle,
  Sparkles,
  Brush,
  Layout,
  Send,
} from 'lucide-react';
import { getStoredMerchant, getToken } from '@/lib/auth';
import OnboardingGuard, { useOnboarding } from '@/components/OnboardingGuard';

interface CustomField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'textarea';
  required: boolean;
  placeholder: string;
}

interface PaymentPageData {
  name: string;
  description: string;
  amountType: 'fixed' | 'open';
  amount?: number;
  currency: string;
  customFields: CustomField[];
  brandColor: string;
  logoUrl: string;
  successUrl: string;
  cancelUrl: string;
  collectName: boolean;
  collectEmail: boolean;
  collectPhone: boolean;
}

function InnerCreatePaymentPage() {
  const router = useRouter();
  const { isOnboarded, isLoading } = useOnboarding();
  const nameInputRef = useRef<HTMLInputElement>(null);

  // ─── Form State ──────────────────────────────────────────────────────
  const [formData, setFormData] = useState<PaymentPageData>({
    name: '',
    description: '',
    amountType: 'fixed',
    amount: undefined,
    currency: 'KES',
    customFields: [],
    brandColor: '#635bff',
    logoUrl: '',
    successUrl: '',
    cancelUrl: '',
    collectName: true,
    collectEmail: true,
    collectPhone: true,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [pageLink, setPageLink] = useState('');
  const [pageId, setPageId] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const merchantData = getStoredMerchant();

  // ─── Auto-focus ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading && isOnboarded) {
      setTimeout(() => nameInputRef.current?.focus(), 200);
    }
  }, [isLoading, isOnboarded]);

  // ─── Handle Logo Upload ────────────────────────────────────────────
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Logo too large. Maximum size is 2MB.');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  // ─── Custom Fields ──────────────────────────────────────────────────
  const addCustomField = () => {
    setFormData({
      ...formData,
      customFields: [
        ...formData.customFields,
        {
          id: Date.now().toString(),
          label: '',
          type: 'text',
          required: false,
          placeholder: '',
        },
      ],
    });
  };

  const removeCustomField = (id: string) => {
    setFormData({
      ...formData,
      customFields: formData.customFields.filter((f) => f.id !== id),
    });
  };

  const updateCustomField = (id: string, field: keyof CustomField, value: any) => {
    setFormData({
      ...formData,
      customFields: formData.customFields.map((f) =>
        f.id === id ? { ...f, [field]: value } : f
      ),
    });
  };

  // ─── Upload Logo to Server ─────────────────────────────────────────
  const uploadLogo = async (): Promise<string> => {
    if (!logoFile) return formData.logoUrl;

    try {
      const token = getToken();
      const merchantId = merchantData?.merchant_id || merchantData?.merchantId;
      
      const formDataUpload = new FormData();
      formDataUpload.append('file', logoFile);
      formDataUpload.append('merchantId', String(merchantId));

      const uploadRes = await fetch('/api/products/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataUpload,
      });

      if (uploadRes.ok) {
        const data = await uploadRes.json();
        return data.data?.fileUrl || data.fileUrl || '';
      }
      return '';
    } catch (error) {
      console.error('Logo upload failed:', error);
      return '';
    }
  };

  // ─── Generate Payment Page ──────────────────────────────────────────
  const handleGenerate = async () => {
    if (!formData.name.trim()) {
      setError('Page name is required');
      nameInputRef.current?.focus();
      return;
    }

    if (formData.amountType === 'fixed' && (!formData.amount || formData.amount <= 0)) {
      setError('Please enter a valid amount');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const token = getToken();
      const merchantId = merchantData?.merchant_id || merchantData?.merchantId;

      if (!merchantId) {
        throw new Error('Merchant ID not found. Please log in again.');
      }

      // ─── Upload logo if present ─────────────────────────────────────
      let logoUrl = await uploadLogo();

      // ─── Create Payment Page ──────────────────────────────────────
      const createRes = await fetch('/v1/payment-pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchantId: merchantId,
          businessName: merchantData?.business_name || merchantData?.businessName || 'XecoFlow',
          name: formData.name,
          description: formData.description || '',
          amountType: formData.amountType,
          amount: formData.amountType === 'fixed' ? formData.amount : null,
          currency: formData.currency || 'KES',
          customFields: formData.customFields || [],
          brandColor: formData.brandColor || '#635bff',
          logoUrl: logoUrl || formData.logoUrl || '',
          successUrl: formData.successUrl || '',
          cancelUrl: formData.cancelUrl || '',
          collectName: formData.collectName !== undefined ? formData.collectName : true,
          collectEmail: formData.collectEmail !== undefined ? formData.collectEmail : true,
          collectPhone: formData.collectPhone !== undefined ? formData.collectPhone : true,
        }),
      });

      const data = await createRes.json();

      if (!createRes.ok) {
        throw new Error(data.error || 'Failed to create payment page');
      }

      // ─── Build the payment page URL ──────────────────────────────────
      const slug = data.data?.slug || data.data?.description;
      if (!slug) {
        throw new Error('No slug returned from server');
      }
      
      const link = `${window.location.origin}/pay/${slug}`;
      setPageLink(link);
      setPageId(data.data?.id || data.data?.billId);
      setGenerated(true);

      await navigator.clipboard.writeText(link);
      setCopied(true);

    } catch (error: any) {
      console.error('Error creating payment page:', error);
      setError(error.message || 'Failed to create payment page');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(pageLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const isFormValid = formData.name.trim() &&
    (formData.amountType === 'open' || (formData.amount && formData.amount > 0));

  // ─── ONBOARDING GUARD ──────────────────────────────────────────────
  if (!isLoading && !isOnboarded) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-8">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Setup Required</h2>
        <p className="text-gray-500 max-w-md mb-6">
          Complete your business details before creating payment pages.
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ─── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.push('/dashboard/payment-pages')}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Create Payment Page</h1>
          <p className="text-sm text-gray-500 mt-1">
            Build a custom payment page for your customers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
            No file required
          </span>
        </div>
      </div>

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

      {generated ? (
        // ─── Success State ─────────────────────────────────────────────
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">🎉 Payment Page Created!</h3>
          <p className="text-sm text-gray-500 mt-1">Share this link with your customers</p>

          <div className="mt-4 max-w-md mx-auto bg-white rounded-xl p-3 flex items-center gap-2 border border-emerald-200">
            <input
              type="text"
              value={pageLink}
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

          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => window.open(pageLink, '_blank')}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              View Page
            </button>
            <button
              onClick={() => {
                setGenerated(false);
                setPageLink('');
                setPageId('');
                setCopied(false);
                setFormData({
                  name: '',
                  description: '',
                  amountType: 'fixed',
                  amount: undefined,
                  currency: 'KES',
                  customFields: [],
                  brandColor: '#635bff',
                  logoUrl: '',
                  successUrl: '',
                  cancelUrl: '',
                  collectName: true,
                  collectEmail: true,
                  collectPhone: true,
                });
                setLogoFile(null);
                setLogoPreview(null);
                setTimeout(() => nameInputRef.current?.focus(), 100);
              }}
              className="px-6 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-sm font-medium text-gray-700"
            >
              Create Another
            </button>
          </div>
        </div>
      ) : (
        // ─── Form ──────────────────────────────────────────────────────
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="space-y-6">
            {/* ─── Basic Details ────────────────────────────────────── */}
            <div>
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Layout className="w-4 h-4" />
                Basic Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Page Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Donation, Invoice Payment, Service Fee"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">This will be shown to your customers</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what this payment is for..."
                    rows={2}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* ─── Amount ────────────────────────────────────────────── */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Amount
              </h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <button
                    onClick={() => setFormData({ ...formData, amountType: 'fixed' })}
                    className={`flex-1 px-4 py-3 rounded-xl border text-center transition-all ${
                      formData.amountType === 'fixed'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-sm font-medium">Fixed Amount</div>
                    <div className="text-[10px] text-gray-400">Set a specific price</div>
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, amountType: 'open' })}
                    className={`flex-1 px-4 py-3 rounded-xl border text-center transition-all ${
                      formData.amountType === 'open'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-sm font-medium">Open Amount</div>
                    <div className="text-[10px] text-gray-400">Customer chooses price</div>
                  </button>
                </div>

                {formData.amountType === 'fixed' && (
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">KES</span>
                    <input
                      type="number"
                      value={formData.amount || ''}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || undefined })}
                      placeholder="1,000"
                      className="w-full pl-14 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                      min="1"
                      step="1"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* ─── Branding ───────────────────────────────────────────── */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Brush className="w-4 h-4" />
                Branding
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand Color
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={formData.brandColor}
                      onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                      className="w-12 h-12 rounded-lg border border-gray-200 cursor-pointer p-1"
                    />
                    <input
                      type="text"
                      value={formData.brandColor}
                      onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                      className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo (optional)
                  </label>
                  {!logoPreview ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-indigo-400 transition-colors cursor-pointer relative">
                      <input
                        type="file"
                        onChange={handleLogoChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept=".jpg,.jpeg,.png,.webp,.svg"
                      />
                      <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Upload logo</p>
                      <p className="text-xs text-gray-400">JPG, PNG, WebP, SVG (Max 2MB)</p>
                    </div>
                  ) : (
                    <div className="relative inline-block">
                      <img
                        src={logoPreview}
                        alt="Logo"
                        className="w-24 h-24 object-contain rounded-lg border border-gray-200 bg-white p-2"
                      />
                      <button
                        onClick={removeLogo}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ─── Customer Fields ───────────────────────────────────── */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <User className="w-4 h-4" />
                Customer Fields
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="collectName"
                    checked={formData.collectName}
                    onChange={(e) => setFormData({ ...formData, collectName: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="collectName" className="text-sm text-gray-700">Collect Name</label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="collectEmail"
                    checked={formData.collectEmail}
                    onChange={(e) => setFormData({ ...formData, collectEmail: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="collectEmail" className="text-sm text-gray-700">Collect Email</label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="collectPhone"
                    checked={formData.collectPhone}
                    onChange={(e) => setFormData({ ...formData, collectPhone: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="collectPhone" className="text-sm text-gray-700">Collect Phone</label>
                </div>

                {/* ─── Custom Fields ─────────────────────────────────── */}
                <div className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-700">Custom Fields</p>
                    <button
                      onClick={addCustomField}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Add Field
                    </button>
                  </div>
                  {formData.customFields.map((field) => (
                    <div key={field.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl mb-2">
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateCustomField(field.id, 'label', e.target.value)}
                        placeholder="Field label"
                        className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                      />
                      <select
                        value={field.type}
                        onChange={(e) => updateCustomField(field.id, 'type', e.target.value as any)}
                        className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                      >
                        <option value="text">Text</option>
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="textarea">Textarea</option>
                      </select>
                      <button
                        onClick={() => removeCustomField(field.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ─── Redirect URLs ──────────────────────────────────────── */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                Redirect URLs
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Success URL <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <input
                    type="url"
                    value={formData.successUrl}
                    onChange={(e) => setFormData({ ...formData, successUrl: e.target.value })}
                    placeholder="https://yourdomain.com/thank-you"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">Where customers go after successful payment</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cancel URL <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <input
                    type="url"
                    value={formData.cancelUrl}
                    onChange={(e) => setFormData({ ...formData, cancelUrl: e.target.value })}
                    placeholder="https://yourdomain.com/cancel"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">Where customers go if they cancel</p>
                </div>
              </div>
            </div>

            {/* ─── Submit ─────────────────────────────────────────────── */}
            <button
              onClick={handleGenerate}
              disabled={!isFormValid || isGenerating}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:bg-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-base transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Create Payment Page
                </>
              )}
            </button>

            <div className="text-center">
              <p className="text-xs text-gray-400">
                <Check className="w-3 h-3 inline mr-1 text-emerald-500" />
                No file upload required • Custom branding • Flexible amounts
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WrappedCreatePaymentPage() {
  return (
    <OnboardingGuard>
      <InnerCreatePaymentPage />
    </OnboardingGuard>
  );
}