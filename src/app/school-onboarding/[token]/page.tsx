import type { Metadata } from 'next';
import SchoolOnboardingPortal from '@/components/schools/SchoolOnboardingPortal';

export const metadata: Metadata = {
  title: 'School Project Onboarding & Requirements | Ekaagra Technologies',
  description: 'Complete institutional requirements, digital structure, and configuration setup.',
};

export const dynamic = 'force-dynamic';

export default async function SchoolOnboardingAliasPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <SchoolOnboardingPortal token={token} />;
}
