'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Save, 
  Loader2, 
  CheckCircle,
  FileText,
  User,
  IdCard,
  Plus,
  Trash2,
  Briefcase,
  ArrowLeft // ✅ Added Back Button Icon
} from 'lucide-react';
import { getToken } from '@/lib/auth';

interface Director {
  id: string;
  fullName: string;
  idNumber: string;
  role: string;
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

  // ─── Load Data from new API ──────────────────────────────────────
  useEffect(() => {
    const fetchOwners = async () => {
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch('/v1/onboarding/owners-documents', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Failed to load owners');

        if (Array.isArray(data.directors) && data.directors.length > 0) {
          setDirectors(
            data.directors.map((director: any) => ({
              id: crypto.randomUUID(),
              fullName: director.fullName || '',
              idNumber: director.idNumber || '',
              role: director.role || 'Director'
            }))
          );
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOwners();
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

  // ─── Save & Continue ──────────────────────────────────────────────
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

    // 1. Frontend Validation
    const invalidDirector = directors.some(
      director => !director.fullName.trim() || !director.idNumber.trim() || !director.role.trim()
    );

    if (invalidDirector) {
      setError('Please complete the name, ID/passport number, and role for every director.');
      setSaving(false);
      return;
    }

    try {
      // 2. Remove temporary frontend IDs before sending
      const cleanDirectors = directors.map(({ id, ...director }) => director);

      // 3. ✅ Use the NEW onboarding API
      const res = await fetch('/v1/onboarding/owners-documents/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ directors: cleanDirectors }),
      });

      const data = await res.json();

      if (data.success) {
        setSaved(true);
        // 4. ✅ Redirect based on the backend response
        setTimeout(() => {
          router.push(`/dashboard/onboarding/stage${data.onboarding.currentStep}`);
        }, 2000);
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
              <div className="bg-gray-100 rounded-lg p-4 border border-gray-200 flex items-center justify-center text-gray-400 text-sm min-h-[48px]">
                <span>Coming soon</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                <span className="text-sm font-medium text-gray-700">KRA PIN Certificate</span>
              </div>
              <div className="bg-gray-100 rounded-lg p-4 border border-gray-200 flex items-center justify-center text-gray-400 text-sm min-h-[48px]">
                <span>Coming soon</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Actions ────────────────────────────────────────────────── */}
        <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <button
            type="button"
            onClick={() => router.push('/dashboard/onboarding/stage1')}
            className="flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Stage 1
          </button>

          <div className="flex-1 sm:flex-none space-y-3">
            {saved && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm p-3 rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Directors saved! Moving to Stage 3...</span>
              </div>
            )}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
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
        </div>
      </form>
    </div>
  );
}