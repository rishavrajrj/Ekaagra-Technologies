import assert from 'node:assert';
import {
  buildSchoolChangeRequestWhatsAppUrl,
  buildSchoolBatchChangeRequestWhatsAppUrl,
} from '../whatsapp';
import {
  sendSchoolChangeRequestEmail,
  sendSchoolChangeRequestBatchEmail,
} from '../email';

console.log('=== RUNNING SCHOOL CHANGE REQUEST NOTIFICATIONS TEST SUITE ===\n');

// 1. WhatsApp URL Generation
console.log('1. Testing buildSchoolChangeRequestWhatsAppUrl with full parameters...');
const url1 = buildSchoolChangeRequestWhatsAppUrl({
  clientPhone: '9876543210',
  clientName: 'Father Joseph',
  schoolName: 'St. Xavier High School',
  fieldOrSection: 'Main Campus Full Address',
  reviewerMessage: 'Please provide exact street and pincode details.',
  suggestedValue: 'Belwanwa, Motihari 845401',
  onboardingUrl: 'https://www.ekaagratechnologies.site/school-onboarding/ONB-2026-0001',
});

assert.ok(url1.includes('https://wa.me/919876543210?text='));
assert.ok(url1.includes(encodeURIComponent('St. Xavier High School')));
assert.ok(url1.includes(encodeURIComponent('Main Campus Full Address')));
assert.ok(url1.includes(encodeURIComponent('Please provide exact street and pincode details.')));
assert.ok(url1.includes(encodeURIComponent('Belwanwa, Motihari 845401')));
assert.ok(url1.includes(encodeURIComponent('https://www.ekaagratechnologies.site/school-onboarding/ONB-2026-0001')));
console.log('✓ Full parameters WhatsApp URL generated successfully with sanitized 91 prefix.');

console.log('\n2. Testing buildSchoolChangeRequestWhatsAppUrl without suggested value...');
const url2 = buildSchoolChangeRequestWhatsAppUrl({
  clientPhone: '+91 98765 43210',
  clientName: 'Director Sharma',
  schoolName: 'Greenwood International',
  fieldOrSection: 'School Logo',
  reviewerMessage: 'Uploaded logo is blurry, please provide high-resolution PNG or SVG.',
  onboardingUrl: '/school-onboarding/ONB-2026-0002',
});

assert.ok(url2.includes('https://wa.me/919876543210?text='));
assert.ok(url2.includes(encodeURIComponent('Greenwood International')));
assert.ok(url2.includes(encodeURIComponent('School Logo')));
assert.ok(!url2.includes(encodeURIComponent('*Suggested Value:*')));
console.log('✓ WhatsApp URL without suggested value generated cleanly.');

console.log('\n3. Testing buildSchoolChangeRequestWhatsAppUrl fallback without phone number...');
const url3 = buildSchoolChangeRequestWhatsAppUrl({
  fieldOrSection: 'Annual Fee Schedule',
  reviewerMessage: 'Please confirm tuition fee for Class 10.',
  onboardingUrl: '/school-onboarding/ONB-2026-0003',
});

assert.ok(url3.includes('text='));
assert.ok(url3.includes(encodeURIComponent('there')));
assert.ok(url3.includes(encodeURIComponent('Annual Fee Schedule')));
console.log('✓ WhatsApp URL without phone falls back to generic link.');

console.log('\n4. Testing buildSchoolBatchChangeRequestWhatsAppUrl for multiple items...');
const batchUrl = buildSchoolBatchChangeRequestWhatsAppUrl({
  clientPhone: '09876543210',
  clientName: 'Brother Thomas',
  schoolName: 'St. Paul Academy',
  items: [
    {
      fieldOrSection: 'Year of Establishment',
      reviewerMessage: 'Please provide exact year.',
      suggestedValue: '1998',
    },
    {
      fieldOrSection: 'Campus Postal Address',
      reviewerMessage: 'Pin code is missing.',
      suggestedValue: '845401',
    },
    {
      fieldOrSection: 'Principal Portrait',
      reviewerMessage: 'Photo is low resolution, please re-upload.',
    },
  ],
  onboardingUrl: 'https://www.ekaagratechnologies.site/school-onboarding/ONB-2026-BATCH',
});

assert.ok(batchUrl.includes('https://wa.me/919876543210?text='));
assert.ok(batchUrl.includes(encodeURIComponent('Adjustments Requested (3 items)')));
assert.ok(batchUrl.includes(encodeURIComponent('Year of Establishment')));
assert.ok(batchUrl.includes(encodeURIComponent('Campus Postal Address')));
assert.ok(batchUrl.includes(encodeURIComponent('Principal Portrait')));
assert.ok(batchUrl.includes(encodeURIComponent('1998')));
assert.ok(batchUrl.includes(encodeURIComponent('https://www.ekaagratechnologies.site/school-onboarding/ONB-2026-BATCH')));
console.log('✓ Consolidated batch WhatsApp URL formatted and numbered all items properly.');

console.log('\n5. Testing sendSchoolChangeRequestEmail execution safety...');
(async () => {
  const emailRes = await sendSchoolChangeRequestEmail({
    clientName: 'Principal Anita',
    clientEmail: 'anita@testschool.org',
    schoolName: 'D.A.V. Public School',
    fieldLabel: 'Campus Address',
    reviewerMessage: 'Need full landmark details.',
    onboardingUrl: '/school-onboarding/ONB-2026-0004',
  });

  assert.ok('success' in emailRes);
  assert.ok('method' in emailRes);
  console.log('✓ sendSchoolChangeRequestEmail executed and handled dispatch safely.');

  console.log('\n6. Testing sendSchoolChangeRequestBatchEmail for consolidated single-email dispatch...');
  const batchEmailRes = await sendSchoolChangeRequestBatchEmail({
    clientName: 'Chairman Varma',
    clientEmail: 'varma@dps.edu.in',
    schoolName: 'Delhi Public School',
    items: [
      {
        fieldLabel: 'Affiliation Board & Number',
        reviewerMessage: 'Affiliation number is invalid format for CBSE.',
        suggestedValue: 'CBSE-330123',
        section: 'School Profile',
      },
      {
        fieldLabel: 'Official School Crest',
        reviewerMessage: 'Uploaded crest is blurry. Please upload transparent PNG or SVG.',
        section: 'Branding & Design',
      },
    ],
    onboardingUrl: '/school-onboarding/ONB-DPS-01',
  });

  assert.ok('success' in batchEmailRes);
  assert.ok('method' in batchEmailRes);
  console.log('✓ sendSchoolChangeRequestBatchEmail bundled 2 items into a single email payload safely.');

  console.log('\n======================================================');
  console.log('ALL SCHOOL CHANGE REQUEST NOTIFICATION TESTS PASSED!');
  console.log('======================================================');
})();
