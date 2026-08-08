'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  FileText,
  Shield,
  Save,
  Edit2,
  X,
  MapPin,
  CheckCircle,
  Loader2,
  Globe,
  Calendar,
} from 'lucide-react';
import { getStoredMerchant, getToken } from '@/lib/auth';

interface BusinessIdentityData {
  business_name: string;
  trading_name: string;
  business_type: string;
  industry: string;
  business_description: string;
  website: string;
  email: string;
  phone: string;
  country: string;
  business_registration_number: string;
  date_of_registration: string;
  country_of_registration: string;
  kra_pin: string;
  county: string;
  city: string;
  physical_address: string;
  postal_code: string;
  registered_address: string;
  same_as_registered_address: boolean;
  has_no_website: boolean;
}

export default function BusinessIdentityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<BusinessIdentityData | null>(null);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'registration', label: 'Registration', icon: FileText },
    { id: 'contact', label: 'Contact & Address', icon: MapPin },
  ];

  // ─── Load Data from New API ──────────────────────────────────────
  useEffect(() => {
    const fetchIdentity = async () => {
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch('/v1/business-account/identity', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || 'Failed to load business identity');
        }
        setData(json);
      } catch (err: any) {
        setError(err.message || 'Failed to load business identity');
      } finally {
        setLoading(false);
      }
    };

    fetchIdentity();
  }, [router]);

  // ─── Handle Save ──────────────────────────────────────────────────
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
      const res = await fetch('/v1/business-account/identity', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone: data?.phone,
          email: data?.email,
          country: data?.country,
          trading_name: data?.trading_name,
          industry: data?.industry,
          business_description: data?.business_description,
          website: data?.website,
          has_no_website: data?.has_no_website,
          county: data?.county,
          city: data?.city,
          physical_address: data?.physical_address,
          postal_code: data?.postal_code,
          registered_address: data?.registered_address,
          same_as_registered_address: data?.same_as_registered_address,
        }),
      });

      const json = await res.json();

      if (json.success) {
        setSaved(true);
        setIsEditing(false);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(json.error || 'Failed to save changes');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Loading State ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl">
          {error || 'Unable to load business identity.'}
        </div>
      </div>
    );
  }

  // ─── Helper to Update State ──────────────────────────────────────
  const updateField = (field: keyof BusinessIdentityData, value: any) => {
    setData((prev) => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
  };

  // ─── RENDER: OVERVIEW TAB ────────────────────────────────────────
  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Industry</p>
          <p className="text-sm font-semibold text-gray-900 mt-1">{data.industry || '—'}</p>
        </div>
      </div>

      {/* Business Info Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
          <input
            type="text"
            value={data.business_name || ''}
            disabled={true}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none disabled:opacity-60"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Trading Name</label>
          <input
            type="text"
            value={data.trading_name || ''}
            onChange={(e) => updateField('trading_name', e.target.value)}
            disabled={!isEditing}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none disabled:opacity-60 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
          <input
            type="text"
            value={data.business_type || ''}
            disabled={true}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none disabled:opacity-60"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
          <select
            value={data.industry || ''}
            onChange={(e) => updateField('industry', e.target.value)}
            disabled={!isEditing}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none disabled:opacity-60 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            <option value="">Select Industry</option>
            <option value="Financial Technology">Financial Technology</option>
            <option value="Retail">Retail</option>
            <option value="E-commerce">E-commerce</option>
            <option value="Hospitality">Hospitality</option>
            <option value="Services">Services</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
          <input
            type="text"
            value={data.website || ''}
            onChange={(e) => updateField('website', e.target.value)}
            disabled={!isEditing}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none disabled:opacity-60 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Business Description</label>
          <textarea
            rows={3}
            value={data.business_description || ''}
            onChange={(e) => updateField('business_description', e.target.value)}
            disabled={!isEditing}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none disabled:opacity-60 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
      </div>
    </div>
  );

  // ─── RENDER: REGISTRATION TAB ────────────────────────────────────
  const renderRegistrationTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
          <input
            type="text"
            value={data.business_registration_number || ''}
            disabled={true}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none disabled:opacity-60"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Country of Registration</label>
          <input
            type="text"
            value={data.country_of_registration || ''}
            disabled={true}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none disabled:opacity-60"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Registration</label>
          <input
            type="date"
            value={data.date_of_registration || ''}
            disabled={true}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none disabled:opacity-60"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">KRA PIN</label>
          <div className="relative">
            <input
              type="text"
              value={data.kra_pin || ''}
              disabled={true}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none disabled:opacity-60 font-mono"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
              Verified
            </span>
          </div>
        </div>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-xs text-amber-700">
          <strong>Note:</strong> Registration details and KRA PIN are locked for compliance. 
          To change these, please contact support.
        </p>
      </div>
    </div>
  );

  // ─── RENDER: CONTACT & ADDRESS TAB ───────────────────────────────
  const renderContactTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input
            type="email"
            value={data.email || ''}
            onChange={(e) => updateField('email', e.target.value)}
            disabled={!isEditing}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none disabled:opacity-60 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input
            type="tel"
            value={data.phone || ''}
            onChange={(e) => updateField('phone', e.target.value)}
            disabled={!isEditing}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none disabled:opacity-60 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
          <input
            type="text"
            value={data.country || ''}
            onChange={(e) => updateField('country', e.target.value)}
            disabled={!isEditing}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none disabled:opacity-60 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">County</label>
          <input
            type="text"
            value={data.county || ''}
            onChange={(e) => updateField('county', e.target.value)}
            disabled={!isEditing}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none disabled:opacity-60 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input
            type="text"
            value={data.city || ''}
            onChange={(e) => updateField('city', e.target.value)}
            disabled={!isEditing}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none disabled:opacity-60 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
          <input
            type="text"
            value={data.postal_code || ''}
            onChange={(e) => updateField('postal_code', e.target.value)}
            disabled={!isEditing}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none disabled:opacity-60 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Physical Address</label>
          <input
            type="text"
            value={data.physical_address || ''}
            onChange={(e) => updateField('physical_address', e.target.value)}
            disabled={!isEditing}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none disabled:opacity-60 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Registered Address</label>
          <input
            type="text"
            value={data.registered_address || ''}
            onChange={(e) => updateField('registered_address', e.target.value)}
            disabled={!isEditing}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none disabled:opacity-60 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
        <div className="md:col-span-2 flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="sameAddress"
            checked={data.same_as_registered_address || false}
            onChange={(e) => updateField('same_as_registered_address', e.target.checked)}
            disabled={!isEditing}
            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
          />
          <label htmlFor="sameAddress" className="text-sm text-gray-700">
            Same as registered address
          </label>
        </div>
      </div>
    </div>
  );

  // ─── MAIN RETURN ──────────────────────────────────────────────────
  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-sm shadow-emerald-200">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Identity</h1>
          <p className="text-sm text-gray-500">Manage your official business information, registration, and contact details</p>
        </div>
      </div>

      {/* ─── Alerts ─────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl">
          {error}
        </div>
      )}
      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm p-3 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>Business details saved successfully!</span>
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
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'registration' && renderRegistrationTab()}
        {activeTab === 'contact' && renderContactTab()}
        
        {/* ─── Actions ────────────────────────────────────────────────── */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex gap-3">
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
    </div>
  );
}