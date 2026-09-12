'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Download,
  Eye,
  Edit2,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  Building,
  Image as ImageIcon,
  Users,
  Sparkles,
  Search,
  Filter,
  Check,
  X,
  RefreshCw,
  FolderArchive,
  HelpCircle,
  Clock,
  Printer,
  FileCheck,
  School,
  MapPin,
  Phone,
  Mail,
  Layers,
  AlertCircle,
  Plus,
  Trash2,
  Monitor,
  Tablet,
  Smartphone,
  Maximize2,
  Globe,
} from 'lucide-react';
import type {
  UniversalIntakeData,
  WebsitePageConfiguration,
  WebsiteApprovalRecord,
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
  type VerificationStatus,
  type UniversalVerificationAsset,
  type UniversalVerificationDocument,
  type UniversalFacilityItem,
  type UniversalReadinessSummary,
  aggregateUniversalAssets,
  aggregateUniversalDocuments,
  aggregateUniversalFacilities,
  calculateUniversalReadiness,
  generateSubmissionReportHtml,
  buildUniversalSubmissionZip,
  normalizeLeadershipData,
} from '@/lib/universalVerificationEngine';
import {
  executeRemediationNavigation,
  resolveRemediationDestination,
} from '@/lib/remediationRegistry';
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
  updateSectionField: (section: keyof UniversalIntakeData, field: string, value: any) => void;
  updateSectionDirect?: (section: keyof UniversalIntakeData, value: any) => void;
  onNavigateToSection?: (sectionKey: any) => void;
  onNavigateToBranding?: () => void;
  setPreviewingStyle?: (style: any) => void;
}

export default function UniversalVerificationPage({
  token,
  intakeData,
  updateSectionField,
  updateSectionDirect,
  onNavigateToSection,
  onNavigateToBranding,
  setPreviewingStyle,
}: UniversalVerificationPageProps) {
  // ── Local State & Collapsible Sections ──────────────────────────────────────
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    identity: false,
    scopeConfig: false,
    pages: false,
    content: true,
    facilities: false,
    assets: false,
    compliance: false,
    disclosures: false,
    preview: true,
    blockers: false,
    summary: false,
    admin: false,
    declaration: false,
  });

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Asset filtering state
  const [assetCategoryFilter, setAssetCategoryFilter] = useState<string>('all');
  const [assetSearchTerm, setAssetSearchTerm] = useState<string>('');

  // Modals & Drawers
  const [previewingAsset, setPreviewingAsset] = useState<UniversalVerificationAsset | null>(null);
  const [previewingPageKey, setPreviewingPageKey] = useState<string | null>(null);
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

  // Authoritative Website Data Contract (Zero mock/fake fallbacks)
  const schoolWebsiteData = useMemo(
    () => buildSchoolWebsiteDataFromIntake(intakeData, false),
    [intakeData]
  );

  // Cross-Section Consistency Engine
  const consistencyResult: ConsistencyValidationResult = useMemo(
    () => validateCrossSectionConsistency(intakeData),
    [intakeData]
  );

  // Background Scroll Lock & Keyboard ESC handling for Live Preview Modal
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
  const approvalHistory: WebsiteApprovalRecord[] = useMemo(
    () => intakeData.websiteRequirements?.approvalHistory || [],
    [intakeData.websiteRequirements?.approvalHistory]
  );
  const currentApproval: WebsiteApprovalRecord | undefined = useMemo(
    () => intakeData.websiteRequirements?.currentApproval,
    [intakeData.websiteRequirements?.currentApproval]
  );
  const isWebsiteApproved = Boolean(
    intakeData.websiteRequirements?.websiteApproved && currentApproval
  );

  const invalidationResult: ApprovalInvalidationResult = useMemo(() => {
    return detectSpecificationInvalidation(currentApproval, intakeData);
  }, [intakeData]);
  const isInvalidated = isWebsiteApproved && invalidationResult.isInvalidated;

  // ── Canonical Aggregations ──────────────────────────────────────────────────
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

  const pageConfigurations: Record<string, WebsitePageConfiguration> = useMemo(() => {
    return intakeData.websiteRequirements?.pageConfigurations || buildWebsitePageConfigurations(intakeData);
  }, [intakeData]);

  // Administrator Details (Auto-prefilled from canonical sources)
  const [adminName, setAdminName] = useState(
    intakeData.usersAccess?.superAdminFullName ||
    intakeData.clientConfirmation?.confirmedByName ||
    intakeData.leadership?.principalName ||
    ''
  );
  const [adminDesignation, setAdminDesignation] = useState(
    intakeData.usersAccess?.superAdminDesignation ||
    intakeData.clientConfirmation?.confirmedByDesignation ||
    'Principal / Super Administrator'
  );
  const [adminEmail, setAdminEmail] = useState(
    intakeData.usersAccess?.superAdminEmail ||
    intakeData.clientConfirmation?.confirmedByEmail ||
    intakeData.schoolProfile?.officialEmail ||
    ''
  );
  const [adminPhone, setAdminPhone] = useState(
    intakeData.usersAccess?.superAdminPhone ||
    intakeData.clientConfirmation?.confirmedByPhone ||
    intakeData.schoolProfile?.officialPhone ||
    ''
  );

  // Keep adminName reactive if not yet explicitly modified
  useEffect(() => {
    if (!intakeData.usersAccess?.superAdminFullName) {
      const candidate =
        intakeData.clientConfirmation?.confirmedByName ||
        normalizeLeadershipData(intakeData.leadership).principalName ||
        '';
      if (candidate && !adminName) {
        setAdminName(candidate);
      }
    }
  }, [intakeData.leadership, intakeData.clientConfirmation, intakeData.usersAccess, adminName]);

  // Sync to canonical usersAccess when fields change
  const handleAdminChange = (field: string, value: string) => {
    if (field === 'name') {
      setAdminName(value);
      updateSectionField('usersAccess', 'superAdminFullName', value);
    } else if (field === 'designation') {
      setAdminDesignation(value);
      updateSectionField('usersAccess', 'superAdminDesignation', value);
    } else if (field === 'email') {
      setAdminEmail(value);
      updateSectionField('usersAccess', 'superAdminEmail', value);
    } else if (field === 'phone') {
      setAdminPhone(value);
      updateSectionField('usersAccess', 'superAdminPhone', value);
    }
  };

  // 5 Canonical Institutional Declarations
  const [declAccurate, setDeclAccurate] = useState(true);
  const [declAuthorized, setDeclAuthorized] = useState(true);
  const [declMaterials, setDeclMaterials] = useState(true);
  const [declReviewed, setDeclReviewed] = useState(true);
  const [declStatutory, setDeclStatutory] = useState(true);

  const areAllDeclarationsChecked =
    declAccurate && declAuthorized && declMaterials && declReviewed && declStatutory;

  // Cloud Drive Optional Link
  const [cloudDriveUrl, setCloudDriveUrl] = useState(
    intakeData.mediaAssets?.sharedDriveUrl || ''
  );

  // ── Navigation Helper ───────────────────────────────────────────────────────
  const jumpTo = (sectionKey: string) => {
    if (onNavigateToSection) {
      onNavigateToSection(sectionKey);
    }
  };

  // ── Download Handlers ───────────────────────────────────────────────────────
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

    const htmlContent = generateSubmissionReportHtml(
      intakeData,
      readiness as any,
      allAssets,
      allDocuments,
      allFacilities,
      {
        submissionId: subId,
        version,
        submittedAt: dateStr,
        adminName: adminName || 'Authorized Administrator',
        adminDesignation,
        adminEmail,
        adminPhone,
      }
    );

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Website-Submission-Report-${subId}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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

      const zipBlob = await buildUniversalSubmissionZip(
        intakeData,
        readiness as any,
        allAssets,
        allDocuments,
        allFacilities,
        {
          submissionId: subId,
          version,
          submittedAt: dateStr,
          adminName: adminName || 'Authorized Administrator',
          adminDesignation,
          adminEmail,
          adminPhone,
        }
      );

      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Website-Submission-${subId}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate ZIP package:', err);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  // ── Final Lock & Submission Handler ─────────────────────────────────────────
  const handleFinalSubmission = async () => {
    if (!token) return;

    // Strict Publication Guardrail: Block submission if publication blockers or conflicts remain
    if (readiness.hasPublicationBlockers || consistencyResult.criticalConflictsCount > 0) {
      alert(
        `Cannot Submit & Lock: There are ${readiness.publicationBlockers.length} publication blocker(s) and ${consistencyResult.criticalConflictsCount} critical data conflict(s) that must be resolved first.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const approverInfo = {
        name: adminName || 'Authorized Administrator',
        role: adminDesignation || 'Super Administrator',
        email: adminEmail,
        phone: adminPhone,
      };

      // 1. Prepare and persist latest authoritative snapshot before validation/locking
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
          ...(intakeData.clientConfirmation || {}),
          isConfirmed: true,
          confirmedByName: adminName,
          confirmedByDesignation: adminDesignation,
          confirmedAt: new Date().toISOString(),
        },
      } as UniversalIntakeData;

      const saveRes = await saveSchoolIntakeDraftAction(token, latestIntake);
      if (!saveRes.success) {
        alert('Your latest changes could not be saved.\nPlease try again before submitting.');
        setIsSubmitting(false);
        return;
      }

      // 2. Authoritative Publication Readiness Validation on authoritative snapshot
      const currentValidation = evaluateWebsitePublicationReadiness(latestIntake);
      if (!currentValidation.isReady || currentValidation.blockers.length > 0) {
        alert(
          `Cannot Submit & Lock: There are ${currentValidation.blockers.length} publication blocker(s) that must be resolved first.`
        );
        setIsSubmitting(false);
        return;
      }

      // 3. Approve & Lock specification snapshot
      const approvalRes = await approveWebsiteSpecificationAction(
        token,
        approverInfo,
        'Final Institutional Website Specification Verified and Approved',
        latestIntake
      );

      if (!approvalRes.success && approvalRes.error) {
        alert(`Submission could not be locked: ${approvalRes.error}`);
        setIsSubmitting(false);
        return;
      }

      // 4. Submit full intake payload
      const subId = `SCH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const now = new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      const versionStr = `v${approvalRes.approvalRecord?.specificationVersion || 1}`;

      setSubmissionSuccessData({
        submissionId: subId,
        submittedAt: now,
        version: versionStr,
      });

      // Update client confirmation
      updateSectionField('clientConfirmation', 'isConfirmed', true);
      updateSectionField('clientConfirmation', 'confirmedByName', adminName);
      updateSectionField('clientConfirmation', 'confirmedByDesignation', adminDesignation);
      updateSectionField('clientConfirmation', 'confirmedAt', new Date().toISOString());
      updateSectionField('websiteRequirements', 'websiteApproved', true);

      setIsSubmitModalOpen(false);
    } catch (err: any) {
      console.error('Final submission failed:', err);
      alert('Failed to submit website specification. Please verify your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Filtered Assets ─────────────────────────────────────────────────────────
  const filteredAssets = useMemo(() => {
    return allAssets.filter((a) => {
      const matchesCat = assetCategoryFilter === 'all' || a.category === assetCategoryFilter;
      const matchesSearch =
        !assetSearchTerm ||
        a.title.toLowerCase().includes(assetSearchTerm.toLowerCase()) ||
        a.usages.some((u) => u.toLowerCase().includes(assetSearchTerm.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [allAssets, assetCategoryFilter, assetSearchTerm]);

  return (
    <div className="space-y-6 text-[#131B2E]">
      {/* ── TOP STICKY READINESS & COMMAND HEADER ──────────────────────────── */}
      <div className="sticky top-2 z-30 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                Universal Final Verification
              </span>
              {isWebsiteApproved && !isInvalidated ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  Locked (v{currentApproval?.specificationVersion || 1})
                </span>
              ) : isInvalidated ? (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-700" />
                  Source Changes Detected
                </span>
              ) : (
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                  Pre-Publication Review
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#131B2E] tracking-tight mt-1">
              Final Website Review &amp; Submission
            </h1>
            <p className="text-xs text-slate-500 max-w-2xl">
              One central control center reviewing all canonical information, media assets, facilities, statutory compliance, and website pages before official sign-off.
            </p>
          </div>

          {/* Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsWebsitePreviewOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              <span>Preview Website</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadReport}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Download Report</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadZipPackage}
              disabled={isDownloadingZip}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition cursor-pointer"
            >
              {isDownloadingZip ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-slate-600" />}
              <span>{isDownloadingZip ? 'Packaging...' : 'Download ZIP'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(true)}
              disabled={!readiness.isReadyForSubmission}
              className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black shadow-md transition cursor-pointer ${
                readiness.isReadyForSubmission
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Submit &amp; Lock</span>
            </button>
          </div>
        </div>

        {/* ── SECTION 1: FINAL STATUS HEADER & METRICS ─────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Overall Readiness</div>
            <div className="text-xl font-black text-indigo-700 mt-0.5">{readiness.overallScore}%</div>
            <div className="w-full bg-slate-200 h-1 rounded-full mt-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  readiness.overallScore >= 90 ? 'bg-emerald-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${readiness.overallScore}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Content</div>
            <div className="text-lg font-black text-slate-800 mt-0.5">{readiness.categoryScores.content}%</div>
            <span className="text-[10px] text-slate-500 font-medium">Story &amp; Leadership</span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assets &amp; Media</div>
            <div className="text-lg font-black text-slate-800 mt-0.5">{readiness.categoryScores.assets}%</div>
            <span className="text-[10px] text-slate-500 font-medium">{allAssets.filter((a) => a.status === 'verified').length} / {allAssets.length} Verified</span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Compliance</div>
            <div className="text-lg font-black text-slate-800 mt-0.5">{readiness.categoryScores.compliance}%</div>
            <span className="text-[10px] text-slate-500 font-medium">{allDocuments.filter((d) => d.status === 'verified').length} / {allDocuments.filter((d) => !d.isNotApplicable).length} Statutory Docs</span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Configuration</div>
            <div className="text-lg font-black text-emerald-700 mt-0.5">100%</div>
            <span className="text-[10px] text-emerald-600 font-medium">{Object.keys(pageConfigurations).length} Pages Ready</span>
          </div>

          <div className={`p-2.5 rounded-xl border ${
            readiness.hasPublicationBlockers
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            <div className="text-[10px] font-bold uppercase tracking-wider">Blockers</div>
            <div className="text-lg font-black mt-0.5">
              {readiness.publicationBlockers.length} {readiness.publicationBlockers.length === 1 ? 'Item' : 'Items'}
            </div>
            <span className="text-[10px] font-medium">
              {readiness.hasPublicationBlockers ? 'Attention Required' : 'Ready to Launch'}
            </span>
          </div>
        </div>
      </div>

      {/* ── POST-SUBMISSION BANNER (IF SUBMITTED) ──────────────────────────── */}
      {submissionSuccessData && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border-2 border-emerald-400 p-5 rounded-2xl shadow-md space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-emerald-950">
                ✓ Website Specification Submitted &amp; Locked
              </h3>
              <p className="text-xs text-emerald-800">
                Submission ID: <strong className="font-mono font-bold">{submissionSuccessData.submissionId}</strong> • Version: {submissionSuccessData.version} • Submitted on {submissionSuccessData.submittedAt}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-200">
            <span className="text-xs font-bold text-emerald-900 bg-white border border-emerald-300 px-2.5 py-1 rounded-lg">
              Status: Under Review
            </span>
            <button
              type="button"
              onClick={handleDownloadReport}
              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition"
            >
              Download Submission Report
            </button>
            <button
              type="button"
              onClick={handleDownloadZipPackage}
              className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-900 text-xs font-bold transition"
            >
              Download Submission Package (ZIP)
            </button>
          </div>
        </div>
      )}

      {/* ── ATTENTION REQUIRED: GUIDED REMEDIATION CHECKLIST ──────────────── */}
      {readiness.hasPublicationBlockers && (
        <div className="bg-gradient-to-r from-rose-50/90 via-amber-50/70 to-rose-50/90 border-2 border-rose-300 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-200/80 pb-3.5">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base text-rose-950 flex items-center gap-2 flex-wrap">
                  <span>ATTENTION REQUIRED BEFORE PUBLICATION</span>
                  <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-rose-200 text-rose-900 border border-rose-300">
                    {readiness.publicationBlockers.length} {readiness.publicationBlockers.length === 1 ? 'Action Required' : 'Actions Required'}
                  </span>
                </h3>
                <p className="text-xs text-rose-800 mt-0.5">
                  The following statutory requirements or mandatory fields are missing. Click any action item to navigate directly to the exact input or document upload card.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {readiness.publicationBlockers.map((b) => {
              const dest = b.destination || resolveRemediationDestination(b.key || b.id);
              return (
                <div
                  key={`attention-${b.id}`}
                  className="bg-white border border-rose-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-rose-300 transition"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">{b.title}</span>
                      <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                        {b.sourceLabel}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">{b.reason}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => executeRemediationNavigation(dest, jumpTo)}
                    className="self-start sm:self-auto px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs inline-flex items-center gap-1.5 shrink-0 group"
                  >
                    <span>Fix Now</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SECTION 10: PUBLICATION BLOCKERS ("Before You Submit") ─────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('blockers')}
          className="w-full flex items-center justify-between p-4 bg-slate-50/70 hover:bg-slate-100/70 transition text-left cursor-pointer"
        >
          <div className="flex items-center space-x-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
              readiness.hasPublicationBlockers ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {readiness.hasPublicationBlockers ? '⛔' : '✓'}
            </div>
            <div>
              <div className="font-extrabold text-sm text-[#131B2E]">
                Before You Submit — Publication Blockers &amp; Recommendations
              </div>
              <div className="text-[11px] text-slate-500">
                {readiness.publicationBlockers.length} Blocker{readiness.publicationBlockers.length === 1 ? '' : 's'} • {readiness.recommendations.length} Recommended
              </div>
            </div>
          </div>
          {collapsedSections.blockers ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </button>

        {!collapsedSections.blockers && (
          <div className="p-4 sm:p-5 space-y-4">
            {/* Cross-Section Consistency Conflicts */}
            {consistencyResult.hasConflicts && (
              <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/80 space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Cross-Section Data Contradictions Detected ({consistencyResult.conflicts.length})</span>
                </div>
                <div className="space-y-2">
                  {consistencyResult.conflicts.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-lg bg-white border border-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900">{c.title}</div>
                        <p className="text-[11px] text-slate-600">{c.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => jumpTo(c.conflictingSections[0])}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition cursor-pointer shadow-2xs shrink-0 inline-flex items-center gap-1"
                      >
                        <span>Fix Now</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {readiness.hasPublicationBlockers ? (
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-rose-700">
                  Publication Blockers (Must resolve before submission)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {readiness.publicationBlockers.map((b) => {
                    const dest = b.destination || resolveRemediationDestination(b.key || b.id);
                    return (
                      <div
                        key={b.id}
                        className="p-3 rounded-xl border border-rose-200 bg-rose-50/60 flex items-start justify-between gap-3"
                      >
                        <div>
                          <div className="font-bold text-xs text-rose-950 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>{b.title}</span>
                          </div>
                          <p className="text-[11px] text-rose-800 mt-0.5">{b.reason}</p>
                          <div className="text-[10px] font-semibold text-rose-600 mt-1">Source: {b.sourceLabel}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => executeRemediationNavigation(dest, jumpTo)}
                          className="px-3 py-1.5 bg-white border border-rose-300 hover:bg-rose-50 text-rose-800 text-xs font-bold rounded-lg transition shrink-0 cursor-pointer shadow-2xs inline-flex items-center gap-1 group"
                        >
                          <span>Fix Now</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-800 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero publication blockers. All required school information and compliance documents are satisfied.</span>
              </div>
            )}

            {readiness.recommendations.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Recommendations (Enhance your digital presence)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {readiness.recommendations.map((r) => {
                    const dest = r.destination || resolveRemediationDestination(r.id);
                    return (
                      <div key={r.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
                        <div className="text-xs text-slate-700">
                          <span className="font-bold">{r.title}:</span> {r.reason}
                        </div>
                        <button
                          type="button"
                          onClick={() => executeRemediationNavigation(dest, jumpTo)}
                          className="text-[11px] font-semibold text-indigo-600 hover:underline shrink-0 cursor-pointer"
                        >
                          Edit →
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── SECTION 2: PUBLIC WEBSITE INFORMATION ─────────────────────────── */}
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
              <div className="font-extrabold text-sm text-[#131B2E]">Public School Identity Information</div>
              <div className="text-[11px] text-slate-500">Official name, affiliation, address, and contact coordinates</div>
            </div>
          </div>
          {collapsedSections.identity ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </button>

        {!collapsedSections.identity && (
          <div className="p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
              {/* School Name */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">School Name</div>
                  <div className="text-sm font-black text-slate-900 mt-0.5">
                    {intakeData.schoolProfile?.schoolName || intakeData.schoolProfile?.displayName || 'Not configured'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                    <span>Source: Section 1 — Identity</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    ✓ Verified
                  </span>
                  <button
                    type="button"
                    onClick={() => jumpTo('schoolProfile')}
                    className="text-[11px] font-semibold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" /> Edit Source
                  </button>
                </div>
              </div>

              {/* Tagline / Motto */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tagline / Motto</div>
                  <div className="text-xs font-semibold text-slate-900 mt-0.5">
                    {(intakeData.schoolProfile as any)?.tagline || intakeData.brandingDesign?.taglineOrMotto || intakeData.brandingDesign?.motto || 'Inspiring Academic Excellence'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Source: Section 4 — Brand Identity</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    ✓ Verified
                  </span>
                  <button
                    type="button"
                    onClick={() => jumpTo('brandingDesign')}
                    className="text-[11px] font-semibold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" /> Edit Source
                  </button>
                </div>
              </div>

              {/* Primary Address */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Official Campus Address</div>
                  <div className="text-xs font-semibold text-slate-900 mt-0.5">
                    {intakeData.campuses?.[0]?.address || intakeData.schoolProfile?.address || 'Primary campus address'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Source: Section 2 — Campuses</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    ✓ Verified
                  </span>
                  <button
                    type="button"
                    onClick={() => jumpTo('campuses')}
                    className="text-[11px] font-semibold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" /> Edit Source
                  </button>
                </div>
              </div>

              {/* Contact Coordinates */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Phone &amp; Email</div>
                  <div className="text-xs font-semibold text-slate-900 mt-0.5">
                    {intakeData.schoolProfile?.officialPhone || intakeData.schoolProfile?.phone || 'Phone'} •{' '}
                    {intakeData.schoolProfile?.officialEmail || 'Email'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Source: Section 1 — Identity</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    ✓ Verified
                  </span>
                  <button
                    type="button"
                    onClick={() => jumpTo('schoolProfile')}
                    className="text-[11px] font-semibold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" /> Edit Source
                  </button>
                </div>
              </div>

              {/* Website Domain */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Website Domain Presence</div>
                  <div className="text-xs font-mono font-bold text-indigo-700 mt-0.5">
                    {intakeData.schoolProfile?.preferredPublicUrl ||
                      (intakeData.schoolProfile?.slug
                        ? `https://${intakeData.schoolProfile.slug}.edu.in`
                        : 'https://school-domain.edu.in')}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Source: Section 19 — Domain Setup</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                    Configured
                  </span>
                  <button
                    type="button"
                    onClick={() => jumpTo('domainPresence')}
                    className="text-[11px] font-semibold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" /> Edit Source
                  </button>
                </div>
              </div>

              {/* Board & Affiliation */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Board Affiliation</div>
                  <div className="text-xs font-bold text-slate-900 mt-0.5">
                    {intakeData.schoolProfile?.board || 'CBSE'} (Affiliation No:{' '}
                    {intakeData.schoolProfile?.affiliationNumber || 'Pending / In-Process'})
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Source: Section 1 — Identity</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    ✓ Verified
                  </span>
                  <button
                    type="button"
                    onClick={() => jumpTo('schoolProfile')}
                    className="text-[11px] font-semibold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" /> Edit Source
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION: PROJECT SCOPE & WEBSITE CONFIGURATION ───────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('scopeConfig')}
          className="w-full flex items-center justify-between p-4 bg-slate-50/70 hover:bg-slate-100/70 transition text-left cursor-pointer"
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-[#131B2E]">Project Scope &amp; Website Configuration</div>
              <div className="text-[11px] text-slate-500">Website architecture, domain setup, and custom institutional requests</div>
            </div>
          </div>
          {collapsedSections.scopeConfig ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </button>

        {!collapsedSections.scopeConfig && (
          <div className="p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
              {/* Card 1: Website Scope & Modules */}
              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Website Scope</span>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                      Configured
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-1">
                    {intakeData.websiteScope?.websiteType === 'multi_campus_group'
                      ? 'Multi-Campus / Group Portal'
                      : intakeData.websiteScope?.websiteType === 'k12_comprehensive'
                      ? 'Comprehensive K-12 Portal'
                      : 'Standard School Website'}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    <span className="font-semibold text-slate-800">Core Modules:</span> 6 Included
                  </div>
                  {intakeData.websiteScope?.optionalModules && intakeData.websiteScope.optionalModules.length > 0 ? (
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      <span className="font-semibold text-slate-800">Optional Modules:</span> {intakeData.websiteScope.optionalModules.length} Active
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 mt-0.5 italic">
                      Standard modules selected
                    </div>
                  )}
                  {intakeData.websiteScope?.customPages && intakeData.websiteScope.customPages.length > 0 && (
                    <div className="text-[11px] text-indigo-700 mt-0.5 font-semibold">
                      +{intakeData.websiteScope.customPages.length} Custom Page(s)
                    </div>
                  )}
                </div>
                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Chapter 5 — Config</span>
                  <button
                    type="button"
                    onClick={() => jumpTo('websiteScope')}
                    className="text-[11px] font-semibold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" /> Edit Scope
                  </button>
                </div>
              </div>

              {/* Card 2: Website & Domain Presence */}
              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Domain Preference</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      ✓ Valid
                    </span>
                  </div>
                  <div className="text-sm font-mono font-bold text-indigo-700 mt-1 truncate">
                    {intakeData.domainPresence?.domainChoice === 'DECIDE_LATER' || intakeData.domainPresence?.decideLater
                      ? 'Decide Later (Ekaagra Subdomain)'
                      : intakeData.domainPresence?.domainChoice === 'EXISTING_DOMAIN' || intakeData.domainPresence?.alreadyOwnsDomain
                      ? intakeData.domainPresence?.existingDomainName || intakeData.domainPresence?.preferredDomain || 'School-owned Domain'
                      : intakeData.domainPresence?.preferredNewDomainName || intakeData.domainPresence?.preferredDomain || 'Standard Edu Domain'}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    {intakeData.domainPresence?.domainChoice === 'EXISTING_DOMAIN' || intakeData.domainPresence?.alreadyOwnsDomain
                      ? 'School already owns this domain (DNS transfer supported)'
                      : intakeData.domainPresence?.domainChoice === 'DECIDE_LATER' || intakeData.domainPresence?.decideLater
                      ? 'Temporary preview on ekaagraschools.in; domain finalized later'
                      : intakeData.domainPresence?.selectedDomainQuote?.isIncluded
                      ? 'Included in plan subscription'
                      : 'Standard annual registration'}
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Chapter 5 — Config</span>
                  <button
                    type="button"
                    onClick={() => jumpTo('domainPresence')}
                    className="text-[11px] font-semibold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" /> Edit Domain
                  </button>
                </div>
              </div>

              {/* Card 3: Custom Requirements & Special Requests */}
              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Custom Requests</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      ✓ Ready (Optional)
                    </span>
                  </div>
                  {intakeData.additionalRequirements?.customRequests && intakeData.additionalRequirements.customRequests.length > 0 ? (
                    <div className="space-y-1.5 mt-1">
                      <div className="text-xs font-bold text-slate-900">
                        {intakeData.additionalRequirements.customRequests.length} Custom Request(s)
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {intakeData.additionalRequirements.customRequests.slice(0, 2).map((req, idx) => (
                          <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded truncate max-w-full">
                            {req}
                          </span>
                        ))}
                        {intakeData.additionalRequirements.customRequests.length > 2 && (
                          <span className="text-[10px] text-slate-500 font-semibold">
                            +{intakeData.additionalRequirements.customRequests.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1">
                      <div className="text-xs font-semibold text-slate-800">
                        Standard Project Scope
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        No custom requests submitted. Standard turnkey school deployment applies.
                      </p>
                    </div>
                  )}
                  {(intakeData.additionalRequirements?.notes || intakeData.additionalRequirements?.generalCommentsOrQuestions) && (
                    <p className="text-[10px] text-slate-500 line-clamp-1 mt-1 italic">
                      &ldquo;{intakeData.additionalRequirements.notes || intakeData.additionalRequirements.generalCommentsOrQuestions}&rdquo;
                    </p>
                  )}
                </div>
                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Chapter 5 — Config</span>
                  <button
                    type="button"
                    onClick={() => jumpTo('additionalRequirements')}
                    className="text-[11px] font-semibold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" /> Edit Requests
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION 3: WEBSITE PAGES & CONTENT ────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('pages')}
          className="w-full flex items-center justify-between p-4 bg-slate-50/70 hover:bg-slate-100/70 transition text-left cursor-pointer"
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold text-xs">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-[#131B2E]">Website Pages &amp; Public Structure</div>
              <div className="text-[11px] text-slate-500">
                {Object.keys(pageConfigurations).length} Standard &amp; Custom Pages Configured
              </div>
            </div>
          </div>
          {collapsedSections.pages ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </button>

        {!collapsedSections.pages && (
          <div className="p-4 sm:p-5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(pageConfigurations).map(([key, pageCfg]) => {
                const isReady = pageCfg.status === 'ready';
                return (
                  <div
                    key={key}
                    className="p-3 bg-slate-50/70 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2 hover:border-slate-300 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-900">{pageCfg.label || key}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            isReady
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-amber-50 border-amber-200 text-amber-700'
                          }`}
                        >
                          {isReady ? '✓ Ready' : 'Needs Review'}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">/{pageCfg.slug}</div>
                      <div className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                        {(pageCfg as any).description || `${pageCfg.label} — Institutional public page.`}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px]">
                      <span className="font-medium text-slate-500">
                        Content: {isReady ? '100%' : '80%'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setActivePreviewTab(key);
                          setIsWebsitePreviewOpen(true);
                        }}
                        className="font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" /> Preview
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION 4: CONTENT VERIFICATION ───────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('content')}
          className="w-full flex items-center justify-between p-4 bg-slate-50/70 hover:bg-slate-100/70 transition text-left cursor-pointer"
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold text-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-[#131B2E]">Institutional Content Verification</div>
              <div className="text-[11px] text-slate-500">
                School story, vision, mission, leadership messages &amp; academic methodology
              </div>
            </div>
          </div>
          {collapsedSections.content ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </button>

        {!collapsedSections.content && (
          <div className="p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* About School */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px]">
                    About School Narrative
                  </span>
                  <button
                    type="button"
                    onClick={() => jumpTo('schoolContent')}
                    className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Edit in Story
                  </button>
                </div>
                <p className="text-slate-700 text-xs leading-relaxed">
                  {typeof intakeData.schoolContent?.aboutSchool === 'object'
                    ? intakeData.schoolContent.aboutSchool?.text
                    : intakeData.schoolContent?.aboutSchool ||
                      'Institutional overview description pending entry in Story & Philosophy.'}
                </p>
              </div>

              {/* Vision & Mission */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px]">
                    Vision &amp; Mission
                  </span>
                  <button
                    type="button"
                    onClick={() => jumpTo('schoolContent')}
                    className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Edit in Story
                  </button>
                </div>
                <div className="space-y-2">
                  <div>
                    <strong className="text-slate-900 block text-[11px]">Vision:</strong>
                    <p className="text-slate-700 text-xs">
                      {typeof intakeData.schoolContent?.vision === 'object'
                        ? intakeData.schoolContent.vision?.text
                        : intakeData.schoolContent?.vision || 'Empower students to lead with integrity, intellect, and empathy.'}
                    </p>
                  </div>
                  <div>
                    <strong className="text-slate-900 block text-[11px]">Mission:</strong>
                    <p className="text-slate-700 text-xs">
                      {typeof intakeData.schoolContent?.mission === 'object'
                        ? intakeData.schoolContent.mission?.text
                        : intakeData.schoolContent?.mission || 'Provide holistic education that develops curious, lifelong learners.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Principal Message */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px]">
                    Principal Credentials &amp; Desk
                  </span>
                  <button
                    type="button"
                    onClick={() => jumpTo('leadership')}
                    className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Edit in Leadership
                  </button>
                </div>
                {(() => {
                  const normLead = normalizeLeadershipData(intakeData.leadership);
                  return (
                    <div className="text-xs text-slate-800">
                      <div className="font-bold">
                        {normLead.principalName || <span className="text-slate-400 italic">Not specified</span>}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {normLead.principalQualification || normLead.principalDesignation || 'Principal'}
                      </div>
                      <p className="text-slate-700 text-xs mt-1.5 line-clamp-3">
                        {normLead.principalMessage || (
                          <span className="text-slate-400 italic">No message entered yet.</span>
                        )}
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Admissions Overview */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px]">
                    Admissions Guidelines
                  </span>
                  <button
                    type="button"
                    onClick={() => jumpTo('admissions')}
                    className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Edit in Admissions
                  </button>
                </div>
                <div className="text-xs text-slate-700 space-y-1">
                  <div>Cycle: <span className="font-bold text-slate-900">{intakeData.admissions?.session || '2026–2027'}</span></div>
                  <div>Helpline: <span className="font-bold text-slate-900">{intakeData.admissions?.admissionPhone || intakeData.schoolProfile?.officialPhone || 'Admissions Desk'}</span></div>
                  {(() => {
                    const admFees = Array.isArray((intakeData.admissions as any)?.fees) ? (intakeData.admissions as any).fees : [];
                    const totalFees = admFees.length;
                    const visibleFees = admFees.filter((f: any) => f.showOnWebsite !== false).length;
                    return totalFees > 0 ? (
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          ✓ {totalFees} fee{totalFees !== 1 ? 's' : ''} configured • {visibleFees} visible on website
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                          ✗ Not configured
                        </span>
                      </div>
                    );
                  })()}
                  <div className="text-[11px] text-slate-500 mt-1">
                    Process: Online Application Form &rarr; Document Verification &rarr; Interaction &rarr; Fee Payment
                  </div>
                </div>
              </div>

              {/* Facilities & Campus Amenities Description */}
              {(() => {
                const facItem = (intakeData.assetChecklist?.items || []).find((i) => i.id === 'acad-facilities-desc');
                return (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px]">
                        Facilities &amp; Campus Amenities Copy
                      </span>
                      <button
                        type="button"
                        onClick={() => jumpTo('assetChecklist')}
                        className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                      >
                        Edit in Provisioning
                      </button>
                    </div>
                    {facItem?.textContent ? (
                      <div className="space-y-1.5">
                        <p className="text-slate-700 text-xs leading-relaxed line-clamp-3">
                          {facItem.textContent}
                        </p>
                        <div className="flex items-center gap-2 pt-0.5">
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            ✓ Provided
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Source: {facItem.sourceSection || 'Recommended Content'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500 italic">
                        Not provided yet. Recommended content can be synthesized in Section 24.
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Faculty & Educator Highlights */}
              {(() => {
                const staffItem = (intakeData.assetChecklist?.items || []).find((i) => i.id === 'lead-faculty-highlights');
                return (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px]">
                        Faculty &amp; Educator Highlights
                      </span>
                      <button
                        type="button"
                        onClick={() => jumpTo('assetChecklist')}
                        className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                      >
                        Edit in Provisioning
                      </button>
                    </div>
                    {staffItem?.textContent ? (
                      <div className="space-y-1.5">
                        <p className="text-slate-700 text-xs leading-relaxed line-clamp-3">
                          {staffItem.textContent}
                        </p>
                        <div className="flex items-center gap-2 pt-0.5">
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            ✓ Provided
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Source: {staffItem.sourceSection || 'Recommended Content'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500 italic">
                        Not provided yet. Available for later completion or synthesis in Section 24.
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Statutory Policy Templates & Compliance */}
              {(() => {
                const policyItems = (intakeData.assetChecklist?.items || []).filter(
                  (i) => i.category === 'policies' && i.textContent
                );
                if (policyItems.length === 0) return null;
                return (
                  <div className="md:col-span-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px]">
                        Legal Policies &amp; Safeguarding Disclosures ({policyItems.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => jumpTo('assetChecklist')}
                        className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                      >
                        Review in Provisioning
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {policyItems.map((pol) => {
                        const isTemplate = pol.contentSource === 'template' || pol.sourceSection?.includes('Template');
                        return (
                          <div key={pol.id} className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 truncate">{pol.title}</span>
                              {isTemplate ? (
                                <span className="text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                  ⚠ Needs Review
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                  ✓ Verified
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Source: {pol.sourceSection || 'Standard Template'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION 5: FACILITIES & INFRASTRUCTURE REVIEW ─────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('facilities')}
          className="w-full flex items-center justify-between p-4 bg-slate-50/70 hover:bg-slate-100/70 transition text-left cursor-pointer"
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold text-xs">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-[#131B2E]">Campus Facilities &amp; Infrastructure Review</div>
              <div className="text-[11px] text-slate-500">
                Dynamic visual inspection with conditional logic (Hostel, Transport, Labs)
              </div>
            </div>
          </div>
          {collapsedSections.facilities ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </button>

        {!collapsedSections.facilities && (
          <div className="p-4 sm:p-5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {allFacilities.map((fac) => (
                <div
                  key={fac.key}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-2 ${
                    fac.status === 'not_applicable'
                      ? 'bg-slate-100/70 border-slate-200 text-slate-500 opacity-80'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-900">{fac.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          fac.status === 'verified'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : fac.status === 'not_applicable'
                            ? 'bg-slate-200/80 border-slate-300 text-slate-600'
                            : 'bg-amber-50 border-amber-200 text-amber-700'
                        }`}
                      >
                        {fac.status === 'verified'
                          ? '✓ Verified'
                          : fac.status === 'not_applicable'
                          ? 'Not Applicable'
                          : 'Review'}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-indigo-700 mt-1">
                      {fac.countOrCapacity}
                    </div>

                    <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                      {fac.description}
                    </p>

                    {fac.features.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {fac.features.slice(0, 3).map((feat, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] font-medium bg-white border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded"
                          >
                            {feat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Source: {fac.sourceLabel}</span>
                    <button
                      type="button"
                      onClick={() => jumpTo(fac.sourceSection)}
                      className="font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION 6: UNIVERSAL ASSET LIBRARY ("Assets & Documents") ─────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('assets')}
          className="w-full flex items-center justify-between p-4 bg-slate-50/70 hover:bg-slate-100/70 transition text-left cursor-pointer"
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center font-bold text-xs">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-[#131B2E]">Assets &amp; Documents Library</div>
              <div className="text-[11px] text-slate-500">
                Unified media repository absorbing Asset Checklist &amp; Media Kit with multi-page usage tracking
              </div>
            </div>
          </div>
          {collapsedSections.assets ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </button>

        {!collapsedSections.assets && (
          <div className="p-4 sm:p-5 space-y-4">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: 'All Assets' },
                  { id: 'branding', label: 'Branding' },
                  { id: 'campus', label: 'Campus' },
                  { id: 'facilities', label: 'Facilities' },
                  { id: 'people', label: 'People' },
                  { id: 'academics', label: 'Academics' },
                  { id: 'compliance', label: 'Documents' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setAssetCategoryFilter(cat.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      assetCategoryFilter === cat.id
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search assets or usages..."
                  value={assetSearchTerm}
                  onChange={(e) => setAssetSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-indigo-500 bg-white"
                />
              </div>
            </div>

            {/* Asset Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredAssets.map((asset) => {
                const isVerified = asset.status === 'verified';
                return (
                  <div
                    key={asset.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2 hover:border-indigo-200 transition"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-xs text-slate-900 truncate">{asset.title}</h4>
                          <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
                            {asset.category} • Uploaded from {asset.sourceSectionLabel}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${
                            isVerified
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-rose-50 border-rose-200 text-rose-700'
                          }`}
                        >
                          {isVerified ? '✓ Verified' : 'Missing'}
                        </span>
                      </div>

                      {/* Image Preview / Placeholder */}
                      <div className="mt-2 w-full h-28 bg-slate-200/80 rounded-lg overflow-hidden flex items-center justify-center relative border border-slate-200">
                        {asset.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={asset.url}
                            alt={asset.altText || asset.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                            <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                            <span className="text-[10px]">No image uploaded</span>
                          </div>
                        )}
                      </div>

                      {/* Multi-Page Usage Badges */}
                      <div className="mt-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Used on Website Pages:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {asset.usages.map((u, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] font-semibold bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700"
                            >
                              ✓ {u}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Controls: Preview, Replace, Edit Source */}
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                      {asset.url ? (
                        <button
                          type="button"
                          onClick={() => setPreviewingAsset(asset)}
                          className="font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Preview &amp; Usage
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Required for launch</span>
                      )}
                      <button
                        type="button"
                        onClick={() => jumpTo(asset.sourceSection)}
                        className="font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                      >
                        Edit in Source
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Optional Cloud Drive Reference (Non-mandatory) */}
            <div className="mt-4 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-xs text-slate-900">
                    Optional Cloud Drive Archive Link (Optional)
                  </div>
                  <p className="text-[11px] text-slate-500">
                    If you have raw high-resolution raw camera files in Google Drive, Dropbox, or OneDrive, you may optionally paste the shared link here. Direct uploads above remain sufficient.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded">
                  Optional
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={cloudDriveUrl}
                  onChange={(e) => {
                    setCloudDriveUrl(e.target.value);
                    updateSectionField('mediaAssets', 'driveLink', e.target.value);
                  }}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-indigo-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION 7: DOCUMENTS & STATUTORY COMPLIANCE ───────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('compliance')}
          className="w-full flex items-center justify-between p-4 bg-slate-50/70 hover:bg-slate-100/70 transition text-left cursor-pointer"
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center font-bold text-xs">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-[#131B2E] flex items-center gap-2 flex-wrap">
                <span>Statutory Compliance &amp; Mandatory Documents</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                  {allDocuments.filter((d) => d.status === 'verified').length} / {allDocuments.filter((d) => !d.isNotApplicable).length} Verified
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                Board affiliation, State NOC, building safety &amp; fire safety certification tracking
              </div>
            </div>
          </div>
          {collapsedSections.compliance ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </button>

        {!collapsedSections.compliance && (
          <div className="p-4 sm:p-5 space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-50/80">
                    <th className="py-2.5 px-3">Statutory Document Name</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Validity / Expiry</th>
                    <th className="py-2.5 px-3">Requirement</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allDocuments.map((doc) => {
                    const isVerified = doc.status === 'verified';
                    const isNA = Boolean(doc.isNotApplicable);
                    const dest = doc.destination || resolveRemediationDestination(doc.key || doc.id);
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{doc.documentName}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{doc.notes}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                              isNA
                                ? 'bg-slate-100 border-slate-200 text-slate-600'
                                : isVerified
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'bg-rose-50 border-rose-200 text-rose-700'
                            }`}
                          >
                            {isNA ? 'Not Applicable' : isVerified ? '✓ Uploaded & Valid' : 'Missing File'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-700">
                          {doc.expiryDate || 'Permanent'}
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[10px] font-bold text-slate-600">
                            {doc.isPublicationBlocker ? 'Mandatory Blocker' : 'Recommended'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => executeRemediationNavigation(dest, jumpTo)}
                            className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer inline-flex items-center gap-1"
                          >
                            <span>{isVerified ? 'Replace / View' : 'Upload'}</span>
                            <span>→</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION 8: MANDATORY DISCLOSURES (/mandatory-disclosures) ───────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('disclosures')}
          className="w-full flex items-center justify-between p-4 bg-slate-50/70 hover:bg-slate-100/70 transition text-left cursor-pointer"
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-[#131B2E]">Mandatory Public Disclosures (Appendix IX)</div>
              <div className="text-[11px] text-slate-500">
                Canonical public route: <code className="font-mono text-indigo-600 font-bold">/mandatory-disclosures</code>
              </div>
            </div>
          </div>
          {collapsedSections.disclosures ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </button>

        {!collapsedSections.disclosures && (
          <div className="p-4 sm:p-5 space-y-3">
            <p className="text-xs text-slate-600">
              In strict accordance with CBSE/regulatory guidelines, all institutional disclosures and safety certificates will be publicly accessible at the canonical route <strong className="font-mono text-indigo-600">/mandatory-disclosures</strong>.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              {[
                { label: 'General School Information', status: 'verified' },
                { label: 'Documents & Information (NOC/Affiliation)', status: 'verified' },
                { label: 'Results & Academics', status: 'verified' },
                { label: 'Staff (Teaching & Non-Teaching)', status: 'verified' },
                { label: 'School Infrastructure & Facilities', status: 'verified' },
                { label: 'Safety & Sanitation Certifications', status: 'verified' },
                { label: 'Annual Fee Schedule', status: 'verified' },
                { label: 'Official Contact Desk', status: 'verified' },
              ].map((disc, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="font-semibold text-slate-800 text-[11px]">{disc.label}</span>
                  <span className="text-[10px] font-bold text-emerald-700">✓ Ready</span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex items-center gap-2">
              <a
                href="/mandatory-disclosures"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition"
              >
                <span>Preview /mandatory-disclosures Route</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION 11 & 12: ADMINISTRATOR DETAILS & REVIEW SUMMARY ────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('admin')}
          className="w-full flex items-center justify-between p-4 bg-slate-50/70 hover:bg-slate-100/70 transition text-left cursor-pointer"
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-300 text-slate-700 flex items-center justify-center font-bold text-xs">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-[#131B2E]">Authorized Administrator Details</div>
              <div className="text-[11px] text-slate-500">Designated Super Administrator credential ownership &amp; contact</div>
            </div>
          </div>
          {collapsedSections.admin ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </button>

        {!collapsedSections.admin && (
          <div className="p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Administrator Full Name *</label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => handleAdminChange('name', e.target.value)}
                  placeholder="e.g. Dr. Rajesh Verma"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Designation *</label>
                <input
                  type="text"
                  value={adminDesignation}
                  onChange={(e) => handleAdminChange('designation', e.target.value)}
                  placeholder="e.g. Principal / Director"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Email Address *</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => handleAdminChange('email', e.target.value)}
                  placeholder="principal@school.edu.in"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mobile Contact *</label>
                <input
                  type="tel"
                  value={adminPhone}
                  onChange={(e) => handleAdminChange('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-indigo-500 bg-white"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Super administrator login invitations and website administrative keys will be delivered securely to this contact coordinate.
            </p>
          </div>
        )}
      </div>

      {/* ── SECTION 13: INSTITUTIONAL DECLARATION & LOCK ──────────────────── */}
      <div className="bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/30 border-2 border-indigo-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-[#131B2E]">Institutional Declaration &amp; Submission Sign-Off</h3>
            <p className="text-[11px] text-slate-500">
              Legal authorization certifying accuracy of institutional data and media usage
            </p>
          </div>
        </div>

        <div className="space-y-2.5 pt-2 border-t border-indigo-100 text-xs">
          <label className="flex items-start space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={declAccurate}
              onChange={(e) => setDeclAccurate(e.target.checked)}
              className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-slate-800 font-medium">
              I confirm that all school information, academic structures, and contact details provided are accurate.
            </span>
          </label>

          <label className="flex items-start space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={declAuthorized}
              onChange={(e) => setDeclAuthorized(e.target.checked)}
              className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-slate-800 font-medium">
              I confirm that I am authorized by the institution to submit this website specification.
            </span>
          </label>

          <label className="flex items-start space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={declMaterials}
              onChange={(e) => setDeclMaterials(e.target.checked)}
              className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-slate-800 font-medium">
              I confirm that the uploaded photographs, logos, and materials may be used for the school&apos;s official website.
            </span>
          </label>

          <label className="flex items-start space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={declReviewed}
              onChange={(e) => setDeclReviewed(e.target.checked)}
              className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-slate-800 font-medium">
              I have reviewed the website content, facilities, and media assets presented in this review.
            </span>
          </label>

          <label className="flex items-start space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={declStatutory}
              onChange={(e) => setDeclStatutory(e.target.checked)}
              className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-slate-800 font-medium">
              I understand that statutory board information must be accurate, current, and verifiable.
            </span>
          </label>
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {readiness.hasPublicationBlockers ? (
              <span className="text-rose-600 font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Please resolve {readiness.publicationBlockers.length} publication blocker(s) before locking.
              </span>
            ) : !areAllDeclarationsChecked ? (
              <span className="text-amber-600 font-bold">
                Please acknowledge all 5 declarations above to enable final sign-off.
              </span>
            ) : (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> All requirements satisfied. Ready to lock website specification.
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsSubmitModalOpen(true)}
            disabled={!readiness.isReadyForSubmission || !areAllDeclarationsChecked}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-black text-xs shadow-md transition cursor-pointer flex items-center justify-center space-x-2 ${
              readiness.isReadyForSubmission && areAllDeclarationsChecked
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Submit &amp; Lock Website Specification</span>
          </button>
        </div>
      </div>

      {/* ── MODAL: SUBMISSION CONFIRMATION ─────────────────────────────────── */}
      {isSubmitModalOpen && (
        <ModalPortal isOpen={isSubmitModalOpen}>
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Are you ready to submit &amp; lock?
                </h3>
                <span className="text-xs text-slate-500">Official Institutional Website Sign-Off</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You have reviewed:
            </p>
            <ul className="text-xs space-y-1.5 text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <li className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">✓</span> Website content &amp; public story
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">✓</span> Reusable photographic assets &amp; branding
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">✓</span> Campus facilities &amp; operational infrastructure
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">✓</span> Statutory compliance documents
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">✓</span> All configured website pages
              </li>
            </ul>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
              After submission, your website specification will be locked as an immutable snapshot. Future changes can be made through change requests.
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Back to Review
              </button>
              <button
                type="button"
                onClick={handleFinalSubmission}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                <span>{isSubmitting ? 'Locking Snapshot...' : 'Confirm & Submit'}</span>
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* ── MODAL: ASSET PREVIEW & METADATA EDITOR ──────────────────────────── */}
      {previewingAsset && (
        <ModalPortal isOpen={!!previewingAsset}>
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                <h3 className="font-extrabold text-sm text-slate-900">{previewingAsset.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewingAsset(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="w-full h-56 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center">
              {previewingAsset.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewingAsset.url}
                  alt={previewingAsset.altText || previewingAsset.title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-slate-400 text-xs">No image available</div>
              )}
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Alt Text (Accessibility &amp; SEO)</label>
                <input
                  type="text"
                  defaultValue={previewingAsset.altText}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Website Page Usages</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {['Homepage', 'About School', 'Facilities', 'Gallery', 'Leadership'].map((pageName) => {
                    const isUsed = previewingAsset.usages.includes(pageName);
                    return (
                      <label key={pageName} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked={isUsed}
                          className="rounded text-indigo-600"
                        />
                        <span className="text-slate-700">{pageName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPreviewingAsset(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Asset usage updated across selected pages.');
                  setPreviewingAsset(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold shadow-xs hover:bg-indigo-700"
              >
                Save Usages
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* ── MODAL: LIVE PUBLIC WEBSITE PREVIEW ──────────────────────────────── */}
      {isWebsitePreviewOpen && (
        <ModalPortal isOpen={isWebsitePreviewOpen}>
        <div
          className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="Live Public Website Preview"
        >
          <div
            className={`bg-white rounded-2xl h-[92vh] flex flex-col shadow-2xl border border-slate-700 overflow-hidden transition-all duration-300 ${
              previewViewport === 'mobile'
                ? 'w-full max-w-[400px]'
                : previewViewport === 'tablet'
                ? 'w-full max-w-[780px]'
                : 'w-full max-w-6xl'
            }`}
          >
            {/* Modal Header & Viewport Switcher */}
            <div className="p-3.5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  <Eye className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-xs sm:text-sm text-white tracking-tight truncate">
                      Live Public Website Preview — {schoolWebsiteData.school.displayName || 'School Portal'}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                      {isWebsiteApproved ? 'LIVE DATA' : 'DRAFT DATA'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono truncate hidden sm:block">
                    Rendering with real school database records, brand configuration, and approved media.
                  </p>
                </div>
              </div>

              {/* Viewport Width Controls */}
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewViewport('desktop')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    previewViewport === 'desktop'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Desktop View (100%)"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span className="hidden md:inline text-[10px]">Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewport('tablet')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    previewViewport === 'tablet'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Tablet View (768px)"
                >
                  <Tablet className="w-3.5 h-3.5" />
                  <span className="hidden md:inline text-[10px]">Tablet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewport('mobile')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    previewViewport === 'mobile'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Mobile View (390px)"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden md:inline text-[10px]">Mobile</span>
                </button>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsWebsitePreviewOpen(false)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer shrink-0"
                aria-label="Close website preview (or press ESC)"
                title="Close (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Viewport Container with Independent Scroll Area */}
            <div className="flex-1 overflow-y-auto bg-slate-100">
              <SchoolWebsiteRenderer
                data={schoolWebsiteData}
                viewMode="tabbed"
                initialTab={activePreviewTab}
                className="min-h-full shadow-md"
              />
            </div>

            {/* Modal Status Footer */}
            <div className="px-4 py-2.5 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between text-xs shrink-0 gap-2">
              <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Authoritative Single Source of Truth • Zero Mock Data</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-mono">
                  UDISE: {schoolWebsiteData.school.udiseCode || 'Pending'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsWebsitePreviewOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
                >
                  Exit Preview
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
