'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import type { Order, OrderFilter, OrderStats, PaymentStatus } from '@/lib/types';
import { fetchOrdersAction, fetchOrderStatsAction, createCustomPaymentLinkAction } from '@/app/orderActions';
import { adminLogoutAction } from '@/app/actions';
import Logo from '@/components/ui/Logo';
import {
  Search,
  RefreshCw,
  LogOut,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Copy,
  Check,
  ExternalLink,
  Plus,
  CreditCard,
  DollarSign,
  X,
  Share2,
} from 'lucide-react';

interface OrdersDashboardProps {
  initialOrders: Order[];
  initialTotal: number;
  initialStats: OrderStats;
  isDbConfigured: boolean;
}

const STATUS_BADGES: Record<PaymentStatus, { bg: string; text: string; border: string }> = {
  PENDING: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  PAID: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  FAILED: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
  REFUNDED: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  CANCELLED: { bg: 'bg-slate-50', text: 'text-slate-800', border: 'border-slate-200' },
};

export default function OrdersDashboard({
  initialOrders,
  initialTotal,
  initialStats,
  isDbConfigured,
}: OrdersDashboardProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [total, setTotal] = useState(initialTotal);
  const [stats, setStats] = useState<OrderStats>(initialStats);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  // Create Custom Payment Link Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    serviceType: 'Website Development',
    amountINR: 999,
    description: 'Initial Project Deposit / Booking Advance',
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalResult, setModalResult] = useState<{ paymentUrl?: string; orderNumber?: string } | null>(null);
  const [modalError, setModalError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const refreshOrders = (newPage = page, newQuery = query, newStatus = statusFilter) => {
    startTransition(async () => {
      const [orderRes, statsRes] = await Promise.all([
        fetchOrdersAction({ page: newPage, pageSize: 20, query: newQuery, status: newStatus }),
        fetchOrderStatsAction(),
      ]);

      if (orderRes.success) {
        setOrders(orderRes.orders);
        setTotal(orderRes.total);
      }
      if (statsRes.success) {
        setStats(statsRes.stats);
      }
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    refreshOrders(1, query, statusFilter);
  };

  const handleStatusChange = (status: PaymentStatus | 'ALL') => {
    setStatusFilter(status);
    setPage(1);
    refreshOrders(1, query, status);
  };

  const handleCreateLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');
    setModalResult(null);

    const res = await createCustomPaymentLinkAction(modalForm);

    if (res.success && res.paymentUrl) {
      setModalResult({ paymentUrl: res.paymentUrl, orderNumber: res.orderNumber });
      refreshOrders();
    } else {
      setModalError(res.error || 'Failed to generate payment link.');
    }
    setModalLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      {/* Top Admin Header */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:opacity-90 transition-opacity">
              <Logo size="sm" />
            </Link>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest hidden sm:inline">
              Payments &amp; Orders Hub
            </span>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-2 text-xs">
            <Link
              href="/admin/leads"
              className="px-3 py-1.5 rounded-lg font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Leads
            </Link>
            <Link
              href="/admin/school-projects"
              className="px-3 py-1.5 rounded-lg font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              School Hub
            </Link>
            <Link
              href="/admin/orders"
              className="px-3 py-1.5 rounded-lg font-bold text-[#4338CA] bg-[#4338CA]/10 transition-colors"
            >
              Orders &amp; Payments
            </Link>
            <button
              onClick={() => adminLogoutAction()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 font-bold transition-colors ml-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-1">
            <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">Total Revenue</span>
            <div className="text-2xl font-mono font-extrabold text-emerald-700">
              ₹{stats.totalRevenueINR.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-1">
            <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">Settled Orders</span>
            <div className="text-2xl font-mono font-extrabold text-slate-900">{stats.paid}</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-1">
            <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">Pending Payments</span>
            <div className="text-2xl font-mono font-extrabold text-amber-600">{stats.pending}</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-1">
            <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">Total Orders</span>
            <div className="text-2xl font-mono font-extrabold text-[#4338CA]">{stats.total}</div>
          </div>
        </div>

        {/* Toolbar & Create Action */}
        <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearch} className="w-full md:w-96 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by order #, customer, email, or phone..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#4338CA]"
            />
          </form>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
            {(['ALL', 'PAID', 'PENDING', 'FAILED', 'REFUNDED'] as const).map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  statusFilter === s
                    ? 'bg-[#4338CA] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {s}
              </button>
            ))}

            <button
              onClick={() => refreshOrders()}
              disabled={isPending}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer ml-1"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <button
            onClick={() => {
              setIsModalOpen(true);
              setModalResult(null);
              setModalError('');
            }}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-[#4338CA]/20 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generate Payment Link</span>
          </button>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] text-slate-700 border-b border-[#E2E8F0]">
                <tr>
                  <th className="p-4 font-bold uppercase tracking-wider">Order Number</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Customer</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Service / Plan</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Amount</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Status</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Date</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-slate-600">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No orders found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => {
                    const badge = STATUS_BADGES[o.payment_status] || STATUS_BADGES.PENDING;
                    return (
                      <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-900">
                          <Link href={`/pay/${o.order_number}`} className="hover:text-[#4338CA] hover:underline">
                            {o.order_number}
                          </Link>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{o.customer_name}</div>
                          <div className="text-[11px] text-slate-400">{o.customer_email} • {o.customer_phone}</div>
                        </td>
                        <td className="p-4">
                          <span className="font-medium text-slate-900">
                            {o.metadata?.planName || o.service_type}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-extrabold text-slate-900">
                          ₹{Number(o.amount_inr).toLocaleString('en-IN')}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            {o.payment_status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400">
                          {new Date(o.created_at).toLocaleDateString('en-IN')}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/pay/${o.order_number}`}
                              target="_blank"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-[#4338CA] hover:border-[#4338CA] transition-colors"
                              title="Open Payment Link"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Generate Custom Payment Link Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#4338CA] uppercase tracking-wider">
                  Admin Action
                </span>
                <h3 className="text-lg font-extrabold text-slate-900">Generate Custom Payment Link</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {modalError}
              </div>
            )}

            {modalResult?.paymentUrl ? (
              <div className="space-y-4 p-5 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-extrabold text-slate-900 text-sm">Payment Link Created!</h4>
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs font-mono break-all text-slate-700">
                  {modalResult.paymentUrl}
                </div>

                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(modalResult.paymentUrl!)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4338CA] text-white text-xs font-bold cursor-pointer hover:bg-[#3730A3]"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                  </button>

                  <a
                    href={`https://wa.me/${modalForm.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `Hi ${modalForm.customerName}, here is your secure online payment link for ${modalForm.description} from Ekaagra Technologies: ${modalResult.paymentUrl}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share on WhatsApp</span>
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateLinkSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    value={modalForm.customerName}
                    onChange={(e) => setModalForm({ ...modalForm, customerName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4338CA]"
                    placeholder="e.g. Ramesh Kumar"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Phone / WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      value={modalForm.customerPhone}
                      onChange={(e) => setModalForm({ ...modalForm, customerPhone: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4338CA]"
                      placeholder="e.g. 9876543210"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={modalForm.customerEmail}
                      onChange={(e) => setModalForm({ ...modalForm, customerEmail: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4338CA]"
                      placeholder="e.g. client@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Amount (INR) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={modalForm.amountINR}
                      onChange={(e) => setModalForm({ ...modalForm, amountINR: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold focus:outline-none focus:border-[#4338CA]"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Service Category</label>
                    <select
                      value={modalForm.serviceType}
                      onChange={(e) => setModalForm({ ...modalForm, serviceType: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4338CA]"
                    >
                      <option value="Website Development">Website Development</option>
                      <option value="School ERP Platform">School ERP Platform</option>
                      <option value="Android Mobile App">Android Mobile App</option>
                      <option value="Annual Maintenance (AMC)">Annual Maintenance (AMC)</option>
                      <option value="Domain Excess Fee">Domain Excess Fee</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Description / Milestone Notes *</label>
                  <input
                    type="text"
                    required
                    value={modalForm.description}
                    onChange={(e) => setModalForm({ ...modalForm, description: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4338CA]"
                    placeholder="e.g. 50% Kickoff Advance for School ERP Platform"
                  />
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="px-5 py-2 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold cursor-pointer disabled:opacity-50"
                  >
                    {modalLoading ? 'Creating...' : 'Create Payment Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
