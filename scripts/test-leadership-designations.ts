import assert from 'assert';
import {
  PRINCIPAL_DESIGNATIONS,
  TRUSTEE_DESIGNATIONS,
  DESIGNATION_OTHER,
  resolveDesignationDisplay,
  isPredefinedDesignation,
  createInitialIntakeData,
  calculateIntakeCompleteness,
} from '../src/lib/schoolIntake';

console.log('================================================================');
console.log('  TESTING MANAGEMENT & LEADERSHIP OFFICIAL DESIGNATIONS');
console.log('================================================================\n');

// 1. Verify PRINCIPAL_DESIGNATIONS list
console.log('1. Verifying PRINCIPAL_DESIGNATIONS option list...');
const expectedPrincipalOptions = [
  'Principal',
  'Headmaster',
  'Headmistress',
  'Director',
  'Managing Director',
  'Chairman',
  'Chairperson',
  'Secretary',
  'Administrator',
  'Academic Director',
  'Executive Director',
  'Vice Principal',
  'Head of School',
  'Head of Institution',
  'Other',
];
expectedPrincipalOptions.forEach((opt) => {
  assert(
    PRINCIPAL_DESIGNATIONS.includes(opt as any),
    `PRINCIPAL_DESIGNATIONS must contain "${opt}"`
  );
});
assert.strictEqual(PRINCIPAL_DESIGNATIONS.length, expectedPrincipalOptions.length, 'Exact count of Principal designations');
console.log('  ✓ PRINCIPAL_DESIGNATIONS matches required options list.');

// 2. Verify TRUSTEE_DESIGNATIONS list
console.log('\n2. Verifying TRUSTEE_DESIGNATIONS option list...');
const expectedTrusteeOptions = [
  'Trustee',
  'Chairman',
  'Chairperson',
  'Vice Chairman',
  'Secretary',
  'Treasurer',
  'Director',
  'Managing Director',
  'Management Committee Head',
  'Management Committee Member',
  'Governing Body Member',
  'Administrator',
  'Academic Director',
  'Executive Director',
  'Other',
];
expectedTrusteeOptions.forEach((opt) => {
  assert(
    TRUSTEE_DESIGNATIONS.includes(opt as any),
    `TRUSTEE_DESIGNATIONS must contain "${opt}"`
  );
});
assert.strictEqual(TRUSTEE_DESIGNATIONS.length, expectedTrusteeOptions.length, 'Exact count of Trustee designations');
console.log('  ✓ TRUSTEE_DESIGNATIONS matches required options list.');

// 3. Verify isPredefinedDesignation helper
console.log('\n3. Verifying isPredefinedDesignation helper...');
assert(isPredefinedDesignation('Principal', PRINCIPAL_DESIGNATIONS), 'Principal is predefined');
assert(isPredefinedDesignation('principal', PRINCIPAL_DESIGNATIONS), 'Case-insensitive match for Principal');
assert(isPredefinedDesignation('Headmaster', PRINCIPAL_DESIGNATIONS), 'Headmaster is predefined');
assert(!isPredefinedDesignation('Other', PRINCIPAL_DESIGNATIONS), 'Other is never considered a predefined selection');
assert(!isPredefinedDesignation('other', PRINCIPAL_DESIGNATIONS), 'other lowercase is not predefined selection');
assert(!isPredefinedDesignation('Founder & Managing Trustee', PRINCIPAL_DESIGNATIONS), 'Custom designation is not predefined');
assert(!isPredefinedDesignation('', PRINCIPAL_DESIGNATIONS), 'Empty string is not predefined');
console.log('  ✓ isPredefinedDesignation behaves correctly.');

// 4. Verify resolveDesignationDisplay helper
console.log('\n4. Verifying resolveDesignationDisplay helper...');
assert.strictEqual(resolveDesignationDisplay('Principal'), 'Principal', 'Predefined returns actual title');
assert.strictEqual(resolveDesignationDisplay('Founder & Managing Trustee'), 'Founder & Managing Trustee', 'Custom returns custom title');
assert.strictEqual(resolveDesignationDisplay('  Chairman  '), 'Chairman', 'Trims whitespace');
assert.strictEqual(resolveDesignationDisplay('Other'), '', 'Literal Other returns empty string');
assert.strictEqual(resolveDesignationDisplay('other'), '', 'Literal other returns empty string');
assert.strictEqual(resolveDesignationDisplay(''), '', 'Empty returns empty string');
assert.strictEqual(resolveDesignationDisplay(undefined), '', 'Undefined returns empty string');
assert.strictEqual(resolveDesignationDisplay(null), '', 'Null returns empty string');
console.log('  ✓ resolveDesignationDisplay guarantees literal "Other" is never output.');

// 5. Verify calculateIntakeCompleteness for Leadership
console.log('\n5. Verifying calculateIntakeCompleteness for Leadership...');
const baseIntake = createInitialIntakeData({
  schoolName: 'St. Xavier Public School',
  contactName: 'Fr. Thomas Varghese',
  contactEmail: 'contact@stxavier.edu',
  contactPhone: '9876543210',
  city: 'Motihari',
  state: 'Bihar',
});

// A. Predefined designation -> complete
const completeWithPredefined = calculateIntakeCompleteness('school-website', {
  ...baseIntake,
  leadership: {
    ...baseIntake.leadership!,
    principalName: 'Dr. A. Sharma',
    principalDesignation: 'Principal',
    principalMessage: 'Welcome to our esteemed institution.',
  },
});
assert.strictEqual(
  completeWithPredefined.missingFields.some((f) => f.includes('Principal Official Designation')),
  false,
  'Predefined designation must NOT be in missingFields'
);
assert.strictEqual(completeWithPredefined.sectionPercentages['leadership'], 100, 'Leadership 100% complete with predefined designation');
console.log('  ✓ A. Predefined designation -> complete (100%)');

// B. Other + valid custom designation -> complete
const completeWithCustom = calculateIntakeCompleteness('school-website', {
  ...baseIntake,
  leadership: {
    ...baseIntake.leadership!,
    principalName: 'Dr. A. Sharma',
    principalDesignation: 'Founder & Managing Trustee',
    principalMessage: 'Welcome to our esteemed institution.',
  },
});
assert.strictEqual(
  completeWithCustom.missingFields.some((f) => f.includes('Principal Official Designation')),
  false,
  'Custom designation must NOT be in missingFields'
);
assert.strictEqual(completeWithCustom.sectionPercentages['leadership'], 100, 'Leadership 100% complete with custom designation');
console.log('  ✓ B. Other + valid custom designation -> complete (100%)');

// C. Other + empty custom designation -> incomplete
const incompleteEmpty = calculateIntakeCompleteness('school-website', {
  ...baseIntake,
  leadership: {
    ...baseIntake.leadership!,
    principalName: 'Dr. A. Sharma',
    principalDesignation: '',
    principalMessage: 'Welcome to our esteemed institution.',
  },
});
assert(
  incompleteEmpty.missingFields.includes('Leadership: Principal Official Designation'),
  'Empty designation must produce "Leadership: Principal Official Designation" missing field'
);
assert(incompleteEmpty.sectionPercentages['leadership'] < 100, 'Empty designation results in < 100%');
console.log('  ✓ C. Other + empty custom designation -> incomplete');

// D. Literal "Other" designation -> incomplete
const incompleteLiteralOther = calculateIntakeCompleteness('school-website', {
  ...baseIntake,
  leadership: {
    ...baseIntake.leadership!,
    principalName: 'Dr. A. Sharma',
    principalDesignation: 'Other',
    principalMessage: 'Welcome to our esteemed institution.',
  },
});
assert(
  incompleteLiteralOther.missingFields.includes('Leadership: Principal Official Designation'),
  'Literal "Other" designation must be treated as incomplete'
);
console.log('  ✓ D. Literal "Other" designation -> incomplete');

// E. Trustee optional fields do NOT block completion
const withTrustee = calculateIntakeCompleteness('school-website', {
  ...baseIntake,
  leadership: {
    ...baseIntake.leadership!,
    principalName: 'Dr. A. Sharma',
    principalDesignation: 'Principal',
    principalMessage: 'Welcome to our esteemed institution.',
    managementMembers: [
      {
        id: 'mgmt-1',
        name: 'Mr. Rajesh Kumar',
        designation: 'Trustee',
        role: 'Trustee',
        email: '',
        phone: '',
        displayOnWebsite: true,
      },
    ],
  },
});
assert.strictEqual(
  withTrustee.sectionPercentages['leadership'],
  100,
  'Optional trustee fields do not break 100% leadership completeness'
);
console.log('  ✓ E. Optional trustee fields do not block leadership completion');

console.log('\n================================================================');
console.log('  ALL LEADERSHIP DESIGNATION TESTS PASSED SUCCESSFULLY! (100%)');
console.log('================================================================\n');
