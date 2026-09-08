'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Mail, ArrowRight, Loader2, AlertCircle, Shield, Clock, CheckCircle, XCircle } from 'lucide-react';

function VerifyOTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // ─── GET EMAIL AND TOKEN FROM URL OR LOCALSTORAGE ──────────────────
  const emailFromUrl = searchParams.get('email') || '';
  const tokenFromUrl = searchParams.get('token') || '';
  
  // Try to get from localStorage if not in URL
  const [email, setEmail] = useState('');
  const [tempToken, setTempToken] = useState('');
  
  useEffect(() => {
    // Get from URL first, then localStorage
    const storedEmail = localStorage.getItem('otp_email') || '';
    const storedToken = localStorage.getItem('otp_temp_token') || '';
    
    const finalEmail = emailFromUrl || storedEmail;
    const finalToken = tokenFromUrl || storedToken;
    
    setEmail(finalEmail);
    setTempToken(finalToken);
    
    if (!finalEmail || !finalToken) {
      router.push('/login');
    }
  }, [emailFromUrl, tokenFromUrl, router]);
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [seconds, setSeconds] = useState(300);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ─── Timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (seconds <= 0) {
      setResendDisabled(true);
      return;
    }
    const timer = setTimeout(() => setSeconds(seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  // ─── Handle OTP Input ─────────────────────────────────────────────
  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text');
    if (!/^\d{6}$/.test(paste)) return;
    
    const digits = paste.split('');
    setOtp(digits);
    inputRefs.current[5]?.focus();
  };

  // ─── Handle Verify ────────────────────────────────────────────────
  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');
    setAttemptsRemaining(null);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode, tempToken }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        
        // ─── ✅ STORE TOKEN ──────────────────────────────────────────
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
          // Also set cookie for middleware
          document.cookie = `auth_token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
          console.log('✅ Token stored:', data.token.substring(0, 20) + '...');
        }
        
        // ─── ✅ STORE MERCHANT DATA ──────────────────────────────────
        const merchant = data.merchant || data.data;
        if (merchant) {
          localStorage.setItem('merchant', JSON.stringify(merchant));
          localStorage.setItem('user', JSON.stringify(merchant));
          console.log('✅ Merchant stored:', merchant.businessName);
        }
        
        // ─── ✅ CLEAN UP ─────────────────────────────────────────────
        localStorage.removeItem('otp_temp_token');
        localStorage.removeItem('otp_email');
        
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        setError(data.message || 'Invalid OTP. Please try again.');
        if (data.attemptsRemaining !== undefined) {
          setAttemptsRemaining(data.attemptsRemaining);
        }
        if (data.maxAttemptsReached) {
          setResendDisabled(true);
        }
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('❌ Verify error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Handle Resend ────────────────────────────────────────────────
  const handleResend = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tempToken }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSeconds(data.expiresIn || 300);
        setResendDisabled(false);
        setError('');
        setOtp(['', '', '', '', '', '']);
        setAttemptsRemaining(null);
        inputRefs.current[0]?.focus();
      } else {
        setError(data.message || 'Failed to resend OTP');
        if (data.retryAfter) {
          setResendDisabled(true);
          setSeconds(data.retryAfter);
        }
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Format Time ──────────────────────────────────────────────────
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!email || !tempToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Verify Your Email</h1>
            <p className="text-sm text-gray-500 mt-2">
              Enter the 6-digit code sent to <span className="font-medium text-gray-700">{email}</span>
            </p>
          </div>

          {/* Email Display */}
          <div className="bg-gray-50 rounded-xl p-3 mb-6 flex items-center gap-3">
            <Mail className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-700">{email}</span>
          </div>

          {/* Timer */}
          <div className="flex items-center justify-center gap-2 mb-6 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Code expires in</span>
            <span className={`font-mono font-semibold ${seconds < 60 ? 'text-red-500' : 'text-gray-700'}`}>
              {formatTime(seconds)}
            </span>
          </div>

          {/* Attempts Remaining */}
          {attemptsRemaining !== null && attemptsRemaining > 0 && (
            <div className="text-center text-sm text-amber-600 mb-4">
              {attemptsRemaining} attempt{attemptsRemaining > 1 ? 's' : ''} remaining
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-sm font-medium text-emerald-800">Email Verified!</p>
                <p className="text-xs text-emerald-600">Redirecting to dashboard...</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && !success && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-6 flex items-start gap-2">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* OTP Form */}
          {!success && (
            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                  Enter 6-digit code
                </label>
                <div className="flex justify-center gap-2" onPaste={handlePaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all ${
                        error ? 'border-red-300' : 'border-gray-300'
                      }`}
                      autoFocus={index === 0}
                      disabled={loading || success}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.join('').length !== 6 || success}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-all disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Resend */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Didn't receive the code?{' '}
              <button
                onClick={handleResend}
                disabled={resendDisabled || success || loading}
                className="font-medium text-emerald-600 hover:text-emerald-700 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {seconds > 0 && !resendDisabled ? `Resend in ${formatTime(seconds)}` : 'Resend Code'}
              </button>
            </p>
            <Link
              href="/login"
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors inline-block mt-4"
            >
              ← Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading page...</p>
        </div>
      </div>
    }>
      <VerifyOTPContent />
    </Suspense>
  );
}