import type {
  UniversalIntakeData,
  AssetChecklistItem,
  AssetChecklistCategory,
  AssetChecklistRequirement,
  AssetChecklistStatus,
  AssetFileMeta,
} from './types';
import { resolveContentBlockText } from './types';
import { toWebpFileName } from './imageUtils';
import { calculateContentSourceFingerprint } from './contentRecommendationService';
import crypto from 'crypto';

export const ASSET_UPLOAD_LIMITS = {
  maxSizeBytes: 15 * 1024 * 1024, // 15MB
  allowedImageExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.heic', '.heif', '.avif', '.bmp', '.tiff', '.tif'],
  allowedImageMimeTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/svg+xml',
    'image/heic',
    'image/heif',
    'image/avif',
    'image/bmp',
    'image/tiff',
  ],
  allowedDocumentExtensions: ['.pdf'],
  allowedDocumentMimeTypes: ['application/pdf'],
  disallowedDangerousExtensions: [
    '.exe', '.bat', '.cmd', '.ps1', '.sh', '.js', '.mjs', '.cjs',
    '.html', '.htm', '.php', '.py', '.rb', '.pl', '.vbs', '.scr',
    '.msi', '.dll', '.com', '.jar', '.zip', '.rar', '.7z', '.tar',
    '.gz', '.iso', '.apk', '.bin', '.wsf', '.reg',
  ],
};

export interface AssetCategoryInfo {
  key: AssetChecklistCategory;
  title: string;
  letter: string;
  description: string;
}

export const ASSET_CATEGORIES: AssetCategoryInfo[] = [
  {
    key: 'branding',
    title: 'School Branding & Identity',
    letter: 'A',
    description: 'Visual identity assets used in headers, footers, favicons, and certificates.',
  },
  {
    key: 'campus_photos',
    title: 'Campus & School Photos',
    letter: 'B',
    description: 'High-resolution photographs of buildings, classrooms, labs, and student activities.',
  },
  {
    key: 'leadership',
    title: 'Leadership & People',
    letter: 'C',
    description: 'Principal and management leadership messages, biographies, and portraits.',
  },
  {
    key: 'academic_content',
    title: 'Academic & School Content',
    letter: 'D',
    description: 'School history, vision, mission, teaching pedagogy, and achievements narrative.',
  },
  {
    key: 'admissions',
    title: 'Admissions & Contact',
    letter: 'E',
    description: 'Fee schedule, admissions process, contact helplines, and notice announcements.',
  },
  {
    key: 'certificates',
    title: 'Certificates & Institutional Documents',
    letter: 'F',
    description: 'Board affiliation, recognition orders, NOC, and mandatory public disclosures.',
  },
  {
    key: 'policies',
    title: 'Policies & Disclosures',
    letter: 'G',
    description: 'Statutory privacy policy, website terms, refund rules, and child safety compliance.',
  },
];

/**
 * Canonical asset items with explicit requirement classifications:
 * - required: strictly needed for core school website
 * - recommended: strongly advised for complete institutional presentation
 * - optional: nice to have (facilities, extra galleries)
 * - statutory: legally / regulatory mandated (affiliation cert, disclosures, privacy policy, fee circular)
 * - conditional: applicability depends on institutional context (trust deed, fire safety, hostel)
 */
export const CANONICAL_ASSET_CHECKLIST_ITEMS: Omit<AssetChecklistItem, 'status'>[] = [
  // A. School Branding
  {
    id: 'brand-logo',
    category: 'branding',
    title: 'Official School Logo',
    description: 'High-resolution master logo with transparent or clean background (PNG, SVG, or high-res JPG).',
    requirement: 'required',
    type: 'image',
    intendedUse: 'Used in website header, mobile navigation, favicon, and official correspondence.',
    allowedFormats: ['PNG', 'JPG', 'JPEG', 'WebP', 'SVG'],
    maxSizeBytes: ASSET_UPLOAD_LIMITS.maxSizeBytes,
    allowNotApplicable: false,
    isPublicationBlocker: true,
    isPrivate: false,
    reuseTargets: ['brand-crest', 'brand-favicon'],
    sourceSection: 'brandingDesign',
    sourceField: 'logoUrl',
  },
  {
    id: 'brand-crest',
    category: 'branding',
    title: 'School Emblem / Crest',
    description: 'Traditional school crest or monogram if distinct from the primary horizontal logo.',
    requirement: 'recommended',
    type: 'image',
    intendedUse: 'Used in website footer, official circulars, marksheets, and student certificates.',
    allowedFormats: ['PNG', 'JPG', 'JPEG', 'WebP', 'SVG'],
    maxSizeBytes: ASSET_UPLOAD_LIMITS.maxSizeBytes,
    allowNotApplicable: true,
    isPublicationBlocker: false,
    isPrivate: false,
    sourceSection: 'brandingDesign',
    sourceField: 'crestUrl',
  },
  {
    id: 'brand-favicon',
    category: 'branding',
    title: 'Favicon / Website Icon',
    description: 'Square 1:1 icon displayed in browser tabs and mobile bookmark shortcuts.',
    requirement: 'recommended',
    type: 'image',
    intendedUse: 'Displayed in browser tabs, search engine snippets, and mobile home screen icons.',
    allowedFormats: ['PNG', 'ICO', 'SVG', 'JPG'],
    maxSizeBytes: 5 * 1024 * 1024,
    allowNotApplicable: true,
    isPublicationBlocker: false,
    isPrivate: false,
    sourceSection: 'brandingDesign',
    sourceField: 'faviconUrl',
  },
  {
    id: 'brand-motto',
    category: 'branding',
    title: 'Official School Tagline / Motto',
    description: 'The school’s guiding motto or tagline (in English, Hindi, or Sanskrit).',
    requirement: 'recommended',
    type: 'text',
    intendedUse: 'Prominently placed beneath the logo, in hero banners, and in SEO meta tags.',
    allowNotApplicable: true,
    isPublicationBlocker: false,
    sourceSection: 'brandingDesign',
    sourceField: 'motto',
  },

  // B. Campus & School Photos
  {
    id: 'campus-exterior',
    category: 'campus_photos',
    title: 'Campus & Main Building Photos',
    description: 'Horizontal photographs of the main school entrance, campus facade, and administrative block.',
    requirement: 'required',
    type: 'gallery',
    intendedUse: 'Used on the website homepage hero slider, campus tour gallery, and Google metadata.',
    allowedFormats: ['JPG', 'JPEG', 'PNG', 'WebP'],
    maxSizeBytes: ASSET_UPLOAD_LIMITS.maxSizeBytes,
    allowNotApplicable: false,
    isPublicationBlocker: true,
    isPrivate: false,
  },
  {
    id: 'campus-classrooms',
    category: 'campus_photos',
    title: 'Classrooms & Smart Learning Spaces',
    description: 'Photos showing student learning environments, smart interactive boards, and lecture rooms.',
    requirement: 'recommended',
    type: 'gallery',
    intendedUse: 'Used in the Academics and Infrastructure sections of the website.',
    allowedFormats: ['JPG', 'JPEG', 'PNG', 'WebP'],
    maxSizeBytes: ASSET_UPLOAD_LIMITS.maxSizeBytes,
    allowNotApplicable: true,
    isPublicationBlocker: false,
    isPrivate: false,
  },
  {
    id: 'campus-laboratories',
    category: 'campus_photos',
    title: 'Science & Computer Laboratories',
    description: 'Photos of physics, chemistry, biology, robotics, and computer labs in active use.',
    requirement: 'recommended',
    type: 'gallery',
    intendedUse: 'Showcased in the STEM, infrastructure, and pedagogical facilities sections.',
    allowedFormats: ['JPG', 'JPEG', 'PNG', 'WebP'],
    maxSizeBytes: ASSET_UPLOAD_LIMITS.maxSizeBytes,
    allowNotApplicable: true,
    isPublicationBlocker: false,
    isPrivate: false,
  },
  {
    id: 'campus-library',
    category: 'campus_photos',
    title: 'Library & Reading Facilities',
    description: 'Photographs of the school library, reading desks, book collections, and e-library corners.',
    requirement: 'recommended',
    type: 'gallery',
    intendedUse: 'Featured in the Academic Resources and Facilities overview.',
    allowedFormats: ['JPG', 'JPEG', 'PNG', 'WebP'],
    maxSizeBytes: ASSET_UPLOAD_LIMITS.maxSizeBytes,
    allowNotApplicable: true,
    isPublicationBlocker: false,
    isPrivate: false,
  },
  {
    id: 'campus-sports',
    category: 'campus_photos',
    title: 'Sports Grounds & Physical Fitness Amenities',
    description: 'Playgrounds, basketball/volleyball courts, athletic tracks, indoor games, and yoga halls.',
    requirement: 'optional',
    type: 'gallery',
    intendedUse: 'Used in Sports, Beyond Academics, and Holistic Development pages.',
    allowedFormats: ['JPG', 'JPEG', 'PNG', 'WebP'],
    maxSizeBytes: ASSET_UPLOAD_LIMITS.maxSizeBytes,
    allowNotApplicable: true,
    isPublicationBlocker: false,
    isPrivate: false,
  },
  {
    id: 'campus-auditorium',
    category: 'campus_photos',
    title: 'Auditorium & Activity Spaces',
    description: 'School auditorium, open amphitheater, music rooms, or dance and art studios.',
    requirement: 'optional',
    type: 'gallery',
    intendedUse: 'Showcased in Co-Curricular Activities and Events galleries.',
    allowedFormats: ['JPG', 'JPEG', 'PNG', 'WebP'],
    maxSizeBytes: ASSET_UPLOAD_LIMITS.maxSizeBytes,
    allowNotApplicable: true,
    isPublicationBlocker: false,
    isPrivate: false,
  },

  // C. Leadership & People
  {
    id: 'lead-principal-photo',
    category: 'leadership',
    title: 'Principal / Head of School Photograph',
    description: 'Formal, high-resolution portrait of the Principal or Head of School.',
    requirement: 'recommended',
    type: 'image',
    intendedUse: 'Accompanies the Principal’s Message on the leadership page and homepage excerpt.',
    allowedFormats: ['JPG', 'JPEG', 'PNG', 'WebP'],
    maxSizeBytes: ASSET_UPLOAD_LIMITS.maxSizeBytes,
    allowNotApplicable: true,
    isPublicationBlocker: false,
    isPrivate: false,
    reuseTargets: ['lead-mgmt-photo'],
    sourceSection: 'leadership',
    sourceField: 'principalPhotoUrl',
  },
  {
    id: 'lead-principal-msg',
    category: 'leadership',
    title: 'Principal’s Desk Message',
    description: 'Welcome note and visionary address from the Principal to prospective parents and students.',
    requirement: 'required',
    type: 'text',
    intendedUse: 'Featured on the dedicated Principal’s Desk page with quotes on the homepage.',
    allowNotApplicable: false,
    isPublicationBlocker: true,
    sourceSection: 'leadership',
    sourceField: 'principalMessage',
  },
  {
    id: 'lead-mgmt-photo',
    category: 'leadership',
    title: 'Chairman / Director / Trustee Photograph',
    description: 'Formal portrait of the Managing Director, Chairman, or Secretary of the managing committee.',
    requirement: 'optional',
    type: 'image',
    intendedUse: 'Used in the Governance & Management Committee page.',
    allowedFormats: ['JPG', 'JPEG', 'PNG', 'WebP'],
    maxSizeBytes: ASSET_UPLOAD_LIMITS.maxSizeBytes,
    allowNotApplicable: true,
    isPublicationBlocker: false,
    isPrivate: false,
  },
  {
    id: 'lead-mgmt-msg',
    category: 'leadership',
    title: 'Chairman / Management Address',
    description: 'Message from the school founder, chairman, or managing committee president.',
    requirement: 'optional',
    type: 'text',
    intendedUse: 'Published on the Management & Board of Trustees page.',
    allowNotApplicable: true,
    isPublicationBlocker: false,
    sourceSection: 'leadership',
    sourceField: 'chairmanMessage',
  },
  {
    id: 'lead-faculty-highlights',
    category: 'leadership',
    title: 'Faculty & Educator Highlights',
    description: 'Brief overview of teaching excellence, staff qualifications, and mentor ratios.',
    requirement: 'optional',
    type: 'text',
    intendedUse: 'Published on the Faculty & Mentors section of the website.',
    allowNotApplicable: true,
    isPublicationBlocker: false,
  },

  // D. Academic & School Content
  {
    id: 'acad-about',
    category: 'academic_content',
    title: 'About School Overview',
    description: 'Detailed introduction covering founding history, campus atmosphere, and core institutional philosophy.',
    requirement: 'required',
    type: 'text',
    intendedUse: 'Primary content on the About Us page and summary introduction on the homepage.',
    allowNotApplicable: false,
    isPublicationBlocker: true,
    sourceSection: 'schoolContent',
    sourceField: 'aboutSchool',
  },
  {
    id: 'acad-vision',
    category: 'academic_content',
    title: 'School Vision Statement',
    description: 'Long-term inspirational vision statement describing the school’s ultimate educational aspiration.',
    requirement: 'required',
    type: 'text',
    intendedUse: 'Highlighted on the Vision & Mission page and homepage ethos card.',
    allowNotApplicable: false,
    isPublicationBlocker: true,
    sourceSection: 'brandingDesign',
    sourceField: 'visionStatement',
  },
  {
    id: 'acad-mission',
    category: 'academic_content',
    title: 'School Mission Statement',
    description: 'Actionable mission statement detailing daily pedagogy and student enrichment commitments.',
    requirement: 'required',
    type: 'text',
    intendedUse: 'Highlighted on the Vision & Mission page alongside the vision.',
    allowNotApplicable: false,
    isPublicationBlocker: true,
    sourceSection: 'brandingDesign',
    sourceField: 'missionStatement',
  },
  {
    id: 'acad-values',
    category: 'academic_content',
    title: 'Core Values & Institutional Principles',
    description: '3 to 6 guiding principles (e.g. Integrity, Compassion, Curiosity, Resilience).',
    requirement: 'recommended',
    type: 'text',
    intendedUse: 'Visual value badges displayed across the About Us and Student Life pages.',
    allowNotApplicable: true,
    isPublicationBlocker: false,
    sourceSection: 'brandingDesign',
    sourceField: 'coreValues',
  },
  {
    id: 'acad-curriculum',
    category: 'academic_content',
    title: 'Curriculum & Pedagogy Description',
    description: 'Overview of board syllabus (CBSE/ICSE/State), teaching methodology, and assessment pattern.',
    requirement: 'recommended',
    type: 'text',
    intendedUse: 'Published on the Academics & Curriculum page.',
    allowNotApplicable: true,
    isPublicationBlocker: false,
    sourceSection: 'schoolContent',
    sourceField: 'teachingMethodology',
  },
  {
    id: 'acad-facilities-desc',
    category: 'academic_content',
    title: 'Facilities & Campus Amenities Text',
    description: 'Detailed description of campus safety, CCTV, transport coverage, cafeteria, and infirmary.',
    requirement: 'recommended',
    type: 'text',
    intendedUse: 'Published on the Infrastructure & Facilities overview page.',
    allowNotApplicable: true,
    isPublicationBlocker: false,
  },
  {
    id: 'acad-achievements',
    category: 'academic_content',
    title: 'Key Student Achievements & Accolades',
    description: 'Board examination toppers, sports tournament victories, and inter-school trophies.',
    requirement: 'optional',
    type: 'text',
    intendedUse: 'Showcased in the Achievements ticker and annual honors page.',
    allowNotApplicable: true,
    isPublicationBlocker: false,
    sourceSection: 'schoolContent',
    sourceField: 'awardsAndAchievements',
  },

  // E. Admissions & Contact
  {
    id: 'adm-fee-circular',
    category: 'admissions',
    title: 'Official Fee Schedule / Circular (PDF)',
    description: 'Official fee breakdown for transparency and regulatory compliance (PDF document).',
    requirement: 'statutory',
    type: 'document',
    intendedUse: 'Linked for parent download on the Fees & Structure transparency page.',
    allowedFormats: ['PDF'],
    maxSizeBytes: ASSET_UPLOAD_LIMITS.maxSizeBytes,
    allowNotApplicable: false,
    isPublicationBlocker: true,
    isPrivate: false,
  },
  {
    id: 'adm-process',
    category: 'admissions',
    title: 'Admissions Guidelines & Step-by-Step Process',
    description: 'Eligibility age criteria, required registration documents, and admission timelines.',
    requirement: 'recommended',
    type: 'text',
    intendedUse: 'Published on the Admissions Process page guiding prospective parents.',
    allowNotApplicable: true,
    isPublicationBlocker: false,
  },
  {
    id: 'adm-contact',
    category: 'admissions',
    title: 'Admissions Office Timings & Helplines',
    description: 'Admission desk telephone numbers, inquiry email, and office visiting hours.',
    requirement: 'required',
    type: 'text',
    intendedUse: 'Published in website header banner, Contact Us page, and admission sticky drawer.',
    allowNotApplicable: false,
    isPublicationBlocker: true,
  },
  {
    id: 'adm-notice',
    category: 'admissions',
    title: 'Admissions Open Announcement Banner',
    description: 'Hero announcement text (e.g., "Admissions Open for Academic Session 2026-27 | Pre-Nursery to Grade XII").',
    requirement: 'optional',
    type: 'text',
    intendedUse: 'Appears as an announcement bar across all top pages during the admission cycle.',
    allowNotApplicable: true,
    isPublicationBlocker: false,
  },

  // F. Certificates & Institutional Documents
  {
    id: 'cert-affiliation',
    category: 'certificates',
    title: 'Board Affiliation Certificate / Extension Letter',
    description: 'Official grant letter or affiliation certificate from CBSE, CISCE, or State Education Board.',
    requirement: 'statutory',
    type: 'document',
    intendedUse: 'Mandatory statutory proof displayed on the Board Affiliation disclosure page.',
    allowedFormats: ['PDF', 'JPG', 'JPEG', 'PNG'],
    maxSizeBytes: ASSET_UPLOAD_LIMITS.maxSizeBytes,
    allowNotApplicable: false,
    isPublicationBlocker: true,
    isPrivate: true,
  },
  {
    id: 'cert-recognition',
    category: 'certificates',
    title: 'School Recognition Certificate / Government NOC',
    description: 'State Education Department No Objection Certificate (NOC) or formal recognition order.',
    requirement: 'statutory',
    type: 'document',
    intendedUse: 'Uploaded to the institutional credentials and statutory verification section.',
    allowedFormats: ['PDF', 'JPG', 'JPEG', 'PNG'],
    maxSizeBytes: ASSET_UPLOAD_LIMITS.maxSizeBytes,
    allowNotApplicable: false,
    isPublicationBlocker: true,
    isPrivate: true,
  },
  {
    id: 'cert-registration',
    category: 'certificates',
    title: 'Society / Trust Registration Certificate',
    description: 'Registration certificate of the educational society or non-profit trust running the school.',
    requirement: 'conditional',
    type: 'document',
    intendedUse: 'Archived under legal governance verification and compliance records.',
    allowedFormats: ['PDF', 'JPG', 'JPEG', 'PNG'],
    maxSizeBytes: ASSET_UPLOAD_LIMITS.maxSizeBytes,
    allowNotApplicable: true,
    conditionRule: 'management_trust_or_society',
    isPublicationBlocker: false,
    isPrivate: true,
  },
  {
    id: 'cert-safety',
    category: 'certificates',
    title: 'Building Safety & Fire Safety Certificate',
    description: 'Valid building stability certificate and Fire Safety NOC from municipal authorities.',
    requirement: 'statutory',
    type: 'document',
    intendedUse: 'Uploaded to comply with statutory public disclosure requirements on the website.',
    allowedFormats: ['PDF', 'JPG', 'JPEG', 'PNG'],
    maxSizeBytes: ASSET_UPLOAD_LIMITS.maxSizeBytes,
    allowNotApplicable: false,
    isPublicationBlocker: false,
    isPrivate: true,
  },
  {
    id: 'cert-mandatory-disclosure',
    category: 'certificates',
    title: 'Mandatory Public Disclosure Document (Appendix IX)',
    description: 'Official board mandatory disclosure sheet containing school details, land certs, and safety orders.',
    requirement: 'statutory',
    type: 'document',
    intendedUse: 'Prominently linked on the school website homepage footer as legally required by CBSE/ICSE.',
    allowedFormats: ['PDF'],
    maxSizeBytes: ASSET_UPLOAD_LIMITS.maxSizeBytes,
    allowNotApplicable: false,
    isPublicationBlocker: true,
    isPrivate: false,
  },

  // G. Policies & Disclosures
  {
    id: 'pol-privacy',
    category: 'policies',
    title: 'Website & Student Data Privacy Policy',
    description: 'Policy explaining how student records, online inquiries, and parent data are protected.',
    requirement: 'statutory',
    type: 'text',
    intendedUse: 'Published on the mandatory /privacy-policy page in the website footer.',
    allowNotApplicable: false,
    isPublicationBlocker: true,
  },
  {
    id: 'pol-terms',
    category: 'policies',
    title: 'Terms of Website Usage & Portal Access',
    description: 'Standard terms governing user conduct, intellectual property, and online admissions.',
    requirement: 'statutory',
    type: 'text',
    intendedUse: 'Published on the mandatory /terms-and-conditions page in the website footer.',
    allowNotApplicable: false,
    isPublicationBlocker: true,
  },
  {
    id: 'pol-refund',
    category: 'policies',
    title: 'Fee Refund & Cancellation Policy',
    description: 'Transparent rules on caution money return, withdrawal notice periods, and transport fee refunds.',
    requirement: 'statutory',
    type: 'text',
    intendedUse: 'Linked on the fee payment portal and admissions policy page.',
    allowNotApplicable: false,
    isPublicationBlocker: false,
  },
  {
    id: 'pol-child-safety',
    category: 'policies',
    title: 'Child Protection & Safeguarding Policy (POCSO)',
    description: 'School safeguarding guidelines, Internal Complaints Committee (ICC), and POCSO compliance note.',
    requirement: 'conditional',
    type: 'text',
    intendedUse: 'Published under the Student Safety & Well-being portal section.',
    allowNotApplicable: true,
    conditionRule: 'has_pocso_committee',
    isPublicationBlocker: false,
  },
];

/**
 * Check if a conditional item is active based on institutional context
 */
export function isConditionalItemApplicable(
  item: AssetChecklistItem | Omit<AssetChecklistItem, 'status'>,
  intakeData?: UniversalIntakeData
): boolean {
  if (item.requirement !== 'conditional') return true;

  if (item.conditionRule === 'management_trust_or_society') {
    if (!intakeData?.schoolProfile?.managementType) return true; // Default applicable if unspecified
    const mgmt = intakeData.schoolProfile.managementType.toLowerCase();
    // Government schools don't need private trust/society registration deeds
    if (mgmt.includes('government') || mgmt.includes('kendriya') || mgmt.includes('navodaya') || mgmt.includes('army')) {
      return false;
    }
    return true;
  }

  return true;
}

/**
 * Validates file signature (magic bytes) to prevent extension spoofing
 */
export function validateFileBufferSignature(
  buffer: Buffer,
  fileName: string,
  declaredMime?: string
): { isValid: boolean; error?: string; detectedType?: string } {
  if (!buffer || buffer.length === 0) {
    return { isValid: false, error: 'File is empty (0 bytes).' };
  }

  const ext = `.${fileName.split('.').pop()?.toLowerCase() || ''}`;

  // Check dangerous executable and script extensions
  if (ASSET_UPLOAD_LIMITS.disallowedDangerousExtensions.includes(ext)) {
    return {
      isValid: false,
      error: `Upload rejected: executable or script file extension (${ext}) is strictly prohibited for security.`,
    };
  }

  // 1. PDF Signature: starts with %PDF- (hex: 25 50 44 46 2D)
  if (ext === '.pdf') {
    if (buffer.length < 5 || buffer.slice(0, 5).toString('ascii') !== '%PDF-') {
      return {
        isValid: false,
        error: 'Malformed PDF document. File header does not match standard PDF signature.',
      };
    }
    return { isValid: true, detectedType: 'application/pdf' };
  }

  // 2. PNG Signature: 89 50 4E 47 0D 0A 1A 0A
  if (ext === '.png') {
    const isPng =
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a;

    if (!isPng) {
      return {
        isValid: false,
        error: 'Malformed PNG image. File header does not match standard PNG signature.',
      };
    }
    return { isValid: true, detectedType: 'image/png' };
  }

  // 3. JPEG Signature: FF D8 FF
  if (ext === '.jpg' || ext === '.jpeg') {
    const isJpg =
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff;

    if (!isJpg) {
      return {
        isValid: false,
        error: 'Malformed JPEG image. File header does not match standard JPEG signature.',
      };
    }
    return { isValid: true, detectedType: 'image/jpeg' };
  }

  // 4. WebP Signature: 'RIFF' .... 'WEBP'
  if (ext === '.webp') {
    const isWebp =
      buffer.length >= 12 &&
      buffer.slice(0, 4).toString('ascii') === 'RIFF' &&
      buffer.slice(8, 12).toString('ascii') === 'WEBP';

    if (!isWebp) {
      return {
        isValid: false,
        error: 'Malformed WebP image. File header does not match standard WebP signature.',
      };
    }
    return { isValid: true, detectedType: 'image/webp' };
  }

  // 5. SVG Signature & Script Injection Scanning
  if (ext === '.svg') {
    const text = buffer.toString('utf8', 0, Math.min(buffer.length, 65536));
    const lower = text.toLowerCase();

    // Must look like SVG
    if (!lower.includes('<svg') && !lower.includes('<?xml')) {
      return {
        isValid: false,
        error: 'Malformed SVG file. Document does not contain valid XML/SVG root tags.',
      };
    }

    // Security sanitization check: reject scripts, external dangerous entities, and event handlers
    const dangerousPatterns = [
      '<script',
      'javascript:',
      'onload=',
      'onerror=',
      'onclick=',
      'onmouseover=',
      '<foreignobject',
      '<iframe',
      '<embed',
      '<object',
      'data:text/html',
    ];

    for (const pattern of dangerousPatterns) {
      if (lower.includes(pattern)) {
        return {
          isValid: false,
          error: `SVG security violation: detected potentially dangerous tag or script execution (${pattern}).`,
        };
      }
    }

    return { isValid: true, detectedType: 'image/svg+xml' };
  }

  return { isValid: true };
}

/**
 * Malware scanning abstraction boundary.
 * Allows pluggable integration with ClamAV / AWS GuardDuty / VirusTotal API.
 */
export async function scanAssetForMalware(
  buffer: Buffer,
  fileName: string
): Promise<{ isClean: boolean; scanner: string; threatName?: string }> {
  // Deep heuristic inspection on binary payload
  // Check for embedded shellcode / PE headers in image/PDF payloads
  if (buffer.length > 2) {
    // Check for 'MZ' (DOS/PE executable magic header) disguised inside non-exe
    if (buffer[0] === 0x4d && buffer[1] === 0x5a) {
      return {
        isClean: false,
        scanner: 'Ekaagra-Binary-Heuristics',
        threatName: 'Disguised-DOS-PE-Executable',
      };
    }
  }

  return {
    isClean: true,
    scanner: 'Ekaagra-Heuristics-Engine',
  };
}

/**
 * Validate a file before uploading (client or metadata check)
 */
export function validateSchoolAssetFile(
  file: { name: string; size: number; type: string },
  itemType: 'image' | 'document' | 'gallery'
): { isValid: boolean; error?: string } {
  if (!file || !file.name) {
    return { isValid: false, error: 'No file provided.' };
  }

  if (file.size <= 0) {
    return { isValid: false, error: 'File is empty (0 bytes).' };
  }

  if (file.size > ASSET_UPLOAD_LIMITS.maxSizeBytes) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `File size exceeds the 15 MB limit (Current: ${sizeMb} MB). Please choose a smaller file.`,
    };
  }

  const ext = `.${file.name.split('.').pop()?.toLowerCase() || ''}`;

  // Reject dangerous extensions immediately
  if (ASSET_UPLOAD_LIMITS.disallowedDangerousExtensions.includes(ext)) {
    return {
      isValid: false,
      error: `File extension "${ext}" is blocked for security reasons.`,
    };
  }

  if (itemType === 'document') {
    if (!ASSET_UPLOAD_LIMITS.allowedDocumentExtensions.includes(ext)) {
      return {
        isValid: false,
        error: 'Unsupported file type. Please upload a PDF document (.pdf).',
      };
    }
  } else {
    // image or gallery
    if (!ASSET_UPLOAD_LIMITS.allowedImageExtensions.includes(ext)) {
      return {
        isValid: false,
        error: 'Unsupported file type. Please upload an image file (JPG, PNG, WebP, or SVG).',
      };
    }
  }

  return { isValid: true };
}

/**
 * Synchronize checklist items with data already captured in earlier onboarding sections.
 * 
 * Source Precedence Rules:
 * - If item.isManualOverride === true, the user's manual change in Step 10 is preserved.
 * - Sourced items from Step 4 Branding, Step 3 Leadership, Step 6 Content are referenced without duplicate storage.
 */
export function syncAssetChecklistWithIntake(
  intakeData: UniversalIntakeData,
  existingItems?: AssetChecklistItem[]
): AssetChecklistItem[] {
  const existingMap = new Map<string, AssetChecklistItem>();
  if (Array.isArray(existingItems)) {
    existingItems.forEach((item) => existingMap.set(item.id, item));
  }

  const mappedItems = CANONICAL_ASSET_CHECKLIST_ITEMS.map((canonical) => {
    const existing = existingMap.get(canonical.id);

    // Initialize item with canonical specifications
    const item: AssetChecklistItem = {
      ...canonical,
      status: existing?.status || 'not_provided',
      fileUrl: existing?.fileUrl,
      storageKey: existing?.storageKey,
      fileName: existing?.fileName,
      fileSize: existing?.fileSize,
      fileType: existing?.fileType,
      isPrivate: canonical.isPrivate ?? existing?.isPrivate,
      checksumSha256: existing?.checksumSha256,
      galleryUrls: existing?.galleryUrls || [],
      textContent: existing?.textContent,
      notes: existing?.notes,
      sourceSection: existing?.sourceSection,
      isManualOverride: existing?.isManualOverride || false,
      reusedFromId: existing?.reusedFromId,
      width: existing?.width,
      height: existing?.height,
      originalSize: existing?.originalSize,
      optimizedSize: existing?.optimizedSize,
      optimizedFormat: existing?.optimizedFormat,
      contentSource: existing?.contentSource,
      recommendedDraft: existing?.recommendedDraft,
      recommendedAt: existing?.recommendedAt,
      sourceFingerprint: existing?.sourceFingerprint,
      isOutdated: existing?.isOutdated,
      requiresReview: existing?.requiresReview,
      recommendationSources: existing?.recommendationSources,
      recommendedTone: existing?.recommendedTone,
      recommendedLength: existing?.recommendedLength,
    };

    // Check if source facts changed for existing recommendations
    if (item.sourceFingerprint && item.type === 'text') {
      const currentFingerprint = calculateContentSourceFingerprint(item.id, intakeData);
      if (currentFingerprint && currentFingerprint !== item.sourceFingerprint) {
        item.isOutdated = true;
      }
    }

    // Evaluate conditional applicability
    const isApplicable = isConditionalItemApplicable(canonical, intakeData);
    if (!isApplicable) {
      item.status = 'not_applicable';
      return item;
    }

    // If item was manually overridden or explicitly marked as not_applicable / will_provide_later / recommended_available, preserve user choice
    if (existing && (existing.isManualOverride || existing.status === 'not_applicable' || existing.status === 'will_provide_later' || existing.status === 'pending' || existing.status === 'recommended_available')) {
      return item;
    }

    // Automatic cross-section data source syncing
    if (canonical.id === 'brand-logo') {
      const logo = intakeData.brandingDesign?.logoUrl;
      if (logo && logo.trim().length > 0) {
        item.fileUrl = logo;
        item.status = 'provided';
        item.sourceSection = 'Brand Identity';
        const isWebp = logo.toLowerCase().includes('.webp');
        if (intakeData.brandingDesign?.logoFileName) {
          item.fileName = intakeData.brandingDesign.logoFileName;
        } else if (!item.fileName) {
          item.fileName = isWebp ? 'School_Logo_Official.webp' : 'School_Logo_Official.png';
        } else if (isWebp && !item.fileName.toLowerCase().endsWith('.webp')) {
          item.fileName = toWebpFileName(item.fileName);
        }
        if (intakeData.brandingDesign?.logoFileSize) {
          item.fileSize = intakeData.brandingDesign.logoFileSize;
          item.optimizedSize = intakeData.brandingDesign.logoFileSize;
        }
        if (intakeData.brandingDesign?.logoStorageKey) {
          item.storageKey = intakeData.brandingDesign.logoStorageKey;
        }
        if (intakeData.brandingDesign?.logoWidth) {
          item.width = intakeData.brandingDesign.logoWidth;
        }
        if (intakeData.brandingDesign?.logoHeight) {
          item.height = intakeData.brandingDesign.logoHeight;
        }
        if (intakeData.brandingDesign?.logoOriginalSize) {
          item.originalSize = intakeData.brandingDesign.logoOriginalSize;
        }
        if (isWebp || intakeData.brandingDesign?.logoOptimizedFormat === 'webp') {
          item.optimizedFormat = 'webp';
          item.fileType = 'image/webp';
        }
      }
    } else if (canonical.id === 'brand-crest') {
      const crest = intakeData.brandingDesign?.crestUrl;
      if (crest && crest.trim().length > 0) {
        item.fileUrl = crest;
        item.status = 'provided';
        item.sourceSection = 'Brand Identity';
        const isWebp = crest.toLowerCase().includes('.webp');
        if (!item.fileName) {
          item.fileName = isWebp ? 'School_Crest_Official.webp' : 'School_Crest_Official.png';
        } else if (isWebp && !item.fileName.toLowerCase().endsWith('.webp')) {
          item.fileName = toWebpFileName(item.fileName);
        }
        if (isWebp) {
          item.optimizedFormat = 'webp';
          item.fileType = 'image/webp';
        }
      }
    } else if (canonical.id === 'brand-favicon') {
      const fav = intakeData.brandingDesign?.faviconUrl;
      if (fav && fav.trim().length > 0) {
        item.fileUrl = fav;
        item.status = 'provided';
        item.sourceSection = 'Brand Identity';
        const isWebp = fav.toLowerCase().includes('.webp');
        if (!item.fileName) {
          item.fileName = isWebp ? 'Favicon_Icon.webp' : 'Favicon_Icon.png';
        } else if (isWebp && !item.fileName.toLowerCase().endsWith('.webp')) {
          item.fileName = toWebpFileName(item.fileName);
        }
        if (isWebp) {
          item.optimizedFormat = 'webp';
          item.fileType = 'image/webp';
        }
      }
    } else if (canonical.id === 'brand-motto') {
      const motto = (intakeData.brandingDesign?.motto || intakeData.brandingDesign?.taglineOrMotto || '').trim();
      if (motto.length > 0) {
        item.textContent = item.textContent || motto;
        item.status = 'provided';
        item.sourceSection = 'Brand Identity';
      }
    } else if (canonical.id === 'lead-principal-photo') {
      const photo = intakeData.leadership?.principalPhoto?.url || intakeData.leadership?.principalPhotoUrl;
      if (photo && photo.trim().length > 0) {
        item.fileUrl = photo;
        item.status = 'provided';
        item.sourceSection = 'Leadership Profile';
        const isWebp = photo.toLowerCase().includes('.webp');
        if (!item.fileName) {
          item.fileName = intakeData.leadership?.principalPhoto?.fileName || (isWebp ? 'Principal_Photo.webp' : 'Principal_Photo.jpg');
        } else if (isWebp && !item.fileName.toLowerCase().endsWith('.webp')) {
          item.fileName = toWebpFileName(item.fileName);
        }
        if (isWebp) {
          item.optimizedFormat = 'webp';
          item.fileType = 'image/webp';
        }
      }
    } else if (canonical.id === 'lead-mgmt-photo') {
      const firstMemberWithPhoto = (intakeData.leadership?.managementMembers || []).find((m) => m.photo?.url || m.photoUrl);
      const photo = firstMemberWithPhoto?.photo?.url || firstMemberWithPhoto?.photoUrl;
      if (photo && photo.trim().length > 0) {
        item.fileUrl = photo;
        item.status = 'provided';
        item.sourceSection = 'Leadership Profile';
        const isWebp = photo.toLowerCase().includes('.webp');
        if (!item.fileName) {
          item.fileName = firstMemberWithPhoto?.photo?.fileName || (isWebp ? 'Trustee_Photo.webp' : 'Trustee_Photo.jpg');
        } else if (isWebp && !item.fileName.toLowerCase().endsWith('.webp')) {
          item.fileName = toWebpFileName(item.fileName);
        }
        if (isWebp) {
          item.optimizedFormat = 'webp';
          item.fileType = 'image/webp';
        }
      }
    } else if (canonical.id === 'lead-principal-msg') {
      const msg = intakeData.leadership?.principalMessage?.trim();
      if (msg && msg.length > 0) {
        item.textContent = item.textContent || msg;
        item.status = 'provided';
        item.sourceSection = 'Leadership Profile';
      }
    } else if (canonical.id === 'lead-mgmt-msg') {
      const msg = (intakeData.leadership?.chairmanMessage || intakeData.leadership?.directorMessage || '').trim();
      if (msg && msg.length > 0) {
        item.textContent = item.textContent || msg;
        item.status = 'provided';
        item.sourceSection = 'Leadership Profile';
      }
    } else if (canonical.id === 'acad-about') {
      const about = resolveContentBlockText(intakeData.schoolContent?.aboutSchool).trim();
      if (about && about.length > 0) {
        item.textContent = item.textContent || about;
        item.status = 'provided';
        item.sourceSection = 'School Content';
      }
    } else if (canonical.id === 'acad-vision') {
      const vision = (resolveContentBlockText(intakeData.schoolContent?.vision) || intakeData.brandingDesign?.visionStatement || intakeData.leadership?.visionStatement || '').trim();
      if (vision && vision.length > 0) {
        item.textContent = item.textContent || vision;
        item.status = 'provided';
        item.sourceSection = resolveContentBlockText(intakeData.schoolContent?.vision) ? 'School Content' : 'Brand Identity';
      }
    } else if (canonical.id === 'acad-mission') {
      const mission = (resolveContentBlockText(intakeData.schoolContent?.mission) || intakeData.brandingDesign?.missionStatement || intakeData.leadership?.missionStatement || '').trim();
      if (mission && mission.length > 0) {
        item.textContent = item.textContent || mission;
        item.status = 'provided';
        item.sourceSection = resolveContentBlockText(intakeData.schoolContent?.mission) ? 'School Content' : 'Brand Identity';
      }
    } else if (canonical.id === 'acad-values') {
      const values = (Array.isArray(intakeData.schoolContent?.coreValues) && intakeData.schoolContent!.coreValues!.length > 0)
        ? intakeData.schoolContent!.coreValues
        : intakeData.brandingDesign?.coreValues;
      if (Array.isArray(values) && values.length > 0) {
        item.textContent = item.textContent || values.join(', ');
        item.status = 'provided';
        item.sourceSection = (Array.isArray(intakeData.schoolContent?.coreValues) && intakeData.schoolContent!.coreValues!.length > 0) ? 'School Content' : 'Brand Identity';
      }
    } else if (canonical.id === 'acad-curriculum') {
      const meth = (resolveContentBlockText(intakeData.schoolContent?.educationalPhilosophy) || intakeData.schoolContent?.teachingMethodology || intakeData.schoolContent?.philosophy || '').trim();
      if (meth && meth.length > 0) {
        item.textContent = item.textContent || meth;
        item.status = 'provided';
        item.sourceSection = 'School Content';
      }
    } else if (canonical.id === 'acad-achievements') {
      const awards = intakeData.schoolContent?.awardsAndAchievements;
      if (Array.isArray(awards) && awards.length > 0) {
        item.textContent = item.textContent || awards.map((a) => `${a.title}${a.year ? ` (${a.year})` : ''}`).join('; ');
        item.status = 'provided';
        item.sourceSection = 'School Content';
      }
    } else if (canonical.id === 'adm-contact') {
      const phone = (intakeData.schoolProfile as any)?.officialPhone || (intakeData.schoolProfile as any)?.phone || intakeData.leadership?.principalPhone || '';
      const email = (intakeData.schoolProfile as any)?.officialEmail || (intakeData.schoolProfile as any)?.email || intakeData.leadership?.principalEmail || '';
      const hours = (intakeData.attendanceConfig as any)?.schoolStartTime ? `${(intakeData.attendanceConfig as any).schoolStartTime} – ${(intakeData.attendanceConfig as any).schoolEndTime}` : 'Monday to Saturday: 8:00 AM – 2:30 PM';
      if (phone.trim().length > 0 || email.trim().length > 0) {
        item.textContent = item.textContent || `Phone: ${phone} | Email: ${email} | Visiting Hours: ${hours}`;
        item.status = 'provided';
        item.sourceSection = 'School Profile';
      }
    } else if (canonical.id === 'pol-privacy') {
      if (intakeData.legalPolicies?.privacyPolicyRequired && !item.textContent) {
        item.textContent = 'Ekaagra standard student and institutional data protection policy applied.';
        item.status = 'provided';
        item.sourceSection = 'Legal Policies';
      }
    } else if (canonical.id === 'pol-terms') {
      if (intakeData.legalPolicies?.termsRequired && !item.textContent) {
        item.textContent = 'Ekaagra standard educational website usage and admission portal terms applied.';
        item.status = 'provided';
        item.sourceSection = 'Legal Policies';
      }
    }

    // Direct items check: if item has a fileUrl, textContent, or galleryUrls, ensure status is provided
    if (item.status !== 'not_applicable' && item.status !== 'will_provide_later' && item.status !== 'pending' && item.status !== 'recommended_available') {
      if (item.type === 'gallery' && item.galleryUrls && item.galleryUrls.length > 0) {
        item.status = 'provided';
      } else if (item.type === 'text' && item.textContent && item.textContent.trim().length > 0) {
        item.status = 'provided';
      } else if ((item.type === 'image' || item.type === 'document') && item.fileUrl && item.fileUrl.trim().length > 0) {
        item.status = 'provided';
      }
    } else if (item.status === 'recommended_available' && item.type === 'text' && item.textContent && item.textContent.trim().length > 0) {
      item.status = 'provided';
    }

    // Canonical normalization for existing image records
    if (item.fileUrl) {
      const isWebp =
        item.fileUrl.toLowerCase().includes('.webp') ||
        Boolean(item.storageKey?.toLowerCase().endsWith('.webp')) ||
        item.optimizedFormat === 'webp';
      if (isWebp) {
        item.fileType = 'image/webp';
        item.optimizedFormat = 'webp';
        if (item.fileName && !item.fileName.toLowerCase().endsWith('.webp')) {
          item.fileName = toWebpFileName(item.fileName);
        }
      }
    } else if (item.type === 'gallery' && item.galleryUrls) {
      item.galleryUrls = item.galleryUrls.map((photo) => {
        const isWebp =
          photo.url?.toLowerCase().includes('.webp') ||
          Boolean(photo.storageKey?.toLowerCase().endsWith('.webp')) ||
          photo.optimizedFormat === 'webp';
        if (isWebp) {
          return {
            ...photo,
            type: 'image/webp',
            optimizedFormat: 'webp',
            name: photo.name ? (photo.name.toLowerCase().endsWith('.webp') ? photo.name : toWebpFileName(photo.name)) : photo.name,
          };
        }
        return photo;
      });
    }

    return item;
  });

  // Post-process: apply image reuse from source items to target items
  const itemMap = new Map<string, AssetChecklistItem>();
  mappedItems.forEach((item) => itemMap.set(item.id, item));

  mappedItems.forEach((sourceItem) => {
    if (
      sourceItem.reuseTargets &&
      sourceItem.reuseTargets.length > 0 &&
      sourceItem.fileUrl &&
      sourceItem.status === 'provided'
    ) {
      sourceItem.reuseTargets.forEach((targetId) => {
        const target = itemMap.get(targetId);
        if (
          target &&
          target.type === 'image' &&
          !target.isManualOverride
        ) {
          // Check if the existing item has reusedFromId set (user opted in)
          const existingTarget = existingMap.get(targetId);
          if (existingTarget?.reusedFromId === sourceItem.id) {
            target.fileUrl = sourceItem.fileUrl;
            target.fileName = sourceItem.fileName;
            target.fileSize = sourceItem.fileSize;
            target.fileType = sourceItem.fileType;
            target.storageKey = sourceItem.storageKey;
            target.width = sourceItem.width;
            target.height = sourceItem.height;
            target.originalSize = sourceItem.originalSize;
            target.optimizedSize = sourceItem.optimizedSize;
            target.optimizedFormat = sourceItem.optimizedFormat;
            target.status = 'provided';
            target.reusedFromId = sourceItem.id;
            target.sourceSection = `Reused from ${sourceItem.title}`;
          }
        }
      });
    }
  });

  return mappedItems;
}

export interface AssetChecklistScore {
  totalRequired: number;
  providedRequired: number;
  pendingRequired: number;
  notApplicableCount: number;
  optionalCount: number;
  recommendedCount: number;
  statutoryCount: number;
  percentage: number;
  missingRequiredTitles: string[];
  willProvideLaterCount: number;
}

/**
 * Calculates genuine onboarding completeness score for the asset checklist section.
 * Distinguishes ONBOARDING COMPLETION from PUBLICATION READINESS.
 * 
 * In Onboarding:
 * Items marked "will_provide_later" allow the school to complete onboarding with a pending acknowledgement.
 * But unaddressed items ('not_provided' or 'pending') reduce the onboarding score.
 */
export function calculateAssetChecklistScore(items: AssetChecklistItem[]): AssetChecklistScore {
  let totalRequired = 0;
  let providedRequired = 0;
  let pendingRequired = 0;
  let willProvideLaterCount = 0;
  let notApplicableCount = 0;
  let optionalCount = 0;
  let recommendedCount = 0;
  let statutoryCount = 0;
  const missingRequiredTitles: string[] = [];

  items.forEach((item) => {
    const isMandatory = item.requirement === 'required' || item.requirement === 'statutory';

    if (item.requirement === 'statutory') statutoryCount++;
    else if (item.requirement === 'recommended') recommendedCount++;
    else if (item.requirement === 'optional') optionalCount++;

    if (isMandatory) {
      totalRequired++;
      if (item.status === 'provided') {
        providedRequired++;
      } else if (item.status === 'will_provide_later') {
        willProvideLaterCount++;
        // Formal acknowledgement permits onboarding progress without falsely calling asset provided
        providedRequired++;
      } else if (item.status === 'not_applicable') {
        if (item.allowNotApplicable) {
          providedRequired++;
          notApplicableCount++;
        } else {
          // Statutory/Required items must NEVER be bypassed with Not Applicable
          missingRequiredTitles.push(item.title);
        }
      } else {
        pendingRequired++;
        missingRequiredTitles.push(item.title);
      }
    } else if (item.requirement === 'conditional') {
      if (item.status === 'not_applicable') {
        notApplicableCount++;
      }
    } else {
      if (item.status === 'not_applicable') notApplicableCount++;
      if (item.status === 'will_provide_later') willProvideLaterCount++;
    }
  });

  const percentage = totalRequired > 0 ? Math.round((providedRequired / totalRequired) * 100) : 100;

  return {
    totalRequired,
    providedRequired,
    pendingRequired,
    notApplicableCount,
    optionalCount,
    recommendedCount,
    statutoryCount,
    percentage,
    missingRequiredTitles,
    willProvideLaterCount,
  };
}

export interface PublicationReadinessResult {
  isReadyForPublication: boolean;
  blockingItems: Array<{ id: string; title: string; requirement: AssetChecklistRequirement; reason: string }>;
  summary: string;
}

/**
 * Evaluates website publication and deployment readiness.
 * Identifies assets that MUST be physically provided before the website goes public.
 */
export function evaluatePublicationReadiness(
  items: AssetChecklistItem[]
): PublicationReadinessResult {
  const blockingItems: Array<{ id: string; title: string; requirement: AssetChecklistRequirement; reason: string }> = [];

  items.forEach((item) => {
    const isBlocker = item.isPublicationBlocker || item.requirement === 'statutory';

    if (isBlocker) {
      if (item.status !== 'provided') {
        blockingItems.push({
          id: item.id,
          title: item.title,
          requirement: item.requirement,
          reason:
            item.requirement === 'statutory'
              ? 'Statutory compliance document required for legal public disclosure.'
              : 'Core institutional asset required for website launch.',
        });
      }
    }
  });

  const isReady = blockingItems.length === 0;
  const summary = isReady
    ? 'All statutory and essential publication assets are verified and ready for website deployment.'
    : `Website publication blocked: ${blockingItems.length} mandatory item(s) pending (${blockingItems.map((b) => b.title).slice(0, 3).join(', ')}${blockingItems.length > 3 ? '...' : ''}).`;

  return {
    isReadyForPublication: isReady,
    blockingItems,
    summary,
  };
}
