import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { verifyAdminSession } from '@/lib/adminAuth';
import { getOrders, getOrderStats, isSupabaseConfigured } from '@/lib/supabase';
import OrdersDashboard from '@/components/admin/OrdersDashboard';

export const metadata: Metadata = {
  title: 'Orders & Payments Hub | Ekaagra Technologies',
  description: 'Manage verified client transactions, online orders, and custom payment links.',
};

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    redirect('/admin/login');
  }

  const isDbConfigured = isSupabaseConfigured();
  const [ordersRes, statsRes] = await Promise.all([
    getOrders({ page: 1, pageSize: 20 }),
    getOrderStats(),
  ]);

  return (
    <OrdersDashboard
      initialOrders={ordersRes.orders || []}
      initialTotal={ordersRes.total || 0}
      initialStats={
        statsRes.stats || {
          total: 0,
          pending: 0,
          paid: 0,
          failed: 0,
          refunded: 0,
          totalRevenueINR: 0,
        }
      }
      isDbConfigured={isDbConfigured}
    />
  );
}
