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

  const formProps: SignupFormProps = {
    country,
    setCountry,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    businessName,
    setBusinessName,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    acceptedTerms,
    setAcceptedTerms,
    showPassword,
    setShowPassword,
    showConfirm,
    setShowConfirm,
    errors,
    setErrors,
    submitting,
    strength,
    formError,
    onSubmit: handleSubmit,
  };

  return (
    <div className="min-h-[100svh] bg-slate-50 dark:bg-[#0a2540] sm:bg-gradient-to-br sm:from-gray-50 sm:to-gray-100 dark:sm:from-[#0a2540] dark:sm:to-[#0f1f3a] block lg:flex lg:items-center lg:justify-center p-0 sm:p-4 md:p-8">
      <div className="w-full max-w-[1000px] flex flex-col bg-white dark:bg-[#0f1f3a] shadow-none sm:shadow-[0_10px_40px_rgba(0,0,0,0.08)] border-0 lg:border lg:border-gray-100 dark:lg:border-gray-800 lg:rounded-3xl lg:overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden bg-[#0a2540] relative overflow-hidden p-8 sm:p-10">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-[#0a2540] to-emerald-900/20" />
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />

          <div className="relative z-10 text-left">
            <Link href="/" className="inline-block mb-4">
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Xeco<span className="text-emerald-400">Flow</span>
              </h1>
            </Link>
            <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight tracking-tight">
              Start accepting payments in minutes.
            </h2>
            <p className="text-emerald-400 text-base font-medium mt-3 opacity-90">
              Join Africa&apos;s leading payment infrastructure.
            </p>
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden lg:flex w-full">
          <div className="lg:w-1/2 bg-[#0a2540] p-8 sm:p-10 md:p-12 lg:p-14 relative overflow-hidden min-h-[560px] flex">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-[#0a2540] to-emerald-900/20" />
            <div className="absolute -top-32 -right-32 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />

            <div className="relative z-10 flex flex-col h-full w-full">
              <div>
                <Link href="/" className="inline-block">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    Xeco<span className="text-emerald-400">Flow</span>
                  </h1>
                </Link>
              </div>

              <div className="space-y-7 mt-10 lg:mt-14">
                <h2 className="text-3xl sm:text-4xl xl:text-[2.75rem] font-bold text-white leading-[1.15] tracking-tight">
                  Start accepting
                  <br />
                  payments in
                  <br />
                  <span className="text-emerald-400">minutes.</span>
                </h2>

                <p className="text-slate-400 text-sm sm:text-base max-w-[320px] leading-relaxed">
                  Create your account and get instant access to Africa&apos;s
                  leading payment infrastructure.
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-5 border-t border-white/10 mt-auto">
                <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-widest">
                  Trusted by
                </span>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/5 text-slate-300 border border-white/10">
                    500+ businesses
                  </span>
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/5 text-slate-300 border border-white/10">
                    4 countries
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:w-1/2 p-6 sm:p-8 md:p-10 lg:p-12 bg-white dark:bg-[#0f1f3a] flex flex-col justify-center">
            <div className="max-w-sm mx-auto w-full">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  Create your account
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Join XecoFlow and start accepting payments.
                </p>
              </div>

              <SignupForm {...formProps} />
              <SignInPrompt />
            </div>
          </div>
        </div>

        {/* Mobile form */}
        <div className="lg:hidden p-6 sm:p-8 bg-white dark:bg-[#0f1f3a]">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                Create your account
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Join XecoFlow and start accepting payments.
              </p>
            </div>

            <SignupForm {...formProps} />
            <SignInPrompt />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Signup form (extracted) ──────────────────────────────────────
interface SignupFormProps {
  country: CountryCode;
  setCountry: (c: CountryCode) => void;
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  businessName: string;
  setBusinessName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  acceptedTerms: boolean;
  setAcceptedTerms: (v: boolean) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  showConfirm: boolean;
  setShowConfirm: (v: boolean) => void;
  errors: FormErrors;
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
  submitting: boolean;
  strength: Strength;
  formError: FormLevelError | null;
  onSubmit: (ev: React.FormEvent) => void;
}

function SignupForm(props: SignupFormProps) {
  const {
    country,
    setCountry,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    businessName,
    setBusinessName,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    acceptedTerms,
    setAcceptedTerms,
    showPassword,
    setShowPassword,
    showConfirm,
    setShowConfirm,
    errors,
    setErrors,
    submitting,
    strength,
    formError,
    onSubmit,
  } = props;

  const clear = (field: keyof FormErrors) =>
    setErrors((p) => (p[field] ? { ...p, [field]: undefined } : p));

  const inputBase =
    'w-full py-3 bg-gray-50 dark:bg-[#1a2a4a] border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all text-gray-900 dark:text-white disabled:opacity-60';
  const inputOk =
    'border-gray-200 dark:border-gray-700 focus:ring-indigo-500/20 focus:border-indigo-500';
  const inputBad =
    'border-red-300 dark:border-red-700 focus:ring-red-500/20 focus:border-red-500';

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {/* Form-level error — rendered at the top so it's the first thing seen */}
      {formError && (
        <div
          role="alert"
          className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3.5 flex items-start gap-2.5"
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

      {/* Country */}
      <div>
        <label
          htmlFor="country"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
        >
          Country
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Globe className="w-4 h-4 text-gray-400" />
          </div>
          <select
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value as CountryCode)}
            className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-[#1a2a4a] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none text-gray-900 dark:text-white"
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
          aria-describedby={errors.businessName ? 'err-businessName' : undefined}
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
          className={`${inputBase} px-4 ${errors.lastName ? inputBad : inputOk}`}
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
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Mail
              className={`w-4 h-4 ${
                errors.email ? 'text-red-400' : 'text-gray-400'
              }`}
            />
          </div>
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
            placeholder="Enter your email address"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'err-email' : undefined}
            className={`${inputBase} pl-11 pr-4 ${
              errors.email ? inputBad : inputOk
            }`}
          />
        </div>
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
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Lock
              className={`w-4 h-4 ${
                errors.password ? 'text-red-400' : 'text-gray-400'
              }`}
            />
          </div>
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
            placeholder="Create a password"
            aria-invalid={!!errors.password}
            aria-describedby={
              errors.password ? 'err-password' : 'hint-password'
            }
            className={`${inputBase} pl-11 pr-12 ${
              errors.password ? inputBad : inputOk
            }`}
          />
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
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
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Lock
              className={`w-4 h-4 ${
                errors.confirmPassword ? 'text-red-400' : 'text-gray-400'
              }`}
            />
          </div>
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
            placeholder="Confirm your password"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={
              errors.confirmPassword ? 'err-confirmPassword' : undefined
            }
            className={`${inputBase} pl-11 pr-12 ${
              errors.confirmPassword ? inputBad : inputOk
            }`}
          />
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
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
      <div className="flex items-start gap-2">
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
          className="text-xs text-gray-500 dark:text-gray-400"
        >
          I accept the{' '}
          <Link href="/terms" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            Terms and Conditions
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-indigo-600 dark:text-indigo-400 hover:underline">
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
        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2"
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
    <div className="min-h-[100svh] bg-white dark:bg-[#0f1f3a] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 mx-auto bg-emerald-50 dark:bg-emerald-950/40 rounded-full flex items-center justify-center">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/60 rounded-full flex items-center justify-center">
            <Send className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          Verify your email address
        </h2>

        <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed">
          We sent a verification link to{' '}
          <span className="font-medium text-gray-700 dark:text-gray-200">
            {email}
          </span>
          . Click the link in that email, then sign in to continue.
        </p>

        <div className="pt-2">
          {statusMessage && (
            <div
              className={`mb-4 rounded-xl p-3 text-sm flex items-start gap-2 text-left ${
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

          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || status === 'sending'}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/10"
          >
            {status === 'sending'
              ? 'Sending...'
              : cooldown > 0
              ? `Resend in ${cooldown}s`
              : 'Resend verification email'}
          </button>
        </div>

        <div className="pt-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors"
          >
            ← Back to Login
          </Link>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 pt-4 border-t border-gray-100 dark:border-gray-700">
          Not your email?{' '}
          <Link
            href="/signup"
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium"
          >
            Start over
          </Link>{' '}
          or{' '}
          <a
            href="mailto:support@xecoflow.com"
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium"
          >
            contact support
          </a>
          .
        </p>
      </div>
    </div>
  );
}

// ─── Sign-in prompt ────────────────────────────────────────────────
function SignInPrompt() {
  return (
    <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
      Already have an account?{' '}
      <Link
        href="/login"
        className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
      >
        Sign in
      </Link>
    </p>
  );
}