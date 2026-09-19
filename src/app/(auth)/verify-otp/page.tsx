// src/app/(auth)/verify-otp/page.tsx

'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck, Clock, AlertCircle } from 'lucide-react';

const OTP_LENGTH = 6;
const DEFAULT_EXPIRY_SECONDS = 300;
const RESEND_COOLDOWN_SECONDS = 30;
const MAX_RESENDS_PER_SESSION = 5;
const SUCCESS_REDIRECT_DELAY_MS = 200;

interface OtpContext {
  maskedEmail: string;
  expiresAt: number;
}

function VerifyOtpContent() {
  const router = useRouter();

  const [context, setContext] = useState<OtpContext | null>(null);
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [expiresAt, setExpiresAt] = useState<number>(0);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_EXPIRY_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendCount, setResendCount] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const submittingRef = useRef(false);

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

        if (!res.ok) throw new Error('context fetch failed');

        const data = (await res.json()) as OtpContext;
        if (cancelled) return;

        setContext(data);
        setExpiresAt(data.expiresAt);

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

  // Countdown — derived from `expiresAt`, not decremented by hand.
  // This avoids stacking intervals when the deadline changes on resend.
  useEffect(() => {
    if (!expiresAt) return;

    const tick = () => {
      const remaining = Math.max(
        0,
        Math.floor((expiresAt - Date.now()) / 1000)
      );
      setSecondsLeft(remaining);
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (context) inputRefs.current[0]?.focus();
  }, [context]);

  const submitOtp = useCallback(
    async (codeOverride?: string) => {
      const code = codeOverride ?? digits.join('');
      if (submittingRef.current || loading) return;
      if (code.length !== OTP_LENGTH) return;

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
          setTimeout(() => {
            window.location.replace('/dashboard');
          }, SUCCESS_REDIRECT_DELAY_MS);
          return;
        }

        const errorCode = data.code as string | undefined;
        const messages: Record<string, string> = {
          INVALID_OTP: 'That code is incorrect. Please try again.',
          OTP_EXPIRED: 'Your code has expired. Request a new one.',
          OTP_ATTEMPTS_EXCEEDED:
            'Too many incorrect attempts. Request a new code.',
          OTP_NOT_FOUND: 'Verification session not found. Please log in again.',
          RATE_LIMITED: 'Too many requests. Please wait a moment.',
        };
        setError(
          messages[errorCode ?? ''] ?? 'Verification failed. Please try again.'
        );

        if (
          errorCode === 'OTP_EXPIRED' ||
          errorCode === 'OTP_ATTEMPTS_EXCEEDED'
        ) {
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
    },
    [digits, loading]
  );

  const handleDigitChange = useCallback(
    (index: number, value: string) => {
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

      if (cleaned && index === OTP_LENGTH - 1) {
        const nextCode = digits
          .map((d, i) => (i === index ? cleaned : d))
          .join('');
        if (nextCode.length === OTP_LENGTH) {
          setTimeout(() => void submitOtp(nextCode), 0);
        }
      }
    },
    [digits, submitOtp]
  );

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

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '');
      if (pasted.length !== OTP_LENGTH) return;

      setDigits(pasted.split(''));
      inputRefs.current[OTP_LENGTH - 1]?.focus();
      setTimeout(() => void submitOtp(pasted), 0);
    },
    [submitOtp]
  );

  const handleResend = useCallback(async () => {
    if (resending || resendCooldown > 0) return;
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
          setExpiresAt(data.expiresAt);
          const remaining = Math.max(
            0,
            Math.floor((data.expiresAt - Date.now()) / 1000)
          );
          setSecondsLeft(remaining);
        } else {
          const fallback = Date.now() + DEFAULT_EXPIRY_SECONDS * 1000;
          setExpiresAt(fallback);
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
  }, [resending, resendCooldown, resendCount]);

  const formatTime = (total: number) => {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isExpired = secondsLeft <= 0;
  const isComplete = digits.every((d) => d !== '');
  const canResend =
    !resending &&
    resendCooldown === 0 &&
    resendCount < MAX_RESENDS_PER_SESSION;

  if (!context) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-4 text-sm text-gray-500">Preparing verification…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-8">
          <div className="text-center mb-7">
            <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck
                className="w-7 h-7 text-indigo-600"
                aria-hidden="true"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Verify your identity
            </h1>
            <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
              We sent a {OTP_LENGTH}-digit code to{' '}
              <span className="font-medium text-gray-700">
                {context.maskedEmail}
              </span>
              . Enter it below.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 rounded-xl p-3 mb-5 flex items-start gap-2"
            >
              <AlertCircle
                className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submitOtp();
            }}
            className="space-y-5"
          >
            <div
              className="flex justify-center gap-2"
              onPaste={handlePaste}
              role="group"
              aria-label="One-time passcode"
            >
              {digits.map((digit, index) => (
                <div
                  key={index}
                  className="relative w-11 h-14 sm:w-12 sm:h-16"
                >
                  <input
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
                    disabled={loading || isExpired}
                    aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
                    className={`w-full h-full text-center text-2xl font-bold
                      rounded-xl border-2 transition-all
                      focus:outline-none focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-600
                      disabled:opacity-60 disabled:bg-gray-50
                      ${
                        error
                          ? 'border-red-300 bg-red-50/40'
                          : digit
                          ? 'border-indigo-500 bg-indigo-50/40'
                          : 'border-gray-200 bg-gray-50/60'
                      }
                      ${
                        digit
                          ? 'text-transparent caret-transparent'
                          : 'text-gray-900'
                      }`}
                  />
                  {digit && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 flex items-center justify-center"
                    >
                      <span className="w-3 h-3 rounded-full bg-indigo-600" />
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
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

            <button
              type="submit"
              disabled={loading || isExpired || !isComplete}
              className="w-full py-3.5 rounded-full bg-indigo-600 hover:bg-indigo-700
                text-white font-semibold text-sm transition-all
                shadow-lg shadow-indigo-600/20
                flex items-center justify-center gap-2
                disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed
                disabled:shadow-none disabled:hover:bg-gray-200"
            >
              {loading ? (
                <>
                  <Loader2
                    className="w-4 h-4 animate-spin"
                    aria-hidden="true"
                  />
                  Verifying…
                </>
              ) : (
                'Verify'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Didn&apos;t receive the code?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={!canResend}
                className="font-semibold text-indigo-600 hover:text-indigo-700
                  disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {resending
                  ? 'Sending…'
                  : resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : resendCount >= MAX_RESENDS_PER_SESSION
                  ? 'Resend limit reached'
                  : 'Resend code'}
              </button>
            </p>

            {resendCount >= MAX_RESENDS_PER_SESSION && (
              <p className="text-xs text-gray-400 mt-2">
                For your security, please log in again to request a new code.
              </p>
            )}

            <Link
              href="/login"
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors inline-block mt-4"
            >
              ← Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto" />
            <p className="mt-4 text-sm text-gray-500">Loading…</p>
          </div>
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}