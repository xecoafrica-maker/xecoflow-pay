'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Globe,
  Send,
  AlertCircle,
} from 'lucide-react';
import {
  registerMerchant,
  SUPPORTED_COUNTRIES,
  type CountryCode,
} from '../../../lib/auth-api';

// ─── Constants ─────────────────────────────────────────────────────
// Keep this identical to the backend regex in auth-engine/routes/auth.js.
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
const TERMS_VERSION = 'v1.0';

type FormErrors = {
  businessName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
  form?: string;
};

export default function SignUpPage() {
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
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [registered, setRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

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

    if (!acceptedTerms) e.terms = 'You must accept the Terms and Conditions.';

    return e;
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();

    const validation = validate();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setLoading(true);
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
        termsAcceptedAt: new Date().toISOString(),
      });

      setRegisteredEmail(email.trim().toLowerCase());
      setRegistered(true);
    } catch (err: unknown) {
      setErrors({ form: friendlyError(err) });
    } finally {
      setLoading(false);
    }
  };

  // ─── Verification screen ──────────────────────────────────────────
  if (registered) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-emerald-50 rounded-full flex items-center justify-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <Send className="w-6 h-6 text-emerald-600" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            Verify your email address
          </h2>

          <p className="text-gray-500 text-base leading-relaxed">
            Please click the link that was sent to <br />
            <span className="font-medium text-gray-700">
              {registeredEmail}
            </span>{' '}
            to verify your email.
          </p>

          <div className="pt-6">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              ← Back to Login
            </Link>
          </div>

          <p className="text-xs text-gray-400 pt-4 border-t border-gray-100 inline-block px-4">
            Did not receive the email? Check your spam folder or{' '}
            <button
              type="button"
              onClick={() => setRegistered(false)}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              try again
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ─── Form fields — reused for mobile and desktop ──────────────────
  const formFields = (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Country */}
      <div>
        <label
          htmlFor="country"
          className="block text-sm font-medium text-gray-700 mb-1.5"
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
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none text-gray-900"
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
          className="block text-sm font-medium text-gray-700 mb-1.5"
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
            if (errors.businessName)
              setErrors((p) => ({ ...p, businessName: undefined }));
          }}
          placeholder="Enter your business name"
          aria-invalid={!!errors.businessName}
          className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all text-gray-900 ${
            errors.businessName
              ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
              : 'border-gray-200 focus:ring-indigo-500/20 focus:border-indigo-500'
          }`}
        />
        {errors.businessName && (
          <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.businessName}
          </p>
        )}
      </div>

      {/* First name */}
      <div>
        <label
          htmlFor="firstName"
          className="block text-sm font-medium text-gray-700 mb-1.5"
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
            if (errors.firstName)
              setErrors((p) => ({ ...p, firstName: undefined }));
          }}
          placeholder="Enter your first name"
          aria-invalid={!!errors.firstName}
          className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all text-gray-900 ${
            errors.firstName
              ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
              : 'border-gray-200 focus:ring-indigo-500/20 focus:border-indigo-500'
          }`}
        />
        {errors.firstName && (
          <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.firstName}
          </p>
        )}
      </div>

      {/* Last name */}
      <div>
        <label
          htmlFor="lastName"
          className="block text-sm font-medium text-gray-700 mb-1.5"
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
            if (errors.lastName)
              setErrors((p) => ({ ...p, lastName: undefined }));
          }}
          placeholder="Enter your last name"
          aria-invalid={!!errors.lastName}
          className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all text-gray-900 ${
            errors.lastName
              ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
              : 'border-gray-200 focus:ring-indigo-500/20 focus:border-indigo-500'
          }`}
        />
        {errors.lastName && (
          <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.lastName}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1.5"
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
              if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
            }}
            placeholder="Enter your email address"
            aria-invalid={!!errors.email}
            className={`w-full pl-11 pr-4 py-3 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all text-gray-900 ${
              errors.email
                ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                : 'border-gray-200 focus:ring-indigo-500/20 focus:border-indigo-500'
            }`}
          />
        </div>
        {errors.email && (
          <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.email}
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1.5"
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
              if (errors.password)
                setErrors((p) => ({ ...p, password: undefined }));
            }}
            placeholder="Create a password"
            aria-invalid={!!errors.password}
            className={`w-full pl-11 pr-12 py-3 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all text-gray-900 ${
              errors.password
                ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                : 'border-gray-200 focus:ring-indigo-500/20 focus:border-indigo-500'
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
        {errors.password ? (
          <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.password}
          </p>
        ) : (
          <p className="mt-1.5 text-xs text-gray-400">
            Must be 8+ characters with letters and numbers.
          </p>
        )}
      </div>

      {/* Confirm password */}
      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-gray-700 mb-1.5"
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
              if (errors.confirmPassword)
                setErrors((p) => ({ ...p, confirmPassword: undefined }));
            }}
            placeholder="Confirm your password"
            aria-invalid={!!errors.confirmPassword}
            className={`w-full pl-11 pr-12 py-3 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all text-gray-900 ${
              errors.confirmPassword
                ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                : 'border-gray-200 focus:ring-indigo-500/20 focus:border-indigo-500'
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
          <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.confirmPassword}
          </p>
        )}
      </div>

      {/* Terms */}
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id="terms"
          checked={acceptedTerms}
          onChange={(e) => {
            setAcceptedTerms(e.target.checked);
            if (errors.terms) setErrors((p) => ({ ...p, terms: undefined }));
          }}
          className="mt-0.5 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor="terms" className="text-xs text-gray-500">
          I accept the{' '}
          <Link href="/terms" className="text-indigo-600 hover:underline">
            Terms and Conditions
          </Link>
        </label>
      </div>
      {errors.terms && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {errors.terms}
        </p>
      )}

      {/* Form-level error */}
      {errors.form && (
        <div
          role="alert"
          className="rounded-xl bg-red-50 border border-red-200 p-3.5 flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-700">Error</p>
            <p className="text-sm text-red-600">{errors.form}</p>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2"
      >
        {loading ? (
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

  return (
    <div className="min-h-screen bg-slate-50 sm:bg-gradient-to-br sm:from-gray-50 sm:to-gray-100 block lg:flex lg:items-center lg:justify-center p-0 sm:p-4 md:p-8">
      <div className="w-full max-w-[1000px] flex flex-col bg-white shadow-none sm:shadow-[0_10px_40px_rgba(0,0,0,0.08)] border-0 lg:border lg:border-gray-100 lg:rounded-3xl lg:overflow-hidden">
        {/* ─── Mobile header — full-bleed dark, no card ─────────────── */}
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

        {/* ─── Desktop layout — hidden on mobile ────────────────────── */}
        <div className="hidden lg:flex w-full">
          {/* Left brand panel */}
          <div className="lg:w-1/2 bg-[#0a2540] p-8 sm:p-10 md:p-12 lg:p-14 flex-col justify-between relative overflow-hidden min-h-[420px] lg:min-h-[560px] flex">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-[#0a2540] to-emerald-900/20" />
            <div className="absolute -top-32 -right-32 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />

            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <Link href="/" className="inline-block">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    Xeco<span className="text-emerald-400">Flow</span>
                  </h1>
                </Link>
              </div>

              <div className="space-y-7 py-6 lg:py-8">
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

              <div className="flex flex-col gap-3 pt-5 border-t border-white/10">
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

          {/* Right form panel */}
          <div className="lg:w-1/2 p-6 sm:p-8 md:p-10 lg:p-12 bg-white flex flex-col justify-center">
            <div className="max-w-sm mx-auto w-full">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Create your account
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Join XecoFlow and start accepting payments.
                </p>
              </div>

              {formFields}

              <p className="mt-6 text-center text-sm text-gray-500">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* ─── Mobile form — full width, no card wrapper ────────────── */}
        <div className="lg:hidden p-6 sm:p-8 bg-white">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                Create your account
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Join XecoFlow and start accepting payments.
              </p>
            </div>

            {formFields}

            <p className="mt-6 text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-indigo-600 hover:text-indigo-700"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Error mapping ─────────────────────────────────────────────────
function friendlyError(err: unknown): string {
  if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof (err as { code: unknown }).code === 'string'
  ) {
    const code = (err as { code: string }).code;
    switch (code) {
      case 'EMAIL_ALREADY_EXISTS':
        return 'This email is already registered. Try signing in instead.';
      case 'INVALID_EMAIL':
        return 'Please enter a valid email address.';
      case 'WEAK_PASSWORD':
        return 'Password must be 8+ characters with letters and numbers.';
      case 'RATE_LIMITED':
        return 'Too many attempts. Please wait a moment and try again.';
      case 'NETWORK_ERROR':
        return 'Unable to reach the server. Please check your connection.';
      case 'BAD_GATEWAY':
        return 'The service is temporarily unavailable. Please try again.';
      default:
        break;
    }
  }
  return 'Registration failed. Please try again.';
}