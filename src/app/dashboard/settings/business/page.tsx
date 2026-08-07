'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  FileText,
  Shield,
  Calendar,
  Camera,
  Save,
  Edit2,
  X,
  Globe,
  Users,
  CheckCircle,
  MapPin,
  Phone,
  Mail,
  Clock,
  Landmark,
  Smartphone,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Upload,
  Eye,
  Link as LinkIcon,
  FileCheck,
  IdCard,
} from 'lucide-react';
import { getStoredMerchant, getToken } from '@/lib/auth';
import { getMerchantProfile } from '@/lib/auth-api';

export default function BusinessIdentityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('identity');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const cachedMerchant = getStoredMerchant();

  // ─── FULL KYC BUSINESS DATA ──────────────────────────────────────
  const [formData, setFormData] = useState({
    // Core Identity
    business_name: cachedMerchant?.businessName || cachedMerchant?.business_name || '',
    business_type: cachedMerchant?.business_type || '',
    business_registration_number: cachedMerchant?.business_registration_number || '',
    kra_pin: cachedMerchant?.business_registration_number || '', // Using same field as KRA PIN in DB
    
    // Address & Contact
    business_location: cachedMerchant?.business_location || '',
    physical_address: '',
    city: '',
    state: '',
    country: cachedMerchant?.country || 'Kenya',
    business_phone: cachedMerchant?.phone || '',
    business_email: cachedMerchant?.email || '',
    website: '',
    
    // Verification & Compliance
    verification_status: 'Pending',
    kra_verified: false,
    certificate_uploaded: false,
    years_in_business: 0,
    employee_count: 0,
    annual_revenue: '',
    
    // Banking (Already exists)
    bank_name: cachedMerchant?.bank_name || '',
    bank_account_number: cachedMerchant?.bank_account_number || '',
    bank_account_holder: cachedMerchant?.bank_account_holder || '',
    settlement_method: cachedMerchant?.settlement_method || 'mpesa',
    settlement_phone: cachedMerchant?.settlement_phone || '',
    
    // Directors (Optional)
    directors: [] as { name: string; id: string; role: string }[],
  });

  const tabs = [
    { id: 'identity', label: 'Business Identity', icon: Building2 },
    { id: 'contact', label: 'Contact Details', icon: MapPin },
    { id: 'verification', label: 'Verification & KYC', icon: Shield },
    { id: 'banking', label: 'Banking & Settlement', icon: Landmark },
  ];

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // ─── Load Profile Data ────────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      setLoading(true);
      setError('');

      try {
        const profile = await getMerchantProfile(token);
        if (profile) {
          setFormData(prev => ({
            ...prev,
            business_name: profile.business_name || prev.business_name,
            business_type: profile.business_type || prev.business_type,
            business_registration_number: profile.business_registration_number || prev.business_registration_number,
            kra_pin: profile.business_registration_number || prev.business_registration_number,
            business_location: profile.business_location || prev.business_location,
            business_phone: profile.phone || prev.business_phone,
            business_email: profile.email || prev.business_email,
            country: profile.country || prev.country,
            bank_name: profile.bank_name || prev.bank_name,
            bank_account_number: profile.bank_account_number || prev.bank_account_number,
            bank_account_holder: profile.bank_account_holder || prev.bank_account_holder,
            settlement_method: profile.settlement_method || prev.settlement_method,
            settlement_phone: profile.settlement_phone || prev.settlement_phone,
          }));
        }
      } catch (err) {
        setError('Failed to load profile. Please refresh.');
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  // ─── Save Data ────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);

    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch('/v1/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          business_type: formData.business_type,
          business_location: formData.business_location,
          business_registration_number: formData.business_registration_number,
          phone: formData.business_phone,
          bank_name: formData.bank_name,
          bank_account_number: formData.bank_account_number,
          bank_account_holder: formData.bank_account_holder,
          settlement_method: formData.settlement_method,
          settlement_phone: formData.settlement_phone,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSaved(true);
        setIsEditing(false);
        const cached = getStoredMerchant();
        if (cached) {
          localStorage.setItem('merchant', JSON.stringify({
            ...cached,
            ...formData,
          }));
        }
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(data.message || 'Failed to save details');
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

  // ─── TAB RENDERERS ──────────────────────────────────────────────────

  const renderIdentityTab = () => (
    <div className="space-y-6">
      {/* Business Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Status</p>
          <div className="mt-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
              <Shield className="w-3 h-3" />
              {formData.verification_status}
            </span>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Merchant ID</p>
          <p className="text-sm font-semibold text-gray-900 mt-1">{cachedMerchant?.merchantId || '—'}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Business Type</p>
          <p className="text-sm font-semibold text-gray-900 mt-1">{formData.business_type || '—'}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">KRA PIN</p>
          <p className="text-sm font-semibold text-gray-900 mt-1">
            {formData.kra_pin ? (
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Verified
              </span>
            ) : (
              '—'
            )}
          </p>
        </div>
      </div>

      {/* Business Details Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Business Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.business_name}
            disabled={true}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none disabled:opacity-60"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Registration Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="business_registration_number"
            value={formData.business_registration_number}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none disabled:opacity-60"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            KRA PIN / Tax ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="kra_pin"
            value={formData.kra_pin}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none disabled:opacity-60"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Business Type <span className="text-red-500">*</span>
          </label>
          <select
            name="business_type"
            value={formData.business_type}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none disabled:opacity-60"
          >
            <option value="">Select Business Type</option>
            <option value="Sole Proprietorship">Sole Proprietorship</option>
            <option value="Partnership">Partnership</option>
            <option value="LLC">Limited Liability Company (LLC)</option>
            <option value="Corporation">Corporation</option>
            <option value="Non-Profit">Non-Profit</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Years in Business
          </label>
          <input
            type="number"
            name="years_in_business"
            value={formData.years_in_business}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none disabled:opacity-60"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Annual Revenue
          </label>
          <input
            type="text"
            name="annual_revenue"
            value={formData.annual_revenue}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none disabled:opacity-60"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Business Website
          </label>
          <input
            type="url"
            name="website"
            value={formData.website}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none disabled:opacity-60"
          />
        </div>
      </div>

      <div className="flex gap-3">
        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Edit Details
          </button>
        ) : (
          <>
            <button
              type="submit"
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-6 py-2.5 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700 transition-all flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );

  const renderContactTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Physical Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="physical_address"
            value={formData.physical_address}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none disabled:opacity-60"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none disabled:opacity-60"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State / County <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none disabled:opacity-60"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Country <span className="text-red-500">*</span>
          </label>
          <select
            name="country"
            value={formData.country}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none disabled:opacity-60"
          >
            <option value="Kenya">Kenya</option>
            <option value="Uganda">Uganda</option>
            <option value="Tanzania">Tanzania</option>
            <option value="Rwanda">Rwanda</option>
            <option value="Nigeria">Nigeria</option>
            <option value="South Africa">South Africa</option>
            <option value="Ghana">Ghana</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Business Phone <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="business_phone"
            value={formData.business_phone}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none disabled:opacity-60"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Business Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="business_email"
            value={formData.business_email}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none disabled:opacity-60"
          />
        </div>
      </div>
    </div>
  );

  const renderVerificationTab = () => (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Business Verification</p>
            <p className="text-xs text-amber-700 mt-1">
              Upload your business documents to verify your identity. Verification is required to unlock higher transaction limits.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-indigo-500" />
              <span className="text-sm font-medium text-gray-700">Certificate of Incorporation</span>
            </div>
            {formData.certificate_uploaded ? (
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full border border-emerald-200">
                Uploaded
              </span>
            ) : (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full border border-gray-200">
                Missing
              </span>
            )}
          </div>
          <button className="mt-3 w-full py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IdCard className="w-5 h-5 text-indigo-500" />
              <span className="text-sm font-medium text-gray-700">Director / Owner ID</span>
            </div>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full border border-gray-200">
              Not Submitted
            </span>
          </div>
          <button className="mt-3 w-full py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
            <Upload className="w-4 h-4" />
            Upload ID
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-500" />
              <span className="text-sm font-medium text-gray-700">Business Website</span>
            </div>
            {formData.website ? (
              <a href={formData.website} target="_blank" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                Visit <LinkIcon className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-xs text-gray-400">Not provided</span>
            )}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              <span className="text-sm font-medium text-gray-700">Directors</span>
            </div>
            <span className="text-xs text-gray-400">0 added</span>
          </div>
          <button className="mt-3 w-full py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
            <Users className="w-4 h-4" />
            Add Director
          </button>
        </div>
      </div>
    </div>
  );

  const renderBankingTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Settlement Method <span className="text-red-500">*</span>
          </label>
          <select
            name="settlement_method"
            value={formData.settlement_method}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none disabled:opacity-60"
          >
            <option value="mpesa">M-PESA</option>
            <option value="bank">Bank Transfer</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Settlement Phone <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="settlement_phone"
            value={formData.settlement_phone}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none disabled:opacity-60"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bank Name
          </label>
          <input
            type="text"
            name="bank_name"
            value={formData.bank_name}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none disabled:opacity-60"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Account Number
          </label>
          <input
            type="text"
            name="bank_account_number"
            value={formData.bank_account_number}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none disabled:opacity-60"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Account Holder Name
          </label>
          <input
            type="text"
            name="bank_account_holder"
            value={formData.bank_account_holder}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none disabled:opacity-60"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-sm shadow-emerald-200">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Identity & KYC</h1>
          <p className="text-sm text-gray-500">Manage your business profile, verification, and banking details</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl">
          {error}
        </div>
      )}

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm p-3 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>Details saved successfully!</span>
        </div>
      )}

      {/* ─── Tabs ────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap border-b-2 ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ─── Content ────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        {activeTab === 'identity' && renderIdentityTab()}
        {activeTab === 'contact' && renderContactTab()}
        {activeTab === 'verification' && renderVerificationTab()}
        {activeTab === 'banking' && renderBankingTab()}
      </div>
    </div>
  );
}