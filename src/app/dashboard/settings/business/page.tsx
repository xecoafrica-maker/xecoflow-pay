// src/app/dashboard/settings/business/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Save,
  Loader2,
  MapPin,
  FileText,
  CheckCircle,
  Shield,
  UserCircle,
  Copy,
  Lock,
  Upload,
  Palette,
  Mail,
  Phone,
  Globe,
  MessageCircle,
  X,
} from 'lucide-react';
import { getStoredMerchant, getToken } from '@/lib/auth';
import { getMerchantProfile } from '@/lib/auth-api';

// ─── Settings Navigation Tabs ─────────────────────────────────────
const SETTINGS_TABS = [
  {
    label: 'Business & Profile',
    href: '/dashboard/settings/business',
    icon: Building2,
  },
  {
    label: 'Security & Access',
    href: '/dashboard/settings/security',
    icon: Shield,
  },
  {
    label: 'Compliance & KYC',
    href: '/dashboard/settings/compliance',
    icon: FileText,
  },
];

function SettingsNav() {
  const pathname = usePathname();

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {SETTINGS_TABS.map((tab) => {
          const active = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-5 py-3.5 text-[13px] font-medium whitespace-nowrap border-b-2 transition-colors ${
                active
                  ? 'border-indigo-500 text-indigo-600 bg-indigo-50/40'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─── Section Card Wrapper ─────────────────────────────────────────
function SectionCard({
  number,
  title,
  children,
  className = '',
}: {
  number: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-5 ${className}`}>
      <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-100">
        <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
          {number}
        </span>
        <h3 className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

// ─── Field Label ──────────────────────────────────────────────────
function FieldLabel({
  children,
  required = false,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

export default function BusinessSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // ─── Form Data ────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    business_name: '',
    trading_name: '',
    business_category: '',
    business_type: '',
    description: '',
    support_email: '',
    support_phone: '',
    whatsapp_number: '',
    website: '',
    country: 'Kenya',
    county: '',
    physical_address: '',
    merchant_id: '',
    account_email: '',
  });

  // Branding
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [brandColor, setBrandColor] = useState('#10B981');

  // ─── Load Profile Data ────────────────────────────────────────────
  const fetchProfile = async () => {
    // ✅ EXACT same pattern as Withdraw Funds page
    const cached = getStoredMerchant();
    const id = cached?.merchant_id || cached?.merchantId;
    const token = getToken();

    // ✅ Only redirect if BOTH token and merchant are missing
    if (!token || !id) {
      console.warn('⚠️ Missing session, redirecting to login');
      router.push('/login?session=expired');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const profile = await getMerchantProfile(token);

      if (profile) {
        setFormData({
          business_name: profile.business_name || cached?.business_name || '',
          trading_name:
            profile.trading_name ||
            profile.business_name ||
            cached?.business_name ||
            '',
          business_category: profile.business_category || '',
          business_type: profile.business_type || '',
          description: profile.description || '',
          support_email: profile.support_email || profile.email || cached?.email || '',
          support_phone: profile.support_phone || profile.phone || '',
          whatsapp_number: profile.whatsapp_number || '',
          website: profile.website || '',
          country: profile.country || 'Kenya',
          county: profile.county || '',
          physical_address:
            profile.physical_address || profile.business_location || '',
          merchant_id: String(id),
          account_email: profile.email || cached?.email || '',
        });
        setBrandColor(profile.brand_color || '#10B981');
        setLogoPreview(profile.logo_url || '');
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      // ✅ Don't show error — silently fall back to cached data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [router]);

  // ─── Handle Input Changes ────────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  // ─── Handle Logo Upload ──────────────────────────────────────────
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Logo must be under 2MB');
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ─── Copy Merchant ID ────────────────────────────────────────────
  const handleCopyMerchantId = () => {
    if (!formData.merchant_id) return;
    navigator.clipboard.writeText(formData.merchant_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // ─── Save Data ────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);

    // ✅ Same token check as Withdraw page
    const token = getToken();
    const cached = getStoredMerchant();
    const id = cached?.merchant_id || cached?.merchantId;

    if (!token || !id) {
      router.push('/login?session=expired');
      return;
    }

    try {
      const res = await fetch('/v1/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          trading_name: formData.trading_name,
          business_category: formData.business_category,
          business_type: formData.business_type,
          description: formData.description,
          support_email: formData.support_email,
          support_phone: formData.support_phone,
          whatsapp_number: formData.whatsapp_number,
          website: formData.website,
          country: formData.country,
          county: formData.county,
          physical_address: formData.physical_address,
          brand_color: brandColor,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSaved(true);

        // ✅ Update BOTH localStorage keys so sidebar picks up the new name
        if (cached) {
          const updated = {
            ...cached,
            trading_name: formData.trading_name,
            business_type: formData.business_type,
            business_category: formData.business_category,
            business_name: cached.business_name || cached.businessName,
          };
          localStorage.setItem('merchant', JSON.stringify(updated));
          localStorage.setItem('xecoflow_merchant', JSON.stringify(updated));
        }

        setTimeout(() => setSaved(false), 2500);
      } else {
        setError(data.message || data.error || 'Failed to save business details');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-sm shadow-indigo-200">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-[24px] font-bold text-gray-900 tracking-tight">
            Business Profile
          </h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            Manage your public business info, customer receipts, and address.
          </p>
        </div>
      </div>

      {/* ─── Settings Nav ──────────────────────────────────────────── */}
      <SettingsNav />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-[13px] p-3 rounded-xl flex items-center gap-2">
          <X className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[13px] p-3 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Business profile updated successfully.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        {/* ─── Row 1: Brand & Identity + Branding Assets ─────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <SectionCard number="1" title="Brand & Identity" className="lg:col-span-2">
            <div className="space-y-4">
              <div>
                <FieldLabel required>Business Name</FieldLabel>
                <input
                  type="text"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleChange}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <FieldLabel>Public Display / Trading Name</FieldLabel>
                <input
                  type="text"
                  name="trading_name"
                  value={formData.trading_name}
                  onChange={handleChange}
                  placeholder="Name shown on receipts & checkout"
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-[13px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel required>Business Category</FieldLabel>
                  <select
                    name="business_category"
                    value={formData.business_category}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-[13px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  >
                    <option value="">Select category</option>
                    <option value="Retail">Retail</option>
                    <option value="Restaurant">Restaurant / Food</option>
                    <option value="Services">Professional Services</option>
                    <option value="E-commerce">E-commerce</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Education">Education</option>
                    <option value="Transport">Transport & Logistics</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <FieldLabel required>Type</FieldLabel>
                  <select
                    name="business_type"
                    value={formData.business_type}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-[13px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  >
                    <option value="">Select type</option>
                    <option value="Sole Proprietorship">Sole Proprietorship</option>
                    <option value="Partnership">Partnership</option>
                    <option value="LLC">LLC</option>
                    <option value="Corporation">Corporation</option>
                    <option value="Non-Profit">Non-Profit</option>
                  </select>
                </div>
              </div>

              <div>
                <FieldLabel>Description</FieldLabel>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Short tagline shown on hosted checkout"
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-[13px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard number="2" title="Branding Assets">
            <div className="space-y-5">
              <div>
                <FieldLabel>Business Logo</FieldLabel>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0 overflow-hidden">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Logo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      formData.trading_name?.charAt(0).toUpperCase() || 'W'
                    )}
                  </div>
                  <label className="flex-1 cursor-pointer">
                    <div className="px-3.5 py-2 border border-gray-300 rounded-lg text-[12px] font-medium text-gray-700 hover:bg-gray-50 transition-colors text-center flex items-center justify-center gap-2">
                      <Upload className="w-3.5 h-3.5" />
                      Upload Logo
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-[11px] text-gray-400 mt-2">Max size 2MB · PNG or JPG</p>
              </div>

              <div>
                <FieldLabel>Brand Accent Color</FieldLabel>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div
                      className="w-10 h-10 rounded-lg border-2 border-gray-200 shadow-sm"
                      style={{ backgroundColor: brandColor }}
                    />
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                  <input
                    type="text"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-[12px] font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-2">Used on checkout & receipts</p>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ─── Row 2: Contact Details + Merchant Identifier ──────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <SectionCard number="4" title="Customer Contact Details" className="lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel required>Support Email</FieldLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    name="support_email"
                    value={formData.support_email}
                    onChange={handleChange}
                    placeholder="support@yourshop.com"
                    className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-300 rounded-lg text-[13px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <FieldLabel required>Support Phone</FieldLabel>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    name="support_phone"
                    value={formData.support_phone}
                    onChange={handleChange}
                    placeholder="+254 700 000 000"
                    className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-300 rounded-lg text-[13px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <FieldLabel>WhatsApp Number</FieldLabel>
                <div className="relative">
                  <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    name="whatsapp_number"
                    value={formData.whatsapp_number}
                    onChange={handleChange}
                    placeholder="+254 700 000 000"
                    className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-300 rounded-lg text-[13px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Website URL</FieldLabel>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://yourshop.com"
                    className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-300 rounded-lg text-[13px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard number="3" title="Merchant Identifier">
            <div className="space-y-4">
              <div>
                <FieldLabel>Merchant ID (API Reference)</FieldLabel>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.merchant_id}
                    readOnly
                    className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[12px] font-mono text-gray-700"
                  />
                  <button
                    type="button"
                    onClick={handleCopyMerchantId}
                    className="px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-[12px] font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <FieldLabel>Account Owner Email (Read-Only)</FieldLabel>
                <div className="relative">
                  <input
                    type="email"
                    value={formData.account_email}
                    readOnly
                    className="w-full px-3.5 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-600"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ─── Row 3: Location & Address ─────────────────────────────── */}
        <SectionCard number="5" title="Location & Address">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <FieldLabel required>Country</FieldLabel>
              <select
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-[13px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              >
                <option value="Kenya">Kenya</option>
                <option value="Uganda">Uganda</option>
                <option value="Tanzania">Tanzania</option>
                <option value="Rwanda">Rwanda</option>
              </select>
            </div>

            <div>
              <FieldLabel required>County</FieldLabel>
              <select
                name="county"
                value={formData.county}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-[13px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              >
                <option value="">Select county</option>
                <option value="Nairobi">Nairobi</option>
                <option value="Mombasa">Mombasa</option>
                <option value="Kisumu">Kisumu</option>
                <option value="Nakuru">Nakuru</option>
                <option value="Kiambu">Kiambu</option>
                <option value="Machakos">Machakos</option>
                <option value="Uasin Gishu">Uasin Gishu</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <FieldLabel required>Physical Address</FieldLabel>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="physical_address"
                  value={formData.physical_address}
                  onChange={handleChange}
                  placeholder="Building name, street, floor"
                  className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-300 rounded-lg text-[13px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ─── Actions ───────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={fetchProfile}
            className="px-5 py-2.5 bg-white border border-gray-300 rounded-lg text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[13px] font-semibold transition-all flex items-center justify-center gap-2 shadow-sm shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}