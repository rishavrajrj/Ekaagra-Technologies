import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { verifyAdminSession } from '@/lib/adminAuth';
import { getBusinessProjects } from '@/lib/businessProjectsDb';
import BusinessProjectsDashboard from '@/components/admin/BusinessProjectsDashboard';

export const metadata: Metadata = {
  title: 'Business Projects Hub | Ekaagra Technologies Admin',
  description: 'Manage confirmed business projects, requirements submissions, design reviews, and milestones.',
};

export const dynamic = 'force-dynamic';

export default async function AdminBusinessProjectsPage() {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    redirect('/admin/login');
  }

  const { projects, total } = await getBusinessProjects({ page: 1, pageSize: 25 });

  return <BusinessProjectsDashboard initialProjects={projects || []} initialTotal={total || 0} />;
}
