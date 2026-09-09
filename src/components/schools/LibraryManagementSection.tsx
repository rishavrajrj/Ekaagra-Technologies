'use client';

import React, { useState, useId } from 'react';
import {
  BookOpen,
  Layers,
  Laptop,
  Handshake,
  CalendarClock,
  Ban,
  Clock,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Radio as RadioIcon,
  ShieldCheck,
  Users,
  Bell,
  ChevronDown,
  ChevronUp,
  Info,
  Sparkles,
  Bookmark,
  DollarSign,
  FileSpreadsheet,
  Eye,
  Sliders,
} from 'lucide-react';
import type {
  UniversalIntakeData,
  LibraryData,
  LibraryStatus,
  FutureLibraryPlan,
  PlannedAvailability,
  PlannedLibraryType,
  DigitalResourceType,
  DigitalAccessModel,
  BookIdentificationMethod,
  BarcodeScannerAvailability,
  BarcodeGeneration,
  RfidInfrastructure,
  RfidUsageOption,
  LendingPreference,
  LoanDurationOption,
  RenewalPolicyOption,
  ReservationAccessOption,
  OverdueFineType,
  FineGracePeriodOption,
  LostDamagedPolicy,
  EligibleLibraryMember,
  LibraryManagementStaff,
  OutsourcedServiceModel,
  OutsourcedSchoolAccess,
  OutsourcedDigitalIntegration,
  LibrarySoftwareSystem,
  InventoryManagementType,
  InventoryAuditFrequency,
  ParentVisibilityItem,
  LibraryAutomationFeature,
  LibraryNotificationChannel,
} from '@/lib/types';
import {
  LIBRARY_STATUS_OPTIONS,
  FUTURE_LIBRARY_OPTIONS,
  PLANNED_AVAILABILITY_OPTIONS,
  PLANNED_TYPE_OPTIONS,
  DIGITAL_RESOURCE_OPTIONS,
  DIGITAL_ACCESS_MODELS,
  BOOK_IDENTIFICATION_METHODS,
  BARCODE_SCANNER_OPTIONS,
  BARCODE_GENERATION_OPTIONS,
  RFID_INFRASTRUCTURE_OPTIONS,
  RFID_USAGE_OPTIONS,
  LENDING_PREFERENCE_OPTIONS,
  LOAN_DURATION_OPTIONS,
  RENEWAL_POLICY_OPTIONS,
  RESERVATION_ACCESS_OPTIONS,
  OVERDUE_FINE_OPTIONS,
  GRACE_PERIOD_OPTIONS,
  LOST_DAMAGED_OPTIONS,
  ELIGIBLE_MEMBERS_OPTIONS,
  LIBRARY_MANAGEMENT_STAFF_OPTIONS,
  OUTSOURCED_SERVICE_MODELS,
  OUTSOURCED_SCHOOL_ACCESS,
  OUTSOURCED_DIGITAL_INTEGRATIONS,
  LIBRARY_SOFTWARE_OPTIONS,
  INVENTORY_MANAGEMENT_OPTIONS,
  INVENTORY_AUDIT_OPTIONS,
  PARENT_VISIBILITY_OPTIONS,
  AUTOMATION_FEATURE_OPTIONS,
  NOTIFICATION_CHANNEL_OPTIONS,
  normalizeLibraryData,
  validateLibraryData,
  getLibrarySectionScore,
  getLibrarySummary,
  getInstitutionCurrency,
} from '@/lib/libraryUtils';

interface LibraryManagementSectionProps {
  intakeData: UniversalIntakeData;
  updateSectionField: (section: keyof UniversalIntakeData, field: string, value: any) => void;
  updateSectionDirect?: (section: keyof UniversalIntakeData, data: any) => void;
  project?: any;
  onNavigateToSection?: (sectionKey: any) => void;
}

export default function LibraryManagementSection({
  intakeData,
  updateSectionField,
  updateSectionDirect,
  project,
}: LibraryManagementSectionProps) {
  const formId = useId();
  const config: LibraryData = normalizeLibraryData(intakeData.libraryConfig);
  const status: LibraryStatus = config.status || 'not_decided';

  const isWebsiteOnly = project?.product_id === 'school-website' || project?.product_id === 'school-website-cms';
  const score = getLibrarySectionScore(config, project?.product_id);
  const validation = validateLibraryData(config, project?.product_id);
  const currency = getInstitutionCurrency(intakeData);

  // Progressive disclosure accordions for advanced optional physical configurations
  const [showAdvancedInventory, setShowAdvancedInventory] = useState(false);
  const [showAdvancedVisibility, setShowAdvancedVisibility] = useState(false);

  // State update helper with draft preservation
  const updateConfig = (updater: (prev: LibraryData) => LibraryData) => {
    const updated = updater({ ...config });
    const normalized = normalizeLibraryData(updated);

    if (updateSectionDirect) {
      updateSectionDirect('libraryConfig', normalized);
    } else {
      Object.keys(normalized).forEach((key) => {
        updateSectionField('libraryConfig', key, (normalized as any)[key]);
      });
    }
  };

  const handleStatusChange = (newStatus: LibraryStatus) => {
    updateConfig((prev) => ({
      ...prev,
      status: newStatus,
    }));
  };

  const summaryItems = getLibrarySummary(config, currency.symbol);

  // Helper for icon lookup
  const renderStatusIcon = (iconName: string, className: string) => {
    switch (iconName) {
      case 'BookOpen':
        return <BookOpen className={className} />;
      case 'Layers':
        return <Layers className={className} />;
      case 'Laptop':
        return <Laptop className={className} />;
      case 'Handshake':
        return <Handshake className={className} />;
      case 'CalendarClock':
        return <CalendarClock className={className} />;
      case 'Ban':
        return <Ban className={className} />;
      case 'Clock':
      default:
        return <Clock className={className} />;
    }
  };

  return (
    <div className="space-y-8 text-xs">
      {/* ─── HEADER & CONDITIONAL PROGRESS BADGE ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]">
              <BookOpen className="w-3.5 h-3.5" />
              Section 14 of 29 • Library Management System
            </span>
            {score.isConfiguredForLater ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                <Clock className="w-3 h-3" /> Configured for Later
              </span>
            ) : score.percentage === 100 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                <CheckCircle2 className="w-3 h-3" /> 100% Configured
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]">
                {score.percentage}% Completed ({score.filled}/{score.total} Required)
              </span>
            )}
          </div>
          <p className="text-[#64748B] text-[11px] mt-1">
            Book volume estimate, barcode/RFID integration strategy, circulation limits, and digital resources.
          </p>
        </div>
      </div>

      {/* ─── PRIMARY LIBRARY STATUS SELECTION ────────────────────────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4338CA]" />
            <h3 className="font-bold text-sm text-[#131B2E]">Does your institution provide library services?</h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
              Required
            </span>
          </div>
          <p className="text-[#64748B] text-[11px] mt-0.5">
            Select your institution&apos;s current operational model. You can adjust detailed policies below.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {LIBRARY_STATUS_OPTIONS.map((opt) => {
            const isSelected = status === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleStatusChange(opt.value)}
                className={`flex flex-col text-left p-4 rounded-xl border transition text-xs relative ${
                  isSelected
                    ? 'border-[#4338CA] bg-[#EEF2FF]/40 shadow-xs ring-2 ring-[#4338CA]/20'
                    : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1] hover:bg-[#FAF7F2]'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-[#4338CA] text-white' : 'bg-[#F1F5F9] text-[#64748B]'
                    }`}
                  >
                    {renderStatusIcon(opt.iconName, 'w-4 h-4')}
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-[#4338CA]/10 text-[#4338CA]' : 'bg-slate-100 text-[#64748B]'
                    }`}
                  >
                    {opt.badge}
                  </span>
                </div>
                <span className="font-bold text-[#131B2E] text-xs leading-snug">{opt.label}</span>
                <p className="text-[11px] text-[#64748B] mt-1 leading-relaxed">{opt.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── BRANCH 1: NO LIBRARY ────────────────────────────────────────── */}
      {status === 'no_library' && (
        <div className="space-y-4">
          <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#131B2E]">Library Not Provided</h4>
                <p className="text-[#64748B] text-[11px] mt-0.5">
                  Your institution does not currently operate a library service. Operational books, circulation, and barcode hardware configurations are not required.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs space-y-3">
            <label className="block font-bold text-[#334155]">Future Library Plans (Optional)</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {FUTURE_LIBRARY_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex flex-col p-3 rounded-xl border cursor-pointer transition ${
                    config.noLibraryFuturePlan === opt.value
                      ? 'border-[#4338CA] bg-[#EEF2FF]/40'
                      : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`${formId}-futurePlan`}
                      checked={config.noLibraryFuturePlan === opt.value}
                      onChange={() =>
                        updateConfig((prev) => ({
                          ...prev,
                          noLibraryFuturePlan: opt.value,
                        }))
                      }
                      className="text-[#4338CA] focus:ring-[#4338CA]/20"
                    />
                    <span className="font-semibold text-xs text-[#131B2E]">{opt.label}</span>
                  </div>
                  <span className="text-[10px] text-[#64748B] mt-1 pl-5">{opt.description}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── BRANCH 2: NOT YET DECIDED ──────────────────────────────────── */}
      {status === 'not_decided' && (
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] text-[#92400E] flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#92400E]">Library Configuration Pending</h4>
              <p className="text-[#92400E] text-[11px] mt-0.5">
                Library configuration can be completed later during system deployment or directly from the administrative portal. This section is marked complete for initial onboarding.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── BRANCH 3: PLANNED / COMING SOON ────────────────────────────── */}
      {status === 'planned' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-[#E2E8F0]">
            <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center shrink-0">
              <CalendarClock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#131B2E]">Planned Library Setup</h4>
              <p className="text-[#64748B] text-[11px]">
                Capture rollout expectations. Current book inventory is not required.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-[#334155] mb-1">
                Expected Availability <span className="text-rose-500">*</span>
              </label>
              <select
                value={config.planned?.availability || ''}
                onChange={(e) =>
                  updateConfig((prev) => ({
                    ...prev,
                    planned: {
                      ...prev.planned,
                      availability: e.target.value as PlannedAvailability,
                    },
                  }))
                }
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
              >
                <option value="" disabled>Select expected availability...</option>
                {PLANNED_AVAILABILITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#334155] mb-1">
                Planned Library Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={config.planned?.plannedType || ''}
                onChange={(e) =>
                  updateConfig((prev) => ({
                    ...prev,
                    planned: {
                      ...prev.planned,
                      plannedType: e.target.value as PlannedLibraryType,
                    },
                  }))
                }
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
              >
                <option value="" disabled>Select planned type...</option>
                {PLANNED_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} — {opt.description}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ─── BRANCH 4: OUTSOURCED / EXTERNAL LIBRARY ─────────────────────── */}
      {status === 'outsourced' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-[#E2E8F0]">
            <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center shrink-0">
              <Handshake className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#131B2E]">External Library Service</h4>
              <p className="text-[#64748B] text-[11px]">
                Define partner library model and member access arrangements.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-[#334155] mb-1">
                Service Model <span className="text-rose-500">*</span>
              </label>
              <select
                value={config.outsourced?.serviceModel || ''}
                onChange={(e) =>
                  updateConfig((prev) => ({
                    ...prev,
                    outsourced: {
                      ...prev.outsourced,
                      serviceModel: e.target.value as OutsourcedServiceModel,
                    },
                  }))
                }
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
              >
                <option value="" disabled>Select service model...</option>
                {OUTSOURCED_SERVICE_MODELS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#334155] mb-1">
                School Access Scope <span className="text-rose-500">*</span>
              </label>
              <select
                value={config.outsourced?.schoolAccess || ''}
                onChange={(e) =>
                  updateConfig((prev) => ({
                    ...prev,
                    outsourced: {
                      ...prev.outsourced,
                      schoolAccess: e.target.value as OutsourcedSchoolAccess,
                    },
                  }))
                }
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
              >
                <option value="" disabled>Select access scope...</option>
                {OUTSOURCED_SCHOOL_ACCESS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#334155] mb-1">Digital Integration</label>
              <select
                value={config.outsourced?.digitalIntegration || 'api_digital'}
                onChange={(e) =>
                  updateConfig((prev) => ({
                    ...prev,
                    outsourced: {
                      ...prev.outsourced,
                      digitalIntegration: e.target.value as OutsourcedDigitalIntegration,
                    },
                  }))
                }
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
              >
                {OUTSOURCED_DIGITAL_INTEGRATIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ─── BRANCH 5: DIGITAL LIBRARY ONLY ──────────────────────────────── */}
      {status === 'digital_only' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-[#E2E8F0]">
            <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center shrink-0">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#131B2E]">Digital Library Configuration</h4>
              <p className="text-[#64748B] text-[11px]">
                Specify digital content categories and portal user access model.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block font-bold text-[#334155]">
              Digital Resources <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {DIGITAL_RESOURCE_OPTIONS.map((res) => {
                const isChecked = (config.digital?.resources || []).includes(res.value);
                return (
                  <label
                    key={res.value}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                      isChecked ? 'border-[#4338CA] bg-[#EEF2FF]/40' : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const current = config.digital?.resources || [];
                        const next = e.target.checked
                          ? [...current, res.value]
                          : current.filter((v) => v !== res.value);
                        updateConfig((prev) => ({
                          ...prev,
                          digital: {
                            ...prev.digital,
                            resources: next,
                          },
                        }));
                      }}
                      className="mt-0.5 rounded text-[#4338CA] focus:ring-[#4338CA]/20"
                    />
                    <div>
                      <span className="font-semibold text-xs text-[#131B2E] block">{res.label}</span>
                      <span className="text-[10px] text-[#64748B] block">{res.description}</span>
                    </div>
                  </label>
                );
              })}
            </div>

            {config.digital?.resources?.includes('other') && (
              <div className="pt-2">
                <label className="block font-semibold text-[#334155] mb-1">
                  Other Digital Resources <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Interactive 3D science simulations, audiobooks, coding sandboxes"
                  value={config.digital?.otherResourceDescription || ''}
                  onChange={(e) =>
                    updateConfig((prev) => ({
                      ...prev,
                      digital: {
                        ...prev.digital,
                        otherResourceDescription: e.target.value,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                />
              </div>
            )}
          </div>

          <div className="pt-2">
            <label className="block font-bold text-[#334155] mb-1">
              Access Model <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {DIGITAL_ACCESS_MODELS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex flex-col p-3 rounded-xl border cursor-pointer transition ${
                    config.digital?.accessModel === opt.value
                      ? 'border-[#4338CA] bg-[#EEF2FF]/40'
                      : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`${formId}-accessModel`}
                      checked={config.digital?.accessModel === opt.value}
                      onChange={() =>
                        updateConfig((prev) => ({
                          ...prev,
                          digital: {
                            ...prev.digital,
                            accessModel: opt.value,
                          },
                        }))
                      }
                      className="text-[#4338CA] focus:ring-[#4338CA]/20"
                    />
                    <span className="font-semibold text-xs text-[#131B2E]">{opt.label}</span>
                  </div>
                  <span className="text-[10px] text-[#64748B] mt-1 pl-5">{opt.description}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── BRANCH 6 & 7: PHYSICAL OR PHYSICAL + DIGITAL ────────────────── */}
      {(status === 'yes_physical' || status === 'yes_physical_digital') && (
        <div className="space-y-6">
          {/* 1. Overview & Book Volume */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#131B2E]">Library Overview &amp; Physical Volume</h4>
                  <p className="text-[#64748B] text-[11px]">
                    Approximate physical collection and reading infrastructure.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block font-bold text-[#334155] mb-1">
                  Approximate number of physical books <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={config.physical?.estimatedPhysicalBookCount ?? 2500}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    updateConfig((prev) => ({
                      ...prev,
                      physical: {
                        ...prev.physical,
                        estimatedPhysicalBookCount: isNaN(val) ? 0 : val,
                      },
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                />
                <p className="text-[10px] text-[#64748B] mt-1 italic">
                  Initial onboarding estimate; later replaced by actual library catalog inventory.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-[#334155] mb-1">Approx. Seating Capacity (Optional)</label>
                <input
                  type="number"
                  min={0}
                  placeholder="e.g. 60"
                  value={config.physical?.approximateSeatingCapacity ?? ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                    updateConfig((prev) => ({
                      ...prev,
                      physical: {
                        ...prev.physical,
                        approximateSeatingCapacity: val,
                      },
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                />
                <p className="text-[10px] text-[#64748B] mt-1">Infrastructure seating capacity.</p>
              </div>

              <div>
                <label className="block font-semibold text-[#334155] mb-1">Number of Reading Seats (Optional)</label>
                <input
                  type="number"
                  min={0}
                  placeholder="e.g. 48"
                  value={config.physical?.readingSeatsCount ?? ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                    updateConfig((prev) => ({
                      ...prev,
                      physical: {
                        ...prev.physical,
                        readingSeatsCount: val,
                      },
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                />
                <p className="text-[10px] text-[#64748B] mt-1">Dedicated student carrels/tables.</p>
              </div>

              <div>
                <label className="block font-semibold text-[#334155] mb-1">Number of Library Rooms</label>
                <input
                  type="number"
                  min={1}
                  value={config.physical?.libraryRoomsCount ?? 1}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    updateConfig((prev) => ({
                      ...prev,
                      physical: {
                        ...prev.physical,
                        libraryRoomsCount: isNaN(val) ? 1 : val,
                      },
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                />
                <p className="text-[10px] text-[#64748B] mt-1">Separate wings or junior/senior rooms.</p>
              </div>
            </div>
          </div>

          {/* 2. Identification System & Hardware */}
          {!isWebsiteOnly && (
            <>
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-[#E2E8F0]">
              <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center shrink-0">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#131B2E]">Book Identification &amp; Inventory Hardware</h4>
                <p className="text-[#64748B] text-[11px]">
                  Choose book tagging methodology (Barcodes, RFID, or Accession Registers).
                </p>
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#334155] mb-1">
                Book Identification Method <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {BOOK_IDENTIFICATION_METHODS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex flex-col p-3 rounded-xl border cursor-pointer transition ${
                      config.identification?.method === opt.value
                        ? 'border-[#4338CA] bg-[#EEF2FF]/40'
                        : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`${formId}-identMethod`}
                        checked={config.identification?.method === opt.value}
                        onChange={() =>
                          updateConfig((prev) => ({
                            ...prev,
                            identification: {
                              ...prev.identification,
                              method: opt.value,
                            },
                          }))
                        }
                        className="text-[#4338CA] focus:ring-[#4338CA]/20"
                      />
                      <span className="font-semibold text-xs text-[#131B2E]">{opt.label}</span>
                    </div>
                    <span className="text-[10px] text-[#64748B] mt-1 pl-5">{opt.description}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Barcode specifics */}
            {(config.identification?.method === 'barcode' ||
              config.identification?.method === 'barcode_rfid') && (
              <div className="p-4 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl space-y-3">
                <span className="font-bold text-xs text-[#131B2E] block">Barcode Integration Details</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#334155] mb-1">Barcode Scanner Hardware</label>
                    <select
                      value={config.identification?.scannerStatus || 'scanner_required'}
                      onChange={(e) =>
                        updateConfig((prev) => ({
                          ...prev,
                          identification: {
                            ...prev.identification,
                            scannerStatus: e.target.value as BarcodeScannerAvailability,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                    >
                      {BARCODE_SCANNER_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-[#334155] mb-1">Barcode Generation</label>
                    <select
                      value={config.identification?.barcodeGeneration || 'system_generated'}
                      onChange={(e) =>
                        updateConfig((prev) => ({
                          ...prev,
                          identification: {
                            ...prev.identification,
                            barcodeGeneration: e.target.value as BarcodeGeneration,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                    >
                      {BARCODE_GENERATION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* RFID specifics */}
            {(config.identification?.method === 'rfid' ||
              config.identification?.method === 'barcode_rfid') && (
              <div className="p-4 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl space-y-3">
                <span className="font-bold text-xs text-[#131B2E] block">RFID Infrastructure &amp; Usage</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#334155] mb-1">RFID Hardware Status</label>
                    <select
                      value={config.identification?.rfidStatus || 'to_be_configured_later'}
                      onChange={(e) =>
                        updateConfig((prev) => ({
                          ...prev,
                          identification: {
                            ...prev.identification,
                            rfidStatus: e.target.value as RfidInfrastructure,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                    >
                      {RFID_INFRASTRUCTURE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#334155] mb-1">RFID Usage Workflow (Optional)</label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {RFID_USAGE_OPTIONS.map((u) => {
                        const isChecked = (config.identification?.rfidUsage || []).includes(u.value);
                        return (
                          <label
                            key={u.value}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] cursor-pointer ${
                              isChecked
                                ? 'bg-[#4338CA]/10 border-[#4338CA] text-[#4338CA] font-semibold'
                                : 'bg-white border-[#E2E8F0] text-[#64748B]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const current = config.identification?.rfidUsage || [];
                                const next = e.target.checked
                                  ? [...current, u.value]
                                  : current.filter((v) => v !== u.value);
                                updateConfig((prev) => ({
                                  ...prev,
                                  identification: {
                                    ...prev.identification,
                                    rfidUsage: next,
                                  },
                                }));
                              }}
                              className="rounded text-[#4338CA] w-3 h-3"
                            />
                            <span>{u.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Circulation & Lending Rules */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-[#E2E8F0]">
              <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center shrink-0">
                <Bookmark className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#131B2E]">Book Circulation, Limits &amp; Loans</h4>
                <p className="text-[#64748B] text-[11px]">
                  Configure student/staff borrow allowances, standard loan periods, and renewals.
                </p>
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#334155] mb-1">
                Lending Available? <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {LENDING_PREFERENCE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex flex-col p-3 rounded-xl border cursor-pointer transition ${
                      config.circulation?.lendingAvailable === opt.value
                        ? 'border-[#4338CA] bg-[#EEF2FF]/40'
                        : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`${formId}-lendingAvailable`}
                        checked={config.circulation?.lendingAvailable === opt.value}
                        onChange={() =>
                          updateConfig((prev) => ({
                            ...prev,
                            circulation: {
                              ...prev.circulation,
                              lendingAvailable: opt.value,
                            },
                          }))
                        }
                        className="text-[#4338CA] focus:ring-[#4338CA]/20"
                      />
                      <span className="font-semibold text-xs text-[#131B2E]">{opt.label}</span>
                    </div>
                    <span className="text-[10px] text-[#64748B] mt-1 pl-5">{opt.description}</span>
                  </label>
                ))}
              </div>
            </div>

            {config.circulation?.lendingAvailable === 'yes' && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-[#334155] mb-1">Max Books Per Student</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={config.circulation?.maxBooksPerStudent ?? 2}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        updateConfig((prev) => ({
                          ...prev,
                          circulation: {
                            ...prev.circulation,
                            maxBooksPerStudent: isNaN(val) ? 2 : val,
                          },
                        }));
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#334155] mb-1">Max Books Per Staff Member</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={config.circulation?.maxBooksPerStaff ?? 5}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        updateConfig((prev) => ({
                          ...prev,
                          circulation: {
                            ...prev.circulation,
                            maxBooksPerStaff: isNaN(val) ? 5 : val,
                          },
                        }));
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#334155] mb-1">Standard Loan Duration</label>
                    <select
                      value={config.circulation?.loanDurationOption || '14_days'}
                      onChange={(e) =>
                        updateConfig((prev) => ({
                          ...prev,
                          circulation: {
                            ...prev.circulation,
                            loanDurationOption: e.target.value as LoanDurationOption,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                    >
                      {LOAN_DURATION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {config.circulation?.loanDurationOption === 'custom' && (
                  <div className="sm:w-1/3">
                    <label className="block font-semibold text-[#334155] mb-1">Custom Loan Days</label>
                    <input
                      type="number"
                      min={1}
                      value={config.circulation?.customLoanDurationDays ?? 14}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        updateConfig((prev) => ({
                          ...prev,
                          circulation: {
                            ...prev.circulation,
                            customLoanDurationDays: isNaN(val) ? 14 : val,
                          },
                        }));
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#F1F5F9]">
                  <div>
                    <label className="block font-semibold text-[#334155] mb-1">Book Renewal Policy</label>
                    <select
                      value={config.circulation?.renewalPolicy || 'allowed'}
                      onChange={(e) =>
                        updateConfig((prev) => ({
                          ...prev,
                          circulation: {
                            ...prev.circulation,
                            renewalPolicy: e.target.value as RenewalPolicyOption,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                    >
                      {RENEWAL_POLICY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {config.circulation?.renewalPolicy === 'allowed' && (
                    <div>
                      <label className="block font-semibold text-[#334155] mb-1">Max Renewals Per Loan</label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={config.circulation?.maxRenewals ?? 2}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          updateConfig((prev) => ({
                            ...prev,
                            circulation: {
                              ...prev.circulation,
                              maxRenewals: isNaN(val) ? 2 : val,
                            },
                          }));
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                      />
                    </div>
                  )}
                </div>

                {/* Reservations */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#F1F5F9]">
                  <div>
                    <label className="block font-semibold text-[#334155] mb-1">Can Users Reserve Books?</label>
                    <select
                      value={config.circulation?.canReserveBooks || 'yes'}
                      onChange={(e) =>
                        updateConfig((prev) => ({
                          ...prev,
                          circulation: {
                            ...prev.circulation,
                            canReserveBooks: e.target.value as any,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                    >
                      <option value="yes">Yes — Hold / Reservations Enabled</option>
                      <option value="no">No Reservations</option>
                      <option value="to_be_configured_later">To Be Configured Later</option>
                    </select>
                  </div>

                  {config.circulation?.canReserveBooks === 'yes' && (
                    <div>
                      <label className="block font-semibold text-[#334155] mb-1">Reservation Access</label>
                      <select
                        value={config.circulation?.reservationAccess || 'students_faculty'}
                        onChange={(e) =>
                          updateConfig((prev) => ({
                            ...prev,
                            circulation: {
                              ...prev.circulation,
                              reservationAccess: e.target.value as ReservationAccessOption,
                            },
                          }))
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                      >
                        {RESERVATION_ACCESS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 4. Overdue, Fine & Lost Policy */}
          {config.circulation?.lendingAvailable === 'yes' && (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-[#E2E8F0]">
                <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center shrink-0">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#131B2E]">Overdue &amp; Fine Policies</h4>
                  <p className="text-[#64748B] text-[11px]">
                    Configure late return fee calculation and lost book compensation.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-[#334155] mb-1">Overdue Fine Model</label>
                  <select
                    value={config.fines?.overdueFineType || 'per_day'}
                    onChange={(e) =>
                      updateConfig((prev) => ({
                        ...prev,
                        fines: {
                          ...prev.fines,
                          overdueFineType: e.target.value as OverdueFineType,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                  >
                    {OVERDUE_FINE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {config.fines?.overdueFineType &&
                  config.fines.overdueFineType !== 'no_fine' &&
                  config.fines.overdueFineType !== 'to_be_configured_later' && (
                    <>
                      <div>
                        <label className="block font-semibold text-[#334155] mb-1">
                          Fine Amount ({currency.symbol} / {currency.code})
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#64748B] font-bold">
                            {currency.symbol}
                          </span>
                          <input
                            type="number"
                            min={0}
                            value={config.fines?.fineAmount ?? 5}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              updateConfig((prev) => ({
                                ...prev,
                                fines: {
                                  ...prev.fines,
                                  fineAmount: isNaN(val) ? 0 : val,
                                },
                              }));
                            }}
                            className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-[#334155] mb-1">Grace Period</label>
                        <select
                          value={config.fines?.gracePeriodOption || '2_days'}
                          onChange={(e) =>
                            updateConfig((prev) => ({
                              ...prev,
                              fines: {
                                ...prev.fines,
                                gracePeriodOption: e.target.value as FineGracePeriodOption,
                              },
                            }))
                          }
                          className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                        >
                          {GRACE_PERIOD_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
              </div>

              {/* Lost or damaged books */}
              <div className="pt-2 border-t border-[#F1F5F9]">
                <label className="block font-semibold text-[#334155] mb-1">Lost / Damaged Book Policy</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {LOST_DAMAGED_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex flex-col p-3 rounded-xl border cursor-pointer transition ${
                        config.fines?.lostDamagedPolicy === opt.value
                          ? 'border-[#4338CA] bg-[#EEF2FF]/40'
                          : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`${formId}-lostDamaged`}
                          checked={config.fines?.lostDamagedPolicy === opt.value}
                          onChange={() =>
                            updateConfig((prev) => ({
                              ...prev,
                              fines: {
                                ...prev.fines,
                                lostDamagedPolicy: opt.value,
                              },
                            }))
                          }
                          className="text-[#4338CA] focus:ring-[#4338CA]/20"
                        />
                        <span className="font-semibold text-xs text-[#131B2E]">{opt.label}</span>
                      </div>
                      <span className="text-[10px] text-[#64748B] mt-1 pl-5">{opt.description}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 5. Membership & Staffing */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-[#E2E8F0]">
              <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#131B2E]">Library Membership &amp; Staff Administration</h4>
                <p className="text-[#64748B] text-[11px]">
                  Institutional member eligibility and management staffing model.
                </p>
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#334155] mb-1">Eligible Library Members</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {ELIGIBLE_MEMBERS_OPTIONS.map((m) => {
                  const isChecked = (config.membership?.eligibleMembers || []).includes(m.value);
                  return (
                    <label
                      key={m.value}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer ${
                        isChecked ? 'bg-[#EEF2FF]/50 border-[#4338CA] font-semibold text-[#4338CA]' : 'border-[#E2E8F0] text-[#64748B]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const current = config.membership?.eligibleMembers || [];
                          const next = e.target.checked ? [...current, m.value] : current.filter((v) => v !== m.value);
                          updateConfig((prev) => ({
                            ...prev,
                            membership: {
                              ...prev.membership,
                              eligibleMembers: next,
                            },
                          }));
                        }}
                        className="rounded text-[#4338CA]"
                      />
                      <span className="truncate">{m.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#334155] mb-1">Library Management Staffing Model</label>
              <select
                value={config.staffing?.managementModel || 'dedicated_librarian'}
                onChange={(e) =>
                  updateConfig((prev) => ({
                    ...prev,
                    staffing: {
                      ...prev.staffing,
                      managementModel: e.target.value as LibraryManagementStaff,
                    },
                  }))
                }
                className="w-full sm:w-1/2 px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
              >
                {LIBRARY_MANAGEMENT_STAFF_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} — {opt.description}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-[#64748B] mt-1">
                Individual librarian personnel and user credentials are automatically managed via the canonical Staff &amp; Faculty module.
              </p>
            </div>
          </div>
        </>
      )}

          {/* 6. Digital Library Section (When Physical + Digital) */}
          {status === 'yes_physical_digital' && (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-[#E2E8F0]">
                <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center shrink-0">
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#131B2E]">Digital Library Resources (Hybrid)</h4>
                  <p className="text-[#64748B] text-[11px]">
                    Select electronic resources available alongside physical library stacks.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {DIGITAL_RESOURCE_OPTIONS.map((res) => {
                  const isChecked = (config.digital?.resources || []).includes(res.value);
                  return (
                    <label
                      key={res.value}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                        isChecked ? 'border-[#4338CA] bg-[#EEF2FF]/40' : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const current = config.digital?.resources || [];
                          const next = e.target.checked
                            ? [...current, res.value]
                            : current.filter((v) => v !== res.value);
                          updateConfig((prev) => ({
                            ...prev,
                            digital: {
                              ...prev.digital,
                              resources: next,
                            },
                          }));
                        }}
                        className="mt-0.5 rounded text-[#4338CA] focus:ring-[#4338CA]/20"
                      />
                      <div>
                        <span className="font-semibold text-xs text-[#131B2E] block">{res.label}</span>
                        <span className="text-[10px] text-[#64748B] block">{res.description}</span>
                      </div>
                    </label>
                  );
                })}
              </div>

              {config.digital?.resources?.includes('other') && (
                <div>
                  <label className="block font-semibold text-[#334155] mb-1">Other Digital Resources</label>
                  <input
                    type="text"
                    placeholder="e.g. Virtual science labs, video repository"
                    value={config.digital?.otherResourceDescription || ''}
                    onChange={(e) =>
                      updateConfig((prev) => ({
                        ...prev,
                        digital: {
                          ...prev.digital,
                          otherResourceDescription: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                  />
                </div>
              )}
            </div>
          )}

          {/* 7. Collapsible Advanced: Inventory Management & Software */}
          {!isWebsiteOnly && (
            <>
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs space-y-4">
            <button
              type="button"
              onClick={() => setShowAdvancedInventory((prev) => !prev)}
              className="w-full flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] text-[#4338CA] flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#131B2E] group-hover:text-[#4338CA] transition">
                    Inventory Auditing &amp; Library Software (Optional)
                  </h4>
                  <p className="text-[10px] text-[#64748B]">
                    Stocktaking frequency and existing library management software integration.
                  </p>
                </div>
              </div>
              {showAdvancedInventory ? (
                <ChevronUp className="w-4 h-4 text-[#64748B]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#64748B]" />
              )}
            </button>

            {showAdvancedInventory && (
              <div className="pt-3 border-t border-[#F1F5F9] space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-[#334155] mb-1">Inventory Management Strategy</label>
                    <select
                      value={config.inventory?.managementType || 'fully_digital'}
                      onChange={(e) =>
                        updateConfig((prev) => ({
                          ...prev,
                          inventory: {
                            ...prev.inventory,
                            managementType: e.target.value as InventoryManagementType,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                    >
                      {INVENTORY_MANAGEMENT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#334155] mb-1">Inventory Audit Frequency</label>
                    <select
                      value={config.inventory?.auditFrequency || 'annually'}
                      onChange={(e) =>
                        updateConfig((prev) => ({
                          ...prev,
                          inventory: {
                            ...prev.inventory,
                            auditFrequency: e.target.value as InventoryAuditFrequency,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                    >
                      {INVENTORY_AUDIT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#F1F5F9] grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-[#334155] mb-1">Library System</label>
                    <select
                      value={config.software?.system || 'school_erp_library'}
                      onChange={(e) =>
                        updateConfig((prev) => ({
                          ...prev,
                          software: {
                            ...prev.software,
                            system: e.target.value as LibrarySoftwareSystem,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                    >
                      {LIBRARY_SOFTWARE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {(config.software?.system === 'existing_software' ||
                    config.software?.system === 'standalone_software') && (
                    <div>
                      <label className="block font-semibold text-[#334155] mb-1">Existing System Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Koha ILS, LibSys 10"
                        value={config.software?.existingSystemName || ''}
                        onChange={(e) =>
                          updateConfig((prev) => ({
                            ...prev,
                            software: {
                              ...prev.software,
                              existingSystemName: e.target.value,
                            },
                          }))
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 8. Collapsible Advanced: Parent Visibility & Automation Alerts */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs space-y-4">
            <button
              type="button"
              onClick={() => setShowAdvancedVisibility((prev) => !prev)}
              className="w-full flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] text-[#4338CA] flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#131B2E] group-hover:text-[#4338CA] transition">
                    Parent App Visibility &amp; Automated Alerts (Optional)
                  </h4>
                  <p className="text-[10px] text-[#64748B]">
                    Due date reminders, overdue alerts, and parent mobile app transparency.
                  </p>
                </div>
              </div>
              {showAdvancedVisibility ? (
                <ChevronUp className="w-4 h-4 text-[#64748B]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#64748B]" />
              )}
            </button>

            {showAdvancedVisibility && (
              <div className="pt-3 border-t border-[#F1F5F9] space-y-4 animate-fadeIn">
                <div>
                  <label className="block font-semibold text-[#334155] mb-1">
                    Parents Can View Student Library Activity?
                  </label>
                  <select
                    value={config.visibility?.parentVisibilityEnabled || 'yes'}
                    onChange={(e) =>
                      updateConfig((prev) => ({
                        ...prev,
                        visibility: {
                          ...prev.visibility,
                          parentVisibilityEnabled: e.target.value as any,
                        },
                      }))
                    }
                    className="w-full sm:w-1/3 px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                  >
                    <option value="yes">Yes — Enabled on Parent Mobile App</option>
                    <option value="no">No — Internal School Records Only</option>
                    <option value="to_be_decided">To Be Decided Later</option>
                  </select>
                </div>

                {config.visibility?.parentVisibilityEnabled === 'yes' && (
                  <div>
                    <label className="block font-semibold text-[#334155] mb-1">Visible Items for Parents</label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {PARENT_VISIBILITY_OPTIONS.map((item) => {
                        const isChecked = (config.visibility?.visibleItems || []).includes(item.value);
                        return (
                          <label
                            key={item.value}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs cursor-pointer ${
                              isChecked
                                ? 'bg-[#4338CA]/10 border-[#4338CA] text-[#4338CA] font-semibold'
                                : 'bg-white border-[#E2E8F0] text-[#64748B]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const current = config.visibility?.visibleItems || [];
                                const next = e.target.checked
                                  ? [...current, item.value]
                                  : current.filter((v) => v !== item.value);
                                updateConfig((prev) => ({
                                  ...prev,
                                  visibility: {
                                    ...prev.visibility,
                                    visibleItems: next,
                                  },
                                }));
                              }}
                              className="rounded text-[#4338CA]"
                            />
                            <span>{item.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-[#F1F5F9]">
                  <label className="block font-semibold text-[#334155] mb-1">Automation Requirements</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {AUTOMATION_FEATURE_OPTIONS.map((feat) => {
                      const isChecked = (config.automation?.features || []).includes(feat.value);
                      return (
                        <label
                          key={feat.value}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer ${
                            isChecked ? 'bg-[#EEF2FF]/50 border-[#4338CA] font-semibold text-[#4338CA]' : 'border-[#E2E8F0] text-[#64748B]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const current = config.automation?.features || [];
                              const next = e.target.checked
                                ? [...current.filter((f) => f !== 'none'), feat.value]
                                : current.filter((f) => f !== feat.value);
                              updateConfig((prev) => ({
                                ...prev,
                                automation: {
                                  ...prev.automation,
                                  features: next,
                                },
                              }));
                            }}
                            className="rounded text-[#4338CA]"
                          />
                          <span className="truncate">{feat.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#334155] mb-1">Notification Channels</label>
                  <div className="flex flex-wrap gap-2">
                    {NOTIFICATION_CHANNEL_OPTIONS.map((chan) => {
                      const isChecked = (config.automation?.channels || []).includes(chan.value);
                      return (
                        <label
                          key={chan.value}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs cursor-pointer ${
                            isChecked
                              ? 'bg-[#4338CA]/10 border-[#4338CA] text-[#4338CA] font-semibold'
                              : 'bg-white border-[#E2E8F0] text-[#64748B]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const current = config.automation?.channels || [];
                              const next = e.target.checked
                                ? [...current, chan.value]
                                : current.filter((v) => v !== chan.value);
                              updateConfig((prev) => ({
                                ...prev,
                                automation: {
                                  ...prev.automation,
                                  channels: next,
                                },
                              }));
                            }}
                            className="rounded text-[#4338CA]"
                          />
                          <span>{chan.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )}

      {/* ─── DYNAMIC CONFIGURATION SUMMARY CARD (PROMPT SECTION 30) ──────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
          <Sparkles className="w-4 h-4 text-[#4338CA]" />
          <h4 className="font-bold text-xs uppercase tracking-wider text-[#131B2E]">
            Library Configuration Summary
          </h4>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {summaryItems.map((item, idx) => (
            <div key={idx} className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E2E8F0]/60 space-y-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] block">
                {item.label}
              </span>
              <span className="font-bold text-xs text-[#131B2E] block truncate" title={item.value}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Live validation feedback */}
      {!validation.isValid && validation.missingFields.length > 0 && (
        <div
          role="alert"
          className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl text-xs flex items-start space-x-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
          <div>
            <span className="font-bold block">Please complete the required library fields:</span>
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] text-amber-800">
              {validation.missingFields.map((field, idx) => (
                <li key={idx}>{field}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
