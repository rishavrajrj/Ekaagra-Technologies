import type { Metadata } from 'next';
import SchoolOnboardingPortal from '@/components/schools/SchoolOnboardingPortal';

export const metadata: Metadata = {
  title: 'School Project Onboarding & Universal Intake | Ekaagra Technologies',
  description: 'Complete your detailed institutional requirements, digital structure, and media setup.',
};

export const dynamic = 'force-dynamic';

export default async function SchoolOnboardingTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <SchoolOnboardingPortal token={token} />;
}
