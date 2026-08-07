'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Save, 
  Loader2, 
  CheckCircle,
  Upload,
  FileText,
  User,
  IdCard,
  Plus,
  Trash2,
  Briefcase
} from 'lucide-react';
import { getStoredMerchant, getToken } from '@/lib/auth';
import { getMerchantProfile } from '@/lib/auth-api';

interface Director {
  id: string;
  fullName: string;
  idNumber: string;
  role: string;
  idFile?: File | null;
}

export default function OnboardingStage2() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // ─── Directors State ──────────────────────────────────────────────
  const [directors, setDirectors] = useState<Director[]>([
    { id: crypto.randomUUID(), fullName: '', idNumber: '', role: 'Director' }
  ]);

  // ─── Document Uploads (Optional for now) ────────────────────────
  const [documents, setDocuments] = useState({
    certificateOfIncorporation: null as File | null,
    kraPinCertificate: null as File | null,
  });

  // ─── Load Profile Data ────────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }
      setLoading(true);
      try {
        const profile = await getMerchantProfile(token);
        // If you already saved directors in the KYC table, you can load them here.
        // For now, we keep it empty.
        console.log('📥 Stage 2 loaded for:', profile.business_name);
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [router]);

  // ─── Director Handlers ────────────────────────────────────────────
  const addDirector = () => {
    setDirectors([
      ...directors,
      { id: crypto.randomUUID(), fullName: '', idNumber: '', role: 'Director' }
    ]);
  };

  const removeDirector = (id: string) => {
    if (directors.length === 1) return;
    setDirectors(directors.filter(d => d.id !== id));
  };

  const updateDirector = (id: string, field: keyof Director, value: string) => {
    setDirectors(directors.map(d => 
      d.id === id ? { ...d, [field]: value } : d
    ));
  };

  // ─── Document Handlers ────────────────────────────────────────────
  const handleFileChange = (field: keyof typeof documents, file: File | null) => {
    setDocuments(prev => ({ ...prev, [field]: file }));
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
      // 🚧 We send the directors list. Uploads will be handled later via a dedicated upload API.
      const res = await fetch('/v1/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          directors: directors, // Will be stored as JSONB in the kyc table
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSaved(true);
        setTimeout(() => router.push('/dashboard/onboarding/stage3'), 2000);
      } else {
        setError(data.message || 'Failed to save directors');
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
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">02 — Owners & Documents</h1>
          <p className="text-sm text-gray-500 mt-1">
            Add your company directors and upload business documents. (Uploads are optional for now).
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-8">
        
        {/* ─── Section 1: Directors / Owners ────────────────────────── */}
        <div>
          <h3 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wider">Directors & Beneficial Owners</h3>
          <p className="text-xs text-gray-500 mb-4">List all directors and beneficial owners of the business.</p>

          <div className="space-y-4">
            {directors.map((director, index) => (
              <div key={director.id} className="flex flex-col sm:flex-row gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 relative">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={director.fullName}
                      onChange={(e) => updateDirector(director.id, 'fullName', e.target.value)}
                      placeholder="Full Name"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={director.idNumber}
                      onChange={(e) => updateDirector(director.id, 'idNumber', e.target.value)}
                      placeholder="ID / Passport Number"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      value={director.role}
                      onChange={(e) => updateDirector(director.id, 'role', e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="Director">Director</option>
                      <option value="CEO">CEO / Managing Director</option>
                      <option value="CFO">CFO / Finance Director</option>
                      <option value="COO">COO / Operations Director</option>
                      <option value="Secretary">Company Secretary</option>
                      <option value="Shareholder">Beneficial Owner / Shareholder</option>
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeDirector(director.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  disabled={directors.length === 1}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addDirector}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-500 hover:border-indigo-500 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Another Director
            </button>
          </div>
        </div>

        {/* ─── Section 2: Business Documents (Optional) ────────────── */}
        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wider">Business Documents (Optional)</h3>
          <p className="text-xs text-gray-500 mb-4">Upload your company documents. This is optional for now.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                <span className="text-sm font-medium text-gray-700">Certificate of Incorporation</span>
              </div>
              <input
                type="file"
                accept=".pdf,.jpg,.png"
                onChange={(e) => handleFileChange('certificateOfIncorporation', e.target.files?.[0] || null)}
                className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              {documents.certificateOfIncorporation && (
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {documents.certificateOfIncorporation.name}
                </p>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                <span className="text-sm font-medium text-gray-700">KRA PIN Certificate</span>
              </div>
              <input
                type="file"
                accept=".pdf,.jpg,.png"
                onChange={(e) => handleFileChange('kraPinCertificate', e.target.files?.[0] || null)}
                className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              {documents.kraPinCertificate && (
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {documents.kraPinCertificate.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ─── Actions ────────────────────────────────────────────────── */}
        <div className="border-t border-gray-200 pt-6 space-y-3">
          {saved && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm p-3 rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Directors saved! Moving to Stage 3...</span>
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