'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [merchantName, setMerchantName] = useState('');

  useEffect(() => {
    if (!token) {
      setError('No verification token provided');
      setLoading(false);
      return;
    }

    const verifyEmail = async () => {
      try {
        console.log('🔍 Verifying email with token:', token);
        
        const response = await fetch('http://localhost:3001/v1/auth/verify-email?token=' + token);
        const data = await response.json();
        
        console.log('📥 Verification response:', data);
        
        if (response.ok && data.success) {
          setSuccess(true);
          setMerchantName(data.merchant?.businessName || 'Merchant');
          setTimeout(() => {
            router.push('/login');
          }, 5000);
        } else {
          setError(data.error || 'Verification failed. Please try again.');
        }
      } catch (err: any) {
        console.error('❌ Verification error:', err);
        setError('Failed to verify email. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [token, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
            <Link href="/" className="inline-block mb-6">
              <h1 className="text-2xl font-bold text-[#0a2540]">
                Xeco<span className="text-emerald-500">Flow</span>
              </h1>
            </Link>
            <div className="py-8">
              <Loader2 className="w-16 h-16 animate-spin text-emerald-500 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Verifying your email...</p>
              <p className="text-sm text-gray-400 mt-2">Please wait while we activate your account</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
            <Link href="/" className="inline-block mb-6">
              <h1 className="text-2xl font-bold text-[#0a2540]">
                Xeco<span className="text-emerald-500">Flow</span>
              </h1>
            </Link>
            
            <div className="py-4">
              <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-emerald-500" />
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Email Verified! 🎉
              </h2>
              
              <p className="text-gray-600 mb-2">
                Welcome to XecoFlow, <strong className="text-gray-900">{merchantName}</strong>!
              </p>
              
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 my-6 text-left">
                <p className="text-sm text-emerald-800 font-medium">
                  Your account is now active!
                </p>
                <p className="text-sm text-emerald-700 mt-1">
                  You can now log in and start accepting payments.
                </p>
              </div>
              
              <p className="text-sm text-gray-400 mb-6">
                Redirecting to login in 5 seconds...
              </p>
              
              <Link href="/login">
                <button className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20">
                  Go to Login
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
          <Link href="/" className="inline-block mb-6">
            <h1 className="text-2xl font-bold text-[#0a2540]">
              Xeco<span className="text-emerald-500">Flow</span>
            </h1>
          </Link>
          
          <div className="py-4">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Verification Failed
            </h2>
            
            <p className="text-red-600 mb-6">{error}</p>
            
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm text-amber-800">
                <strong>💡 Tips:</strong>
              </p>
              <ul className="text-sm text-amber-700 mt-2 space-y-1 list-disc list-inside">
                <li>Make sure you clicked the correct link from your email</li>
                <li>The link may have expired (valid for 24 hours)</li>
                <li>Try signing up again if the issue persists</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <Link href="/login">
                <button className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20">
                  Go to Login
                </button>
              </Link>
              <Link href="/signup">
                <button className="w-full py-3 border border-gray-200 hover:border-gray-300 text-gray-600 rounded-xl text-sm font-medium transition-all">
                  Create New Account
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
