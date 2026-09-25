// src/app/verify-email-success/page.tsx
'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  ArrowRight,
} from 'lucide-react';

// ─── Success cases ─────────────────────────────────────────────────
function SuccessView({ email }: { email?: string }) {
  return (
    <>
      <div className="w-20 h-20 mx-auto bg-emerald-50 rounded-full flex items-center justify-center">
        <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
        Email verified
      </h1>

      <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
        {email ? (
          <>
            Your email address{' '}
            <span className="font-medium text-gray-900 dark:text-white">
              {email}
            </span>{' '}
            is confirmed. You can now sign in to your account.
          </>
        ) : (
          <>
            Your email address is confirmed. You can now sign in to your
            account.
          </>
        )}
      </p>

      <Link
        href="/login"
        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-sm transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2"
      >
        Continue to login <ArrowRight className="w-4 h-4" />
      </Link>
    </>
  );
}

// ─── Already-verified case ─────────────────────────────────────────
function AlreadyView() {
  return (
    <>
      <div className="w-20 h-20 mx-auto bg-blue-50 rounded-full flex items-center justify-center">
        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Info className="w-8 h-8 text-white" />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
        Already verified
      </h1>

      <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
        Your email was already verified. You can sign in to your account.
      </p>

      <Link
        href="/login"
        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-sm transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2"
      >
        Continue to login <ArrowRight className="w-4 h-4" />
      </Link>
    </>
  );
}

// ─── Failure cases ─────────────────────────────────────────────────
type FailureReason = 'invalid' | 'expired' | 'missing' | 'error';

const FAILURE_COPY: Record<
  FailureReason,
  { tone: 'red' | 'amber'; title: string; body: string }
> = {
  invalid: {
    tone: 'red',
    title: 'This link is invalid',
    body: 'The verification link has already been used or is no longer valid. If your email is still unverified, sign in and request a new link.',
  },
  expired: {
    tone: 'amber',
    title: 'This link has expired',
    body: 'Verification links expire after 24 hours. Sign in and click Resend to get a fresh link.',
  },
  missing: {
    tone: 'red',
    title: 'Invalid link',
    body: 'No verification token was provided. Please use the link from your email.',
  },
  error: {
    tone: 'red',
    title: 'Something went wrong',
    body: 'We could not verify your email right now. Please try again or contact support.',
  },
};

function FailureView({ reason }: { reason: FailureReason }) {
  const copy = FAILURE_COPY[reason];
  const Icon = copy.tone === 'red' ? AlertCircle : AlertTriangle;

  const iconBg =
    copy.tone === 'red' ? 'bg-red-50' : 'bg-amber-50';
  const iconInnerBg =
    copy.tone === 'red' ? 'bg-red-500' : 'bg-amber-500';
  const iconShadow =
    copy.tone === 'red'
      ? 'shadow-red-500/30'
      : 'shadow-amber-500/30';

  return (
    <>
      <div
        className={`w-20 h-20 mx-auto ${iconBg} rounded-full flex items-center justify-center`}
      >
        <div
          className={`w-16 h-16 ${iconInnerBg} rounded-full flex items-center justify-center shadow-lg ${iconShadow}`}
        >
          <Icon className="w-8 h-8 text-white" />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
        {copy.title}
      </h1>

      <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
        {copy.body}
      </p>

      <div className="space-y-3">
        <Link
          href="/login"
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-sm transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2"
        >
          Go to login <ArrowRight className="w-4 h-4" />
        </Link>

        <p className="text-[11px] text-gray-400 dark:text-gray-500">
          Still stuck?{' '}
          <a
            href="mailto:support@xecoflow.com"
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium"
          >
            Contact support
          </a>
        </p>
      </div>
    </>
  );
}

// ─── Main page ─────────────────────────────────────────────────────
function VerifyEmailSuccessInner() {
  const searchParams = useSearchParams();

  const verified = searchParams.get('verified') === 'true';
  const already = searchParams.get('already') === 'true';
  const email = searchParams.get('email') || undefined;
  const reasonParam = searchParams.get('reason') || 'error';

  const validReasons: FailureReason[] = [
    'invalid',
    'expired',
    'missing',
    'error',
  ];
  const reason = validReasons.includes(reasonParam as FailureReason)
    ? (reasonParam as FailureReason)
    : 'error';

  return (
    <div className="min-h-[100svh] bg-[#0a2540] flex flex-col items-center justify-center px-4 py-10">
      {/* Logo above the card */}
      <Link href="/" className="inline-block mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Xeco<span className="text-emerald-400">Flow</span>
        </h1>
      </Link>

      {/* Card */}
      <div className="w-full max-w-[440px] bg-white dark:bg-[#0f1f3a] rounded-2xl shadow-2xl shadow-black/30 p-8 text-center space-y-5">
        {verified && already && <AlreadyView />}
        {verified && !already && <SuccessView email={email} />}
        {!verified && <FailureView reason={reason} />}
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-slate-500">
        © 2026 XecoFlow. All rights reserved.
      </p>
    </div>
  );
}

export default function VerifyEmailSuccessPage() {
  // useSearchParams requires a Suspense boundary in Next.js App Router.
  return (
    <Suspense
      fallback={
        <div className="min-h-[100svh] bg-[#0a2540] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyEmailSuccessInner />
    </Suspense>
  );
}