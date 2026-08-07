'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Save, 
  Loader2, 
  MapPin, 
  FileText, 
  CheckCircle,
  Phone,
  Mail,
  Globe,
  Tag,
  Landmark,
  Calendar,
  Check,
  Info,
  AlertCircle
} from 'lucide-react';
import { getStoredMerchant, getToken } from '@/lib/auth';
import { getMerchantProfile } from '@/lib/auth-api';

export default function OnboardingStage1() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // ─── Form Data ────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    // Business Identity
    business_name: '', // Legal Name
    trading_name: '', // Optional
    // Registration
    business_type: '',
    business_registration_number: '',
    date_of_registration: '',
    country_of_registration: 'Kenya',
    // Business Activity
    industry: '',
    business_description: '',
    // Business Contact
    business_email: '',
    business_phone: '',
    website: '',
    has_no_website: false,
    // Business Location
    country: 'Kenya',
    county: '',
    city: '',
    physical_address: '',
    postal_code: '',
    same_as_registered_address: true,
    registered_address: '',
  });

  // ─── Load Profile Data ────────────────────────────────────────────
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
          business_name: profile.business_name || '',
          business_type: profile.business_type || '',
          business_registration_number: profile.business_registration_number || '',
          country: profile.country || 'Kenya',
          business_phone: profile.phone || '',
          business_email: profile.email || '',
          // Future fields will map here once we migrate to the KYC table
        }));
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [router]);

  // ─── Handle Input Changes ────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      
      // If they check "No website", clear the website input
      if (name === 'has_no_website' && checked) {
        setFormData(prev => ({ ...prev, [name]: checked, website: '' }));
      } else {
        setFormData(prev => ({ ...prev, [name]: checked }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
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
          business_location: formData.city,
          business_registration_number: formData.business_registration_number,
          country: formData.country,
          phone: formData.business_phone,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSaved(true);
        const cached = getStoredMerchant();
        if (cached) {
          localStorage.setItem('merchant', JSON.stringify({
            ...cached,
            business_type: formData.business_type,
            country: formData.country,
            phone: formData.business_phone,
          }));
        }
        setTimeout(() => router.push('/dashboard/onboarding/stage2'), 2000);
      } else {
        setError(data.message || 'Failed to save business details');
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-sm shadow-indigo-200">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Profile & Registration</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tell us about your business.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-8">
        
        {/* ─── Section 1: Business Type ──────────────────────────────── */}
        <div>
          <h3 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wider">Business Type</h3>
          <p className="text-xs text-gray-500 mb-3">Determines which other fields/documents will be required later.</p>
          
          <select
            name="business_type"
            value={formData.business_type}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
            required
          >
            <option value="">Select Business Type</option>
            <option value="Limited Company">Limited Company</option>
            <option value="Sole Proprietorship">Sole Proprietorship</option>
            <option value="Partnership">Partnership</option>
            <option value="LLP">LLP</option>
            <option value="Nonprofit">Nonprofit / Organization</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* ─── Section 2: Business Identity ───────────────────────────── */}
        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wider">Business Identity</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Legal Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="business_name"
                value={formData.business_name}
                disabled={true} // Read-only for now
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-600 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">The exact name registered with the relevant authority.</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Trading Name</label>
              <input
                type="text"
                name="trading_name"
                value={formData.trading_name}
                onChange={handleChange}
                placeholder="e.g. Premium Shop"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <p className="text-xs text-gray-400 mt-1">Optional. Leave blank if the same as your legal name.</p>
            </div>
          </div>
        </div>

        {/* ─── Section 3: Registration Information ────────────────────── */}
        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wider">Registration Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registration Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="business_registration_number"
                value={formData.business_registration_number}
                onChange={handleChange}
                placeholder="e.g. PVT-XXXXXXXX"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
              <p className="text-xs text-gray-400 mt-1">For Kenyan registered companies, this is the company's registration identifier—not the owner's ID number.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Registration <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  name="date_of_registration"
                  value={formData.date_of_registration}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country of Registration <span className="text-red-500">*</span>
              </label>
              <select
                name="country_of_registration"
                value={formData.country_of_registration}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              >
                <option value="Kenya">Kenya</option>
                <option value="Uganda">Uganda</option>
                <option value="Tanzania">Tanzania</option>
                <option value="Rwanda">Rwanda</option>
                <option value="Nigeria">Nigeria</option>
                <option value="South Africa">South Africa</option>
              </select>
            </div>
          </div>
        </div>

        {/* ─── Section 4: Business Activity ───────────────────────────── */}
        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wider">Business Activity</h3>
          
          <div className="grid grid-cols-1 gap-4 mt-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Industry / Business Category <span className="text-red-500">*</span>
              </label>
              <select
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              >
                <option value="">Select Category</option>
                <option value="Retail">Retail</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Technology">Technology</option>
                <option value="Education">Education</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Hospitality">Hospitality</option>
                <option value="Transport & Logistics">Transport & Logistics</option>
                <option value="Professional Services">Professional Services</option>
                <option value="Financial Services">Financial Services</option>
                <option value="Telecommunications">Telecommunications</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Agriculture">Agriculture</option>
                <option value="Nonprofit">Nonprofit</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="business_description"
                value={formData.business_description}
                onChange={handleChange}
                rows={3}
                maxLength={500}
                placeholder="Tell us what your business does... (e.g. We sell electronics and mobile accessories through our physical store and online channels.)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                required
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {formData.business_description.length} / 500
              </p>
            </div>
          </div>
        </div>

        {/* ─── Section 5: Business Contact ────────────────────────────── */}
        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wider">Business Contact</h3>
          <p className="text-xs text-gray-500 mb-3">These are business contacts, not the owner's personal details.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  name="business_email"
                  value={formData.business_email}
                  onChange={handleChange}
                  placeholder="business@premiumshop.co.ke"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Phone <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  name="business_phone"
                  value={formData.business_phone}
                  onChange={handleChange}
                  placeholder="+254 7XX XXX XXX"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mt-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                  <input
                    type="checkbox"
                    name="has_no_website"
                    checked={formData.has_no_website}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  My business does not have a website
                </label>
              </div>
              {!formData.has_no_website && (
                <div className="relative mt-1">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://premiumshop.co.ke"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              )}
              {formData.has_no_website && (
                <p className="text-xs text-gray-400 mt-1 italic">Website skipped as per your selection.</p>
              )}
            </div>
          </div>
        </div>

        {/* ─── Section 6: Business Location ───────────────────────────── */}
        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wider">Business Location</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country <span className="text-red-500">*</span></label>
              <select
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              >
                <option value="Kenya">Kenya</option>
                <option value="Uganda">Uganda</option>
                <option value="Tanzania">Tanzania</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">County / Region <span className="text-red-500">*</span></label>
              <select
                name="county"
                value={formData.county}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              >
                <option value="">Select County</option>
                <option value="Nairobi">Nairobi</option>
                <option value="Mombasa">Mombasa</option>
                <option value="Kisumu">Kisumu</option>
                <option value="Nakuru">Nakuru</option>
                <option value="Kiambu">Kiambu</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City / Town <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. Nairobi"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Physical Address <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="physical_address"
                value={formData.physical_address}
                onChange={handleChange}
                placeholder="Building, street, area"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
              <input
                type="text"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleChange}
                placeholder="e.g. 00100"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            
            <div className="md:col-span-2 flex items-start gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200 mt-2">
              <input
                type="checkbox"
                id="same_address"
                name="same_as_registered_address"
                checked={formData.same_as_registered_address}
                onChange={handleChange}
                className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <label htmlFor="same_address" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Operating address is the same as registered address
                </label>
                {!formData.same_as_registered_address && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Registered Address</label>
                    <input
                      type="text"
                      name="registered_address"
                      value={formData.registered_address}
                      onChange={handleChange}
                      placeholder="Enter your registered address"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Messages & Actions ────────────────────────────────────── */}
        <div className="border-t border-gray-200 pt-6 space-y-3">
          {saved && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm p-3 rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Business profile saved! Moving to Stage 2...</span>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save & Continue
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}