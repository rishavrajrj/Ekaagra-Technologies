'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import type { Lead, LeadFilter, LeadStats, LeadStatus, LeadType, LeadSource } from '@/lib/types';
import {
  fetchLeadsAction,
  fetchLeadStatsAction,
  updateLeadStatusAction,
  updateLeadNotesAction,
  adminLogoutAction,
} from '@/app/actions';
import { getWhatsAppChatUrl, sanitizePhoneNumber } from '@/lib/whatsapp';
import Logo from '@/components/ui/Logo';
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  LogOut,
  Phone,
  MessageCircle,
  Mail,
  Calendar,
  DollarSign,
  Building,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface LeadsDashboardProps {
  initialLeads: Lead[];
  initialTotal: number;
  initialStats: LeadStats;
  isDbConfigured: boolean;
}

const STATUS_COLORS: Record<LeadStatus, { bg: string; text: string; border: string }> = {
  NEW: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  CONTACTED: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  QUALIFIED: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  PROPOSAL_SENT: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  CONVERTED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  LOST: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300' },
};

const STATUS_OPTIONS: LeadStatus[] = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'PROPOSAL_SENT',
  'CONVERTED',
  'LOST',
];

export default function LeadsDashboard({
  initialLeads,
  initialTotal,
  initialStats,
  isDbConfigured,
}: LeadsDashboardProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [total, setTotal] = useState(initialTotal);
  const [stats, setStats] = useState<LeadStats>(initialStats);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<LeadType | 'ALL'>('ALL');
  const [sourceFilter, setSourceFilter] = useState<LeadSource | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [isLoading, startTransition] = useTransition();
  const [notesDraft, setNotesDraft] = useState('');
  const [notesSaveMsg, setNotesSaveMsg] = useState('');
  const [statusUpdateMsg, setStatusUpdateMsg] = useState('');

  // Fetch leads based on active filters
  const loadLeads = useCallback(
    (targetPage = page) => {
      startTransition(async () => {
        const filter: LeadFilter = {
          query,
          status: statusFilter,
          type: typeFilter,
          source: sourceFilter,
          page: targetPage,
          pageSize,
        };

        const [leadsRes, statsRes] = await Promise.all([
          fetchLeadsAction(filter),
          fetchLeadStatsAction(),
        ]);

        if (leadsRes.success) {
          setLeads(leadsRes.leads);
          setTotal(leadsRes.total);
        }
        if (statsRes.success) {
          setStats(statsRes.stats);
        }
      });
    },
    [query, statusFilter, typeFilter, sourceFilter, page]
  );

  // Trigger search on filter changes
  useEffect(() => {
    setPage(1);
    loadLeads(1);
  }, [statusFilter, typeFilter, sourceFilter, query, loadLeads]);

  // Sync draft notes when a lead is selected
  useEffect(() => {
    if (selectedLead) {
      setNotesDraft(selectedLead.notes || '');
      setNotesSaveMsg('');
      setStatusUpdateMsg('');
    }
  }, [selectedLead]);

  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (!selectedLead) return;
    setStatusUpdateMsg('Updating status...');

    const res = await updateLeadStatusAction(selectedLead.id, newStatus);
    if (res.success && res.data) {
      setSelectedLead(res.data);
      setLeads((prev) => prev.map((l) => (l.id === res.data!.id ? res.data! : l)));
      setStatusUpdateMsg('✓ Status updated');
      setTimeout(() => setStatusUpdateMsg(''), 2500);
      loadLeads();
    } else {
      setStatusUpdateMsg('Failed to update status.');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedLead) return;
    setNotesSaveMsg('Saving notes...');

    const res = await updateLeadNotesAction(selectedLead.id, notesDraft);
    if (res.success && res.data) {
      setSelectedLead(res.data);
      setLeads((prev) => prev.map((l) => (l.id === res.data!.id ? res.data! : l)));
      setNotesSaveMsg('✓ Notes saved');
      setTimeout(() => setNotesSaveMsg(''), 2500);
    } else {
      setNotesSaveMsg('Failed to save notes.');
    }
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#131B2E] flex flex-col">
      {/* --- Top Navbar ---------------------------------------------- */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="hidden sm:inline-block w-px h-5 bg-[#E2E8F0]" />
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#131B2E]">
                Lead Central
              </span>
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-200">
                <ShieldCheck className="w-3 h-3" />
                Live Hub
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadLeads()}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#E2E8F0] text-xs font-bold rounded-lg border border-[#E2E8F0] transition-colors cursor-pointer"
              title="Refresh leads"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <form action={adminLogoutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-lg border border-red-200 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* --- Main Content --------------------------------------------- */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {!isDbConfigured && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs sm:text-sm text-amber-900">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Supabase Environment Notice:</strong> <code>SUPABASE_URL</code> and{' '}
              <code>SUPABASE_SERVICE_ROLE_KEY</code> are not configured yet. Add them to your{' '}
              <code>.env.local</code> / Vercel dashboard to enable persistence and live lead viewing.
            </div>
          </div>
        )}

        {/* --- Metric Ribbon ------------------------------------------ */}
        <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-[#4338CA] text-white border-[#4338CA] shadow-md shadow-[#4338CA]/20'
                : 'bg-white text-[#131B2E] border-[#E2E8F0] hover:border-[#4338CA]/40'
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">Total Leads</div>
            <div className="text-xl font-extrabold mt-1">{stats.total}</div>
          </button>

          <button
            onClick={() => setStatusFilter('NEW')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              statusFilter === 'NEW'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                : 'bg-white text-blue-700 border-blue-200 hover:border-blue-400'
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider">New</div>
            <div className="text-xl font-extrabold mt-1">{stats.new}</div>
          </button>

          <button
            onClick={() => setStatusFilter('CONTACTED')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              statusFilter === 'CONTACTED'
                ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20'
                : 'bg-white text-purple-700 border-purple-200 hover:border-purple-400'
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider">Contacted</div>
            <div className="text-xl font-extrabold mt-1">{stats.contacted}</div>
          </button>

          <button
            onClick={() => setStatusFilter('QUALIFIED')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              statusFilter === 'QUALIFIED'
                ? 'bg-cyan-600 text-white border-cyan-600 shadow-md shadow-cyan-500/20'
                : 'bg-white text-cyan-700 border-cyan-200 hover:border-cyan-400'
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider">Qualified</div>
            <div className="text-xl font-extrabold mt-1">{stats.qualified}</div>
          </button>

          <button
            onClick={() => setStatusFilter('PROPOSAL_SENT')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              statusFilter === 'PROPOSAL_SENT'
                ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                : 'bg-white text-amber-700 border-amber-200 hover:border-amber-400'
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider">Proposal Sent</div>
            <div className="text-xl font-extrabold mt-1">{stats.proposalSent}</div>
          </button>

          <button
            onClick={() => setStatusFilter('CONVERTED')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              statusFilter === 'CONVERTED'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
                : 'bg-white text-emerald-700 border-emerald-200 hover:border-emerald-400'
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider">Converted</div>
            <div className="text-xl font-extrabold mt-1">{stats.converted}</div>
          </button>

          <button
            onClick={() => setStatusFilter('LOST')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              statusFilter === 'LOST'
                ? 'bg-slate-700 text-white border-slate-700 shadow-md'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider">Lost</div>
            <div className="text-xl font-extrabold mt-1">{stats.lost}</div>
          </button>
        </section>

        {/* --- Search & Filter Toolbar -------------------------------- */}
        <section className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search name, org, email, phone..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl pl-9 pr-4 py-2 text-xs text-[#131B2E] placeholder-[#94A3B8] focus:outline-none focus:border-[#4338CA]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#64748B]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Filters:</span>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'ALL')}
              className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-semibold text-[#131B2E] focus:outline-none focus:border-[#4338CA]"
            >
              <option value="ALL">All Statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as LeadType | 'ALL')}
              className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-semibold text-[#131B2E] focus:outline-none focus:border-[#4338CA]"
            >
              <option value="ALL">All Types</option>
              <option value="CONTACT">Contact Form</option>
              <option value="QUOTE">Quote Scope</option>
              <option value="WHATSAPP">WhatsApp Lead</option>
            </select>
          </div>
        </section>

        {/* --- Leads Table -------------------------------------------- */}
        <section className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF7F2] border-b border-[#E2E8F0] text-[10px] font-extrabold uppercase tracking-wider text-[#64748B]">
                  <th className="py-3.5 px-4 sm:px-6">Client / Business</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Service / Scope</th>
                  <th className="py-3.5 px-4">Budget</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Received</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-xs">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#94A3B8]">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="font-semibold">No lead records found.</p>
                      <p className="text-[11px] mt-0.5">
                        New submissions from your website forms will appear here in real-time.
                      </p>
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => {
                    const statusTheme = STATUS_COLORS[lead.status] || STATUS_COLORS.NEW;
                    const dateFormatted = new Date(lead.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    });

                    return (
                      <tr
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className="hover:bg-[#FAF7F2]/80 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="font-extrabold text-[#131B2E] group-hover:text-[#4338CA] transition-colors">
                            {lead.name}
                          </div>
                          {lead.organization && (
                            <div className="text-[11px] text-[#64748B] flex items-center gap-1 mt-0.5">
                              <Building className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-[180px]">{lead.organization}</span>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              lead.type === 'QUOTE'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-orange-50 text-orange-700 border border-orange-200'
                            }`}
                          >
                            {lead.type}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-[#334155] font-medium max-w-[200px] truncate">
                          {lead.service || lead.project_type || 'General Project'}
                        </td>

                        <td className="py-3.5 px-4 text-emerald-700 font-bold">
                          {lead.budget || '—'}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${statusTheme.bg} ${statusTheme.text} ${statusTheme.border}`}
                          >
                            {lead.status.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-[#64748B] text-[11px] whitespace-nowrap">
                          {dateFormatted}
                        </td>

                        <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLead(lead);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#FAF7F2] group-hover:bg-[#4338CA] group-hover:text-white text-[#131B2E] text-[11px] font-bold rounded-lg border border-[#E2E8F0] transition-all"
                          >
                            <span>Inspect</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > pageSize && (
            <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
              <div>
                Showing <strong>{(page - 1) * pageSize + 1}</strong> to{' '}
                <strong>{Math.min(page * pageSize, total)}</strong> of <strong>{total}</strong> leads
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => {
                    const prev = Math.max(1, page - 1);
                    setPage(prev);
                    loadLeads(prev);
                  }}
                  className="p-2 bg-[#FAF7F2] hover:bg-[#E2E8F0] rounded-lg border border-[#E2E8F0] disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-bold text-[#131B2E]">
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => {
                    const next = Math.min(totalPages, page + 1);
                    setPage(next);
                    loadLeads(next);
                  }}
                  className="p-2 bg-[#FAF7F2] hover:bg-[#E2E8F0] rounded-lg border border-[#E2E8F0] disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* --- Slide-Over / Modal Detail Drawer ------------------------- */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedLead(null)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-xl bg-white shadow-2xl z-10 flex flex-col h-full overflow-y-auto animate-slideLeft">
            {/* Drawer Header */}
            <div className="p-6 border-b border-[#E2E8F0] flex items-start justify-between bg-[#FAF7F2]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      selectedLead.type === 'QUOTE'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'bg-orange-50 text-orange-700'
                    }`}
                  >
                    {selectedLead.type} ENQUIRY
                  </span>
                  <span className="text-xs text-[#94A3B8]">
                    {new Date(selectedLead.created_at).toLocaleString('en-IN')}
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-[#131B2E]">{selectedLead.name}</h2>
                {selectedLead.organization && (
                  <p className="text-xs text-[#64748B]">{selectedLead.organization}</p>
                )}
              </div>

              <button
                onClick={() => setSelectedLead(null)}
                className="p-2 text-[#94A3B8] hover:text-[#131B2E] rounded-xl hover:bg-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick 1-Click Action Bar */}
            <div className="p-4 bg-white border-b border-[#E2E8F0] grid grid-cols-3 gap-2">
              <a
                href={`tel:${selectedLead.phone}`}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#4338CA]/10 hover:bg-[#4338CA]/20 text-[#4338CA] font-bold rounded-xl text-xs uppercase tracking-wider transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call</span>
              </a>

              <a
                href={getWhatsAppChatUrl(
                  `Hi ${selectedLead.name}, this is Ekaagra Technologies regarding your enquiry for ${
                    selectedLead.service || selectedLead.project_type || 'your project'
                  }.`,
                  sanitizePhoneNumber(selectedLead.phone)
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] font-bold rounded-xl text-xs uppercase tracking-wider transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>

              <a
                href={`mailto:${selectedLead.email}?subject=${encodeURIComponent(
                  `Regarding your project enquiry — Ekaagra Technologies`
                )}`}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-[#131B2E] font-bold rounded-xl text-xs uppercase tracking-wider transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </a>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-6 flex-1">
              {/* Status Selector */}
              <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E2E8F0] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                    Lead Pipeline Status
                  </label>
                  {statusUpdateMsg && (
                    <span className="text-xs font-bold text-emerald-600">{statusUpdateMsg}</span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  {STATUS_OPTIONS.map((status) => {
                    const isCurrent = selectedLead.status === status;
                    const theme = STATUS_COLORS[status];
                    return (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        className={`py-2 px-2.5 rounded-xl text-center text-xs font-bold transition-all border ${
                          isCurrent
                            ? `${theme.bg} ${theme.text} ${theme.border} ring-2 ring-offset-1 ring-[#4338CA]/30 shadow-xs`
                            : 'bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#4338CA]/30'
                        }`}
                      >
                        {status.replace('_', ' ')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#131B2E]">
                  Contact Information
                </h3>
                <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E2E8F0] space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Phone Number:</span>
                    <strong className="font-mono text-[#131B2E]">{selectedLead.phone}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Email Address:</span>
                    <strong className="text-[#131B2E]">{selectedLead.email}</strong>
                  </div>
                  {selectedLead.preferred_contact && (
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Preferred Channel:</span>
                      <strong className="text-[#4338CA]">{selectedLead.preferred_contact}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Project Specifications */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#131B2E]">
                  Project Specifications
                </h3>
                <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E2E8F0] space-y-2.5 text-xs">
                  {selectedLead.service && (
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Service:</span>
                      <strong className="text-[#4338CA]">{selectedLead.service}</strong>
                    </div>
                  )}
                  {selectedLead.project_type && (
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Solution Type:</span>
                      <strong className="text-[#4338CA]">{selectedLead.project_type}</strong>
                    </div>
                  )}
                  {selectedLead.budget && (
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Target Budget:</span>
                      <strong className="text-emerald-700 font-extrabold">{selectedLead.budget}</strong>
                    </div>
                  )}
                  {selectedLead.timeline && (
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Target Timeline:</span>
                      <strong className="text-[#131B2E]">{selectedLead.timeline}</strong>
                    </div>
                  )}
                  {selectedLead.expected_users && (
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Expected Scale:</span>
                      <strong className="text-[#131B2E]">{selectedLead.expected_users}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Description & Modules */}
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#131B2E]">
                  Project Overview &amp; Requirements
                </h3>
                <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] text-xs text-[#334155] leading-relaxed whitespace-pre-wrap">
                  {selectedLead.description}
                </div>
              </div>

              {selectedLead.features && (
                <div className="space-y-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#131B2E]">
                    Desired Specific Modules
                  </h3>
                  <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] text-xs text-[#334155] leading-relaxed whitespace-pre-wrap">
                    {selectedLead.features}
                  </div>
                </div>
              )}

              {/* Lifecycle Timestamps */}
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#131B2E]">
                  Lifecycle Timeline
                </h3>
                <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E2E8F0] space-y-1.5 text-[11px] text-[#64748B]">
                  <div className="flex justify-between">
                    <span>Submission Logged:</span>
                    <strong>{new Date(selectedLead.created_at).toLocaleString('en-IN')}</strong>
                  </div>
                  {selectedLead.contacted_at && (
                    <div className="flex justify-between text-purple-700">
                      <span>First Contacted:</span>
                      <strong>{new Date(selectedLead.contacted_at).toLocaleString('en-IN')}</strong>
                    </div>
                  )}
                  {selectedLead.proposal_sent_at && (
                    <div className="flex justify-between text-amber-700">
                      <span>Proposal Dispatched:</span>
                      <strong>{new Date(selectedLead.proposal_sent_at).toLocaleString('en-IN')}</strong>
                    </div>
                  )}
                  {selectedLead.converted_at && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Converted / Won:</span>
                      <strong>{new Date(selectedLead.converted_at).toLocaleString('en-IN')}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Internal Private Notes */}
              <div className="space-y-2 pb-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#131B2E]">
                    Internal Team Notes (Private)
                  </h3>
                  {notesSaveMsg && (
                    <span className="text-xs font-bold text-emerald-600">{notesSaveMsg}</span>
                  )}
                </div>
                <textarea
                  rows={3}
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  placeholder="Add internal context e.g. Called client on WhatsApp. Requested demo for school board next Tuesday..."
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-xs text-[#131B2E] placeholder-[#94A3B8] focus:outline-none focus:border-[#4338CA]"
                />
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  className="px-4 py-2 bg-[#131B2E] hover:bg-[#4338CA] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Save Internal Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
