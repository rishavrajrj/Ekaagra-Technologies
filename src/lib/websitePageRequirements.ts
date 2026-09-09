import type {
  UniversalIntakeData,
  WebsitePageRequirement,
  WebsitePageConfiguration,
  WebsiteMandatoryDisclosureConfig,
  WebsitePrivacyPolicyConfig,
  WebsiteDeveloperSpecification,
  CampusImageData,
  CampusImageCategory,
  WebsiteFieldState,
  CanonicalCandidate,
} from './types';
import { deriveSchoolAcademicSummary } from './academicStructureUtils';

export interface CanonicalFieldResolution {
  value: string;
  source?: string;
  sourceSection?: string;
  sourceField?: string;
  sourceLabel?: string;
  foundInOnboarding: boolean;
  hasConflict?: boolean;
  conflictingCandidates?: CanonicalCandidate[];
}

/**
 * Searches the canonical onboarding data across Leadership, School Profile, Campuses,
 * Management Members, and Staff/Faculty to find Principal / Head of Institution details.
 * Detects conflicts when multiple sources have conflicting values and surfaces them
 * for explicit administrative review instead of silently picking one.
 */
export function resolveCanonicalPrincipal(intakeData: Partial<UniversalIntakeData>): CanonicalFieldResolution {
  const lead = intakeData.leadership || ({} as any);
  const prof = intakeData.schoolProfile || ({} as any);
  const campuses = intakeData.campuses || [];
  const primaryCampus = campuses.find((c) => c.isMainCampus) || campuses[0] || ({} as any);
  const staff = intakeData.staffFaculty || ({} as any);

  const candidates: CanonicalCandidate[] = [];

  const addCandidate = (val: unknown, source: string, sourceSection: string, sourceField: string) => {
    if (val && typeof val === 'string' && val.trim().length > 0) {
      const trimmed = val.trim();
      candidates.push({ value: trimmed, source, sourceSection, sourceField });
    }
  };

  addCandidate(lead.principalName, 'Section 3 — Leadership (Principal Name)', 'leadership', 'principalName');
  addCandidate(lead.principalOrHead, 'Section 3 — Leadership (Principal / Head)', 'leadership', 'principalOrHead');
  addCandidate(prof.principalName, 'Section 1 — Identity (Principal Name)', 'schoolProfile', 'principalName');
  addCandidate(primaryCampus.principalOrHead, 'Section 2 — Campus (Campus Head)', 'campuses', 'principalOrHead');

  if (Array.isArray(lead.managementMembers)) {
    const member = lead.managementMembers.find((m: any) =>
      /principal|head of institution|headmaster|headmistress/i.test(m.designation || m.role || '')
    );
    if (member && member.name && String(member.name).trim().length > 0) {
      addCandidate(
        String(member.name).trim(),
        `Section 3 — Management Roster (${member.designation || 'Principal'})`,
        'leadership',
        'managementMembers'
      );
    }
  }

  if (Array.isArray(staff.staffMembers)) {
    const member = staff.staffMembers.find((s: any) =>
      /principal|head of institution|headmaster|headmistress/i.test(s.designation || s.role || '')
    );
    if (member && member.name && String(member.name).trim().length > 0) {
      addCandidate(
        String(member.name).trim(),
        `Section 4 — Staff & Faculty (${member.designation || 'Principal'})`,
        'staffFaculty',
        'staffMembers'
      );
    }
  }

  if (candidates.length === 0) {
    return {
      value: '',
      sourceSection: 'leadership',
      sourceField: 'principalName',
      foundInOnboarding: false,
      hasConflict: false,
      conflictingCandidates: [],
    };
  }

  // Deduplicate candidates with unique case-insensitive values
  const uniqueValuesMap = new Map<string, CanonicalCandidate>();
  for (const c of candidates) {
    const normalized = c.value.toLowerCase().trim();
    if (!uniqueValuesMap.has(normalized)) {
      uniqueValuesMap.set(normalized, c);
    }
  }

  const distinctCandidates = Array.from(uniqueValuesMap.values());
  const hasConflict = distinctCandidates.length > 1;

  // Primary candidate is the first (highest priority) candidate
  const primary = candidates[0];

  return {
    value: primary.value,
    source: primary.source,
    sourceSection: primary.sourceSection,
    sourceField: primary.sourceField,
    sourceLabel: primary.source,
    foundInOnboarding: true,
    hasConflict,
    conflictingCandidates: hasConflict ? distinctCandidates : [],
  };
}

export interface CreateRequirementOptions {
  key: string;
  label: string;
  type: WebsitePageRequirement['type'];
  required: boolean;
  value?: unknown;
  source?: string;
  sourceSection?: string;
  sourceField?: string;
  status?: WebsiteFieldState;
  userConfirmed?: boolean;
  whyNeeded?: string;
  missingWarning?: string;
  options?: string[];
  isCmsFutureContent?: boolean;
  isGenerated?: boolean;
  isNotApplicable?: boolean;
  isCriticalConfirmation?: boolean;
  hasConflict?: boolean;
  conflictingCandidates?: CanonicalCandidate[];
  referenceAssetId?: string;
  referenceUrl?: string;
  referenceFileName?: string;
  referenceWidth?: number;
  referenceHeight?: number;
  referenceFileSize?: number;
  referenceFileType?: string;
  referenceStorageKey?: string;
  referenceUsageSummary?: string;
}

export function createRequirement(opts: CreateRequirementOptions): WebsitePageRequirement {
  const hasValue = opts.value !== undefined && opts.value !== null && opts.value !== '' &&
    !(Array.isArray(opts.value) && opts.value.length === 0) &&
    !(typeof opts.value === 'object' && Object.keys(opts.value as object).length === 0);

  let status: WebsiteFieldState = 'missing';

  if (opts.status) {
    status = opts.status;
  } else if (opts.isNotApplicable) {
    status = 'not_applicable';
  } else if (opts.isCmsFutureContent) {
    status = 'future_cms';
  } else if (opts.isGenerated) {
    status = 'generated';
  } else if (opts.userConfirmed) {
    status = 'confirmed';
  } else if (hasValue) {
    if (opts.isCriticalConfirmation || opts.hasConflict) {
      status = 'needs_confirmation';
    } else if (opts.source) {
      status = 'auto_filled';
    } else {
      status = 'confirmed';
    }
  } else if (!opts.required) {
    status = 'optional';
  } else {
    status = 'missing';
  }

  return {
    key: opts.key,
    label: opts.label,
    type: opts.type,
    required: opts.required,
    value: opts.value,
    source: opts.source,
    sourceSection: opts.sourceSection,
    sourceField: opts.sourceField,
    autoFilled: Boolean(hasValue && opts.source),
    userConfirmed: opts.userConfirmed,
    status,
    whyNeeded: opts.whyNeeded,
    missingWarning: opts.missingWarning,
    options: opts.options,
    isCmsFutureContent: opts.isCmsFutureContent,
    referenceAssetId: opts.referenceAssetId,
    referenceUrl: opts.referenceUrl,
    referenceFileName: opts.referenceFileName,
    referenceWidth: opts.referenceWidth,
    referenceHeight: opts.referenceHeight,
    referenceFileSize: opts.referenceFileSize,
    referenceFileType: opts.referenceFileType,
    referenceStorageKey: opts.referenceStorageKey,
    referenceUsageSummary: opts.referenceUsageSummary,
    hasConflict: opts.hasConflict,
    conflictingCandidates: opts.conflictingCandidates,
  };
}

export interface WebsitePageDefinition {
  pageKey: string;
  label: string;
  slug: string;
  description: string;
  recommendedSections: string[];
  isCmsSupported: boolean;
  supportsMultiCampus?: boolean;
}

export const STANDARD_WEBSITE_PAGES: WebsitePageDefinition[] = [
  {
    pageKey: 'Home',
    label: 'Home',
    slug: 'home',
    description: 'Hero presentation, school identity, primary campus highlights, announcements, and key CTAs.',
    recommendedSections: ['Hero Banner', 'Key Statistics', 'About Teaser', 'Featured Facilities', 'Principal Highlight', 'Admissions CTA', 'Latest Circulars', 'Contact Strip'],
    isCmsSupported: true,
  },
  {
    pageKey: 'About School',
    label: 'About School',
    slug: 'about-us',
    description: 'School history, vision, mission, core values, educational philosophy, and campus overview.',
    recommendedSections: ['Introduction', 'History & Establishment', 'Vision & Mission', 'Core Values', 'Educational Philosophy', 'Principal Message', 'Campus Overview'],
    isCmsSupported: true,
  },
  {
    pageKey: 'Leadership & Desk',
    label: 'Leadership & Desk',
    slug: 'leadership',
    description: 'Chairman, Principal, Directors, and Board of Trustees messages and credentials.',
    recommendedSections: ['Principal Desk', 'Chairman Message', 'Board of Trustees / Directors', 'Management Committee'],
    isCmsSupported: true,
  },
  {
    pageKey: 'Academics',
    label: 'Academics',
    slug: 'academics',
    description: 'Curriculum, grade hierarchy, academic streams, teaching pedagogy, and session schedule.',
    recommendedSections: ['Curriculum & Board', 'Academic Wings', 'Teaching Methodology', 'Academic Streams & Subjects', 'Assessment Scheme'],
    isCmsSupported: true,
  },
  {
    pageKey: 'Admissions',
    label: 'Admissions',
    slug: 'admissions',
    description: 'Admission procedure, eligibility criteria, required documents, key dates, and enquiry form.',
    recommendedSections: ['Admission Procedure', 'Age & Eligibility Criteria', 'Required Documents', 'Important Dates', 'Fee Summary', 'Admission Enquiry Form'],
    isCmsSupported: true,
  },
  {
    pageKey: 'Fee Structure',
    label: 'Fee Structure',
    slug: 'fee-structure',
    description: 'Transparent fee schedule, payment terms, installment dates, and payment instructions.',
    recommendedSections: ['Annual / Term Fee Table', 'Payment Schedule', 'Payment Methods', 'Scholarships / Concessions', 'Refund Policy'],
    isCmsSupported: true,
  },
  {
    pageKey: 'Campus Facilities',
    label: 'Campus Facilities',
    slug: 'facilities',
    description: 'Modern classrooms, laboratories, sports grounds, library, and campus infrastructure.',
    recommendedSections: ['Campus Overview', 'Classrooms', 'Laboratories', 'Library & Resource Centre', 'Sports & Playground', 'Auditorium', 'Cafeteria', 'Safety & Security'],
    isCmsSupported: true,
    supportsMultiCampus: true,
  },
  {
    pageKey: 'Infrastructure',
    label: 'Infrastructure',
    slug: 'infrastructure',
    description: 'Architectural overview, smart classrooms, ICT infrastructure, and accessibility provisions.',
    recommendedSections: ['Infrastructure Overview', 'Smart Classrooms', 'STEM & Robotics Labs', 'ICT & Wi-Fi Facilities', 'Safety & Surveillance', 'Accessibility'],
    isCmsSupported: true,
    supportsMultiCampus: true,
  },
  {
    pageKey: 'Photo & Video Gallery',
    label: 'Photo & Video Gallery',
    slug: 'gallery',
    description: 'Curated photo albums and video tours across all school activities and campus life.',
    recommendedSections: ['Campus & Buildings', 'Classrooms & Labs', 'Sports & Grounds', 'Events & Celebrations', 'Student Activities', 'Video Tours'],
    isCmsSupported: true,
    supportsMultiCampus: true,
  },
  {
    pageKey: 'Events & News',
    label: 'Events & News',
    slug: 'events-news',
    description: 'Upcoming school calendar events, cultural fests, sports meets, and press news.',
    recommendedSections: ['Upcoming Events Calendar', 'Latest School News', 'Past Events Archive', 'Annual Day Highlights'],
    isCmsSupported: true,
  },
  {
    pageKey: 'Notices & Circulars',
    label: 'Notices & Circulars',
    slug: 'circulars',
    description: 'Official announcements, academic circulars, exam schedules, and parent circular downloads.',
    recommendedSections: ['Urgent Notices', 'Academic Circulars', 'Examination Schedules', 'Parent Notification Archive'],
    isCmsSupported: true,
  },
  {
    pageKey: 'Results & Achievements',
    label: 'Results & Achievements',
    slug: 'achievements',
    description: 'Board exam results, school toppers, inter-school sports laurels, and national awards.',
    recommendedSections: ['Board Exam Result Highlights', 'School Toppers', 'Olympiad & STEM Awards', 'Sports Laurels', 'Institutional Accreditations'],
    isCmsSupported: true,
  },
  {
    pageKey: 'Faculty Roster',
    label: 'Faculty Roster',
    slug: 'faculty',
    description: 'Qualified teaching faculty directory, department heads, and teacher credentials.',
    recommendedSections: ['Department Heads', 'Teaching Faculty Directory', 'Staff Qualifications', 'Teacher-Student Mentorship'],
    isCmsSupported: true,
  },
  {
    pageKey: 'Student Life',
    label: 'Student Life',
    slug: 'student-life',
    description: 'Student houses, activity clubs, co-curricular programs, and leadership council.',
    recommendedSections: ['Student Council', 'House System', 'Clubs & Societies', 'Community Outreach', 'Cultural Activities'],
    isCmsSupported: true,
  },
  {
    pageKey: 'Sports & Activities',
    label: 'Sports & Activities',
    slug: 'sports',
    description: 'Sports facilities, coaching academies, inter-house tournaments, and martial arts.',
    recommendedSections: ['Sports Offered', 'Coaching & Training', 'Grounds & Equipment', 'Tournament Achievements', 'Yoga & Physical Fitness'],
    isCmsSupported: true,
  },
  {
    pageKey: 'Transport Information',
    label: 'Transport Information',
    slug: 'transport',
    description: 'Bus fleet, transportation routes, pickup points, safety guidelines, and GPS tracking.',
    recommendedSections: ['Fleet & Routes', 'Pickup / Drop Points', 'Bus Safety Measures', 'Transport Incharge Contact', 'GPS Tracking Information'],
    isCmsSupported: true,
    supportsMultiCampus: true,
  },
  {
    pageKey: 'Hostel Information',
    label: 'Hostel Information',
    slug: 'hostel',
    description: 'Residential campus facilities, dormitories, dining mess, wardens, and pastoral care.',
    recommendedSections: ['Hostel Overview', 'Boys / Girls Wings', 'Mess & Nutrition', 'Warden & Caretaker Desk', 'Hostel Rules & Schedule'],
    isCmsSupported: true,
  },
  {
    pageKey: 'Library Desk',
    label: 'Library Desk',
    slug: 'library',
    description: 'School library catalogue, reading rooms, digital subscriptions, and book lending rules.',
    recommendedSections: ['Library Overview', 'Collection & Catalogue', 'Digital Library & E-Resources', 'Reading Room Timings', 'Librarian Contact'],
    isCmsSupported: true,
  },
  {
    pageKey: 'Careers',
    label: 'Careers',
    slug: 'careers',
    description: 'Faculty vacancies, administrative openings, eligibility, and online CV submission.',
    recommendedSections: ['Why Join Us', 'Current Openings', 'Eligibility & Perks', 'Application Submission Link / Email'],
    isCmsSupported: true,
  },
  {
    pageKey: 'Contact Us',
    label: 'Contact Us',
    slug: 'contact-us',
    description: 'Campus locations, telephone helplines, email desks, interactive Google Maps, and enquiry form.',
    recommendedSections: ['Campus Address & Visiting Hours', 'Phone & Email Helplines', 'Interactive Google Map', 'Contact Enquiry Form'],
    isCmsSupported: true,
    supportsMultiCampus: true,
  },
  {
    pageKey: 'Mandatory Disclosures',
    label: 'Mandatory Disclosures',
    slug: 'mandatory-disclosures',
    description: 'Statutory board compliance (Appendix IX), affiliation status, safety certificates, and audit documents.',
    recommendedSections: ['General Information', 'Documents & Information (Certificates)', 'Result & Academics', 'Staff (Teaching)', 'School Infrastructure'],
    isCmsSupported: true,
  },
  {
    pageKey: 'Privacy Policy',
    label: 'Privacy Policy',
    slug: 'privacy-policy',
    description: 'Official student and parent website privacy policy, cookie disclosures, and data protection terms.',
    recommendedSections: ['Information We Collect', 'Use of Information', 'Cookies & Analytics', 'Data Security', 'Parent Rights & Contact'],
    isCmsSupported: false,
  },
];

/**
 * Maps standard page keys to canonical gallery categories
 */
export function getCampusGalleryCategoryCounts(campuses?: UniversalIntakeData['campuses']): Record<CampusImageCategory, number> {
  const counts: Record<CampusImageCategory, number> = {
    campus_buildings: 0,
    classrooms: 0,
    laboratories: 0,
    library: 0,
    sports_playground: 0,
    activities: 0,
    events: 0,
    transport: 0,
    cafeteria: 0,
    other: 0,
  };

  if (!Array.isArray(campuses)) return counts;

  for (const campus of campuses) {
    if (Array.isArray(campus.images)) {
      for (const img of campus.images) {
        const cat = (img.category || img.imageCategory || 'other') as CampusImageCategory;
        if (cat in counts) {
          counts[cat]++;
        } else {
          counts.other++;
        }
      }
    }
  }

  return counts;
}

export interface StatutoryDocumentInfo {
  id: string;
  title: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  storageKey?: string;
  status: 'verified' | 'uploaded' | 'pending' | 'missing';
  verified: boolean;
  source: string;
}

/**
 * Finds statutory documents in Section 23/24 Asset Checklist
 */
export function findStatutoryDocumentsInChecklist(intakeData: Partial<UniversalIntakeData>) {
  const items = intakeData.assetChecklist?.items || [];
  const map = new Map<string, StatutoryDocumentInfo>();

  for (const item of items) {
    const hasFile = Boolean(item.fileUrl || item.storageKey);
    const isVerified = Boolean(item.status === 'provided' || hasFile);
    map.set(item.id, {
      id: item.id,
      title: item.title,
      fileUrl: item.fileUrl,
      fileName: item.fileName,
      fileSize: item.fileSize || item.optimizedSize,
      fileType: item.fileType || 'application/pdf',
      storageKey: item.storageKey,
      status: isVerified ? 'verified' : item.status === 'pending' ? 'pending' : 'missing',
      verified: isVerified,
      source: `Section 23 — Asset Checklist (${item.title})`,
    });
  }

  return map;
}

export interface CanonicalResolvedAsset {
  url?: string;
  fileName?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  fileType?: string;
  storageKey?: string;
  source?: string;
  sourceSection?: string;
  sourceField?: string;
  usageSummary?: string;
  isAvailable: boolean;
}

/**
 * Resolves a canonical asset from Asset Checklist, Campuses, Leadership, or Branding without duplication.
 */
export function resolveCanonicalAsset(
  intakeData: Partial<UniversalIntakeData>,
  assetIdOrCategory: string,
  options?: { campusId?: string; fallbackUrl?: string; intendedUsage?: string }
): CanonicalResolvedAsset {
  const checklistItems = intakeData.assetChecklist?.items || [];
  const campuses = intakeData.campuses || [];
  const primaryCampus = campuses.find((c) => c.isMainCampus) || campuses[0] || ({} as any);
  const targetCampus = options?.campusId && options.campusId !== 'all'
    ? campuses.find((c) => c.id === options.campusId) || primaryCampus
    : primaryCampus;

  // 1. First check canonical assetChecklist items
  const checkItem = checklistItems.find(
    (item) => item.id === assetIdOrCategory && (item.fileUrl || item.storageKey)
  );
  if (checkItem && checkItem.fileUrl) {
    return {
      url: checkItem.fileUrl,
      fileName: checkItem.fileName,
      fileSize: checkItem.fileSize || checkItem.optimizedSize,
      width: checkItem.width,
      height: checkItem.height,
      fileType: checkItem.fileType || checkItem.optimizedFormat || 'image/webp',
      storageKey: checkItem.storageKey,
      source: `Asset Checklist → ${checkItem.title || checkItem.sourceSection || 'Canonical Assets'}`,
      sourceSection: 'assetChecklist',
      sourceField: checkItem.id,
      usageSummary: options?.intendedUsage || 'School Website Specification',
      isAvailable: true,
    };
  }

  // 2. Logo / Crest / Favicon from brandingDesign
  if (assetIdOrCategory === 'brand-logo' || assetIdOrCategory === 'logo') {
    const b = intakeData.brandingDesign;
    if (b?.logoUrl) {
      return {
        url: b.logoUrl,
        fileName: b.logoFileName || 'School_Official_Logo.webp',
        fileSize: b.logoFileSize ?? undefined,
        width: b.logoWidth ?? undefined,
        height: b.logoHeight ?? undefined,
        fileType: b.logoOptimizedFormat === 'webp' ? 'image/webp' : 'image/png',
        storageKey: b.logoStorageKey,
        source: 'Section 4 — Brand Identity (Official Logo)',
        sourceSection: 'brandingDesign',
        sourceField: 'logoUrl',
        usageSummary: options?.intendedUsage || 'Header Navigation & Hero',
        isAvailable: true,
      };
    }
  }

  // 3. Principal Photo / Leadership Portraits
  if (assetIdOrCategory === 'lead-principal-photo' || assetIdOrCategory === 'principal_photo') {
    const lead = intakeData.leadership;
    const photo = lead?.principalPhoto;
    const photoUrl = photo?.url || lead?.principalPhotoUrl;
    if (photoUrl) {
      return {
        url: photoUrl,
        fileName: photo?.fileName || 'Principal_Portrait.webp',
        fileSize: photo?.optimizedSize || photo?.originalSize || undefined,
        width: photo?.width ?? undefined,
        height: photo?.height ?? undefined,
        fileType: 'image/webp',
        storageKey: photo?.storageKey,
        source: 'Section 3 — Leadership (Principal Portrait)',
        sourceSection: 'leadership',
        sourceField: 'principalPhoto',
        usageSummary: options?.intendedUsage || "Principal's Desk & Leadership Profile",
        isAvailable: true,
      };
    }
  }

  // 4. Campus Images (Hero, Main Building, Labs, Sports, Classrooms, Library)
  if (Array.isArray(targetCampus.images) && targetCampus.images.length > 0) {
    let matchedImg: CampusImageData | undefined;
    if (assetIdOrCategory === 'campus-building-photo' || assetIdOrCategory === 'hero_image') {
      matchedImg =
        targetCampus.images.find((img) => img.isPrimary) ||
        targetCampus.images.find((img) => img.category === 'campus_buildings') ||
        targetCampus.images[0];
    } else if (assetIdOrCategory === 'campus-sports-photo' || assetIdOrCategory === 'sports') {
      matchedImg =
        targetCampus.images.find((img) => img.category === 'sports_playground') ||
        targetCampus.images.find((img) => img.category === 'campus_buildings');
    } else if (assetIdOrCategory === 'campus-lab-photo' || assetIdOrCategory === 'labs') {
      matchedImg = targetCampus.images.find((img) => img.category === 'laboratories');
    } else if (assetIdOrCategory === 'campus-classroom-photo' || assetIdOrCategory === 'classrooms') {
      matchedImg = targetCampus.images.find((img) => img.category === 'classrooms');
    } else if (assetIdOrCategory === 'library') {
      matchedImg = targetCampus.images.find((img) => img.category === 'library');
    } else if (assetIdOrCategory === 'transport') {
      matchedImg = targetCampus.images.find((img) => img.category === 'transport');
    }

    if (matchedImg && matchedImg.url) {
      return {
        url: matchedImg.url,
        fileName: matchedImg.fileName || `${matchedImg.category || 'campus'}_photo.webp`,
        fileSize: matchedImg.optimizedSize || matchedImg.originalSize || undefined,
        width: matchedImg.width ?? undefined,
        height: matchedImg.height ?? undefined,
        fileType: 'image/webp',
        storageKey: matchedImg.storageKey,
        source: `Section 2 — Campuses (${matchedImg.isPrimary ? 'Primary Photo' : matchedImg.category || 'Campus Photo'})`,
        sourceSection: 'campuses',
        sourceField: 'images',
        usageSummary: options?.intendedUsage || 'Campus Facility Showcase',
        isAvailable: true,
      };
    }
  }

  // 5. Fallback URL
  if (options?.fallbackUrl) {
    return {
      url: options.fallbackUrl,
      source: 'Default Asset Reference',
      isAvailable: true,
    };
  }

  return {
    isAvailable: false,
  };
}

export interface DuplicatePageRisk {
  pageKey: string;
  label: string;
  slug: string;
  isCustom: boolean;
  conflictingPageKey: string;
  conflictingLabel: string;
  conflictingSlug: string;
  conflictingIsStandard: boolean;
  matchType: 'exact_slug' | 'near_slug' | 'exact_title' | 'similar_title' | 'semantic';
  message: string;
}

/**
 * Audits all standard and custom website pages for exact duplicate slugs, near-duplicate slugs,
 * title similarities, and semantic overlaps (e.g. Mandatory Disclosures vs CBSE Mandatory Disclosures).
 */
export function detectDuplicatePageRisks(
  allPages: Array<{
    pageKey: string;
    label: string;
    slug: string;
    isCustom?: boolean;
    purpose?: string;
    hasDistinctPurpose?: boolean;
  }>
): DuplicatePageRisk[] {
  const risks: DuplicatePageRisk[] = [];
  const normalizeSlug = (s: string) => (s || '').toLowerCase().trim().replace(/^\/+|\/+$/g, '');
  const normalizeSlugRoot = (s: string) => normalizeSlug(s).replace(/[-_]/g, '').replace(/s$/, '');
  const normalizeTitle = (t: string) => (t || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');

  for (let i = 0; i < allPages.length; i++) {
    for (let j = i + 1; j < allPages.length; j++) {
      const p1 = allPages[i];
      const p2 = allPages[j];

      // If user explicitly configured distinct purpose and distinct slug, skip
      if (p1.hasDistinctPurpose && p2.hasDistinctPurpose && normalizeSlug(p1.slug) !== normalizeSlug(p2.slug)) {
        continue;
      }

      const slug1 = normalizeSlug(p1.slug);
      const slug2 = normalizeSlug(p2.slug);
      const root1 = normalizeSlugRoot(p1.slug);
      const root2 = normalizeSlugRoot(p2.slug);
      const title1 = normalizeTitle(p1.label);
      const title2 = normalizeTitle(p2.label);

      let matchType: DuplicatePageRisk['matchType'] | null = null;
      let message = '';

      if (slug1 && slug2 && slug1 === slug2) {
        matchType = 'exact_slug';
        message = `Exact route conflict: both "${p1.label}" and "${p2.label}" map to /${slug1}`;
      } else if (root1 && root2 && root1 === root2 && slug1 !== slug2) {
        matchType = 'near_slug';
        message = `Near-duplicate route: /${slug1} and /${slug2} resolve to the same root path`;
      } else if (title1 && title2 && title1 === title2) {
        matchType = 'exact_title';
        message = `Duplicate page title: "${p1.label}" and "${p2.label}" have identical names`;
      } else if (
        title1.length >= 6 &&
        title2.length >= 6 &&
        (title1.includes(title2) || title2.includes(title1))
      ) {
        matchType = 'similar_title';
        message = `High title similarity between "${p1.label}" and "${p2.label}"`;
      } else {
        // Semantic keyword overlap check for statutory or core pages
        const semanticKeywords = [
          'mandatorydisclosure',
          'privacypolicy',
          'admission',
          'feestructure',
          'contactus',
        ];
        for (const kw of semanticKeywords) {
          if ((title1.includes(kw) || root1.includes(kw)) && (title2.includes(kw) || root2.includes(kw))) {
            matchType = 'semantic';
            message = `Semantic duplicate for ${kw}: "${p1.label}" conflicts with "${p2.label}"`;
            break;
          }
        }
      }

      if (matchType) {
        risks.push({
          pageKey: p2.pageKey,
          label: p2.label,
          slug: p2.slug,
          isCustom: Boolean(p2.isCustom),
          conflictingPageKey: p1.pageKey,
          conflictingLabel: p1.label,
          conflictingSlug: p1.slug,
          conflictingIsStandard: !p1.isCustom,
          matchType,
          message,
        });
      }
    }
  }

  return risks;
}

export interface WebsiteReadinessBreakdown {
  websitePagesCount: number;
  readyPagesCount: number;
  needsAttentionPagesCount: number;
  contentReadyPercentage: number;
  contentReadyCount: number;
  contentTotalCount: number;
  assetsVerifiedCount: number;
  assetsPendingCount: number;
  assetsTotalCount: number;
  complianceBlockersCount: number;
  complianceBlockersList: Array<{
    key: string;
    label: string;
    sourceSection: string;
    sourceSectionName: string;
    message: string;
  }>;
  duplicateRiskCount: number;
  duplicateRisks: DuplicatePageRisk[];
  unresolvedBlockers: Array<{
    key: string;
    pageLabel: string;
    label: string;
    sourceSection: string;
    sourceSectionName: string;
    message: string;
    isStatutory: boolean;
  }>;
  isWebsiteApproved: boolean;
  canApprove: boolean;
}

/**
 * Calculates separated, non-fabricated readiness metrics for the Website Verification Dashboard.
 */
export function calculateWebsiteReadinessBreakdown(
  intakeData: Partial<UniversalIntakeData>,
  pageConfigurations?: Record<string, WebsitePageConfiguration>
): WebsiteReadinessBreakdown {
  const configsMap = pageConfigurations || buildWebsitePageConfigurations(intakeData);
  const configs = Object.values(configsMap).filter((c) => c.enabled);

  const websitePagesCount = configs.length;
  let readyPagesCount = 0;
  let needsAttentionPagesCount = 0;

  let contentReadyCount = 0;
  let contentTotalCount = 0;

  let assetsVerifiedCount = 0;
  let assetsPendingCount = 0;
  let assetsTotalCount = 0;

  const unresolvedBlockers: WebsiteReadinessBreakdown['unresolvedBlockers'] = [];

  for (const cfg of configs) {
    if (cfg.status === 'ready') {
      readyPagesCount++;
    } else {
      needsAttentionPagesCount++;
    }

    for (const req of cfg.requirements || []) {
      if (req.isCmsFutureContent || req.status === 'not_applicable') continue;

      if (req.type === 'image' || req.type === 'document') {
        assetsTotalCount++;
        const isVerified = Boolean(
          req.status === 'confirmed' ||
          (req.value && req.status !== 'missing')
        );
        if (isVerified) {
          assetsVerifiedCount++;
        } else {
          assetsPendingCount++;
          if (req.required) {
            unresolvedBlockers.push({
              key: req.key,
              pageLabel: cfg.label,
              label: req.label,
              sourceSection: req.sourceSection || 'assetChecklist',
              sourceSectionName: req.source || 'Asset Checklist',
              message: req.missingWarning || `${req.label} requires an uploaded or confirmed file.`,
              isStatutory: req.type === 'document' || req.key.includes('statutory') || req.key.includes('affiliation'),
            });
          }
        }
      } else {
        // Content requirement
        contentTotalCount++;
        const isReady = Boolean(
          req.status === 'confirmed' ||
          req.status === 'auto_filled' ||
          req.status === 'generated'
        );
        if (isReady) {
          contentReadyCount++;
        } else if (req.required && req.status === 'missing') {
          unresolvedBlockers.push({
            key: req.key,
            pageLabel: cfg.label,
            label: req.label,
            sourceSection: req.sourceSection || 'schoolProfile',
            sourceSectionName: req.source || 'School Profile',
            message: req.missingWarning || `${req.label} is required for publication.`,
            isStatutory: false,
          });
        }
      }
    }
  }

  const contentReadyPercentage =
    contentTotalCount > 0 ? Math.round((contentReadyCount / contentTotalCount) * 100) : 100;

  // Compliance blockers check
  const complianceBlockersList: WebsiteReadinessBreakdown['complianceBlockersList'] = [];
  const statutoryMap = findStatutoryDocumentsInChecklist(intakeData);

  // Check Affiliation Certificate
  const board = intakeData.schoolProfile?.board || '';
  const isAffiliatedBoard = /cbse|icse|cisce|cambridge|ib/i.test(board);
  if (isAffiliatedBoard) {
    const affDoc = statutoryMap.get('doc-affiliation-cert');
    if (!affDoc || !affDoc.verified) {
      complianceBlockersList.push({
        key: 'doc-affiliation-cert',
        label: 'Board Affiliation Certificate / Extension Letter',
        sourceSection: 'assetChecklist',
        sourceSectionName: 'Asset Checklist (Group B)',
        message: 'Formal affiliation certificate is required by statutory disclosure guidelines.',
      });
    }
  }

  // Check Fire Safety Certificate
  const fireDoc = statutoryMap.get('doc-fire-safety');
  if (!fireDoc || !fireDoc.verified) {
    complianceBlockersList.push({
      key: 'doc-fire-safety',
      label: 'Building & Fire Safety Certificate',
      sourceSection: 'assetChecklist',
      sourceSectionName: 'Asset Checklist (Group B)',
      message: 'Fire safety compliance certificate issued by competent authority is required.',
    });
  }

  // Check School Legal Name
  if (!intakeData.schoolProfile?.schoolName?.trim()) {
    complianceBlockersList.push({
      key: 'school_name',
      label: 'Official School Name',
      sourceSection: 'schoolProfile',
      sourceSectionName: 'Section 1 — School Identity',
      message: 'Official school name is mandatory for legal compliance and branding.',
    });
  }

  // Check Primary Campus Address
  const primaryCampus = (intakeData.campuses || []).find((c) => c.isMainCampus) || (intakeData.campuses || [])[0];
  if (!primaryCampus?.address?.trim() && !primaryCampus?.city?.trim()) {
    complianceBlockersList.push({
      key: 'campus_address',
      label: 'Official Campus Postal Address',
      sourceSection: 'campuses',
      sourceSectionName: 'Section 2 — Campuses & Branches',
      message: 'Official postal address is required for regulatory disclosures.',
    });
  }

  // Check Duplicate Page Risks
  const allPagesList = configs.map((c) => ({
    pageKey: c.pageKey,
    label: c.label,
    slug: c.slug,
    isCustom: Boolean(c.isCustom),
  }));
  const duplicateRisks = detectDuplicatePageRisks(allPagesList);

  const complianceBlockersCount = complianceBlockersList.length;
  const duplicateRiskCount = duplicateRisks.length;
  const isWebsiteApproved = Boolean(intakeData.websiteRequirements?.websiteApproved);
  const canApprove = complianceBlockersCount === 0 && duplicateRiskCount === 0 && unresolvedBlockers.length === 0;

  return {
    websitePagesCount,
    readyPagesCount,
    needsAttentionPagesCount,
    contentReadyPercentage,
    contentReadyCount,
    contentTotalCount,
    assetsVerifiedCount,
    assetsPendingCount,
    assetsTotalCount,
    complianceBlockersCount,
    complianceBlockersList,
    duplicateRiskCount,
    duplicateRisks,
    unresolvedBlockers,
    isWebsiteApproved,
    canApprove,
  };
}

/**
 * Single Source of Truth Auto-Fill Engine
 * Analyzes existing onboarding data and builds smart requirements for any page.
 */
export function autoFillPageRequirements(
  pageKey: string,
  intakeData: Partial<UniversalIntakeData>,
  selectedCampusId?: string
): WebsitePageRequirement[] {
  const prof = intakeData.schoolProfile || ({} as any);
  const brand = intakeData.brandingDesign || ({} as any);
  const lead = intakeData.leadership || ({} as any);
  const content = intakeData.schoolContent || ({} as any);
  const inst = intakeData.institutionStructure || ({} as any);
  const staff = intakeData.staffFaculty || ({} as any);
  const adm = intakeData.admissions || ({} as any);
  const fees = intakeData.feesConfiguration || ({} as any);
  const fac = intakeData.facilitiesConfig || ({} as any);
  const lib = intakeData.libraryConfig || ({} as any);
  const hostel = intakeData.hostelConfig || ({} as any);
  const trans = intakeData.transportConfig || ({} as any);

  const campuses = intakeData.campuses || [];
  const primaryCampus = campuses.find((c) => c.isMainCampus) || campuses[0] || ({} as any);
  const targetCampus = selectedCampusId && selectedCampusId !== 'all'
    ? campuses.find((c) => c.id === selectedCampusId) || primaryCampus
    : primaryCampus;

  const galleryCounts = getCampusGalleryCategoryCounts(campuses);
  const primaryImage = targetCampus.images?.find((img: CampusImageData) => img.isPrimary) || targetCampus.images?.[0];
  const statutoryDocs = findStatutoryDocumentsInChecklist(intakeData);

  const requirements: WebsitePageRequirement[] = [];

  switch (pageKey) {
    case 'Home': {
      // School Name
      requirements.push(
        createRequirement({
          key: 'school_name',
          label: 'Official School Name',
          type: 'text',
          required: true,
          value: prof.schoolName || '',
          source: prof.schoolName ? 'Section 1 — Identity' : undefined,
          sourceSection: 'schoolProfile',
          sourceField: 'schoolName',
          whyNeeded: 'School name is required for website hero branding, navigation header, and SEO.',
          missingWarning: 'School name is required for website hero branding.',
        })
      );

      // Tagline / Motto
      const motto = brand.taglineOrMotto || brand.motto || prof.shortName;
      requirements.push(
        createRequirement({
          key: 'tagline',
          label: 'School Tagline / Motto',
          type: 'text',
          required: false,
          value: motto || '',
          source: motto ? 'Section 4 — Brand Identity' : undefined,
          sourceSection: 'brandingDesign',
          sourceField: 'taglineOrMotto',
          whyNeeded: 'Displayed below the school name in the hero section and footer.',
        })
      );

      // Communication Style
      requirements.push(
        createRequirement({
          key: 'communication_style',
          label: 'Visual Communication Tone',
          type: 'text',
          required: true,
          value: brand.brandTone || 'Modern',
          source: 'Section 4 — Brand Identity',
          sourceSection: 'brandingDesign',
          sourceField: 'brandTone',
          whyNeeded: 'Sets the overarching design language, card contrast, and visual rhythm.',
        })
      );

      // Primary Campus Name
      requirements.push(
        createRequirement({
          key: 'primary_campus',
          label: 'Featured Campus Location',
          type: 'text',
          required: true,
          value: targetCampus.name ? `${targetCampus.name} (${targetCampus.city || ''})` : '',
          source: targetCampus.name ? 'Section 2 — Campuses' : undefined,
          sourceSection: 'campuses',
          sourceField: 'name',
          whyNeeded: 'Displayed in the campus highlight strip and location teaser.',
          missingWarning: 'Primary campus name is required.',
        })
      );

      // Hero Image
      requirements.push(
        createRequirement({
          key: 'hero_image',
          label: 'Hero Featured Image',
          type: 'image',
          required: true,
          value: primaryImage?.url || brand.logoUrl || '',
          referenceAssetId: primaryImage?.id,
          referenceUrl: primaryImage?.url,
          referenceFileName: primaryImage?.fileName,
          source: primaryImage?.url
            ? `Section 2 — Campus Gallery (${primaryImage.isPrimary ? 'Primary Image' : 'Campus Photo'})`
            : undefined,
          sourceSection: 'campuses',
          sourceField: 'images',
          whyNeeded: 'Hero presentation image capturing campus architecture and campus life.',
          missingWarning: 'No campus image uploaded yet. A high-resolution campus photo is recommended.',
        })
      );

      // Short Introduction
      requirements.push(
        createRequirement({
          key: 'short_intro',
          label: 'Hero Introduction Copy',
          type: 'textarea',
          required: true,
          value: content.aboutSchool || (prof.schoolName ? `${prof.schoolName} provides nurturing, holistic education rooted in character and excellence.` : ''),
          source: content.aboutSchool ? 'Section 6 — Pedagogy & Story' : 'Generated Default',
          sourceSection: 'schoolContent',
          sourceField: 'aboutSchool',
          isGenerated: !content.aboutSchool,
          whyNeeded: 'Introductory statement welcoming prospective parents and students.',
        })
      );

      // Key Statistics Highlights
      const hasStats = Boolean(fac.totalStudents || fac.classroomsCount || inst.studentCapacityTotal);
      requirements.push(
        createRequirement({
          key: 'key_statistics',
          label: 'Key Campus Statistics (Students, Faculty, Labs)',
          type: 'text',
          required: false,
          value: hasStats ? `Students: ${fac.totalStudents || inst.studentCapacityTotal || 'N/A'}, Classrooms: ${fac.classroomsCount || 'N/A'}` : '',
          source: hasStats ? 'Section 15 — Facilities' : undefined,
          sourceSection: 'facilitiesConfig',
          sourceField: 'totalStudents',
          whyNeeded: 'Key numerical metrics demonstrating school scale and infrastructure.',
        })
      );

      // Admissions CTA
      requirements.push(
        createRequirement({
          key: 'admissions_cta',
          label: 'Admissions Call to Action',
          type: 'boolean',
          required: true,
          value: adm.admissionsOpen ?? true,
          source: 'Section 10 — Admissions',
          sourceSection: 'admissions',
          sourceField: 'admissionsOpen',
          whyNeeded: 'Controls the prominent Apply Now / Enquire button on the homepage.',
        })
      );

      // Contact CTA
      const contactAvailable = Boolean(prof.officialPhone || targetCampus.contactPhone);
      requirements.push(
        createRequirement({
          key: 'contact_helpline',
          label: 'Direct Contact Helpline',
          type: 'phone',
          required: true,
          value: targetCampus.contactPhone || prof.officialPhone || '',
          source: targetCampus.contactPhone ? 'Section 2 — Campus' : (prof.officialPhone ? 'Section 1 — Identity' : undefined),
          sourceSection: targetCampus.contactPhone ? 'campuses' : 'schoolProfile',
          sourceField: 'contactPhone',
          whyNeeded: 'Direct phone helpline shown in header strip and admissions CTA.',
          missingWarning: 'Contact telephone number is required.',
        })
      );

      // Notices Banner CMS
      requirements.push(
        createRequirement({
          key: 'notice_board_cms',
          label: 'Notice & Announcement Ticker',
          type: 'boolean',
          required: false,
          value: true,
          isCmsFutureContent: true,
          whyNeeded: 'Real-time alert ticker for circulars, exam dates, and urgent updates.',
        })
      );
      break;
    }

    case 'About School': {
      requirements.push(
        createRequirement({
          key: 'about_school_intro',
          label: 'School Introduction & Heritage',
          type: 'textarea',
          required: true,
          value: content.aboutSchool || '',
          source: content.aboutSchool ? 'Section 6 — School Content' : undefined,
          sourceSection: 'schoolContent',
          sourceField: 'aboutSchool',
          whyNeeded: 'Core narrative describing the school founding philosophy, background, and ethos.',
          missingWarning: 'Please provide a comprehensive introduction to your school.',
        })
      );

      const hasHistory = Boolean(prof.yearOfEstablishment || prof.establishmentYear || content.history);
      requirements.push(
        createRequirement({
          key: 'history_establishment',
          label: 'Year of Establishment & History',
          type: 'text',
          required: false,
          value: prof.yearOfEstablishment || prof.establishmentYear || content.history || '',
          source: prof.yearOfEstablishment ? 'Section 1 — Identity' : (content.history ? 'Section 6 — Content' : undefined),
          sourceSection: prof.yearOfEstablishment ? 'schoolProfile' : 'schoolContent',
          sourceField: 'yearOfEstablishment',
          whyNeeded: 'Highlights the legacy, heritage, and founding year of the institution.',
        })
      );

      const visionVal = content.philosophy || lead.visionStatement || brand.visionStatement || '';
      requirements.push(
        createRequirement({
          key: 'vision_statement',
          label: 'Vision Statement',
          type: 'textarea',
          required: false,
          value: visionVal,
          source: content.philosophy ? 'Section 6 — Content' : (lead.visionStatement ? 'Section 3 — Leadership' : (brand.visionStatement ? 'Section 4 — Brand Identity' : undefined)),
          sourceSection: content.philosophy ? 'schoolContent' : (lead.visionStatement ? 'leadership' : 'brandingDesign'),
          sourceField: 'visionStatement',
          whyNeeded: 'Articulates the aspirational future and institutional direction.',
        })
      );

      const missionVal = lead.missionStatement || brand.missionStatement || content.mission || '';
      requirements.push(
        createRequirement({
          key: 'mission_statement',
          label: 'Mission Statement',
          type: 'textarea',
          required: false,
          value: missionVal,
          source: lead.missionStatement ? 'Section 3 — Leadership' : (brand.missionStatement ? 'Section 4 — Brand Identity' : (content.mission ? 'Section 6 — Content' : undefined)),
          sourceSection: lead.missionStatement ? 'leadership' : (brand.missionStatement ? 'brandingDesign' : 'schoolContent'),
          sourceField: 'missionStatement',
          whyNeeded: 'Defines the day-to-day commitment to academic and holistic development.',
        })
      );

      const eduVal = content.teachingMethodology || (brand.coreValues?.length ? `Core Values: ${brand.coreValues.join(', ')}` : '');
      requirements.push(
        createRequirement({
          key: 'educational_philosophy',
          label: 'Educational Philosophy & Values',
          type: 'textarea',
          required: false,
          value: eduVal,
          source: content.teachingMethodology ? 'Section 6 — Pedagogy' : (brand.coreValues?.length ? 'Section 4 — Brand Identity' : undefined),
          sourceSection: content.teachingMethodology ? 'schoolContent' : 'brandingDesign',
          sourceField: 'teachingMethodology',
          whyNeeded: 'Communicates core values, pedagogical methods, and holistic student support.',
        })
      );

      requirements.push(
        createRequirement({
          key: 'principal_message_teaser',
          label: 'Principal Message Summary',
          type: 'textarea',
          required: false,
          value: lead.principalMessage || '',
          source: lead.principalMessage ? 'Section 3 — Leadership' : undefined,
          sourceSection: 'leadership',
          sourceField: 'principalMessage',
          whyNeeded: 'Teaser snippet from the head of institution inviting visitors to read more.',
        })
      );
      break;
    }

    case 'Leadership & Desk': {
      const resolvedPrincipal = resolveCanonicalPrincipal(intakeData);
      requirements.push(
        createRequirement({
          key: 'principal_name',
          label: 'Principal / Head of Institution',
          type: 'text',
          required: true,
          value: resolvedPrincipal.value || '',
          source: resolvedPrincipal.sourceLabel || resolvedPrincipal.source,
          sourceSection: resolvedPrincipal.sourceSection,
          sourceField: resolvedPrincipal.sourceField,
          hasConflict: resolvedPrincipal.hasConflict,
          conflictingCandidates: resolvedPrincipal.conflictingCandidates,
          whyNeeded: "Used on the Leadership page and Principal's Desk section of the website.",
          missingWarning: "We couldn't find a confirmed Principal / Head of Institution name in the available onboarding data.",
        })
      );

      requirements.push(
        createRequirement({
          key: 'principal_photo',
          label: 'Principal Portrait Photo',
          type: 'image',
          required: false,
          value: lead.principalPhoto?.url || lead.principalPhotoUrl || '',
          referenceUrl: lead.principalPhoto?.url || lead.principalPhotoUrl,
          referenceAssetId: lead.principalPhoto?.id,
          source: (lead.principalPhoto?.url || lead.principalPhotoUrl) ? 'Section 3 — Leadership' : undefined,
          sourceSection: 'leadership',
          sourceField: 'principalPhoto',
          whyNeeded: "Formal portrait displayed on the Principal's Desk and Leadership profile.",
        })
      );

      requirements.push(
        createRequirement({
          key: 'principal_message',
          label: 'Principal Desk Message',
          type: 'textarea',
          required: false,
          value: lead.principalMessage || '',
          source: lead.principalMessage ? 'Section 3 — Leadership' : undefined,
          sourceSection: 'leadership',
          sourceField: 'principalMessage',
          whyNeeded: 'Welcome address articulating leadership vision, pedagogical values, and parent partnership.',
        })
      );

      const memberCount = lead.managementMembers?.length || 0;
      requirements.push(
        createRequirement({
          key: 'management_roster',
          label: `Management Members (${memberCount} recorded)`,
          type: 'text',
          required: false,
          value: memberCount > 0 ? lead.managementMembers.map((m: any) => `${m.name} (${m.designation})`).join(', ') : '',
          source: memberCount > 0 ? 'Section 3 — Management Roster' : undefined,
          sourceSection: 'leadership',
          sourceField: 'managementMembers',
          whyNeeded: 'Governing body credentials, trust directors, and management committee members.',
        })
      );
      break;
    }

    case 'Academics': {
      requirements.push(
        createRequirement({
          key: 'board_affiliation',
          label: 'Educational Board / Affiliation',
          type: 'text',
          required: true,
          value: prof.board || '',
          source: prof.board ? 'Section 1 — Identity' : undefined,
          sourceSection: 'schoolProfile',
          sourceField: 'board',
          whyNeeded: 'Official educational board affiliation (e.g., CBSE, ICSE, State Board).',
          missingWarning: 'Educational board is required for academics curriculum framing.',
        })
      );

      requirements.push(
        createRequirement({
          key: 'academic_session',
          label: 'Current Academic Session',
          type: 'text',
          required: true,
          value: inst.currentAcademicSession || '2026-2027',
          source: inst.currentAcademicSession ? 'Section 7 — Academic Structure' : 'Default Session',
          sourceSection: 'institutionStructure',
          sourceField: 'currentAcademicSession',
          whyNeeded: 'Active academic year referenced across syllabus and examination guidelines.',
        })
      );

      const academicSummary = deriveSchoolAcademicSummary(campuses, inst, prof);
      const classesOffered = academicSummary.isConsolidated && academicSummary.consolidatedClassRange
        ? academicSummary.consolidatedClassRange
        : (academicSummary.isMultiCampus && academicSummary.campusBreakdowns.length > 0
          ? `${academicSummary.headlineSummary} across ${campuses.length} campuses`
          : (inst.classes?.length
            ? `${inst.classes[0].name} to ${inst.classes[inst.classes.length - 1].name} (${inst.classes.length} grades)`
            : (inst.classesOfferedFrom ? `${inst.classesOfferedFrom} to ${inst.classesOfferedTo || ''}` : '')));
      requirements.push(
        createRequirement({
          key: 'classes_offered',
          label: 'Classes & Grades Hierarchy',
          type: 'text',
          required: true,
          value: classesOffered,
          source: academicSummary.hasCampusSpecificData
            ? 'Section 2 — Campus Academic Scope'
            : (classesOffered ? 'Section 7 — Academic Structure' : undefined),
          sourceSection: academicSummary.hasCampusSpecificData ? 'campuses' : 'institutionStructure',
          sourceField: academicSummary.hasCampusSpecificData ? 'classesOffered' : 'classes',
          whyNeeded: 'Defines grade wings from early childhood education through senior secondary.',
          missingWarning: 'Grade hierarchy / classes offered are required.',
        })
      );

      requirements.push(
        createRequirement({
          key: 'medium_of_instruction',
          label: 'Medium of Instruction',
          type: 'text',
          required: true,
          value: Array.isArray(prof.mediumOfInstruction) ? prof.mediumOfInstruction.join(', ') : (prof.mediumOfInstruction || 'English'),
          source: 'Section 1 — Identity',
          sourceSection: 'schoolProfile',
          sourceField: 'mediumOfInstruction',
          whyNeeded: 'Primary instructional languages recognized by board and faculty.',
        })
      );
      break;
    }

    case 'Admissions': {
      requirements.push(
        createRequirement({
          key: 'admission_status',
          label: 'Admission Status Flag',
          type: 'boolean',
          required: true,
          value: adm.admissionsOpen ?? true,
          source: 'Section 10 — Admissions',
          sourceSection: 'admissions',
          sourceField: 'admissionsOpen',
          whyNeeded: 'Public declaration informing prospective parents whether registrations are open.',
        })
      );

      const hasCriteria = Boolean(adm.eligibilityCriteria || adm.ageCriteria);
      requirements.push(
        createRequirement({
          key: 'eligibility_criteria',
          label: 'Eligibility & Age Criteria',
          type: 'textarea',
          required: false,
          value: adm.eligibilityCriteria || adm.ageCriteria || '',
          source: hasCriteria ? 'Section 10 — Admissions' : undefined,
          sourceSection: 'admissions',
          sourceField: 'eligibilityCriteria',
          whyNeeded: 'Age cutoff guidelines and entry qualification rules for applicants.',
        })
      );

      const docsReq = adm.requiredDocuments?.length ? adm.requiredDocuments.join(', ') : '';
      requirements.push(
        createRequirement({
          key: 'required_documents',
          label: 'Documents Required for Admission',
          type: 'text',
          required: false,
          value: docsReq,
          source: docsReq ? 'Section 10 — Admissions' : undefined,
          sourceSection: 'admissions',
          sourceField: 'requiredDocuments',
          whyNeeded: 'Checklist of certificates (birth certificate, previous marksheet, transfer certificate) needed.',
        })
      );

      const admissionContact = adm.contactPerson || adm.admissionPhone || prof.officialPhone || '';
      requirements.push(
        createRequirement({
          key: 'admission_contact_person',
          label: 'Admission Desk Helpline & Contact',
          type: 'text',
          required: true,
          value: admissionContact,
          source: adm.contactPerson || adm.admissionPhone ? 'Section 10 — Admissions' : (prof.officialPhone ? 'Section 1 — Identity' : undefined),
          sourceSection: adm.contactPerson || adm.admissionPhone ? 'admissions' : 'schoolProfile',
          sourceField: 'contactPerson',
          whyNeeded: 'Direct point of contact and dedicated telephone helpline for admissions enquiries.',
          missingWarning: 'Admissions enquiry contact coordinate is required.',
        })
      );
      break;
    }

    case 'Fee Structure': {
      const classFeeStructures = fees.classFeeStructures || [];
      const hasFeeItems = classFeeStructures.length > 0 && classFeeStructures.some((f: any) => f.amount > 0);

      requirements.push(
        createRequirement({
          key: 'fee_session',
          label: 'Fee Academic Session',
          type: 'text',
          required: true,
          value: inst.currentAcademicSession || '2026-2027',
          source: 'Section 7 — Academic Structure',
          sourceSection: 'institutionStructure',
          sourceField: 'currentAcademicSession',
          whyNeeded: 'Session calendar to which the fee schedules apply.',
        })
      );

      // Zero-Fabrication Rule for Fees
      requirements.push(
        createRequirement({
          key: 'fee_table',
          label: 'Class-Wise Fee Schedule',
          type: 'textarea',
          required: true,
          value: hasFeeItems ? `${classFeeStructures.length} fee structures configured.` : '',
          source: hasFeeItems ? 'Section 11 — Fees Configuration' : undefined,
          sourceSection: 'feesConfiguration',
          sourceField: 'classFeeStructures',
          isCriticalConfirmation: true,
          whyNeeded: 'Zero-fabrication fee schedule table published for parents.',
          missingWarning: '⚠ Fee amounts have not been provided. The system generates the table structure, but will never fabricate financial amounts.',
        })
      );

      const cats = fees.feeCategories?.length ? fees.feeCategories.join(', ') : 'Tuition, Annual, Admission';
      requirements.push(
        createRequirement({
          key: 'fee_categories',
          label: 'Fee Categories',
          type: 'text',
          required: false,
          value: cats,
          source: fees.feeCategories?.length ? 'Section 11 — Fees' : 'Standard Categories',
          sourceSection: 'feesConfiguration',
          sourceField: 'feeCategories',
          whyNeeded: 'Breakdown of itemized tuition, term, activity, and transport fees.',
        })
      );
      break;
    }

    case 'Campus Facilities': {
      const hasFacilityPhotos = Object.values(galleryCounts).some((v) => v > 0);
      requirements.push(
        createRequirement({
          key: 'campus_photos_breakdown',
          label: 'Campus Facility Photos (Section 2 Gallery)',
          type: 'gallery_category',
          required: true,
          value: hasFacilityPhotos ? galleryCounts : undefined,
          source: 'Section 2 — Campus Gallery',
          sourceSection: 'campuses',
          sourceField: 'images',
          whyNeeded: 'Facility photographs showcasing classrooms, laboratories, library, and sports grounds.',
          missingWarning: 'No campus facility photos found in Section 2. Upload images in Campus Gallery.',
        })
      );

      const facilityHighlights = fac.availableFacilities?.map((f: any) => f.name).join(', ') ||
        [fac.scienceLab && 'Science Labs', fac.computerLab && 'Computer Lab', fac.library && 'Library', fac.sportsFacilities?.length && 'Sports Complex']
          .filter(Boolean).join(', ');

      requirements.push(
        createRequirement({
          key: 'available_facilities_list',
          label: 'Configured Amenities & Operations',
          type: 'text',
          required: false,
          value: facilityHighlights,
          source: facilityHighlights ? 'Section 15 — Campus Facilities' : undefined,
          sourceSection: 'facilitiesConfig',
          sourceField: 'availableFacilities',
          whyNeeded: 'Summary of campus amenities and specialized infrastructure for parents.',
        })
      );
      break;
    }

    case 'Infrastructure': {
      requirements.push(
        createRequirement({
          key: 'smart_classrooms',
          label: 'Smart Classrooms & ICT Setup',
          type: 'boolean',
          required: false,
          value: fac.smartClassrooms ?? true,
          source: 'Section 15 — Facilities',
          sourceSection: 'facilitiesConfig',
          sourceField: 'smartClassrooms',
          whyNeeded: 'Indicates interactive digital boards and multimedia presentation technology.',
        })
      );

      requirements.push(
        createRequirement({
          key: 'labs_and_library',
          label: 'Laboratories & Resource Centers',
          type: 'text',
          required: false,
          value: `Labs: ${galleryCounts.laboratories} photos, Library: ${galleryCounts.library} photos`,
          source: 'Section 2 — Campus Gallery',
          sourceSection: 'campuses',
          sourceField: 'images',
          whyNeeded: 'Confirms availability of STEM robotics, physics, chemistry, and biology labs.',
        })
      );

      requirements.push(
        createRequirement({
          key: 'security_infrastructure',
          label: 'CCTV & Security Infrastructure',
          type: 'boolean',
          required: false,
          value: fac.cctvInstalled ?? true,
          source: 'Section 15 — Facilities',
          sourceSection: 'facilitiesConfig',
          sourceField: 'cctvInstalled',
          whyNeeded: 'Safety disclosure regarding 24x7 CCTV coverage and campus perimeter security.',
        })
      );
      break;
    }

    case 'Photo & Video Gallery': {
      const hasGalleryPhotos = Object.values(galleryCounts).some((v) => v > 0);
      requirements.push(
        createRequirement({
          key: 'gallery_categories',
          label: 'Website Gallery Photo Categories',
          type: 'gallery_category',
          required: true,
          value: hasGalleryPhotos ? galleryCounts : undefined,
          source: 'Section 2 — Campus Gallery',
          sourceSection: 'campuses',
          sourceField: 'images',
          isCriticalConfirmation: hasGalleryPhotos,
          whyNeeded: 'Reuses curated WebP photos from Section 2 to construct public photo and video albums.',
          missingWarning: 'Reuses existing WebP photos from Section 2. Upload photos in Campus Gallery.',
        })
      );
      break;
    }

    case 'Events & News': {
      requirements.push(
        createRequirement({
          key: 'events_cms_structure',
          label: 'Events & News CMS Publishing Workflow',
          type: 'boolean',
          required: true,
          value: true,
          source: 'CMS Standard Engine',
          isCmsFutureContent: true,
          whyNeeded: 'CMS engine enabling editorial staff to publish fests, competitions, and news.',
        })
      );

      requirements.push(
        createRequirement({
          key: 'event_categories',
          label: 'Event Categories',
          type: 'text',
          required: false,
          value: 'Academic, Sports, Cultural, Celebrations, Circulars',
          isCmsFutureContent: true,
          isGenerated: true,
          whyNeeded: 'Standard taxonomic categories for sorting future school announcements.',
        })
      );
      break;
    }

    case 'Notices & Circulars': {
      requirements.push(
        createRequirement({
          key: 'notices_cms_structure',
          label: 'Official Notices & PDF Circular Archive',
          type: 'boolean',
          required: true,
          value: true,
          source: 'CMS Standard Engine',
          isCmsFutureContent: true,
          whyNeeded: 'Statutory circular archive allowing administrative staff to upload parent notifications.',
        })
      );
      break;
    }

    case 'Results & Achievements': {
      const achievementsCount = content.awardsAndAchievements?.length || 0;
      requirements.push(
        createRequirement({
          key: 'awards_achievements_record',
          label: `Recorded School Achievements (${achievementsCount} items)`,
          type: 'text',
          required: false,
          value: achievementsCount > 0 ? content.awardsAndAchievements.map((a: any) => a.title).join(', ') : '',
          source: achievementsCount > 0 ? 'Section 6 — Pedagogy & Story' : undefined,
          sourceSection: 'schoolContent',
          sourceField: 'awardsAndAchievements',
          isCmsFutureContent: achievementsCount === 0,
          whyNeeded: 'Board toppers, olympiad laurels, and athletic achievements recorded for publication.',
        })
      );
      break;
    }

    case 'Faculty Roster': {
      const staffMembersCount = staff.staffMembers?.length || 0;
      const totalStaff = staff.teachingStaffCount || staff.estimatedTotalStaff || staffMembersCount;
      requirements.push(
        createRequirement({
          key: 'staff_directory_summary',
          label: `Staff Directory (${totalStaff || 'Pending'} members)`,
          type: 'text',
          required: false,
          value: totalStaff ? `${totalStaff} faculty members recorded in Section 8.` : '',
          source: totalStaff ? 'Section 8 — Staff & Faculty' : undefined,
          sourceSection: 'staffFaculty',
          sourceField: 'staffMembers',
          whyNeeded: 'Public staff directory populated from Section 8 without duplicating data entry.',
        })
      );
      break;
    }

    case 'Student Life': {
      const houses = inst.houseNames || [];
      requirements.push(
        createRequirement({
          key: 'house_system',
          label: 'House System',
          type: 'text',
          required: false,
          value: houses.length ? houses.join(', ') : '',
          source: houses.length ? 'Section 9 — Student Configuration' : undefined,
          sourceSection: 'institutionStructure',
          sourceField: 'houseNames',
          whyNeeded: 'Student house divisions (e.g. Red, Blue, Green, Gold) for school competitions.',
        })
      );

      requirements.push(
        createRequirement({
          key: 'student_activity_photos',
          label: 'Student Activity Photos',
          type: 'text',
          required: false,
          value: `${galleryCounts.activities} activity photos available from Campus Gallery`,
          source: 'Section 2 — Campus Gallery',
          sourceSection: 'campuses',
          sourceField: 'images',
          whyNeeded: 'Co-curricular and club activities coverage from campus gallery.',
        })
      );
      break;
    }

    case 'Sports & Activities': {
      const sportsList = fac.sportsFacilities?.length ? fac.sportsFacilities.join(', ') : '';
      requirements.push(
        createRequirement({
          key: 'sports_offered',
          label: 'Sports Disciplines & Coaching',
          type: 'text',
          required: false,
          value: sportsList,
          source: sportsList ? 'Section 15 — Campus Facilities' : undefined,
          sourceSection: 'facilitiesConfig',
          sourceField: 'sportsFacilities',
          whyNeeded: 'Highlights sports disciplines (cricket, football, basketball, yoga, martial arts).',
        })
      );

      requirements.push(
        createRequirement({
          key: 'sports_photos',
          label: 'Sports & Playground Photos',
          type: 'text',
          required: false,
          value: `${galleryCounts.sports_playground} sports photos available from Campus Gallery`,
          source: 'Section 2 — Campus Gallery',
          sourceSection: 'campuses',
          sourceField: 'images',
          whyNeeded: 'Outdoor grounds and indoor sports pavilion photographs.',
        })
      );
      break;
    }

    case 'Transport Information': {
      const isEnabled = trans.enabled ?? false;
      requirements.push(
        createRequirement({
          key: 'transport_availability',
          label: 'School Transport Service Available',
          type: 'boolean',
          required: true,
          value: isEnabled,
          source: 'Section 14 — Transport',
          sourceSection: 'transportConfig',
          sourceField: 'enabled',
          whyNeeded: 'Confirms whether the institution operates a dedicated bus/van transport fleet.',
        })
      );

      const routesCount = trans.routes?.length || trans.routesCount || 0;
      requirements.push(
        createRequirement({
          key: 'transport_routes_summary',
          label: `Configured Bus Routes (${routesCount} routes)`,
          type: 'text',
          required: false,
          value: routesCount > 0 ? `${routesCount} routes configured with pickup points.` : '',
          source: routesCount > 0 ? 'Section 14 — Transport' : undefined,
          sourceSection: 'transportConfig',
          sourceField: 'routes',
          isNotApplicable: !isEnabled,
          whyNeeded: 'Pickup coordinates and safety tracking information for parent commuting.',
        })
      );
      break;
    }

    case 'Hostel Information': {
      const isHostelEnabled = hostel.enabled || prof.residentialStatus === 'residential' || prof.residentialStatus === 'both_day_and_residential';
      if (!isHostelEnabled) {
        requirements.push(
          createRequirement({
            key: 'hostel_status_disabled',
            label: 'Hostel Facility Status',
            type: 'text',
            required: false,
            value: '✓ Hostel page disabled — school does not provide hostel facilities.',
            source: 'Section 17 — Hostel Configuration',
            sourceSection: 'hostelConfig',
            sourceField: 'enabled',
            isNotApplicable: true,
            whyNeeded: 'Hostel page is disabled because school does not operate residential boarding.',
          })
        );
      } else {
        requirements.push(
          createRequirement({
            key: 'hostel_capacity',
            label: 'Hostel Capacity & Facilities',
            type: 'text',
            required: true,
            value: hostel.totalCapacity ? `Total Capacity: ${hostel.totalCapacity} students` : '',
            source: hostel.totalCapacity ? 'Section 17 — Hostel' : undefined,
            sourceSection: 'hostelConfig',
            sourceField: 'totalCapacity',
            whyNeeded: 'Residential boarding facilities, dormitory capacity, and pastoral care.',
            missingWarning: 'Hostel student capacity is required for residential schools.',
          })
        );
      }
      break;
    }

    case 'Library Desk': {
      const bookCount = lib.bookCountEstimate;
      requirements.push(
        createRequirement({
          key: 'library_collection',
          label: 'Library Book Count & Collection',
          type: 'text',
          required: false,
          value: bookCount ? `Approx ${bookCount} books & journals` : '',
          source: bookCount ? 'Section 16 — Library' : undefined,
          sourceSection: 'libraryConfig',
          sourceField: 'bookCountEstimate',
          whyNeeded: 'Highlights library volumes, reference books, and digital encyclopedias.',
        })
      );

      requirements.push(
        createRequirement({
          key: 'library_photos',
          label: 'Library Photos',
          type: 'text',
          required: false,
          value: `${galleryCounts.library} photos available from Campus Gallery`,
          source: 'Section 2 — Campus Gallery',
          sourceSection: 'campuses',
          sourceField: 'images',
          whyNeeded: 'Reading room and learning resource center photos.',
        })
      );
      break;
    }

    case 'Careers': {
      requirements.push(
        createRequirement({
          key: 'careers_contact_email',
          label: 'Careers Application Desk Email',
          type: 'email',
          required: true,
          value: prof.officialEmail || '',
          source: prof.officialEmail ? 'Section 1 — Identity' : undefined,
          sourceSection: 'schoolProfile',
          sourceField: 'officialEmail',
          whyNeeded: 'Official mailbox for prospective educators and staff to submit CVs.',
          missingWarning: 'Official email is required for career enquiry routing.',
        })
      );

      requirements.push(
        createRequirement({
          key: 'careers_cms_structure',
          label: 'Vacancies CMS Module',
          type: 'boolean',
          required: true,
          value: true,
          isCmsFutureContent: true,
          whyNeeded: 'Publishing engine allowing school HR to list open faculty positions.',
        })
      );
      break;
    }

    case 'Contact Us': {
      requirements.push(
        createRequirement({
          key: 'contact_school_name',
          label: 'School Name',
          type: 'text',
          required: true,
          value: prof.schoolName || '',
          source: prof.schoolName ? 'Section 1 — Identity' : undefined,
          sourceSection: 'schoolProfile',
          sourceField: 'schoolName',
          whyNeeded: 'Official public name of the school displayed on contact cards and header.',
        })
      );

      const fullAddr = targetCampus.address
        ? `${targetCampus.address}${targetCampus.addressLine2 ? ', ' + targetCampus.addressLine2 : ''}, ${targetCampus.city || ''}, ${targetCampus.state || ''} - ${targetCampus.pin || ''}`
        : (prof.address ? `${prof.address}, ${prof.city || ''}, ${prof.state || ''} - ${prof.pin || ''}` : '');

      requirements.push(
        createRequirement({
          key: 'contact_address',
          label: `Official Campus Address (${targetCampus.name || 'Main'})`,
          type: 'textarea',
          required: true,
          value: fullAddr,
          source: targetCampus.address ? 'Section 2 — Campus' : (prof.address ? 'Section 1 — Identity' : undefined),
          sourceSection: targetCampus.address ? 'campuses' : 'schoolProfile',
          sourceField: 'address',
          whyNeeded: 'Physical location and postal communication address for parents and visitors.',
        })
      );

      requirements.push(
        createRequirement({
          key: 'contact_phone',
          label: 'Helpline Telephone Numbers',
          type: 'phone',
          required: true,
          value: targetCampus.contactPhone || prof.officialPhone || '',
          source: targetCampus.contactPhone ? 'Section 2 — Campus' : (prof.officialPhone ? 'Section 1 — Identity' : undefined),
          sourceSection: targetCampus.contactPhone ? 'campuses' : 'schoolProfile',
          sourceField: targetCampus.contactPhone ? 'contactPhone' : 'officialPhone',
          whyNeeded: 'Primary public telephone helpline for parent enquiries and admissions.',
        })
      );

      requirements.push(
        createRequirement({
          key: 'contact_email',
          label: 'Official Enquiries Email',
          type: 'email',
          required: true,
          value: targetCampus.contactEmail || prof.officialEmail || '',
          source: targetCampus.contactEmail ? 'Section 2 — Campus' : (prof.officialEmail ? 'Section 1 — Identity' : undefined),
          sourceSection: targetCampus.contactEmail ? 'campuses' : 'schoolProfile',
          sourceField: targetCampus.contactEmail ? 'contactEmail' : 'officialEmail',
          whyNeeded: 'Primary email inbox for public enquiries, feedback, and parent communications.',
        })
      );

      const mapsUrl = targetCampus.googleMapsUrl || targetCampus.googleMapsLink || prof.googleMapsUrl;
      requirements.push(
        createRequirement({
          key: 'google_maps_location',
          label: 'Google Maps Link / Coordinates',
          type: 'reference',
          required: false,
          value: mapsUrl || '',
          source: mapsUrl ? (targetCampus.googleMapsUrl ? 'Section 2 — Campus Location' : 'Section 1 — Identity') : undefined,
          sourceSection: targetCampus.googleMapsUrl ? 'campuses' : 'schoolProfile',
          sourceField: 'googleMapsUrl',
          whyNeeded: 'Interactive map navigation to help parents locate the school campus.',
        })
      );
      break;
    }

    case 'Mandatory Disclosures': {
      // Structured Regulatory Engine with Zero Fabrication
      const board = prof.board || 'CBSE';
      requirements.push(
        createRequirement({
          key: 'disclosure_authority',
          label: 'Regulatory / Affiliation Body',
          type: 'select',
          required: true,
          value: board,
          options: ['CBSE', 'CISCE', 'State Board', 'IB', 'Cambridge', 'Other'],
          source: prof.board ? 'Section 1 — Identity' : undefined,
          sourceSection: 'schoolProfile',
          sourceField: 'board',
          whyNeeded: 'Statutory education board governing public disclosure formats and compliance.',
        })
      );

      requirements.push(
        createRequirement({
          key: 'affiliation_number',
          label: 'Affiliation Number',
          type: 'text',
          required: true,
          value: prof.affiliationNumber || '',
          source: prof.affiliationNumber ? 'Section 1 — Identity' : undefined,
          sourceSection: 'schoolProfile',
          sourceField: 'affiliationNumber',
          whyNeeded: 'Statutory board affiliation number required on all official public disclosures.',
          missingWarning: 'Not provided — requires confirmation from school credentials.',
        })
      );

      requirements.push(
        createRequirement({
          key: 'school_code',
          label: 'School Code / Registration No.',
          type: 'text',
          required: true,
          value: prof.schoolCode || prof.udiseCode || '',
          source: (prof.schoolCode || prof.udiseCode) ? 'Section 1 — Identity' : undefined,
          sourceSection: 'schoolProfile',
          sourceField: prof.schoolCode ? 'schoolCode' : 'udiseCode',
          whyNeeded: 'Official examination and census code issued by education authorities.',
          missingWarning: 'Not provided — requires confirmation.',
        })
      );

      requirements.push(
        createRequirement({
          key: 'academic_session',
          label: 'Academic Session',
          type: 'text',
          required: true,
          value: inst.currentAcademicSession || '2026-2027',
          source: 'Section 7 — Academic Structure',
          sourceSection: 'institutionStructure',
          sourceField: 'currentAcademicSession',
          whyNeeded: 'Current operational academic cycle governing disclosure schedules.',
        })
      );

      const canonicalPrincipal = resolveCanonicalPrincipal(intakeData);
      requirements.push(
        createRequirement({
          key: 'principal_head',
          label: 'Principal / Head of Institution',
          type: 'text',
          required: true,
          value: canonicalPrincipal.value,
          source: canonicalPrincipal.source,
          sourceSection: canonicalPrincipal.sourceSection,
          sourceField: canonicalPrincipal.sourceField,
          hasConflict: canonicalPrincipal.hasConflict,
          conflictingCandidates: canonicalPrincipal.conflictingCandidates,
          whyNeeded: 'Statutory signatory and administrative head published on mandatory disclosure index.',
          missingWarning: 'Principal name is legally required for public board compliance disclosures.',
        })
      );

      const schoolAddr = primaryCampus.address
        ? `${primaryCampus.address}, ${primaryCampus.city || ''}, ${primaryCampus.state || ''} - ${primaryCampus.pin || ''}`
        : (prof.address ? `${prof.address}, ${prof.city || ''}, ${prof.state || ''} - ${prof.pin || ''}` : '');

      requirements.push(
        createRequirement({
          key: 'official_address',
          label: 'Official School Address',
          type: 'textarea',
          required: true,
          value: schoolAddr,
          source: primaryCampus.address ? 'Section 2 — Campus' : (prof.address ? 'Section 1 — Identity' : undefined),
          sourceSection: primaryCampus.address ? 'campuses' : 'schoolProfile',
          sourceField: 'address',
          whyNeeded: 'Registered institutional address for statutory board correspondence.',
        })
      );

      // Statutory Document Links from Asset Checklist
      const appendixIxDoc = statutoryDocs.get('cert-mandatory-disclosure');
      const affDoc = statutoryDocs.get('cert-affiliation');
      const safetyDoc = statutoryDocs.get('cert-safety');

      requirements.push(
        createRequirement({
          key: 'mandatory_disclosure_pdf',
          label: 'Mandatory Public Disclosure PDF (Appendix IX)',
          type: 'document',
          required: true,
          value: appendixIxDoc?.fileUrl || '',
          referenceAssetId: appendixIxDoc?.id,
          referenceUrl: appendixIxDoc?.fileUrl,
          referenceFileName: appendixIxDoc?.fileName || appendixIxDoc?.title,
          source: appendixIxDoc?.fileUrl ? 'Section 25 — Asset Checklist' : undefined,
          sourceSection: 'assetChecklist',
          sourceField: 'cert-mandatory-disclosure',
          whyNeeded: 'Mandatory CBSE / state board composite public disclosure document.',
          missingWarning: 'Upload or confirm Mandatory Public Disclosure PDF (Appendix IX).',
        })
      );

      requirements.push(
        createRequirement({
          key: 'affiliation_letter_doc',
          label: 'Board Affiliation Letter / Grant Order',
          type: 'document',
          required: true,
          value: affDoc?.fileUrl || '',
          referenceAssetId: affDoc?.id,
          referenceUrl: affDoc?.fileUrl,
          referenceFileName: affDoc?.fileName || affDoc?.title,
          source: affDoc?.fileUrl ? 'Section 25 — Asset Checklist' : undefined,
          sourceSection: 'assetChecklist',
          sourceField: 'cert-affiliation',
          whyNeeded: 'Formal recognition grant order proving active affiliation with education board.',
          missingWarning: 'Affiliation letter is statutory for Board public compliance.',
        })
      );

      requirements.push(
        createRequirement({
          key: 'building_fire_safety_doc',
          label: 'Building & Fire Safety NOC Certificates',
          type: 'document',
          required: false,
          value: safetyDoc?.fileUrl || '',
          referenceAssetId: safetyDoc?.id,
          referenceUrl: safetyDoc?.fileUrl,
          referenceFileName: safetyDoc?.fileName || safetyDoc?.title,
          source: safetyDoc?.fileUrl ? 'Section 25 — Asset Checklist' : undefined,
          sourceSection: 'assetChecklist',
          sourceField: 'cert-safety',
          whyNeeded: 'Municipal safety certificates demonstrating student and campus safety.',
        })
      );
      break;
    }

    case 'Privacy Policy': {
      requirements.push(
        createRequirement({
          key: 'school_name',
          label: 'School Legal Identity',
          type: 'text',
          required: true,
          value: prof.legalInstitutionName || prof.schoolName || '',
          source: (prof.legalInstitutionName || prof.schoolName) ? 'Section 1 — Identity' : undefined,
          sourceSection: 'schoolProfile',
          sourceField: prof.legalInstitutionName ? 'legalInstitutionName' : 'schoolName',
          whyNeeded: 'Legal entity name cited in website privacy disclosures.',
        })
      );

      requirements.push(
        createRequirement({
          key: 'contact_email',
          label: 'Official Contact / Grievance Email',
          type: 'email',
          required: true,
          value: prof.officialEmail || '',
          source: prof.officialEmail ? 'Section 1 — Identity' : undefined,
          sourceSection: 'schoolProfile',
          sourceField: 'officialEmail',
          whyNeeded: 'Privacy grievance officer and public contact email address.',
        })
      );

      requirements.push(
        createRequirement({
          key: 'generated_template_status',
          label: 'Standard Website Privacy Policy Template',
          type: 'generated',
          required: true,
          value: true,
          source: 'Generated Standard Template',
          isGenerated: true,
          whyNeeded: 'Auto-generated privacy policy compliant with Indian Digital Personal Data Protection guidelines.',
        })
      );
      break;
    }

    default: {
      // Fallback custom or unmapped page
      requirements.push(
        createRequirement({
          key: 'page_title',
          label: 'Page Title',
          type: 'text',
          required: true,
          value: pageKey,
          whyNeeded: 'Public page headline and navigation title.',
        })
      );
      requirements.push(
        createRequirement({
          key: 'page_content',
          label: 'Page Content / Notes',
          type: 'textarea',
          required: false,
          value: '',
          whyNeeded: 'Custom specifications or editorial guidance for page development.',
        })
      );
      break;
    }
  }

  return requirements;
}

/**
 * Generates neutral, standard school website privacy policy copy based on confirmed features.
 */
export function generatePrivacyPolicyTemplate(
  config: WebsitePrivacyPolicyConfig,
  schoolName: string,
  contactEmail: string
): string {
  const effectiveName = schoolName || 'Our School';
  const effectiveEmail = contactEmail || 'privacy@school.edu.in';

  const collectedDataItems: string[] = [];
  if (config.collectsContactFormSubmissions) {
    collectedDataItems.push('Contact information (name, email address, telephone number, and messages submitted via website enquiry forms).');
  }
  if (config.collectsAdmissionEnquiries) {
    collectedDataItems.push('Student admission details (prospective student name, date of birth, grade applying for, and parent/guardian contact coordinates).');
  }
  if (config.acceptsDocumentUploads) {
    collectedDataItems.push('Academic credentials and statutory documents uploaded for admissions or verification purposes.');
  }
  if (config.acceptsOnlinePayments) {
    collectedDataItems.push('Payment transaction identifiers and receipts (note: card and banking credentials are processed directly through secure PCI-DSS compliant payment gateways and are never stored on our servers).');
  }
  if (config.offersNewsletterSubscription) {
    collectedDataItems.push('Email addresses for school newsletter, circular, and announcement subscriptions.');
  }
  if (config.usesCookies) {
    collectedDataItems.push('Session cookies and preferences to ensure responsive navigation across our digital portal.');
  }
  if (config.usesAnalytics) {
    collectedDataItems.push('Aggregated analytical usage statistics (browser type, device screen size, referring page) to optimize site accessibility.');
  }

  return `PRIVACY POLICY FOR ${effectiveName.toUpperCase()}
Effective Date: Academic Session 2026–27

1. INTRODUCTION
${effectiveName} ("School", "we", "our", or "us") respects the privacy of students, parents, guardians, and website visitors. This Privacy Policy governs the manner in which our official website collects, utilizes, maintains, and safeguards information collected from users.

2. INFORMATION WE COLLECT
We may collect personal identification information from users in a variety of ways, including when users visit our site, register for admission enquiries, fill out a contact form, or access parent resources:
${collectedDataItems.map((item, idx) => `  ${idx + 1}. ${item}`).join('\n')}

3. HOW WE USE COLLECTED INFORMATION
Information collected is utilized exclusively for legitimate educational and administrative functions:
  • To respond to prospective student admission enquiries and schedule campus visits.
  • To transmit official school circulars, academic notices, and emergency alerts.
  • To comply with statutory board disclosure regulations and state education directives.
  • To improve our website performance and parent engagement workflows.

4. DATA PROTECTION & SHARING
We adopt rigorous data collection, storage, and security practices to protect against unauthorized access or alteration of personal data. We do NOT sell, trade, or rent student or parent personal identification information to commercial entities or third-party advertisers.

5. COOKIES & TRACKING
Our website may use "cookies" to enhance user experience. Users may choose to set their web browser to refuse cookies or to alert when cookies are being sent.

6. CONTACT & DATA PROTECTION GRIEVANCE
If you have any questions regarding this Privacy Policy or wish to request correction of your submitted information, please contact:
Data Protection Desk: ${config.dataProtectionContact || effectiveName}
Official Email: ${effectiveEmail}
Official Address: Main Campus Secretariat`;
}

/**
 * Generates structured Mandatory Disclosure Configuration
 */
export function generateMandatoryDisclosureConfig(
  intakeData: Partial<UniversalIntakeData>
): WebsiteMandatoryDisclosureConfig {
  const prof = intakeData.schoolProfile || ({} as any);
  const inst = intakeData.institutionStructure || ({} as any);
  const fac = intakeData.facilitiesConfig || ({} as any);
  const staff = intakeData.staffFaculty || ({} as any);
  const campuses = intakeData.campuses || [];
  const primaryCampus = campuses.find((c) => c.isMainCampus) || campuses[0] || ({} as any);
  const statutoryDocs = findStatutoryDocumentsInChecklist(intakeData);

  const appendixIxDoc = statutoryDocs.get('cert-mandatory-disclosure');
  const affDoc = statutoryDocs.get('cert-affiliation');
  const safetyDoc = statutoryDocs.get('cert-safety');
  const recogDoc = statutoryDocs.get('cert-recognition');

  const rawBoard = (prof.board || 'CBSE').toUpperCase();
  let regulatoryBody: WebsiteMandatoryDisclosureConfig['regulatoryBody'] = 'CBSE';
  if (rawBoard.includes('CISCE') || rawBoard.includes('ICSE')) regulatoryBody = 'CISCE';
  else if (rawBoard.includes('STATE')) regulatoryBody = 'State Board';
  else if (rawBoard.includes('IB')) regulatoryBody = 'IB';
  else if (rawBoard.includes('CAMBRIDGE')) regulatoryBody = 'Cambridge';

  const fullAddr = primaryCampus.address
    ? `${primaryCampus.address}, ${primaryCampus.city || ''}, ${primaryCampus.state || ''} - ${primaryCampus.pin || ''}`
    : (prof.address ? `${prof.address}, ${prof.city || ''}, ${prof.state || ''} - ${prof.pin || ''}` : '');

  const canonicalPrincipal = resolveCanonicalPrincipal(intakeData);

  return {
    regulatoryBody,
    affiliationNumber: prof.affiliationNumber || '',
    schoolCode: prof.schoolCode || prof.udiseCode || '',
    udiseCode: prof.udiseCode || '',
    academicSession: inst.currentAcademicSession || '2026-2027',
    principalName: canonicalPrincipal.value,
    schoolAddress: fullAddr,
    contactPhone: primaryCampus.contactPhone || prof.officialPhone || '',
    contactEmail: primaryCampus.contactEmail || prof.officialEmail || '',
    infrastructureSummary: fac.classroomsCount ? `${fac.classroomsCount} classrooms, equipped laboratories & campus facilities.` : undefined,
    facultySummary: staff.teachingStaffCount ? `${staff.teachingStaffCount} teaching faculty members.` : undefined,
    autoGenerateStandardStructure: true,
    statutoryDocuments: [
      {
        documentKey: 'cert-mandatory-disclosure',
        title: 'Mandatory Public Disclosure (Appendix IX)',
        status: appendixIxDoc?.fileUrl ? 'found' : 'missing',
        source: 'Section 25 — Asset Checklist',
        referenceAssetId: appendixIxDoc?.id,
        fileUrl: appendixIxDoc?.fileUrl,
      },
      {
        documentKey: 'cert-affiliation',
        title: 'Affiliation / Extension Grant Letter',
        status: affDoc?.fileUrl ? 'found' : 'missing',
        source: 'Section 25 — Asset Checklist',
        referenceAssetId: affDoc?.id,
        fileUrl: affDoc?.fileUrl,
      },
      {
        documentKey: 'cert-safety',
        title: 'Building & Fire Safety Certificates',
        status: safetyDoc?.fileUrl ? 'found' : 'missing',
        source: 'Section 25 — Asset Checklist',
        referenceAssetId: safetyDoc?.id,
        fileUrl: safetyDoc?.fileUrl,
      },
      {
        documentKey: 'cert-recognition',
        title: 'State Recognition Certificate / NOC',
        status: recogDoc?.fileUrl ? 'found' : 'missing',
        source: 'Section 25 — Asset Checklist',
        referenceAssetId: recogDoc?.id,
        fileUrl: recogDoc?.fileUrl,
      },
    ],
  };
}

/**
 * Evaluates readiness status for a page configuration with strict validation:
 * - A page is ONLY 'ready' when all required actionable fields are confirmed, generated, or future CMS.
 * - If any required actionable field is missing, it is 'incomplete'.
 * - If no required field is missing, but some required fields are prefilled / need confirmation, it is 'needs_review'.
 */
export function evaluatePageStatus(
  requirements: WebsitePageRequirement[],
  pageKey: string
): { status: 'ready' | 'needs_review' | 'incomplete'; readyCount: number; totalCount: number } {
  const actionableRequirements = requirements.filter((r) => r.status !== 'not_applicable');
  const totalCount = actionableRequirements.length;

  // Future CMS requirements do not block configuration readiness
  const blockingRequirements = actionableRequirements.filter((r) => r.required && !r.isCmsFutureContent);
  const missingBlocking = blockingRequirements.filter((r) => r.status === 'missing');
  const unconfirmedBlocking = blockingRequirements.filter(
    (r) => r.status === 'needs_confirmation' || r.status === 'prefilled' || r.status === 'auto_filled'
  );

  const readyCount = actionableRequirements.filter(
    (r) => r.status === 'confirmed' || r.status === 'generated' || r.isCmsFutureContent || (r.status as string) === 'optional'
  ).length;

  if (missingBlocking.length > 0) {
    return { status: 'incomplete', readyCount, totalCount };
  } else if (unconfirmedBlocking.length > 0) {
    return { status: 'needs_review', readyCount, totalCount };
  } else {
    return { status: 'ready', readyCount, totalCount };
  }
}

/**
 * Builds or refreshes full WebsitePageConfiguration dictionary for all selected pages
 */
export function buildWebsitePageConfigurations(
  intakeData: Partial<UniversalIntakeData>,
  existingConfigs: Record<string, WebsitePageConfiguration> = {}
): Record<string, WebsitePageConfiguration> {
  const selectedPageKeys = intakeData.websiteRequirements?.requiredPages || [
    'Home', 'About School', 'Leadership & Desk', 'Academics', 'Admissions',
    'Fee Structure', 'Campus Facilities', 'Photo & Video Gallery', 'Events & News',
    'Notices & Circulars', 'Mandatory Disclosures', 'Contact Us'
  ];

  const configs: Record<string, WebsitePageConfiguration> = {};

  for (const pageKey of selectedPageKeys) {
    const def = STANDARD_WEBSITE_PAGES.find((p) => p.pageKey === pageKey) || {
      pageKey,
      label: pageKey,
      slug: pageKey.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: `${pageKey} public page`,
      recommendedSections: ['Overview', 'Details', 'Contact'],
      isCmsSupported: true,
    };

    const existing = existingConfigs[pageKey];
    const applicableCampusIds = existing?.applicableCampusIds || ['all'];
    const requirements = autoFillPageRequirements(pageKey, intakeData, applicableCampusIds[0]);

    // Preserve user confirmed overrides and user edited values if existing
    if (existing?.requirements) {
      for (const req of requirements) {
        const match = existing.requirements.find((r) => r.key === req.key);
        if (match && (match.userConfirmed || match.status === 'confirmed')) {
          req.value = match.value;
          req.userConfirmed = true;
          req.status = 'confirmed';
          req.hasConflict = false;
        } else if (match && match.userEdited && match.value !== undefined && match.value !== '') {
          req.value = match.value;
          req.status = 'needs_confirmation';
          req.userConfirmed = false;
          req.userEdited = true;
          if (match.hasConflict !== undefined) req.hasConflict = match.hasConflict;
        }
      }
    }

    const { status, readyCount, totalCount } = evaluatePageStatus(requirements, pageKey);

    configs[pageKey] = {
      pageKey,
      label: def.label,
      slug: def.slug,
      enabled: true,
      status,
      readyCount,
      totalCount,
      requirements,
      recommendedSections: def.recommendedSections,
      applicableCampusIds,
      isCustom: false,
    };
  }

  // Also include custom pages
  const customPages = intakeData.websiteRequirements?.customPages || [];
  for (const cp of customPages) {
    const key = `custom_${cp.id}`;
    const customReqs: WebsitePageRequirement[] = (cp.customRequirements || []).map((cr) => ({
      key: `cr_${cr.id}`,
      label: cr.title,
      type: (cr.type || 'text') as any,
      required: false,
      value: cr.description || '',
      status: 'confirmed' as const,
      userConfirmed: true,
      whyNeeded: 'Custom requirement configured by institution administrator.',
    }));

    // If custom requirements are empty, provide a default content requirement
    if (customReqs.length === 0) {
      customReqs.push({
        key: 'content_desc',
        label: 'Page Content & Specification',
        type: 'textarea',
        required: false,
        value: cp.purpose || cp.contentRequirement || '',
        status: 'confirmed',
        userConfirmed: true,
        whyNeeded: 'Custom specifications or editorial guidance for page development.',
      });
    }

    configs[key] = {
      pageKey: key,
      label: cp.title || 'Custom Page',
      slug: cp.slug || 'custom-page',
      enabled: true,
      status: 'ready',
      readyCount: customReqs.length,
      totalCount: customReqs.length,
      requirements: customReqs,
      recommendedSections: ['Custom Content'],
      isCustom: true,
      customPageType: cp.pageType || 'information',
    };
  }

  return configs;
}

export interface WebsiteRequirementAggregates {
  totalPages: number;
  readyPages: number;
  needsReviewPages: number;
  incompletePages: number;
  totalRequirements: number;
  confirmedCount: number;
  prefilledCount: number;
  needsConfirmationCount: number;
  missingCount: number;
  generatedCount: number;
  futureCmsCount: number;
  actionRequiredQueue: Array<{
    pageKey: string;
    pageLabel: string;
    requirement: WebsitePageRequirement;
  }>;
}

/**
 * Aggregates all requirement states across configured pages.
 * Acts as the single source of truth for page summaries, filter counts, and action queue.
 */
export function aggregateWebsiteRequirementStates(
  pageConfigurations: Record<string, WebsitePageConfiguration>
): WebsiteRequirementAggregates {
  let totalPages = 0;
  let readyPages = 0;
  let needsReviewPages = 0;
  let incompletePages = 0;

  let totalRequirements = 0;
  let confirmedCount = 0;
  let prefilledCount = 0;
  let needsConfirmationCount = 0;
  let missingCount = 0;
  let generatedCount = 0;
  let futureCmsCount = 0;

  const actionRequiredQueue: WebsiteRequirementAggregates['actionRequiredQueue'] = [];

  for (const [, cfg] of Object.entries(pageConfigurations)) {
    if (!cfg.enabled) continue;
    totalPages++;

    if (cfg.status === 'ready') readyPages++;
    else if (cfg.status === 'needs_review') needsReviewPages++;
    else if (cfg.status === 'incomplete') incompletePages++;

    for (const req of cfg.requirements || []) {
      if (req.status === 'not_applicable') continue;
      totalRequirements++;

      switch (req.status) {
        case 'confirmed':
          confirmedCount++;
          break;
        case 'prefilled':
        case 'auto_filled':
          prefilledCount++;
          break;
        case 'needs_confirmation':
          needsConfirmationCount++;
          if (req.required) {
            actionRequiredQueue.push({
              pageKey: cfg.pageKey,
              pageLabel: cfg.label,
              requirement: req,
            });
          }
          break;
        case 'missing':
          missingCount++;
          if (req.required && !req.isCmsFutureContent) {
            actionRequiredQueue.push({
              pageKey: cfg.pageKey,
              pageLabel: cfg.label,
              requirement: req,
            });
          }
          break;
        case 'generated':
          generatedCount++;
          break;
        case 'future_cms':
          futureCmsCount++;
          break;
        default:
          if (req.userConfirmed) confirmedCount++;
          break;
      }
    }
  }

  return {
    totalPages,
    readyPages,
    needsReviewPages,
    incompletePages,
    totalRequirements,
    confirmedCount,
    prefilledCount,
    needsConfirmationCount,
    missingCount,
    generatedCount,
    futureCmsCount,
    actionRequiredQueue,
  };
}

/**
 * Generates the complete, normalized developer specification consumed downstream
 */
export function generateWebsiteDeveloperSpec(
  intakeData: Partial<UniversalIntakeData>
): WebsiteDeveloperSpecification {
  const configs = buildWebsitePageConfigurations(intakeData, intakeData.websiteRequirements?.pageConfigurations);
  const prof = intakeData.schoolProfile || ({} as any);
  const campuses = intakeData.campuses || [];

  const pages: WebsiteDeveloperSpecification['pages'] = [];
  const navigation: WebsiteDeveloperSpecification['navigation'] = [];
  const pageRequirements: Record<string, WebsitePageRequirement[]> = {};
  const contentSources: Record<string, string[]> = {};
  const assetReferences: Record<string, any> = {};
  const documentReferences: Record<string, any> = {};
  const generatedTemplates: Record<string, string> = {};
  const missingRequirements: WebsiteDeveloperSpecification['missingRequirements'] = [];

  let readyPages = 0;
  let needsReviewPages = 0;
  let templatePages = 0;
  let cmsFuturePages = 0;

  let order = 1;
  for (const [, cfg] of Object.entries(configs)) {
    if (!cfg.enabled) continue;

    pages.push({
      pageKey: cfg.pageKey,
      label: cfg.label,
      slug: cfg.slug,
      enabled: cfg.enabled,
      pageType: cfg.customPageType || (STANDARD_WEBSITE_PAGES.find((p) => p.pageKey === cfg.pageKey)?.isCmsSupported ? 'cms_page' : 'static_page'),
      sections: cfg.recommendedSections || [],
      isCmsEnabled: STANDARD_WEBSITE_PAGES.find((p) => p.pageKey === cfg.pageKey)?.isCmsSupported ?? true,
      applicableCampusIds: cfg.applicableCampusIds,
    });

    navigation.push({
      title: cfg.label,
      slug: cfg.slug,
      order: order++,
      isPublic: true,
    });

    pageRequirements[cfg.pageKey] = cfg.requirements;

    const sources = new Set<string>();
    for (const req of cfg.requirements) {
      if (req.source) sources.add(req.source);
      if (req.referenceAssetId || req.referenceUrl) {
        assetReferences[req.key] = {
          storageKey: req.referenceAssetId,
          url: req.referenceUrl,
          fileName: req.referenceFileName,
        };
      }
      if (req.type === 'document' && req.referenceUrl) {
        documentReferences[req.key] = {
          documentId: req.referenceAssetId,
          title: req.label,
          url: req.referenceUrl,
        };
      }
      if (req.status === 'missing' && req.required && !req.isCmsFutureContent) {
        missingRequirements.push({
          pageKey: cfg.pageKey,
          fieldKey: req.key,
          label: req.label,
          reason: req.missingWarning || 'Field is required',
        });
      }
    }
    contentSources[cfg.pageKey] = Array.from(sources);

    if (cfg.status === 'ready') readyPages++;
    else needsReviewPages++;

    if (cfg.pageKey === 'Privacy Policy') {
      templatePages++;
      const privCfg: WebsitePrivacyPolicyConfig = intakeData.websiteRequirements?.privacyPolicyConfig || {
        autoGenerateStandardPolicy: true,
        collectsContactFormSubmissions: true,
        collectsAdmissionEnquiries: true,
        usesCookies: true,
        usesAnalytics: true,
        offersNewsletterSubscription: false,
        acceptsDocumentUploads: true,
        acceptsOnlinePayments: false,
        schoolName: prof.schoolName || '',
        schoolContactEmail: prof.officialEmail || '',
      };
      generatedTemplates['privacy-policy'] = privCfg.policyContent || generatePrivacyPolicyTemplate(
        privCfg,
        prof.schoolName || '',
        prof.officialEmail || ''
      );
    }

    if (STANDARD_WEBSITE_PAGES.find((p) => p.pageKey === cfg.pageKey)?.isCmsSupported) {
      cmsFuturePages++;
    }
  }

  // Count total images and documents available across campuses and checklist
  let availableImagesCount = 0;
  for (const c of campuses) {
    availableImagesCount += (c.images?.length || 0);
  }
  const statutoryDocs = findStatutoryDocumentsInChecklist(intakeData);
  const availableDocsCount = statutoryDocs.size;

  const totalPages = pages.length;
  const aggregates = aggregateWebsiteRequirementStates(configs);

  return {
    pages,
    navigation,
    pageRequirements,
    contentSources,
    assetReferences,
    documentReferences,
    generatedTemplates,
    missingRequirements,
    summary: {
      totalPages,
      readyPages,
      needsReviewPages,
      templatePages,
      cmsFuturePages,
      availableImagesCount,
      missingImagesCount: missingRequirements.filter((m) => m.fieldKey.includes('image') || m.fieldKey.includes('photo')).length,
      availableDocsCount,
      missingDocsCount: missingRequirements.filter((m) => m.fieldKey.includes('doc') || m.fieldKey.includes('pdf')).length,
      confirmedRequirementsCount: aggregates.confirmedCount,
      needsConfirmationRequirementsCount: aggregates.needsConfirmationCount,
      prefilledRequirementsCount: aggregates.prefilledCount,
      missingRequirementsCount: aggregates.missingCount,
      generatedRequirementsCount: aggregates.generatedCount,
      futureCmsRequirementsCount: aggregates.futureCmsCount,
    },
  };
}
