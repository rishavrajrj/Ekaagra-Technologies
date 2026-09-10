import type { Metadata } from 'next';
import SchoolOnboardingPortal from '@/components/schools/SchoolOnboardingPortal';

export const metadata: Metadata = {
  title: 'Final Website Review & Submission | Ekaagra Technologies',
  description: 'Universal final verification and submission command center for institutional website onboarding.',
};

export const dynamic = 'force-dynamic';

export default async function SchoolOnboardingFinalReviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <SchoolOnboardingPortal token={token} />;
}
