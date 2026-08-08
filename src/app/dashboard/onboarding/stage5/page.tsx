'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle, 
  Loader2, 
  AlertCircle, 
  FileText, 
  Building2, 
  Users, 
  Landmark,
  ArrowLeft
} from 'lucide-react';
import { getStoredMerchant, getToken } from '@/lib/auth';

export default function OnboardingStage5() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }
      try {
        // Fetch all KYC data for review
        const res = await fetch('/api/onboarding/business-profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [router]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    const token = getToken();

    try {
      const res = await fetch('/api/onboarding/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (res.ok) {
        router.replace('/dashboard');
      } else {
        setError(json.error || 'Failed to submit application');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
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
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-sm shadow-emerald-200">
          <CheckCircle className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">05 — Review & Submit</h1>
          <p className="text-sm text-gray-500 mt-1">
            Please review your information before submitting your application.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Business Profile Summary */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-500" />
            01 — Business Profile
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Business Name:</span> <span className="font-medium">{data?.business_name}</span></div>
            <div><span className="text-gray-500">Business Type:</span> <span className="font-medium">{data?.business_type}</span></div>
            <div><span className="text-gray-500">KRA PIN:</span> <span className="font-medium">{data?.business_registration_number}</span></div>
          </div>
        </div>

        {/* Directors Summary */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" />
            02 — Owners & Documents
          </h3>
          {data?.directors && data.directors.length > 0 ? (
            data.directors.map((d: any, i: number) => (
              <div key={i} className="text-sm py-1">
                {d.fullName} — {d.role}
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400">No directors added.</p>
          )}
        </div>

        {/* Settlement Summary */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Landmark className="w-4 h-4 text-indigo-500" />
            04 — Settlement
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Method:</span> <span className="font-medium">{data?.settlement_method?.toUpperCase()}</span></div>
            {data?.settlement_method === 'bank' ? (
              <div><span className="text-gray-500">Bank:</span> <span className="font-medium">{data?.bank_name}</span></div>
            ) : (
              <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{data?.settlement_phone}</span></div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.push('/dashboard/onboarding/stage4')}
            className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Stage 4
          </button>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Confirm & Submit Application
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}