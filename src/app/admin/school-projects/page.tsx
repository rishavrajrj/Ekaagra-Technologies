import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { verifyAdminSession } from '@/lib/adminAuth';
import SchoolProjectsHub from '@/components/admin/SchoolProjectsHub';

export const metadata: Metadata = {
  title: 'School Projects & Universal Intake Hub | Ekaagra Technologies',
  description: 'Manage confirmed school projects, intake reviews, media assets, and Step 41/42 handoffs.',
};

export const dynamic = 'force-dynamic';

export default async function AdminSchoolProjectsPage() {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    redirect('/admin/login');
  }

  return <SchoolProjectsHub />;
}
