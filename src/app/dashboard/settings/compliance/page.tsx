// src/app/dashboard/settings/compliance/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Loader2,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  Building2,
  Users,
  FileText,
  Landmark,
  FolderOpen,
  Eye,
  Download,
  Info,
} from 'lucide-react';
import { getStoredMerchant, getToken } from '@/lib/auth';
import SettingsTabs from '@/components/settings/SettingsTabs';

// ─── Types ──────────────────────────────────────────────────────────
type KYCStatus = 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

interface Director {
  fullName: string;
  idNumber: string;
  role: string;
}

interface ReviewData {
  // Business Profile
  business_name?: string;
  business_type?: string;
  business_registration_number?: string;
  trading_name?: string;
  date_of_registration?: string;
  country_of_registration?: string;
  industry?: string;
  business_description?: string;

  // Contact
  email?: string;
  phone?: string;
  country?: string;
  county?: string;
  city?: string;
  physical_address?: string;
  postal_code?: string;

  // Directors
  directors?: Director[];

  // Tax
  kra_pin?: string;

  // Settlement
  settlement_method?: string;
  settlement_phone?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_holder?: string;

  // KYC status
  kyc_status?: KYCStatus;
  kyc_reviewer_note?: string;
  kyc_submitted_at?: string;
}

// ─── Status Banner ─────────────────────────────────────────────────
function StatusBanner({
  status,
  note,
  submittedAt,
}: {
  status: KYCStatus;
  note?: string;
  submittedAt?: string;
}) {
  const config = {
    NOT_STARTED: {
      tone: 'bg-gray-50 border-gray-200',
      iconBg: 'bg-gray-100',
      icon: AlertCircle,
      iconColor: 'text-gray-500',
      title: 'Verification not started',
      titleColor: 'text-gray-900',
      message: 'Complete onboarding to submit your business for verification.',
      messageColor: 'text-gray-600',
    },
    PENDING: {
      tone: 'bg-amber-50 border-amber-200',
      iconBg: 'bg-amber-100',
      icon: Clock,
      iconColor: 'text-amber-600',
      title: 'Verification in progress',
      titleColor: 'text-amber-900',
      message: note || 'Our team is reviewing your documents. This usually takes 24–48 hours.',
      messageColor: 'text-amber-800',
    },
    VERIFIED: {
      tone: 'bg-emerald-50 border-emerald-200',
      iconBg: 'bg-emerald-100',
      icon: CheckCircle,
      iconColor: 'text-emerald-600',
      title: 'Business verified',
      titleColor: 'text-emerald-900',
      message: 'Your account is fully verified. Payouts are enabled.',
      messageColor: 'text-emerald-800',
    },
    REJECTED: {
      tone: 'bg-red-50 border-red-200',
      iconBg: 'bg-red-100',
      icon: XCircle,
      iconColor: 'text-red-600',
      title: 'Verification rejected',
      titleColor: 'text-red-900',
      message: note || 'Some details need updating. Please contact support to resubmit.',
      messageColor: 'text-red-800',
    },
  }[status];

  const Icon = config.icon;

  return (
    <div className={`border rounded-xl p-4 ${config.tone}`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-lg ${config.iconBg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-4 h-4 ${config.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-[13px] font-semibold ${config.titleColor}`}>
              {config.title}
            </p>
            {submittedAt && status === 'PENDING' && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                Submitted {submittedAt}
              </span>
            )}
          </div>
          <p className={`text-[12px] mt-0.5 ${config.messageColor}`}>
            {config.message}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Section Card ──────────────────────────────────────────────────
function SectionCard({
  number,
  icon: Icon,
  title,
  children,
}: {
  number: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
        <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
          {number}
        </span>
        <Icon className="w-4 h-4 text-indigo-600" />
        <h3 className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider">
          {title}
        </h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Review Item ───────────────────────────────────────────────────
function ReviewItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
}) {
  const display = value && String(value).trim() ? value : 'Not provided';
  const isEmpty = display === 'Not provided';

  return (
    <div>
      <p className="text-[11px] text-gray-400 mb-1">{label}</p>
      <p
        className={`text-[13px] font-medium ${
          isEmpty ? 'text-gray-400 italic' : 'text-gray-900'
        } ${mono && !isEmpty ? 'font-mono' : ''}`}
      >
        {display}
      </p>
    </div>
  );
}

// ─── Document Row ──────────────────────────────────────────────────
function DocumentRow({
  label,
  status,
  uploadedAt,
  onView,
}: {
  label: string;
  status: 'uploaded' | 'pending' | 'rejected';
  uploadedAt?: string;
  onView?: () => void;
}) {
  const statusConfig = {
    uploaded: {
      bg: 'bg-emerald-50',
      icon: CheckCircle,
      iconColor: 'text-emerald-500',
      text: uploadedAt ? `Uploaded ${uploadedAt}` : 'Uploaded',
      textColor: 'text-gray-500',
    },
    pending: {
      bg: 'bg-gray-50',
      icon: Clock,
      iconColor: 'text-gray-400',
      text: 'Pending upload',
      textColor: 'text-gray-500',
    },
    rejected: {
      bg: 'bg-red-50',
      icon: XCircle,
      iconColor: 'text-red-500',
      text: 'Rejected — contact support',
      textColor: 'text-red-600',
    },
  }[status];

  const Icon = statusConfig.icon;

  return (
    <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${statusConfig.bg}`}
        >
          <Icon className={`w-4 h-4 ${statusConfig.iconColor}`} />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-gray-900 truncate">
            {label}
          </p>
          <p className={`text-[11px] ${statusConfig.textColor}`}>
            {statusConfig.text}
          </p>
        </div>
      </div>

      {status === 'uploaded' && onView && (
        <button
          type="button"
          onClick={onView}
          className="text-[12px] font-medium text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Eye className="w-3.5 h-3.5" />
          View
        </button>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────
export default function ComplianceSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<ReviewData | null>(null);

  // ─── Fetch Review Data ─────────────────────────────────────────
  useEffect(() => {
    const cached = getStoredMerchant();
    const merchantId = cached?.merchant_id || cached?.merchantId;

    // ✅ Multi-key token check
    const token = getToken();

    // ✅ Only redirect if BOTH token and merchant are missing
    if (!token || !merchantId) {
      console.warn('⚠️ Missing session, redirecting to login');
      router.push('/login?session=expired');
      return;
    }

    const fetchSummary = async () => {
      try {
        const res = await fetch('/api/onboarding/review', {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        // ✅ Only logout on explicit 401
        if (res.status === 401) {
          router.push('/login?session=expired');
          return;
        }

        const json = await res.json();

        if (!res.ok) {
          throw new Error(
            json.error || json.message || 'Failed to load compliance information'
          );
        }

        setData(json);
      } catch (err: any) {
        console.error('Failed to load compliance review:', err);
        setError(err.message || 'Failed to load compliance information');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const kycStatus: KYCStatus = data?.kyc_status || 'NOT_STARTED';

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-sm shadow-indigo-200">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-[24px] font-bold text-gray-900 tracking-tight">
            Compliance & KYC
          </h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            Your submitted business information and verification status.
          </p>
        </div>
      </div>

      {/* ─── Settings Tabs ─────────────────────────────────────────── */}
      <SettingsTabs />

      {/* ─── Error ─────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] p-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ─── Read-only Notice ──────────────────────────────────────── */}
      <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3.5 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
        <p className="text-[12px] text-indigo-900 leading-relaxed">
          This information was submitted during onboarding and is{' '}
          <strong>read-only</strong>. To make changes, please contact support.
        </p>
      </div>

      {/* ─── Status Banner ─────────────────────────────────────────── */}
      <StatusBanner
        status={kycStatus}
        note={data?.kyc_reviewer_note}
        submittedAt={data?.kyc_submitted_at}
      />

      {/* ─── 1. Business Profile ──────────────────────────────────── */}
      <SectionCard number="1" icon={Building2} title="Business Profile">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <ReviewItem label="Business Name" value={data?.business_name} />
          <ReviewItem label="Trading Name" value={data?.trading_name} />
          <ReviewItem label="Business Type" value={data?.business_type} />
          <ReviewItem label="Industry" value={data?.industry} />
          <ReviewItem
            label="Registration Number"
            value={data?.business_registration_number}
            mono
          />
          <ReviewItem
            label="Date of Registration"
            value={data?.date_of_registration}
          />
          <ReviewItem
            label="Country of Registration"
            value={data?.country_of_registration}
          />
          <ReviewItem
            label="Business Description"
            value={data?.business_description}
          />
        </div>
      </SectionCard>

      {/* ─── 2. Contact & Address ─────────────────────────────────── */}
      <SectionCard number="2" icon={Landmark} title="Contact & Address">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <ReviewItem label="Email" value={data?.email} />
          <ReviewItem label="Phone" value={data?.phone} />
          <ReviewItem label="Country" value={data?.country} />
          <ReviewItem label="County" value={data?.county} />
          <ReviewItem label="City" value={data?.city} />
          <ReviewItem label="Postal Code" value={data?.postal_code} />
          <div className="md:col-span-2">
            <ReviewItem
              label="Physical Address"
              value={data?.physical_address}
            />
          </div>
        </div>
      </SectionCard>

      {/* ─── 3. Directors & Owners ────────────────────────────────── */}
      <SectionCard number="3" icon={Users} title="Directors & Owners">
        {data?.directors && data.directors.length > 0 ? (
          <div className="space-y-3">
            {data.directors.map((director, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50/40"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-[12px] font-semibold text-gray-700">
                    {director.fullName || `Director ${index + 1}`}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3">
                  <ReviewItem label="Full Name" value={director.fullName} />
                  <ReviewItem
                    label="ID / Passport"
                    value={director.idNumber}
                    mono
                  />
                  <ReviewItem label="Role" value={director.role} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-[12px] text-gray-400">
              No directors or beneficial owners on file.
            </p>
          </div>
        )}
      </SectionCard>

      {/* ─── 4. Tax Compliance ────────────────────────────────────── */}
      <SectionCard number="4" icon={FileText} title="Tax Compliance">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <ReviewItem label="KRA PIN" value={data?.kra_pin} mono />
        </div>
      </SectionCard>

      {/* ─── 5. Settlement Preferences ─────────────────────────────── */}
      <SectionCard number="5" icon={Landmark} title="Settlement Preferences">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <ReviewItem
            label="Settlement Method"
            value={data?.settlement_method?.toUpperCase()}
          />

          {(data?.settlement_method === 'mpesa' ||
            data?.settlement_method === 'airtel') && (
            <ReviewItem
              label="Payout Number"
              value={data?.settlement_phone}
              mono
            />
          )}

          {data?.settlement_method === 'bank' && (
            <>
              <ReviewItem label="Bank Name" value={data?.bank_name} />
              <ReviewItem
                label="Account Number"
                value={data?.bank_account_number}
                mono
              />
              <ReviewItem
                label="Account Holder"
                value={data?.bank_account_holder}
              />
            </>
          )}
        </div>
      </SectionCard>

      {/* ─── 6. Uploaded Documents ────────────────────────────────── */}
      <SectionCard number="6" icon={FolderOpen} title="Uploaded Documents">
        <div className="divide-y divide-gray-100">
          <DocumentRow label="Certificate of Incorporation" status="pending" />
          <DocumentRow label="KRA PIN Certificate" status="pending" />
          <DocumentRow label="Directors' National IDs" status="pending" />
        </div>
        <p className="text-[11px] text-gray-400 mt-4 leading-relaxed">
          Document statuses update automatically as your onboarding submission is
          reviewed.
        </p>
      </SectionCard>

      {/* ─── Footer Note ───────────────────────────────────────────── */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start gap-3">
        <Download className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-[12px] font-medium text-gray-700">
            Need to make changes?
          </p>
          <p className="text-[12px] text-gray-500 mt-0.5">
            Contact our support team at{' '}
            <a
              href="mailto:support@xecoflow.com"
              className="text-indigo-600 hover:underline font-medium"
            >
              support@xecoflow.com
            </a>{' '}
            to update any of the information shown above.
          </p>
        </div>
      </div>
    </div>
  );
}