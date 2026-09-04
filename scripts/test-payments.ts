/**
 * Automated Security & Pricing Verification Test Suite
 * Ekaagra Technologies - Payment Gateway Architecture
 */

import crypto from 'crypto';
import { calculateVerifiedOrderTotal } from '../src/lib/pricingEngine';
import { verifyRazorpayPaymentSignature, verifyRazorpayWebhookSignature } from '../src/lib/razorpay';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

console.log('\n=== RUNNING PAYMENT GATEWAY SECURITY & INTEGRATION TESTS ===\n');

// -----------------------------------------------------------------------------
// TEST 1: Server-Side Price Authority & Tamper Rejection
// -----------------------------------------------------------------------------
console.log('1. Server-Side Price Authority Tests:');

// Client attempts to submit Starter Website with tampered price = 1
const tamperedOrder = calculateVerifiedOrderTotal({
  customerName: 'Test Attacker',
  customerEmail: 'attacker@example.com',
  customerPhone: '9876543210',
  serviceType: 'Website Development',
  planId: 'starter', // Official Starter price = ₹999
  // Notice: no client amount is accepted
});

assert(tamperedOrder.isValid === true, 'Starter plan recognized as valid');
assert(tamperedOrder.finalAmountINR === 999, 'Starter plan strictly priced at ₹999 on server');
assert(tamperedOrder.amountInPaise === 99900, 'Calculates 99900 paise for Razorpay');

// Test Launch Plus (₹499)
const launchPlusOrder = calculateVerifiedOrderTotal({
  customerName: 'Test Client',
  customerEmail: 'client@example.com',
  customerPhone: '9876543210',
  serviceType: 'Website Development',
  planId: 'launch-plus',
});
assert(launchPlusOrder.finalAmountINR === 499, 'Launch Plus plan strictly priced at ₹499');

// Test Invalid Plan ID
const invalidPlanOrder = calculateVerifiedOrderTotal({
  customerName: 'Test Client',
  customerEmail: 'client@example.com',
  customerPhone: '9876543210',
  serviceType: 'Website Development',
  planId: 'super-discounted-enterprise-plan-for-1-rupee',
});
assert(invalidPlanOrder.isValid === false, 'Malicious/invalid plan ID rejected');

// -----------------------------------------------------------------------------
// TEST 2: Additional Pages Recomputation
// -----------------------------------------------------------------------------
console.log('\n2. Additional Pages Calculation Tests:');

const multiPageOrder = calculateVerifiedOrderTotal({
  customerName: 'Test Client',
  customerEmail: 'client@example.com',
  customerPhone: '9876543210',
  serviceType: 'Website Development',
  planId: 'starter', // ₹999
  additionalPages: [
    { name: 'Photo Gallery', tierId: 'standard-designed', price: 1 }, // Tampered price: 1 (server should charge 299)
    { name: 'FAQ Page', tierId: 'simple-info', price: 0 }, // Tampered price: 0 (server should charge 199)
  ],
});

assert(multiPageOrder.additionalPagesTotal === 299 + 199, 'Additional pages calculated from server tiers (299 + 199 = 498)');
assert(multiPageOrder.finalAmountINR === 999 + 498, 'Total is exactly 999 + 498 = 1497');
assert(multiPageOrder.amountInPaise === 149700, 'Total in paise is exactly 149700');

// -----------------------------------------------------------------------------
// TEST 3: Domain Pricing Security (Phase 18 Anti-Tampering)
// -----------------------------------------------------------------------------
console.log('\n3. Domain Tampering Resistance Tests:');

// Client claims unverified domain upgrade
const unverifiedDomainOrder = calculateVerifiedOrderTotal({
  customerName: 'Test Client',
  customerEmail: 'client@example.com',
  customerPhone: '9876543210',
  serviceType: 'Website Development',
  planId: 'starter',
  domainChoice: 'NEW_DOMAIN',
  preferredDomain: 'myschoolbihar.org',
  isPriceVerified: false, // Precheck required
});

assert(unverifiedDomainOrder.domainUpgrade === 0, 'Unverified domain difference is strictly ₹0');
assert(unverifiedDomainOrder.finalAmountINR === 999, 'Payable total unaffected by unverified domain');

// -----------------------------------------------------------------------------
// TEST 4: HMAC Payment Signature Verification (Phase 8)
// -----------------------------------------------------------------------------
console.log('\n4. HMAC Payment Signature Verification Tests:');

const testSecret = 'test_razorpay_secret_key_12345';
process.env.RAZORPAY_KEY_SECRET = testSecret;

const orderId = 'order_DA1234567890';
const paymentId = 'pay_XY9876543210';
const validSignature = crypto
  .createHmac('sha256', testSecret)
  .update(`${orderId}|${paymentId}`)
  .digest('hex');

const isSigValid = verifyRazorpayPaymentSignature({
  orderId,
  paymentId,
  signature: validSignature,
});
assert(isSigValid === true, 'Authentic Razorpay payment signature accepted');

const isTamperedSigValid = verifyRazorpayPaymentSignature({
  orderId,
  paymentId,
  signature: 'invalid_tampered_signature_hex_code_12345',
});
assert(isTamperedSigValid === false, 'Tampered signature rejected');

const isMismatchedPaymentSigValid = verifyRazorpayPaymentSignature({
  orderId,
  paymentId: 'pay_DIFFERENT_PAYMENT_ID',
  signature: validSignature,
});
assert(isMismatchedPaymentSigValid === false, 'Payment ID mismatch signature rejected');

// -----------------------------------------------------------------------------
// TEST 5: Webhook Signature Verification (Phase 9)
// -----------------------------------------------------------------------------
console.log('\n5. Webhook Signature Verification Tests:');

const webhookSecret = 'test_webhook_secret_998877';
process.env.RAZORPAY_WEBHOOK_SECRET = webhookSecret;

const testPayload = JSON.stringify({
  event: 'order.paid',
  payload: {
    order: { entity: { id: orderId, receipt: 'EKA-2026-1001' } },
    payment: { entity: { id: paymentId, amount: 99900, status: 'captured' } },
  },
});

const validWebhookSignature = crypto
  .createHmac('sha256', webhookSecret)
  .update(testPayload)
  .digest('hex');

const isWebhookValid = verifyRazorpayWebhookSignature({
  rawBody: testPayload,
  signature: validWebhookSignature,
});
assert(isWebhookValid === true, 'Authentic Razorpay webhook payload and signature accepted');

const isTamperedWebhookValid = verifyRazorpayWebhookSignature({
  rawBody: testPayload + ' ', // Altered raw payload
  signature: validWebhookSignature,
});
assert(isTamperedWebhookValid === false, 'Tampered webhook payload rejected');

// -----------------------------------------------------------------------------
// TEST 6: Custom Payment Link Validation (Phase 16)
// -----------------------------------------------------------------------------
console.log('\n6. Custom Payment Link Validation Tests:');

const validCustomLink = calculateVerifiedOrderTotal({
  customerName: 'Ramesh Singh',
  customerEmail: 'ramesh@example.com',
  customerPhone: '9876543210',
  serviceType: 'School ERP Platform',
  isCustomPaymentLink: true,
  customAmountINR: 15000,
  customDescription: '50% Project Kickoff Advance',
});
assert(validCustomLink.isValid === true, 'Valid custom payment link created');
assert(validCustomLink.finalAmountINR === 15000, 'Custom link reflects exact milestone amount (₹15,000)');
assert(validCustomLink.amountInPaise === 1500000, 'Custom link converts to 1,500,000 paise');

const invalidCustomLink = calculateVerifiedOrderTotal({
  customerName: 'Ramesh Singh',
  customerEmail: 'ramesh@example.com',
  customerPhone: '9876543210',
  serviceType: 'School ERP Platform',
  isCustomPaymentLink: true,
  customAmountINR: -500, // Negative amount
});
assert(invalidCustomLink.isValid === false, 'Negative custom payment amount rejected');

// -----------------------------------------------------------------------------
// TEST 7: Order Number Generation Format
// -----------------------------------------------------------------------------
console.log('\n7. Order Number Generator Tests:');
import { generateOrderNumber } from '../src/lib/razorpay';

const sampleOrderNum = generateOrderNumber();
const orderNumRegex = /^EKA-\d{4}-\d{4}$/;
assert(orderNumRegex.test(sampleOrderNum), `Order number matches pattern EKA-YYYY-XXXX (Got: ${sampleOrderNum})`);

const sampleOrderNum2 = generateOrderNumber();
assert(sampleOrderNum !== sampleOrderNum2, 'Subsequent order numbers are distinct');

// -----------------------------------------------------------------------------
// TEST 8: Signature Verification Edge Cases (Empty secrets, null params)
// -----------------------------------------------------------------------------
console.log('\n8. Signature Verification Edge Cases:');

assert(
  verifyRazorpayPaymentSignature({ orderId: '', paymentId: 'pay_123', signature: 'sig' }) === false,
  'Payment signature verification fails safely on empty orderId'
);
assert(
  verifyRazorpayPaymentSignature({ orderId: 'order_123', paymentId: '', signature: 'sig' }) === false,
  'Payment signature verification fails safely on empty paymentId'
);
assert(
  verifyRazorpayWebhookSignature({ rawBody: '', signature: 'sig' }) === false,
  'Webhook signature verification fails safely on empty rawBody'
);

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log(`\n========================================`);
console.log(`TEST SUMMARY: ${passed} passed, ${failed} failed.`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
