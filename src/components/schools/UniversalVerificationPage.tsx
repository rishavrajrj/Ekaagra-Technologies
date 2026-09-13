'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Download,
  Eye,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  Building,
  Users,
  Check,
  X,
  RefreshCw,
  Printer,
  FileCheck,
  School,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  Globe,
  Edit2,
  Layers,
  GraduationCap,
  Calendar,
  DollarSign,
  Maximize2,
  Smartphone,
  Tablet,
  Monitor,
} from 'lucide-react';
import type {
  UniversalIntakeData,
  WebsitePageConfiguration,
  WebsiteApprovalRecord,
  SchoolIntakeChangeRequest,
} from '@/lib/types';
import { buildSchoolWebsiteDataFromIntake } from '@/lib/schoolWebsiteContract';
import ModalPortal from '@/components/ui/ModalPortal';
import SchoolWebsiteRenderer from './website-engine/SchoolWebsiteRenderer';
import { validateCrossSectionConsistency, type ConsistencyValidationResult } from '@/lib/dataConsistencyEngine';
import {
  STANDARD_WEBSITE_PAGES,
  buildWebsitePageConfigurations,
} from '@/lib/websitePageRequirements';
import {
  detectSpecificationInvalidation,
  type ApprovalInvalidationResult,
} from '@/lib/websiteSpecificationContract';
import {
  type UniversalVerificationAsset,
  type UniversalVerificationDocument,
  type UniversalFacilityItem,
  aggregateUniversalAssets,
  aggregateUniversalDocuments,
  aggregateUniversalFacilities,
  calculateUniversalReadiness,
  generateSubmissionReportHtml,
  buildUniversalSubmissionZip,
  normalizeLeadershipData,
} from '@/lib/universalVerificationEngine';
import { calculateLegalPoliciesCompleteness } from '@/lib/legalPolicyUtils';
import {
  approveWebsiteSpecificationAction,
  reopenWebsiteSpecificationAction,
  submitSchoolIntakeAction,
  saveSchoolIntakeDraftAction,
} from '@/app/schoolProjectActions';
import { evaluateWebsitePublicationReadiness } from '@/lib/websiteDataStatus';

export interface UniversalVerificationPageProps {
  token?: string;
  intakeData: Partial<UniversalIntakeData>;
  isAdmin?: boolean;
  updateSectionField: (section: keyof UniversalIntakeData, field: string, value: any) => void;
  updateSectionDirect?: (section: keyof UniversalIntakeData, value: any) => void;
  onNavigateToSection?: (sectionKey: any) => void;
  onNavigateToBranding?: () => void;
  setPreviewingStyle?: (style: any) => void;
  onSubmitSuccess?: (versionNumber: number) => void;
  changeRequests?: SchoolIntakeChangeRequest[];
  onRespondToCR?: (cr: SchoolIntakeChangeRequest) => void;
}

export default function UniversalVerificationPage({
  token,
  intakeData,
  isAdmin = false,
  updateSectionField,
  onNavigateToSection,
  onSubmitSuccess,
  changeRequests = [],
  onRespondToCR,
}: UniversalVerificationPageProps) {
  // Collapsible cards state
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    blockers: false,
    changesRequested: false,
    identity: false,
    statutoryDocs: false,
    policies: false,
    configuration: false,
    pages: true,
  });

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Preview & Modal States
  const [isWebsitePreviewOpen, setIsWebsitePreviewOpen] = useState(false);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activePreviewTab, setActivePreviewTab] = useState<string>('home');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccessData, setSubmissionSuccessData] = useState<{
    submissionId: string;
    submittedAt: string;
    version: string;
  } | null>(null);

  // Authoritative School Website Data
  const schoolWebsiteData = useMemo(
    () => buildSchoolWebsiteDataFromIntake(intakeData, false),
    [intakeData]
  );

  // Cross-Section Consistency Engine
  const consistencyResult: ConsistencyValidationResult = useMemo(
    () => validateCrossSectionConsistency(intakeData),
    [intakeData]
  );

  // Background Scroll Lock for Live Website Preview Modal
  useEffect(() => {
    if (isWebsitePreviewOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsWebsitePreviewOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isWebsitePreviewOpen]);

  // Approval & Invalidation State
  const currentApproval: WebsiteApprovalRecord | undefined = useMemo(
    () => intakeData.websiteRequirements?.currentApproval,
    [intakeData.websiteRequirements?.currentApproval]
  );
  const isWebsiteApproved = Boolean(
    intakeData.websiteRequirements?.websiteApproved && currentApproval
  );

  const invalidationResult: ApprovalInvalidationResult = useMemo(() => {
    return detectSpecificationInvalidation(currentApproval, intakeData);
  }, [intakeData, currentApproval]);
  const isInvalidated = isWebsiteApproved && invalidationResult.isInvalidated;

  // Canonical Aggregations
  const allAssets = useMemo(() => aggregateUniversalAssets(intakeData), [intakeData]);
  const allDocuments = useMemo(() => aggregateUniversalDocuments(intakeData), [intakeData]);
  const allFacilities = useMemo(
    () => aggregateUniversalFacilities(intakeData, allAssets),
    [intakeData, allAssets]
  );
  const readiness = useMemo(
    () => evaluateWebsitePublicationReadiness(intakeData),
    [intakeData]
  );

  // Legal Policies Completeness
  const legalCompleteness = useMemo(
    () => calculateLegalPoliciesCompleteness(intakeData.legalPolicies),
    [intakeData.legalPolicies]
  );

  // Active statutory documents filter (from canonical documents)
  const statutoryDocuments = useMemo(() => {
    return allDocuments.filter(
      (doc) =>
        doc.type === 'statutory' ||
        ['cert-affiliation', 'cert-recognition', 'cert-registration', 'cert-safety', 'cert-mandatory-disclosure'].includes(doc.id)
    );
  }, [allDocuments]);

  const pageConfigurations: Record<string, WebsitePageConfiguration> = useMemo(() => {
    return intakeData.websiteRequirements?.pageConfigurations || buildWebsitePageConfigurations(intakeData);
  }, [intakeData]);

  // Active Pending Change Requests
  const pendingCRs = useMemo(() => {
    return changeRequests.filter((cr) => cr.status === 'open' || cr.status === 'waiting_for_school');
  }, [changeRequests]);

  // Administrator Details (Auto-prefilled from canonical source records)
  const adminName =
    intakeData.usersAccess?.superAdminFullName ||
    intakeData.clientConfirmation?.confirmedByName ||
    intakeData.leadership?.principalName ||
    'Authorized Administrator';
  const adminDesignation =
    intakeData.usersAccess?.superAdminDesignation ||
    intakeData.clientConfirmation?.confirmedByDesignation ||
    'Principal / Super Administrator';
  const adminEmail =
    intakeData.usersAccess?.superAdminEmail ||
    intakeData.clientConfirmation?.confirmedByEmail ||
    intakeData.schoolProfile?.officialEmail ||
    '';
  const adminPhone =
    intakeData.usersAccess?.superAdminPhone ||
    intakeData.clientConfirmation?.confirmedByPhone ||
    intakeData.schoolProfile?.officialPhone ||
    '';

  // The 3 Authoritative Final Institutional Declarations
  const [declAccurate, setDeclAccurate] = useState(true);
  const [declAuthorized, setDeclAuthorized] = useState(true);
  const [declStatutory, setDeclStatutory] = useState(true);

  const areAllDeclarationsChecked = declAccurate && declAuthorized && declStatutory;

  // Reopen Modal State
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [isReopening, setIsReopening] = useState(false);

  // Navigation to canonical source
  const jumpTo = (sectionKey: string, fieldKey?: string) => {
    if (onNavigateToSection) {
      onNavigateToSection(sectionKey);
    }
  };

  // Reopen Specification Handler (Allows editing if unlocked)
  const handleExecuteReopen = async () => {
    setIsReopening(true);
    try {
      if (token) {
        await reopenWebsiteSpecificationAction(token, 'Reopened for administrative edits');
      }
      if (currentApproval) {
        const updatedRecord = {
          ...currentApproval,
          status: 'superseded' as const,
          invalidationReason: 'Reopened for administrative edits',
          invalidatedAt: new Date().toISOString(),
        };
        updateSectionField('websiteRequirements', 'currentApproval', updatedRecord);
      }
      updateSectionField('websiteRequirements', 'websiteApproved', false);
      updateSectionField('websiteRequirements', 'websiteApprovedAt', undefined);
      updateSectionField('websiteRequirements', 'websiteApprovedBy', undefined);
      setSubmissionSuccessData(null);
      setIsReopenModalOpen(false);
    } catch (err) {
      console.warn('[REOPEN ERROR]', err);
      alert('Failed to reopen specification. Please verify your connection.');
    } finally {
      setIsReopening(false);
    }
  };

  // Download Comprehensive HTML Submission Report
  const handleDownloadReport = () => {
    const subId =
      submissionSuccessData?.submissionId ||
      currentApproval?.id?.slice(0, 16) ||
      `SCH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const version = submissionSuccessData?.version || `v${currentApproval?.specificationVersion || 1}`;
    const dateStr =
      submissionSuccessData?.submittedAt ||
      currentApproval?.approvedAt ||
      new Date().toLocaleDateString('en-GB');

    const universalReadiness = calculateUniversalReadiness(
      intakeData,
      allAssets,
      allDocuments,
      allFacilities
    );

    const htmlContent = generateSubmissionReportHtml(
      intakeData,
      universalReadiness,
      allAssets,
      allDocuments,
      allFacilities,
      {
        submissionId: subId,
        version: String(version),
        submittedAt: dateStr,
        adminName,
        adminDesignation,
        adminEmail: '',
        adminPhone: '',
      }
    );

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedSchoolName = (intakeData.schoolProfile?.schoolName || 'School')
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    link.download = `${sanitizedSchoolName}_Website_Specification_${version}_Report.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Internal Technical ZIP Export
  const handleDownloadZipPackage = async () => {
    setIsDownloadingZip(true);
    try {
      const subId =
        submissionSuccessData?.submissionId ||
        currentApproval?.id?.slice(0, 16) ||
        `SCH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const version = submissionSuccessData?.version || `v${currentApproval?.specificationVersion || 1}`;
      const dateStr =
        submissionSuccessData?.submittedAt ||
        currentApproval?.approvedAt ||
        new Date().toLocaleDateString('en-GB');

      const universalReadiness = calculateUniversalReadiness(
        intakeData,
        allAssets,
        allDocuments,
        allFacilities
      );

      const zipBlob = await buildUniversalSubmissionZip(
        intakeData,
        universalReadiness,
        allAssets,
        allDocuments,
        allFacilities,
        {
          submissionId: subId,
          version: String(version),
          submittedAt: dateStr,
          adminName,
          adminDesignation,
          adminEmail: '',
          adminPhone: '',
        }
      );

      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      const sanitizedSchoolName = (intakeData.schoolProfile?.schoolName || 'School')
        .replace(/[^a-zA-Z0-9_-]/g, '_');
      link.download = `${sanitizedSchoolName}_Submission_${version}_Package.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('ZIP generation error:', err);
      alert('Could not build technical ZIP package. Please try again.');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  // Authoritative Final Submission & Lock Handler
  const handleSubmitApplication = async () => {
    if (!token) {
      alert('Session token missing. Please refresh the onboarding link.');
      return;
    }

    if (!areAllDeclarationsChecked) {
      alert('Please acknowledge all final declarations to submit your application.');
      return;
    }

    if (readiness.hasPublicationBlockers || consistencyResult.criticalConflictsCount > 0) {
      alert(
        `Cannot Submit: There are ${readiness.publicationBlockers.length} publication blocker(s) that must be resolved first.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const approverInfo = {
        name: adminName,
        role: adminDesignation,
        email: adminEmail,
        phone: adminPhone,
      };

      // 1. Prepare and persist latest authoritative snapshot
      const latestIntake: UniversalIntakeData = {
        ...intakeData,
        usersAccess: {
          ...(intakeData.usersAccess || {}),
          superAdminFullName: adminName,
          superAdminDesignation: adminDesignation,
          superAdminEmail: adminEmail,
          superAdminPhone: adminPhone,
        },
        clientConfirmation: {
          confirmedByEmail: adminEmail,
          confirmedByPhone: adminPhone,
          ...(intakeData.clientConfirmation || {}),
          isConfirmed: true,
          isAccurate: declAccurate,
          isAuthorized: declAuthorized,
          confirmedByName: adminName,
          confirmedByDesignation: adminDesignation,
          confirmedAt: new Date().toISOString(),
        },
      } as UniversalIntakeData;

      const saveRes = await saveSchoolIntakeDraftAction(token, latestIntake);
      if (!saveRes.success && !saveRes.error?.includes('already been submitted')) {
        alert(`Your changes could not be saved: ${saveRes.error || 'Server error'}`);
        setIsSubmitting(false);
        return;
      }

      // 2. Validate readiness on latest authoritative snapshot
      const currentValidation = evaluateWebsitePublicationReadiness(latestIntake);
      if (!currentValidation.isReady || currentValidation.blockers.length > 0) {
        alert(`Cannot Submit: There are ${currentValidation.blockers.length} publication blocker(s).`);
        setIsSubmitting(false);
        return;
      }

      // 3. Approve and lock website specification
      const approvalRes = await approveWebsiteSpecificationAction(
        token,
        approverInfo,
        'Final Institutional Website Specification Verified and Approved',
        latestIntake
      );

      if (!approvalRes.success || !approvalRes.approvalRecord) {
        alert(`Submission could not be locked: ${approvalRes.error || 'Approval conditions not met.'}`);
        setIsSubmitting(false);
        return;
      }

      const newApproval = approvalRes.approvalRecord;
      const prevHistory = latestIntake.websiteRequirements?.approvalHistory || [];
      const updatedHistory = currentApproval && currentApproval.id !== newApproval.id
        ? [{ ...currentApproval, status: 'superseded' as const }, ...prevHistory]
        : prevHistory;

      // 4. Update approval record and confirmation in state
      updateSectionField('clientConfirmation', 'isConfirmed', true);
      updateSectionField('clientConfirmation', 'confirmedByName', adminName);
      updateSectionField('clientConfirmation', 'confirmedByDesignation', adminDesignation);
      updateSectionField('clientConfirmation', 'confirmedAt', new Date().toISOString());

      updateSectionField('websiteRequirements', 'currentApproval', newApproval);
      updateSectionField('websiteRequirements', 'approvalHistory', updatedHistory);
      updateSectionField('websiteRequirements', 'websiteApproved', true);
      updateSectionField('websiteRequirements', 'websiteApprovedAt', newApproval.approvedAt);
      updateSectionField('websiteRequirements', 'websiteApprovedBy', newApproval.approvedBy.name);
      updateSectionField('websiteRequirements', 'websiteApprovalNotes', newApproval.notes);

      // 5. Submit full intake payload to officially record onboarding project
      const intakeWithApproval: UniversalIntakeData = {
        ...latestIntake,
        websiteRequirements: {
          ...(latestIntake.websiteRequirements || {}),
          currentApproval: newApproval,
          approvalHistory: updatedHistory,
          websiteApproved: true,
          websiteApprovedAt: newApproval.approvedAt,
          websiteApprovedBy: newApproval.approvedBy.name,
          websiteApprovalNotes: newApproval.notes,
        },
      };

      const submitRes = await submitSchoolIntakeAction(token, intakeWithApproval);

      const subId =
        (submitRes as any)?.submission?.id?.slice(0, 16) ||
        `SCH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const now = new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      const versionStr = `v${newApproval.specificationVersion || (submitRes as any)?.versionNumber || 1}`;

      setSubmissionSuccessData({
        submissionId: subId,
        submittedAt: now,
        version: versionStr,
      });

      setIsSubmitModalOpen(false);

      if (onSubmitSuccess) {
        onSubmitSuccess((submitRes as any)?.versionNumber || newApproval.specificationVersion || 1);
      }
    } catch (err) {
      console.error('Final submission failed:', err);
      alert('Failed to submit website specification. Please verify your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLockedState = isWebsiteApproved && !isInvalidated;

  return (
    <div className="space-y-6 text-[#131B2E]">
      {/* ── TOP READ-ONLY CONTROL CENTER HEADER ─────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                Control Center
              </span>
              {isLockedState ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  SUBMITTED &amp; LOCKED
                </span>
              ) : isInvalidated ? (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-700" />
                  Source Revisions Pending
                </span>
              ) : (
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  Read-Only Review &amp; Sign-Off
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#131B2E] tracking-tight mt-1.5">
              Final Review &amp; Submission
            </h1>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed mt-0.5">
              Review the authoritative summary of all canonical school information, institutional certificates, policies,
              and website configuration before final submission.
            </p>
          </div>

          {/* Header Action Buttons: Strictly Secondary actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsWebsitePreviewOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition cursor-pointer"
              title="Preview how the verified website displays across viewports"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              <span>Preview Website</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadReport}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition cursor-pointer"
              title="Download official submission report for institutional records"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Download Report</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={handleDownloadZipPackage}
                disabled={isDownloadingZip}
                title="Internal Technical Export (manifests and raw report archive)"
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold shadow-2xs transition cursor-pointer"
              >
                {isDownloadingZip ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>{isDownloadingZip ? 'Packaging...' : 'Download ZIP'}</span>
              </button>
            )}

            {isLockedState && (
              <button
                type="button"
                onClick={() => setIsReopenModalOpen(true)}
                className="inline-flex items-center space-x-1 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold shadow-2xs transition cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-700" />
                <span>Reopen</span>
              </button>
            )}
          </div>
        </div>

        {/* ── OVERALL READINESS GAUGES ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Overall Readiness</div>
            <div className="text-xl font-black text-indigo-700 mt-0.5">{readiness.overallScore}%</div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  readiness.overallScore >= 90 ? 'bg-emerald-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${readiness.overallScore}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Content &amp; Academics</div>
            <div className="text-lg font-black text-slate-800 mt-0.5">{readiness.categoryScores.content}%</div>
            <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 mt-1">
              <Check className="w-3 h-3" /> Core Sections Complete
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assets &amp; Documents</div>
            <div className="text-lg font-black text-slate-800 mt-0.5">{readiness.categoryScores.assets}%</div>
            <span className="text-[10px] text-slate-500 font-medium block mt-1">
              {statutoryDocuments.filter((d) => d.status === 'verified').length} / {statutoryDocuments.length} Statutory Proofs
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Legal &amp; Policies</div>
            <div className="text-lg font-black text-slate-800 mt-0.5">{legalCompleteness.percentage}%</div>
            <span className="text-[10px] text-slate-500 font-medium block mt-1">
              {legalCompleteness.readyCount} / {legalCompleteness.total} Policies Ready
            </span>
          </div>
        </div>
      </div>

      {/* ── POST-SUBMISSION STATUS BANNER ───────────────────────────────────── */}
      {(submissionSuccessData || isLockedState) && (
        <div className="bg-emerald-50 border-2 border-emerald-400 p-5 sm:p-6 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-emerald-950">
                ✓ Application Submitted Successfully
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                Status: <strong>SUBMITTED &amp; LOCKED</strong> • Application ID:{' '}
                <strong className="font-mono">{submissionSuccessData?.submissionId || currentApproval?.id?.slice(0, 16) || 'SCH-PROVISIONED'}</strong> • Version:{' '}
                {submissionSuccessData?.version || `v${currentApproval?.specificationVersion || 1}`}
              </p>
            </div>
          </div>
          <p className="text-xs text-emerald-900 leading-relaxed bg-white/80 p-3 rounded-xl border border-emerald-200">
            Editing has been locked. Your institutional website specification is now in technical provisioning.
            If future modifications are needed, our verification team will issue an administrative change request to selectively unlock the required fields.
          </p>
        </div>
      )}

      {/* ── 1. CHANGES REQUESTED (PROMINENT TOP PLACEMENT) ───────────────────── */}
      {pendingCRs.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-amber-950 flex items-center gap-2">
                  <span>Changes Requested by Reviewer</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-200 text-amber-900">
                    {pendingCRs.length} {pendingCRs.length === 1 ? 'Item' : 'Items'}
                  </span>
                </h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  Our verification team has requested revisions. Click Fix on any item below to navigate directly to that section.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {pendingCRs.map((cr, idx) => (
              <div
                key={cr.id}
                className="bg-white border border-amber-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                      Item #{idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {cr.section_key} &bull; {cr.field_key || cr.asset_id || 'Field'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700">
                    {cr.request_comment || cr.reason}
                  </p>
                  {cr.suggested_value && (
                    <div className="text-[11px] text-slate-500 font-mono">
                      Suggested update: <span className="font-bold text-slate-800">{cr.suggested_value}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {onRespondToCR && (
                    <button
                      type="button"
                      onClick={() => onRespondToCR(cr)}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-lg border border-amber-300 transition"
                    >
                      Respond
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => jumpTo(cr.section_key, cr.field_key || undefined)}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>Fix</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 2. PUBLICATION BLOCKERS (TOP PROMINENCE) ─────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('blockers')}
          className="w-full flex items-center justify-between p-4 bg-slate-50/80 hover:bg-slate-100/80 transition text-left cursor-pointer"
        >
          <div className="flex items-center space-x-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                readiness.hasPublicationBlockers
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {readiness.hasPublicationBlockers ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            </div>
            <div>
              <div className="font-extrabold text-sm text-[#131B2E]">
                {readiness.hasPublicationBlockers
                  ? `Attention Required — ${readiness.publicationBlockers.length} Publication Blocker(s)`
                  : 'Publication Requirements Satisfied'}
              </div>
              <div className="text-[11px] text-slate-500">
                {readiness.hasPublicationBlockers
                  ? 'Resolve mandatory items before final application submission'
                  : 'Zero publication blockers. All statutory and identity requirements met.'}
              </div>
            </div>
          </div>
          {collapsedSections.blockers ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </button>

        {!collapsedSections.blockers && (
          <div className="p-4 sm:p-5 space-y-3">
            {readiness.hasPublicationBlockers ? (
              <div className="space-y-2.5">
                {readiness.publicationBlockers.map((b) => (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-xs text-rose-950 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>{b.title}</span>
                      </div>
                      <p className="text-[11px] text-rose-800 mt-0.5">{b.reason}</p>
                      <div className="text-[10px] font-semibold text-rose-600 mt-1">
                        Source: {b.sourceLabel || b.sourceSection || 'Assets & Documents'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => jumpTo(b.sourceSection || 'assetChecklist', b.sourceField)}
                      className="px-3.5 py-1.5 bg-white border border-rose-300 hover:bg-rose-50 text-rose-800 text-xs font-bold rounded-lg transition shrink-0 cursor-pointer shadow-2xs inline-flex items-center gap-1 group self-start sm:self-auto"
                    >
                      <span>Fix Now</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-800 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero publication blockers. All required institutional information and compliance proofs are fulfilled.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 3. COMPACT CANONICAL SUMMARIES WITH SOURCE LINKS ────────────────── */}

      {/* A. School Identity Summary */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('identity')}
          className="w-full flex items-center justify-between p-4 bg-slate-50/70 hover:bg-slate-100/70 transition text-left cursor-pointer"
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs">
              <School className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-[#131B2E]">School Identity Summary</div>
              <div className="text-[11px] text-slate-500">Official legal name, address, contact coordinates, and affiliation</div>
            </div>
          </div>
          {collapsedSections.identity ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </button>

        {!collapsedSections.identity && (
          <div className="p-4 sm:p-5 space-y-3 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* School Name */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">School Name</div>
                  <div className="text-sm font-black text-slate-900 mt-0.5">
                    {intakeData.schoolProfile?.schoolName || intakeData.schoolProfile?.displayName || 'Not configured'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Source: School Identity</div>
                </div>
                <button
                  type="button"
                  onClick={() => jumpTo('schoolProfile')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 shrink-0"
                >
                  <Edit2 className="w-3 h-3" /> Edit source
                </button>
              </div>

              {/* Board Affiliation */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Board Affiliation</div>
                  <div className="text-xs font-bold text-slate-900 mt-0.5">
                    {intakeData.schoolProfile?.board || 'CBSE'} &bull; Affiliation No: {intakeData.schoolProfile?.affiliationNumber || 'Recorded'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Source: School Identity</div>
                </div>
                <button
                  type="button"
                  onClick={() => jumpTo('schoolProfile')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 shrink-0"
                >
                  <Edit2 className="w-3 h-3" /> Edit source
                </button>
              </div>

              {/* Campus Address */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Primary Campus Address</div>
                  <div className="text-xs font-semibold text-slate-900 mt-0.5">
                    {intakeData.campuses?.[0]?.address || intakeData.schoolProfile?.address || 'Primary campus address'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Source: Campuses</div>
                </div>
                <button
                  type="button"
                  onClick={() => jumpTo('campuses')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 shrink-0"
                >
                  <Edit2 className="w-3 h-3" /> Edit source
                </button>
              </div>

              {/* Contact Coordinates */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Official Phone &amp; Email</div>
                  <div className="text-xs font-semibold text-slate-900 mt-0.5">
                    {intakeData.schoolProfile?.officialPhone || 'Phone'} &bull; {intakeData.schoolProfile?.officialEmail || 'Email'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Source: School Identity</div>
                </div>
                <button
                  type="button"
                  onClick={() => jumpTo('schoolProfile')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 shrink-0"
                >
                  <Edit2 className="w-3 h-3" /> Edit source
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* B. Institutional / Statutory Documents Summary */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('statutoryDocs')}
          className="w-full flex items-center justify-between p-4 bg-slate-50/70 hover:bg-slate-100/70 transition text-left cursor-pointer"
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold text-xs">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-[#131B2E]">Institutional &amp; Statutory Documents</div>
              <div className="text-[11px] text-slate-500">Mandatory affiliation, safety certificates, and public disclosure proofs</div>
            </div>
          </div>
          {collapsedSections.statutoryDocs ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </button>

        {!collapsedSections.statutoryDocs && (
          <div className="p-4 sm:p-5 space-y-3 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {statutoryDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="font-bold text-slate-900">{doc.documentName || doc.id}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{doc.notes || doc.type}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">Source: Assets &amp; Documents</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          doc.status === 'verified'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {doc.status === 'verified' ? '✓ Uploaded' : 'Pending'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => jumpTo('assetChecklist')}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 shrink-0"
                  >
                    <Edit2 className="w-3 h-3" /> Edit source
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* C. Legal & Policies Summary */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('policies')}
          className="w-full flex items-center justify-between p-4 bg-slate-50/70 hover:bg-slate-100/70 transition text-left cursor-pointer"
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-[#131B2E]">Legal &amp; Policies Summary</div>
              <div className="text-[11px] text-slate-500">Website privacy policy, terms of usage, refund policy &amp; child protection</div>
            </div>
          </div>
          {collapsedSections.policies ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </button>

        {!collapsedSections.policies && (
          <div className="p-4 sm:p-5 space-y-3 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(legalCompleteness.policyStates).map(([key, state]) => (
                <div
                  key={key}
                  className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="font-bold text-slate-900">{state.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {state.hasDocument ? 'Official PDF Attached' : state.hasText ? 'Standard Policy Text' : 'Template'}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">Source: Legal &amp; Policies</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          state.ready
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {state.ready ? '✓ Ready' : 'Needs School Review'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => jumpTo('legalPolicies')}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 shrink-0"
                  >
                    <Edit2 className="w-3 h-3" /> Edit source
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* D. Website Configuration & Scope Summary */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('configuration')}
          className="w-full flex items-center justify-between p-4 bg-slate-50/70 hover:bg-slate-100/70 transition text-left cursor-pointer"
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-xs">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-[#131B2E]">Website Configuration &amp; Project Scope</div>
              <div className="text-[11px] text-slate-500">Domain configuration, active modules, and delivery timeline</div>
            </div>
          </div>
          {collapsedSections.configuration ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </button>

        {!collapsedSections.configuration && (
          <div className="p-4 sm:p-5 space-y-3 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Domain Setup */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Domain Setup</div>
                  <div className="text-xs font-bold text-slate-900 mt-0.5">
                    {intakeData.domainPresence?.preferredNewDomainName ||
                      intakeData.domainPresence?.existingDomainName ||
                      'Domain Setup Coordinate with Ekaagra'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Source: Domain Setup</div>
                </div>
                <button
                  type="button"
                  onClick={() => jumpTo('domainPresence')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 shrink-0"
                >
                  <Edit2 className="w-3 h-3" /> Edit source
                </button>
              </div>

              {/* Delivery Timeline */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Target Launch Timeline</div>
                  <div className="text-xs font-bold text-slate-900 mt-0.5">
                    {intakeData.projectDelivery?.targetLaunchTimeline || 'Within 3-4 Weeks'} (Priority: {intakeData.projectDelivery?.deliveryPriority || 'Standard'})
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Source: Delivery Scope</div>
                </div>
                <button
                  type="button"
                  onClick={() => jumpTo('projectDelivery')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 shrink-0"
                >
                  <Edit2 className="w-3 h-3" /> Edit source
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 4. INSTITUTIONAL DECLARATION & SUBMISSION SIGN-OFF ──────────────── */}
      {!isLockedState && (
        <div className="bg-gradient-to-br from-indigo-50/30 via-slate-50 to-purple-50/20 border-2 border-indigo-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-[#131B2E]">
                Final Institutional Declaration &amp; Submission
              </h3>
              <p className="text-xs text-slate-500">
                Acknowledge the statements below to complete your website specification submission.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-indigo-100 text-xs">
            <label className="flex items-start space-x-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={declAccurate}
                onChange={(e) => setDeclAccurate(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-800 leading-relaxed">
                I confirm that the school information provided in this application is accurate and complete.
              </span>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={declAuthorized}
                onChange={(e) => setDeclAuthorized(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-800 leading-relaxed">
                I confirm that I am authorized by the institution to submit this website specification.
              </span>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={declStatutory}
                onChange={(e) => setDeclStatutory(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-800 leading-relaxed">
                I understand that statutory information and documents must be accurate, current, and verifiable.
              </span>
            </label>
          </div>

          {/* Submission Action Bar */}
          <div className="pt-4 border-t border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              {readiness.hasPublicationBlockers ? (
                <span className="text-rose-600 font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Please resolve {readiness.publicationBlockers.length} publication blocker(s) before submitting.
                </span>
              ) : !areAllDeclarationsChecked ? (
                <span className="text-amber-700 font-bold">
                  Please acknowledge all 3 declarations above to enable final submission.
                </span>
              ) : (
                <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Ready for authoritative submission &amp; engineering provisioning.
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(true)}
              disabled={!readiness.isReadyForSubmission || !areAllDeclarationsChecked}
              className={`w-full sm:w-auto px-7 py-3 rounded-xl font-black text-xs shadow-md transition cursor-pointer flex items-center justify-center space-x-2 ${
                readiness.isReadyForSubmission && areAllDeclarationsChecked
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 active:scale-[0.98]'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Submit Application</span>
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL: SUBMISSION CONFIRMATION ─────────────────────────────────── */}
      {isSubmitModalOpen && (
        <ModalPortal isOpen={isSubmitModalOpen}>
          <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 my-auto">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 shadow-md">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                    Submit School Website Application?
                  </h3>
                  <span className="text-xs text-slate-500">Official Institutional Sign-Off</span>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                <p>
                  You are about to submit the completed website specification for{' '}
                  <strong className="font-bold text-slate-900">
                    {intakeData.schoolProfile?.schoolName || 'your institution'}
                  </strong>.
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-slate-700">
                  <div className="font-bold text-slate-900">After submission:</div>
                  <ul className="space-y-1 pl-4 list-disc text-[11px]">
                    <li>Editing will be locked.</li>
                    <li>Ekaagra engineering will receive the final specification.</li>
                    <li>Any future changes will require an admin-requested change workflow.</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitApplication}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center space-x-2"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSubmitting ? 'Submitting & Locking...' : 'Submit Application'}</span>
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ── MODAL: REOPEN SPECIFICATION ─────────────────────────────────────── */}
      {isReopenModalOpen && (
        <ModalPortal isOpen={isReopenModalOpen}>
          <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Reopen Application?</h3>
                  <p className="text-xs text-slate-500">Unlock application for revisions</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Reopening this application will transition it back to editable draft mode. You will need to re-verify declarations and submit again when done.
              </p>
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReopenModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                  disabled={isReopening}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteReopen}
                  disabled={isReopening}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition"
                >
                  {isReopening ? 'Reopening...' : 'Yes, Reopen for Edits'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ── MODAL: LIVE SCHOOL WEBSITE PREVIEW ──────────────────────────────── */}
      {isWebsitePreviewOpen && (
        <ModalPortal isOpen={isWebsitePreviewOpen}>
          <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col">
            {/* Viewport Control Bar */}
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-white truncate max-w-xs sm:max-w-md">
                    {intakeData.schoolProfile?.schoolName || 'School Website'} &bull; Live Preview
                  </h3>
                  <p className="text-[11px] text-slate-400">Rendering directly from canonical intake data</p>
                </div>
              </div>

              {/* Viewport Switches */}
              <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPreviewViewport('desktop')}
                  className={`p-1.5 rounded-lg transition ${
                    previewViewport === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Desktop View"
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewport('tablet')}
                  className={`p-1.5 rounded-lg transition ${
                    previewViewport === 'tablet' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Tablet View"
                >
                  <Tablet className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewport('mobile')}
                  className={`p-1.5 rounded-lg transition ${
                    previewViewport === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Mobile View"
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsWebsitePreviewOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Renderer Frame */}
            <div className="flex-1 bg-slate-900/50 p-2 sm:p-4 overflow-y-auto flex items-start justify-center">
              <div
                className={`bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 w-full ${
                  previewViewport === 'desktop'
                    ? 'max-w-6xl min-h-[85vh]'
                    : previewViewport === 'tablet'
                    ? 'max-w-2xl min-h-[85vh]'
                    : 'max-w-sm min-h-[85vh]'
                }`}
              >
                <SchoolWebsiteRenderer
                  data={schoolWebsiteData}
                  viewMode="tabbed"
                  initialTab={activePreviewTab}
                />
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
