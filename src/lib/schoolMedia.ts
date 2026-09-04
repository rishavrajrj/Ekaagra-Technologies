import type { SchoolMediaStatus } from './types';

export interface MediaFolderSpec {
  folder: string;
  label: string;
  description: string;
  requiredFiles: string[];
  subfolders?: string[];
  fileFormatRecommendations: string;
}

export const MEDIA_PACKAGE_SPECIFICATION: MediaFolderSpec[] = [
  {
    folder: '00_READ_ME_FIRST',
    label: 'Preparation & Submission Guidelines',
    description: 'Read this document before collecting and organizing campus assets.',
    requiredFiles: ['HOW_TO_SEND_YOUR_FILES.pdf'],
    fileFormatRecommendations: 'PDF instruction file explaining original-resolution asset requirements.',
  },
  {
    folder: '01_SCHOOL_IDENTITY',
    label: 'Institutional Identity & Leadership',
    description: 'High-resolution school logo, trust emblems, and leadership portraits.',
    requiredFiles: [
      'Logo (Vector SVG, PNG transparent background, high-res JPEG)',
      'Principal portrait (Professional formal photo)',
      'Chairman / Management portraits (Formal attire, clean background)',
      'School Motto / Crest graphics',
    ],
    subfolders: ['Logo', 'Principal', 'Chairman_Management', 'Other_Leadership', 'School_Name_Branding'],
    fileFormatRecommendations: 'PNG (300 DPI, transparent), SVG, or uncompressed JPEG (minimum 2000px wide).',
  },
  {
    folder: '02_CAMPUS',
    label: 'Campus & Infrastructure',
    description: 'Landscape exterior and interior photography showing the physical premises.',
    requiredFiles: [
      'Main school building exterior facade',
      'School entrance gate and security checkpoint',
      'Reception lobby and administrative office',
      'Typical classrooms (bright, clean, occupied or ready)',
      'Corridors and architectural features',
    ],
    subfolders: ['Main_Entrance', 'School_Building', 'Classrooms', 'Reception_Office', 'Corridors', 'Other_Areas'],
    fileFormatRecommendations: 'Horizontal/landscape orientation (16:9 or 4:3), minimum 2400x1600px, natural lighting.',
  },
  {
    folder: '03_FACILITIES',
    label: 'Academic & Campus Facilities',
    description: 'Specialized rooms, laboratories, sports grounds, and student amenities.',
    requiredFiles: [
      'Science laboratories (Physics, Chemistry, Biology)',
      'Computer laboratory / Digital learning centers',
      'Library reading rooms and book stacks',
      'Playground, sports fields, basketball/badminton courts',
      'Smart classrooms / Audio-Visual rooms',
      'School bus fleet / Transport vehicles',
      'Auditorium / Multipurpose hall',
      'Cafeteria / Dining hall (if applicable)',
    ],
    subfolders: [
      'Laboratories',
      'Computer_Lab',
      'Library',
      'Playground',
      'Sports',
      'Smart_Classrooms',
      'Transport',
      'Auditorium',
      'Cafeteria',
      'Other_Facilities',
    ],
    fileFormatRecommendations: 'Landscape photos showing students engaged in learning activities with teacher supervision.',
  },
  {
    folder: '04_ACADEMICS',
    label: 'Academic Life & Curriculum',
    description: 'Classes in session, STEM projects, interactive teaching, and workshops.',
    requiredFiles: ['Students in classrooms', 'Teaching sessions', 'Science exhibitions / Project displays'],
    subfolders: ['Teaching', 'Projects', 'Academic_Events', 'Workshops', 'Class_Activities'],
    fileFormatRecommendations: 'Candid, authentic photos; avoid artificial posing or filtered phone camera shots.',
  },
  {
    folder: '05_STUDENT_ACTIVITIES',
    label: 'Co-Curricular & Student Clubs',
    description: 'Art, music, dance, debate, robotics, yoga, scouts, and cultural groups.',
    requiredFiles: ['Cultural performances', 'Music & art rooms', 'Club meetings & assemblies'],
    subfolders: ['Cultural', 'Sports', 'Clubs', 'Competitions', 'Celebrations', 'Other_Activities'],
    fileFormatRecommendations: 'Action shots with vibrant colors and sharp focus.',
  },
  {
    folder: '06_ACHIEVEMENTS',
    label: 'Achievements, Honors & Board Results',
    description: 'Board toppers, sports trophies, inter-school certificates, and awards.',
    requiredFiles: ['Board exam merit list banner / photos', 'Trophy cabinet & state/national award winners'],
    subfolders: ['Student_Achievements', 'Staff_Achievements', 'Awards', 'Results', 'Certificates'],
    fileFormatRecommendations: 'High-res photos or clean digital artwork with names and achievements labeled.',
  },
  {
    folder: '07_EVENTS',
    label: 'Annual Functions & Celebrations',
    description: 'Annual Sports Day, Independence Day, Republic Day, Foundation Day.',
    requiredFiles: ['Annual day stage performances', 'Sports day prize distribution', 'National festivals'],
    subfolders: ['Annual_Function', 'Sports_Day', 'Festivals', 'National_Days', 'Educational_Events'],
    fileFormatRecommendations: 'Select top 10-15 standout photos per event rather than raw dump of hundreds.',
  },
  {
    folder: '08_FACULTY_STAFF',
    label: 'Faculty, Staff & Department Groups',
    description: 'Group photos and individual department leads for staff directories.',
    requiredFiles: ['All-faculty group photo', 'Departmental groups (Science, Humanities, Primary, Sports)'],
    subfolders: ['Group_Photos', 'Department_Heads', 'Teaching_Staff', 'Administrative_Staff'],
    fileFormatRecommendations: 'Formal setting with uniform attire or professional dress code.',
  },
  {
    folder: '09_ADMISSIONS',
    label: 'Admissions & Prospectus Documents',
    description: 'School prospectus, fee structure PDFs, and registration forms.',
    requiredFiles: ['School Prospectus (PDF)', 'Fee Structure circular (PDF)', 'Admission criteria sheet'],
    subfolders: ['Prospectus', 'Fee_Structure', 'Application_Forms', 'Guidelines'],
    fileFormatRecommendations: 'Clean printable PDF documents with official school seal and signature.',
  },
  {
    folder: '10_DOCUMENTS',
    label: 'Mandatory Public Disclosures & Affiliations',
    description: 'CBSE/ICSE/State affiliation certificates, NOC, building safety, water hygiene certificates.',
    requiredFiles: ['Affiliation grant letter', 'Fire safety certificate', 'Water health certificate', 'Society registration'],
    subfolders: ['Affiliation', 'Safety_Certificates', 'Society_Trust', 'Mandatory_Disclosure_OASIS'],
    fileFormatRecommendations: 'Clear, legible scanned PDF copies suitable for statutory compliance verification.',
  },
  {
    folder: '11_SOCIAL_MEDIA',
    label: 'Social Media & Marketing Assets',
    description: 'Branded banners, previous flyers, social media cover photos.',
    requiredFiles: ['Facebook/YouTube cover photos', 'Admission campaign promotional banners'],
    subfolders: ['Banners', 'Flyers', 'Logos_Icons'],
    fileFormatRecommendations: 'PNG or JPEG formatted to standard platform dimensions (e.g. 1920x1080).',
  },
  {
    folder: '12_VIDEOS',
    label: 'Campus Walkthrough & Video Links',
    description: 'Links to official YouTube campus tour videos or raw drone footage clips.',
    requiredFiles: ['YouTube link list (text file) or short MP4 video highlights'],
    subfolders: ['Video_Links', 'Raw_Footage_Clips'],
    fileFormatRecommendations: 'Text file with YouTube/Vimeo URLs or Google Drive links for large video files.',
  },
  {
    folder: '99_MISCELLANEOUS',
    label: 'Miscellaneous & Uncategorized',
    description: 'Any additional institutional photos, newspaper clippings, or press releases.',
    requiredFiles: ['Newspaper clippings of school events', 'Any other relevant institutional media'],
    subfolders: ['Press_Clippings', 'Special_Projects', 'Unsorted'],
    fileFormatRecommendations: 'Clearly labeled filenames describing the content and year.',
  },
];

export const MEDIA_STATUS_ORDER: SchoolMediaStatus[] = [
  'not_started',
  'package_downloaded',
  'package_in_progress',
  'package_submitted',
  'under_review',
  'changes_requested',
  'approved',
];

export const MEDIA_STATUS_LABELS: Record<SchoolMediaStatus, { label: string; badgeClass: string }> = {
  not_started: { label: 'Not Started', badgeClass: 'bg-slate-100 text-slate-700 border-slate-300' },
  package_downloaded: { label: 'Package Template Downloaded', badgeClass: 'bg-blue-50 text-blue-700 border-blue-300' },
  package_in_progress: { label: 'Files Being Collected', badgeClass: 'bg-amber-50 text-amber-700 border-amber-300' },
  package_submitted: { label: 'Media Package Submitted', badgeClass: 'bg-purple-50 text-purple-700 border-purple-300' },
  under_review: { label: 'Under Review by Tech Team', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-300' },
  changes_requested: { label: 'Changes / Higher Res Required', badgeClass: 'bg-orange-50 text-orange-700 border-orange-300' },
  approved: { label: 'Media Package Approved', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
};

export function generateMediaZipName(schoolName: string, projectNumber: string): string {
  const sanitizedName = schoolName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
  const sanitizedProj = projectNumber.replace(/[^a-zA-Z0-9]/g, '_');
  return `${sanitizedName}_${sanitizedProj}_MEDIA.zip`;
}

export function getRecommendedMediaFilename(subject: string, description: string, yearOrOccasion?: string): string {
  const cleanSubject = subject.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const cleanDesc = description.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const cleanYear = yearOrOccasion ? `-${yearOrOccasion.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : '';
  return `${cleanSubject}-${cleanDesc}${cleanYear}.jpg`;
}
