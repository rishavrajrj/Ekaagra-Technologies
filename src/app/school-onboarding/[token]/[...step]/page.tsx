import type { Metadata } from 'next';
import SchoolOnboardingPortal from '@/components/schools/SchoolOnboardingPortal';

export const metadata: Metadata = {
  title: 'School Project Onboarding & Requirements | Ekaagra Technologies',
  description: 'Complete institutional requirements, digital structure, and configuration setup.',
};

export const dynamic = 'force-dynamic';

export default async function SchoolOnboardingStepPage({
  params,
}: {
  params: Promise<{ token: string; step: string[] }>;
}) {
  const { token, step } = await params;
  return <SchoolOnboardingPortal token={token} initialStep={step} />;
}
