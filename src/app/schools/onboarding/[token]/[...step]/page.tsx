import type { Metadata } from 'next';
import SchoolOnboardingPortal from '@/components/schools/SchoolOnboardingPortal';

export const metadata: Metadata = {
  title: 'School Project Onboarding & Universal Intake | Ekaagra Technologies',
  description: 'Complete your detailed institutional requirements, digital structure, and media setup.',
};

export const dynamic = 'force-dynamic';

export default async function SchoolOnboardingTokenStepPage({
  params,
}: {
  params: Promise<{ token: string; step: string[] }>;
}) {
  const { token, step } = await params;
  return <SchoolOnboardingPortal token={token} initialStep={step} />;
}
