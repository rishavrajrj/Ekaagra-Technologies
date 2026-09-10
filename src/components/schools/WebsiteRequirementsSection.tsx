'use client';

import React, { useState, useMemo, useEffect } from 'react';
import ModalPortal from '@/components/ui/ModalPortal';

import {
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
  Sparkles,
  Layers,
  ShieldCheck,
  Building,
  Image as ImageIcon,
  FileText,
  FileCheck,
  Info,
  DollarSign,
  Phone,
  Mail,
  Eye,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Edit2,
  X,
  ArrowRight,
  CheckCheck,
  Filter,
  Search,
  Lock,
  Unlock,
  AlertCircle,
  FileDown,
  History,
  RefreshCw,
} from 'lucide-react';
import {
  approveWebsiteSpecificationAction,
  reopenWebsiteSpecificationAction,
} from '@/app/schoolProjectActions';
import {
  validateServerApprovalPreconditions,
  approveWebsiteSpecification,
  detectSpecificationInvalidation,
  type PreconditionValidationResult,
  type ApprovalInvalidationResult,
} from '@/lib/websiteSpecificationContract';
import type {
  UniversalIntakeData,
  WebsitePageConfiguration,
  WebsitePageRequirement,
  WebsiteMandatoryDisclosureConfig,
  WebsitePrivacyPolicyConfig,
  CustomPageType,
  CampusImageCategory,
  WebsiteFieldState,
} from '@/lib/types';
import {
  STANDARD_WEBSITE_PAGES,
  autoFillPageRequirements,
  evaluatePageStatus,
  generatePrivacyPolicyTemplate,
  generateMandatoryDisclosureConfig,
  generateWebsiteDeveloperSpec,
  getCampusGalleryCategoryCounts,
  findStatutoryDocumentsInChecklist,
  buildWebsitePageConfigurations,
  aggregateWebsiteRequirementStates,
  calculateWebsiteReadinessBreakdown,
  detectDuplicatePageRisks,
  resolveCanonicalAsset,
  type WebsiteRequirementAggregates,
  type WebsiteReadinessBreakdown,
  type DuplicatePageRisk,
  type CanonicalResolvedAsset,
} from '@/lib/websitePageRequirements';
import { COMMUNICATION_STYLE_CONFIGS, type StyleConfig } from './CommunicationStyleVisuals';
import { deriveSlugFromSchoolName } from '@/lib/schoolIntake';

function normalizeBrandTone(tone?: string): string {
  if (!tone) return 'Modern & Vibrant';
  const lower = tone.toLowerCase().trim();
  if (lower.includes('trad') || lower.includes('prestig')) return 'Traditional & Prestigious';
  if (lower.includes('mod') || lower.includes('vibr')) return 'Modern & Vibrant';
  if (lower.includes('min') || lower.includes('clean')) return 'Minimal & Contemporary';
  return 'Modern & Vibrant';
}

export interface WebsiteRequirementsSectionProps {
  token?: string;
  intakeData: Partial<UniversalIntakeData>;
  updateSectionField: (section: any, field: string, value: any) => void;
  onNavigateToBranding?: () => void;
  onNavigateToSection?: (sectionKey: any) => void;
  setPreviewingStyle?: (style: StyleConfig) => void;
}

interface ModalItemTarget {
  pageKey: string;
  pageLabel: string;
  requirement: WebsitePageRequirement;
}

export function WebsiteRequirementsSection({
  token,
  intakeData,
  updateSectionField,
  onNavigateToBranding,
  onNavigateToSection,
  setPreviewingStyle,
}: WebsiteRequirementsSectionProps) {
  const brandTone = normalizeBrandTone(intakeData.brandingDesign?.brandTone);
  const activeStyleConfig =
    COMMUNICATION_STYLE_CONFIGS.find((s: StyleConfig) => s.value === brandTone) || COMMUNICATION_STYLE_CONFIGS[1];
  const ActiveIcon = activeStyleConfig.icon;

  const campuses = intakeData.campuses || [];
  const primaryCampus = campuses.find((c) => c.isMainCampus) || campuses[0] || ({} as any);
  const selectedPages: string[] = intakeData.websiteRequirements?.requiredPages || [];

  // Local state for expanded page cards
  const [expandedPages, setExpandedPages] = useState<Record<string, boolean>>({
    Home: true,
  });

  // Local state for privacy policy modal
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [privacyPolicyDraft, setPrivacyPolicyDraft] = useState('');

  // Active filter: 'all' | 'needs_action' | 'confirmed' | 'missing' | 'generated' | 'future_cms'
  const [activeFilter, setActiveFilter] = useState<'all' | 'needs_action' | 'confirmed' | 'missing' | 'generated' | 'future_cms'>('all');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Single-item verification modal
  const [activeModalItem, setActiveModalItem] = useState<ModalItemTarget | null>(null);
  const [modalEditValue, setModalEditValue] = useState<string>('');
  const [isEditingModalValue, setIsEditingModalValue] = useState(false);
  const [modalConflictSelectedValue, setModalConflictSelectedValue] = useState<string>('');
  const [modalConflictIsCustom, setModalConflictIsCustom] = useState(false);

  // Guided multi-step review workflow modal
  const [isGuidedReviewOpen, setIsGuidedReviewOpen] = useState(false);
  const [isGuidedReviewComplete, setIsGuidedReviewComplete] = useState(false);
  const [guidedReviewIndex, setGuidedReviewIndex] = useState(0);
  const [guidedEditValue, setGuidedEditValue] = useState<string>('');
  const [isGuidedEditing, setIsGuidedEditing] = useState(false);
  const [guidedConflictSelectedValue, setGuidedConflictSelectedValue] = useState<string>('');
  const [guidedConflictIsCustom, setGuidedConflictIsCustom] = useState(false);

  // Initialize or retrieve page configurations (prunes stale non-custom pages on scope changes)
  const pageConfigurations: Record<string, WebsitePageConfiguration> = useMemo(() => {
    let baseConfigs: Record<string, WebsitePageConfiguration>;
    if (intakeData.websiteRequirements?.pageConfigurations && Object.keys(intakeData.websiteRequirements.pageConfigurations).length > 0) {
      baseConfigs = intakeData.websiteRequirements.pageConfigurations;
    } else {
      baseConfigs = buildWebsitePageConfigurations(intakeData);
    }

    const requiredSet = new Set(intakeData.websiteRequirements?.requiredPages || []);
    const cleanConfigs: Record<string, WebsitePageConfiguration> = {};
    for (const [key, cfg] of Object.entries(baseConfigs)) {
      if (cfg.isCustom || key.startsWith('custom_') || requiredSet.has(key)) {
        cleanConfigs[key] = cfg;
      }
    }
    return cleanConfigs;
  }, [intakeData]);

  // Aggregated requirement metrics - Single source of truth
  const aggregates: WebsiteRequirementAggregates = useMemo(() => {
    return aggregateWebsiteRequirementStates(pageConfigurations);
  }, [pageConfigurations]);

  // Comprehensive separated readiness breakdown (pages, content, actual assets, statutory compliance, duplicate risks)
  const readinessBreakdown: WebsiteReadinessBreakdown = useMemo(() => {
    return calculateWebsiteReadinessBreakdown(intakeData, pageConfigurations);
  }, [intakeData, pageConfigurations]);

  // Sign-Off & Lifecycle Modal States
  const [isSignOffModalOpen, setIsSignOffModalOpen] = useState(false);
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [signOffName, setSignOffName] = useState('');
  const [signOffEmail, setSignOffEmail] = useState('');
  const [signOffRole, setSignOffRole] = useState('Super Administrator');
  const [signOffNotes, setSignOffNotes] = useState('');
  const [signOffDeclared, setSignOffDeclared] = useState(false);
  const [signOffError, setSignOffError] = useState<string | null>(null);
  const [isSigningOff, setIsSigningOff] = useState(false);

  // Sync default approver details from Super Admin / Principal
  useEffect(() => {
    const adminName =
      intakeData.usersAccess?.superAdminFullName ||
      intakeData.schoolProfile?.principalName ||
      'School Administrator';
    const adminEmail =
      intakeData.usersAccess?.superAdminEmail ||
      intakeData.schoolProfile?.officialEmail ||
      (intakeData.schoolProfile as any)?.contactEmail ||
      '';
    setSignOffName(adminName);
    setSignOffEmail(adminEmail);
  }, [intakeData]);

  // Server-authoritative preconditions & blocker checks
  const serverPreconditions: PreconditionValidationResult = useMemo(() => {
    return validateServerApprovalPreconditions(intakeData, pageConfigurations);
  }, [intakeData, pageConfigurations]);

  // Real-time invalidation detection against frozen approved specification
  const currentApproval = intakeData.websiteRequirements?.currentApproval;
  const invalidationResult: ApprovalInvalidationResult = useMemo(() => {
    return detectSpecificationInvalidation(currentApproval, intakeData, pageConfigurations);
  }, [currentApproval, intakeData, pageConfigurations]);

  // Unified approval flags
  const isApproved = Boolean(
    intakeData.websiteRequirements?.websiteApproved ||
    (currentApproval && currentApproval.status === 'approved' && !invalidationResult.isInvalidated)
  );
  const isInvalidated = Boolean(
    (currentApproval && currentApproval.status === 'approved' && invalidationResult.isInvalidated) ||
    (!currentApproval && intakeData.websiteRequirements?.websiteApproved && invalidationResult.isInvalidated)
  );
  const canApprove = serverPreconditions.canApprove;
  const isWebsiteApproved = isApproved;
  const websiteApprovedAt = currentApproval?.approvedAt || intakeData.websiteRequirements?.websiteApprovedAt;
  const websiteApprovedBy = currentApproval?.approvedBy?.name || intakeData.websiteRequirements?.websiteApprovedBy;

  const handleOpenSignOffModal = () => {
    setSignOffError(null);
    setSignOffDeclared(false);
    setIsSignOffModalOpen(true);
  };

  const handleApproveWebsiteSpecification = handleOpenSignOffModal;
  const handleRevokeWebsiteApproval = () => setIsReopenModalOpen(true);

  const handleExecuteSignOff = async () => {
    if (!signOffDeclared) {
      setSignOffError('Please acknowledge the verification declaration before signing off.');
      return;
    }
    if (!signOffName.trim() || !signOffEmail.trim()) {
      setSignOffError('Approver Name and Email are required.');
      return;
    }

    const approverInfo = {
      name: signOffName.trim(),
      email: signOffEmail.trim(),
      role: signOffRole.trim() || 'Super Administrator',
    };

    setIsSigningOff(true);
    setSignOffError(null);

    // 1. If session token is present, execute server-authoritative approval and instant persistence
    if (token) {
      try {
        const serverRes = await approveWebsiteSpecificationAction(
          token,
          approverInfo,
          signOffNotes.trim() || undefined,
          intakeData
        );
        if (!serverRes.success || !serverRes.approvalRecord) {
          setSignOffError(serverRes.error || serverRes.message || 'Approval rejected by server verification.');
          setIsSigningOff(false);
          return;
        }

        const prevHistory = intakeData.websiteRequirements?.approvalHistory || [];
        const updatedHistory = currentApproval && currentApproval.id !== serverRes.approvalRecord.id
          ? [{ ...currentApproval, status: 'superseded' as const }, ...prevHistory]
          : prevHistory;

        updateSectionField('websiteRequirements', 'currentApproval', serverRes.approvalRecord);
        updateSectionField('websiteRequirements', 'approvalHistory', updatedHistory);
        updateSectionField('websiteRequirements', 'websiteApproved', true);
        updateSectionField('websiteRequirements', 'websiteApprovedAt', serverRes.approvalRecord.approvedAt);
        updateSectionField('websiteRequirements', 'websiteApprovedBy', serverRes.approvalRecord.approvedBy.name);
        updateSectionField('websiteRequirements', 'websiteApprovalNotes', serverRes.approvalRecord.notes);

        setIsSigningOff(false);
        setIsSignOffModalOpen(false);
        return;
      } catch (err: any) {
        console.warn('[SERVER APPROVAL WARNING] Falling back to client-safe signoff:', err);
      }
    }

    // 2. Local / In-memory fallback (for unit tests / mock environments)
    const res = approveWebsiteSpecification(
      intakeData,
      approverInfo,
      signOffNotes.trim() || undefined
    );

    if (!res.success || !res.approvalRecord) {
      setSignOffError(res.message || 'Approval rejected by server verification.');
      setIsSigningOff(false);
      return;
    }

    const prevHistory = intakeData.websiteRequirements?.approvalHistory || [];
    const updatedHistory = currentApproval && currentApproval.id !== res.approvalRecord.id
      ? [{ ...currentApproval, status: 'superseded' as const }, ...prevHistory]
      : prevHistory;

    updateSectionField('websiteRequirements', 'currentApproval', res.approvalRecord);
    updateSectionField('websiteRequirements', 'approvalHistory', updatedHistory);
    updateSectionField('websiteRequirements', 'websiteApproved', true);
    updateSectionField('websiteRequirements', 'websiteApprovedAt', res.approvalRecord.approvedAt);
    updateSectionField('websiteRequirements', 'websiteApprovedBy', res.approvalRecord.approvedBy.name);
    updateSectionField('websiteRequirements', 'websiteApprovalNotes', res.approvalRecord.notes);

    setIsSigningOff(false);
    setIsSignOffModalOpen(false);
  };

  const handleExecuteReopen = async () => {
    if (token) {
      try {
        await reopenWebsiteSpecificationAction(token, 'Reopened for administrative edits');
      } catch (err) {
        console.warn('[SERVER REOPEN WARNING]', err);
      }
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
    setIsReopenModalOpen(false);
  };

  // Gallery categories counts
  const galleryCounts = useMemo(() => getCampusGalleryCategoryCounts(campuses), [campuses]);

  // Statutory documents from checklist
  const statutoryDocs = useMemo(() => findStatutoryDocumentsInChecklist(intakeData), [intakeData]);

  // Mandatory Disclosure Config
  const mandatoryDisclosureConfig: WebsiteMandatoryDisclosureConfig = useMemo(() => {
    return (
      intakeData.websiteRequirements?.mandatoryDisclosureConfig ||
      generateMandatoryDisclosureConfig(intakeData)
    );
  }, [intakeData]);

  // Privacy Policy Config
  const privacyPolicyConfig: WebsitePrivacyPolicyConfig = useMemo(() => {
    const prof = intakeData.schoolProfile || ({} as any);
    const existing = intakeData.websiteRequirements?.privacyPolicyConfig;
    if (existing) return existing;

    return {
      autoGenerateStandardPolicy: true,
      collectsContactFormSubmissions: true,
      collectsAdmissionEnquiries: true,
      usesCookies: true,
      usesAnalytics: true,
      offersNewsletterSubscription: false,
      acceptsDocumentUploads: true,
      acceptsOnlinePayments: false,
      schoolName: prof.legalInstitutionName || prof.schoolName || '',
      schoolContactEmail: prof.officialEmail || '',
    };
  }, [intakeData]);

  // Developer specification
  const developerSpec = useMemo(() => generateWebsiteDeveloperSpec(intakeData), [intakeData]);

  // Sync back to parent if pageConfigurations haven't been persisted
  useEffect(() => {
    if (!intakeData.websiteRequirements?.pageConfigurations) {
      updateSectionField('websiteRequirements', 'pageConfigurations', pageConfigurations);
      updateSectionField('websiteRequirements', 'mandatoryDisclosureConfig', mandatoryDisclosureConfig);
      updateSectionField('websiteRequirements', 'privacyPolicyConfig', privacyPolicyConfig);
      updateSectionField('websiteRequirements', 'developerSpecification', developerSpec);
    }
  }, [intakeData.websiteRequirements?.pageConfigurations, pageConfigurations, mandatoryDisclosureConfig, privacyPolicyConfig, developerSpec, updateSectionField]);

  // Close modals on Escape key press for accessible keyboard interaction
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isPrivacyModalOpen) setIsPrivacyModalOpen(false);
        if (isSignOffModalOpen) setIsSignOffModalOpen(false);
        if (isReopenModalOpen) setIsReopenModalOpen(false);
        if (isHistoryModalOpen) setIsHistoryModalOpen(false);
        if (isGuidedReviewOpen) {
          setIsGuidedReviewOpen(false);
          setIsGuidedReviewComplete(false);
        }
        if (activeModalItem) {
          setActiveModalItem(null);
          setIsEditingModalValue(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPrivacyModalOpen, isSignOffModalOpen, isReopenModalOpen, isHistoryModalOpen, isGuidedReviewOpen, activeModalItem]);

  // Toggle standard page selection
  const handleTogglePage = (pageKey: string) => {
    const isCurrentlySelected = selectedPages.includes(pageKey);
    let newSelected: string[];

    if (isCurrentlySelected) {
      newSelected = selectedPages.filter((p) => p !== pageKey);
    } else {
      newSelected = [...selectedPages, pageKey];
    }

    const updatedConfigs = { ...pageConfigurations };
    if (!isCurrentlySelected) {
      // Auto-generate requirements for this newly selected page
      const reqs = autoFillPageRequirements(pageKey, intakeData);
      const def = STANDARD_WEBSITE_PAGES.find((p) => p.pageKey === pageKey) || {
        pageKey,
        label: pageKey,
        slug: pageKey.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: `${pageKey} public page`,
        recommendedSections: ['Overview', 'Details', 'Contact'],
        isCmsSupported: true,
      };
      const { status, readyCount, totalCount } = evaluatePageStatus(reqs, pageKey);
      updatedConfigs[pageKey] = {
        pageKey,
        label: def.label,
        slug: def.slug,
        enabled: true,
        status,
        readyCount,
        totalCount,
        requirements: reqs,
        recommendedSections: def.recommendedSections,
        applicableCampusIds: ['all'],
      };
      // Auto expand newly checked page
      setExpandedPages((prev) => ({ ...prev, [pageKey]: true }));
    } else {
      delete updatedConfigs[pageKey];
    }

    updateSectionField('websiteRequirements', 'requiredPages', newSelected);
    updateSectionField('websiteRequirements', 'pageConfigurations', updatedConfigs);
    updateSectionField('websiteRequirements', 'developerSpecification', generateWebsiteDeveloperSpec({
      ...intakeData,
      websiteRequirements: {
        ...intakeData.websiteRequirements,
        primaryPurpose: intakeData.websiteRequirements?.primaryPurpose || '',
        requiredPages: newSelected,
        pageConfigurations: updatedConfigs,
        languagesRequired: intakeData.websiteRequirements?.languagesRequired || ['English'],
        migrationNeededFromExisting: intakeData.websiteRequirements?.migrationNeededFromExisting ?? false,
      },
    }));
  };

  // Update a single requirement field inside a page configuration with canonical bidirectional sync
  const handleUpdateRequirementValue = (
    pageKey: string,
    reqKey: string,
    newValue: unknown,
    markConfirmed: boolean = true,
    isUserEdit: boolean = false
  ) => {
    const currentConfig = pageConfigurations[pageKey];
    if (!currentConfig) return;

    const updatedReqs = currentConfig.requirements.map((r) => {
      if (r.key === reqKey) {
        return {
          ...r,
          value: newValue,
          userConfirmed: markConfirmed,
          userEdited: isUserEdit || r.userEdited,
          status: markConfirmed ? ('confirmed' as const) : ('needs_confirmation' as const),
          hasConflict: markConfirmed ? false : r.hasConflict,
        };
      }
      return r;
    });

    const { status, readyCount, totalCount } = evaluatePageStatus(updatedReqs, pageKey);
    const updatedConfig: WebsitePageConfiguration = {
      ...currentConfig,
      requirements: updatedReqs,
      status,
      readyCount,
      totalCount,
    };

    const newConfigs = { ...pageConfigurations, [pageKey]: updatedConfig };

    // Canonical bidirectional sync for Principal Name across Leadership and Mandatory Disclosures
    if (reqKey === 'principal_name' || reqKey === 'principal_head') {
      const principalStr = String(newValue || '').trim();
      if (principalStr) {
        if (markConfirmed) {
          updateSectionField('leadership', 'principalName', principalStr);
        }

        const pairedPageKey = pageKey === 'Leadership & Desk' ? 'Mandatory Disclosures' : 'Leadership & Desk';
        const pairedReqKey = pageKey === 'Leadership & Desk' ? 'principal_head' : 'principal_name';

        if (newConfigs[pairedPageKey]) {
          const pairedReqs = newConfigs[pairedPageKey].requirements.map((r) =>
            r.key === pairedReqKey
              ? {
                  ...r,
                  value: principalStr,
                  userConfirmed: markConfirmed,
                  userEdited: isUserEdit || r.userEdited,
                  status: markConfirmed ? ('confirmed' as const) : ('needs_confirmation' as const),
                  hasConflict: markConfirmed ? false : r.hasConflict,
                }
              : r
          );
          const evalPaired = evaluatePageStatus(pairedReqs, pairedPageKey);
          newConfigs[pairedPageKey] = {
            ...newConfigs[pairedPageKey],
            requirements: pairedReqs,
            status: evalPaired.status,
            readyCount: evalPaired.readyCount,
            totalCount: evalPaired.totalCount,
          };
        }
      }
    }

    updateSectionField('websiteRequirements', 'pageConfigurations', newConfigs);
    updateSectionField('websiteRequirements', 'developerSpecification', generateWebsiteDeveloperSpec({
      ...intakeData,
      websiteRequirements: {
        ...intakeData.websiteRequirements,
        primaryPurpose: intakeData.websiteRequirements?.primaryPurpose || '',
        pageConfigurations: newConfigs,
      },
    }));
  };

  // Open modal for a specific requirement
  const handleOpenVerificationModal = (pageKey: string, pageLabel: string, requirement: WebsitePageRequirement) => {
    setActiveModalItem({ pageKey, pageLabel, requirement });
    const currentVal = requirement.value !== undefined && requirement.value !== null ? String(requirement.value) : '';
    setModalEditValue(currentVal);
    setModalConflictSelectedValue(currentVal);
    setModalConflictIsCustom(false);
    setIsEditingModalValue(requirement.status === 'missing');
  };

  // Safe Editing: Save edited value without confirming yet (Section 8)
  const handleSaveModalEdit = () => {
    if (!activeModalItem) return;
    const valueToSave = modalEditValue;
    handleUpdateRequirementValue(
      activeModalItem.pageKey,
      activeModalItem.requirement.key,
      valueToSave,
      false, // markConfirmed = false
      true   // isUserEdit = true
    );
    setActiveModalItem({
      ...activeModalItem,
      requirement: {
        ...activeModalItem.requirement,
        value: valueToSave,
        status: 'needs_confirmation',
        userConfirmed: false,
        userEdited: true,
      },
    });
    setIsEditingModalValue(false);
  };

  // Confirm single item from modal (explicit click sets status = 'confirmed')
  const handleConfirmModalItem = (confirmedVal?: unknown) => {
    if (!activeModalItem) return;
    let finalVal = confirmedVal !== undefined ? confirmedVal : (isEditingModalValue ? modalEditValue : activeModalItem.requirement.value);
    if (activeModalItem.requirement.hasConflict && modalConflictSelectedValue) {
      finalVal = modalConflictSelectedValue;
    }
    handleUpdateRequirementValue(activeModalItem.pageKey, activeModalItem.requirement.key, finalVal, true, false);
    setActiveModalItem(null);
    setIsEditingModalValue(false);
  };

  // Guided review: launch workflow
  const handleStartGuidedReview = (startIndex: number = 0) => {
    if (aggregates.actionRequiredQueue.length === 0) return;
    const targetIdx = Math.max(0, Math.min(startIndex, aggregates.actionRequiredQueue.length - 1));
    const target = aggregates.actionRequiredQueue[targetIdx];
    setGuidedReviewIndex(targetIdx);
    const initialVal = target.requirement.value !== undefined && target.requirement.value !== null ? String(target.requirement.value) : '';
    setGuidedEditValue(initialVal);
    setGuidedConflictSelectedValue(initialVal);
    setGuidedConflictIsCustom(false);
    setIsGuidedEditing(false);
    setIsGuidedReviewComplete(false);
    setIsGuidedReviewOpen(true);
  };

  // Guided review: save edit without confirming (Safe Editing Section 8)
  const handleSaveGuidedEdit = () => {
    const current = aggregates.actionRequiredQueue[guidedReviewIndex];
    if (!current) return;
    handleUpdateRequirementValue(
      current.pageKey,
      current.requirement.key,
      guidedEditValue,
      false, // markConfirmed = false
      true   // isUserEdit = true
    );
    setIsGuidedEditing(false);
  };

  // Guided review: confirm and advance
  const handleConfirmGuidedCurrent = (confirmedVal?: unknown) => {
    const current = aggregates.actionRequiredQueue[guidedReviewIndex];
    if (!current) {
      setIsGuidedReviewOpen(false);
      return;
    }

    let finalVal = confirmedVal !== undefined ? confirmedVal : (isGuidedEditing ? guidedEditValue : current.requirement.value);
    if (current.requirement.hasConflict && guidedConflictSelectedValue) {
      finalVal = guidedConflictSelectedValue;
    }
    handleUpdateRequirementValue(current.pageKey, current.requirement.key, finalVal, true, false);

    if (guidedReviewIndex < aggregates.actionRequiredQueue.length - 1) {
      const nextIdx = guidedReviewIndex + 1;
      const nextItem = aggregates.actionRequiredQueue[nextIdx];
      setGuidedReviewIndex(nextIdx);
      const nextVal = nextItem.requirement.value !== undefined && nextItem.requirement.value !== null ? String(nextItem.requirement.value) : '';
      setGuidedEditValue(nextVal);
      setGuidedConflictSelectedValue(nextVal);
      setGuidedConflictIsCustom(false);
      setIsGuidedEditing(false);
    } else {
      setIsGuidedReviewComplete(true);
    }
  };

  // Guided review: skip to next
  const handleSkipGuidedCurrent = () => {
    if (guidedReviewIndex < aggregates.actionRequiredQueue.length - 1) {
      const nextIdx = guidedReviewIndex + 1;
      const nextItem = aggregates.actionRequiredQueue[nextIdx];
      setGuidedReviewIndex(nextIdx);
      const nextVal = nextItem.requirement.value !== undefined && nextItem.requirement.value !== null ? String(nextItem.requirement.value) : '';
      setGuidedEditValue(nextVal);
      setGuidedConflictSelectedValue(nextVal);
      setGuidedConflictIsCustom(false);
      setIsGuidedEditing(false);
    } else {
      setIsGuidedReviewComplete(true);
    }
  };

  // Update multi-campus selector for a page
  const handleUpdateApplicableCampuses = (pageKey: string, campusId: string) => {
    const currentConfig = pageConfigurations[pageKey];
    if (!currentConfig) return;

    const newReqs = autoFillPageRequirements(pageKey, intakeData, campusId);
    const { status, readyCount, totalCount } = evaluatePageStatus(newReqs, pageKey);

    const updatedConfig: WebsitePageConfiguration = {
      ...currentConfig,
      applicableCampusIds: [campusId],
      requirements: newReqs,
      status,
      readyCount,
      totalCount,
    };

    const newConfigs = { ...pageConfigurations, [pageKey]: updatedConfig };
    updateSectionField('websiteRequirements', 'pageConfigurations', newConfigs);
  };

  // Toggle accordion expand
  const togglePageExpand = (pageKey: string) => {
    setExpandedPages((prev) => ({
      ...prev,
      [pageKey]: !prev[pageKey],
    }));
  };

  // Custom pages management
  const customPages = intakeData.websiteRequirements?.customPages || [];

  const handleAddCustomPage = () => {
    const newId = `cp-${Date.now()}`;
    const newPage: any = {
      id: newId,
      title: 'New Specialized Page',
      slug: 'specialized-page',
      purpose: 'Provide specialized institutional curriculum details',
      language: 'English',
      isPublic: true,
      isCmsEditable: true,
      pageType: 'information' as CustomPageType,
      customRequirements: [
        { id: `req-1`, title: 'Page Introduction', description: 'Overview and objectives of this section', type: 'text' },
      ],
    };

    const updatedCustom = [...customPages, newPage];
    updateSectionField('websiteRequirements', 'customPages', updatedCustom);

    // Also register in pageConfigurations
    const key = `custom_${newId}`;
    const updatedConfigs = {
      ...pageConfigurations,
      [key]: {
        pageKey: key,
        label: newPage.title,
        slug: newPage.slug,
        enabled: true,
        status: 'ready' as const,
        readyCount: 1,
        totalCount: 1,
        requirements: [
          {
            key: 'req-1',
            label: 'Page Introduction',
            type: 'text' as const,
            required: false,
            value: 'Overview and objectives of this section',
            status: 'confirmed' as const,
            userConfirmed: true,
            whyNeeded: 'Specialized overview and curriculum narrative.',
          },
        ],
        recommendedSections: ['Custom Information'],
        isCustom: true,
        customPageType: 'information' as CustomPageType,
      },
    };
    updateSectionField('websiteRequirements', 'pageConfigurations', updatedConfigs);
    setExpandedPages((prev) => ({ ...prev, [key]: true }));
  };

  const handleUpdateCustomPage = (idx: number, updates: any) => {
    const copy = [...customPages];
    copy[idx] = { ...copy[idx], ...updates };
    if (updates.title && !updates.slug) {
      copy[idx].slug = deriveSlugFromSchoolName(updates.title);
    }
    updateSectionField('websiteRequirements', 'customPages', copy);

    const key = `custom_${copy[idx].id}`;
    if (pageConfigurations[key]) {
      const updatedConfigs = {
        ...pageConfigurations,
        [key]: {
          ...pageConfigurations[key],
          label: copy[idx].title,
          slug: copy[idx].slug,
          customPageType: copy[idx].pageType,
        },
      };
      updateSectionField('websiteRequirements', 'pageConfigurations', updatedConfigs);
    }
  };

  const handleRemoveCustomPage = (idx: number) => {
    const target = customPages[idx];
    const copy = customPages.filter((_, i) => i !== idx);
    updateSectionField('websiteRequirements', 'customPages', copy);

    if (target) {
      const key = `custom_${target.id}`;
      const updatedConfigs = { ...pageConfigurations };
      delete updatedConfigs[key];
      updateSectionField('websiteRequirements', 'pageConfigurations', updatedConfigs);
    }
  };

  // Mandatory Disclosure specialized updates
  const handleUpdateMandatoryConfig = (updates: Partial<WebsiteMandatoryDisclosureConfig>) => {
    const updated = { ...mandatoryDisclosureConfig, ...updates };
    updateSectionField('websiteRequirements', 'mandatoryDisclosureConfig', updated);
  };

  // Privacy Policy specialized updates
  const handleUpdatePrivacyConfig = (updates: Partial<WebsitePrivacyPolicyConfig>) => {
    const updated = { ...privacyPolicyConfig, ...updates };
    updateSectionField('websiteRequirements', 'privacyPolicyConfig', updated);
  };

  const handleSavePrivacyPolicyTemplate = () => {
    handleUpdatePrivacyConfig({
      policyContent: privacyPolicyDraft,
      isCustomized: true,
      lastEditedAt: new Date().toISOString(),
    });
    setIsPrivacyModalOpen(false);
  };

  // Filtered pages for display
  const displayedPageKeys = useMemo(() => {
    let list = selectedPages;

    if (activeFilter === 'needs_action') {
      list = list.filter((pg) => {
        const cfg = pageConfigurations[pg];
        return cfg && (cfg.status === 'needs_review' || cfg.status === 'incomplete');
      });
    } else if (activeFilter === 'confirmed') {
      list = list.filter((pg) => {
        const cfg = pageConfigurations[pg];
        return cfg && cfg.status === 'ready';
      });
    } else if (activeFilter === 'missing') {
      list = list.filter((pg) => {
        const cfg = pageConfigurations[pg];
        return cfg && (cfg.requirements || []).some((r) => r.status === 'missing' && r.required && !r.isCmsFutureContent);
      });
    } else if (activeFilter === 'future_cms') {
      list = list.filter((pg) => {
        const cfg = pageConfigurations[pg];
        return cfg && (cfg.requirements || []).some((r) => r.isCmsFutureContent);
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((pg) => {
        const cfg = pageConfigurations[pg];
        if (!cfg) return false;
        if (cfg.label.toLowerCase().includes(q) || cfg.slug.toLowerCase().includes(q)) return true;
        return (cfg.requirements || []).some((r) => r.label.toLowerCase().includes(q) || String(r.value || '').toLowerCase().includes(q));
      });
    }

    return list;
  }, [selectedPages, pageConfigurations, activeFilter, searchQuery]);

  // Helper to render semantic status pill per Section 4 specifications
  const renderStatusBadge = (status: WebsiteFieldState, isCmsFuture?: boolean) => {
    if (isCmsFuture || status === 'future_cms') {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <Layers className="w-2.5 h-2.5 text-slate-500" />
          <span>Managed After Launch</span>
        </span>
      );
    }
    if (status === 'confirmed') {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
          <span>Confirmed</span>
        </span>
      );
    }
    if (status === 'auto_filled' || status === 'prefilled') {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Info className="w-2.5 h-2.5 text-blue-600" />
          <span>Already Provided</span>
        </span>
      );
    }
    if (status === 'needs_confirmation') {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-300">
          <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
          <span>Needs Your Review</span>
        </span>
      );
    }
    if (status === 'missing') {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-2.5 h-2.5 text-rose-600" />
          <span>Information Missing</span>
        </span>
      );
    }
    if (status === 'generated') {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <Sparkles className="w-2.5 h-2.5 text-purple-600" />
          <span>Prepared for You</span>
        </span>
      );
    }
    if (status === 'not_applicable') {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
          <span>Not Applicable</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-50 text-slate-600 border border-slate-200">
        <span>Optional</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 text-xs text-[#131B2E]">
      {/* 1. Page Header & Explanatory Context */}
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <span className="text-[10px] uppercase tracking-wider font-bold text-[#4338CA] bg-[#EEF2FF] border border-[#C7D2FE] px-2 py-0.5 rounded-md">
            Final Stage • Website Verification &amp; Specification
          </span>
          <span className="text-[11px] text-slate-500 font-medium">Single Source of Truth</span>
          {isWebsiteApproved && (
            <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              <Lock className="w-3 h-3 text-emerald-600" />
              <span>Specification Approved</span>
            </span>
          )}
        </div>
        <h2 className="text-lg sm:text-xl font-extrabold text-[#131B2E]">
          Final Website Verification &amp; Specification
        </h2>
        <p className="text-xs text-[#64748B] leading-relaxed max-w-4xl">
          Everything has been collected from earlier onboarding chapters. Review how your school&apos;s identity, academic structure, actual photographic assets, and statutory regulatory documents will appear across the final public website. Verify data, preview real images and certificates, resolve any remaining publication blockers, and lock your production website specification.
        </p>
      </div>

      {/* 2. Top Viewport Readiness & Lifecycle Status Banner */}
      {isInvalidated ? (
        <div className="bg-gradient-to-r from-amber-50 via-rose-50/50 to-orange-50/40 border border-amber-300 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start space-x-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-amber-950">
                    Specification Requires Re-Verification (v{currentApproval?.specificationVersion || 1} Outdated)
                  </h3>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
                    Action Required
                  </span>
                </div>
                <p className="text-xs text-amber-900/90 mt-1 leading-relaxed max-w-3xl">
                  Canonical school information, assets, or compliance documents were modified after the previous sign-off.
                  The public website build pipeline locks strictly to approved snapshots. Re-verify the changes below and approve a new version.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 self-start sm:self-center">
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
              >
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span>History</span>
              </button>
              <button
                type="button"
                onClick={handleOpenSignOffModal}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Re-verify &amp; Sign Off v{(currentApproval?.specificationVersion || 0) + 1}</span>
              </button>
            </div>
          </div>

          {/* Targeted Invalidation List */}
          <div className="bg-white/80 border border-amber-200 rounded-xl p-3 sm:p-4 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                Detected Source Changes &amp; Affected Pages:
              </span>
              <span className="text-[10px] font-semibold text-amber-700">
                {invalidationResult.invalidatedFields.length} field{invalidationResult.invalidatedFields.length === 1 ? '' : 's'} altered
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
              {invalidationResult.invalidatedFields.map((field: string, idx: number) => (
                <div key={idx} className="flex items-start space-x-2 text-slate-700 bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                  <span className="text-amber-600 font-bold">•</span>
                  <span className="font-medium">{field}</span>
                </div>
              ))}
            </div>
            {invalidationResult.affectedPages.length > 0 && (
              <div className="pt-2 border-t border-amber-100 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="font-semibold text-slate-600">Affected Pages to Review:</span>
                {invalidationResult.affectedPages.map((pg: string, idx: number) => (
                  <span key={idx} className="px-2 py-0.5 rounded-md bg-white border border-amber-200 font-medium text-slate-800">
                    {pg}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : isApproved ? (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-slate-50 border border-emerald-300 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-emerald-950">
                  Website Specification is Approved &amp; Locked
                </h3>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded">
                  v{currentApproval?.specificationVersion || 1} • Immutable
                </span>
                {currentApproval?.specificationHash && (
                  <span className="text-[10px] font-mono font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">
                    SHA-256: {currentApproval.specificationHash.slice(0, 10)}...
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-800/90 mt-1 leading-relaxed">
                Certified by <strong className="font-bold">{websiteApprovedBy || 'Administrator'}</strong>
                {currentApproval?.approvedBy.role ? ` (${currentApproval.approvedBy.role})` : ''}
                {websiteApprovedAt ? ` on ${new Date(websiteApprovedAt).toLocaleString()}` : ''}.
                All {readinessBreakdown.websitePagesCount} pages and statutory disclosures are frozen for publication.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0 self-start sm:self-center">
            <button
              type="button"
              onClick={() => setIsHistoryModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>History</span>
            </button>
            <button
              type="button"
              onClick={() => setIsReopenModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
            >
              <Unlock className="w-3.5 h-3.5 text-slate-500" />
              <span>Reopen for Edits</span>
            </button>
          </div>
        </div>
      ) : canApprove ? (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50/40 to-slate-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-sm sm:text-base text-emerald-950">
                  All Website Requirements Verified &amp; Ready
                </h3>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded">
                  Ready to Lock
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-0.5">
                All <strong className="font-bold">{readinessBreakdown.websitePagesCount} pages</strong>, content fields, canonical assets, and statutory documents are verified. You can now lock this specification.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpenSignOffModal}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition shrink-0 cursor-pointer self-start sm:self-center"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Approve &amp; Lock Specification</span>
          </button>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-amber-50/90 via-amber-50/50 to-indigo-50/40 border border-amber-200 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-sm sm:text-base text-[#131B2E]">
                  Verification In Progress — Action Required
                </h3>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
                  {serverPreconditions.blockers.length} Blocker{serverPreconditions.blockers.length === 1 ? '' : 's'}
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
                Specifications prepared for <strong className="text-slate-800 font-bold">{readinessBreakdown.websitePagesCount} pages</strong>.
                There {serverPreconditions.blockers.length === 1 ? 'is' : 'are'}{' '}
                <strong className="text-amber-800 font-bold">{serverPreconditions.blockers.length} publication blocker{serverPreconditions.blockers.length === 1 ? '' : 's'}</strong>
                {readinessBreakdown.complianceBlockersCount > 0 ? ` and ${readinessBreakdown.complianceBlockersCount} missing compliance document(s)` : ''} requiring resolution.
              </p>
            </div>
          </div>
          {aggregates.actionRequiredQueue.length > 0 && (
            <button
              type="button"
              onClick={() => handleStartGuidedReview(0)}
              className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold shadow-xs transition shrink-0 cursor-pointer self-start sm:self-center"
            >
              <span>Review All Pending Items</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Actionable Publication Blockers & Direct Navigation Card */}
      {!isApproved && serverPreconditions.blockers.length > 0 && (
        <div className="bg-white border border-rose-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-100 pb-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <h4 className="font-bold text-xs sm:text-sm text-rose-950">
                Actionable Publication Blockers ({serverPreconditions.blockers.length})
              </h4>
            </div>
            <span className="text-[11px] text-slate-500">
              Resolve these in their canonical source sections to enable specification approval.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {serverPreconditions.blockers.map((blocker, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between p-3 rounded-xl border border-rose-100 bg-rose-50/40 gap-3"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-rose-950 truncate">
                      {blocker.label}
                    </span>
                    {blocker.isStatutory && (
                      <span className="text-[9px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-1.5 py-0.2 rounded">
                        Mandatory
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-rose-800/90 leading-snug">
                    {blocker.message}
                  </p>
                  <span className="text-[10px] text-slate-500 font-medium block">
                    Source: {blocker.sourceSectionName}
                  </span>
                </div>

                {onNavigateToSection && blocker.sourceSection && (
                  <button
                    type="button"
                    onClick={() => onNavigateToSection(blocker.sourceSection)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white border border-rose-200 hover:border-rose-400 text-[11px] font-bold text-rose-700 hover:bg-rose-50 transition shrink-0 cursor-pointer shadow-2xs self-start"
                  >
                    <span>Fix</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Style & Brand Context Banner */}
      <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#4338CA] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <ActiveIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#4338CA]">
                  Confirmed Brand Tone
                </span>
                <span className="text-[9px] font-semibold text-[#4338CA] bg-white border border-[#C7D2FE] px-1.5 py-0.5 rounded">
                  {activeStyleConfig.badge}
                </span>
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-[#131B2E] truncate">
                {activeStyleConfig.label}
              </h4>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0 self-start sm:self-auto">
            {setPreviewingStyle && (
              <button
                type="button"
                onClick={() => setPreviewingStyle(activeStyleConfig)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-[#CBD5E1] bg-white text-xs font-semibold text-[#4338CA] hover:bg-[#EEF2FF] hover:border-[#C7D2FE] transition shadow-2xs cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>View Sample Mockup</span>
              </button>
            )}
            {onNavigateToBranding && (
              <button
                type="button"
                onClick={onNavigateToBranding}
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border border-transparent text-xs font-semibold text-slate-600 hover:text-[#131B2E] hover:bg-white/80 transition cursor-pointer"
              >
                <span>Edit Branding</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-[11px] text-[#64748B]">
          <p className="leading-relaxed flex-1">
            {activeStyleConfig.description}{' '}
            <span className="text-slate-500 font-medium">({activeStyleConfig.targetAudience})</span>
          </p>
          <div className="flex flex-wrap gap-1 shrink-0">
            {activeStyleConfig.personalityTags.map((t: string) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded-md bg-white border border-[#E2E8F0] text-[10px] text-slate-700 font-medium shadow-2xs"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Separated Executive Readiness Dashboard Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* Configured Pages */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Pages Configured</span>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-lg font-extrabold text-[#131B2E]">{readinessBreakdown.readyPagesCount}</span>
            <span className="text-[10px] text-slate-400">of {readinessBreakdown.websitePagesCount} ready</span>
          </div>
        </div>

        {/* Content Readiness */}
        <div className="bg-white border border-emerald-200 bg-emerald-50/20 rounded-xl p-3 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Content Verified</span>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-lg font-extrabold text-emerald-700">{readinessBreakdown.contentReadyPercentage}%</span>
            <span className="text-[10px] text-emerald-600 font-medium">({readinessBreakdown.contentReadyCount}/{readinessBreakdown.contentTotalCount})</span>
          </div>
        </div>

        {/* Actual Assets */}
        <div className="bg-white border border-indigo-200 bg-indigo-50/20 rounded-xl p-3 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 block">Actual Assets</span>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-lg font-extrabold text-[#4338CA]">{readinessBreakdown.assetsVerifiedCount}</span>
            <span className="text-[10px] text-indigo-600 font-medium">of {readinessBreakdown.assetsTotalCount} verified</span>
          </div>
        </div>

        {/* Regulatory Compliance */}
        <div className={`bg-white rounded-xl p-3 shadow-2xs border ${
          readinessBreakdown.complianceBlockersCount === 0
            ? 'border-emerald-200 bg-emerald-50/20'
            : 'border-rose-200 bg-rose-50/20'
        }`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${
            readinessBreakdown.complianceBlockersCount === 0 ? 'text-emerald-800' : 'text-rose-800'
          }`}>
            Compliance Docs
          </span>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className={`text-lg font-extrabold ${
              readinessBreakdown.complianceBlockersCount === 0 ? 'text-emerald-700' : 'text-rose-600'
            }`}>
              {readinessBreakdown.complianceBlockersCount === 0 ? 'Compliant' : `${readinessBreakdown.complianceBlockersCount} Missing`}
            </span>
          </div>
        </div>

        {/* Page Integrity */}
        <div className={`bg-white rounded-xl p-3 shadow-2xs border ${
          readinessBreakdown.duplicateRiskCount === 0
            ? 'border-[#E2E8F0]'
            : 'border-amber-300 bg-amber-50/30'
        }`}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Page Integrity</span>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className={`text-lg font-extrabold ${
              readinessBreakdown.duplicateRiskCount === 0 ? 'text-slate-800' : 'text-amber-700'
            }`}>
              {readinessBreakdown.duplicateRiskCount === 0 ? 'Clean' : `${readinessBreakdown.duplicateRiskCount} Duplicate`}
            </span>
            <span className="text-[10px] text-slate-400">risks</span>
          </div>
        </div>

        {/* Publication Sign-Off */}
        <div className={`bg-white rounded-xl p-3 shadow-2xs border ${
          isWebsiteApproved
            ? 'border-emerald-300 bg-emerald-50/30'
            : readinessBreakdown.canApprove
            ? 'border-blue-200 bg-blue-50/20'
            : 'border-amber-200 bg-amber-50/20'
        }`}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Sign-Off Status</span>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className={`text-sm font-extrabold truncate ${
              isWebsiteApproved
                ? 'text-emerald-700'
                : readinessBreakdown.canApprove
                ? 'text-blue-700'
                : 'text-amber-700'
            }`}>
              {isWebsiteApproved ? '✓ Locked' : readinessBreakdown.canApprove ? 'Ready to Lock' : 'Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* Duplicate Page Risk Alert Banner */}
      {readinessBreakdown.duplicateRisks.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center space-x-3 text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <h4 className="font-bold text-xs sm:text-sm">
                Duplicate Page &amp; URL Collision Risks Detected ({readinessBreakdown.duplicateRisks.length})
              </h4>
              <p className="text-[11px] text-amber-800 mt-0.5">
                The following pages have identical or very similar URLs or titles that risk confusing visitors or search engines.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {readinessBreakdown.duplicateRisks.map((risk, rIdx) => (
              <div key={rIdx} className="p-3 bg-white border border-amber-200 rounded-xl text-xs space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 truncate">
                    &ldquo;{risk.label}&rdquo; &amp; &ldquo;{risk.conflictingLabel}&rdquo;
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded shrink-0">
                    {risk.matchType.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">{risk.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Prominent Action Required Queue Banner */}
      {aggregates.actionRequiredQueue.length > 0 && (
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-50 to-orange-50 border border-amber-300/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded">
                    Action Required Queue
                  </span>
                  <span className="text-xs font-bold text-amber-900">
                    {aggregates.actionRequiredQueue.length} items require confirmation or entry
                  </span>
                </div>
                <p className="text-[11px] text-amber-800/90 mt-0.5">
                  Resolve these items to reach full specification readiness. No data is fabricated.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleStartGuidedReview(0)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-[#4338CA] hover:bg-[#3730A3] text-white rounded-xl text-xs font-bold shadow-xs transition shrink-0 cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Review All Pending Items ({aggregates.actionRequiredQueue.length})</span>
            </button>
          </div>

          {/* Quick-resolve horizontal queue items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
            {aggregates.actionRequiredQueue.slice(0, 3).map((item, qIdx) => (
              <div
                key={`${item.pageKey}_${item.requirement.key}`}
                className="flex items-center justify-between p-2.5 bg-white/90 border border-amber-200/90 rounded-xl shadow-2xs text-xs"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <span className="text-[10px] font-bold text-slate-500 block truncate">
                    {item.pageLabel}
                  </span>
                  <span className="font-semibold text-slate-800 block truncate">
                    {item.requirement.label}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleStartGuidedReview(qIdx)}
                  className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-bold rounded-lg transition shrink-0 cursor-pointer"
                >
                  Verify
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Primary Purpose */}
      <div className="bg-white border border-[#E2E8F0] p-4 sm:p-5 rounded-2xl shadow-2xs space-y-2">
        <label className="block font-bold text-[#131B2E]">
          Primary Website Purpose *
        </label>
        <p className="text-[11px] text-[#64748B]">
          Defines the core institutional conversion goal and visitor persona for developer wireframing.
        </p>
        <input
          type="text"
          value={intakeData.websiteRequirements?.primaryPurpose || ''}
          onChange={(e) => updateSectionField('websiteRequirements', 'primaryPurpose', e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/50 border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:bg-white focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs text-xs"
          placeholder="e.g. Enhance school credibility, drive new student admissions, and publish circulars & exam results."
        />
      </div>

      {/* 6. Standard Public Website Pages Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-sm text-[#131B2E]">
              Standard Website Pages & Intelligent Architecture
            </h3>
            <p className="text-[#64748B] text-[11px]">
              Select pages to automatically generate requirement specifications pre-filled from your onboarding data.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-[#4338CA] bg-[#EEF2FF] border border-[#C7D2FE] px-2.5 py-1 rounded-lg">
            {selectedPages.length} of 22 Pages Selected
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
          {STANDARD_WEBSITE_PAGES.map((def) => {
            const isChecked = selectedPages.includes(def.pageKey);
            const cfg = pageConfigurations[def.pageKey];

            return (
              <div
                key={def.pageKey}
                onClick={() => handleTogglePage(def.pageKey)}
                className={`flex flex-col justify-between p-3 rounded-xl border transition cursor-pointer select-none ${
                  isChecked
                    ? 'bg-[#EEF2FF]/60 border-[#4338CA] shadow-2xs ring-1 ring-[#4338CA]/10'
                    : 'bg-white border-[#E2E8F0] hover:bg-[#FAF7F2] text-[#64748B]'
                }`}
              >
                <div className="flex items-start justify-between space-x-2">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // handled by parent div
                      className="rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA] mt-0.5"
                    />
                    <span className={`font-semibold text-xs truncate ${isChecked ? 'text-[#131B2E]' : 'text-slate-700'}`}>
                      {def.label}
                    </span>
                  </div>

                  {isChecked && cfg && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                        cfg.status === 'ready'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : cfg.status === 'needs_review'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {cfg.status === 'ready'
                        ? `✓ Ready (${cfg.readyCount}/${cfg.totalCount})`
                        : cfg.status === 'needs_review'
                        ? `⚠ Review (${cfg.readyCount}/${cfg.totalCount})`
                        : `✗ Missing Info`}
                    </span>
                  )}
                </div>

                <p className="text-[10px] text-slate-500 line-clamp-2 mt-2 leading-tight">
                  {def.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. Filter & Search Controls */}
      {selectedPages.length > 0 && (
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white border border-[#E2E8F0] p-3 rounded-2xl shadow-2xs">
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-[11px] font-semibold text-slate-500 mr-1 shrink-0 flex items-center space-x-1">
              <Filter className="w-3 h-3" />
              <span>Filter:</span>
            </span>

            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-[#4338CA] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-[#FAF7F2]'
              }`}
            >
              All ({selectedPages.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('needs_action')}
              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeFilter === 'needs_action'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Needs Action ({aggregates.needsReviewPages + aggregates.incompletePages})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('confirmed')}
              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeFilter === 'confirmed'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Ready ({aggregates.readyPages})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('missing')}
              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeFilter === 'missing'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <XCircle className="w-3 h-3" />
              <span>Missing Fields ({aggregates.missingCount})</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search requirements..."
                className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-[#E2E8F0] rounded-lg text-xs focus:bg-white focus:border-[#4338CA] focus:outline-hidden"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                const allExpanded = selectedPages.every((k) => expandedPages[k]);
                const next: Record<string, boolean> = {};
                for (const k of selectedPages) next[k] = !allExpanded;
                setExpandedPages(next);
              }}
              className="text-xs font-semibold text-[#4338CA] hover:underline px-2 py-1 shrink-0 cursor-pointer"
            >
              {selectedPages.every((k) => expandedPages[k]) ? 'Collapse All' : 'Expand All'}
            </button>
          </div>
        </div>
      )}

      {/* 8. Progressive Disclosure: Generated Page Requirements Cards */}
      <div className="space-y-4">
        {displayedPageKeys.map((pageKey) => {
          const cfg = pageConfigurations[pageKey];
          if (!cfg) return null;

          const isExpanded = Boolean(expandedPages[pageKey]);
          const missingCount = (cfg.requirements || []).filter((r) => r.status === 'missing' && r.required && !r.isCmsFutureContent).length;
          const pendingCount = (cfg.requirements || []).filter((r) => (r.status === 'needs_confirmation' || r.status === 'auto_filled') && r.required && !r.userConfirmed).length;

          return (
            <div
              key={pageKey}
              className={`border rounded-2xl bg-white shadow-2xs overflow-hidden transition ${
                cfg.status === 'ready'
                  ? 'border-[#E2E8F0]'
                  : cfg.status === 'needs_review'
                  ? 'border-amber-300 ring-1 ring-amber-300/30'
                  : 'border-rose-300 ring-1 ring-rose-300/30'
              }`}
            >
              {/* Card Header */}
              <div
                onClick={() => togglePageExpand(pageKey)}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 bg-gradient-to-r from-[#FAF7F2] to-white border-b border-[#E2E8F0] gap-3 cursor-pointer hover:bg-slate-50/80 transition"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-2xs ${
                    cfg.status === 'ready'
                      ? 'bg-emerald-100 text-emerald-700'
                      : cfg.status === 'needs_review'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}>
                    {cfg.status === 'ready' ? (
                      <Check className="w-4 h-4" />
                    ) : cfg.status === 'needs_review' ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <h4 className="font-bold text-sm text-[#131B2E]">{cfg.label}</h4>
                      <span className="font-mono text-[10px] text-[#64748B] bg-slate-100 px-1.5 py-0.5 rounded">
                        /{cfg.slug}
                      </span>
                      {cfg.pageKey === 'Privacy Policy' && (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Generated Template</span>
                        </span>
                      )}
                      {cfg.pageKey === 'Mandatory Disclosures' && (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          <span>Statutory Board Disclosures</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-0.5 truncate">
                      {cfg.readyCount}/{cfg.totalCount} specifications ready
                      {missingCount > 0 && ` • ${missingCount} required item${missingCount > 1 ? 's' : ''} missing`}
                      {pendingCount > 0 && missingCount === 0 && ` • ${pendingCount} item${pendingCount > 1 ? 's' : ''} pending confirmation`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0 self-end sm:self-center">
                  <span
                    className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      cfg.status === 'ready'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : cfg.status === 'needs_review'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {cfg.status === 'ready' ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Ready</span>
                      </>
                    ) : cfg.status === 'needs_review' ? (
                      <>
                        <AlertTriangle className="w-3 h-3" />
                        <span>Needs Review</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        <span>{missingCount} Missing</span>
                      </>
                    )}
                  </span>

                  <button
                    type="button"
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition"
                    aria-label="Toggle details"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Card Body (Expanded) */}
              {isExpanded && (
                <div className="p-4 sm:p-5 space-y-4">
                  {/* Multi-Campus Scope Selector */}
                  {campuses.length > 1 && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50 border border-[#E2E8F0] rounded-xl gap-2 text-xs">
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-slate-500" />
                        <span className="font-semibold text-slate-700">Campus Scope for this page:</span>
                      </div>
                      <select
                        value={cfg.applicableCampusIds?.[0] || 'all'}
                        onChange={(e) => handleUpdateApplicableCampuses(pageKey, e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-[#CBD5E1] rounded-lg text-xs font-medium text-[#131B2E] focus:border-[#4338CA] focus:outline-hidden"
                      >
                        <option value="all">All Campuses (Consolidated)</option>
                        {campuses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.isMainCampus ? '(Main Campus)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Recommended Sections Strip */}
                  {cfg.recommendedSections && cfg.recommendedSections.length > 0 && (
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1.5">
                        Recommended Website Sections
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {cfg.recommendedSections.map((sec) => (
                          <span
                            key={sec}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-[11px] font-medium"
                          >
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>{sec}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Specialized Sub-Cards */}
                  {pageKey === 'Home' && (
                    <div className="p-4 bg-slate-50 border border-[#E2E8F0] rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-xs text-[#131B2E] flex items-center space-x-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-[#4338CA]" />
                          <span>Hero Featured Image &amp; Campus Showcase</span>
                        </h5>
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                          Canonical Asset Link
                        </span>
                      </div>

                      {(() => {
                        const heroAsset = resolveCanonicalAsset(intakeData, 'hero_image', {
                          campusId: cfg.applicableCampusIds?.[0],
                          intendedUsage: 'Home Page Hero Showcase',
                        });

                        return (
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                            {heroAsset.url ? (
                              <div className="relative w-28 h-20 rounded-lg overflow-hidden border border-slate-300 bg-slate-100 shrink-0 group shadow-2xs">
                                <img
                                  src={heroAsset.url}
                                  alt="Campus Hero"
                                  className="w-full h-full object-cover"
                                />
                                <a
                                  href={heroAsset.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="absolute bottom-1 right-1 p-1 bg-black/60 hover:bg-black/80 text-white rounded text-[10px]"
                                  title="View full image"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            ) : (
                              <div className="w-28 h-20 rounded-lg border border-dashed border-amber-300 bg-amber-50/50 flex flex-col items-center justify-center text-amber-700 shrink-0">
                                <ImageIcon className="w-6 h-6 text-amber-500" />
                                <span className="text-[10px] mt-1 font-semibold">No Image</span>
                              </div>
                            )}

                            <div className="min-w-0 flex-1 space-y-1 text-xs">
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-slate-900 truncate">
                                  {heroAsset.fileName || 'Main Campus Photo'}
                                </span>
                                <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                                  heroAsset.url
                                    ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                                    : 'text-amber-700 bg-amber-50 border border-amber-200'
                                }`}>
                                  {heroAsset.url ? 'Available' : 'Pending'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600">
                                Sourced from: <strong className="text-[#4338CA]">{heroAsset.source || 'Section 2 — Campuses & Branches'}</strong>
                              </p>
                              {heroAsset.width && heroAsset.height && (
                                <p className="text-[10px] text-slate-500">
                                  Dimensions: {heroAsset.width} × {heroAsset.height} px
                                  {heroAsset.fileSize ? ` • ${Math.round(heroAsset.fileSize / 1024)} KB` : ''}
                                  {heroAsset.fileType ? ` • ${heroAsset.fileType}` : ''}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {pageKey === 'Mandatory Disclosures' && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div className="flex items-center space-x-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <h5 className="font-bold text-xs text-[#131B2E]">
                            Mandatory Regulatory Disclosure Structure
                          </h5>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          Zero-Fabrication Mode
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Affiliation / Regulatory Body
                          </label>
                          <select
                            value={mandatoryDisclosureConfig.regulatoryBody}
                            onChange={(e) =>
                              handleUpdateMandatoryConfig({
                                regulatoryBody: e.target.value as any,
                              })
                            }
                            className="w-full px-2.5 py-1.5 bg-white border border-[#CBD5E1] rounded-lg text-xs font-medium"
                          >
                            <option value="CBSE">CBSE (Central Board)</option>
                            <option value="CISCE">CISCE / ICSE</option>
                            <option value="State Board">State Education Board</option>
                            <option value="IB">International Baccalaureate (IB)</option>
                            <option value="Cambridge">Cambridge (CAIE)</option>
                            <option value="Other">Other Authority</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Affiliation Number
                          </label>
                          <input
                            type="text"
                            value={mandatoryDisclosureConfig.affiliationNumber || ''}
                            onChange={(e) =>
                              handleUpdateMandatoryConfig({ affiliationNumber: e.target.value })
                            }
                            placeholder="e.g. 330943"
                            className="w-full px-2.5 py-1.5 bg-white border border-[#CBD5E1] rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            School Code / UDISE Code
                          </label>
                          <input
                            type="text"
                            value={mandatoryDisclosureConfig.schoolCode || mandatoryDisclosureConfig.udiseCode || ''}
                            onChange={(e) =>
                              handleUpdateMandatoryConfig({ schoolCode: e.target.value })
                            }
                            placeholder="e.g. 66664 / 10020300405"
                            className="w-full px-2.5 py-1.5 bg-white border border-[#CBD5E1] rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      {/* Statutory Documents Found vs Missing */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-700 block">
                          Statutory Public Disclosure Documents (Reused from Asset Checklist):
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {mandatoryDisclosureConfig.statutoryDocuments?.map((doc) => (
                            <div
                              key={doc.documentKey}
                              className={`flex items-center justify-between p-2 rounded-lg border ${
                                doc.status === 'found'
                                  ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                                  : 'bg-amber-50/50 border-amber-200 text-amber-900'
                              }`}
                            >
                              <div className="flex items-center space-x-2 min-w-0">
                                {doc.status === 'found' ? (
                                  <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                ) : (
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                )}
                                <span className="font-medium text-xs truncate">{doc.title}</span>
                              </div>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                  doc.status === 'found'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {doc.status === 'found' ? 'Linked (PDF)' : 'Missing'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {pageKey === 'Privacy Policy' && (
                    <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Sparkles className="w-4 h-4 text-purple-600" />
                          <h5 className="font-bold text-xs text-purple-950">
                            Auto-Generated Standard Privacy Policy Template
                          </h5>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPrivacyPolicyDraft(
                              privacyPolicyConfig.policyContent ||
                                generatePrivacyPolicyTemplate(
                                  privacyPolicyConfig,
                                  intakeData.schoolProfile?.schoolName || '',
                                  intakeData.schoolProfile?.officialEmail || ''
                                )
                            );
                            setIsPrivacyModalOpen(true);
                          }}
                          className="inline-flex items-center space-x-1 text-xs font-bold text-purple-700 hover:text-purple-900 underline cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview & Customize Copy</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                        <label className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-purple-100 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={privacyPolicyConfig.collectsContactFormSubmissions}
                            onChange={(e) =>
                              handleUpdatePrivacyConfig({
                                collectsContactFormSubmissions: e.target.checked,
                              })
                            }
                            className="rounded border-purple-300 text-purple-600"
                          />
                          <span>Contact Form Enquiries</span>
                        </label>
                        <label className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-purple-100 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={privacyPolicyConfig.collectsAdmissionEnquiries}
                            onChange={(e) =>
                              handleUpdatePrivacyConfig({
                                collectsAdmissionEnquiries: e.target.checked,
                              })
                            }
                            className="rounded border-purple-300 text-purple-600"
                          />
                          <span>Admission Applications</span>
                        </label>
                        <label className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-purple-100 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={privacyPolicyConfig.acceptsOnlinePayments}
                            onChange={(e) =>
                              handleUpdatePrivacyConfig({
                                acceptsOnlinePayments: e.target.checked,
                              })
                            }
                            className="rounded border-purple-300 text-purple-600"
                          />
                          <span>Online Fee Gateway (PCI-DSS)</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {pageKey === 'Fee Structure' && (
                    <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl flex items-start space-x-2 text-xs text-amber-900">
                      <DollarSign className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Zero Fabrication Rule:</span>
                        <span>
                          The system defines fee tables and installment structures, but will never fabricate actual monetary fee amounts. Unprovided values are marked for school confirmation.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Requirements List (Structured Verification Records) */}
                  <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                        Content & Specification Requirements Verification
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {cfg.requirements.length} specifications
                      </span>
                    </div>

                    <div className="divide-y divide-[#F1F5F9] border border-[#E2E8F0] rounded-xl overflow-hidden">
                      {cfg.requirements.map((req) => (
                        <div
                          key={req.key}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white hover:bg-slate-50/50 gap-2.5 transition"
                        >
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center space-x-2 flex-wrap">
                              <span className="font-bold text-xs text-[#131B2E]">{req.label}</span>
                              {req.required && (
                                <span className="text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                                  Required
                                </span>
                              )}
                              {renderStatusBadge(req.status, req.isCmsFutureContent)}
                            </div>

                            {/* Value / Warning / Rich Asset Preview Display */}
                            {req.type === 'image' ? (
                              (() => {
                                const canonicalAsset = resolveCanonicalAsset(intakeData, req.referenceStorageKey || req.key, {
                                  fallbackUrl: typeof req.value === 'string' && (req.value.startsWith('http') || req.value.startsWith('/')) ? req.value : undefined,
                                });
                                const imgUrl = canonicalAsset.url || (typeof req.value === 'string' && (req.value.startsWith('http') || req.value.startsWith('/')) ? req.value : '');
                                const hasImage = Boolean(imgUrl);

                                return (
                                  <div className="mt-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                                    <div className="flex items-center space-x-3">
                                      {hasImage ? (
                                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-slate-300 bg-slate-100 shrink-0 group shadow-2xs">
                                          <img
                                            src={imgUrl}
                                            alt={req.label}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              (e.currentTarget as HTMLElement).style.display = 'none';
                                            }}
                                          />
                                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <a
                                              href={imgUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="p-1 rounded-full bg-white/90 text-slate-800 hover:bg-white text-[10px]"
                                              title="View full image"
                                            >
                                              <ExternalLink className="w-3 h-3" />
                                            </a>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg border border-dashed border-slate-300 bg-slate-100/60 flex flex-col items-center justify-center text-slate-400 shrink-0">
                                          <ImageIcon className="w-5 h-5 text-slate-400" />
                                          <span className="text-[9px] mt-1 font-medium">No Image</span>
                                        </div>
                                      )}

                                      <div className="min-w-0 flex-1 space-y-1 text-xs">
                                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                          <span className="font-semibold text-slate-800 truncate">
                                            {canonicalAsset.fileName || (hasImage ? `${req.label}.webp` : 'Pending Upload')}
                                          </span>
                                          {canonicalAsset.fileType && (
                                            <span className="text-[9px] uppercase font-bold text-slate-600 bg-slate-200/80 px-1.5 py-0.2 rounded">
                                              {canonicalAsset.fileType.replace('image/', '')}
                                            </span>
                                          )}
                                        </div>

                                        <div className="flex items-center space-x-3 text-[10px] text-slate-500 flex-wrap gap-y-0.5">
                                          {canonicalAsset.width && canonicalAsset.height && (
                                            <span>
                                              {canonicalAsset.width} × {canonicalAsset.height} px
                                            </span>
                                          )}
                                          {canonicalAsset.fileSize && (
                                            <span>
                                              {Math.round(canonicalAsset.fileSize / 1024)} KB
                                            </span>
                                          )}
                                          {canonicalAsset.source && (
                                            <span className="text-indigo-700 font-medium">
                                              {canonicalAsset.source}
                                            </span>
                                          )}
                                        </div>

                                        {!hasImage && req.missingWarning && (
                                          <p className="text-[11px] text-rose-700 font-medium flex items-center space-x-1">
                                            <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                                            <span>{req.missingWarning}</span>
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()
                            ) : req.type === 'document' ? (
                              (() => {
                                const docUrl = typeof req.value === 'string' && (req.value.startsWith('http') || req.value.startsWith('/')) ? req.value : '';
                                const hasDoc = Boolean(docUrl || req.status === 'confirmed');

                                return (
                                  <div className="mt-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                                    <div className="flex items-center space-x-2.5 min-w-0">
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                        hasDoc ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                      }`}>
                                        {hasDoc ? <FileCheck className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                      </div>
                                      <div className="min-w-0">
                                        <span className="font-semibold text-slate-800 block truncate">
                                          {typeof req.value === 'string' && req.value ? req.value.split('/').pop() : req.label}
                                        </span>
                                        <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                                          <span>{hasDoc ? 'Verified Document (PDF)' : 'Not Linked Yet'}</span>
                                          {req.referenceFileSize && <span>• {Math.round(req.referenceFileSize / 1024)} KB</span>}
                                        </div>
                                      </div>
                                    </div>

                                    {docUrl && (
                                      <a
                                        href={docUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 rounded-lg text-[11px] font-semibold shrink-0 cursor-pointer"
                                      >
                                        <Eye className="w-3 h-3" />
                                        <span>View PDF</span>
                                      </a>
                                    )}
                                  </div>
                                );
                              })()
                            ) : req.status === 'missing' ? (
                              <p className="text-[11px] text-rose-700 flex items-center space-x-1 font-medium">
                                <AlertTriangle className="w-3 h-3 shrink-0 text-rose-600" />
                                <span>{req.missingWarning || 'Information required for publication.'}</span>
                              </p>
                            ) : req.value ? (
                              <p className="text-[11px] text-slate-700 truncate max-w-xl font-mono bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md inline-block">
                                {typeof req.value === 'object' ? JSON.stringify(req.value) : String(req.value)}
                              </p>
                            ) : null}

                            {/* Why We Need This & Data Source */}
                            <div className="flex items-center space-x-3 text-[10px] text-slate-500 flex-wrap gap-y-1 pt-0.5">
                              {req.whyNeeded && (
                                <span className="flex items-center space-x-1 text-slate-600">
                                  <HelpCircle className="w-2.5 h-2.5 text-slate-400" />
                                  <span>{req.whyNeeded}</span>
                                </span>
                              )}

                              {req.source && (
                                <span className="flex items-center space-x-1 text-[#4338CA] bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded">
                                  <span>Source: {req.source}</span>
                                  {onNavigateToSection && req.sourceSection && (
                                    <button
                                      type="button"
                                      onClick={() => onNavigateToSection(req.sourceSection!)}
                                      className="inline-flex items-center space-x-0.5 hover:underline font-semibold cursor-pointer ml-1"
                                      title={`Navigate to ${req.source}`}
                                    >
                                      <span>[Jump]</span>
                                      <ArrowRight className="w-2.5 h-2.5" />
                                    </button>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action Button - In-page Modal Trigger */}
                          <div className="flex items-center space-x-2 shrink-0 self-start sm:self-center">
                            {req.status === 'missing' ? (
                              <button
                                type="button"
                                onClick={() => handleOpenVerificationModal(pageKey, cfg.label, req)}
                                className="px-3 py-1.5 bg-[#4338CA] hover:bg-[#3730A3] text-white text-[11px] font-bold rounded-lg shadow-2xs transition cursor-pointer"
                              >
                                Provide Details
                              </button>
                            ) : req.status === 'needs_confirmation' || req.status === 'auto_filled' || req.status === 'prefilled' ? (
                              <button
                                type="button"
                                onClick={() => handleOpenVerificationModal(pageKey, cfg.label, req)}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold rounded-lg shadow-2xs transition cursor-pointer"
                              >
                                Verify & Confirm
                              </button>
                            ) : req.status === 'confirmed' ? (
                              <button
                                type="button"
                                onClick={() => handleOpenVerificationModal(pageKey, cfg.label, req)}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-medium rounded-lg transition cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3 text-slate-500" />
                                <span>Edit</span>
                              </button>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 9. Custom Specialized Pages Section */}
      <div className="bg-[#FAF7F2] border border-[#E2E8F0] p-4 sm:p-5 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="font-bold text-sm text-[#131B2E]">Custom Specialized Pages</h4>
            <p className="text-[#64748B] text-[11px]">
              Add unique pages mandated by trust bylaws, international curricula, or bespoke institutional programs.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddCustomPage}
            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-[#4338CA] hover:bg-[#3730A3] text-white rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Page</span>
          </button>
        </div>

        {customPages.map((cp, idx) => (
          <div key={cp.id} className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <span className="font-bold text-xs text-[#131B2E]">Custom Page #{idx + 1}</span>
              <button
                type="button"
                onClick={() => handleRemoveCustomPage(idx)}
                className="text-rose-600 hover:text-rose-800 text-xs font-semibold cursor-pointer"
              >
                Delete
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Page Title</label>
                <input
                  type="text"
                  value={cp.title}
                  onChange={(e) => handleUpdateCustomPage(idx, { title: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">URL Slug</label>
                <input
                  type="text"
                  value={cp.slug}
                  onChange={(e) => handleUpdateCustomPage(idx, { slug: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 10. Final Website Specification Approval & Sign-Off Section */}
      <div className={`p-5 sm:p-6 rounded-2xl border transition-all ${
        isWebsiteApproved
          ? 'bg-gradient-to-br from-emerald-500/10 via-emerald-50 to-teal-50 border-emerald-300 shadow-sm'
          : readinessBreakdown.canApprove
          ? 'bg-gradient-to-br from-indigo-500/10 via-indigo-50 to-slate-50 border-indigo-300 shadow-sm'
          : 'bg-gradient-to-br from-amber-500/10 via-amber-50 to-orange-50 border-amber-300 shadow-sm'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/5 pb-4">
          <div className="flex items-start space-x-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
              isWebsiteApproved
                ? 'bg-emerald-600 text-white'
                : readinessBreakdown.canApprove
                ? 'bg-[#4338CA] text-white'
                : 'bg-amber-500 text-white'
            }`}>
              {isWebsiteApproved ? (
                <Lock className="w-6 h-6" />
              ) : readinessBreakdown.canApprove ? (
                <CheckCheck className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                  isWebsiteApproved
                    ? 'text-emerald-800 bg-emerald-100'
                    : readinessBreakdown.canApprove
                    ? 'text-indigo-800 bg-indigo-100'
                    : 'text-amber-800 bg-amber-100'
                }`}>
                  {isWebsiteApproved
                    ? 'Specification Certified & Locked'
                    : readinessBreakdown.canApprove
                    ? 'Ready for Final Sign-Off'
                    : 'Publication Blockers Pending'}
                </span>
              </div>
              <h3 className="font-extrabold text-base sm:text-lg text-[#131B2E] mt-1">
                Final Website Specification Sign-Off
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed max-w-2xl">
                Locking this specification signals to your web engineering team that all institutional data, branding palettes, staff directories, facility media, and statutory regulatory documents have been thoroughly verified and approved.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0 self-start md:self-center">
            {isWebsiteApproved ? (
              <button
                type="button"
                onClick={handleRevokeWebsiteApproval}
                className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition cursor-pointer"
              >
                <Unlock className="w-4 h-4 text-slate-500" />
                <span>Unlock for Modifications</span>
              </button>
            ) : readinessBreakdown.canApprove ? (
              <button
                type="button"
                onClick={handleApproveWebsiteSpecification}
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Approve &amp; Lock Website Specification</span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-200 text-slate-500 text-xs font-bold rounded-xl cursor-not-allowed"
                title="Resolve publication blockers before locking specification"
              >
                <Lock className="w-4 h-4" />
                <span>Resolve Blockers to Sign Off</span>
              </button>
            )}
          </div>
        </div>

        {/* Approval Details or Blocker List */}
        {isWebsiteApproved ? (
          <div className="mt-4 p-3.5 bg-white/90 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2.5 text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold block">
                  Official Specification Locked
                </span>
                <span className="text-[11px] text-emerald-800">
                  Approved by {websiteApprovedBy || 'Authorized School Administrator'} on{' '}
                  {websiteApprovedAt ? new Date(websiteApprovedAt).toLocaleString() : 'N/A'}.
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-2.5 py-1 rounded-lg shrink-0 self-start sm:self-center">
              ✓ Ready for Build
            </span>
          </div>
        ) : !readinessBreakdown.canApprove && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-900">
                Action Required Before Sign-Off ({readinessBreakdown.unresolvedBlockers.length + readinessBreakdown.complianceBlockersCount} items):
              </span>
              <span className="text-[11px] text-slate-500">
                All statutory requirements must be addressed
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Compliance blockers */}
              {readinessBreakdown.complianceBlockersList.map((cb) => (
                <div key={cb.key} className="p-3 bg-white border border-rose-200 rounded-xl shadow-2xs space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-1.5 min-w-0">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span className="font-bold text-rose-950 truncate">{cb.label}</span>
                    </div>
                    <span className="text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded shrink-0">
                      Statutory Compliance
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">{cb.message}</p>
                  {onNavigateToSection && cb.sourceSection && (
                    <button
                      type="button"
                      onClick={() => onNavigateToSection(cb.sourceSection)}
                      className="inline-flex items-center space-x-1 text-[11px] font-bold text-[#4338CA] hover:underline cursor-pointer pt-0.5"
                    >
                      <span>Jump to {cb.sourceSectionName}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}

              {/* General missing publication blockers */}
              {readinessBreakdown.unresolvedBlockers.slice(0, 4).map((b) => (
                <div key={b.key} className="p-3 bg-white border border-amber-200 rounded-xl shadow-2xs space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-1.5 min-w-0">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="font-bold text-amber-950 truncate">{b.label}</span>
                    </div>
                    <span className="text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded shrink-0">
                      {b.pageLabel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">{b.message}</p>
                  {onNavigateToSection && b.sourceSection && (
                    <button
                      type="button"
                      onClick={() => onNavigateToSection(b.sourceSection)}
                      className="inline-flex items-center space-x-1 text-[11px] font-bold text-[#4338CA] hover:underline cursor-pointer pt-0.5"
                    >
                      <span>Jump to {b.sourceSectionName}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 11. Single Item Verification / Edit Modal Dialog */}
      {activeModalItem && (
        <ModalPortal isOpen={true}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="verification-modal-title"
            className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs"
          >

          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100vh-3rem)] my-auto">

            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-[#4338CA]" />
                <h3 id="verification-modal-title" className="font-bold text-sm text-[#131B2E]">
                  Verify Requirement
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveModalItem(null);
                  setIsEditingModalValue(false);
                }}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {activeModalItem.pageLabel}
                </span>
                <h4 className="text-base font-extrabold text-[#131B2E] mt-0.5">
                  {activeModalItem.requirement.label}
                </h4>
              </div>

              {/* Status Pill */}
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-500 font-medium">Current Status:</span>
                {renderStatusBadge(activeModalItem.requirement.status, activeModalItem.requirement.isCmsFutureContent)}
              </div>

              {/* Conflict Resolution Banner & Candidate Radios (Section 10) */}
              {activeModalItem.requirement.hasConflict &&
                activeModalItem.requirement.conflictingCandidates &&
                activeModalItem.requirement.conflictingCandidates.length > 1 && (
                  <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl space-y-2.5">
                    <div className="flex items-start space-x-2 text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-xs block">Information Needs Review</span>
                        <p className="text-[11px] text-amber-800 leading-relaxed">
                          We found different values in your onboarding information. Please select which candidate to confirm or enter a different name:
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      {activeModalItem.requirement.conflictingCandidates.map((candidate, cIdx) => (
                        <label
                          key={cIdx}
                          className={`flex items-start space-x-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                            !modalConflictIsCustom && modalConflictSelectedValue === candidate.value
                              ? 'bg-white border-[#4338CA] shadow-2xs ring-1 ring-[#4338CA]/20'
                              : 'bg-white/80 border-amber-200 hover:bg-white'
                          }`}
                        >
                          <input
                            type="radio"
                            name="modal-candidate"
                            checked={!modalConflictIsCustom && modalConflictSelectedValue === candidate.value}
                            onChange={() => {
                              setModalConflictSelectedValue(candidate.value);
                              setModalConflictIsCustom(false);
                              setModalEditValue(candidate.value);
                            }}
                            className="mt-0.5 text-[#4338CA] focus:ring-[#4338CA]"
                          />
                          <div className="text-xs">
                            <span className="font-bold text-slate-900 block">{candidate.value}</span>
                            <span className="text-[10px] text-slate-500">From {candidate.source}</span>
                          </div>
                        </label>
                      ))}

                      <label
                        className={`flex items-start space-x-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                          modalConflictIsCustom
                            ? 'bg-white border-[#4338CA] shadow-2xs ring-1 ring-[#4338CA]/20'
                            : 'bg-white/80 border-amber-200 hover:bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="modal-candidate"
                          checked={modalConflictIsCustom}
                          onChange={() => {
                            setModalConflictIsCustom(true);
                          }}
                          className="mt-0.5 text-[#4338CA] focus:ring-[#4338CA]"
                        />
                        <div className="text-xs flex-1">
                          <span className="font-bold text-slate-900 block">Enter a different name</span>
                          {modalConflictIsCustom && (
                            <input
                              type="text"
                              value={modalConflictSelectedValue}
                              onChange={(e) => {
                                setModalConflictSelectedValue(e.target.value);
                                setModalEditValue(e.target.value);
                              }}
                              placeholder="Enter updated name..."
                              className="mt-2 w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:border-[#4338CA] focus:outline-hidden"
                            />
                          )}
                        </div>
                      </label>
                    </div>
                  </div>
                )}

              {/* Why is this required? */}
              {activeModalItem.requirement.whyNeeded && (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start space-x-2.5 text-xs text-blue-900">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Why is this required?</span>
                    <span className="text-[11px] leading-relaxed">{activeModalItem.requirement.whyNeeded}</span>
                  </div>
                </div>
              )}

              {/* Data Source Context */}
              {activeModalItem.requirement.source ? (
                <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500 font-medium">Source:</span>
                    <span className="font-semibold text-[#4338CA]">{activeModalItem.requirement.source}</span>
                  </div>
                  {onNavigateToSection && activeModalItem.requirement.sourceSection && (
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateToSection(activeModalItem.requirement.sourceSection!);
                        setActiveModalItem(null);
                      }}
                      className="inline-flex items-center space-x-1 text-xs font-bold text-[#4338CA] hover:underline cursor-pointer"
                    >
                      <span>Jump to Section</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <span className="text-slate-500 font-medium">Source:</span>
                  <span className="text-slate-700 font-medium">Not provided in earlier sections — please enter directly for website</span>
                </div>
              )}

              {/* Edit Mode vs Display Mode */}
              {isEditingModalValue ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      Enter / Edit Value:
                    </label>
                    <span className="text-[10px] text-amber-700 font-medium">
                      Saving sets status to &ldquo;Needs Your Review&rdquo; until confirmed
                    </span>
                  </div>
                  {activeModalItem.requirement.type === 'textarea' ? (
                    <textarea
                      rows={4}
                      value={modalEditValue}
                      onChange={(e) => setModalEditValue(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:border-[#4338CA] focus:outline-hidden"
                      placeholder={`Enter ${activeModalItem.requirement.label}...`}
                    />
                  ) : (
                    <input
                      type="text"
                      value={modalEditValue}
                      onChange={(e) => setModalEditValue(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:border-[#4338CA] focus:outline-hidden"
                      placeholder={`Enter ${activeModalItem.requirement.label}...`}
                    />
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Current Recorded Value:
                  </label>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 break-all">
                    {activeModalItem.requirement.value ? (
                      String(activeModalItem.requirement.value)
                    ) : (
                      <span className="text-slate-400 italic">No value provided</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer with Safe Editing buttons (Section 8: Editing != Confirmation) */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setActiveModalItem(null);
                  setIsEditingModalValue(false);
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center space-x-2">
                {isEditingModalValue ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditingModalValue(false)}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveModalEdit}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-2xs cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </>
                ) : (
                  <>
                    {activeModalItem.requirement.status !== 'missing' && (
                      <button
                        type="button"
                        onClick={() => setIsEditingModalValue(true)}
                        className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        Edit Value
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleConfirmModalItem()}
                      className="px-4 py-1.5 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold shadow-2xs cursor-pointer"
                    >
                      Confirm as Correct
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </ModalPortal>
    )}




      {/* 11. Guided Multi-Step Review Modal */}
      <ModalPortal isOpen={isGuidedReviewOpen}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="guided-review-title"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100vh-3rem)] my-auto">

            {isGuidedReviewComplete ? (
              /* Guided Review Completion Screen (Section 7) */
              <div className="p-6 sm:p-8 text-center space-y-5">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 id="guided-review-title" className="text-lg font-extrabold text-[#131B2E]">
                    Review Complete
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto leading-relaxed">
                    You&apos;ve reviewed all currently required website information. Your configurations are saved.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 py-3.5 px-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <span className="text-xl font-extrabold text-emerald-600 block">
                      {aggregates.confirmedCount}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      Confirmed
                    </span>
                  </div>
                  <div>
                    <span className="text-xl font-extrabold text-rose-600 block">
                      {aggregates.missingCount}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      Missing Remaining
                    </span>
                  </div>
                  <div>
                    <span className="text-xl font-extrabold text-[#4338CA] block">
                      {aggregates.readyPages} / {aggregates.totalPages}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      Ready Pages
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsGuidedReviewOpen(false);
                      setIsGuidedReviewComplete(false);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    Return to Website Requirements
                  </button>
                </div>
              </div>
            ) : aggregates.actionRequiredQueue[guidedReviewIndex] ? (
              <>
                {/* Header with progress */}
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#4338CA] block">
                      Guided Requirements Review
                    </span>
                    <span id="guided-review-title" className="text-xs font-extrabold text-slate-800">
                      Item {guidedReviewIndex + 1} of {aggregates.actionRequiredQueue.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsGuidedReviewOpen(false)}
                    className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                    aria-label="Close review"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-1.5">
                  <div
                    className="bg-[#4338CA] h-full transition-all duration-300"
                    style={{
                      width: `${((guidedReviewIndex + 1) / aggregates.actionRequiredQueue.length) * 100}%`,
                    }}
                  />
                </div>

                {/* Body */}
                {(() => {
                  const current = aggregates.actionRequiredQueue[guidedReviewIndex];
                  return (
                    <div className="p-5 space-y-4 overflow-y-auto">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Page: {current.pageLabel}
                        </span>
                        <h4 className="text-base font-extrabold text-[#131B2E] mt-0.5">
                          {current.requirement.label}
                        </h4>
                      </div>

                      {/* Current Status Badge */}
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] text-slate-500 font-medium">Status:</span>
                        {renderStatusBadge(current.requirement.status, current.requirement.isCmsFutureContent)}
                      </div>

                      {/* Conflict Resolution UI in Guided Review (Section 10) */}
                      {current.requirement.hasConflict &&
                        current.requirement.conflictingCandidates &&
                        current.requirement.conflictingCandidates.length > 1 && (
                          <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl space-y-2.5">
                            <div className="flex items-start space-x-2 text-amber-900">
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-xs block">Information Needs Review</span>
                                <p className="text-[11px] text-amber-800 leading-relaxed">
                                  We found different values across your onboarding information. Please select which one to use:
                                </p>
                              </div>
                            </div>

                            <div className="space-y-1.5 pt-1">
                              {current.requirement.conflictingCandidates.map((cand, cIdx) => (
                                <label
                                  key={cIdx}
                                  className={`flex items-start space-x-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                                    !guidedConflictIsCustom && guidedConflictSelectedValue === cand.value
                                      ? 'bg-white border-[#4338CA] shadow-2xs ring-1 ring-[#4338CA]/20'
                                      : 'bg-white/80 border-amber-200 hover:bg-white'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name="guided-candidate"
                                    checked={!guidedConflictIsCustom && guidedConflictSelectedValue === cand.value}
                                    onChange={() => {
                                      setGuidedConflictSelectedValue(cand.value);
                                      setGuidedConflictIsCustom(false);
                                      setGuidedEditValue(cand.value);
                                    }}
                                    className="mt-0.5 text-[#4338CA] focus:ring-[#4338CA]"
                                  />
                                  <div className="text-xs">
                                    <span className="font-bold text-slate-900 block">{cand.value}</span>
                                    <span className="text-[10px] text-slate-500">From {cand.source}</span>
                                  </div>
                                </label>
                              ))}

                              <label
                                className={`flex items-start space-x-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                                  guidedConflictIsCustom
                                    ? 'bg-white border-[#4338CA] shadow-2xs ring-1 ring-[#4338CA]/20'
                                    : 'bg-white/80 border-amber-200 hover:bg-white'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="guided-candidate"
                                  checked={guidedConflictIsCustom}
                                  onChange={() => {
                                    setGuidedConflictIsCustom(true);
                                  }}
                                  className="mt-0.5 text-[#4338CA] focus:ring-[#4338CA]"
                                />
                                <div className="text-xs flex-1">
                                  <span className="font-bold text-slate-900 block">Enter a different name</span>
                                  {guidedConflictIsCustom && (
                                    <input
                                      type="text"
                                      value={guidedConflictSelectedValue}
                                      onChange={(e) => {
                                        setGuidedConflictSelectedValue(e.target.value);
                                        setGuidedEditValue(e.target.value);
                                      }}
                                      placeholder="Enter updated name..."
                                      className="mt-2 w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:border-[#4338CA] focus:outline-hidden"
                                    />
                                  )}
                                </div>
                              </label>
                            </div>
                          </div>
                        )}

                      {current.requirement.whyNeeded && (
                        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start space-x-2.5 text-xs text-blue-900">
                          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block">Why We Need This</span>
                            <span className="text-[11px] leading-relaxed">{current.requirement.whyNeeded}</span>
                          </div>
                        </div>
                      )}

                      {current.requirement.source ? (
                        <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-slate-500 font-medium">Auto-filled from:</span>
                            <span className="font-bold text-[#4338CA]">{current.requirement.source}</span>
                          </div>
                          {onNavigateToSection && current.requirement.sourceSection && (
                            <button
                              type="button"
                              onClick={() => {
                                onNavigateToSection(current.requirement.sourceSection!);
                                setIsGuidedReviewOpen(false);
                              }}
                              className="inline-flex items-center space-x-1 text-xs font-bold text-[#4338CA] hover:underline cursor-pointer"
                            >
                              <span>Jump</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                          <span className="text-slate-500 font-medium">Source:</span>
                          <span className="text-slate-700 font-medium">Not provided in earlier sections — please provide directly for website</span>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700">
                            {isGuidedEditing ? 'Enter / Edit Value:' : 'Confirm Value:'}
                          </label>
                          {!isGuidedEditing && (
                            <button
                              type="button"
                              onClick={() => setIsGuidedEditing(true)}
                              className="text-[11px] font-bold text-[#4338CA] hover:underline cursor-pointer"
                            >
                              Change Value
                            </button>
                          )}
                        </div>

                        {isGuidedEditing ? (
                          current.requirement.type === 'textarea' ? (
                            <textarea
                              rows={3}
                              value={guidedEditValue}
                              onChange={(e) => setGuidedEditValue(e.target.value)}
                              className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:border-[#4338CA] focus:outline-hidden"
                              placeholder={`Enter ${current.requirement.label}...`}
                            />
                          ) : (
                            <input
                              type="text"
                              value={guidedEditValue}
                              onChange={(e) => setGuidedEditValue(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:border-[#4338CA] focus:outline-hidden"
                              placeholder={`Enter ${current.requirement.label}...`}
                            />
                          )
                        ) : (
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 break-all">
                            {current.requirement.value ? (
                              String(current.requirement.value)
                            ) : (
                              <span className="text-slate-400 italic">No value provided</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Footer actions with Safe Editing */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleSkipGuidedCurrent}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Skip For Now
                  </button>

                  <div className="flex items-center space-x-2">
                    {isGuidedEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setIsGuidedEditing(false)}
                          className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          Cancel Edit
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveGuidedEdit}
                          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-2xs cursor-pointer"
                        >
                          Save Edit
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleConfirmGuidedCurrent()}
                        className="px-4 py-1.5 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold shadow-2xs cursor-pointer"
                      >
                        {guidedReviewIndex === aggregates.actionRequiredQueue.length - 1
                          ? 'Confirm & Finish'
                          : 'Confirm & Next →'}
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </ModalPortal>


      {/* 12. Privacy Policy Modal Dialog */}
      <ModalPortal isOpen={isPrivacyModalOpen}>
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100vh-3rem)] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">

            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-sm text-[#131B2E]">
                  Edit Generated Standard Privacy Policy
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPrivacyModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              <p className="text-[11px] text-slate-500">
                You can customize this neutral standard policy text before final website generation.
              </p>
              <textarea
                rows={16}
                value={privacyPolicyDraft}
                onChange={(e) => setPrivacyPolicyDraft(e.target.value)}
                className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:border-[#4338CA] focus:outline-hidden"
              />
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const reset = generatePrivacyPolicyTemplate(
                    privacyPolicyConfig,
                    intakeData.schoolProfile?.schoolName || '',
                    intakeData.schoolProfile?.officialEmail || ''
                  );
                  setPrivacyPolicyDraft(reset);
                }}
                className="text-xs text-[#4338CA] font-semibold hover:underline"
              >
                Reset to Standard Template
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPrivacyModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePrivacyPolicyTemplate}
                  className="px-4 py-1.5 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-semibold shadow-2xs"
                >
                  Save Policy
                </button>
              </div>
            </div>
          </div>
        </div>
      </ModalPortal>


      {/* 13. Server-Authoritative Specification Sign-Off Modal */}
      <ModalPortal isOpen={isSignOffModalOpen}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="signoff-modal-title"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100vh-3rem)] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">

            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 id="signoff-modal-title" className="font-extrabold text-sm text-[#131B2E]">
                    Sign Off &amp; Freeze Website Specification
                  </h3>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Version {(currentApproval?.specificationVersion || 0) + 1} • Production Publication Contract
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSignOffModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg text-xs font-bold"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
              {signOffError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{signOffError}</span>
                </div>
              )}

              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1.5 text-xs text-emerald-900">
                <div className="font-bold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verification Complete</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  All {readinessBreakdown.websitePagesCount} website pages, photographic assets, and statutory documents have been validated. Locking creates an immutable snapshot with a deterministic SHA-256 fingerprint.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Approver Full Name *
                  </label>
                  <input
                    type="text"
                    value={signOffName}
                    onChange={(e) => setSignOffName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#4338CA] focus:outline-hidden"
                    placeholder="e.g. Dr. Sunita Sharma"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Official Email *
                    </label>
                    <input
                      type="email"
                      value={signOffEmail}
                      onChange={(e) => setSignOffEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#4338CA] focus:outline-hidden"
                      placeholder="e.g. principal@dpa.edu.in"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Administrative Role
                    </label>
                    <input
                      type="text"
                      value={signOffRole}
                      onChange={(e) => setSignOffRole(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#4338CA] focus:outline-hidden"
                      placeholder="e.g. Super Administrator"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Sign-Off Directives / Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={signOffNotes}
                    onChange={(e) => setSignOffNotes(e.target.value)}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:border-[#4338CA] focus:outline-hidden"
                    placeholder="Any specific instructions for developers or deployment teams..."
                  />
                </div>

                {/* Declaration Checkbox */}
                <label className="flex items-start space-x-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={signOffDeclared}
                    onChange={(e) => setSignOffDeclared(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-[#4338CA] focus:ring-[#4338CA]"
                  />
                  <span className="text-[11px] text-slate-700 leading-snug">
                    I confirm that I have reviewed the school&apos;s information, actual assets, and statutory documents. I approve this versioned specification as the single authoritative blueprint for public website publication.
                  </span>
                </label>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsSignOffModalOpen(false)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteSignOff}
                disabled={!signOffDeclared || !signOffName.trim() || !signOffEmail.trim()}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Sign Off &amp; Lock Specification</span>
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>

      {/* 14. Reopen Specification Confirmation Modal */}
      <ModalPortal isOpen={isReopenModalOpen}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reopen-modal-title"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl max-w-md w-full flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100vh-3rem)]">

            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Unlock className="w-4 h-4" />
                </div>
                <h3 id="reopen-modal-title" className="font-extrabold text-sm text-[#131B2E]">
                  Reopen Specification for Edits
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReopenModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg text-xs font-bold"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                Reopening will mark version <strong>v{currentApproval?.specificationVersion || 1}</strong> as superseded.
              </p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-snug">
                Once you finish adjusting pages, assets, or content, you must re-verify and sign off a new version to certify it for public website generation.
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsReopenModalOpen(false)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Keep Locked
              </button>
              <button
                type="button"
                onClick={handleExecuteReopen}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Confirm &amp; Reopen</span>
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>

      {/* 15. Approval Version History Modal */}
      <ModalPortal isOpen={isHistoryModalOpen}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="history-modal-title"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100vh-3rem)] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#4338CA] text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 id="history-modal-title" className="font-extrabold text-sm text-[#131B2E]">
                    Specification Version History
                  </h3>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Immutable Audit Log of Website Sign-Offs
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg text-xs font-bold"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3">
              {currentApproval && (
                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-extrabold text-emerald-950">
                        Version {currentApproval.specificationVersion}
                      </span>
                      <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.2 rounded">
                        {currentApproval.status === 'approved' ? (invalidationResult.isInvalidated ? 'Requires Re-verification' : 'Active Approved') : currentApproval.status}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {new Date(currentApproval.approvedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-900">
                    Approved by <strong>{currentApproval.approvedBy.name}</strong> ({currentApproval.approvedBy.email})
                  </p>
                  <div className="text-[10px] font-mono text-slate-600 bg-white p-2 rounded border border-slate-200 break-all">
                    SHA-256: {currentApproval.specificationHash}
                  </div>
                  {currentApproval.notes && (
                    <p className="text-[11px] italic text-slate-600 bg-white/60 p-2 rounded">
                      &quot;{currentApproval.notes}&quot;
                    </p>
                  )}
                </div>
              )}

              {/* Previous History */}
              {(intakeData.websiteRequirements?.approvalHistory || []).length > 0 ? (
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Previous Versions
                  </span>
                  {(intakeData.websiteRequirements?.approvalHistory || []).map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">
                          Version {rec.specificationVersion}
                        </span>
                        <span className="text-[9px] text-slate-500 bg-slate-200 px-1.5 py-0.2 rounded font-semibold">
                          Superseded
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Approved by {rec.approvedBy.name} on {new Date(rec.approvedAt).toLocaleString()}
                      </p>
                      <div className="text-[10px] font-mono text-slate-500 truncate">
                        SHA-256: {rec.specificationHash}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                !currentApproval && (
                  <p className="text-center py-6 text-xs text-slate-400 italic">
                    No approval versions recorded yet.
                  </p>
                )
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
    </div>
  );
}

