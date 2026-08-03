// src/app/(auth)/verify/page.tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';

export default function VerifyPage() {
  const [seconds, setSeconds] = useState(30);
  const [resendDisabled, setResendDisabled] = useState(true);

  useEffect(() => {
    if (seconds > 0) {
      const timer = setTimeout(() => setSeconds(seconds - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setResendDisabled(false);
    }
  }, [seconds]);

  const handleResend = () => {
    console.log('Resend verification email');
    setSeconds(30);
    setResendDisabled(true);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-5xl flex flex-col lg:flex-row bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        
        {/* ── LEFT PANEL – Brand ── */}
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
                Verify your
                <br />
                email address
                <br />
                <span className="text-emerald-400">to get started.</span>
              </h2>
              <p className="text-slate-400 text-base max-w-sm">
                Confirm your email to unlock all features and start accepting payments instantly.
              </p>
            </div>

            <div className="flex items-center gap-4 flex-wrap pt-4 border-t border-white/10">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Secure</span>
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <span className="bg-white/5 px-3 py-1 rounded-full text-xs">Email verified</span>
                <span className="bg-white/5 px-3 py-1 rounded-full text-xs">Account protected</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL – Verification Content ── */}
        <div className="lg:w-1/2 p-8 lg:p-12 bg-white">
          <div className="max-w-sm mx-auto w-full">
            {/* Mobile Logo */}
            <div className="lg:hidden mb-8">
              <Link href="/" className="inline-block">
                <h1 className="text-2xl font-bold text-[#0a2540]">
                  Xeco<span className="text-emerald-500">Flow</span>
                </h1>
              </Link>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Verify your email</h2>
              <p className="text-sm text-gray-500 mt-1">Almost done! Confirm your email address.</p>
            </div>

            <div className="text-center space-y-6 py-4">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600 max-w-sm mx-auto">
                  We've sent a verification link to <strong className="text-gray-900">s****@example.com</strong>.
                  Please check your inbox and click the link to verify your account.
                </p>
                <p className="text-xs text-gray-400 mt-4">
                  Didn't receive the email? Check your spam folder or resend below.
                </p>
              </div>
              <div className="flex flex-col items-center gap-4 pt-2">
                <button
                  onClick={handleResend}
                  disabled={resendDisabled}
                  className={`px-8 py-3 rounded-xl text-sm font-semibold transition-all ${
                    resendDisabled
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20'
                  }`}
                >
                  {resendDisabled ? `Resend in ${seconds}s` : 'Resend verification'}
                </button>
                <Link href="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                  ← Back to sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}