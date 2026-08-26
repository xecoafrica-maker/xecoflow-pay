'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Globe,
  Check,
  Copy,
  Loader2,
  ArrowLeft,
  Eye,
  X,
  Plus,
  Trash2,
  Image as ImageIcon,
  Lock,
  CheckCircle,
  Palette,
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
  const [previewMode, setPreviewMode] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const merchantData = getStoredMerchant();

  useEffect(() => {
    if (!isLoading && isOnboarded) {
      setTimeout(() => nameInputRef.current?.focus(), 200);
    }
  }, [isLoading, isOnboarded]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Logo too large. Maximum size is 2MB.');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => setLogoPreview(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

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
      let logoUrl = '';

      if (logoFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', logoFile);
        formDataUpload.append(
          'merchantId',
          String(merchantData?.merchant_id || merchantData?.merchantId)
        );

        const uploadRes = await fetch('/api/products/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formDataUpload,
        });

        if (uploadRes.ok) {
          const data = await uploadRes.json();
          logoUrl = data.data?.fileUrl || data.fileUrl || '';
        }
      }

      const createRes = await fetch('/api/payment-pages', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          logoUrl: logoUrl || formData.logoUrl,
          merchantId: merchantData?.merchant_id || merchantData?.merchantId,
        }),
      });

      const data = await createRes.json();
      if (!createRes.ok) throw new Error(data.error || 'Failed to create payment page');

      const link = `${window.location.origin}/pay/${data.data.slug}`;
      setPageLink(link);
      setPageId(data.data.id);
      setGenerated(true);
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch (err: any) {
      setError(err.message || 'Failed to create payment page');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(pageLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const resetForm = () => {
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
  };

  const isFormValid =
    formData.name.trim() &&
    (formData.amountType === 'open' || (formData.amount && formData.amount > 0));

  if (!isLoading && !isOnboarded) {
    return (
      <div className="min-h-[420px] flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-5">
          <Lock className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-xl font-semibold text-[#0a2540] mb-2">Account setup required</h2>
        <p className="text-sm text-gray-500 max-w-sm mb-6">
          Complete your business details before creating payment pages.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-5 py-2.5 bg-[#0a2540] hover:bg-[#152a45] text-white rounded-xl text-sm font-medium transition-colors"
        >
          Go to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <button
            onClick={() => router.push('/dashboard/payment-pages')}
            className="text-[13px] text-gray-500 hover:text-gray-800 flex items-center gap-1.5 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Payment pages
          </button>
          <h1 className="text-2xl font-semibold text-[#0a2540] tracking-tight">
            Create payment page
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            A hosted page your customers can pay on — no code required.
          </p>
        </div>
        {!generated && (
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="self-start inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
            {previewMode ? 'Edit form' : 'Preview'}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <p className="flex-1 text-sm text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {generated ? (
        /* ── Success ── */
        <div className="rounded-2xl border border-emerald-100 bg-white p-8 sm:p-10 text-center shadow-sm">
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-emerald-600" />
          </div>
          <h3 className="text-xl font-semibold text-[#0a2540]">Payment page created</h3>
          <p className="text-sm text-gray-500 mt-1.5">Share this link with your customers</p>

          <div className="mt-6 max-w-md mx-auto flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
            <input
              type="text"
              value={pageLink}
              readOnly
              className="flex-1 min-w-0 bg-transparent text-[13px] text-gray-700 outline-none"
            />
            <button
              onClick={copyToClipboard}
              className="shrink-0 p-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4 text-gray-500" />
              )}
            </button>
          </div>
          {copied && (
            <p className="text-xs text-emerald-600 font-medium mt-2">Link copied</p>
          )}

          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => window.open(pageLink, '_blank')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0a2540] hover:bg-[#152a45] text-white rounded-xl text-sm font-medium transition-colors"
            >
              <Eye className="w-4 h-4" />
              View page
            </button>
            <button
              onClick={resetForm}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-sm font-medium text-gray-700 transition-colors"
            >
              Create another
            </button>
          </div>
        </div>
      ) : (
        /* ── Form ── */
        <div className="space-y-5">
          {/* Basic */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
            <h2 className="text-[13px] font-semibold text-[#0a2540] mb-4">Basic details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                  Page name <span className="text-red-500">*</span>
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Consulting fee, Course payment"
                  className="w-full h-11 px-3.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#635bff]/25 focus:border-[#635bff] transition-shadow"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                  Description <span className="text-gray-400 font-normal">optional</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What is this payment for?"
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#635bff]/25 focus:border-[#635bff] resize-none transition-shadow"
                />
              </div>
            </div>
          </section>

          {/* Amount */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
            <h2 className="text-[13px] font-semibold text-[#0a2540] mb-4">Amount</h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {(
                [
                  { id: 'fixed' as const, title: 'Fixed amount', desc: 'Set a specific price' },
                  { id: 'open' as const, title: 'Open amount', desc: 'Customer chooses' },
                ] as const
              ).map((opt) => {
                const active = formData.amountType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, amountType: opt.id })}
                    className={`text-left px-4 py-3.5 rounded-xl border-2 transition-all ${
                      active
                        ? 'border-[#635bff] bg-[#635bff]/5'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <p className={`text-sm font-semibold ${active ? 'text-[#0a2540]' : 'text-gray-800'}`}>
                      {opt.title}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{opt.desc}</p>
                  </button>
                );
              })}
            </div>

            {formData.amountType === 'fixed' && (
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] font-medium text-gray-400">
                  KES
                </span>
                <input
                  type="number"
                  value={formData.amount || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      amount: parseFloat(e.target.value) || undefined,
                    })
                  }
                  placeholder="1,000"
                  min={1}
                  step={1}
                  className="w-full h-11 pl-14 pr-3.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/25 focus:border-[#635bff] transition-shadow"
                />
              </div>
            )}
          </section>

          {/* Branding */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
            <h2 className="text-[13px] font-semibold text-[#0a2540] mb-4 flex items-center gap-2">
              <Palette className="w-4 h-4 text-gray-400" />
              Branding
            </h2>
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                  Brand color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.brandColor}
                    onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                    className="w-11 h-11 rounded-xl border border-gray-200 cursor-pointer p-1 bg-white"
                  />
                  <input
                    type="text"
                    value={formData.brandColor}
                    onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                    className="flex-1 h-11 px-3 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#635bff]/25 focus:border-[#635bff]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Logo</label>
                {!logoPreview ? (
                  <label className="flex flex-col items-center justify-center h-[88px] rounded-xl border-2 border-dashed border-gray-200 hover:border-[#635bff]/40 bg-gray-50/50 cursor-pointer transition-colors relative">
                    <input
                      type="file"
                      onChange={handleLogoChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      accept=".jpg,.jpeg,.png,.webp,.svg"
                    />
                    <ImageIcon className="w-5 h-5 text-gray-400 mb-1" />
                    <span className="text-[12px] text-gray-500">Upload logo</span>
                    <span className="text-[10px] text-gray-400">Max 2MB</span>
                  </label>
                ) : (
                  <div className="relative inline-flex">
                    <img
                      src={logoPreview}
                      alt="Logo"
                      className="h-[88px] w-auto max-w-[140px] object-contain rounded-xl border border-gray-200 bg-white p-2"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Customer fields */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
            <h2 className="text-[13px] font-semibold text-[#0a2540] mb-4">Customer fields</h2>
            <div className="flex flex-wrap gap-2 mb-5">
              {(
                [
                  { key: 'collectName' as const, label: 'Name' },
                  { key: 'collectEmail' as const, label: 'Email' },
                  { key: 'collectPhone' as const, label: 'Phone' },
                ] as const
              ).map((f) => {
                const on = formData[f.key];
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFormData({ ...formData, [f.key]: !on })}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] font-medium border transition-all ${
                      on
                        ? 'bg-[#0a2540] text-white border-[#0a2540]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {on && <Check className="w-3.5 h-3.5" />}
                    {f.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-medium text-gray-700">Custom fields</p>
              <button
                type="button"
                onClick={addCustomField}
                className="inline-flex items-center gap-1 text-[13px] font-medium text-[#635bff] hover:text-[#534bd6]"
              >
                <Plus className="w-4 h-4" />
                Add field
              </button>
            </div>

            {formData.customFields.length === 0 ? (
              <p className="text-[12px] text-gray-400 py-2">No custom fields yet</p>
            ) : (
              <div className="space-y-2">
                {formData.customFields.map((field) => (
                  <div
                    key={field.id}
                    className="flex flex-col sm:flex-row gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100"
                  >
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => updateCustomField(field.id, 'label', e.target.value)}
                      placeholder="Field label"
                      className="flex-1 h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/25 focus:border-[#635bff]"
                    />
                    <select
                      value={field.type}
                      onChange={(e) => updateCustomField(field.id, 'type', e.target.value)}
                      className="h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/25 focus:border-[#635bff]"
                    >
                      <option value="text">Text</option>
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="textarea">Textarea</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeCustomField(field.id)}
                      className="h-10 w-10 shrink-0 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Redirects */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
            <h2 className="text-[13px] font-semibold text-[#0a2540] mb-4">
              Redirect URLs <span className="text-gray-400 font-normal normal-case">(optional)</span>
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                  Success URL
                </label>
                <input
                  type="url"
                  value={formData.successUrl}
                  onChange={(e) => setFormData({ ...formData, successUrl: e.target.value })}
                  placeholder="https://yourdomain.com/thank-you"
                  className="w-full h-11 px-3.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/25 focus:border-[#635bff]"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                  Cancel URL
                </label>
                <input
                  type="url"
                  value={formData.cancelUrl}
                  onChange={(e) => setFormData({ ...formData, cancelUrl: e.target.value })}
                  placeholder="https://yourdomain.com/cancel"
                  className="w-full h-11 px-3.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/25 focus:border-[#635bff]"
                />
              </div>
            </div>
          </section>

          {/* CTA */}
          <button
            onClick={handleGenerate}
            disabled={!isFormValid || isGenerating}
            className="w-full h-12 bg-[#0a2540] hover:bg-[#152a45] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-[15px] transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <Globe className="w-4 h-4" />
                Create payment page
              </>
            )}
          </button>
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