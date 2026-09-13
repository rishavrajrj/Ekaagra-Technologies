/**
 * Canonical Document Review Engine
 *
 * Provides deep document quality-control and verification capabilities:
 * 1. Structured comparison schemas matching uploaded documents to intake records.
 * 2. Specialized verification checklists per document type (statutory, conditional, legal policies).
 * 3. Automated validation status determination (WITHOUT equating validation to admin approval).
 * 4. Structured multi-reason rejection/replacement framework.
 * 5. High-level document completeness KPI aggregation for administrative review.
 */

import type { UniversalIntakeData, SchoolIntakeChangeRequest } from './types';
import {
  CANONICAL_DOCUMENT_IDS,
  CANONICAL_STATUTORY_REQUIREMENTS,
  isValidUploadedDocument,
} from './canonicalDocuments';

// ─── 1. DOCUMENT FIELD COMPARISON SCHEMA ─────────────────────────────────────

export type ComparisonMatchResult =
  | 'MATCH'
  | 'MISMATCH'
  | 'REQUIRES_MANUAL_VERIFICATION'
  | 'NOT_APPLICABLE';

export interface ExpectedDocumentField {
  fieldId: string;
  label: string;
  enteredValue?: string;
  extractedValue?: string; // OCR / metadata extracted value. Never fabricated!
  comparisonStatus: ComparisonMatchResult;
  notes?: string;
}

export interface DocumentVerificationChecklistItem {
  id: string;
  label: string;
  hint: string;
  category: 'authenticity' | 'validity' | 'completeness' | 'legibility' | 'publication';
  required: boolean;
}

export type CanonicalDocumentCategory =
  | 'STATUTORY'
  | 'CONDITIONAL'
  | 'ADMINISTRATIVE'
  | 'LEGAL_POLICY';

export interface CanonicalDocumentReviewDefinition {
  canonicalId: string;
  checklistId: string;
  title: string;
  category: CanonicalDocumentCategory;
  description: string;
  sourcePage: string;
  governingAuthority: string;
  expectedFields: (intakeData: any) => ExpectedDocumentField[];
  verificationChecklist: DocumentVerificationChecklistItem[];
}

// ─── 2. STRUCTURED REPLACEMENT REASONS ───────────────────────────────────────

export interface StructuredReplacementReason {
  id: string;
  label: string;
  category: 'quality' | 'content' | 'validity' | 'administrative';
  description: string;
}

export const STRUCTURED_REPLACEMENT_REASONS: StructuredReplacementReason[] = [
  {
    id: 'wrong_document',
    label: 'Incorrect Document Type',
    category: 'content',
    description: 'The uploaded file does not match the requested certificate (e.g. water test uploaded instead of fire safety NOC).',
  },
  {
    id: 'illegible_scan',
    label: 'Illegible / Low Resolution Scan',
    category: 'quality',
    description: 'Document is blurry, pixelated, truncated, dark, or contains illegible key numbers, dates, or names.',
  },
  {
    id: 'expired_validity',
    label: 'Expired Certificate / NOC',
    category: 'validity',
    description: 'The validity period stated on the document has lapsed and no extension order was attached.',
  },
  {
    id: 'school_name_mismatch',
    label: 'School / Institution Name Mismatch',
    category: 'content',
    description: 'The name or branch/campus stated on the certificate does not match the onboarding application name.',
  },
  {
    id: 'address_mismatch',
    label: 'Address / Campus Location Mismatch',
    category: 'content',
    description: 'The physical premises address, plot number, or village/town does not correspond to the actual campus location.',
  },
  {
    id: 'missing_pages',
    label: 'Missing Pages / Incomplete Annexures',
    category: 'quality',
    description: 'Multi-page certificate is missing pages, condition schedules, or accompanying government inspection orders.',
  },
  {
    id: 'missing_signature_seal',
    label: 'Missing Official Seal or Authorized Signature',
    category: 'validity',
    description: 'The document lacks the official rubber stamp, seal, or signature of the issuing government officer / competent authority.',
  },
  {
    id: 'provisional_incomplete',
    label: 'Provisional Status / Needs Permanent Order',
    category: 'validity',
    description: 'Uploaded order is temporary or provisional with lapsed validity; permanent grant or extension letter required.',
  },
  {
    id: 'watermark_or_sample',
    label: 'Watermarked Draft or Sample Document',
    category: 'quality',
    description: 'The file appears to be a specimen, template, demo file, or contains draft watermarks unsuitable for public disclosure.',
  },
  {
    id: 'unauthorized_issuer',
    label: 'Unauthorized Issuing Authority',
    category: 'validity',
    description: 'Certificate was issued by an unaccredited private agency instead of the designated PWD, Fire Service, or Education Dept authority.',
  },
  {
    id: 'file_corrupted',
    label: 'Corrupted File / Read Error',
    category: 'quality',
    description: 'The PDF file is corrupted, password-protected, or fails to render inside standard browser viewers.',
  },
  {
    id: 'other',
    label: 'Other / Custom Revision Required',
    category: 'administrative',
    description: 'Specific administrative or compliance observation specified in the review notes.',
  },
];

// ─── 3. FIELD COMPARISON EVALUATOR ──────────────────────────────────────────

/**
 * Normalizes strings for robust matching (trims, collapses whitespace, lowers case).
 */
export function normalizeComparisonText(val?: string): string {
  if (!val) return '';
  return val.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Evaluates comparison status between entered school value and extracted document value.
 * Strict rule: If extracted value is missing/undefined, returns 'REQUIRES_MANUAL_VERIFICATION'.
 * We never fabricate OCR values.
 */
export function evaluateFieldComparison(
  enteredValue?: string,
  extractedValue?: string
): ComparisonMatchResult {
  const entered = enteredValue?.trim();
  const extracted = extractedValue?.trim();

  if (!entered && !extracted) {
    return 'NOT_APPLICABLE';
  }

  if (!extracted) {
    // Value was entered by school, but automated OCR could not extract it.
    // Explicitly flag for human review!
    return 'REQUIRES_MANUAL_VERIFICATION';
  }

  if (!entered) {
    return 'MISMATCH';
  }

  const normEntered = normalizeComparisonText(entered);
  const normExtracted = normalizeComparisonText(extracted);

  if (normEntered === normExtracted || normExtracted.includes(normEntered) || normEntered.includes(normExtracted)) {
    return 'MATCH';
  }

  return 'MISMATCH';
}

// ─── 4. CANONICAL DOCUMENT DEFINITIONS REGISTRY ─────────────────────────────

export const CANONICAL_DOCUMENT_REVIEW_DEFINITIONS: CanonicalDocumentReviewDefinition[] = [
  // 1. Board Affiliation Certificate
  {
    canonicalId: CANONICAL_DOCUMENT_IDS.BOARD_AFFILIATION,
    checklistId: 'cert-affiliation',
    title: 'Board Affiliation Certificate / Extension Letter',
    category: 'STATUTORY',
    description: 'Official grant letter or affiliation certificate from CBSE, CISCE, or State Board.',
    sourcePage: 'Academics & Board',
    governingAuthority: 'Central Board of Secondary Education / CISCE / State Dept',
    expectedFields: (intake) => {
      const schoolName = intake.generalInfo?.schoolName;
      const board = intake.academicFramework?.primaryBoard || intake.generalInfo?.boardAffiliation;
      const affNo = intake.academicFramework?.affiliationNumber || intake.generalInfo?.affiliationNumber;
      const schoolAddress = intake.generalInfo?.address?.city
        ? `${intake.generalInfo.address.city}, ${intake.generalInfo.address.state || ''}`
        : intake.generalInfo?.address?.rawAddress;

      return [
        {
          fieldId: 'school_name',
          label: 'School Name (as per Affiliation)',
          enteredValue: schoolName,
          comparisonStatus: evaluateFieldComparison(schoolName, undefined),
          notes: 'Must match official registered school name and campus branch.',
        },
        {
          fieldId: 'affiliation_number',
          label: 'Affiliation / Registration Number',
          enteredValue: affNo,
          comparisonStatus: evaluateFieldComparison(affNo, undefined),
          notes: 'Must match national board code (e.g. CBSE 8-digit or CISCE code).',
        },
        {
          fieldId: 'board_name',
          label: 'Board Authority',
          enteredValue: board,
          comparisonStatus: evaluateFieldComparison(board, undefined),
          notes: 'Board mentioned on grant letter must match primary academic board.',
        },
        {
          fieldId: 'school_address',
          label: 'Registered School Location',
          enteredValue: schoolAddress,
          comparisonStatus: evaluateFieldComparison(schoolAddress, undefined),
          notes: 'City and State must correspond to the school physical address.',
        },
        {
          fieldId: 'validity_period',
          label: 'Affiliation Validity / Period',
          enteredValue: 'Permanent or Current Session Extension',
          comparisonStatus: 'REQUIRES_MANUAL_VERIFICATION',
          notes: 'Verify grant period covers the active academic year.',
        },
      ];
    },
    verificationChecklist: [
      {
        id: 'aff-code-match',
        label: 'Affiliation Number Matches Board Portal',
        hint: 'Cross-check the affiliation code with SARAS / CBSE / CISCE directory.',
        category: 'authenticity',
        required: true,
      },
      {
        id: 'aff-school-name',
        label: 'Full School Name Matches Onboarding Application',
        hint: 'Check that trust name is not substituted for the school branch name.',
        category: 'authenticity',
        required: true,
      },
      {
        id: 'aff-validity-current',
        label: 'Affiliation Status is Active or Extension Granted',
        hint: 'Ensure letter shows valid period or conditional extension for ongoing session.',
        category: 'validity',
        required: true,
      },
      {
        id: 'aff-level-grade',
        label: 'Approved Level Matches Curriculum (Secondary / Sr. Secondary)',
        hint: 'Confirm classes granted (e.g. up to Class X or Class XII with streams).',
        category: 'completeness',
        required: true,
      },
      {
        id: 'aff-seal-signature',
        label: 'CBSE / Board Competent Authority Signature & Seal Legible',
        hint: 'Digital signature or stamped signature of Joint Secretary / Board Officer.',
        category: 'legibility',
        required: true,
      },
      {
        id: 'aff-publication-ready',
        label: 'High Quality Clean Copy Suitable for Public Disclosure Link',
        hint: 'Will be publicly viewable on Mandatory Disclosure / About Us page.',
        category: 'publication',
        required: true,
      },
    ],
  },

  // 2. Building Safety & Fire Safety Certificate
  {
    canonicalId: CANONICAL_DOCUMENT_IDS.BUILDING_FIRE_SAFETY,
    checklistId: 'cert-safety',
    title: 'Building Safety & Fire Safety Certificate',
    category: 'STATUTORY',
    description: 'Valid building stability certificate and Fire Safety NOC from municipal authorities.',
    sourcePage: 'Safety & Compliance',
    governingAuthority: 'Public Works Department (PWD) / Municipal Fire & Rescue Service',
    expectedFields: (intake) => {
      const schoolName = intake.generalInfo?.schoolName;
      const address = intake.generalInfo?.address?.rawAddress || intake.generalInfo?.address?.city;

      return [
        {
          fieldId: 'school_name',
          label: 'School / Institution Name',
          enteredValue: schoolName,
          comparisonStatus: evaluateFieldComparison(schoolName, undefined),
          notes: 'Must name the school campus explicitly.',
        },
        {
          fieldId: 'campus_address',
          label: 'Campus / Plot Address',
          enteredValue: address,
          comparisonStatus: evaluateFieldComparison(address, undefined),
          notes: 'Building survey number / street location must match campus.',
        },
        {
          fieldId: 'fire_noc_validity',
          label: 'Fire Safety NOC Validity Date',
          enteredValue: 'Valid for current academic session',
          comparisonStatus: 'REQUIRES_MANUAL_VERIFICATION',
          notes: 'Fire NOCs typically require annual renewal.',
        },
        {
          fieldId: 'building_safety_validity',
          label: 'Structural Building Safety Validity',
          enteredValue: 'Valid structural certificate (PWD / Chartered Engineer)',
          comparisonStatus: 'REQUIRES_MANUAL_VERIFICATION',
          notes: 'Building fitness certificate usually valid for 3-5 years.',
        },
        {
          fieldId: 'issuing_authority',
          label: 'Issuing Municipal / Fire Officer',
          enteredValue: 'District Fire Officer / Executive Engineer PWD',
          comparisonStatus: 'REQUIRES_MANUAL_VERIFICATION',
          notes: 'Verify authorized government or accredited municipal body.',
        },
      ];
    },
    verificationChecklist: [
      {
        id: 'safe-pwd-stability',
        label: 'Building Structural Stability Certificate Included',
        hint: 'Issued by Executive Engineer (PWD) or certified structural engineer.',
        category: 'completeness',
        required: true,
      },
      {
        id: 'safe-fire-noc',
        label: 'Fire Safety Certificate / NOC Included',
        hint: 'Issued by Chief Fire Officer or Municipal Fire Service Authority.',
        category: 'completeness',
        required: true,
      },
      {
        id: 'safe-fire-validity',
        label: 'Fire Safety NOC is Active (Not Expired)',
        hint: 'Check issue date and validity expiry date. Fire certificates expire in 1-3 years.',
        category: 'validity',
        required: true,
      },
      {
        id: 'safe-building-validity',
        label: 'Building Safety Certificate is Currently Valid',
        hint: 'Verify valid date window or structural renewal interval.',
        category: 'validity',
        required: true,
      },
      {
        id: 'safe-address-match',
        label: 'Campus Address & Plot Details Match Intake Records',
        hint: 'Premises inspected must be the exact campus where students attend.',
        category: 'authenticity',
        required: true,
      },
      {
        id: 'safe-floors-coverage',
        label: 'Inspected Floors Cover All School Buildings / Blocks',
        hint: 'NOC should specify all operational blocks (e.g. Ground + 3 floors).',
        category: 'completeness',
        required: false,
      },
      {
        id: 'safe-seal-signature',
        label: 'Official Government Seal & Officer Signature Clearly Visible',
        hint: 'Ensure rubber stamps and designation seals are crisp and legible.',
        category: 'legibility',
        required: true,
      },
      {
        id: 'safe-no-adverse-remarks',
        label: 'No Open Violations or Unresolved Safety Directives',
        hint: 'Check if certificate states conditions that were not fulfilled.',
        category: 'validity',
        required: true,
      },
      {
        id: 'safe-publication-ready',
        label: 'Suitable for Mandatory Disclosure Web Publication',
        hint: 'Clear multi-page scan free from dark shadows or skewing.',
        category: 'publication',
        required: true,
      },
    ],
  },

  // 3. School Recognition Certificate / Government NOC
  {
    canonicalId: CANONICAL_DOCUMENT_IDS.SCHOOL_RECOGNITION_NOC,
    checklistId: 'cert-recognition',
    title: 'School Recognition Certificate / Government NOC',
    category: 'STATUTORY',
    description: 'State Education Department No Objection Certificate (NOC) or formal recognition order.',
    sourcePage: 'Governance & Recognition',
    governingAuthority: 'State Education Department / Directorate of School Education',
    expectedFields: (intake) => {
      const schoolName = intake.generalInfo?.schoolName;
      const state = intake.generalInfo?.address?.state;

      return [
        {
          fieldId: 'school_name',
          label: 'School Name (as Recognized)',
          enteredValue: schoolName,
          comparisonStatus: evaluateFieldComparison(schoolName, undefined),
          notes: 'Must name the school under state recognition records.',
        },
        {
          fieldId: 'state_authority',
          label: 'State Education Department',
          enteredValue: state,
          comparisonStatus: evaluateFieldComparison(state, undefined),
          notes: 'Recognized by the department of the state where campus is located.',
        },
        {
          fieldId: 'recognition_classes',
          label: 'Classes Recognized (RTE / State Norms)',
          enteredValue: 'Primary / Upper Primary / Secondary',
          comparisonStatus: 'REQUIRES_MANUAL_VERIFICATION',
          notes: 'Ensure classes match the school active offerings.',
        },
        {
          fieldId: 'order_number_date',
          label: 'Recognition Order Dispatch No. & Date',
          enteredValue: 'State Order / Dispatch Number',
          comparisonStatus: 'REQUIRES_MANUAL_VERIFICATION',
          notes: 'Official dispatch number for statutory audit.',
        },
      ];
    },
    verificationChecklist: [
      {
        id: 'recog-state-authority',
        label: 'Issued by State Dept of Education / DEO / Commissioner',
        hint: 'Check letterhead and competent signatory authority.',
        category: 'authenticity',
        required: true,
      },
      {
        id: 'recog-school-identity',
        label: 'School Name & Trust Entity Accurately Stated',
        hint: 'Verify matching institution identity.',
        category: 'authenticity',
        required: true,
      },
      {
        id: 'recog-classes-covered',
        label: 'Grades / Classes Covered Match Current Operations',
        hint: 'Recognition must cover classes from KG/Class 1 through Senior.',
        category: 'completeness',
        required: true,
      },
      {
        id: 'recog-official-dispatch',
        label: 'Official Memo / Dispatch Number & Date Legible',
        hint: 'Indicates registered government filing record.',
        category: 'legibility',
        required: true,
      },
      {
        id: 'recog-seal-present',
        label: 'Government Stamped Seal & Signature Visible',
        hint: 'Officer designation and departmental stamp must be intact.',
        category: 'authenticity',
        required: true,
      },
      {
        id: 'recog-publication-ready',
        label: 'Ready for Public Statutory Disclosure Section',
        hint: 'Mandated under RTE Act for public transparency.',
        category: 'publication',
        required: true,
      },
    ],
  },

  // 4. Society / Trust Registration Certificate
  {
    canonicalId: CANONICAL_DOCUMENT_IDS.SOCIETY_TRUST_REGISTRATION,
    checklistId: 'cert-registration',
    title: 'Society / Trust Registration Certificate',
    category: 'CONDITIONAL',
    description: 'Registration certificate of the educational society or non-profit trust running the school.',
    sourcePage: 'Governance',
    governingAuthority: 'Registrar of Societies / Sub-Registrar / Charity Commissioner',
    expectedFields: (intake) => {
      const societyName = intake.governance?.societyName || intake.generalInfo?.schoolName;

      return [
        {
          fieldId: 'society_name',
          label: 'Society / Trust Registered Name',
          enteredValue: societyName,
          comparisonStatus: evaluateFieldComparison(societyName, undefined),
          notes: 'Registered non-profit entity governing the school.',
        },
        {
          fieldId: 'registration_number',
          label: 'Society / Trust Reg. Number',
          enteredValue: 'Society Act / Trust Act Reg. No.',
          comparisonStatus: 'REQUIRES_MANUAL_VERIFICATION',
          notes: 'Unique registration code under Societies Registration Act.',
        },
        {
          fieldId: 'registration_status',
          label: 'Validity / Renewal Status',
          enteredValue: 'Permanent / Renewed',
          comparisonStatus: 'REQUIRES_MANUAL_VERIFICATION',
          notes: 'Must be legally active and in good standing.',
        },
      ];
    },
    verificationChecklist: [
      {
        id: 'soc-registered-entity',
        label: 'Society / Trust Registered Under Applicable Act',
        hint: 'Societies Registration Act 1860, Indian Trusts Act, or Section 8 Company.',
        category: 'authenticity',
        required: true,
      },
      {
        id: 'soc-aims-education',
        label: 'Objects of Society Include Educational Purpose',
        hint: 'Non-proprietary character of society running the school.',
        category: 'authenticity',
        required: false,
      },
      {
        id: 'soc-active-status',
        label: 'Registration is Active / Renewed',
        hint: 'If periodic renewal is mandatory in state, confirm valid renewal receipt.',
        category: 'validity',
        required: true,
      },
      {
        id: 'soc-registrar-seal',
        label: 'Registrar Seal & Signature Present',
        hint: 'Official stamp from Registrar of Societies / Inspector General of Reg.',
        category: 'authenticity',
        required: true,
      },
    ],
  },

  // 5. Mandatory Public Disclosure Document (Appendix IX)
  {
    canonicalId: CANONICAL_DOCUMENT_IDS.MANDATORY_PUBLIC_DISCLOSURE,
    checklistId: 'cert-mandatory-disclosure',
    title: 'Mandatory Public Disclosure Document (Appendix IX)',
    category: 'STATUTORY',
    description: 'Official board mandatory disclosure sheet containing school details, land certs, and safety orders.',
    sourcePage: 'Statutory Disclosure',
    governingAuthority: 'CBSE / ICSE Central Affiliation Norms',
    expectedFields: (intake) => {
      const schoolName = intake.generalInfo?.schoolName;
      const principalName = (intake.leadership as any)?.principal?.name || intake.leadership?.principalName;
      const schoolEmail = intake.generalInfo?.contactEmail;

      return [
        {
          fieldId: 'school_name',
          label: 'School Name on Disclosure',
          enteredValue: schoolName,
          comparisonStatus: evaluateFieldComparison(schoolName, undefined),
          notes: 'Must match official disclosure heading.',
        },
        {
          fieldId: 'principal_name',
          label: 'Principal / Head of Institution',
          enteredValue: principalName,
          comparisonStatus: evaluateFieldComparison(principalName, undefined),
          notes: 'Signed and confirmed by institutional head.',
        },
        {
          fieldId: 'school_email',
          label: 'Official Disclosure Email',
          enteredValue: schoolEmail,
          comparisonStatus: evaluateFieldComparison(schoolEmail, undefined),
          notes: 'Must match public correspondence email.',
        },
      ];
    },
    verificationChecklist: [
      {
        id: 'disc-format-appendix-ix',
        label: 'Follows Official Board Appendix IX Standard Format',
        hint: 'Contains General Info, Documents & Info, Results, Staff, and Infrastructure tables.',
        category: 'completeness',
        required: true,
      },
      {
        id: 'disc-all-links-valid',
        label: 'All Referenced Document Annexures & Links Present',
        hint: 'Land certificate, fire NOC, water testing, sanitation links listed.',
        category: 'completeness',
        required: true,
      },
      {
        id: 'disc-principal-signature',
        label: 'Signed by Principal and Manager with School Seal',
        hint: 'Both signatories must sign and stamp the disclosure document.',
        category: 'authenticity',
        required: true,
      },
      {
        id: 'disc-annual-refresh',
        label: 'Updated for the Current / Approaching Academic Year',
        hint: 'CBSE mandates annual update of disclosure details on website.',
        category: 'validity',
        required: true,
      },
      {
        id: 'disc-publication-ready',
        label: 'Document Ready to be Linked in Website Footer',
        hint: 'Direct hyperlink mandated by board guidelines in homepage footer.',
        category: 'publication',
        required: true,
      },
    ],
  },

  // 6. Official Fee Schedule / Circular (PDF)
  {
    canonicalId: CANONICAL_DOCUMENT_IDS.FEE_SCHEDULE,
    checklistId: 'adm-fee-circular',
    title: 'Official Fee Schedule / Circular (PDF)',
    category: 'ADMINISTRATIVE',
    description: 'Current session fee schedule detailing admission fees, tuition charges, and payment intervals.',
    sourcePage: 'Admissions & Fees',
    governingAuthority: 'School Management Committee / State Fee Regulatory Committee',
    expectedFields: (intake) => {
      const schoolName = intake.generalInfo?.schoolName;

      return [
        {
          fieldId: 'school_name',
          label: 'School Name on Fee Schedule',
          enteredValue: schoolName,
          comparisonStatus: evaluateFieldComparison(schoolName, undefined),
          notes: 'Issued on school letterhead.',
        },
        {
          fieldId: 'academic_session',
          label: 'Academic Session Covered',
          enteredValue: 'Current Academic Session',
          comparisonStatus: 'REQUIRES_MANUAL_VERIFICATION',
          notes: 'Ensure fees are not from an outdated session.',
        },
      ];
    },
    verificationChecklist: [
      {
        id: 'fee-class-breakup',
        label: 'Clear Class-wise or Grade-wise Fee Breakup',
        hint: 'Clear distinction between admission fee, tuition, lab, and transport fees.',
        category: 'completeness',
        required: true,
      },
      {
        id: 'fee-payment-terms',
        label: 'Payment Intervals & Due Dates Clearly Specified',
        hint: 'Quarterly, bi-monthly, or monthly payment terms described.',
        category: 'completeness',
        required: true,
      },
      {
        id: 'fee-refund-consistency',
        label: 'Refund & Withdrawal Clauses Align with School Legal Policy',
        hint: 'Verify refund conditions do not contradict stated refund policy.',
        category: 'validity',
        required: true,
      },
      {
        id: 'fee-authorized-signature',
        label: 'Signed by Principal / Finance Manager / SMC Head',
        hint: 'Official circular must bear authorizing signature and date.',
        category: 'authenticity',
        required: true,
      },
    ],
  },
];

// ─── 5. DERIVED VALIDATION STATUS ───────────────────────────────────────────

export type DerivedDocumentValidationStatus =
  | 'VALID'
  | 'REQUIRES_MANUAL_VERIFICATION'
  | 'INVALID'
  | 'EXPIRED'
  | 'MISSING';

/**
 * Calculates derived validation status for a document.
 * Note: Automated validation status is an assistive tool for administrators,
 * and does NOT represent final administrative approval.
 */
export function calculateDerivedDocumentValidationStatus(
  fileUrl?: string,
  fileName?: string,
  comparisonFields: ExpectedDocumentField[] = [],
  expiryDate?: string
): DerivedDocumentValidationStatus {
  if (!isValidUploadedDocument(fileUrl, fileName)) {
    return 'MISSING';
  }

  // Check expiry date if provided
  if (expiryDate && expiryDate.trim() && expiryDate.toLowerCase() !== 'permanent' && expiryDate.toLowerCase() !== 'annual update') {
    const parsed = new Date(expiryDate);
    if (!isNaN(parsed.getTime()) && parsed.getTime() < Date.now()) {
      return 'EXPIRED';
    }
  }

  // If any field comparison is explicitly mismatched, flag as INVALID
  const hasMismatch = comparisonFields.some((f) => f.comparisonStatus === 'MISMATCH');
  if (hasMismatch) {
    return 'INVALID';
  }

  // If any field requires manual verification, flag as REQUIRES_MANUAL_VERIFICATION
  const hasManualReq = comparisonFields.some((f) => f.comparisonStatus === 'REQUIRES_MANUAL_VERIFICATION');
  if (hasManualReq) {
    return 'REQUIRES_MANUAL_VERIFICATION';
  }

  return 'VALID';
}

// ─── 6. DOCUMENT REVIEW DEFINITIONS LOOKUP ──────────────────────────────────

export function getDocumentReviewDefinition(
  canonicalOrChecklistId: string
): CanonicalDocumentReviewDefinition | undefined {
  return CANONICAL_DOCUMENT_REVIEW_DEFINITIONS.find(
    (def) =>
      def.checklistId === canonicalOrChecklistId ||
      def.canonicalId === canonicalOrChecklistId
  );
}

// ─── 7. HIGH LEVEL DOCUMENT COMPLETENESS SUMMARY ────────────────────────────

export interface DocumentCompletenessSummary {
  totalRequired: number;
  totalSubmitted: number;
  totalApproved: number;
  totalChangesRequested: number;
  totalPendingReview: number;
  totalPublicationBlockers: number;
  percentage: number;
}

export function calculateDocumentCompletenessSummary(
  documents: Array<{
    required: boolean;
    isPublicationBlocker: boolean;
    status: string; // e.g. 'approved' | 'rejected' | 'pending' | 'missing'
    fileUrl?: string;
    fileName?: string;
  }>
): DocumentCompletenessSummary {
  let totalRequired = 0;
  let totalSubmitted = 0;
  let totalApproved = 0;
  let totalChangesRequested = 0;
  let totalPendingReview = 0;
  let totalPublicationBlockers = 0;

  for (const doc of documents) {
    const isUploaded = isValidUploadedDocument(doc.fileUrl, doc.fileName);

    if (doc.required) {
      totalRequired++;
    }

    if (isUploaded) {
      totalSubmitted++;
    }

    if (doc.status === 'approved') {
      totalApproved++;
    } else if (doc.status === 'rejected') {
      totalChangesRequested++;
    } else if (isUploaded) {
      totalPendingReview++;
    }

    if (doc.isPublicationBlocker && (!isUploaded || doc.status === 'rejected')) {
      totalPublicationBlockers++;
    }
  }

  const percentage = totalRequired > 0 ? Math.round((totalApproved / totalRequired) * 100) : 100;

  return {
    totalRequired,
    totalSubmitted,
    totalApproved,
    totalChangesRequested,
    totalPendingReview,
    totalPublicationBlockers,
    percentage: Math.min(100, Math.max(0, percentage)),
  };
}

// ─── 8. DOCUMENT LIFECYCLE STATE INVARIANT VALIDATION ───────────────────────

export interface DocumentStateInvariantInput {
  documentId: string;
  fileUrl?: string;
  fileName?: string;
  adminDecision?: 'approved' | 'changes_requested' | 'pending_review' | 'not_reviewed' | string;
  derivedStatus?: DerivedDocumentValidationStatus;
  expiryDate?: string;
  isPublicationBlocker?: boolean;
}

export interface DocumentStateInvariantResult {
  isValid: boolean;
  violations: string[];
}

/**
 * Enforces authoritative status invariants across the document lifecycle.
 * Prevents contradictory states such as:
 * - MISSING + APPROVED
 * - EXPIRED + APPROVED / publication ready
 * - INVALID + APPROVED
 * - Automated VALID equating to final approval
 */
export function validateDocumentStateInvariants(
  doc: DocumentStateInvariantInput
): DocumentStateInvariantResult {
  const violations: string[] = [];
  const hasFile = isValidUploadedDocument(doc.fileUrl, doc.fileName);

  // Invariant 1: An unuploaded / missing document cannot be approved
  if (!hasFile && doc.adminDecision === 'approved') {
    violations.push(`Document ${doc.documentId} is MISSING and cannot be marked APPROVED.`);
  }

  // Invariant 2: An expired certificate cannot be approved for publication
  if (doc.derivedStatus === 'EXPIRED' && doc.adminDecision === 'approved') {
    violations.push(`Document ${doc.documentId} is EXPIRED and cannot be APPROVED without a renewed filing or official extension order.`);
  }

  // Invariant 3: An explicitly mismatched or invalid document cannot be approved
  if (doc.derivedStatus === 'INVALID' && doc.adminDecision === 'approved') {
    violations.push(`Document ${doc.documentId} has severe comparison MISMATCH / INVALID status and cannot be APPROVED.`);
  }

  // Invariant 4: Expired documents must remain publication blockers
  if (doc.derivedStatus === 'EXPIRED' && doc.isPublicationBlocker === false) {
    violations.push(`Document ${doc.documentId} is EXPIRED but not marked as a publication blocker.`);
  }

  return {
    isValid: violations.length === 0,
    violations,
  };
}

// ─── 9. DOCUMENT VERSION HISTORY & AUDIT TRAIL ──────────────────────────────

/**
 * Extracts and filters all change requests, revision notes, and audit history
 * associated with a specific document/certificate asset.
 */
export function getDocumentChangeRequestHistory(
  assetId: string,
  changeRequests: SchoolIntakeChangeRequest[] = []
): SchoolIntakeChangeRequest[] {
  if (!assetId || !Array.isArray(changeRequests)) return [];

  return changeRequests
    .filter(
      (cr) =>
        cr.asset_id === assetId ||
        cr.field_key === assetId ||
        (cr.section_key === 'media' && cr.field_key === assetId) ||
        (cr.section_key === 'assetChecklist' && cr.field_key === assetId)
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

