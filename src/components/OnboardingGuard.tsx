'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Lock } from 'lucide-react';
import { getToken, getStoredMerchant } from '@/lib/auth';

// ─── Context to pass onboarding state down to children ─────────────
const OnboardingContext = createContext<{ isOnboarded: boolean; isLoading: boolean }>({
  isOnboarded: false,
  isLoading: true,
});

export const useOnboarding = () => useContext(OnboardingContext);

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export default function OnboardingGuard({ children }: OnboardingGuardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const merchant = getStoredMerchant();
      const merchantId = merchant?.merchantId || merchant?.merchant_id;

      if (!merchantId) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch(`/api/merchant/onboarding?merchantId=${merchantId}`);
        const data = await response.json();

        if (data.success) {
          // ✅ Check if onboarding is COMPLETED OR SUBMITTED
          const onboardingStatus = data.data?.onboardingStatus;
          const isComplete = onboardingStatus === 'COMPLETED' || 
                            onboardingStatus === 'SUBMITTED';
          
          setIsOnboarded(isComplete || data.data?.isComplete || false);
        } else {
          // Fallback: check stored merchant data
          const storedMerchant = getStoredMerchant();
          const status = storedMerchant?.onboarding_status;
          if (status === 'COMPLETED' || status === 'SUBMITTED') {
            setIsOnboarded(true);
          }
        }
      } catch (error) {
        console.error('Onboarding check failed:', error);
        // Fallback: check stored merchant data
        const storedMerchant = getStoredMerchant();
        const status = storedMerchant?.onboarding_status;
        if (status === 'COMPLETED' || status === 'SUBMITTED') {
          setIsOnboarded(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboarding();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto" />
          <p className="mt-4 text-gray-600">Verifying account setup...</p>
        </div>
      </div>
    );
  }

  // ─── If not onboarded, show the lock screen ────────────────────────
  if (!isOnboarded) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-8">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Setup Required</h2>
        <p className="text-gray-500 max-w-md mb-6">
          You need to complete your business details and settlement preferences before you can access this page.
        </p>
        <button
          onClick={() => router.push('/dashboard/onboarding/stage1')}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
        >
          Complete Setup
        </button>
      </div>
    );
  }

  return (
    <OnboardingContext.Provider value={{ isOnboarded, isLoading }}>
      {children}
    </OnboardingContext.Provider>
  );
}