'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import type { BusinessProject, BusinessProjectFilter, BusinessProjectStatus } from '@/lib/types';
import { fetchBusinessProjectsAction } from '@/app/businessProjectActions';
import { adminLogoutAction } from '@/app/actions';
import Logo from '@/components/ui/Logo';
import DirectProjectCreationModal from '@/components/admin/DirectProjectCreationModal';
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
  Sparkles,
  Send,
  PhoneCall,
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  const refreshProjects = (newPage = page, newQuery = query, newStatus = statusFilter) => {
    startTransition(async () => {
      const res = await fetchBusinessProjectsAction({
        page: newPage,
        pageSize: 20,
        query: newQuery,
        status: newStatus,
        projectType: 'BUSINESS',
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
    <div className="eka-content-container space-y-5 sm:space-y-6 min-w-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Business Projects
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {total} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage corporate clients, websites, custom software, requirements intake, and milestone delivery.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => refreshProjects()}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-xs transition-colors cursor-pointer"
            title="Refresh projects"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-3">
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-1">
            <span className="text-[10px] font-mono font-bold text-[#64748B] uppercase truncate block">Total Projects</span>
            <div className="text-xl sm:text-2xl font-mono font-extrabold text-[#131B2E]">{total}</div>
          </div>
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-1">
            <span className="text-[10px] font-mono font-bold text-amber-600 uppercase truncate block">Reqs Pending</span>
            <div className="text-xl sm:text-2xl font-mono font-extrabold text-amber-700">{reqsPendingCount}</div>
          </div>
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-1">
            <span className="text-[10px] font-mono font-bold text-purple-600 uppercase truncate block">Under Review</span>
            <div className="text-xl sm:text-2xl font-mono font-extrabold text-purple-700">{underReviewCount}</div>
          </div>
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-1">
            <span className="text-[10px] font-mono font-bold text-sky-600 uppercase truncate block">In Design</span>
            <div className="text-xl sm:text-2xl font-mono font-extrabold text-sky-700">{inDesignCount}</div>
          </div>
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-1">
            <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase truncate block">Design Approved</span>
            <div className="text-xl sm:text-2xl font-mono font-extrabold text-emerald-700">{designApprovedCount}</div>
          </div>
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-1">
            <span className="text-[10px] font-mono font-bold text-blue-600 uppercase truncate block">Development</span>
            <div className="text-xl sm:text-2xl font-mono font-extrabold text-blue-700">{developmentCount}</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          <form onSubmit={handleSearch} className="flex-1 w-full flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects by name, BUS-2026 number, service..."
                className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#131B2E] placeholder-[#94A3B8] focus:outline-none focus:border-[#4338CA] min-h-[40px]"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2.5 bg-[#131B2E] hover:bg-[#4338CA] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer min-h-[40px]"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <Filter className="w-3.5 h-3.5 text-[#64748B] shrink-0" />

            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value as any)}
              className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-semibold text-[#131B2E] focus:outline-none focus:border-[#4338CA] min-h-[40px]"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW_PROJECT">New Project</option>
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
              className="p-2.5 bg-[#FAF7F2] hover:bg-[#E2E8F0] text-[#64748B] rounded-xl border border-[#E2E8F0] transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center shrink-0"
              title="Refresh projects"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Projects Table & Mobile Cards */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
          {projects.length === 0 ? (
            <div className="py-12 text-center text-[#94A3B8] p-6">
              <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#4338CA]" />
              <p className="font-semibold text-sm text-[#131B2E]">No projects found.</p>
              <p className="text-xs mt-1 text-[#64748B]">
                Create a project directly via the{' '}
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="text-[#4338CA] underline font-bold cursor-pointer"
                >
                  + New Project
                </button>{' '}
                button above, or convert leads in the{' '}
                <Link href="/admin/leads" className="text-[#4338CA] underline font-bold">
                  Leads Dashboard
                </Link>.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table (>= 768px) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FAF7F2] border-b border-[#E2E8F0] text-[10px] font-extrabold uppercase tracking-wider text-[#64748B]">
                      <th className="py-3.5 px-4 sm:px-6">Project / Number</th>
                      <th className="py-3.5 px-4">Client / Organization</th>
                      <th className="py-3.5 px-4">Service &amp; Source</th>
                      <th className="py-3.5 px-4">Status &amp; Intake</th>
                      <th className="py-3.5 px-4">Created Date</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] text-xs">
                    {projects.map((proj) => {
                      const statusTheme = STATUS_COLORS[proj.project_status] || STATUS_COLORS.NEW_PROJECT;
                      const dateFormatted = new Date(proj.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      });
                      const isSchool = proj.project_type === 'SCHOOL' || proj.project_number.startsWith('SCH-');
                      const intakeStatus = (proj.metadata as any)?.intakeStatus || 'NOT_STARTED';
                      const intakePercent = (proj.metadata as any)?.intakeProgressPercent;
                      const acqSource = (proj.metadata as any)?.acquisitionSource || proj.acquisition_source || (proj.lead_id ? 'WEBSITE_LEAD' : 'DIRECT');

                      return (
                        <tr key={proj.id} className="hover:bg-[#FAF7F2]/80 dark:hover:bg-white/[0.04] transition-colors group">
                          <td className="py-3.5 px-4 sm:px-6">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[11px] font-bold text-[#4338CA]">
                                {proj.project_number}
                              </span>
                              {isSchool && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
                                  <School className="w-2.5 h-2.5" /> SCHOOL
                                </span>
                              )}
                            </div>
                            <span className="font-black text-sm text-[#131B2E] group-hover:text-[#4338CA] transition-colors block">
                              {proj.project_name}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[#131B2E]">{proj.client?.name || 'Client'}</div>
                            <div className="text-[11px] text-[#64748B] flex items-center gap-1.5">
                              {proj.client?.organization && (
                                <span className="font-medium text-slate-700">{proj.client.organization}</span>
                              )}
                              {proj.client?.email && <span>&bull; {proj.client.email}</span>}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-medium text-slate-800">{proj.service_type}</div>
                            <div className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">
                              Source: <span className="font-bold text-slate-700">{acqSource.replace(/_/g, ' ')}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${statusTheme.bg} ${statusTheme.text} ${statusTheme.border}`}
                              >
                                {proj.project_status.replace(/_/g, ' ')}
                              </span>

                              {intakeStatus && (
                                <div className="flex items-center gap-1.5 text-[10px]">
                                  <span className="font-bold text-slate-500">Intake:</span>
                                  <span className={`font-extrabold uppercase ${
                                    intakeStatus === 'COMPLETED'
                                      ? 'text-emerald-700'
                                      : intakeStatus === 'SUBMITTED' || intakeStatus === 'UNDER_REVIEW'
                                      ? 'text-indigo-700'
                                      : intakeStatus === 'CHANGES_REQUESTED'
                                      ? 'text-rose-700'
                                      : 'text-amber-700'
                                  }`}>
                                    {intakeStatus.replace(/_/g, ' ')}
                                    {intakePercent !== undefined && ` (${intakePercent}%)`}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                            {dateFormatted}
                          </td>

                          <td className="py-3.5 px-4 sm:px-6 text-right">
                            <Link
                              href={`/admin/business-projects/${proj.id}`}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#4338CA] hover:text-white text-[#131B2E] text-xs font-bold border border-[#E2E8F0] transition-all cursor-pointer"
                            >
                              <span>Manage</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards (< 768px) */}
              <div className="md:hidden divide-y divide-[#E2E8F0]">
                {projects.map((proj) => {
                  const statusTheme = STATUS_COLORS[proj.project_status] || STATUS_COLORS.NEW_PROJECT;
                  const dateFormatted = new Date(proj.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });
                  const isSchool = proj.project_type === 'SCHOOL' || proj.project_number.startsWith('SCH-');
                  const intakeStatus = (proj.metadata as any)?.intakeStatus || 'NOT_STARTED';
                  const acqSource = (proj.metadata as any)?.acquisitionSource || proj.acquisition_source || (proj.lead_id ? 'WEBSITE_LEAD' : 'DIRECT');

                  return (
                    <div key={proj.id} className="p-4 space-y-3 hover:bg-[#FAF7F2]/60 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-[#4338CA]">
                              {proj.project_number}
                            </span>
                            {isSchool && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
                                SCHOOL
                              </span>
                            )}
                          </div>
                          <h4 className="font-black text-sm text-[#131B2E]">{proj.project_name}</h4>
                          <p className="text-xs text-slate-500">
                            {proj.client?.name || 'Client'} {proj.client?.organization ? `• ${proj.client.organization}` : ''}
                          </p>
                        </div>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shrink-0 ${statusTheme.bg} ${statusTheme.text} ${statusTheme.border}`}
                        >
                          {proj.project_status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E2E8F0]">
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">Service &amp; Source</span>
                          <span className="font-medium text-slate-800">{proj.service_type}</span>
                          <span className="text-[10px] font-mono text-slate-500 block">{acqSource}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">Intake Status</span>
                          <span className="font-bold text-indigo-700 uppercase text-[11px] block">{intakeStatus.replace(/_/g, ' ')}</span>
                          <span className="font-mono text-[10px] text-slate-500">{dateFormatted}</span>
                        </div>
                      </div>

                      <Link
                        href={`/admin/business-projects/${proj.id}`}
                        className="min-h-[44px] w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold transition-all shadow-xs"
                      >
                        <span>Open Project Workspace</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Direct Project Creation Modal */}
      <DirectProjectCreationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProjectCreated={() => refreshProjects()}
      />
    </div>
  );
}
