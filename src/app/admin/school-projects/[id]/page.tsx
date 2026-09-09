import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { verifyAdminSession } from '@/lib/adminAuth';
import { getSchoolProjectDetailsAction } from '@/app/schoolProjectActions';
import SchoolProjectWorkspace from '@/components/admin/SchoolProjectWorkspace';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const res = await getSchoolProjectDetailsAction(id);

  if (!res.success || !res.project) {
    return { title: 'School Project Workspace | Ekaagra Admin' };
  }

  return {
    title: `${res.project.school_name} (${res.project.project_number}) | School Projects Workspace`,
    description: `Central school onboarding and intake workspace for ${res.project.school_name}.`,
  };
}

export default async function AdminSchoolProjectDetailPage({ params }: PageProps) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    redirect('/admin/login');
  }

  const { id } = await params;
  if (!id) notFound();

  const details = await getSchoolProjectDetailsAction(id);
  if (!details.success || !details.project) {
    notFound();
  }

  // Domain guard: Ensure this project belongs to SCHOOL domain
  if ((details.project as any).domain && (details.project as any).domain !== 'SCHOOL') {
    notFound();
  }

  return (
    <SchoolProjectWorkspace
      project={details.project}
      currentSubmission={details.currentSubmission}
      changeRequests={details.changeRequests || []}
      customFields={details.customFields || []}
      customRequirements={details.customRequirements || []}
      approvedSnapshot={details.approvedSnapshot}
      invitation={details.invitation}
    />
  );
}
