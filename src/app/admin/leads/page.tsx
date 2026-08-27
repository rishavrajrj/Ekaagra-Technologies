import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { verifyAdminSession } from '@/lib/adminAuth';
import { getLeads, getLeadStats, isSupabaseConfigured } from '@/lib/supabase';
import LeadsDashboard from '@/components/admin/LeadsDashboard';

export const metadata: Metadata = {
  title: 'Lead Management Hub',
  description: 'Inbound client enquiries and project quotes pipeline.',
};

export const dynamic = 'force-dynamic';

export default async function AdminLeadsPage() {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    redirect('/admin/login');
  }

  const isDbConfigured = isSupabaseConfigured();
  const [leadsRes, statsRes] = await Promise.all([
    getLeads({ page: 1, pageSize: 20 }),
    getLeadStats(),
  ]);

  return (
    <LeadsDashboard
      initialLeads={leadsRes.leads || []}
      initialTotal={leadsRes.total || 0}
      initialStats={
        statsRes.stats || {
          total: 0,
          new: 0,
          contacted: 0,
          qualified: 0,
          proposalSent: 0,
          converted: 0,
          lost: 0,
        }
      }
      isDbConfigured={isDbConfigured}
    />
  );
}
