'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import type { BusinessProject, BusinessProjectFilter, BusinessProjectStatus } from '@/lib/types';
import { fetchBusinessProjectsAction } from '@/app/businessProjectActions';
import { adminLogoutAction } from '@/app/actions';
import Logo from '@/components/ui/Logo';
import {
  Briefcase,
  Search,
  Filter,
  RefreshCw,
  LogOut,
  ExternalLink,
  Users,
  School,
  CreditCard,
  Building,
  CheckCircle2,
  Clock,
  ChevronRight,
  AlertCircle,
  Eye,
  Plus,
} from 'lucide-react';

interface BusinessProjectsDashboardProps {
  initialProjects: BusinessProject[];
  initialTotal: number;
}

const STATUS_COLORS: Record<BusinessProjectStatus, { bg: string; text: string; border: string }> = {
  NEW_PROJECT: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  REQUIREMENTS_PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  REQUIREMENTS_SUBMITTED: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  REQUIREMENTS_UNDER_REVIEW: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  CLARIFICATION_REQUESTED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  DESIGN_IN_PROGRESS: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  DESIGN_READY: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  REVISION_REQUESTED: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  DESIGN_APPROVED: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  PAYMENT_PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-900', border: 'border-yellow-300' },
  PAID: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  DEVELOPMENT: { bg: 'bg-blue-100', text: 'text-blue-900', border: 'border-blue-300' },
  STAGING_REVIEW: { bg: 'bg-indigo-100', text: 'text-indigo-900', border: 'border-indigo-300' },
  FINAL_APPROVAL: { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200' },
  LAUNCHED: { bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-700' },
  COMPLETED: { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' },
  CANCELLED: { bg: 'bg-slate-200', text: 'text-slate-600', border: 'border-slate-400' },
};

export default function BusinessProjectsDashboard({
  initialProjects,
  initialTotal,
}: BusinessProjectsDashboardProps) {
  const [projects, setProjects] = useState<BusinessProject[]>(initialProjects);
  const [total, setTotal] = useState(initialTotal);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BusinessProjectStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  const refreshProjects = (newPage = page, newQuery = query, newStatus = statusFilter) => {
    startTransition(async () => {
      const res = await fetchBusinessProjectsAction({
        page: newPage,
        pageSize: 20,
        query: newQuery,
        status: newStatus,
      });

      if (res.success) {
        setProjects(res.projects);
        setTotal(res.total);
      }
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    refreshProjects(1, query, statusFilter);
  };

  const handleStatusChange = (status: BusinessProjectStatus | 'ALL') => {
    setStatusFilter(status);
    setPage(1);
    refreshProjects(1, query, status);
  };

  // Metrics
  const reqsPendingCount = projects.filter((p) => p.project_status === 'REQUIREMENTS_PENDING').length;
  const underReviewCount = projects.filter(
    (p) => p.project_status === 'REQUIREMENTS_SUBMITTED' || p.project_status === 'REQUIREMENTS_UNDER_REVIEW'
  ).length;
  const inDesignCount = projects.filter(
    (p) =>
      p.project_status === 'DESIGN_IN_PROGRESS' ||
      p.project_status === 'DESIGN_READY' ||
      p.project_status === 'REVISION_REQUESTED'
  ).length;
  const designApprovedCount = projects.filter((p) => p.project_status === 'DESIGN_APPROVED').length;
  const developmentCount = projects.filter(
    (p) => p.project_status === 'DEVELOPMENT' || p.project_status === 'PAID'
  ).length;

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#131B2E]">
      {/* Admin Navbar */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="hover:opacity-90 transition-opacity">
              <Logo size="sm" />
            </Link>
            <span className="hidden sm:inline-block w-px h-5 bg-[#E2E8F0]" />
            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#131B2E]">
              Business Projects Hub
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <Link
              href="/admin/leads"
              className="px-3 py-1.5 rounded-lg font-bold text-[#64748B] hover:text-[#131B2E] hover:bg-slate-100 transition-colors"
            >
              Leads
            </Link>
            <Link
              href="/admin/business-projects"
              className="px-3 py-1.5 rounded-lg font-bold text-[#4338CA] bg-[#4338CA]/10 transition-colors"
            >
              Business Projects
            </Link>
            <Link
              href="/admin/school-projects"
              className="px-3 py-1.5 rounded-lg font-bold text-[#64748B] hover:text-[#131B2E] hover:bg-slate-100 transition-colors"
            >
              School Hub
            </Link>
            <Link
              href="/admin/orders"
              className="px-3 py-1.5 rounded-lg font-bold text-[#64748B] hover:text-[#131B2E] hover:bg-slate-100 transition-colors"
            >
              Orders &amp; Payments
            </Link>
            <button
              onClick={() => adminLogoutAction()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 font-bold transition-colors ml-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-1">
            <span className="text-[10px] font-mono font-bold text-[#64748B] uppercase">Total Projects</span>
            <div className="text-2xl font-mono font-extrabold text-[#131B2E]">{total}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-1">
            <span className="text-[10px] font-mono font-bold text-amber-600 uppercase">Reqs Pending</span>
            <div className="text-2xl font-mono font-extrabold text-amber-700">{reqsPendingCount}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-1">
            <span className="text-[10px] font-mono font-bold text-purple-600 uppercase">Under Review</span>
            <div className="text-2xl font-mono font-extrabold text-purple-700">{underReviewCount}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-1">
            <span className="text-[10px] font-mono font-bold text-sky-600 uppercase">In Design</span>
            <div className="text-2xl font-mono font-extrabold text-sky-700">{inDesignCount}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-1">
            <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase">Design Approved</span>
            <div className="text-2xl font-mono font-extrabold text-emerald-700">{designApprovedCount}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-1">
            <span className="text-[10px] font-mono font-bold text-blue-600 uppercase">Development</span>
            <div className="text-2xl font-mono font-extrabold text-blue-700">{developmentCount}</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearch} className="flex-1 w-full flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects by name, BUS-2026 number, service..."
                className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#131B2E] placeholder-[#94A3B8] focus:outline-none focus:border-[#4338CA]"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2.5 bg-[#131B2E] hover:bg-[#4338CA] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-3.5 h-3.5 text-[#64748B]" />
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value as any)}
              className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-semibold text-[#131B2E] focus:outline-none focus:border-[#4338CA]"
            >
              <option value="ALL">All Statuses</option>
              <option value="REQUIREMENTS_PENDING">Requirements Pending</option>
              <option value="REQUIREMENTS_SUBMITTED">Requirements Submitted</option>
              <option value="REQUIREMENTS_UNDER_REVIEW">Requirements Under Review</option>
              <option value="CLARIFICATION_REQUESTED">Clarification Requested</option>
              <option value="DESIGN_IN_PROGRESS">Design In Progress</option>
              <option value="DESIGN_READY">Design Ready</option>
              <option value="REVISION_REQUESTED">Revision Requested</option>
              <option value="DESIGN_APPROVED">Design Approved</option>
              <option value="PAYMENT_PENDING">Payment Pending</option>
              <option value="PAID">Paid</option>
              <option value="DEVELOPMENT">Development</option>
              <option value="STAGING_REVIEW">Staging Review</option>
              <option value="LAUNCHED">Launched</option>
              <option value="COMPLETED">Completed</option>
            </select>

            <button
              type="button"
              onClick={() => refreshProjects()}
              disabled={isPending}
              className="p-2.5 bg-[#FAF7F2] hover:bg-[#E2E8F0] text-[#64748B] rounded-xl border border-[#E2E8F0] transition-colors cursor-pointer"
              title="Refresh projects"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Projects Table */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF7F2] border-b border-[#E2E8F0] text-[10px] font-extrabold uppercase tracking-wider text-[#64748B]">
                  <th className="py-3.5 px-4 sm:px-6">Project / Number</th>
                  <th className="py-3.5 px-4">Client / Organization</th>
                  <th className="py-3.5 px-4">Service Type</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-xs">
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#94A3B8]">
                      <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#4338CA]" />
                      <p className="font-semibold text-sm text-[#131B2E]">No business projects found.</p>
                      <p className="text-xs mt-1 text-[#64748B]">
                        Confirm leads in the{' '}
                        <Link href="/admin/leads" className="text-[#4338CA] underline font-bold">
                          Leads Dashboard
                        </Link>{' '}
                        to create new business projects.
                      </p>
                    </td>
                  </tr>
                ) : (
                  projects.map((proj) => {
                    const statusTheme = STATUS_COLORS[proj.project_status] || STATUS_COLORS.NEW_PROJECT;
                    const dateFormatted = new Date(proj.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    });

                    return (
                      <tr key={proj.id} className="hover:bg-[#FAF7F2]/80 transition-colors group">
                        <td className="py-3.5 px-4 sm:px-6">
                          <span className="font-mono text-[11px] font-bold text-[#4338CA] block">
                            {proj.project_number}
                          </span>
                          <span className="font-black text-sm text-[#131B2E] group-hover:text-[#4338CA] transition-colors">
                            {proj.project_name}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#131B2E]">{proj.client?.name || 'Client'}</div>
                          {proj.client?.email && (
                            <div className="text-[11px] text-[#64748B]">{proj.client.email}</div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-[#475569] font-medium">
                          {proj.service_type}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${statusTheme.bg} ${statusTheme.text} ${statusTheme.border}`}
                          >
                            {proj.project_status.replace(/_/g, ' ')}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-[#64748B] text-[11px] whitespace-nowrap">
                          {dateFormatted}
                        </td>

                        <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                          <Link
                            href={`/admin/business-projects/${proj.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#FAF7F2] group-hover:bg-[#4338CA] group-hover:text-white text-[#131B2E] text-xs font-bold rounded-lg border border-[#E2E8F0] transition-all cursor-pointer"
                          >
                            <span>Open Hub</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
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
    </div>
  );
}
