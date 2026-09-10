import assert from 'assert';
import { domainProvider } from '../src/lib/domain/provider';

async function run() {
  console.log('Testing domain search enhancements...\n');

  // Test 1: Requested domain is #1 when queried
  const res1 = await domainProvider.checkDomain({
    domain: 'sparknestacademyschool.school',
    selectedPlanId: 'school-complete',
    businessCategory: 'school',
    annualAllowance: 750,
  });

  assert.strictEqual(res1.results[0].domain, 'sparknestacademyschool.school', 'Requested domain must be at index 0');
  assert.strictEqual(res1.results[0].isRequestedDomain, true, 'Requested domain flag must be true');
  assert.strictEqual(res1.results[0].recommendationBadge, 'Requested Domain', 'Badge must be Requested Domain');
  assert.strictEqual(res1.planAllowance, 750, 'Plan allowance must be 750');
  console.log('  ✓ Test 1: Requested domain pinned to top (#1) with "Requested Domain" badge');

  // Test 2: Check school plan allowance resolution
  const res2 = await domainProvider.checkDomain({
    domain: 'sparknestacademyschool',
    selectedPlanId: 'school-complete',
    businessCategory: 'school',
  });
  assert.strictEqual(res2.planAllowance, 750, 'Default allowance for school-complete should be 750');
  console.log('  ✓ Test 2: School plan allowance resolved correctly to ₹750');

  // Test 3: No duplicate Best Overall badges in school suggestions
  const bestOverallCount = res2.results.filter((r) => r.recommendationBadge === 'Best Overall').length;
  assert.strictEqual(bestOverallCount, 1, 'Only one Best Overall badge should exist in recommendations');
  console.log('  ✓ Test 3: Zero duplicate Best Overall badges found across recommendations');

  // Test 4: School website product allowance resolution
  const res4 = await domainProvider.checkDomain({
    domain: 'myschooltest',
    selectedPlanId: 'school-website',
    businessCategory: 'school',
  });
  assert.strictEqual(res4.planAllowance, 300, 'Allowance for school-website should be 300');
  console.log('  ✓ Test 4: School website allowance correctly resolved to ₹300');

  console.log('\n===============================================================');
  console.log('  ALL TARGETED DOMAIN SEARCH ENHANCEMENT TESTS PASSED! (4/4)');
  console.log('===============================================================\n');
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
