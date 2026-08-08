'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  Loader2,
  AlertCircle,
  Building2,
  Users,
  FileText,
  Landmark,
  ArrowLeft,
  Edit,
} from 'lucide-react';
import { getToken } from '@/lib/auth';

interface Director {
  fullName: string;
  idNumber: string;
  role: string;
}

interface ReviewData {
  business_name?: string;
  business_type?: string;
  business_registration_number?: string;
  trading_name?: string;
  date_of_registration?: string;
  country_of_registration?: string;
  industry?: string;
  business_description?: string;

  email?: string;
  phone?: string;
  country?: string;
  county?: string;
  city?: string;
  physical_address?: string;
  postal_code?: string;

  directors?: Director[];

  kra_pin?: string;

  settlement_method?: string;
  settlement_phone?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_holder?: string;
}

export default function OnboardingStage5() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<ReviewData | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      const token = getToken();

      if (!token) {
        router.push('/login');
        return;
      }

      try {
        // ✅ FIXED: Using /v1/onboarding/review instead of /api/...
        const res = await fetch('/v1/onboarding/review', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(
            json.error || 'Failed to load onboarding information'
          );
        }

        setData(json);
      } catch (err: any) {
        console.error('❌ Failed to load review:', err);

        setError(
          err.message || 'Failed to load onboarding information'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [router]);

  const handleSubmit = async () => {
    const token = getToken();

    if (!token) {
      router.push('/login');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // ✅ FIXED: Using /v1/onboarding/submit instead of /api/...
      const res = await fetch('/v1/onboarding/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(
          json.error ||
          json.message ||
          'Failed to submit application'
        );
      }

      router.replace('/dashboard');
    } catch (err: any) {
      console.error('❌ Failed to submit application:', err);

      setError(
        err.message || 'An error occurred while submitting.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
              05 — Review & Submit
            </p>
            <h1 className="text-2xl font-bold text-gray-900">
              Review & Submit
            </h1>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Please review your information carefully before submitting
          your application.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* ─── STAGE 1 ─── */}
        <ReviewSection
          icon={<Building2 className="w-4 h-4" />}
          title="01 — Business Profile"
          onEdit={() => router.push('/dashboard/onboarding/stage1')}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReviewItem label="Business Name" value={data?.business_name} />
            <ReviewItem label="Business Type" value={data?.business_type} />
            <ReviewItem label="Registration Number" value={data?.business_registration_number} />
            <ReviewItem label="Trading Name" value={data?.trading_name} />
            <ReviewItem label="Industry" value={data?.industry} />
            <ReviewItem label="Date of Registration" value={data?.date_of_registration} />
            <ReviewItem label="Country" value={data?.country} />
            <ReviewItem label="County" value={data?.county} />
            <ReviewItem label="City" value={data?.city} />
            <ReviewItem label="Physical Address" value={data?.physical_address} />
            <ReviewItem label="Email" value={data?.email} />
            <ReviewItem label="Phone" value={data?.phone} />
          </div>
        </ReviewSection>

        {/* ─── STAGE 2 ─── */}
        <ReviewSection
          icon={<Users className="w-4 h-4" />}
          title="02 — Owners & Beneficial Owners"
          onEdit={() => router.push('/dashboard/onboarding/stage2')}
        >
          {data?.directors && data.directors.length > 0 ? (
            <div className="space-y-3">
              {data.directors.map((director, index) => (
                <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ReviewItem label="Full Name" value={director.fullName} />
                    <ReviewItem label="ID / Passport" value={director.idNumber} />
                    <ReviewItem label="Role" value={director.role} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              No directors or beneficial owners added.
            </p>
          )}
        </ReviewSection>

        {/* ─── STAGE 3 ─── */}
        <ReviewSection
          icon={<FileText className="w-4 h-4" />}
          title="03 — Tax & Compliance"
          onEdit={() => router.push('/dashboard/onboarding/stage3')}
        >
          {/* ✅ FIXED: Using kra_pin instead of business_registration_number */}
          <ReviewItem label="KRA PIN" value={data?.kra_pin} />
        </ReviewSection>

        {/* ─── STAGE 4 ─── */}
        <ReviewSection
          icon={<Landmark className="w-4 h-4" />}
          title="04 — Settlement Preferences"
          onEdit={() => router.push('/dashboard/onboarding/stage4')}
        >
          <ReviewItem
            label="Settlement Method"
            value={data?.settlement_method?.toUpperCase()}
          />
          {data?.settlement_method === 'mpesa' || data?.settlement_method === 'airtel' ? (
            <ReviewItem label="Payout Number" value={data?.settlement_phone} />
          ) : data?.settlement_method === 'bank' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ReviewItem label="Bank Name" value={data?.bank_name} />
              <ReviewItem label="Account Number" value={data?.bank_account_number} />
              <ReviewItem label="Account Holder" value={data?.bank_account_holder} />
            </div>
          ) : null}
        </ReviewSection>

        {/* ─── FINAL CONFIRMATION ─── */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-indigo-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-gray-800">
                Ready to submit?
              </h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Please make sure all information above is accurate.
                Once submitted, your application will be sent for review.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard/onboarding/stage4')}
              className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Stage 4
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting Application...
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
    </div>
  );
}

/* ─── REVIEW SECTION ─── */
function ReviewSection({
  icon,
  title,
  onEdit,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="text-indigo-500">{icon}</div>
          <h3 className="text-sm font-bold text-gray-800">{title}</h3>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700"
        >
          <Edit className="w-3.5 h-3.5" />
          Edit
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

/* ─── REVIEW ITEM ─── */
function ReviewItem({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-800">
        {value || 'Not provided'}
      </p>
    </div>
  );
}