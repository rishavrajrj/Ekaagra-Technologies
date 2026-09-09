/**
 * ==============================================================================
 * SECTION 7: ADMISSIONS, FEES & SCHEDULE VERIFICATION SUITE
 * Test Suite: scripts/test-section7-admissions.ts
 * ==============================================================================
 * 
 * Verifies all 32 acceptance criteria:
 * 1. Existing Section 7 data loads.
 * 2. Admission session persists.
 * 3. Admission status persists.
 * 4. Admission contact persists.
 * 5. Contact validation works.
 * 6. Application options persist.
 * 7. Class availability is derived correctly.
 * 8. Class availability statuses persist.
 * 9. Duplicate classes are prevented.
 * 10. Eligibility data persists.
 * 11. Admission process ordering works.
 * 12. Process enable/disable works.
 * 13. Custom process steps persist.
 * 14. Documents persist.
 * 15. Required/optional document status works.
 * 16. Fees persist.
 * 17. Fee amount validation works.
 * 18. Fee frequency persists.
 * 19. Class-specific fees persist.
 * 20. Important dates persist.
 * 21. Date validation works.
 * 22. Online application conditional fields work.
 * 23. Document upload conditional fields work.
 * 24. Application fee conditional validation works.
 * 25. Existing legacy fee data migrates correctly.
 * 26. Existing legacy eligibility data is preserved.
 * 27. Existing drafts remain backward compatible.
 * 28. Completeness calculation works.
 * 29. Missing required information is detected.
 * 30. Optional fields do not incorrectly reduce completion.
 * 31. No unsupported facts are generated.
 * 32. Tenant isolation is preserved.
 */

import assert from 'assert';
import {
  calculateIntakeCompleteness,
  createInitialIntakeData,
} from '../src/lib/schoolIntake';
import {
  normalizeAdmissionsData,
  validateAdmissions,
  getAdmissionsWebsiteOutput,
  formatVisitingHours,
} from '../src/lib/admissionsUtils';
import type {
  AdmissionsData,
  UniversalIntakeData,
  AdmissionStatus,
  ClassAdmissionStatus,
} from '../src/lib/types';

let totalTests = 0;
let passedTests = 0;

function runTest(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${name}`);
  } catch (err: any) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
    throw err;
  }
}

async function main() {
  console.log('================================================================');
  console.log('  SECTION 7: ADMISSIONS, FEES & SCHEDULE VERIFICATION SUITE');
  console.log('================================================================\n');

  // ----------------------------------------------------------------------------
  // GROUP 1: CYCLE, CONTACT & APPLICATION OPTIONS PERSISTENCE
  // ----------------------------------------------------------------------------
  console.log('Group 1: Cycle, Contact & Application Options');

  runTest('1. Existing Section 7 data loads without error or data loss', () => {
    const legacyDraft: Partial<AdmissionsData> = {
      targetSessions: '2026–2027',
      contactPerson: 'Mr. Arvind Saxena',
      admissionPhone: '+91 98765 43210',
      admissionEmail: 'admissions@school.edu.in',
      admissionsOpen: true,
      onlineApplicationEnabled: true,
    };

    const normalized = normalizeAdmissionsData(legacyDraft);
    assert.strictEqual(normalized.session, '2026–2027');
    assert.strictEqual(normalized.contact?.name, 'Mr. Arvind Saxena');
    assert.strictEqual(normalized.contact?.phone, '+91 98765 43210');
    assert.strictEqual(normalized.contact?.email, 'admissions@school.edu.in');
    assert.strictEqual(normalized.applicationOptions?.admissionsOpen, true);
    assert.strictEqual(normalized.applicationOptions?.onlineApplication, true);
  });

  runTest('2. Admission session persists exactly as entered', () => {
    const customSession = '2027–2028 (Special Spring Intake)';
    const normalized = normalizeAdmissionsData({ session: customSession });
    assert.strictEqual(normalized.session, customSession);
    assert.strictEqual(normalized.targetSessions, customSession);
  });

  runTest('3. Admission status persists all allowed enum values', () => {
    const statuses: AdmissionStatus[] = ['open', 'upcoming', 'closed', 'waitlist', 'not_accepting'];
    statuses.forEach((st) => {
      const normalized = normalizeAdmissionsData({ status: st });
      assert.strictEqual(normalized.status, st);
    });
  });

  runTest('4. Admission contact persists all fields including visiting hours & preferred method', () => {
    const contactData = {
      name: 'Dr. Meenakshi Roy',
      phone: '+91 91234 56789',
      email: 'admissions@dps.edu.in',
      whatsapp: '+91 91234 56780',
      visitingHours: '09:00 AM – 01:00 PM (Mon–Fri)',
      preferredMethod: 'whatsapp' as const,
      address: 'Main Administrative Block, Room 104',
    };
    const normalized = normalizeAdmissionsData({ contact: contactData });
    assert.deepStrictEqual(normalized.contact, contactData);
    assert.strictEqual(normalized.contactPerson, 'Dr. Meenakshi Roy');
    assert.strictEqual(normalized.admissionPhone, '+91 91234 56789');
    assert.strictEqual(normalized.admissionEmail, 'admissions@dps.edu.in');
  });

  runTest('5. Contact validation requires name and at least one contact channel', () => {
    // Missing contact person & channels
    const emptyRes = validateAdmissions({ session: '2026-2027' } as AdmissionsData);
    assert.strictEqual(emptyRes.isValid, false);
    assert(emptyRes.errors.some((e) => e.includes('Admission In-Charge Name')));
    assert(emptyRes.errors.some((e) => e.includes('contact method')));

    // Has contact person and phone -> passes
    const validRes = validateAdmissions({
      session: '2026-2027',
      contact: { name: 'Mrs. Sharma', phone: '+91 98765 43210' },
    } as AdmissionsData);
    assert.strictEqual(validRes.isValid, true);
  });

  runTest('6. Application options persist independently without cross-coupling', () => {
    const opts = {
      admissionsOpen: false,
      onlineApplication: true,
      documentUpload: true,
      walkInApplication: true,
      enquiryEnabled: true,
      callbackEnabled: false,
      applicationFeeRequired: true,
    };
    const normalized = normalizeAdmissionsData({ applicationOptions: opts });
    assert.deepStrictEqual(normalized.applicationOptions, opts);
    // Admissions Open being false does NOT alter session
    assert.strictEqual(normalized.admissionsOpen, false);
  });

  // ----------------------------------------------------------------------------
  // GROUP 2: CANONICAL CLASS REUSE & AVAILABILITY
  // ----------------------------------------------------------------------------
  console.log('\nGroup 2: Class-Wise Admission Availability');

  runTest('7. Class availability is derived from canonical school classes when empty', () => {
    const canonicalClasses = [
      { id: 'cls-1', name: 'Nursery', sortOrder: 1, sections: ['A'] },
      { id: 'cls-2', name: 'LKG', sortOrder: 2, sections: ['A'] },
      { id: 'cls-3', name: 'Class 1', sortOrder: 3, sections: ['A', 'B'] },
    ];
    const normalized = normalizeAdmissionsData(
      { classAvailability: [] },
      { classes: canonicalClasses }
    );
    assert.strictEqual(normalized.classAvailability?.length, 3);
    assert.strictEqual(normalized.classAvailability[0].className, 'Nursery');
    assert.strictEqual(normalized.classAvailability[1].className, 'LKG');
    assert.strictEqual(normalized.classAvailability[2].className, 'Class 1');
  });

  runTest('8. Class availability statuses (Open, Closed, Waitlist, Enquiry, Not Offered) persist', () => {
    const items = [
      { id: '1', className: 'Nursery', status: 'open' as ClassAdmissionStatus },
      { id: '2', className: 'LKG', status: 'closed' as ClassAdmissionStatus },
      { id: '3', className: 'UKG', status: 'waitlist' as ClassAdmissionStatus, availableSeats: 5 },
      { id: '4', className: 'Class 1', status: 'enquiry_only' as ClassAdmissionStatus },
      { id: '5', className: 'Class 12', status: 'not_offered' as ClassAdmissionStatus },
    ];
    const normalized = normalizeAdmissionsData({ classAvailability: items });
    assert.strictEqual(normalized.classAvailability?.length, 5);
    assert.strictEqual(normalized.classAvailability[2].status, 'waitlist');
    assert.strictEqual(normalized.classAvailability[2].availableSeats, 5);
  });

  runTest('9. Duplicate classes in availability are detected by validation', () => {
    const duplicateData = {
      session: '2026-2027',
      contact: { name: 'Incharge', phone: '123' },
      classAvailability: [
        { id: '1', className: 'Class 1', status: 'open' as ClassAdmissionStatus },
        { id: '2', className: 'Class 1', status: 'closed' as ClassAdmissionStatus },
      ],
    };
    const val = validateAdmissions(duplicateData as AdmissionsData);
    assert.strictEqual(val.isValid, false);
    assert(val.errors.some((e) => e.includes('Duplicate class')));
  });

  // ----------------------------------------------------------------------------
  // GROUP 3: ELIGIBILITY & ADMISSION PROCESS
  // ----------------------------------------------------------------------------
  console.log('\nGroup 3: Eligibility & Admission Process');

  runTest('10. Structured eligibility fields persist correctly', () => {
    const eligibility = {
      applicableClasses: ['Nursery', 'LKG'],
      minimumAge: '3+ Years',
      maximumAge: '4.5 Years',
      ageCutoffDate: 'As of March 31, 2026',
      entranceAssessment: true,
      interviewRequired: false,
      previousAcademicRequirement: 'Valid birth certificate from municipal corporation',
      notes: 'Sibling priority applicable during first round of seat allocation.',
    };
    const normalized = normalizeAdmissionsData({ eligibility });
    assert.deepStrictEqual(normalized.eligibility, eligibility);
    assert.strictEqual(normalized.minAgeCriteria, '3+ Years');
    assert.strictEqual(normalized.entranceTestRequired, true);
  });

  runTest('11. Admission process preserves exact numeric ordering', () => {
    const customProcess = [
      { id: 'step-app', label: 'Submit Online Form', enabled: true, order: 1 },
      { id: 'step-doc', label: 'Document Scrutiny', enabled: true, order: 2 },
      { id: 'step-pay', label: 'Fee Payment', enabled: true, order: 3 },
    ];
    const normalized = normalizeAdmissionsData({ process: customProcess });
    assert.strictEqual(normalized.process?.[0].label, 'Submit Online Form');
    assert.strictEqual(normalized.process?.[1].label, 'Document Scrutiny');
    assert.strictEqual(normalized.process?.[2].label, 'Fee Payment');
  });

  runTest('12. Process enable/disable toggling filters website generator output', () => {
    const process = [
      { id: '1', label: 'Enquiry', enabled: true, order: 1 },
      { id: '2', label: 'Aptitude Test', enabled: false, order: 2 },
      { id: '3', label: 'Admission Offer', enabled: true, order: 3 },
    ];
    const output = getAdmissionsWebsiteOutput({ process } as AdmissionsData);
    assert.strictEqual(output.process.length, 2);
    assert.strictEqual(output.process[0].label, 'Enquiry');
    assert.strictEqual(output.process[1].label, 'Admission Offer');
  });

  runTest('13. Custom process steps persist with unique stable IDs', () => {
    const customSteps = [
      { id: 'custom-campus-tour', label: 'Guided Campus Tour', enabled: true, order: 1 },
      { id: 'custom-counseling', label: 'Career Counseling', enabled: true, order: 2 },
    ];
    const normalized = normalizeAdmissionsData({ process: customSteps });
    assert.strictEqual(normalized.process?.length, 2);
    assert.strictEqual(normalized.process[0].id, 'custom-campus-tour');
  });

  // ----------------------------------------------------------------------------
  // GROUP 4: DOCUMENTS & DYNAMIC FEES
  // ----------------------------------------------------------------------------
  console.log('\nGroup 4: Required Documents & Dynamic Fee Slabs');

  runTest('14. Documents persist with standard and custom definitions', () => {
    const docs = [
      { id: 'doc-birth', name: 'Birth Certificate', requirement: 'required' as const },
      { id: 'doc-tc', name: 'Transfer Certificate', requirement: 'optional' as const },
      { id: 'doc-c-1', name: 'Other', requirement: 'required' as const, customName: 'Parent Domicile Certificate' },
    ];
    const normalized = normalizeAdmissionsData({ documents: docs });
    assert.strictEqual(normalized.documents?.length, 3);
    assert.strictEqual(normalized.documents[2].customName, 'Parent Domicile Certificate');
  });

  runTest('15. Required vs Optional document statuses separate cleanly in website output', () => {
    const docs = [
      { id: '1', name: 'Birth Certificate', requirement: 'required' as const },
      { id: '2', name: 'Student Photo', requirement: 'required' as const },
      { id: '3', name: 'Medical Certificate', requirement: 'optional' as const },
      { id: '4', name: 'Caste Certificate', requirement: 'not_requested' as const },
    ];
    const output = getAdmissionsWebsiteOutput({ documents: docs } as AdmissionsData);
    assert.deepStrictEqual(output.requiredDocuments, ['Birth Certificate', 'Student Photo']);
    assert.deepStrictEqual(output.optionalDocuments, ['Medical Certificate']);
  });

  runTest('16. Dynamic fee table persists multiple fee heads', () => {
    const fees = [
      { id: 'f-1', name: 'Registration Fee', amount: 500, currency: 'INR', frequency: 'one_time' as const },
      { id: 'f-2', name: 'Admission Fee', amount: 15000, currency: 'INR', frequency: 'one_time' as const },
      { id: 'f-3', name: 'Monthly Tuition Fee', amount: 2500, currency: 'INR', frequency: 'monthly' as const },
    ];
    const normalized = normalizeAdmissionsData({ fees });
    assert.strictEqual(normalized.fees?.length, 3);
    assert.strictEqual(normalized.fees[1].amount, 15000);
  });

  runTest('17. Fee amount validation rejects negative values', () => {
    const invalidFeeData = {
      session: '2026-2027',
      contact: { name: 'Admin', phone: '123' },
      fees: [{ id: 'f-1', name: 'Caution Deposit', amount: -500, currency: 'INR' }],
    };
    const val = validateAdmissions(invalidFeeData as AdmissionsData);
    assert.strictEqual(val.isValid, false);
    assert(val.errors.some((e) => e.includes('cannot be negative')));
  });

  runTest('18. Fee frequency options persist (One-time, Monthly, Quarterly, Annual, etc.)', () => {
    const frequencies = ['one_time', 'monthly', 'quarterly', 'half_yearly', 'annual', 'per_term', 'per_session'] as const;
    frequencies.forEach((freq, idx) => {
      const normalized = normalizeAdmissionsData({
        fees: [{ id: `f-${idx}`, name: `Fee ${idx}`, frequency: freq }],
      });
      assert.strictEqual(normalized.fees?.[0].frequency, freq);
    });
  });

  runTest('19. Class-specific fees persist applicable class mappings', () => {
    const fees = [
      { id: 'f-1', name: 'Science Lab Fee', amount: 1200, applicableClasses: ['Class 9', 'Class 10', 'Class 11'] },
      { id: 'f-2', name: 'Activity Kit Fee', amount: 800, applicableClasses: ['Nursery', 'LKG', 'UKG'] },
    ];
    const normalized = normalizeAdmissionsData({ fees });
    assert.deepStrictEqual(normalized.fees?.[0].applicableClasses, ['Class 9', 'Class 10', 'Class 11']);
  });

  // ----------------------------------------------------------------------------
  // GROUP 5: DATES & CONDITIONAL LOGIC
  // ----------------------------------------------------------------------------
  console.log('\nGroup 5: Important Dates & Conditional Field Behavior');

  runTest('20. Important admission dates persist event schedules', () => {
    const dates = [
      { id: 'd-1', eventName: 'Application Opens', startDate: '2026-10-01', endDate: '2026-10-15', description: 'Phase 1' },
      { id: 'd-2', eventName: 'Entrance Assessment', startDate: '2026-11-05', description: 'Written test for Grade 6+' },
    ];
    const normalized = normalizeAdmissionsData({ importantDates: dates });
    assert.strictEqual(normalized.importantDates?.length, 2);
    assert.strictEqual(normalized.importantDates[0].eventName, 'Application Opens');
  });

  runTest('21. Date validation flags when end date precedes start date', () => {
    const invalidDateData = {
      session: '2026-2027',
      contact: { name: 'Admin', phone: '123' },
      applicationStartDate: '2026-12-15',
      applicationEndDate: '2026-12-01',
    };
    const val = validateAdmissions(invalidDateData as AdmissionsData);
    assert.strictEqual(val.isValid, false);
    assert(val.errors.some((e) => e.includes('end date cannot precede start date')));
  });

  runTest('22. Online application conditional fields require application method', () => {
    const dataWithOnlineApp: AdmissionsData = {
      session: '2026-2027',
      contact: { name: 'Admin', phone: '123' },
      applicationOptions: { onlineApplication: true },
      application: { method: '' },
    };
    const val = validateAdmissions(dataWithOnlineApp);
    assert.strictEqual(val.isValid, false);
    assert(val.errors.some((e) => e.includes('Application method must be selected')));
  });

  runTest('23. Document upload conditional fields require document checklist', () => {
    const dataWithDocUpload: AdmissionsData = {
      session: '2026-2027',
      contact: { name: 'Admin', phone: '123' },
      applicationOptions: { documentUpload: true },
      documents: [{ id: '1', name: 'Birth Cert', requirement: 'not_requested' }],
    };
    const val = validateAdmissions(dataWithDocUpload);
    assert.strictEqual(val.isValid, false);
    assert(val.errors.some((e) => e.includes('marked Required or Optional')));
  });

  runTest('24. Application fee conditional validation requires at least one fee entry', () => {
    const dataWithFeeReq: AdmissionsData = {
      session: '2026-2027',
      contact: { name: 'Admin', phone: '123' },
      applicationOptions: { applicationFeeRequired: true },
      fees: [],
    };
    const val = validateAdmissions(dataWithFeeReq);
    assert.strictEqual(val.isValid, false);
    assert(val.errors.some((e) => e.includes('application or registration fee must be entered')));
  });

  // ----------------------------------------------------------------------------
  // GROUP 6: BACKWARD COMPATIBILITY & MIGRATION
  // ----------------------------------------------------------------------------
  console.log('\nGroup 6: Backward Compatibility & Migration');

  runTest('25. Existing legacy fee data (applicationFee, admissionFee) migrates into fees array', () => {
    const legacyDraft = {
      applicationFee: 750,
      admissionFee: 12000,
      registrationFee: 1500,
    };
    const normalized = normalizeAdmissionsData(legacyDraft);
    assert.strictEqual(normalized.fees?.length, 3);
    assert.strictEqual(normalized.fees[0].amount, 750);
    assert.strictEqual(normalized.fees[1].amount, 12000);
    assert.strictEqual(normalized.fees[2].amount, 1500);
  });

  runTest('26. Existing legacy eligibility text is preserved in eligibility.notes', () => {
    const legacyCriteria = 'Minimum 3 years age for nursery; pass in entrance interview for high school.';
    const normalized = normalizeAdmissionsData({ eligibilityCriteria: legacyCriteria });
    assert.strictEqual(normalized.eligibility?.notes, legacyCriteria);
    assert.strictEqual(normalized.eligibilityCriteria, legacyCriteria);
  });

  runTest('27. Existing drafts remain backward compatible with legacy mirror getters', () => {
    const structuredData: AdmissionsData = {
      session: '2026-2027',
      contact: { name: 'Mrs. Verma', phone: '9876543210', email: 'admissions@test.edu' },
      applicationOptions: { admissionsOpen: true, onlineApplication: true },
      classAvailability: [{ id: '1', className: 'Nursery', status: 'open' }],
    };
    const normalized = normalizeAdmissionsData(structuredData);
    assert.strictEqual(normalized.targetSessions, '2026-2027');
    assert.strictEqual(normalized.contactPerson, 'Mrs. Verma');
    assert.strictEqual(normalized.admissionPhone, '9876543210');
    assert.strictEqual(normalized.admissionEmail, 'admissions@test.edu');
    assert.strictEqual(normalized.admissionsOpen, true);
    assert.deepStrictEqual(normalized.classesOpenForAdmission, ['Nursery']);
  });

  // ----------------------------------------------------------------------------
  // GROUP 7: COMPLETENESS & TENANT SAFETY
  // ----------------------------------------------------------------------------
  console.log('\nGroup 7: Intake Completeness Calculation & Tenant Safety');

  runTest('28. Completeness calculation awards 100% when all required fields are provided', () => {
    const intake: Partial<UniversalIntakeData> = {
      admissions: {
        session: '2026-2027',
        contact: {
          name: 'Mr. Arvind',
          phone: '+91 98765 43210',
        },
        applicationOptions: {
          admissionsOpen: false,
          onlineApplication: false,
          documentUpload: false,
          applicationFeeRequired: false,
        },
      },
    };
    const score = calculateIntakeCompleteness('school-website', intake);
    assert.strictEqual(score.sectionPercentages['admissions'], 100);
    assert(!score.missingFields.some((f) => f.startsWith('Admissions:')));
  });

  runTest('29. Missing required information (session, contact name, contact channel) is detected', () => {
    const intake: Partial<UniversalIntakeData> = {
      admissions: {
        session: '',
        contact: { name: '', phone: '', email: '' },
      },
    };
    const score = calculateIntakeCompleteness('school-website', intake);
    assert.strictEqual(score.sectionPercentages['admissions'], 0);
    assert(score.missingFields.some((f) => f.includes('Admissions: Target Admission Session')));
    assert(score.missingFields.some((f) => f.includes('Admissions: Admission In-Charge Name')));
    assert(score.missingFields.some((f) => f.includes('Admissions: Primary admissions contact method')));
  });

  runTest('30. Optional fields (age criteria, dates, entrance test) do not reduce completion percentage', () => {
    const intake: Partial<UniversalIntakeData> = {
      admissions: {
        session: '2026-2027',
        contact: {
          name: 'Mrs. Shanti',
          phone: '+91 99999 88888',
        },
        // All optional criteria omitted
        eligibility: {},
        importantDates: [],
      },
    };
    const score = calculateIntakeCompleteness('school-website', intake);
    assert.strictEqual(score.sectionPercentages['admissions'], 100);
  });

  runTest('31. No unsupported or fabricated facts are generated during initialization', () => {
    const initial = createInitialIntakeData({
      schoolName: 'Greenwood High School',
      contactName: 'Principal Rao',
      contactEmail: 'rao@greenwood.edu',
      contactPhone: '9876543210',
    });
    const adm = initial.admissions!;
    // Must NOT fabricate fee numbers
    assert.strictEqual(adm.applicationFee, undefined);
    assert.strictEqual(adm.admissionFee, undefined);
    assert.strictEqual(adm.registrationFee, undefined);
    // Must NOT invent age criteria
    assert.strictEqual(adm.eligibility?.minimumAge, '');
    assert.strictEqual(adm.eligibility?.notes, '');
    // Must NOT invent dates
    assert.strictEqual(adm.applicationStartDate, '');
    assert.strictEqual(adm.applicationEndDate, '');
    // Admissions Open must not be defaulted to true blindly
    assert.strictEqual(adm.applicationOptions?.admissionsOpen, false);
  });

  runTest('32. Tenant isolation is preserved across distinct school intake payloads', () => {
    const school1Intake: Partial<UniversalIntakeData> = {
      schoolProfile: { schoolName: 'Alpha Academy' } as any,
      admissions: {
        session: '2026-2027',
        contact: { name: 'Alpha Head', phone: '11111' },
      },
    };
    const school2Intake: Partial<UniversalIntakeData> = {
      schoolProfile: { schoolName: 'Beta World School' } as any,
      admissions: {
        session: '2028-2029',
        contact: { name: 'Beta Head', phone: '22222' },
      },
    };

    const norm1 = normalizeAdmissionsData(school1Intake.admissions);
    const norm2 = normalizeAdmissionsData(school2Intake.admissions);

    assert.notStrictEqual(norm1.session, norm2.session);
    assert.notStrictEqual(norm1.contact?.name, norm2.contact?.name);
    assert.strictEqual(norm1.contact?.name, 'Alpha Head');
    assert.strictEqual(norm2.contact?.name, 'Beta Head');
  });

  runTest('33. Visiting hours auto-formatter normalizes cramped and unstructured time formats', () => {
    // Exact input from user screenshot
    assert.strictEqual(
      formatVisitingHours('09:00AM-12:30PM(MON-SAT)'),
      '09:00 AM – 12:30 PM (Mon–Sat)'
    );

    // Common variations
    assert.strictEqual(
      formatVisitingHours('9:00am - 12:30pm (mon-sat)'),
      '09:00 AM – 12:30 PM (Mon–Sat)'
    );
    assert.strictEqual(
      formatVisitingHours('9am to 1pm'),
      '09:00 AM – 01:00 PM'
    );
    assert.strictEqual(
      formatVisitingHours('08:30AM-01:30PM(MON-FRI)'),
      '08:30 AM – 01:30 PM (Mon–Fri)'
    );
  });

  console.log('\n================================================================');
  console.log(`  ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log('================================================================');
}

main().catch((err) => {
  console.error('\nTest runner encountered an unhandled exception:', err);
  process.exit(1);
});
