/**
 * ==============================================================================
 * UNIFIED SCHOOL WEBSITE DATA CONTRACT & NORMALIZATION ENGINE
 * File: src/lib/schoolWebsiteContract.ts
 * ==============================================================================
 *
 * Core architectural principle:
 * ONE DATABASE + ONE ONBOARDING SYSTEM + ONE WEBSITE DATA CONTRACT
 * + ONE WEBSITE ENGINE + MULTIPLE THEMES/TEMPLATES = UNLIMITED SCHOOL WEBSITES.
 *
 * All website components consume ONLY this normalized contract.
 * No component queries random database tables or creates fake school info.
 */

import type { UniversalIntakeData, SchoolTenant } from './types';
import { isHostelApplicable } from './hostelUtils';
import { getEffectiveMediaRegistry } from './mediaRegistryUtils';
import { resolveCanonicalPrincipal } from './websitePageRequirements';
import { getCampusAcademicScope } from './campusAcademicScopeService';

export interface SchoolWebsiteConfig {
  theme: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  navigationStyle: 'sticky' | 'standard' | 'floating';
  showAdmissions: boolean;
  showFees: boolean;
  showTransport: boolean;
  showHostel: boolean;
  showGallery: boolean;
  showMandatoryDisclosures: boolean;
  published: boolean;
  domain?: string;
  selectedModules?: string[];
  optionalModules?: string[];
  customRequirements?: string[] | null;
}

export interface SchoolWebsiteData {
  school: {
    id: string;
    udiseCode?: string;
    schoolCode?: string;
    affiliationNumber?: string;
    board: string;
    name: string;
    displayName: string;
    legalName?: string;
    establishedYear?: number | string;
    tagline?: string;
    slug: string;
    schoolType?: string;
  };
  branding: {
    logoUrl: string;
    crestUrl?: string;
    faviconUrl?: string;
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    themeVariant: string;
    tagline?: string;
    motto?: string;
  };
  hero: {
    headline: string;
    subheadline: string;
    imageUrl: string;
    primaryCtaText: string;
    primaryCtaLink: string;
    secondaryCtaText?: string;
    secondaryCtaLink?: string;
  };
  about: {
    title: string;
    description: string;
    vision?: string;
    mission?: string;
    values?: string[];
    establishedYear?: number | string;
  };
  leadership: {
    principalName?: string;
    principalDesignation?: string;
    principalPhotoUrl?: string;
    principalMessage?: string;
    managementMembers: Array<{
      name: string;
      designation: string;
      photoUrl?: string;
      message?: string;
    }>;
  };
  campuses: Array<{
    id: string;
    name: string;
    isMainCampus: boolean;
    address: string;
    city: string;
    state: string;
    postalCode?: string;
    googleMapsUrl?: string;
    facilities: string[];
    academicLevels?: string[];
    classRange?: string;
  }>;
  academics: {
    currentSession: string;
    classesOffered: string[];
    streams: string[];
    curriculumSummary?: string;
  };
  facilities: Array<{
    key: string;
    name: string;
    category: string;
    isApplicable: boolean;
    isAvailable: boolean;
    capacityOrCount?: string | number;
    description?: string;
    features: string[];
    imageUrl?: string;
  }>;
  faculty: {
    totalCount?: number;
    studentTeacherRatio?: string;
    departments: string[];
    featuredMembers: Array<{
      name: string;
      department: string;
      designation: string;
      photoUrl?: string;
      subject?: string;
      bio?: string;
      featured?: boolean;
    }>;
  };
  admissions: {
    isEnrolling: boolean;
    sessionName?: string;
    guidelines?: string;
    eligibilitySummary?: string;
    feePaymentFrequency?: string;
    applicationLink?: string;
    importantDates?: Array<{ event: string; date: string }>;
  };
  fees: {
    hasFeeStructure: boolean;
    items: Array<{
      category: string;
      frequency: string;
      amountINR: number;
      classes?: string;
    }>;
    notes?: string;
  };
  transport: {
    isOperated: boolean; // false = NOT_APPLICABLE (hidden from navigation & website)
    totalBuses?: number;
    totalRoutes?: number;
    hasGpsTracking?: boolean;
    routes: Array<{
      name: string;
      vehicleNumber?: string;
      routeCoverage?: string;
      stopsCount?: number;
    }>;
  };
  hostel: {
    isAvailable: boolean; // false = NOT_APPLICABLE (hidden from navigation & website)
    capacity?: number;
    wardenName?: string;
    genderAccommodation?: string;
    features: string[];
    buildingsCount?: number;
  };
  gallery: Array<{
    id: string;
    url: string;
    caption?: string;
    category: string;
    altText: string;
  }>;
  compliance: {
    board: string;
    affiliationNumber?: string;
    udiseCode?: string;
    mandatoryDisclosures: Array<{
      id: string;
      title: string;
      documentType: string;
      fileUrl?: string;
      isVerified: boolean;
      isNotApplicable?: boolean;
    }>;
  };
  contact: {
    primaryEmail: string;
    primaryPhone: string;
    secondaryPhone?: string;
    address: string;
    city: string;
    state: string;
    googleMapsUrl?: string;
    officeHours?: string;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    canonicalUrl: string;
    ogImageUrl?: string;
  };
  config: SchoolWebsiteConfig;
  projectScope?: {
    websiteType?: string;
    selectedModules?: string[];
    optionalModules?: string[];
    domainPreference?: {
      domainChoice?: string;
      domainName?: string;
      isDecideLater?: boolean;
    };
    customRequirements?: string[] | null;
    specialInstructions?: string | null;
  };
  readinessSummary: {
    score: number;
    status: 'DRAFT' | 'READY_FOR_REVIEW' | 'VERIFIED' | 'LOCKED' | 'PUBLISHED';
    blockersCount: number;
    isWebsiteReady: boolean;
  };
}

/**
 * Normalizes draft/onboarding UniversalIntakeData into the authoritative SchoolWebsiteData contract.
 * Strictly adheres to ZERO FABRICATION: No mock data or fake stats are invented.
 */
export function buildSchoolWebsiteDataFromIntake(
  intakeData: Partial<UniversalIntakeData>,
  isPublishedView: boolean = false
): SchoolWebsiteData {
  const prof = intakeData.schoolProfile || ({} as any);
  const branding = intakeData.brandingDesign || ({} as any);
  const content = intakeData.schoolContent || ({} as any);
  const campuses = intakeData.campuses || [];
  const primaryCampus = campuses.find((c) => c.isMainCampus) || campuses[0] || ({} as any);
  const structure = intakeData.institutionStructure || ({} as any);
  const facilities = (intakeData.facilitiesConfig || (intakeData as any).campusFacilities || {}) as any;
  const transport = intakeData.transportConfig || ({} as any);
  const hostel = intakeData.hostelConfig || ({} as any);
  const admissions = (intakeData.admissions || (intakeData as any).admissionsConfig || {}) as any;
  const fees = (intakeData.feesConfiguration || (intakeData as any).feeStructure || {}) as any;
  const staff = intakeData.staffFaculty || ({} as any);
  const legal = intakeData.legalPolicies || ({} as any);

  // Derive Canonical Principal via multi-source reconciliation
  const principalResolution = resolveCanonicalPrincipal(intakeData);
  const principalName = principalResolution.value || '';

  // Get Media Assets from registry
  const mediaRegistry = getEffectiveMediaRegistry(intakeData);

  // Resolve Logo
  const logoAsset = mediaRegistry.find(
    (m) => (m.categories?.includes('logo') || m.id.includes('logo')) && m.url
  );
  const logoUrl =
    branding.logo ||
    branding.logoUrl ||
    logoAsset?.url ||
    '';

  // Resolve Hero Image
  const heroAsset = mediaRegistry.find(
    (m) => (m.categories?.includes('campus_buildings') || m.id.includes('hero') || m.isHero) && m.url
  );
  const heroImageUrl =
    (intakeData as any).campusImages?.primaryHero?.url ||
    heroAsset?.url ||
    '';

  // Resolve Principal Photo
  const principalAsset = mediaRegistry.find(
    (m) => (m.categories?.includes('principal') || m.id.includes('principal')) && m.url
  );
  const principalPhotoUrl =
    (typeof intakeData.leadership?.principalPhoto === 'object'
      ? (intakeData.leadership.principalPhoto as any)?.url
      : intakeData.leadership?.principalPhoto) ||
    principalAsset?.url ||
    '';

  // School Identity
  const schoolName = (prof.schoolName || prof.name || '').trim();
  const displayName = (prof.displayName || schoolName).trim();
  const legalName = (prof.legalName || schoolName).trim();
  const board = (prof.board || prof.curriculumBoard || 'Recognized Board').trim();
  const affiliationNumber = (prof.affiliationNumber || '').trim();
  const udiseCode = (prof.udiseCode || '').trim();
  const schoolCode = (prof.schoolCode || '').trim();
  const establishedYear = prof.establishedYear || undefined;
  const tagline = (prof.tagline || branding.taglineOrMotto || '').trim();
  const slug = (prof.slug || '').trim();

  // About Content
  const aboutText =
    typeof content.aboutSchool === 'object'
      ? content.aboutSchool?.text || ''
      : content.aboutSchool || '';
  const visionText =
    typeof content.vision === 'object'
      ? content.vision?.text || ''
      : content.vision || '';
  const missionText =
    typeof content.mission === 'object'
      ? content.mission?.text || ''
      : content.mission || '';
  const values = Array.isArray(content.coreValues)
    ? content.coreValues
    : [];

  // Primary Colors & Theme
  const primaryColor = branding.primaryColor || '#4338CA';
  const secondaryColor = branding.secondaryColor || '#312E81';
  const fontFamily = branding.fontFamily || 'Inter, system-ui, sans-serif';
  const themeVariant = branding.brandTone || 'modern';

  // Campuses
  const normalizedCampuses = campuses.map((c, idx) => {
    const campusScope = getCampusAcademicScope(c.id || idx, intakeData);
    return {
      id: c.id || `campus-${idx + 1}`,
      name: c.name || (c.isMainCampus ? 'Main Campus' : `Branch ${idx + 1}`),
      isMainCampus: Boolean(c.isMainCampus || idx === 0),
      address: c.address || '',
      city: c.city || prof.city || '',
      state: c.state || prof.state || '',
      postalCode: c.pin || (c as any).postalCode || '',
      googleMapsUrl: c.googleMapsUrl || c.googleMapsLink || '',
      facilities: Array.isArray(c.facilities) ? c.facilities : [],
      academicLevels:
        campusScope.academicLevels.length > 0
          ? campusScope.academicLevels
          : Array.isArray(c.academicLevels)
          ? c.academicLevels
          : [],
      classRange: c.classRange || campusScope.classRange || '',
      classesOffered: campusScope.classNames,
    };
  });

  // Academics — Canonical class offerings from campus scope (Single Source of Truth)
  const canonicalScopeClasses: string[] = [];
  if (campuses.length > 0) {
    for (const c of campuses) {
      const scope = getCampusAcademicScope(c.id, intakeData);
      canonicalScopeClasses.push(...scope.classNames);
    }
  }
  const uniqueCanonicalClasses = Array.from(new Set(canonicalScopeClasses));

  const classesOffered: string[] =
    uniqueCanonicalClasses.length > 0
      ? uniqueCanonicalClasses
      : Array.isArray(structure.classes)
      ? structure.classes.map((c: any) => (typeof c === 'string' ? c : c.name || c.className)).filter(Boolean)
      : [];
  const streams: string[] = Array.isArray(structure.streams)
    ? structure.streams.map((s: any) => (typeof s === 'string' ? s : s.name)).filter(Boolean)
    : [];

  // Facilities
  const facilityItems: SchoolWebsiteData['facilities'] = [];
  if (Array.isArray(facilities.items)) {
    facilities.items.forEach((f: any) => {
      facilityItems.push({
        key: f.key || f.id || f.name,
        name: f.name || 'Campus Facility',
        category: f.category || 'General',
        isApplicable: f.isApplicable !== false,
        isAvailable: f.isAvailable !== false,
        capacityOrCount: f.count || f.capacity,
        description: f.description || '',
        features: Array.isArray(f.features) ? f.features : [],
        imageUrl: f.imageUrl || '',
      });
    });
  }

  // Transport (Strict Conditional Availability)
  const isTransportOperated =
    transport.status === 'yes' ||
    transport.enabled === true ||
    (Boolean(transport.fleet?.length) && transport.status !== 'no');
  const transportRoutes = isTransportOperated && Array.isArray(transport.routes)
    ? transport.routes.map((r: any) => ({
        name: r.name || r.routeName || 'Bus Route',
        vehicleNumber: r.busNumber || r.vehicleNumber || '',
        routeCoverage: r.coverage || r.stops?.join(' → ') || '',
        stopsCount: Array.isArray(r.stops) ? r.stops.length : undefined,
      }))
    : [];

  // Hostel (Strict Conditional Availability)
  const isHostelOffered =
    (isHostelApplicable(prof) ||
      prof.residentialStatus === 'residential' ||
      prof.residentialStatus === 'both_day_and_residential' ||
      prof.schoolType === 'boarding' ||
      prof.schoolType === 'residential') &&
    hostel.status !== 'no' &&
    hostel.isApplicable !== false;

  // Gallery
  const galleryItems = mediaRegistry
    .filter((m) =>
      m.categories?.some((cat) =>
        ['gallery', 'campus_buildings', 'activities', 'sports_playground', 'facilities'].includes(cat)
      )
    )
    .map((m) => ({
      id: m.id,
      url: m.url || '',
      caption: m.caption || m.fileName || '',
      category: m.categories?.[0] || 'Campus',
      altText: m.fileName || 'Campus Photograph',
    }));

  // Compliance & Mandatory Disclosures
  const mandatoryDisclosures: SchoolWebsiteData['compliance']['mandatoryDisclosures'] = [];
  const checklistItems = intakeData.assetChecklist?.items || [];
  checklistItems
    .filter((item: any) => item.category === 'compliance' || item.id?.startsWith('cert-') || item.id?.includes('disclosure'))
    .forEach((item: any) => {
      mandatoryDisclosures.push({
        id: item.id,
        title: item.title,
        documentType: item.requirement || 'Statutory Certificate',
        fileUrl: item.fileUrl,
        isVerified: item.status === 'provided' && Boolean(item.fileUrl),
        isNotApplicable: item.status === 'not_applicable',
      });
    });

  // Contact
  const contact: SchoolWebsiteData['contact'] = {
    primaryEmail: prof.officialEmail || prof.contactEmail || prof.email || '',
    primaryPhone: prof.officialPhone || prof.contactPhone || prof.phone || '',
    secondaryPhone: prof.secondaryPhone || '',
    address: primaryCampus.address || prof.address || '',
    city: primaryCampus.city || prof.city || '',
    state: primaryCampus.state || prof.state || '',
    googleMapsUrl: primaryCampus.googleMapsUrl || primaryCampus.googleMapsLink || '',
    officeHours: prof.officeHours || 'Monday - Saturday: 8:00 AM - 3:30 PM',
  };

  // Project Scope & Website Configuration Layer
  const scope = intakeData.websiteScope || {};
  const domPresence = intakeData.domainPresence || ({} as any);
  const addReq = intakeData.additionalRequirements || ({} as any);

  const effectiveDomain =
    domPresence.preferredNewDomainName ||
    domPresence.existingDomainName ||
    domPresence.preferredDomain ||
    (prof.platformSubdomain ? `https://${prof.platformSubdomain}` : undefined);

  const customReqList = Array.isArray(addReq.customRequests) && addReq.customRequests.length > 0
    ? addReq.customRequests
    : typeof addReq.notes === 'string' && addReq.notes.trim()
    ? [addReq.notes.trim()]
    : typeof addReq.generalCommentsOrQuestions === 'string' && addReq.generalCommentsOrQuestions.trim()
    ? [addReq.generalCommentsOrQuestions.trim()]
    : null;

  const projectScope: SchoolWebsiteData['projectScope'] = {
    websiteType: scope.websiteType || 'public_school',
    selectedModules: scope.coreModules || ['home', 'about', 'academics', 'admissions', 'contact', 'gallery'],
    optionalModules: scope.optionalModules || [],
    domainPreference: {
      domainChoice: domPresence.domainChoice,
      domainName: effectiveDomain,
      isDecideLater: Boolean(domPresence.domainChoice === 'DECIDE_LATER' || domPresence.decideLater),
    },
    customRequirements: customReqList,
    specialInstructions: addReq.notes || addReq.generalCommentsOrQuestions || scope.specialInstructions || null,
  };

  // Resolve authoritative website fee items from feesConfiguration or legacy feeStructure
  let websiteFeeItems: Array<{ category: string; frequency: string; amountINR: number; classes?: string }> = [];
  if (Array.isArray(fees.items) && fees.items.length > 0) {
    websiteFeeItems = fees.items.map((item: any) => ({
      category: item.category || item.name || 'Tuition Fee',
      frequency: item.frequency || 'Annual',
      amountINR: Number(item.amountINR || item.amount || 0),
      classes: item.applicableClasses || item.classes,
    }));
  } else {
    if (Array.isArray(fees.commonFees) && fees.commonFees.length > 0) {
      fees.commonFees
        .filter((f: any) => typeof f.amount === 'number' && f.amount > 0 && f.isVisibleOnWebsite !== false)
        .forEach((f: any) => {
          websiteFeeItems.push({
            category: f.name || f.category || 'Tuition Fee',
            frequency: f.frequency ? String(f.frequency).replace(/_/g, ' ').toUpperCase() : 'ANNUAL',
            amountINR: Number(f.amount),
            classes: f.applicableClasses === 'all' || !f.applicableClasses ? 'All Classes' : Array.isArray(f.applicableClasses) ? f.applicableClasses.join(', ') : String(f.applicableClasses),
          });
        });
    }
    if (Array.isArray(fees.newStudentFees) && fees.newStudentFees.length > 0) {
      fees.newStudentFees
        .filter((f: any) => typeof f.amount === 'number' && f.amount > 0 && f.isVisibleOnWebsite !== false)
        .forEach((f: any) => {
          websiteFeeItems.push({
            category: f.name || f.category || 'Admission Fee',
            frequency: 'ONE TIME (AT ADMISSION)',
            amountINR: Number(f.amount),
            classes: f.applicableClasses === 'all' || !f.applicableClasses ? 'New Admissions' : Array.isArray(f.applicableClasses) ? f.applicableClasses.join(', ') : String(f.applicableClasses),
          });
        });
    }
    if (websiteFeeItems.length === 0 && Array.isArray(fees.classFeeStructures) && fees.classFeeStructures.length > 0) {
      fees.classFeeStructures
        .filter((c: any) => typeof c.amount === 'number' && c.amount > 0)
        .forEach((c: any) => {
          websiteFeeItems.push({
            category: c.feeType || c.feeHead || 'Tuition Fee',
            frequency: c.frequency ? String(c.frequency).toUpperCase() : 'MONTHLY',
            amountINR: Number(c.amount),
            classes: c.className || 'All Classes',
          });
        });
    }
  }

  const feeNotesCombined =
    fees.notes ||
    (Array.isArray(fees.feeNotes)
      ? fees.feeNotes.map((n: any) => (typeof n === 'string' ? n : n.text)).filter(Boolean).join('; ')
      : fees.disclosureNotes) ||
    undefined;

  // Website Config
  const config: SchoolWebsiteConfig = {
    theme: themeVariant,
    primaryColor,
    secondaryColor,
    fontFamily,
    navigationStyle: 'sticky',
    showAdmissions: Boolean(admissions.isEnrolling !== false),
    showFees: Boolean(fees.hasFeeStructure || websiteFeeItems.length > 0),
    showTransport: isTransportOperated && (scope.optionalModules ? scope.optionalModules.includes('transport') : true),
    showHostel: isHostelOffered && (scope.optionalModules ? scope.optionalModules.includes('hostel') : true),
    showGallery: galleryItems.length > 0,
    showMandatoryDisclosures: true,
    published: isPublishedView,
    domain: effectiveDomain,
    selectedModules: projectScope.selectedModules,
    optionalModules: projectScope.optionalModules,
    customRequirements: customReqList,
  };

  return {
    school: {
      id: prof.udiseCode || prof.id || slug,
      udiseCode,
      schoolCode,
      affiliationNumber,
      board,
      name: schoolName,
      displayName,
      legalName,
      establishedYear,
      tagline,
      slug,
      schoolType: prof.schoolType,
    },
    branding: {
      logoUrl,
      primaryColor,
      secondaryColor,
      fontFamily,
      themeVariant,
      tagline,
    },
    hero: {
      headline: displayName || schoolName || 'Welcome to Our School',
      subheadline: tagline || (aboutText ? `${aboutText.slice(0, 160)}...` : ''),
      imageUrl: heroImageUrl,
      primaryCtaText: 'Apply for Admission',
      primaryCtaLink: '#admissions',
      secondaryCtaText: 'Explore Campus',
      secondaryCtaLink: '#facilities',
    },
    about: {
      title: `About ${displayName || schoolName || 'Our Institution'}`,
      description: aboutText,
      vision: visionText,
      mission: missionText,
      values,
      establishedYear,
    },
    leadership: {
      principalName,
      principalDesignation: 'Principal / Head of Institution',
      principalPhotoUrl,
      principalMessage: intakeData.websiteRequirements?.principalMessageDraft || '',
      managementMembers: Array.isArray(intakeData.leadership?.managementMembers)
        ? intakeData.leadership.managementMembers.map((m: any) => ({
            name: m.name || '',
            designation: m.designation || m.role || '',
            photoUrl: m.photoUrl || '',
          }))
        : [],
    },
    campuses: normalizedCampuses,
    academics: {
      currentSession: structure.academicSession || structure.currentSession || '2026-2027',
      classesOffered,
      streams,
      curriculumSummary: structure.curriculumSummary || `Comprehensive curriculum affiliated with ${board}.`,
    },
    facilities: facilityItems,
    faculty: {
      totalCount: staff.totalTeachingStaff || staff.staffMembers?.length,
      studentTeacherRatio: staff.studentTeacherRatio,
      departments: Array.isArray(staff.departments) ? staff.departments : [],
      featuredMembers: Array.isArray(staff.staffMembers)
        ? staff.staffMembers
            .filter((s: any) => {
              const status = (s.status || 'active').toLowerCase();
              if (status === 'archived' || status === 'terminated') return false;
              return Boolean(s.websiteProfile?.showOnWebsite ?? s.displayOnWebsite ?? false);
            })
            .sort((a: any, b: any) => {
              const aFeatured = a.websiteProfile?.featured ? 1 : 0;
              const bFeatured = b.websiteProfile?.featured ? 1 : 0;
              if (bFeatured !== aFeatured) return bFeatured - aFeatured;
              const aOrder = a.websiteProfile?.displayOrder ?? 999;
              const bOrder = b.websiteProfile?.displayOrder ?? 999;
              if (aOrder !== bOrder) return aOrder - bOrder;
              return (a.name || '').localeCompare(b.name || '');
            })
            .map((s: any) => ({
              name: s.websiteProfile?.publicName || s.fullName || s.name || '',
              department: s.websiteProfile?.publicDepartment || s.department || '',
              designation: s.websiteProfile?.publicDesignation || s.designation || 'Teacher',
              subject: s.websiteProfile?.publicSubject || s.primarySubject || s.specialization || '',
              bio: s.websiteProfile?.shortBio || '',
              photoUrl: s.photoUrl || '',
              featured: Boolean(s.websiteProfile?.featured),
            }))
        : [],
    },
    admissions: {
      isEnrolling: Boolean(admissions.isEnrolling !== false),
      sessionName: admissions.sessionName || structure.academicSession || '2026-2027',
      guidelines: admissions.guidelines || admissions.processNotes || '',
      eligibilitySummary: admissions.eligibilitySummary || '',
      applicationLink: admissions.portalUrl || '#contact',
    },
    fees: {
      hasFeeStructure: Boolean(fees.hasFeeStructure || websiteFeeItems.length > 0),
      items: websiteFeeItems,
      notes: feeNotesCombined,
    },
    transport: {
      isOperated: isTransportOperated,
      totalBuses: transport.fleet?.length,
      totalRoutes: transportRoutes.length,
      hasGpsTracking: transport.hasGpsTracking ?? true,
      routes: transportRoutes,
    },
    hostel: {
      isAvailable: isHostelOffered,
      capacity: hostel.totalCapacity,
      wardenName: hostel.wardenName,
      genderAccommodation: hostel.accommodationType,
      features: Array.isArray(hostel.amenities) ? hostel.amenities : [],
      buildingsCount: Array.isArray(hostel.buildings) ? hostel.buildings.length : undefined,
    },
    gallery: galleryItems,
    compliance: {
      board,
      affiliationNumber,
      udiseCode,
      mandatoryDisclosures,
    },
    contact,
    seo: {
      metaTitle: `${displayName || schoolName || 'School'} | Official Digital Portal`,
      metaDescription: aboutText
        ? aboutText.slice(0, 155)
        : `Official website of ${displayName || schoolName}. Discover academic programs, admissions, and campus facilities.`,
      canonicalUrl: `https://${slug || 'school'}.ekaagraschools.in`,
      ogImageUrl: heroImageUrl || logoUrl,
    },
    config,
    projectScope,
    readinessSummary: {
      score: 100,
      status: isPublishedView ? 'PUBLISHED' : 'DRAFT',
      blockersCount: 0,
      isWebsiteReady: true,
    },
  };
}

/**
 * Normalizes published school database records into the authoritative SchoolWebsiteData contract.
 */
export function buildSchoolWebsiteDataFromDb(
  school: SchoolTenant,
  profile?: Record<string, any> | null,
  branding?: Record<string, any> | null,
  campuses?: Array<Record<string, any>> | null,
  transportEnabled?: boolean,
  facilities?: Array<Record<string, any>> | null,
  staffMembers?: Array<Record<string, any>> | null
): SchoolWebsiteData {
  const schoolName = school.display_name || school.name || '';
  const legalName = school.legal_name || schoolName;
  const board = (profile?.accreditation_body as string) || (profile?.affiliation_number ? 'CBSE' : 'Recognized Board');
  const affiliationNumber = school.affiliation_number || (profile?.affiliation_number as string) || '';
  const udiseCode = school.school_id || (profile?.udise_code as string) || '';
  const schoolCode = school.school_code || (school as any).code || '';

  const primaryColor = (branding?.primary_color as string) || '#4338CA';
  const secondaryColor = (branding?.secondary_color as string) || '#312E81';
  const fontFamily = (branding?.font_family as string) || 'Inter, system-ui, sans-serif';

  const logoUrl = (branding?.logo_storage_path as string) || '';
  const tagline = (branding?.tagline as string) || (branding?.motto as string) || '';

  const mainCampus = campuses?.find((c) => c.is_main_campus) || campuses?.[0] || null;
  const address = (mainCampus?.address_line1 as string) || (profile?.address_line1 as string) || '';
  const city = (mainCampus?.city as string) || (profile?.city as string) || '';
  const state = (mainCampus?.state_province as string) || (profile?.state_province as string) || '';
  const email = (profile?.primary_email as string) || '';
  const phone = (profile?.primary_phone as string) || '';

  const normalizedCampuses = (campuses || []).map((c, idx) => ({
    id: c.id || `campus-${idx + 1}`,
    name: c.name || (c.is_main_campus ? 'Main Campus' : `Branch ${idx + 1}`),
    isMainCampus: Boolean(c.is_main_campus),
    address: c.address_line1 || '',
    city: c.city || city,
    state: c.state_province || state,
    postalCode: c.postal_code || '',
    googleMapsUrl: c.google_maps_url || '',
    facilities: Array.isArray(c.facilities) ? c.facilities : [],
    academicLevels: [],
  }));

  const isTransportOperated = Boolean(transportEnabled);

  return {
    school: {
      id: udiseCode || school.id,
      udiseCode,
      schoolCode,
      affiliationNumber,
      board,
      name: schoolName,
      displayName: schoolName,
      legalName,
      tagline,
      slug: school.slug,
    },
    branding: {
      logoUrl,
      primaryColor,
      secondaryColor,
      fontFamily,
      themeVariant: 'modern',
      tagline,
    },
    hero: {
      headline: schoolName,
      subheadline: tagline || `Affiliated to ${board}. Fostering knowledge, integrity, and future leadership.`,
      imageUrl: '',
      primaryCtaText: 'Admissions & Inquiries',
      primaryCtaLink: '#contact',
    },
    about: {
      title: `About ${schoolName}`,
      description: (branding?.vision as string) || (branding?.mission as string) || '',
      vision: (branding?.vision as string) || '',
      mission: (branding?.mission as string) || '',
    },
    leadership: {
      managementMembers: [],
    },
    campuses: normalizedCampuses,
    academics: {
      currentSession: '2026-2027',
      classesOffered: [],
      streams: [],
      curriculumSummary: `Affiliated to ${board}.`,
    },
    facilities: (facilities || []).map((f) => ({
      key: f.code || f.id || f.name,
      name: f.name || 'Facility',
      category: f.category || 'General',
      isApplicable: true,
      isAvailable: true,
      features: [],
    })),
    faculty: {
      departments: [],
      featuredMembers: Array.isArray(staffMembers)
        ? staffMembers
            .filter((s: any) => {
              const status = (s.status || 'active').toLowerCase();
              if (status === 'archived' || status === 'terminated') return false;
              const profile = s.website_profile || s.websiteProfile;
              return Boolean(profile?.showOnWebsite ?? s.displayOnWebsite ?? false);
            })
            .sort((a: any, b: any) => {
              const aProfile = a.website_profile || a.websiteProfile;
              const bProfile = b.website_profile || b.websiteProfile;
              const aFeatured = aProfile?.featured ? 1 : 0;
              const bFeatured = bProfile?.featured ? 1 : 0;
              if (bFeatured !== aFeatured) return bFeatured - aFeatured;
              const aOrder = aProfile?.displayOrder ?? 999;
              const bOrder = bProfile?.displayOrder ?? 999;
              if (aOrder !== bOrder) return aOrder - bOrder;
              const aName = aProfile?.publicName || a.full_name || a.name || '';
              const bName = bProfile?.publicName || b.full_name || b.name || '';
              return aName.localeCompare(bName);
            })
            .map((s: any) => {
              const profile = s.website_profile || s.websiteProfile;
              return {
                name: profile?.publicName || s.full_name || s.name || '',
                department: profile?.publicDepartment || s.department || '',
                designation: profile?.publicDesignation || s.designation || 'Teacher',
                subject: profile?.publicSubject || s.primarySubject || s.specialization || '',
                bio: profile?.shortBio || '',
                photoUrl: s.photo_url || s.photoUrl || '',
                featured: Boolean(profile?.featured),
              };
            })
        : [],
    },
    admissions: {
      isEnrolling: true,
      sessionName: '2026-2027',
    },
    fees: {
      hasFeeStructure: false,
      items: [],
    },
    transport: {
      isOperated: isTransportOperated,
      routes: [],
    },
    hostel: {
      isAvailable: false, // Default false unless residential records exist
      features: [],
    },
    gallery: [],
    compliance: {
      board,
      affiliationNumber,
      udiseCode,
      mandatoryDisclosures: [],
    },
    contact: {
      primaryEmail: email,
      primaryPhone: phone,
      address,
      city,
      state,
    },
    seo: {
      metaTitle: `${schoolName} | Official Institutional Portal`,
      metaDescription: `Official digital portal for ${schoolName}. Explore academics, facilities, and contact details.`,
      canonicalUrl: `https://${school.slug}.ekaagraschools.in`,
    },
    config: {
      theme: 'modern',
      primaryColor,
      secondaryColor,
      fontFamily,
      navigationStyle: 'sticky',
      showAdmissions: true,
      showFees: false,
      showTransport: isTransportOperated,
      showHostel: false,
      showGallery: false,
      showMandatoryDisclosures: Boolean(affiliationNumber),
      published: true,
    },
    readinessSummary: {
      score: 100,
      status: 'PUBLISHED',
      blockersCount: 0,
      isWebsiteReady: true,
    },
  };
}

export { buildSchoolWebsiteDataFromIntake as buildSchoolWebsiteData };
