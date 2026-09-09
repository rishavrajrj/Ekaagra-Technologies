import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { verifyAdminSession } from '@/lib/adminAuth';
import { getBusinessProjectDetails } from '@/lib/businessProjectsDb';
import BusinessProjectDetailView from '@/components/admin/BusinessProjectDetailView';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const res = await getBusinessProjectDetails(id);

  if (!res.success || !res.project) {
    return { title: 'Business Project Detail | Ekaagra Technologies Admin' };
  }

  return {
    title: `${res.project.project_name} (${res.project.project_number}) | Ekaagra Technologies Admin`,
    description: `Central control dashboard for project ${res.project.project_number}.`,
  };
}

export default async function AdminBusinessProjectDetailPage({ params }: PageProps) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    redirect('/admin/login');
  }

  const { id } = await params;
  if (!id) notFound();

  const details = await getBusinessProjectDetails(id);
  if (!details.success || !details.project) {
    notFound();
  }

  // Route-level domain protection: Reject cross-domain school projects
  if (details.project.project_type === 'SCHOOL' || (details.project as any).domain === 'SCHOOL') {
    notFound();
  }

  return (
    <BusinessProjectDetailView
      project={details.project}
      client={details.client}
      latestSubmission={details.latestSubmission}
      submissions={details.submissions || []}
      designReviews={details.designReviews || []}
      activities={details.activities || []}
      notes={details.notes || []}
      assets={details.assets || []}
      initialOnboardingUrl={details.onboardingUrl}
      draftRequirements={details.draftRequirements}
      intakeProgress={details.intakeProgress}
    />
  );
}
