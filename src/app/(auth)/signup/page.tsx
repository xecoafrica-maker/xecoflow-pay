'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Globe,
  Send,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  registerMerchant,
  resendVerification,
  SUPPORTED_COUNTRIES,
  TERMS_VERSION,
  PASSWORD_RULE,
  type CountryCode,
} from '../../../lib/auth-api';
import { friendlyError, friendlyErrorHeadline } from '../../../lib/errors';

const RESEND_COOLDOWN_SECONDS = 60;

// ─── Password strength ─────────────────────────────────────────────
type Strength = { score: 0 | 1 | 2 | 3; label: string; tone: string };

function scorePassword(pw: string): Strength {
  if (!pw) return { score: 0, label: '', tone: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 2) return { score: 1, label: 'Weak', tone: 'bg-red-500' };
  if (score <= 3) return { score: 2, label: 'Fair', tone: 'bg-amber-500' };
  return { score: 3, label: 'Strong', tone: 'bg-emerald-500' };
}

type FormErrors = {
  businessName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
};

type FormLevelError = { headline: string; message: string };

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'form-error'; error: FormLevelError }
  | { kind: 'verify-sent'; email: string };

export default function SignUpPage() {
  const [state, setState] = useState<SubmitState>({ kind: 'idle' });
  const [country, setCountry] = useState<CountryCode>('KE');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  function validate(): FormErrors {
    const e: FormErrors = {};

    if (!businessName.trim()) e.businessName = 'Business name is required.';
    if (!firstName.trim()) e.firstName = 'First name is required.';
    if (!lastName.trim()) e.lastName = 'Last name is required.';

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail))
      e.email = 'Enter a valid email address.';

    if (!password) e.password = 'Password is required.';
    else if (!PASSWORD_RULE.test(password))
      e.password =
        'Password must be 8+ characters and include both letters and numbers.';

    if (!confirmPassword) e.confirmPassword = 'Please confirm your password.';
    else if (confirmPassword !== password)
      e.confirmPassword = 'Passwords do not match.';

    if (!acceptedTerms)
      e.terms = 'You must accept the Terms and Privacy Policy.';

    return e;
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();

    const validation = validate();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      setState({ kind: 'idle' });
      return;
    }

    setState({ kind: 'submitting' });
    setErrors({});

    try {
      await registerMerchant({
        email: email.trim().toLowerCase(),
        password,
        businessName: businessName.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        country,
        termsVersion: TERMS_VERSION,
      });

      setState({ kind: 'verify-sent', email: email.trim().toLowerCase() });
    } catch (err: unknown) {
      setState({
        kind: 'form-error',
        error: {
          message: friendlyError(err),
          headline: friendlyErrorHeadline(err),
        },
      });
    }
  };

  if (state.kind === 'verify-sent') {
    return <VerifyEmailScreen email={state.email} />;
  }

  const submitting = state.kind === 'submitting';
  const formError = state.kind === 'form-error' ? state.error : null;
  const strength = scorePassword(password);

  const clear = (field: keyof FormErrors) =>
    setErrors((p) => (p[field] ? { ...p, [field]: undefined } : p));

  const inputBase =
    'w-full py-3 bg-white dark:bg-[#0f1f3a] border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all text-gray-900 dark:text-white disabled:opacity-60';
  const inputOk =
    'border-gray-300 dark:border-gray-700 focus:ring-indigo-500/30 focus:border-indigo-500';
  const inputBad =
    'border-red-400 dark:border-red-700 focus:ring-red-500/20 focus:border-red-500';

  return (
    <div className="min-h-[100svh] bg-[#0a2540] dark:bg-[#0a2540] flex flex-col items-center justify-center px-4 py-10">
      {/* Logo above the card */}
      <Link href="/" className="inline-block mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Xeco<span className="text-emerald-400">Flow</span>
        </h1>
      </Link>

      {/* Card */}
      <div className="w-full max-w-[440px] bg-white dark:bg-[#0f1f3a] rounded-2xl shadow-2xl shadow-black/30 p-6 sm:p-8">
        {/* Heading */}
        <div className="mb-6 text-center">
          <h2 className="text-sm font-semibold tracking-[0.14em] text-gray-500 dark:text-gray-400 uppercase">
            Create your account
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Join 500+ Kenyan businesses on XecoFlow
          </p>
        </div>

        {/* Form-level error */}
        {formError && (
          <div
            role="alert"
            className="mb-5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3.5 flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                {formError.headline}
              </p>
              <p className="text-sm text-red-600 dark:text-red-300">
                {formError.message}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Country */}
          <div>
            <label
              htmlFor="country"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Country
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Globe className="w-4 h-4 text-gray-400" />
              </div>
              <select
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value as CountryCode)}
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#0f1f3a] border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all appearance-none text-gray-900 dark:text-white"
              >
                {SUPPORTED_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Business name */}
          <div>
            <label
              htmlFor="businessName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Business Name
            </label>
            <input
              id="businessName"
              type="text"
              autoComplete="organization"
              value={businessName}
              onChange={(e) => {
                setBusinessName(e.target.value);
                clear('businessName');
              }}
              placeholder="Enter your business name"
              aria-invalid={!!errors.businessName}
              aria-describedby={
                errors.businessName ? 'err-businessName' : undefined
              }
              className={`${inputBase} px-4 ${
                errors.businessName ? inputBad : inputOk
              }`}
            />
            {errors.businessName && (
              <p
                id="err-businessName"
                className="mt-1.5 text-xs text-red-500 flex items-center gap-1"
              >
                <AlertCircle className="w-3 h-3" />
                {errors.businessName}
              </p>
            )}
          </div>

          {/* First name */}
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                clear('firstName');
              }}
              placeholder="Enter your first name"
              aria-invalid={!!errors.firstName}
              aria-describedby={errors.firstName ? 'err-firstName' : undefined}
              className={`${inputBase} px-4 ${
                errors.firstName ? inputBad : inputOk
              }`}
            />
            {errors.firstName && (
              <p
                id="err-firstName"
                className="mt-1.5 text-xs text-red-500 flex items-center gap-1"
              >
                <AlertCircle className="w-3 h-3" />
                {errors.firstName}
              </p>
            )}
          </div>

          {/* Last name */}
          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                clear('lastName');
              }}
              placeholder="Enter your last name"
              aria-invalid={!!errors.lastName}
              aria-describedby={errors.lastName ? 'err-lastName' : undefined}
              className={`${inputBase} px-4 ${
                errors.lastName ? inputBad : inputOk
              }`}
            />
            {errors.lastName && (
              <p
                id="err-lastName"
                className="mt-1.5 text-xs text-red-500 flex items-center gap-1"
              >
                <AlertCircle className="w-3 h-3" />
                {errors.lastName}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              inputMode="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clear('email');
              }}
              onBlur={() => {
                const v = email.trim().toLowerCase();
                if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
                  setErrors((p) => ({
                    ...p,
                    email: 'Enter a valid email address.',
                  }));
                }
              }}
              placeholder="you@company.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'err-email' : undefined}
              className={`${inputBase} px-4 ${
                errors.email ? inputBad : inputOk
              }`}
            />
            {errors.email && (
              <p
                id="err-email"
                className="mt-1.5 text-xs text-red-500 flex items-center gap-1"
              >
                <AlertCircle className="w-3 h-3" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clear('password');
                }}
                placeholder="At least 8 characters"
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? 'err-password' : 'hint-password'
                }
                className={`${inputBase} px-4 pr-11 ${
                  errors.password ? inputBad : inputOk
                }`}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {password ? (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${strength.tone}`}
                    style={{ width: `${(strength.score / 3) * 100}%` }}
                  />
                </div>
                <span
                  className={`text-[11px] font-medium ${
                    strength.score === 1
                      ? 'text-red-500'
                      : strength.score === 2
                      ? 'text-amber-500'
                      : 'text-emerald-600'
                  }`}
                >
                  {strength.label}
                </span>
              </div>
            ) : (
              <p
                id="hint-password"
                className="mt-1.5 text-xs text-gray-400 dark:text-gray-500"
              >
                Must be 8+ characters with letters and numbers.
              </p>
            )}

            {errors.password && (
              <p
                id="err-password"
                className="mt-1.5 text-xs text-red-500 flex items-center gap-1"
              >
                <AlertCircle className="w-3 h-3" />
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  clear('confirmPassword');
                }}
                onBlur={() => {
                  if (confirmPassword && confirmPassword !== password) {
                    setErrors((p) => ({
                      ...p,
                      confirmPassword: 'Passwords do not match.',
                    }));
                  }
                }}
                placeholder="Re-enter your password"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={
                  errors.confirmPassword ? 'err-confirmPassword' : undefined
                }
                className={`${inputBase} px-4 pr-11 ${
                  errors.confirmPassword ? inputBad : inputOk
                }`}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showConfirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            {errors.confirmPassword && (
              <p
                id="err-confirmPassword"
                className="mt-1.5 text-xs text-red-500 flex items-center gap-1"
              >
                <AlertCircle className="w-3 h-3" />
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Terms + Privacy */}
          <div className="flex items-start gap-2 pt-1">
            <input
              type="checkbox"
              id="terms"
              checked={acceptedTerms}
              onChange={(e) => {
                setAcceptedTerms(e.target.checked);
                clear('terms');
              }}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
            />
            <label
              htmlFor="terms"
              className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed"
            >
              I accept the{' '}
              <Link
                href="/terms"
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Terms and Conditions
              </Link>{' '}
              and{' '}
              <Link
                href="/privacy"
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </label>
          </div>
          {errors.terms && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.terms}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-sm transition-all disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                Create Account <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Sign-in prompt inside the card */}
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
          >
            Sign in
          </Link>
        </p>
      </div>

      {/* Footer below the card */}
      <p className="mt-8 text-xs text-slate-500 dark:text-slate-500">
        © 2026 XecoFlow. All rights reserved.
      </p>
    </div>
  );
}

// ─── Verify email screen ──────────────────────────────────────────
function VerifyEmailScreen({ email }: { email: string }) {
  const [cooldown, setCooldown] = useState(0);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>(
    'idle'
  );
  const [statusMessage, setStatusMessage] = useState('');
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  const startCooldown = useCallback(() => {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          if (timerRef.current !== null) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }, []);

  const handleResend = async () => {
    if (cooldown > 0 || status === 'sending') return;
    setStatus('sending');
    setStatusMessage('');

    try {
      await resendVerification(email);
      setStatus('sent');
      setStatusMessage('A new verification email is on its way.');
      startCooldown();
    } catch (err: unknown) {
      setStatus('error');
      setStatusMessage(friendlyError(err));
      startCooldown();
    }
  };

  return (
    <div className="min-h-[100svh] bg-[#0a2540] flex flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="inline-block mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Xeco<span className="text-emerald-400">Flow</span>
        </h1>
      </Link>

      <div className="w-full max-w-[440px] bg-white dark:bg-[#0f1f3a] rounded-2xl shadow-2xl shadow-black/30 p-8 text-center space-y-6">
        {/* Checkmark */}
        <div className="w-20 h-20 mx-auto bg-emerald-50 dark:bg-emerald-950/40 rounded-full flex items-center justify-center">
          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          Account created successfully
        </h2>

        <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
          Congratulations! Your XecoFlow account has been created.
        </p>

        {/* Email card */}
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 text-left space-y-2">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">
              Check your email to verify it
            </p>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            We sent a verification link to{' '}
            <span className="font-medium text-gray-900 dark:text-white">
              {email}
            </span>
            .
          </p>
        </div>

        {statusMessage && (
          <div
            className={`rounded-xl p-3 text-sm flex items-start gap-2 text-left ${
              status === 'sent'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
            }`}
            role="status"
          >
            {status === 'sent' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            )}
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="pt-2 space-y-4">
          <Link
            href="/login"
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-sm transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2"
          >
            Login to get started <ArrowRight className="w-4 h-4" />
          </Link>

          <div className="space-y-1 pt-2">
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              Didn&rsquo;t receive it?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || status === 'sending'}
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                {status === 'sending'
                  ? 'Sending...'
                  : cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : 'Resend'}
              </button>
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              Wrong email?{' '}
              <a
                href="mailto:support@xecoflow.com"
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium"
              >
                Contact support
              </a>
            </p>
          </div>
        </div>
      </div>

      <p className="mt-8 text-xs text-slate-500">
        © 2026 XecoFlow. All rights reserved.
      </p>
    </div>
  );
}