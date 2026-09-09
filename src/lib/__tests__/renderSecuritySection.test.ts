import React from 'react';
import ReactDOMServer from 'react-dom/server';
import SecurityPrivacySection from '../../components/schools/SecurityPrivacySection';

const html = ReactDOMServer.renderToString(React.createElement(SecurityPrivacySection));

console.log('Rendered HTML output bytes:', html.length);
const matches = html.match(/<h[2345][^>]*>(.*?)<\/h[2345]>/g) || [];
const headings = matches.map(h => h.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&'));
console.log(`Extracted ${headings.length} headings:`);
headings.forEach(h => console.log('  *', h));

const expectedHeadings = [
  'Security, Privacy & Administrative Access',
  'ADMINISTRATOR ACCESS',
  'ROLE & PERMISSION MODEL',
  'TWO-FACTOR AUTHENTICATION (2FA)',
  'LOGIN & ACCOUNT SECURITY',
  'SESSION & DEVICE SECURITY',
  'AUDIT LOGGING',
  'AUDIT LOG RETENTION',
  'DATA EXPORT & PRIVACY',
  'DATA ACCESS RESTRICTIONS',
  'SECURITY NOTIFICATIONS',
  'HIGH-RISK ACTION APPROVAL',
  'PRIVACY & DATA GOVERNANCE',
  'SECURITY POLICY SUMMARY',
  'Recommended security baseline'
];

let allPassed = true;
for (const heading of expectedHeadings) {
  const present = headings.some(h => h.toLowerCase() === heading.toLowerCase());
  console.log(`[${present ? 'PASS' : 'FAIL'}] "${heading}"`);
  if (!present) allPassed = false;
}

if (!allPassed) {
  console.error('Some expected headings were missing.');
  process.exit(1);
}

// 2. Non-credential notice verification
console.log('\nTesting non-credential notice in markup...');
if (html.includes('does not store, accept, or manage administrative passwords, OTPs')) {
  console.log('[PASS] Explicit non-credential policy disclaimer present in rendered HTML');
} else {
  console.error('[FAIL] Non-credential disclaimer missing in rendered HTML');
  process.exit(1);
}

// 3. Accessibility roles verification
console.log('\nTesting ARIA roles in markup...');
if (html.includes('role="radiogroup"') && html.includes('role="radio"')) {
  console.log('[PASS] Radio group ARIA roles present');
} else {
  console.error('[FAIL] ARIA radio roles missing');
  process.exit(1);
}

// 4. Responsive table container verification
console.log('\nTesting responsive matrix container...');
const htmlWithMatrix = ReactDOMServer.renderToString(
  React.createElement(SecurityPrivacySection, {
    intakeData: {
      securityPrivacy: {
        permissionModel: 'Custom permission matrix',
      } as any,
    } as any,
  })
);

if (htmlWithMatrix.includes('overflow-x-auto') && htmlWithMatrix.includes('min-w-[640px]')) {
  console.log('[PASS] Responsive horizontal scroll container for permissions matrix present');
} else {
  console.error('[FAIL] Responsive table container missing');
  process.exit(1);
}

// 5. Validation banner rendering test with errors
console.log('\nTesting validation banner rendering when errors are supplied...');
const htmlWithErrors = ReactDOMServer.renderToString(
  React.createElement(SecurityPrivacySection, {
    externalErrors: {
      administratorCount: 'Expected administrator accounts must be between 1 and 100',
    },
  })
);
if (
  htmlWithErrors.includes('id="security-validation-banner"') &&
  htmlWithErrors.includes('Please resolve the following security configuration requirement')
) {
  console.log('[PASS] Validation banner rendered properly with error count and alert header');
} else {
  console.error('[FAIL] Validation banner missing when errors are provided');
  process.exit(1);
}

console.log('\nSUCCESS: All SSR render, accessibility, responsive, and disclaimer tests passed! ✓✓✓');

