import { getToken } from '@/lib/auth';

export interface OnboardingStatus {
  overallStatus: string;
  currentStep: number;
  completedSteps: number;
  totalSteps: number;
  steps: {
    businessProfile: string;
    ownersDocuments: string;
    taxCompliance: string;
    settlement: string;
  };
}

export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const res = await fetch('/v1/onboarding/status', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch onboarding status');
  }
  return data;
}

export function getOnboardingPath(step: number): string {
  switch (step) {
    case 1: return '/dashboard/onboarding/stage1';
    case 2: return '/dashboard/onboarding/stage2';
    case 3: return '/dashboard/onboarding/stage3';
    case 4: return '/dashboard/onboarding/stage4';
    case 5: return '/dashboard/onboarding/review';
    default: return '/dashboard/onboarding/stage1';
  }
}

/**
 * Redirects the user to their current incomplete onboarding stage.
 * If onboarding is already submitted/complete, stays on dashboard.
 */
export async function redirectToOnboardingResume(router: any) {
  try {
    const status = await getOnboardingStatus();
    if (status.overallStatus === 'SUBMITTED') {
      router.replace('/dashboard');
      return;
    }
    const route = getOnboardingPath(status.currentStep);
    router.replace(route);
  } catch (error) {
    console.error('Failed to resume onboarding:', error);
    router.replace('/dashboard/onboarding/stage1');
  }
}