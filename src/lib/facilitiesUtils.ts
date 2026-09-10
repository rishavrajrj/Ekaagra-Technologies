/**
 * ==============================================================================
 * CANONICAL CAMPUS FACILITIES UTILITIES & WEBSITE CONTENT ENGINE
 * File: src/lib/facilitiesUtils.ts
 * ==============================================================================
 *
 * Implements:
 * 1. Single source of truth for 11 canonical campus facilities.
 * 2. Strict distinction between REQUIRED, RECOMMENDED, and OPTIONAL fields.
 * 3. Dynamic completion scoring (only applicable facilities count).
 * 4. Normalization & bidirectional sync with legacy boolean flags and section configs.
 * 5. Facility-specific photo association and management.
 * 6. Website content generation previews for each facility.
 */

import type {
  FacilitiesData,
  WebsiteFacilityConfig,
  UniversalIntakeData,
} from './types';

export type FacilityImportanceLevel = 'required' | 'recommended' | 'optional';

export interface FacilityFeatureOption {
  id: string;
  label: string;
}

export interface ScienceLabTypeOption {
  id: string;
  label: string;
}

export interface FacilityDefinition {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  iconName: string;
  defaultAvailable: boolean;
  featureOptions: FacilityFeatureOption[];
  photoRecommendation: { min: number; max: number; label: string };
  validate: (config: WebsiteFacilityConfig) => {
    isValid: boolean;
    missingRequired: string[];
    summary: string;
  };
  generateWebsiteSummary: (config: WebsiteFacilityConfig) => string;
}

export const SCIENCE_LAB_TYPES: readonly ScienceLabTypeOption[] = [
  { id: 'physics', label: 'Physics Laboratory' },
  { id: 'chemistry', label: 'Chemistry Laboratory' },
  { id: 'biology', label: 'Biology Laboratory' },
  { id: 'mathematics', label: 'Mathematics Lab' },
  { id: 'composite_science', label: 'Composite Science Lab' },
  { id: 'other', label: 'Other Specialised Lab' },
] as const;

export const SPORTS_CHECKLIST: readonly { id: string; label: string }[] = [
  { id: 'cricket', label: 'Cricket' },
  { id: 'football', label: 'Football' },
  { id: 'basketball', label: 'Basketball' },
  { id: 'volleyball', label: 'Volleyball' },
  { id: 'badminton', label: 'Badminton' },
  { id: 'athletics', label: 'Athletics / Track' },
  { id: 'table_tennis', label: 'Table Tennis' },
  { id: 'chess', label: 'Chess' },
  { id: 'indoor_games', label: 'Indoor Games' },
  { id: 'other', label: 'Other Sports' },
] as const;

export const FACILITY_DEFINITIONS: readonly FacilityDefinition[] = [
  {
    id: 'smart_classrooms',
    title: 'Smart Classrooms',
    shortTitle: 'Smart Classrooms',
    description: 'Digital interactive boards, multimedia projection & technology-enabled learning spaces.',
    iconName: 'Sparkles',
    defaultAvailable: true,
    featureOptions: [
      { id: 'interactive_board', label: 'Digital / Interactive Boards' },
      { id: 'projector', label: 'Projector / AV Display' },
      { id: 'multimedia', label: 'Multimedia Learning Systems' },
      { id: 'internet', label: 'High-Speed Internet Enabled' },
      { id: 'audio_system', label: 'Classroom Audio System' },
      { id: 'air_conditioned', label: 'Air Conditioned' },
      { id: 'digital_content', label: 'Digital Learning Content & Curriculum' },
      { id: 'other', label: 'Other Smart Learning Tools' },
    ],
    photoRecommendation: { min: 3, max: 5, label: '3–5 classroom photos recommended' },
    validate: (cfg) => {
      if (!cfg.available) {
        return { isValid: true, missingRequired: [], summary: 'Not available' };
      }
      const missing: string[] = [];
      const count = Number(cfg.count);
      if (isNaN(count) || count <= 0) {
        missing.push('Number of smart classrooms');
      }
      const countText = count > 0 ? `${count} smart classroom${count > 1 ? 's' : ''}` : 'Classrooms pending';
      return {
        isValid: missing.length === 0,
        missingRequired: missing,
        summary: countText,
      };
    },
    generateWebsiteSummary: (cfg) => {
      if (!cfg.available) return 'Smart classrooms are not currently offered at this campus.';
      const count = cfg.count || 0;
      const features = (cfg.features || []).map((f) => f.replace(/_/g, ' '));
      const featureSummary = features.length > 0 ? ` equipped with ${features.slice(0, 3).join(', ')}` : '';
      return `${count} technology-enabled smart classroom${count === 1 ? '' : 's'}${featureSummary}, providing students with interactive digital instruction and collaborative visual learning.`;
    },
  },
  {
    id: 'computer_lab',
    title: 'Computer Laboratory',
    shortTitle: 'Computer Lab',
    description: 'Dedicated IT infrastructure with modern desktop workstations and high-speed internet.',
    iconName: 'Laptop',
    defaultAvailable: true,
    featureOptions: [
      { id: 'internet', label: 'High-Speed Internet & Dedicated Fiber LAN' },
      { id: 'air_conditioned', label: 'Air Conditioned Lab' },
      { id: 'projector', label: 'Instructor AV Projection Display' },
      { id: 'networking', label: 'Local Area Network (LAN)' },
      { id: 'coding_robotics', label: 'Coding, AI & Robotics Software' },
      { id: 'other', label: 'Specialised Software Suites' },
    ],
    photoRecommendation: { min: 2, max: 4, label: '2–4 IT lab photos recommended' },
    validate: (cfg) => {
      if (!cfg.available) {
        return { isValid: true, missingRequired: [], summary: 'Not available' };
      }
      const missing: string[] = [];
      const count = Number(cfg.count);
      const computersCount = Number(cfg.computersCount);
      if (isNaN(count) || count <= 0) {
        missing.push('Number of computer labs');
      }
      if (isNaN(computersCount) || computersCount <= 0) {
        missing.push('Number of computers');
      }
      const labPart = count > 0 ? `${count} lab${count > 1 ? 's' : ''}` : 'Labs pending';
      const pcPart = computersCount > 0 ? `${computersCount} computers` : 'Computers pending';
      return {
        isValid: missing.length === 0,
        missingRequired: missing,
        summary: `${labPart} • ${pcPart}`,
      };
    },
    generateWebsiteSummary: (cfg) => {
      if (!cfg.available) return 'Computer laboratories are not offered at this campus.';
      const labs = cfg.count || 1;
      const pcs = cfg.computersCount || 0;
      const capacity = cfg.capacity ? ` with seating for ${cfg.capacity} students per session` : '';
      return `${labs} modern computer laborator${labs === 1 ? 'y' : 'ies'} with ${pcs} high-performance desktop systems${capacity}, fostering practical digital literacy and programming competencies.`;
    },
  },
  {
    id: 'science_lab',
    title: 'Science Laboratory',
    shortTitle: 'Science Lab',
    description: 'Specialized laboratories for Physics, Chemistry, Biology, Mathematics & STEM experiments.',
    iconName: 'FlaskConical',
    defaultAvailable: true,
    featureOptions: [
      { id: 'practical_equipment', label: 'Practical Glassware & Experiment Apparatus' },
      { id: 'experiment_stations', label: 'Individual Student Workstations' },
      { id: 'safety_equipment', label: 'Emergency Safety Equipment & First Aid' },
      { id: 'digital_stem', label: 'Digital STEM Sensors & Measurement Kits' },
      { id: 'chemical_storage', label: 'Compliant Chemical Storage & Ventilation' },
      { id: 'other', label: 'Demonstration & Projection Bay' },
    ],
    photoRecommendation: { min: 3, max: 5, label: '3–5 lab photos recommended' },
    validate: (cfg) => {
      if (!cfg.available) {
        return { isValid: true, missingRequired: [], summary: 'Not available' };
      }
      const missing: string[] = [];
      const types = Array.isArray(cfg.types) ? cfg.types : [];
      const count = Number(cfg.count);
      if (types.length === 0) {
        missing.push('At least one laboratory type');
      }
      if (isNaN(count) || count <= 0) {
        missing.push('Number of science labs');
      }
      const typeSummary = types
        .slice(0, 3)
        .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
        .join(', ');
      const labPart = count > 0 ? `${count} lab${count > 1 ? 's' : ''}` : 'Labs pending';
      return {
        isValid: missing.length === 0,
        missingRequired: missing,
        summary: types.length > 0 ? `${typeSummary} • ${labPart}` : labPart,
      };
    },
    generateWebsiteSummary: (cfg) => {
      if (!cfg.available) return 'Science laboratories are not offered at this campus.';
      const labs = cfg.count || 1;
      const types = (cfg.types || []).map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(', ');
      return `${labs} fully equipped science laborator${labs === 1 ? 'y' : 'ies'} covering ${types || 'practical sciences'}, allowing learners to discover scientific concepts through experiential laboratory inquiry.`;
    },
  },
  {
    id: 'library',
    title: 'School Library',
    shortTitle: 'Library',
    description: 'Curated collection of books, academic journals, e-resources and quiet reading areas.',
    iconName: 'BookOpen',
    defaultAvailable: true,
    featureOptions: [
      { id: 'digital_library', label: 'Digital Library & Online E-Book Catalog' },
      { id: 'reading_room', label: 'Dedicated Quiet Reading Room' },
      { id: 'journals', label: 'Periodicals, Newspapers & Research Journals' },
      { id: 'computer_access', label: 'Computer Terminals for Digital Research' },
      { id: 'auto_catalog', label: 'Automated Catalog Search & Circulation' },
      { id: 'other', label: 'Specialized Reference Archives' },
    ],
    photoRecommendation: { min: 2, max: 4, label: '2–4 library photos recommended' },
    validate: (cfg) => {
      if (!cfg.available) {
        return { isValid: true, missingRequired: [], summary: 'Not available' };
      }
      const missing: string[] = [];
      const books = Number(cfg.bookCount);
      const cap = Number(cfg.capacity);
      if (isNaN(books) || books <= 0) {
        missing.push('Please enter the approximate book count.');
      }
      if (isNaN(cap) || cap <= 0) {
        missing.push('Please enter the library reading capacity.');
      }
      const parts: string[] = [];
      if (books > 0) {
        parts.push(`${books.toLocaleString()}+ books`);
      }
      if (cap > 0) {
        parts.push(`${cap} seats`);
      }
      if (cfg.digitalLibrary) {
        parts.push('Digital Library');
      }
      return {
        isValid: missing.length === 0,
        missingRequired: missing,
        summary: parts.length > 0 ? parts.join(' • ') : 'Library pending details',
      };
    },
    generateWebsiteSummary: (cfg) => {
      if (!cfg.available) return 'A physical library is not available at this campus.';
      const books = cfg.bookCount ? `over ${cfg.bookCount.toLocaleString()} curated books, literature, and periodicals` : 'a rich collection of academic and recreational books';
      const seating = cfg.capacity ? ` with comfortable reading capacity for ${cfg.capacity} students` : '';
      return `Our campus library houses ${books}${seating}, inspiring an enduring habit of independent reading and lifelong intellectual inquiry.`;
    },
  },
  {
    id: 'sports',
    title: 'Playground & Sports',
    shortTitle: 'Sports & Games',
    description: 'Outdoor athletic grounds, sports courts, indoor games and physical education amenities.',
    iconName: 'Trophy',
    defaultAvailable: true,
    featureOptions: [
      { id: 'running_track', label: 'Athletic Running Track' },
      { id: 'gymnasium', label: 'School Gymnasium / Fitness Center' },
      { id: 'indoor_sports_hall', label: 'Indoor Sports Arena' },
      { id: 'swimming_pool', label: 'Swimming Pool with Certified Lifeguards' },
      { id: 'sports_coaching', label: 'Certified Sports Coaching Academies' },
      { id: 'floodlights', label: 'Floodlights for Evening Play' },
      { id: 'other', label: 'Yoga & Aerobics Studio' },
    ],
    photoRecommendation: { min: 3, max: 5, label: '3–5 sports photos recommended' },
    validate: (cfg) => {
      if (!cfg.available) {
        return { isValid: true, missingRequired: [], summary: 'Not available' };
      }
      const missing: string[] = [];
      const sports = Array.isArray(cfg.sports) ? cfg.sports : [];
      if (sports.length === 0) {
        missing.push('At least one sport / game selected');
      }
      const summary = sports
        .slice(0, 3)
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(', ');
      return {
        isValid: missing.length === 0,
        missingRequired: missing,
        summary: sports.length > 0 ? `${summary}${sports.length > 3 ? ` +${sports.length - 3}` : ''}` : 'Sports pending',
      };
    },
    generateWebsiteSummary: (cfg) => {
      if (!cfg.available) return 'Dedicated outdoor sports facilities are not offered at this campus.';
      const sports = (cfg.sports || []).map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(', ');
      const courts = cfg.count ? ` across ${cfg.count} dedicated sports ground${cfg.count === 1 ? '' : 's'}` : '';
      return `Extensive sports infrastructure${courts} supporting ${sports || 'all-round physical sports'}, championing team spirit, endurance, and physical health.`;
    },
  },
  {
    id: 'auditorium',
    title: 'Auditorium / Multipurpose Hall',
    shortTitle: 'Auditorium',
    description: 'Assembly arena and performing arts stage for cultural events, symposiums and gatherings.',
    iconName: 'Theater',
    defaultAvailable: true,
    featureOptions: [
      { id: 'stage', label: 'Performing Arts Stage & Elevated Podium' },
      { id: 'sound_system', label: 'Professional Surround PA & Acoustic Audio' },
      { id: 'projector', label: 'High-Definition Projector / LED Video Wall' },
      { id: 'ac', label: 'Central Air Conditioning' },
      { id: 'lighting', label: 'Theatrical Stage Spotlights & Dimming Lights' },
      { id: 'green_room', label: 'Green Room & Backstage Dressing Suites' },
      { id: 'other', label: 'Acoustic Wall Paneling' },
    ],
    photoRecommendation: { min: 2, max: 4, label: '2–4 auditorium photos recommended' },
    validate: (cfg) => {
      if (!cfg.available) {
        return { isValid: true, missingRequired: [], summary: 'Not available' };
      }
      const missing: string[] = [];
      const cap = Number(cfg.capacity);
      if (isNaN(cap) || cap <= 0) {
        missing.push('Please enter the auditorium seating capacity.');
      }
      return {
        isValid: missing.length === 0,
        missingRequired: missing,
        summary: cap > 0 ? `${cap}-seat auditorium` : 'Auditorium pending capacity',
      };
    },
    generateWebsiteSummary: (cfg) => {
      if (!cfg.available) return 'An auditorium or multipurpose hall is not available at this campus.';
      const cap = cfg.capacity ? ` accommodating ${cfg.capacity} attendees` : '';
      return `A spacious multipurpose auditorium${cap} engineered with acoustic clarity and modern stage lighting for annual functions, inter-school cultural festivals, and academic symposiums.`;
    },
  },
  {
    id: 'medical_room',
    title: 'Medical / Infirmary',
    shortTitle: 'Infirmary',
    description: 'On-campus first aid bay, emergency care and student health supervision.',
    iconName: 'HeartPulse',
    defaultAvailable: true,
    featureOptions: [
      { id: 'nurse_available', label: 'Full-Time Registered Campus Nurse' },
      { id: 'doctor_support', label: 'Visiting Doctor / On-Call Medical Specialist' },
      { id: 'first_aid', label: 'Equipped First Aid & Emergency Resuscitation Station' },
      { id: 'emergency_support', label: 'Tie-Up with Nearby Multi-Specialty Hospital' },
      { id: 'rest_bay', label: 'Dedicated Patient Rest & Recovery Bay' },
      { id: 'health_checkups', label: 'Annual Student Health, Dental & Vision Checkups' },
      { id: 'other', label: 'Dedicated Medical Isolation Room' },
    ],
    photoRecommendation: { min: 1, max: 3, label: '1–3 medical bay photos recommended' },
    validate: (cfg) => {
      if (!cfg.available) {
        return { isValid: true, missingRequired: [], summary: 'Not available' };
      }
      const beds = cfg.bedsCount && cfg.bedsCount > 0 ? `${cfg.bedsCount} bed${cfg.bedsCount === 1 ? '' : 's'}` : 'Medical Bay Available';
      return {
        isValid: true,
        missingRequired: [],
        summary: beds,
      };
    },
    generateWebsiteSummary: (cfg) => {
      if (!cfg.available) return 'An infirmary is not maintained on this campus.';
      const beds = cfg.bedsCount ? ` with ${cfg.bedsCount} medical observation beds` : '';
      return `A dedicated campus infirmary${beds} providing immediate first aid, hygienic resting care, and prompt emergency response under trained supervision.`;
    },
  },
  {
    id: 'cafeteria',
    title: 'Cafeteria / Canteen',
    shortTitle: 'Cafeteria',
    description: 'Hygienic campus dining space serving wholesome, nutritious meals and snacks.',
    iconName: 'Utensils',
    defaultAvailable: true,
    featureOptions: [
      { id: 'drinking_water', label: 'RO Purified Drinking Water Stations' },
      { id: 'veg_food', label: '100% Pure Vegetarian Meals' },
      { id: 'dining_hall', label: 'Spacious & Well-Ventilated Dining Hall' },
      { id: 'hygiene_certified', label: 'FSSAI Certified Food Hygiene Standards' },
      { id: 'nutritious_menu', label: 'Nutritionist-Approved Wholesome Menu' },
      { id: 'cashless', label: 'Cashless / RFID Student Meal Cards' },
      { id: 'other', label: 'Fresh Daily Produce & In-House Bakery' },
    ],
    photoRecommendation: { min: 2, max: 4, label: '2–4 cafeteria photos recommended' },
    validate: (cfg) => {
      if (!cfg.available) {
        return { isValid: true, missingRequired: [], summary: 'Not available' };
      }
      const cap = cfg.capacity && cfg.capacity > 0 ? `${cfg.capacity} seats` : 'Cafeteria Available';
      return {
        isValid: true,
        missingRequired: [],
        summary: cap,
      };
    },
    generateWebsiteSummary: (cfg) => {
      if (!cfg.available) return 'Canteen facilities are not offered on this campus.';
      const cap = cfg.capacity ? ` seating up to ${cfg.capacity} diners` : '';
      return `A sanitized dining cafeteria${cap} offering nutritious, hygienic refreshments prepared under stringent food safety and wellness standards.`;
    },
  },
  {
    id: 'cctv_security',
    title: 'CCTV & Campus Security',
    shortTitle: 'Safety & Security',
    description: 'Round-the-clock surveillance, trained security personnel and gated access control.',
    iconName: 'ShieldCheck',
    defaultAvailable: true,
    featureOptions: [
      { id: 'cctv_surveillance', label: '24/7 Campus-Wide CCTV Surveillance' },
      { id: 'security_staff', label: 'Trained Round-the-Clock Security Personnel' },
      { id: 'visitor_management', label: 'Digital Visitor Registration & Pass Log' },
      { id: 'secure_gate', label: 'Secure Main Perimeter & Boom Barrier Gates' },
      { id: 'biometric_access', label: 'Biometric / Smart RFID Access Control' },
      { id: 'fire_safety', label: 'Fire Safety Extinguishers & Evacuation Alarms' },
      { id: 'other', label: 'Public Address & Emergency Evacuation System' },
    ],
    photoRecommendation: { min: 1, max: 3, label: '1–3 security photos recommended' },
    validate: (cfg) => {
      if (!cfg.available) {
        return { isValid: true, missingRequired: [], summary: 'Not available' };
      }
      const parts: string[] = [];
      if (cfg.cctvCount && cfg.cctvCount > 0) {
        parts.push(`${cfg.cctvCount} CCTV cameras`);
      }
      if (cfg.is24x7Monitored) {
        parts.push('24/7 Monitored');
      }
      return {
        isValid: true,
        missingRequired: [],
        summary: parts.length > 0 ? parts.join(' • ') : 'Security Active',
      };
    },
    generateWebsiteSummary: (cfg) => {
      if (!cfg.available) return 'Campus security operates under standard departmental protocols.';
      const cctv = cfg.cctvCount ? ` over ${cfg.cctvCount} high-resolution cameras and` : '';
      return `Comprehensive 24/7 perimeter protection featuring${cctv} trained security staff, ensuring a safe, secure, and disciplined academic environment.`;
    },
  },
  {
    id: 'hostel',
    title: 'Hostel & Residential Boarding',
    shortTitle: 'Hostel',
    description: 'On-campus boarding, comfortable student dormitories, mess and warden care.',
    iconName: 'Home',
    defaultAvailable: false,
    featureOptions: [
      { id: 'furnished_rooms', label: 'Furnished Rooms with Individual Study Desks' },
      { id: 'dining_hall', label: 'Hostel Dining Hall with Nutritious Meals' },
      { id: 'study_room', label: 'Supervised Evening Study & Prep Room' },
      { id: 'wifi', label: 'High-Speed Wi-Fi for Academic Studies' },
      { id: 'cctv', label: '24/7 CCTV & Gated Hostel Perimeter Security' },
      { id: 'warden', label: 'Resident Wardens & Pastoral Care Mentors' },
      { id: 'recreation_room', label: 'Recreation Hall with Indoor Games & TV' },
      { id: 'medical_support', label: '24/7 Resident Infirmary & Medical Care' },
      { id: 'laundry', label: 'In-House Laundry & Ironing Service' },
      { id: 'hot_water', label: '24-Hour Hot Water Supply' },
      { id: 'power_backup', label: '100% DG Power Backup for Residential Blocks' },
      { id: 'other', label: 'Tuck Shop & Courier Receiving Desk' },
    ],
    photoRecommendation: { min: 3, max: 6, label: '3–6 boarding photos recommended' },
    validate: (cfg) => {
      if (!cfg.available) {
        return { isValid: true, missingRequired: [], summary: 'Not available' };
      }
      const missing: string[] = [];
      if (!cfg.hostelType) {
        missing.push('Hostel type (Boys, Girls, or Both)');
      }
      if (cfg.hostelType === 'both') {
        const boys = Number(cfg.boysCapacity);
        const girls = Number(cfg.girlsCapacity);
        if (isNaN(boys) || boys <= 0) missing.push('Boys hostel capacity');
        if (isNaN(girls) || girls <= 0) missing.push('Girls hostel capacity');
      } else {
        const cap = Number(cfg.capacity);
        if (isNaN(cap) || cap <= 0) {
          missing.push('Total hostel student capacity');
        }
      }
      const typeLabel =
        cfg.hostelType === 'both'
          ? 'Boys & Girls Hostel'
          : cfg.hostelType === 'girls'
          ? 'Girls Hostel'
          : cfg.hostelType === 'boys'
          ? 'Boys Hostel'
          : 'Hostel pending';
      const capNum =
        cfg.hostelType === 'both'
          ? (cfg.boysCapacity || 0) + (cfg.girlsCapacity || 0)
          : cfg.capacity || 0;
      const capPart = capNum > 0 ? `${capNum} students` : 'Capacity pending';
      return {
        isValid: missing.length === 0,
        missingRequired: missing,
        summary: `${typeLabel} • ${capPart}`,
      };
    },
    generateWebsiteSummary: (cfg) => {
      if (!cfg.available) return 'Hostel accommodation is not provided by this school.';
      const typeLabel =
        cfg.hostelType === 'both'
          ? 'separate residential wings for boys and girls'
          : cfg.hostelType === 'girls'
          ? 'a secure girls boarding facility'
          : 'a structured boys boarding facility';
      const capNum =
        cfg.hostelType === 'both'
          ? (cfg.boysCapacity || 0) + (cfg.girlsCapacity || 0)
          : cfg.capacity || 0;
      const capText = capNum > 0 ? ` accommodating ${capNum} boarders` : '';
      return `Supervised residential hostel featuring ${typeLabel}${capText}, providing a warm, supportive home-away-from-home with disciplined study routines and wholesome nutrition.`;
    },
  },
  {
    id: 'other',
    title: 'Other Facility',
    shortTitle: 'Other Facility',
    description: 'Additional distinctive infrastructure or facility you wish to showcase on your website.',
    iconName: 'Building2',
    defaultAvailable: false,
    featureOptions: [
      { id: 'dedicated_staff', label: 'Dedicated Operational Staff' },
      { id: 'air_conditioned', label: 'Air Conditioned' },
      { id: 'digital_equipment', label: 'Digital Equipment' },
      { id: 'special_curriculum', label: 'Integrated with Academic Curriculum' },
    ],
    photoRecommendation: { min: 1, max: 3, label: '1–3 photos recommended' },
    validate: (cfg) => {
      if (!cfg.available) {
        return { isValid: true, missingRequired: [], summary: 'Not available' };
      }
      const missing: string[] = [];
      if (!cfg.customName || cfg.customName.trim().length === 0) {
        missing.push('Facility name');
      }
      return {
        isValid: missing.length === 0,
        missingRequired: missing,
        summary: cfg.customName?.trim() || 'Facility name pending',
      };
    },
    generateWebsiteSummary: (cfg) => {
      if (!cfg.available) return '';
      const name = cfg.customName?.trim() || 'Additional Campus Amenity';
      const desc = cfg.description?.trim() || 'Enhancing the campus learning experience for all enrolled students.';
      return `${name}: ${desc}`;
    },
  },
] as const;

/**
 * Returns a facility definition by its canonical or aliased ID.
 */
export function getFacilityDefinition(id: string): FacilityDefinition | undefined {
  const norm = id.toLowerCase().replace(/-/g, '_');
  return FACILITY_DEFINITIONS.find((f) => f.id === norm || f.id.replace(/_/g, '') === norm.replace(/_/g, ''));
}

/**
 * Normalizes raw FacilitiesData into a structured website-first facility record.
 * Preserves all legacy booleans, stats, and photo galleries bidirectionally.
 */
export function normalizeFacilitiesData(
  raw?: Partial<FacilitiesData> | null,
  intakeContext?: Partial<UniversalIntakeData> | null
): {
  normalized: FacilitiesData;
  facilities: Record<string, WebsiteFacilityConfig>;
} {
  const rawFac = raw || {};
  const existingFacilities: Record<string, WebsiteFacilityConfig> = { ...(rawFac.facilities || {}) };

  // Hydrate each canonical facility from legacy booleans or root intake context if not yet explicitly configured
  FACILITY_DEFINITIONS.forEach((def) => {
    const existing = existingFacilities[def.id];
    if (existing) return;

    let available = def.defaultAvailable;

    // Check legacy boolean on facilitiesConfig
    if (def.id === 'smart_classrooms' && typeof rawFac.smartClassrooms === 'boolean') {
      available = rawFac.smartClassrooms;
    } else if (def.id === 'computer_lab' && typeof rawFac.computerLab === 'boolean') {
      available = rawFac.computerLab;
    } else if (def.id === 'science_lab' && typeof rawFac.scienceLab === 'boolean') {
      available = rawFac.scienceLab;
    } else if (def.id === 'library') {
      if (typeof rawFac.library === 'boolean') {
        available = rawFac.library;
      } else if (intakeContext?.libraryConfig?.enabled !== undefined) {
        available = intakeContext.libraryConfig.enabled;
      }
    } else if (def.id === 'sports' && typeof rawFac.playground === 'boolean') {
      available = rawFac.playground;
    } else if (def.id === 'auditorium' && typeof rawFac.auditorium === 'boolean') {
      available = rawFac.auditorium;
    } else if (def.id === 'medical_room' && typeof rawFac.medicalRoom === 'boolean') {
      available = rawFac.medicalRoom;
    } else if (def.id === 'cafeteria' && typeof rawFac.cafeteria === 'boolean') {
      available = rawFac.cafeteria;
    } else if (def.id === 'cctv_security' && typeof rawFac.cctvInstalled === 'boolean') {
      available = rawFac.cctvInstalled;
    } else if (def.id === 'hostel') {
      const resStatus = intakeContext?.schoolProfile?.residentialStatus;
      if (resStatus) {
        available = resStatus === 'residential' || resStatus === 'both_day_and_residential';
      } else if (intakeContext?.hostelConfig?.status) {
        const hStatus = String(intakeContext.hostelConfig.status).toLowerCase();
        available = hStatus === 'active' || hStatus === 'planned' || hStatus === 'yes_operational';
      }
    }

    // Prefill data from legacy fields if available
    let initialCount: number | undefined;
    let initialComputers: number | undefined;
    let initialCapacity: number | undefined;
    let initialSports: string[] | undefined;
    let initialTypes: string[] | undefined;
    let initialBookCount: number | undefined;
    let initialDigitalLib: boolean | undefined;
    let initialHostelType: 'boys' | 'girls' | 'both' | undefined;
    let initialHostelCap: number | undefined;

    if (def.id === 'smart_classrooms') {
      initialCount = rawFac.classroomsCount || undefined;
    } else if (def.id === 'computer_lab') {
      initialCount = 1;
      initialComputers = 30;
    } else if (def.id === 'science_lab') {
      initialTypes = ['physics', 'chemistry', 'biology'];
      initialCount = 3;
    } else if (def.id === 'sports') {
      initialSports = rawFac.sportsFacilities || ['cricket', 'football', 'badminton'];
    } else if (def.id === 'library') {
      const libConf = intakeContext?.libraryConfig;
      initialBookCount = libConf?.physical?.estimatedPhysicalBookCount || 5000;
      initialCapacity = libConf?.physical?.approximateSeatingCapacity || libConf?.physical?.readingSeatsCount || 50;
      initialDigitalLib = libConf?.digital?.isAvailable ?? false;
    } else if (def.id === 'hostel') {
      const hstConf = intakeContext?.hostelConfig;
      if (hstConf?.genderAccommodation === 'boys_only') initialHostelType = 'boys';
      else if (hstConf?.genderAccommodation === 'girls_only') initialHostelType = 'girls';
      else if (hstConf?.genderAccommodation === 'separate_wings' || hstConf?.genderAccommodation === 'co_educational') initialHostelType = 'both';
      initialHostelCap = hstConf?.totalCapacity || 100;
    }

    existingFacilities[def.id] = {
      id: def.id,
      available,
      count: initialCount,
      computersCount: initialComputers,
      capacity: initialCapacity,
      sports: initialSports,
      types: initialTypes,
      bookCount: initialBookCount,
      digitalLibrary: initialDigitalLib,
      hostelType: initialHostelType,
      features: [],
      photos: [],
    };
    if (initialHostelCap !== undefined) {
      existingFacilities[def.id].capacity = initialHostelCap;
    }
  });

  // Bidirectionally sync legacy boolean flags to preserve backward compatibility
  const synchedFacilitiesData: FacilitiesData = {
    ...rawFac,
    facilities: existingFacilities,
    smartClassrooms: Boolean(existingFacilities['smart_classrooms']?.available),
    computerLab: Boolean(existingFacilities['computer_lab']?.available),
    scienceLab: Boolean(existingFacilities['science_lab']?.available),
    library: Boolean(existingFacilities['library']?.available),
    playground: Boolean(existingFacilities['sports']?.available),
    sportsFacilities: existingFacilities['sports']?.sports || rawFac.sportsFacilities || [],
    auditorium: Boolean(existingFacilities['auditorium']?.available),
    medicalRoom: Boolean(existingFacilities['medical_room']?.available),
    cafeteria: Boolean(existingFacilities['cafeteria']?.available),
    cctvInstalled: Boolean(existingFacilities['cctv_security']?.available),
  };

  return {
    normalized: synchedFacilitiesData,
    facilities: existingFacilities,
  };
}

export interface FacilitiesSectionScore {
  total: number;
  filled: number;
  percentage: number;
  isComplete: boolean;
  applicableCount: number;
  completedCount: number;
  missingFields: string[];
}

/**
 * Calculates genuine completion score for Campus Facilities.
 * Only selected facilities require detailed information.
 * Facilities marked available: false are immediately 100% complete.
 */
export function getFacilitiesSectionScore(
  raw?: Partial<FacilitiesData> | null,
  intakeContext?: Partial<UniversalIntakeData> | null
): FacilitiesSectionScore {
  const { facilities } = normalizeFacilitiesData(raw, intakeContext);
  const activeFacilityKeys = Object.keys(facilities);

  if (activeFacilityKeys.length === 0) {
    return {
      total: 1,
      filled: 0,
      percentage: 0,
      isComplete: false,
      applicableCount: 0,
      completedCount: 0,
      missingFields: ['Campus Facilities: Select the facilities available at your campus'],
    };
  }

  let applicableCount = 0;
  let completedCount = 0;
  const missingFields: string[] = [];

  activeFacilityKeys.forEach((facId) => {
    const facConfig = facilities[facId];
    const def = getFacilityDefinition(facId);
    if (!facConfig || !def) return;

    // Only count 'other' if it is explicitly marked available
    if (def.id === 'other' && !facConfig.available) return;

    applicableCount++;

    if (!facConfig.available) {
      // If facility is unavailable, it is immediately 100% complete
      completedCount++;
      return;
    }

    const { isValid, missingRequired } = def.validate(facConfig);
    if (isValid) {
      completedCount++;
    } else {
      missingRequired.forEach((field) => {
        missingFields.push(`${def.title}: ${field}`);
      });
    }
  });

  const total = Math.max(1, applicableCount);
  const filled = completedCount;
  const percentage = Math.round((filled / total) * 100);

  return {
    total,
    filled,
    percentage,
    isComplete: filled === total && missingFields.length === 0,
    applicableCount,
    completedCount,
    missingFields,
  };
}
