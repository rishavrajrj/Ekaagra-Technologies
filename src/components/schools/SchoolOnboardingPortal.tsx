'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  School,
  Building2,
  Users,
  Palette,
  Globe,
  BookOpen,
  GraduationCap,
  UserCheck,
  Layers,
  Calendar,
  DollarSign,
  Clock,
  Award,
  Bus,
  CheckCircle2,
  Ban,
  AlertTriangle,
  Save,
  Send,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  FileText,
  Check,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Settings,
  Library as LibraryIcon,
  Home as HomeIcon,
  Smartphone,
  Share2,
  Download,
  AlertCircle,
  Lock,
  ArrowRight,
  ExternalLink,
  Menu,
  X,
  Info,
  Upload,
  Image as ImageIcon,
  Maximize2,
  Loader2,
  RotateCw,
} from 'lucide-react';
import { formatBytes } from '@/lib/imageUtils';
import Logo from '@/components/ui/Logo';
import ModalPortal from '@/components/ui/ModalPortal';
import SchoolIdentityCard from './SchoolIdentityCard';
import SchoolAssetChecklistSection from './SchoolAssetChecklistSection';
import CampusImagesSection from './CampusImagesSection';
import PersonPhotoSection from './PersonPhotoSection';
import DeskMessageEditor from './DeskMessageEditor';
import SchoolContentSection from './SchoolContentSection';
import { getSection6StatusSummary } from '@/lib/schoolContentGenerator';
import AcademicStructureSection from './AcademicStructureSection';
import {
  deriveSchoolAcademicSummary,
  deriveCampusAcademicScope,
  deriveCampusClassRange,
  reconcileClassesForAcademicLevels,
  DEFAULT_LEVEL_CLASS_PRESETS,
  DEFAULT_ACADEMIC_LEVELS,
  normalizeCampusAcademicData,
  getSchoolTypeConfig,
  getSuggestedClassesForSchoolType,
  deriveClassesOfferedSummary,
} from '@/lib/academicStructureUtils';
import StaffFacultySection from './StaffFacultySection';
import StudentInformationSection from './StudentInformationSection';
import TransportFleetSection from './TransportFleetSection';
import LibraryManagementSection from './LibraryManagementSection';
import HostelResidentialSection from './HostelResidentialSection';
import CampusFacilitiesSection from './CampusFacilitiesSection';
import CommunicationPreferencesSection from './CommunicationPreferencesSection';
import { normalizeCommunicationData } from '@/lib/communicationUtils';
import MobileApplicationRequirementsSection from './MobileApplicationRequirementsSection';
import PortalRequirementsSection from './PortalRequirementsSection';
import MediaAssetsSection from './MediaAssetsSection';
import CampusStatisticsSection from './CampusStatisticsSection';
import SectionPhotoGallery, { type SectionPhotoTag } from './SectionPhotoGallery';
import { syncDerivedStatisticsToFacilities } from '@/lib/campusStatisticsUtils';
import WebsiteScopeSection from './WebsiteScopeSection';
import CustomRequirementsSection from './CustomRequirementsSection';

const FACILITIES_PHOTO_TAGS: readonly SectionPhotoTag[] = [
  { value: 'smart_classroom', label: 'Smart Classroom', description: 'Digital boards & interactive multimedia classrooms' },
  { value: 'science_lab', label: 'Composite Science Lab', description: 'Physics, Chemistry & Biology laboratory spaces' },
  { value: 'computer_lab', label: 'Computer Laboratory', description: 'Modern IT lab with desktop workstations' },
  { value: 'sports_field', label: 'Sports Ground & Courts', description: 'Playground, football turf, basketball/badminton courts' },
  { value: 'auditorium', label: 'Auditorium & Stage', description: 'Multipurpose auditorium and cultural stage' },
  { value: 'cafeteria', label: 'Cafeteria & Dining Hall', description: 'Student mess and hygienic dining infrastructure' },
  { value: 'medical_room', label: 'Infirmary & First Aid Bay', description: 'Medical room and emergency health bay' },
  { value: 'campus_overview', label: 'Campus Architecture & Gate', description: 'Main building facade, gates, and campus grounds' },
  { value: 'other', label: 'Other Infrastructure', description: 'Other campus facilities and amenities' },
] as const;
import { extractCoordinatesFromUrl } from '@/lib/publicTransportUtils';
import {
  COMMUNICATION_STYLE_CONFIGS,
  MiniWebsitePreview,
  CommunicationStylePreviewModal,
  type StyleConfig,
} from './CommunicationStyleVisuals';
import SchoolAccommodationSelector from './SchoolAccommodationSelector';
import {
  verifySchoolTokenAction,
  saveSchoolIntakeDraftAction,
  submitSchoolIntakeAction,
  updateProjectProductAction,
  respondToChangeRequestAction,
} from '@/app/schoolProjectActions';
import { useFieldScope } from '@/hooks/useFieldScope';
import { type ProductId } from '@/lib/fieldScopeRegistry';
import type {
  SchoolProject,
  UniversalIntakeData,
  SchoolIntakeChangeRequest,
  SchoolProjectCustomField,
  SchoolProjectCustomRequirement,
  CampusBranchData,
  ManagementMember,
  PersonImageData,
  AcademicClassConfig,
  AcademicSubjectConfig,
  FeeStructureItem,
  CustomPageRequirement,
  AdditionalAdminRecord,
} from '@/lib/types';
import { resolveContentBlockText } from '@/lib/types';
import { InstitutionalIdNumberingSelector } from './InstitutionalIdNumberingSelector';
import {
  deriveEntityFormatPattern,
  normalizeInstitutionalIdConfig,
} from '@/lib/institutionalIdNumbering';
import { WebsiteRequirementsSection } from './WebsiteRequirementsSection';
import UniversalVerificationPage from './UniversalVerificationPage';
import AttendanceTimetableSection from './AttendanceTimetableSection';
import {
  INTAKE_SECTIONS,
  INTAKE_CHAPTERS,
  type IntakeSectionKey,
  type IntakeChapterKey,
  type SectionCompletionStatus,
  createInitialIntakeData,
  calculateIntakeCompleteness,
  getApplicableSections,
  deriveSlugFromSchoolName,
  isSectionApplicable,
  getBoardIdentityConfig,
  PRINCIPAL_DESIGNATIONS,
  TRUSTEE_DESIGNATIONS,
  resolveDesignationDisplay,
  isValidGoogleMapsUrl,
  validateMobileAppSection,
  SCHOOL_ACCOMMODATION_OPTIONS,
  normalizeSchoolAccommodationType,
  getSchoolAccommodationLabel,
} from '@/lib/schoolIntake';
import {
  getCountries,
  getStandardCountries,
  getStatesForCountry,
  getStandardStatesForCountry,
  getDistrictsForState,
  getStandardDistrictsForState,
  isKnownCountry,
  isKnownState,
  isKnownDistrict,
  resolveAddressValue,
  normalizeAddressEntity,
  getEffectiveAddress,
  OTHER_OPTION,
} from '@/lib/geography';
import { COUNTRIES, INDIAN_STATES } from '@/lib/geoData';
import AddressDropdownWithOther from './AddressDropdownWithOther';
import DesignationDropdownWithOther from './DesignationDropdownWithOther';
import SchoolDomainSelector from './SchoolDomainSelector';
import AdmissionsSection from './AdmissionsSection';
import FeeStructureSection from './FeeStructureSection';
import CurriculumSection from './CurriculumSection';
import Step12ProjectDeliverySection from './Step12ProjectDeliverySection';
import SecurityPrivacySection from './SecurityPrivacySection';
import { validateSecurityPrivacyData, normalizeSecurityPrivacyData } from '@/lib/securityPrivacyUtils';
import ThirdPartyIntegrationsSection from './ThirdPartyIntegrationsSection';
import { validateIntegrationsData } from '@/lib/integrationsUtils';
import { schoolDomainAllowances, type SchoolProductId } from '@/lib/schoolPricing';
import CampusContextBar from './CampusContextBar';
import {
  isCampusScopedSection,
  getMainCampus,
  getCampusById,
  getCampusDisplayName,
  resolveCampusSectionData,
  setCampusSectionMode,
  updateCampusCustomData,
  handleCampusDeletion,
  handleMainCampusDesignation,
} from '@/lib/campusScopeRegistry';
import type { CampusDataSourceMode } from '@/lib/types';

export { isValidGoogleMapsUrl };
export const isPotentiallyValidGoogleMapsLink = isValidGoogleMapsUrl;

function getLegalEntityConfig(managementType?: string) {
  const norm = (managementType || '').toLowerCase();
  if (norm.includes('society')) {
    return {
      label: 'Registered Society Name *',
      placeholder: 'e.g. Joseph Educational & Welfare Society',
      hint: 'Official legal entity registered under the Societies Registration Act.',
      badge: 'Society',
    };
  }
  if (norm.includes('trust')) {
    return {
      label: 'Registered Trust Name *',
      placeholder: 'e.g. Joseph Educational & Charitable Trust',
      hint: 'Official legal entity registered under the Indian Trusts Act / Trust Deed.',
      badge: 'Trust',
    };
  }
  if (norm.includes('company') || norm.includes('section 8') || norm.includes('foundation')) {
    return {
      label: 'Registered Section 8 Company / Foundation Name *',
      placeholder: 'e.g. Joseph Education Foundation (Sec. 8)',
      hint: 'Incorporated non-profit entity name under the Companies Act.',
      badge: 'Sec. 8',
    };
  }
  if (norm.includes('government')) {
    return {
      label: 'Governing Department / Authority Name',
      placeholder: 'e.g. Department of School Education / KV Sangathan',
      hint: 'Governing government department, ministry, or municipal body.',
      badge: 'Govt Body',
    };
  }
  if (norm.includes('aided')) {
    return {
      label: 'Managing Society / Governing Committee Name *',
      placeholder: 'e.g. Aided School Managing Committee',
      hint: 'Authorized managing society or committee governing the aided school.',
      badge: 'Managing Body',
    };
  }
  return {
    label: 'Legal / Parent Entity Name',
    placeholder: 'e.g. Registered Society, Trust or Foundation Name',
    hint: 'Legal parent organization operating this institution (if applicable).',
    badge: 'Entity',
  };
}

function normalizeBrandTone(tone?: string): string {
  if (!tone) return 'Modern & Progressive';
  if (tone === 'Modern') return 'Modern & Progressive';
  if (tone === 'Traditional') return 'Traditional & Prestigious';
  if (tone === 'Academic') return 'Academic & Scholarly';
  if (tone === 'Minimal') return 'Minimal & Professional';
  if (tone === 'Child-friendly' || tone === 'Vibrant & Child-friendly') return 'Warm & Community-focused';
  if (
    tone === 'Traditional & Prestigious' ||
    tone === 'Modern & Progressive' ||
    tone === 'Academic & Scholarly' ||
    tone === 'Warm & Community-focused' ||
    tone === 'Minimal & Professional'
  ) {
    return tone;
  }
  return tone;
}

const COMMUNICATION_STYLES = [
  {
    value: 'Traditional & Prestigious',
    label: 'Traditional & Prestigious',
    badge: 'Heritage & Dignity',
    description: 'Heritage-driven, formal dignity, and classical institutional distinction.',
    icon: Award,
  },
  {
    value: 'Modern & Progressive',
    label: 'Modern & Progressive',
    badge: 'Innovation & Tech',
    description: 'Dynamic, future-oriented, and centered on innovation and 21st-century growth.',
    icon: Sparkles,
  },
  {
    value: 'Academic & Scholarly',
    label: 'Academic & Scholarly',
    badge: 'Rigor & Research',
    description: 'Intellectual rigor, research-led pedagogy, and foundational scholarship.',
    icon: BookOpen,
  },
  {
    value: 'Warm & Community-focused',
    label: 'Warm & Community-focused',
    badge: 'Inclusive & Nurturing',
    description: 'Compassionate, family-oriented, inclusive, and dedicated to student care.',
    icon: Users,
  },
  {
    value: 'Minimal & Professional',
    label: 'Minimal & Professional',
    badge: 'Clean & Structured',
    description: 'Clean, structured, and modern clarity with executive institutional tone.',
    icon: Building2,
  },
] as const;

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
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Autosave & UI state
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);
  const [submittedVersion, setSubmittedVersion] = useState<number>(1);
  const [activeChapterFilter, setActiveChapterFilter] = useState<IntakeChapterKey | 'all'>('all');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showDomainSetupModal, setShowDomainSetupModal] = useState(false);
  const [previewingStyle, setPreviewingStyle] = useState<StyleConfig | null>(null);
  const [designationCustomCache, setDesignationCustomCache] = useState<Record<string, string>>({});
  const [isMoreStatsExpanded, setIsMoreStatsExpanded] = useState(false);
  const [isScopeExpanded, setIsScopeExpanded] = useState(false);
  const [domainStepError, setDomainStepError] = useState<string | null>(null);
  const [integrationsStepError, setIntegrationsStepError] = useState<string | null>(null);
  const [mobileSectionSubmitted, setMobileSectionSubmitted] = useState(false);
  const [securitySectionErrors, setSecuritySectionErrors] = useState<Record<string, string>>({});
  const [selectedProductId, setSelectedProductId] = useState<ProductId>('school-complete');
  const [activeCampusId, setActiveCampusId] = useState<string>('');

  // Operational Change Request remediation states
  const [respondingCR, setRespondingCR] = useState<SchoolIntakeChangeRequest | null>(null);
  const [crResponseText, setCrResponseText] = useState('');
  const [crUpdatedValue, setCrUpdatedValue] = useState('');
  const [isSubmittingCR, setIsSubmittingCR] = useState(false);
  const [crSubmitError, setCrSubmitError] = useState<string | null>(null);

  const handleSubmitCRResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!respondingCR || !crResponseText.trim()) return;
    setIsSubmittingCR(true);
    setCrSubmitError(null);
    const res = await respondToChangeRequestAction({
      token,
      requestId: respondingCR.id,
      schoolResponse: crResponseText.trim(),
      updatedValue: crUpdatedValue.trim() || undefined,
    });
    if (res.success) {
      setChangeRequests((prev) =>
        prev.map((r) =>
          r.id === respondingCR.id
            ? {
                ...r,
                status: 'ready_for_review',
                school_response: crResponseText.trim(),
                school_updated_value: crUpdatedValue.trim() || r.current_value,
              }
            : r
        )
      );
      setRespondingCR(null);
      setCrResponseText('');
      setCrUpdatedValue('');
    } else {
      setCrSubmitError(res.error || 'Failed to submit correction.');
    }
    setIsSubmittingCR(false);
  };

  const getFieldCR = useCallback(
    (sectionKey: string, fieldKey?: string, assetId?: string): SchoolIntakeChangeRequest | undefined => {
      if (!changeRequests || changeRequests.length === 0) return undefined;
      const activeList = changeRequests.filter(
        (cr) => cr.status === 'open' || cr.status === 'waiting_for_school' || cr.status === 'ready_for_review'
      );

      return activeList.find((cr) => {
        if (assetId && (cr.asset_id === assetId || cr.field_key === assetId)) {
          return true;
        }
        if (fieldKey) {
          const crKey = (cr.field_key || '').toLowerCase();
          const targetKey = fieldKey.toLowerCase();
          const targetLeaf = targetKey.split('.').pop() || targetKey;
          const crLeaf = crKey.split('.').pop() || crKey;

          if (crKey === targetKey || crLeaf === targetLeaf) return true;
          if (crKey === `${sectionKey.toLowerCase()}.${targetLeaf}`) return true;
          if (targetKey === `${(cr.section_key || '').toLowerCase()}.${crLeaf}`) return true;

          // Normalized aliases
          const aliasPairs = [
            ['yearofestablishment', 'establishedyear'],
            ['officialphone', 'phone'],
            ['officialphone', 'contactphone'],
            ['officialemail', 'email'],
            ['legalinstitutionname', 'legalname'],
            ['schoolname', 'name'],
            ['maincampusaddress', 'address'],
            ['maincampusphone', 'contactphone'],
            ['principalname', 'principal_name'],
            ['logourl', 'logo_primary'],
          ];

          for (const [a, b] of aliasPairs) {
            if ((targetLeaf === a && crLeaf === b) || (targetLeaf === b && crLeaf === a)) {
              return true;
            }
          }
        }
        return false;
      });
    },
    [changeRequests]
  );

  const getFieldWrapperClass = useCallback(
    (cr?: SchoolIntakeChangeRequest) => {
      if (!cr) return '';
      const isPending = cr.status === 'open' || cr.status === 'waiting_for_school';
      if (isPending) {
        return 'border-2 border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/20 bg-amber-50/30 dark:bg-amber-950/20 rounded-2xl p-3 sm:p-3.5 space-y-1.5 shadow-xs transition-all';
      }
      return 'border-2 border-indigo-300 dark:border-indigo-600 ring-2 ring-indigo-300/20 bg-indigo-50/15 dark:bg-indigo-950/15 rounded-2xl p-3 sm:p-3.5 space-y-1.5 shadow-xs transition-all';
    },
    []
  );

  const renderCRBadge = useCallback(
    (cr?: SchoolIntakeChangeRequest) => {
      if (!cr) return null;
      const isPending = cr.status === 'open' || cr.status === 'waiting_for_school';
      return (
        <span
          className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
            isPending
              ? 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800 animate-pulse'
              : 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-200 dark:border-indigo-800'
          }`}
        >
          <AlertCircle className="w-3 h-3 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{isPending ? 'CHANGES REQUESTED' : 'IN REVIEW'}</span>
        </span>
      );
    },
    []
  );

  const renderFieldCRAlert = useCallback(
    (cr?: SchoolIntakeChangeRequest) => {
      if (!cr) return null;
      const isPending = cr.status === 'open' || cr.status === 'waiting_for_school';

      return (
        <div
          className={`mt-2 rounded-xl p-3 border text-xs transition-all ${
            isPending
              ? 'bg-amber-100/90 border-amber-300 text-amber-950 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-200 shadow-2xs'
              : 'bg-indigo-50 border-indigo-200 text-indigo-950 dark:bg-indigo-950/30 dark:border-indigo-800 dark:text-indigo-200'
          }`}
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertCircle className={`w-3.5 h-3.5 shrink-0 ${isPending ? 'text-rose-600' : 'text-indigo-600'}`} />
              <span className="uppercase tracking-wide text-[10px] font-extrabold">
                {isPending ? 'Reviewer Feedback' : 'Correction Submitted'}
              </span>
              <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">({cr.reason})</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setRespondingCR(cr);
                setCrResponseText(cr.school_response || '');
                setCrUpdatedValue(cr.school_updated_value || cr.current_value || '');
                setCrSubmitError(null);
              }}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 underline cursor-pointer"
            >
              {isPending ? 'Respond / Explain Fix' : 'Edit Response'}
            </button>
          </div>

          <div className="mt-1 font-semibold text-slate-800 dark:text-slate-200">
            &ldquo;{cr.request_comment}&rdquo;
          </div>

          {cr.suggested_value && (
            <div className="mt-1.5 p-1.5 rounded-lg bg-white/90 dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-[11px] font-mono text-slate-800 dark:text-slate-200 flex items-baseline gap-1.5">
              <span className="font-bold text-amber-900 dark:text-amber-300 not-font-mono text-[10px] uppercase tracking-wider">
                Suggested:
              </span>
              <span className="font-semibold text-amber-950 dark:text-amber-100">{cr.suggested_value}</span>
            </div>
          )}

          {cr.school_response && (
            <div className="mt-1.5 p-1.5 rounded-lg bg-white/90 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300">
              <span className="font-bold text-slate-900 dark:text-white text-[10px] uppercase tracking-wider">
                Your Submitted Note:{' '}
              </span>
              <span>{cr.school_response}</span>
              {cr.school_updated_value && (
                <div className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 mt-0.5">
                  Updated to: {cr.school_updated_value}
                </div>
              )}
            </div>
          )}
        </div>
      );
    },
    []
  );

  const sectionCRCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!changeRequests) return counts;
    changeRequests.forEach((cr) => {
      if (cr.status === 'open' || cr.status === 'waiting_for_school' || cr.status === 'ready_for_review') {
        const key = cr.section_key;
        counts[key] = (counts[key] || 0) + 1;
        if (key === 'media') {
          counts['assetChecklist'] = (counts['assetChecklist'] || 0) + 1;
          counts['brandingDesign'] = (counts['brandingDesign'] || 0) + 1;
        }
      }
    });
    return counts;
  }, [changeRequests]);

  // Debounced autosave ref
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDirtyRef = useRef(false);

  // Load project & submission
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
      if (res.project.product_id) {
        setSelectedProductId(res.project.product_id as ProductId);
      }
      setChangeRequests(res.changeRequests || []);
      setCustomFields(res.customFields || []);
      setCustomRequirements(res.customRequirements || []);

      if (res.submission && res.submission.intake_payload) {
        const payload = { ...res.submission.intake_payload };
        if (payload.campuses && Array.isArray(payload.campuses)) {
          payload.campuses = payload.campuses.map((cmp: any) => {
            // Self-healing: if corrupted by empty "Other" values from prior race condition, restore sensible standard defaults
            const hasEmptyOtherCountry =
              (cmp.country === OTHER_OPTION || cmp.country === 'Other Country') &&
              !(cmp.otherCountry || cmp.countryName || '').trim();
            if (hasEmptyOtherCountry) {
              cmp.country = 'India';
            }

            const currentCountry = cmp.country || 'India';
            const hasEmptyOtherState =
              cmp.state === OTHER_OPTION &&
              !(cmp.otherStateProvince || cmp.otherState || '').trim();
            if (hasEmptyOtherState && currentCountry.toLowerCase() === 'india') {
              cmp.state = res.project?.state || 'Bihar';
            }

            const currentState = cmp.state || 'Bihar';
            const hasEmptyOtherDistrict =
              (cmp.district === OTHER_OPTION || cmp.district === '__custom__') &&
              !(cmp.otherDistrict || '').trim();
            if (hasEmptyOtherDistrict && currentCountry.toLowerCase() === 'india') {
              const dList = getStandardDistrictsForState('India', currentState);
              cmp.district = dList.includes('East Champaran') ? 'East Champaran' : (dList[0] || 'East Champaran');
            }

            const norm = normalizeAddressEntity(cmp);
            return {
              ...cmp,
              country: norm.country,
              otherCountry: norm.otherCountry,
              countryName: norm.countryName,
              state: norm.state,
              otherStateProvince: norm.otherStateProvince,
              district: norm.district,
              otherDistrict: norm.otherDistrict,
            };
          });
        }
        payload.campuses = normalizeCampusAcademicData(
          payload.campuses,
          payload.schoolProfile,
          payload.institutionStructure
        );
        payload.communicationConfig = normalizeCommunicationData(
          payload.communicationConfig,
          payload.schoolProfile
        );
        payload.securityPrivacy = normalizeSecurityPrivacyData(payload.securityPrivacy);

        // Reconstruct campusOverrides from campus.sectionConfigs if missing (backward-compatibility guarantee)
        if ((!payload.campusOverrides || Object.keys(payload.campusOverrides).length === 0) && Array.isArray(payload.campuses)) {
          const reconstructed: Record<string, any> = {};
          payload.campuses.forEach((c: any) => {
            if (c.id && c.sectionConfigs && Object.keys(c.sectionConfigs).length > 0) {
              reconstructed[c.id] = c.sectionConfigs;
            }
          });
          if (Object.keys(reconstructed).length > 0) {
            payload.campusOverrides = reconstructed;
          }
        }

        setIntakeData(payload);
        setCustomData(res.submission.custom_fields_data || {});
      } else {
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

  // Synchronize activeCampusId when campuses exist
  useEffect(() => {
    if (intakeData?.campuses && intakeData.campuses.length > 0) {
      if (!activeCampusId || !intakeData.campuses.some((c) => c.id === activeCampusId)) {
        const main = getMainCampus(intakeData.campuses) || intakeData.campuses[0];
        if (main?.id) {
          setActiveCampusId(main.id);
        }
      }
    }
  }, [intakeData?.campuses, activeCampusId]);

  // Handle campus section mode transition (inherited / customized / not_applicable)
  const handleCampusSectionModeChange = useCallback(
    (sectionKey: IntakeSectionKey, mode: CampusDataSourceMode, sourceCampusId?: string) => {
      setIntakeData((prev) => {
        if (!prev || !activeCampusId) return prev;
        isDirtyRef.current = true;
        return setCampusSectionMode(prev, sectionKey, activeCampusId, mode, sourceCampusId);
      });
    },
    [activeCampusId]
  );

  // Dynamic effective project with current scope
  const effectiveProject = useMemo(() => {
    if (!project) return null;
    return {
      ...project,
      product_id: selectedProductId,
    };
  }, [project, selectedProductId]);

  // Completeness calculation
  const completeness = useMemo(() => {
    if (!project || !intakeData) {
      return {
        percentage: 0,
        sectionPercentages: {} as Record<IntakeSectionKey, number>,
        sectionStatuses: {} as Record<IntakeSectionKey, SectionCompletionStatus>,
        missingFields: [],
        isSubmissionReady: false,
      };
    }
    return calculateIntakeCompleteness(selectedProductId, intakeData, customFields);
  }, [project, intakeData, customFields, selectedProductId]);

  // Field updater (campus-aware for multi-campus branch configurations)
  const updateSectionField = useCallback((section: keyof UniversalIntakeData, field: string, value: any) => {
    setIntakeData((prev) => {
      if (!prev) return prev;
      isDirtyRef.current = true;

      // Check if this update should target a branch campus override
      if (
        activeCampusId &&
        section !== 'campuses' &&
        isCampusScopedSection(section as IntakeSectionKey) &&
        (prev.campuses?.length ?? 0) > 1
      ) {
        const main = getMainCampus(prev.campuses);
        if (activeCampusId !== main?.id) {
          const resolved = resolveCampusSectionData(prev, section as IntakeSectionKey, activeCampusId);
          const currentData = (resolved.data && typeof resolved.data === 'object' && !Array.isArray(resolved.data))
            ? { ...resolved.data }
            : { ...((prev[section] as any) || {}) };
          currentData[field] = value;
          return updateCampusCustomData(prev, section as IntakeSectionKey, activeCampusId, currentData);
        }
      }

      return {
        ...prev,
        [section]: {
          ...((prev[section] as any) || {}),
          [field]: value,
        },
      };
    });
  }, [activeCampusId]);

  // Dedicated immutable campus branch updater
  const updateCampusField = useCallback((idx: number, updates: Partial<CampusBranchData>) => {
    setIntakeData((prev) => {
      if (!prev) return prev;
      isDirtyRef.current = true;
      const currentList = prev.campuses || [];
      const nextList = currentList.map((camp, i) => {
        if (i !== idx) return camp;
        return {
          ...camp,
          ...updates,
        };
      });

      // Synchronize primary address to schoolProfile ONLY if updating main campus
      const updatedCampus = nextList[idx];
      const main = getMainCampus(nextList);
      const isTargetMain = updatedCampus && main && updatedCampus.id === main.id;

      const updatedProfile = (isTargetMain && updatedCampus)
        ? {
            ...prev.schoolProfile,
            address: updatedCampus.address !== undefined ? updatedCampus.address : (prev.schoolProfile?.address || ''),
            addressLine2: updatedCampus.addressLine2 !== undefined ? updatedCampus.addressLine2 : (prev.schoolProfile?.addressLine2 || ''),
            landmark: updatedCampus.landmark !== undefined ? updatedCampus.landmark : (prev.schoolProfile?.landmark || ''),
            city: updatedCampus.city !== undefined ? updatedCampus.city : (prev.schoolProfile?.city || ''),
            district: resolveAddressValue(updatedCampus.district, updatedCampus.otherDistrict) || prev.schoolProfile?.district || '',
            otherDistrict: updatedCampus.otherDistrict !== undefined ? updatedCampus.otherDistrict : (prev.schoolProfile?.otherDistrict || ''),
            state: resolveAddressValue(updatedCampus.state, updatedCampus.otherStateProvince || updatedCampus.otherState) || prev.schoolProfile?.state || '',
            otherStateProvince: (updatedCampus.otherStateProvince || updatedCampus.otherState) !== undefined ? (updatedCampus.otherStateProvince || updatedCampus.otherState) : (prev.schoolProfile?.otherStateProvince || ''),
            country: resolveAddressValue(updatedCampus.country, updatedCampus.otherCountry || updatedCampus.countryName) || prev.schoolProfile?.country || 'India',
            otherCountry: (updatedCampus.otherCountry || updatedCampus.countryName) !== undefined ? (updatedCampus.otherCountry || updatedCampus.countryName) : (prev.schoolProfile?.otherCountry || ''),
            pin: updatedCampus.pin !== undefined ? updatedCampus.pin : (prev.schoolProfile?.pin || ''),
            latitude: updatedCampus.latitude !== undefined ? updatedCampus.latitude : (prev.schoolProfile?.latitude ?? null),
            longitude: updatedCampus.longitude !== undefined ? updatedCampus.longitude : (prev.schoolProfile?.longitude ?? null),
            googleMapsUrl: updatedCampus.googleMapsLink !== undefined ? updatedCampus.googleMapsLink : (prev.schoolProfile?.googleMapsUrl || ''),
            googleMapsLink: updatedCampus.googleMapsLink !== undefined ? updatedCampus.googleMapsLink : (prev.schoolProfile?.googleMapsLink || ''),
          }
        : prev.schoolProfile;

      return {
        ...prev,
        campuses: nextList,
        schoolProfile: updatedProfile,
      };
    });
  }, []);


  // Candidate assets library for person-specific portrait reuse
  const [personAssetLibrary, setPersonAssetLibrary] = useState<PersonImageData[]>([]);

  // Calculate all active storage keys across campuses, leadership, branding and checklist for safe unreferenced cleanup
  const allReferencedStorageKeys = useMemo(() => {
    if (!intakeData) return [];
    const keys: string[] = [];
    (intakeData.campuses || []).forEach((c) => {
      (c.images || []).forEach((im) => {
        if (im.storageKey) keys.push(im.storageKey);
      });
    });
    if (intakeData.leadership?.principalPhoto?.storageKey) {
      keys.push(intakeData.leadership.principalPhoto.storageKey);
    }
    (intakeData.leadership?.managementMembers || []).forEach((m) => {
      if (m.photo?.storageKey) keys.push(m.photo.storageKey);
    });
    if (intakeData.brandingDesign?.logoStorageKey) {
      keys.push(intakeData.brandingDesign.logoStorageKey);
    }
    (intakeData.assetChecklist?.items || []).forEach((item) => {
      if (item.storageKey) keys.push(item.storageKey);
    });
    return keys;
  }, [intakeData]);

  // Section 4 Brand Identity Derived Helpers (Asset Checklist compatibility & reuse)
  const checklistLogo = useMemo(() => {
    return intakeData?.assetChecklist?.items?.find(
      (i) => (i.id === 'brand-logo' || i.id === 'brand-crest') && i.fileUrl && i.fileUrl.trim().length > 0 && i.status === 'provided'
    );
  }, [intakeData?.assetChecklist?.items]);

  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [logoFileInfo, setLogoFileInfo] = useState<{ name: string; size: string } | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUploadPhase, setLogoUploadPhase] = useState<'idle' | 'uploading' | 'optimizing' | 'validating' | 'done' | 'error'>('idle');
  const [logoUploadMessage, setLogoUploadMessage] = useState<string>('');
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [showLogoLightbox, setShowLogoLightbox] = useState(false);

  const handleLogoUpload = useCallback(async (file: File) => {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      alert('File size exceeds 15MB limit. Please choose a smaller image.');
      return;
    }
    setIsUploadingLogo(true);
    setLogoUploadError(null);
    setLogoUploadPhase('uploading');
    setLogoUploadMessage('Uploading original file securely...');

    const timerOpt = setTimeout(() => {
      setLogoUploadPhase('optimizing');
      setLogoUploadMessage('Server optimizing with Sharp & converting to genuine WebP...');
    }, 400);

    const timerVal = setTimeout(() => {
      setLogoUploadPhase('validating');
      setLogoUploadMessage('Validating WebP decode and dimensions...');
    }, 900);

    try {
      const uploadData = new FormData();
      uploadData.append('token', token);
      uploadData.append('file', file);
      uploadData.append('itemId', 'brand-logo');
      uploadData.append('itemType', 'image');

      const res = await fetch('/api/school-assets/upload', {
        method: 'POST',
        body: uploadData,
      });

      clearTimeout(timerOpt);
      clearTimeout(timerVal);

      const json = await res.json();
      if (!res.ok || !json.success || !json.asset) {
        throw new Error(json.error || 'Failed to upload and optimize school logo.');
      }

      const asset = json.asset;
      const oldStorageKey = intakeData?.brandingDesign?.logoStorageKey;

      setIntakeData((prev) => {
        if (!prev) return prev;
        isDirtyRef.current = true;
        return {
          ...prev,
          brandingDesign: {
            ...prev.brandingDesign,
            logoUrl: asset.url,
            crestUrl: asset.url,
            hasHighResLogo: true,
            logoFileName: asset.name,
            logoFileSize: asset.size,
            logoWidth: asset.width ?? null,
            logoHeight: asset.height ?? null,
            logoOptimizedFormat: asset.optimizedFormat || 'webp',
            logoStorageKey: asset.storageKey,
            logoOriginalSize: asset.originalSize || asset.size,
          },
        };
      });

      setLogoFileInfo({
        name: asset.name,
        size: `${formatBytes(asset.size)} (${asset.optimizedFormat ? asset.optimizedFormat.toUpperCase() : 'WebP'})`,
      });

      // Safe replace cleanup: remove old storage object only if unreferenced elsewhere
      if (oldStorageKey && oldStorageKey !== asset.storageKey) {
        const isReusedElsewhere = allReferencedStorageKeys.filter((k) => k === oldStorageKey).length > 1;
        if (!isReusedElsewhere) {
          try {
            await fetch('/api/school-assets/delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token, storageKey: oldStorageKey }),
            });
          } catch {
            // Non-blocking cleanup
          }
        }
      }

      setLogoUploadPhase('done');
      setLogoUploadMessage('✓ WebP Optimized');
      setTimeout(() => {
        setLogoUploadPhase('idle');
        setLogoUploadMessage('');
      }, 2500);
    } catch (err: any) {
      clearTimeout(timerOpt);
      clearTimeout(timerVal);
      console.error('[LOGO UPLOAD ERROR]', err);
      setLogoUploadPhase('error');
      setLogoUploadError(err.message || 'Failed to upload logo.');
      alert(`Logo upload failed: ${err.message || 'Unknown error'}`);
      setTimeout(() => {
        setLogoUploadPhase('idle');
      }, 4000);
    } finally {
      setIsUploadingLogo(false);
    }
  }, [token, intakeData?.brandingDesign?.logoStorageKey, allReferencedStorageKeys]);

  const handleRemoveLogo = useCallback(async () => {
    const oldStorageKey = intakeData?.brandingDesign?.logoStorageKey || checklistLogo?.storageKey;
    setIntakeData((prev) => {
      if (!prev) return prev;
      isDirtyRef.current = true;
      const updatedChecklistItems = (prev.assetChecklist?.items || []).map((item) => {
        if (item.id === 'brand-logo' || item.id === 'brand-crest') {
          return {
            ...item,
            fileUrl: undefined,
            fileName: undefined,
            fileSize: undefined,
            fileType: undefined,
            storageKey: undefined,
            width: undefined,
            height: undefined,
            originalSize: undefined,
            optimizedSize: undefined,
            optimizedFormat: undefined,
            status: 'not_provided' as const,
            isManualOverride: true,
            sourceSection: undefined,
            reusedFromId: undefined,
          };
        }
        return item;
      });

      return {
        ...prev,
        brandingDesign: {
          ...prev.brandingDesign,
          logoUrl: '',
          crestUrl: '',
          hasHighResLogo: false,
          logoFileName: undefined,
          logoFileSize: undefined,
          logoWidth: null,
          logoHeight: null,
          logoOptimizedFormat: null,
          logoStorageKey: undefined,
          logoOriginalSize: undefined,
        },
        assetChecklist: {
          ...prev.assetChecklist,
          items: updatedChecklistItems,
        },
      };
    });
    setLogoFileInfo(null);

    // Safe unreferenced storage cleanup
    if (oldStorageKey) {
      const isReusedElsewhere = allReferencedStorageKeys.filter((k) => k === oldStorageKey).length > 1;
      if (!isReusedElsewhere) {
        try {
          await fetch('/api/school-assets/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, storageKey: oldStorageKey }),
          });
        } catch {
          // Non-blocking cleanup
        }
      }
    }
  }, [token, intakeData?.brandingDesign?.logoStorageKey, checklistLogo?.storageKey, allReferencedStorageKeys]);

  const effectiveLogoUrl = intakeData?.brandingDesign?.logoUrl || intakeData?.brandingDesign?.crestUrl || checklistLogo?.fileUrl || '';
  const isReusedLogoFromChecklist = !intakeData?.brandingDesign?.logoUrl && !intakeData?.brandingDesign?.crestUrl && Boolean(checklistLogo?.fileUrl);

  // Direct section updater (campus-aware for multi-campus branch configurations)
  const updateSectionDirect = useCallback((section: keyof UniversalIntakeData, value: any) => {
    setIntakeData((prev) => {
      if (!prev) return prev;
      isDirtyRef.current = true;
      if (section === 'campuses' && Array.isArray(value)) {
        const hasExplicitMain = value.some((c) => c.isMainCampus);
        const normalized = value.map((c, i) => ({
          ...c,
          isMainCampus: hasExplicitMain ? Boolean(c.isMainCampus) : i === 0,
        }));
        const main = normalized.find((c) => c.isMainCampus) || (normalized[0] as CampusBranchData | undefined);
        const updatedProfile = main
          ? {
              ...prev.schoolProfile,
              address: main.address !== undefined ? main.address : (prev.schoolProfile?.address || ''),
              addressLine2: main.addressLine2 !== undefined ? main.addressLine2 : (prev.schoolProfile?.addressLine2 || ''),
              landmark: main.landmark !== undefined ? main.landmark : (prev.schoolProfile?.landmark || ''),
              city: main.city !== undefined ? main.city : (prev.schoolProfile?.city || ''),
              district: resolveAddressValue(main.district, main.otherDistrict) || prev.schoolProfile?.district || '',
              otherDistrict: main.otherDistrict !== undefined ? main.otherDistrict : (prev.schoolProfile?.otherDistrict || ''),
              state: resolveAddressValue(main.state, main.otherStateProvince || main.otherState) || prev.schoolProfile?.state || '',
              otherStateProvince: (main.otherStateProvince || main.otherState) !== undefined ? (main.otherStateProvince || main.otherState) : (prev.schoolProfile?.otherStateProvince || ''),
              country: resolveAddressValue(main.country, main.otherCountry || main.countryName) || prev.schoolProfile?.country || 'India',
              otherCountry: (main.otherCountry || main.countryName) !== undefined ? (main.otherCountry || main.countryName) : (prev.schoolProfile?.otherCountry || ''),
              pin: main.pin !== undefined ? main.pin : (prev.schoolProfile?.pin || ''),
              latitude: main.latitude !== undefined ? main.latitude : (prev.schoolProfile?.latitude ?? null),
              longitude: main.longitude !== undefined ? main.longitude : (prev.schoolProfile?.longitude ?? null),
              googleMapsUrl: main.googleMapsLink !== undefined ? main.googleMapsLink : (prev.schoolProfile?.googleMapsUrl || ''),
              googleMapsLink: main.googleMapsLink !== undefined ? main.googleMapsLink : (prev.schoolProfile?.googleMapsLink || ''),
            }
          : prev.schoolProfile;

        return {
          ...prev,
          campuses: normalized,
          schoolProfile: updatedProfile,
        };
      }

      // Check if this update should target a branch campus override
      if (
        activeCampusId &&
        section !== 'campuses' &&
        isCampusScopedSection(section as IntakeSectionKey) &&
        (prev.campuses?.length ?? 0) > 1
      ) {
        const main = getMainCampus(prev.campuses);
        if (activeCampusId !== main?.id) {
          return updateCampusCustomData(prev, section as IntakeSectionKey, activeCampusId, value);
        }
      }

      if (section === 'securityPrivacy') {
        setSecuritySectionErrors({});
      }
      return {
        ...prev,
        [section]: value,
      };
    });
  }, [activeCampusId]);

  // Manual Draft saving
  const handleSaveDraft = useCallback(async () => {
    if (!intakeData) return;
    setIsSaving(true);
    setSaveMessage(null);
    const payloadToSave = syncDerivedStatisticsToFacilities(intakeData);
    const res = await saveSchoolIntakeDraftAction(token, payloadToSave, customData);
    if (res.success) {
      isDirtyRef.current = false;
      const now = new Date();
      setLastSavedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setSaveMessage({ text: 'Draft saved securely. You can return anytime.', type: 'success' });
      setTimeout(() => setSaveMessage(null), 3500);
    } else {
      setSaveMessage({ text: res.error || 'Failed to save draft', type: 'error' });
    }
    setIsSaving(false);
  }, [token, intakeData, customData]);

  // Debounced Autosave effect
  useEffect(() => {
    if (!intakeData || !isDirtyRef.current) return;

    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    autosaveTimeoutRef.current = setTimeout(async () => {
      if (isDirtyRef.current) {
        setIsSaving(true);
        const payloadToSave = syncDerivedStatisticsToFacilities(intakeData);
        const res = await saveSchoolIntakeDraftAction(token, payloadToSave, customData);
        if (res.success) {
          isDirtyRef.current = false;
          const now = new Date();
          setLastSavedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
        setIsSaving(false);
      }
    }, 4000);

    return () => {
      if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
    };
  }, [token, intakeData, customData]);

  // Final Submission
  const handleSubmit = async () => {
    if (!intakeData || !project) return;
    if (!intakeData.clientConfirmation?.isConfirmed) {
      alert('Please check the confirmation declaration box before submitting.');
      return;
    }
    if (!completeness.isSubmissionReady) {
      alert(`Please fill the remaining required fields (${completeness.missingFields.length} pending) before submitting.`);
      return;
    }

    setIsSubmitting(true);
    setSaveMessage(null);
    const payloadToSubmit = syncDerivedStatisticsToFacilities(intakeData);
    const res = await submitSchoolIntakeAction(token, payloadToSubmit, customData);
    if (res.success) {
      setIsSubmitSuccess(true);
      setSubmittedVersion(res.versionNumber || 1);
    } else {
      setSaveMessage({ text: res.error || 'Submission error', type: 'error' });
    }
    setIsSubmitting(false);
  };

  // Applicable sections based on selected product scope and dynamic intake answers
  const applicableSections = useMemo(() => {
    return getApplicableSections(selectedProductId, intakeData || undefined);
  }, [selectedProductId, intakeData]);

  // Keep currentStepIndex in bounds if sections dynamically change
  useEffect(() => {
    if (applicableSections.length > 0 && currentStepIndex >= applicableSections.length) {
      setCurrentStepIndex(applicableSections.length - 1);
    }
  }, [applicableSections.length, currentStepIndex]);

  const safeStepIndex = Math.min(currentStepIndex, Math.max(0, applicableSections.length - 1));
  const currentSection = applicableSections[safeStepIndex] || applicableSections[0];

  const activeSectionCRs = useMemo(() => {
    if (!changeRequests || !currentSection) return [];
    return changeRequests.filter((cr) => {
      if (cr.status !== 'open' && cr.status !== 'waiting_for_school' && cr.status !== 'ready_for_review') return false;
      if (cr.section_key === currentSection.key) return true;
      if (currentSection.key === 'assetChecklist' && (cr.section_key === 'media' || cr.section_key === 'assetChecklist')) return true;
      return false;
    });
  }, [changeRequests, currentSection]);

  // Authoritative resolution of campus-scoped section data
  const campusSectionResolution = useMemo(() => {
    if (
      !intakeData ||
      !activeCampusId ||
      !currentSection ||
      !isCampusScopedSection(currentSection.key) ||
      currentSection.key === 'campuses'
    ) {
      return null;
    }
    return resolveCampusSectionData(intakeData, currentSection.key, activeCampusId);
  }, [intakeData, activeCampusId, currentSection]);

  // Effective intake data with campus-specific section resolved
  const effectiveIntakeData = useMemo(() => {
    if (!intakeData) return null;
    const isMulti = (intakeData.campuses?.length ?? 0) > 1;
    if (
      !isMulti ||
      !activeCampusId ||
      !currentSection ||
      !isCampusScopedSection(currentSection.key) ||
      currentSection.key === 'campuses'
    ) {
      return intakeData;
    }
    if (!campusSectionResolution || campusSectionResolution.mode === 'not_applicable' || !campusSectionResolution.data) {
      return intakeData;
    }
    return {
      ...intakeData,
      [currentSection.key]: campusSectionResolution.data,
    };
  }, [intakeData, activeCampusId, currentSection, campusSectionResolution]);

  const displayIntakeData = (effectiveIntakeData || intakeData) as UniversalIntakeData;

  // Dynamic field visibility based on project scope
  const { isFieldVisible } = useFieldScope(selectedProductId, currentSection?.key || 'schoolProfile');

  const handleProductChange = useCallback(async (newProductId: ProductId) => {
    if (newProductId === selectedProductId) return;
    setSelectedProductId(newProductId);
    setCurrentStepIndex(0);
    const labels: Record<ProductId, string> = {
      'school-website': 'School Website',
      'school-website-cms': 'School Website + CMS',
      'school-erp': 'School ERP',
      'school-complete': 'School Website + CMS + ERP',
    };
    setSaveMessage({
      type: 'success',
      text: `Scope switched to "${labels[newProductId]}". Irrelevant form sections and fields hidden.`,
    });
    setTimeout(() => setSaveMessage(null), 4000);

    try {
      await updateProjectProductAction(token, newProductId);
    } catch (err) {
      console.error('[ONBOARDING ERROR] updateProjectProductAction:', err);
    }
  }, [selectedProductId, token]);

  const navigateToSectionKey = useCallback((sectionKey: IntakeSectionKey) => {
    const idx = applicableSections.findIndex((s) => s.key === sectionKey);
    if (idx !== -1) {
      setCurrentStepIndex(idx);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [applicableSections]);

  const handlePrevious = useCallback(() => {
    setDomainStepError(null);
    setIntegrationsStepError(null);
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [currentStepIndex]);

  const handleContinue = useCallback(() => {
    if (!currentSection) return;

    if (completeness.sectionStatuses?.[currentSection.key] !== 'not_applicable') {
      if (currentSection.key === 'domainPresence') {
        const dom = intakeData?.domainPresence || {};
        const isDomainValid = Boolean(
          (dom.domainChoice === 'NEW_DOMAIN' && dom.preferredNewDomainName?.trim()) ||
          (dom.domainChoice === 'EXISTING_DOMAIN' && (dom.existingDomainName?.trim() || dom.preferredDomain?.trim())) ||
          dom.domainChoice === 'DECIDE_LATER' ||
          dom.decideLater ||
          (dom.alreadyOwnsDomain && (dom.existingDomainName?.trim() || dom.preferredDomain?.trim())) ||
          (!dom.domainChoice && dom.preferredNewDomainName?.trim() && !dom.alreadyOwnsDomain)
        );
        if (!isDomainValid) {
          setDomainStepError('Please select a domain, confirm your existing domain, or choose "Decide later" to continue.');
          return;
        }
        setDomainStepError(null);
      }
      if (currentSection.key === 'integrationsConfig') {
        const validation = validateIntegrationsData(intakeData?.integrationsConfig || {});
        if (!validation.isValid) {
          setIntegrationsStepError(validation.missingFields[0] || 'Please complete all required third-party integration selections.');
          return;
        }
        setIntegrationsStepError(null);
      }
      if (currentSection.key === 'mobileAppConfig') {
        const validation = validateMobileAppSection(
          intakeData?.mobileAppConfig,
          intakeData?.schoolProfile?.schoolName || project?.school_name
        );
        if (!validation.isValid) {
          setMobileSectionSubmitted(true);
          return;
        }
        setMobileSectionSubmitted(false);
      }
      if (currentSection.key === 'securityPrivacy') {
        const validation = validateSecurityPrivacyData(intakeData?.securityPrivacy, selectedProductId);
        if (!validation.isValid) {
          setSecuritySectionErrors(validation.errors);
          if (typeof window !== 'undefined') {
            const banner = document.getElementById('security-validation-banner');
            if (banner) {
              banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }
          return;
        }
        setSecuritySectionErrors({});
      }
    }

    if (currentStepIndex < applicableSections.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [
    currentSection,
    currentStepIndex,
    applicableSections.length,
    completeness.sectionStatuses,
    intakeData,
    project,
    selectedProductId,
  ]);

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] text-[#131B2E] bg-warm-grid relative flex items-center justify-center p-4">
        <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#F97360]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-[#4338CA]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="bg-white border border-[#E2E8F0] p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-4 relative z-10">
          <div className="w-12 h-12 border-4 border-[#4338CA] border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-xl font-bold text-[#131B2E]">Loading School Master System</h2>
          <p className="text-xs text-[#64748B]">Verifying authorized token and initializing multi-tenant master configuration session...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (loadError || !project || !intakeData) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] text-[#131B2E] bg-warm-grid relative flex items-center justify-center p-4">
        <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#F97360]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-[#4338CA]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="bg-white border border-rose-200/90 p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-4 relative z-10">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 border border-rose-200 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[#131B2E]">Access Denied or Link Expired</h2>
          <p className="text-xs text-[#64748B]">{loadError || 'This onboarding session is invalid, expired, or has been revoked.'}</p>
          <div className="pt-2">
            <Link
              href="/contact"
              className="inline-block px-5 py-2.5 bg-[#131B2E] hover:bg-[#4338CA] text-white text-xs font-semibold rounded-xl shadow-md transition"
            >
              Contact Ekaagra Support
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success Confirmation View
  if (isSubmitSuccess) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] text-[#131B2E] bg-warm-grid relative flex items-center justify-center p-4">
        <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#F97360]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-[#4338CA]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="bg-white border border-[#E2E8F0] max-w-2xl w-full p-8 md:p-12 rounded-3xl shadow-xl text-center space-y-6 relative z-10">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-3xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 inline-block">
              Master Information Submitted & Recorded
            </span>
            <h1 className="text-3xl font-extrabold text-[#131B2E] tracking-tight">{project.school_name}</h1>
            <p className="text-[#64748B] text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
              Your institutional master data has been securely saved to the School Tenant Database (Version {submittedVersion}).
              Our technical architects are provisioning your live portal, CMS roles, and ERP database.
            </p>
          </div>

          <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 text-left grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs font-mono">
            <div>
              <span className="text-[#64748B] block text-[11px]">Project Number:</span>
              <span className="font-bold text-[#4338CA]">{project.project_number}</span>
            </div>
            <div>
              <span className="text-[#64748B] block text-[11px]">Completeness:</span>
              <span className="font-bold text-emerald-700">{completeness.percentage}% Complete</span>
            </div>
            <div>
              <span className="text-[#64748B] block text-[11px]">UDISE Code:</span>
              <span className="text-[#131B2E] font-semibold">{intakeData.schoolProfile.udiseCode || 'Recorded in profile'}</span>
            </div>
            <div>
              <span className="text-[#64748B] block text-[11px]">Status:</span>
              <span className="text-amber-700 font-bold">Under Technical Provisioning</span>
            </div>
          </div>

          {/* Recorded Domain Preference */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white to-[#FAF7F2] border border-[#C7D2FE] text-left space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#4338CA] text-white">
                  RECORDED
                </span>
                <span className="text-xs font-bold text-[#131B2E]">Domain Preference</span>
              </div>
              <button
                type="button"
                onClick={() => setShowDomainSetupModal(true)}
                className="text-xs font-bold text-[#4338CA] hover:underline cursor-pointer"
              >
                Edit Domain
              </button>
            </div>
            <div className="text-xs text-[#334155]">
              {intakeData.domainPresence?.domainChoice === 'DECIDE_LATER' || intakeData.domainPresence?.decideLater ? (
                <p className="font-semibold text-[#64748B] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#4338CA]" />
                  <span>Decide later &bull; Ekaagra team will coordinate domain setup during launch</span>
                </p>
              ) : intakeData.domainPresence?.domainChoice === 'EXISTING_DOMAIN' || intakeData.domainPresence?.alreadyOwnsDomain ? (
                <p className="font-semibold text-[#131B2E] flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  <span>School already owns domain: <strong className="font-mono text-[#4338CA]">{intakeData.domainPresence.existingDomainName || intakeData.domainPresence.preferredDomain}</strong></span>
                </p>
              ) : intakeData.domainPresence?.preferredNewDomainName ? (
                <p className="font-semibold text-[#131B2E] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Preferred Domain: <strong className="font-mono text-[#4338CA]">{intakeData.domainPresence.preferredNewDomainName}</strong> {intakeData.domainPresence.selectedDomainQuote?.isIncluded ? '(Included in plan)' : intakeData.domainPresence.selectedDomainQuote?.upgradeAmount ? `(+₹${intakeData.domainPresence.selectedDomainQuote.upgradeAmount.toLocaleString('en-IN')} Upgrade)` : '(Included in plan)'}</span>
                </p>
              ) : (
                <p className="text-[#64748B]">Decide later</p>
              )}
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setIsSubmitSuccess(false)}
              className="px-5 py-2.5 bg-white hover:bg-[#FAF7F2] text-[#131B2E] rounded-xl text-xs font-semibold border border-[#E2E8F0] shadow-xs transition cursor-pointer"
            >
              Review Master Snapshot
            </button>
            <Link
              href="/"
              className="px-5 py-2.5 bg-[#131B2E] hover:bg-[#4338CA] text-white rounded-xl text-xs font-semibold shadow-md transition"
            >
              Ekaagra Platform Home
            </Link>
          </div>
        </div>

        {/* Post-Onboarding Domain Setup Modal */}
        {showDomainSetupModal && (
          <ModalPortal isOpen={showDomainSetupModal}>
          <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-3xl w-full border border-[#E2E8F0] shadow-2xl overflow-hidden my-8">
              <div className="p-5 sm:p-6 border-b border-[#E2E8F0] flex items-center justify-between bg-[#FAF7F2]">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#131B2E]">Website &amp; Domain Setup</h3>
                    <p className="text-xs text-[#64748B]">Post-Onboarding Configuration Phase</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDomainSetupModal(false)}
                  className="p-2 text-[#64748B] hover:text-[#131B2E] rounded-xl hover:bg-slate-100 transition cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto">
                <SchoolDomainSelector
                  productId={project.product_id || 'school-complete'}
                  annualAllowance={schoolDomainAllowances[project.product_id as SchoolProductId] ?? 750}
                  initialSchoolName={intakeData.schoolProfile?.schoolName || project.school_name || ''}
                  domainData={intakeData.domainPresence}
                  onChange={(updated) => {
                    updateSectionDirect('domainPresence', updated);
                    saveSchoolIntakeDraftAction(
                      token,
                      {
                        ...intakeData,
                        domainPresence: updated,
                      },
                      customData
                    );
                  }}
                />
              </div>

              <div className="p-4 sm:p-5 border-t border-[#E2E8F0] bg-[#FAF7F2] flex items-center justify-between">
                <span className="text-xs text-[#64748B]">Domain preferences are saved to your project snapshot.</span>
                <button
                  type="button"
                  onClick={() => setShowDomainSetupModal(false)}
                  className="px-5 py-2.5 bg-[#4338CA] hover:bg-[#3730A3] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Done &amp; Close
                </button>
              </div>
            </div>
          </div>
          </ModalPortal>
        )}
      </div>
    );
  }

  if (!intakeData || !project) {
    return null;
  }

  // Jump to specific section
  const jumpToSection = (sectionKey: IntakeSectionKey) => {
    const idx = applicableSections.findIndex((s) => s.key === sectionKey);
    if (idx !== -1) {
      setCurrentStepIndex(idx);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const currentBoardConfig = getBoardIdentityConfig(intakeData?.schoolProfile?.board);

  const renderSidebarNav = (onSelectSection?: () => void) => (
    <nav className="space-y-4">
      {INTAKE_CHAPTERS.map((ch) => {
        const chapterSections = applicableSections
          .map((sec, originalIdx) => ({ sec, originalIdx }))
          .filter(({ sec }) => sec.chapter === ch.key);

        if (chapterSections.length === 0) return null;

        const applicableChapterSections = chapterSections.filter(
          ({ sec }) => completeness.sectionStatuses?.[sec.key] !== 'not_applicable'
        );
        const completedCount = chapterSections.filter(
          ({ sec }) =>
            completeness.sectionStatuses?.[sec.key] === 'complete' ||
            (completeness.sectionStatuses?.[sec.key] === undefined && (completeness.sectionPercentages[sec.key] ?? 0) === 100)
        ).length;
        const totalCount = applicableChapterSections.length > 0 ? applicableChapterSections.length : chapterSections.length;

        return (
          <div key={ch.key} className="space-y-1">
            <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-extrabold tracking-wider uppercase text-[#64748B]">
              <span className="truncate" title={ch.title}>{ch.title}</span>
              <span className="text-[10px] font-mono text-[#94A3B8] shrink-0 font-medium">
                {completedCount}/{totalCount}
              </span>
            </div>

            <div className="space-y-0.5">
              {chapterSections.map(({ sec, originalIdx }) => {
                const isActive = originalIdx === currentStepIndex;
                const status = completeness.sectionStatuses?.[sec.key];
                const isNotApplicable = status === 'not_applicable';
                const secPct = completeness.sectionPercentages[sec.key] ?? 0;
                const isComplete = status === 'complete' || (!isNotApplicable && secPct === 100);
                const displayTitle = sec.shortTitle;

                return (
                  <button
                    key={sec.key}
                    type="button"
                    onClick={() => {
                      setCurrentStepIndex(originalIdx);
                      if (onSelectSection) onSelectSection();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-left transition text-xs group cursor-pointer ${
                      isActive
                        ? 'bg-[#EEF2FF] text-[#4338CA] font-bold border border-[#C7D2FE] shadow-2xs'
                        : isComplete
                        ? 'text-slate-700 hover:bg-[#FAF7F2] hover:text-[#131B2E] border border-transparent'
                        : 'text-[#64748B] hover:bg-[#FAF7F2] hover:text-[#131B2E] border border-transparent'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold transition ${
                        isNotApplicable
                          ? 'bg-slate-100 text-slate-400 border border-slate-200'
                          : isComplete
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : isActive
                          ? 'bg-[#4338CA] text-white shadow-2xs'
                          : 'bg-white text-slate-500 border border-slate-200 group-hover:border-slate-300'
                      }`}
                    >
                      {isNotApplicable ? (
                        <span className="text-xs font-black">−</span>
                      ) : isComplete ? (
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      ) : (
                        originalIdx + 1
                      )}
                    </div>
                    <span className="truncate flex-1 font-medium" title={sec.title || displayTitle}>{displayTitle}</span>
                    {Boolean(sectionCRCounts[sec.key]) && (
                      <span
                        className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-100 text-rose-700 border border-rose-300 animate-pulse shrink-0"
                        title={`${sectionCRCounts[sec.key]} change request(s) in this section`}
                      >
                        !
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-mono ${
                        isNotApplicable
                          ? 'text-slate-400 font-medium'
                          : isComplete
                          ? 'text-emerald-600 font-bold'
                          : isActive
                          ? 'text-[#4338CA] font-semibold'
                          : 'text-[#94A3B8]'
                      }`}
                    >
                      {isNotApplicable
                        ? '—'
                        : isComplete
                        ? '100%'
                        : `${secPct}%`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#131B2E] bg-warm-grid flex selection:bg-[#4338CA] selection:text-white relative scroll-pt-20 sm:scroll-pt-24">
      <div className="fixed top-0 right-1/4 w-96 h-96 bg-[#F97360]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-10 left-1/4 w-96 h-96 bg-[#4338CA]/5 rounded-full blur-3xl pointer-events-none" />

      {/* MOBILE BACKDROP */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* MOBILE DRAWER SIDEBAR */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 sm:w-80 max-w-[85vw] bg-white border-r border-[#E2E8F0] flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5 truncate">
            <Logo />
            <span className="text-[10px] font-bold text-[#4338CA] bg-[#EEF2FF] border border-[#C7D2FE] px-2 py-0.5 rounded-full uppercase tracking-wider">
              Onboarding
            </span>
          </div>
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="p-1.5 rounded-xl text-[#64748B] hover:text-[#131B2E] hover:bg-[#FAF7F2] border border-[#E2E8F0] transition shrink-0"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3.5 border-b border-[#E2E8F0] bg-[#FAF7F2] shrink-0 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#334155]">Master Progress</span>
            <span className={`font-mono font-extrabold text-xs ${completeness.percentage >= 90 ? 'text-emerald-700' : 'text-[#4338CA]'}`}>
              {completeness.percentage}%
            </span>
          </div>
          <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#4338CA] h-full rounded-full transition-all duration-300"
              style={{ width: `${completeness.percentage}%` }}
            />
          </div>
          <div className="text-[10px] text-[#64748B] font-mono flex justify-between">
            <span>
              {applicableSections.filter((s) => completeness.sectionStatuses?.[s.key] === 'complete' || (completeness.sectionStatuses?.[s.key] !== 'not_applicable' && completeness.sectionPercentages[s.key] === 100)).length} of {applicableSections.filter((s) => completeness.sectionStatuses?.[s.key] !== 'not_applicable').length} completed
            </span>
            <span>Step {currentStepIndex + 1}/{applicableSections.length}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-[#CBD5E1]">
          {renderSidebarNav(() => setIsMobileSidebarOpen(false))}
        </div>

        <div className="p-3 border-t border-[#E2E8F0] bg-[#FAF7F2] shrink-0 flex items-center justify-between text-xs">
          <span className="text-[11px] text-[#64748B] truncate">
            {lastSavedTime ? `Saved ${lastSavedTime}` : 'Auto-save active'}
          </span>
          <button
            onClick={() => {
              handleSaveDraft();
              setIsMobileSidebarOpen(false);
            }}
            disabled={isSaving}
            className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-[#334155] bg-white border border-[#E2E8F0] rounded-lg shadow-2xs"
          >
            <Save className="w-3 h-3 text-[#64748B]" />
            <span>Save</span>
          </button>
        </div>
      </aside>

      {/* DESKTOP STICKY SIDEBAR */}
      <aside className="hidden lg:flex sticky top-0 h-[100dvh] w-72 xl:w-80 shrink-0 self-start bg-white border-r border-[#E2E8F0] flex-col z-30 shadow-xs">
        <div className="p-4 border-b border-[#E2E8F0] space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <Logo />
            <span className="text-[10px] font-bold text-[#4338CA] bg-[#EEF2FF] border border-[#C7D2FE] px-2 py-0.5 rounded-full uppercase tracking-wider">
              Onboarding
            </span>
          </div>

          <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#E2E8F0] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] font-bold text-[#334155]">Master Progress</span>
              <span className={`font-mono font-extrabold text-xs ${completeness.percentage >= 90 ? 'text-emerald-700' : 'text-[#4338CA]'}`}>
                {completeness.percentage}%
              </span>
            </div>
            <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#4338CA] h-full rounded-full transition-all duration-300"
                style={{ width: `${completeness.percentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-[#64748B] font-mono">
              <span>
                {applicableSections.filter((s) => completeness.sectionStatuses?.[s.key] === 'complete' || (completeness.sectionStatuses?.[s.key] !== 'not_applicable' && completeness.sectionPercentages[s.key] === 100)).length} of {applicableSections.filter((s) => completeness.sectionStatuses?.[s.key] !== 'not_applicable').length} completed
              </span>
              <span>Step {currentStepIndex + 1}/{applicableSections.length}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-[#CBD5E1]">
          {renderSidebarNav()}
        </div>

        <div className="p-3 border-t border-[#E2E8F0] bg-[#FAF7F2] shrink-0 flex items-center justify-between text-xs">
          <div className="text-[11px] text-[#64748B] flex items-center space-x-1.5 truncate mr-2">
            {isSaving ? (
              <span className="text-amber-600 flex items-center space-x-1 font-medium">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>Saving...</span>
              </span>
            ) : lastSavedTime ? (
              <span className="text-[#64748B] truncate">Saved {lastSavedTime}</span>
            ) : (
              <span className="text-[#94A3B8] truncate">Auto-save active</span>
            )}
          </div>
          <button
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-[#334155] bg-white hover:bg-slate-50 border border-[#E2E8F0] rounded-lg shadow-2xs transition shrink-0 cursor-pointer"
          >
            <Save className="w-3 h-3 text-[#64748B]" />
            <span>Save</span>
          </button>
        </div>
      </aside>

      {/* RIGHT CONTENT COLUMN */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Executive Header Bar */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] shadow-xs">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 min-h-[64px] sm:min-h-[72px] flex items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl text-[#64748B] hover:text-[#131B2E] hover:bg-[#FAF7F2] border border-[#E2E8F0] transition shrink-0"
                aria-label="Open Section Navigation"
              >
                <Menu className="w-4 h-4" />
              </button>

              <SchoolIdentityCard
                variant="navbar"
                schoolName={
                  intakeData.schoolProfile?.displayName ||
                  intakeData.schoolProfile?.schoolName ||
                  project.school_name
                }
                city={intakeData.campuses?.[0]?.city || intakeData.schoolProfile?.city || project.city}
                state={
                  resolveAddressValue(
                    intakeData.campuses?.[0]?.state,
                    intakeData.campuses?.[0]?.otherStateProvince || intakeData.campuses?.[0]?.otherState
                  ) ||
                  (intakeData.campuses?.[0]?.state !== OTHER_OPTION ? intakeData.campuses?.[0]?.state : null) ||
                  intakeData.schoolProfile?.state ||
                  project.state ||
                  ''
                }
                campusCount={(intakeData.campuses || []).length || 1}
                logoUrl={intakeData.brandingDesign?.logoUrl || intakeData.brandingDesign?.crestUrl}
                status="ONBOARDING"
                projectNumber={project.project_number}
                udiseCode={intakeData.schoolProfile?.udiseCode}
                className="min-w-0 flex-1"
              />
            </div>

            <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
              {/* Mobile Compact Progress Badge */}
              <span className="sm:hidden font-mono font-extrabold text-[10px] text-[#4338CA] bg-[#EEF2FF] px-2 py-1 rounded-lg border border-[#C7D2FE] shrink-0" title="Master Form Progress">
                {completeness.percentage}%
              </span>

              <div className="hidden sm:flex items-center space-x-2 bg-[#FAF7F2] px-3 py-1.5 rounded-full border border-[#E2E8F0] text-xs shrink-0">
                <span className="text-[#64748B]">Progress:</span>
                <span className={`font-bold ${completeness.percentage >= 90 ? 'text-emerald-700' : 'text-[#4338CA]'}`}>
                  {completeness.percentage}%
                </span>
                <div className="w-12 bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#4338CA] h-full rounded-full transition-all duration-300"
                    style={{ width: `${completeness.percentage}%` }}
                  />
                </div>
              </div>

              <div className="hidden md:flex items-center space-x-1.5 text-[11px] text-[#94A3B8] shrink-0">
                {isSaving ? (
                  <span className="text-amber-500 flex items-center space-x-1 font-medium">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span>Saving...</span>
                  </span>
                ) : lastSavedTime ? (
                  <span className="text-[#64748B]">Saved {lastSavedTime}</span>
                ) : null}
              </div>

              <button
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 border border-[#E2E8F0] hover:border-[#CBD5E1] bg-white hover:bg-[#FAF7F2] text-[#334155] text-xs font-semibold rounded-xl transition shadow-xs shrink-0 cursor-pointer"
                title="Save draft progress"
              >
                <Save className="w-3.5 h-3.5 text-[#64748B]" />
                <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save Draft'}</span>
              </button>

              {currentStepIndex < applicableSections.length - 1 ? (
                <button
                  type="button"
                  onClick={handleContinue}
                  className="inline-flex items-center space-x-1 sm:space-x-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-[0.98] cursor-pointer shrink-0"
                  aria-label="Next Section"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !completeness.isSubmissionReady}
                  className={`inline-flex items-center space-x-1 sm:space-x-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-white text-xs font-bold rounded-xl shadow-xs transition shrink-0 ${
                    completeness.isSubmissionReady
                      ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                      : 'bg-[#FAF7F2] text-[#94A3B8] cursor-not-allowed border border-[#E2E8F0]'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Submitting...' : 'Submit Master'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Integrated Slim Persistent Progress Bar across all viewports */}
          <div className="w-full bg-[#E2E8F0]/60 h-0.5 overflow-hidden">
            <div
              className="bg-[#4338CA] h-full transition-all duration-300 ease-out"
              style={{ width: `${completeness.percentage}%` }}
              role="progressbar"
              aria-valuenow={completeness.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>

          {saveMessage && (
            <div
              className={`text-xs text-center py-1 font-medium border-t ${
                saveMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {saveMessage.text}
            </div>
          )}
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

          {/* OPERATIONAL CHANGE REQUEST REMEDIATION BANNER */}
          {changeRequests.some((cr) => cr.status === 'open' || cr.status === 'waiting_for_school' || cr.status === 'ready_for_review') && (
            <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex items-start space-x-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-base sm:text-lg font-bold text-slate-900">
                        Action Required: Reviewer Requested Adjustments
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        {changeRequests.filter(cr => cr.status === 'open' || cr.status === 'waiting_for_school').length} Pending
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">
                      Our verification team has reviewed your intake submission and identified specific items requiring your clarification or correction before public website generation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {changeRequests
                  .filter((cr) => cr.status === 'open' || cr.status === 'waiting_for_school' || cr.status === 'ready_for_review')
                  .map((cr) => {
                    const isPending = cr.status === 'open' || cr.status === 'waiting_for_school';
                    return (
                      <div
                        key={cr.id}
                        className={`rounded-2xl p-4 border transition-all ${
                          isPending
                            ? 'bg-white border-amber-200 shadow-xs'
                            : 'bg-emerald-50/60 border-emerald-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              {cr.section_key}
                            </span>
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {cr.field_key || cr.asset_id || 'Field Correction'}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              isPending
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            }`}
                          >
                            {isPending ? 'Action Needed' : 'Correction Submitted'}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-700">
                          <div>
                            <span className="font-semibold text-slate-900">Reviewer Note: </span>
                            <span className="text-amber-900 font-medium">{cr.request_comment || cr.reason}</span>
                          </div>

                          {cr.suggested_value && (
                            <div className="bg-amber-50/80 rounded-lg p-2 border border-amber-100 text-xs">
                              <span className="font-semibold text-amber-900">Suggested: </span>
                              <span className="font-mono text-amber-800">{cr.suggested_value}</span>
                            </div>
                          )}

                          {cr.school_response && (
                            <div className="bg-slate-50 rounded-lg p-2 border border-slate-200 text-xs">
                              <span className="font-semibold text-slate-800">Your Response: </span>
                              <span className="text-slate-600">{cr.school_response}</span>
                              {cr.school_updated_value && (
                                <div className="mt-1 font-mono text-[11px] text-slate-700 font-medium truncate">
                                  Updated to: {cr.school_updated_value}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] text-slate-400">
                            Requested {new Date(cr.created_at).toLocaleDateString()}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setRespondingCR(cr);
                              setCrResponseText(cr.school_response || '');
                              setCrUpdatedValue(cr.school_updated_value || cr.current_value || '');
                              setCrSubmitError(null);
                            }}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
                              isPending
                                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            <span>{isPending ? 'Provide Correction' : 'Update Response'}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* PROJECT SCOPE BANNER */}
          <div className="bg-[#131B2E] text-white rounded-2xl p-3.5 sm:p-4 shadow-xs border border-slate-800 relative overflow-hidden transition-all">
            <div className="flex items-center justify-between flex-wrap gap-2.5">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex items-center space-x-2 flex-wrap">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-indigo-400">PROJECT SCOPE:</span>
                  <span className="text-xs sm:text-sm font-bold text-white">
                    {selectedProductId === 'school-website'
                      ? 'School Website'
                      : selectedProductId === 'school-website-cms'
                      ? 'Website + CMS'
                      : selectedProductId === 'school-erp'
                      ? 'School ERP'
                      : 'Complete Suite'}
                  </span>
                  <span className="text-slate-500 hidden sm:inline">•</span>
                  <span className="text-xs text-slate-300 font-medium">
                    {applicableSections.length} applicable sections
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsScopeExpanded(!isScopeExpanded)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
              >
                <span>{isScopeExpanded ? 'Hide scope options' : 'View/change scope'}</span>
              </button>
            </div>

            {/* Collapsible expanded options grid */}
            {isScopeExpanded && (
              <div className="mt-4 pt-3 border-t border-indigo-900/50 space-y-4 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    {
                      id: 'school-website' as ProductId,
                      title: 'A. School Website',
                      desc: 'Public website, branding, admissions desk & facility highlights',
                      badge: '14 Sections',
                      icon: Globe,
                    },
                    {
                      id: 'school-website-cms' as ProductId,
                      title: 'B. Website + CMS',
                      desc: 'Website + publishing workflow, editorial roles & news management',
                      badge: '16 Sections',
                      icon: Layers,
                    },
                    {
                      id: 'school-erp' as ProductId,
                      title: 'C. School ERP',
                      desc: 'Academics, students, fees, attendance, timetable, transport & hostel',
                      badge: '23 Sections',
                      icon: GraduationCap,
                    },
                    {
                      id: 'school-complete' as ProductId,
                      title: 'D. Complete Suite',
                      desc: 'Website + CMS + ERP with unified single source of truth',
                      badge: 'All Sections',
                      icon: School,
                    },
                  ].map((opt) => {
                    const isSelected = selectedProductId === opt.id;
                    const IconComponent = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          handleProductChange(opt.id);
                          setIsScopeExpanded(false);
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-2 relative ${
                          isSelected
                            ? 'bg-indigo-600/90 border-indigo-300 text-white shadow-lg ring-2 ring-indigo-400/40'
                            : 'bg-white/5 hover:bg-white/10 border-white/10 text-indigo-100/90 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <IconComponent className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-indigo-400'}`} />
                            <span className="text-xs font-bold">{opt.title}</span>
                          </div>
                          <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                            isSelected ? 'bg-white/25 text-white' : 'bg-white/10 text-indigo-300'
                          }`}>
                            {opt.badge}
                          </span>
                        </div>
                        <p className="text-[11px] opacity-80 leading-relaxed line-clamp-2">
                          {opt.desc}
                        </p>
                        {isSelected && (
                          <span className="text-[10px] text-emerald-300 font-semibold flex items-center space-x-1 pt-1 border-t border-indigo-400/30">
                            <Check className="w-3 h-3" />
                            <span>Active Scope Filter</span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-indigo-300/70 italic">
                  Only questions and requirements applicable to your selected product will be displayed. Irrelevant questions are automatically skipped.
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E2E8F0] p-4 sm:p-6 md:p-8 shadow-xs space-y-6 scroll-mt-24 sm:scroll-mt-28">
            {/* Header of Active Section */}
            <div className="border-b border-[#E2E8F0] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4338CA] bg-[#EEF2FF] border border-[#C7D2FE] px-2.5 py-0.5 rounded-full">
                    SECTION {currentStepIndex + 1} OF {applicableSections.length}
                  </span>
                  {currentSection.isConditional && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                      Conditional
                    </span>
                  )}
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#131B2E] tracking-tight mt-2 scroll-mt-24 sm:scroll-mt-28">
                  {currentSection.key === 'transportConfig' && (selectedProductId === 'school-website' || selectedProductId === 'school-website-cms')
                    ? 'School Transport'
                    : currentSection.title}
                </h2>
                <p className="text-xs sm:text-sm text-[#64748B] mt-1 leading-relaxed">
                  {currentSection.key === 'transportConfig' && (selectedProductId === 'school-website' || selectedProductId === 'school-website-cms')
                    ? "Showcase the school's transportation facilities, fleet, routes, coverage areas, and safety features."
                    : currentSection.key === 'schoolContent'
                    ? "Review your school's story, mission, and philosophy prepared from your verified information."
                    : currentSection.key === 'assetChecklist'
                    ? "Provide the content, images, certificates, documents and other materials Ekaagra needs to prepare your school's website."
                    : currentSection.key === 'projectDelivery'
                    ? 'Tell us when you want to launch, what should be prioritized first, and who will make final decisions.'
                    : currentSection.description}
                </p>
              </div>

              <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
                {completeness.sectionStatuses?.[currentSection.key] === 'not_applicable' ? (
                  <span className="text-xs px-3 py-1 rounded-full border font-bold uppercase tracking-wider flex items-center space-x-1.5 bg-slate-100 text-slate-700 border-slate-300 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                    <span>NOT APPLICABLE</span>
                  </span>
                ) : currentSection.key === 'schoolContent' ? (
                  (() => {
                    const s6Summary = getSection6StatusSummary(intakeData);
                    if (s6Summary.isApproved) {
                      return (
                        <span className="text-xs px-2.5 py-1 rounded-lg border font-semibold flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>✓ Approved</span>
                        </span>
                      );
                    }
                    return (
                      <span className="text-xs px-2.5 py-1 rounded-lg border font-semibold flex items-center space-x-1.5 bg-[#EEF2FF] text-[#4338CA] border-[#C7D2FE] shadow-2xs">
                        <Sparkles className="w-3.5 h-3.5 text-[#4338CA] shrink-0" />
                        <span>{s6Summary.statusText}</span>
                      </span>
                    );
                  })()
                ) : (completeness.sectionPercentages[currentSection.key] ?? 0) === 100 ? (
                  <span className="text-xs px-2.5 py-1 rounded-lg border font-semibold flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>✓ 100% Filled</span>
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-1 rounded-lg border font-medium flex items-center space-x-1.5 bg-amber-50/70 text-amber-800 border-amber-200/80 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span>{completeness.sectionPercentages[currentSection.key] ?? 0}% Filled</span>
                  </span>
                )}
              </div>
            </div>

            {/* SECTION CHANGE REQUEST ALERT BANNER */}
            {activeSectionCRs.length > 0 && (
              <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 border-2 border-amber-400 dark:border-amber-600 shadow-2xs flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                      Action Required: {activeSectionCRs.length} Change Request{activeSectionCRs.length > 1 ? 's' : ''} in this Section
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                      Changes Requested
                    </span>
                  </div>
                  <p className="text-xs text-amber-900/90 dark:text-amber-300/90 leading-relaxed">
                    Our verification team has requested revisions for the highlighted field{activeSectionCRs.length > 1 ? 's' : ''} below. Look for the amber boxes with reviewer instructions to make the requested updates.
                  </p>
                </div>
              </div>
            )}

            {/* Render Section Form Bodies */}
            {/* Campus Context Switcher & Inheritance Bar (for campus-scoped & mixed sections when multi-campus) */}
            {currentSection.key !== 'campuses' &&
              isCampusScopedSection(currentSection.key) &&
              (intakeData.campuses?.length ?? 0) > 1 &&
              campusSectionResolution && (
                <CampusContextBar
                  campuses={intakeData.campuses}
                  activeCampusId={activeCampusId}
                  onSelectCampus={setActiveCampusId}
                  sectionKey={currentSection.key}
                  sectionTitle={currentSection.title}
                  sourceMode={campusSectionResolution.mode}
                  sourceCampusId={campusSectionResolution.sourceCampusId}
                  onChangeSourceMode={(mode, sourceCampusId) =>
                    handleCampusSectionModeChange(currentSection.key, mode, sourceCampusId)
                  }
                  campusOverrides={intakeData.campusOverrides}
                  isReadOnly={campusSectionResolution.isReadOnly}
                />
            )}

            {/* Campus Section Not Applicable State Banner */}
            {currentSection.key !== 'campuses' &&
              isCampusScopedSection(currentSection.key) &&
              (intakeData.campuses?.length ?? 0) > 1 &&
              campusSectionResolution?.mode === 'not_applicable' && (
                <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl p-8 text-center space-y-3 shadow-2xs mb-6">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#64748B] flex items-center justify-center mx-auto shadow-2xs">
                    <Ban className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-[#131B2E]">
                      {currentSection.title} is Not Applicable
                    </h4>
                    <p className="text-xs text-[#64748B] max-w-md mx-auto">
                      This facility or configuration is marked as not applicable to{' '}
                      <strong>
                        {getCampusDisplayName(getCampusById(intakeData.campuses, activeCampusId))}
                      </strong>
                      . It is exempt from required fields and does not reduce onboarding completeness.
                    </p>
                  </div>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => handleCampusSectionModeChange(currentSection.key, 'customized')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs shadow-xs transition cursor-pointer"
                    >
                      <span>Configure for this campus</span>
                    </button>
                  </div>
                </div>
            )}

            {/* SECTION 1: IDENTITY */}
            {currentSection.key === 'schoolProfile' && (
              <div className="space-y-6">

                {/* Sub-Card 1: Institutional Identification & Legal Governance */}
                {(() => {
                  const legalConfig = getLegalEntityConfig(intakeData.schoolProfile.managementType);
                  return (
                    <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl p-5 space-y-4 shadow-2xs">
                      <div className="flex items-center space-x-2 border-b border-[#E2E8F0] pb-3">
                        <Building2 className="w-4 h-4 text-[#4338CA]" />
                        <h3 className="font-bold text-sm text-[#131B2E]">1. Institutional Identification & Legal Governance</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                        {(() => {
                          const cr = getFieldCR('schoolProfile', 'schoolName');
                          return (
                            <div className={getFieldWrapperClass(cr)}>
                              <label className="block font-bold text-[#334155] mb-1">
                                <span>Official School Name *</span>
                                {renderCRBadge(cr)}
                              </label>
                              <input
                                id="field-school-name"
                                type="text"
                                value={intakeData.schoolProfile.schoolName || ''}
                                onChange={(e) => {
                                  const name = e.target.value;
                                  updateSectionField('schoolProfile', 'schoolName', name);
                                  if (!intakeData.schoolProfile.slug) {
                                    updateSectionField('schoolProfile', 'slug', deriveSlugFromSchoolName(name));
                                  }
                                }}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden text-[#131B2E] placeholder:text-[#94A3B8] transition shadow-2xs"
                                placeholder="e.g. Roshani Public School"
                              />
                              {renderFieldCRAlert(cr)}
                            </div>
                          );
                        })()}

                        {(() => {
                          const cr = getFieldCR('schoolProfile', 'displayName');
                          return (
                            <div className={getFieldWrapperClass(cr)}>
                              <label className="block font-bold text-[#334155] mb-1">
                                <span>Institution Display / Short Name</span>
                                {renderCRBadge(cr)}
                              </label>
                              <input
                                type="text"
                                value={intakeData.schoolProfile.displayName || intakeData.schoolProfile.shortName || ''}
                                onChange={(e) => {
                                  updateSectionField('schoolProfile', 'displayName', e.target.value);
                                  updateSectionField('schoolProfile', 'shortName', e.target.value);
                                }}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden text-[#131B2E] placeholder:text-[#94A3B8] transition shadow-2xs"
                                placeholder="e.g. RPS Motihari"
                              />
                              {renderFieldCRAlert(cr)}
                            </div>
                          );
                        })()}

                        {(() => {
                          const cr = getFieldCR('schoolProfile', 'udiseCode');
                          return (
                            <div className={getFieldWrapperClass(cr)}>
                              <label className="block font-bold text-[#334155] mb-1">
                                <span>UDISE+ School Code *</span>
                                {renderCRBadge(cr)}
                              </label>
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]{11}"
                                maxLength={11}
                                value={intakeData.schoolProfile.udiseCode || ''}
                                onChange={(e) => {
                                  const cleanDigits = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
                                  updateSectionField('schoolProfile', 'udiseCode', cleanDigits);
                                }}
                                className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-[#131B2E] font-mono text-xs focus:outline-hidden transition shadow-2xs ${
                                  intakeData.schoolProfile.udiseCode && intakeData.schoolProfile.udiseCode.length === 11
                                    ? 'border-emerald-500 focus:ring-3 focus:ring-emerald-500/10'
                                    : 'border-[#E2E8F0] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10'
                                }`}
                                placeholder="11-digit UDISE+ Code (e.g. 10234567890)"
                              />
                              <span className="text-[10px] text-[#94A3B8] mt-1 block leading-relaxed">
                                Your school&apos;s official 11-digit UDISE+ Code serves as the canonical external identifier in the Ekaagra platform.
                              </span>
                              {intakeData.schoolProfile.udiseCode && intakeData.schoolProfile.udiseCode.length > 0 && intakeData.schoolProfile.udiseCode.length !== 11 && (
                                <span className="text-[10px] text-amber-600 font-medium mt-0.5 block">
                                  Must be exactly 11 digits ({intakeData.schoolProfile.udiseCode.length}/11 entered).
                                </span>
                              )}
                              {renderFieldCRAlert(cr)}
                            </div>
                          );
                        })()}

                        {/* Management Type First */}
                        {(() => {
                          const cr = getFieldCR('schoolProfile', 'managementType');
                          return (
                            <div className={getFieldWrapperClass(cr)}>
                              <label className="block font-bold text-[#334155] mb-1">
                                <span>Management Type *</span>
                                {renderCRBadge(cr)}
                              </label>
                              <select
                                value={intakeData.schoolProfile.managementType || 'Society'}
                                onChange={(e) => updateSectionField('schoolProfile', 'managementType', e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden text-[#131B2E] transition shadow-2xs font-medium"
                              >
                                <option value="Society">Society Managed</option>
                                <option value="Trust">Trust Managed</option>
                                <option value="Section 8 Company">Section 8 Company</option>
                                <option value="Private Unaided">Private Unaided</option>
                                <option value="Private Aided">Private Aided</option>
                                <option value="Government">Government Institution</option>
                                <option value="Other">Other</option>
                              </select>
                              <span className="text-[10px] text-[#94A3B8] mt-1 block">
                                Institutional operating governance type.
                              </span>
                              {renderFieldCRAlert(cr)}
                            </div>
                          );
                        })()}

                        {/* Then dynamic entity name based on selected Management Type */}
                        {(() => {
                          const cr = getFieldCR('schoolProfile', 'legalInstitutionName');
                          return (
                            <div className={getFieldWrapperClass(cr)}>
                              <div className="flex items-center justify-between mb-1">
                                <label className="block font-bold text-[#334155] truncate">
                                  <span>{legalConfig.label}</span>
                                  {renderCRBadge(cr)}
                                </label>
                                <span className="text-[10px] font-semibold text-[#4338CA] bg-[#EEF2FF] border border-[#C7D2FE] px-1.5 py-0.5 rounded-md shrink-0 ml-1">
                                  {legalConfig.badge}
                                </span>
                              </div>
                              <input
                                type="text"
                                value={intakeData.schoolProfile.legalInstitutionName || ''}
                                onChange={(e) => updateSectionField('schoolProfile', 'legalInstitutionName', e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden text-[#131B2E] placeholder:text-[#94A3B8] transition shadow-2xs"
                                placeholder={legalConfig.placeholder}
                              />
                              <span className="text-[10px] text-[#94A3B8] mt-1 block">
                                {legalConfig.hint}
                              </span>
                              {renderFieldCRAlert(cr)}
                            </div>
                          );
                        })()}

                        {(() => {
                          const cr = getFieldCR('schoolProfile', 'yearOfEstablishment');
                          return (
                            <div className={getFieldWrapperClass(cr)}>
                              <label className="block font-bold text-[#334155] mb-1">
                                <span>Year of Establishment</span>
                                {renderCRBadge(cr)}
                              </label>
                              <input
                                type="text"
                                value={intakeData.schoolProfile.yearOfEstablishment || intakeData.schoolProfile.establishmentYear || ''}
                                onChange={(e) => {
                                  updateSectionField('schoolProfile', 'yearOfEstablishment', e.target.value);
                                  updateSectionField('schoolProfile', 'establishmentYear', e.target.value);
                                }}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden text-[#131B2E] font-mono text-xs placeholder:text-[#94A3B8] transition shadow-2xs"
                                placeholder="e.g. 2008"
                              />
                              <span className="text-[10px] text-[#94A3B8] mt-1 block">
                                Year when school was established.
                              </span>
                              {renderFieldCRAlert(cr)}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })()}

                {/* Sub-Card 2: Board Affiliation & Academic Classification */}
                <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl p-5 space-y-4 shadow-2xs">
                  <div className="flex items-center space-x-2 border-b border-[#E2E8F0] pb-3">
                    <GraduationCap className="w-4 h-4 text-[#4338CA]" />
                    <h3 className="font-bold text-sm text-[#131B2E]">2. Board Affiliation & Academic Classification</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    {(() => {
                      const cr = getFieldCR('schoolProfile', 'board');
                      return (
                        <div className={getFieldWrapperClass(cr)}>
                          <label className="block font-bold text-[#334155] mb-1">
                            <span>Affiliation Board / Body *</span>
                            {renderCRBadge(cr)}
                          </label>
                          <select
                            id="field-school-board"
                            value={intakeData.schoolProfile.board || 'CBSE'}
                            onChange={(e) => updateSectionField('schoolProfile', 'board', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden text-[#131B2E] transition shadow-2xs font-medium"
                          >
                            <option value="CBSE">CBSE (Central Board of Secondary Education)</option>
                            <option value="CISCE / ICSE">CISCE / ICSE</option>
                            <option value="State Board">State Board (BSEB / Other)</option>
                            <option value="IB">IB (International Baccalaureate)</option>
                            <option value="Cambridge">Cambridge (IGCSE)</option>
                            <option value="NIOS">NIOS</option>
                            <option value="Other">Other / Non-Affiliated</option>
                          </select>
                          <span className="text-[10px] text-[#94A3B8] mt-1 block">
                            Select governing education board for this school.
                          </span>
                          {renderFieldCRAlert(cr)}
                        </div>
                      );
                    })()}

                    {(() => {
                      const cr = getFieldCR('schoolProfile', 'schoolCode');
                      return (
                        <div className={getFieldWrapperClass(cr)}>
                          <label className="block font-bold text-[#334155] mb-1">
                            <span>{currentBoardConfig.codeLabel || 'CBSE School Code (School No.)'}</span>
                            {renderCRBadge(cr)}
                          </label>
                          <input
                            type="text"
                            value={intakeData.schoolProfile.schoolCode || ''}
                            onChange={(e) => updateSectionField('schoolProfile', 'schoolCode', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden text-[#131B2E] font-mono text-xs placeholder:text-[#94A3B8] transition shadow-2xs"
                            placeholder={currentBoardConfig.codePlaceholder}
                          />
                          <span className="text-[10px] text-[#94A3B8] mt-1 block">
                            {currentBoardConfig.codeHelper}
                          </span>
                          {renderFieldCRAlert(cr)}
                        </div>
                      );
                    })()}

                    {(() => {
                      const cr = getFieldCR('schoolProfile', 'affiliationNumber');
                      return (
                        <div className={getFieldWrapperClass(cr)}>
                          <label className="block font-bold text-[#334155] mb-1">
                            <span>{currentBoardConfig.affiliationLabel || 'CBSE Affiliation Number'}</span>
                            {renderCRBadge(cr)}
                          </label>
                          <input
                            type="text"
                            value={intakeData.schoolProfile.affiliationNumber || ''}
                            onChange={(e) => updateSectionField('schoolProfile', 'affiliationNumber', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden text-[#131B2E] font-mono text-xs placeholder:text-[#94A3B8] transition shadow-2xs"
                            placeholder={currentBoardConfig.affiliationPlaceholder}
                          />
                          <span className="text-[10px] text-[#94A3B8] mt-1 block">
                            {currentBoardConfig.affiliationHelper}
                          </span>
                          {renderFieldCRAlert(cr)}
                        </div>
                      );
                    })()}

                    {(() => {
                      const cr = getFieldCR('schoolProfile', 'schoolType');
                      return (
                        <div className={getFieldWrapperClass(cr)}>
                          <label className="block font-bold text-[#334155] mb-1">
                            <span>School Type / Level *</span>
                            {renderCRBadge(cr)}
                          </label>
                          <select
                            value={
                              intakeData.schoolProfile.schoolType === 'K-12 School'
                                ? 'K-12 School (Kindergarten to 12th)'
                                : (intakeData.schoolProfile.schoolType || 'K-12 School (Kindergarten to 12th)')
                            }
                            onChange={(e) => {
                              const newType = e.target.value;
                              updateSectionField('schoolProfile', 'schoolType', newType);

                              const struct = intakeData.institutionStructure;
                              const isConfirmed = Boolean(struct?.confirmed || struct?.academicStructureConfirmed);
                              if (!isConfirmed) {
                                const freshClasses = getSuggestedClassesForSchoolType(newType);
                                const derived = deriveClassesOfferedSummary(freshClasses);
                                updateSectionDirect('institutionStructure', {
                                  ...(struct || {}),
                                  classes: freshClasses,
                                  classesOfferedFrom: derived.classesOfferedFrom,
                                  classesOfferedTo: derived.classesOfferedTo,
                                  totalSectionsEstimated: derived.totalSectionsEstimated,
                                  academicStreams: derived.academicStreams,
                                  structureStatus: 'suggested',
                                  confirmed: false,
                                  academicStructureConfirmed: false,
                                });
                              }
                            }}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden text-[#131B2E] transition shadow-2xs font-medium"
                          >
                            <option value="K-12 School (Kindergarten to 12th)">
                              K-12 School (Complete KG / Nursery to 12th Standard)
                            </option>
                            <option value="Senior Secondary School (10+2)">
                              Senior Secondary School (Class 11 - 12 / 10+2 Intermediate)
                            </option>
                            <option value="Secondary School (Up to 10th)">
                              Secondary / High School (Up to 10th / Matriculation)
                            </option>
                            <option value="Middle School (Class 1 to 8)">
                              Middle / Upper Primary School (Class 1 to 8th)
                            </option>
                            <option value="Primary School (Class 1 to 5)">
                              Primary School (Nursery / KG to Class 5th)
                            </option>
                            <option value="Play School / Pre-School">
                              Play School / Pre-School (Playgroup, Nursery, LKG, UKG)
                            </option>
                            <option value="Coaching / Academy">
                              Coaching Institute / Academy / Junior College
                            </option>
                            <option value="Other">Other Institutional Setup</option>
                          </select>
                          <span className="text-[10px] text-[#64748B] mt-1 block leading-relaxed">
                            <span className="font-semibold text-[#4338CA]">Note:</span> <strong>K-12</strong> means complete schooling from <strong>Kindergarten (Nursery/KG) through 12th Standard (10+2)</strong>.
                          </span>
                          {renderFieldCRAlert(cr)}
                        </div>
                      );
                    })()}

                    <div>
                      <label className="block font-bold text-[#334155] mb-1">Gender Category *</label>
                      <select
                        value={intakeData.schoolProfile.genderCategory || 'co_ed'}
                        onChange={(e) => {
                          const v = e.target.value as any;
                          updateSectionField('schoolProfile', 'genderCategory', v);
                          updateSectionField('schoolProfile', 'coEdStatus', v);
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden text-[#131B2E] transition shadow-2xs"
                      >
                        <option value="co_ed">Co-Educational</option>
                        <option value="boys">Boys Only</option>
                        <option value="girls">Girls Only</option>
                      </select>
                      <span className="text-[10px] text-[#94A3B8] mt-1 block">
                        Student gender enrollment policy.
                      </span>
                    </div>

                    <SchoolAccommodationSelector
                      value={intakeData.schoolProfile.residentialStatus}
                      onChange={(val) => updateSectionField('schoolProfile', 'residentialStatus', val)}
                      label="School Accommodation Type *"
                      helperText="Select how students are accommodated at the school."
                    />
                  </div>
                </div>

                {/* Sub-Card 3: Official Communication Channels */}
                <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl p-5 space-y-4 shadow-2xs">
                  <div className="flex items-center space-x-2 border-b border-[#E2E8F0] pb-3">
                    <Phone className="w-4 h-4 text-[#4338CA]" />
                    <h3 className="font-bold text-sm text-[#131B2E]">3. Official Institutional Contacts</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {(() => {
                      const cr = getFieldCR('schoolProfile', 'officialEmail');
                      return (
                        <div className={getFieldWrapperClass(cr)}>
                          <label className="block font-bold text-[#334155] mb-1">
                            <span>Official School Email *</span>
                            {renderCRBadge(cr)}
                          </label>
                          <input
                            id="field-school-email"
                            type="email"
                            value={intakeData.schoolProfile.officialEmail || ''}
                            onChange={(e) => updateSectionField('schoolProfile', 'officialEmail', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden text-[#131B2E] placeholder:text-[#94A3B8] transition shadow-2xs"
                            placeholder="info@school.edu.in"
                          />
                          {renderFieldCRAlert(cr)}
                        </div>
                      );
                    })()}

                    {(() => {
                      const cr = getFieldCR('schoolProfile', 'officialPhone');
                      return (
                        <div className={getFieldWrapperClass(cr)}>
                          <label className="block font-bold text-[#334155] mb-1">
                            <span>Official School Phone / Helpline *</span>
                            {renderCRBadge(cr)}
                          </label>
                          <input
                            id="field-school-phone"
                            type="tel"
                            value={intakeData.schoolProfile.officialPhone || ''}
                            onChange={(e) => updateSectionField('schoolProfile', 'officialPhone', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden text-[#131B2E] placeholder:text-[#94A3B8] transition shadow-2xs"
                            placeholder="+91 98765 43210"
                          />
                          {renderFieldCRAlert(cr)}
                        </div>
                      );
                    })()}

                    {(() => {
                      const cr = getFieldCR('schoolProfile', 'secondaryPhone') || getFieldCR('schoolProfile', 'emergencyContact');
                      return (
                        <div className={getFieldWrapperClass(cr)}>
                          <label className="block font-bold text-[#334155] mb-1">
                            <span>Emergency / Alternate Phone</span>
                            {renderCRBadge(cr)}
                          </label>
                          <input
                            type="tel"
                            value={intakeData.schoolProfile.emergencyContact || intakeData.schoolProfile.secondaryPhone || ''}
                            onChange={(e) => {
                              updateSectionField('schoolProfile', 'emergencyContact', e.target.value);
                              updateSectionField('schoolProfile', 'secondaryPhone', e.target.value);
                            }}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden text-[#131B2E] placeholder:text-[#94A3B8] transition shadow-2xs"
                            placeholder="Alternate contact phone"
                          />
                          {renderFieldCRAlert(cr)}
                        </div>
                      );
                    })()}

                    {(() => {
                      const cr = getFieldCR('schoolProfile', 'whatsappNumber');
                      return (
                        <div className={getFieldWrapperClass(cr)}>
                          <label className="block font-bold text-[#334155] mb-1">
                            <span>Official WhatsApp Support Number</span>
                            {renderCRBadge(cr)}
                          </label>
                          <input
                            type="tel"
                            value={intakeData.schoolProfile.whatsappNumber || ''}
                            onChange={(e) => updateSectionField('schoolProfile', 'whatsappNumber', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden text-[#131B2E] placeholder:text-[#94A3B8] transition shadow-2xs"
                            placeholder="WhatsApp contact for parent inquiries"
                          />
                          {renderFieldCRAlert(cr)}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2: CAMPUSES */}
            {currentSection.key === 'campuses' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#131B2E]">Campus & Branch Facilities</h3>
                    <p className="text-xs text-[#94A3B8]">Add multiple branches if your institution operates separate primary or senior wings.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const list = intakeData.campuses || [];
                      const nextNum = list.length + 1;
                      const mainCamp = list[0] || intakeData.schoolProfile;
                      updateSectionDirect('campuses', [
                        ...list,
                        {
                          id: `campus-${Date.now()}`,
                          name: `Campus ${nextNum}`,
                          code: `CMP-${nextNum}`,
                          address: '',
                          country: mainCamp.country || 'India',
                          otherCountry: mainCamp.otherCountry || '',
                          state: mainCamp.state || project.state || '',
                          otherStateProvince: mainCamp.otherStateProvince || '',
                          district: mainCamp.district || '',
                          otherDistrict: mainCamp.otherDistrict || '',
                          city: mainCamp.city || '',
                          pin: '',
                          contactPhone: mainCamp.contactPhone || mainCamp.officialPhone || '',
                          isMainCampus: false,
                          facilities: [],
                        },
                      ]);
                    }}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#4338CA] hover:bg-[#3730A3] text-white shadow-2xs rounded-xl text-xs font-semibold shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Campus</span>
                  </button>
                </div>

                {/* INSTITUTIONAL ACADEMIC SCOPE OVERVIEW BANNER */}
                {(() => {
                  const academicSummary = deriveSchoolAcademicSummary(
                    intakeData.campuses,
                    intakeData.institutionStructure,
                    intakeData.schoolProfile
                  );
                  return (
                    <div className="bg-gradient-to-r from-indigo-50/90 via-slate-50 to-amber-50/50 border border-indigo-100 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3 sm:space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center space-x-2">
                          <GraduationCap className="w-4 h-4 text-[#4338CA]" />
                          <h4 className="font-bold text-xs text-[#131B2E]">
                            Institutional Academic Scope Overview
                          </h4>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            academicSummary.isConsolidated
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : academicSummary.isLegacyUnspecified
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}
                        >
                          {academicSummary.isConsolidated
                            ? 'Consolidated Curriculum'
                            : academicSummary.isLegacyUnspecified
                            ? 'Scope Allocation Needed'
                            : 'Multi-Scope Campus Model'}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1.5 sm:gap-3 text-xs">
                        <span className="font-extrabold text-[#131B2E] text-sm sm:text-base">
                          {academicSummary.headlineSummary}
                        </span>
                        <span className="text-[#64748B] font-medium text-[11px]">
                          • {academicSummary.subSummary}
                        </span>
                        {academicSummary.isConsolidated && academicSummary.consolidatedClassRange && (
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            Shared Range: {academicSummary.consolidatedClassRange}
                          </span>
                        )}
                      </div>

                      {academicSummary.isLegacyUnspecified && academicSummary.legacySummaryText && (
                        <p className="text-[11px] text-amber-800 bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 leading-relaxed">
                          {academicSummary.legacySummaryText}. Please assign each campus below its independent academic scope.
                        </p>
                      )}

                      {/* Campus-by-Campus Scope Pills */}
                      <div className="flex flex-wrap gap-2 pt-2 sm:pt-2.5 border-t border-indigo-100/60">
                        {academicSummary.campusBreakdowns.map((b) => (
                          <div
                            key={b.campusId}
                            className="bg-white border border-[#E2E8F0] px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs text-[11px]"
                          >
                            <span className="font-bold text-[#131B2E]">{b.campusName}:</span>
                            <span className="text-[#4338CA] font-semibold">{b.levelSummary}</span>
                            <span className="text-[#94A3B8]">•</span>
                            <span className="text-[#64748B]">{b.classRange}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <div className="space-y-4 sm:space-y-5">
                  {(intakeData.campuses || []).map((camp, idx) => (
                    <div key={camp.id} className="bg-[#FAF7F2] border border-[#E2E8F0] p-4 sm:p-6 rounded-2xl sm:rounded-3xl space-y-5 text-xs">
                      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 sm:pb-3.5">
                        <span className="font-bold text-[#131B2E] flex items-center space-x-2 flex-wrap gap-y-1">
                          <Building2 className="w-4 h-4 text-[#4338CA] shrink-0" />
                          <span>{camp.name || (camp.isMainCampus ? 'Main Campus' : `Campus ${idx + 1}`)}</span>
                          {camp.isMainCampus ? (
                            <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                              MAIN CAMPUS
                            </span>
                          ) : (
                            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full">
                              CAMPUS {idx + 1}
                            </span>
                          )}
                          <span className="text-[11px] text-[#64748B] font-medium hidden sm:inline">
                            {camp.isMainCampus ? '• Main Campus (Primary Reference)' : '• Additional Campus'}
                          </span>
                        </span>
                        <div className="flex items-center space-x-2">
                          {!camp.isMainCampus && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = handleMainCampusDesignation(intakeData, camp.id);
                                setIntakeData(updated);
                                setActiveCampusId(camp.id);
                                isDirtyRef.current = true;
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#4338CA] bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition cursor-pointer"
                              title="Designate this campus as the Main Campus"
                            >
                              Set as Main Campus
                            </button>
                          )}
                          {(intakeData.campuses || []).length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const target = (intakeData.campuses || [])[idx];
                                const hasData = Boolean(target && (target.name || target.address || target.contactPhone));
                                if (hasData) {
                                  const confirmed = window.confirm(
                                    `Are you sure you want to remove ${target.name ? `"${target.name}"` : 'this campus'}?`
                                  );
                                  if (!confirmed) return;
                                }
                                const updated = handleCampusDeletion(intakeData, camp.id);
                                setIntakeData(updated);
                                const nextMain = getMainCampus(updated.campuses);
                                if (activeCampusId === camp.id && nextMain?.id) {
                                  setActiveCampusId(nextMain.id);
                                }
                                isDirtyRef.current = true;
                              }}
                              className="inline-flex items-center justify-center p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition cursor-pointer"
                              title="Remove Campus"
                              aria-label={`Remove campus ${camp.name || idx + 1}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-4.5">
                        {(() => {
                          const cr = getFieldCR('campuses', camp.isMainCampus ? 'mainCampusName' : 'name');
                          return (
                            <div className={getFieldWrapperClass(cr)}>
                              <label htmlFor={`campus-${camp.id || idx}-name`} className="block font-medium text-[#64748B] mb-1.5">
                                <span>Campus Name *</span>
                                {renderCRBadge(cr)}
                              </label>
                              <input
                                id={`campus-${camp.id || idx}-name`}
                                type="text"
                                value={camp.name}
                                onChange={(e) => updateCampusField(idx, { name: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                              />
                              {renderFieldCRAlert(cr)}
                            </div>
                          );
                        })()}
                        <div>
                          <label htmlFor={`campus-${camp.id || idx}-code`} className="block font-medium text-[#64748B] mb-1.5">Campus Code</label>
                          <input
                            id={`campus-${camp.id || idx}-code`}
                            type="text"
                            value={camp.code || ''}
                            onChange={(e) => updateCampusField(idx, { code: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label htmlFor={`campus-${camp.id || idx}-coordinator`} className="block font-medium text-[#64748B] mb-1.5">Coordinator / Head Name</label>
                          <input
                            id={`campus-${camp.id || idx}-coordinator`}
                            type="text"
                            value={camp.coordinatorName || camp.principalOrHead || ''}
                            onChange={(e) => updateCampusField(idx, { coordinatorName: e.target.value, principalOrHead: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                          />
                        </div>

                        {/* Campus Location Card (Clean, Simple Optional Text URL - No Detection Pipeline) */}
                        <div className="md:col-span-3 bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-[#4338CA]" aria-hidden="true" />
                            <h4 className="font-bold text-sm text-[#131B2E]">Campus Location</h4>
                          </div>
                          <div>
                            <label
                              htmlFor={`campus-${camp.id || idx}-google-maps-link`}
                              className="flex items-center justify-between font-medium text-[#131B2E] mb-1.5 text-xs"
                            >
                              <span>Google Maps Location Link</span>
                              <span className="font-normal text-[#64748B] text-[11px]">Optional</span>
                            </label>
                            <input
                              id={`campus-${camp.id || idx}-google-maps-link`}
                              name={`campus_${idx}_googleMapsLink`}
                              type="url"
                              value={camp.googleMapsLink ?? camp.googleMapsUrl ?? ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                const coords = extractCoordinatesFromUrl(val);
                                updateCampusField(idx, {
                                  googleMapsLink: val,
                                  googleMapsUrl: val,
                                  ...(coords ? { latitude: coords.latitude, longitude: coords.longitude } : {}),
                                });
                              }}
                              placeholder="https://maps.app.goo.gl/..."
                              aria-describedby={`campus-${camp.id || idx}-map-helper${camp.googleMapsLink && !isValidGoogleMapsUrl(camp.googleMapsLink) ? ` campus-${camp.id || idx}-map-error` : ''}`}
                              className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-[#131B2E] placeholder:text-[#94A3B8] text-xs transition shadow-2xs focus:ring-3 focus:outline-hidden ${
                                camp.googleMapsLink && !isValidGoogleMapsUrl(camp.googleMapsLink)
                                  ? 'border-amber-400 focus:border-amber-500 focus:ring-amber-500/10'
                                  : 'border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-[#4338CA]/10'
                              }`}
                            />
                            <p id={`campus-${camp.id || idx}-map-helper`} className="text-[11px] text-[#64748B] mt-1.5 leading-relaxed">
                              If your school has a Google Maps location, paste the share link here. Ekaagra will use it to add a map or directions link to your school&apos;s website.
                            </p>
                            {camp.googleMapsLink && !isValidGoogleMapsUrl(camp.googleMapsLink) && (
                              <p
                                id={`campus-${camp.id || idx}-map-error`}
                                role="alert"
                                className="text-[11px] text-amber-700 bg-amber-50/80 border border-amber-200/80 rounded-lg px-2.5 py-1.5 mt-1.5 font-medium flex items-center gap-1.5 shadow-2xs"
                              >
                                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" aria-hidden="true" />
                                <span>Please enter a valid Google Maps link.</span>
                              </p>
                            )}
                            {camp.googleMapsLink && isValidGoogleMapsUrl(camp.googleMapsLink) && (
                              <div className="mt-2.5 flex items-center justify-between text-[11px]">
                                <a
                                  href={camp.googleMapsLink.startsWith('http') ? camp.googleMapsLink : `https://${camp.googleMapsLink}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[#4338CA] hover:text-[#3730A3] hover:underline font-medium"
                                  aria-label={`Test Google Maps link for ${camp.name || 'Campus'} (opens in new tab)`}
                                >
                                  <span>Test Link</span>
                                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateCampusField(idx, {
                                      googleMapsLink: '',
                                      googleMapsUrl: '',
                                    });
                                  }}
                                  className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                                  aria-label="Remove Google Maps link"
                                >
                                  Remove Link
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {(() => {
                          const cr = getFieldCR('campuses', camp.isMainCampus ? 'mainCampusAddress' : 'address');
                          return (
                            <div className={`md:col-span-2 ${getFieldWrapperClass(cr)}`}>
                              <label htmlFor={idx === 0 ? 'field-campus-address' : `campus-${camp.id || idx}-address`} className="block font-medium text-[#64748B] mb-1.5">
                                <span>Campus Postal Address *</span>
                                {renderCRBadge(cr)}
                              </label>
                              <input
                                id={idx === 0 ? 'field-campus-address' : `campus-${camp.id || idx}-address`}
                                type="text"
                                value={camp.address}
                                onChange={(e) => updateCampusField(idx, { address: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                                placeholder="Campus street, locality, gate road"
                              />
                              {renderFieldCRAlert(cr)}
                            </div>
                          );
                        })()}

                        <div>
                          <label htmlFor={`campus-${camp.id || idx}-landmark`} className="block font-medium text-[#64748B] mb-1.5">Landmark / Campus Area</label>
                          <input
                            id={`campus-${camp.id || idx}-landmark`}
                            type="text"
                            value={camp.landmark || ''}
                            onChange={(e) => updateCampusField(idx, { landmark: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                            placeholder="e.g. Near Gandhi Memorial, Station Road"
                          />
                        </div>

                        {/* Canonical Standard + Other Location Dropdowns */}
                        {(() => {
                          const selectedCountry =
                            camp.country === OTHER_OPTION || camp.country === 'Other Country'
                              ? OTHER_OPTION
                              : (camp.country || 'India');
                          const customCountry = camp.otherCountry || camp.countryName || '';

                          const activeCountry = selectedCountry === OTHER_OPTION ? customCountry : selectedCountry;
                          const standardCountries = getStandardCountries();
                          const standardStates = getStandardStatesForCountry(activeCountry || 'India');

                          const selectedState =
                            camp.state === OTHER_OPTION
                              ? OTHER_OPTION
                              : (camp.state || ((activeCountry || 'India').toLowerCase() === 'india' ? 'Bihar' : OTHER_OPTION));
                          const customState = camp.otherStateProvince || camp.otherState || '';

                          const activeState = selectedState === OTHER_OPTION ? customState : selectedState;
                          const standardDistricts = getStandardDistrictsForState(activeCountry || 'India', activeState || 'Bihar');

                          const selectedDistrict =
                            camp.district === OTHER_OPTION || camp.district === '__custom__'
                              ? OTHER_OPTION
                              : (camp.district || (standardDistricts.length > 0 ? standardDistricts[0] : OTHER_OPTION));
                          const customDistrict = camp.otherDistrict || '';

                          return (
                            <>
                              {/* Country Dropdown */}
                              <AddressDropdownWithOther
                                id={`campus-${camp.id || idx}-country`}
                                label="Country"
                                required
                                selectedValue={selectedCountry}
                                customValue={customCountry}
                                options={standardCountries}
                                customInputLabel="Other Country Name"
                                placeholder="Enter country name"
                                helperText="Not listed? Enter the official name manually."
                                onSelectChange={(newCountry) => {
                                  if (newCountry === OTHER_OPTION) {
                                    updateCampusField(idx, {
                                      country: OTHER_OPTION,
                                      otherCountry: '',
                                      countryName: '',
                                      state: OTHER_OPTION,
                                      otherStateProvince: '',
                                      otherState: '',
                                      district: OTHER_OPTION,
                                      otherDistrict: '',
                                    });
                                  } else {
                                    const nextState = newCountry.toLowerCase() === 'india'
                                      ? (isKnownState('India', camp.state) ? camp.state : 'Bihar')
                                      : (isKnownState(newCountry, camp.state) ? camp.state : OTHER_OPTION);
                                    const dList = getStandardDistrictsForState(newCountry, nextState);
                                    const nextDistrict = isKnownDistrict(newCountry, nextState, camp.district)
                                      ? camp.district
                                      : (dList[0] || OTHER_OPTION);

                                    updateCampusField(idx, {
                                      country: newCountry,
                                      otherCountry: '',
                                      countryName: '',
                                      state: nextState,
                                      otherStateProvince: '',
                                      otherState: '',
                                      district: nextDistrict,
                                      otherDistrict: '',
                                    });
                                  }
                                }}
                                onCustomChange={(customVal) => {
                                  updateCampusField(idx, {
                                    otherCountry: customVal,
                                    countryName: customVal,
                                  });
                                }}
                              />

                              {/* State / Province Dropdown */}
                              <AddressDropdownWithOther
                                id={`campus-${camp.id || idx}-state`}
                                label="State / Province"
                                required
                                selectedValue={selectedState}
                                customValue={customState}
                                options={standardStates}
                                customInputLabel="Other State / Province"
                                placeholder="Enter state, province, or territory"
                                helperText="Not listed? Enter the official name manually."
                                onSelectChange={(newState) => {
                                  const currentCountry = camp.country || 'India';
                                  const effectiveC =
                                    currentCountry === OTHER_OPTION
                                      ? (camp.otherCountry || camp.countryName || 'India')
                                      : currentCountry;

                                  if (newState === OTHER_OPTION) {
                                    updateCampusField(idx, {
                                      state: OTHER_OPTION,
                                      otherStateProvince: '',
                                      otherState: '',
                                      district: OTHER_OPTION,
                                      otherDistrict: '',
                                    });
                                  } else {
                                    const dList = getStandardDistrictsForState(effectiveC, newState);
                                    const nextDistrict = isKnownDistrict(effectiveC, newState, camp.district)
                                      ? camp.district
                                      : (dList[0] || OTHER_OPTION);

                                    updateCampusField(idx, {
                                      state: newState,
                                      otherStateProvince: '',
                                      otherState: '',
                                      district: nextDistrict,
                                      otherDistrict: '',
                                    });
                                  }
                                }}
                                onCustomChange={(customVal) => {
                                  updateCampusField(idx, {
                                    otherStateProvince: customVal,
                                    otherState: customVal,
                                  });
                                }}
                              />

                              {/* District Dropdown */}
                              <AddressDropdownWithOther
                                id={`campus-${camp.id || idx}-district`}
                                label="District"
                                required={(activeCountry || 'India').toLowerCase() === 'india'}
                                selectedValue={selectedDistrict}
                                customValue={customDistrict}
                                options={standardDistricts}
                                customInputLabel="Other District"
                                placeholder="Enter district name"
                                helperText="Not listed? Enter the official name manually."
                                onSelectChange={(newDistrict) => {
                                  if (newDistrict === OTHER_OPTION) {
                                    updateCampusField(idx, {
                                      district: OTHER_OPTION,
                                      otherDistrict: '',
                                    });
                                  } else {
                                    updateCampusField(idx, {
                                      district: newDistrict,
                                      otherDistrict: '',
                                    });
                                  }
                                }}
                                onCustomChange={(customVal) => {
                                  updateCampusField(idx, {
                                    otherDistrict: customVal,
                                  });
                                }}
                              />
                            </>
                          );
                        })()}

                        <div>
                          <label htmlFor={`campus-${camp.id || idx}-city`} className="block font-medium text-[#64748B] mb-1.5">City / Town</label>
                          <input
                            id={`campus-${camp.id || idx}-city`}
                            type="text"
                            value={camp.city || ''}
                            onChange={(e) => updateCampusField(idx, { city: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                            placeholder="e.g. Motihari"
                          />
                        </div>

                        <div>
                          <label htmlFor={`campus-${camp.id || idx}-pin`} className="block font-medium text-[#64748B] mb-1.5">Postal PIN</label>
                          <input
                            id={`campus-${camp.id || idx}-pin`}
                            type="text"
                            value={camp.pin || ''}
                            onChange={(e) => updateCampusField(idx, { pin: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs font-mono text-xs"
                            placeholder="e.g. 845401"
                          />
                        </div>

                        {(() => {
                          const cr = getFieldCR('campuses', camp.isMainCampus ? 'mainCampusPhone' : 'contactPhone');
                          return (
                            <div className={getFieldWrapperClass(cr)}>
                              <label htmlFor={`campus-${camp.id || idx}-phone`} className="block font-medium text-[#64748B] mb-1.5">
                                <span>Campus Contact Phone</span>
                                {renderCRBadge(cr)}
                              </label>
                              <input
                                id={`campus-${camp.id || idx}-phone`}
                                type="tel"
                                value={camp.contactPhone || ''}
                                onChange={(e) => updateCampusField(idx, { contactPhone: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                                placeholder="Phone number"
                              />
                              {renderFieldCRAlert(cr)}
                            </div>
                          );
                        })()}

                        <div className="md:col-span-3">
                          <label htmlFor={`campus-${camp.id || idx}-operating-hours`} className="block font-medium text-[#64748B] mb-1.5">Operating Hours</label>
                          <input
                            id={`campus-${camp.id || idx}-operating-hours`}
                            type="text"
                            value={camp.operatingHours || '08:00 AM - 03:00 PM'}
                            onChange={(e) => updateCampusField(idx, { operatingHours: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                          />
                        </div>

                        {/* Campus-Specific Academic Scope & Grades Offered */}
                        <div className="md:col-span-3 bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-6 shadow-2xs space-y-4 sm:space-y-5">
                          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3 sm:pb-3.5 flex-wrap gap-2">
                            <div className="flex items-center space-x-2">
                              <GraduationCap className="w-4 h-4 text-[#4338CA]" />
                              <div>
                                <h4 className="font-bold text-sm text-[#131B2E]">Campus Academic Scope &amp; Levels</h4>
                                <p className="text-[11px] text-[#64748B]">
                                  Configure the specific academic level, classes, and wing role for {camp.name || `Campus ${idx + 1}`}.
                                </p>
                              </div>
                            </div>
                            {/* Live Badge */}
                            {(() => {
                              const scope = deriveCampusAcademicScope(camp);
                              return (
                                <span className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-indigo-50 text-[#4338CA] border border-indigo-100 shadow-2xs">
                                  {scope.academicLevels.length > 0 ? scope.academicLevels.join(', ') : 'Scope Unspecified'}
                                  {scope.classRange ? ` • ${scope.classRange}` : ''}
                                </span>
                              );
                            })()}
                          </div>

                          {/* 1. Academic Level Multi-Select */}
                          <div>
                            <label className="block font-semibold text-[#131B2E] mb-1.5 text-xs">
                              Applicable Academic Level(s) *
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {(['Pre-Primary', 'Primary', 'Middle', 'Secondary', 'Senior Secondary', 'Other'] as const).map((level) => {
                                const currentLevels = Array.isArray(camp.academicLevels) ? camp.academicLevels : [];
                                const isSelected = currentLevels.some((l) => l.toLowerCase() === level.toLowerCase());

                                return (
                                  <button
                                    key={level}
                                    type="button"
                                    aria-pressed={isSelected}
                                    onClick={() => {
                                      // 1. Compute next levels (immutable toggle)
                                      const nextLevels = isSelected
                                        ? currentLevels.filter((l) => l.toLowerCase() !== level.toLowerCase())
                                        : [...currentLevels, level];

                                      // 2. Reconcile classes deterministically from NEW levels
                                      const { classes: nextClasses, classRange: nextClassRange } =
                                        reconcileClassesForAcademicLevels(nextLevels, camp.classesOffered || []);

                                      // 3. Single immutable campus update
                                      updateCampusField(idx, {
                                        academicLevels: nextLevels,
                                        academicLevel: nextLevels[0] || '',
                                        schoolLevel: nextLevels,
                                        classesOffered: nextClasses,
                                        classRange: nextClassRange,
                                        classesOfferedFrom: nextClasses.length > 0 ? nextClasses[0] : '',
                                        classesOfferedTo: nextClasses.length > 0 ? nextClasses[nextClasses.length - 1] : '',
                                      });
                                    }}
                                    className={`px-3.5 py-2 rounded-xl font-semibold text-xs border transition cursor-pointer shadow-2xs ${
                                      isSelected
                                        ? 'bg-[#4338CA] text-white border-[#4338CA]'
                                        : 'bg-white text-[#475569] border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-slate-50'
                                    }`}
                                  >
                                    {isSelected ? '✓ ' : '+ '}{level}
                                  </button>
                                );
                              })}
                            </div>
                            <p className="text-[11px] text-[#64748B] mt-1.5">
                              Select one or more levels operated at this physical campus (e.g. Pre-Primary only, or Primary only).
                            </p>
                          </div>

                          {/* 2. Campus Wing / Role Description (Optional) */}
                          <div className="pt-2 sm:pt-2.5">
                            <label htmlFor={`campus-${camp.id || idx}-wing-description`} className="block font-semibold text-[#131B2E] mb-1.5 text-xs">
                              Campus Wing / Role Description <span className="font-normal text-[#64748B]">(Optional)</span>
                            </label>
                            <input
                              id={`campus-${camp.id || idx}-wing-description`}
                              type="text"
                              value={camp.wingDescription || camp.academicDescription || ''}
                              onChange={(e) => {
                                updateCampusField(idx, {
                                  wingDescription: e.target.value,
                                  academicDescription: e.target.value,
                                });
                              }}
                              placeholder="e.g. Early Learning Wing / Senior Secondary Block / Junior Campus"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs text-xs"
                            />
                            <p className="text-[11px] text-[#64748B] mt-1.5">
                              Custom name or label shown on your school website and campus cards (e.g. Junior Wing, Toddlers Block).
                            </p>
                          </div>

                          {/* 3. Classes Offered */}
                          <div className="space-y-3 pt-3 sm:pt-4 border-t border-[#F1F5F9]">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <label className="font-semibold text-[#131B2E] text-xs">
                                Classes Offered at this Campus
                              </label>
                            </div>

                            {/* Class Pills */}
                            <div className="flex flex-wrap gap-2 min-h-[44px] p-2.5 sm:p-3 bg-[#FAF7F2] rounded-xl border border-[#E2E8F0]">
                              {(camp.classesOffered || []).length > 0 ? (
                                (camp.classesOffered || []).map((cls, cIdx) => (
                                  <span
                                    key={`${cls}-${cIdx}`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs font-semibold text-[#131B2E] shadow-2xs"
                                  >
                                    <span>{cls}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const next = (camp.classesOffered || []).filter((_, i) => i !== cIdx);
                                        updateCampusField(idx, {
                                          classesOffered: next,
                                          classRange: deriveCampusClassRange(next),
                                        });
                                      }}
                                      className="text-slate-400 hover:text-rose-600 transition ml-0.5 cursor-pointer font-bold"
                                      aria-label={`Remove ${cls}`}
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))
                              ) : (
                                <span className="text-[11px] text-[#94A3B8] italic p-1">
                                  No classes added yet. Type below to add classes.
                                </span>
                              )}
                            </div>

                            {/* Custom Class Quick Adder & Class Range Override */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1.5 sm:pt-2">
                              <div>
                                <label htmlFor={`custom-class-input-${idx}`} className="block font-medium text-[#64748B] mb-1.5">
                                  Add Custom Class
                                </label>
                                <div className="flex gap-2">
                                  <input
                                    id={`custom-class-input-${idx}`}
                                    type="text"
                                    placeholder="e.g. Playgroup, Class 1"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const input = e.currentTarget;
                                        const val = input.value.trim();
                                        if (val) {
                                          const next = Array.from(new Set([...(camp.classesOffered || []), val]));
                                          updateCampusField(idx, {
                                            classesOffered: next,
                                            classRange: deriveCampusClassRange(next),
                                          });
                                          input.value = '';
                                        }
                                      }
                                    }}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const input = document.getElementById(`custom-class-input-${idx}`) as HTMLInputElement;
                                      if (input && input.value.trim()) {
                                        const val = input.value.trim();
                                        const next = Array.from(new Set([...(camp.classesOffered || []), val]));
                                        updateCampusField(idx, {
                                          classesOffered: next,
                                          classRange: deriveCampusClassRange(next),
                                        });
                                        input.value = '';
                                      }
                                    }}
                                    className="px-4 py-2.5 bg-[#4338CA] hover:bg-[#3730A3] text-white rounded-xl font-semibold text-xs transition shadow-2xs shrink-0 cursor-pointer"
                                  >
                                    Add
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label htmlFor={`campus-${camp.id || idx}-class-range`} className="block font-medium text-[#64748B] mb-1.5">
                                  Class Range Display
                                </label>
                                <input
                                  id={`campus-${camp.id || idx}-class-range`}
                                  type="text"
                                  value={camp.classRange || ''}
                                  onChange={(e) => {
                                    updateCampusField(idx, { classRange: e.target.value });
                                  }}
                                  placeholder="e.g. Playgroup to UKG / Class 1 to 5"
                                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Campus-Specific Images (Genuine WebP Pipeline - Rendered after Campus Academic Scope) */}
                        <CampusImagesSection
                          campus={camp}
                          campusIndex={idx}
                          isSingleCampus={(intakeData.campuses || []).length === 1}
                          token={token}
                          allCampuses={intakeData.campuses || []}
                          mediaRegistry={intakeData.mediaRegistry}
                          onUpdateMediaRegistry={(updatedReg) => {
                            updateSectionDirect('mediaRegistry', updatedReg);
                          }}
                          onUpdateImages={(campusIdx, updatedImages) => {
                            updateCampusField(campusIdx, { images: updatedImages });
                          }}
                        />

                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 3: LEADERSHIP */}
            {currentSection.key === 'leadership' && (() => {
              const principalDesig = resolveDesignationDisplay(intakeData.leadership?.principalDesignation) || 'Principal';
              return (
              <div className="space-y-6 text-xs">
                <div className="bg-[#FAF7F2] border border-[#E2E8F0] p-4 rounded-2xl space-y-4">
                  <h3 className="font-bold text-[#131B2E] text-sm">{principalDesig} / Head of Institution</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {(() => {
                      const cr = getFieldCR('leadership', 'principalName');
                      return (
                        <div className={getFieldWrapperClass(cr)}>
                          <label className="block font-medium text-[#64748B] mb-1">
                            <span>{principalDesig} Full Name *</span>
                            {renderCRBadge(cr)}
                          </label>
                          <input
                            id="field-principal-name"
                            type="text"
                            value={intakeData.leadership?.principalName || ''}
                            onChange={(e) => updateSectionField('leadership', 'principalName', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                            placeholder="Dr. / Mr. / Mrs."
                          />
                          {renderFieldCRAlert(cr)}
                        </div>
                      );
                    })()}
                    <div>
                      <DesignationDropdownWithOther
                        id="principal-designation"
                        label="Official Designation"
                        required
                        value={intakeData.leadership?.principalDesignation ?? 'Principal'}
                        options={PRINCIPAL_DESIGNATIONS}
                        placeholder="Select designation ▼"
                        cachedCustomValue={designationCustomCache['principal']}
                        onCustomValueCache={(val) => {
                          setDesignationCustomCache((prev) => ({ ...prev, principal: val }));
                        }}
                        onChange={(val) => updateSectionField('leadership', 'principalDesignation', val)}
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-[#64748B] mb-1">Academic Qualifications</label>
                      <input
                        type="text"
                        value={intakeData.leadership?.principalQualification || ''}
                        onChange={(e) => updateSectionField('leadership', 'principalQualification', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                        placeholder="e.g. M.Sc., B.Ed., Ph.D."
                      />
                    </div>

                    {/* Principal / Head Photo (Genuine WebP Optimization Pipeline) */}
                    {(() => {
                      const cr = getFieldCR('leadership', 'principalPhoto', 'principal_photo') || getFieldCR('media', 'principal_photo');
                      return (
                        <div id="field-principal-portrait" className={`md:col-span-3 ${getFieldWrapperClass(cr)}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs text-[#131B2E]">Principal Portrait Image</span>
                            {renderCRBadge(cr)}
                          </div>
                          <PersonPhotoSection
                            personId={intakeData.leadership?.principalId || 'principal-main'}
                            personName={intakeData.leadership?.principalName || principalDesig}
                            personRole="principal"
                            label={`${principalDesig} / Head Photo`}
                            helperText={`Professional photograph of the ${principalDesig} / Head of Institution for use on the school's website and leadership sections.`}
                            image={intakeData.leadership?.principalPhoto}
                            legacyPhotoUrl={intakeData.leadership?.principalPhotoUrl}
                            token={token}
                            candidateAssets={personAssetLibrary}
                            allReferencedStorageKeys={allReferencedStorageKeys}
                            onUpdateImage={(newPhoto) => {
                              const copy = { ...(intakeData.leadership || {}) };
                              copy.principalPhoto = newPhoto;
                              copy.principalPhotoUrl = newPhoto?.url || '';
                              if (!copy.principalId) copy.principalId = 'principal-main';
                              if (newPhoto) {
                                setPersonAssetLibrary((prev) =>
                                  prev.some((p) => p.id === newPhoto.id) ? prev : [...prev, newPhoto]
                                );
                              }
                              updateSectionDirect('leadership', copy);
                            }}
                          />
                          {renderFieldCRAlert(cr)}
                        </div>
                      );
                    })()}

                    {isFieldVisible('principalMessage') && (
                      <div className="md:col-span-3">
                        <DeskMessageEditor
                          id="principal-desk-message"
                          personId={intakeData.leadership?.principalId || 'principal-main'}
                          personName={intakeData.leadership?.principalName || ''}
                          officialDesignation={intakeData.leadership?.principalDesignation ?? 'Principal'}
                          otherDesignation={designationCustomCache['principal'] || ''}
                          academicQualifications={intakeData.leadership?.principalQualification || ''}
                          isPrincipal={true}
                          value={intakeData.leadership?.principalMessage || ''}
                          messageSource={intakeData.leadership?.principalDeskMessageSource || 'generated'}
                          onChange={(val, source) => {
                            const copy = { ...(intakeData.leadership || {}) };
                            copy.principalMessage = val;
                            copy.principalDeskMessageSource = source;
                            updateSectionDirect('leadership', copy);
                          }}
                          token={token}
                          schoolContext={{
                            schoolName: intakeData.schoolProfile?.schoolName,
                            brandTone: intakeData.brandingDesign?.brandTone,
                            city: intakeData.schoolProfile?.city,
                            state: intakeData.schoolProfile?.state,
                            mottoOrTagline: intakeData.brandingDesign?.taglineOrMotto || intakeData.brandingDesign?.motto,
                          }}
                          required={true}
                          rows={4}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-[#FAF7F2] border border-[#E2E8F0] p-4 rounded-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
                    <div>
                      <h3 className="font-bold text-[#131B2E] text-sm">Managing Committee &amp; Directors</h3>
                      <p className="text-[11px] text-[#64748B]">Board of trustees, directors, and governing body members with credentials and desk messages.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const members = intakeData.leadership?.managementMembers || [];
                        updateSectionField('leadership', 'managementMembers', [
                          ...members,
                          {
                            id: `mgmt-${Date.now()}`,
                            name: '',
                            designation: '',
                            role: '',
                            email: '',
                            phone: '',
                            qualification: '',
                            deskMessage: '',
                            deskMessageSource: 'generated',
                            biography: '',
                            photoUrl: '',
                            photo: null,
                            displayOnWebsite: true,
                          },
                        ]);
                      }}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#4338CA] hover:bg-[#3730A3] text-white shadow-xs rounded-xl text-xs font-semibold transition shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Committee Member</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {(intakeData.leadership?.managementMembers || []).map((mem, idx) => {
                      const rawDesig = resolveDesignationDisplay(mem.designation) || (mem.role && mem.role !== 'Other' ? mem.role : '');
                      const memberDesig = rawDesig.trim();
                      const memberTitle = memberDesig || 'Member';
                      const defaultCardTitle = memberDesig ? `${memberDesig} #${idx + 1}` : `Committee Member #${idx + 1}`;

                      return (
                      <div
                        key={mem.id}
                        className="bg-white border border-[#E2E8F0] p-4 sm:p-5 rounded-2xl shadow-2xs space-y-4"
                      >
                        {/* Member Card Header */}
                        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
                          <div className="flex items-center space-x-2">
                            <span className="w-6 h-6 rounded-lg bg-[#FAF7F2] border border-[#E2E8F0] text-[#4338CA] flex items-center justify-center font-bold text-xs">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-[#131B2E] text-xs sm:text-sm">
                              {mem.name ? mem.name : defaultCardTitle}
                            </span>
                            {memberDesig && (
                              <span className="hidden sm:inline-block text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200 font-medium">
                                {memberDesig}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-3">
                            <label className="flex items-center space-x-1.5 text-xs text-[#334155] cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={mem.displayOnWebsite}
                                onChange={(e) => {
                                  const copy = [...(intakeData.leadership?.managementMembers || [])];
                                  copy[idx].displayOnWebsite = e.target.checked;
                                  updateSectionField('leadership', 'managementMembers', copy);
                                }}
                                className="w-4 h-4 rounded text-[#4338CA] focus:ring-[#4338CA] border-[#CBD5E1]"
                              />
                              <span className="text-[11px] font-medium">Show on Site</span>
                            </label>

                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const target = (intakeData.leadership?.managementMembers || [])[idx];
                                  const hasData = target && (target.name || target.phone || target.email || target.photo || target.deskMessage);
                                  if (hasData) {
                                    const confirmed = window.confirm(`Are you sure you want to remove ${target.name ? `"${target.name}"` : `this ${memberTitle.toLowerCase()}`} from the committee?`);
                                    if (!confirmed) return;
                                  }
                                  const oldStorageKey = target?.photo?.storageKey;
                                  const copy = (intakeData.leadership?.managementMembers || []).filter((_, i) => i !== idx);
                                  updateSectionField('leadership', 'managementMembers', copy);

                                  // Safely cleanup storage asset only if unreferenced elsewhere
                                  if (oldStorageKey) {
                                    const isReusedElsewhere = allReferencedStorageKeys.filter((k) => k === oldStorageKey).length > 1;
                                    if (!isReusedElsewhere) {
                                      try {
                                        fetch('/api/school-assets/delete', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ token, storageKey: oldStorageKey }),
                                        });
                                      } catch {
                                        // Non-blocking cleanup
                                      }
                                    }
                                  }
                                }}
                                className="inline-flex items-center space-x-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg text-xs font-medium transition cursor-pointer"
                                title={`Remove ${memberTitle}`}
                                aria-label={`Remove ${memberTitle.toLowerCase()} ${intakeData.leadership?.managementMembers?.[idx]?.name || idx + 1}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline text-[11px]">Remove</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Member Form Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block font-medium text-[#64748B] mb-1">
                              {memberDesig ? `${memberDesig} Full Name *` : 'Member Full Name *'}
                            </label>
                            <input
                              type="text"
                              value={mem.name}
                              onChange={(e) => {
                                const copy = [...(intakeData.leadership?.managementMembers || [])];
                                copy[idx].name = e.target.value;
                                updateSectionField('leadership', 'managementMembers', copy);
                              }}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                              placeholder="Dr. / Mr. / Mrs."
                            />
                          </div>

                          <div>
                            <DesignationDropdownWithOther
                              id={`trustee-designation-${mem.id || idx}`}
                              label="Official Designation"
                              value={mem.designation || ''}
                              options={TRUSTEE_DESIGNATIONS}
                              placeholder="Select designation ▼"
                              cachedCustomValue={designationCustomCache[mem.id || `trustee-${idx}`]}
                              onCustomValueCache={(val) => {
                                setDesignationCustomCache((prev) => ({
                                  ...prev,
                                  [mem.id || `trustee-${idx}`]: val,
                                }));
                              }}
                              onChange={(val) => {
                                const copy = [...(intakeData.leadership?.managementMembers || [])];
                                copy[idx].designation = val;
                                updateSectionField('leadership', 'managementMembers', copy);
                              }}
                            />
                          </div>

                          <div>
                            <label className="block font-medium text-[#64748B] mb-1">Academic Qualifications</label>
                            <input
                              type="text"
                              value={mem.qualification || mem.qualifications || ''}
                              onChange={(e) => {
                                const copy = [...(intakeData.leadership?.managementMembers || [])];
                                copy[idx].qualification = e.target.value;
                                copy[idx].qualifications = e.target.value;
                                updateSectionField('leadership', 'managementMembers', copy);
                              }}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                              placeholder="e.g. M.A., MBA, Ph.D."
                            />
                          </div>

                          {/* Person Photo for Member (Genuine WebP Optimization Pipeline) */}
                          <div className="md:col-span-3">
                            <PersonPhotoSection
                              personId={mem.id || `mgmt-${idx}`}
                              personName={mem.name || defaultCardTitle}
                              personRole="trustee"
                              label={memberDesig ? `${memberDesig} Photo` : 'Person Photo'}
                              helperText={
                                memberDesig
                                  ? `Professional photograph of the ${memberDesig.toLowerCase()} for use on the school's website and leadership/management sections.`
                                  : "Professional photograph of this committee member for use on the school's website and leadership/management sections."
                              }
                              image={mem.photo}
                              legacyPhotoUrl={mem.photoUrl}
                              token={token}
                              candidateAssets={personAssetLibrary}
                              allReferencedStorageKeys={allReferencedStorageKeys}
                              onUpdateImage={(newPhoto) => {
                                const copy = [...(intakeData.leadership?.managementMembers || [])];
                                copy[idx].photo = newPhoto;
                                copy[idx].photoUrl = newPhoto?.url || '';
                                if (newPhoto) {
                                  setPersonAssetLibrary((prev) =>
                                    prev.some((p) => p.id === newPhoto.id) ? prev : [...prev, newPhoto]
                                  );
                                }
                                updateSectionField('leadership', 'managementMembers', copy);
                              }}
                            />
                          </div>

                          <div>
                            <label className="block font-medium text-[#64748B] mb-1">Contact Phone</label>
                            <input
                              type="tel"
                              value={mem.phone}
                              onChange={(e) => {
                                const copy = [...(intakeData.leadership?.managementMembers || [])];
                                copy[idx].phone = e.target.value;
                                updateSectionField('leadership', 'managementMembers', copy);
                              }}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                              placeholder="+91 98765 43210"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block font-medium text-[#64748B] mb-1">Contact Email</label>
                            <input
                              type="email"
                              value={mem.email}
                              onChange={(e) => {
                                const copy = [...(intakeData.leadership?.managementMembers || [])];
                                copy[idx].email = e.target.value;
                                updateSectionField('leadership', 'managementMembers', copy);
                              }}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                              placeholder={
                                memberDesig
                                  ? `${memberDesig.toLowerCase().replace(/[^a-z0-9]/g, '')}@school.edu.in`
                                  : 'member@school.edu.in'
                              }
                            />
                          </div>

                          {isFieldVisible('principalMessage') && (
                            <div className="md:col-span-3">
                              <DeskMessageEditor
                                id={`member-desk-message-${mem.id || idx}`}
                                personId={mem.id || `mgmt-${idx}`}
                                personName={mem.name || ''}
                                officialDesignation={mem.designation || ''}
                                otherDesignation={designationCustomCache[mem.id || `trustee-${idx}`] || ''}
                                academicQualifications={mem.qualification || mem.qualifications || ''}
                                isPrincipal={false}
                                value={mem.deskMessage || mem.biography || mem.message || ''}
                                messageSource={mem.deskMessageSource || 'generated'}
                                onChange={(val, source) => {
                                  const copy = [...(intakeData.leadership?.managementMembers || [])];
                                  copy[idx].deskMessage = val;
                                  copy[idx].biography = val;
                                  copy[idx].message = val;
                                  copy[idx].deskMessageSource = source;
                                  updateSectionField('leadership', 'managementMembers', copy);
                                }}
                                token={token}
                                schoolContext={{
                                  schoolName: intakeData.schoolProfile?.schoolName,
                                  brandTone: intakeData.brandingDesign?.brandTone,
                                  city: intakeData.schoolProfile?.city,
                                  state: intakeData.schoolProfile?.state,
                                  mottoOrTagline: intakeData.brandingDesign?.taglineOrMotto || intakeData.brandingDesign?.motto,
                                }}
                                required={false}
                                rows={3}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              );
            })()}

            {/* SECTION 4: BRAND IDENTITY & SCHOOL PROFILE */}
            {currentSection.key === 'brandingDesign' && (
              <div className="space-y-5 text-xs">
                {/* Hidden File Input for Logo Upload */}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleLogoUpload(e.target.files[0]);
                      e.target.value = '';
                    }
                  }}
                  className="hidden"
                />

                {/* Sub-Card 1: Official School Logo / Crest */}
                {(() => {
                  const resolvedFileName =
                    intakeData.brandingDesign?.logoFileName ||
                    checklistLogo?.fileName ||
                    logoFileInfo?.name ||
                    (effectiveLogoUrl ? effectiveLogoUrl.split('/').pop()?.split('?')[0] : 'official-school-crest.svg');

                  const resolvedWidth = intakeData.brandingDesign?.logoWidth ?? checklistLogo?.width;
                  const resolvedHeight = intakeData.brandingDesign?.logoHeight ?? checklistLogo?.height;
                  const resolvedSize = intakeData.brandingDesign?.logoFileSize ?? checklistLogo?.fileSize;
                  const dimensionText = resolvedWidth && resolvedHeight ? `${resolvedWidth} × ${resolvedHeight} px` : null;
                  const sizeText = resolvedSize ? formatBytes(resolvedSize) : logoFileInfo?.size || null;

                  const isWebp =
                    intakeData.brandingDesign?.logoOptimizedFormat === 'webp' ||
                    checklistLogo?.optimizedFormat === 'webp' ||
                    Boolean(effectiveLogoUrl?.toLowerCase().includes('.webp'));
                  const isSvg = effectiveLogoUrl?.toLowerCase().includes('.svg');

                  const crLogo = getFieldCR('brandingDesign', 'logoUrl', 'logo_primary') || getFieldCR('media', 'logo_primary') || getFieldCR('assetChecklist', 'logo_primary');

                  return (
                    <div className={`border rounded-2xl p-5 sm:p-6 shadow-2xs space-y-3.5 ${crLogo ? getFieldWrapperClass(crLogo) : 'bg-[#FAF7F2] border-[#E2E8F0]'}`}>
                      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 flex-wrap gap-2">
                        <div className="flex items-center space-x-2">
                          <Sparkles className="w-4 h-4 text-[#4338CA]" />
                          <h3 className="font-bold text-sm text-[#131B2E]">Official School Logo / Crest</h3>
                          {renderCRBadge(crLogo)}
                        </div>
                        {Boolean(effectiveLogoUrl) && (
                          <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{isReusedLogoFromChecklist ? 'Linked / Reused' : 'Uploaded'}</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#64748B] leading-relaxed">
                        Upload the official logo or crest used to represent your institution across its digital presence.
                      </p>
                      {renderFieldCRAlert(crLogo)}

                      {/* Progressive Upload Feedback Bar */}
                      {logoUploadPhase !== 'idle' && (
                        <div className={`p-3 rounded-xl border flex items-center space-x-2.5 text-xs transition ${
                          logoUploadPhase === 'error'
                            ? 'bg-rose-50 border-rose-200 text-rose-700'
                            : logoUploadPhase === 'done'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-indigo-50/80 border-indigo-200 text-[#4338CA]'
                        }`}>
                          {logoUploadPhase === 'error' ? (
                            <AlertCircle className="w-4 h-4 shrink-0" />
                          ) : logoUploadPhase === 'done' ? (
                            <Check className="w-4 h-4 shrink-0" />
                          ) : (
                            <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                          )}
                          <span className="font-medium">{logoUploadMessage}</span>
                        </div>
                      )}

                      {Boolean(effectiveLogoUrl) ? (
                        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
                          <div className="flex items-center space-x-4 min-w-0">
                            {/* Interactive Thumbnail with Lightbox Preview */}
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() => setShowLogoLightbox(true)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  setShowLogoLightbox(true);
                                }
                              }}
                              title="Click to preview full-size crest"
                              className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl bg-[#FAF7F2] border border-[#E2E8F0] flex items-center justify-center p-2 shrink-0 shadow-2xs overflow-hidden group cursor-pointer hover:border-[#4338CA]/50 relative transition"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={effectiveLogoUrl}
                                alt="Official School Logo"
                                className="max-h-full max-w-full object-contain transition group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-indigo-950/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition rounded-xl">
                                <Maximize2 className="w-4 h-4 text-white drop-shadow-xs" />
                              </div>
                            </div>

                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                <span className="text-xs font-bold text-[#131B2E] truncate max-w-[220px]" title={resolvedFileName}>
                                  {resolvedFileName}
                                </span>
                                {isReusedLogoFromChecklist ? (
                                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md shrink-0">
                                    Reused from Checklist
                                  </span>
                                ) : isWebp ? (
                                  <span className="text-[10px] font-semibold text-[#4338CA] bg-[#EEF2FF] border border-[#C7D2FE] px-1.5 py-0.5 rounded-md shrink-0">
                                    WebP Optimized
                                  </span>
                                ) : isSvg ? (
                                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md shrink-0">
                                    SVG Vector
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold text-[#64748B] bg-[#F1F5F9] border border-[#E2E8F0] px-1.5 py-0.5 rounded-md shrink-0">
                                    Optimized
                                  </span>
                                )}
                                {dimensionText && (
                                  <span className="text-[10px] font-medium text-[#64748B]">
                                    {dimensionText}
                                  </span>
                                )}
                                {sizeText && (
                                  <span className="text-[10px] font-semibold font-mono text-[#334155]">
                                    {sizeText}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#64748B] leading-normal line-clamp-2">
                                This emblem will be deployed across your public website header, digital stationery, report cards, and student portal.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => setShowLogoLightbox(true)}
                              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-white text-xs font-semibold text-[#4338CA] hover:bg-[#EEF2FF] hover:border-[#C7D2FE] transition shadow-2xs cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#4338CA]/20"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                              <span>Preview</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => logoInputRef.current?.click()}
                              disabled={isUploadingLogo}
                              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-white text-xs font-semibold text-[#334155] hover:bg-[#FAF7F2] hover:border-[#CBD5E1] transition shadow-2xs cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#4338CA]/20 disabled:opacity-50"
                            >
                              <Upload className="w-3.5 h-3.5 text-[#64748B]" />
                              <span>Change File</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleRemoveLogo}
                              disabled={isUploadingLogo}
                              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition shadow-2xs cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                logoInputRef.current?.click();
                              }
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              setIsDraggingLogo(true);
                            }}
                            onDragLeave={() => setIsDraggingLogo(false)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setIsDraggingLogo(false);
                              if (e.dataTransfer.files?.[0]) handleLogoUpload(e.dataTransfer.files[0]);
                            }}
                            onClick={() => logoInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-2xl p-6 sm:p-7 text-center cursor-pointer transition-all duration-150 focus:outline-hidden focus:ring-3 focus:ring-[#4338CA]/20 ${
                              isDraggingLogo
                                ? 'border-[#4338CA] bg-indigo-50/60 scale-[1.005]'
                                : 'border-[#CBD5E1] bg-white hover:border-[#4338CA]/60 hover:bg-[#FAF7F2]'
                            }`}
                          >
                            <div className="mx-auto w-11 h-11 rounded-2xl bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center text-[#4338CA] mb-2.5 shadow-2xs">
                              <Upload className="w-5 h-5" />
                            </div>
                            <div className="text-xs font-bold text-[#131B2E]">
                              Drag and drop your official logo here, or <span className="text-[#4338CA] underline underline-offset-2">browse files</span>
                            </div>
                            <p className="text-[11px] text-[#64748B] mt-1">
                              High-resolution PNG, JPG or SVG (Transparent background recommended, up to 15MB)
                            </p>
                          </div>

                          {/* Existing Compatible Logo Reuse Option from Asset Checklist */}
                          {checklistLogo && checklistLogo.fileUrl && (
                            <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                              <div className="flex items-center space-x-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-white border border-[#CBD5E1] flex items-center justify-center overflow-hidden p-1 shrink-0">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={checklistLogo.fileUrl} alt="Checklist Logo" className="max-h-full max-w-full object-contain" />
                                </div>
                                <div className="min-w-0">
                                  <span className="font-semibold text-[#131B2E] block truncate">
                                    Compatible logo found in Asset Checklist
                                  </span>
                                  <span className="text-[11px] text-[#64748B]">
                                    {checklistLogo.fileName || 'School_Logo_Official.webp'} ({checklistLogo.optimizedFormat?.toUpperCase() || 'WebP'})
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  updateSectionField('brandingDesign', 'logoUrl', checklistLogo.fileUrl);
                                  updateSectionField('brandingDesign', 'crestUrl', checklistLogo.fileUrl);
                                  updateSectionField('brandingDesign', 'hasHighResLogo', true);
                                  if (checklistLogo.fileName) updateSectionField('brandingDesign', 'logoFileName', checklistLogo.fileName);
                                  if (checklistLogo.fileSize) updateSectionField('brandingDesign', 'logoFileSize', checklistLogo.fileSize);
                                  if (checklistLogo.width) updateSectionField('brandingDesign', 'logoWidth', checklistLogo.width);
                                  if (checklistLogo.height) updateSectionField('brandingDesign', 'logoHeight', checklistLogo.height);
                                  if (checklistLogo.storageKey) updateSectionField('brandingDesign', 'logoStorageKey', checklistLogo.storageKey);
                                  if (checklistLogo.optimizedFormat) updateSectionField('brandingDesign', 'logoOptimizedFormat', checklistLogo.optimizedFormat);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-[#4338CA] hover:bg-[#3730A3] text-white font-semibold text-xs transition shrink-0 cursor-pointer shadow-2xs"
                              >
                                Reuse this Logo
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Lightbox Preview Modal */}
                      {showLogoLightbox && Boolean(effectiveLogoUrl) && (
                        <ModalPortal isOpen={showLogoLightbox && Boolean(effectiveLogoUrl)}>
                        <div
                          role="dialog"
                          aria-modal="true"
                          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
                          onClick={() => setShowLogoLightbox(false)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') setShowLogoLightbox(false);
                          }}
                        >
                          <div
                            className="bg-white rounded-2xl max-w-xl w-full p-5 shadow-2xl border border-slate-200 relative space-y-4"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                              <div className="flex items-center space-x-2">
                                <Sparkles className="w-4 h-4 text-[#4338CA]" />
                                <h3 className="font-bold text-sm text-[#131B2E]">Official School Logo / Crest Preview</h3>
                              </div>
                              <button
                                type="button"
                                onClick={() => setShowLogoLightbox(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>

                            <div className="bg-[#FAF7F2] rounded-xl p-8 flex items-center justify-center border border-[#E2E8F0] min-h-[220px] max-h-[380px] overflow-hidden">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={effectiveLogoUrl}
                                alt="Official School Logo Preview"
                                className="max-h-[320px] max-w-full object-contain"
                              />
                            </div>

                            <div className="flex items-center justify-between text-xs text-[#64748B] pt-1">
                              <div className="space-x-2">
                                <span className="font-semibold text-[#131B2E]">{resolvedFileName}</span>
                                {dimensionText && <span>&bull; {dimensionText}</span>}
                                {sizeText && <span>&bull; {sizeText}</span>}
                              </div>
                              <a
                                href={effectiveLogoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#4338CA] hover:underline flex items-center space-x-1 font-medium"
                              >
                                <span>Open in new tab</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        </div>
                        </ModalPortal>
                      )}
                    </div>
                  );
                })()}

                {/* Sub-Card 2: School Identity (Two-Column Desktop Grid) */}
                <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
                  <div className="flex items-center space-x-2 border-b border-[#E2E8F0] pb-3">
                    <School className="w-4 h-4 text-[#4338CA]" />
                    <h3 className="font-bold text-sm text-[#131B2E]">School Identity</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* School Motto */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block font-bold text-xs text-[#131B2E]">
                          School Motto <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[10px] font-semibold text-[#4338CA] bg-[#EEF2FF] border border-[#C7D2FE] px-2 py-0.5 rounded-md">
                          Guiding Statement
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] leading-normal">
                        Your official school motto or guiding statement.
                      </p>
                      <input
                        type="text"
                        value={intakeData.brandingDesign.motto || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateSectionField('brandingDesign', 'motto', val);
                          if (!intakeData.brandingDesign.taglineOrMotto) {
                            updateSectionField('brandingDesign', 'taglineOrMotto', val);
                          }
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#131B2E] placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                        placeholder="e.g. Knowledge is Power / विद्या ददाति विनयं"
                      />
                    </div>

                    {/* School Tagline */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block font-bold text-xs text-[#131B2E]">
                          School Tagline
                        </label>
                        <span className="text-[10px] font-semibold text-[#64748B] bg-white border border-[#E2E8F0] px-2 py-0.5 rounded-md">
                          Short Phrase
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] leading-normal">
                        A short phrase used to describe your school&apos;s identity.
                      </p>
                      <input
                        type="text"
                        value={intakeData.brandingDesign.taglineOrMotto || ''}
                        onChange={(e) => updateSectionField('brandingDesign', 'taglineOrMotto', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#131B2E] placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                        placeholder="e.g. Excellence in Education"
                      />
                    </div>
                  </div>
                </div>

                {/* Sub-Card 3: Brand / Communication Style (Interactive Single-Selection Cards) */}
                {isFieldVisible('preferredVisualTone') && (
                  <>
                    <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
                  <div className="border-b border-[#E2E8F0] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-[#4338CA]" />
                      <h3 className="font-bold text-sm text-[#131B2E]">Brand / Communication Style</h3>
                    </div>
                    <span className="text-[10px] font-semibold text-[#4338CA] bg-[#EEF2FF] border border-[#C7D2FE] px-2 py-0.5 rounded-md self-start sm:self-auto">
                      Voice &amp; Tone
                    </span>
                  </div>

                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Select the communication style that best reflects your institution&apos;s character and public voice.
                  </p>

                  {/* Microcopy Helper */}
                  <div className="flex items-center space-x-2.5 p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-[#4338CA]">
                    <Sparkles className="w-4 h-4 shrink-0 text-[#4338CA]" />
                    <p className="leading-relaxed">
                      Not sure which style to choose? Preview each option to see how your school website could look and feel.
                    </p>
                  </div>

                  <div
                    role="radiogroup"
                    aria-label="Brand / Communication Style"
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                  >
                    {COMMUNICATION_STYLE_CONFIGS.map((style) => {
                      const isSelected = normalizeBrandTone(intakeData.brandingDesign.brandTone) === style.value;
                      const IconComponent = style.icon;

                      return (
                        <div
                          key={style.value}
                          role="radio"
                          aria-checked={isSelected}
                          tabIndex={0}
                          onClick={() => updateSectionField('brandingDesign', 'brandTone', style.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              updateSectionField('brandingDesign', 'brandTone', style.value);
                            }
                          }}
                          className={`relative p-4 sm:p-5 rounded-2xl border text-left cursor-pointer transition-all duration-150 focus:outline-hidden focus:ring-2 focus:ring-[#4338CA]/30 flex flex-col justify-between space-y-3.5 group h-full ${
                            isSelected
                              ? 'border-[#4338CA] bg-[#EEF2FF]/60 shadow-xs ring-2 ring-[#4338CA]/40'
                              : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1] hover:bg-[#FAF7F2] shadow-2xs'
                          }`}
                        >
                          {/* Card Header: Icon, Label, Radio Indicator */}
                          <div className="flex items-start justify-between gap-2 min-h-[40px]">
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition ${
                                  isSelected
                                    ? 'bg-[#4338CA] text-white shadow-xs'
                                    : 'bg-[#FAF7F2] border border-[#E2E8F0] text-[#64748B] group-hover:text-[#131B2E]'
                                }`}
                              >
                                <IconComponent className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs sm:text-sm font-bold text-[#131B2E] block truncate">
                                  {style.label}
                                </span>
                                <span className="text-[10px] text-[#4338CA] font-medium line-clamp-1">
                                  {style.fictionalSchool.name} • CBSE 330943
                                </span>
                              </div>
                            </div>

                            {/* Radio Circle Indicator */}
                            <div
                              className={`w-4 h-4 rounded-full border shrink-0 flex items-center justify-center transition mt-1 ${
                                isSelected
                                  ? 'border-[#4338CA] bg-[#4338CA]'
                                  : 'border-[#CBD5E1] bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                            </div>
                          </div>

                          {/* Description with standardized min-height */}
                          <p className="text-[11px] text-[#64748B] leading-relaxed min-h-[36px] line-clamp-2">
                            {style.description}
                          </p>

                          {/* Miniature Website Preview with uniform visual container */}
                          <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium px-0.5">
                              <span className="uppercase tracking-wider text-[9px] font-bold text-slate-400">
                                Website Preview
                              </span>
                              <span className="text-[9px] text-[#4338CA] font-medium group-hover:underline">
                                Roshani School Preview
                              </span>
                            </div>
                            <div className="rounded-lg overflow-hidden border border-slate-200/80 shadow-2xs h-[245px] w-full bg-slate-50 flex flex-col">
                              <MiniWebsitePreview style={style} />
                            </div>
                          </div>

                          {/* Footer: Badge + View Sample Button pinned to bottom */}
                          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
                            <span
                              className={`text-[9px] font-semibold px-2 py-0.5 rounded-md truncate ${
                                isSelected
                                  ? 'text-[#4338CA] bg-white border border-[#C7D2FE]'
                                  : 'text-[#64748B] bg-[#FAF7F2] border border-[#E2E8F0]'
                              }`}
                            >
                              {style.badge}
                            </span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewingStyle(style);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.stopPropagation();
                                }
                              }}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-[11px] font-semibold text-[#4338CA] transition shadow-2xs cursor-pointer shrink-0"
                            >
                              <span>View Website Sample</span>
                              <ExternalLink className="w-3 h-3 text-[#4338CA]" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sub-Card 4: How Ekaagra Uses This Information */}
                <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 shadow-2xs">
                  <div className="flex items-start space-x-3.5">
                    <div className="w-7 h-7 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center text-[#4338CA] shrink-0 shadow-2xs">
                      <Info className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-xs text-[#131B2E]">How this information is used</h4>
                      <p className="text-[11px] text-[#64748B] leading-relaxed">
                        Your school name, motto, tagline and communication style help Ekaagra prepare your website content and digital presentation. Website colors, typography and the visual system are managed separately to maintain consistency and accessibility.
                      </p>
                    </div>
                  </div>
                </div>
                  </>
                )}
              </div>
            )}

            {/* SECTION 27: FINAL WEBSITE REVIEW & SUBMISSION (UNIVERSAL VERIFICATION) */}
            {currentSection.key === 'websiteRequirements' && (
              <UniversalVerificationPage
                token={token}
                intakeData={intakeData}
                updateSectionField={updateSectionField}
                updateSectionDirect={updateSectionDirect}
                onNavigateToBranding={() => {
                  const brandSecIdx = INTAKE_SECTIONS.findIndex((s) => s.key === 'brandingDesign');
                  if (brandSecIdx !== -1) setCurrentStepIndex(brandSecIdx);
                }}
                onNavigateToSection={navigateToSectionKey}
                setPreviewingStyle={setPreviewingStyle}
              />
            )}

            {/* SECTION 6: SCHOOL STORY, MISSION & EDUCATIONAL PHILOSOPHY */}
            {currentSection.key === 'schoolContent' && (
              <SchoolContentSection
                intakeData={intakeData}
                updateSectionField={updateSectionField}
                updateSectionDirect={updateSectionDirect}
                onNavigateToSection={navigateToSectionKey}
              />
            )}

            {/* SECTION: ACADEMIC STRUCTURE & CURRICULUM */}
            {currentSection.key === 'institutionStructure' && campusSectionResolution?.mode !== 'not_applicable' && (
              <AcademicStructureSection
                intakeData={displayIntakeData}
                updateSectionField={updateSectionField}
                updateSectionDirect={updateSectionDirect}
                project={effectiveProject || project}
                onNavigateToSection={navigateToSectionKey}
              />
            )}

            {/* SECTION 7: ADMISSIONS, FEES & SCHEDULE */}
            {currentSection.key === 'admissions' && campusSectionResolution?.mode !== 'not_applicable' && (
              <AdmissionsSection
                project={effectiveProject || project}
                intakeData={displayIntakeData}
                updateSectionField={updateSectionField}
                updateSectionDirect={updateSectionDirect}
                onNavigateToSection={navigateToSectionKey}
                activeCampusId={activeCampusId}
              />
            )}

            {/* SECTION 11: FEES & FINANCE */}
            {currentSection.key === 'feesConfiguration' && campusSectionResolution?.mode !== 'not_applicable' && (
              <FeeStructureSection
                intakeData={displayIntakeData}
                updateSectionField={updateSectionField}
                updateSectionDirect={updateSectionDirect}
                project={effectiveProject || project}
                activeCampusId={activeCampusId}
                onNavigateToSection={navigateToSectionKey}
              />
            )}

            {/* SECTION 12: CURRICULUM */}
            {currentSection.key === 'curriculum' && campusSectionResolution?.mode !== 'not_applicable' && (
              <CurriculumSection
                intakeData={displayIntakeData}
                updateSectionField={updateSectionField}
                updateSectionDirect={updateSectionDirect}
                project={effectiveProject || project}
                activeCampusId={activeCampusId}
                onNavigateToSection={navigateToSectionKey}
              />
            )}


            {/* SECTION 14: TRANSPORT (Conditional) */}
            {currentSection.key === 'transportConfig' && campusSectionResolution?.mode !== 'not_applicable' && (
              <TransportFleetSection
                intakeData={displayIntakeData}
                updateSectionField={updateSectionField}
                updateSectionDirect={updateSectionDirect}
                project={effectiveProject || project}
                onNavigateToSection={navigateToSectionKey}
                token={token}
                isWebsiteOnly={selectedProductId === 'school-website' || selectedProductId === 'school-website-cms'}
              />
            )}

            {/* SECTION 15/17: HOSTEL & RESIDENTIAL BOARDING */}
            {currentSection.key === 'hostelConfig' && campusSectionResolution?.mode !== 'not_applicable' && (
              <HostelResidentialSection
                intakeData={displayIntakeData}
                updateSectionField={updateSectionField}
                updateSectionDirect={updateSectionDirect}
                onNavigateToSection={navigateToSectionKey}
                stepNumber={currentStepIndex + 1}
                totalSteps={applicableSections.length}
                token={token}
              />
            )}

            {/* SECTION 16: INSTITUTIONAL COMMUNICATION PREFERENCES */}
            {currentSection.key === 'communicationConfig' && campusSectionResolution?.mode !== 'not_applicable' && (
              <CommunicationPreferencesSection
                intakeData={displayIntakeData}
                updateSectionField={updateSectionField}
                updateSectionDirect={updateSectionDirect}
                project={effectiveProject || project}
                onNavigateToSection={navigateToSectionKey}
              />
            )}

            {/* SECTION 28: REVIEW & ADMIN PROVISIONING */}
            {currentSection.key === 'usersAccess' && (
              <div className="space-y-6 text-xs">
                {/* Super Admin Credentials Setup */}
                <div className="bg-[#FAF7F2] border border-[#E2E8F0] p-5 rounded-2xl space-y-4">
                  <div className="border-b border-[#E2E8F0] pb-2">
                    <span className="text-[10px] font-bold text-[#4338CA] uppercase tracking-wider block">Administrative Authority</span>
                    <h3 className="font-bold text-[#131B2E] text-sm">Primary Super Administrator Account</h3>
                    <p className="text-[#94A3B8] text-[11px] mt-0.5">
                      This authorized individual will receive the initial administrative owner invitation and master credentials.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-[#334155] mb-1">Administrator Full Name *</label>
                      <input
                        type="text"
                        value={intakeData.usersAccess.superAdminFullName}
                        onChange={(e) => updateSectionField('usersAccess', 'superAdminFullName', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                        placeholder="Authorized head / principal"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#334155] mb-1">Official Administrator Email *</label>
                      <input
                        type="email"
                        value={intakeData.usersAccess.superAdminEmail}
                        onChange={(e) => updateSectionField('usersAccess', 'superAdminEmail', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                        placeholder="admin@school.edu.in"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#334155] mb-1">Official Mobile Phone *</label>
                      <input
                        type="tel"
                        value={intakeData.usersAccess.superAdminPhone}
                        onChange={(e) => updateSectionField('usersAccess', 'superAdminPhone', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                        placeholder="10-digit mobile"
                      />
                    </div>
                  </div>
                </div>

                {/* Comprehensive Section Completeness Review Matrix */}
                <div className="bg-[#FAF7F2] border border-[#E2E8F0] p-5 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                    <div>
                      <h3 className="font-bold text-[#131B2E] text-sm">Master Onboarding Review Gate</h3>
                      <p className="text-[#94A3B8] text-[11px]">Verify that all required institutional sections are complete prior to submission.</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                      {completeness.percentage}% Total Verified
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {applicableSections.map((sec, sIdx) => {
                      const pct = completeness.sectionPercentages[sec.key] ?? 0;
                      const isComplete = pct === 100;

                      return (
                        <div
                          key={sec.key}
                          onClick={() => jumpToSection(sec.key)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                            isComplete
                              ? 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1] shadow-2xs'
                              : 'bg-rose-50/70 border-rose-200 hover:border-rose-300'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <span className="block font-medium text-[#131B2E] truncate">{sec.shortTitle}</span>
                            <span className="text-[10px] text-[#64748B] font-mono">Step {sIdx + 1}</span>
                          </div>
                          {isComplete ? (
                            <span className="text-emerald-700 flex items-center space-x-1 shrink-0 font-bold text-[11px]">
                              <Check className="w-3.5 h-3.5" />
                              <span>Complete</span>
                            </span>
                          ) : (
                            <span className="text-rose-700 flex items-center space-x-1 shrink-0 font-bold text-[11px]">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>{pct}%</span>
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {completeness.missingFields.length > 0 && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                      <span className="font-bold text-rose-800 block text-xs">
                        Missing Required Fields ({completeness.missingFields.length} remaining):
                      </span>
                      <ul className="list-disc list-inside space-y-1 text-rose-700 text-[11px]">
                        {completeness.missingFields.slice(0, 10).map((mf, i) => {
                          const displayText = typeof mf === 'string' ? mf : (mf as any).label;
                          return (
                            <li key={i}>
                              <span className="text-rose-700 ml-1">
                                {displayText}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Project Delivery & Launch Priorities Master Summary */}
                {intakeData.projectDelivery && (
                  <div className="bg-[#FAF7F2] border border-[#E2E8F0] p-5 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-[#4338CA]" />
                        <div>
                          <h3 className="font-bold text-[#131B2E] text-sm">Project Delivery &amp; Launch Priorities Plan</h3>
                          <p className="text-[#64748B] text-[11px]">
                            Target schedule, delivery queue priority, decision maker, and phase roadmap for technical provisioning.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => jumpToSection('projectDelivery')}
                        className="text-[11px] font-semibold text-[#4338CA] hover:text-[#3730A3] underline cursor-pointer"
                      >
                        Edit Plan
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="bg-white p-3 rounded-xl border border-[#E2E8F0]">
                        <span className="text-[10px] text-[#64748B] font-bold block uppercase tracking-wider">Target Launch</span>
                        <span className="font-bold text-[#131B2E] mt-0.5 block truncate">
                          {intakeData.projectDelivery.targetLaunchTimeline === 'specific-date' && intakeData.projectDelivery.targetLaunchDate
                            ? intakeData.projectDelivery.targetLaunchDate
                            : intakeData.projectDelivery.targetLaunchTimeline || intakeData.projectDelivery.targetLaunchDate || 'Within 3–4 weeks'}
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-[#E2E8F0]">
                        <span className="text-[10px] text-[#64748B] font-bold block uppercase tracking-wider">Delivery Priority</span>
                        <span
                          className={`font-bold mt-0.5 block truncate ${
                            intakeData.projectDelivery.deliveryPriority === 'urgent'
                              ? 'text-amber-800'
                              : intakeData.projectDelivery.deliveryPriority === 'priority'
                              ? 'text-[#4338CA]'
                              : 'text-[#131B2E]'
                          }`}
                        >
                          {intakeData.projectDelivery.deliveryPriority === 'urgent'
                            ? 'Urgent / Expedited'
                            : intakeData.projectDelivery.deliveryPriority === 'priority'
                            ? 'Priority Delivery'
                            : 'Standard Delivery'}
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-[#E2E8F0]">
                        <span className="text-[10px] text-[#64748B] font-bold block uppercase tracking-wider">Expedited Surcharge</span>
                        <span className="font-bold text-[#131B2E] mt-0.5 block">
                          {intakeData.projectDelivery.deliveryPriority === 'urgent'
                            ? `+₹${(intakeData.projectDelivery.expeditedFeeINR || 4999).toLocaleString('en-IN')} (${
                                intakeData.projectDelivery.urgentConfirmed ? 'Confirmed' : 'Pending Opt-in'
                              })`
                            : 'Included (₹0)'}
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-[#E2E8F0]">
                        <span className="text-[10px] text-[#64748B] font-bold block uppercase tracking-wider">Designated Decision Maker</span>
                        <span className="font-bold text-[#131B2E] mt-0.5 block truncate">
                          {intakeData.projectDelivery.decisionMakerName || intakeData.projectDelivery.decisionMakers || 'Not specified'}
                        </span>
                        {intakeData.projectDelivery.decisionMakerRole && (
                          <span className="text-[10px] text-[#64748B] block truncate">
                            {intakeData.projectDelivery.decisionMakerRole}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-[#E2E8F0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px]">
                      <div>
                        <span className="font-semibold text-[#131B2E]">Phase Roadmap: </span>
                        <span className="text-[#64748B]">
                          {(intakeData.projectDelivery.phase1Priorities || []).length} Launch Essentials in Phase 1 &bull;{' '}
                          {(intakeData.projectDelivery.phase2Priorities || []).length} Enhancements in Phase 2
                        </span>
                      </div>
                      {intakeData.projectDelivery.importantDeadlineDate && (
                        <div className="font-mono text-[#4338CA]">
                          Deadline: {intakeData.projectDelivery.importantDeadlineType || 'Event'} ({intakeData.projectDelivery.importantDeadlineDate})
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Institutional Campus & Location Master Summary */}
                <div className="bg-[#FAF7F2] border border-[#E2E8F0] p-5 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                    <div>
                      <h3 className="font-bold text-[#131B2E] text-sm">Campus & Location Master Verification</h3>
                      <p className="text-[#94A3B8] text-[11px]">
                        Review effective canonical addresses to be registered across platform directories and tenant database.
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-[#4338CA] bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                      {(intakeData.campuses || []).length} {intakeData.campuses?.length === 1 ? 'Campus' : 'Campuses'} Registered
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(intakeData.campuses || []).map((cmp, cIdx) => {
                      const eff = getEffectiveAddress(cmp);
                      return (
                        <div key={cmp.id || cIdx} className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 space-y-2 text-xs">
                          <div className="flex items-center justify-between font-bold text-[#131B2E]">
                            <span className="flex items-center space-x-1.5">
                              <Building2 className="w-3.5 h-3.5 text-[#4338CA]" />
                              <span>{cmp.name || `Campus ${cIdx + 1}`}</span>
                            </span>
                            {cmp.isMainCampus ? (
                              <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                                Main Campus
                              </span>
                            ) : (
                              <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                                Campus {cIdx + 1} • Additional Campus
                              </span>
                            )}
                          </div>
                          <div className="text-[#64748B] text-[11px] space-y-1">
                            <p className="font-medium text-[#131B2E]">{eff.address || 'Address pending'}</p>
                            {eff.landmark && <p>Landmark: {eff.landmark}</p>}
                            <div className="grid grid-cols-2 gap-1 pt-1 border-t border-[#F1F5F9] font-mono text-[10px]">
                              <div>
                                <span className="text-[#94A3B8] block">City / Town:</span>
                                <span className="text-[#131B2E] font-medium">{eff.city || '—'}</span>
                              </div>
                              <div>
                                <span className="text-[#94A3B8] block">District:</span>
                                <span className="text-[#131B2E] font-medium">
                                  {eff.district || '—'}
                                  {(cmp.district === OTHER_OPTION || cmp.district === '__custom__') && cmp.otherDistrict ? (
                                    <span className="ml-1 text-[9px] text-[#4338CA] bg-indigo-50 px-1 py-0.2 rounded font-sans font-normal">(custom)</span>
                                  ) : null}
                                </span>
                              </div>
                              <div>
                                <span className="text-[#94A3B8] block">State / Province:</span>
                                <span className="text-[#131B2E] font-medium">
                                  {eff.state || '—'}
                                  {cmp.state === OTHER_OPTION && (cmp.otherStateProvince || cmp.otherState) ? (
                                    <span className="ml-1 text-[9px] text-[#4338CA] bg-indigo-50 px-1 py-0.2 rounded font-sans font-normal">(custom)</span>
                                  ) : null}
                                </span>
                              </div>
                              <div>
                                <span className="text-[#94A3B8] block">Country:</span>
                                <span className="text-[#131B2E] font-medium">
                                  {eff.country || 'India'}
                                  {(cmp.country === OTHER_OPTION || cmp.country === 'Other Country') && (cmp.otherCountry || cmp.countryName) ? (
                                    <span className="ml-1 text-[9px] text-[#4338CA] bg-indigo-50 px-1 py-0.2 rounded font-sans font-normal">(custom)</span>
                                  ) : null}
                                </span>
                              </div>
                            </div>
                            {eff.pin && (
                              <p className="pt-0.5 text-[10px] font-mono text-[#64748B]">
                                PIN: <span className="text-[#131B2E] font-semibold">{eff.pin}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Legal Confirmation Checkboxes */}
                <div className="bg-[#FAF7F2] border border-[#E2E8F0] p-5 rounded-2xl space-y-3">
                  <h4 className="font-bold text-[#131B2E] text-xs">Institutional Authorization & Confirmation</h4>

                  <label className="flex items-start space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={intakeData.clientConfirmation?.isAccurate ?? false}
                      onChange={(e) => {
                        const val = e.target.checked;
                        const prev = intakeData.clientConfirmation || ({} as any);
                        updateSectionField('clientConfirmation', 'isAccurate', val);
                        updateSectionField('clientConfirmation', 'isConfirmed', val && prev.isAuthorized);
                      }}
                      className="mt-0.5 rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20"
                    />
                    <span className="text-[#334155] text-[11px] leading-relaxed font-medium">
                      I declare that the information provided is accurate and representative of the school&apos;s requirements.
                    </span>
                  </label>

                  <label className="flex items-start space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={intakeData.clientConfirmation?.isAuthorized ?? false}
                      onChange={(e) => {
                        const val = e.target.checked;
                        const prev = intakeData.clientConfirmation || ({} as any);
                        updateSectionField('clientConfirmation', 'isAuthorized', val);
                        updateSectionField('clientConfirmation', 'isConfirmed', val && prev.isAccurate);
                      }}
                      className="mt-0.5 rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20"
                    />
                    <span className="text-[#334155] text-[11px] leading-relaxed font-medium">
                      I confirm that I am authorized by the institution management to submit this technical provisioning specification.
                    </span>
                  </label>

                  <label className="flex items-start space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={intakeData.clientConfirmation?.understandsReview ?? false}
                      onChange={(e) => updateSectionField('clientConfirmation', 'understandsReview', e.target.checked)}
                      className="mt-0.5 rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20"
                    />
                    <span className="text-[#334155] text-[11px] leading-relaxed font-medium">
                      I understand that configuration details may be audited by Ekaagra Technologies prior to production database deployment.
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* SECTION: ASSET & CONTENT CHECKLIST */}
            {currentSection.key === 'assetChecklist' && (
              <SchoolAssetChecklistSection
                intakeData={intakeData}
                updateSectionField={updateSectionField}
                token={token}
                changeRequests={changeRequests}
                onRespondToCR={(cr) => {
                  setRespondingCR(cr);
                  setCrResponseText(cr.school_response || '');
                  setCrUpdatedValue(cr.school_updated_value || cr.current_value || '');
                  setCrSubmitError(null);
                }}
              />
            )}

            {/* Default Catch-all Section Form View for remaining sections */}
            {![
              'schoolProfile', 'campuses', 'leadership', 'brandingDesign',
              'websiteRequirements', 'schoolContent', 'institutionStructure', 'feesConfiguration',
              'transportConfig', 'hostelConfig', 'usersAccess', 'admissions', 'assetChecklist',
              'communicationConfig'
            ].includes(currentSection.key) && (
              <div className="space-y-4 text-xs">
                {currentSection.key !== 'domainPresence' &&
                  currentSection.key !== 'websiteScope' &&
                  currentSection.key !== 'additionalRequirements' &&
                  currentSection.key !== 'securityPrivacy' &&
                  currentSection.key !== 'portalRequirements' &&
                  currentSection.key !== 'mediaAssets' && (
                  <div className="bg-[#FAF7F2] border border-[#E2E8F0] p-4 rounded-2xl text-[#64748B] space-y-2">
                    <span className="font-bold text-[#131B2E] block">{currentSection.title}</span>
                    <p>{currentSection.description}</p>
                    {currentSection.key === 'mobileAppConfig' && (
                      <p className="text-[11px] text-[#64748B] pt-1.5 border-t border-[#E2E8F0]">
                        Define which mobile applications, target platforms, access controls, and operational features the school requires for deployment.
                      </p>
                    )}
                  </div>
                )}

                {/* Section Specific Input Renderers */}

                {currentSection.key === 'staffFaculty' && campusSectionResolution?.mode !== 'not_applicable' && (
                  <StaffFacultySection
                    intakeData={displayIntakeData}
                    updateSectionField={updateSectionField}
                    updateSectionDirect={updateSectionDirect}
                    token={token}
                    project={effectiveProject || project}
                    onNavigateToSection={navigateToSectionKey}
                  />
                )}

                {currentSection.key === 'studentConfig' && campusSectionResolution?.mode !== 'not_applicable' && (
                  <StudentInformationSection
                    intakeData={displayIntakeData}
                    updateSectionField={updateSectionField}
                    updateSectionDirect={updateSectionDirect}
                    token={token}
                    project={effectiveProject || project}
                    onNavigateToSection={navigateToSectionKey}
                  />
                )}


                {currentSection.key === 'attendanceConfig' && campusSectionResolution?.mode !== 'not_applicable' && (
                  <AttendanceTimetableSection
                    project={effectiveProject || project}
                    intakeData={displayIntakeData}
                    updateSectionField={updateSectionField}
                    updateSectionDirect={updateSectionDirect}
                  />
                )}

                {currentSection.key === 'examinationConfig' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-[#334155] mb-1">Grading System *</label>
                      <select
                        value={intakeData.examinationConfig?.gradingSystem || 'cbse_9point'}
                        onChange={(e) => updateSectionField('examinationConfig', 'gradingSystem', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                      >
                        <option value="cbse_9point">CBSE 9-Point Scale (A1 to E)</option>
                        <option value="percentage">Percentage & Total Marks</option>
                        <option value="letter_grade">Letter Grade (A, B, C, D)</option>
                        <option value="gpa">GPA Scale (10.0)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-[#334155] mb-1">Report Card Layout</label>
                      <select
                        value={intakeData.examinationConfig?.reportCardLayout || 'cbse_standard'}
                        onChange={(e) => updateSectionField('examinationConfig', 'reportCardLayout', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
                      >
                        <option value="cbse_standard">CBSE Standard Layout (Co-scholastic + Scholastic)</option>
                        <option value="state_board">State Board Standard</option>
                        <option value="narrative_primary">Narrative Descriptive (Primary)</option>
                      </select>
                    </div>
                  </div>
                )}

                {currentSection.key === 'facilitiesConfig' && campusSectionResolution?.mode !== 'not_applicable' && (
                  (selectedProductId === 'school-website' || selectedProductId === 'school-website-cms') ? (
                    <CampusFacilitiesSection
                      intakeData={displayIntakeData}
                      updateSectionField={updateSectionField}
                      updateSectionDirect={updateSectionDirect}
                      token={token}
                      onNavigateToSection={navigateToSectionKey}
                      isReadOnly={campusSectionResolution?.isReadOnly}
                    />
                  ) : (
                    <div className="space-y-6 text-xs">
                      {/* Sub-Card 1: Dynamic Campus Statistics (Institutional Records Engine) */}
                    <CampusStatisticsSection
                      intakeData={displayIntakeData}
                      updateSectionField={updateSectionField}
                      updateSectionDirect={updateSectionDirect}
                      onNavigateToSection={navigateToSectionKey}
                      isMoreStatsExpanded={isMoreStatsExpanded}
                      setIsMoreStatsExpanded={setIsMoreStatsExpanded}
                      isReadOnly={campusSectionResolution?.isReadOnly}
                      sourceMode={campusSectionResolution?.mode}
                      sourceCampusName={(campusSectionResolution as any)?.sourceCampusName}
                    />

                    {/* Sub-Card 2: Campus Amenities & Facility Highlights */}
                    <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl p-5 space-y-4 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                        <div className="flex items-center space-x-2">
                          <Sparkles className="w-4 h-4 text-[#4338CA]" />
                          <h3 className="font-bold text-sm text-[#131B2E]">Campus Amenities & Facility Highlights</h3>
                        </div>
                        <span className="text-[10px] text-[#64748B] bg-white border border-[#E2E8F0] px-2 py-0.5 rounded-md font-medium">
                          Optional Highlights
                        </span>
                      </div>
                      <p className="text-[#64748B] text-xs">
                        Select the infrastructure amenities available on campus. These are showcased on your public website and campus overview.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                        {[
                          { key: 'smartClassrooms', title: 'Smart Classrooms', desc: 'Digital boards & interactive multimedia' },
                          { key: 'computerLab', title: 'Computer Laboratory', desc: 'Modern PC lab with high-speed internet' },
                          { key: 'scienceLab', title: 'Composite Science Lab', desc: 'Equipped Physics, Chemistry & Biology lab' },
                          { key: 'library', title: 'School Library', desc: 'Curated books, journals & reading zone' },
                          { key: 'playground', title: 'Playground & Sports', desc: 'Outdoor sports fields, track & athletic courts' },
                          { key: 'auditorium', title: 'Auditorium / Hall', desc: 'Multipurpose assembly hall & stage' },
                          { key: 'cctvInstalled', title: 'CCTV Surveillance', desc: '24/7 security camera coverage across campus' },
                          { key: 'medicalRoom', title: 'Medical / Infirmary', desc: 'Dedicated first-aid station & health bay' },
                          { key: 'cafeteria', title: 'Cafeteria / Canteen', desc: 'Hygienic campus food & dining space' },
                          { key: 'securityStaff', title: 'Security Staff', desc: 'Trained security guards & gate checkpoint' },
                          { key: 'visitorManagement', title: 'Visitor Management', desc: 'Visitor register & digital gatepass log' },
                          { key: 'biometricAttendanceHardware', title: 'Biometric Hardware', desc: 'Biometric scanner for staff attendance' },
                        ].map((item) => {
                          const isEnabled = Boolean(displayIntakeData.facilitiesConfig?.[item.key as keyof typeof displayIntakeData.facilitiesConfig]);
                          return (
                            <label
                              key={item.key}
                              className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition select-none ${
                                isEnabled
                                  ? 'bg-[#EEF2FF] border-[#C7D2FE] shadow-2xs ring-1 ring-[#4338CA]/20'
                                  : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-slate-50/60'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isEnabled}
                                onChange={(e) => updateSectionField('facilitiesConfig', item.key, e.target.checked)}
                                className="mt-0.5 rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20 shrink-0"
                              />
                              <div className="truncate">
                                <span className={`block font-semibold text-xs leading-snug truncate ${isEnabled ? 'text-[#4338CA]' : 'text-[#131B2E]'}`}>
                                  {item.title}
                                </span>
                                <span className="block text-[10px] text-[#64748B] leading-tight mt-0.5 line-clamp-1">
                                  {item.desc}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Sub-Card 3: Campus Amenities & Facilities Photography Showcase */}
                    <SectionPhotoGallery
                      sectionKey="facilitiesConfig"
                      category="campus_buildings"
                      title="Campus Amenities & Facilities Photography"
                      subtitle="Upload photos of labs, sports fields, cafeteria, auditorium, smart classrooms & infrastructure"
                      cardIndex={3}
                      badgeLabel="Website Highlights"
                      badgeColorClass="bg-[#EEF2FF] text-[#4338CA] border-[#C7D2FE]"
                      tags={FACILITIES_PHOTO_TAGS}
                      defaultTag="Smart Classroom"
                      defaultCaption="Modern educational infrastructure and campus learning facilities"
                      token={token}
                      intakeData={displayIntakeData}
                      sectionImages={displayIntakeData.facilitiesConfig?.images || displayIntakeData.facilitiesConfig?.facilityPhotos || []}
                      updateSectionField={updateSectionField}
                      updateSectionDirect={updateSectionDirect}
                      campusImageFilter={(img) =>
                        ['campus_buildings', 'laboratories', 'sports_playground', 'cafeteria', 'classrooms', 'other'].includes(
                          img.category || img.imageCategory || ''
                        )
                      }
                    />

                    {/* Sub-Card 4: About this information */}
                    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 flex items-start space-x-3 text-xs text-[#64748B] shadow-2xs">
                      <Info className="w-4 h-4 text-[#4338CA] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-[#131B2E] block mb-0.5">Why we collect this information</span>
                        <p className="leading-relaxed text-[11px]">
                          Campus facilities and optional institutional statistics help Ekaagra prepare accurate school website highlights, institutional profiles, infrastructure summaries, and future capacity planning. Optional figures can be added or updated later from the administrative dashboard.
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {currentSection.key === 'libraryConfig' && campusSectionResolution?.mode !== 'not_applicable' && (
                  <LibraryManagementSection
                    intakeData={displayIntakeData}
                    updateSectionField={updateSectionField}
                    updateSectionDirect={updateSectionDirect}
                    project={effectiveProject || project}
                    onNavigateToSection={navigateToSectionKey}
                    token={token}
                  />
                )}

                {currentSection.key === 'projectDelivery' && (
                  <Step12ProjectDeliverySection
                    project={effectiveProject || project}
                    intakeData={intakeData}
                    updateSectionField={updateSectionField}
                    updateSectionDirect={updateSectionDirect}
                  />
                )}

                {currentSection.key === 'integrationsConfig' && (
                  <ThirdPartyIntegrationsSection
                    intakeData={intakeData}
                    updateSectionField={updateSectionField}
                    updateSectionDirect={updateSectionDirect}
                    project={effectiveProject || project}
                    onNavigateToSection={navigateToSectionKey}
                  />
                )}

                {currentSection.key === 'mobileAppConfig' && (
                  <MobileApplicationRequirementsSection
                    intakeData={intakeData}
                    updateSectionField={updateSectionField}
                    updateSectionDirect={updateSectionDirect}
                    project={effectiveProject || project}
                    onNavigateToSection={navigateToSectionKey}
                    showValidationErrors={mobileSectionSubmitted}
                  />
                )}

                {currentSection.key === 'securityPrivacy' && (
                  <SecurityPrivacySection
                    project={effectiveProject || project}
                    intakeData={intakeData}
                    updateSectionField={updateSectionField}
                    updateSectionDirect={updateSectionDirect}
                    onNavigateToSection={navigateToSectionKey}
                    externalErrors={securitySectionErrors}
                  />
                )}

                {currentSection.key === 'websiteScope' && (
                  <WebsiteScopeSection
                    intakeData={intakeData}
                    updateSectionField={updateSectionField}
                    updateSectionDirect={updateSectionDirect}
                    project={effectiveProject || project}
                    onNavigateToSection={navigateToSectionKey}
                  />
                )}

                {currentSection.key === 'domainPresence' && (
                  <div className="space-y-6">
                    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-7 shadow-2xs space-y-6">
                      <div className="flex items-center space-x-3 pb-4 border-b border-[#E2E8F0]">
                        <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center shrink-0">
                          <Globe className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-[#131B2E]">Website &amp; Domain Setup</h3>
                          <p className="text-xs text-[#64748B] mt-0.5">
                            Select a preferred domain for your school website. Domain registration, transfer, DNS configuration, and final verification can be completed with Ekaagra after onboarding.
                          </p>
                        </div>
                      </div>

                      <SchoolDomainSelector
                        productId={project?.product_id || 'school-complete'}
                        annualAllowance={schoolDomainAllowances[project?.product_id as SchoolProductId] ?? 750}
                        initialSchoolName={intakeData.schoolProfile?.schoolName || project?.school_name || ''}
                        domainData={intakeData.domainPresence}
                        onChange={(updated) => {
                          setDomainStepError(null);
                          updateSectionDirect('domainPresence', updated);
                        }}
                      />
                    </div>
                  </div>
                )}

                {currentSection.key === 'additionalRequirements' && (
                  <CustomRequirementsSection
                    intakeData={intakeData}
                    updateSectionField={updateSectionField}
                    updateSectionDirect={updateSectionDirect}
                    project={effectiveProject || project}
                    onNavigateToSection={navigateToSectionKey}
                  />
                )}

                {currentSection.key === 'portalRequirements' && (
                  <PortalRequirementsSection
                    intakeData={intakeData}
                    updateSectionField={updateSectionField}
                    updateSectionDirect={updateSectionDirect}
                    project={effectiveProject || project}
                    onNavigateToSection={navigateToSectionKey}
                    onNextStep={() => {
                      const idx = applicableSections.findIndex((s) => s.key === 'portalRequirements');
                      if (idx !== -1 && idx < applicableSections.length - 1) {
                        setCurrentStepIndex(idx + 1);
                        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    onPrevStep={() => {
                      const idx = applicableSections.findIndex((s) => s.key === 'portalRequirements');
                      if (idx > 0) {
                        setCurrentStepIndex(idx - 1);
                        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    stepNumber={currentStepIndex + 1}
                    totalSteps={applicableSections.length}
                  />
                )}

                {currentSection.key === 'mediaAssets' && (
                  <MediaAssetsSection
                    intakeData={intakeData}
                    updateSectionField={updateSectionField}
                    updateSectionDirect={updateSectionDirect}
                    project={effectiveProject || project}
                    onNavigateToSection={navigateToSectionKey}
                    onNextStep={() => {
                      const idx = applicableSections.findIndex((s) => s.key === 'mediaAssets');
                      if (idx !== -1 && idx < applicableSections.length - 1) {
                        setCurrentStepIndex(idx + 1);
                        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    onPrevStep={() => {
                      const idx = applicableSections.findIndex((s) => s.key === 'mediaAssets');
                      if (idx > 0) {
                        setCurrentStepIndex(idx - 1);
                        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    stepNumber={currentStepIndex + 1}
                    totalSteps={applicableSections.length}
                  />
                )}
              </div>
            )}

            {/* Bottom Step Navigation Bar */}
            <div className="border-t border-[#E2E8F0] pt-6 sm:pt-7 space-y-3.5">
              {currentSection.key === 'domainPresence' && domainStepError && (
                <div
                  role="alert"
                  className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-shake"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{domainStepError}</span>
                </div>
              )}
              {currentSection.key === 'integrationsConfig' && integrationsStepError && (
                <div
                  role="alert"
                  className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-shake"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{integrationsStepError}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                <div className="order-2 sm:order-1 flex-1 flex justify-start">
                  <button
                    type="button"
                    disabled={currentStepIndex === 0}
                    onClick={handlePrevious}
                    className={`w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-semibold border transition ${
                      currentStepIndex === 0
                        ? 'border-[#E2E8F0] bg-[#FAF7F2] text-[#94A3B8] cursor-not-allowed'
                        : 'border-[#CBD5E1] bg-white hover:bg-[#FAF7F2] text-[#334155] shadow-2xs hover:border-[#94A3B8] active:scale-[0.98] cursor-pointer'
                    }`}
                    aria-label="Previous Section"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous <span className="hidden sm:inline">Section</span></span>
                  </button>
                </div>

                <div className="order-1 sm:order-2 text-xs text-[#64748B] font-mono text-center font-semibold shrink-0 px-2">
                  Section {currentStepIndex + 1} of {applicableSections.length}
                </div>

                <div className="order-3 sm:order-3 flex-1 flex justify-end">
                  {currentStepIndex < applicableSections.length - 1 ? (
                    <button
                      type="button"
                      onClick={handleContinue}
                      className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 sm:px-5 py-2.5 bg-[#4338CA] hover:bg-[#3730A3] text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-[0.98] cursor-pointer"
                      aria-label="Continue to next section"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting || !completeness.isSubmissionReady}
                      className={`w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs transition ${
                        completeness.isSubmissionReady
                          ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                          : 'bg-[#FAF7F2] text-[#94A3B8] cursor-not-allowed border border-[#E2E8F0]'
                      }`}
                      aria-label="Submit master onboarding data"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isSubmitting ? 'Submitting...' : 'Submit Master Data'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Brand & Communication Style Full Website Preview Modal */}
      {previewingStyle && (
        <CommunicationStylePreviewModal
          style={previewingStyle}
          isOpen={Boolean(previewingStyle)}
          isSelected={normalizeBrandTone(intakeData?.brandingDesign?.brandTone) === previewingStyle.value}
          onClose={() => setPreviewingStyle(null)}
          onSwitchStyle={(next) => setPreviewingStyle(next)}
          onSelect={() => {
            updateSectionField('brandingDesign', 'brandTone', previewingStyle.value);
          }}
        />
      )}

      {/* Change Request Response Modal */}
      {respondingCR && (
        <ModalPortal isOpen={!!respondingCR}>
          <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
              <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Provide Correction / Update</h3>
                    <p className="text-xs text-slate-500">
                      {respondingCR.section_key} • {respondingCR.field_key || respondingCR.asset_id || 'Field'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRespondingCR(null);
                    setCrSubmitError(null);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitCRResponse} className="p-5 sm:p-6 space-y-4">
                {/* Context Note */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1">
                  <div className="font-bold">Reviewer Request:</div>
                  <div className="text-amber-800">{respondingCR.request_comment || respondingCR.reason}</div>
                  {respondingCR.suggested_value && (
                    <div className="pt-1 text-slate-700 font-mono text-[11px]">
                      Suggestion: <span className="font-bold">{respondingCR.suggested_value}</span>
                    </div>
                  )}
                </div>

                {crSubmitError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                    {crSubmitError}
                  </div>
                )}

                {/* Updated value input */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Corrected Value or URL
                  </label>
                  <input
                    type="text"
                    value={crUpdatedValue}
                    onChange={(e) => setCrUpdatedValue(e.target.value)}
                    placeholder="e.g. correct title, updated phone, or high-res image link"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Explanation / Notes input */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Clarification / Note to Reviewer <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={crResponseText}
                    onChange={(e) => setCrResponseText(e.target.value)}
                    placeholder="Explain the correction or reason for this submission..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRespondingCR(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                    disabled={isSubmittingCR}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingCR || !crResponseText.trim()}
                    className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-xl shadow-xs flex items-center space-x-2 transition-all"
                  >
                    {isSubmittingCR && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Submit Correction for Re-Review</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
