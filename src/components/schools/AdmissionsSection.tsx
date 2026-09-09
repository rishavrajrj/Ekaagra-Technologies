'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  GraduationCap,
  Calendar,
  Phone,
  Mail,
  Clock,
  MapPin,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Info,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  ArrowUpDown,
  MoveUp,
  MoveDown,
  Check,
  Eye,
  Sparkles,
  Layers,
  HelpCircle,
} from 'lucide-react';
import type {
  UniversalIntakeData,
  SchoolProject,
  AdmissionsData,
  AdmissionStatus,
  ClassAdmissionStatus,
  ContactPreferredMethod,
  FeeFrequency,
  DocumentRequirement,
  ApplicationMethod,
  AdmissionCtaOption,
  AdmissionClassAvailabilityItem,
  AdmissionFeeItem,
  AdmissionImportantDateItem,
  AdmissionProcessStep,
  AdmissionDocumentItem,
} from '@/lib/types';
import {
  DEFAULT_ADMISSION_STATUS_OPTIONS,
  DEFAULT_CLASS_ADMISSION_STATUSES,
  DEFAULT_FEE_FREQUENCIES,
  DEFAULT_APPLICATION_METHODS,
  DEFAULT_CTA_OPTIONS,
  DEFAULT_VISITING_HOURS_PRESETS,
  HOURS_START_OPTIONS,
  HOURS_END_OPTIONS,
  formatVisitingHours,
  normalizeAdmissionsData,
  getAdmissionsWebsiteOutput,
} from '@/lib/admissionsUtils';

interface AdmissionsSectionProps {
  project: SchoolProject;
  intakeData: UniversalIntakeData;
  updateSectionField: (section: keyof UniversalIntakeData, field: string, value: any) => void;
  updateSectionDirect: (section: keyof UniversalIntakeData, value: any) => void;
}

export default function AdmissionsSection({
  project,
  intakeData,
  updateSectionField,
  updateSectionDirect,
}: AdmissionsSectionProps) {
  // Canonical context derived from other sections
  const canonicalContext = useMemo(() => {
    const mainCampus = intakeData.campuses?.[0];
    const canonicalClasses = intakeData.institutionStructure?.classes || [];
    const canonicalSession = intakeData.institutionStructure?.currentAcademicSession;
    const country = mainCampus?.country || 'India';
    const currency = country.toLowerCase() === 'india' ? 'INR' : 'USD';
    const officialEmail = intakeData.schoolProfile?.officialEmail || project.primary_contact_email;
    const officialPhone = intakeData.schoolProfile?.officialPhone || project.primary_contact_phone;
    const schoolAddress = mainCampus?.address ? `${mainCampus.address}, ${mainCampus.city || ''}` : '';

    return {
      classes: canonicalClasses,
      session: canonicalSession,
      country,
      currency,
      officialEmail,
      officialPhone,
      schoolAddress,
      principalName: intakeData.leadership?.principalName,
    };
  }, [intakeData, project]);

  // Normalized admissions data
  const admissions: AdmissionsData = useMemo(() => {
    return normalizeAdmissionsData(intakeData.admissions, canonicalContext);
  }, [intakeData.admissions, canonicalContext]);

  const isWebsiteIncluded = project?.product_id !== 'school-erp';

  // Collapsible cards state
  const [showEligibilityDetails, setShowEligibilityDetails] = useState(
    Boolean(
      admissions.eligibility?.minimumAge ||
        admissions.eligibility?.maximumAge ||
        admissions.eligibility?.notes ||
        admissions.eligibility?.entranceAssessment ||
        admissions.eligibility?.interviewRequired
    )
  );
  const [showProcessDetails, setShowProcessDetails] = useState(false);
  const [showImportantDates, setShowImportantDates] = useState(
    Boolean(admissions.importantDates && admissions.importantDates.length > 0)
  );
  const [showAdditionalNotes, setShowAdditionalNotes] = useState(
    Boolean(admissions.additionalInformation && admissions.additionalInformation.trim().length > 0)
  );
  const [showWebsitePreview, setShowWebsitePreview] = useState(false);

  // New item draft inputs
  const [newClassName, setNewClassName] = useState('');
  const [newCustomDocName, setNewCustomDocName] = useState('');

  // Visiting hours schedule helper state
  const [showHoursPicker, setShowHoursPicker] = useState(false);
  const [pickerStartTime, setPickerStartTime] = useState('09:00 AM');
  const [pickerEndTime, setPickerEndTime] = useState('12:30 PM');
  const [pickerDays, setPickerDays] = useState('Mon–Sat');

  const currentVisitingHours = admissions.contact?.visitingHours || '';
  const suggestedFormattedHours = useMemo(() => {
    if (!currentVisitingHours) return '';
    const formatted = formatVisitingHours(currentVisitingHours);
    return formatted && formatted !== currentVisitingHours ? formatted : '';
  }, [currentVisitingHours]);

  // Mutator helper to update structured admissions state
  const updateAdmissions = useCallback(
    (updater: (prev: AdmissionsData) => AdmissionsData) => {
      const updated = updater(admissions);
      const normalized = normalizeAdmissionsData(updated, canonicalContext);
      updateSectionDirect('admissions', normalized);
    },
    [admissions, canonicalContext, updateSectionDirect]
  );

  // Derived website preview payload
  const websiteOutput = useMemo(() => {
    return getAdmissionsWebsiteOutput(admissions, canonicalContext);
  }, [admissions, canonicalContext]);

  // Contact matching checks for subtle indicator
  const isEmailFromSchool =
    Boolean(admissions.contact?.email) &&
    Boolean(canonicalContext.officialEmail) &&
    admissions.contact?.email?.toLowerCase().trim() === canonicalContext.officialEmail?.toLowerCase().trim();

  const isPhoneFromSchool =
    Boolean(admissions.contact?.phone) &&
    Boolean(canonicalContext.officialPhone) &&
    admissions.contact?.phone?.replace(/\D/g, '') === canonicalContext.officialPhone?.replace(/\D/g, '');

  return (
    <div className="space-y-6 text-xs text-[#131B2E]">
      {/* ─── 1. SECTION HEADER & PURPOSE CARD ───────────────────────────── */}
      <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 flex items-start space-x-3.5 shadow-2xs">
        <div className="w-9 h-9 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0 text-[#4338CA] shadow-2xs mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-1 min-w-0">
          <h4 className="text-xs sm:text-sm font-bold text-[#131B2E]">How this information is used</h4>
          <p className="text-[11px] sm:text-xs text-[#64748B] leading-relaxed">
            Admission information helps prepare your school’s admissions pages, application experience, fee information,
            eligibility guidance and enquiry content.
          </p>
        </div>
      </div>

      {/* ─── 2. ADMISSION CYCLE ─────────────────────────────────────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 md:p-6 space-y-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3.5">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center text-[#4338CA] shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#131B2E]">Admission Cycle</h3>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                Define the active academic intake session and overall application timeline.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-[#4338CA] bg-[#EEF2FF] border border-[#C7D2FE] px-2.5 py-1 rounded-md self-start sm:self-auto">
            Cycle Configuration
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {/* Target Admission Session */}
          <div>
            <div className="flex items-center space-x-1.5 mb-1.5">
              <label htmlFor="target-session-input" className="block font-bold text-xs text-[#334155]">
                Target Admission Session
              </label>
              <span className="text-rose-500 font-bold text-xs" title="Required field">*</span>
              {canonicalContext.session && admissions.session === canonicalContext.session && (
                <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-medium ml-1">
                  From Academic Structure
                </span>
              )}
            </div>
            <input
              id="target-session-input"
              type="text"
              value={admissions.session || ''}
              onChange={(e) => updateAdmissions((prev) => ({ ...prev, session: e.target.value }))}
              placeholder="e.g. 2026–2027"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-sm text-[#131B2E] placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
            />
            <p className="text-[11px] text-[#64748B] mt-1.5">
              Exact session label displayed across application forms and website badges.
            </p>
          </div>

          {/* Admission Status */}
          <div>
            <div className="flex items-center space-x-1.5 mb-1.5">
              <label htmlFor="admission-status-select" className="block font-bold text-xs text-[#334155]">
                Admission Status
              </label>
            </div>
            <select
              id="admission-status-select"
              value={admissions.status || 'upcoming'}
              onChange={(e) => updateAdmissions((prev) => ({ ...prev, status: e.target.value as AdmissionStatus }))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-sm text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
            >
              {DEFAULT_ADMISSION_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} — {opt.badge}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#64748B] mt-1.5">
              {DEFAULT_ADMISSION_STATUS_OPTIONS.find((s) => s.value === admissions.status)?.description}
            </p>
          </div>

          {/* Application Start Date (Optional) */}
          <div>
            <label htmlFor="app-start-date" className="block font-bold text-xs text-[#334155] mb-1.5">
              Application Start Date <span className="font-normal text-[#94A3B8]">(Optional)</span>
            </label>
            <input
              id="app-start-date"
              type="date"
              value={admissions.applicationStartDate || ''}
              onChange={(e) => updateAdmissions((prev) => ({ ...prev, applicationStartDate: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
            />
          </div>

          {/* Application Last Date (Optional) */}
          <div>
            <label htmlFor="app-end-date" className="block font-bold text-xs text-[#334155] mb-1.5">
              Application Last Date <span className="font-normal text-[#94A3B8]">(Optional)</span>
            </label>
            <input
              id="app-end-date"
              type="date"
              value={admissions.applicationEndDate || ''}
              onChange={(e) => updateAdmissions((prev) => ({ ...prev, applicationEndDate: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
            />
            {admissions.applicationStartDate && admissions.applicationEndDate && admissions.applicationEndDate < admissions.applicationStartDate && (
              <p className="text-[11px] text-rose-600 mt-1 font-medium flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 inline" />
                <span>Last date cannot precede the start date.</span>
              </p>
            )}
          </div>

          {/* Admission Cycle Notes (Optional) */}
          <div className="md:col-span-2">
            <label htmlFor="admission-cycle-notes" className="block font-bold text-xs text-[#334155] mb-1.5">
              Admission Cycle Notes <span className="font-normal text-[#94A3B8]">(Optional)</span>
            </label>
            <input
              id="admission-cycle-notes"
              type="text"
              value={admissions.admissionCycleNotes || ''}
              onChange={(e) => updateAdmissions((prev) => ({ ...prev, admissionCycleNotes: e.target.value }))}
              placeholder="e.g. Early bird registrations close November 30; late applications subject to seat availability."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#131B2E] placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* ─── 3. ADMISSIONS CONTACT ──────────────────────────────────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 md:p-6 space-y-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3.5">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center text-[#4338CA] shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#131B2E]">Admissions Contact</h3>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                Official contact desk for parent inquiries, counseling, and document submissions.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-[#4338CA] bg-[#EEF2FF] border border-[#C7D2FE] px-2.5 py-1 rounded-md self-start sm:self-auto">
            Contact Information
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* Admission In-Charge Name */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-1.5 mb-1.5">
              <label htmlFor="contact-name" className="block font-bold text-xs text-[#334155]">
                Admission In-Charge Name
              </label>
              <span className="text-rose-500 font-bold text-xs" title="Required field">*</span>
            </div>
            <input
              id="contact-name"
              type="text"
              value={admissions.contact?.name || ''}
              onChange={(e) =>
                updateAdmissions((prev) => ({
                  ...prev,
                  contact: { ...(prev.contact || {}), name: e.target.value },
                }))
              }
              placeholder="e.g. Mrs. Sunita Sharma"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#131B2E] placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
            />
          </div>

          {/* Primary Admissions Phone */}
          <div>
            <div className="flex items-center space-x-1.5 mb-1.5">
              <label htmlFor="contact-phone" className="block font-bold text-xs text-[#334155]">
                Primary Admissions Phone
              </label>
              <span className="text-rose-500 font-bold text-xs" title="Required field">*</span>
              {isPhoneFromSchool && (
                <span className="text-[10px] text-[#4338CA] bg-[#EEF2FF] border border-[#C7D2FE] px-1.5 py-0.2 rounded font-medium">
                  From School Info
                </span>
              )}
            </div>
            <input
              id="contact-phone"
              type="tel"
              value={admissions.contact?.phone || ''}
              onChange={(e) =>
                updateAdmissions((prev) => ({
                  ...prev,
                  contact: { ...(prev.contact || {}), phone: e.target.value },
                }))
              }
              placeholder="e.g. +91 98765 43210"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#131B2E] placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
            />
          </div>

          {/* Admissions Email */}
          <div>
            <div className="flex items-center space-x-1.5 mb-1.5">
              <label htmlFor="contact-email" className="block font-bold text-xs text-[#334155]">
                Admissions Email
              </label>
              {isEmailFromSchool && (
                <span className="text-[10px] text-[#4338CA] bg-[#EEF2FF] border border-[#C7D2FE] px-1.5 py-0.2 rounded font-medium">
                  From School Info
                </span>
              )}
            </div>
            <input
              id="contact-email"
              type="email"
              value={admissions.contact?.email || ''}
              onChange={(e) =>
                updateAdmissions((prev) => ({
                  ...prev,
                  contact: { ...(prev.contact || {}), email: e.target.value },
                }))
              }
              placeholder="e.g. admissions@school.edu.in"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#131B2E] placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
            />
          </div>

          {/* WhatsApp Number (Optional) */}
          <div>
            <label htmlFor="contact-whatsapp" className="block font-bold text-xs text-[#334155] mb-1.5">
              WhatsApp Number <span className="font-normal text-[#94A3B8]">(Optional)</span>
            </label>
            <input
              id="contact-whatsapp"
              type="tel"
              value={admissions.contact?.whatsapp || ''}
              onChange={(e) =>
                updateAdmissions((prev) => ({
                  ...prev,
                  contact: { ...(prev.contact || {}), whatsapp: e.target.value },
                }))
              }
              placeholder="e.g. +91 98765 43210"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#131B2E] placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
            />
          </div>

          {/* Office Visiting Hours */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="contact-hours" className="block font-bold text-xs text-[#334155]">
                Office Visiting Hours <span className="font-normal text-[#94A3B8]">(Optional)</span>
              </label>
              <button
                type="button"
                onClick={() => setShowHoursPicker(!showHoursPicker)}
                className="text-[11px] font-bold text-[#4338CA] hover:text-[#3730A3] hover:underline flex items-center gap-1 cursor-pointer transition"
              >
                <Clock className="w-3.5 h-3.5" />
                {showHoursPicker ? 'Hide Helper' : 'Time & Days Helper'}
              </button>
            </div>

            <div className="relative">
              <input
                id="contact-hours"
                type="text"
                value={admissions.contact?.visitingHours || ''}
                onChange={(e) =>
                  updateAdmissions((prev) => ({
                    ...prev,
                    contact: { ...(prev.contact || {}), visitingHours: e.target.value },
                  }))
                }
                onBlur={(e) => {
                  const raw = e.target.value;
                  const formatted = formatVisitingHours(raw);
                  if (formatted && formatted !== raw) {
                    updateAdmissions((prev) => ({
                      ...prev,
                      contact: { ...(prev.contact || {}), visitingHours: formatted },
                    }));
                  }
                }}
                placeholder="e.g. 09:00 AM – 12:30 PM (Mon–Sat)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#131B2E] placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs font-medium"
              />
            </div>

            {/* Smart Format Suggestion Chip */}
            {suggestedFormattedHours && (
              <div className="flex items-center gap-2 pt-0.5 animate-in fade-in duration-100">
                <span className="text-[10px] text-[#64748B]">Auto-format cleanly:</span>
                <button
                  type="button"
                  onClick={() =>
                    updateAdmissions((prev) => ({
                      ...prev,
                      contact: { ...(prev.contact || {}), visitingHours: suggestedFormattedHours },
                    }))
                  }
                  className="px-2 py-0.5 rounded-md bg-[#EEF2FF] hover:bg-[#E0E7FF] border border-[#C7D2FE] text-[#4338CA] font-bold text-[10px] flex items-center gap-1 transition cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-[#4338CA]" />
                  <span>{suggestedFormattedHours}</span>
                  <span className="underline ml-0.5 font-bold">Apply</span>
                </button>
              </div>
            )}

            {/* Interactive Schedule Helper / Presets */}
            {showHoursPicker && (
              <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 space-y-2.5 mt-1.5 shadow-2xs animate-in fade-in duration-150">
                <div>
                  <span className="font-bold text-[10px] text-[#475569] uppercase tracking-wider block mb-1.5">
                    Quick Presets (1-Click)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {DEFAULT_VISITING_HOURS_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          updateAdmissions((prev) => ({
                            ...prev,
                            contact: { ...(prev.contact || {}), visitingHours: preset },
                          }));
                          setShowHoursPicker(false);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition border cursor-pointer ${
                          admissions.contact?.visitingHours === preset
                            ? 'bg-[#4338CA] text-white border-[#4338CA] shadow-2xs'
                            : 'bg-white hover:bg-[#F1F5F9] text-[#334155] border-[#CBD5E1]'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E2E8F0]">
                  <span className="font-bold text-[10px] text-[#475569] uppercase tracking-wider block mb-1.5">
                    Schedule Builder
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-[#64748B] mb-0.5">From Time</label>
                      <select
                        value={pickerStartTime}
                        onChange={(e) => setPickerStartTime(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg bg-white border border-[#CBD5E1] text-[11px] text-[#131B2E]"
                      >
                        {HOURS_START_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#64748B] mb-0.5">To Time</label>
                      <select
                        value={pickerEndTime}
                        onChange={(e) => setPickerEndTime(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg bg-white border border-[#CBD5E1] text-[11px] text-[#131B2E]"
                      >
                        {HOURS_END_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#64748B] mb-0.5">Operating Days</label>
                      <select
                        value={pickerDays}
                        onChange={(e) => setPickerDays(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg bg-white border border-[#CBD5E1] text-[11px] text-[#131B2E]"
                      >
                        <option value="Mon–Sat">Mon – Sat</option>
                        <option value="Mon–Fri">Mon – Fri</option>
                        <option value="All Working Days">All Working Days</option>
                        <option value="Mon–Sat (Except 2nd Sat)">Mon – Sat (Except 2nd Sat)</option>
                        <option value="Daily">Daily</option>
                      </select>
                    </div>
                  </div>
                  <div className="pt-2 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-[#475569] truncate">
                      Preview: <strong className="text-[#131B2E]">{pickerStartTime} – {pickerEndTime} ({pickerDays})</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const built = `${pickerStartTime} – ${pickerEndTime} (${pickerDays})`;
                        updateAdmissions((prev) => ({
                          ...prev,
                          contact: { ...(prev.contact || {}), visitingHours: built },
                        }));
                        setShowHoursPicker(false);
                      }}
                      className="px-3 py-1 bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-[10px] rounded-lg shadow-2xs transition cursor-pointer shrink-0"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Preferred Contact Method */}
          <div>
            <label htmlFor="contact-pref-method" className="block font-bold text-xs text-[#334155] mb-1.5">
              Preferred Contact Method
            </label>
            <select
              id="contact-pref-method"
              value={admissions.contact?.preferredMethod || 'phone'}
              onChange={(e) =>
                updateAdmissions((prev) => ({
                  ...prev,
                  contact: { ...(prev.contact || {}), preferredMethod: e.target.value as ContactPreferredMethod },
                }))
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
            >
              <option value="phone">Phone Call</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
              <option value="in_person">In Person (Campus Visit)</option>
            </select>
          </div>

          {/* Admissions Office Address (Optional) */}
          <div className="sm:col-span-2 lg:col-span-3">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="contact-address" className="block font-bold text-xs text-[#334155]">
                Admissions Office Address <span className="font-normal text-[#94A3B8]">(Optional if campus address applies)</span>
              </label>
              {canonicalContext.schoolAddress && !admissions.contact?.address && (
                <button
                  type="button"
                  onClick={() =>
                    updateAdmissions((prev) => ({
                      ...prev,
                      contact: { ...(prev.contact || {}), address: canonicalContext.schoolAddress },
                    }))
                  }
                  className="text-[11px] text-[#4338CA] hover:underline font-medium"
                >
                  Use Main Campus Address
                </button>
              )}
            </div>
            <input
              id="contact-address"
              type="text"
              value={admissions.contact?.address || ''}
              onChange={(e) =>
                updateAdmissions((prev) => ({
                  ...prev,
                  contact: { ...(prev.contact || {}), address: e.target.value },
                }))
              }
              placeholder={canonicalContext.schoolAddress || 'e.g. Administrative Block, Room 102, Ground Floor'}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#131B2E] placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* ─── 4. APPLICATION & INTAKE OPTIONS ────────────────────────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 md:p-6 space-y-4 shadow-2xs">
        <div className="flex items-center space-x-2.5 border-b border-[#E2E8F0] pb-3.5">
          <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center text-[#4338CA] shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#131B2E]">Application &amp; Intake Options</h3>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Select which modes of application and enquiry are available to parents.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            {
              key: 'admissionsOpen',
              label: 'Admissions Open',
              desc: 'Publicly display "Admissions Open" status badges.',
            },
            {
              key: 'onlineApplication',
              label: 'Online Application',
              desc: 'Enable digital admission forms on website or portal.',
            },
            {
              key: 'documentUpload',
              label: 'Document Upload',
              desc: 'Accept digital uploads of certificates and records.',
            },
            {
              key: 'walkInApplication',
              label: 'Walk-in Application',
              desc: 'Accept paper forms submitted directly at the office.',
            },
            {
              key: 'enquiryEnabled',
              label: 'Enquiry / Callback Request',
              desc: 'Capture admission interest leads for counselor follow-up.',
            },
            {
              key: 'applicationFeeRequired',
              label: 'Application Fee Required',
              desc: 'Application requires form or registration fee payment.',
            },
          ].map((item) => {
            const isChecked = Boolean(
              admissions.applicationOptions?.[item.key as keyof typeof admissions.applicationOptions]
            );
            return (
              <label
                key={item.key}
                className={`flex items-start space-x-3 p-3.5 rounded-xl border transition cursor-pointer select-none ${
                  isChecked
                    ? 'bg-[#EEF2FF]/60 border-[#C7D2FE]'
                    : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) =>
                    updateAdmissions((prev) => ({
                      ...prev,
                      applicationOptions: {
                        ...(prev.applicationOptions || {}),
                        [item.key]: e.target.checked,
                      },
                    }))
                  }
                  className="mt-0.5 h-4 w-4 rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20 shrink-0"
                />
                <div className="min-w-0">
                  <span className="font-bold text-xs text-[#131B2E] block">{item.label}</span>
                  <span className="text-[10px] text-[#64748B] block mt-0.5 leading-normal">{item.desc}</span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* ─── 5. CLASS-WISE ADMISSION AVAILABILITY ────────────────────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 md:p-6 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3.5">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center text-[#4338CA] shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#131B2E]">Admission Availability</h3>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                Class-wise availability status for the active cycle. Initial roster derived from your academic structure.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md self-start sm:self-auto">
            {admissions.classAvailability?.filter((c) => c.status === 'open').length || 0} Open /{' '}
            {admissions.classAvailability?.length || 0} Classes
          </span>
        </div>

        {/* Dynamic Class Table */}
        <div className="space-y-2.5">
          <div className="hidden sm:grid grid-cols-12 gap-3 px-3 py-2 text-[11px] font-bold text-[#64748B] uppercase tracking-wider bg-[#F8FAFC] rounded-lg">
            <span className="col-span-4">Class / Grade</span>
            <span className="col-span-3">Admission Status</span>
            <span className="col-span-2">Available Seats</span>
            <span className="col-span-2">Notes</span>
            <span className="col-span-1 text-center">Action</span>
          </div>

          {(admissions.classAvailability || []).map((cls, idx) => (
            <div
              key={cls.id}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 p-3 sm:p-2.5 rounded-xl border border-[#E2E8F0] bg-white items-center hover:border-[#CBD5E1] transition shadow-2xs"
            >
              {/* Class Name */}
              <div className="col-span-1 sm:col-span-4 flex items-center justify-between sm:justify-start">
                <span className="font-bold text-xs text-[#131B2E]">{cls.className}</span>
                <span className="sm:hidden text-[10px] text-[#64748B]">Row #{idx + 1}</span>
              </div>

              {/* Status Select */}
              <div className="col-span-1 sm:col-span-3">
                <select
                  value={cls.status}
                  onChange={(e) => {
                    const nextStatus = e.target.value as ClassAdmissionStatus;
                    updateAdmissions((prev) => {
                      const copy = [...(prev.classAvailability || [])];
                      copy[idx] = { ...copy[idx], status: nextStatus };
                      return { ...prev, classAvailability: copy };
                    });
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs font-medium text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:outline-hidden"
                >
                  {DEFAULT_CLASS_ADMISSION_STATUSES.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Available Seats (Optional) */}
              <div className="col-span-1 sm:col-span-2">
                <input
                  type="number"
                  min={0}
                  value={cls.availableSeats ?? ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                    updateAdmissions((prev) => {
                      const copy = [...(prev.classAvailability || [])];
                      copy[idx] = { ...copy[idx], availableSeats: val !== undefined && !isNaN(val) ? val : undefined };
                      return { ...prev, classAvailability: copy };
                    });
                  }}
                  placeholder="Seats (Opt)"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs text-[#131B2E] placeholder:text-[#94A3B8] font-mono hover:border-[#CBD5E1] focus:border-[#4338CA] focus:outline-hidden"
                />
              </div>

              {/* Notes (Optional) */}
              <div className="col-span-1 sm:col-span-2">
                <input
                  type="text"
                  value={cls.notes || ''}
                  onChange={(e) => {
                    const notes = e.target.value;
                    updateAdmissions((prev) => {
                      const copy = [...(prev.classAvailability || [])];
                      copy[idx] = { ...copy[idx], notes };
                      return { ...prev, classAvailability: copy };
                    });
                  }}
                  placeholder="e.g. Day scholars only"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs text-[#131B2E] placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:outline-hidden"
                />
              </div>

              {/* Delete button (removes from admissions availability ONLY, NOT canonical classes) */}
              <div className="col-span-1 text-right sm:text-center pt-1 sm:pt-0">
                <button
                  type="button"
                  onClick={() => {
                    updateAdmissions((prev) => ({
                      ...prev,
                      classAvailability: (prev.classAvailability || []).filter((_, i) => i !== idx),
                    }));
                  }}
                  title="Remove from admissions availability"
                  className="p-1.5 text-[#94A3B8] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                >
                  <Trash2 className="w-3.5 h-3.5 mx-auto" />
                </button>
              </div>
            </div>
          ))}

          {/* Add custom class to admission availability */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="Enter class name (e.g. Nursery B, Class XI Science)"
              className="w-full sm:w-72 px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#131B2E] placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:outline-hidden shadow-2xs"
            />
            <button
              type="button"
              disabled={!newClassName.trim()}
              onClick={() => {
                if (!newClassName.trim()) return;
                const trimmed = newClassName.trim();
                const exists = admissions.classAvailability?.some(
                  (c) => c.className.toLowerCase() === trimmed.toLowerCase()
                );
                if (exists) {
                  alert(`Class "${trimmed}" already exists in the availability roster.`);
                  return;
                }
                updateAdmissions((prev) => ({
                  ...prev,
                  classAvailability: [
                    ...(prev.classAvailability || []),
                    {
                      id: `cls-avail-custom-${Date.now()}`,
                      className: trimmed,
                      status: 'open',
                      notes: '',
                    },
                  ],
                }));
                setNewClassName('');
              }}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-[#EEF2FF] border border-[#C7D2FE] text-[#4338CA] font-bold text-xs hover:bg-[#E0E7FF] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Class to Admissions</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── 6. ADMISSION ELIGIBILITY ───────────────────────────────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => setShowEligibilityDetails((prev) => !prev)}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-[#FAF7F2]/50 transition focus:outline-hidden"
          aria-expanded={showEligibilityDetails}
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center text-[#4338CA] shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm text-[#131B2E]">Admission Eligibility</h3>
                <span className="text-[10px] font-semibold text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-md">
                  {showEligibilityDetails ? 'Configured' : 'Optional / Expandable'}
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5 truncate">
                Age rules, cutoff dates, entrance assessments, and prerequisite academic criteria.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-3 shrink-0">
            <span className="text-xs font-semibold text-[#4338CA] hidden sm:inline">
              {showEligibilityDetails ? 'Collapse' : 'Add Details'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[#64748B] shadow-2xs">
              {showEligibilityDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
        </button>

        {showEligibilityDetails && (
          <div className="px-5 pb-5 pt-2 border-t border-[#E2E8F0] space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block font-bold text-xs text-[#334155] mb-1">
                  Minimum Age <span className="font-normal text-[#94A3B8]">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={admissions.eligibility?.minimumAge || ''}
                  onChange={(e) =>
                    updateAdmissions((prev) => ({
                      ...prev,
                      eligibility: { ...(prev.eligibility || {}), minimumAge: e.target.value },
                    }))
                  }
                  placeholder="e.g. 3+ Years"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#131B2E] placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-xs text-[#334155] mb-1">
                  Maximum Age <span className="font-normal text-[#94A3B8]">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={admissions.eligibility?.maximumAge || ''}
                  onChange={(e) =>
                    updateAdmissions((prev) => ({
                      ...prev,
                      eligibility: { ...(prev.eligibility || {}), maximumAge: e.target.value },
                    }))
                  }
                  placeholder="e.g. 4.5 Years"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#131B2E] placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-xs text-[#334155] mb-1">
                  Age Cut-Off Date <span className="font-normal text-[#94A3B8]">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={admissions.eligibility?.ageCutoffDate || ''}
                  onChange={(e) =>
                    updateAdmissions((prev) => ({
                      ...prev,
                      eligibility: { ...(prev.eligibility || {}), ageCutoffDate: e.target.value },
                    }))
                  }
                  placeholder="e.g. As of March 31"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#131B2E] placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:outline-hidden"
                />
              </div>

              <div className="flex flex-col justify-end space-y-2">
                <label className="flex items-center space-x-2 text-xs font-medium text-[#334155] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(admissions.eligibility?.entranceAssessment)}
                    onChange={(e) =>
                      updateAdmissions((prev) => ({
                        ...prev,
                        eligibility: { ...(prev.eligibility || {}), entranceAssessment: e.target.checked },
                      }))
                    }
                    className="rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20"
                  />
                  <span>Entrance Assessment Required</span>
                </label>

                <label className="flex items-center space-x-2 text-xs font-medium text-[#334155] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(admissions.eligibility?.interviewRequired)}
                    onChange={(e) =>
                      updateAdmissions((prev) => ({
                        ...prev,
                        eligibility: { ...(prev.eligibility || {}), interviewRequired: e.target.checked },
                      }))
                    }
                    className="rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20"
                  />
                  <span>Interaction / Interview Required</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block font-bold text-xs text-[#334155] mb-1">
                Previous Academic Requirement <span className="font-normal text-[#94A3B8]">(Optional)</span>
              </label>
              <input
                type="text"
                value={admissions.eligibility?.previousAcademicRequirement || ''}
                onChange={(e) =>
                  updateAdmissions((prev) => ({
                    ...prev,
                    eligibility: { ...(prev.eligibility || {}), previousAcademicRequirement: e.target.value },
                  }))
                }
                placeholder="e.g. Pass in previous class with transfer certificate issued by recognized board"
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#131B2E] placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-xs text-[#334155] mb-1">
                Eligibility Notes <span className="font-normal text-[#94A3B8]">(Optional)</span>
              </label>
              <textarea
                rows={2}
                value={admissions.eligibility?.notes || ''}
                onChange={(e) =>
                  updateAdmissions((prev) => ({
                    ...prev,
                    eligibility: { ...(prev.eligibility || {}), notes: e.target.value },
                  }))
                }
                placeholder="e.g. Specific class age tables, concessions, or sibling priority criteria..."
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#131B2E] placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:outline-hidden"
              />
            </div>
          </div>
        )}
      </div>

      {/* ─── 7. ADMISSION PROCESS ───────────────────────────────────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => setShowProcessDetails((prev) => !prev)}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-[#FAF7F2]/50 transition focus:outline-hidden"
          aria-expanded={showProcessDetails}
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center text-[#4338CA] shrink-0">
              <ArrowUpDown className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm text-[#131B2E]">Admission Process</h3>
                <span className="text-[10px] font-semibold text-[#4338CA] bg-[#EEF2FF] border border-[#C7D2FE] px-2 py-0.5 rounded-md">
                  {admissions.process?.filter((p) => p.enabled).length || 0} Steps Active
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5 truncate">
                Reorderable enrollment workflow shown on your website&apos;s &quot;How to Apply&quot; page.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-3 shrink-0">
            <span className="text-xs font-semibold text-[#4338CA] hidden sm:inline">
              {showProcessDetails ? 'Collapse' : 'Customize Process'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[#64748B] shadow-2xs">
              {showProcessDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
        </button>

        {showProcessDetails && (
          <div className="px-5 pb-5 pt-2 border-t border-[#E2E8F0] space-y-3">
            <p className="text-[11px] text-[#64748B]">
              Enable or disable steps, reorder using the arrow buttons, or customize step labels to match your school&apos;s exact procedure.
            </p>

            <div className="space-y-2">
              {(admissions.process || []).map((step, idx) => (
                <div
                  key={step.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border transition gap-2 ${
                    step.enabled
                      ? 'bg-white border-[#E2E8F0]'
                      : 'bg-[#F8FAFC] border-dashed border-[#CBD5E1] opacity-75'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={step.enabled}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        updateAdmissions((prev) => {
                          const copy = [...(prev.process || [])];
                          copy[idx] = { ...copy[idx], enabled: checked };
                          return { ...prev, process: copy };
                        });
                      }}
                      className="rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20 shrink-0"
                    />

                    <span className="font-mono text-xs font-bold text-[#64748B] w-6 shrink-0">
                      #{idx + 1}
                    </span>

                    <input
                      type="text"
                      value={step.label}
                      onChange={(e) => {
                        const label = e.target.value;
                        updateAdmissions((prev) => {
                          const copy = [...(prev.process || [])];
                          copy[idx] = { ...copy[idx], label };
                          return { ...prev, process: copy };
                        });
                      }}
                      className="px-2.5 py-1 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#131B2E] w-52 sm:w-64 focus:border-[#4338CA] focus:outline-hidden"
                    />

                    <span className="text-[11px] text-[#64748B] hidden md:inline truncate max-w-xs">
                      {step.description}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5 self-end sm:self-auto">
                    {/* Move Up */}
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => {
                        if (idx === 0) return;
                        updateAdmissions((prev) => {
                          const copy = [...(prev.process || [])];
                          const temp = copy[idx - 1];
                          copy[idx - 1] = { ...copy[idx], order: idx };
                          copy[idx] = { ...temp, order: idx + 1 };
                          return { ...prev, process: copy };
                        });
                      }}
                      className="p-1 rounded bg-[#F1F5F9] text-[#64748B] hover:text-[#131B2E] disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move step up"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>

                    {/* Move Down */}
                    <button
                      type="button"
                      disabled={idx === (admissions.process || []).length - 1}
                      onClick={() => {
                        if (idx >= (admissions.process || []).length - 1) return;
                        updateAdmissions((prev) => {
                          const copy = [...(prev.process || [])];
                          const temp = copy[idx + 1];
                          copy[idx + 1] = { ...copy[idx], order: idx + 2 };
                          copy[idx] = { ...temp, order: idx + 1 };
                          return { ...prev, process: copy };
                        });
                      }}
                      className="p-1 rounded bg-[#F1F5F9] text-[#64748B] hover:text-[#131B2E] disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move step down"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Remove custom step */}
                    <button
                      type="button"
                      onClick={() => {
                        updateAdmissions((prev) => ({
                          ...prev,
                          process: (prev.process || []).filter((_, i) => i !== idx),
                        }));
                      }}
                      className="p-1 rounded text-[#94A3B8] hover:text-rose-600 transition"
                      title="Delete step"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Custom Process Step */}
            <button
              type="button"
              onClick={() => {
                updateAdmissions((prev) => {
                  const currentLen = (prev.process || []).length;
                  return {
                    ...prev,
                    process: [
                      ...(prev.process || []),
                      {
                        id: `proc-custom-${Date.now()}`,
                        label: `New Step ${currentLen + 1}`,
                        enabled: true,
                        order: currentLen + 1,
                        description: 'Custom admission milestone',
                      },
                    ],
                  };
                });
              }}
              className="px-3.5 py-2 rounded-xl bg-[#EEF2FF] border border-[#C7D2FE] text-[#4338CA] font-bold text-xs hover:bg-[#E0E7FF] transition flex items-center space-x-1.5 shadow-2xs mt-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Step</span>
            </button>
          </div>
        )}
      </div>

      {/* ─── 8. REQUIRED ADMISSION DOCUMENTS (Conditional on Document Upload) ─── */}
      {admissions.applicationOptions?.documentUpload && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 md:p-6 space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3.5">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center text-[#4338CA] shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#131B2E]">Required Admission Documents</h3>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Configure certificates and records parents must present during application.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-[#4338CA] bg-[#EEF2FF] border border-[#C7D2FE] px-2.5 py-1 rounded-md self-start sm:self-auto">
              Document Checklist
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(admissions.documents || []).map((doc, idx) => (
              <div
                key={doc.id}
                className="p-3 rounded-xl border border-[#E2E8F0] bg-white flex flex-col justify-between space-y-2 shadow-2xs hover:border-[#CBD5E1] transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-xs text-[#131B2E]">{doc.name}</span>
                  {doc.id.startsWith('doc-custom') && (
                    <button
                      type="button"
                      onClick={() => {
                        updateAdmissions((prev) => ({
                          ...prev,
                          documents: (prev.documents || []).filter((_, i) => i !== idx),
                        }));
                      }}
                      className="text-[#94A3B8] hover:text-rose-600"
                      title="Remove custom document"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {doc.name === 'Other' && (
                  <input
                    type="text"
                    value={doc.customName || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateAdmissions((prev) => {
                        const copy = [...(prev.documents || [])];
                        copy[idx] = { ...copy[idx], customName: val };
                        return { ...prev, documents: copy };
                      });
                    }}
                    placeholder="Specify document name..."
                    className="w-full px-2 py-1 rounded-lg border border-[#E2E8F0] text-xs focus:border-[#4338CA] focus:outline-hidden"
                  />
                )}

                <div className="flex items-center space-x-1.5 pt-1">
                  {(['required', 'optional', 'not_requested'] as DocumentRequirement[]).map((req) => (
                    <button
                      key={req}
                      type="button"
                      onClick={() => {
                        updateAdmissions((prev) => {
                          const copy = [...(prev.documents || [])];
                          copy[idx] = { ...copy[idx], requirement: req };
                          return { ...prev, documents: copy };
                        });
                      }}
                      className={`px-2 py-1 rounded-md text-[10px] font-semibold capitalize transition ${
                        doc.requirement === req
                          ? req === 'required'
                            ? 'bg-rose-50 border border-rose-200 text-rose-700'
                            : req === 'optional'
                            ? 'bg-amber-50 border border-amber-200 text-amber-700'
                            : 'bg-slate-100 border border-slate-200 text-slate-700'
                          : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      {req === 'not_requested' ? 'Not Needed' : req}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Add custom document */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              value={newCustomDocName}
              onChange={(e) => setNewCustomDocName(e.target.value)}
              placeholder="e.g. Domicile Certificate, Blood Group Report"
              className="w-full sm:w-72 px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#131B2E] placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:outline-hidden shadow-2xs"
            />
            <button
              type="button"
              disabled={!newCustomDocName.trim()}
              onClick={() => {
                if (!newCustomDocName.trim()) return;
                const trimmed = newCustomDocName.trim();
                updateAdmissions((prev) => ({
                  ...prev,
                  documents: [
                    ...(prev.documents || []),
                    {
                      id: `doc-custom-${Date.now()}`,
                      name: trimmed,
                      requirement: 'required',
                    },
                  ],
                }));
                setNewCustomDocName('');
              }}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-[#EEF2FF] border border-[#C7D2FE] text-[#4338CA] font-bold text-xs hover:bg-[#E0E7FF] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Document</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── 9. FEE STRUCTURE & NOTES ───────────────────────────────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 md:p-6 space-y-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3.5">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center text-[#4338CA] shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#131B2E]">Admission &amp; Fee Information</h3>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                Dynamic fee table displaying registration, admission, tuition, or campus fees.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-[#4338CA] bg-[#EEF2FF] border border-[#C7D2FE] px-2.5 py-1 rounded-md self-start sm:self-auto">
            Fee Breakdown
          </span>
        </div>

        {/* Fees Table */}
        <div className="space-y-3">
          {(admissions.fees || []).length === 0 ? (
            <div className="p-6 text-center border-2 border-dashed border-[#CBD5E1] rounded-xl bg-[#FAF7F2]/40">
              <p className="text-xs text-[#64748B]">No fee items configured yet.</p>
              <p className="text-[11px] text-[#94A3B8] mt-1">
                You can specify registration, tuition, and term fees below for public prospectus visibility.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="hidden sm:grid grid-cols-12 gap-3 px-3 py-2 text-[11px] font-bold text-[#64748B] uppercase tracking-wider bg-[#F8FAFC] rounded-lg">
                <span className="col-span-4">Fee Head Name</span>
                <span className="col-span-2">Amount</span>
                <span className="col-span-2">Currency</span>
                <span className="col-span-2">Frequency</span>
                <span className="col-span-1">Notes</span>
                <span className="col-span-1 text-center">Action</span>
              </div>

              {(admissions.fees || []).map((fee, idx) => (
                <div
                  key={fee.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 p-3 sm:p-2.5 rounded-xl border border-[#E2E8F0] bg-white items-center shadow-2xs hover:border-[#CBD5E1] transition"
                >
                  {/* Fee Name */}
                  <div className="col-span-1 sm:col-span-4">
                    <input
                      type="text"
                      value={fee.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        updateAdmissions((prev) => {
                          const copy = [...(prev.fees || [])];
                          copy[idx] = { ...copy[idx], name };
                          return { ...prev, fees: copy };
                        });
                      }}
                      placeholder="e.g. Registration Fee"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#131B2E] focus:border-[#4338CA] focus:outline-hidden"
                    />
                  </div>

                  {/* Amount (Optional number) */}
                  <div className="col-span-1 sm:col-span-2">
                    <input
                      type="number"
                      min={0}
                      value={fee.amount ?? ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                        updateAdmissions((prev) => {
                          const copy = [...(prev.fees || [])];
                          copy[idx] = { ...copy[idx], amount: val !== undefined && !isNaN(val) ? val : undefined };
                          return { ...prev, fees: copy };
                        });
                      }}
                      placeholder="Amount (Opt)"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-mono text-[#131B2E] focus:border-[#4338CA] focus:outline-hidden"
                    />
                  </div>

                  {/* Currency */}
                  <div className="col-span-1 sm:col-span-2">
                    <select
                      value={fee.currency || canonicalContext.currency}
                      onChange={(e) => {
                        const cur = e.target.value;
                        updateAdmissions((prev) => {
                          const copy = [...(prev.fees || [])];
                          copy[idx] = { ...copy[idx], currency: cur };
                          return { ...prev, fees: copy };
                        });
                      }}
                      className="w-full px-2 py-1.5 rounded-lg border border-[#E2E8F0] text-xs text-[#131B2E] focus:border-[#4338CA] focus:outline-hidden"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="AED">AED (AED)</option>
                    </select>
                  </div>

                  {/* Frequency */}
                  <div className="col-span-1 sm:col-span-2">
                    <select
                      value={fee.frequency || 'one_time'}
                      onChange={(e) => {
                        const freq = e.target.value as FeeFrequency;
                        updateAdmissions((prev) => {
                          const copy = [...(prev.fees || [])];
                          copy[idx] = { ...copy[idx], frequency: freq };
                          return { ...prev, fees: copy };
                        });
                      }}
                      className="w-full px-2 py-1.5 rounded-lg border border-[#E2E8F0] text-xs text-[#131B2E] focus:border-[#4338CA] focus:outline-hidden"
                    >
                      {DEFAULT_FEE_FREQUENCIES.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Notes */}
                  <div className="col-span-1">
                    <input
                      type="text"
                      value={fee.notes || ''}
                      onChange={(e) => {
                        const notes = e.target.value;
                        updateAdmissions((prev) => {
                          const copy = [...(prev.fees || [])];
                          copy[idx] = { ...copy[idx], notes };
                          return { ...prev, fees: copy };
                        });
                      }}
                      placeholder="Notes"
                      className="w-full px-2 py-1.5 rounded-lg border border-[#E2E8F0] text-xs text-[#131B2E] focus:border-[#4338CA] focus:outline-hidden"
                    />
                  </div>

                  {/* Action */}
                  <div className="col-span-1 text-right sm:text-center pt-1 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => {
                        updateAdmissions((prev) => ({
                          ...prev,
                          fees: (prev.fees || []).filter((_, i) => i !== idx),
                        }));
                      }}
                      className="p-1.5 text-[#94A3B8] hover:text-rose-600 transition"
                      title="Delete fee"
                    >
                      <Trash2 className="w-3.5 h-3.5 mx-auto" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Fee Button */}
          <button
            type="button"
            onClick={() => {
              updateAdmissions((prev) => ({
                ...prev,
                fees: [
                  ...(prev.fees || []),
                  {
                    id: `fee-${Date.now()}`,
                    name: 'New Fee Head',
                    currency: canonicalContext.currency,
                    frequency: 'one_time',
                    notes: '',
                  },
                ],
              }));
            }}
            className="px-3.5 py-2 rounded-xl bg-[#EEF2FF] border border-[#C7D2FE] text-[#4338CA] font-bold text-xs hover:bg-[#E0E7FF] transition flex items-center space-x-1.5 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Fee Head</span>
          </button>
        </div>

        {/* Fee Notes / Disclaimer */}
        <div className="pt-2 border-t border-[#E2E8F0]">
          <label htmlFor="fee-notes-input" className="block font-bold text-xs text-[#334155] mb-1.5">
            Fee Notes / Disclaimer <span className="font-normal text-[#94A3B8]">(Optional)</span>
          </label>
          <textarea
            id="fee-notes-input"
            rows={2}
            value={admissions.feeNotes || ''}
            onChange={(e) => updateAdmissions((prev) => ({ ...prev, feeNotes: e.target.value }))}
            placeholder="e.g. Fees are subject to revision by the management. Transport charges vary according to route. Fee once paid is non-refundable."
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#131B2E] placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:outline-hidden shadow-2xs"
          />
        </div>
      </div>

      {/* ─── 10. IMPORTANT ADMISSION DATES ──────────────────────────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => setShowImportantDates((prev) => !prev)}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-[#FAF7F2]/50 transition focus:outline-hidden"
          aria-expanded={showImportantDates}
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center text-[#4338CA] shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm text-[#131B2E]">Important Admission Dates</h3>
                <span className="text-[10px] font-semibold text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-md">
                  {admissions.importantDates?.length || 0} Dates
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5 truncate">
                Schedule of key events, assessment sessions, parent interviews, and confirmation deadlines.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-3 shrink-0">
            <span className="text-xs font-semibold text-[#4338CA] hidden sm:inline">
              {showImportantDates ? 'Collapse' : 'Manage Schedule'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[#64748B] shadow-2xs">
              {showImportantDates ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
        </button>

        {showImportantDates && (
          <div className="px-5 pb-5 pt-2 border-t border-[#E2E8F0] space-y-3">
            <div className="space-y-2">
              {(admissions.importantDates || []).map((dt, idx) => (
                <div
                  key={dt.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 p-3 rounded-xl border border-[#E2E8F0] bg-white items-center shadow-2xs"
                >
                  <div className="col-span-1 sm:col-span-4">
                    <input
                      type="text"
                      value={dt.eventName}
                      onChange={(e) => {
                        const eventName = e.target.value;
                        updateAdmissions((prev) => {
                          const copy = [...(prev.importantDates || [])];
                          copy[idx] = { ...copy[idx], eventName };
                          return { ...prev, importantDates: copy };
                        });
                      }}
                      placeholder="e.g. Entrance Assessment"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-bold text-[#131B2E] focus:border-[#4338CA] focus:outline-hidden"
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-3">
                    <input
                      type="date"
                      value={dt.startDate || ''}
                      onChange={(e) => {
                        const startDate = e.target.value;
                        updateAdmissions((prev) => {
                          const copy = [...(prev.importantDates || [])];
                          copy[idx] = { ...copy[idx], startDate };
                          return { ...prev, importantDates: copy };
                        });
                      }}
                      className="w-full px-2 py-1.5 rounded-lg border border-[#E2E8F0] text-xs text-[#131B2E] focus:border-[#4338CA] focus:outline-hidden"
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-3">
                    <input
                      type="date"
                      value={dt.endDate || ''}
                      onChange={(e) => {
                        const endDate = e.target.value;
                        updateAdmissions((prev) => {
                          const copy = [...(prev.importantDates || [])];
                          copy[idx] = { ...copy[idx], endDate };
                          return { ...prev, importantDates: copy };
                        });
                      }}
                      className="w-full px-2 py-1.5 rounded-lg border border-[#E2E8F0] text-xs text-[#131B2E] focus:border-[#4338CA] focus:outline-hidden"
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-2 flex items-center justify-between">
                    <input
                      type="text"
                      value={dt.description || ''}
                      onChange={(e) => {
                        const description = e.target.value;
                        updateAdmissions((prev) => {
                          const copy = [...(prev.importantDates || [])];
                          copy[idx] = { ...copy[idx], description };
                          return { ...prev, importantDates: copy };
                        });
                      }}
                      placeholder="Desc"
                      className="w-full px-2 py-1.5 rounded-lg border border-[#E2E8F0] text-xs text-[#131B2E] focus:border-[#4338CA] focus:outline-hidden mr-2"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        updateAdmissions((prev) => ({
                          ...prev,
                          importantDates: (prev.importantDates || []).filter((_, i) => i !== idx),
                        }));
                      }}
                      className="p-1.5 text-[#94A3B8] hover:text-rose-600 transition"
                      title="Delete date"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                updateAdmissions((prev) => ({
                  ...prev,
                  importantDates: [
                    ...(prev.importantDates || []),
                    {
                      id: `date-${Date.now()}`,
                      eventName: 'New Milestone',
                      startDate: '',
                      endDate: '',
                      description: '',
                    },
                  ],
                }));
              }}
              className="px-3.5 py-2 rounded-xl bg-[#EEF2FF] border border-[#C7D2FE] text-[#4338CA] font-bold text-xs hover:bg-[#E0E7FF] transition flex items-center space-x-1.5 shadow-2xs mt-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Important Date</span>
            </button>
          </div>
        )}
      </div>

      {/* ─── 11. APPLICATION INFORMATION (Conditional on Online Application) ─── */}
      {admissions.applicationOptions?.onlineApplication && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 md:p-6 space-y-4 shadow-2xs">
          <div className="flex items-center space-x-2.5 border-b border-[#E2E8F0] pb-3.5">
            <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center text-[#4338CA] shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#131B2E]">Application Configuration</h3>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                Define whether online applications are handled by your school website or an external portal.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="app-method" className="block font-bold text-xs text-[#334155] mb-1.5">
                Application Method
              </label>
              <select
                id="app-method"
                value={admissions.application?.method || 'website'}
                onChange={(e) =>
                  updateAdmissions((prev) => ({
                    ...prev,
                    application: { ...(prev.application || {}), method: e.target.value as ApplicationMethod },
                  }))
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:outline-hidden shadow-2xs"
              >
                {DEFAULT_APPLICATION_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[#64748B] mt-1.5">
                {admissions.application?.method === 'website'
                  ? 'Handled natively inside the future school website with "Apply Online" flow.'
                  : 'Parents will be directed to an external portal or specific link.'}
              </p>
            </div>

            <div>
              <label htmlFor="app-url" className="block font-bold text-xs text-[#334155] mb-1.5">
                Application URL / Route <span className="font-normal text-[#94A3B8]">(Optional if School Website)</span>
              </label>
              <input
                id="app-url"
                type="url"
                value={admissions.application?.url || ''}
                onChange={(e) =>
                  updateAdmissions((prev) => ({
                    ...prev,
                    application: { ...(prev.application || {}), url: e.target.value },
                  }))
                }
                placeholder={
                  admissions.application?.method === 'website'
                    ? 'Default: internal /admissions/apply'
                    : 'https://admissions.school.edu.in'
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#131B2E] placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:outline-hidden shadow-2xs"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="app-instructions" className="block font-bold text-xs text-[#334155] mb-1.5">
                Application Instructions <span className="font-normal text-[#94A3B8]">(Optional)</span>
              </label>
              <textarea
                id="app-instructions"
                rows={2}
                value={admissions.application?.instructions || ''}
                onChange={(e) =>
                  updateAdmissions((prev) => ({
                    ...prev,
                    application: { ...(prev.application || {}), instructions: e.target.value },
                  }))
                }
                placeholder="e.g. Keep scanned copies of student birth certificate and passport photo ready before starting the form."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#131B2E] placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:outline-hidden shadow-2xs"
              />
            </div>
          </div>
        </div>
      )}

      {isWebsiteIncluded && (
        <>
          {/* ─── 12. CALL TO ACTION & ADDITIONAL INFORMATION ────────────────── */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 md:p-6 space-y-5 shadow-2xs">
        <div className="flex items-center space-x-2.5 border-b border-[#E2E8F0] pb-3.5">
          <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center text-[#4338CA] shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#131B2E]">Admissions Call to Action</h3>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Select the primary CTA button label shown across admissions banners and header actions.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {DEFAULT_CTA_OPTIONS.map((cta) => {
              const isSelected = admissions.callToAction === cta;
              return (
                <button
                  key={cta}
                  type="button"
                  onClick={() => updateAdmissions((prev) => ({ ...prev, callToAction: cta }))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    isSelected
                      ? 'bg-[#4338CA] text-white shadow-2xs'
                      : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9]'
                  }`}
                >
                  {cta}
                </button>
              );
            })}
          </div>

          {admissions.callToAction === 'Other' && (
            <div className="w-full sm:w-72">
              <label htmlFor="custom-cta" className="block font-bold text-xs text-[#334155] mb-1">
                Custom CTA Label
              </label>
              <input
                id="custom-cta"
                type="text"
                value={admissions.customCtaLabel || ''}
                onChange={(e) => updateAdmissions((prev) => ({ ...prev, customCtaLabel: e.target.value }))}
                placeholder="e.g. Schedule Assessment"
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#131B2E] focus:border-[#4338CA] focus:outline-hidden"
              />
            </div>
          )}

          {/* Additional Admission Information (Fallback Textarea) */}
          <div className="pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setShowAdditionalNotes((prev) => !prev)}
              className="text-xs font-bold text-[#4338CA] hover:underline flex items-center space-x-1.5"
            >
              <span>{showAdditionalNotes ? '− Hide' : '+ Additional Admission Information'}</span>
            </button>

            {showAdditionalNotes && (
              <div className="pt-3 space-y-1.5">
                <label htmlFor="additional-info-input" className="block font-bold text-xs text-[#334155]">
                  Anything else parents should know about admissions? <span className="font-normal text-[#94A3B8]">(Optional)</span>
                </label>
                <textarea
                  id="additional-info-input"
                  rows={3}
                  value={admissions.additionalInformation || ''}
                  onChange={(e) => updateAdmissions((prev) => ({ ...prev, additionalInformation: e.target.value }))}
                  placeholder="e.g. Specific bus routes for nursery admission, uniform collection counter timings, or principal meet guidelines..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#131B2E] placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:outline-hidden shadow-2xs"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── 13. INFORMATIONAL PREVIEW CARD: YOUR ADMISSIONS PAGE WILL INCLUDE ─ */}
      <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => setShowWebsitePreview((prev) => !prev)}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-[#F5F0E8]/50 transition focus:outline-hidden"
          aria-expanded={showWebsitePreview}
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[#4338CA] shrink-0 shadow-2xs">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#131B2E]">Your admissions page will include</h3>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                Live output verification showing how the website generator interprets this structured data.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-3 shrink-0">
            <span className="text-xs font-semibold text-[#4338CA] hidden sm:inline">
              {showWebsitePreview ? 'Hide Preview' : 'Show Preview'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[#64748B] shadow-2xs">
              {showWebsitePreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
        </button>

        {showWebsitePreview && (
          <div className="px-5 pb-5 pt-2 border-t border-[#E2E8F0] space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="p-3 bg-white rounded-xl border border-[#E2E8F0]">
                <span className="text-[10px] font-bold text-[#64748B] uppercase block">Admission Status</span>
                <span className="font-bold text-sm text-[#131B2E] mt-1 block">
                  {websiteOutput.statusBadge} ({websiteOutput.session || 'Session Pending'})
                </span>
                <span className="text-[11px] text-[#64748B] mt-0.5 block">
                  Public Status: {websiteOutput.isOpen ? 'Active' : 'Not Currently Open'}
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#E2E8F0]">
                <span className="text-[10px] font-bold text-[#64748B] uppercase block">Class Availability</span>
                <span className="font-bold text-sm text-emerald-600 mt-1 block">
                  {websiteOutput.openClasses.length} Classes Open
                </span>
                <span className="text-[11px] text-[#64748B] mt-0.5 block truncate">
                  {websiteOutput.openClasses.slice(0, 3).join(', ')}
                  {websiteOutput.openClasses.length > 3 ? ` +${websiteOutput.openClasses.length - 3} more` : ''}
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#E2E8F0]">
                <span className="text-[10px] font-bold text-[#64748B] uppercase block">How to Apply</span>
                <span className="font-bold text-sm text-[#131B2E] mt-1 block capitalize">
                  {websiteOutput.applicationMethod.replace(/_/g, ' ')}
                </span>
                <span className="text-[11px] text-[#4338CA] mt-0.5 block font-mono">
                  CTA: &quot;{websiteOutput.callToAction.label}&quot;
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#E2E8F0]">
                <span className="text-[10px] font-bold text-[#64748B] uppercase block">Required Documents</span>
                <span className="font-bold text-sm text-[#131B2E] mt-1 block">
                  {websiteOutput.requiredDocuments.length} Documents Required
                </span>
                <span className="text-[11px] text-[#64748B] mt-0.5 block">
                  {websiteOutput.optionalDocuments.length} Optional Documents
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#E2E8F0]">
                <span className="text-[10px] font-bold text-[#64748B] uppercase block">Fee Structure</span>
                <span className="font-bold text-sm text-[#131B2E] mt-1 block">
                  {websiteOutput.fees.length} Fee Heads Listed
                </span>
                <span className="text-[11px] text-[#64748B] mt-0.5 block">
                  {websiteOutput.feeNotes ? 'Disclaimer active' : 'Standard schedule'}
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#E2E8F0]">
                <span className="text-[10px] font-bold text-[#64748B] uppercase block">Admissions Desk</span>
                <span className="font-bold text-sm text-[#131B2E] mt-1 block truncate">
                  {websiteOutput.contact.inchargeName || 'In-Charge Pending'}
                </span>
                <span className="text-[11px] text-[#64748B] mt-0.5 block truncate">
                  {websiteOutput.contact.phone || websiteOutput.contact.email || 'No contact provided'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )}
</div>
  );
}
