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

  // ─── Form Data (Connected to Real Database) ──────────────────────
  const [formData, setFormData] = useState({
    business_name: '',
    first_name: '',
    last_name: '',
    business_type: '',
    business_location: '',
    business_registration_number: '',
    // Contact Info
    phone: '',
    email: '',
    // Banking
    bank_name: '',
    bank_account_number: '',
    bank_account_holder: '',
    settlement_method: 'mpesa',
    settlement_phone: '',
  });

  const tabs = [
    { id: 'identity', label: 'Business Identity', icon: Building2 },
    { id: 'contact', label: 'Contact', icon: MapPin },
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
          setFormData({
            business_name: profile.business_name || '',
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            business_type: profile.business_type || '',
            business_location: profile.business_location || '',
            business_registration_number: profile.business_registration_number || '',
            phone: profile.phone || '',
            email: profile.email || '',
            bank_name: profile.bank_name || '',
            bank_account_number: profile.bank_account_number || '',
            bank_account_holder: profile.bank_account_holder || '',
            settlement_method: profile.settlement_method || 'mpesa',
            settlement_phone: profile.settlement_phone || '',
          });
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError('Failed to load profile. Please refresh.');
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
          phone: formData.phone,
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
      {/* Business Overview Cards (Dynamically pulled from real data) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Status</p>
          <div className="mt-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Shield className="w-3 h-3" />
              ACTIVE
            </span>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Merchant ID</p>
          <p className="text-sm font-semibold text-gray-900 mt-1">{getStoredMerchant()?.merchantId || '—'}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Business Type</p>
          <p className="text-sm font-semibold text-gray-900 mt-1">{formData.business_type || '—'}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Location</p>
          <p className="text-sm font-semibold text-gray-900 mt-1">{formData.business_location || '—'}</p>
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
            disabled={true} // Business Name is read-only in this view
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
            Tax ID / PIN
          </label>
          <input
            type="text"
            value={formData.business_registration_number} // Using same field as KRA PIN in DB
            disabled={true}
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
            Business Location <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="business_location"
            value={formData.business_location}
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
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none disabled:opacity-60"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={formData.email}
            disabled={true} // Email is read-only
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none disabled:opacity-60"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Business Location <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="business_location"
            value={formData.business_location}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none disabled:opacity-60"
          />
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
          <h1 className="text-2xl font-bold text-gray-900">Business Identity</h1>
          <p className="text-sm text-gray-500">Manage your business profile, contact, and banking details</p>
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
        {activeTab === 'banking' && renderBankingTab()}
      </div>
    </div>
  );
}