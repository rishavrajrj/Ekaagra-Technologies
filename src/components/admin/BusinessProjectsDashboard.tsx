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
  NEW_PROJECT: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/20' },
  REQUIREMENTS_PENDING: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20' },
  REQUIREMENTS_SUBMITTED: { bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/20' },
  REQUIREMENTS_UNDER_REVIEW: { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/20' },
  CLARIFICATION_REQUESTED: { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/20' },
  DESIGN_IN_PROGRESS: { bg: 'bg-sky-500/10', text: 'text-sky-600 dark:text-sky-400', border: 'border-sky-500/20' },
  DESIGN_READY: { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500/20' },
  REVISION_REQUESTED: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/20' },
  DESIGN_APPROVED: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20' },
  PAYMENT_PENDING: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20' },
  PAID: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20' },
  DEVELOPMENT: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/20' },
  STAGING_REVIEW: { bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/20' },
  FINAL_APPROVAL: { bg: 'bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-500/20' },
  LAUNCHED: { bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-700' },
  COMPLETED: { bg: 'bg-[var(--admin-surface-secondary)]', text: 'text-[var(--admin-text-muted)]', border: 'border-[var(--admin-border)]' },
  CANCELLED: { bg: 'bg-[var(--admin-surface-secondary)]', text: 'text-[var(--admin-text-muted)]', border: 'border-[var(--admin-border)]' },
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
            <h2 className="text-xl sm:text-2xl font-black text-[var(--admin-text-primary)] tracking-tight">
              Business Projects
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold admin-badge-info">
              {total} Total
            </span>
          </div>
          <p className="text-xs text-[var(--admin-text-muted)] mt-1">
            Manage corporate clients, websites, custom software, requirements intake, and milestone delivery.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => refreshProjects()}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[var(--admin-card)] hover:bg-[var(--admin-hover-overlay)] text-[var(--admin-text-primary)] text-xs font-bold rounded-xl border border-[var(--admin-border)] shadow-xs transition-colors cursor-pointer"
            title="Refresh projects"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin text-[var(--admin-accent)]' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--admin-accent)] hover:bg-[var(--admin-accent-hover)] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-3">
          <div className="bg-[var(--admin-card)] p-3.5 sm:p-4 rounded-2xl border border-[var(--admin-border)] shadow-xs space-y-1">
            <span className="text-[10px] font-mono font-bold text-[var(--admin-text-muted)] uppercase truncate block">Total Projects</span>
            <div className="text-xl sm:text-2xl font-mono font-extrabold text-[var(--admin-text-primary)]">{total}</div>
          </div>
          <div className="bg-[var(--admin-card)] p-3.5 sm:p-4 rounded-2xl border border-[var(--admin-border)] shadow-xs space-y-1">
            <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase truncate block">Reqs Pending</span>
            <div className="text-xl sm:text-2xl font-mono font-extrabold text-amber-600 dark:text-amber-400">{reqsPendingCount}</div>
          </div>
          <div className="bg-[var(--admin-card)] p-3.5 sm:p-4 rounded-2xl border border-[var(--admin-border)] shadow-xs space-y-1">
            <span className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400 uppercase truncate block">Under Review</span>
            <div className="text-xl sm:text-2xl font-mono font-extrabold text-purple-600 dark:text-purple-400">{underReviewCount}</div>
          </div>
          <div className="bg-[var(--admin-card)] p-3.5 sm:p-4 rounded-2xl border border-[var(--admin-border)] shadow-xs space-y-1">
            <span className="text-[10px] font-mono font-bold text-sky-600 dark:text-sky-400 uppercase truncate block">In Design</span>
            <div className="text-xl sm:text-2xl font-mono font-extrabold text-sky-600 dark:text-sky-400">{inDesignCount}</div>
          </div>
          <div className="bg-[var(--admin-card)] p-3.5 sm:p-4 rounded-2xl border border-[var(--admin-border)] shadow-xs space-y-1">
            <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase truncate block">Design Approved</span>
            <div className="text-xl sm:text-2xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400">{designApprovedCount}</div>
          </div>
          <div className="bg-[var(--admin-card)] p-3.5 sm:p-4 rounded-2xl border border-[var(--admin-border)] shadow-xs space-y-1">
            <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 uppercase truncate block">Development</span>
            <div className="text-xl sm:text-2xl font-mono font-extrabold text-blue-600 dark:text-blue-400">{developmentCount}</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-[var(--admin-card)] p-3.5 sm:p-5 rounded-2xl border border-[var(--admin-border)] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          <form onSubmit={handleSearch} className="flex-1 w-full flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[var(--admin-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects by name, BUS-2026 number, service..."
                className="w-full bg-[var(--admin-surface-secondary)] border border-[var(--admin-border)] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[var(--admin-text-primary)] placeholder-[var(--admin-text-muted)] focus:outline-hidden focus:border-[var(--admin-accent)] min-h-[40px]"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2.5 bg-[var(--admin-accent)] hover:bg-[var(--admin-accent-hover)] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer min-h-[40px]"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <Filter className="w-3.5 h-3.5 text-[var(--admin-text-muted)] shrink-0" />

            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value as any)}
              className="bg-[var(--admin-surface-secondary)] border border-[var(--admin-border)] rounded-xl px-3 py-2 text-xs font-semibold text-[var(--admin-text-primary)] focus:outline-hidden focus:border-[var(--admin-accent)] min-h-[40px]"
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
              className="p-2.5 bg-[var(--admin-surface-secondary)] hover:bg-[var(--admin-hover-overlay)] text-[var(--admin-text-muted)] rounded-xl border border-[var(--admin-border)] transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center shrink-0"
              title="Refresh projects"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Projects Table & Mobile Cards */}
        <div className="bg-[var(--admin-card)] rounded-2xl border border-[var(--admin-border)] shadow-xs overflow-hidden">
          {projects.length === 0 ? (
            <div className="py-12 text-center text-[var(--admin-text-muted)] p-6">
              <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-40 text-[var(--admin-accent)]" />
              <p className="font-semibold text-sm text-[var(--admin-text-primary)]">No projects found.</p>
              <p className="text-xs mt-1 text-[var(--admin-text-muted)]">
                Create a project directly via the{' '}
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="text-[var(--admin-accent)] underline font-bold cursor-pointer"
                >
                  + New Project
                </button>{' '}
                button above, or convert leads in the{' '}
                <Link href="/admin/leads" className="text-[var(--admin-accent)] underline font-bold">
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
                    <tr className="bg-[var(--admin-surface-secondary)] border-b border-[var(--admin-border)] text-[10px] font-extrabold uppercase tracking-wider text-[var(--admin-text-muted)]">
                      <th className="py-3.5 px-4 sm:px-6">Project / Number</th>
                      <th className="py-3.5 px-4">Client / Organization</th>
                      <th className="py-3.5 px-4">Service &amp; Source</th>
                      <th className="py-3.5 px-4">Status &amp; Intake</th>
                      <th className="py-3.5 px-4">Created Date</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--admin-border-subtle)] text-xs">
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
                        <tr key={proj.id} className="hover:bg-[var(--admin-hover-overlay)] transition-colors group">
                          <td className="py-3.5 px-4 sm:px-6">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[11px] font-bold text-[var(--admin-accent)]">
                                {proj.project_number}
                              </span>
                              {isSchool && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-extrabold admin-badge-info">
                                  <School className="w-2.5 h-2.5" /> SCHOOL
                                </span>
                              )}
                            </div>
                            <span className="font-black text-sm text-[var(--admin-text-primary)] group-hover:text-[var(--admin-accent)] transition-colors block">
                              {proj.project_name}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[var(--admin-text-primary)]">{proj.client?.name || 'Client'}</div>
                            <div className="text-[11px] text-[var(--admin-text-muted)] flex items-center gap-1.5">
                              {proj.client?.organization && (
                                <span className="font-medium text-[var(--admin-text-primary)]">{proj.client.organization}</span>
                              )}
                              {proj.client?.email && <span>&bull; {proj.client.email}</span>}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-medium text-[var(--admin-text-primary)]">{proj.service_type}</div>
                            <div className="text-[10px] text-[var(--admin-text-muted)] font-mono uppercase mt-0.5">
                              Source: <span className="font-bold text-[var(--admin-text-primary)]">{acqSource.replace(/_/g, ' ')}</span>
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
                                  <span className="font-bold text-[var(--admin-text-muted)]">Intake:</span>
                                  <span className={`font-extrabold uppercase ${
                                    intakeStatus === 'COMPLETED'
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : intakeStatus === 'SUBMITTED' || intakeStatus === 'UNDER_REVIEW'
                                      ? 'text-indigo-600 dark:text-indigo-400'
                                      : intakeStatus === 'CHANGES_REQUESTED'
                                      ? 'text-rose-600 dark:text-rose-400'
                                      : 'text-amber-600 dark:text-amber-400'
                                  }`}>
                                    {intakeStatus.replace(/_/g, ' ')}
                                    {intakePercent !== undefined && ` (${intakePercent}%)`}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-[var(--admin-text-muted)] font-mono text-[11px]">
                            {dateFormatted}
                          </td>

                          <td className="py-3.5 px-4 sm:px-6 text-right">
                            <Link
                              href={`/admin/business-projects/${proj.id}`}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--admin-surface-secondary)] hover:bg-[var(--admin-accent)] hover:text-white text-[var(--admin-text-primary)] text-xs font-bold border border-[var(--admin-border)] transition-all cursor-pointer"
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
              <div className="md:hidden divide-y divide-[var(--admin-border-subtle)]">
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
                    <div key={proj.id} className="p-4 space-y-3 hover:bg-[var(--admin-hover-overlay)] transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-[var(--admin-accent)]">
                              {proj.project_number}
                            </span>
                            {isSchool && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold admin-badge-info">
                                SCHOOL
                              </span>
                            )}
                          </div>
                          <h4 className="font-black text-sm text-[var(--admin-text-primary)]">{proj.project_name}</h4>
                          <p className="text-xs text-[var(--admin-text-muted)]">
                            {proj.client?.name || 'Client'} {proj.client?.organization ? `• ${proj.client.organization}` : ''}
                          </p>
                        </div>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shrink-0 ${statusTheme.bg} ${statusTheme.text} ${statusTheme.border}`}
                        >
                          {proj.project_status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs bg-[var(--admin-surface-secondary)] p-2.5 rounded-xl border border-[var(--admin-border)]">
                        <div>
                          <span className="text-[10px] text-[var(--admin-text-muted)] font-bold uppercase block">Service &amp; Source</span>
                          <span className="font-medium text-[var(--admin-text-primary)]">{proj.service_type}</span>
                          <span className="text-[10px] font-mono text-[var(--admin-text-muted)] block">{acqSource}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-[var(--admin-text-muted)] font-bold uppercase block">Intake Status</span>
                          <span className="font-bold text-[var(--admin-accent)] uppercase text-[11px] block">{intakeStatus.replace(/_/g, ' ')}</span>
                          <span className="font-mono text-[10px] text-[var(--admin-text-muted)]">{dateFormatted}</span>
                        </div>
                      </div>

                      <Link
                        href={`/admin/business-projects/${proj.id}`}
                        className="min-h-[44px] w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--admin-accent)] hover:bg-[var(--admin-accent-hover)] text-white text-xs font-bold transition-all shadow-xs"
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
