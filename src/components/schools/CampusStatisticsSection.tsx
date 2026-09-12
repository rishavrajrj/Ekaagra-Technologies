'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Building2,
  Users,
  GraduationCap,
  Briefcase,
  UserCheck,
  ChevronDown,
  Info,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Calendar,
  Layers,
  X,
  ExternalLink,
  RefreshCw,
  Pencil,
  ArrowRightLeft,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import type {
  UniversalIntakeData,
  FacilitiesData,
  StatCountSource,
} from '@/lib/types';
import type { IntakeSectionKey } from '@/lib/schoolIntake';
import {
  resolveCanonicalSession,
} from '@/lib/campusStatisticsUtils';
import {
  fetchErpCampusStatistics,
  compareCampusStatistics,
  applyErpStatistics,
  updateFieldManual,
  validateWholeNumber,
  checkStudentsCountWarning,
  formatSyncedAt,
  type ErpCampusStatistics,
  type ErpFieldComparison,
} from '@/lib/erpStatisticsUtils';
import ModalPortal from '@/components/ui/ModalPortal';

// ─────────────────────────────────────────────────────────────────────────────
// FIELD CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

interface StatFieldConfig {
  key: string;
  label: string;
  description: string;
  placeholder: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  tooltipTitle: string;
  tooltipContent: string;
  tooltipColor: string;
  required?: boolean;
  isHistorical?: boolean;
}

const STAT_FIELDS: StatFieldConfig[] = [
  {
    key: 'totalStudents',
    label: 'Total Students',
    description: 'All students ever admitted or registered by the institution.',
    placeholder: 'e.g. 10000',
    icon: <GraduationCap className="w-5 h-5" />,
    iconBg: 'bg-indigo-50',
    iconColor: 'text-[#4338CA]',
    tooltipTitle: 'Total Students Definition',
    tooltipContent:
      'Total number of unique students ever admitted or registered by the institution, including currently active, graduated, transferred, withdrawn, and historical students. This number never decreases when a student completes their course or leaves.',
    tooltipColor: 'text-amber-300',
  },
  {
    key: 'activeStudents',
    label: 'Active Students',
    description: 'Currently enrolled and active students.',
    placeholder: 'e.g. 8750',
    icon: <UserCheck className="w-5 h-5" />,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-700',
    tooltipTitle: 'Active Students Definition',
    tooltipContent:
      'The number of students currently enrolled and active. If a student withdraws, graduates, transfers out, or is deactivated, this figure should be updated accordingly.',
    tooltipColor: 'text-emerald-300',
  },
  {
    key: 'totalTeachers',
    label: 'Total Teachers / Faculty',
    description: 'Currently active teaching faculty and academic staff.',
    placeholder: 'e.g. 320',
    icon: <GraduationCap className="w-5 h-5" />,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-700',
    tooltipTitle: 'Teachers / Faculty Definition',
    tooltipContent:
      'Currently active teaching and academic faculty (PGT, TGT, PRT, NTT, Lecturers, Professors) serving the school.',
    tooltipColor: 'text-purple-300',
  },
  {
    key: 'totalNonTeachingStaff',
    label: 'Total Non-Teaching Staff',
    description: 'Administrative, support, IT, operational and security personnel.',
    placeholder: 'e.g. 145',
    icon: <Briefcase className="w-5 h-5" />,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-700',
    tooltipTitle: 'Non-Teaching Staff Definition',
    tooltipContent:
      'Currently active administrative officers, accountants, librarians, IT coordinators, receptionists, support staff, and security employees.',
    tooltipColor: 'text-blue-300',
  },
  {
    key: 'historicalStudents',
    label: 'Historical Student Count / Alumni',
    description: 'Cumulative offline alumni/graduated students before digital records.',
    placeholder: 'Optional',
    icon: <RotateCcw className="w-5 h-5" />,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-700',
    tooltipTitle: 'Historical Students Definition',
    tooltipContent:
      'For institutions with years of operation prior to digital ERP adoption: enter your cumulative offline alumni/graduated student count. This helps report accurate institutional all-time strength.',
    tooltipColor: 'text-amber-300',
    isHistorical: true,
  },
  {
    key: 'classroomsCount',
    label: 'Total Classrooms',
    description: 'Total instructional classrooms available across the campus.',
    placeholder: 'e.g. 64',
    icon: <Building2 className="w-5 h-5" />,
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-700',
    tooltipTitle: 'Total Classrooms Definition',
    tooltipContent:
      'Total number of active instructional classrooms available for teaching across the campus or institution.',
    tooltipColor: 'text-slate-300',
    required: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SOURCE & FIELD HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getFieldValue(fac: FacilitiesData | undefined, key: string): number | undefined {
  if (!fac) return undefined;
  switch (key) {
    case 'totalStudents':
      return fac.totalStudents;
    case 'activeStudents':
      return fac.activeStudents;
    case 'totalTeachers':
      return fac.totalTeachers;
    case 'totalNonTeachingStaff':
      return fac.totalNonTeachingStaff ?? fac.nonTeachingStaff;
    case 'historicalStudents':
      return fac.historicalStudents ?? fac.historicalPreDigitalStudents;
    case 'classroomsCount':
      return fac.classroomsCount ?? fac.totalClassrooms;
    default:
      return (fac as any)[key];
  }
}

function getFieldSource(fac: FacilitiesData | undefined, key: string): StatCountSource {
  if (!fac) return 'manual';
  switch (key) {
    case 'totalStudents':
      return fac.totalStudentsSource || 'manual';
    case 'activeStudents':
      return fac.activeStudentsSource || 'manual';
    case 'totalTeachers':
      return fac.totalTeachersSource || 'manual';
    case 'totalNonTeachingStaff':
      return fac.totalNonTeachingStaffSource || fac.nonTeachingStaffSource || 'manual';
    case 'historicalStudents':
      return fac.historicalStudentsSource || 'manual';
    case 'classroomsCount':
      return fac.classroomsCountSource || 'manual';
    default:
      return 'manual';
  }
}

function getFieldSyncedAt(fac: FacilitiesData | undefined, key: string): string | undefined {
  if (!fac) return undefined;
  switch (key) {
    case 'totalStudents':
      return fac.totalStudentsSyncedAt;
    case 'activeStudents':
      return fac.activeStudentsSyncedAt;
    case 'totalTeachers':
      return fac.totalTeachersSyncedAt;
    case 'totalNonTeachingStaff':
      return fac.totalNonTeachingStaffSyncedAt || fac.nonTeachingStaffSyncedAt;
    case 'historicalStudents':
      return fac.historicalStudentsSyncedAt;
    case 'classroomsCount':
      return fac.classroomsCountSyncedAt;
    default:
      return undefined;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface CampusStatisticsSectionProps {
  intakeData: UniversalIntakeData;
  updateSectionField: (section: keyof UniversalIntakeData, field: string, value: any) => void;
  updateSectionDirect: (section: keyof UniversalIntakeData, value: any) => void;
  onNavigateToSection?: (key: IntakeSectionKey) => void;
  isMoreStatsExpanded: boolean;
  setIsMoreStatsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  isReadOnly?: boolean;
  sourceMode?: string;
  sourceCampusName?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function CampusStatisticsSection({
  intakeData,
  updateSectionField,
  updateSectionDirect,
  onNavigateToSection,
  isMoreStatsExpanded,
  setIsMoreStatsExpanded,
  isReadOnly,
  sourceMode,
  sourceCampusName,
}: CampusStatisticsSectionProps) {
  // ── Session Context ──
  const canonicalSession = useMemo(() => {
    return resolveCanonicalSession(intakeData);
  }, [intakeData]);
  const activeSession = canonicalSession;

  // ── Multi-Campus Context ──
  const campuses = useMemo(() => {
    return Array.isArray(intakeData.campuses) ? intakeData.campuses : [];
  }, [intakeData.campuses]);

  // ── Facilities reference ──
  const fac = intakeData.facilitiesConfig;

  // ── Local UI state ──
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});

  // ── ERP Sync modal state ──
  const [erpModalStep, setErpModalStep] = useState<'none' | 'confirm' | 'review' | 'loading' | 'error'>('none');
  const [erpData, setErpData] = useState<ErpCampusStatistics | null>(null);
  const [erpComparison, setErpComparison] = useState<ErpFieldComparison[]>([]);
  const [erpSelectedFields, setErpSelectedFields] = useState<Set<string>>(new Set());
  const [erpError, setErpError] = useState<string | null>(null);

  // ── Soft warning for active > total ──
  const studentsWarning = useMemo(() => {
    return checkStudentsCountWarning(fac?.totalStudents, fac?.activeStudents);
  }, [fac?.totalStudents, fac?.activeStudents]);

  // ── HANDLERS ──

  const handleFieldChange = useCallback(
    (fieldKey: string, rawValue: string) => {
      const validation = validateWholeNumber(rawValue, fieldKey);
      if (!validation.isValid) {
        setFieldErrors((prev) => ({ ...prev, [fieldKey]: validation.error }));
        return;
      }
      // Clear error
      setFieldErrors((prev) => ({ ...prev, [fieldKey]: undefined }));

      // Apply the manual update with source tracking
      const updated = updateFieldManual(fac, fieldKey, validation.value);
      updateSectionDirect('facilitiesConfig', updated);
    },
    [fac, updateSectionDirect]
  );

  // ── ERP SYNC WORKFLOW ──

  const handleInitiateErpSync = useCallback(() => {
    // If any manual values exist, show confirm step; otherwise jump to loading
    const hasAnyManual = STAT_FIELDS.some((f) => getFieldValue(fac, f.key) !== undefined);
    if (hasAnyManual) {
      setErpModalStep('confirm');
    } else {
      setErpModalStep('loading');
      doErpFetch();
    }
  }, [fac]);

  const doErpFetch = useCallback(async () => {
    setErpModalStep('loading');
    setErpError(null);

    const activeCampusId = campuses.length > 0 ? campuses[0]?.id : undefined;
    const result = await fetchErpCampusStatistics({ campusId: activeCampusId });

    if (!result.success || !result.data) {
      setErpError(result.error || 'ERP sync could not be completed. You can continue using manually entered campus statistics.');
      setErpModalStep('error');
      return;
    }

    const comparison = compareCampusStatistics(fac, result.data);
    const changedFields = comparison.filter((c) => c.changed).map((c) => c.fieldKey);
    setErpData(result.data);
    setErpComparison(comparison);
    setErpSelectedFields(new Set(changedFields));
    setErpModalStep('review');
  }, [fac, campuses]);

  const handleApplyErpFields = useCallback(() => {
    if (!erpData) return;
    const selectedArray = Array.from(erpSelectedFields);
    if (selectedArray.length === 0) {
      setErpModalStep('none');
      return;
    }

    const updated = applyErpStatistics(fac, erpData, selectedArray);
    updateSectionDirect('facilitiesConfig', updated);
    setErpModalStep('none');
    setErpData(null);
    setErpComparison([]);
    setErpSelectedFields(new Set());
  }, [fac, erpData, erpSelectedFields, updateSectionDirect]);

  const handleDismissErpModal = useCallback(() => {
    setErpModalStep('none');
    setErpData(null);
    setErpComparison([]);
    setErpSelectedFields(new Set());
    setErpError(null);
  }, []);

  const toggleErpField = useCallback((fieldKey: string) => {
    setErpSelectedFields((prev) => {
      const next = new Set(prev);
      if (next.has(fieldKey)) {
        next.delete(fieldKey);
      } else {
        next.add(fieldKey);
      }
      return next;
    });
  }, []);

  // ── Inherited campus banner ──
  const isInherited = sourceMode === 'inherited' || sourceMode === 'same_as_main';

  // ─── RENDER ───

  return (
    <div className="space-y-6 text-xs">
      {/* ─────────────────────────────────────────────────────────────
          SUB-CARD 1: CAMPUS STATISTICS — MANUAL INSTITUTIONAL COUNTS
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl p-5 space-y-5 shadow-2xs">
        {/* Card Header & Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#E2E8F0] pb-3.5">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-[#4338CA]/10 text-[#4338CA]">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm text-[#131B2E]">Campus Statistics</h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Pencil className="w-2.5 h-2.5 mr-1" />
                  Manual Entry
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                Enter aggregate campus counts. Individual student or staff records are not required for onboarding.
              </p>
            </div>
          </div>

          {/* ERP Sync Button */}
          {!isReadOnly && (
            <button
              type="button"
              onClick={handleInitiateErpSync}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-[#4338CA] hover:bg-[#EEF2FF] hover:border-[#C7D2FE] font-semibold text-xs transition cursor-pointer shadow-2xs shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync from ERP</span>
            </button>
          )}
        </div>

        {/* Informational Guidance Banner */}
        <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start space-x-2.5 text-xs text-[#334155]">
          <Info className="w-4 h-4 text-[#4338CA] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-indigo-950">
              Aggregate Institutional Counts
            </p>
            <p className="text-[11px] text-[#475569] leading-relaxed">
              Enter your institution&apos;s aggregate student, faculty, and infrastructure counts below.
              A complete student or staff database is <strong>not required</strong> — only aggregate numbers are needed to complete this section.
              You can optionally sync counts from an ERP system at any time.
            </p>
          </div>
        </div>

        {/* Inherited Campus Banner */}
        {isInherited && sourceCampusName && (
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-start space-x-2.5 text-xs text-blue-800">
            <Layers className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">
                Inherited from {sourceCampusName}
              </p>
              <p className="text-[11px] text-blue-700 mt-0.5">
                These counts are inherited from the main campus. To customize counts for this campus, switch to &quot;Customize for this campus&quot; mode.
              </p>
            </div>
          </div>
        )}

        {/* Session Context Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-2xs">
          <div className="flex items-center space-x-2.5">
            <div className="p-1 rounded-md bg-slate-100 text-slate-700">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-[#334155] text-xs">Academic Session:</span>
              <span className="font-bold text-xs text-[#4338CA] bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                {activeSession}
              </span>
              {onNavigateToSection && (
                <button
                  type="button"
                  onClick={() => onNavigateToSection('institutionStructure')}
                  className="text-[11px] text-[#4338CA] hover:underline cursor-pointer flex items-center space-x-0.5 ml-1"
                  title="Configure academic sessions in Section 7"
                >
                  <span>Change in Academics</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Soft Warning: Active Students > Total Students */}
        {studentsWarning && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start space-x-2.5 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] font-medium leading-relaxed">
              {studentsWarning}
            </p>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            SECTION A: PRIMARY INSTITUTIONAL COUNTS (Editable Cards)
            ───────────────────────────────────────────────────────────── */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              Institutional Counts
            </span>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 font-medium px-2 py-0.5 rounded-md border border-emerald-100">
              Editable · Manual Entry
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {STAT_FIELDS.map((field) => {
              const value = getFieldValue(fac, field.key);
              const source = getFieldSource(fac, field.key);
              const syncedAt = getFieldSyncedAt(fac, field.key);
              const fieldError = fieldErrors[field.key];
              const isFieldReadOnly = isReadOnly || isInherited;

              return (
                <div
                  key={field.key}
                  className={`relative bg-white rounded-xl p-4 border shadow-2xs transition ${
                    fieldError
                      ? 'border-rose-300 hover:border-rose-400'
                      : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-[#131B2E] text-xs">{field.label}</span>
                        {field.required && <span className="text-rose-500 text-xs">*</span>}
                        <button
                          type="button"
                          onClick={() =>
                            setActiveTooltip(
                              activeTooltip === field.key ? null : field.key
                            )
                          }
                          className="text-[#94A3B8] hover:text-[#4338CA] transition cursor-pointer"
                          aria-label={`${field.label} definition`}
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-0.5">{field.description}</p>
                    </div>
                    <div className={`p-2 rounded-xl ${field.iconBg} ${field.iconColor}`}>
                      {field.icon}
                    </div>
                  </div>

                  {/* Editable Input */}
                  <div className="mt-3">
                    <input
                      id={`stat-${field.key}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9,]*"
                      min={0}
                      value={value !== undefined ? String(value) : ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      disabled={isFieldReadOnly}
                      placeholder={field.placeholder}
                      className={`w-full px-3 py-2.5 rounded-xl border text-[#131B2E] transition text-lg font-bold font-mono tracking-tight ${
                        isFieldReadOnly
                          ? 'bg-slate-50 border-slate-200 cursor-not-allowed opacity-70'
                          : fieldError
                          ? 'bg-rose-50 border-rose-300 focus:border-rose-500 focus:ring-3 focus:ring-rose-200/40 focus:outline-hidden'
                          : 'bg-[#FAF7F2] border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:bg-white focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden'
                      }`}
                      aria-invalid={!!fieldError}
                      aria-describedby={fieldError ? `err-${field.key}` : undefined}
                    />
                    {fieldError && (
                      <p
                        id={`err-${field.key}`}
                        className="mt-1 text-[11px] text-rose-600 font-medium flex items-center space-x-1"
                      >
                        <AlertCircle className="w-3 h-3" />
                        <span>{fieldError}</span>
                      </p>
                    )}
                  </div>

                  {/* Source Indicator Badge */}
                  <div className="mt-2.5 pt-2 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between text-[11px]">
                    {source === 'erp' ? (
                      <span className="text-blue-700 font-medium flex items-center space-x-1">
                        <RefreshCw className="w-3 h-3 text-blue-600" />
                        <span>{formatSyncedAt(syncedAt)}</span>
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-medium flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>● Manually entered</span>
                      </span>
                    )}
                    {value !== undefined && (
                      <span className="text-[#64748B]">
                        {value.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Definition Tooltip Popover */}
                  {activeTooltip === field.key && (
                    <div className="absolute top-10 left-4 right-4 z-30 bg-[#1E293B] text-white p-3 rounded-xl shadow-xl text-xs space-y-1 animate-in fade-in duration-150">
                      <div className={`flex items-center justify-between font-bold ${field.tooltipColor} text-xs`}>
                        <span>{field.tooltipTitle}</span>
                        <button
                          type="button"
                          onClick={() => setActiveTooltip(null)}
                          className="text-slate-400 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-200 leading-normal">
                        {field.tooltipContent}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            SECTION B: PROGRESSIVE DISCLOSURE — MORE INSTITUTIONAL STATS
            ───────────────────────────────────────────────────────────── */}
        <div className="pt-3 border-t border-[#E2E8F0] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#334155]">
                Additional Institutional Statistics
              </span>
              <p className="text-[11px] text-[#64748B]">
                Capacity, ratios, and institutional details.
              </p>
            </div>
            <span className="text-[10px] text-amber-700 bg-amber-50 font-semibold px-2 py-0.5 rounded-md border border-amber-200">
              Optional
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsMoreStatsExpanded((prev) => !prev)}
            aria-expanded={isMoreStatsExpanded}
            aria-controls="more-institutional-stats-panel"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#4338CA] hover:text-[#3730A3] transition select-none py-1 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#4338CA]/20 rounded-md cursor-pointer"
          >
            <span>More Institutional Statistics</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isMoreStatsExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isMoreStatsExpanded && (
            <div
              id="more-institutional-stats-panel"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-3 animate-in fade-in duration-150"
            >
              <div>
                <label htmlFor="stat-student-capacity" className="block font-semibold text-[#334155] mb-1">
                  Student Capacity
                </label>
                <input
                  id="stat-student-capacity"
                  type="number"
                  min={0}
                  value={intakeData.facilitiesConfig?.studentCapacity ?? ''}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '') {
                      updateSectionField('facilitiesConfig', 'studentCapacity', undefined);
                    } else {
                      const val = parseInt(raw, 10);
                      if (!isNaN(val)) {
                        updateSectionField('facilitiesConfig', 'studentCapacity', Math.max(0, val));
                      }
                    }
                  }}
                  disabled={isReadOnly || isInherited}
                  placeholder="e.g. 1500"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs text-xs font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                />
                <p className="text-[11px] text-[#64748B] mt-1">Maximum student intake capacity.</p>
              </div>

              <div>
                <label htmlFor="stat-average-class-size" className="block font-semibold text-[#334155] mb-1">
                  Average Class Size
                </label>
                <input
                  id="stat-average-class-size"
                  type="number"
                  min={0}
                  value={intakeData.facilitiesConfig?.averageClassSize ?? ''}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '') {
                      updateSectionField('facilitiesConfig', 'averageClassSize', undefined);
                    } else {
                      const val = parseInt(raw, 10);
                      if (!isNaN(val)) {
                        updateSectionField('facilitiesConfig', 'averageClassSize', Math.max(0, val));
                      }
                    }
                  }}
                  disabled={isReadOnly || isInherited}
                  placeholder="e.g. 35"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs text-xs font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                />
                <p className="text-[11px] text-[#64748B] mt-1">Average number of students per class.</p>
              </div>

              <div>
                <label htmlFor="stat-student-teacher-ratio" className="block font-semibold text-[#334155] mb-1">
                  Student–Teacher Ratio
                </label>
                <input
                  id="stat-student-teacher-ratio"
                  type="text"
                  value={intakeData.facilitiesConfig?.studentTeacherRatio ?? ''}
                  onChange={(e) => updateSectionField('facilitiesConfig', 'studentTeacherRatio', e.target.value)}
                  disabled={isReadOnly || isInherited}
                  placeholder="e.g. 25:1"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs text-xs font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                />
                <p className="text-[11px] text-[#64748B] mt-1">Estimated student to teacher ratio.</p>
              </div>

              <div>
                <label htmlFor="stat-established-year" className="block font-semibold text-[#334155] mb-1">
                  Established Year
                </label>
                <input
                  id="stat-established-year"
                  type="number"
                  min={1800}
                  max={new Date().getFullYear() + 1}
                  value={intakeData.facilitiesConfig?.establishedYear ?? ''}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '') {
                      updateSectionField('facilitiesConfig', 'establishedYear', undefined);
                    } else {
                      const val = parseInt(raw, 10);
                      if (!isNaN(val)) {
                        updateSectionField('facilitiesConfig', 'establishedYear', val);
                      }
                    }
                  }}
                  disabled={isReadOnly || isInherited}
                  placeholder="e.g. 1995"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs text-xs font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                />
                <p className="text-[11px] text-[#64748B] mt-1">Year the school was founded.</p>
              </div>

              <div>
                <label htmlFor="stat-grades-offered" className="block font-semibold text-[#334155] mb-1">
                  Grades / Classes Offered
                </label>
                <input
                  id="stat-grades-offered"
                  type="text"
                  value={intakeData.facilitiesConfig?.gradesOffered ?? ''}
                  onChange={(e) => updateSectionField('facilitiesConfig', 'gradesOffered', e.target.value)}
                  disabled={isReadOnly || isInherited}
                  placeholder="e.g. Nursery to Grade 12"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs text-xs font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                />
                <p className="text-[11px] text-[#64748B] mt-1">Academic grade span offered.</p>
              </div>

              <div>
                <label htmlFor="stat-sections-per-grade" className="block font-semibold text-[#334155] mb-1">
                  Sections per Grade
                </label>
                <input
                  id="stat-sections-per-grade"
                  type="text"
                  value={intakeData.facilitiesConfig?.sectionsPerGrade ?? ''}
                  onChange={(e) => updateSectionField('facilitiesConfig', 'sectionsPerGrade', e.target.value)}
                  disabled={isReadOnly || isInherited}
                  placeholder="e.g. 2 to 4 sections"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs text-xs font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                />
                <p className="text-[11px] text-[#64748B] mt-1">Average number of sections per grade level.</p>
              </div>

              <div>
                <label htmlFor="stat-total-campuses" className="block font-semibold text-[#334155] mb-1">
                  Total Campuses
                </label>
                <input
                  id="stat-total-campuses"
                  type="number"
                  min={1}
                  value={intakeData.facilitiesConfig?.totalCampuses ?? (intakeData.campuses?.length || 1)}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '') {
                      updateSectionField('facilitiesConfig', 'totalCampuses', undefined);
                    } else {
                      const val = parseInt(raw, 10);
                      if (!isNaN(val)) {
                        updateSectionField('facilitiesConfig', 'totalCampuses', Math.max(1, val));
                      }
                    }
                  }}
                  disabled={isReadOnly || isInherited}
                  placeholder="e.g. 1"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs text-xs font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                />
                <p className="text-[11px] text-[#64748B] mt-1">Number of active campus locations.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ERP SYNC CONFIRMATION
          ───────────────────────────────────────────────────────────── */}
      {erpModalStep === 'confirm' && (
        <ModalPortal isOpen={erpModalStep === 'confirm'}>
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 space-y-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#131B2E]">Sync from ERP</h4>
                  <p className="text-[11px] text-[#64748B] mt-0.5">Review before applying</p>
                </div>
              </div>

              <p className="text-xs text-[#475569] leading-relaxed">
                ERP sync will fetch the latest available institutional counts from your connected ERP system.
                Your current manually entered values <strong>will not be changed</strong> unless you explicitly confirm.
              </p>

              <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-[#F1F5F9]">
                <button
                  type="button"
                  onClick={handleDismissErpModal}
                  className="px-3 py-1.5 rounded-lg text-[#475569] text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={doErpFetch}
                  className="px-4 py-1.5 rounded-lg bg-[#4338CA] hover:bg-[#3730A3] text-white font-semibold text-xs transition cursor-pointer shadow-xs"
                >
                  Review ERP Values
                </button>
              </div>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ERP LOADING
          ───────────────────────────────────────────────────────────── */}
      {erpModalStep === 'loading' && (
        <ModalPortal isOpen={erpModalStep === 'loading'}>
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 p-6 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#4338CA] animate-spin mx-auto" />
            <p className="text-xs font-semibold text-[#334155]">Fetching ERP campus statistics...</p>
            <p className="text-[11px] text-[#64748B]">This should only take a moment.</p>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ERP ERROR
          ───────────────────────────────────────────────────────────── */}
      {erpModalStep === 'error' && (
        <ModalPortal isOpen={erpModalStep === 'error'}>
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 space-y-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#131B2E]">ERP Sync Unavailable</h4>
                </div>
              </div>
              <p className="text-xs text-[#475569] leading-relaxed">
                {erpError || 'ERP sync could not be completed. You can continue using manually entered campus statistics.'}
              </p>
              <div className="flex items-center justify-end pt-2 border-t border-[#F1F5F9]">
                <button
                  type="button"
                  onClick={handleDismissErpModal}
                  className="px-4 py-1.5 rounded-lg bg-[#4338CA] hover:bg-[#3730A3] text-white font-semibold text-xs transition cursor-pointer shadow-xs"
                >
                  Continue with Manual Entry
                </button>
              </div>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ERP REVIEW / COMPARE
          ───────────────────────────────────────────────────────────── */}
      {erpModalStep === 'review' && erpData && (
        <ModalPortal isOpen={erpModalStep === 'review' && !!erpData}>
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <ArrowRightLeft className="w-5 h-5 text-[#4338CA]" />
                <div>
                  <h4 className="font-bold text-sm text-[#131B2E]">Review ERP Values</h4>
                  <p className="text-[11px] text-[#64748B]">
                    Select which values to apply from {erpData.erpSystemName}. Unselected values will keep your current numbers.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDismissErpModal}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-[#64748B] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Comparison Table */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-3 py-2 text-left font-semibold text-[#334155] w-8">
                        <input
                          type="checkbox"
                          checked={erpComparison.filter((c) => c.changed).every((c) => erpSelectedFields.has(c.fieldKey))}
                          onChange={(e) => {
                            const changedKeys = erpComparison.filter((c) => c.changed).map((c) => c.fieldKey);
                            setErpSelectedFields(e.target.checked ? new Set(changedKeys) : new Set());
                          }}
                          className="rounded text-[#4338CA]"
                        />
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-[#334155]">Field</th>
                      <th className="px-3 py-2 text-right font-semibold text-[#334155]">Current</th>
                      <th className="px-3 py-2 text-right font-semibold text-[#4338CA]">ERP Value</th>
                      <th className="px-3 py-2 text-center font-semibold text-[#334155]">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {erpComparison.map((row) => (
                      <tr
                        key={row.fieldKey}
                        className={`transition ${
                          row.changed
                            ? erpSelectedFields.has(row.fieldKey)
                              ? 'bg-blue-50/50'
                              : 'hover:bg-slate-50'
                            : 'bg-emerald-50/30'
                        }`}
                      >
                        <td className="px-3 py-2.5">
                          {row.changed ? (
                            <input
                              type="checkbox"
                              checked={erpSelectedFields.has(row.fieldKey)}
                              onChange={() => toggleErpField(row.fieldKey)}
                              className="rounded text-[#4338CA]"
                            />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          )}
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-[#131B2E]">{row.label}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-[#475569]">
                          {row.currentValue !== undefined ? row.currentValue.toLocaleString() : '—'}
                        </td>
                        <td className={`px-3 py-2.5 text-right font-mono font-bold ${
                          row.changed ? 'text-[#4338CA]' : 'text-emerald-700'
                        }`}>
                          {row.erpValue.toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            row.currentSource === 'erp'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {row.currentSource === 'erp' ? 'ERP' : 'Manual'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {erpComparison.every((c) => !c.changed) && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>All values match! Your current counts are in sync with ERP.</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-[#64748B]">
                {erpSelectedFields.size} of {erpComparison.filter((c) => c.changed).length} changes selected
              </span>
              <div className="flex items-center space-x-2.5">
                <button
                  type="button"
                  onClick={handleDismissErpModal}
                  className="px-3 py-1.5 rounded-lg text-[#475569] text-xs font-semibold hover:bg-slate-200 transition cursor-pointer"
                >
                  Keep Current Values
                </button>
                <button
                  type="button"
                  onClick={handleApplyErpFields}
                  disabled={erpSelectedFields.size === 0}
                  className="px-4 py-1.5 rounded-lg bg-[#4338CA] hover:bg-[#3730A3] text-white font-semibold text-xs transition cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply Selected ({erpSelectedFields.size})
                </button>
              </div>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
}
