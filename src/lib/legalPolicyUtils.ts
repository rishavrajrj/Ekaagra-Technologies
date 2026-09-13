import type {
  InstitutionalPolicyItem,
  InstitutionalPolicyStatus,
  LegalPolicyData,
  UniversalIntakeData,
  AssetChecklistItem,
  AssetChecklistStatus,
} from './types';

export const CANONICAL_POLICY_KEYS = [
  'privacy-policy',
  'terms-and-conditions',
  'fee-refund',
  'child-safety',
] as const;

export type CanonicalPolicyKey = typeof CANONICAL_POLICY_KEYS[number];

export interface PolicyMetadataDefinition {
  id: CanonicalPolicyKey;
  checklistId: string;
  title: string;
  shortTitle: string;
  description: string;
  intendedUse: string;
  isMandatory: boolean;
  requiresOfficialDocOrText: boolean;
}

export const CANONICAL_POLICY_METADATA: readonly PolicyMetadataDefinition[] = [
  {
    id: 'privacy-policy',
    checklistId: 'pol-privacy',
    title: 'Website & Student Data Privacy Policy',
    shortTitle: 'Privacy Policy',
    description:
      'Governs collection, storage, and protection of student records, parent contact details, and online admissions data under the DPDP Act.',
    intendedUse: 'Published on the mandatory /privacy-policy page in the public website footer.',
    isMandatory: true,
    requiresOfficialDocOrText: true,
  },
  {
    id: 'terms-and-conditions',
    checklistId: 'pol-terms',
    title: 'Terms of Website Usage & Portal Access',
    shortTitle: 'Terms & Conditions',
    description:
      'Standard terms governing acceptable user conduct, copyright of educational material, and online portal access rights.',
    intendedUse: 'Published on the mandatory /terms-and-conditions page in the public website footer.',
    isMandatory: true,
    requiresOfficialDocOrText: true,
  },
  {
    id: 'fee-refund',
    checklistId: 'pol-refund',
    title: 'Fee Refund & Cancellation Policy',
    shortTitle: 'Fee Refund Policy',
    description:
      'Transparent administrative rules on caution money return, withdrawal notice deadlines, and transport fee adjustments.',
    intendedUse: 'Linked on the fee payment gateway portal and admissions prospectus disclosure.',
    isMandatory: true,
    requiresOfficialDocOrText: true,
  },
  {
    id: 'child-safety',
    checklistId: 'pol-child-safety',
    title: 'Child Protection & Safeguarding Policy (POCSO)',
    shortTitle: 'Child Safeguarding',
    description:
      'Institutional safeguarding guidelines, Internal Complaints Committee (ICC) composition, and zero-tolerance safety compliance note.',
    intendedUse: 'Published under the Student Safety & Well-being portal section.',
    isMandatory: true,
    requiresOfficialDocOrText: true,
  },
] as const;

/**
 * Standard Ekaagra Educational Policy Templates with institution context interpolation.
 */
export function generateDefaultPolicyTemplate(
  policyKey: CanonicalPolicyKey,
  schoolName: string = 'Our Institution',
  contactEmail: string = 'contact@school.edu.in',
  officialPhone: string = '+91 98765 43210'
): string {
  const effectiveSchoolName = schoolName.trim() || 'Our Institution';
  const effectiveEmail = contactEmail.trim() || 'contact@school.edu.in';
  const effectivePhone = officialPhone.trim() || '+91 98765 43210';

  switch (policyKey) {
    case 'privacy-policy':
      return `# Website & Student Data Privacy Policy
**Institution:** ${effectiveSchoolName}
**Effective Date:** Current Academic Session

### 1. Introduction
${effectiveSchoolName} ("the School") is committed to protecting the privacy and personal information of its students, parents, guardians, faculty, and website visitors in accordance with the Digital Personal Data Protection (DPDP) Act and applicable educational regulatory guidelines.

### 2. Information Collected
We collect personal information strictly for legitimate educational, administrative, and safety purposes, including:
- **Student Admissions & Inquiries:** Student name, date of birth, prior academic records, parent/guardian contact details, and residential address.
- **Communication & Notifications:** Email addresses and mobile phone numbers for emergency alerts, circulars, and academic progress reports.
- **Digital Portal Access:** Secure login identifiers for the parent and student portals.

### 3. Usage of Personal Data
Collected data is used solely to:
- Process admission applications and facilitate classroom enrollment.
- Communicate administrative notices, fee dues, exam timetables, and academic circulars.
- Ensure student safety and campus operational security.
The School **never sells, rents, or commercializes** student or guardian information to third parties.

### 4. Data Security & Storage
Student records are maintained on secure, encrypted cloud infrastructure with role-based access control. Only authorized school staff have access to relevant records.

### 5. Contact the Data Protection Officer
For queries regarding student data or privacy rights, contact:
- **Email:** ${effectiveEmail}
- **Phone:** ${effectivePhone}`;

    case 'terms-and-conditions':
      return `# Terms of Website Usage & Portal Access
**Institution:** ${effectiveSchoolName}

### 1. Acceptance of Terms
By accessing or using the official digital website and parent/student portals of ${effectiveSchoolName}, you agree to abide by these Terms and Conditions.

### 2. Intellectual Property
All website content, including syllabi outlines, school crest, logos, newsletters, event photographs, and learning materials, is the intellectual property of ${effectiveSchoolName}. Unauthorized reproduction, redistribution, or commercial use is prohibited.

### 3. Student & Parent Portal Etiquette
Users assigned credentials to access fee payments, report cards, or attendance dashboards must:
- Maintain confidentiality of login credentials.
- Refrain from unauthorized access attempts, data scraping, or disruptive digital conduct.

### 4. Online Submissions & Inquiries
Information submitted through admission forms or query desks must be truthful and accurate. Misrepresentation of student credentials may invalidate applications.

### 5. Institutional Rights
${effectiveSchoolName} reserves the right to modify website specifications, curriculum highlights, or operational notices in keeping with statutory educational board guidelines.`;

    case 'fee-refund':
      return `# Fee Refund & Cancellation Policy
**Institution:** ${effectiveSchoolName}

### 1. Purpose & Scope
This policy governs the transparent processing of fee payments, withdrawals, and caution money refunds at ${effectiveSchoolName}.

### 2. Admission & Registration Charges
- Prospective registration and processing fees submitted with admission inquiries are non-refundable once the application assessment commences.
- Admission fees deposited upon seat confirmation are non-refundable after the admission deadline as seats are reserved exclusively.

### 3. Tuition Fee Withdrawals
- **Before Academic Session Commencement:** Written withdrawal notices submitted at least 15 days prior to the first day of session shall receive a pro-rata tuition fee refund, minus administrative handling charges.
- **During the Academic Session:** Tuition fees for the ongoing academic term/quarter are non-refundable once the term has commenced.

### 4. Security Deposit / Caution Money
Refundable caution deposits or laboratory security money deposited during admission will be refunded in full via bank transfer upon student transfer/withdrawal, subject to standard clearance (library books returned, lab equipment accounted for).

### 5. Transport & Meal Fee Adjustments
Transport and optional dining fees are assessed per term. Requests for route discontinuation require one full calendar month's written notice.`;

    case 'child-safety':
      return `# Child Protection & Safeguarding Policy (POCSO)
**Institution:** ${effectiveSchoolName}

### 1. Commitment to Student Well-Being
${effectiveSchoolName} maintains a zero-tolerance policy against any form of child abuse, harassment, neglect, or bullying. We are dedicated to creating a safe, nurturing, and emotionally supportive learning environment for every enrolled student.

### 2. Compliance with Statutory Safeguards
The School adheres strictly to the Protection of Children from Sexual Offences (POCSO) Act, the Juvenile Justice Act, and Board Affiliation By-Laws.

### 3. Internal Complaints Committee (ICC) & Safeguarding Cell
An institutional Child Safeguarding Committee operates on campus comprising:
- The Head of Institution / Principal (Chairperson)
- Senior Academic Coordinators
- Certified School Counselor / Child Psychologist
- Parent Representative and Legal Advisor

### 4. Reporting & Confidentiality
Any student, teacher, or parent may report safeguarding concerns in strict confidence. Designated grievance boxes and the school counselor desk provide safe, accessible reporting channels without fear of reprisal.

### 5. Staff Screening & Training
All teaching, administrative, transport, and support staff undergo rigorous background verification and regular sensitization workshops on child protection protocols.`;

    default:
      return `# Policy Document\n**Institution:** ${effectiveSchoolName}\n\nStandard institutional policy statement.`;
  }
}

/**
 * Initializes and normalizes Legal Policies data from canonical state,
 * pulling existing values from assetChecklist or prior edits without duplicate storage.
 */
export function initializeLegalPolicies(
  existingLegal?: Partial<LegalPolicyData>,
  intakeData?: Partial<UniversalIntakeData>
): LegalPolicyData {
  const schoolName =
    intakeData?.schoolProfile?.schoolName ||
    intakeData?.schoolProfile?.displayName ||
    'Our Institution';
  const contactEmail =
    intakeData?.schoolProfile?.officialEmail ||
    'contact@school.edu.in';
  const contactPhone =
    intakeData?.schoolProfile?.officialPhone ||
    '+91 98765 43210';

  const basePolicies = existingLegal?.policies ? { ...existingLegal.policies } : {};
  const checklistItems = intakeData?.assetChecklist?.items || [];

  for (const meta of CANONICAL_POLICY_METADATA) {
    const existingPolicy = basePolicies[meta.id];
    // Find if corresponding item exists in canonical checklist
    const checklistItem = checklistItems.find((ci) => ci.id === meta.checklistId);

    // Prefer uploaded official document from either policy record or checklist item
    const officialDocUrl =
      existingPolicy?.officialDocumentUrl ||
      checklistItem?.fileUrl;
    const officialDocName =
      existingPolicy?.officialDocumentName ||
      checklistItem?.fileName ||
      (officialDocUrl ? `${meta.shortTitle}.pdf` : undefined);
    const officialDocSize =
      existingPolicy?.officialDocumentSize ||
      checklistItem?.fileSize;
    const officialDocStorageKey =
      existingPolicy?.officialDocumentStorageKey ||
      checklistItem?.storageKey;

    // Prefer customized text, or fall back to checklist textContent, or template
    const textContent =
      existingPolicy?.textContent ||
      checklistItem?.textContent ||
      generateDefaultPolicyTemplate(meta.id, schoolName, contactEmail, contactPhone);

    // Determine canonical status
    let status: InstitutionalPolicyStatus = existingPolicy?.status || 'template';
    if (officialDocUrl) {
      status = 'document_uploaded';
    } else if (existingPolicy?.approvedAt) {
      status = 'approved';
    } else if (existingPolicy?.status === 'customized') {
      status = 'customized';
    } else if (checklistItem?.status === 'provided') {
      status = 'approved';
    }

    basePolicies[meta.id] = {
      id: meta.id,
      title: meta.title,
      shortTitle: meta.shortTitle,
      description: meta.description,
      status,
      textContent,
      officialDocumentUrl: officialDocUrl || undefined,
      officialDocumentName: officialDocName || undefined,
      officialDocumentSize: officialDocSize,
      officialDocumentStorageKey: officialDocStorageKey,
      lastEditedAt: existingPolicy?.lastEditedAt,
      approvedAt: existingPolicy?.approvedAt,
      approvedBy: existingPolicy?.approvedBy,
      source: 'Legal & Policies',
    };
  }

  return {
    privacyPolicyRequired: true,
    termsRequired: true,
    refundPolicyRequired: true,
    childSafetyPolicyRequired: true,
    mandatoryDisclosuresProvided: existingLegal?.mandatoryDisclosuresProvided ?? true,
    grievanceContact: existingLegal?.grievanceContact || contactEmail,
    ...existingLegal,
    policies: basePolicies,
  };
}

export interface LegalPoliciesCompletenessResult {
  total: number;
  readyCount: number;
  percentage: number;
  isComplete: boolean;
  policyStates: Record<
    CanonicalPolicyKey,
    {
      ready: boolean;
      status: InstitutionalPolicyStatus;
      label: string;
      hasText: boolean;
      hasDocument: boolean;
    }
  >;
}

/**
 * Accurately calculates Legal & Policies section completeness from canonical policy records.
 */
export function calculateLegalPoliciesCompleteness(
  legalData?: Partial<LegalPolicyData>
): LegalPoliciesCompletenessResult {
  const policies = legalData?.policies || {};
  let readyCount = 0;
  const policyStates = {} as LegalPoliciesCompletenessResult['policyStates'];

  for (const meta of CANONICAL_POLICY_METADATA) {
    const item = policies[meta.id];
    const hasDocument = Boolean(item?.officialDocumentUrl && item.officialDocumentUrl.trim().length > 0);
    const hasText = Boolean(item?.textContent && item.textContent.trim().length > 0);

    // A policy is considered ready if it is explicitly approved, has an uploaded official document, or customized text
    const isReady = Boolean(
      item &&
      (item.status === 'approved' ||
       item.status === 'document_uploaded' ||
       hasDocument ||
       (item.status === 'customized' && hasText))
    );

    if (isReady) {
      readyCount++;
    }

    policyStates[meta.id] = {
      ready: isReady,
      status: item?.status || 'template',
      label: meta.shortTitle,
      hasText,
      hasDocument,
    };
  }

  const total = CANONICAL_POLICY_METADATA.length;
  const percentage = Math.round((readyCount / total) * 100);

  return {
    total,
    readyCount,
    percentage,
    isComplete: readyCount === total,
    policyStates,
  };
}

/**
 * Synchronizes policy modifications seamlessly to assetChecklist canonical items,
 * preventing any duplicate record creation or out-of-sync states.
 */
export function syncPoliciesToAssetChecklist(
  legalData: LegalPolicyData,
  currentChecklistItems?: AssetChecklistItem[]
): AssetChecklistItem[] | undefined {
  if (!currentChecklistItems || !legalData.policies) return currentChecklistItems;

  const metaMap: Record<string, PolicyMetadataDefinition> = {};
  for (const m of CANONICAL_POLICY_METADATA) {
    metaMap[m.id] = m;
  }

  const updatedItems = currentChecklistItems.map((ci) => {
    // Check if this item maps to a canonical policy
    const matchedMeta = Object.values(metaMap).find((m) => m.checklistId === ci.id || m.checklistId === (ci as any).key);
    if (!matchedMeta) return ci;

    const policy = legalData.policies?.[matchedMeta.id];
    if (!policy) return ci;

    const hasDoc = Boolean(policy.officialDocumentUrl);
    const isReady = policy.status === 'approved' || policy.status === 'document_uploaded' || hasDoc;

    const newStatus: AssetChecklistStatus = isReady ? 'provided' : ci.status === 'provided' ? 'provided' : 'pending';

    return {
      ...ci,
      status: newStatus,
      textContent: policy.textContent || ci.textContent,
      fileUrl: policy.officialDocumentUrl || ci.fileUrl,
      fileName: policy.officialDocumentName || ci.fileName,
      fileSize: policy.officialDocumentSize || ci.fileSize,
      storageKey: policy.officialDocumentStorageKey || ci.storageKey,
    };
  });

  // Ensure all canonical policies exist in checklist
  for (const m of CANONICAL_POLICY_METADATA) {
    const exists = updatedItems.some((ci) => ci.id === m.checklistId || (ci as any).key === m.checklistId);
    if (!exists) {
      const policy = legalData.policies?.[m.id];
      const hasDoc = Boolean(policy?.officialDocumentUrl);
      const isReady = policy?.status === 'approved' || policy?.status === 'document_uploaded' || hasDoc;
      updatedItems.push({
        id: m.checklistId,
        key: m.checklistId,
        title: m.title,
        category: 'policies',
        status: isReady ? 'provided' : 'pending',
        textContent: policy?.textContent,
        fileUrl: policy?.officialDocumentUrl,
        fileName: policy?.officialDocumentName,
        fileSize: policy?.officialDocumentSize,
        storageKey: policy?.officialDocumentStorageKey,
      } as any);
    }
  }

  return updatedItems;
}
