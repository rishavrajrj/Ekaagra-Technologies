import type {
  UniversalIntakeData,
  MediaAssetsData,
  MediaAssetItem,
  MediaAssetCategory,
  MediaAssetRequirementLevel,
  MediaAssetReadinessStatus,
  MediaAssetOwnership,
  MediaAssetType,
  MediaGovernanceData,
} from './types';
import { resolvePortalApplicability } from './portalRequirementsUtils';

// ─── 1. CATEGORY METADATA ───────────────────────────────────────────────────

export interface MediaAssetCategoryInfo {
  id: MediaAssetCategory;
  label: string;
  title: string;
  description: string;
  order: number;
}

export const MEDIA_ASSET_CATEGORIES: MediaAssetCategoryInfo[] = [
  {
    id: 'branding',
    label: 'School Branding',
    title: 'Visual Identity, Logos & Brand Guidelines',
    description: 'Vector and high-resolution logos, brand colors, typography, and official style guides.',
    order: 1,
  },
  {
    id: 'campus_facilities',
    label: 'Campus & Facilities',
    title: 'Campus Architecture, Classrooms & Amenities',
    description: 'Photographs of building façades, digital classrooms, science labs, libraries, and campus grounds.',
    order: 2,
  },
  {
    id: 'people_community',
    label: 'People & Community',
    title: 'School Leadership, Faculty & Student Life',
    description: 'Portraits of the Principal, management, faculty, student activities, and alumni achievements.',
    order: 3,
  },
  {
    id: 'academic_promotional',
    label: 'Academic & Promotional',
    title: 'School Story, Achievements, Prospectus & Video',
    description: 'Structured institutional narrative, vision statement, awards, admission brochures, and campus videos.',
    order: 4,
  },
  {
    id: 'digital_channels',
    label: 'Digital Channels',
    title: 'Website, Mobile App & Portal Display Assets',
    description: 'Banners, app splash screens, circular letterheads, and social media template graphics.',
    order: 5,
  },
  {
    id: 'legal_governance',
    label: 'Legal & Usage Rights',
    title: 'Copyright Authorization, Student Consent & Disclosures',
    description: 'Confirmation of institutional copyright ownership, student photo consent policies, and publication terms.',
    order: 6,
  },
];

// ─── 2. READINESS & OWNERSHIP CONSTANTS ──────────────────────────────────────

export interface ReadinessStatusOption {
  id: MediaAssetReadinessStatus;
  label: string;
  description: string;
  badgeClass: string;
}

export const READINESS_STATUS_OPTIONS: ReadinessStatusOption[] = [
  {
    id: 'not_started',
    label: 'Not Started',
    description: 'Asset has not been collected or prepared yet.',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  {
    id: 'in_progress',
    label: 'In Progress / Photography Scheduled',
    description: 'Currently being designed, drafted, or photographed.',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  {
    id: 'ready',
    label: 'Ready in School Archives',
    description: 'File is available and ready for handover or upload.',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  {
    id: 'provided',
    label: 'Provided / Shared with Ekaagra',
    description: 'Uploaded, linked, or shared with the implementation team.',
    badgeClass: 'bg-indigo-100 text-[#4338CA] border-indigo-200',
  },
  {
    id: 'needs_review',
    label: 'Needs Review / Low Resolution',
    description: 'Asset exists but requires quality inspection or format conversion.',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
  },
  {
    id: 'not_applicable',
    label: 'Not Applicable',
    description: 'Not required due to institutional profile (e.g. Day School).',
    badgeClass: 'bg-slate-200 text-slate-600 border-slate-300',
  },
];

export interface OwnershipStatusOption {
  id: MediaAssetOwnership;
  label: string;
  description: string;
}

export const OWNERSHIP_STATUS_OPTIONS: OwnershipStatusOption[] = [
  {
    id: 'institution_owned',
    label: 'Institution Owned',
    description: 'Created by or commissioned exclusively for the school with full copyright ownership.',
  },
  {
    id: 'agency_produced',
    label: 'Agency Produced',
    description: 'Delivered by an external professional photography/branding agency under contract.',
  },
  {
    id: 'student_parent_work',
    label: 'Student / Parent Work',
    description: 'Contributed by student/parent with parental consent for school promotional use.',
  },
  {
    id: 'licensed_stock',
    label: 'Licensed Stock / Third Party',
    description: 'Commercially licensed stock imagery with appropriate digital usage permissions.',
  },
  {
    id: 'pending_clearance',
    label: 'Pending Rights Clearance',
    description: 'Copyright or usage permissions are currently being confirmed.',
  },
];

// ─── 3. CANONICAL DEFAULT ASSET REGISTRY ─────────────────────────────────────

export interface MediaAssetDefinition {
  id: string;
  name: string;
  category: MediaAssetCategory;
  assetType: MediaAssetType;
  description: string;
  usageLocations: string[];
  requirementLevel: MediaAssetRequirementLevel;
  expectedFormats: string[];
  recommendedResolution: string;
  quantityGuidance: string;
  consentRequired?: boolean;
}

export const DEFAULT_MEDIA_ASSETS: MediaAssetDefinition[] = [
  // ─── GROUP A: SCHOOL BRANDING ──────────────────────────────────────────────
  {
    id: 'primary_logo',
    name: 'Primary Institutional Logo / Crest',
    category: 'branding',
    assetType: 'vector',
    description: 'Official high-resolution school emblem or crest with clear margins and transparent background.',
    usageLocations: ['Website Header & Footer', 'Mobile App Bar', 'ID Cards', 'Report Cards', 'Fee Receipts'],
    requirementLevel: 'mandatory',
    expectedFormats: ['SVG', 'PNG', 'AI', 'EPS'],
    recommendedResolution: 'Min 1024x1024px transparent (Vector SVG preferred)',
    quantityGuidance: '1 primary official emblem',
  },
  {
    id: 'alternate_logo',
    name: 'Monochrome / White Reversed Logo',
    category: 'branding',
    assetType: 'vector',
    description: 'All-white or single-color variant for display against dark backgrounds, photo overlays, and mobile banners.',
    usageLocations: ['Dark Footers', 'Hero Video Overlays', 'Mobile Splash Screens'],
    requirementLevel: 'recommended',
    expectedFormats: ['SVG', 'PNG'],
    recommendedResolution: 'Min 1024x1024px transparent',
    quantityGuidance: '1 white / reverse variant',
  },
  {
    id: 'favicon_app_icon',
    name: 'Favicon & App Launcher Icon',
    category: 'branding',
    assetType: 'image',
    description: 'Square, simplified icon visible at 16x16px browser tab size and mobile home screen app launcher.',
    usageLocations: ['Browser Tabs', 'Android/iOS App Icon', 'PWA Web App Icon'],
    requirementLevel: 'mandatory',
    expectedFormats: ['PNG', 'ICO', 'SVG'],
    recommendedResolution: '512x512px square, centered emblem',
    quantityGuidance: '1 square icon',
  },
  {
    id: 'brand_colors',
    name: 'Official Brand Color Palette',
    category: 'branding',
    assetType: 'color_palette',
    description: 'Primary school colors (e.g. Navy Blue, Maroon, Forest Green) and accent colors for digital interface consistency.',
    usageLocations: ['Navigation Bars', 'Buttons', 'Badges', 'Document Headers'],
    requirementLevel: 'mandatory',
    expectedFormats: ['HEX Codes', 'RGB', 'Brand Guide'],
    recommendedResolution: 'Primary, Secondary & Neutral Hex codes',
    quantityGuidance: '1 primary + 1-2 accent colors',
  },
  {
    id: 'typography_fonts',
    name: 'Approved Brand Typefaces & Fonts',
    category: 'branding',
    assetType: 'typography',
    description: 'School preferred font families for headings and body copy (e.g. Inter, Merriweather, Poppins).',
    usageLocations: ['Website Typography', 'Official Digital Circulars', 'Annual Reports'],
    requirementLevel: 'recommended',
    expectedFormats: ['TTF', 'WOFF2', 'Google Fonts Name'],
    recommendedResolution: 'Font family names or webfont packages',
    quantityGuidance: '1 Heading font + 1 Body font',
  },
  {
    id: 'brand_guidelines',
    name: 'Official Brand Identity Manual',
    category: 'branding',
    assetType: 'document',
    description: 'Institutional design system guide covering emblem clear-space, co-branding rules, and forbidden modifications.',
    usageLocations: ['Implementation Reference', 'Vendor Handover', 'Print Publications'],
    requirementLevel: 'optional',
    expectedFormats: ['PDF'],
    recommendedResolution: 'Standard PDF Document',
    quantityGuidance: '1 guideline document',
  },

  // ─── GROUP B: CAMPUS & FACILITIES ──────────────────────────────────────────
  {
    id: 'campus_facade',
    name: 'Campus Building & Main Entrance',
    category: 'campus_facilities',
    assetType: 'image',
    description: 'High-quality wide landscape shots of the primary campus building, school gate, and architectural façade.',
    usageLocations: ['Website Homepage Hero', 'Prospectus Cover', 'Google Maps Card'],
    requirementLevel: 'mandatory',
    expectedFormats: ['JPG', 'WebP', 'PNG'],
    recommendedResolution: 'Min 2560x1440px (16:9 Landscape)',
    quantityGuidance: '3 to 5 landscape photographs',
  },
  {
    id: 'reception_admin',
    name: 'Reception Desk & Visitors Lobby',
    category: 'campus_facilities',
    assetType: 'image',
    description: 'Welcoming photographs of the admissions front desk, administrative foyer, and principal lounge.',
    usageLocations: ['Admissions Page', 'Virtual Tour Gallery', 'About Us Section'],
    requirementLevel: 'recommended',
    expectedFormats: ['JPG', 'WebP'],
    recommendedResolution: 'Min 1920x1080px Landscape',
    quantityGuidance: '2 to 4 interior photographs',
  },
  {
    id: 'classrooms',
    name: 'Classrooms & Smart Interactive Boards',
    category: 'campus_facilities',
    assetType: 'image',
    description: 'Bright photographs of well-ventilated classrooms, student desks, and interactive digital display panels.',
    usageLocations: ['Academics Page', 'Infrastructure Showcase', 'Facilities Tab'],
    requirementLevel: 'mandatory',
    expectedFormats: ['JPG', 'WebP'],
    recommendedResolution: 'Min 1920x1080px Landscape',
    quantityGuidance: '3 to 6 classroom photographs',
  },
  {
    id: 'laboratories',
    name: 'Science, Computer & Robotics Labs',
    category: 'campus_facilities',
    assetType: 'image',
    description: 'Clean photographs of Physics, Chemistry, Biology, Computer, and STEM/Robotics equipment with modern setups.',
    usageLocations: ['Academics & Science Page', 'Curriculum Highlights'],
    requirementLevel: 'mandatory',
    expectedFormats: ['JPG', 'WebP'],
    recommendedResolution: 'Min 1920x1080px Landscape',
    quantityGuidance: '3 to 5 laboratory photographs',
  },
  {
    id: 'library_photos',
    name: 'Central Library & Reading Hall',
    category: 'campus_facilities',
    assetType: 'image',
    description: 'Book stacks, quiet reading areas, reference section, and student research terminals.',
    usageLocations: ['Library Portal Banner', 'Campus Amenities Page'],
    requirementLevel: 'conditional', // conditional: library
    expectedFormats: ['JPG', 'WebP'],
    recommendedResolution: 'Min 1920x1080px Landscape',
    quantityGuidance: '2 to 4 photographs',
  },
  {
    id: 'sports_facilities',
    name: 'Sports Grounds, Courts & Athletics',
    category: 'campus_facilities',
    assetType: 'image',
    description: 'Playing fields, basketball/tennis courts, swimming pool, indoor sports arena, and athletic tracks.',
    usageLocations: ['Sports & Co-curricular Page', 'Gallery Showcase'],
    requirementLevel: 'recommended',
    expectedFormats: ['JPG', 'WebP'],
    recommendedResolution: 'Min 1920x1080px Landscape',
    quantityGuidance: '3 to 5 action/ground photographs',
  },
  {
    id: 'hostel_facilities',
    name: 'Hostel Dormitories & Residential Mess',
    category: 'campus_facilities',
    assetType: 'image',
    description: 'Boarding room setups, student study tables, dining hall, and warden security desk.',
    usageLocations: ['Hostel Portal', 'Boarding Information Page'],
    requirementLevel: 'conditional', // conditional: hostel
    expectedFormats: ['JPG', 'WebP'],
    recommendedResolution: 'Min 1920x1080px Landscape',
    quantityGuidance: '3 to 5 interior photographs',
  },
  {
    id: 'transport_fleet',
    name: 'Transport Fleet & School Buses',
    category: 'campus_facilities',
    assetType: 'image',
    description: 'Yellow school buses, transit vans, and driver safety inspection area.',
    usageLocations: ['Transport Portal', 'Safety & Transit Page'],
    requirementLevel: 'conditional', // conditional: transport
    expectedFormats: ['JPG', 'WebP'],
    recommendedResolution: 'Min 1920x1080px Landscape',
    quantityGuidance: '2 to 4 exterior bus photographs',
  },
  {
    id: 'auditorium_cafeteria',
    name: 'Auditorium, Amphitheater & Cafeteria',
    category: 'campus_facilities',
    assetType: 'image',
    description: 'Assembly halls, stage performance lighting, school cafeteria, and hygienic food service counters.',
    usageLocations: ['Campus Infrastructure Page', 'Events Showcase'],
    requirementLevel: 'recommended',
    expectedFormats: ['JPG', 'WebP'],
    recommendedResolution: 'Min 1920x1080px Landscape',
    quantityGuidance: '2 to 4 facility photographs',
  },

  // ─── GROUP C: PEOPLE & SCHOOL COMMUNITY ────────────────────────────────────
  {
    id: 'principal_photo',
    name: 'Principal / Head of Institution Portrait',
    category: 'people_community',
    assetType: 'image',
    description: 'Formal high-resolution executive portrait of the Principal with neutral or campus background.',
    usageLocations: ["Principal's Desk Message", 'Leadership Page', 'Annual Prospectus'],
    requirementLevel: 'mandatory',
    expectedFormats: ['JPG', 'PNG', 'WebP'],
    recommendedResolution: 'Min 1200x1600px (3:4 Portrait)',
    quantityGuidance: '1 formal executive portrait',
  },
  {
    id: 'management_trustees',
    name: 'Chairman & Board of Management Portraits',
    category: 'people_community',
    assetType: 'image',
    description: 'Formal portraits or group photograph of the Board of Trustees, President, or Managing Committee.',
    usageLocations: ['Management Page', 'Institutional Governance'],
    requirementLevel: 'recommended',
    expectedFormats: ['JPG', 'PNG', 'WebP'],
    recommendedResolution: 'Min 1200x1600px Portrait or Landscape',
    quantityGuidance: '2 to 4 leadership portraits',
  },
  {
    id: 'faculty_portraits',
    name: 'Teaching Faculty & Department Heads',
    category: 'people_community',
    assetType: 'image',
    description: 'Professional portraits of academic department heads or cohesive faculty team group photograph.',
    usageLocations: ['Faculty Directory', 'Academics Team Section'],
    requirementLevel: 'recommended',
    expectedFormats: ['JPG', 'PNG', 'WebP'],
    recommendedResolution: 'Min 800x1000px per teacher or 2560x1440px group',
    quantityGuidance: '5 to 15 key faculty photos or 1 group photo',
  },
  {
    id: 'support_staff',
    name: 'Administrative & Support Staff Group',
    category: 'people_community',
    assetType: 'image',
    description: 'Group photograph of accounts, admissions, security, and estate maintenance personnel.',
    usageLocations: ['About Us - Our Team', 'Operational Directory'],
    requirementLevel: 'optional',
    expectedFormats: ['JPG', 'WebP'],
    recommendedResolution: 'Min 1920x1080px Landscape',
    quantityGuidance: '1 to 2 group photographs',
  },
  {
    id: 'student_campus_life',
    name: 'Student Classroom & Campus Life Imagery',
    category: 'people_community',
    assetType: 'image',
    description: 'Candid, authentic photographs of students engaged in learning, art, science, and campus assemblies.',
    usageLocations: ['Website Carousel', 'Student Life Section', 'Social Media Feeds'],
    requirementLevel: 'mandatory',
    expectedFormats: ['JPG', 'WebP'],
    recommendedResolution: 'Min 1920x1080px Landscape',
    quantityGuidance: '5 to 10 high-resolution photos',
    consentRequired: true,
  },
  {
    id: 'alumni_highlights',
    name: 'Notable Alumni & Distinguished Guests',
    category: 'people_community',
    assetType: 'image',
    description: 'Portraits or event photos of prominent alumni, guest speakers, and convocation chief guests.',
    usageLocations: ['Alumni Association Tab', 'Hall of Fame'],
    requirementLevel: 'optional',
    expectedFormats: ['JPG', 'WebP'],
    recommendedResolution: 'Min 1200x800px',
    quantityGuidance: '2 to 5 historical or event photos',
  },

  // ─── GROUP D: ACADEMIC & PROMOTIONAL CONTENT ───────────────────────────────
  {
    id: 'school_overview_text',
    name: 'School Overview, History & Heritage (Text)',
    category: 'academic_promotional',
    assetType: 'copy_text',
    description: 'Written institutional history: founding year, visionary founders, growth milestones, and educational ethos.',
    usageLocations: ['About Us Webpage', 'Overview Brochure', 'Official Profile'],
    requirementLevel: 'mandatory',
    expectedFormats: ['Plain Text', 'Word / Docx', 'Section 6 Mirror'],
    recommendedResolution: '200 to 500 words structured narrative',
    quantityGuidance: '1 institutional overview narrative',
  },
  {
    id: 'vision_mission_text',
    name: 'Vision, Mission & Core Values (Text)',
    category: 'academic_promotional',
    assetType: 'copy_text',
    description: 'Formal statements of institutional philosophy, character development, and academic excellence.',
    usageLocations: ['Vision & Mission Webpage', 'Parent Handbook', 'Hallway Displays'],
    requirementLevel: 'mandatory',
    expectedFormats: ['Plain Text', 'Word / Docx', 'Section 6 Mirror'],
    recommendedResolution: 'Concise vision statement + 3 to 5 core values',
    quantityGuidance: '1 vision + 1 mission statement',
  },
  {
    id: 'board_results_wall',
    name: 'Board Examination Results & Toppers Tally',
    category: 'academic_promotional',
    assetType: 'image',
    description: 'Recent Class X and XII CBSE/ICSE board result statistics, school pass percentage, and student honor roll.',
    usageLocations: ['Admissions Page', 'Academic Excellence Banner'],
    requirementLevel: 'recommended',
    expectedFormats: ['JPG', 'PNG', 'PDF'],
    recommendedResolution: 'High-res graphic or clean PDF document',
    quantityGuidance: '1 to 2 results infographics',
  },
  {
    id: 'awards_accreditations',
    name: 'Institutional Awards & Accreditation Letters',
    category: 'academic_promotional',
    assetType: 'image',
    description: 'Rankings (e.g. EducationWorld, Times School Survey), green campus awards, and CBSE affiliation certificate.',
    usageLocations: ['Awards & Accreditations Page', 'Trust Badges'],
    requirementLevel: 'recommended',
    expectedFormats: ['JPG', 'PNG', 'PDF'],
    recommendedResolution: 'Clean scanned certificates or trophies photos',
    quantityGuidance: '2 to 5 award records',
  },
  {
    id: 'annual_events_archive',
    name: 'Annual Day, Sports Day & Exhibitions Archive',
    category: 'academic_promotional',
    assetType: 'image',
    description: 'Vibrant photographs from recent school celebrations: cultural festivals, sports tournaments, and science fairs.',
    usageLocations: ['Events Gallery', 'Photo Album Archive', 'Social Feeds'],
    requirementLevel: 'recommended',
    expectedFormats: ['JPG', 'WebP'],
    recommendedResolution: 'Min 1920x1080px Landscape',
    quantityGuidance: '5 to 10 curated celebration photos',
    consentRequired: true,
  },
  {
    id: 'testimonials_quotes',
    name: 'Parent & Student Testimonials (Quotes + Photos)',
    category: 'academic_promotional',
    assetType: 'copy_text',
    description: 'Authentic feedback quotes from parents and graduating students with their name, ward class, and headshot.',
    usageLocations: ['Homepage Testimonials Slider', 'Admissions Portal'],
    requirementLevel: 'recommended',
    expectedFormats: ['Text Quotes + Square JPG Photos'],
    recommendedResolution: '50-100 word quotes with 400x400px photos',
    quantityGuidance: '3 to 6 verified testimonials',
    consentRequired: true,
  },
  {
    id: 'prospectus_brochure',
    name: 'Official School Prospectus / Brochure (PDF)',
    category: 'academic_promotional',
    assetType: 'document',
    description: 'Complete digital admission brochure or information handbook distributed to prospective parents.',
    usageLocations: ['Admissions Download Center', 'Email Auto-responder'],
    requirementLevel: 'mandatory',
    expectedFormats: ['PDF'],
    recommendedResolution: 'Standard Web-optimized PDF (< 25MB)',
    quantityGuidance: '1 primary prospectus PDF document',
  },
  {
    id: 'promo_video',
    name: 'Virtual Campus Tour / Promotional Video',
    category: 'academic_promotional',
    assetType: 'video',
    description: 'Professionally filmed video showcasing school infrastructure, student achievements, and campus atmosphere.',
    usageLocations: ['Homepage Video Modal', 'YouTube Channel', 'Admissions Campaign'],
    requirementLevel: 'recommended',
    expectedFormats: ['MP4 Video File', 'YouTube Link', 'Vimeo Link'],
    recommendedResolution: '1080p Full HD (16:9 Landscape, 2-3 mins)',
    quantityGuidance: '1 video link or MP4 master file',
  },

  // ─── GROUP E: DIGITAL CHANNEL CONTENT ──────────────────────────────────────
  {
    id: 'website_hero_banners',
    name: 'Website Homepage Showcase Hero Banners',
    category: 'digital_channels',
    assetType: 'image',
    description: 'High-impact panoramic photography sized specifically for modern widescreen desktop and tablet hero sliders.',
    usageLocations: ['Homepage Top Carousel', 'Landing Page Hero'],
    requirementLevel: 'mandatory',
    expectedFormats: ['JPG', 'WebP'],
    recommendedResolution: '2560x1080px (21:9 or 16:9 Ultra-wide Landscape)',
    quantityGuidance: '3 to 5 cinematic showcase photos',
  },
  {
    id: 'mobile_app_splash',
    name: 'Mobile App Welcome / Splash Screen Graphic',
    category: 'digital_channels',
    assetType: 'image',
    description: 'Vertical branding visual displayed while the school mobile app initializes on Android and iOS devices.',
    usageLocations: ['Android App Splash', 'iOS Launch Screen'],
    requirementLevel: 'conditional', // conditional: mobile app
    expectedFormats: ['PNG', 'SVG', 'WebP'],
    recommendedResolution: '1080x1920px (9:16 Vertical Portrait)',
    quantityGuidance: '1 vertical splash artwork',
  },
  {
    id: 'portal_dashboard_headers',
    name: 'Parent & Staff Portal Header Banners',
    category: 'digital_channels',
    assetType: 'image',
    description: 'Clean header background illustration or campus graphic across student and parent web portals.',
    usageLocations: ['Parent Portal Header', 'Staff Portal Header'],
    requirementLevel: 'conditional', // conditional: portals
    expectedFormats: ['PNG', 'WebP', 'JPG'],
    recommendedResolution: '1920x400px (Wide Header Ribbon)',
    quantityGuidance: '1 to 2 header ribbons',
  },
  {
    id: 'circular_letterhead',
    name: 'Official Digital Letterhead Template',
    category: 'digital_channels',
    assetType: 'document',
    description: 'School letterhead with official address, affiliation number, phone, email, and crest for circulars.',
    usageLocations: ['Automated PDF Notices', 'Fee Due Reminders', 'Parent Circulars'],
    requirementLevel: 'mandatory',
    expectedFormats: ['Word Docx', 'PDF', 'PNG Transparent Header'],
    recommendedResolution: 'A4 Page Dimensions (300 DPI)',
    quantityGuidance: '1 master institutional letterhead',
  },
  {
    id: 'social_media_kit',
    name: 'Social Media Profile & Cover Graphics',
    category: 'digital_channels',
    assetType: 'image',
    description: 'Coordinated banner images for Facebook, Instagram, LinkedIn, and YouTube school accounts.',
    usageLocations: ['Facebook Cover', 'LinkedIn Header', 'YouTube Banner'],
    requirementLevel: 'recommended',
    expectedFormats: ['PNG', 'JPG', 'Canva Link'],
    recommendedResolution: 'Platform standards (16:9 & 1:1)',
    quantityGuidance: '1 profile avatar + 1 banner graphic',
  },
  {
    id: 'statutory_documents',
    name: 'Mandatory Public Disclosures & Affiliation Certificate',
    category: 'digital_channels',
    assetType: 'document',
    description: 'CBSE/State Board mandatory disclosure documents, Society registration, and fire/sanitation safety certificates.',
    usageLocations: ['Statutory Compliance Page', 'Transparency Center'],
    requirementLevel: 'mandatory',
    expectedFormats: ['PDF Documents'],
    recommendedResolution: 'Scanned PDF Documents (< 10MB each)',
    quantityGuidance: '1 set of mandatory disclosure PDFs',
  },
];

// ─── 4. CROSS-SECTION APPLICABILITY RESOLUTION ───────────────────────────────

export interface MediaAssetsApplicability {
  isHostelApplicable: boolean;
  isTransportApplicable: boolean;
  isLibraryApplicable: boolean;
  isMobileAppApplicable: boolean;
  isPortalsApplicable: boolean;
  hostelReason?: string;
  transportReason?: string;
  libraryReason?: string;
  mobileAppReason?: string;
  portalsReason?: string;
}

export function resolveMediaAssetsApplicability(
  intakeData?: Partial<UniversalIntakeData> | null
): MediaAssetsApplicability {
  const portalApplicability = resolvePortalApplicability(intakeData);

  // 1. Hostel: Not applicable if day school or explicitly disabled
  const isHostelApplicable = portalApplicability.isHostelApplicable;
  const hostelReason = portalApplicability.hostelReason;

  // 2. Transport: Applicable if transport enabled
  const isTransportApplicable = portalApplicability.isTransportApplicable;
  const transportReason = portalApplicability.transportReason;

  // 3. Library: Applicable unless explicitly disabled
  const isLibraryApplicable = portalApplicability.isLibraryApplicable;
  const libraryReason = portalApplicability.libraryReason;

  // 4. Mobile App: Applicable if mobileAppConfig is enabled or platforms selected
  const mobileConfig = intakeData?.mobileAppConfig;
  const isMobileAppApplicable =
    Boolean(
      mobileConfig?.platforms?.android ||
      mobileConfig?.platforms?.ios ||
      mobileConfig?.platforms?.pwa ||
      mobileConfig?.supportedPlatforms?.length
    ) || (mobileConfig as any)?.enabled !== false;
  const mobileAppReason =
    (mobileConfig as any)?.enabled === false
      ? 'Mobile applications are disabled in Section 22. Mobile app graphic requirements are optional.'
      : undefined;

  // 5. Portals: Applicable if parent, student, or staff portals enabled in Section 27
  const portalsConfig = intakeData?.portalRequirements?.portals;
  const isPortalsApplicable =
    portalsConfig?.parent === 'enabled' ||
    portalsConfig?.student === 'enabled' ||
    portalsConfig?.teacher === 'enabled' ||
    intakeData?.portalRequirements?.parentPortalEnabled !== false;
  const portalsReason =
    isPortalsApplicable === false
      ? 'User portals are disabled in Section 27. Portal banner requirements are optional.'
      : undefined;

  return {
    isHostelApplicable,
    isTransportApplicable,
    isLibraryApplicable,
    isMobileAppApplicable,
    isPortalsApplicable,
    hostelReason,
    transportReason,
    libraryReason,
    mobileAppReason,
    portalsReason,
  };
}

// ─── 5. NORMALIZATION & INTELLIGENT DEFAULTS ─────────────────────────────────

export function normalizeMediaAssetsData(
  raw?: Partial<MediaAssetsData> | null,
  intakeData?: Partial<UniversalIntakeData> | null
): MediaAssetsData {
  const applicability = resolveMediaAssetsApplicability(intakeData);
  const rawAssets = raw?.assets || {};

  const assets: Record<string, MediaAssetItem> = {};

  DEFAULT_MEDIA_ASSETS.forEach((def) => {
    const existing = rawAssets[def.id];

    // Determine dynamic applicability
    let isApplicable = true;
    let inapplicabilityReason: string | undefined = undefined;

    if (def.id === 'hostel_facilities') {
      isApplicable = applicability.isHostelApplicable;
      inapplicabilityReason = applicability.hostelReason;
    } else if (def.id === 'transport_fleet') {
      isApplicable = applicability.isTransportApplicable;
      inapplicabilityReason = applicability.transportReason;
    } else if (def.id === 'library_photos') {
      isApplicable = applicability.isLibraryApplicable;
      inapplicabilityReason = applicability.libraryReason;
    } else if (def.id === 'mobile_app_splash') {
      isApplicable = applicability.isMobileAppApplicable;
      inapplicabilityReason = applicability.mobileAppReason;
    } else if (def.id === 'portal_dashboard_headers') {
      isApplicable = applicability.isPortalsApplicable;
      inapplicabilityReason = applicability.portalsReason;
    }

    // Default readiness status: if not applicable, mark not_applicable; otherwise preserve or set not_started
    let readinessStatus: MediaAssetReadinessStatus =
      existing?.readinessStatus ||
      (isApplicable ? 'not_started' : 'not_applicable');

    // If section just became not applicable, override status to not_applicable
    if (!isApplicable && readinessStatus !== 'not_applicable') {
      readinessStatus = 'not_applicable';
    }

    // Pre-populate reference location if upstream logo/photo already exists in brandingDesign or campusPhotos
    let defaultReference = existing?.referenceLocation || '';
    if (!defaultReference) {
      if (def.id === 'primary_logo' && intakeData?.brandingDesign?.logoUrl) {
        defaultReference = intakeData.brandingDesign.logoUrl;
        if (readinessStatus === 'not_started') readinessStatus = 'ready';
      } else if (def.id === 'school_overview_text' && intakeData?.schoolContent?.aboutSchool) {
        defaultReference = 'Provided via Section 6 (School Story)';
        if (readinessStatus === 'not_started') readinessStatus = 'ready';
      } else if (def.id === 'vision_mission_text' && intakeData?.schoolContent?.mission) {
        defaultReference = 'Provided via Section 6 (Mission & Vision)';
        if (readinessStatus === 'not_started') readinessStatus = 'ready';
      } else if (def.id === 'brand_colors' && intakeData?.brandingDesign?.primaryColor) {
        defaultReference = `Primary: ${intakeData.brandingDesign.primaryColor}${intakeData.brandingDesign.secondaryColor ? ', Secondary: ' + intakeData.brandingDesign.secondaryColor : ''}`;
        if (readinessStatus === 'not_started') readinessStatus = 'ready';
      } else if (def.id === 'principal_photo' && (intakeData?.leadership?.principalPhoto?.url || intakeData?.leadership?.principalPhotoUrl)) {
        defaultReference = intakeData?.leadership?.principalPhoto?.url || intakeData?.leadership?.principalPhotoUrl || '';
        if (readinessStatus === 'not_started') readinessStatus = 'ready';
      }
    }

    assets[def.id] = {
      id: def.id,
      name: def.name,
      category: def.category,
      assetType: def.assetType,
      description: def.description,
      usageLocations: def.usageLocations,
      requirementLevel: def.requirementLevel,
      isApplicable,
      inapplicabilityReason,
      expectedFormats: def.expectedFormats,
      recommendedResolution: def.recommendedResolution,
      quantityGuidance: def.quantityGuidance,
      readinessStatus,
      referenceLocation: defaultReference,
      ownershipStatus: existing?.ownershipStatus || 'institution_owned',
      consentRequired: def.consentRequired ?? false,
      consentObtained: existing?.consentObtained ?? (def.consentRequired ? true : undefined),
      usageRestrictions: existing?.usageRestrictions || '',
      notes: existing?.notes || '',
      reviewStatus: existing?.reviewStatus || 'pending',
    };
  });

  // Preserve any custom user-added assets if present
  Object.keys(rawAssets).forEach((key) => {
    if (!assets[key]) {
      assets[key] = rawAssets[key];
    }
  });

  const governance: MediaGovernanceData = {
    schoolOwnershipConfirmed: raw?.governance?.schoolOwnershipConfirmed ?? true,
    thirdPartyLicensingCleared: raw?.governance?.thirdPartyLicensingCleared ?? true,
    studentPhotoConsentPolicyConfirmed: raw?.governance?.studentPhotoConsentPolicyConfirmed ?? true,
    staffPhotoConsentPolicyConfirmed: raw?.governance?.staffPhotoConsentPolicyConfirmed ?? true,
    publicationRestrictions: raw?.governance?.publicationRestrictions || '',
    geographicRestrictions: raw?.governance?.geographicRestrictions || '',
    licenseExpiryDate: raw?.governance?.licenseExpiryDate || '',
    governanceNotes: raw?.governance?.governanceNotes || '',
    authorizedSignatoryName: raw?.governance?.authorizedSignatoryName || intakeData?.usersAccess?.superAdminFullName || '',
    authorizedSignatoryDesignation: raw?.governance?.authorizedSignatoryDesignation || 'Principal / Authorized Administrator',
  };

  const logoReady = assets['primary_logo']?.readinessStatus === 'ready' || assets['primary_logo']?.readinessStatus === 'provided';
  const campusPhotosReady = assets['campus_facade']?.readinessStatus === 'ready' || assets['campus_facade']?.readinessStatus === 'provided';
  const leadershipPhotosReady = assets['principal_photo']?.readinessStatus === 'ready' || assets['principal_photo']?.readinessStatus === 'provided';
  const prospectusReady = assets['prospectus_brochure']?.readinessStatus === 'ready' || assets['prospectus_brochure']?.readinessStatus === 'provided';

  return {
    assets,
    governance,
    generalNotes: raw?.generalNotes || '',
    sharedDriveUrl: raw?.sharedDriveUrl || '',
    logoReady,
    campusPhotosReady,
    leadershipPhotosReady,
    prospectusReady,
  };
}

// ─── 6. VALIDATION ENGINE & COMPLETION SCORING ───────────────────────────────

export interface MediaAssetsValidationResult {
  isValid: boolean;
  missingFields: string[];
  score: {
    total: number;
    filled: number;
  };
  sectionPercentage: number;
  readinessCounts: {
    total: number;
    ready: number;
    provided: number;
    inProgress: number;
    notStarted: number;
    needsReview: number;
    notApplicable: number;
  };
}

export function validateMediaAssetsData(
  data?: Partial<MediaAssetsData> | null,
  intakeData?: Partial<UniversalIntakeData> | null
): MediaAssetsValidationResult {
  // Check completely empty / uninitialized object
  if (!data || Object.keys(data).length === 0 || !data.assets || Object.keys(data.assets).length === 0) {
    return {
      isValid: false,
      missingFields: [
        'Media Assets: Primary Institutional Logo must be confirmed or provided',
        'Media Assets: Campus Building & Main Entrance photos must be confirmed',
        'Media Assets: Principal Formal Portrait is required',
        'Media Assets: School Overview narrative is required',
        'Media Assets: Official School Prospectus / Brochure is required',
        'Media Assets: Official Brand Color Palette is required',
        'Media Assets: Institutional Copyright & Ownership must be confirmed',
        'Media Assets: Student Photo Consent Policy must be confirmed',
      ],
      score: { total: 8, filled: 0 },
      sectionPercentage: 0,
      readinessCounts: {
        total: DEFAULT_MEDIA_ASSETS.length,
        ready: 0,
        provided: 0,
        inProgress: 0,
        notStarted: DEFAULT_MEDIA_ASSETS.length,
        needsReview: 0,
        notApplicable: 0,
      },
    };
  }

  const normalized = normalizeMediaAssetsData(data, intakeData);
  const assets = normalized.assets || {};
  const missingFields: string[] = [];

  const counts = {
    total: Object.keys(assets).length,
    ready: 0,
    provided: 0,
    inProgress: 0,
    notStarted: 0,
    needsReview: 0,
    notApplicable: 0,
  };

  Object.values(assets).forEach((a) => {
    if (a.readinessStatus === 'ready') counts.ready++;
    else if (a.readinessStatus === 'provided') counts.provided++;
    else if (a.readinessStatus === 'in_progress') counts.inProgress++;
    else if (a.readinessStatus === 'needs_review') counts.needsReview++;
    else if (a.readinessStatus === 'not_applicable') counts.notApplicable++;
    else counts.notStarted++;
  });

  // Scoring is based on Applicable Mandatory & Core Recommended Requirements
  let totalScoreWeight = 0;
  let filledScoreWeight = 0;

  // Filter applicable items
  Object.values(assets).forEach((item) => {
    // If not applicable, zero penalty and zero score weight
    if (!item.isApplicable || item.readinessStatus === 'not_applicable') {
      return;
    }

    if (item.requirementLevel === 'mandatory') {
      totalScoreWeight += 1;
      const isComplete = item.readinessStatus === 'ready' || item.readinessStatus === 'provided';
      if (isComplete) {
        filledScoreWeight += 1;
      } else {
        missingFields.push(`Media Assets: ${item.name} is mandatory and needs attention`);
      }
    }
  });

  // Governance requirements (2 mandatory checkpoints)
  totalScoreWeight += 2;
  if (normalized.governance?.schoolOwnershipConfirmed) {
    filledScoreWeight += 1;
  } else {
    missingFields.push('Media Assets: Institutional Copyright & Ownership confirmation is required');
  }

  if (normalized.governance?.studentPhotoConsentPolicyConfirmed) {
    filledScoreWeight += 1;
  } else {
    missingFields.push('Media Assets: Student Photo Consent Policy confirmation is required');
  }

  const effectiveTotal = Math.max(1, totalScoreWeight);
  const percentage = Math.round((filledScoreWeight / effectiveTotal) * 100);

  return {
    isValid: missingFields.length === 0,
    missingFields,
    score: {
      total: effectiveTotal,
      filled: filledScoreWeight,
    },
    sectionPercentage: Math.min(100, Math.max(0, percentage)),
    readinessCounts: counts,
  };
}

// ─── 7. SUMMARY GENERATOR ───────────────────────────────────────────────────

export function generateMediaAssetsSummary(data: MediaAssetsData): string[] {
  const summary: string[] = [];
  const assets = data.assets || {};

  const totalAssets = Object.keys(assets).length;
  const readyCount = Object.values(assets).filter(
    (a) => a.readinessStatus === 'ready' || a.readinessStatus === 'provided'
  ).length;
  const inProgressCount = Object.values(assets).filter(
    (a) => a.readinessStatus === 'in_progress'
  ).length;
  const naCount = Object.values(assets).filter(
    (a) => a.readinessStatus === 'not_applicable'
  ).length;

  summary.push(`${readyCount} of ${totalAssets - naCount} applicable media items ready or provided`);

  if (inProgressCount > 0) {
    summary.push(`${inProgressCount} media assets in progress / scheduled`);
  }

  if (data.sharedDriveUrl && data.sharedDriveUrl.trim().length > 0) {
    summary.push('Shared Cloud Drive / Folder linked');
  }

  if (data.governance?.schoolOwnershipConfirmed) {
    summary.push('School copyright & ownership verified');
  }

  if (data.governance?.studentPhotoConsentPolicyConfirmed) {
    summary.push('Student photo usage consent policy verified');
  }

  if (data.governance?.publicationRestrictions && data.governance.publicationRestrictions.trim().length > 0) {
    summary.push(`Publication notice: ${data.governance.publicationRestrictions}`);
  }

  return summary;
}

// ─── 8. RECOMMENDED BASELINE AUDIT ───────────────────────────────────────────

export interface MediaBaselineRecommendation {
  id: string;
  type: 'warning' | 'info';
  message: string;
}

export function getMediaAssetsBaselineRecommendations(
  data: MediaAssetsData
): MediaBaselineRecommendation[] {
  const recs: MediaBaselineRecommendation[] = [];
  const assets = data.assets || {};

  const logo = assets['primary_logo'];
  if (!logo || (logo.readinessStatus !== 'ready' && logo.readinessStatus !== 'provided')) {
    recs.push({
      id: 'logo_pending',
      type: 'warning',
      message: 'Primary School Logo is not marked as ready. Vector (SVG) or transparent PNG is critical for website and mobile app branding.',
    });
  }

  const facade = assets['campus_facade'];
  if (!facade || (facade.readinessStatus !== 'ready' && facade.readinessStatus !== 'provided')) {
    recs.push({
      id: 'facade_pending',
      type: 'warning',
      message: 'Campus Building & Main Entrance landscape photography is pending. A high-resolution photo is needed for your website homepage banner.',
    });
  }

  const principal = assets['principal_photo'];
  if (!principal || (principal.readinessStatus !== 'ready' && principal.readinessStatus !== 'provided')) {
    recs.push({
      id: 'principal_pending',
      type: 'info',
      message: "Principal formal portrait is pending. This is needed for the Principal's Welcome Message on your portal and prospectus.",
    });
  }

  const prospectus = assets['prospectus_brochure'];
  if (!prospectus || (prospectus.readinessStatus !== 'ready' && prospectus.readinessStatus !== 'provided')) {
    recs.push({
      id: 'prospectus_pending',
      type: 'info',
      message: 'Official School Prospectus / Brochure PDF is pending. Prospective parents frequently download this during online admissions.',
    });
  }

  if (!data.sharedDriveUrl || data.sharedDriveUrl.trim().length === 0) {
    recs.push({
      id: 'drive_url_missing',
      type: 'info',
      message: 'Providing a Google Drive, Dropbox, or OneDrive folder link enables bulk media handover without individual upload friction.',
    });
  }

  return recs;
}
