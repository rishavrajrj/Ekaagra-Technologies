'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type {
  SchoolProject,
  SchoolIntakeSubmission,
  SchoolIntakeChangeRequest,
  SchoolProjectCustomField,
  SchoolProjectCustomRequirement,
  SchoolApprovedSnapshot,
  SchoolOnboardingInvitation,
  UniversalIntakeData,
  FieldReviewStatus,
  MediaReviewStatus,
} from '@/lib/types';
import {
  evaluateSchoolReviewState,
  CANONICAL_REVIEWABLE_FIELDS,
  type OverallReviewEvaluation,
  type ReviewBlocker,
  type ReviewChecklistItem,
  type ActionRequiredItem,
} from '@/lib/schoolReviewEngine';
import {
  aggregateUniversalAssets,
  aggregateUniversalDocuments,
  aggregateUniversalFacilities,
  calculateUniversalReadiness,
  buildUniversalSubmissionZip,
} from '@/lib/universalVerificationEngine';
import {
  exportCompleteSchoolProjectZip,
  type ExportProgressStep,
} from '@/lib/schoolCompleteExportEngine';
import {
  updateFieldReviewStatusAction,
  updateMediaAssetReviewStatusAction,
  createFieldChangeRequestAction,
  createMediaChangeRequestAction,
  resolveChangeRequestAction,
  finalApproveSchoolProjectAction,
  triggerPlatformHandoffAction,
  sendSchoolChangeRequestsDigestAction,
  getFieldChangeRequestHistoryAction,
  updateAdminOverrideAction,
  updateRequirementReviewStatusAction,
  updatePageReviewStatusAction,
  createAdminReviewIssueAction,
  resolveAdminReviewIssueAction,
} from '@/app/schoolProjectActions';
import { lookupCanonicalField } from '@/lib/canonicalFieldRegistry';
import {
  buildCustomerRequirementInventory,
  buildPageByPageVerifications,
  buildContentComparisonMap,
  buildDocumentReviewInventory,
  buildMediaUsageInventory,
  buildDesignVerification,
  detectProjectIssues,
  calculateProjectReviewScorecard,
  generateDeveloperHandoffSpecification,
  type CustomerRequirementItem,
  type PageVerificationItem,
  type ContentDiffItem,
  type DocumentReviewItem,
  type MediaUsageItem,
  type DesignVerification,
  type ReviewIssueItem,
  type ProjectReviewScorecard,
  type DeveloperHandoffSpecification,
} from '@/lib/adminReviewEngine';
import { buildSchoolWebsiteDataFromIntake, type SchoolWebsiteData } from '@/lib/schoolWebsiteContract';

// Review Subviews
import ReviewScorecardBar from './school-review/ReviewScorecardBar';
import CustomerRequirementsView from './school-review/CustomerRequirementsView';
import WebsiteVerificationView from './school-review/WebsiteVerificationView';
import PageByPageVerificationView from './school-review/PageByPageVerificationView';
import ContentComparisonView from './school-review/ContentComparisonView';
import StructuredDataReviewView from './school-review/StructuredDataReviewView';
import DocumentReviewView from './school-review/DocumentReviewView';
import MediaUsageView from './school-review/MediaUsageView';
import DesignBrandingView from './school-review/DesignBrandingView';
import IssuesTrackerView from './school-review/IssuesTrackerView';
import DeveloperHandoffView from './school-review/DeveloperHandoffView';
import AdminOverrideModal from './school-review/AdminOverrideModal';
import FinalApprovalGateModal from './school-review/FinalApprovalGateModal';
import {
  School,
  ArrowLeft,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  XCircle,
  Building2,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Layers,
  Image as ImageIcon,
  MessageSquare,
  ShieldCheck,
  Send,
  Download,
  Share2,
  Lock,
  Unlock,
  Eye,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  X,
  FileText,
  BookOpen,
  GraduationCap,
  Users,
  DollarSign,
  Palette,
  Calendar,
  Compass,
  Loader2,
  List,
  Grid,
  FileCheck,
  CheckSquare,
  Square,
  Info,
  ShieldAlert,
} from 'lucide-react';
import ModalPortal from '@/components/ui/ModalPortal';
import { formatBytes } from '@/lib/imageUtils';
import {
  getDocumentReviewDefinition,
  calculateDocumentCompletenessSummary,
  calculateDerivedDocumentValidationStatus,
  STRUCTURED_REPLACEMENT_REASONS,
  evaluateFieldComparison,
  getDocumentChangeRequestHistory,
  validateDocumentStateInvariants,
  type ExpectedDocumentField,
} from '@/lib/canonicalDocumentReviewEngine';

interface SchoolProjectWorkspaceProps {
  project: SchoolProject;
  currentSubmission?: SchoolIntakeSubmission | null;
  changeRequests: SchoolIntakeChangeRequest[];
  customFields: SchoolProjectCustomField[];
  customRequirements: SchoolProjectCustomRequirement[];
  approvedSnapshot?: SchoolApprovedSnapshot | null;
  invitation?: SchoolOnboardingInvitation | null;
}

export default function SchoolProjectWorkspace({
  project: initialProject,
  currentSubmission,
  changeRequests: initialChangeRequests,
  customFields,
  customRequirements,
  approvedSnapshot,
  invitation,
}: SchoolProjectWorkspaceProps) {
  const router = useRouter();
  const [project, setProject] = useState<SchoolProject>(initialProject);
  const [changeRequests, setChangeRequests] = useState<SchoolIntakeChangeRequest[]>(initialChangeRequests);
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'requirements'
    | 'website-verification'
    | 'pages'
    | 'content-comparison'
    | 'structured-data'
    | 'documents'
    | 'media'
    | 'branding'
    | 'issues'
    | 'developer-handoff'
    | 'intake'
    | 'reviews'
    | 'provisioning'
  >(currentSubmission ? 'requirements' : 'overview');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{
    text: string;
    type: 'success' | 'error';
    whatsappUrl?: string;
  } | null>(null);

  // Section Filter for Intake tab
  const [intakeSectionFilter, setIntakeSectionFilter] = useState<string>('all');
  // Media Category Filter
  const [mediaCategoryFilter, setMediaCategoryFilter] = useState<string>('all');

  const checkIsDocument = (asset: {
    isDocument?: boolean;
    fileType?: string;
    category?: string;
    fileName?: string;
    url?: string;
    title?: string;
  } | null | undefined): boolean => {
    if (!asset) return false;
    return Boolean(
      asset.isDocument ||
      asset.fileType === 'application/pdf' ||
      asset.fileType?.includes('pdf') ||
      asset.category === 'compliance' ||
      asset.category === 'documents' ||
      asset.fileName?.toLowerCase().endsWith('.pdf') ||
      asset.url?.toLowerCase().endsWith('.pdf') ||
      asset.url?.toLowerCase().includes('.pdf')
    );
  };
  // Change Request Status Filter
  const [crStatusFilter, setCrStatusFilter] = useState<'all' | 'waiting_for_school' | 'ready_for_review' | 'resolved'>('all');

  // Modals state
  const [showRawJsonModal, setShowRawJsonModal] = useState(false);
  const [fieldCRModal, setFieldCRModal] = useState<{
    sectionKey: string;
    fieldKey: string;
    fieldLabel: string;
    pageTitle: string;
    sectionTitle: string;
    currentValue: string;
    existingCR?: SchoolIntakeChangeRequest;
  } | null>(null);
  const [fieldCRReason, setFieldCRReason] = useState('Incomplete or inaccurate information');
  const [fieldCRComment, setFieldCRComment] = useState('');
  const [fieldCRSuggested, setFieldCRSuggested] = useState('');

  // Field Revision History Modal
  const [historyModal, setHistoryModal] = useState<{
    fieldKey: string;
    fieldLabel: string;
  } | null>(null);
  const [historyData, setHistoryData] = useState<{
    changeRequests: any[];
    auditEvents: any[];
  } | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [mediaCRModal, setMediaCRModal] = useState<{
    assetId: string;
    assetTitle: string;
    currentUrl?: string;
  } | null>(null);
  const [mediaCRReason, setMediaCRReason] = useState('Low resolution or poor aspect ratio');
  const [mediaCRComment, setMediaCRComment] = useState('');

  const [previewingAsset, setPreviewingAsset] = useState<any | null>(null);
  const [finalApprovalNotes, setFinalApprovalNotes] = useState('');
  const [mediaViewMode, setMediaViewMode] = useState<'table' | 'grid'>('table');
  const [checkedVerificationItems, setCheckedVerificationItems] = useState<Record<string, boolean>>({});

  // Real-time authoritative review engine evaluation
  const reviewEval: OverallReviewEvaluation = useMemo(() => {
    return evaluateSchoolReviewState(project, currentSubmission ?? null, changeRequests);
  }, [project, currentSubmission, changeRequests]);

  const intakePayload: UniversalIntakeData = (currentSubmission?.intake_payload as UniversalIntakeData) || ({} as any);

  // Normalized Website Data
  const websiteData: SchoolWebsiteData = useMemo(() => {
    return buildSchoolWebsiteDataFromIntake(intakePayload);
  }, [intakePayload]);

  // Admin Review Engine Datasets
  const customerRequirements = useMemo(() => {
    return buildCustomerRequirementInventory(intakePayload, websiteData, project);
  }, [intakePayload, websiteData, project]);

  const pageVerifications = useMemo(() => {
    return buildPageByPageVerifications(intakePayload, websiteData, project);
  }, [intakePayload, websiteData, project]);

  const contentComparisons = useMemo(() => {
    return buildContentComparisonMap(intakePayload, websiteData);
  }, [intakePayload, websiteData]);

  const documentReviews = useMemo(() => {
    return buildDocumentReviewInventory(intakePayload, project);
  }, [intakePayload, project]);

  const mediaUsageReviews = useMemo(() => {
    return buildMediaUsageInventory(intakePayload, websiteData, project);
  }, [intakePayload, websiteData, project]);

  const designVerification = useMemo(() => {
    return buildDesignVerification(intakePayload, websiteData);
  }, [intakePayload, websiteData]);

  const detectedIssues = useMemo(() => {
    return detectProjectIssues(intakePayload, websiteData, project, changeRequests);
  }, [intakePayload, websiteData, project, changeRequests]);

  const scorecard = useMemo(() => {
    return calculateProjectReviewScorecard(
      intakePayload,
      websiteData,
      project,
      changeRequests
    );
  }, [intakePayload, websiteData, project, changeRequests]);

  const handoffSpec = useMemo(() => {
    return generateDeveloperHandoffSpecification(intakePayload, websiteData, project, changeRequests);
  }, [intakePayload, websiteData, project, changeRequests]);

  // Review Modals State
  const [adminOverrideModal, setAdminOverrideModal] = useState<{
    isOpen: boolean;
    fieldKey: string;
    fieldLabel: string;
    originalValue: any;
    currentValue: any;
  }>({
    isOpen: false,
    fieldKey: '',
    fieldLabel: '',
    originalValue: null,
    currentValue: null,
  });

  const [isApprovalGateOpen, setIsApprovalGateOpen] = useState(false);

  const handleOpenOverride = (fieldKey: string, fieldLabel: string, currentValue: any) => {
    const originalVal = (intakePayload as any)[fieldKey] ?? currentValue;
    const adminOverrides = (project.metadata?.adminOverrides as Record<string, any>) || {};
    setAdminOverrideModal({
      isOpen: true,
      fieldKey,
      fieldLabel,
      originalValue: originalVal,
      currentValue: adminOverrides[fieldKey]?.adminValue ?? adminOverrides[fieldKey]?.overriddenValue ?? currentValue,
    });
  };

  const handleSaveAdminOverride = async (fieldKey: string, newValue: any, reason: string) => {
    setIsActionLoading(true);
    setActionMessage(null);
    const originalVal = (intakePayload as any)[fieldKey] ?? null;
    const sectionKey = fieldKey.split('.')[0] || 'general';
    const res = await updateAdminOverrideAction(project.id, fieldKey, sectionKey, originalVal, newValue, reason);
    if (res.success) {
      setProject((prev) => {
        const meta = (prev.metadata as Record<string, any>) || {};
        const adminOverrides: Record<string, any> = { ...(meta.adminOverrides || {}) };
        adminOverrides[fieldKey] = {
          fieldKey,
          sectionKey,
          originalValue: originalVal,
          adminValue: newValue,
          notes: reason,
          updatedAt: new Date().toISOString(),
          updatedBy: 'Ekaagra Reviewer',
        };
        return { ...prev, metadata: { ...meta, adminOverrides } };
      });
      setActionMessage({ text: `Override applied for ${fieldKey}!`, type: 'success' });
    } else {
      setActionMessage({ text: res.error || 'Failed to save admin override', type: 'error' });
    }
    setIsActionLoading(false);
  };

  const handleApproveRequirement = async (requirementKey: string) => {
    setIsActionLoading(true);
    setActionMessage(null);
    const res = await updateRequirementReviewStatusAction(project.id, requirementKey, 'approved', 'Approved by admin');
    if (res.success) {
      setProject((prev) => {
        const meta = (prev.metadata as Record<string, any>) || {};
        const requirementReviews: Record<string, any> = { ...(meta.requirementReviews || {}) };
        requirementReviews[requirementKey] = {
          requirementKey,
          status: 'approved',
          notes: 'Approved by admin',
          updatedAt: new Date().toISOString(),
          updatedBy: 'Ekaagra Reviewer',
        };
        return { ...prev, metadata: { ...meta, requirementReviews } };
      });
      setActionMessage({ text: `Requirement verified!`, type: 'success' });
    } else {
      setActionMessage({ text: res.error || 'Failed to approve requirement', type: 'error' });
    }
    setIsActionLoading(false);
  };

  const handleApprovePage = async (pageKey: string) => {
    setIsActionLoading(true);
    setActionMessage(null);
    const res = await updatePageReviewStatusAction(project.id, pageKey, 'approved', 'Approved page layout and content');
    if (res.success) {
      setProject((prev) => {
        const meta = (prev.metadata as Record<string, any>) || {};
        const pageReviews: Record<string, any> = { ...(meta.pageReviews || {}) };
        pageReviews[pageKey] = {
          pageKey,
          status: 'approved',
          notes: 'Approved page layout and content',
          updatedAt: new Date().toISOString(),
          updatedBy: 'Ekaagra Reviewer',
        };
        return { ...prev, metadata: { ...meta, pageReviews } };
      });
      setActionMessage({ text: `Page ${pageKey} layout and content approved!`, type: 'success' });
    } else {
      setActionMessage({ text: res.error || 'Failed to approve page', type: 'error' });
    }
    setIsActionLoading(false);
  };

  const handleLogIssue = async (issueData: {
    title: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    section: string;
    sectionKey: string;
    requirementTitle?: string;
    expectedValue?: string;
    actualValue?: string;
    explanation: string;
    relatedPage?: string;
    relatedField?: string;
    adminNotes?: string;
  }) => {
    setIsActionLoading(true);
    setActionMessage(null);
    const res = await createAdminReviewIssueAction(project.id, issueData);
    if (res.success && res.issue) {
      setProject((prev) => {
        const meta = prev.metadata || {};
        const reviewIssues = Array.isArray(meta.reviewIssues) ? [...meta.reviewIssues, res.issue!] : [res.issue!];
        return { ...prev, metadata: { ...meta, reviewIssues } };
      });
      setActionMessage({ text: 'Review issue logged successfully!', type: 'success' });
    } else {
      setActionMessage({ text: res.error || 'Failed to log review issue', type: 'error' });
    }
    setIsActionLoading(false);
  };

  const handleResolveIssue = async (issueId: string) => {
    setIsActionLoading(true);
    setActionMessage(null);
    const res = await resolveAdminReviewIssueAction(project.id, issueId, 'Resolved by admin');
    if (res.success) {
      setProject((prev) => {
        const meta = prev.metadata || {};
        const reviewIssues = (Array.isArray(meta.reviewIssues) ? meta.reviewIssues : []).map((iss: any) =>
          iss.id === issueId
            ? { ...iss, status: 'RESOLVED', resolvedAt: new Date().toISOString(), resolvedBy: 'Ekaagra Reviewer' }
            : iss
        );
        return { ...prev, metadata: { ...meta, reviewIssues } };
      });
      setActionMessage({ text: 'Review issue marked resolved!', type: 'success' });
    } else {
      setActionMessage({ text: res.error || 'Failed to resolve issue', type: 'error' });
    }
    setIsActionLoading(false);
  };

  // Document Completeness & KPI Aggregator
  const documentCompleteness = useMemo(() => {
    const docs = reviewEval.aggregatedAssets
      .filter((a) => checkIsDocument(a))
      .map((a) => {
        const reviewItem = project.metadata?.mediaReviews?.[a.id];
        const activeCR = changeRequests.find(
          (cr) =>
            cr.asset_id === a.id &&
            (cr.status === 'open' || cr.status === 'waiting_for_school' || cr.status === 'ready_for_review')
        );
        let status = 'pending';
        if (activeCR) status = 'rejected';
        else if (reviewItem?.status === 'approved') status = 'approved';
        else if (reviewItem?.status === 'changes_requested') status = 'rejected';

        return {
          required: a.required || a.isPublicationBlocker,
          isPublicationBlocker: a.isPublicationBlocker,
          status,
          fileUrl: a.url,
          fileName: a.fileName,
        };
      });
    return calculateDocumentCompletenessSummary(docs);
  }, [reviewEval.aggregatedAssets, project.metadata?.mediaReviews, changeRequests]);

  // Document review definition and comparisons for currently inspected asset
  const activeDocDefinition = useMemo(() => {
    if (!previewingAsset || !checkIsDocument(previewingAsset)) return null;
    return (
      getDocumentReviewDefinition(previewingAsset.id) || {
        canonicalId: previewingAsset.id,
        checklistId: previewingAsset.id,
        title: previewingAsset.title,
        category: 'STATUTORY',
        description: previewingAsset.caption || 'Institutional compliance & statutory document',
        sourcePage: previewingAsset.sourceSectionLabel || 'General Information',
        governingAuthority: 'Competent Regulatory / Statutory Authority',
        expectedFields: (): ExpectedDocumentField[] => [
          {
            fieldId: 'school_name',
            label: 'Institution Name',
            enteredValue: intakePayload.schoolProfile?.schoolName || (intakePayload as any).generalInfo?.schoolName,
            extractedValue: undefined,
            comparisonStatus: evaluateFieldComparison(intakePayload.schoolProfile?.schoolName || (intakePayload as any).generalInfo?.schoolName, undefined),
            notes: 'Must correspond to registered school campus.',
          },
        ],
        verificationChecklist: [
          {
            id: 'gen-authenticity',
            label: 'Original / Certified True Copy Issued by Competent Authority',
            hint: 'Verify authorized issuing officer and official departmental stamp.',
            category: 'authenticity' as const,
            required: true,
          },
          {
            id: 'gen-legibility',
            label: 'Clean, Legible Document Without Obscured Clauses',
            hint: 'Text, seals, and dates must be easily readable.',
            category: 'legibility' as const,
            required: true,
          },
          {
            id: 'gen-publication',
            label: 'Approved for Inclusion in Public Institutional Disclosures',
            hint: 'Meets public regulatory disclosure compliance standard.',
            category: 'publication' as const,
            required: true,
          },
        ],
      }
    );
  }, [previewingAsset, intakePayload]);

  const activeComparisonFields = useMemo(() => {
    if (!activeDocDefinition) return [];
    return activeDocDefinition.expectedFields(intakePayload);
  }, [activeDocDefinition, intakePayload]);

  const activeDerivedStatus = useMemo(() => {
    if (!previewingAsset || !checkIsDocument(previewingAsset)) return 'VALID';
    return calculateDerivedDocumentValidationStatus(
      previewingAsset.url,
      previewingAsset.fileName,
      activeComparisonFields,
      (previewingAsset as any).expiryDate
    );
  }, [previewingAsset, activeComparisonFields]);

  const activeDocCRHistory = useMemo(() => {
    if (!previewingAsset) return [];
    return getDocumentChangeRequestHistory(previewingAsset.id, changeRequests);
  }, [previewingAsset, changeRequests]);

  const onboardingUrl = invitation?.invitation_code
    ? `/school-onboarding/${invitation.invitation_code}`
    : `/school-onboarding?project=${project.project_number}`;

  const copyOnboardingLink = () => {
    const full = typeof window !== 'undefined' ? `${window.location.origin}${onboardingUrl}` : onboardingUrl;
    navigator.clipboard.writeText(full);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const [isExportingZip, setIsExportingZip] = useState(false);
  const [exportProgressText, setExportProgressText] = useState<string>('');

  const handleExportTechnicalZip = async () => {
    if (isExportingZip) return;
    if (!currentSubmission && !project) return;
    setIsExportingZip(true);
    setExportProgressText('Preparing submission...');
    setActionMessage(null);
    try {
      const result = await exportCompleteSchoolProjectZip({
        project,
        submission: currentSubmission,
        intakePayload,
        onProgress: (step: ExportProgressStep) => {
          setExportProgressText(step);
        },
      });

      const url = URL.createObjectURL(result.zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${result.folderName}-Complete-Technical-Export.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const stats = result.statistics;
      setActionMessage({
        text: `Complete technical package exported successfully. ${stats.formFields} form records • ${stats.images} media assets • ${stats.documents} documents • ${stats.websitePages} website pages`,
        type: 'success',
      });
    } catch (err: any) {
      console.error('Failed to export complete technical ZIP:', err);
      setActionMessage({
        text: err?.message ? `Export failed: ${err.message}` : 'Failed to generate complete technical ZIP archive.',
        type: 'error',
      });
    } finally {
      setIsExportingZip(false);
      setExportProgressText('');
    }
  };

  // ─── ACTION HANDLERS ────────────────────────────────────────────────────────

  const handleApproveField = async (fieldKey: string, sectionKey: string) => {
    setIsActionLoading(true);
    setActionMessage(null);

    const fieldDef = lookupCanonicalField(fieldKey, sectionKey);
    const activeCR = changeRequests.find((cr) => {
      const crDef = lookupCanonicalField(cr.field_key || '', cr.page_key || cr.section_key);
      return (
        (crDef.canonicalKey === fieldDef.canonicalKey ||
          cr.field_key === fieldKey ||
          cr.field_key === fieldDef.fieldKey ||
          (cr.section_key === sectionKey && cr.field_key === fieldKey.split('.').pop())) &&
        (cr.status === 'open' ||
          cr.status === 'waiting_for_school' ||
          cr.status === 'ready_for_review' ||
          cr.status === 'school_updated' ||
          cr.status === 'pending' ||
          cr.status === 'changes_requested' ||
          cr.status === 'needs_revision')
      );
    });

    if (activeCR) {
      await resolveChangeRequestAction(activeCR.id, 'Approved by administrator');
      setChangeRequests((prev) =>
        prev.map((r) => (r.id === activeCR.id ? { ...r, status: 'resolved' } : r))
      );
    }

    const res = await updateFieldReviewStatusAction(project.id, sectionKey, fieldKey, 'verified', 'Approved by administrator');
    if (res.success) {
      setProject((prev) => {
        const meta = prev.metadata || {};
        const fieldReviews = { ...(meta.fieldReviews || {}) };
        fieldReviews[fieldKey] = {
          sectionKey,
          fieldKey,
          status: 'verified',
          notes: 'Approved by administrator',
          updatedAt: new Date().toISOString(),
          updatedBy: 'Ekaagra Reviewer',
        };
        return { ...prev, metadata: { ...meta, fieldReviews } };
      });
      setActionMessage({ text: `Field "${fieldDef.fieldLabel || fieldKey}" verified successfully!`, type: 'success' });
    } else {
      setActionMessage({ text: res.error || 'Failed to verify field', type: 'error' });
    }
    setIsActionLoading(false);
  };

  const handleOpenHistory = async (fieldKey: string, fieldLabel: string) => {
    setHistoryModal({ fieldKey, fieldLabel });
    setIsLoadingHistory(true);
    setHistoryData(null);
    const res = await getFieldChangeRequestHistoryAction(project.id, fieldKey);
    if (res.success) {
      setHistoryData({
        changeRequests: res.changeRequests || [],
        auditEvents: res.auditEvents || [],
      });
    } else {
      setActionMessage({ text: res.error || 'Failed to load revision history', type: 'error' });
    }
    setIsLoadingHistory(false);
  };

  const handleDispatchBatchNotification = async () => {
    setIsActionLoading(true);
    setActionMessage(null);
    const res = await sendSchoolChangeRequestsDigestAction(project.id);
    if (res.success) {
      const emailDetail = res.emailSent
        ? `Consolidated email sent to ${res.contactEmail || 'customer'} (${res.count} items).`
        : `Consolidated notification recorded for ${res.count} item(s).`;
      setActionMessage({
        text: `${emailDetail} WhatsApp digest ready.`,
        type: 'success',
        whatsappUrl: res.whatsappUrl || undefined,
      });
    } else {
      setActionMessage({
        text: res.error || 'Failed to send change requests digest',
        type: 'error',
      });
    }
    setIsActionLoading(false);
  };

  const handleSubmitFieldCR = async (e: React.FormEvent, sendImmediately: boolean = false) => {
    e.preventDefault();
    if (!fieldCRModal || !fieldCRComment.trim()) return;
    setIsActionLoading(true);
    setActionMessage(null);
    const res = await createFieldChangeRequestAction({
      projectId: project.id,
      sectionKey: fieldCRModal.sectionKey,
      fieldKey: fieldCRModal.fieldKey,
      currentValue: fieldCRModal.currentValue,
      reason: fieldCRReason,
      suggestedValue: fieldCRSuggested.trim() || undefined,
      reviewerMessage: fieldCRComment.trim(),
      sendImmediately,
    });
    if (res.success && res.changeRequest) {
      setChangeRequests((prev) => {
        const existingIdx = prev.findIndex((cr) => cr.id === res.changeRequest?.id);
        if (existingIdx !== -1) {
          const copy = [...prev];
          copy[existingIdx] = res.changeRequest as SchoolIntakeChangeRequest;
          return copy;
        }
        return [res.changeRequest as SchoolIntakeChangeRequest, ...prev];
      });
      setProject((prev) => {
        const meta = prev.metadata || {};
        const fieldReviews = { ...(meta.fieldReviews || {}) };
        fieldReviews[fieldCRModal.fieldKey] = {
          sectionKey: fieldCRModal.sectionKey,
          fieldKey: fieldCRModal.fieldKey,
          status: 'changes_requested',
          notes: fieldCRComment.trim(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Ekaagra Reviewer',
        };
        return { ...prev, status: 'changes_requested', metadata: { ...meta, fieldReviews } };
      });
      const notifDetail = res.emailSent
        ? ` (Consolidated email sent to ${res.contactEmail || 'customer'})`
        : sendImmediately
        ? ''
        : ' (Saved to review pass. You can add more changes and send all in 1 consolidated email)';
      setActionMessage({
        text: `Change request recorded${notifDetail}.`,
        type: 'success',
        whatsappUrl: res.whatsappUrl || undefined,
      });
      setFieldCRModal(null);
      setFieldCRComment('');
      setFieldCRSuggested('');
    } else {
      setActionMessage({ text: res.error || 'Failed to submit change request', type: 'error' });
    }
    setIsActionLoading(false);
  };

  const handleApproveMediaAsset = async (assetId: string) => {
    setIsActionLoading(true);
    setActionMessage(null);
    const res = await updateMediaAssetReviewStatusAction(project.id, assetId, 'approved', 'Approved for website publication');
    if (res.success) {
      setProject((prev) => {
        const meta = prev.metadata || {};
        const mediaReviews = { ...(meta.mediaReviews || {}) };
        mediaReviews[assetId] = {
          assetId,
          status: 'approved',
          notes: 'Approved for website publication',
          updatedAt: new Date().toISOString(),
          updatedBy: 'Ekaagra Reviewer',
        };
        return { ...prev, metadata: { ...meta, mediaReviews } };
      });
      setActionMessage({ text: 'Media asset approved for website use!', type: 'success' });
    } else {
      setActionMessage({ text: res.error || 'Failed to approve media asset', type: 'error' });
    }
    setIsActionLoading(false);
  };

  const handleSubmitMediaCR = async (e: React.FormEvent, sendImmediately: boolean = false) => {
    e.preventDefault();
    if (!mediaCRModal || !mediaCRComment.trim()) return;
    setIsActionLoading(true);
    setActionMessage(null);
    const res = await createMediaChangeRequestAction({
      projectId: project.id,
      assetId: mediaCRModal.assetId,
      assetTitle: mediaCRModal.assetTitle,
      reason: mediaCRReason,
      reviewerMessage: mediaCRComment.trim(),
      sendImmediately,
    });
    if (res.success && res.changeRequest) {
      setChangeRequests((prev) => [res.changeRequest as SchoolIntakeChangeRequest, ...prev]);
      setProject((prev) => {
        const meta = prev.metadata || {};
        const mediaReviews = { ...(meta.mediaReviews || {}) };
        mediaReviews[mediaCRModal.assetId] = {
          assetId: mediaCRModal.assetId,
          status: 'changes_requested',
          notes: mediaCRComment.trim(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Ekaagra Reviewer',
        };
        return { ...prev, status: 'changes_requested', media_status: 'changes_requested', metadata: { ...meta, mediaReviews } };
      });
      const notifDetail = res.emailSent
        ? ` (Consolidated email sent to ${res.contactEmail || 'customer'})`
        : sendImmediately
        ? ''
        : ' (Saved to review pass. You can add more changes and send all in 1 consolidated email)';
      setActionMessage({
        text: `Media replacement request recorded${notifDetail}.`,
        type: 'success',
        whatsappUrl: res.whatsappUrl || undefined,
      });
      setMediaCRModal(null);
      setMediaCRComment('');
    } else {
      setActionMessage({ text: res.error || 'Failed to request media replacement', type: 'error' });
    }
    setIsActionLoading(false);
  };

  const handleResolveChangeRequest = async (cr: SchoolIntakeChangeRequest, approved: boolean) => {
    setIsActionLoading(true);
    setActionMessage(null);
    const res = await resolveChangeRequestAction(
      project.id,
      cr.id,
      approved ? 'Correction verified and approved by reviewer' : 'Correction rejected by reviewer'
    );
    if (res.success) {
      setChangeRequests((prev) =>
        prev.map((item) =>
          item.id === cr.id
            ? {
                ...item,
                status: approved ? 'resolved' : 'waiting_for_school',
                resolved_at: approved ? new Date().toISOString() : null,
                resolved_by: approved ? 'Ekaagra Reviewer' : null,
              }
            : item
        )
      );
      setProject((prev) => {
        const meta = prev.metadata || {};
        if (cr.asset_id) {
          const mediaReviews = { ...(meta.mediaReviews || {}) };
          mediaReviews[cr.asset_id] = {
            assetId: cr.asset_id,
            status: approved ? 'approved' : 'changes_requested',
            notes: approved ? 'Resolved and approved' : 'Correction rejected',
            updatedAt: new Date().toISOString(),
            updatedBy: 'Ekaagra Reviewer',
          };
          return { ...prev, metadata: { ...meta, mediaReviews } };
        } else if (cr.field_key) {
          const fieldReviews = { ...(meta.fieldReviews || {}) };
          fieldReviews[cr.field_key] = {
            sectionKey: cr.section_key,
            fieldKey: cr.field_key,
            status: approved ? 'verified' : 'changes_requested',
            notes: approved ? 'Resolved and approved' : 'Correction rejected',
            updatedAt: new Date().toISOString(),
            updatedBy: 'Ekaagra Reviewer',
          };
          return { ...prev, metadata: { ...meta, fieldReviews } };
        }
        return prev;
      });
      setActionMessage({
        text: approved ? 'Change request resolved and item verified!' : 'Change request sent back for revision.',
        type: 'success',
      });
    } else {
      setActionMessage({ text: res.error || 'Failed to resolve change request', type: 'error' });
    }
    setIsActionLoading(false);
  };

  const handleFinalApprove = async (customNotes?: string) => {
    setIsActionLoading(true);
    setActionMessage(null);
    const notesToSave = customNotes || finalApprovalNotes.trim() || undefined;
    const res = await finalApproveSchoolProjectAction(project.id, notesToSave);
    if (res.success) {
      setProject((prev) => ({
        ...prev,
        status: 'approved',
        metadata: {
          ...(prev.metadata || {}),
          finalApproval: {
            approvedAt: new Date().toISOString(),
            approvedBy: 'Ekaagra Reviewer',
            notes: notesToSave,
          },
        },
      }));
      setActionMessage({ text: 'Project verified and locked for technical website build!', type: 'success' });
      setActiveTab('developer-handoff');
    } else {
      setActionMessage({ text: res.error || 'Final approval failed', type: 'error' });
    }
    setIsActionLoading(false);
  };

  const handleTriggerHandoff = async () => {
    setIsActionLoading(true);
    setActionMessage(null);
    const res = await triggerPlatformHandoffAction(project.id);
    if (res.success) {
      setProject((prev) => ({ ...prev, status: 'handed_off' }));
      setActionMessage({ text: 'Platform provisioning handoff executed successfully!', type: 'success' });
    } else {
      setActionMessage({ text: res.error || 'Provisioning failed', type: 'error' });
    }
    setIsActionLoading(false);
  };

  const formatFieldValue = (val: any): string => {
    if (val === null || val === undefined || val === '') return '— Not provided —';
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (Array.isArray(val)) {
      if (val.length === 0) return '— None specified —';
      if (typeof val[0] === 'object') return `${val.length} item(s)`;
      return val.join(', ');
    }
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  const canonicalFieldsBySection = useMemo(() => {
    const map: Record<string, typeof CANONICAL_REVIEWABLE_FIELDS> = {};
    CANONICAL_REVIEWABLE_FIELDS.forEach((f) => {
      if (!map[f.sectionKey]) map[f.sectionKey] = [];
      map[f.sectionKey].push(f);
    });
    return map;
  }, []);

  return (
    <div className="eka-content-container space-y-6 min-w-0 pb-16">
      {/* ─── TOP HEADER & BREADCRUMB ────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Link
            href="/admin/school-projects"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to School Hub</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800">
              <School className="w-3 h-3" />
              <span>School Project Workspace</span>
            </span>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--admin-surface-secondary)] text-[var(--admin-text-sub)] border border-[var(--admin-border)]">
              {project.project_number}
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--admin-text-main)] tracking-tight">
              {project.school_name}
            </h1>
            <p className="text-xs text-[var(--admin-text-sub)] mt-1 flex items-center gap-2 flex-wrap">
              {project.city && <span>{project.city}, {project.state || ''} &bull;</span>}
              <span>Contact: {project.primary_contact_name} ({project.primary_contact_email})</span>
              <span>&bull;</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold uppercase">{project.product_id}</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={copyOnboardingLink}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[var(--admin-card)] text-[var(--admin-text-main)] hover:bg-[var(--admin-surface-hover)] text-xs font-bold rounded-xl border border-[var(--admin-card-border)] transition-colors shadow-2xs cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied' : 'Copy Onboarding Link'}</span>
            </button>

            <Link
              href={onboardingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[var(--admin-surface-secondary)] hover:bg-[var(--admin-surface-hover)] text-[var(--admin-text-main)] text-xs font-bold rounded-xl border border-[var(--admin-border)] shadow-2xs transition-colors"
            >
              <span>Open Onboarding</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            {currentSubmission && (
              <button
                type="button"
                onClick={handleExportTechnicalZip}
                disabled={isExportingZip}
                title="Complete School Project Package / Technical Export: All submission data, website configuration, documents, and media assets"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-950/60 text-purple-900 dark:text-purple-200 text-xs font-bold rounded-xl border border-purple-200 dark:border-purple-800 transition-colors shadow-2xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isExportingZip ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-600" /> : <Download className="w-3.5 h-3.5 text-purple-600" />}
                <span>{isExportingZip ? (exportProgressText || 'Packaging...') : 'Export Technical ZIP'}</span>
              </button>
            )}

            {/* Dynamic Primary Workflow Action */}
            {reviewEval.websiteReadiness === 'BLOCKED' ? (
              <button
                type="button"
                onClick={() => {
                  if (reviewEval.nextActionItem) {
                    setActiveTab(reviewEval.nextActionItem.targetTab);
                  } else {
                    setActiveTab('overview');
                  }
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                <span>Review Incomplete ({reviewEval.blockers.length} Blockers)</span>
              </button>
            ) : project.status === 'handed_off' ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-600 text-white text-xs font-bold rounded-xl shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Platform Provisioned</span>
              </span>
            ) : project.status === 'approved' || project.status === 'handoff_ready' ? (
              <button
                type="button"
                onClick={handleTriggerHandoff}
                disabled={isActionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Execute Platform Provisioning</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleFinalApprove()}
                disabled={isActionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve &amp; Lock for Website Build</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── ACTION NOTIFICATION ────────────────────────────────────────────── */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex flex-wrap items-center justify-between gap-3 border ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <span>{actionMessage.text}</span>
          </div>
          <div className="flex items-center gap-2">
            {actionMessage.whatsappUrl && (
              <a
                href={actionMessage.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Send WhatsApp Alert</span>
              </a>
            )}
            <button
              type="button"
              onClick={() => setActionMessage(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 text-sm leading-none"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* ─── CONSOLIDATED REVIEW PASS BATCH DISPATCH BAR ────────────────────── */}
      {(() => {
        const pendingCRs = changeRequests.filter(
          (cr) => cr.status === 'open' || cr.status === 'waiting_for_school'
        );
        if (pendingCRs.length === 0) return null;

        return (
          <div className="rounded-2xl p-4 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 border border-amber-300 dark:border-amber-700/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs shrink-0 mt-0.5">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-sm text-[var(--admin-text-main)]">
                    Review Pass: {pendingCRs.length} Change Request{pendingCRs.length > 1 ? 's' : ''} Awaiting School Action
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 dark:bg-amber-950 dark:text-amber-200">
                    Batch Consolidation Active
                  </span>
                </div>
                <p className="text-xs text-[var(--admin-text-sub)] mt-0.5">
                  Requested changes are visually highlighted on the customer&apos;s onboarding form. You can consolidate all {pendingCRs.length} item{pendingCRs.length > 1 ? 's' : ''} into a single email digest so the customer is not spammed.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDispatchBatchNotification}
                disabled={isActionLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send All in 1 Email ({pendingCRs.length})</span>
              </button>
            </div>
          </div>
        );
      })()}

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Submission */}
        <div className="bg-[var(--admin-card)] p-4 rounded-2xl border border-[var(--admin-card-border)] shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[var(--admin-text-muted)] uppercase tracking-wider">Submission</span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--admin-surface-secondary)] text-[var(--admin-text-sub)] border border-[var(--admin-border)]">
              v{currentSubmission?.version_number ?? 1}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-black text-[var(--admin-text-main)] uppercase tracking-tight">
              {reviewEval.submissionStatus}
            </span>
            <span className="font-mono text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
              {reviewEval.submissionCompleteness}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-[var(--admin-surface-secondary)] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                reviewEval.submissionCompleteness >= 100 ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, reviewEval.submissionCompleteness)}%` }}
            />
          </div>
        </div>

        {/* Card 2: Content Review */}
        <div className="bg-[var(--admin-card)] p-4 rounded-2xl border border-[var(--admin-card-border)] shadow-2xs space-y-1.5">
          <span className="text-[10px] font-bold text-[var(--admin-text-muted)] uppercase tracking-wider block">Content Review</span>
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
                reviewEval.contentReviewStatus === 'approved'
                  ? 'admin-badge-success'
                  : reviewEval.contentReviewStatus === 'changes_requested'
                  ? 'admin-badge-error'
                  : 'admin-badge-warning'
              }`}
            >
              {reviewEval.contentReviewStatus.replace(/_/g, ' ')}
            </span>
            <span className="text-xs font-mono font-bold text-[var(--admin-text-sub)]">
              {reviewEval.overallReviewPercentage}%
            </span>
          </div>
          <p className="text-[11px] text-[var(--admin-text-muted)] truncate">
            {reviewEval.actionRequiredItems.filter((i) => i.targetTab === 'intake').length} fields need action
          </p>
        </div>

        {/* Card 3: Media Review */}
        <div className="bg-[var(--admin-card)] p-4 rounded-2xl border border-[var(--admin-card-border)] shadow-2xs space-y-1.5">
          <span className="text-[10px] font-bold text-[var(--admin-text-muted)] uppercase tracking-wider block">Media Assets</span>
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
                reviewEval.mediaReviewStatus === 'approved'
                  ? 'admin-badge-success'
                  : reviewEval.mediaReviewStatus === 'changes_requested'
                  ? 'admin-badge-error'
                  : 'admin-badge-warning'
              }`}
            >
              {reviewEval.mediaReviewStatus.replace(/_/g, ' ')}
            </span>
            <span className="text-xs font-mono font-bold text-[var(--admin-text-sub)]">
              {reviewEval.aggregatedAssets.filter((a) => project.metadata?.mediaReviews?.[a.id]?.status === 'approved').length}/{reviewEval.aggregatedAssets.length}
            </span>
          </div>
          <p className="text-[11px] text-[var(--admin-text-muted)] truncate">
            {reviewEval.aggregatedAssets.filter((a) => project.metadata?.mediaReviews?.[a.id]?.status === 'changes_requested').length} replacements requested
          </p>
        </div>

        {/* Card 4: Website Readiness */}
        <div className="bg-[var(--admin-card)] p-4 rounded-2xl border border-[var(--admin-card-border)] shadow-2xs space-y-1.5">
          <span className="text-[10px] font-bold text-[var(--admin-text-muted)] uppercase tracking-wider block">Website Readiness</span>
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[11px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 border ${
                reviewEval.websiteReadiness === 'READY'
                  ? 'admin-badge-success'
                  : 'admin-badge-error'
              }`}
            >
              {reviewEval.websiteReadiness === 'READY' ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5" />
              )}
              <span>{reviewEval.websiteReadiness}</span>
            </span>
          </div>
          <p className="text-[11px] text-[var(--admin-text-muted)] truncate" title={reviewEval.websiteReadinessReason}>
            {reviewEval.blockers.length === 0 ? 'Verified for Build' : `${reviewEval.blockers.length} blockers active`}
          </p>
        </div>

        {/* Card 5: Provisioning State */}
        <div className="bg-[var(--admin-card)] p-4 rounded-2xl border border-[var(--admin-card-border)] shadow-2xs space-y-1.5">
          <span className="text-[10px] font-bold text-[var(--admin-text-muted)] uppercase tracking-wider block">Provisioning</span>
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[11px] font-black px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 border ${
                reviewEval.provisioningStatus === 'HANDED_OFF'
                  ? 'admin-badge-info'
                  : reviewEval.provisioningStatus === 'READY'
                  ? 'admin-badge-success'
                  : 'admin-badge-neutral'
              }`}
            >
              {reviewEval.provisioningStatus === 'HANDED_OFF' ? (
                <Sparkles className="w-3.5 h-3.5" />
              ) : reviewEval.provisioningStatus === 'READY' ? (
                <Unlock className="w-3.5 h-3.5" />
              ) : (
                <Lock className="w-3.5 h-3.5" />
              )}
              <span>{reviewEval.provisioningStatus.replace(/_/g, ' ')}</span>
            </span>
          </div>
          <p className="text-[11px] text-[var(--admin-text-muted)] truncate">
            {reviewEval.provisioningStatus === 'HANDED_OFF'
              ? 'Tenant compiled'
              : reviewEval.provisioningStatus === 'READY'
              ? 'Ready to execute'
              : reviewEval.websiteReadiness === 'READY'
              ? 'Awaiting admin sign-off'
              : 'Locked by safety gate'}
          </p>
        </div>
      </section>

      {/* ─── AUTHORITATIVE REVIEW SCORECARD & COMMAND BAR ────────────────────── */}
      <ReviewScorecardBar
        scorecard={scorecard}
        activeView={activeTab}
        onSelectView={(viewKey) => setActiveTab(viewKey as any)}
        onOpenPreview={() => setActiveTab('website-verification')}
        onOpenHandoff={() => setActiveTab('developer-handoff')}
        onOpenApproval={() => setIsApprovalGateOpen(true)}
        onExportZip={handleExportTechnicalZip}
        isExportingZip={isExportingZip}
      />

      {/* ─── TABS NAVIGATION ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-[var(--admin-border)] pb-2 overflow-x-auto">
        {/* Verification Group */}
        <button
          type="button"
          onClick={() => setActiveTab('requirements')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'requirements'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-[var(--admin-text-sub)] hover:text-[var(--admin-text-main)] hover:bg-[var(--admin-surface-secondary)]'
          }`}
        >
          <span>Requirements</span>
          <span className={`px-1.5 py-0.5 rounded-full font-mono text-[10px] font-bold ${
            activeTab === 'requirements' ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-700'
          }`}>
            {scorecard.counts.matchedRequirements}/{scorecard.counts.totalRequirements}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('website-verification')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'website-verification'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-[var(--admin-text-sub)] hover:text-[var(--admin-text-main)] hover:bg-[var(--admin-surface-secondary)]'
          }`}
        >
          <span>Live Preview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pages')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'pages'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-[var(--admin-text-sub)] hover:text-[var(--admin-text-main)] hover:bg-[var(--admin-surface-secondary)]'
          }`}
        >
          <span>Pages ({scorecard.counts.implementedPages}/{scorecard.counts.totalPages})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('content-comparison')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'content-comparison'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-[var(--admin-text-sub)] hover:text-[var(--admin-text-main)] hover:bg-[var(--admin-surface-secondary)]'
          }`}
        >
          <span>Content Diff ({scorecard.contentMatch}%)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('structured-data')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'structured-data'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-[var(--admin-text-sub)] hover:text-[var(--admin-text-main)] hover:bg-[var(--admin-surface-secondary)]'
          }`}
        >
          <span>Academics &amp; Fees</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('documents')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'documents'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-[var(--admin-text-sub)] hover:text-[var(--admin-text-main)] hover:bg-[var(--admin-surface-secondary)]'
          }`}
        >
          <span>Documents</span>
          {scorecard.counts.totalDocuments - scorecard.counts.verifiedDocuments > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
              {scorecard.counts.totalDocuments - scorecard.counts.verifiedDocuments}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('branding')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'branding'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-[var(--admin-text-sub)] hover:text-[var(--admin-text-main)] hover:bg-[var(--admin-surface-secondary)]'
          }`}
        >
          <span>Design Tokens</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('issues')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'issues'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-[var(--admin-text-sub)] hover:text-[var(--admin-text-main)] hover:bg-[var(--admin-surface-secondary)]'
          }`}
        >
          <span>Issues</span>
          {scorecard.counts.criticalIssues > 0 ? (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
              {scorecard.counts.criticalIssues}
            </span>
          ) : (scorecard.counts.totalIssues - scorecard.counts.resolvedIssues) > 0 ? (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
              {scorecard.counts.totalIssues - scorecard.counts.resolvedIssues}
            </span>
          ) : null}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('developer-handoff')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'developer-handoff'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-[var(--admin-text-sub)] hover:text-[var(--admin-text-main)] hover:bg-[var(--admin-surface-secondary)]'
          }`}
        >
          <span>Dev Handoff</span>
        </button>

        {/* Deep Dive Existing Tabs */}
        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />

        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-[var(--admin-text-sub)] hover:text-[var(--admin-text-main)] hover:bg-[var(--admin-surface-secondary)]'
          }`}
        >
          Profile
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('intake')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'intake'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-[var(--admin-text-sub)] hover:text-[var(--admin-text-main)] hover:bg-[var(--admin-surface-secondary)]'
          }`}
        >
          <span>Raw Intake</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('media')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'media'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-[var(--admin-text-sub)] hover:text-[var(--admin-text-main)] hover:bg-[var(--admin-surface-secondary)]'
          }`}
        >
          <span>Media Checklist</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reviews')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'reviews'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-[var(--admin-text-sub)] hover:text-[var(--admin-text-main)] hover:bg-[var(--admin-surface-secondary)]'
          }`}
        >
          <span>Change Requests</span>
          {changeRequests.filter((cr) => cr.status === 'open' || cr.status === 'waiting_for_school' || cr.status === 'ready_for_review').length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
              {changeRequests.filter((cr) => cr.status === 'open' || cr.status === 'waiting_for_school' || cr.status === 'ready_for_review').length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('provisioning')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'provisioning'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-[var(--admin-text-sub)] hover:text-[var(--admin-text-main)] hover:bg-[var(--admin-surface-secondary)]'
          }`}
        >
          <span>Provisioning</span>
        </button>
      </div>

      {/* ─── TAB 1: OVERVIEW & PROFILE ───────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* School Profile Card */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-violet-600" />
                <span>School Profile &amp; Core Parameters</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Institution Name</span>
                  <span className="font-bold text-slate-900 dark:text-white">{project.school_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Solution Package</span>
                  <span className="font-bold text-violet-700 dark:text-violet-400 uppercase">{project.product_id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Primary Contact</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {project.primary_contact_name} ({project.primary_contact_designation || 'Staff'})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Contact Phone</span>
                  <span className="font-mono text-slate-900 dark:text-white">{project.primary_contact_phone}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Contact Email</span>
                  <span className="font-mono text-slate-900 dark:text-white">{project.primary_contact_email}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Location</span>
                  <span className="text-slate-900 dark:text-white">
                    {project.city ? `${project.city}, ${project.state || ''}` : 'Not confirmed'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Campuses Configured</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {intakePayload.campuses?.length || 1} Campus(es)
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Affiliation Board</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {(intakePayload as any)?.curriculum?.board || (intakePayload.schoolProfile as any)?.boardAffiliation || 'Not specified'}
                  </span>
                </div>
              </div>
            </div>

            {/* Review Summary Dashboard */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-violet-600" />
                    <span>Review Progress by Section</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Field-by-field verification status across all intake chapters
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                  {reviewEval.overallReviewPercentage}% Total Verified
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-600 rounded-full transition-all"
                  style={{ width: `${reviewEval.overallReviewPercentage}%` }}
                />
              </div>

              {/* Section Breakdown Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {Object.values(reviewEval.sectionReviews).map((sec) => (
                  <div
                    key={sec.sectionKey}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{sec.sectionLabel}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {sec.verifiedCount} of {sec.totalFields} verified
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          sec.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : sec.status === 'changes_requested'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {sec.status.replace(/_/g, ' ')}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIntakeSectionFilter(sec.sectionKey);
                          setActiveTab('intake');
                        }}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title="Review section"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Required Items List */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Action Required Items</span>
                </h3>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {reviewEval.actionRequiredItems.length} Pending
                </span>
              </div>

              {reviewEval.actionRequiredItems.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>All review items have been inspected and verified! No pending actions.</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {reviewEval.actionRequiredItems.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{item.title}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">{item.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (item.targetSection) setIntakeSectionFilter(item.targetSection);
                          setActiveTab(item.targetTab);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs whitespace-nowrap shadow-xs transition-colors"
                      >
                        Inspect
                      </button>
                    </div>
                  ))}
                  {reviewEval.actionRequiredItems.length > 5 && (
                    <p className="text-xs text-center text-slate-500">
                      + {reviewEval.actionRequiredItems.length - 5} more items requiring review.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Change Requests Summary Card */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-violet-600" />
                  <span>Change Request Remediation</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('reviews')}
                  className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline"
                >
                  View All Requests ({changeRequests.length})
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-center">
                  <span className="text-lg font-black text-amber-700 dark:text-amber-400 block">
                    {reviewEval.changeRequestsSummary.waitingForSchool + reviewEval.changeRequestsSummary.open}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-amber-800 dark:text-amber-300">
                    Waiting for School
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 text-center">
                  <span className="text-lg font-black text-indigo-700 dark:text-indigo-400 block">
                    {reviewEval.changeRequestsSummary.readyForReview}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-indigo-800 dark:text-indigo-300">
                    Ready for Review
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-center">
                  <span className="text-lg font-black text-emerald-700 dark:text-emerald-400 block">
                    {reviewEval.changeRequestsSummary.resolved}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300">
                    Resolved &amp; Closed
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-lg font-black text-slate-700 dark:text-slate-300 block">
                    {reviewEval.changeRequestsSummary.total}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">
                    Total Lifetime
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar Column */}
          <div className="space-y-6">
            {/* Website Readiness Checklist Card */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-violet-600" />
                  <span>Website Readiness Checklist</span>
                </h3>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                    reviewEval.websiteReadiness === 'READY'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  {reviewEval.websiteReadiness}
                </span>
              </div>

              <div className="space-y-3">
                {reviewEval.checklist.map((item) => (
                  <div key={item.id} className="flex items-start gap-2.5 text-xs">
                    {item.status === 'passed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : item.status === 'blocked' ? (
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white leading-tight">{item.label}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.note}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Blockers list if any */}
              {reviewEval.blockers.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">
                    Active Blocker Details ({reviewEval.blockers.length})
                  </span>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {reviewEval.blockers.map((b) => (
                      <div
                        key={b.id}
                        className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-900 dark:text-rose-200 space-y-0.5"
                      >
                        <p className="font-bold">{b.title}</p>
                        <p className="text-[11px] text-rose-800 dark:text-rose-300">{b.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Onboarding Invitation Link Card */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-violet-600" />
                <span>Onboarding Link</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                School staff use this authenticated URL to input school details, academic schedules, fees, and photo galleries.
              </p>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl font-mono text-xs text-slate-700 dark:text-slate-300 break-all select-all border border-slate-200 dark:border-slate-700">
                {typeof window !== 'undefined' ? `${window.location.origin}${onboardingUrl}` : onboardingUrl}
              </div>
              <button
                type="button"
                onClick={copyOnboardingLink}
                className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                {copiedLink ? 'Copied to Clipboard!' : 'Copy Link'}
              </button>
            </div>

            {/* Custom Requirements if any */}
            {customRequirements.length > 0 && (
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Specific School Requirements ({customRequirements.length})
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {customRequirements.map((cr) => (
                    <div key={cr.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                      <p className="font-bold text-slate-900 dark:text-white">{cr.title}</p>
                      <p className="text-slate-600 dark:text-slate-400 mt-0.5">{cr.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: INTAKE DATA (HUMAN-READABLE REVIEW CENTER) ───────────────── */}
      {activeTab === 'intake' && (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between flex-wrap gap-3">
            {/* Section Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-500 mr-1">Section:</span>
              {[
                { key: 'all', label: 'All Sections' },
                ...Object.keys(canonicalFieldsBySection).map((secKey) => ({
                  key: secKey,
                  label: reviewEval.sectionReviews[secKey]?.sectionLabel || secKey,
                })),
              ].map((pill) => (
                <button
                  key={pill.key}
                  type="button"
                  onClick={() => setIntakeSectionFilter(pill.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    intakeSectionFilter === pill.key
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Secondary Actions: Export Technical ZIP & Raw Submission JSON */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportTechnicalZip}
                disabled={isExportingZip || !currentSubmission}
                title="Complete School Project Package / Technical Export: Canonical form data, website pages, documents, & media assets"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-950/60 text-purple-800 dark:text-purple-300 text-xs font-bold rounded-xl border border-purple-200 dark:border-purple-800 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                {isExportingZip ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-600" /> : <Download className="w-3.5 h-3.5 text-purple-600" />}
                <span>{isExportingZip ? (exportProgressText || 'Exporting...') : 'Export Technical ZIP'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowRawJsonModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Raw Submission</span>
              </button>
            </div>
          </div>

          {/* Submission not recorded empty state */}
          {!currentSubmission ? (
            <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No Intake Submission Recorded Yet
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                The school staff has not finalized and submitted their onboarding intake form. You can preview their draft link or send a reminder.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Sections Rendered */}
              {Object.entries(canonicalFieldsBySection)
                .filter(([secKey]) => intakeSectionFilter === 'all' || intakeSectionFilter === secKey)
                .map(([secKey, fields]) => {
                  const secSummary = reviewEval.sectionReviews[secKey];
                  return (
                    <div
                      key={secKey}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden"
                    >
                      {/* Section Header */}
                      <div className="p-4 sm:p-5 bg-[var(--admin-surface-secondary)] border-b border-[var(--admin-border)] flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <h3 className="text-sm font-bold text-[var(--admin-text-main)]">
                            {secSummary?.sectionLabel || secKey}
                          </h3>
                          <p className="text-xs text-[var(--admin-text-sub)]">
                            {secSummary?.verifiedCount || 0} of {fields.length} verified
                          </p>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                            secSummary?.status === 'approved'
                              ? 'admin-badge-success'
                              : secSummary?.status === 'changes_requested'
                              ? 'admin-badge-error'
                              : 'admin-badge-warning'
                          }`}
                        >
                          {secSummary?.status.replace(/_/g, ' ') || 'in review'}
                        </span>
                      </div>

                      {/* Fields Table / Grid */}
                      <div className="divide-y divide-[var(--admin-border-subtle)]">
                        {fields.map((field) => {
                          const rawVal = field.getter(intakePayload);
                          const displayVal = formatFieldValue(rawVal);
                          const reviewItem = project.metadata?.fieldReviews?.[field.key];
                          const fieldDef = lookupCanonicalField(field.key, field.sectionKey);

                          const activeCR = changeRequests.find((cr) => {
                            const crDef = lookupCanonicalField(cr.field_key || '', cr.page_key || cr.section_key);
                            return (
                              (crDef.canonicalKey === fieldDef.canonicalKey ||
                                cr.field_key === field.key ||
                                cr.field_key === fieldDef.fieldKey ||
                                (cr.section_key === field.sectionKey && cr.field_key === field.key.split('.').pop())) &&
                              (cr.status === 'open' ||
                                cr.status === 'waiting_for_school' ||
                                cr.status === 'ready_for_review' ||
                                cr.status === 'school_updated' ||
                                cr.status === 'pending' ||
                                cr.status === 'changes_requested' ||
                                cr.status === 'needs_revision')
                            );
                          });

                          const isAwaitingAdmin = Boolean(
                            activeCR && (activeCR.status === 'ready_for_review' || activeCR.status === 'school_updated')
                          );
                          const isChangesRequested = Boolean(
                            activeCR &&
                              (activeCR.status === 'open' ||
                                activeCR.status === 'waiting_for_school' ||
                                activeCR.status === 'pending' ||
                                activeCR.status === 'changes_requested' ||
                                activeCR.status === 'needs_revision')
                          );

                          let statusBadge = {
                            label: 'PENDING REVIEW',
                            className: 'admin-badge-warning',
                          };

                          if (reviewItem?.status === 'verified' || reviewItem?.status === 'approved') {
                            statusBadge = {
                              label: 'VERIFIED',
                              className: 'admin-badge-success',
                            };
                          } else if (isAwaitingAdmin) {
                            statusBadge = {
                              label: 'UPDATED — AWAITING REVIEW',
                              className:
                                'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700 font-black animate-pulse',
                            };
                          } else if (isChangesRequested) {
                            statusBadge = {
                              label: 'CHANGES REQUESTED',
                              className: 'admin-badge-error',
                            };
                          }

                          return (
                            <div
                              key={field.key}
                              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-[var(--admin-surface-hover)] transition-colors"
                            >
                              <div className="space-y-1.5 max-w-xl">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-[var(--admin-text-main)]">
                                    {fieldDef.fieldLabel || field.label}
                                  </span>
                                  {field.required && (
                                    <span className="text-[10px] text-rose-500 font-bold">*Required</span>
                                  )}
                                  <span
                                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${statusBadge.className}`}
                                  >
                                    {statusBadge.label}
                                  </span>
                                </div>
                                <div className="text-[var(--admin-text-main)] font-mono text-xs break-words bg-[var(--admin-surface-secondary)]/50 p-2 rounded-lg border border-[var(--admin-border-subtle)]">
                                  {displayVal}
                                </div>

                                {activeCR && (
                                  <div
                                    className={`mt-1 p-2.5 rounded-xl border text-[11px] ${
                                      isAwaitingAdmin
                                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                                        : 'bg-rose-500/10 border-rose-500/25 text-rose-700 dark:text-rose-300'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-bold">
                                        {isAwaitingAdmin ? '🟡 School Update Awaiting Your Review: ' : '🔴 Active Change Request: '}
                                      </span>
                                      <span className="text-[10px] font-mono opacity-75">
                                        Rev #{activeCR.revision_number || 1}
                                      </span>
                                    </div>
                                    <p className="mt-0.5">{activeCR.request_comment}</p>
                                    {activeCR.suggested_value && (
                                      <div className="mt-1 font-mono text-[10px] opacity-90">
                                        Suggested: {activeCR.suggested_value}
                                      </div>
                                    )}
                                    {activeCR.school_response && (
                                      <div className="mt-1.5 pt-1.5 border-t border-amber-500/20 font-medium">
                                        <span className="font-bold text-[10px] uppercase block tracking-wider">
                                          School Response Note:
                                        </span>
                                        {activeCR.school_response}
                                        {activeCR.school_updated_value && (
                                          <div className="mt-0.5 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                            Updated Value: {activeCR.school_updated_value}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center flex-wrap">
                                {statusBadge.label !== 'VERIFIED' ? (
                                  <button
                                    type="button"
                                    onClick={() => handleApproveField(field.key, field.sectionKey)}
                                    disabled={isActionLoading}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                                    title={isAwaitingAdmin ? 'Accept school correction and verify field' : 'Verify field'}
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>{isAwaitingAdmin ? 'Accept & Verify' : 'Approve'}</span>
                                  </button>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold admin-badge-success">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Verified</span>
                                  </span>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    setFieldCRModal({
                                      sectionKey: field.sectionKey,
                                      fieldKey: field.key,
                                      fieldLabel: fieldDef.fieldLabel || field.label,
                                      pageTitle: fieldDef.pageTitle || 'School Onboarding',
                                      sectionTitle: fieldDef.sectionTitle || secSummary?.sectionLabel || field.sectionKey,
                                      currentValue: displayVal,
                                      existingCR: activeCR,
                                    });
                                    setFieldCRComment(activeCR ? (activeCR.request_comment || '') : '');
                                    setFieldCRReason(activeCR ? (activeCR.reason || 'Incomplete or inaccurate information') : 'Incomplete or inaccurate information');
                                    setFieldCRSuggested(activeCR ? (activeCR.suggested_value || '') : '');
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-[var(--admin-surface-secondary)] hover:bg-[var(--admin-surface-hover)] text-[var(--admin-text-main)] border border-[var(--admin-border)] font-bold text-xs transition-colors cursor-pointer"
                                >
                                  {activeCR ? 'Edit Request' : 'Request Change'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenHistory(field.key, fieldDef.fieldLabel || field.label)}
                                  className="px-2.5 py-1.5 rounded-lg text-[var(--admin-text-sub)] hover:text-[var(--admin-text-main)] hover:bg-[var(--admin-surface-hover)] font-medium text-xs transition-colors cursor-pointer flex items-center gap-1 border border-transparent hover:border-[var(--admin-border)]"
                                  title="View revision history and audit trail for this field"
                                >
                                  <Clock className="w-3 h-3" />
                                  <span>History</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: MEDIA & ASSETS (VISUAL ASSET REVIEW CENTER) ─────────────── */}
      {/* ─── TAB 3: MEDIA, DOCUMENTS & COMPLIANCE REVIEW ───────────────────── */}
      {activeTab === 'media' && (
        <div className="space-y-5">
          {/* Top-Level Document Completeness & Verification KPI Banner */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Document &amp; Certificate Completeness Status</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Universal statutory review &amp; quality control dashboard for school certificates and official documents.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {documentCompleteness.totalApproved} of {documentCompleteness.totalRequired} Approved
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {documentCompleteness.percentage}% Approval Rate
                  </div>
                </div>
                <div className="w-24 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                  <div
                    className={`h-full transition-all duration-300 ${
                      documentCompleteness.percentage === 100
                        ? 'bg-emerald-500'
                        : documentCompleteness.percentage > 50
                        ? 'bg-indigo-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${documentCompleteness.percentage}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Required</div>
                <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  {documentCompleteness.totalRequired}
                </div>
                <div className="text-[10px] text-slate-400">Statutory Proofs</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Submitted</div>
                <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  {documentCompleteness.totalSubmitted}
                </div>
                <div className="text-[10px] text-slate-400">Uploaded Files</div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Approved</div>
                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {documentCompleteness.totalApproved}
                </div>
                <div className="text-[10px] text-emerald-600/80 dark:text-emerald-500/80">Verified &amp; Cleared</div>
              </div>
              <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40">
                <div className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Changes Req.</div>
                <div className="text-lg font-black text-rose-600 dark:text-rose-400 mt-0.5">
                  {documentCompleteness.totalChangesRequested}
                </div>
                <div className="text-[10px] text-rose-600/80 dark:text-rose-500/80">Revisions Needed</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Pending Review</div>
                <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">
                  {documentCompleteness.totalPendingReview}
                </div>
                <div className="text-[10px] text-amber-600/80 dark:text-amber-500/80">Awaiting Admin</div>
              </div>
              <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40">
                <div className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">Blockers</div>
                <div className="text-lg font-black text-purple-600 dark:text-purple-400 mt-0.5">
                  {documentCompleteness.totalPublicationBlockers}
                </div>
                <div className="text-[10px] text-purple-600/80 dark:text-purple-500/80">Mandatory Blockers</div>
              </div>
            </div>
          </div>

          {/* Header & Category Filters + View Mode Switcher */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-500 mr-1">Category:</span>
              {[
                { key: 'all', label: 'All Files' },
                { key: 'documents', label: 'Documents & Certificates' },
                { key: 'images', label: 'Photos & Media' },
                { key: 'branding', label: 'Branding & Logos' },
                { key: 'campus', label: 'Campus & Exterior' },
                { key: 'facilities', label: 'Facilities & Labs' },
                { key: 'people', label: 'Leadership & Faculty' },
                { key: 'compliance', label: 'Statutory & Compliance' },
                { key: 'promotional', label: 'Promotional & Gallery' },
              ].map((pill) => (
                <button
                  key={pill.key}
                  type="button"
                  onClick={() => setMediaCategoryFilter(pill.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    mediaCategoryFilter === pill.key
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* View Mode Switcher */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setMediaViewMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    mediaViewMode === 'table'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Structured List & Comparison Table View"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Table View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMediaViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    mediaViewMode === 'grid'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Visual Card Grid View"
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Grid View</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {reviewEval.aggregatedAssets.filter((a) => !checkIsDocument(a)).length} Photos
                </span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/60">
                  {reviewEval.aggregatedAssets.filter((a) => checkIsDocument(a)).length} Documents
                </span>
                <span>•</span>
                <span className="text-slate-600 dark:text-slate-400">
                  {reviewEval.aggregatedAssets.length} Total
                </span>
              </div>
            </div>
          </div>

          {/* Filtered Assets Container */}
          {reviewEval.aggregatedAssets.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No Media Assets or Documents Uploaded
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                School campus photos, official logos, statutory certificates, and regulatory documents uploaded during onboarding will appear here for verification.
              </p>
            </div>
          ) : mediaViewMode === 'table' ? (
            /* ─── STRUCTURED TABLE / LIST VIEW ─── */
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Document / Asset</th>
                      <th className="py-3 px-4">Category &amp; Source</th>
                      <th className="py-3 px-4">Key Intake Reference</th>
                      <th className="py-3 px-4">Validation Status</th>
                      <th className="py-3 px-4">Review Decision</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {reviewEval.aggregatedAssets
                      .filter((asset) => {
                        if (mediaCategoryFilter === 'all') return true;
                        if (mediaCategoryFilter === 'images') return !checkIsDocument(asset);
                        if (mediaCategoryFilter === 'documents') return checkIsDocument(asset);
                        if (mediaCategoryFilter === 'compliance') return asset.category === 'compliance';
                        return asset.category === mediaCategoryFilter;
                      })
                      .map((asset) => {
                        const isDoc = checkIsDocument(asset);
                        const isUploaded = Boolean(asset.url);
                        const reviewItem = project.metadata?.mediaReviews?.[asset.id];
                        const activeCR = changeRequests.find(
                          (cr) =>
                            cr.asset_id === asset.id &&
                            (cr.status === 'open' || cr.status === 'waiting_for_school' || cr.status === 'ready_for_review')
                        );

                        let effectiveStatus: MediaReviewStatus = 'pending_review';
                        if (activeCR) {
                          effectiveStatus = 'changes_requested';
                        } else if (reviewItem?.status) {
                          effectiveStatus = reviewItem.status;
                        }

                        const docDef = isDoc ? getDocumentReviewDefinition(asset.id) : undefined;
                        const fields = docDef ? docDef.expectedFields(intakePayload) : [];
                        const derivedStatus = isDoc
                          ? calculateDerivedDocumentValidationStatus(asset.url, asset.fileName, fields)
                          : asset.url
                          ? 'VALID'
                          : 'MISSING';

                        let keyIntakeInfo = 'Standard Onboarding Reference';
                        const anyPayload = intakePayload as any;
                        if (asset.id.includes('affiliation')) {
                          keyIntakeInfo = `Affiliation: ${intakePayload.schoolProfile?.affiliationNumber || anyPayload.academicFramework?.affiliationNumber || anyPayload.generalInfo?.affiliationNumber || 'Pending'}`;
                        } else if (asset.id.includes('safety')) {
                          keyIntakeInfo = `Premises: ${intakePayload.campuses?.[0]?.city || anyPayload.generalInfo?.address?.city || 'Campus Location'}`;
                        } else if (asset.id.includes('recognition')) {
                          keyIntakeInfo = `State Norms: ${intakePayload.campuses?.[0]?.state || anyPayload.generalInfo?.address?.state || 'Education Dept'}`;
                        } else if (asset.id.includes('principal') || asset.category === 'people') {
                          keyIntakeInfo = `Leader: ${intakePayload.leadership?.principalName || anyPayload.leadership?.principal?.name || 'Head of School'}`;
                        } else if (asset.category === 'branding') {
                          keyIntakeInfo = `${intakePayload.schoolProfile?.schoolName || anyPayload.generalInfo?.schoolName || 'Official Identity'}`;
                        }

                        return (
                          <tr
                            key={asset.id}
                            className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                              !isUploaded && isDoc ? 'bg-rose-50/30 dark:bg-rose-950/10' : ''
                            }`}
                          >
                            {/* Document / Asset Name & Thumbnail */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3 min-w-[220px]">
                                {isDoc ? (
                                  <div
                                    onClick={() => setPreviewingAsset(asset)}
                                    className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center shrink-0 cursor-pointer hover:scale-105 transition-transform"
                                  >
                                    <FileText className="w-5 h-5" />
                                  </div>
                                ) : (
                                  <div
                                    onClick={() => setPreviewingAsset(asset)}
                                    className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 cursor-pointer hover:scale-105 transition-transform flex items-center justify-center text-slate-400"
                                  >
                                    {asset.url ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={asset.url} alt={asset.title} className="w-full h-full object-cover" />
                                    ) : (
                                      <ImageIcon className="w-5 h-5" />
                                    )}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      onClick={() => setPreviewingAsset(asset)}
                                      className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer truncate max-w-[200px]"
                                      title={asset.title}
                                    >
                                      {asset.title}
                                    </span>
                                    {asset.required && (
                                      <span className="text-[10px] font-bold text-rose-500 shrink-0">*</span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
                                    {asset.fileName ? (
                                      <span>{asset.fileName}</span>
                                    ) : !isUploaded ? (
                                      <span className="text-rose-500 font-semibold">(Not Yet Uploaded)</span>
                                    ) : (
                                      <span>Official File</span>
                                    )}
                                    {asset.fileSize ? ` • ${formatBytes(asset.fileSize)}` : ''}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Category & Section */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {asset.category}
                              </span>
                              <div className="text-[10px] text-slate-500 mt-1 truncate max-w-[160px]">
                                {asset.sourceSectionLabel}
                              </div>
                            </td>

                            {/* Key Intake Reference */}
                            <td className="py-3 px-4">
                              <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 font-medium truncate block max-w-[180px]">
                                {keyIntakeInfo}
                              </span>
                              {docDef?.governingAuthority && (
                                <span className="text-[10px] text-slate-400 truncate block max-w-[180px]">
                                  {docDef.governingAuthority}
                                </span>
                              )}
                            </td>

                            {/* Validation Status */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              {derivedStatus === 'VALID' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  <Check className="w-3 h-3" />
                                  <span>VALID</span>
                                </span>
                              )}
                              {derivedStatus === 'REQUIRES_MANUAL_VERIFICATION' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                  <Clock className="w-3 h-3" />
                                  <span>MANUAL REVIEW</span>
                                </span>
                              )}
                              {derivedStatus === 'INVALID' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                  <AlertCircle className="w-3 h-3" />
                                  <span>MISMATCH</span>
                                </span>
                              )}
                              {derivedStatus === 'EXPIRED' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>EXPIRED</span>
                                </span>
                              )}
                              {derivedStatus === 'MISSING' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                  <AlertCircle className="w-3 h-3" />
                                  <span>MISSING</span>
                                </span>
                              )}
                            </td>

                            {/* Review Decision */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              {effectiveStatus === 'approved' ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Approved</span>
                                </span>
                              ) : effectiveStatus === 'changes_requested' ? (
                                <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold text-xs">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  <span>Changes Req.</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold text-xs">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Pending</span>
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setPreviewingAsset(asset)}
                                  className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>{isUploaded ? 'Inspect' : 'Requirements'}</span>
                                </button>

                                {isUploaded && effectiveStatus !== 'approved' && (
                                  <button
                                    type="button"
                                    onClick={() => handleApproveMediaAsset(asset.id)}
                                    disabled={isActionLoading || derivedStatus === 'EXPIRED' || derivedStatus === 'INVALID'}
                                    className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors cursor-pointer"
                                    title={
                                      derivedStatus === 'EXPIRED'
                                        ? 'Cannot approve expired document / certificate'
                                        : derivedStatus === 'INVALID'
                                        ? 'Cannot approve document with critical mismatches'
                                        : 'Approve Document'
                                    }
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    setMediaCRModal({
                                      assetId: asset.id,
                                      assetTitle: asset.title,
                                      currentUrl: asset.url,
                                    });
                                    setMediaCRReason(
                                      isDoc
                                        ? 'Illegible or blurry scanned document'
                                        : 'Low resolution or poor aspect ratio'
                                    );
                                    setMediaCRComment('');
                                  }}
                                  className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                                  title="Request Replacement"
                                >
                                  <AlertCircle className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ─── VISUAL CARD GRID VIEW ─── */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reviewEval.aggregatedAssets
                .filter((asset) => {
                  if (mediaCategoryFilter === 'all') return true;
                  if (mediaCategoryFilter === 'images') return !checkIsDocument(asset);
                  if (mediaCategoryFilter === 'documents') return checkIsDocument(asset);
                  if (mediaCategoryFilter === 'compliance') return asset.category === 'compliance';
                  return asset.category === mediaCategoryFilter;
                })
                .map((asset) => {
                  const reviewItem = project.metadata?.mediaReviews?.[asset.id];
                  const activeCR = changeRequests.find(
                    (cr) =>
                      cr.asset_id === asset.id &&
                      (cr.status === 'open' || cr.status === 'waiting_for_school' || cr.status === 'ready_for_review')
                  );

                  let effectiveStatus: MediaReviewStatus = 'pending_review';
                  if (activeCR) {
                    effectiveStatus = 'changes_requested';
                  } else if (reviewItem?.status) {
                    effectiveStatus = reviewItem.status;
                  }

                  const isDoc = checkIsDocument(asset);
                  const isUploaded = Boolean(asset.url);

                  return (
                    <div
                      key={asset.id}
                      className={`bg-white dark:bg-slate-900 rounded-2xl border shadow-xs overflow-hidden flex flex-col justify-between ${
                        !isUploaded && isDoc
                          ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10'
                          : 'border-slate-200/80 dark:border-slate-800'
                      }`}
                    >
                      {/* Image or Document Thumbnail */}
                      {isDoc ? (
                        <div
                          className="relative aspect-video bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 overflow-hidden cursor-pointer group border-b border-slate-200/80 dark:border-slate-800 flex flex-col items-center justify-center p-4 text-center select-none"
                          onClick={() => setPreviewingAsset(asset)}
                        >
                          {/* Top Badges */}
                          <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase bg-rose-950/90 text-rose-300 border border-rose-800/50 backdrop-blur-xs flex items-center gap-1">
                              <FileText className="w-2.5 h-2.5" />
                              PDF DOCUMENT
                            </span>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase backdrop-blur-xs ${
                                !isUploaded
                                  ? 'bg-rose-600 text-white'
                                  : effectiveStatus === 'approved'
                                  ? 'bg-emerald-600/90 text-white'
                                  : effectiveStatus === 'changes_requested'
                                  ? 'bg-rose-600/90 text-white'
                                  : 'bg-amber-500/90 text-white'
                              }`}
                            >
                              {!isUploaded ? 'MISSING' : effectiveStatus.replace(/_/g, ' ')}
                            </span>
                          </div>

                          {/* PDF Icon and Document Meta */}
                          <div className="flex flex-col items-center justify-center gap-2 group-hover:scale-105 transition-transform duration-200 px-2">
                            <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-950/40">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="max-w-[220px]">
                              <p className="text-[11px] font-bold text-slate-200 truncate">
                                {asset.fileName || `${asset.title}.pdf`}
                              </p>
                              {asset.fileSize ? (
                                <p className="text-[10px] text-slate-400 font-mono">
                                  {formatBytes(asset.fileSize)}
                                </p>
                              ) : !isUploaded ? (
                                <p className="text-[10px] text-rose-400 font-bold">Document Not Uploaded</p>
                              ) : (
                                <p className="text-[10px] text-slate-500 font-medium">Official Document</p>
                              )}
                            </div>
                          </div>

                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-2">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20">
                              <Eye className="w-3.5 h-3.5" />
                              <span>{isUploaded ? 'Inspect Document' : 'View Requirements'}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="relative aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden cursor-pointer group"
                          onClick={() => setPreviewingAsset(asset)}
                        >
                          {asset.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={asset.url}
                              alt={asset.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1.5">
                              <ImageIcon className="w-8 h-8" />
                              <span className="text-[10px] font-bold uppercase tracking-wider">No URL Recorded</span>
                            </div>
                          )}

                          {/* Top Badges */}
                          <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase bg-slate-900/80 text-white backdrop-blur-xs">
                              {asset.category}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase backdrop-blur-xs ${
                                effectiveStatus === 'approved'
                                  ? 'bg-emerald-600/90 text-white'
                                  : effectiveStatus === 'changes_requested'
                                  ? 'bg-rose-600/90 text-white'
                                  : 'bg-amber-500/90 text-white'
                              }`}
                            >
                              {effectiveStatus.replace(/_/g, ' ')}
                            </span>
                          </div>

                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                            <Eye className="w-4 h-4" />
                            <span>Click to Inspect</span>
                          </div>
                        </div>
                      )}

                      {/* Details & Actions */}
                      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate" title={asset.title}>
                              {asset.title}
                            </h4>
                            {asset.required && (
                              <span className="text-[10px] font-bold text-rose-500">*Required</span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">
                            Section: {asset.sourceSectionLabel}
                          </p>

                          {/* Usages */}
                          {asset.usages && asset.usages.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap pt-1">
                              {asset.usages.map((u: string) => (
                                <span
                                  key={u}
                                  className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                >
                                  {u}
                                </span>
                              ))}
                            </div>
                          )}

                          {activeCR && (
                            <div className="mt-2 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-[11px] text-rose-800 dark:text-rose-300">
                              <span className="font-bold">Requested: </span>
                              {activeCR.request_comment}
                            </div>
                          )}
                        </div>

                        {/* Inline Actions */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          {asset.url && (
                            <a
                              href={asset.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Open file in new tab"
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {isUploaded && effectiveStatus !== 'approved' && (
                            <button
                              type="button"
                              onClick={() => handleApproveMediaAsset(asset.id)}
                              disabled={isActionLoading}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          )}

                          {effectiveStatus === 'approved' && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approved</span>
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setMediaCRModal({
                                assetId: asset.id,
                                assetTitle: asset.title,
                                currentUrl: asset.url,
                              });
                              setMediaCRReason(
                                isDoc
                                  ? 'Illegible or blurry scanned document'
                                  : 'Low resolution or poor aspect ratio'
                              );
                              setMediaCRComment('');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                          >
                            Request Replacement
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 4: CHANGE REQUESTS (REMEDIATION HUB) ────────────────────────── */}
      {activeTab === 'reviews' && (
        <div className="space-y-5">
          {/* Top KPI & Filters */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-500 mr-1">Status:</span>
              {[
                { key: 'all', label: 'All Requests' },
                { key: 'waiting_for_school', label: 'Waiting for School' },
                { key: 'ready_for_review', label: 'Ready for Review' },
                { key: 'resolved', label: 'Resolved' },
              ].map((pill) => (
                <button
                  key={pill.key}
                  type="button"
                  onClick={() => setCrStatusFilter(pill.key as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    crStatusFilter === pill.key
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <span className="text-xs font-bold text-slate-500">
              {changeRequests.length} Total Requests
            </span>
          </div>

          {/* Change Request List */}
          {changeRequests.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No Change Requests Recorded
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Any corrections requested for intake data fields or media assets will be tracked here in real time.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {changeRequests
                .filter((cr) => {
                  if (crStatusFilter === 'all') return true;
                  if (crStatusFilter === 'waiting_for_school') return cr.status === 'open' || cr.status === 'waiting_for_school';
                  if (crStatusFilter === 'ready_for_review') return cr.status === 'ready_for_review';
                  if (crStatusFilter === 'resolved') return cr.status === 'resolved' || cr.status === 'approved';
                  return true;
                })
                .map((cr) => {
                  const isReadyForReview = cr.status === 'ready_for_review';
                  const isWaiting = cr.status === 'open' || cr.status === 'waiting_for_school';
                  const isResolved = cr.status === 'resolved' || cr.status === 'approved';

                  return (
                    <div
                      key={cr.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isReadyForReview
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800'
                          : isWaiting
                          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {cr.section_key}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {cr.field_key || cr.asset_id || 'Item'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                              isReadyForReview
                                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 animate-pulse'
                                : isWaiting
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            {cr.status.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(cr.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="font-bold text-slate-700 dark:text-slate-300">Reviewer Note: </span>
                          <span className="text-slate-900 dark:text-white font-medium">{cr.request_comment}</span>
                        </div>

                        {cr.suggested_value && (
                          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200">
                            <span className="font-bold">Suggested Correction: </span>
                            <span className="font-mono">{cr.suggested_value}</span>
                          </div>
                        )}

                        {/* School Response */}
                        {(cr.school_response || cr.file_url) && (
                          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-[11px] space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-indigo-900 dark:text-indigo-300">
                                School Response / Updated Submission:
                              </span>
                              {isReadyForReview && (
                                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                                  New submission awaiting review
                                </span>
                              )}
                            </div>
                            {cr.school_response && (
                              <p className="text-indigo-800 dark:text-indigo-200 font-medium">
                                {cr.school_response}
                              </p>
                            )}

                            {/* Uploaded File / PDF Card */}
                            {cr.file_url && (
                              <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 shadow-2xs">
                                <div className="flex items-center gap-2 truncate">
                                  <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                  <div className="truncate">
                                    <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                      {cr.file_name || 'Uploaded Document'}
                                    </div>
                                    <div className="text-[10px] text-slate-500">
                                      {cr.file_size ? formatBytes(cr.file_size) : 'File attachment'}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <a
                                    href={cr.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-[11px] font-bold flex items-center gap-1 transition-colors"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Preview PDF</span>
                                  </a>
                                  <a
                                    href={cr.file_url}
                                    download={cr.file_name || 'document.pdf'}
                                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-[11px] font-bold flex items-center gap-1 transition-colors"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Download</span>
                                  </a>
                                </div>
                              </div>
                            )}

                            {cr.school_updated_value && !cr.file_url && (
                              <div className="font-mono text-slate-700 dark:text-slate-300">
                                Updated Value: <strong className="text-emerald-600 dark:text-emerald-400">{cr.school_updated_value}</strong>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Resolution Actions */}
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            if (cr.asset_id) {
                              setActiveTab('media');
                            } else {
                              setIntakeSectionFilter(cr.section_key);
                              setActiveTab('intake');
                            }
                          }}
                          className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
                        >
                          <span>Jump to Field / Asset</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        {isReadyForReview && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleResolveChangeRequest(cr, false)}
                              disabled={isActionLoading}
                              className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 font-bold text-xs transition-colors"
                            >
                              Request Replacement
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResolveChangeRequest(cr, true)}
                              disabled={isActionLoading}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve Correction</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 5: PROVISIONING HANDOFF ─────────────────────────────────────── */}
      {activeTab === 'provisioning' && (
        <div className="max-w-2xl space-y-6">
          {/* Readiness Gate Banner */}
          {reviewEval.provisioningStatus === 'LOCKED' ? (
            <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-900 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-200 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                    Provisioning Locked by Operational Safety Gate
                  </h3>
                  <p className="text-xs text-rose-700 dark:text-rose-300">
                    Platform provisioning cannot be triggered until all intake review criteria, academic scopes, and media assets are verified.
                  </p>
                </div>
              </div>

              {/* Blockers list */}
              <div className="pt-2 border-t border-rose-200 dark:border-rose-900/60 space-y-1.5">
                <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider block">
                  Mandatory Blockers Preventing Handoff:
                </span>
                <ul className="space-y-1 text-xs text-rose-800 dark:text-rose-300">
                  {reviewEval.blockers.map((b) => (
                    <li key={b.id} className="flex items-start gap-1.5">
                      <span className="text-rose-500 font-bold">&bull;</span>
                      <span>
                        <strong>{b.title}:</strong> {b.reason}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : reviewEval.provisioningStatus === 'READY' ? (
            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-200 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <Unlock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                    Website Review Passed — Ready for Provisioning
                  </h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    All review items and media assets have been verified. The school dataset is ready to compile into tenant infrastructure.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border-2 border-cyan-300 dark:border-cyan-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-200 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-cyan-900 dark:text-cyan-200">
                    School Platform Provisioned &amp; Active
                  </h3>
                  <p className="text-xs text-cyan-700 dark:text-cyan-300">
                    Tenant code: <strong className="font-mono">{project.project_number}</strong> &bull; Handoff complete.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Provisioning Actions Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Automated Platform Tenant Provisioning
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Multi-campus sync, DNS records, website dataset locking &amp; tenant bootstrap (Step 41/42 engine)
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Target Tenant Code:</span>
                <strong className="font-mono text-violet-600">{project.project_number}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Website Readiness:</span>
                <strong className={reviewEval.websiteReadiness === 'READY' ? 'text-emerald-600' : 'text-rose-600'}>
                  {reviewEval.websiteReadiness}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Admin Final Approval:</span>
                <strong className={project.status === 'approved' || project.status === 'handoff_ready' ? 'text-emerald-600' : 'text-amber-600'}>
                  {project.status === 'approved' || project.status === 'handoff_ready' ? 'Approved' : 'Pending Approval'}
                </strong>
              </div>
            </div>

            {/* Execute Button */}
            {project.status === 'handed_off' ? (
              <div className="w-full py-3 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300 font-bold rounded-xl text-xs text-center">
                Platform Successfully Handed Off &amp; Active
              </div>
            ) : (project.status === 'approved' || project.status === 'handoff_ready') && reviewEval.provisioningStatus === 'READY' ? (
              <button
                type="button"
                onClick={handleTriggerHandoff}
                disabled={isActionLoading}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <Sparkles className="w-4 h-4" />
                <span>Execute Platform Provisioning</span>
              </button>
            ) : reviewEval.websiteReadiness === 'READY' ? (
              <div className="space-y-3">
                <textarea
                  rows={2}
                  value={finalApprovalNotes}
                  onChange={(e) => setFinalApprovalNotes(e.target.value)}
                  placeholder="Optional approval notes or sign-off remarks..."
                  className="w-full bg-[var(--admin-surface-secondary)] text-[var(--admin-text-main)] placeholder:text-[var(--admin-text-muted)] border border-[var(--admin-border)] rounded-xl p-3 text-xs focus:outline-hidden focus:ring-2 focus:ring-[var(--admin-accent)]/30"
                />
                <button
                  type="button"
                  onClick={() => handleFinalApprove()}
                  disabled={isActionLoading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Lock &amp; Authorize for Provisioning</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled
                className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-not-allowed border border-slate-200 dark:border-slate-700"
              >
                <Lock className="w-4 h-4" />
                <span>Provisioning Locked ({reviewEval.blockers.length} Blockers)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB: CUSTOMER REQUIREMENTS INVENTORY ───────────────────────────── */}
      {activeTab === 'requirements' && (
        <CustomerRequirementsView
          requirements={customerRequirements}
          onUpdateStatus={async (id) => {
            await handleApproveRequirement(id);
          }}
          onEditOverride={(req) => handleOpenOverride(req.id, req.title, req.submittedValue)}
          onCreateIssue={(req) => {
            handleLogIssue({
              severity: 'HIGH',
              title: `Discrepancy in ${req.title}`,
              explanation: `Expected: ${req.expectedWebsiteResult}. Actual: ${req.actualWebsiteResult}. Submitted: ${req.submittedValue}.`,
              section: req.section,
              sectionKey: req.sectionKey,
              relatedField: req.fieldKey || req.id,
              adminNotes: req.adminNotes || 'Discrepancy flagged during customer requirements review.',
            });
          }}
        />
      )}

      {/* ─── TAB: LIVE WEBSITE PREVIEW & VIEWPORTS ───────────────────────────── */}
      {activeTab === 'website-verification' && (
        <WebsiteVerificationView
          websiteData={websiteData}
          onFlagIssue={(sectionName) => {
            handleLogIssue({
              severity: 'MEDIUM',
              title: `Issue in section: ${sectionName}`,
              explanation: `Admin flagged a verification defect while inspecting the ${sectionName} section.`,
              section: sectionName,
              sectionKey: sectionName.toLowerCase(),
            });
          }}
        />
      )}

      {/* ─── TAB: PAGE-BY-PAGE VERIFICATION ──────────────────────────────────── */}
      {activeTab === 'pages' && (
        <PageByPageVerificationView
          pages={pageVerifications}
          onUpdatePageStatus={async (pageKey) => {
            await handleApprovePage(pageKey);
          }}
          onCreateIssue={(page) => {
            handleLogIssue({
              severity: 'HIGH',
              title: `Page defect on ${page.label}`,
              explanation: `Verification issue recorded for ${page.label} (${page.slug}).`,
              section: page.label,
              sectionKey: page.pageKey,
              relatedPage: page.pageKey,
            });
          }}
        />
      )}

      {/* ─── TAB: CONTENT DIFF & FIDELITY ────────────────────────────────────── */}
      {activeTab === 'content-comparison' && (
        <ContentComparisonView
          diffs={contentComparisons}
          onEditContent={(diff) => handleOpenOverride(diff.id, diff.title, diff.submittedText)}
          onFlagIssue={(diff) => {
            handleLogIssue({
              severity: 'MEDIUM',
              title: `Content mismatch: ${diff.title}`,
              explanation: `Submitted content does not match expected presentation for ${diff.title}. Submitted: "${diff.submittedText}" vs Website: "${diff.websiteText}".`,
              section: diff.section,
              sectionKey: diff.section.toLowerCase(),
              relatedField: diff.id,
            });
          }}
        />
      )}

      {/* ─── TAB: STRUCTURED DATA REVIEW ─────────────────────────────────────── */}
      {activeTab === 'structured-data' && (
        <StructuredDataReviewView
          project={project}
          intakePayload={intakePayload}
          websiteData={websiteData}
          onEditOverride={(key, label, currentValue) => handleOpenOverride(key, label, currentValue)}
          onApproveRequirement={handleApproveRequirement}
        />
      )}

      {/* ─── TAB: STATUTORY DOCUMENTS AUDIT ─────────────────────────────────── */}
      {activeTab === 'documents' && (
        <DocumentReviewView
          documents={documentReviews}
          onPreviewDocument={(doc) => {
            setPreviewingAsset({
              id: doc.id,
              title: doc.title,
              url: doc.fileUrl,
              fileName: doc.fileName,
              fileSize: doc.fileSize,
              isDocument: true,
              category: doc.documentType,
              isPublicationBlocker: doc.isMandatory,
            });
          }}
          onApproveDocument={(docId) => handleApproveMediaAsset(docId)}
          onFlagIssue={(docId, docName) => {
            setMediaCRModal({
              assetId: docId,
              assetTitle: docName,
            });
            setMediaCRReason('Statutory certificate is incomplete, unverified, or illegible');
            setMediaCRComment('');
          }}
        />
      )}

      {/* ─── TAB: DESIGN & BRANDING TOKENS ───────────────────────────────────── */}
      {activeTab === 'branding' && (
        <DesignBrandingView
          designVerification={designVerification}
          onEditOverride={(key, label, currentValue) => handleOpenOverride(key, label, currentValue)}
          onApproveDesign={() => handleApproveRequirement('branding.themeVariant')}
        />
      )}

      {/* ─── TAB: ISSUES TRACKER & DEFECT BOARD ──────────────────────────────── */}
      {activeTab === 'issues' && (
        <IssuesTrackerView
          issues={detectedIssues}
          onLogIssue={handleLogIssue}
          onResolveIssue={handleResolveIssue}
          onJumpToTarget={(tab) => {
            setActiveTab(tab as any);
          }}
        />
      )}

      {/* ─── TAB: DEVELOPER HANDOFF SPECIFICATION ────────────────────────────── */}
      {activeTab === 'developer-handoff' && (
        <DeveloperHandoffView handoffSpec={handoffSpec} />
      )}

      {/* ─── MODAL: FIELD CHANGE REQUEST ─────────────────────────────────────── */}
      {fieldCRModal && (
        <ModalPortal isOpen={Boolean(fieldCRModal)}>
          <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[var(--admin-card)] text-[var(--admin-text-main)] rounded-3xl max-w-lg w-full border border-[var(--admin-card-border)] shadow-2xl overflow-hidden my-8 animate-fadeIn">
              <div className="p-5 border-b border-[var(--admin-border)] flex items-center justify-between bg-[var(--admin-surface-secondary)]">
                <div>
                  <h3 className="font-bold text-base text-[var(--admin-text-main)]">
                    {fieldCRModal.existingCR ? 'Update Change Request / Correction' : 'Request Change / Correction'}
                  </h3>
                  <p className="text-xs text-[var(--admin-text-sub)]">
                    Direct canonical field correction workflow
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFieldCRModal(null)}
                  className="p-1 rounded-lg text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)] hover:bg-[var(--admin-surface-hover)] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitFieldCR} className="p-5 space-y-4 text-xs">
                {/* Structured Location Hierarchy */}
                <div className="bg-[var(--admin-surface-secondary)] p-3.5 rounded-2xl border border-[var(--admin-border)] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--admin-text-sub)] font-medium">Page Location:</span>
                    <span className="font-bold text-[var(--admin-text-main)]">{fieldCRModal.pageTitle}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--admin-text-sub)] font-medium">Section:</span>
                    <span className="font-semibold text-[var(--admin-text-main)]">{fieldCRModal.sectionTitle}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--admin-text-sub)] font-medium">Field:</span>
                    <span className="font-bold text-[var(--admin-accent)]">{fieldCRModal.fieldLabel}</span>
                  </div>
                  <div className="pt-1.5 border-t border-[var(--admin-border)]">
                    <span className="text-[var(--admin-text-sub)] font-medium block mb-1">Current Submitted Value:</span>
                    <div className="p-2 rounded-xl bg-[var(--admin-card)] font-mono text-[var(--admin-text-main)] border border-[var(--admin-border)] break-words">
                      {fieldCRModal.currentValue || '(empty)'}
                    </div>
                  </div>
                </div>

                {fieldCRModal.existingCR && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Active Change Request Exists (Revision #{fieldCRModal.existingCR.revision_number || 1})</span>
                    </div>
                    <p className="text-[11px] opacity-90">
                      An active change request already exists for this field. Submitting will update and replace it with your new instructions.
                    </p>
                  </div>
                )}

                {/* Reason Dropdown */}
                <div>
                  <label className="block font-bold text-[var(--admin-text-main)] mb-1">
                    Reason for Revision
                  </label>
                  <select
                    value={fieldCRReason}
                    onChange={(e) => setFieldCRReason(e.target.value)}
                    className="w-full bg-[var(--admin-surface-secondary)] text-[var(--admin-text-main)] border border-[var(--admin-border)] rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[var(--admin-accent)]/30"
                  >
                    <option className="bg-[var(--admin-card)] text-[var(--admin-text-main)]" value="Incomplete or inaccurate information">Incomplete or inaccurate information</option>
                    <option className="bg-[var(--admin-card)] text-[var(--admin-text-main)]" value="Typo / Spelling / Grammar error">Typo / Spelling / Grammar error</option>
                    <option className="bg-[var(--admin-card)] text-[var(--admin-text-main)]" value="Formatting does not match standards">Formatting does not match standards</option>
                    <option className="bg-[var(--admin-card)] text-[var(--admin-text-main)]" value="Outdated or expired information">Outdated or expired information</option>
                    <option className="bg-[var(--admin-card)] text-[var(--admin-text-main)]" value="Conflicting with board/campus guidelines">Conflicting with board/campus guidelines</option>
                    <option className="bg-[var(--admin-card)] text-[var(--admin-text-main)]" value="Other">Other</option>
                  </select>
                </div>

                {/* Suggested Value */}
                <div>
                  <label className="block font-bold text-[var(--admin-text-main)] mb-1">
                    Suggested Replacement (Optional)
                  </label>
                  <input
                    type="text"
                    value={fieldCRSuggested}
                    onChange={(e) => setFieldCRSuggested(e.target.value)}
                    placeholder="e.g. Correct official phone number or title"
                    className="w-full bg-[var(--admin-surface-secondary)] text-[var(--admin-text-main)] placeholder:text-[var(--admin-text-muted)] border border-[var(--admin-border)] rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-[var(--admin-accent)]/30"
                  />
                </div>

                {/* Instructions / Comment */}
                <div>
                  <label className="block font-bold text-[var(--admin-text-main)] mb-1">
                    Instructions to School Administration <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={fieldCRComment}
                    onChange={(e) => setFieldCRComment(e.target.value)}
                    placeholder="Explain clearly what the school needs to correct..."
                    className="w-full bg-[var(--admin-surface-secondary)] text-[var(--admin-text-main)] placeholder:text-[var(--admin-text-muted)] border border-[var(--admin-border)] rounded-xl p-3 text-xs focus:outline-hidden focus:ring-2 focus:ring-[var(--admin-accent)]/30"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setFieldCRModal(null)}
                    className="px-4 py-2 text-[var(--admin-text-sub)] hover:text-[var(--admin-text-main)] hover:bg-[var(--admin-surface-hover)] rounded-xl font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isActionLoading || !fieldCRComment.trim()}
                      onClick={(e) => handleSubmitFieldCR(e, false)}
                      className="px-3.5 py-2 bg-[var(--admin-surface-secondary)] hover:bg-[var(--admin-surface-hover)] disabled:opacity-50 text-[var(--admin-text-main)] font-bold rounded-xl text-xs transition-colors cursor-pointer border border-[var(--admin-border)]"
                      title="Save this request and continue reviewing other fields to send together in 1 email"
                    >
                      Save Request (Add More)
                    </button>
                    <button
                      type="button"
                      disabled={isActionLoading || !fieldCRComment.trim()}
                      onClick={(e) => handleSubmitFieldCR(e, true)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Save &amp; Send All Now</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ─── MODAL: FIELD REVISION & REQUEST HISTORY ──────────────────────────── */}
      {historyModal && (
        <ModalPortal isOpen={Boolean(historyModal)}>
          <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[var(--admin-card)] text-[var(--admin-text-main)] rounded-3xl max-w-2xl w-full border border-[var(--admin-card-border)] shadow-2xl overflow-hidden my-8 animate-fadeIn">
              <div className="p-5 border-b border-[var(--admin-border)] flex items-center justify-between bg-[var(--admin-surface-secondary)]">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[var(--admin-accent)]/10 text-[var(--admin-accent)] flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[var(--admin-text-main)]">
                      Field Revision &amp; Request History
                    </h3>
                    <p className="text-xs text-[var(--admin-text-sub)]">
                      {historyModal.fieldLabel} &bull; <span className="font-mono">{historyModal.fieldKey}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setHistoryModal(null)}
                  className="p-1.5 rounded-xl text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)] hover:bg-[var(--admin-surface-hover)] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4 text-xs">
                {isLoadingHistory ? (
                  <div className="p-8 text-center text-[var(--admin-text-sub)] flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--admin-accent)]" />
                    <span>Loading revision history...</span>
                  </div>
                ) : !historyData || (historyData.changeRequests.length === 0 && historyData.auditEvents.length === 0) ? (
                  <div className="p-8 text-center text-[var(--admin-text-sub)] bg-[var(--admin-surface-secondary)] rounded-2xl border border-[var(--admin-border)]">
                    No change requests or revisions recorded yet for this field.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Change Requests / Revisions */}
                    {historyData.changeRequests.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-bold uppercase tracking-wider text-[10px] text-[var(--admin-text-sub)]">
                          Change Request Records ({historyData.changeRequests.length})
                        </h4>
                        {historyData.changeRequests.map((cr: any) => (
                          <div
                            key={cr.id}
                            className="p-4 rounded-2xl bg-[var(--admin-surface-secondary)] border border-[var(--admin-border)] space-y-2.5"
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[var(--admin-text-main)]">
                                  Revision #{cr.revision_number || 1}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
                                  {cr.status}
                                </span>
                              </div>
                              <span className="text-[10px] text-[var(--admin-text-sub)]">
                                {new Date(cr.created_at).toLocaleString()}
                              </span>
                            </div>

                            <div className="bg-[var(--admin-card)] p-2.5 rounded-xl border border-[var(--admin-border-subtle)] space-y-1">
                              <span className="text-[10px] font-bold text-rose-600 block uppercase tracking-wider">
                                Reviewer Instructions:
                              </span>
                              <p className="text-slate-800 dark:text-slate-200">{cr.request_comment}</p>
                            </div>

                            {cr.suggested_value && (
                              <div className="text-[11px]">
                                <span className="text-[var(--admin-text-sub)] font-medium">Suggested: </span>
                                <span className="font-mono font-semibold">{cr.suggested_value}</span>
                              </div>
                            )}

                            {cr.school_response && (
                              <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl space-y-1">
                                <div className="flex items-center justify-between text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">
                                  <span>School Response</span>
                                  {cr.school_updated_at && (
                                    <span>{new Date(cr.school_updated_at).toLocaleString()}</span>
                                  )}
                                </div>
                                <p className="text-emerald-950 dark:text-emerald-200 font-medium">
                                  {cr.school_response}
                                </p>
                                {cr.school_updated_value && (
                                  <div className="text-[11px] font-mono text-emerald-800 dark:text-emerald-300 font-bold pt-1">
                                    Updated Value: {cr.school_updated_value}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Audit Events */}
                    {historyData.auditEvents.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-[var(--admin-border)]">
                        <h4 className="font-bold uppercase tracking-wider text-[10px] text-[var(--admin-text-sub)]">
                          Audit Trail ({historyData.auditEvents.length})
                        </h4>
                        <div className="space-y-1.5">
                          {historyData.auditEvents.map((ev: any) => (
                            <div
                              key={ev.id}
                              className="p-2.5 rounded-xl bg-[var(--admin-surface-secondary)]/60 text-[11px] flex items-center justify-between gap-3"
                            >
                              <div>
                                <span className="font-bold text-[var(--admin-text-main)]">
                                  {ev.event_type.replace(/_/g, ' ')}
                                </span>
                                <span className="text-[var(--admin-text-sub)] ml-2">
                                  by {ev.performed_by_name || ev.performed_by_role || 'User'}
                                </span>
                              </div>
                              <span className="text-[10px] text-[var(--admin-text-muted)] shrink-0">
                                {new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-[var(--admin-border)] bg-[var(--admin-surface-secondary)] flex justify-end">
                <button
                  type="button"
                  onClick={() => setHistoryModal(null)}
                  className="px-4 py-2 bg-[var(--admin-card)] hover:bg-[var(--admin-surface-hover)] text-[var(--admin-text-main)] border border-[var(--admin-border)] font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ─── MODAL: MEDIA CHANGE REQUEST ─────────────────────────────────────── */}
      {mediaCRModal && (
        <ModalPortal isOpen={Boolean(mediaCRModal)}>
          <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[var(--admin-card)] text-[var(--admin-text-main)] rounded-3xl max-w-lg w-full border border-[var(--admin-card-border)] shadow-2xl overflow-hidden my-8 animate-fadeIn">
              <div className="p-5 border-b border-[var(--admin-border)] flex items-center justify-between bg-[var(--admin-surface-secondary)]">
                <div>
                  <h3 className="font-bold text-base text-[var(--admin-text-main)]">
                    Request Asset Replacement
                  </h3>
                  <p className="text-xs text-[var(--admin-text-sub)]">{mediaCRModal.assetTitle}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMediaCRModal(null)}
                  className="p-1 rounded-lg text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)] hover:bg-[var(--admin-surface-hover)] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitMediaCR} className="p-5 space-y-4 text-xs">
                {mediaCRModal.currentUrl && (
                  checkIsDocument({ url: mediaCRModal.currentUrl, title: mediaCRModal.assetTitle }) ? (
                    <div className="p-4 bg-[var(--admin-surface-secondary)] border border-[var(--admin-border)] rounded-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20 shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-[var(--admin-text-main)] truncate">
                            {mediaCRModal.assetTitle}
                          </p>
                          <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold uppercase">
                            Official Document (PDF)
                          </p>
                        </div>
                      </div>
                      <a
                        href={mediaCRModal.currentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-[var(--admin-card)] hover:bg-[var(--admin-surface-hover)] text-[11px] font-bold text-[var(--admin-text-main)] border border-[var(--admin-border)] flex items-center gap-1 shrink-0 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>View</span>
                      </a>
                    </div>
                  ) : (
                    <div className="aspect-video bg-[var(--admin-surface-secondary)] border border-[var(--admin-border)] rounded-xl overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={mediaCRModal.currentUrl} alt="Current" className="w-full h-full object-cover" />
                    </div>
                  )
                )}

                <div>
                  <label className="block font-bold text-[var(--admin-text-main)] mb-1">
                    Replacement Reason
                  </label>
                  <select
                    value={mediaCRReason}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMediaCRReason(val);
                      const matched = STRUCTURED_REPLACEMENT_REASONS.find((r) => r.label === val);
                      if (matched && !mediaCRComment.trim()) {
                        setMediaCRComment(matched.description);
                      }
                    }}
                    className="w-full bg-[var(--admin-surface-secondary)] text-[var(--admin-text-main)] border border-[var(--admin-border)] rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[var(--admin-accent)]/30"
                  >
                    <optgroup label="Document &amp; Statutory Reasons (Canonical)">
                      {STRUCTURED_REPLACEMENT_REASONS.map((r) => (
                        <option
                          key={r.id}
                          className="bg-[var(--admin-card)] text-[var(--admin-text-main)]"
                          value={r.label}
                        >
                          {r.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Image &amp; Photo Reasons">
                      <option className="bg-[var(--admin-card)] text-[var(--admin-text-main)]" value="Low resolution or poor aspect ratio">Low resolution or poor aspect ratio</option>
                      <option className="bg-[var(--admin-card)] text-[var(--admin-text-main)]" value="Watermarked or copyrighted image">Watermarked or copyrighted image</option>
                      <option className="bg-[var(--admin-card)] text-[var(--admin-text-main)]" value="Incorrect or outdated campus photo">Incorrect or outdated campus photo</option>
                      <option className="bg-[var(--admin-card)] text-[var(--admin-text-main)]" value="Bad lighting or blurry photo">Bad lighting or blurry photo</option>
                      <option className="bg-[var(--admin-card)] text-[var(--admin-text-main)]" value="Transparent background required for logo">Transparent background required for logo</option>
                    </optgroup>
                    <option className="bg-[var(--admin-card)] text-[var(--admin-text-main)]" value="Other">Other</option>
                  </select>

                  {checkIsDocument({ url: mediaCRModal.currentUrl, title: mediaCRModal.assetTitle }) && (
                    <div className="space-y-1.5 pt-2">
                      <label className="text-[10px] font-bold text-[var(--admin-text-sub)] uppercase tracking-wider">
                        Quick Document Reasons:
                      </label>
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1.5 rounded-xl bg-[var(--admin-surface-secondary)] border border-[var(--admin-border)]">
                        {STRUCTURED_REPLACEMENT_REASONS.map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => {
                              setMediaCRReason(r.label);
                              setMediaCRComment(r.description);
                            }}
                            className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer text-left ${
                              mediaCRReason === r.label
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-[var(--admin-card)] text-[var(--admin-text-main)] hover:bg-slate-200 dark:hover:bg-slate-700 border border-[var(--admin-border)]'
                            }`}
                            title={r.description}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-[var(--admin-text-main)] mb-1">
                    Instructions to School Administration <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={mediaCRComment}
                    onChange={(e) => setMediaCRComment(e.target.value)}
                    placeholder="Specify resolution guidelines, format, or required photo details..."
                    className="w-full bg-[var(--admin-surface-secondary)] text-[var(--admin-text-main)] placeholder:text-[var(--admin-text-muted)] border border-[var(--admin-border)] rounded-xl p-3 text-xs focus:outline-hidden focus:ring-2 focus:ring-[var(--admin-accent)]/30"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setMediaCRModal(null)}
                    className="px-4 py-2 text-[var(--admin-text-sub)] hover:text-[var(--admin-text-main)] hover:bg-[var(--admin-surface-hover)] rounded-xl font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isActionLoading || !mediaCRComment.trim()}
                      onClick={(e) => handleSubmitMediaCR(e, false)}
                      className="px-3.5 py-2 bg-[var(--admin-surface-secondary)] hover:bg-[var(--admin-surface-hover)] disabled:opacity-50 text-[var(--admin-text-main)] font-bold rounded-xl text-xs transition-colors cursor-pointer border border-[var(--admin-border)]"
                      title="Save this request and continue reviewing other items to send together in 1 email"
                    >
                      Save Request (Add More)
                    </button>
                    <button
                      type="button"
                      disabled={isActionLoading || !mediaCRComment.trim()}
                      onClick={(e) => handleSubmitMediaCR(e, true)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Save &amp; Send All Now</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ─── MODAL: RAW SUBMISSION JSON ──────────────────────────────────────── */}
      {showRawJsonModal && (
        <ModalPortal isOpen={showRawJsonModal}>
          <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[var(--admin-card)] text-[var(--admin-text-main)] rounded-3xl max-w-4xl w-full border border-[var(--admin-card-border)] shadow-2xl overflow-hidden my-8 animate-fadeIn">
              <div className="p-5 border-b border-[var(--admin-border)] flex items-center justify-between bg-[var(--admin-surface-secondary)]">
                <div>
                  <h3 className="font-bold text-base text-[var(--admin-text-main)]">
                    Raw Intake Submission Payload (Audit &amp; Debug)
                  </h3>
                  <p className="text-xs text-[var(--admin-text-sub)]">
                    Submission ID: {currentSubmission?.id || 'N/A'} &bull; Version: {currentSubmission?.version_number || 1}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (currentSubmission) {
                        navigator.clipboard.writeText(JSON.stringify(currentSubmission.intake_payload, null, 2));
                        setActionMessage({ text: 'Raw JSON copied to clipboard!', type: 'success' });
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[var(--admin-surface-secondary)] hover:bg-[var(--admin-surface-hover)] text-xs font-bold text-[var(--admin-text-main)] border border-[var(--admin-border)] transition-colors cursor-pointer"
                  >
                    Copy JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRawJsonModal(false)}
                    className="p-1 rounded-lg text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)] hover:bg-[var(--admin-surface-hover)] transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-5">
                <div className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto max-h-[500px]">
                  <pre>{JSON.stringify(currentSubmission?.intake_payload || {}, null, 2)}</pre>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ─── MODAL: ASSET LIGHTBOX / TWO-PANEL DOCUMENT INSPECTION WORKSPACE ── */}
      {previewingAsset && (
        <ModalPortal isOpen={Boolean(previewingAsset)}>
          <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            {checkIsDocument(previewingAsset) ? (
              /* ── TWO-PANEL DOCUMENT INSPECTION MODAL ── */
              <div className="bg-[var(--admin-card)] text-[var(--admin-text-main)] rounded-3xl max-w-7xl w-full h-[92vh] border border-[var(--admin-card-border)] shadow-2xl overflow-hidden flex flex-col animate-fadeIn my-auto">
                {/* Header */}
                <div className="p-4 border-b border-[var(--admin-border)] flex items-center justify-between bg-[var(--admin-surface-secondary)] shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm text-[var(--admin-text-main)] truncate" title={previewingAsset.title}>
                          {previewingAsset.title}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          {activeDocDefinition?.category || 'STATUTORY'}
                        </span>
                        {previewingAsset.isPublicationBlocker && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            Publication Blocker
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--admin-text-sub)] truncate">
                        {previewingAsset.sourceSectionLabel}
                        {previewingAsset.fileName ? ` • ${previewingAsset.fileName}` : ' • Not Uploaded'}
                        {previewingAsset.fileSize ? ` • ${formatBytes(previewingAsset.fileSize)}` : ''}
                        {activeDocDefinition?.governingAuthority ? ` • ${activeDocDefinition.governingAuthority}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {previewingAsset.url && (
                      <>
                        <a
                          href={previewingAsset.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-[var(--admin-card)] hover:bg-[var(--admin-surface-hover)] text-xs font-bold text-[var(--admin-text-main)] flex items-center gap-1.5 transition-colors border border-[var(--admin-border)]"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>New Tab</span>
                        </a>
                        <a
                          href={previewingAsset.url}
                          download={previewingAsset.fileName || 'document.pdf'}
                          className="px-3 py-1.5 rounded-lg bg-[var(--admin-card)] hover:bg-[var(--admin-surface-hover)] text-xs font-bold text-[var(--admin-text-main)] flex items-center gap-1.5 transition-colors border border-[var(--admin-border)]"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </a>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => setPreviewingAsset(null)}
                      className="p-1.5 rounded-lg text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)] hover:bg-[var(--admin-surface-hover)] transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* 2-Panel Body */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
                  {/* Left: Interactive PDF Viewer (60% width = 7 columns) */}
                  <div className="lg:col-span-7 h-full flex flex-col bg-slate-950 border-r border-[var(--admin-border)] overflow-hidden">
                    <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="font-medium text-slate-300 truncate max-w-xs">
                          {previewingAsset.fileName || `${previewingAsset.title}.pdf`}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 shrink-0">
                        Interactive PDF Viewer • Multi-page Support
                      </span>
                    </div>

                    <div className="flex-1 min-h-0 bg-slate-900 flex items-center justify-center relative">
                      {previewingAsset.url ? (
                        <iframe
                          src={previewingAsset.url}
                          title={previewingAsset.title}
                          className="w-full h-full border-0 bg-white"
                        />
                      ) : (
                        <div className="p-8 text-center max-w-md mx-auto space-y-3">
                          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mx-auto">
                            <ShieldAlert className="w-7 h-7" />
                          </div>
                          <h4 className="text-base font-bold text-white">Document Not Yet Uploaded</h4>
                          <p className="text-xs text-slate-400">
                            The school has not submitted this statutory certificate or legal document yet. Review the required fields and verification checklist on the right to verify requirements.
                          </p>
                          <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Requires School Submission
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Metadata + Comparison Table + Checklist + Actions (40% width = 5 columns) */}
                  <div className="lg:col-span-5 h-full overflow-y-auto p-5 space-y-6 bg-[var(--admin-card)]">
                    {/* Document Details Card */}
                    <div className="p-4 rounded-2xl bg-[var(--admin-surface-secondary)] border border-[var(--admin-border)] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--admin-text-sub)]">Authority:</span>
                        <span className="text-xs font-bold text-[var(--admin-text-main)] text-right truncate max-w-[200px]">
                          {activeDocDefinition?.governingAuthority || 'Official Board / Department'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--admin-text-sub)]">Source Section:</span>
                        <span className="text-xs font-semibold text-[var(--admin-text-main)]">
                          {previewingAsset.sourceSectionLabel}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--admin-text-sub)]">Website Publication:</span>
                        <span className="text-xs font-semibold text-[var(--admin-text-main)] truncate max-w-[200px]">
                          {previewingAsset.usages?.join(', ') || 'Statutory Disclosures'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--admin-text-sub)]">Publication Blocker:</span>
                        <span className="text-xs font-bold text-[var(--admin-text-main)]">
                          {previewingAsset.isPublicationBlocker ? 'Yes (Mandatory Blocker)' : 'No (Optional Proof)'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--admin-text-sub)]">Validation Status:</span>
                        <span className="text-xs font-bold">
                          {activeDerivedStatus === 'VALID' && (
                            <span className="text-emerald-600 dark:text-emerald-400">VALID (Automated Checks Passed)</span>
                          )}
                          {activeDerivedStatus === 'REQUIRES_MANUAL_VERIFICATION' && (
                            <span className="text-amber-600 dark:text-amber-400">REQUIRES HUMAN VERIFICATION</span>
                          )}
                          {activeDerivedStatus === 'EXPIRED' && (
                            <span className="text-rose-600 dark:text-rose-400">EXPIRED VALIDITY</span>
                          )}
                          {activeDerivedStatus === 'INVALID' && (
                            <span className="text-rose-600 dark:text-rose-400">INVALID / MISMATCHED</span>
                          )}
                          {activeDerivedStatus === 'MISSING' && (
                            <span className="text-slate-500">NOT UPLOADED</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Expired Warning Banner */}
                    {activeDerivedStatus === 'EXPIRED' && (
                      <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                          <span>Statutory Validity Period Expired</span>
                        </div>
                        <p className="text-[11px] text-rose-600/90 dark:text-rose-400/90">
                          This certificate or NOC is past its stated expiration date. Approval is locked until an authorized renewal or extension order is provided.
                        </p>
                      </div>
                    )}

                    {/* Structured Comparison Table */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-[var(--admin-text-main)] uppercase tracking-wider flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Intake Records vs. Certificate Data</span>
                        </h4>
                        <span className="text-[10px] text-[var(--admin-text-sub)] font-semibold">
                          Human Review Standard
                        </span>
                      </div>

                      <div className="rounded-2xl border border-[var(--admin-border)] overflow-hidden bg-[var(--admin-surface-secondary)]">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-[var(--admin-border)] bg-[var(--admin-card)] text-[10px] font-bold text-[var(--admin-text-sub)] uppercase">
                              <th className="py-2.5 px-3">Field</th>
                              <th className="py-2.5 px-3">School Entered</th>
                              <th className="py-2.5 px-3">Extracted / Scanned</th>
                              <th className="py-2.5 px-3 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--admin-border)] text-[11px]">
                            {activeComparisonFields.map((f) => (
                              <tr key={f.fieldId} className="hover:bg-[var(--admin-surface-hover)] transition-colors">
                                <td className="py-2.5 px-3 font-semibold text-[var(--admin-text-main)]">
                                  {f.label}
                                </td>
                                <td className="py-2.5 px-3 text-[var(--admin-text-main)] font-mono text-[10px]">
                                  {f.enteredValue || (
                                    <span className="text-[var(--admin-text-muted)] italic">Not Provided</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3">
                                  {(f as any).extractedValue ? (
                                    <span className="font-mono text-[10px] text-[var(--admin-text-main)]">{(f as any).extractedValue}</span>
                                  ) : (
                                    <span className="text-[10px] text-amber-600 dark:text-amber-400 italic font-medium">
                                      Manual verification required — value could not be extracted automatically.
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                  {f.comparisonStatus === 'MATCH' && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                      <Check className="w-2.5 h-2.5" />
                                      MATCH
                                    </span>
                                  )}
                                  {f.comparisonStatus === 'MISMATCH' && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                      <AlertCircle className="w-2.5 h-2.5" />
                                      MISMATCH
                                    </span>
                                  )}
                                  {f.comparisonStatus === 'REQUIRES_MANUAL_VERIFICATION' && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                      <Clock className="w-2.5 h-2.5" />
                                      MANUAL
                                    </span>
                                  )}
                                  {f.comparisonStatus === 'NOT_APPLICABLE' && (
                                    <span className="text-[9px] text-[var(--admin-text-muted)]">N/A</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Contextual Verification Checklist */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-[var(--admin-text-main)] uppercase tracking-wider flex items-center gap-1.5">
                          <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Verification Checklist</span>
                        </h4>
                        <span className="text-[11px] font-bold text-slate-500">
                          {activeDocDefinition?.verificationChecklist.filter((c) => checkedVerificationItems[`${previewingAsset.id}-${c.id}`]).length || 0} of {activeDocDefinition?.verificationChecklist.length || 0} Verified
                        </span>
                      </div>

                      <div className="space-y-2">
                        {activeDocDefinition?.verificationChecklist.map((item) => {
                          const isChecked = Boolean(checkedVerificationItems[`${previewingAsset.id}-${item.id}`]);
                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                setCheckedVerificationItems((prev) => ({
                                  ...prev,
                                  [`${previewingAsset.id}-${item.id}`]: !prev[`${previewingAsset.id}-${item.id}`],
                                }));
                              }}
                              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                                isChecked
                                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300/80 dark:border-emerald-800'
                                  : 'bg-[var(--admin-surface-secondary)] border-[var(--admin-border)] hover:border-slate-400'
                              }`}
                            >
                              <div className="mt-0.5 shrink-0 text-emerald-600">
                                {isChecked ? (
                                  <CheckSquare className="w-4 h-4 fill-emerald-600 text-white" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className={`text-xs font-bold ${isChecked ? 'text-emerald-900 dark:text-emerald-200 line-through opacity-80' : 'text-[var(--admin-text-main)]'}`}>
                                    {item.label}
                                  </p>
                                  <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase shrink-0">
                                    {item.category}
                                  </span>
                                </div>
                                <p className="text-[10px] text-[var(--admin-text-sub)] mt-0.5">
                                  {item.hint}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Revision & Audit History */}
                    {activeDocCRHistory.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-[var(--admin-border)]">
                        <h4 className="text-xs font-bold text-[var(--admin-text-main)] uppercase tracking-wider flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>Revision &amp; Change Request History ({activeDocCRHistory.length})</span>
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {activeDocCRHistory.map((cr) => (
                            <div
                              key={cr.id}
                              className="p-3 rounded-xl bg-[var(--admin-surface-secondary)] border border-[var(--admin-border)] space-y-1"
                            >
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                  {cr.status.replace(/_/g, ' ')}
                                </span>
                                <span className="text-[var(--admin-text-muted)] font-mono">
                                  {new Date(cr.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-[var(--admin-text-main)]">
                                {cr.reason}
                              </p>
                              {cr.request_comment && (
                                <p className="text-[11px] text-[var(--admin-text-sub)] italic">
                                  &ldquo;{cr.request_comment}&rdquo;
                                </p>
                              )}
                              {cr.school_response && (
                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                  School Response: &ldquo;{cr.school_response}&rdquo;
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Review Decision Action Bar */}
                    <div className="pt-4 border-t border-[var(--admin-border)] space-y-3">
                      <h4 className="text-xs font-bold text-[var(--admin-text-main)] uppercase tracking-wider">
                        Review Decision
                      </h4>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={async () => {
                            await handleApproveMediaAsset(previewingAsset.id);
                            setPreviewingAsset(null);
                          }}
                          disabled={
                            isActionLoading ||
                            !previewingAsset.url ||
                            activeDerivedStatus === 'EXPIRED' ||
                            activeDerivedStatus === 'INVALID'
                          }
                          title={
                            !previewingAsset.url
                              ? 'Document has not been uploaded yet'
                              : activeDerivedStatus === 'EXPIRED'
                              ? 'Cannot approve expired certificate or NOC'
                              : activeDerivedStatus === 'INVALID'
                              ? 'Cannot approve document with severe mismatches'
                              : 'Approve Document'
                          }
                          className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Approve Document</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const asset = previewingAsset;
                            setPreviewingAsset(null);
                            setMediaCRModal({
                              assetId: asset.id,
                              assetTitle: asset.title,
                              currentUrl: asset.url,
                            });
                            setMediaCRReason('Illegible or blurry scanned document');
                            setMediaCRComment('');
                          }}
                          className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                        >
                          <AlertCircle className="w-4 h-4" />
                          <span>Request Replacement</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ── STANDARD PHOTO / IMAGE LIGHTBOX PREVIEW ── */
              <div className="bg-[var(--admin-card)] text-[var(--admin-text-main)] rounded-3xl max-w-4xl w-full border border-[var(--admin-card-border)] shadow-2xl overflow-hidden my-8 animate-fadeIn">
                <div className="p-4 border-b border-[var(--admin-border)] flex items-center justify-between bg-[var(--admin-surface-secondary)]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-500 border border-violet-500/20 flex items-center justify-center shrink-0">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-[var(--admin-text-main)] truncate" title={previewingAsset.title}>
                        {previewingAsset.title}
                      </h3>
                      <p className="text-xs text-[var(--admin-text-sub)] truncate">
                        {previewingAsset.sourceSectionLabel}
                        {previewingAsset.fileName ? ` • ${previewingAsset.fileName}` : ''}
                        {previewingAsset.fileSize ? ` • ${formatBytes(previewingAsset.fileSize)}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {previewingAsset.url && (
                      <a
                        href={previewingAsset.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-[var(--admin-card)] hover:bg-[var(--admin-surface-hover)] text-xs font-bold text-[var(--admin-text-main)] flex items-center gap-1.5 transition-colors border border-[var(--admin-border)]"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open in New Tab</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setPreviewingAsset(null)}
                      className="p-1 rounded-lg text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)] hover:bg-[var(--admin-surface-hover)] transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-slate-950 flex items-center justify-center min-h-[50vh] max-h-[70vh] overflow-hidden">
                  {previewingAsset.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewingAsset.url}
                      alt={previewingAsset.title}
                      className="max-h-[60vh] w-auto object-contain rounded-lg"
                    />
                  ) : (
                    <div className="py-12 text-slate-500 text-xs">No image preview URL recorded</div>
                  )}
                </div>

                <div className="p-4 text-xs space-y-3 bg-[var(--admin-card)] border-t border-[var(--admin-border)]">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--admin-text-sub)]">Website Usages:</span>
                    <span className="font-bold text-[var(--admin-text-main)]">
                      {previewingAsset.usages?.join(', ') || 'Official Verification'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--admin-text-sub)]">Publication Blocker:</span>
                    <span className="font-bold text-[var(--admin-text-main)]">
                      {previewingAsset.isPublicationBlocker ? 'Yes (Mandatory)' : 'No (Optional)'}
                    </span>
                  </div>
                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-[var(--admin-border)]">
                    <button
                      type="button"
                      onClick={async () => {
                        await handleApproveMediaAsset(previewingAsset.id);
                        setPreviewingAsset(null);
                      }}
                      disabled={isActionLoading}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const asset = previewingAsset;
                        setPreviewingAsset(null);
                        setMediaCRModal({
                          assetId: asset.id,
                          assetTitle: asset.title,
                          currentUrl: asset.url,
                        });
                        setMediaCRReason('Low resolution or poor aspect ratio');
                        setMediaCRComment('');
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Request Replacement
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ModalPortal>
      )}

      {/* ─── MODAL: ADMIN NON-DESTRUCTIVE VALUE OVERRIDE ────────────────────── */}
      <AdminOverrideModal
        isOpen={adminOverrideModal.isOpen}
        onClose={() => setAdminOverrideModal((prev) => ({ ...prev, isOpen: false }))}
        fieldKey={adminOverrideModal.fieldKey}
        fieldLabel={adminOverrideModal.fieldLabel}
        originalValue={adminOverrideModal.originalValue}
        currentValue={adminOverrideModal.currentValue}
        onSave={handleSaveAdminOverride}
        isLoading={isActionLoading}
      />

      {/* ─── MODAL: 7-POINT PRE-PUBLICATION FINAL APPROVAL GATE ──────────────── */}
      <FinalApprovalGateModal
        isOpen={isApprovalGateOpen}
        onClose={() => setIsApprovalGateOpen(false)}
        scorecard={scorecard}
        onConfirmApproval={handleFinalApprove}
        onNavigateToTab={(tabKey) => setActiveTab(tabKey as any)}
        isLoading={isActionLoading}
      />
    </div>
  );
}
