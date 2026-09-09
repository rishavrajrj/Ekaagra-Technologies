'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import type {
  Lead,
  LeadStats,
  BusinessProject,
  Order,
  OrderStats,
  SchoolProject,
} from '@/lib/types';
import {
  Users,
  Briefcase,
  School,
  CreditCard,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  Phone,
  MessageCircle,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Zap,
  Activity,
  Plus,
  FileText,
  Building,
} from 'lucide-react';
import { getWhatsAppChatUrl, sanitizePhoneNumber } from '@/lib/whatsapp';

interface AdminOverviewDashboardProps {
  leads: Lead[];
  leadStats: LeadStats;
  businessProjects: BusinessProject[];
  businessTotal: number;
  orders: Order[];
  orderStats: OrderStats;
  schoolProjects: SchoolProject[];
  schoolTotal: number;
  isDbConfigured: boolean;
}

interface ActivityItem {
  id: string;
  domain: 'BUSINESS' | 'SCHOOL' | 'FINANCE' | 'ACQUISITION';
  title: string;
  description: string;
  timestamp: string;
  dateObj: Date;
  href: string;
  actionLabel: string;
}

interface AttentionItem {
  id: string;
  type: 'SCHOOL_INTAKE' | 'BUSINESS_PROJECT' | 'PENDING_PAYMENT' | 'NEW_LEAD';
  domain: 'BUSINESS' | 'SCHOOL';
  severity: 'high' | 'medium' | 'low';
  title: string;
  subtitle: string;
  actionText: string;
  actionHref: string;
  external?: boolean;
}

export default function AdminOverviewDashboard({
  leads,
  leadStats,
  businessProjects,
  businessTotal,
  orders,
  orderStats,
  schoolProjects,
  schoolTotal,
  isDbConfigured,
}: AdminOverviewDashboardProps) {
  const currentIstTime = new Date().toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  const currentIstDate = new Date().toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // Calculate Needs Attention Items
  const attentionItems = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];

    // 1. Incomplete School Intakes
    schoolProjects.forEach((sp) => {
      const pct = sp.completeness_percentage || 0;
      if (
        pct < 100 ||
        sp.status === 'onboarding_invited' ||
        sp.status === 'onboarding_in_progress' ||
        sp.status === 'submitted' ||
        sp.status === 'under_review' ||
        sp.status === 'changes_requested'
      ) {
        items.push({
          id: `school-${sp.id}`,
          type: 'SCHOOL_INTAKE',
          domain: 'SCHOOL',
          severity: pct < 40 ? 'high' : 'medium',
          title: sp.school_name,
          subtitle: `Intake ${pct}% complete (${sp.status.replace(/_/g, ' ')})`,
          actionText: 'Review Intake',
          actionHref: `/admin/school-projects`,
        });
      }
    });

    // 2. Business Projects requiring review or awaiting client input
    businessProjects.forEach((bp) => {
      if (
        bp.project_status === 'REQUIREMENTS_PENDING' ||
        bp.project_status === 'REQUIREMENTS_SUBMITTED' ||
        bp.project_status === 'REQUIREMENTS_UNDER_REVIEW' ||
        bp.project_status === 'CLARIFICATION_REQUESTED'
      ) {
        items.push({
          id: `business-${bp.id}`,
          type: 'BUSINESS_PROJECT',
          domain: 'BUSINESS',
          severity: bp.project_status === 'CLARIFICATION_REQUESTED' ? 'high' : 'medium',
          title: bp.project_name,
          subtitle: `Status: ${bp.project_status.replace(/_/g, ' ')}`,
          actionText: 'Open Project',
          actionHref: `/admin/business-projects/${bp.id}`,
        });
      }
    });

    // 3. Pending Payments
    orders.forEach((ord) => {
      if (ord.payment_status === 'PENDING') {
        const isSchool = ord.domain === 'SCHOOL' || ord.service_type?.toLowerCase().includes('school');
        items.push({
          id: `order-${ord.id}`,
          type: 'PENDING_PAYMENT',
          domain: isSchool ? 'SCHOOL' : 'BUSINESS',
          severity: 'medium',
          title: `Pending ₹${ord.amount_inr.toLocaleString('en-IN')} - ${ord.customer_name}`,
          subtitle: `Order ${ord.order_number} (${ord.service_type}) awaiting deposit`,
          actionText: 'View Order',
          actionHref: `/admin/orders`,
        });
      }
    });

    // 4. New Uncontacted Leads
    leads.forEach((ld) => {
      if (ld.status === 'NEW') {
        const isSchool = ld.lead_domain === 'SCHOOL' || (ld.service && ld.service.toLowerCase().includes('school'));
        items.push({
          id: `lead-${ld.id}`,
          type: 'NEW_LEAD',
          domain: isSchool ? 'SCHOOL' : 'BUSINESS',
          severity: 'high',
          title: `New Lead: ${ld.name} (${ld.organization || ld.type})`,
          subtitle: `${isSchool ? 'School' : 'Business'} lead • Budget: ${ld.budget || 'Not specified'}`,
          actionText: 'Contact',
          actionHref: `/admin/leads`,
        });
      }
    });

    return items;
  }, [schoolProjects, businessProjects, orders, leads]);

  // Calculate Combined Recent Activity Stream (5-8 items sorted by date)
  const recentActivities = useMemo<ActivityItem[]>(() => {
    const list: ActivityItem[] = [];

    // Orders
    orders.slice(0, 5).forEach((ord) => {
      const isSchool = ord.domain === 'SCHOOL' || ord.service_type?.toLowerCase().includes('school');
      list.push({
        id: `act-ord-${ord.id}`,
        domain: 'FINANCE',
        title: ord.payment_status === 'PAID' ? 'Payment Verified' : 'Order Generated',
        description: `₹${ord.amount_inr.toLocaleString('en-IN')} for ${ord.customer_name} (${ord.service_type})`,
        timestamp: new Date(ord.created_at).toLocaleDateString('en-IN', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        dateObj: new Date(ord.created_at),
        href: '/admin/orders',
        actionLabel: 'View Order',
      });
    });

    // Leads
    leads.slice(0, 5).forEach((ld) => {
      const isSchool = ld.lead_domain === 'SCHOOL' || (ld.service && ld.service.toLowerCase().includes('school'));
      list.push({
        id: `act-ld-${ld.id}`,
        domain: 'ACQUISITION',
        title: isSchool ? 'School Inquiry' : 'Business Lead Received',
        description: `${ld.name} (${ld.organization || ld.type}) - Status: ${ld.status}`,
        timestamp: new Date(ld.created_at).toLocaleDateString('en-IN', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        dateObj: new Date(ld.created_at),
        href: '/admin/leads',
        actionLabel: 'Review Lead',
      });
    });

    // Business Projects
    businessProjects.slice(0, 4).forEach((bp) => {
      list.push({
        id: `act-bp-${bp.id}`,
        domain: 'BUSINESS',
        title: `Business Project: ${bp.project_name}`,
        description: `${bp.project_number} • ${bp.service_type} (${bp.project_status.replace(/_/g, ' ')})`,
        timestamp: new Date(bp.created_at).toLocaleDateString('en-IN', {
          month: 'short',
          day: 'numeric',
        }),
        dateObj: new Date(bp.created_at),
        href: `/admin/business-projects/${bp.id}`,
        actionLabel: 'Workspace',
      });
    });

    // School Projects
    schoolProjects.slice(0, 4).forEach((sp) => {
      list.push({
        id: `act-sp-${sp.id}`,
        domain: 'SCHOOL',
        title: `School Onboarding: ${sp.school_name}`,
        description: `${sp.project_number} • Intake ${sp.completeness_percentage || 0}% (${sp.status.replace(/_/g, ' ')})`,
        timestamp: new Date(sp.created_at).toLocaleDateString('en-IN', {
          month: 'short',
          day: 'numeric',
        }),
        dateObj: new Date(sp.created_at),
        href: `/admin/school-projects`,
        actionLabel: 'School Hub',
      });
    });

    return list
      .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime())
      .slice(0, 8);
  }, [orders, leads, businessProjects, schoolProjects]);

  const businessLeadCount = leadStats.businessCount ?? Math.max(0, leadStats.total - (leadStats.schoolCount || 0));
  const schoolLeadCount = leadStats.schoolCount ?? (leadStats.total - businessLeadCount);

  return (
    <div className="eka-content-container space-y-6 sm:space-y-8 min-w-0">
      {/* --- Environment Notice if Supabase not configured --- */}
      {!isDbConfigured && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3.5 text-xs sm:text-sm text-amber-900 dark:text-amber-200 shadow-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Database Setup Notice</p>
            <p className="text-amber-800 dark:text-amber-300 text-xs leading-relaxed">
              <code>SUPABASE_URL</code> and <code>SUPABASE_SERVICE_ROLE_KEY</code> are currently operating with in-memory fallbacks.
              Configure them in your production environment to unlock permanent cloud database persistence.
            </p>
          </div>
        </div>
      )}

      {/* --- Operations Command Hero Banner --- */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0B1120] via-[#161F37] to-[#1E1B4B] rounded-2xl sm:rounded-3xl p-5 sm:p-7 lg:p-8 text-white shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Operations Command Center
              </span>
              <span className="text-slate-400 text-xs hidden sm:inline">&bull;</span>
              <span className="text-slate-300 text-xs font-mono">
                {currentIstDate} &bull; {currentIstTime} IST
              </span>
              <span className="text-slate-400 text-xs hidden sm:inline">&bull;</span>
              <span className="text-emerald-400 text-[11px] font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Architecture Guard Active
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
              Ekaagra Operations HQ
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Unified command center with strict domain isolation for Business Portals and School ERP Onboarding pipelines.
            </p>
          </div>

          {/* Quick Primary Actions */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <Link
              href="/admin/business-projects"
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer min-h-[40px]"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>+ New Business Project</span>
            </Link>

            <Link
              href="/admin/school-projects"
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-violet-600/30 transition-all cursor-pointer min-h-[40px]"
            >
              <School className="w-3.5 h-3.5" />
              <span>Start School Onboarding</span>
            </Link>

            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer backdrop-blur-xs min-h-[40px]"
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
              <span>Payment Links</span>
            </Link>
          </div>
        </div>
      </div>

      {/* --- Executive Top KPI Row (6 Focused Metrics) --- */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Metric 1: Total Revenue */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              ₹{(orderStats.totalRevenueINR || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {orderStats.paid} Paid Orders
            </p>
          </div>
        </div>

        {/* Metric 2: Inbound Leads (Business + School split) */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Inbound Leads
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {leadStats.total}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{businessLeadCount} Biz</span>
              {' • '}
              <span className="text-violet-600 dark:text-violet-400 font-semibold">{schoolLeadCount} Sch</span>
              {leadStats.new > 0 && ` (${leadStats.new} new)`}
            </p>
          </div>
        </div>

        {/* Metric 3: Active Business Projects */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Business Projects
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <Briefcase className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {businessTotal}
            </div>
            <Link
              href="/admin/business-projects"
              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline mt-0.5 inline-block"
            >
              Corporate Tracker &rarr;
            </Link>
          </div>
        </div>

        {/* Metric 4: Active School Projects */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              School Projects
            </span>
            <div className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
              <School className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {schoolTotal}
            </div>
            <Link
              href="/admin/school-projects"
              className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:underline mt-0.5 inline-block"
            >
              Intake Hub &rarr;
            </Link>
          </div>
        </div>

        {/* Metric 5: Pending Payments */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pending Payments
            </span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
              {orderStats.pending}
            </div>
            <Link
              href="/admin/orders"
              className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline mt-0.5 inline-block"
            >
              View Invoices &rarr;
            </Link>
          </div>
        </div>

        {/* Metric 6: Needs Attention */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Needs Attention
            </span>
            <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
              {attentionItems.length}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Actionable tasks
            </p>
          </div>
        </div>
      </section>

      {/* --- Actionable "Needs Attention" Widget + Recent Activity Stream --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Actionable Needs Attention Widget */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Action Required
                  {attentionItems.length > 0 && (
                    <span className="px-2 py-0.2 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-full text-[10px] font-extrabold">
                      {attentionItems.length}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  High-priority items requiring team review or client follow-up.
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1">
            {attentionItems.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  All systems clear
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  No incomplete intakes, blocked projects, or overdue payment links currently require attention.
                </p>
              </div>
            ) : (
              attentionItems.slice(0, 6).map((item) => {
                const isSchool = item.domain === 'SCHOOL';
                return (
                  <div
                    key={item.id}
                    className="p-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                            isSchool
                              ? 'bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800'
                              : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                          }`}
                        >
                          {item.domain}
                        </span>
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {item.title}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {item.subtitle}
                      </p>
                    </div>

                    <div className="shrink-0">
                      <Link
                        href={item.actionHref}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                      >
                        <span>{item.actionText}</span>
                        <ArrowUpRight className="w-3 h-3 text-slate-400" />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 5 Cols: Recent Activity Stream (5-8 items) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Recent Operations Activity
              </h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Chronological
            </span>
          </div>

          <div className="space-y-3">
            {recentActivities.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">
                No recent activity recorded.
              </p>
            ) : (
              recentActivities.map((act) => {
                const badgeColor =
                  act.domain === 'SCHOOL'
                    ? 'bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800'
                    : act.domain === 'BUSINESS'
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                    : act.domain === 'FINANCE'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';

                return (
                  <Link
                    key={act.id}
                    href={act.href}
                    className="block p-3 rounded-xl bg-slate-50/70 hover:bg-slate-100/80 dark:bg-slate-800/40 dark:hover:bg-slate-800/70 border border-slate-200/60 dark:border-slate-800 transition-all space-y-1 group"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span
                        className={`px-1.5 py-0.2 rounded font-extrabold uppercase tracking-wider border ${badgeColor}`}
                      >
                        {act.domain}
                      </span>
                      <span className="text-slate-400 font-mono">
                        {act.timestamp}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {act.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {act.description}
                    </p>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* --- Service & Gateway Health Status --- */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            Core Infrastructure & Pipeline Health
          </h3>
          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Operating
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Corporate DB</span>
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {isDbConfigured ? 'Supabase Connected' : 'Local Fallback'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] block">School Intake DB</span>
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Isolated DB-B
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Payment Gateway</span>
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-1">
              <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
              Razorpay Webhooks
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Domain Enforcement</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 mt-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Strict Separation
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
