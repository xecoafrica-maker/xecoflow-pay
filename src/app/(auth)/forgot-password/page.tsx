// src/app/(auth)/forgot-password/page.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Mail,
  Hash,
  ArrowRight,
  CheckCircle,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

interface SecurityQuestion {
  position: number;
  text: string;
}

type Step =
  | { kind: 'form' }
  | { kind: 'questions'; challengeId: string; questions: SecurityQuestion[] }
  | { kind: 'cannot_reset' }
  | { kind: 'sent'; email: string };

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [merchantId, setMerchantId] = useState('');
  const [step, setStep] = useState<Step>({ kind: 'form' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/security-questions/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: merchantId.trim(),
          email: email.trim().toLowerCase(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      // ── Diagnostic log — remove after the flow is confirmed working ──
      console.log('[forgot-password] check response', {
        status: res.status,
        data,
      });

      if (!res.ok) {
        setError(
          data.message || 'Could not process your request. Please try again.'
        );
        return;
      }

      // ── Accept both field names ──────────────────────────────────────
      // The backend may respond with `hasQuestions` (current shape) or
      // `canReset` (older shape). The definitive signals are:
      //   1. exactly 3 questions returned
      //   2. a non-empty challengeId (a signed JWT issued by the backend)
      const canProceed =
        data.canReset === true || data.hasQuestions === true;

      if (
        data.success === true &&
        canProceed === true &&
        typeof data.challengeId === 'string' &&
        data.challengeId.length > 0 &&
        Array.isArray(data.questions) &&
        data.questions.length === 3
      ) {
        setAnswers({});
        setVerifyError('');
        setStep({
          kind: 'questions',
          challengeId: data.challengeId,
          questions: data.questions,
        });
        return;
      }

      // Merchant not found OR email mismatch OR no questions configured.
      // Same UI for all three — no enumeration.
      setStep({ kind: 'cannot_reset' });
    } catch (err) {
      console.error('[forgot-password] check failed', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step.kind !== 'questions') return;

    setVerifyError('');

    for (const q of step.questions) {
      const val = (answers[q.position] || '').trim();
      if (val.length < 2) {
        setVerifyError(`Please answer question ${q.position}.`);
        return;
      }
    }

    setVerifying(true);

    try {
      const verifyRes = await fetch('/api/security-questions/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: step.challengeId,
          answers: step.questions.map((q) => ({
            position: q.position,
            answer: answers[q.position],
          })),
        }),
      });

      const verifyData = await verifyRes.json().catch(() => ({}));

      if (!verifyRes.ok || !verifyData.resetToken) {
        setVerifyError(
          verifyData.message ||
            'One or more answers are incorrect. Please try again.'
        );
        return;
      }

      const sendRes = await fetch('/api/security-questions/send-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken: verifyData.resetToken }),
      });

      if (!sendRes.ok) {
        setVerifyError(
          'Answers were correct, but we could not send the email. Please try again.'
        );
        return;
      }

      setStep({ kind: 'sent', email: email.trim().toLowerCase() });
    } catch {
      setVerifyError('Network error. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const resetToStart = () => {
    setStep({ kind: 'form' });
    setEmail('');
    setMerchantId('');
    setAnswers({});
    setError('');
    setVerifyError('');
  };

  const closeQuestions = () => {
    setStep({ kind: 'form' });
    setAnswers({});
    setVerifyError('');
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-5xl flex flex-col lg:flex-row bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        <div className="lg:w-1/2 bg-[#0a2540] p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden min-h-[400px]">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-[#0a2540] to-emerald-900/20" />
          <div className="absolute top-[-100px] right-[-100px] w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-[-100px] left-[-100px] w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <Link href="/" className="inline-block">
                <h1 className="text-2xl font-bold text-white">
                  Xeco<span className="text-emerald-400">Flow</span>
                </h1>
              </Link>
            </div>

            <div className="space-y-4 py-8">
              <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                Reset your
                <br />
                password
                <br />
                <span className="text-emerald-400">securely.</span>
              </h2>
              <p className="text-slate-400 text-base max-w-sm">
                Confirm your identity with your security questions, and
                we&apos;ll email you a reset link.
              </p>
            </div>

            <div className="flex items-center gap-4 flex-wrap pt-4 border-t border-white/10">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                Security
              </span>
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <span className="bg-white/5 px-3 py-1 rounded-full text-xs">
                  Encrypted
                </span>
                <span className="bg-white/5 px-3 py-1 rounded-full text-xs">
                  Secure link
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:w-1/2 p-8 lg:p-12 bg-white">
          <div className="max-w-sm mx-auto w-full">
            <div className="lg:hidden mb-8">
              <Link href="/" className="inline-block">
                <h1 className="text-2xl font-bold text-[#0a2540]">
                  Xeco<span className="text-emerald-500">Flow</span>
                </h1>
              </Link>
            </div>

            {step.kind === 'form' && (
              <>
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Forgot password?
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Enter your Merchant ID and email to continue.
                  </p>
                </div>

                {error && (
                  <div className="mb-5 rounded-xl bg-red-50 border border-red-200 p-3.5 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-700">Error</p>
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Merchant ID
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={merchantId}
                        onChange={(e) => {
                          setMerchantId(e.target.value.replace(/\D/g, ''));
                          if (error) setError('');
                        }}
                        placeholder="e.g. 250084"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        required
                        autoFocus
                        disabled={loading}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">
                      Find this on your dashboard or any receipt.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (error) setError('');
                        }}
                        placeholder="you@example.com"
                        autoComplete="email"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        required
                        disabled={loading}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">
                      Use the email associated with your merchant account.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={!email || !merchantId || loading}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        Continue <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {step.kind === 'questions' && (
              <>
                <div className="mb-6">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                    <ShieldCheck className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Verify your identity
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Answer your 3 security questions to receive a reset link.
                  </p>
                </div>

                {verifyError && (
                  <div className="mb-5 rounded-xl bg-red-50 border border-red-200 p-3.5 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-700">
                        Couldn&apos;t verify
                      </p>
                      <p className="text-sm text-red-600">{verifyError}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleVerify} className="space-y-5">
                  {step.questions.map((q) => (
                    <div key={q.position}>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Question {q.position}
                      </label>
                      <p className="text-sm text-gray-800 mb-2">{q.text}</p>
                      <input
                        type="text"
                        value={answers[q.position] || ''}
                        onChange={(e) => {
                          setAnswers((prev) => ({
                            ...prev,
                            [q.position]: e.target.value,
                          }));
                          if (verifyError) setVerifyError('');
                        }}
                        placeholder="Your answer"
                        autoComplete="off"
                        autoCapitalize="words"
                        autoCorrect="off"
                        spellCheck={false}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        required
                        disabled={verifying}
                      />
                    </div>
                  ))}

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeQuestions}
                      disabled={verifying}
                      className="sm:flex-1 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold text-sm transition-all disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={verifying}
                      className="sm:flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {verifying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          Continue <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <p className="text-[11px] text-gray-400 text-center mt-6">
                  Answers are case-insensitive.
                </p>
              </>
            )}

            {step.kind === 'cannot_reset' && (
              <div className="text-center space-y-4 py-6">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8 text-amber-500" />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Unable to reset password
                  </h2>
                  <p className="text-sm text-gray-600 max-w-sm mx-auto leading-relaxed">
                    We couldn&apos;t verify these details, or this account
                    isn&apos;t set up for self-service password reset.
                  </p>
                  <p className="text-sm text-gray-600 max-w-sm mx-auto mt-2">
                    Please contact support to reset your password.
                  </p>
                </div>

                <div className="pt-4">
                  <a
                    href="mailto:support@xecoflow.com"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-600/10"
                  >
                    <Mail className="w-4 h-4" />
                    Contact support
                  </a>
                </div>

                <button
                  type="button"
                  onClick={resetToStart}
                  className="block mx-auto text-sm text-gray-500 hover:text-gray-700 font-medium"
                >
                  ← Try a different account
                </button>
              </div>
            )}

            {step.kind === 'sent' && (
              <div className="text-center space-y-4 py-6">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Check your inbox
                  </h2>
                  <p className="text-sm text-gray-600 max-w-sm mx-auto">
                    A password reset link has been sent to{' '}
                    <strong className="text-gray-900">{step.email}</strong>.
                  </p>
                  <p className="text-xs text-gray-400 mt-3">
                    Didn&apos;t receive the email? Check your spam folder or{' '}
                    <button
                      type="button"
                      onClick={resetToStart}
                      className="text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      start over
                    </button>
                    .
                  </p>
                </div>
              </div>
            )}

            <p className="mt-8 text-center text-sm text-gray-500">
              Remember your password?{' '}
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