'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
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
          setIsOnboarded(data.data.isComplete);
        }
      } catch (error) {
        console.error('Onboarding check failed:', error);
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

  return (
    <OnboardingContext.Provider value={{ isOnboarded, isLoading }}>
      {children}
    </OnboardingContext.Provider>
  );
}