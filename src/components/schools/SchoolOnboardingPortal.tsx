'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  School,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Save,
  Send,
  Building2,
  Globe,
  Layers,
  Palette,
  ShieldCheck,
  Download,
  Check,
  ChevronRight,
  ChevronLeft,
  FileText,
} from 'lucide-react';
import Logo from '@/components/ui/Logo';
import {
  verifySchoolTokenAction,
  saveSchoolIntakeDraftAction,
  submitSchoolIntakeAction,
} from '@/app/schoolProjectActions';
import type {
  SchoolProject,
  UniversalIntakeData,
  SchoolIntakeChangeRequest,
  SchoolProjectCustomField,
  SchoolProjectCustomRequirement,
} from '@/lib/types';
import {
  INTAKE_SECTIONS,
  getApplicableSections,
  createInitialIntakeData,
  calculateIntakeCompleteness,
  IntakeSectionKey,
} from '@/lib/schoolIntake';
import { MEDIA_PACKAGE_SPECIFICATION } from '@/lib/schoolMedia';

interface Props {
  token: string;
}

export default function SchoolOnboardingPortal({ token }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [project, setProject] = useState<SchoolProject | null>(null);
  const [changeRequests, setChangeRequests] = useState<SchoolIntakeChangeRequest[]>([]);
  const [customFields, setCustomFields] = useState<SchoolProjectCustomField[]>([]);
  const [customRequirements, setCustomRequirements] = useState<SchoolProjectCustomRequirement[]>([]);

  // Form State
  const [intakeData, setIntakeData] = useState<UniversalIntakeData | null>(null);
  const [customData, setCustomData] = useState<Record<string, unknown>>({});
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);

  // Saving / Submitting States
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);
  const [submittedVersion, setSubmittedVersion] = useState<number>(1);

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      const res = await verifySchoolTokenAction(token);
      if (!res.success || !res.project) {
        setLoadError(res.error || 'Invalid or expired onboarding session.');
        setIsLoading(false);
        return;
      }

      setProject(res.project);
      setChangeRequests(res.changeRequests || []);
      setCustomFields(res.customFields || []);
      setCustomRequirements(res.customRequirements || []);

      if (res.submission && res.submission.intake_payload) {
        setIntakeData(res.submission.intake_payload);
        setCustomData(res.submission.custom_fields_data || {});
      } else {
        // Initialize default intake from confirmed sales lead details
        const initial = createInitialIntakeData({
          schoolName: res.project.school_name,
          contactName: res.project.primary_contact_name,
          contactEmail: res.project.primary_contact_email,
          contactPhone: res.project.primary_contact_phone,
          city: res.project.city,
          state: res.project.state,
          domainRequirement: res.project.domain_requirement,
        });
        setIntakeData(initial);
      }

      setIsLoading(false);
    }
    init();
  }, [token]);

  const applicableSections = useMemo(() => {
    if (!project) return [];
    return getApplicableSections(project.product_id);
  }, [project]);

  const completeness = useMemo(() => {
    if (!project || !intakeData) return { percentage: 0, missingFields: [] };
    return calculateIntakeCompleteness(project.product_id, intakeData, customFields);
  }, [project, intakeData, customFields]);

  const handleFieldChange = (section: keyof UniversalIntakeData, field: string, value: any) => {
    if (!intakeData) return;
    setIntakeData({
      ...intakeData,
      [section]: {
        ...((intakeData[section] as any) || {}),
        [field]: value,
      },
    });
  };

  const handleSaveDraft = async () => {
    if (!intakeData) return;
    setIsSaving(true);
    setSaveMessage(null);
    const res = await saveSchoolIntakeDraftAction(token, intakeData, customData);
    if (res.success) {
      setSaveMessage({ text: 'Draft progress saved successfully!', type: 'success' });
      setTimeout(() => setSaveMessage(null), 3000);
    } else {
      setSaveMessage({ text: res.error || 'Failed to save draft', type: 'error' });
    }
    setIsSaving(false);
  };

  const handleSubmit = async () => {
    if (!intakeData) return;
    setIsSubmitting(true);
    setSaveMessage(null);
    const res = await submitSchoolIntakeAction(token, intakeData, customData);
    if (res.success) {
      setIsSubmitSuccess(true);
      setSubmittedVersion(res.versionNumber || 1);
    } else {
      setSaveMessage({ text: res.error || 'Failed to submit intake', type: 'error' });
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-4">
        <School className="w-10 h-10 text-[#4338CA] animate-bounce mb-3" />
        <h2 className="text-lg font-bold text-[#131B2E]">Loading School Onboarding Workspace...</h2>
        <p className="text-xs text-[#64748B] mt-1">Verifying secure session token...</p>
      </div>
    );
  }

  if (loadError || !project || !intakeData) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-[#E2E8F0] shadow-xl text-center space-y-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-[#131B2E]">Onboarding Access Error</h2>
          <p className="text-xs text-[#64748B] leading-relaxed">
            {loadError || 'We could not find an active school onboarding project with this link. It may have expired or been replaced.'}
          </p>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-left space-y-1">
            <div className="font-bold text-[#131B2E]">Need help accessing your school project?</div>
            <div className="text-[#64748B]">Contact Ekaagra Support:</div>
            <div className="font-mono text-[#4338CA] font-bold">support@ekaagratechnologies.site</div>
          </div>
          <Link
            href="/schools"
            className="block w-full py-2.5 px-4 bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold rounded-xl text-xs transition-colors"
          >
            Visit Ekaagra Schools Platform
          </Link>
        </div>
      </div>
    );
  }

  if (isSubmitSuccess) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-lg w-full border border-emerald-200 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#131B2E]">Requirements Submitted!</h2>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Thank you, <strong>{project.school_name}</strong>! Your detailed institutional intake has been received as{' '}
            <strong>Version {submittedVersion}</strong>. Our engineering and implementation team is now reviewing your configuration.
          </p>
          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-xs text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-emerald-800 font-bold">Project Code:</span>
              <span className="font-mono font-bold text-emerald-950">{project.project_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-800 font-bold">Product Scope:</span>
              <span className="font-bold text-emerald-950 uppercase">{project.product_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-800 font-bold">Next Phase:</span>
              <span className="text-emerald-900">Technical Review & Media Package Processing</span>
            </div>
          </div>
          <button
            onClick={() => setIsSubmitSuccess(false)}
            className="block w-full py-2.5 px-4 bg-[#FAF7F2] hover:bg-[#E2E8F0] text-[#131B2E] font-bold rounded-xl text-xs border border-[#E2E8F0] transition-colors cursor-pointer"
          >
            Review or Edit Submitted Responses
          </button>
        </div>
      </div>
    );
  }

  const currentSection = applicableSections[activeSectionIndex] || applicableSections[0];

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#131B2E] flex flex-col">
      {/* Top Banner */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="hidden sm:inline-block w-px h-5 bg-[#E2E8F0]" />
            <div className="flex items-center gap-2">
              <School className="w-5 h-5 text-[#4338CA]" />
              <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#131B2E]">
                {project.school_name}
              </span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 text-[#4338CA] font-bold border border-slate-200">
                {project.project_number}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-[#FAF7F2] px-3 py-1.5 rounded-xl border border-[#E2E8F0]">
              <span className="text-[11px] font-bold text-[#64748B]">Intake Completeness:</span>
              <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${completeness.percentage}%` }}
                />
              </div>
              <span className="font-mono font-bold text-xs text-[#131B2E]">{completeness.percentage}%</span>
            </div>

            <button
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#E2E8F0] text-xs font-bold rounded-lg border border-[#E2E8F0] transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
            </button>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit for Review'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Save Message Notification */}
      {saveMessage && (
        <div
          className={`py-2 px-4 text-center text-xs font-bold ${
            saveMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      {/* Changes Requested Banner */}
      {changeRequests.length > 0 && (
        <div className="bg-orange-50 border-b border-orange-200 p-4">
          <div className="max-w-7xl mx-auto flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <strong className="font-bold text-orange-900">
                Attention: Reviewer Changes Requested
              </strong>
              <p className="text-orange-800">
                Our implementation team has reviewed your intake and requested corrections on specific sections. Please review the comments below and re-submit:
              </p>
              <div className="space-y-1 pt-1">
                {changeRequests.map((cr) => (
                  <div key={cr.id} className="text-orange-950 font-medium">
                    • <strong className="capitalize">{cr.section_key}:</strong> {cr.request_comment}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Left Navigation Sidebar */}
        <div className="md:col-span-1 space-y-2">
          <div className="p-3 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs space-y-1">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#94A3B8] px-2 py-1">
              Intake Sections
            </div>
            {applicableSections.map((sec, idx) => {
              const isActive = idx === activeSectionIndex;
              return (
                <button
                  key={sec.key}
                  onClick={() => setActiveSectionIndex(idx)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#4338CA] text-white shadow-xs'
                      : 'text-[#64748B] hover:bg-[#FAF7F2] hover:text-[#131B2E]'
                  }`}
                >
                  <span className="truncate">
                    {idx + 1}. {sec.shortTitle}
                  </span>
                  {isActive && <ChevronRight className="w-4 h-4" />}
                </button>
              );
            })}
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs space-y-2 text-xs">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#131B2E] flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-[#4338CA]" />
              Media Package Kit
            </span>
            <p className="text-[11px] text-[#64748B]">
              Download the 14-folder institutional media collection guide for your photographer:
            </p>
            <a
              href="/api/school-media/template"
              className="block py-2 px-3 bg-[#FAF7F2] hover:bg-slate-100 text-center font-bold text-xs text-[#4338CA] rounded-xl border border-[#E2E8F0] transition-colors"
            >
              Download Instructions (PDF)
            </a>
          </div>
        </div>

        {/* Form Body Area */}
        <div className="md:col-span-3 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E8F0] shadow-xs space-y-6">
            {/* Section Header */}
            <div className="border-b border-[#E2E8F0] pb-4 space-y-1">
              <div className="flex items-center gap-2 text-[11px] font-bold text-[#4338CA] uppercase tracking-wider">
                <span>Section {activeSectionIndex + 1} of {applicableSections.length}</span>
                <span>•</span>
                <span>{project.product_id.toUpperCase()} SCOPE</span>
              </div>
              <h2 className="text-xl font-extrabold text-[#131B2E]">{currentSection.title}</h2>
              <p className="text-xs text-[#64748B]">{currentSection.description}</p>
            </div>

            {/* Render Section Form Fields */}
            {currentSection.key === 'schoolProfile' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-[#131B2E]">Official School Name *</label>
                  <input
                    type="text"
                    value={intakeData.schoolProfile.schoolName || ''}
                    onChange={(e) => handleFieldChange('schoolProfile', 'schoolName', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#131B2E]">Affiliation Board *</label>
                  <select
                    value={intakeData.schoolProfile.board || 'CBSE'}
                    onChange={(e) => handleFieldChange('schoolProfile', 'board', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl text-xs"
                  >
                    <option value="CBSE">CBSE (Central Board)</option>
                    <option value="ICSE">ICSE / CISCE</option>
                    <option value="Bihar State Board">Bihar State Board (BSEB)</option>
                    <option value="UP State Board">UP State Board</option>
                    <option value="IB / Cambridge">International (IB / Cambridge)</option>
                    <option value="Other">Other State / Regional Board</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#131B2E]">School Classification *</label>
                  <select
                    value={intakeData.schoolProfile.schoolType || 'Private'}
                    onChange={(e) => handleFieldChange('schoolProfile', 'schoolType', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl text-xs"
                  >
                    <option value="Co-Educational Day School">Co-Educational Day School</option>
                    <option value="Day-cum-Boarding">Day-cum-Boarding</option>
                    <option value="Residential / Boarding">Full Residential / Boarding</option>
                    <option value="Girls School">Girls Only</option>
                    <option value="Boys School">Boys Only</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-[#131B2E]">Complete Campus Address *</label>
                  <input
                    type="text"
                    value={intakeData.schoolProfile.address || ''}
                    onChange={(e) => handleFieldChange('schoolProfile', 'address', e.target.value)}
                    placeholder="Street, Area, Landmark"
                    className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#131B2E]">City *</label>
                  <input
                    type="text"
                    value={intakeData.schoolProfile.city || ''}
                    onChange={(e) => handleFieldChange('schoolProfile', 'city', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#131B2E]">Postal PIN Code *</label>
                  <input
                    type="text"
                    value={intakeData.schoolProfile.pin || ''}
                    onChange={(e) => handleFieldChange('schoolProfile', 'pin', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#131B2E]">Official Institutional Email *</label>
                  <input
                    type="email"
                    value={intakeData.schoolProfile.officialEmail || ''}
                    onChange={(e) => handleFieldChange('schoolProfile', 'officialEmail', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#131B2E]">Official Phone / Landline *</label>
                  <input
                    type="text"
                    value={intakeData.schoolProfile.officialPhone || ''}
                    onChange={(e) => handleFieldChange('schoolProfile', 'officialPhone', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl text-xs"
                  />
                </div>
              </div>
            )}

            {currentSection.key === 'institutionStructure' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-[#131B2E]">Current Academic Session *</label>
                  <input
                    type="text"
                    value={intakeData.institutionStructure?.currentAcademicSession || '2026-2027'}
                    onChange={(e) => handleFieldChange('institutionStructure', 'currentAcademicSession', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#131B2E]">Starting Class Offered *</label>
                  <input
                    type="text"
                    value={intakeData.institutionStructure?.classesOfferedFrom || 'Nursery'}
                    onChange={(e) => handleFieldChange('institutionStructure', 'classesOfferedFrom', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#131B2E]">Highest Class Offered *</label>
                  <input
                    type="text"
                    value={intakeData.institutionStructure?.classesOfferedTo || 'Class 12'}
                    onChange={(e) => handleFieldChange('institutionStructure', 'classesOfferedTo', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#131B2E]">Total Student Capacity *</label>
                  <input
                    type="number"
                    value={intakeData.institutionStructure?.studentCapacityTotal || 500}
                    onChange={(e) => handleFieldChange('institutionStructure', 'studentCapacityTotal', Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl text-xs"
                  />
                </div>
              </div>
            )}

            {currentSection.key === 'websiteRequirements' && (
              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-[#131B2E]">Primary Purpose & Goals for Website *</label>
                  <textarea
                    rows={3}
                    value={intakeData.websiteRequirements?.primaryPurpose || ''}
                    onChange={(e) => handleFieldChange('websiteRequirements', 'primaryPurpose', e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-[#131B2E]">Required Website Sections & Pages *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      'About School',
                      'Principal Message',
                      'Chairman Desk',
                      'Academic Curriculum',
                      'Campus Facilities',
                      'Photo & Video Gallery',
                      'Notice Board',
                      'Events Calendar',
                      'Admissions Online Form',
                      'Mandatory CBSE Disclosures',
                      'Faculty Directory',
                      'Contact Us',
                    ].map((pg) => {
                      const list = intakeData.websiteRequirements?.requiredPages || [];
                      const isChecked = list.includes(pg);
                      return (
                        <label
                          key={pg}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer ${
                            isChecked ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-bold' : 'bg-[#FAF7F2] border-[#E2E8F0]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const updated = e.target.checked
                                ? [...list, pg]
                                : list.filter((item) => item !== pg);
                              handleFieldChange('websiteRequirements', 'requiredPages', updated);
                            }}
                            className="rounded text-[#4338CA]"
                          />
                          <span>{pg}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {currentSection.key === 'erpRequirements' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-[#131B2E]">Attendance Tracking Mode *</label>
                  <select
                    value={intakeData.erpRequirements?.attendanceTrackingMode || 'daily'}
                    onChange={(e) => handleFieldChange('erpRequirements', 'attendanceTrackingMode', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl text-xs"
                  >
                    <option value="daily">Daily Morning Attendance (By Class Teacher)</option>
                    <option value="subject_wise">Period-wise / Subject-wise Attendance</option>
                    <option value="biometric_sync">Biometric / RFID Card Sync</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#131B2E]">Fee Collection Schedule *</label>
                  <select
                    value={intakeData.erpRequirements?.feeStructureComplexity || 'monthly_tiered'}
                    onChange={(e) => handleFieldChange('erpRequirements', 'feeStructureComplexity', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl text-xs"
                  >
                    <option value="monthly_tiered">Monthly Fee Collection</option>
                    <option value="simple_quarterly">Quarterly (4 Terms per Year)</option>
                    <option value="complex_concessions">Tiered with Special Concessions & Sibling Discounts</option>
                  </select>
                </div>
              </div>
            )}

            {currentSection.key === 'brandingDesign' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-[#131B2E]">Do you have a vector or high-resolution crest/logo? *</label>
                  <select
                    value={intakeData.brandingDesign.hasHighResLogo ? 'yes' : 'no'}
                    onChange={(e) => handleFieldChange('brandingDesign', 'hasHighResLogo', e.target.value === 'yes')}
                    className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl text-xs"
                  >
                    <option value="yes">Yes, we have high-res PNG / CDR / Vector</option>
                    <option value="no">No, our logo needs digital redrawing / enhancement</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#131B2E]">Preferred Visual Tone *</label>
                  <select
                    value={intakeData.brandingDesign.preferredVisualTone || 'modern_vibrant'}
                    onChange={(e) => handleFieldChange('brandingDesign', 'preferredVisualTone', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl text-xs"
                  >
                    <option value="traditional_prestigious">Traditional & Prestigious (Navy / Gold / Maroon)</option>
                    <option value="modern_vibrant">Modern & Vibrant (Indigo / Cyan / Emerald)</option>
                    <option value="minimal_clean">Minimalist & Academic (Clean Whites / Slate)</option>
                  </select>
                </div>
              </div>
            )}

            {currentSection.key === 'domainPresence' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-[#131B2E]">Do you already own a web domain? *</label>
                  <select
                    value={intakeData.domainPresence.alreadyOwnsDomain ? 'yes' : 'no'}
                    onChange={(e) => handleFieldChange('domainPresence', 'alreadyOwnsDomain', e.target.value === 'yes')}
                    className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl text-xs"
                  >
                    <option value="no">No, Ekaagra should register a new domain for us</option>
                    <option value="yes">Yes, we already have our own domain</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#131B2E]">
                    {intakeData.domainPresence.alreadyOwnsDomain ? 'Existing Domain Name' : 'Preferred New Domain Name'} *
                  </label>
                  <input
                    type="text"
                    value={
                      intakeData.domainPresence.alreadyOwnsDomain
                        ? intakeData.domainPresence.existingDomainName || ''
                        : intakeData.domainPresence.preferredNewDomainName || ''
                    }
                    onChange={(e) =>
                      handleFieldChange(
                        'domainPresence',
                        intakeData.domainPresence.alreadyOwnsDomain ? 'existingDomainName' : 'preferredNewDomainName',
                        e.target.value
                      )
                    }
                    placeholder="e.g. davmotihari.org or stxaviers.edu.in"
                    className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
            )}

            {currentSection.key === 'usersAccess' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-[#131B2E]">Designated Super-Admin Full Name *</label>
                  <input
                    type="text"
                    value={intakeData.usersAccess.superAdminFullName || ''}
                    onChange={(e) => handleFieldChange('usersAccess', 'superAdminFullName', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#131B2E]">Super-Admin Official Email *</label>
                  <input
                    type="email"
                    value={intakeData.usersAccess.superAdminEmail || ''}
                    onChange={(e) => handleFieldChange('usersAccess', 'superAdminEmail', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#131B2E]">Super-Admin Direct Phone *</label>
                  <input
                    type="text"
                    value={intakeData.usersAccess.superAdminPhone || ''}
                    onChange={(e) => handleFieldChange('usersAccess', 'superAdminPhone', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl text-xs"
                  />
                </div>
              </div>
            )}

            {currentSection.key === 'mediaAssets' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-200 space-y-2">
                  <h4 className="font-bold text-indigo-950 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#4338CA]" />
                    Campus Media Collection Package (14 Structured Folders)
                  </h4>
                  <p className="text-indigo-900 leading-relaxed text-[11px]">
                    To build a prestigious, high-converting digital presence, we organize your photography into standardized folders.
                    Please have your school photographer review our guidelines document:
                  </p>
                  <a
                    href="/api/school-media/template"
                    className="inline-flex items-center gap-2 py-2 px-3.5 bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold rounded-xl text-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Media Submission Kit (PDF)</span>
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {MEDIA_PACKAGE_SPECIFICATION.slice(1, 7).map((item) => (
                    <div key={item.folder} className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E2E8F0] space-y-1">
                      <div className="font-bold text-[#131B2E] font-mono text-[11px]">{item.folder}</div>
                      <div className="font-bold text-[#4338CA]">{item.label}</div>
                      <p className="text-[10px] text-[#64748B]">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Section Pager */}
            <div className="pt-6 border-t border-[#E2E8F0] flex items-center justify-between">
              <button
                onClick={() => setActiveSectionIndex((prev) => Math.max(0, prev - 1))}
                disabled={activeSectionIndex === 0}
                className="inline-flex items-center gap-1 px-4 py-2 bg-[#FAF7F2] hover:bg-slate-100 disabled:opacity-40 text-xs font-bold rounded-xl border border-[#E2E8F0] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Section</span>
              </button>

              <button
                onClick={() =>
                  setActiveSectionIndex((prev) => Math.min(applicableSections.length - 1, prev + 1))
                }
                disabled={activeSectionIndex === applicableSections.length - 1}
                className="inline-flex items-center gap-1 px-4 py-2 bg-[#4338CA] hover:bg-[#3730A3] disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <span>Next Section</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
