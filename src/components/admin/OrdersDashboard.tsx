'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import type { Order, OrderFilter, OrderStats, PaymentStatus } from '@/lib/types';
import { fetchOrdersAction, fetchOrderStatsAction, createCustomPaymentLinkAction } from '@/app/orderActions';
import { adminLogoutAction } from '@/app/actions';
import Logo from '@/components/ui/Logo';
import ModalPortal from '@/components/ui/ModalPortal';

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
  PENDING: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20' },
  PAID: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20' },
  FAILED: { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/20' },
  REFUNDED: { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/20' },
  CANCELLED: { bg: 'bg-[var(--admin-surface-secondary)]', text: 'text-[var(--admin-text-muted)]', border: 'border-[var(--admin-border)]' },
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
  const [domainFilter, setDomainFilter] = useState<'ALL' | 'BUSINESS' | 'SCHOOL'>('ALL');
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  // Create Custom Payment Link Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState<{
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    serviceType: string;
    amountINR: number;
    description: string;
    domain: 'BUSINESS' | 'SCHOOL';
    projectNumber: string;
  }>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    serviceType: 'Website Development',
    amountINR: 999,
    description: 'Initial Project Deposit / Booking Advance',
    domain: 'BUSINESS',
    projectNumber: '',
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalResult, setModalResult] = useState<{ paymentUrl?: string; orderNumber?: string } | null>(null);
  const [modalError, setModalError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const refreshOrders = (
    newPage = page,
    newQuery = query,
    newStatus = statusFilter,
    newDomain = domainFilter
  ) => {
    startTransition(async () => {
      const [orderRes, statsRes] = await Promise.all([
        fetchOrdersAction({
          page: newPage,
          pageSize: 20,
          query: newQuery,
          status: newStatus,
          domain: newDomain,
        }),
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
    refreshOrders(1, query, statusFilter, domainFilter);
  };

  const handleStatusChange = (status: PaymentStatus | 'ALL') => {
    setStatusFilter(status);
    setPage(1);
    refreshOrders(1, query, status, domainFilter);
  };

  const handleDomainChange = (domain: 'ALL' | 'BUSINESS' | 'SCHOOL') => {
    setDomainFilter(domain);
    setPage(1);
    refreshOrders(1, query, statusFilter, domain);
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
    <div className="eka-content-container space-y-5 sm:space-y-6 min-w-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Orders & Verified Transactions
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {total} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitor incoming client payments, track Razorpay transactions, and generate custom payment links.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => refreshOrders()}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-xs transition-colors cursor-pointer"
            title="Refresh orders"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Payment Link</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Metrics Grid */}
        <div className="eka-kpi-grid">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-1">
            <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">Total Revenue</span>
            <div className="text-xl sm:text-2xl font-mono font-extrabold text-emerald-700 truncate">
              ₹{stats.totalRevenueINR.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-1">
            <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">Settled Orders</span>
            <div className="text-xl sm:text-2xl font-mono font-extrabold text-slate-900">{stats.paid}</div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-1">
            <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">Pending Payments</span>
            <div className="text-xl sm:text-2xl font-mono font-extrabold text-amber-600">{stats.pending}</div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-1">
            <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">Total Orders</span>
            <div className="text-xl sm:text-2xl font-mono font-extrabold text-[#4338CA]">{stats.total}</div>
          </div>
        </div>

        {/* Domain Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          {(
            [
              { id: 'ALL', label: 'All Orders' },
              { id: 'BUSINESS', label: 'Business Orders' },
              { id: 'SCHOOL', label: 'School Orders' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleDomainChange(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                domainFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
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
        </div>

        {/* Orders Table & Mobile Cards */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
          {orders.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No orders found matching the filter criteria.
            </div>
          ) : (
            <>
              {/* Desktop Table (>= 768px) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F2] text-slate-700 border-b border-[#E2E8F0]">
                    <tr>
                      <th className="p-4 font-bold uppercase tracking-wider">Order Number</th>
                      <th className="p-4 font-bold uppercase tracking-wider">Domain</th>
                      <th className="p-4 font-bold uppercase tracking-wider">Customer</th>
                      <th className="p-4 font-bold uppercase tracking-wider">Service / Plan</th>
                      <th className="p-4 font-bold uppercase tracking-wider">Amount</th>
                      <th className="p-4 font-bold uppercase tracking-wider">Status</th>
                      <th className="p-4 font-bold uppercase tracking-wider">Date</th>
                      <th className="p-4 font-bold uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] text-slate-600">
                    {orders.map((o) => {
                      const badge = STATUS_BADGES[o.payment_status] || STATUS_BADGES.PENDING;
                      const orderDomain = o.domain || (o.service_type?.toLowerCase().includes('school') ? 'SCHOOL' : 'BUSINESS');
                      return (
                        <tr key={o.id} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.04] transition-colors">
                          <td className="p-4 font-mono font-bold text-slate-900">
                            <Link href={`/pay/${o.order_number}`} className="hover:text-[#4338CA] hover:underline">
                              {o.order_number}
                            </Link>
                            {o.project_number && (
                              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                                Ref: {o.project_number}
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            {orderDomain === 'SCHOOL' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
                                School
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                Business
                              </span>
                            )}
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
                                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-[#4338CA] hover:border-[#4338CA] transition-colors"
                                title="Open Payment Link"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards (< 768px) */}
              <div className="md:hidden divide-y divide-[#E2E8F0]">
                {orders.map((o) => {
                  const badge = STATUS_BADGES[o.payment_status] || STATUS_BADGES.PENDING;
                  const orderDomain = o.domain || (o.service_type?.toLowerCase().includes('school') ? 'SCHOOL' : 'BUSINESS');
                  return (
                    <div key={o.id} className="p-4 space-y-3 hover:bg-slate-50/70 dark:hover:bg-white/[0.04] transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#4338CA] block">
                              {o.order_number}
                            </span>
                            {orderDomain === 'SCHOOL' ? (
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
                                School
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                Business
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-sm text-slate-900">{o.customer_name}</h4>
                          <p className="text-[11px] text-slate-500">{o.customer_email || o.customer_phone}</p>
                          {o.project_number && (
                            <p className="text-[10px] font-mono text-slate-400">Ref: {o.project_number}</p>
                          )}
                        </div>
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider shrink-0 ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {o.payment_status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E2E8F0]">
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">Service</span>
                          <span className="font-medium text-slate-900">{o.metadata?.planName || o.service_type}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">Amount</span>
                          <span className="font-mono font-extrabold text-slate-900 text-sm">
                            ₹{Number(o.amount_inr).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-xs">
                        <span className="text-slate-400 text-[11px]">
                          {new Date(o.created_at).toLocaleDateString('en-IN')}
                        </span>
                        <Link
                          href={`/pay/${o.order_number}`}
                          target="_blank"
                          className="min-h-[44px] px-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 transition-colors"
                        >
                          <span>Open Link</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Generate Custom Payment Link Modal */}
      <ModalPortal isOpen={isModalOpen}>
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] max-w-lg w-full max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100vh-3rem)] overflow-y-auto p-5 sm:p-8 space-y-6 shadow-2xl animate-fadeIn my-auto">

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
                {/* Domain Selector */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Project Domain *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setModalForm({
                          ...modalForm,
                          domain: 'BUSINESS',
                          serviceType: 'Website Development',
                        })
                      }
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        modalForm.domain === 'BUSINESS'
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Business Client
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setModalForm({
                          ...modalForm,
                          domain: 'SCHOOL',
                          serviceType: 'School ERP Platform',
                        })
                      }
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        modalForm.domain === 'SCHOOL'
                          ? 'bg-violet-50 border-violet-500 text-violet-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      School Client
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {modalForm.domain === 'SCHOOL' ? 'School Name *' : 'Customer Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={modalForm.customerName}
                    onChange={(e) => setModalForm({ ...modalForm, customerName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4338CA]"
                    placeholder={modalForm.domain === 'SCHOOL' ? 'e.g. St. Xavier High School' : 'e.g. Ramesh Kumar'}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Phone / WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      value={modalForm.customerPhone}
                      onChange={(e) => setModalForm({ ...modalForm, customerPhone: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4338CA] min-h-[40px]"
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
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4338CA] min-h-[40px]"
                      placeholder="e.g. client@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Amount (INR) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={modalForm.amountINR}
                      onChange={(e) => setModalForm({ ...modalForm, amountINR: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold focus:outline-none focus:border-[#4338CA] min-h-[40px]"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Service Category</label>
                    <select
                      value={modalForm.serviceType}
                      onChange={(e) => setModalForm({ ...modalForm, serviceType: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4338CA] min-h-[40px]"
                    >
                      {modalForm.domain === 'SCHOOL' ? (
                        <>
                          <option value="School ERP Platform">School ERP Platform</option>
                          <option value="School Website + CMS">School Website + CMS</option>
                          <option value="School Complete (Website + CMS + ERP)">School Complete (Website + CMS + ERP)</option>
                          <option value="School Annual Maintenance (AMC)">School Annual Maintenance (AMC)</option>
                        </>
                      ) : (
                        <>
                          <option value="Website Development">Website Development</option>
                          <option value="Custom Web Application">Custom Web Application</option>
                          <option value="Android Mobile App">Android Mobile App</option>
                          <option value="Annual Maintenance (AMC)">Annual Maintenance (AMC)</option>
                          <option value="Domain Excess Fee">Domain Excess Fee</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Associated Project Code <span className="font-normal text-slate-400">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={modalForm.projectNumber}
                    onChange={(e) => setModalForm({ ...modalForm, projectNumber: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:border-[#4338CA] min-h-[40px]"
                    placeholder={modalForm.domain === 'SCHOOL' ? 'e.g. SCH-2026-0001' : 'e.g. EKA-2026-0001'}
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Description / Milestone Notes *</label>
                  <input
                    type="text"
                    required
                    value={modalForm.description}
                    onChange={(e) => setModalForm({ ...modalForm, description: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4338CA] min-h-[40px]"
                    placeholder="e.g. 50% Kickoff Advance Deposit"
                  />
                </div>

                <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="min-h-[44px] px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-center cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="min-h-[44px] px-5 py-2 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold cursor-pointer disabled:opacity-50 text-center shadow-md shadow-[#4338CA]/20"
                  >
                    {modalLoading ? 'Creating...' : 'Create Payment Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </ModalPortal>
    </div>
  );
}

