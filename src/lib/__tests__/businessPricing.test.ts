import assert from 'node:assert';
import {
  businessPlans,
  getBusinessPlan,
  getAllBusinessPlans,
  formatBusinessYear1Price,
  formatBusinessRenewalPrice,
  type BusinessPlanId,
} from '../businessPricing';
import { pricingTiers, websitePlans } from '../data';
import { schoolPlans } from '../schoolPricing';
import { calculateVerifiedOrderTotal } from '../pricingEngine';

console.log('=== RUNNING REVISED BUSINESS PRICING AUDIT TEST SUITE ===\n');

// 1. Total Plans and Plan IDs
console.log('1. Verifying canonical 7 business plans count and IDs...');
assert.strictEqual(businessPlans.length, 7, 'Must contain exactly 7 business plans');

const expectedIds: BusinessPlanId[] = [
  'business-website',
  'business-website-cms',
  'website-design-dev',
  'web-applications',
  'android-applications',
  'custom-software',
  'business-solutions',
];

const actualIds = businessPlans.map((p) => p.id);
assert.deepStrictEqual(actualIds, expectedIds, 'Plan IDs must match the expected sequence');
console.log('✓ All 7 canonical business plans exist in exact sequence:');
actualIds.forEach((id, idx) => console.log(`   ${idx + 1}. ${id}`));

// 2. Exact Year-1 Prices
console.log('\n2. Verifying exact Year-1 setup & development prices...');
const expectedYear1Prices: Record<string, number | null> = {
  'business-website': 7999,
  'business-website-cms': 12999,
  'website-design-dev': 15000,
  'web-applications': 24999,
  'android-applications': 24999,
  'custom-software': 34999,
  'business-solutions': null,
};

for (const [id, expectedPrice] of Object.entries(expectedYear1Prices)) {
  const plan = getBusinessPlan(id);
  assert.strictEqual(
    plan.priceYear1,
    expectedPrice,
    `Plan ${id} Year 1 price must be ${expectedPrice}, got ${plan.priceYear1}`
  );
}
console.log('✓ All Year 1 prices match approved pricing matrix exactly.');

// 3. Exact Renewal Prices (No dynamic division rounding)
console.log('\n3. Verifying exact Year-2+ annual renewal prices...');
const expectedRenewalPrices: Record<string, number | null> = {
  'business-website': 3999,
  'business-website-cms': 6499,
  'website-design-dev': 7500,
  'web-applications': 12499,
  'android-applications': 12499,
  'custom-software': 17499,
  'business-solutions': null,
};

for (const [id, expectedRenewal] of Object.entries(expectedRenewalPrices)) {
  const plan = getBusinessPlan(id);
  assert.strictEqual(
    plan.renewalPrice,
    expectedRenewal,
    `Plan ${id} renewal price must be ${expectedRenewal}, got ${plan.renewalPrice}`
  );
}
console.log('✓ All Year-2+ renewal prices match approved figures exactly.');

// 4. Verification that Year-1 price is NEVER displayed with "/year"
console.log('\n4. Verifying billing terminology guardrails (No Year 1 shown as /year)...');
for (const plan of businessPlans) {
  assert.ok(
    !plan.priceDisplayYear1.includes('/year') && !plan.priceDisplayYear1.includes('/yr'),
    `Plan ${plan.id} priceDisplayYear1 (${plan.priceDisplayYear1}) must not include "/year"`
  );
}
console.log('✓ All 7 plans display Year 1 prices cleanly without ambiguous "/year" suffixes.');

// 5. Custom Quote Plan Handling
console.log('\n5. Verifying Business Solutions custom quote handling...');
const customPlan = getBusinessPlan('business-solutions');
assert.strictEqual(customPlan.priceYear1, null);
assert.strictEqual(customPlan.renewalPrice, null);
assert.strictEqual(customPlan.billingType, 'custom');
assert.strictEqual(customPlan.priceDisplayYear1, 'Custom Quote');
assert.strictEqual(customPlan.renewalDisplay, 'Renewal: Custom');
assert.strictEqual(formatBusinessYear1Price(customPlan), 'Custom Quote');
assert.strictEqual(formatBusinessRenewalPrice(customPlan), 'Renewal: Custom');
assert.strictEqual(customPlan.cta, "LET'S DISCUSS →");
console.log('✓ Business Solutions produces "Custom Quote" and "Renewal: Custom" without ₹0 or NaN.');

// 6. Complete School ERP Isolation
console.log('\n6. Verifying School ERP complete removal from Business pricing presentation...');
const businessPlanNames = businessPlans.map((p) => p.name.toLowerCase());
assert.ok(!businessPlanNames.includes('school erp'), 'School ERP must not be in businessPlans');

const pricingTierTitles = pricingTiers.map((t) => t.title.toLowerCase());
assert.ok(
  !pricingTierTitles.includes('school erp'),
  'School ERP must not be in business pricingTiers'
);

// Verify School ERP remains present in dedicated school products
const schoolProductIds = schoolPlans.map((p) => p.id);
assert.ok(
  schoolProductIds.includes('school-erp'),
  'School ERP must remain fully available in schoolPlans'
);
assert.ok(
  schoolProductIds.includes('school-complete'),
  'School Complete must remain fully available in schoolPlans'
);
console.log('✓ School ERP is completely removed from business flow and preserved in schools flow.');

// 7. Server-Side Order Calculation with Year-1 Prices
console.log('\n7. Verifying server-side order calculation engine with revised pricing...');
const orderTestCases = [
  { planId: 'business-website', expectedPrice: 7999 },
  { planId: 'business-website-cms', expectedPrice: 12999 },
  { planId: 'website-design-dev', expectedPrice: 15000 },
  { planId: 'web-applications', expectedPrice: 24999 },
  { planId: 'android-applications', expectedPrice: 24999 },
  { planId: 'custom-software', expectedPrice: 34999 },
];

for (const tc of orderTestCases) {
  const result = calculateVerifiedOrderTotal({
    serviceType: 'Website Development',
    planId: tc.planId,
    customerName: 'Test Business',
    customerEmail: 'test@example.com',
    customerPhone: '9876543210',
    additionalPages: [],
    domainChoice: 'existing',
  });

  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.finalAmountINR, tc.expectedPrice);
  assert.strictEqual(result.amountInPaise, tc.expectedPrice * 100);
}
console.log('✓ Server-side calculation computes authoritative Year 1 prices in INR and paise.');

// 8. Year 2 Renewal is NOT added to checkout total
console.log('\n8. Verifying Year 2 renewal is excluded from Year 1 checkout total...');
const checkoutWithPages = calculateVerifiedOrderTotal({
  serviceType: 'Website Development',
  planId: 'business-website',
  customerName: 'Acme Corp',
  customerEmail: 'acme@example.com',
  customerPhone: '9876543210',
  additionalPages: [
    { name: 'Custom Page', tierId: 'standard-designed', price: 299 },
  ],
  domainChoice: 'existing',
});

// Year 1 (₹7,999) + standard-designed page (₹299) = ₹8,298. (Renewal ₹3,999 must NOT be in this total!)
assert.strictEqual(checkoutWithPages.finalAmountINR, 7999 + 299);
assert.strictEqual(checkoutWithPages.finalAmountINR, 8298);
console.log('✓ Year-2 renewal is strictly excluded from checkout payable total.');

console.log('\n======================================================');
console.log('ALL REVISED BUSINESS PRICING AUDIT TESTS PASSED! (100%)');
console.log('======================================================');
