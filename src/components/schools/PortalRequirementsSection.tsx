'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  LayoutDashboard,
  Shield,
  Users,
  Smartphone,
  Bell,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Check,
  Globe,
  HelpCircle,
  Lock,
  Bus,
  Home,
  Library as LibraryIcon,
  Calendar,
  DollarSign,
  BookOpen,
  Clock,
  FileText,
  Send,
  Sparkles,
  UserCheck,
  MessageSquare,
  Phone,
  Mail,
  ShieldAlert,
  Sliders,
  ExternalLink,
  Settings,
  Eye,
  Award,
  Info,
  RefreshCw,
} from 'lucide-react';
import type {
  UniversalIntakeData,
  SchoolProject,
  PortalRequirementsData,
  PortalKey,
  PortalAvailabilityStatus,
  PortalLoginMethod,
  StudentAccessRestriction,
  TeacherPermissionLevel,
  ManagementDashboardVisibility,
  NotificationChannelKey,
  NotificationRecipientKey,
  AnnouncementPublisherKey,
  AnnouncementApprovalPolicy,
  AnnouncementAudienceKey,
  PortalLanguageKey,
  PortalAccessChannelKey,
} from '@/lib/types';
import {
  PORTAL_GROUPS,
  LOGIN_METHODS,
  PARENT_FEATURES,
  STUDENT_FEATURES,
  TEACHER_FEATURES,
  ADMINISTRATOR_FEATURES,
  MANAGEMENT_FEATURES,
  FINANCE_FEATURES,
  TRANSPORT_FEATURES,
  HOSTEL_FEATURES,
  LIBRARY_FEATURES,
  DASHBOARD_WIDGETS,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_CATEGORIES_TREE,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_RECIPIENTS,
  EMERGENCY_EVENTS,
  EMERGENCY_CHANNELS,
  ANNOUNCEMENT_PUBLISHERS,
  ANNOUNCEMENT_APPROVAL_POLICIES,
  ANNOUNCEMENT_AUDIENCES,
  PORTAL_LANGUAGES,
  ACCESS_CHANNELS,
  resolvePortalApplicability,
  normalizePortalRequirementsData,
  validatePortalRequirementsData,
  generatePortalSummary,
  getPortalBaselineRecommendations,
} from '@/lib/portalRequirementsUtils';

interface PortalRequirementsSectionProps {
  intakeData: UniversalIntakeData;
  updateSectionField: (section: keyof UniversalIntakeData, field: string, value: any) => void;
  updateSectionDirect?: (section: keyof UniversalIntakeData, value: any) => void;
  project?: SchoolProject | null;
  onNavigateToSection?: (sectionKey: any) => void;
  onNextStep?: () => void;
  onPrevStep?: () => void;
  stepNumber?: number;
  totalSteps?: number;
}

export default function PortalRequirementsSection({
  intakeData,
  updateSectionField,
  updateSectionDirect,
  project,
  onNavigateToSection,
  stepNumber = 27,
  totalSteps = 29,
}: PortalRequirementsSectionProps) {
  // Normalize incoming data safely with intelligent defaults
  const config: PortalRequirementsData = useMemo(() => {
    return normalizePortalRequirementsData(intakeData.portalRequirements, intakeData);
  }, [intakeData.portalRequirements, intakeData]);

  // Applicability of Transport, Hostel, and Library
  const applicability = useMemo(() => {
    return resolvePortalApplicability(intakeData);
  }, [intakeData]);

  // Real-time validation & completion score
  const validation = useMemo(() => {
    return validatePortalRequirementsData(config, intakeData);
  }, [config, intakeData]);

  // Dynamic configuration summary
  const summaryBullets = useMemo(() => {
    return generatePortalSummary(config);
  }, [config]);

  // Baseline audit
  const baselineRecs = useMemo(() => {
    return getPortalBaselineRecommendations(config);
  }, [config]);

  // Master updater with automatic legacy mirror synchronization
  const commitUpdate = useCallback(
    (updater: (prev: PortalRequirementsData) => PortalRequirementsData) => {
      const updated = updater(config);
      const committed = normalizePortalRequirementsData(updated, intakeData);
      if (updateSectionDirect) {
        updateSectionDirect('portalRequirements', committed);
      } else {
        Object.entries(committed).forEach(([k, v]) => {
          updateSectionField('portalRequirements', k, v);
        });
      }
    },
    [config, intakeData, updateSectionDirect, updateSectionField]
  );

  // Card Accordion Collapsed / Expanded state
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    groups: true,
    auth: true,
    parent: true,
    student: true,
    teacher: true,
    admin: false,
    management: false,
    finance: false,
    transport: false,
    hostel: false,
    library: false,
    dashboard: false,
    notificationCenter: true,
    notificationCategories: false,
    notificationChannels: true,
    emergency: true,
    announcements: false,
    userPreferences: false,
    localization: false,
    accessChannels: false,
    summary: true,
  });

  const toggleCard = (cardId: string) => {
    setExpandedCards((prev) => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  // Helper to toggle feature in array
  const toggleFeature = (featureListKey: keyof PortalRequirementsData, featureId: string) => {
    commitUpdate((prev) => {
      const currentList = ((prev[featureListKey] as string[]) || []);
      const exists = currentList.includes(featureId);
      const nextList = exists
        ? currentList.filter((id) => id !== featureId)
        : [...currentList, featureId];
      return {
        ...prev,
        [featureListKey]: nextList,
      };
    });
  };

  // Batch toggle all features
  const setAllFeatures = (featureListKey: keyof PortalRequirementsData, allIds: string[], enable: boolean) => {
    commitUpdate((prev) => ({
      ...prev,
      [featureListKey]: enable ? allIds : [],
    }));
  };

  // Helper for portal availability
  const setPortalStatus = (portalKey: PortalKey, status: PortalAvailabilityStatus) => {
    commitUpdate((prev) => ({
      ...prev,
      portals: {
        ...(prev.portals || {}),
        [portalKey]: status,
      },
    }));
  };

  return (
    <div className="space-y-6 text-xs text-[#131B2E]">
      {/* ─── 1. SECTION ARCHITECTURE & READINESS CARD ─── */}
      <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-[#4338CA] flex items-center justify-center shrink-0">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#4338CA] bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                  Architecture Overview
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                  9 User Groups
                </span>
              </div>
              <h3 className="text-base font-bold text-[#131B2E] mt-1">
                Portal Access, Roles &amp; Notification Architecture
              </h3>
              <p className="text-xs text-[#64748B]">
                Configure visibility, authentication methods, emergency overrides, and circular publishing.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-center">
            <span className="text-xs px-2.5 py-1 rounded-lg border font-semibold bg-white border-[#E2E8F0] text-slate-700 shadow-2xs">
              {Object.values(config.portals || {}).filter((v) => v === 'enabled').length} of 9 Portals Active
            </span>
          </div>
        </div>

        <p className="text-xs text-[#475569] leading-relaxed">
          Specify digital experience requirements for parents, students, teachers, administrators, and leadership. Downstream module configuration cards are dynamically activated based on the operational portals selected below.
        </p>

        {validation.missingFields.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2.5 text-amber-900 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Configuration Incomplete ({validation.sectionPercentage}% Filled):</span>
              <p className="text-[11px] text-amber-800 mt-0.5">
                {validation.missingFields[0]}
                {validation.missingFields.length > 1 && ` (+${validation.missingFields.length - 1} more requirements pending)`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ─── 2. RECOMMENDED BASELINE AUDIT (NON-BLOCKING) ─── */}
      {baselineRecs.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Recommended Portal Baseline Advice</span>
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            Our standard institutional baseline includes Parent, Student, Teacher and Admin portals with Push and Emergency alerts enabled. You may continue, but consider these recommendations:
          </p>
          <ul className="space-y-1.5 pt-1">
            {baselineRecs.map((rec) => (
              <li key={rec.id} className="text-[11px] text-amber-900 flex items-start space-x-2">
                <span className="font-bold text-amber-600">&bull;</span>
                <span>{rec.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ─── 3. PORTAL USER GROUPS & AVAILABILITY ─── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden">
        <button
          type="button"
          aria-expanded={Boolean(expandedCards.groups)}
          onClick={() => toggleCard('groups')}
          className="w-full px-5 py-4 flex items-center justify-between bg-white hover:bg-slate-50/50 transition cursor-pointer text-left border-b border-[#E2E8F0]"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#4338CA] flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#131B2E]">PORTAL USER GROUPS</h3>
              <p className="text-[11px] text-[#64748B]">Select the portal experiences required by your school.</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {Object.values(config.portals || {}).filter((v) => v === 'enabled').length} Active Portals
            </span>
            {expandedCards.groups ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
          </div>
        </button>

        {expandedCards.groups && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {PORTAL_GROUPS.map((pg) => {
                const currentStatus = config.portals?.[pg.id] || 'enabled';
                const isNA = currentStatus === 'not_applicable';
                const isEnabled = currentStatus === 'enabled';

                return (
                  <div
                    key={pg.id}
                    className={`border rounded-xl p-3.5 transition flex flex-col justify-between ${
                      isEnabled
                        ? 'border-indigo-200 bg-indigo-50/30 ring-1 ring-indigo-200'
                        : isNA
                        ? 'border-slate-200 bg-slate-50 opacity-75'
                        : 'border-[#E2E8F0] bg-white'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-[#131B2E]">{pg.label}</span>
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isEnabled
                              ? 'bg-emerald-100 text-emerald-800'
                              : currentStatus === 'planned'
                              ? 'bg-blue-100 text-blue-800'
                              : isNA
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {currentStatus === 'enabled'
                            ? 'Enabled'
                            : currentStatus === 'planned'
                            ? 'Planned'
                            : isNA
                            ? 'Not Applicable'
                            : 'Not Required'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] leading-tight line-clamp-2">{pg.description}</p>
                    </div>

                    <div className="pt-3 flex items-center justify-between border-t border-slate-100 mt-2">
                      <span className="text-[10px] text-slate-500 font-medium">{pg.roleBadge}</span>

                      {/* Status Selector */}
                      <select
                        value={currentStatus}
                        onChange={(e) => setPortalStatus(pg.id, e.target.value as PortalAvailabilityStatus)}
                        aria-label={`Status for ${pg.label}`}
                        className="text-[11px] font-semibold bg-white border border-[#CBD5E1] rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                      >
                        <option value="enabled">Enabled</option>
                        <option value="planned">Planned (Phase 2)</option>
                        <option value="not_required">Not Required</option>
                        <option value="not_applicable">Not Applicable</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Intelligent applicability notes */}
            {(!applicability.isHostelApplicable || !applicability.isTransportApplicable || !applicability.isLibraryApplicable) && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-[11px] text-slate-600">
                <span className="font-bold text-slate-800 block">System Auto-Applicability Rules:</span>
                {applicability.hostelReason && <p>&bull; {applicability.hostelReason}</p>}
                {applicability.transportReason && <p>&bull; {applicability.transportReason}</p>}
                {applicability.libraryReason && <p>&bull; {applicability.libraryReason}</p>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── 4. PORTAL ACCESS & AUTHENTICATION ─── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden">
        <button
          type="button"
          aria-expanded={Boolean(expandedCards.auth)}
          onClick={() => toggleCard('auth')}
          className="w-full px-5 py-4 flex items-center justify-between bg-white hover:bg-slate-50/50 transition cursor-pointer text-left border-b border-[#E2E8F0]"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#4338CA] flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#131B2E]">PORTAL ACCESS &amp; AUTHENTICATION</h3>
              <p className="text-[11px] text-[#64748B]">Choose the primary authentication experience for parents, students and staff.</p>
            </div>
          </div>
          {expandedCards.auth ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
        </button>

        {expandedCards.auth && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {LOGIN_METHODS.map((method) => {
                const isSelected = config.authentication?.preferredLoginMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => {
                      commitUpdate((prev) => ({
                        ...prev,
                        authentication: {
                          ...(prev.authentication || { preferredLoginMethod: 'mobile_otp' }),
                          preferredLoginMethod: method.id,
                        },
                      }));
                    }}
                    className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-[#4338CA] bg-indigo-50/50 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-[#E2E8F0] hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-[#131B2E]">{method.label}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[#4338CA]" />}
                      </div>
                      <p className="text-[11px] text-[#64748B] leading-tight">{method.description}</p>
                    </div>
                    {method.badge && (
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-100/60 px-2 py-0.5 rounded-full w-fit mt-3">
                        {method.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-3 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl flex items-center justify-between">
              <span className="text-[11px] text-slate-600">
                Allow users to switch between multiple login methods (e.g. OTP on phone or Password on PC)
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.authentication?.allowMultipleMethods ?? true}
                  onChange={(e) => {
                    commitUpdate((prev) => ({
                      ...prev,
                      authentication: {
                        ...(prev.authentication || { preferredLoginMethod: 'mobile_otp' }),
                        allowMultipleMethods: e.target.checked,
                      },
                    }));
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-[#E2E8F0] peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#CBD5E1] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4338CA]" />
              </label>
            </div>
            <p className="text-[10px] text-slate-400 italic">
              Security Notice: Passwords, OTP secrets, and authentication keys are managed under Section 21 security policies and encrypted in production. No credentials are saved in this section.
            </p>
          </div>
        )}
      </div>

      {/* ─── 5. PARENT / GUARDIAN PORTAL ─── */}
      {config.portals?.parent === 'enabled' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden">
          <button
            type="button"
            aria-expanded={Boolean(expandedCards.parent)}
            onClick={() => toggleCard('parent')}
            className="w-full px-5 py-4 flex items-center justify-between bg-white hover:bg-slate-50/50 transition cursor-pointer text-left border-b border-[#E2E8F0]"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-sm text-[#131B2E]">PARENT / GUARDIAN PORTAL</h3>
                  <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {config.parentFeatures?.length || 0} Features Enabled
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B]">Configure what parent guardians should be able to access.</p>
              </div>
            </div>
            {expandedCards.parent ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
          </button>

          {expandedCards.parent && (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-700">Select parent features:</span>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setAllFeatures('parentFeatures', PARENT_FEATURES.map((f) => f.id), true)}
                    className="text-[10px] font-bold text-[#4338CA] hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setAllFeatures('parentFeatures', PARENT_FEATURES.map((f) => f.id), false)}
                    className="text-[10px] font-bold text-slate-500 hover:underline"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {PARENT_FEATURES.map((feat) => {
                  const isChecked = config.parentFeatures?.includes(feat.id) ?? true;
                  return (
                    <label
                      key={feat.id}
                      className={`p-2.5 rounded-xl border flex items-start space-x-2.5 cursor-pointer transition ${
                        isChecked ? 'bg-indigo-50/30 border-indigo-200' : 'bg-white border-[#E2E8F0] hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleFeature('parentFeatures', feat.id)}
                        className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-[#4338CA] focus:ring-indigo-500 cursor-pointer"
                      />
                      <div>
                        <span className="font-bold text-xs text-[#131B2E] block">{feat.label}</span>
                        <span className="text-[10px] text-[#64748B] leading-tight block">{feat.description}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── 6. STUDENT PORTAL ─── */}
      {config.portals?.student === 'enabled' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden">
          <button
            type="button"
            aria-expanded={Boolean(expandedCards.student)}
            onClick={() => toggleCard('student')}
            className="w-full px-5 py-4 flex items-center justify-between bg-white hover:bg-slate-50/50 transition cursor-pointer text-left border-b border-[#E2E8F0]"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-sm text-[#131B2E]">STUDENT PORTAL</h3>
                  <span className="text-[9px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">
                    {config.studentFeatures?.length || 0} Features Enabled
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B]">Configure academic and co-curricular permissions for enrolled students.</p>
              </div>
            </div>
            {expandedCards.student ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
          </button>

          {expandedCards.student && (
            <div className="p-5 space-y-4">
              {/* Access Restriction Level */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="font-bold text-xs text-[#131B2E] block">
                  Student access restrictions:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { id: 'full', label: 'Full student access', desc: 'Direct access to all student tools & messaging' },
                    { id: 'limited_academic', label: 'Limited academic access', desc: 'Academics, exams, homework & study material (Default)' },
                    { id: 'academic_only', label: 'Academic-only access', desc: 'Strict read-only study materials & timetable' },
                    { id: 'custom', label: 'Custom permissions', desc: 'Tailored permissions configured below' },
                  ].map((lvl) => {
                    const isSelected = config.studentAccessRestriction === lvl.id;
                    return (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => {
                          commitUpdate((prev) => ({
                            ...prev,
                            studentAccessRestriction: lvl.id as StudentAccessRestriction,
                          }));
                        }}
                        className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                          isSelected ? 'bg-indigo-50 border-[#4338CA] ring-1 ring-indigo-500/20' : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="font-bold text-xs text-[#131B2E] block">{lvl.label}</span>
                        <span className="text-[10px] text-slate-500 leading-tight block">{lvl.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-700">Select student features:</span>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setAllFeatures('studentFeatures', STUDENT_FEATURES.map((f) => f.id), true)}
                    className="text-[10px] font-bold text-[#4338CA] hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setAllFeatures('studentFeatures', STUDENT_FEATURES.map((f) => f.id), false)}
                    className="text-[10px] font-bold text-slate-500 hover:underline"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {STUDENT_FEATURES.map((feat) => {
                  const isChecked = config.studentFeatures?.includes(feat.id) ?? true;
                  return (
                    <label
                      key={feat.id}
                      className={`p-2.5 rounded-xl border flex items-start space-x-2.5 cursor-pointer transition ${
                        isChecked ? 'bg-indigo-50/30 border-indigo-200' : 'bg-white border-[#E2E8F0] hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleFeature('studentFeatures', feat.id)}
                        className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-[#4338CA] focus:ring-indigo-500 cursor-pointer"
                      />
                      <div>
                        <span className="font-bold text-xs text-[#131B2E] block">{feat.label}</span>
                        <span className="text-[10px] text-[#64748B] leading-tight block">{feat.description}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── 7. TEACHER / STAFF PORTAL ─── */}
      {config.portals?.teacher === 'enabled' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden">
          <button
            type="button"
            aria-expanded={Boolean(expandedCards.teacher)}
            onClick={() => toggleCard('teacher')}
            className="w-full px-5 py-4 flex items-center justify-between bg-white hover:bg-slate-50/50 transition cursor-pointer text-left border-b border-[#E2E8F0]"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-sm text-[#131B2E]">TEACHER / STAFF PORTAL</h3>
                  <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    {config.teacherFeatures?.length || 0} Features Enabled
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B]">Configure instructional and daily operations features for teaching faculty.</p>
              </div>
            </div>
            {expandedCards.teacher ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
          </button>

          {expandedCards.teacher && (
            <div className="p-5 space-y-4">
              {/* Permission Levels */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="font-bold text-xs text-[#131B2E] block">
                  Staff permission level (non-destructive baseline):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { id: 'view_only', label: 'View only', desc: 'Read schedules and student rosters without edit rights' },
                    { id: 'view_create', label: 'View + Create', desc: 'Create daily assignments and homework tasks' },
                    { id: 'view_create_edit', label: 'View + Create + Edit', desc: 'Mark attendance, edit marks and upload lessons (Recommended)' },
                    { id: 'full', label: 'Full permission', desc: 'Unrestricted departmental staff privileges' },
                  ].map((perm) => {
                    const isSelected = config.teacherPermissionLevel === perm.id;
                    return (
                      <button
                        key={perm.id}
                        type="button"
                        onClick={() => {
                          commitUpdate((prev) => ({
                            ...prev,
                            teacherPermissionLevel: perm.id as TeacherPermissionLevel,
                          }));
                        }}
                        className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                          isSelected ? 'bg-indigo-50 border-[#4338CA] ring-1 ring-indigo-500/20' : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="font-bold text-xs text-[#131B2E] block">{perm.label}</span>
                        <span className="text-[10px] text-slate-500 leading-tight block">{perm.desc}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 italic">
                  Safety Guard: Destructive permissions (bulk record deletion or fee tariff modifications) are restricted to Administrator roles.
                </p>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-700">Select faculty features:</span>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setAllFeatures('teacherFeatures', TEACHER_FEATURES.map((f) => f.id), true)}
                    className="text-[10px] font-bold text-[#4338CA] hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setAllFeatures('teacherFeatures', TEACHER_FEATURES.map((f) => f.id), false)}
                    className="text-[10px] font-bold text-slate-500 hover:underline"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {TEACHER_FEATURES.map((feat) => {
                  const isChecked = config.teacherFeatures?.includes(feat.id) ?? true;
                  return (
                    <label
                      key={feat.id}
                      className={`p-2.5 rounded-xl border flex items-start space-x-2.5 cursor-pointer transition ${
                        isChecked ? 'bg-indigo-50/30 border-indigo-200' : 'bg-white border-[#E2E8F0] hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleFeature('teacherFeatures', feat.id)}
                        className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-[#4338CA] focus:ring-indigo-500 cursor-pointer"
                      />
                      <div>
                        <span className="font-bold text-xs text-[#131B2E] block">{feat.label}</span>
                        <span className="text-[10px] text-[#64748B] leading-tight block">{feat.description}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── 8. ADMINISTRATOR PORTAL ─── */}
      {config.portals?.administrator === 'enabled' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden">
          <button
            type="button"
            aria-expanded={Boolean(expandedCards.admin)}
            onClick={() => toggleCard('admin')}
            className="w-full px-5 py-4 flex items-center justify-between bg-white hover:bg-slate-50/50 transition cursor-pointer text-left border-b border-[#E2E8F0]"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#4338CA] flex items-center justify-center font-bold">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-sm text-[#131B2E]">ADMINISTRATOR PORTAL</h3>
                  <span className="text-[9px] font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-full">
                    {config.administratorFeatures?.length || 0} Modules Active
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B]">Central management &amp; core administrative workspace.</p>
              </div>
            </div>
            {expandedCards.admin ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
          </button>

          {expandedCards.admin && (
            <div className="p-5 space-y-4">
              <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center justify-between text-blue-900">
                <span className="text-[11px]">
                  Institutional RBAC, 2FA policies &amp; user management are canonical under <strong>Section 21 (Security &amp; Administrative Access)</strong>. This section defines administrator operational portal visibility only.
                </span>
                {onNavigateToSection && (
                  <button
                    type="button"
                    onClick={() => onNavigateToSection('securityPrivacy')}
                    className="text-[11px] font-bold text-blue-700 hover:underline shrink-0 ml-2"
                  >
                    View Section 21 &rarr;
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {ADMINISTRATOR_FEATURES.map((feat) => {
                  const isChecked = config.administratorFeatures?.includes(feat.id) ?? true;
                  return (
                    <label
                      key={feat.id}
                      className={`p-2.5 rounded-xl border flex items-start space-x-2.5 cursor-pointer transition ${
                        isChecked ? 'bg-indigo-50/30 border-indigo-200' : 'bg-white border-[#E2E8F0] hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleFeature('administratorFeatures', feat.id)}
                        className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-[#4338CA] focus:ring-indigo-500 cursor-pointer"
                      />
                      <div>
                        <span className="font-bold text-xs text-[#131B2E] block">{feat.label}</span>
                        <span className="text-[10px] text-[#64748B] leading-tight block">{feat.description}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── 9. PRINCIPAL / MANAGEMENT PORTAL ─── */}
      {config.portals?.management === 'enabled' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden">
          <button
            type="button"
            aria-expanded={Boolean(expandedCards.management)}
            onClick={() => toggleCard('management')}
            className="w-full px-5 py-4 flex items-center justify-between bg-white hover:bg-slate-50/50 transition cursor-pointer text-left border-b border-[#E2E8F0]"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-sm text-[#131B2E]">MANAGEMENT DASHBOARD</h3>
                  <span className="text-[9px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full">
                    Executive Analytics
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B]">Consolidated executive oversight for Principal and School Management.</p>
              </div>
            </div>
            {expandedCards.management ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
          </button>

          {expandedCards.management && (
            <div className="p-5 space-y-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="font-bold text-xs text-[#131B2E] block">
                  Dashboard visibility mode:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
                  {[
                    { id: 'full', label: 'Full dashboard', desc: 'All academic, financial and facility metrics' },
                    { id: 'summary', label: 'Summary dashboard', desc: 'High-level institutional health KPIs (Default)' },
                    { id: 'financial_academic', label: 'Financial + Academic', desc: 'Revenue collections & student exam scores' },
                    { id: 'academic_only', label: 'Academic only', desc: 'Curriculum progress & attendance rates' },
                    { id: 'custom', label: 'Custom', desc: 'Custom configured widgets' },
                  ].map((mode) => {
                    const isSelected = config.managementDashboardVisibility === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => {
                          commitUpdate((prev) => ({
                            ...prev,
                            managementDashboardVisibility: mode.id as ManagementDashboardVisibility,
                          }));
                        }}
                        className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                          isSelected ? 'bg-indigo-50 border-[#4338CA] ring-1 ring-indigo-500/20' : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="font-bold text-xs text-[#131B2E] block">{mode.label}</span>
                        <span className="text-[10px] text-slate-500 leading-tight block">{mode.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {MANAGEMENT_FEATURES.map((feat) => {
                  const isChecked = config.managementFeatures?.includes(feat.id) ?? true;
                  return (
                    <label
                      key={feat.id}
                      className={`p-2.5 rounded-xl border flex items-start space-x-2.5 cursor-pointer transition ${
                        isChecked ? 'bg-indigo-50/30 border-indigo-200' : 'bg-white border-[#E2E8F0] hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleFeature('managementFeatures', feat.id)}
                        className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-[#4338CA] focus:ring-indigo-500 cursor-pointer"
                      />
                      <div>
                        <span className="font-bold text-xs text-[#131B2E] block">{feat.label}</span>
                        <span className="text-[10px] text-[#64748B] leading-tight block">{feat.description}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── 10. FINANCE / ACCOUNTING PORTAL ─── */}
      {config.portals?.finance === 'enabled' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden">
          <button
            type="button"
            aria-expanded={Boolean(expandedCards.finance)}
            onClick={() => toggleCard('finance')}
            className="w-full px-5 py-4 flex items-center justify-between bg-white hover:bg-slate-50/50 transition cursor-pointer text-left border-b border-[#E2E8F0]"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-sm text-[#131B2E]">FINANCE / ACCOUNTING PORTAL</h3>
                  <span className="text-[9px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full">
                    {config.financeFeatures?.length || 0} Modules Active
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B]">Bursar counter, fee reconciliation, and ledger configuration.</p>
              </div>
            </div>
            {expandedCards.finance ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
          </button>

          {expandedCards.finance && (
            <div className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-[11px] leading-relaxed">
                Sensitive financial data (gross school revenue, fee concession authorization, and bank payouts) is strictly isolated and never visible to non-finance users, adhering to Section 21 security policies.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {FINANCE_FEATURES.map((feat) => {
                  const isChecked = config.financeFeatures?.includes(feat.id) ?? true;
                  return (
                    <label
                      key={feat.id}
                      className={`p-2.5 rounded-xl border flex items-start space-x-2.5 cursor-pointer transition ${
                        isChecked ? 'bg-indigo-50/30 border-indigo-200' : 'bg-white border-[#E2E8F0] hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleFeature('financeFeatures', feat.id)}
                        className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-[#4338CA] focus:ring-indigo-500 cursor-pointer"
                      />
                      <div>
                        <span className="font-bold text-xs text-[#131B2E] block">{feat.label}</span>
                        <span className="text-[10px] text-[#64748B] leading-tight block">{feat.description}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── 11. TRANSPORT PORTAL (CONDITIONAL) ─── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden">
        <button
          type="button"
          aria-expanded={Boolean(expandedCards.transport)}
          onClick={() => toggleCard('transport')}
          className="w-full px-5 py-4 flex items-center justify-between bg-white hover:bg-slate-50/50 transition cursor-pointer text-left border-b border-[#E2E8F0]"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-700 flex items-center justify-center font-bold">
              <Bus className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm text-[#131B2E]">TRANSPORT PORTAL</h3>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    config.portals?.transport === 'enabled'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {config.portals?.transport === 'enabled' ? 'Active' : 'Optional / Not Configured'}
                </span>
              </div>
              <p className="text-[11px] text-[#64748B]">Fleet operations, live tracking, stops, and transit alerts.</p>
            </div>
          </div>
          {expandedCards.transport ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
        </button>

        {expandedCards.transport && (
          <div className="p-5 space-y-4">
            {!applicability.isTransportApplicable ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-slate-600">
                <span className="font-bold text-xs text-slate-800 block">Transport Facility Bypassed</span>
                <p className="text-[11px] leading-relaxed">
                  School transport was marked as not applicable or disabled in Section 14. You do not need to configure transport portal features. If your school introduces buses later, you can activate this portal anytime.
                </p>
                {onNavigateToSection && (
                  <button
                    type="button"
                    onClick={() => onNavigateToSection('transportConfig')}
                    className="text-[11px] font-bold text-[#4338CA] hover:underline pt-1 inline-block"
                  >
                    Review Section 14 (Transport Fleet) &rarr;
                  </button>
                )}
              </div>
            ) : config.portals?.transport === 'enabled' ? (
              <div className="space-y-4">
                <div className="p-3 bg-orange-50/70 border border-orange-200/80 rounded-xl text-orange-950 text-[11px] leading-relaxed">
                  Live bus tracking integrates directly with the Section 14 fleet configuration, supporting vehicle GPS hardware or smartphone-based driver tracking.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {TRANSPORT_FEATURES.map((feat) => {
                    const isChecked = config.transportFeatures?.includes(feat.id) ?? true;
                    return (
                      <label
                        key={feat.id}
                        className={`p-2.5 rounded-xl border flex items-start space-x-2.5 cursor-pointer transition ${
                          isChecked ? 'bg-orange-50/30 border-orange-200' : 'bg-white border-[#E2E8F0] hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleFeature('transportFeatures', feat.id)}
                          className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                        />
                        <div>
                          <span className="font-bold text-xs text-[#131B2E] block">{feat.label}</span>
                          <span className="text-[10px] text-[#64748B] leading-tight block">{feat.description}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-[11px]">
                Transport portal is currently set to &ldquo;{config.portals?.transport}&rdquo;. To configure feature visibility, enable it under Portal User Groups above.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── 12. HOSTEL PORTAL (CONDITIONAL) ─── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden">
        <button
          type="button"
          aria-expanded={Boolean(expandedCards.hostel)}
          onClick={() => toggleCard('hostel')}
          className="w-full px-5 py-4 flex items-center justify-between bg-white hover:bg-slate-50/50 transition cursor-pointer text-left border-b border-[#E2E8F0]"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
              <Home className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm text-[#131B2E]">HOSTEL / RESIDENTIAL PORTAL</h3>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    !applicability.isHostelApplicable
                      ? 'bg-slate-100 text-slate-600'
                      : config.portals?.hostel === 'enabled'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {!applicability.isHostelApplicable ? 'Not Applicable (Day School)' : config.portals?.hostel === 'enabled' ? 'Active' : 'Optional'}
                </span>
              </div>
              <p className="text-[11px] text-[#64748B]">Boarding dorms, bed allocation, warden contacts &amp; curfews.</p>
            </div>
          </div>
          {expandedCards.hostel ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
        </button>

        {expandedCards.hostel && (
          <div className="p-5 space-y-4">
            {!applicability.isHostelApplicable ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-slate-600">
                <span className="font-bold text-xs text-slate-800 block">Hostel Portal Not Applicable</span>
                <p className="text-[11px] leading-relaxed">
                  Your school profile is marked as a <strong>Day School</strong> in Section 1, and hostel boarding is disabled in Section 17. The Hostel Portal is marked <em>Not Applicable</em> and will not reduce your section completion percentage.
                </p>
              </div>
            ) : config.portals?.hostel === 'enabled' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {HOSTEL_FEATURES.map((feat) => {
                  const isChecked = config.hostelFeatures?.includes(feat.id) ?? true;
                  return (
                    <label
                      key={feat.id}
                      className={`p-2.5 rounded-xl border flex items-start space-x-2.5 cursor-pointer transition ${
                        isChecked ? 'bg-rose-50/30 border-rose-200' : 'bg-white border-[#E2E8F0] hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleFeature('hostelFeatures', feat.id)}
                        className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                      />
                      <div>
                        <span className="font-bold text-xs text-[#131B2E] block">{feat.label}</span>
                        <span className="text-[10px] text-[#64748B] leading-tight block">{feat.description}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-[11px]">
                Hostel portal is currently disabled.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── 13. LIBRARY PORTAL ─── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden">
        <button
          type="button"
          aria-expanded={Boolean(expandedCards.library)}
          onClick={() => toggleCard('library')}
          className="w-full px-5 py-4 flex items-center justify-between bg-white hover:bg-slate-50/50 transition cursor-pointer text-left border-b border-[#E2E8F0]"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold">
              <LibraryIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm text-[#131B2E]">LIBRARY PORTAL</h3>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    !applicability.isLibraryApplicable
                      ? 'bg-slate-100 text-slate-600'
                      : config.portals?.library === 'enabled'
                      ? 'bg-cyan-100 text-cyan-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {!applicability.isLibraryApplicable
                    ? 'Not Applicable (Disabled in Sec 16)'
                    : config.portals?.library === 'enabled'
                    ? 'Active'
                    : 'Optional'}
                </span>
              </div>
              <p className="text-[11px] text-[#64748B]">Digital book search, borrowing history, and circulation management.</p>
            </div>
          </div>
          {expandedCards.library ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
        </button>

        {expandedCards.library && (
          <div className="p-5 space-y-4">
            {!applicability.isLibraryApplicable ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-slate-600">
                <span className="font-bold text-xs text-slate-800 block">Library Portal Not Applicable</span>
                <p className="text-[11px] leading-relaxed">
                  Library management is disabled in Section 16. The Library Portal is marked <em>Not Required</em> and will not reduce your section completion percentage.
                </p>
                {onNavigateToSection && (
                  <button
                    type="button"
                    onClick={() => onNavigateToSection('libraryConfig')}
                    className="text-[11px] font-semibold text-cyan-700 hover:text-cyan-900 cursor-pointer inline-flex items-center space-x-1"
                  >
                    <span>Review Section 16 (Library Config) &rarr;</span>
                  </button>
                )}
              </div>
            ) : config.portals?.library === 'enabled' ? (
              <>
                {/* Library User Group Visibility */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <label className="font-bold text-xs text-[#131B2E] block">
                    Who can access the library portal &amp; catalogue?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['student', 'parent', 'teacher', 'librarian', 'administrator'] as const).map((role) => {
                      const isVisible = (config.libraryVisibilityRoles || []).includes(role);
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => {
                            commitUpdate((prev) => {
                              const current = prev.libraryVisibilityRoles || ['student', 'parent', 'teacher', 'librarian', 'administrator'];
                              const next = current.includes(role)
                                ? current.filter((r) => r !== role)
                                : [...current, role];
                              return { ...prev, libraryVisibilityRoles: next };
                            });
                          }}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold capitalize transition cursor-pointer flex items-center space-x-1.5 ${
                            isVisible
                              ? 'bg-cyan-50 border-cyan-300 text-cyan-900 shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          {isVisible ? <Check className="w-3.5 h-3.5 text-cyan-700" /> : <div className="w-3.5 h-3.5" />}
                          <span>{role}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  {LIBRARY_FEATURES.map((feat) => {
                    const isChecked = config.libraryFeatures?.includes(feat.id) ?? true;
                    return (
                      <label
                        key={feat.id}
                        className={`p-2.5 rounded-xl border flex items-start space-x-2.5 cursor-pointer transition ${
                          isChecked ? 'bg-cyan-50/30 border-cyan-200' : 'bg-white border-[#E2E8F0] hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleFeature('libraryFeatures', feat.id)}
                          className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                        />
                        <div>
                          <span className="font-bold text-xs text-[#131B2E] block">{feat.label}</span>
                          <span className="text-[10px] text-[#64748B] leading-tight block">{feat.description}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-[11px]">
                Library portal is currently set to &ldquo;{config.portals?.library || 'not_required'}&rdquo;. To configure feature visibility, enable it under Portal User Groups above.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── 14. DASHBOARD CONFIGURATION ─── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden">
        <button
          type="button"
          aria-expanded={Boolean(expandedCards.dashboard)}
          onClick={() => toggleCard('dashboard')}
          className="w-full px-5 py-4 flex items-center justify-between bg-white hover:bg-slate-50/50 transition cursor-pointer text-left border-b border-[#E2E8F0]"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#4338CA] flex items-center justify-center font-bold">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#131B2E]">DASHBOARD VISIBILITY</h3>
              <p className="text-[11px] text-[#64748B]">Configure dashboard widgets visibility for each user group.</p>
            </div>
          </div>
          {expandedCards.dashboard ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
        </button>

        {expandedCards.dashboard && (
          <div className="p-5 space-y-4">
            <p className="text-[11px] text-slate-600">
              Select which widgets should appear on the homepage dashboard for parents, students, teachers, and leadership.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {DASHBOARD_WIDGETS.map((widget) => {
                return (
                  <div key={widget.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-[#131B2E]">{widget.label}</span>
                    </div>
                    <p className="text-[10px] text-slate-500">{widget.description}</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(['parent', 'student', 'teacher', 'management'] as const).map((role) => {
                        const isVisible = (config.dashboardVisibility?.[role] || []).includes(widget.id);
                        return (
                          <button
                            key={role}
                            type="button"
                            onClick={() => {
                              commitUpdate((prev) => {
                                const currentWidgets = prev.dashboardVisibility?.[role] || [];
                                const nextWidgets = isVisible
                                  ? currentWidgets.filter((w) => w !== widget.id)
                                  : [...currentWidgets, widget.id];
                                return {
                                  ...prev,
                                  dashboardVisibility: {
                                    ...(prev.dashboardVisibility || {}),
                                    [role]: nextWidgets,
                                  },
                                };
                              });
                            }}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold capitalize transition cursor-pointer ${
                              isVisible
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            {role}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── 15. NOTIFICATION CENTER & PRIORITIES ─── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden">
        <button
          type="button"
          aria-expanded={Boolean(expandedCards.notificationCenter)}
          onClick={() => toggleCard('notificationCenter')}
          className="w-full px-5 py-4 flex items-center justify-between bg-white hover:bg-slate-50/50 transition cursor-pointer text-left border-b border-[#E2E8F0]"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#4338CA] flex items-center justify-center font-bold">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#131B2E]">NOTIFICATION CENTER</h3>
              <p className="text-[11px] text-[#64748B]">In-app notifications, history, read/unread states and priority levels.</p>
            </div>
          </div>
          {expandedCards.notificationCenter ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
        </button>

        {expandedCards.notificationCenter && (
          <div className="p-5 space-y-5">
            {/* Notification Center Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'inAppEnabled', label: 'In-app notifications', desc: 'Real-time badge counter & popover in app' },
                { id: 'readUnreadStateEnabled', label: 'Read/unread state tracking', desc: 'Sync read receipts across web & mobile devices' },
                { id: 'priorityLevelsEnabled', label: 'Priority level tagging', desc: 'Tag notifications with urgency classifications' },
              ].map((feat) => {
                const isChecked = config.notificationCenter?.[feat.id as keyof typeof config.notificationCenter] ?? true;
                return (
                  <label
                    key={feat.id}
                    className={`p-3 rounded-xl border flex items-start space-x-2.5 cursor-pointer transition ${
                      isChecked ? 'bg-indigo-50/30 border-indigo-200' : 'bg-white border-[#E2E8F0]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(isChecked)}
                      onChange={(e) => {
                        commitUpdate((prev) => ({
                          ...prev,
                          notificationCenter: {
                            ...(prev.notificationCenter || {}),
                            [feat.id]: e.target.checked,
                          },
                        }));
                      }}
                      className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-[#4338CA] focus:ring-indigo-500 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-xs text-[#131B2E] block">{feat.label}</span>
                      <span className="text-[10px] text-[#64748B] leading-tight block">{feat.desc}</span>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Notification Priority Showcase */}
            <div className="space-y-2">
              <label className="font-bold text-xs text-[#131B2E] block">
                Notification Priority Levels:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                {NOTIFICATION_PRIORITIES.map((prio) => (
                  <div key={prio.id} className={`p-3 rounded-xl border ${prio.colorClasses} space-y-1`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">{prio.label}</span>
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-white/70">
                        {prio.badge}
                      </span>
                    </div>
                    <p className="text-[10px] leading-tight opacity-90">{prio.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── 16. NOTIFICATION TYPES & CATEGORIES ─── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden">
        <button
          type="button"
          aria-expanded={Boolean(expandedCards.notificationCategories)}
          onClick={() => toggleCard('notificationCategories')}
          className="w-full px-5 py-4 flex items-center justify-between bg-white hover:bg-slate-50/50 transition cursor-pointer text-left border-b border-[#E2E8F0]"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#4338CA] flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#131B2E]">NOTIFICATION TYPES</h3>
              <p className="text-[11px] text-[#64748B]">Automated trigger events categorized across operational modules.</p>
            </div>
          </div>
          {expandedCards.notificationCategories ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
        </button>

        {expandedCards.notificationCategories && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(NOTIFICATION_CATEGORIES_TREE).map(([catKey, cat]) => {
                // If hostel or transport is not applicable, skip or mark
                if (catKey === 'hostel' && !applicability.isHostelApplicable) return null;
                if (catKey === 'transport' && !applicability.isTransportApplicable) return null;

                const activeItems: string[] =
                  (config.notifications?.categories?.[catKey as keyof typeof NOTIFICATION_CATEGORIES_TREE] as string[]) ||
                  [...cat.items];

                return (
                  <div key={catKey} className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-2">
                    <span className="font-bold text-xs text-[#131B2E] block">{cat.label}</span>
                    <div className="space-y-1.5">
                      {cat.items.map((item) => {
                        const isChecked = activeItems.includes(item);
                        return (
                          <label key={item} className="flex items-center space-x-2 text-[11px] cursor-pointer text-slate-700">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                commitUpdate((prev) => {
                                  const current =
                                    (prev.notifications?.categories?.[catKey as keyof typeof NOTIFICATION_CATEGORIES_TREE] as string[]) ||
                                    [...cat.items];
                                  const next = isChecked
                                    ? current.filter((i) => i !== item)
                                    : [...current, item];
                                  return {
                                    ...prev,
                                    notifications: {
                                      ...(prev.notifications || {}),
                                      categories: {
                                        ...(prev.notifications?.categories || {}),
                                        [catKey]: next,
                                      },
                                    },
                                  };
                                });
                              }}
                              className="h-3.5 w-3.5 rounded-sm border-slate-300 text-[#4338CA] focus:ring-indigo-500"
                            />
                            <span>{item}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── 17. NOTIFICATION CHANNELS & RECIPIENTS ─── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden">
        <button
          type="button"
          aria-expanded={Boolean(expandedCards.notificationChannels)}
          onClick={() => toggleCard('notificationChannels')}
          className="w-full px-5 py-4 flex items-center justify-between bg-white hover:bg-slate-50/50 transition cursor-pointer text-left border-b border-[#E2E8F0]"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#4338CA] flex items-center justify-center font-bold">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#131B2E]">NOTIFICATION CHANNELS &amp; RECIPIENTS</h3>
              <p className="text-[11px] text-[#64748B]">Select desired notification channels and authorized user audiences.</p>
            </div>
          </div>
          {expandedCards.notificationChannels ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
        </button>

        {expandedCards.notificationChannels && (
          <div className="p-5 space-y-5">
            {/* Delivery Channels */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#131B2E]">Active notification delivery channels:</span>
                <span className="text-[10px] text-slate-500">Credentials managed in Section 16</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
                {NOTIFICATION_CHANNELS.map((ch) => {
                  const isChecked = Boolean((config.notifications as any)?.[ch.id]);
                  return (
                    <label
                      key={ch.id}
                      className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition ${
                        isChecked ? 'bg-indigo-50/40 border-indigo-200 ring-1 ring-indigo-200' : 'bg-white border-[#E2E8F0]'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-bold text-xs text-[#131B2E]">{ch.label}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            commitUpdate((prev) => ({
                              ...prev,
                              notifications: {
                                ...(prev.notifications || {}),
                                [ch.id]: e.target.checked,
                              },
                            }));
                          }}
                          className="h-4 w-4 rounded-md border-slate-300 text-[#4338CA] focus:ring-indigo-500 cursor-pointer"
                        />
                      </div>
                      <span className="text-[10px] text-[#64748B] leading-tight mt-1">{ch.description}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Recipients */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="font-bold text-xs text-[#131B2E] block">WHO SHOULD RECEIVE NOTIFICATIONS?</span>
              <div className="flex flex-wrap gap-2">
                {NOTIFICATION_RECIPIENTS.map((rec) => {
                  // Skip irrelevant recipients for disabled portals
                  if (rec.id === 'transport' && !applicability.isTransportApplicable) return null;
                  if (rec.id === 'hostel' && !applicability.isHostelApplicable) return null;

                  const isChecked = (config.notifications?.recipients || []).includes(rec.id);
                  return (
                    <button
                      key={rec.id}
                      type="button"
                      onClick={() => {
                        commitUpdate((prev) => {
                          const curr = prev.notifications?.recipients || [];
                          const next = isChecked ? curr.filter((r) => r !== rec.id) : [...curr, rec.id];
                          return {
                            ...prev,
                            notifications: {
                              ...(prev.notifications || {}),
                              recipients: next,
                            },
                          };
                        });
                      }}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                        isChecked
                          ? 'bg-indigo-50 border-[#4338CA] text-indigo-950 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {isChecked ? <Check className="w-3.5 h-3.5 text-[#4338CA]" /> : <div className="w-3.5 h-3.5" />}
                      <span>{rec.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── 18. EMERGENCY & CRITICAL ALERTS (PROMINENT) ─── */}
      <div className="bg-white border-2 border-rose-200 rounded-2xl shadow-xs overflow-hidden">
        <button
          type="button"
          aria-expanded={Boolean(expandedCards.emergency)}
          onClick={() => toggleCard('emergency')}
          className="w-full px-5 py-4 flex items-center justify-between bg-rose-50/30 hover:bg-rose-50/60 transition cursor-pointer text-left border-b border-rose-200"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold shadow-2xs">
              <ShieldAlert className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-sm text-rose-950">EMERGENCY &amp; CRITICAL ALERTS</h3>
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-rose-800 bg-rose-200/80 px-2 py-0.5 rounded-full">
                  High Priority Safety
                </span>
              </div>
              <p className="text-[11px] text-rose-800/80">Campus lockdown, severe weather, medical incidents, and emergency broadcast rules.</p>
            </div>
          </div>
          {expandedCards.emergency ? <ChevronUp className="w-4 h-4 text-rose-800" /> : <ChevronDown className="w-4 h-4 text-rose-800" />}
        </button>

        {expandedCards.emergency && (
          <div className="p-5 space-y-5">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-[11px] leading-relaxed flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Institutional Override Policy:</span>
                Emergency notifications may bypass normal notification preferences when enabled by authorized administrators to safeguard student and faculty welfare.
              </div>
            </div>

            {/* Emergency Channels */}
            <div className="space-y-2">
              <span className="font-bold text-xs text-[#131B2E] block">Emergency Broadcast Channels:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
                {EMERGENCY_CHANNELS.map((ech) => {
                  const isChecked = (config.emergencyNotifications?.channels || []).includes(ech.id);
                  return (
                    <label
                      key={ech.id}
                      className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition ${
                        isChecked ? 'bg-rose-50/50 border-rose-300 ring-1 ring-rose-200' : 'bg-white border-[#E2E8F0]'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-bold text-xs text-[#131B2E]">{ech.label}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            commitUpdate((prev) => {
                              const curr = prev.emergencyNotifications?.channels || [];
                              const next = isChecked ? curr.filter((c) => c !== ech.id) : [...curr, ech.id];
                              return {
                                ...prev,
                                emergencyNotifications: {
                                  ...(prev.emergencyNotifications || {}),
                                  channels: next,
                                },
                              };
                            });
                          }}
                          className="h-4 w-4 rounded-md border-rose-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                        />
                      </div>
                      <span className="text-[10px] text-[#64748B] leading-tight mt-1">{ech.description}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Emergency Events */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="font-bold text-xs text-[#131B2E] block">Recognized Emergency Event Classifications:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {EMERGENCY_EVENTS.map((ev) => {
                  const isChecked = (config.emergencyNotifications?.eventTypes || []).includes(ev.id);
                  return (
                    <label
                      key={ev.id}
                      className={`p-2 rounded-lg border flex items-start space-x-2 cursor-pointer transition ${
                        isChecked ? 'bg-slate-50 border-slate-300' : 'bg-white border-slate-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          commitUpdate((prev) => {
                            const curr = prev.emergencyNotifications?.eventTypes || [];
                            const next = isChecked ? curr.filter((e) => e !== ev.id) : [...curr, ev.id];
                            return {
                              ...prev,
                              emergencyNotifications: {
                                ...(prev.emergencyNotifications || {}),
                                eventTypes: next,
                              },
                            };
                          });
                        }}
                        className="mt-0.5 h-3.5 w-3.5 rounded-sm border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                      />
                      <div>
                        <span className="font-semibold text-xs text-slate-800 block">{ev.label}</span>
                        <span className="text-[10px] text-slate-500 leading-tight block">{ev.description}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── 19. ANNOUNCEMENTS & CIRCULARS ─── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden">
        <button
          type="button"
          aria-expanded={Boolean(expandedCards.announcements)}
          onClick={() => toggleCard('announcements')}
          className="w-full px-5 py-4 flex items-center justify-between bg-white hover:bg-slate-50/50 transition cursor-pointer text-left border-b border-[#E2E8F0]"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#4338CA] flex items-center justify-center font-bold">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#131B2E]">ANNOUNCEMENTS &amp; CIRCULARS</h3>
              <p className="text-[11px] text-[#64748B]">Configure publishing roles, approval policies, audience targeting &amp; scheduling.</p>
            </div>
          </div>
          {expandedCards.announcements ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
        </button>

        {expandedCards.announcements && (
          <div className="p-5 space-y-5">
            {/* Who Can Publish */}
            <div className="space-y-2">
              <span className="font-bold text-xs text-[#131B2E] block">Who can publish announcements?</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {ANNOUNCEMENT_PUBLISHERS.map((pub) => {
                  const isChecked = (config.announcements?.publishers || []).includes(pub.id);
                  return (
                    <label
                      key={pub.id}
                      className={`p-2.5 rounded-xl border flex items-start space-x-2.5 cursor-pointer transition ${
                        isChecked ? 'bg-indigo-50/40 border-indigo-200' : 'bg-white border-[#E2E8F0]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          commitUpdate((prev) => {
                            const curr = prev.announcements?.publishers || [];
                            const next = isChecked ? curr.filter((p) => p !== pub.id) : [...curr, pub.id];
                            return {
                              ...prev,
                              announcements: {
                                ...(prev.announcements || {}),
                                publishers: next,
                              },
                            };
                          });
                        }}
                        className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-[#4338CA] focus:ring-indigo-500 cursor-pointer"
                      />
                      <div>
                        <span className="font-bold text-xs text-[#131B2E] block">{pub.label}</span>
                        <span className="text-[10px] text-[#64748B] leading-tight block">{pub.description}</span>
                      </div>
                    </label>
                  );
                })}
              </div>

              {(config.announcements?.publishers || []).includes('custom') && (
                <div className="pt-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Specify Custom Authorized Role *</label>
                  <input
                    type="text"
                    value={config.announcements?.customPublisherRole || ''}
                    onChange={(e) => {
                      commitUpdate((prev) => ({
                        ...prev,
                        announcements: {
                          ...(prev.announcements || {}),
                          customPublisherRole: e.target.value,
                        },
                      }));
                    }}
                    placeholder="e.g. Sports Coordinator, Chief Librarian, Admission Counselor"
                    className="w-full sm:w-1/2 px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              )}
            </div>

            {/* Approval Workflow */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="font-bold text-xs text-[#131B2E] block">Announcement Approval Policy:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                {ANNOUNCEMENT_APPROVAL_POLICIES.map((pol) => {
                  const isSelected = config.announcements?.approvalPolicy === pol.id;
                  return (
                    <button
                      key={pol.id}
                      type="button"
                      onClick={() => {
                        commitUpdate((prev) => ({
                          ...prev,
                          announcements: {
                            ...(prev.announcements || {}),
                            approvalPolicy: pol.id,
                          },
                        }));
                      }}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        isSelected ? 'bg-indigo-50 border-[#4338CA] ring-1 ring-indigo-500/20' : 'bg-white border-[#E2E8F0] hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-[#131B2E]">{pol.label}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-[#4338CA]" />}
                        </div>
                        <p className="text-[10px] text-[#64748B] leading-tight">{pol.description}</p>
                      </div>
                      {pol.badge && (
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full w-fit mt-2">
                          {pol.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scheduling & Pinning */}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'schedulingEnabled', label: 'Schedule publication', desc: 'Schedule circular release at future date/time' },
                { id: 'expiryEnabled', label: 'Schedule expiry', desc: 'Automatically unpublish after event date passes' },
                { id: 'pinImportant', label: 'Pin important announcement', desc: 'Pin urgent circulars to top of student/parent feed' },
              ].map((item) => {
                const isChecked = config.announcements?.[item.id as keyof typeof config.announcements] ?? true;
                return (
                  <label
                    key={item.id}
                    className={`p-3 rounded-xl border flex items-start space-x-2.5 cursor-pointer transition ${
                      isChecked ? 'bg-indigo-50/30 border-indigo-200' : 'bg-white border-[#E2E8F0]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(isChecked)}
                      onChange={(e) => {
                        commitUpdate((prev) => ({
                          ...prev,
                          announcements: {
                            ...(prev.announcements || {}),
                            [item.id]: e.target.checked,
                          },
                        }));
                      }}
                      className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-[#4338CA] focus:ring-indigo-500 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-xs text-[#131B2E] block">{item.label}</span>
                      <span className="text-[10px] text-[#64748B] leading-tight block">{item.desc}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── 20. USER NOTIFICATION PREFERENCES ─── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden">
        <button
          type="button"
          aria-expanded={Boolean(expandedCards.userPreferences)}
          onClick={() => toggleCard('userPreferences')}
          className="w-full px-5 py-4 flex items-center justify-between bg-white hover:bg-slate-50/50 transition cursor-pointer text-left border-b border-[#E2E8F0]"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#4338CA] flex items-center justify-center font-bold">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#131B2E]">USER NOTIFICATION PREFERENCES</h3>
              <p className="text-[11px] text-[#64748B]">Permit parents and staff to opt-out of select non-essential alerts.</p>
            </div>
          </div>
          {expandedCards.userPreferences ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
        </button>

        {expandedCards.userPreferences && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'allowAcademic', label: 'Receive academic notifications', desc: 'Homework and syllabus alerts' },
                { id: 'allowFees', label: 'Receive fee notifications', desc: 'Due date invoices and payment receipts' },
                { id: 'allowAttendance', label: 'Receive attendance notifications', desc: 'Daily morning attendance confirmations' },
                { id: 'allowTransport', label: 'Receive transport notifications', desc: 'Bus stop approach and route alerts' },
                { id: 'allowEvents', label: 'Receive event notifications', desc: 'Sports day and festival announcements' },
                { id: 'allowAnnouncements', label: 'Receive announcements', desc: 'General circulars and news' },
              ].map((pref) => {
                const isChecked = config.userPreferences?.[pref.id as keyof typeof config.userPreferences] ?? true;
                return (
                  <label
                    key={pref.id}
                    className={`p-3 rounded-xl border flex items-start space-x-2.5 cursor-pointer transition ${
                      isChecked ? 'bg-indigo-50/30 border-indigo-200' : 'bg-white border-[#E2E8F0]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(isChecked)}
                      onChange={(e) => {
                        commitUpdate((prev) => ({
                          ...prev,
                          userPreferences: {
                            ...(prev.userPreferences || {}),
                            [pref.id]: e.target.checked,
                          },
                        }));
                      }}
                      className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-[#4338CA] focus:ring-indigo-500 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-xs text-[#131B2E] block">{pref.label}</span>
                      <span className="text-[10px] text-[#64748B] leading-tight block">{pref.desc}</span>
                    </div>
                  </label>
                );
              })}

              {/* Locked Emergency Alert */}
              <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/40 flex items-start space-x-2.5">
                <Lock className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-xs text-rose-950">Receive emergency alerts</span>
                    <span className="text-[9px] font-extrabold uppercase bg-rose-200 text-rose-800 px-1.5 py-0.2 rounded-sm">
                      Mandatory
                    </span>
                  </div>
                  <span className="text-[10px] text-rose-800 leading-tight block mt-0.5">
                    Emergency alerts cannot be disabled by ordinary users if institutional policy requires mandatory emergency notifications.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── 21. PORTAL LANGUAGE & LOCALIZATION ─── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden">
        <button
          type="button"
          aria-expanded={Boolean(expandedCards.localization)}
          onClick={() => toggleCard('localization')}
          className="w-full px-5 py-4 flex items-center justify-between bg-white hover:bg-slate-50/50 transition cursor-pointer text-left border-b border-[#E2E8F0]"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#4338CA] flex items-center justify-center font-bold">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#131B2E]">PORTAL LANGUAGE &amp; LOCALIZATION</h3>
              <p className="text-[11px] text-[#64748B]">Select default language and optional regional multilingual preferences.</p>
            </div>
          </div>
          {expandedCards.localization ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
        </button>

        {expandedCards.localization && (
          <div className="p-5 space-y-4">
            <div className="space-y-2">
              <span className="font-bold text-xs text-[#131B2E] block">Default Portal Language:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                {PORTAL_LANGUAGES.map((lang) => {
                  const isSelected = config.localization?.defaultLanguage === lang.id;
                  return (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => {
                        commitUpdate((prev) => ({
                          ...prev,
                          localization: {
                            ...(prev.localization || {}),
                            defaultLanguage: lang.id,
                          },
                        }));
                      }}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        isSelected ? 'bg-indigo-50 border-[#4338CA] ring-1 ring-indigo-500/20' : 'bg-white border-[#E2E8F0] hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-[#131B2E]">{lang.label}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[#4338CA]" />}
                      </div>
                      <p className="text-[10px] text-[#64748B] leading-tight">{lang.description}</p>
                    </button>
                  );
                })}
              </div>

              {config.localization?.defaultLanguage === 'other' && (
                <div className="pt-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Specify Language Name *</label>
                  <input
                    type="text"
                    value={config.localization?.otherLanguageName || ''}
                    onChange={(e) => {
                      commitUpdate((prev) => ({
                        ...prev,
                        localization: {
                          ...(prev.localization || {}),
                          otherLanguageName: e.target.value,
                        },
                      }));
                    }}
                    placeholder="e.g. Marathi, Gujarati, Bengali, Urdu, Tamil"
                    className="w-full sm:w-1/2 px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── 22. PORTAL ACCESS CHANNELS ─── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden">
        <button
          type="button"
          aria-expanded={Boolean(expandedCards.accessChannels)}
          onClick={() => toggleCard('accessChannels')}
          className="w-full px-5 py-4 flex items-center justify-between bg-white hover:bg-slate-50/50 transition cursor-pointer text-left border-b border-[#E2E8F0]"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#4338CA] flex items-center justify-center font-bold">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#131B2E]">PORTAL ACCESS CHANNELS</h3>
              <p className="text-[11px] text-[#64748B]">Responsive Web, Android, iOS, and Progressive Web App availability.</p>
            </div>
          </div>
          {expandedCards.accessChannels ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
        </button>

        {expandedCards.accessChannels && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {ACCESS_CHANNELS.map((ch) => {
                const isChecked = Boolean(config.accessChannels?.[ch.id]);
                return (
                  <label
                    key={ch.id}
                    className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition ${
                      isChecked ? 'bg-indigo-50/40 border-indigo-200 ring-1 ring-indigo-200' : 'bg-white border-[#E2E8F0]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-bold text-xs text-[#131B2E]">{ch.label}</span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          commitUpdate((prev) => ({
                            ...prev,
                            accessChannels: {
                              ...(prev.accessChannels || {}),
                              [ch.id]: e.target.checked,
                            },
                          }));
                        }}
                        className="h-4 w-4 rounded-md border-slate-300 text-[#4338CA] focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>
                    <span className="text-[10px] text-[#64748B] leading-tight mt-1">{ch.description}</span>
                  </label>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400">
              Note: App store distribution, APK packaging, and push notification certificates are configured in <strong>Section 22 (Mobile Application Requirements)</strong>.
            </p>
          </div>
        )}
      </div>

      {/* ─── 23. PORTAL CONFIGURATION SUMMARY ─── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden">
        <button
          type="button"
          aria-expanded={Boolean(expandedCards.summary)}
          onClick={() => toggleCard('summary')}
          className="w-full px-5 py-4 flex items-center justify-between bg-slate-50/50 hover:bg-slate-100/50 transition cursor-pointer text-left border-b border-[#E2E8F0]"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#131B2E]">PORTAL CONFIGURATION SUMMARY</h3>
              <p className="text-[11px] text-[#64748B]">Real-time operational parameters for institutional provisioning.</p>
            </div>
          </div>
          {expandedCards.summary ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
        </button>

        {expandedCards.summary && (
          <div className="p-5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {summaryBullets.map((bullet, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center space-x-2 text-slate-800 text-[11px]">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-medium truncate">{bullet}</span>
                </div>
              ))}
            </div>

            {validation.missingFields.length > 0 && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                <span className="font-bold text-xs text-amber-900 block">Pending Items for 100% Completion:</span>
                <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-0.5">
                  {validation.missingFields.map((field, idx) => (
                    <li key={idx}>{field}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
