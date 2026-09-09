/**
 * PRODUCTION-GRADE ADMISSIONS UTILITIES & CANONICAL DATA ENGINE
 *
 * Provides:
 * 1. Default suggested catalogs (Process steps, documents, fee categories).
 * 2. Normalization & safe legacy migration (preserves existing drafts without data loss).
 * 3. Bidirectional legacy mirror synchronization (zero breaking changes for external callers).
 * 4. Admission validation & constraint checking.
 * 5. Website generator representation (structured consumer payload).
 */

import type {
  AdmissionsData,
  AdmissionsContact,
  AdmissionsApplicationOptions,
  AdmissionClassAvailabilityItem,
  AdmissionEligibility,
  AdmissionProcessStep,
  AdmissionDocumentItem,
  AdmissionFeeItem,
  AdmissionImportantDateItem,
  AdmissionApplicationConfig,
  AdmissionStatus,
  ClassAdmissionStatus,
  FeeFrequency,
  DocumentRequirement,
  ApplicationMethod,
  AdmissionCtaOption,
  AcademicClassConfig,
} from './types';

// ─── DEFAULT SUGGESTED CATALOGS ──────────────────────────────────────────────

export const DEFAULT_ADMISSION_STATUS_OPTIONS: { value: AdmissionStatus; label: string; badge: string; description: string }[] = [
  { value: 'open', label: 'Open', badge: 'Accepting Applications', description: 'Applications are actively invited and processed.' },
  { value: 'upcoming', label: 'Upcoming', badge: 'Opening Soon', description: 'Cycle announced; applications opening on the scheduled date.' },
  { value: 'closed', label: 'Closed', badge: 'Applications Closed', description: 'Intake concluded for the current cycle.' },
  { value: 'waitlist', label: 'Waitlist', badge: 'Waitlist Only', description: 'Regular seats filled; applications placed on waitlist.' },
  { value: 'not_accepting', label: 'Not Currently Accepting Applications', badge: 'Inactive', description: 'Admissions desk is not accepting new requests at this time.' },
];

export const DEFAULT_CLASS_ADMISSION_STATUSES: { value: ClassAdmissionStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
  { value: 'waitlist', label: 'Waitlist' },
  { value: 'enquiry_only', label: 'Enquiry Only' },
  { value: 'not_offered', label: 'Not Offered' },
];

export const DEFAULT_ADMISSION_PROCESS_SUGGESTIONS: Omit<AdmissionProcessStep, 'id'>[] = [
  { label: 'Enquiry', enabled: true, order: 1, description: 'Initial contact, campus inquiry, or prospectus collection.' },
  { label: 'Application', enabled: true, order: 2, description: 'Online registration or walk-in application form submission.' },
  { label: 'Document Verification', enabled: true, order: 3, description: 'Verification of birth record, past academic marks, and ID proofs.' },
  { label: 'Assessment / Entrance Test', enabled: false, order: 4, description: 'Written assessment or aptitude diagnostic test (where applicable).' },
  { label: 'Interaction / Interview', enabled: false, order: 5, description: 'Parent-student interaction with school leadership or admissions panel.' },
  { label: 'Admission Decision', enabled: true, order: 6, description: 'Issuance of admission offer letter or selection merit list.' },
  { label: 'Fee Payment', enabled: true, order: 7, description: 'Payment of admission fee and initial term tuition.' },
  { label: 'Admission Confirmation', enabled: true, order: 8, description: 'Enrollment confirmation, student ID, and welcome kit issuance.' },
];

export const DEFAULT_ADMISSION_DOCUMENTS_CATALOG: { id: string; name: string }[] = [
  { id: 'doc-birth-cert', name: 'Birth Certificate' },
  { id: 'doc-student-photo', name: 'Student Photograph' },
  { id: 'doc-parent-photo', name: 'Parent/Guardian Photograph' },
  { id: 'doc-academic-records', name: 'Previous Academic Records' },
  { id: 'doc-transfer-cert', name: 'Transfer Certificate (TC)' },
  { id: 'doc-migration-cert', name: 'Migration Certificate' },
  { id: 'doc-aadhaar-id', name: 'Aadhaar / Identity Document' },
  { id: 'doc-address-proof', name: 'Address Proof' },
  { id: 'doc-medical-cert', name: 'Medical Certificate / Immunization Record' },
  { id: 'doc-caste-cert', name: 'Caste Certificate' },
  { id: 'doc-disability-cert', name: 'Disability Certificate' },
  { id: 'doc-passport', name: 'Passport (for NRI / International Students)' },
];

export const DEFAULT_FEE_FREQUENCIES: { value: FeeFrequency; label: string }[] = [
  { value: 'one_time', label: 'One-time' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'half_yearly', label: 'Half-yearly' },
  { value: 'annual', label: 'Annual' },
  { value: 'per_term', label: 'Per Term' },
  { value: 'per_session', label: 'Per Session' },
  { value: 'other', label: 'Other' },
];

export const DEFAULT_APPLICATION_METHODS: { value: ApplicationMethod; label: string }[] = [
  { value: 'website', label: 'School Website' },
  { value: 'portal', label: 'External Application Portal' },
  { value: 'email', label: 'Email' },
  { value: 'in_person', label: 'In Person' },
  { value: 'other', label: 'Other' },
];

export const DEFAULT_CTA_OPTIONS: AdmissionCtaOption[] = [
  'Apply Now',
  'Enquire Now',
  'Contact Admissions',
  'Request a Callback',
  'Visit Campus',
  'Learn More',
  'Other',
];

export const DEFAULT_VISITING_HOURS_PRESETS = [
  '09:00 AM – 12:30 PM (Mon–Sat)',
  '09:00 AM – 02:00 PM (Mon–Sat)',
  '08:30 AM – 01:30 PM (Mon–Fri)',
  '10:00 AM – 01:00 PM (All Working Days)',
  '09:30 AM – 03:00 PM (Mon–Sat, Except 2nd Sat)',
] as const;

export const HOURS_START_OPTIONS = [
  '07:00 AM',
  '07:30 AM',
  '08:00 AM',
  '08:30 AM',
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
] as const;

export const HOURS_END_OPTIONS = [
  '12:00 PM',
  '12:30 PM',
  '01:00 PM',
  '01:30 PM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM',
  '04:30 PM',
  '05:00 PM',
  '05:30 PM',
  '06:00 PM',
] as const;

export function formatVisitingHours(raw?: string | null): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';

  const timeRegex = /^(?:(\d{1,2})(?::(\d{2}))?\s*(am|pm)?)\s*(?:-|–|to)\s*(?:(\d{1,2})(?::(\d{2}))?\s*(am|pm)?)(?:\s*[\(\[]?([a-zA-Z0-9\s–\-]+)[\)\]]?)?$/i;
  const match = trimmed.match(timeRegex);

  if (match) {
    let [_, h1, m1, p1, h2, m2, p2, days] = match;
    h1 = h1.padStart(2, '0');
    m1 = m1 || '00';
    p1 = (p1 || (parseInt(h1, 10) < 12 ? 'AM' : 'PM')).toUpperCase();

    h2 = h2.padStart(2, '0');
    m2 = m2 || '00';
    p2 = (p2 || (parseInt(h2, 10) < 7 || parseInt(h2, 10) === 12 ? 'PM' : 'AM')).toUpperCase();

    let daysFormatted = '';
    if (days) {
      let d = days.trim().replace(/^[\(\[]|[\)\]]$/g, '').trim();
      d = d
        .replace(/monday/i, 'Mon')
        .replace(/tuesday/i, 'Tue')
        .replace(/wednesday/i, 'Wed')
        .replace(/thursday/i, 'Thu')
        .replace(/friday/i, 'Fri')
        .replace(/saturday/i, 'Sat')
        .replace(/sunday/i, 'Sun')
        .replace(/\bmon\b/i, 'Mon')
        .replace(/\btue\b/i, 'Tue')
        .replace(/\bwed\b/i, 'Wed')
        .replace(/\bthu\b/i, 'Thu')
        .replace(/\bfri\b/i, 'Fri')
        .replace(/\bsat\b/i, 'Sat')
        .replace(/\bsun\b/i, 'Sun');
      d = d.replace(/\s*-\s*|\s*–\s*|\s+to\s+/i, '–');
      daysFormatted = ` (${d})`;
    }

    return `${h1}:${m1} ${p1} – ${h2}:${m2} ${p2}${daysFormatted}`;
  }

  return trimmed
    .replace(/(\d)(AM|PM)/gi, '$1 $2')
    .replace(/(AM|PM)(\()/gi, '$1 $2')
    .replace(/\s*-\s*/g, ' – ')
    .replace(/\s*–\s*/g, ' – ')
    .replace(/\s+/g, ' ');
}

export interface CanonicalAdmissionsContext {
  classes?: AcademicClassConfig[] | string[];
  session?: string;
  country?: string;
  currency?: string;
  officialEmail?: string;
  officialPhone?: string;
  schoolAddress?: string;
  principalName?: string;
}

// ─── NORMALIZATION & LEGACY DATA MIGRATION ────────────────────────────────────

/**
 * Intelligently normalizes AdmissionsData:
 * - Maps flat legacy fields into structured containers.
 * - Derives initial class availability from canonical academic classes.
 * - Avoids fabricating dates, age limits, or fees.
 * - Guarantees stable unique IDs for dynamic collections.
 * - Synchronizes legacy mirrors back onto the object.
 */
export function normalizeAdmissionsData(
  admissions?: Partial<AdmissionsData> | null,
  context?: CanonicalAdmissionsContext
): AdmissionsData {
  const raw = admissions || {};

  // 1. Cycle Session & Status
  const session = (raw.session || raw.targetSessions || context?.session || '').trim();
  const status: AdmissionStatus =
    raw.status ||
    (raw.admissionsOpen === true ? 'open' : raw.admissionsOpen === false ? 'closed' : 'upcoming');

  const applicationStartDate = raw.applicationStartDate || '';
  const applicationEndDate = raw.applicationEndDate || '';
  const admissionCycleNotes = raw.admissionCycleNotes || '';

  // 2. Admissions Contact
  const contactName = (raw.contact?.name || raw.contactPerson || '').trim();
  const contactPhone = (raw.contact?.phone || raw.admissionPhone || '').trim();
  const contactEmail = (raw.contact?.email || raw.admissionEmail || '').trim();
  const contactWhatsapp = (raw.contact?.whatsapp || raw.admissionWhatsapp || '').trim();
  const contactHours = (raw.contact?.visitingHours || raw.officeHours || '').trim();
  const preferredMethod = raw.contact?.preferredMethod || 'phone';
  const contactAddress = (raw.contact?.address || '').trim();

  const contact: AdmissionsContact = {
    name: contactName,
    phone: contactPhone,
    email: contactEmail,
    whatsapp: contactWhatsapp,
    visitingHours: contactHours,
    preferredMethod,
    address: contactAddress,
  };

  // 3. Application & Intake Options
  const appOpts = raw.applicationOptions || {};
  const applicationOptions: AdmissionsApplicationOptions = {
    admissionsOpen: appOpts.admissionsOpen ?? raw.admissionsOpen ?? false,
    onlineApplication: appOpts.onlineApplication ?? raw.onlineApplicationEnabled ?? false,
    documentUpload: appOpts.documentUpload ?? raw.documentUploadEnabled ?? false,
    walkInApplication: appOpts.walkInApplication ?? false,
    enquiryEnabled: appOpts.enquiryEnabled ?? raw.enquiryTrackingEnabled ?? true,
    callbackEnabled: appOpts.callbackEnabled ?? false,
    applicationFeeRequired:
      appOpts.applicationFeeRequired ??
      Boolean((raw.applicationFee && raw.applicationFee > 0) || (raw.fees && raw.fees.length > 0)),
  };

  // 4. Class-wise Admission Availability
  let classAvailability: AdmissionClassAvailabilityItem[] = [];
  if (Array.isArray(raw.classAvailability) && raw.classAvailability.length > 0) {
    classAvailability = raw.classAvailability.map((c, idx) => ({
      id: c.id || `cls-avail-${idx}-${Date.now()}`,
      classId: c.classId,
      className: c.className || `Class ${idx + 1}`,
      status: c.status || 'open',
      availableSeats: typeof c.availableSeats === 'number' && !isNaN(c.availableSeats) ? c.availableSeats : undefined,
      notes: c.notes || '',
    }));
  } else if (context?.classes && Array.isArray(context.classes) && context.classes.length > 0) {
    // Derive from canonical classes
    const openSet = new Set<string>(raw.classesOpenForAdmission || []);
    const hasExplicitLegacyList = Array.isArray(raw.classesOpenForAdmission) && raw.classesOpenForAdmission.length > 0;

    classAvailability = context.classes.map((cls, idx) => {
      const className = typeof cls === 'string' ? cls : ((cls as any).className || cls.name || '');
      const classId = typeof cls === 'string' ? undefined : cls.id;
      const isOpen = hasExplicitLegacyList ? openSet.has(className) : true;
      return {
        id: `cls-avail-derived-${idx}`,
        classId,
        className,
        status: isOpen ? 'open' : 'closed',
        notes: '',
      };
    });
  } else if (Array.isArray(raw.classesOpenForAdmission) && raw.classesOpenForAdmission.length > 0) {
    // Legacy fallback list
    classAvailability = raw.classesOpenForAdmission.map((clsName, idx) => ({
      id: `cls-avail-legacy-${idx}`,
      className: clsName,
      status: 'open',
      notes: '',
    }));
  }

  // 5. Eligibility
  const rawElig = raw.eligibility || {};
  const eligibility: AdmissionEligibility = {
    applicableClasses: Array.isArray(rawElig.applicableClasses) ? rawElig.applicableClasses : [],
    minimumAge: rawElig.minimumAge || raw.minAgeCriteria || '',
    maximumAge: rawElig.maximumAge || raw.maxAgeCriteria || '',
    ageCutoffDate: rawElig.ageCutoffDate || '',
    entranceAssessment: rawElig.entranceAssessment ?? raw.entranceTestRequired ?? false,
    interviewRequired: rawElig.interviewRequired ?? raw.interviewRequired ?? false,
    previousAcademicRequirement: rawElig.previousAcademicRequirement || '',
    notes: rawElig.notes || raw.eligibilityCriteria || '',
  };

  // 6. Admission Process
  let process: AdmissionProcessStep[] = [];
  if (Array.isArray(raw.process) && raw.process.length > 0) {
    process = raw.process.map((step, idx) => ({
      id: step.id || `proc-step-${idx}`,
      label: step.label || `Step ${idx + 1}`,
      enabled: step.enabled ?? true,
      order: typeof step.order === 'number' ? step.order : idx + 1,
      description: step.description || '',
    }));
  } else if (Array.isArray(raw.workflowStages) && raw.workflowStages.length > 0) {
    process = raw.workflowStages.map((stageName, idx) => ({
      id: `proc-legacy-${idx}`,
      label: stageName,
      enabled: true,
      order: idx + 1,
      description: '',
    }));
  } else {
    process = DEFAULT_ADMISSION_PROCESS_SUGGESTIONS.map((def, idx) => ({
      id: `proc-def-${idx + 1}`,
      label: def.label,
      enabled: def.enabled,
      order: def.order,
      description: def.description,
    }));
  }

  // 7. Documents
  let documents: AdmissionDocumentItem[] = [];
  if (Array.isArray(raw.documents) && raw.documents.length > 0) {
    documents = raw.documents.map((d, idx) => ({
      id: d.id || `doc-${idx}`,
      name: d.name || 'Document',
      requirement: d.requirement || 'optional',
      customName: d.customName,
    }));
  } else {
    const legacyReqSet = new Set<string>(raw.requiredDocuments || []);
    documents = DEFAULT_ADMISSION_DOCUMENTS_CATALOG.map((def, idx) => ({
      id: def.id,
      name: def.name,
      requirement: legacyReqSet.has(def.name) ? 'required' : 'optional',
    }));
  }

  // 8. Fees
  let fees: AdmissionFeeItem[] = [];
  const defaultCurrency = context?.currency || (context?.country?.toLowerCase() === 'india' || !context?.country ? 'INR' : 'USD');

  if (Array.isArray(raw.fees) && raw.fees.length > 0) {
    fees = raw.fees.map((f, idx) => ({
      id: f.id || `fee-${idx}-${Date.now()}`,
      name: f.name || 'Fee Head',
      amount: typeof f.amount === 'number' && !isNaN(f.amount) ? f.amount : undefined,
      currency: f.currency || defaultCurrency,
      frequency: f.frequency || 'one_time',
      applicableClasses: Array.isArray(f.applicableClasses) ? f.applicableClasses : [],
      notes: f.notes || '',
    }));
  } else {
    // Migrate legacy scalar fees if present
    const legacyFeeItems: AdmissionFeeItem[] = [];
    if (typeof raw.applicationFee === 'number' && raw.applicationFee > 0) {
      legacyFeeItems.push({
        id: 'fee-legacy-application',
        name: 'Application / Registration Form Fee',
        amount: raw.applicationFee,
        currency: defaultCurrency,
        frequency: 'one_time',
        notes: 'Migrated from legacy application fee',
      });
    }
    if (typeof raw.admissionFee === 'number' && raw.admissionFee > 0) {
      legacyFeeItems.push({
        id: 'fee-legacy-admission',
        name: 'One-Time Admission Fee',
        amount: raw.admissionFee,
        currency: defaultCurrency,
        frequency: 'one_time',
        notes: 'Migrated from legacy admission fee',
      });
    }
    if (typeof raw.registrationFee === 'number' && raw.registrationFee > 0) {
      legacyFeeItems.push({
        id: 'fee-legacy-registration',
        name: 'Enrollment / Registration Fee',
        amount: raw.registrationFee,
        currency: defaultCurrency,
        frequency: 'one_time',
        notes: 'Migrated from legacy registration fee',
      });
    }
    fees = legacyFeeItems;
  }

  // 9. Important Dates
  let importantDates: AdmissionImportantDateItem[] = [];
  if (Array.isArray(raw.importantDates) && raw.importantDates.length > 0) {
    importantDates = raw.importantDates.map((dt, idx) => ({
      id: dt.id || `date-${idx}-${Date.now()}`,
      eventName: dt.eventName || 'Admission Milestone',
      startDate: dt.startDate || '',
      endDate: dt.endDate || '',
      description: dt.description || '',
    }));
  }

  // 10. Application Config
  const rawApp = raw.application || {};
  const application: AdmissionApplicationConfig = {
    method: rawApp.method || (applicationOptions.onlineApplication ? 'website' : 'in_person'),
    url: rawApp.url || '',
    instructions: rawApp.instructions || '',
    supportContact: rawApp.supportContact || '',
  };

  // 11. Call to action & notes
  const callToAction = raw.callToAction || 'Apply Now';
  const customCtaLabel = raw.customCtaLabel || '';
  const additionalInformation = raw.additionalInformation || '';
  const feeNotes = raw.feeNotes || '';

  // Return normalized object WITH synchronized legacy flat mirrors
  return syncLegacyAdmissionsMirrors({
    session,
    status,
    applicationStartDate,
    applicationEndDate,
    admissionCycleNotes,
    contact,
    applicationOptions,
    classAvailability,
    eligibility,
    process,
    documents,
    fees,
    feeNotes,
    importantDates,
    application,
    callToAction,
    customCtaLabel,
    additionalInformation,
  });
}

/**
 * Synchronizes legacy flat mirrors on the AdmissionsData object for backward compatibility.
 */
export function syncLegacyAdmissionsMirrors(data: AdmissionsData): AdmissionsData {
  const result: AdmissionsData = { ...data };

  // Flat mirrors
  result.targetSessions = result.session || '';
  result.contactPerson = result.contact?.name || '';
  result.admissionPhone = result.contact?.phone || '';
  result.admissionEmail = result.contact?.email || '';
  result.admissionWhatsapp = result.contact?.whatsapp || '';
  result.officeHours = result.contact?.visitingHours || '';

  result.admissionsOpen = Boolean(result.applicationOptions?.admissionsOpen);
  result.onlineApplicationEnabled = Boolean(result.applicationOptions?.onlineApplication);
  result.documentUploadEnabled = Boolean(result.applicationOptions?.documentUpload);
  result.enquiryTrackingEnabled = Boolean(result.applicationOptions?.enquiryEnabled);

  // Classes open mirror
  if (Array.isArray(result.classAvailability)) {
    result.classesOpenForAdmission = result.classAvailability
      .filter((c) => c.status === 'open')
      .map((c) => c.className);
  }

  // Eligibility mirror
  if (result.eligibility) {
    result.eligibilityCriteria = result.eligibility.notes || '';
    result.minAgeCriteria = result.eligibility.minimumAge || '';
    result.maxAgeCriteria = result.eligibility.maximumAge || '';
    result.entranceTestRequired = Boolean(result.eligibility.entranceAssessment);
    result.interviewRequired = Boolean(result.eligibility.interviewRequired);
  }

  // Documents mirror
  if (Array.isArray(result.documents)) {
    result.requiredDocuments = result.documents
      .filter((d) => d.requirement === 'required')
      .map((d) => (d.name === 'Other' && d.customName ? d.customName : d.name));
  }

  // Workflow stages mirror
  if (Array.isArray(result.process)) {
    result.workflowStages = result.process
      .filter((p) => p.enabled)
      .sort((a, b) => a.order - b.order)
      .map((p) => p.label);
    result.admissionStages = result.workflowStages;
  }

  // Fees mirror
  if (Array.isArray(result.fees)) {
    const appFee = result.fees.find((f) =>
      /application|form|registration/i.test(f.name) && typeof f.amount === 'number'
    );
    if (appFee && appFee.amount !== undefined) {
      result.applicationFee = appFee.amount;
    }
    const admFee = result.fees.find((f) =>
      /admission/i.test(f.name) && !/application|form/i.test(f.name) && typeof f.amount === 'number'
    );
    if (admFee && admFee.amount !== undefined) {
      result.admissionFee = admFee.amount;
    }
  }

  return result;
}

// ─── VALIDATION ──────────────────────────────────────────────────────────────

export interface AdmissionValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates structured admissions data against production safety rules.
 */
export function validateAdmissions(admissions: AdmissionsData): AdmissionValidationResult {
  const errors: string[] = [];

  // Required: Target Admission Session
  const session = (admissions.session || admissions.targetSessions || '').trim();
  if (!session) {
    errors.push('Admissions: Target Admission Session is required.');
  }

  // Required: Admission In-Charge Name
  const incharge = (admissions.contact?.name || admissions.contactPerson || '').trim();
  if (!incharge) {
    errors.push('Admissions: Admission In-Charge Name is required.');
  }

  // Required: At least one admissions contact method
  const phone = (admissions.contact?.phone || admissions.admissionPhone || '').trim();
  const email = (admissions.contact?.email || admissions.admissionEmail || '').trim();
  const whatsapp = (admissions.contact?.whatsapp || admissions.admissionWhatsapp || '').trim();
  const visitingHours = (admissions.contact?.visitingHours || admissions.officeHours || '').trim();
  const address = (admissions.contact?.address || '').trim();

  if (!phone && !email && !whatsapp && !visitingHours && !address) {
    errors.push('Admissions: At least one contact method (phone, email, WhatsApp, or visiting hours) is required.');
  }

  // Date validation: Application dates chronology
  if (admissions.applicationStartDate && admissions.applicationEndDate) {
    const start = new Date(admissions.applicationStartDate).getTime();
    const end = new Date(admissions.applicationEndDate).getTime();
    if (!isNaN(start) && !isNaN(end) && end < start) {
      errors.push('Admissions: Application end date cannot precede start date.');
    }
  }

  // Date validation: Important Dates milestones
  if (Array.isArray(admissions.importantDates)) {
    admissions.importantDates.forEach((dt, idx) => {
      const eventName = (dt.eventName || '').trim() || `Milestone #${idx + 1}`;
      if (dt.startDate && dt.endDate) {
        const start = new Date(dt.startDate).getTime();
        const end = new Date(dt.endDate).getTime();
        if (!isNaN(start) && !isNaN(end) && end < start) {
          errors.push(`Admissions: End date cannot precede start date for "${eventName}".`);
        }
      }
    });
  }

  // Class Availability: Duplicate class names prevention & seat counts
  if (Array.isArray(admissions.classAvailability)) {
    const seen = new Set<string>();
    admissions.classAvailability.forEach((cls) => {
      const normName = cls.className.trim().toLowerCase();
      if (normName) {
        if (seen.has(normName)) {
          errors.push(`Admissions: Duplicate class "${cls.className}" in admission availability.`);
        }
        seen.add(normName);
      }
      if (typeof cls.availableSeats === 'number' && cls.availableSeats < 0) {
        errors.push(`Admissions: Available seats for "${cls.className}" cannot be negative.`);
      }
    });
  }

  // Process Steps: Unique IDs and ordering
  if (Array.isArray(admissions.process)) {
    const stepIds = new Set<string>();
    admissions.process.forEach((step, idx) => {
      if (!step.id) {
        errors.push(`Admissions: Process step #${idx + 1} is missing a unique ID.`);
      } else if (stepIds.has(step.id)) {
        errors.push(`Admissions: Duplicate process step ID "${step.id}".`);
      } else {
        stepIds.add(step.id);
      }
    });
  }

  // Documents: Unique IDs
  if (Array.isArray(admissions.documents)) {
    const docIds = new Set<string>();
    admissions.documents.forEach((doc, idx) => {
      if (!doc.id) {
        errors.push(`Admissions: Document #${idx + 1} is missing a unique ID.`);
      } else if (docIds.has(doc.id)) {
        errors.push(`Admissions: Duplicate document ID "${doc.id}".`);
      } else {
        docIds.add(doc.id);
      }
    });
  }

  // Fees: Non-negative amount validation
  if (Array.isArray(admissions.fees)) {
    admissions.fees.forEach((fee, idx) => {
      const feeName = (fee.name || '').trim() || `Fee #${idx + 1}`;
      if (typeof fee.amount === 'number' && fee.amount < 0) {
        errors.push(`Admissions: Fee amount for "${feeName}" cannot be negative.`);
      }
    });
  }

  // Conditional: Online Application requires application method
  if (admissions.applicationOptions?.onlineApplication) {
    if (!admissions.application?.method) {
      errors.push('Admissions: Application method must be selected when Online Application is enabled.');
    }
  }

  // Conditional: Document Upload requires at least one document
  if (admissions.applicationOptions?.documentUpload) {
    const hasConfiguredDoc = Array.isArray(admissions.documents) &&
      admissions.documents.some((d) => d.requirement === 'required' || d.requirement === 'optional');
    if (!hasConfiguredDoc) {
      errors.push('Admissions: At least one admission document must be marked Required or Optional when Document Upload is enabled.');
    }
  }

  // Conditional: Application Fee Required requires at least one fee entry with positive amount
  if (admissions.applicationOptions?.applicationFeeRequired) {
    const hasAppFee =
      (Array.isArray(admissions.fees) && admissions.fees.some((f) => typeof f.amount === 'number' && f.amount > 0)) ||
      (typeof admissions.applicationFee === 'number' && admissions.applicationFee > 0);
    if (!hasAppFee) {
      errors.push('Admissions: At least one application or registration fee must be entered when Application Fee Required is enabled.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ─── WEBSITE GENERATOR PAYLOAD ENGINE ────────────────────────────────────────

export interface AdmissionsWebsiteOutput {
  isOpen: boolean;
  status: AdmissionStatus;
  statusBadge: string;
  session: string;
  applicationStartDate: string | null;
  applicationEndDate: string | null;
  admissionCycleNotes: string | null;

  openClasses: string[];
  closedClasses: string[];
  waitlistClasses: string[];
  enquiryOnlyClasses: string[];
  classes: Array<{
    className: string;
    status: ClassAdmissionStatus;
    availableSeats: number | null;
    notes: string | null;
  }>;

  applicationOptions: {
    onlineApplication: boolean;
    documentUpload: boolean;
    walkInApplication: boolean;
    enquiryEnabled: boolean;
    callbackEnabled: boolean;
    applicationFeeRequired: boolean;
  };

  applicationMethod: ApplicationMethod | string;
  applicationUrl: string | null;
  applicationInstructions: string | null;

  requiredDocuments: string[];
  optionalDocuments: string[];

  fees: Array<{
    name: string;
    amount: number | null;
    currency: string;
    frequency: string;
    applicableClasses: string[];
    notes: string | null;
  }>;
  feeNotes: string | null;

  eligibility: {
    applicableClasses: string[];
    minimumAge: string | null;
    maximumAge: string | null;
    ageCutoffDate: string | null;
    entranceAssessment: boolean;
    interviewRequired: boolean;
    previousAcademicRequirement: string | null;
    notes: string | null;
  };

  process: Array<{
    stepNumber: number;
    label: string;
    description: string | null;
  }>;

  importantDates: Array<{
    eventName: string;
    startDate: string | null;
    endDate: string | null;
    description: string | null;
  }>;

  contact: {
    inchargeName: string;
    phone: string | null;
    email: string | null;
    whatsapp: string | null;
    visitingHours: string | null;
    preferredMethod: string | null;
    address: string | null;
  };

  callToAction: {
    label: string;
    action: string;
  };

  additionalInformation: string | null;
}

/**
 * Transforms normalized admissions data into the structured output consumed by the website generator.
 * Eliminates need for parsing free-form text.
 */
export function getAdmissionsWebsiteOutput(
  admissions: AdmissionsData,
  canonicalContext?: CanonicalAdmissionsContext
): AdmissionsWebsiteOutput {
  const norm = normalizeAdmissionsData(admissions, canonicalContext);

  const statusOpt = DEFAULT_ADMISSION_STATUS_OPTIONS.find((s) => s.value === norm.status) || DEFAULT_ADMISSION_STATUS_OPTIONS[0];

  const openClasses: string[] = [];
  const closedClasses: string[] = [];
  const waitlistClasses: string[] = [];
  const enquiryOnlyClasses: string[] = [];

  const classes = (norm.classAvailability || []).map((c) => {
    if (c.status === 'open') openClasses.push(c.className);
    else if (c.status === 'closed') closedClasses.push(c.className);
    else if (c.status === 'waitlist') waitlistClasses.push(c.className);
    else if (c.status === 'enquiry_only') enquiryOnlyClasses.push(c.className);

    return {
      className: c.className,
      status: c.status,
      availableSeats: typeof c.availableSeats === 'number' ? c.availableSeats : null,
      notes: c.notes?.trim() || null,
    };
  });

  const requiredDocuments: string[] = [];
  const optionalDocuments: string[] = [];
  (norm.documents || []).forEach((d) => {
    const displayName = d.name === 'Other' && d.customName ? d.customName : d.name;
    if (d.requirement === 'required') requiredDocuments.push(displayName);
    else if (d.requirement === 'optional') optionalDocuments.push(displayName);
  });

  const fees = (norm.fees || []).map((f) => ({
    name: f.name,
    amount: typeof f.amount === 'number' ? f.amount : null,
    currency: f.currency || 'INR',
    frequency: f.frequency || 'one_time',
    applicableClasses: f.applicableClasses || [],
    notes: f.notes?.trim() || null,
  }));

  // Only enabled process steps, ordered numerically
  const process = (norm.process || [])
    .filter((p) => p.enabled)
    .sort((a, b) => a.order - b.order)
    .map((p, idx) => ({
      stepNumber: idx + 1,
      label: p.label,
      description: p.description?.trim() || null,
    }));

  const importantDates = (norm.importantDates || []).map((dt) => ({
    eventName: dt.eventName,
    startDate: dt.startDate || null,
    endDate: dt.endDate || null,
    description: dt.description?.trim() || null,
  }));

  const ctaLabel = norm.callToAction === 'Other' && norm.customCtaLabel ? norm.customCtaLabel : norm.callToAction || 'Apply Now';

  return {
    isOpen: norm.status === 'open' && Boolean(norm.applicationOptions?.admissionsOpen),
    status: norm.status || 'upcoming',
    statusBadge: statusOpt.badge,
    session: norm.session || '',
    applicationStartDate: norm.applicationStartDate || null,
    applicationEndDate: norm.applicationEndDate || null,
    admissionCycleNotes: norm.admissionCycleNotes?.trim() || null,

    openClasses,
    closedClasses,
    waitlistClasses,
    enquiryOnlyClasses,
    classes,

    applicationOptions: {
      onlineApplication: Boolean(norm.applicationOptions?.onlineApplication),
      documentUpload: Boolean(norm.applicationOptions?.documentUpload),
      walkInApplication: Boolean(norm.applicationOptions?.walkInApplication),
      enquiryEnabled: Boolean(norm.applicationOptions?.enquiryEnabled),
      callbackEnabled: Boolean(norm.applicationOptions?.callbackEnabled),
      applicationFeeRequired: Boolean(norm.applicationOptions?.applicationFeeRequired),
    },

    applicationMethod: norm.application?.method || 'website',
    applicationUrl: norm.application?.url?.trim() || null,
    applicationInstructions: norm.application?.instructions?.trim() || null,

    requiredDocuments,
    optionalDocuments,

    fees,
    feeNotes: norm.feeNotes?.trim() || null,

    eligibility: {
      applicableClasses: norm.eligibility?.applicableClasses || [],
      minimumAge: norm.eligibility?.minimumAge?.trim() || null,
      maximumAge: norm.eligibility?.maximumAge?.trim() || null,
      ageCutoffDate: norm.eligibility?.ageCutoffDate?.trim() || null,
      entranceAssessment: Boolean(norm.eligibility?.entranceAssessment),
      interviewRequired: Boolean(norm.eligibility?.interviewRequired),
      previousAcademicRequirement: norm.eligibility?.previousAcademicRequirement?.trim() || null,
      notes: norm.eligibility?.notes?.trim() || null,
    },

    process,
    importantDates,

    contact: {
      inchargeName: norm.contact?.name || '',
      phone: norm.contact?.phone || null,
      email: norm.contact?.email || null,
      whatsapp: norm.contact?.whatsapp || null,
      visitingHours: norm.contact?.visitingHours || null,
      preferredMethod: norm.contact?.preferredMethod || null,
      address: norm.contact?.address || null,
    },

    callToAction: {
      label: ctaLabel,
      action: norm.applicationOptions?.onlineApplication
        ? norm.application?.url
          ? norm.application.url
          : '#apply-online'
        : '#contact-admissions',
    },

    additionalInformation: norm.additionalInformation?.trim() || null,
  };
}
