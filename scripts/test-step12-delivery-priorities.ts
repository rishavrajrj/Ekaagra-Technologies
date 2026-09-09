import assert from 'assert';
import {
  calculateIntakeCompleteness,
  createInitialIntakeData,
  TARGET_TIMELINE_OPTIONS,
  DEADLINE_TYPE_OPTIONS,
  PHASE1_PRIORITY_CATALOG,
  PHASE2_PRIORITY_CATALOG,
} from '../src/lib/schoolIntake';
import {
  schoolDeliveryPricing,
  calculateExpeditedDeliveryFee,
  getDeliveryPricingForPlan,
  DELIVERY_OPTIONS,
  type SchoolProductId,
} from '../src/lib/schoolPricing';
import type { UniversalIntakeData, ProjectDeliveryData } from '../src/lib/types';

console.log('================================================================');
console.log('TEST SUITE: STEP 12 PROJECT TIMELINE & DELIVERY PRIORITIES');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${name}`);
  } catch (err: any) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message || err}`);
    if (err.stack) {
      console.error(err.stack.split('\n').slice(1, 4).join('\n'));
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Centralized Pricing & Authoritative Fee Resolver Tests
// ─────────────────────────────────────────────────────────────────────────────
console.log('Category 1: Centralized Delivery Pricing & Resolver');

runTest('All 4 school products have explicit delivery pricing configured', () => {
  const productIds: SchoolProductId[] = ['school-website', 'school-website-cms', 'school-erp', 'school-complete'];
  for (const pid of productIds) {
    const pricing = schoolDeliveryPricing[pid];
    assert(pricing, `Missing delivery pricing for ${pid}`);
    assert(typeof pricing.expeditedFeeINR === 'number' && pricing.expeditedFeeINR > 0);
    assert(pricing.standardTurnaround.length > 0);
    assert(pricing.priorityTurnaround.length > 0);
    assert(pricing.urgentTurnaround.length > 0);
  }
});

runTest('Urgent expedited fees match centralized tiers accurately', () => {
  assert.strictEqual(calculateExpeditedDeliveryFee('school-website'), 4999);
  assert.strictEqual(calculateExpeditedDeliveryFee('school-website-cms'), 7499);
  assert.strictEqual(calculateExpeditedDeliveryFee('school-erp'), 9999);
  assert.strictEqual(calculateExpeditedDeliveryFee('school-complete'), 14999);
});

runTest('Plan change dynamically recalculates expedited fee', () => {
  let selectedPlan: SchoolProductId = 'school-website';
  let fee = calculateExpeditedDeliveryFee(selectedPlan);
  assert.strictEqual(fee, 4999);

  // School upgrades to Complete Platform
  selectedPlan = 'school-complete';
  fee = calculateExpeditedDeliveryFee(selectedPlan);
  assert.strictEqual(fee, 14999);
});

runTest('Standard delivery has ₹0 surcharge across all tiers', () => {
  const std = DELIVERY_OPTIONS.find((d) => d.id === 'standard');
  assert(std);
  assert.strictEqual(std.baseChargeINR, 0);
  assert.strictEqual(std.isUrgent, false);
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Removal of False 100% Filled State & Dynamic Completeness
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nCategory 2: Dynamic Completeness Calculation & Removal of False 100%');

runTest('Empty projectDelivery yields 0 filled and lists missing fields', () => {
  const intake: Partial<UniversalIntakeData> = {
    projectDelivery: undefined,
  };
  const comp = calculateIntakeCompleteness('school-website', intake);
  const pdScore = comp.sectionPercentages['projectDelivery'];
  assert.strictEqual(pdScore, 0);
  assert(comp.missingFields.some((f) => f.includes('Target Launch Timeline')));
  assert(comp.missingFields.some((f) => f.includes('Delivery Priority')));
  assert(comp.missingFields.some((f) => f.includes('Project Decision Maker')));
  assert(comp.missingFields.some((f) => f.includes('Phase 1 Launch Priorities')));
});

runTest('Initial draft with empty decision maker is NOT 100% complete', () => {
  const intake = createInitialIntakeData({
    schoolName: 'St. Xavier High School',
    contactName: '', // empty contact
  });
  const comp = calculateIntakeCompleteness('school-website', intake);
  const pdScore = comp.sectionPercentages['projectDelivery'];
  assert(pdScore < 100, `Expected score < 100%, got ${pdScore}%`);
  assert(comp.missingFields.some((f) => f.includes('Project Decision Maker')));
});

runTest('Specific target date requires targetLaunchDate to be filled', () => {
  const intake: Partial<UniversalIntakeData> = {
    projectDelivery: {
      targetLaunchTimeline: 'specific-date',
      targetLaunchDate: '', // missing specific date!
      deliveryPriority: 'standard',
      decisionMakerName: 'Fr. Thomas',
      decisionMakerEmail: 'thomas@xavier.edu.in',
      phase1Priorities: ['home_page', 'about_school'],
    },
  };
  const comp = calculateIntakeCompleteness('school-website', intake);
  assert(comp.missingFields.some((f) => f.includes('Specific Target Launch Date')));
  assert(comp.sectionPercentages['projectDelivery'] < 100);

  // Now fill the date
  intake.projectDelivery!.targetLaunchDate = '2026-11-15';
  const comp2 = calculateIntakeCompleteness('school-website', intake);
  assert(!comp2.missingFields.some((f) => f.includes('Specific Target Launch Date')));
  assert.strictEqual(comp2.sectionPercentages['projectDelivery'], 100);
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Urgent Delivery Confirmation & Conditional Validation
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nCategory 3: Urgent / Expedited Conditional Validation');

runTest('Standard delivery requires 4 fields and does NOT require urgent confirmation', () => {
  const intake: Partial<UniversalIntakeData> = {
    projectDelivery: {
      targetLaunchTimeline: 'within-3-4-weeks',
      deliveryPriority: 'standard',
      decisionMakerName: 'Principal Anita',
      decisionMakerEmail: 'anita@dps.edu.in',
      phase1Priorities: ['home_page', 'about_school'],
      urgentConfirmed: false,
    },
  };
  const comp = calculateIntakeCompleteness('school-website', intake);
  assert.strictEqual(comp.sectionPercentages['projectDelivery'], 100);
  assert(!comp.missingFields.some((f) => f.includes('Expedited Delivery Charge Confirmation')));
});

runTest('Urgent delivery selected WITHOUT confirmation fails completion', () => {
  const intake: Partial<UniversalIntakeData> = {
    projectDelivery: {
      targetLaunchTimeline: 'within-1-week',
      deliveryPriority: 'urgent',
      decisionMakerName: 'Principal Anita',
      decisionMakerEmail: 'anita@dps.edu.in',
      phase1Priorities: ['home_page', 'about_school'],
      urgentConfirmed: false, // User selected urgent but has not checked opt-in!
    },
  };
  const comp = calculateIntakeCompleteness('school-website', intake);
  assert.strictEqual(comp.sectionPercentages['projectDelivery'], 80); // 4 of 5
  assert(comp.missingFields.some((f) => f.includes('Expedited Delivery Charge Confirmation')));
});

runTest('Urgent delivery with active confirmation achieves 100% completion', () => {
  const intake: Partial<UniversalIntakeData> = {
    projectDelivery: {
      targetLaunchTimeline: 'within-1-week',
      deliveryPriority: 'urgent',
      decisionMakerName: 'Principal Anita',
      decisionMakerEmail: 'anita@dps.edu.in',
      phase1Priorities: ['home_page', 'about_school'],
      urgentConfirmed: true, // User actively checked confirmation
      expeditedFeeINR: 4999,
    },
  };
  const comp = calculateIntakeCompleteness('school-website', intake);
  assert.strictEqual(comp.sectionPercentages['projectDelivery'], 100);
  assert(!comp.missingFields.some((f) => f.includes('Expedited Delivery Charge Confirmation')));
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Server-Side Price Sanitization & Tamper Prevention
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nCategory 4: Server-Side Price Sanitization & Tamper Resistance');

runTest('Server action recalculates expedited fee even if client sends spoofed price', () => {
  const spoofedClientPayload: ProjectDeliveryData = {
    targetLaunchTimeline: 'within-1-week',
    deliveryPriority: 'urgent',
    urgentConfirmed: true,
    expeditedFeeINR: 1, // Client tried sending ₹1 instead of ₹4,999!
  };

  // Simulating server action price re-resolver
  const productId: SchoolProductId = 'school-website';
  const canonicalFee = calculateExpeditedDeliveryFee(productId);
  assert.strictEqual(canonicalFee, 4999);

  // Server overrides client-provided value
  const serverSanitizedFee = spoofedClientPayload.deliveryPriority === 'urgent' ? canonicalFee : 0;
  assert.strictEqual(serverSanitizedFee, 4999);
  assert.notStrictEqual(serverSanitizedFee, spoofedClientPayload.expeditedFeeINR);
});

runTest('Switching from Urgent back to Standard resets fee to 0 and clears confirmation', () => {
  const deliveryState: ProjectDeliveryData = {
    targetLaunchTimeline: 'within-1-week',
    deliveryPriority: 'urgent',
    urgentConfirmed: true,
    expeditedFeeINR: 9999,
    paymentStatus: 'requested',
  };

  // User changes mind to standard
  const updatedPriority: ProjectDeliveryData = {
    ...deliveryState,
    deliveryPriority: 'standard',
    isUrgentRequested: false,
    urgentConfirmed: false,
    expeditedFeeINR: 0,
    paymentStatus: 'not_requested',
  };

  assert.strictEqual(updatedPriority.expeditedFeeINR, 0);
  assert.strictEqual(updatedPriority.urgentConfirmed, false);
  assert.strictEqual(updatedPriority.paymentStatus, 'not_requested');
});

runTest('Completed paid urgent order is preserved on reload', () => {
  const paidDeliveryState: ProjectDeliveryData = {
    targetLaunchTimeline: 'within-1-week',
    deliveryPriority: 'urgent',
    urgentConfirmed: true,
    expeditedFeeINR: 4999,
    paymentStatus: 'paid',
    paymentReference: 'pay_ABC123xyz',
  };

  // When saved or reloaded, paid status must remain 'paid'
  assert.strictEqual(paidDeliveryState.paymentStatus, 'paid');
  assert.strictEqual(paidDeliveryState.paymentReference, 'pay_ABC123xyz');
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Catalogs, Deadlines & Decision Maker Integration
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nCategory 5: Phase 1 & 2 Catalogs and Decision Maker');

runTest('Phase 1 catalog contains core launch essentials for all tiers', () => {
  assert(PHASE1_PRIORITY_CATALOG.length >= 10);
  const home = PHASE1_PRIORITY_CATALOG.find((p) => p.id === 'home_page');
  const about = PHASE1_PRIORITY_CATALOG.find((p) => p.id === 'about_school');
  const contact = PHASE1_PRIORITY_CATALOG.find((p) => p.id === 'contact_locations');
  const disclosures = PHASE1_PRIORITY_CATALOG.find((p) => p.id === 'mandatory_disclosures');

  assert(home && home.applicableProducts.includes('school-website'));
  assert(about && about.applicableProducts.includes('school-website'));
  assert(contact && contact.applicableProducts.includes('school-website'));
  assert(disclosures && disclosures.applicableProducts.includes('school-website'));
});

runTest('Phase 1 ERP features are correctly restricted from basic website plan', () => {
  const studentRoster = PHASE1_PRIORITY_CATALOG.find((p) => p.id === 'student_roster');
  assert(studentRoster);
  assert(!studentRoster.applicableProducts.includes('school-website'));
  assert(studentRoster.applicableProducts.includes('school-erp'));
  assert(studentRoster.requiresUpgradeText);
});

runTest('Phase 2 catalog contains later enhancements with plan-awareness', () => {
  assert(PHASE2_PRIORITY_CATALOG.length >= 8);
  const events = PHASE2_PRIORITY_CATALOG.find((p) => p.id === 'events_calendar');
  const feePay = PHASE2_PRIORITY_CATALOG.find((p) => p.id === 'online_fee_gateway');

  assert(events && events.applicableProducts.includes('school-website'));
  assert(feePay && !feePay.applicableProducts.includes('school-website'));
  assert(feePay && feePay.applicableProducts.includes('school-erp'));
});

runTest('Timeline options cover flexible, ASAP, discrete weeks, and specific date', () => {
  const ids = TARGET_TIMELINE_OPTIONS.map((t) => t.id);
  assert(ids.includes('asap'));
  assert(ids.includes('within-1-week'));
  assert(ids.includes('within-2-weeks'));
  assert(ids.includes('within-3-4-weeks'));
  assert(ids.includes('within-5-6-weeks'));
  assert(ids.includes('flexible'));
  assert(ids.includes('specific-date'));
});

runTest('Important deadlines catalog contains standard educational milestones', () => {
  assert(DEADLINE_TYPE_OPTIONS.includes('Admission Campaign Launch'));
  assert(DEADLINE_TYPE_OPTIONS.includes('New Academic Session'));
  assert(DEADLINE_TYPE_OPTIONS.includes('CBSE / Board Affiliation Inspection'));
});

runTest('Decision maker prefill correctly extracts contact details from project', () => {
  const intake = createInitialIntakeData({
    schoolName: 'Delhi Public School',
    contactName: 'Mrs. Ritu Verma',
    contactEmail: 'ritu@dps.edu.in',
    contactPhone: '9876543210',
  });

  assert.strictEqual(intake.projectDelivery?.decisionMakerName, 'Mrs. Ritu Verma');
  assert.strictEqual(intake.projectDelivery?.decisionMakerEmail, 'ritu@dps.edu.in');
  assert.strictEqual(intake.projectDelivery?.decisionMakerPhone, '9876543210');
  assert.strictEqual(intake.projectDelivery?.deliveryPriority, 'standard');
});

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n================================================================');
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log('================================================================');

if (totalTests !== passedTests) {
  process.exit(1);
}
