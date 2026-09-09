import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { verifyAdminSession } from '@/lib/adminAuth';
import {
  getLeads,
  getLeadStats,
  getOrders,
  getOrderStats,
  isSupabaseConfigured,
} from '@/lib/supabase';
import { getBusinessProjects } from '@/lib/businessProjectsDb';
import { fetchSchoolProjectsAction } from '@/app/schoolProjectActions';
import AdminOverviewDashboard from '@/components/admin/AdminOverviewDashboard';

export const metadata: Metadata = {
  title: 'Executive Dashboard | Ekaagra Technologies Admin',
  description: 'Operations control center for leads, projects, school intakes, and revenue.',
};

export const dynamic = 'force-dynamic';

export default async function AdminOverviewPage() {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    redirect('/admin/login');
  }

  const isDbConfigured = isSupabaseConfigured();

  const [leadsRes, statsRes, businessRes, ordersRes, orderStatsRes, schoolRes] =
    await Promise.all([
      getLeads({ page: 1, pageSize: 10 }),
      getLeadStats(),
      getBusinessProjects({ page: 1, pageSize: 10 }),
      getOrders({ page: 1, pageSize: 10 }),
      getOrderStats(),
      fetchSchoolProjectsAction(),
    ]);

  return (
    <AdminOverviewDashboard
      leads={leadsRes.leads || []}
      leadStats={
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
      businessProjects={businessRes.projects || []}
      businessTotal={businessRes.total || 0}
      orders={ordersRes.orders || []}
      orderStats={
        orderStatsRes.stats || {
          total: 0,
          pending: 0,
          paid: 0,
          failed: 0,
          refunded: 0,
          totalRevenueINR: 0,
        }
      }
      schoolProjects={schoolRes.projects || []}
      schoolTotal={schoolRes.total || 0}
      isDbConfigured={isDbConfigured}
    />
  );
}
