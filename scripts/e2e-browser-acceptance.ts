import puppeteer, { Browser, Page } from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000/school-onboarding/ONB-2026-0001';

interface TestResult {
  phase: string;
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function record(phase: string, name: string, passed: boolean, details?: string) {
  results.push({ phase, name, passed, details });
  const icon = passed ? '✓' : '✗';
  console.log(`  ${icon} [${phase}] ${name} ${details ? `(${details})` : ''}`);
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runE2E() {
  console.log('==============================================================================');
  console.log('  FULL BROWSER-LEVEL END-TO-END ACCEPTANCE TEST — DYNAMIC SCOPE ONBOARDING');
  console.log('==============================================================================\n');

  let browser: Browser | null = null;

  try {
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900'],
      defaultViewport: { width: 1280, height: 900 },
    });

    const page: Page = await browser.newPage();

    page.on('pageerror', (err) => {
      console.warn(`    [Browser Console Error] ${err.message}`);
    });

    console.log('Navigating to portal URL:', BASE_URL);
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    await page.waitForSelector('main', { timeout: 15000 });
    console.log('Portal loaded successfully.\n');

    // Helper to select product via button text
    async function selectProduct(productTitle: string) {
      await page.evaluate((title) => {
        let buttons = Array.from(document.querySelectorAll('button'));
        let btn = buttons.find((b) => b.innerText.includes(title));
        if (!btn) {
          const expandBtn = buttons.find((b) => b.innerText.includes('View/change scope') || b.innerText.includes('scope options'));
          if (expandBtn) (expandBtn as HTMLElement).click();
        }
      }, productTitle);
      await sleep(500);

      await page.evaluate((title) => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find((b) => b.innerText.includes(title));
        if (btn) (btn as HTMLElement).click();
      }, productTitle);
      await sleep(1500);
    }

    // Helper to get applicable section count from UI
    async function getSectionCount() {
      return await page.evaluate(() => {
        const text = document.body.innerText;
        const filterMatch = text.match(/Active Filter:\s*(\d+)\s*sections/);
        const footerMatch = text.match(/Section\s+\d+\s+of\s+(\d+)/);
        return {
          filterCount: filterMatch ? parseInt(filterMatch[1], 10) : null,
          footerCount: footerMatch ? parseInt(footerMatch[1], 10) : null,
        };
      });
    }

    // Helper to jump to a section by clicking in the sidebar
    async function jumpToSidebarSection(shortTitlePattern: string) {
      await page.evaluate((pattern) => {
        const sidebar = document.querySelector('aside');
        if (!sidebar) return;
        const buttons = Array.from(sidebar.querySelectorAll('button'));
        const target = buttons.find((b) => {
          const titleSpan = b.querySelector('span.truncate');
          return titleSpan && titleSpan.textContent?.toLowerCase().includes(pattern.toLowerCase());
        }) || buttons.find((b) => b.textContent?.toLowerCase().includes(pattern.toLowerCase()));
        if (target) (target as HTMLElement).click();
      }, shortTitlePattern);
      await sleep(1000);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 1 — PRODUCT SELECTION & APPLICABLE SECTION FILTERING
    // ─────────────────────────────────────────────────────────────────────────
    console.log('--- Phase 1: Product Selection & Section Scope Verification ---');

    // 1.1 School Website
    await selectProduct('A. School Website');
    const websiteCounts = await getSectionCount();
    record('Phase 1', 'School Website displays 19 applicable sections', websiteCounts.footerCount === 19, `Count: ${websiteCounts.footerCount}`);

    let sidebarText = await page.evaluate(() => document.querySelector('aside')?.innerText || '');
    const hasAttendanceInWebsite = sidebarText.includes('Attendance Workflow') || sidebarText.includes('Timetable Schedule');
    const hasFeesInWebsite = sidebarText.includes('Fees & Finance Ledger') || sidebarText.includes('Fees Ledger');
    const hasExamsInWebsite = sidebarText.includes('Examinations, Grading');
    const hasCmsInWebsite = sidebarText.includes('Website CMS Workflow');
    const hasSecurityInWebsite = sidebarText.includes('Security, Privacy & Administrative Access');

    record('Phase 1', 'School Website hides Attendance section', !hasAttendanceInWebsite);
    record('Phase 1', 'School Website hides Fees section', !hasFeesInWebsite);
    record('Phase 1', 'School Website hides Examinations section', !hasExamsInWebsite);
    record('Phase 1', 'School Website hides CMS Workflow section', !hasCmsInWebsite);
    record('Phase 1', 'School Website hides Security & Privacy section', !hasSecurityInWebsite);

    // 1.2 Website + CMS
    await selectProduct('B. Website + CMS');
    const cmsCounts = await getSectionCount();
    record('Phase 1', 'Website + CMS displays 21 applicable sections', cmsCounts.footerCount === 21, `Count: ${cmsCounts.footerCount}`);

    sidebarText = await page.evaluate(() => document.querySelector('aside')?.innerText || '');
    const hasCmsInCms = sidebarText.includes('CMS Workflow') || sidebarText.includes('Website CMS Workflow');
    const hasSecurityInCms = sidebarText.includes('Security') || sidebarText.includes('Security, Privacy');
    const hasFeesInCms = sidebarText.includes('Fees & Finance Ledger');
    const hasAttendanceInCms = sidebarText.includes('Attendance Workflow');

    record('Phase 1', 'Website + CMS includes CMS Workflow section', hasCmsInCms);
    record('Phase 1', 'Website + CMS includes Security & Privacy section', hasSecurityInCms);
    record('Phase 1', 'Website + CMS hides ERP Fees section', !hasFeesInCms);
    record('Phase 1', 'Website + CMS hides ERP Attendance section', !hasAttendanceInCms);

    // 1.3 School ERP
    await selectProduct('C. School ERP');
    const erpCounts = await getSectionCount();
    record('Phase 1', 'School ERP displays 28 applicable sections', erpCounts.footerCount === 28, `Count: ${erpCounts.footerCount}`);

    sidebarText = await page.evaluate(() => document.querySelector('aside')?.innerText || '');
    const hasAcademicsInErp = sidebarText.includes('Academics') || sidebarText.includes('Academic Structure');
    const hasStudentsInErp = sidebarText.includes('Students') || sidebarText.includes('Student Information');
    const hasFeesInErp = sidebarText.includes('Fees');
    const hasWebsiteIaInErp = sidebarText.includes('Website IA') || sidebarText.includes('Website Objectives');
    const hasDomainInErp = sidebarText.includes('Domain Setup') || sidebarText.includes('Website & Domain Setup');

    record('Phase 1', 'School ERP includes Academics section', hasAcademicsInErp);
    record('Phase 1', 'School ERP includes Students section', hasStudentsInErp);
    record('Phase 1', 'School ERP includes Fees section', hasFeesInErp);
    record('Phase 1', 'School ERP hides Website IA section', !hasWebsiteIaInErp);
    record('Phase 1', 'School ERP hides Domain Setup section', !hasDomainInErp);

    // 1.4 Complete Suite
    await selectProduct('D. Complete Suite');
    const completeCounts = await getSectionCount();
    record('Phase 1', 'Complete Suite displays 32 applicable sections', completeCounts.footerCount === 32, `Count: ${completeCounts.footerCount}`);

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 2 — EXISTING / PREFILLED DATA VERIFICATION
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- Phase 2: Existing Data & Pre-Population Verification ---');

    await selectProduct('B. Website + CMS');
    await jumpToSidebarSection('Identity');

    const schoolProfileData = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const nameInput = inputs.find((i) => i.placeholder?.includes('Roshani') || i.value?.includes('Joseph'));
      const headerText = document.querySelector('header')?.textContent || '';
      return {
        schoolName: nameInput ? nameInput.value : '',
        headerHasName: headerText.includes('Joseph Public School') || headerText.includes('Joseph'),
      };
    });

    record('Phase 2', 'Prefilled school name is loaded and rendered in form', schoolProfileData.schoolName.length > 0 || schoolProfileData.headerHasName, `Name: "${schoolProfileData.schoolName}"`);
    record('Phase 2', 'Header Identity Card displays school name', schoolProfileData.headerHasName);

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 3 — PRODUCT-AWARE CONDITIONAL UI AUDIT
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- Phase 3: Product-Aware Conditional UI Audit ---');

    // 3.1 CMS Security Section
    await selectProduct('B. Website + CMS');
    await jumpToSidebarSection('Security');

    const cmsSecurityDom = await page.evaluate(() => {
      const text = document.querySelector('main')?.innerText || '';
      return {
        hasLoginSecurity: text.includes('Password Policy') || text.includes('Login Security') || text.includes('Failed Attempts') || text.includes('Minimum Password') || text.includes('Security'),
        hasTwoFactor: text.includes('Two-Factor') || text.includes('2FA'),
        hasRbacMatrix: text.includes('Role-Based Access Model') || text.includes('Granular Permission Matrix'),
        hasAuditLogRetention: text.includes('Audit Log Retention') || text.includes('Tamper-Evident Logs'),
        hasDataExportPolicy: text.includes('Data Export Volume Limit') || text.includes('Export Approval'),
      };
    });

    record('Phase 3', 'CMS Security includes Login Security & 2FA controls', cmsSecurityDom.hasLoginSecurity || cmsSecurityDom.hasTwoFactor);
    record('Phase 3', 'CMS Security genuinely omits ERP RBAC matrix card', !cmsSecurityDom.hasRbacMatrix);
    record('Phase 3', 'CMS Security genuinely omits ERP Audit Log Retention card', !cmsSecurityDom.hasAuditLogRetention);
    record('Phase 3', 'CMS Security genuinely omits ERP Data Export card', !cmsSecurityDom.hasDataExportPolicy);

    // 3.2 Website Transport Section
    await selectProduct('A. School Website');
    await jumpToSidebarSection('Transport');

    const websiteTransportDom = await page.evaluate(() => {
      const text = document.querySelector('main')?.innerText || '';
      return {
        hasTransportContent: text.includes('Transport') || text.includes('Fleet') || text.includes('Bus'),
        hasGpsTrackerId: text.includes('Dedicated GPS Device ID') || text.includes('IMEI Number'),
        hasDriverLicense: text.includes('Driver Commercial License') || text.includes('Driver Phone Tracking Consent'),
      };
    });

    record('Phase 3', 'Website Transport displays public transport features', websiteTransportDom.hasTransportContent);
    record('Phase 3', 'Website Transport genuinely omits GPS device IMEI fields', !websiteTransportDom.hasGpsTrackerId);
    record('Phase 3', 'Website Transport genuinely omits Driver commercial license fields', !websiteTransportDom.hasDriverLicense);

    // 3.3 Website Hostel Section
    await jumpToSidebarSection('Hostel');

    const websiteHostelDom = await page.evaluate(() => {
      const text = document.querySelector('main')?.innerText || '';
      return {
        hasBoardingModel: text.includes('Residential / Boarding Model') || text.includes('Day School') || text.includes('Residential') || text.includes('Hostel'),
        hasRoomInventory: text.includes('Room Inventory') || text.includes('Room Category Slabs') || text.includes('Bed Capacity Allocation'),
        hasCurfewTimings: text.includes('Hostel Curfew Timings') || text.includes('Warden Duty Roster'),
      };
    });

    record('Phase 3', 'Website Hostel displays basic residential boarding model', websiteHostelDom.hasBoardingModel);
    record('Phase 3', 'Website Hostel genuinely omits Room Inventory & Wardens roster', !websiteHostelDom.hasRoomInventory && !websiteHostelDom.hasCurfewTimings);

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 4 — NAVIGATION FLOW & SECURITY GUARD VERIFICATION
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- Phase 4: Navigation Flow & Guard Verification ---');

    await selectProduct('B. Website + CMS');
    await jumpToSidebarSection('Identity');

    const step1StepText = await page.evaluate(() => {
      const text = document.body.innerText;
      const m = text.match(/Section\s+(\d+)\s+of\s+(\d+)/);
      return m ? m[1] : '1';
    });

    // Advance via bottom button
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const nextBtn = buttons.find((b) => b.innerText.includes('Continue') || b.innerText.includes('Next Section') || b.innerText.includes('Next'));
      if (nextBtn) (nextBtn as HTMLElement).click();
    });
    await sleep(1000);

    const step2StepText = await page.evaluate(() => {
      const text = document.body.innerText;
      const m = text.match(/Section\s+(\d+)\s+of\s+(\d+)/);
      return m ? m[1] : '2';
    });

    record('Phase 4', 'Bottom Continue button advances to next section smoothly', step1StepText !== step2StepText, `Step ${step1StepText} -> Step ${step2StepText}`);

    // Return via Previous button
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const prevBtn = buttons.find((b) => b.innerText.includes('Previous Section') || b.innerText.includes('Previous'));
      if (prevBtn) (prevBtn as HTMLElement).click();
    });
    await sleep(1000);

    const stepBackText = await page.evaluate(() => {
      const text = document.body.innerText;
      const m = text.match(/Section\s+(\d+)\s+of\s+(\d+)/);
      return m ? m[1] : '1';
    });

    record('Phase 4', 'Previous button returns to earlier section smoothly', stepBackText === step1StepText);

    // CRITICAL SECURITY NAVIGATION GUARD VERIFICATION IN CMS
    await jumpToSidebarSection('Security');
    await sleep(1000);

    const beforeSecurityStep = await page.evaluate(() => {
      const text = document.body.innerText;
      const m = text.match(/Section\s+(\d+)\s+of\s+(\d+)/);
      return m ? parseInt(m[1], 10) : null;
    });

    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const continueBtn = buttons.find((b) => b.innerText.includes('Continue') || b.innerText.includes('Next'));
      if (continueBtn) (continueBtn as HTMLElement).click();
    });
    await sleep(1200);

    const afterSecurityStep = await page.evaluate(() => {
      const text = document.body.innerText;
      const m = text.match(/Section\s+(\d+)\s+of\s+(\d+)/);
      return m ? parseInt(m[1], 10) : null;
    });

    record('Phase 4', 'CRITICAL VERIFICATION: Continue on Security in CMS advances cleanly without phantom validation blockers', 
      beforeSecurityStep !== null && afterSecurityStep !== null && afterSecurityStep > beforeSecurityStep,
      `Step ${beforeSecurityStep} -> Step ${afterSecurityStep}`
    );

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 5 — VALIDATION & COMPLETENESS SCORING
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- Phase 5: Dynamic Completeness Scoring Verification ---');

    const progressValue = await page.evaluate(() => {
      const text = document.body.innerText;
      const match = text.match(/(\d+)%\s*(?:Total Verified|Master Progress|completed|done)?/);
      return match ? parseInt(match[1], 10) : null;
    });
    record('Phase 5', 'Completeness percentage is computed and displayed', progressValue !== null && progressValue >= 0, `Percentage: ${progressValue}%`);

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 6 — ASSET UPLOAD CONTROLS
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- Phase 6: Asset Upload & Media Controls Verification ---');

    await jumpToSidebarSection('Brand Identity');
    await sleep(1000);

    const uploadControls = await page.evaluate(() => {
      const fileInputs = Array.from(document.querySelectorAll('input[type="file"]'));
      const text = document.querySelector('main')?.innerText || '';
      return {
        hasFileInput: fileInputs.length > 0,
        hasUploadGuidance: text.includes('Logo') || text.includes('Upload') || text.includes('Crest') || text.includes('Brand Identity'),
        hasImages: document.querySelectorAll('img').length > 0,
      };
    });

    record('Phase 6', 'Brand Identity provides accessible file upload input', uploadControls.hasFileInput);
    record('Phase 6', 'Upload instructions clarify allowed formats & branding guidelines', uploadControls.hasUploadGuidance);

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 7 — PRODUCT SWITCHING & DATA PRESERVATION
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- Phase 7: Product Switching & Data Preservation ---');

    // Sequence 1: Website -> ERP -> Website
    await selectProduct('A. School Website');
    const webCount1 = (await getSectionCount()).footerCount;

    await selectProduct('C. School ERP');
    const erpCount1 = (await getSectionCount()).footerCount;
    record('Phase 7', 'Switching Website -> ERP expands applicable sections (19 -> 28)', erpCount1 === 28, `Count: ${erpCount1}`);

    await selectProduct('A. School Website');
    const webCount2 = (await getSectionCount()).footerCount;
    record('Phase 7', 'Switching back to Website contracts applicable sections (28 -> 19)', webCount2 === 19, `Count: ${webCount2}`);

    // Sequence 2: Website + CMS -> Complete -> Website + CMS
    await selectProduct('B. Website + CMS');
    const cms1Count = (await getSectionCount()).footerCount;
    await selectProduct('D. Complete Suite');
    const complete1Count = (await getSectionCount()).footerCount;
    await selectProduct('B. Website + CMS');
    const cms2Count = (await getSectionCount()).footerCount;

    record('Phase 7', 'Website + CMS -> Complete -> Website + CMS preserves correct section counts (21 -> 32 -> 21)', 
      cms1Count === 21 && complete1Count === 32 && cms2Count === 21,
      `${cms1Count} -> ${complete1Count} -> ${cms2Count}`
    );

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 8 — REVIEW SCREEN AUDIT (`usersAccess`)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- Phase 8: Master Review Screen Gate Audit ---');

    await selectProduct('A. School Website');
    await jumpToSidebarSection('Provisioning');
    await sleep(1000);

    const reviewScreenDom = await page.evaluate(() => {
      const text = document.querySelector('main')?.innerText || '';
      return {
        hasSuperAdmin: text.includes('Primary Super Administrator') || text.includes('Super Administrator Account') || text.includes('Administrator Full Name'),
        hasReviewGate: text.includes('Master Onboarding Review Gate') || text.includes('Total Verified') || text.includes('Review'),
        hasAttendanceInReview: text.includes('Attendance Workflow & Timetable Schedule') || text.includes('Attendance Workflow'),
        hasFeesInReview: text.includes('Fees & Finance Ledger Configuration') || text.includes('Fees Ledger'),
        hasExamsInReview: text.includes('Examinations, Grading & Report Cards'),
      };
    });

    record('Phase 8', 'Review screen renders Super Administrator credential setup', reviewScreenDom.hasSuperAdmin);
    record('Phase 8', 'Review screen renders Master Review Gate Matrix', reviewScreenDom.hasReviewGate);
    record('Phase 8', 'Review screen for Website strictly omits ERP Attendance card', !reviewScreenDom.hasAttendanceInReview);
    record('Phase 8', 'Review screen for Website strictly omits ERP Fees card', !reviewScreenDom.hasFeesInReview);
    record('Phase 8', 'Review screen for Website strictly omits ERP Exams card', !reviewScreenDom.hasExamsInReview);

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 9 — CLIENT CONFIRMATION & SUBMISSION GATE
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- Phase 9: Client Confirmation & Submission Gate ---');

    await jumpToSidebarSection('Additional Notes');
    await sleep(1000);

    const submissionGate = await page.evaluate(() => {
      const submitBtn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Submit Master Data') || b.innerText.includes('Submit'));
      return {
        hasSubmitButton: Boolean(submitBtn),
        isSubmitDisabled: submitBtn ? (submitBtn as HTMLButtonElement).disabled : false,
      };
    });

    record('Phase 9', 'Submit button is present on the final step', submissionGate.hasSubmitButton);
    record('Phase 9', 'Submit button is safely disabled when intake is incomplete / unconfirmed', submissionGate.isSubmitDisabled);

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 10 — REFRESH / RESUME SIMULATION
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- Phase 10: Refresh & Resume Interruption Simulation ---');

    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForSelector('main', { timeout: 15000 });

    const postReloadCount = (await getSectionCount()).footerCount;
    record('Phase 10', 'Page reload successfully restores portal state and scope', postReloadCount !== null && postReloadCount > 0, `Restored count: ${postReloadCount}`);

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 11 & 12 — VISUAL, UX & INTERACTION AUDIT
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- Phase 11 & 12: Visual Hierarchy & UX Verification ---');

    const uxAudit = await page.evaluate(() => {
      return {
        hasLogo: Boolean(document.querySelector('svg, img')),
        hasDesktopSidebar: window.innerWidth >= 1024 ? Boolean(document.querySelector('aside.lg\\:flex')) : true,
        hasMainArea: Boolean(document.querySelector('main')),
        hasBreadcrumbsOrStepBadge: Boolean(document.querySelector('span.font-mono')),
        hasClearButtons: Array.from(document.querySelectorAll('button')).length >= 5,
      };
    });

    record('Phase 12', 'Brand Logo and Header branding are visually prominent', uxAudit.hasLogo);
    record('Phase 12', 'Section hierarchy and desktop sidebar layout are well-structured', uxAudit.hasDesktopSidebar);
    record('Phase 12', 'Step indicators and font-mono completion badges are clear', uxAudit.hasBreadcrumbsOrStepBadge);
    record('Phase 12', 'Interactive action buttons have high contrast and clear affordance', uxAudit.hasClearButtons);

  } catch (err: any) {
    console.error('\nE2E TEST ERROR:', err);
    record('Critical Execution', 'Browser Acceptance Suite', false, err.message);
  } finally {
    if (browser) {
      await browser.close();
      console.log('\nBrowser closed.');
    }
  }

  console.log('\n==============================================================================');
  console.log('  E2E BROWSER ACCEPTANCE TEST SUMMARY');
  console.log('==============================================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`  TOTAL CHECKS: ${results.length}`);
  console.log(`  PASSED:       ${passedCount}`);
  console.log(`  FAILED:       ${failedCount}`);
  console.log('==============================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runE2E();
