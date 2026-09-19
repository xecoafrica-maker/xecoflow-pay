// src/app/(auth)/verify-otp/page.tsx
//
// OTP verification screen. Second step in the login flow.
//
// Security model:
//   - The OTP temp token lives in an HttpOnly cookie (xeco_otp), set by
//     the BFF. This page never reads it, never stores it, never sees it.
//   - The session cookie (xeco_session) is only issued after OTP verification.
//   - The user's email is displayed masked. The raw email is never sent
//     to the client.
//   - No tokens, no PII, no cookies are written to localStorage or sessionStorage.
//
// The only client-side state this page holds is:
//   - The masked email, for display.
//   - The 6 digits the user types.
//   - UI state (loading, error, countdown, resend count).
// All of it is ephemeral. Refreshing the page re-fetches the masked email
// from the BFF (which reads the xeco_otp cookie server-side).

'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Loader2,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

// ─── Constants ──────────────────────────────────────────────────────
const OTP_LENGTH = 6;
const DEFAULT_EXPIRY_SECONDS = 300; // 5 minutes
const RESEND_COOLDOWN_SECONDS = 30;
const MAX_RESENDS_PER_SESSION = 5;
const SUCCESS_REDIRECT_DELAY_MS = 900;

// ─── Types ──────────────────────────────────────────────────────────
interface OtpContext {
  maskedEmail: string;
  expiresAt: number; // unix ms — authoritative expiry from the server
}

// ─── Main content ───────────────────────────────────────────────────
function VerifyOtpContent() {
  const router = useRouter();

  // Context fetched from the server (masked email + authoritative expiry).
  const [context, setContext] = useState<OtpContext | null>(null);

  // OTP digits.
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));

  // UI state.
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_EXPIRY_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendCount, setResendCount] = useState(0);

  // Refs.
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const submittingRef = useRef(false);

  // ─── Fetch OTP context on mount ───────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadContext() {
      try {
        const res = await fetch('/api/auth/otp-context', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        if (res.status === 401) {
          if (!cancelled) router.replace('/login');
          return;
        }

        if (!res.ok) {
          throw new Error('Unable to load verification context');
        }

        const data = (await res.json()) as OtpContext;

        if (cancelled) return;

        setContext(data);

        const remaining = Math.max(
          0,
          Math.floor((data.expiresAt - Date.now()) / 1000)
        );
        setSecondsLeft(remaining);
      } catch {
        if (!cancelled) {
          setError('Unable to start verification. Please log in again.');
          setTimeout(() => router.replace('/login'), 1500);
        }
      }
    }

    loadContext();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // ─── Expiry countdown ─────────────────────────────────────────────
  useEffect(() => {
    if (!context || secondsLeft <= 0 || success) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [context, secondsLeft, success]);

  // ─── Resend cooldown ──────────────────────────────────────────────
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // ─── Focus first input when ready ─────────────────────────────────
  useEffect(() => {
    if (context && !success) {
      inputRefs.current[0]?.focus();
    }
  }, [context, success]);

  // ─── Digit input handlers ─────────────────────────────────────────
  const handleDigitChange = useCallback((index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 1);
    if (!cleaned && value !== '') return;

    setDigits((prev) => {
      const next = [...prev];
      next[index] = cleaned;
      return next;
    });

    if (cleaned && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === 'ArrowLeft' && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [digits]
  );

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '');
    if (pasted.length !== OTP_LENGTH) return;

    setDigits(pasted.split(''));
    inputRefs.current[OTP_LENGTH - 1]?.focus();
  }, []);

  // ─── Submit OTP ───────────────────────────────────────────────────
  const handleVerify = useCallback(async () => {
    if (submittingRef.current || loading || success) return;

    const code = digits.join('');
    if (code.length !== OTP_LENGTH) {
      setError(`Please enter all ${OTP_LENGTH} digits.`);
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          window.location.replace('/dashboard');
        }, SUCCESS_REDIRECT_DELAY_MS);
        return;
      }

      const errorCode = data.code as string | undefined;
      const messages: Record<string, string> = {
        INVALID_OTP: 'That code is incorrect. Please try again.',
        OTP_EXPIRED: 'Your code has expired. Request a new one.',
        OTP_ATTEMPTS_EXCEEDED: 'Too many incorrect attempts. Request a new code.',
        OTP_NOT_FOUND: 'Verification session not found. Please log in again.',
        RATE_LIMITED: 'Too many requests. Please wait a moment.',
      };
      setError(messages[errorCode ?? ''] ?? 'Verification failed. Please try again.');

      if (errorCode === 'OTP_EXPIRED' || errorCode === 'OTP_ATTEMPTS_EXCEEDED') {
        setResendCooldown(0);
      }

      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      submittingRef.current = false;
    } catch {
      setError('Network error. Please check your connection and try again.');
      submittingRef.current = false;
    } finally {
      setLoading(false);
    }
  }, [digits, loading, success]);

  // ─── Resend OTP ───────────────────────────────────────────────────
  const handleResend = useCallback(async () => {
    if (resending || success || resendCooldown > 0) return;
    if (resendCount >= MAX_RESENDS_PER_SESSION) return;

    setResending(true);
    setError('');

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setDigits(Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();

        if (typeof data.expiresAt === 'number') {
          const remaining = Math.max(
            0,
            Math.floor((data.expiresAt - Date.now()) / 1000)
          );
          setSecondsLeft(remaining);
        } else {
          setSecondsLeft(DEFAULT_EXPIRY_SECONDS);
        }

        setResendCooldown(RESEND_COOLDOWN_SECONDS);
        setResendCount((c) => c + 1);
      } else {
        const errorCode = data.code as string | undefined;
        const messages: Record<string, string> = {
          RATE_LIMITED: 'Please wait before requesting another code.',
          OTP_NOT_FOUND: 'Session expired. Please log in again.',
        };
        setError(
          messages[errorCode ?? ''] ??
            'Unable to resend the code. Please try again.'
        );
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setResending(false);
    }
  }, [resending, success, resendCooldown, resendCount]);

  // ─── Utilities ────────────────────────────────────────────────────
  const formatTime = (total: number) => {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isExpired = secondsLeft <= 0;
  const isComplete = digits.every((d) => d !== '');
  const canSubmit = !loading && !success && isComplete && !isExpired;
  const canResend =
    !resending &&
    !success &&
    resendCooldown === 0 &&
    resendCount < MAX_RESENDS_PER_SESSION;

  // ─── Render: pre-load ─────────────────────────────────────────────
  if (!context) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdf6ec]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#f59e0b] mx-auto" />
          <p className="mt-4 text-sm text-gray-500">
            Preparing verification…
          </p>
        </div>
      </div>
    );
  }

  // ─── Render: main ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#fdf6ec] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-sm border border-orange-100 p-8 sm:p-10">
          {/* ─── Illustration ───────────────────────────────────── */}
          <div className="flex justify-center mb-6">
            <div className="relative w-24 h-24">
              {/* Envelope base */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] shadow-lg shadow-orange-200/50" />
              {/* Envelope flap */}
              <svg
                viewBox="0 0 96 96"
                className="absolute inset-0 w-full h-full"
                aria-hidden="true"
              >
                <path
                  d="M14 30 L48 54 L82 30"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.9"
                />
              </svg>
              {/* Key badge */}
              <div className="absolute -left-2 -bottom-2 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-[#ef4444] flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              </div>
              {/* 6-digit badge */}
              <div className="absolute -right-2 -bottom-2 bg-white rounded-lg shadow-md px-2 py-1 border border-orange-100">
                <span className="text-[10px] font-bold tracking-widest text-gray-700">
                  ******
                </span>
              </div>
            </div>
          </div>

          {/* ─── Heading ────────────────────────────────────────── */}
          <div className="text-center mb-7">
            <h1 className="text-[26px] font-bold text-gray-900 tracking-tight">
              Verify Your Email Address
            </h1>
            <p className="text-[13px] text-gray-500 leading-relaxed mt-3 max-w-sm mx-auto">
              We&apos;ve sent a 6-digit verification code to{' '}
              <span className="font-medium text-gray-700">
                {context.maskedEmail}
              </span>
              . Enter it below to confirm your identity.
            </p>
          </div>

          {/* ─── Success ────────────────────────────────────────── */}
          {success && (
            <div
              role="status"
              className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-center gap-3"
            >
              <CheckCircle2
                className="w-5 h-5 text-emerald-500 flex-shrink-0"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-medium text-emerald-800">
                  Verified successfully
                </p>
                <p className="text-xs text-emerald-600">
                  Taking you to your dashboard…
                </p>
              </div>
            </div>
          )}

          {/* ─── Error ──────────────────────────────────────────── */}
          {error && !success && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 rounded-xl p-3 mb-6 flex items-start gap-2"
            >
              <AlertCircle
                className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* ─── OTP form ───────────────────────────────────────── */}
          {!success && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleVerify();
              }}
              className="space-y-6"
            >
              {/* Digit inputs */}
              <div>
                <div
                  className="flex justify-center gap-2 sm:gap-3"
                  onPaste={handlePaste}
                  role="group"
                  aria-label="One-time passcode"
                >
                  {digits.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete={index === 0 ? 'one-time-code' : 'off'}
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      disabled={loading || success || isExpired}
                      aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
                      className={`w-11 h-14 sm:w-12 sm:h-16 text-center text-2xl font-bold
                        rounded-xl border-2 transition-all
                        text-gray-900
                        focus:outline-none focus:ring-4 focus:ring-orange-500/15 focus:border-[#f59e0b]
                        disabled:opacity-50 disabled:bg-gray-50
                        ${
                          error
                            ? 'border-red-300 bg-red-50/30'
                            : digit
                            ? 'border-[#f59e0b] bg-orange-50/40'
                            : 'border-gray-200 bg-gray-50/60'
                        }`}
                    />
                  ))}
                </div>
              </div>

              {/* Expiry countdown */}
              <div className="flex items-center justify-center gap-1.5 text-[12px] text-gray-500">
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                {isExpired ? (
                  <span className="text-red-600 font-medium">
                    Code expired. Request a new one below.
                  </span>
                ) : (
                  <>
                    <span>Code expires in</span>
                    <span
                      className={`font-semibold ${
                        secondsLeft < 60 ? 'text-red-500' : 'text-gray-700'
                      }`}
                      aria-live="polite"
                    >
                      {formatTime(secondsLeft)}
                    </span>
                  </>
                )}
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full py-3.5 rounded-full bg-[#f59e0b] hover:bg-[#ea9008]
                  text-white font-semibold text-[15px] transition-all
                  disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed
                  shadow-lg shadow-orange-200/60
                  flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    Verifying…
                  </>
                ) : (
                  <>
                    Verify Email
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ─── Resend + Help ──────────────────────────────────── */}
          {!success && (
            <div className="mt-6 text-center space-y-3">
              <p className="text-[13px] text-gray-500">
                Want to change your email address?{' '}
                <Link
                  href="/login"
                  className="font-semibold text-[#f59e0b] hover:text-[#ea9008] transition-colors"
                >
                  Change Here
                </Link>
              </p>

              <button
                type="button"
                onClick={handleResend}
                disabled={!canResend}
                className="text-[13px] font-semibold text-[#1f2937] hover:text-[#f59e0b]
                  disabled:text-gray-300 disabled:cursor-not-allowed
                  underline underline-offset-4 decoration-gray-300
                  hover:decoration-[#f59e0b] transition-all"
              >
                {resending
                  ? 'Sending…'
                  : resendCooldown > 0
                  ? `Resend Code (${resendCooldown}s)`
                  : resendCount >= MAX_RESENDS_PER_SESSION
                  ? 'Resend limit reached'
                  : 'Resend Code'}
              </button>

              {resendCount >= MAX_RESENDS_PER_SESSION && (
                <p className="text-[11px] text-gray-400">
                  For your security, please log in again to request a new code.
                </p>
              )}
            </div>
          )}
        </div>

        {/* ─── Trust line ───────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-2 mt-6 text-[11px] text-gray-400">
          <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Your connection is secured with end-to-end encryption</span>
        </div>
      </div>
    </div>
  );
}

// ─── Page wrapper (Suspense boundary) ──────────────────────────────
export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#fdf6ec]">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-[#f59e0b] mx-auto" />
            <p className="mt-4 text-sm text-gray-500">Loading…</p>
          </div>
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}