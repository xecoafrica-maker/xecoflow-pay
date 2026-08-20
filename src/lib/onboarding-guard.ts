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
    throw new Error('Authentication required');
  }

  const res = await fetch('/v1/onboarding/status', {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch onboarding status');
  }

  return data;
}

/**
 * Determines the FIRST incomplete stage (the stage the user MUST be on).
 */
export function getAllowedStage(status: OnboardingStatus): number {
  const stages = [
    status.steps.businessProfile,
    status.steps.ownersDocuments,
    status.steps.taxCompliance,
    status.steps.settlement,
  ];

  const index = stages.findIndex((stage: string) => stage !== 'COMPLETED');
  return index === -1 ? 5 : index + 1;
}

/**
 * Checks if the user is fully onboarded (COMPLETED or SUBMITTED).
 */
export function isFullyOnboarded(status: OnboardingStatus): boolean {
  return status.overallStatus === 'COMPLETED' || 
         status.overallStatus === 'SUBMITTED';
}

/**
 * Redirects the user to the correct stage based on the database state.
 */
export async function redirectToCurrentOnboardingStage(router: any) {
  try {
    const status = await getOnboardingStatus();

    // ✅ FIX: If SUBMITTED or COMPLETED, go to dashboard
    if (status.overallStatus === 'SUBMITTED' || status.overallStatus === 'COMPLETED') {
      router.replace('/dashboard');
      return;
    }

    // If all 4 are complete but not submitted, go to Review (Stage 5).
    if (status.overallStatus === 'READY_FOR_REVIEW') {
      router.replace('/dashboard/onboarding/stage5');
      return;
    }

    // Otherwise, go to the first incomplete stage.
    router.replace(`/dashboard/onboarding/stage${status.currentStep}`);
  } catch (error) {
    console.error('Onboarding redirect error:', error);
  }
}