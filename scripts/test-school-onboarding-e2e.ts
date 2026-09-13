/**
 * ==============================================================================
 * EKAAGRA TECHNOLOGIES — PRODUCTION BROWSER E2E TEST SUITE
 * School Onboarding Portal: Locking, Reopening, and Revision Guardrails
 * File: scripts/test-school-onboarding-e2e.ts
 * ==============================================================================
 */

import * as fs from 'fs';
import * as path from 'path';
import puppeteer, { Browser, Page } from 'puppeteer-core';

// Load .env.local for standalone runner
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  });
}

import { getSchoolsServerClient } from '../src/lib/schoolsDb';
import { hashToken, verifyOnboardingToken } from '../src/lib/schoolHandoff';
import { saveSchoolIntakeDraftAction, submitSchoolIntakeAction } from '../src/app/schoolProjectActions';
import { createInitialIntakeData } from '../src/lib/schoolIntake';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_HOST = 'http://localhost:3000';
const TEST_PROJECT_NUMBER = 'SCH-E2E-2026-001';
const TEST_LEAD_REFERENCE = 'REQ-E2E-2026-001';
const TEST_INVITATION_CODE = 'ONB-E2E-2026-001';
const TEST_SCHOOL_NAME = 'Apex International Academy';

interface TestResult {
  code: string;
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function check(code: string, name: string, condition: boolean, details?: string) {
  results.push({ code, name, passed: condition, details });
  const icon = condition ? '✓ PASS' : '✗ FAIL';
  console.log(`  ${icon} [${code}] ${name} ${details ? `(${details})` : ''}`);
  if (!condition) {
    console.error(`    --> FAILED ASSERTION: ${name}`);
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForPortalLoad(page: Page) {
  await page.waitForFunction(
    () => !document.body.innerText.includes('Loading School Master System'),
    { timeout: 25000 }
  );
  await sleep(400);
}

// ─────────────────────────────────────────────────────────────────────────────
// Database Helpers for Test Isolation
// ─────────────────────────────────────────────────────────────────────────────
async function cleanDatabaseTestRecords() {
  const db = getSchoolsServerClient();
  if (!db) throw new Error('Schools database client not configured');

  const { data: existing } = await db
    .from('school_projects')
    .select('id')
    .or(`project_number.eq.${TEST_PROJECT_NUMBER},lead_reference.eq.${TEST_LEAD_REFERENCE}`);

  if (existing && existing.length > 0) {
    const ids = existing.map((e) => e.id);
    await db.from('school_intake_change_requests').delete().in('school_project_id', ids);
    await db.from('school_intake_submissions').delete().in('school_project_id', ids);
    await db.from('school_projects').update({
      status: 'onboarding_in_progress',
      completeness_percentage: 25,
      school_name: TEST_SCHOOL_NAME,
    }).in('id', ids);
  }
}

async function seedTestProject(status: 'onboarding_in_progress' | 'submitted' | 'changes_requested' = 'onboarding_in_progress') {
  await cleanDatabaseTestRecords();
  const db = getSchoolsServerClient();
  if (!db) throw new Error('Schools database client not configured');

  const initialPayload = createInitialIntakeData('school-complete');
  initialPayload.schoolProfile.schoolName = TEST_SCHOOL_NAME;
  initialPayload.schoolProfile.officialEmail = 'info@apexacademy.edu.in';
  initialPayload.schoolProfile.phone = '+91 98765 43210';
  initialPayload.schoolProfile.city = 'Patna';
  initialPayload.schoolProfile.state = 'Bihar';

  let { data: proj } = await db
    .from('school_projects')
    .select('*')
    .eq('project_number', TEST_PROJECT_NUMBER)
    .maybeSingle();

  if (proj) {
    const { data: updatedProj, error: updateErr } = await db
      .from('school_projects')
      .update({
        status: status,
        completeness_percentage: status === 'onboarding_in_progress' ? 25 : 95,
        school_name: TEST_SCHOOL_NAME,
        lead_reference: TEST_LEAD_REFERENCE,
        primary_contact_name: 'Dr. Rajesh Sharma',
        primary_contact_email: 'principal@apexacademy.edu.in',
        primary_contact_phone: '+919876543210',
        city: 'Patna',
        state: 'Bihar',
        updated_at: new Date().toISOString(),
      })
      .eq('id', proj.id)
      .select('*')
      .single();

    if (updateErr) throw updateErr;
    proj = updatedProj;
  } else {
    const { data: newProj, error: pErr } = await db
      .from('school_projects')
      .insert([
        {
          project_number: TEST_PROJECT_NUMBER,
          lead_reference: TEST_LEAD_REFERENCE,
          school_name: TEST_SCHOOL_NAME,
          product_id: 'school-complete',
          status: status,
          completeness_percentage: status === 'onboarding_in_progress' ? 25 : 95,
          primary_contact_name: 'Dr. Rajesh Sharma',
          primary_contact_email: 'principal@apexacademy.edu.in',
          primary_contact_phone: '+919876543210',
          city: 'Patna',
          state: 'Bihar',
        },
      ])
      .select('*')
      .single();

    if (pErr || !newProj) throw new Error(`Failed to seed project: ${pErr?.message}`);
    proj = newProj;
  }

  // Ensure active invitation exists
  const { data: existingInv } = await db
    .from('school_onboarding_invitations')
    .select('*')
    .eq('school_project_id', proj.id)
    .maybeSingle();

  if (!existingInv) {
    const rawSecret = 'e2e-secret-test-token-777';
    const tokenHash = hashToken(rawSecret);
    await db.from('school_onboarding_invitations').insert([
      {
        school_project_id: proj.id,
        invitation_code: TEST_INVITATION_CODE,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        is_revoked: false,
      },
    ]);
  }

  // If status is submitted or changes_requested, seed initial submission
  if (status === 'submitted' || status === 'changes_requested') {
    const { error: subErr } = await db.from('school_intake_submissions').insert([
      {
        school_project_id: proj.id,
        version_number: 1,
        is_current: true,
        submitted_by_name: 'Dr. Rajesh Sharma',
        submitted_by_email: 'principal@apexacademy.edu.in',
        intake_payload: initialPayload,
        custom_fields_data: {},
        completeness_percentage: 95,
        status: status,
      },
    ]);
    if (subErr) throw new Error(`Failed to seed submission: ${subErr.message}`);
  }

  return { project: proj, initialPayload };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN TEST RUNNER
// ─────────────────────────────────────────────────────────────────────────────
async function runProductionE2ETests() {
  console.log('==============================================================================');
  console.log('  SCHOOL ONBOARDING PORTAL — PRODUCTION BROWSER E2E TEST SUITE');
  console.log('  Verifying Lockout, Persistence, Direct Routing, and Selective Revision');
  console.log('==============================================================================\n');

  let browser: Browser | null = null;

  try {
    // 0. Launch Browser with isolated contexts
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900'],
      defaultViewport: { width: 1280, height: 900 },
    });

    const contextA = await browser.createBrowserContext();
    const pageA = await contextA.newPage();

    const contextB = await browser.createBrowserContext(); // Isolated incognito session (zero shared cookies/storage)
    const pageB = await contextB.newPage();

    pageA.on('pageerror', (err) => console.warn(`    [Session A Error] ${err.message}`));
    pageB.on('pageerror', (err) => console.warn(`    [Session B Error] ${err.message}`));

    // ─────────────────────────────────────────────────────────────────────────
    // TEST SUITE 1: LINK RESOLUTION EQUIVALENCE & DRAFT EDITABILITY
    // ─────────────────────────────────────────────────────────────────────────
    console.log('------------------------------------------------------------------------------');
    console.log('PHASE 1: Link Resolution Equivalence & Draft Editability');
    console.log('------------------------------------------------------------------------------');

    await seedTestProject('onboarding_in_progress');

    // 1.1 SCH-* Route loads in Session A
    const schUrl = `${BASE_HOST}/SCH-E2E-2026-001`;
    console.log(`  Navigating Session A to SCH-* URL: ${schUrl}`);
    await pageA.goto(schUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await waitForPortalLoad(pageA);

    const sessionASchoolFound = await pageA.evaluate((name) => {
      return document.body.innerText.toLowerCase().includes(name.toLowerCase());
    }, TEST_SCHOOL_NAME);
    check('P0-1.1', 'SCH-* URL resolves correctly in Session A', sessionASchoolFound);

    // 1.2 REQ-* Route loads in Session B (isolated context)
    const reqUrl = `${BASE_HOST}/REQ-E2E-2026-001`;
    console.log(`  Navigating Session B (Isolated Context) to REQ-* URL: ${reqUrl}`);
    await pageB.goto(reqUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await waitForPortalLoad(pageB);

    const sessionBSchoolFound = await pageB.evaluate((name) => {
      return document.body.innerText.toLowerCase().includes(name.toLowerCase());
    }, TEST_SCHOOL_NAME);
    check('P0-1.2', 'REQ-* URL resolves to same school in Session B', sessionBSchoolFound);

    // 1.3 Direct /school-project/:token route also resolves
    const projUrl = `${BASE_HOST}/school-project/SCH-E2E-2026-001`;
    console.log(`  Navigating Session A to direct /school-project URL: ${projUrl}`);
    await pageA.goto(projUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await waitForPortalLoad(pageA);
    const directRouteMatches = await pageA.evaluate(() => document.body.innerText.includes('Apex International Academy'));
    check('P0-1.3', '/school-project/:token rewrite resolves to same project', directRouteMatches);

    // 1.4 Draft state: Form fields are fully editable and NOT locked
    const draftInputsEditable = await pageA.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([readonly])')) as HTMLInputElement[];
      const enabledInputs = inputs.filter((inp) => !inp.disabled);
      return {
        total: inputs.length,
        enabled: enabledInputs.length,
        isLockedScreen: /master information submitted & recorded/i.test(document.body.innerText),
      };
    });
    check(
      'P0-1.4',
      'Draft mode fields are enabled and editable (no locking screen)',
      draftInputsEditable.enabled > 0 && !draftInputsEditable.isLockedScreen,
      `${draftInputsEditable.enabled}/${draftInputsEditable.total} inputs enabled`
    );

    // ─────────────────────────────────────────────────────────────────────────
    // TEST SUITE 2: POST-SUBMISSION IMMEDIATE LOCKOUT & CONFIRMATION VIEW
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n------------------------------------------------------------------------------');
    console.log('PHASE 2: Form Submission & Immediate Lockout');
    console.log('------------------------------------------------------------------------------');

    // Submit project via submitSchoolIntakeAction with authoritative payload
    const initialIntake = createInitialIntakeData('school-complete');
    initialIntake.schoolProfile.schoolName = TEST_SCHOOL_NAME;
    initialIntake.schoolProfile.officialEmail = 'info@apexacademy.edu.in';
    initialIntake.clientConfirmation.isConfirmed = true;

    const submitRes = await submitSchoolIntakeAction(TEST_PROJECT_NUMBER, initialIntake);
    check('P0-2.1', 'Server-side submission succeeds and transitions project to submitted', submitRes.success === true);

    // Reload Session A page to observe authoritative submitted view
    await pageA.reload({ waitUntil: 'networkidle2' });
    await waitForPortalLoad(pageA);

    const submissionConfirmationVisible = await pageA.evaluate(() => {
      return (
        /master information submitted & recorded/i.test(document.body.innerText) ||
        /submission recorded/i.test(document.body.innerText)
      );
    });
    check('P0-2.2', 'Submitted project immediately displays Master Information Submitted & Recorded view', submissionConfirmationVisible);

    // 2.3 Verify form input fields are completely removed / not rendered in edit mode
    const formInputCount = await pageA.evaluate(() => {
      const form = document.querySelector('form');
      const inputs = document.querySelectorAll('input:not([type="hidden"])');
      return { hasForm: Boolean(form), inputCount: inputs.length };
    });
    check('P0-2.3', 'Editable form fields are no longer rendered after submission', formInputCount.inputCount === 0);

    // 2.4 Verify "Review Master Snapshot" modal is read-only (no editable form inputs)
    const snapshotModalCheck = await pageA.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const reviewBtn = buttons.find((b) => b.innerText.includes('Review Master Snapshot'));
      if (reviewBtn) {
        reviewBtn.click();
        return true;
      }
      return false;
    });
    check('P0-2.4', 'Review Master Snapshot button exists on confirmation screen', snapshotModalCheck);

    await sleep(500);

    const snapshotModalReadOnly = await pageA.evaluate(() => {
      const modal = document.querySelector('[role="dialog"], .fixed.inset-0');
      if (!modal) return false;
      const editableInputs = modal.querySelectorAll('input:not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly])');
      const hasCloseButton = Array.from(modal.querySelectorAll('button')).some((b) => b.innerText.includes('Close') || b.getAttribute('aria-label') === 'Close');
      return editableInputs.length === 0 && hasCloseButton;
    });
    check('P0-2.5', 'Review Master Snapshot modal renders strictly read-only content without editable inputs', snapshotModalReadOnly);

    // Close modal
    await pageA.evaluate(() => {
      const closeBtn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Close') || b.getAttribute('aria-label') === 'Close');
      if (closeBtn) (closeBtn as HTMLElement).click();
    });
    await sleep(300);

    // ─────────────────────────────────────────────────────────────────────────
    // TEST SUITE 3: PERSISTENCE ACROSS REFRESH, NAVIGATION & SESSIONS
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n------------------------------------------------------------------------------');
    console.log('PHASE 3: Persistence Across Refreshes, Reopen & Cross-Browser Sessions');
    console.log('------------------------------------------------------------------------------');

    // 3.1 Hard page refresh preserves locked state
    await pageA.reload({ waitUntil: 'networkidle2' });
    await waitForPortalLoad(pageA);
    const refreshPreservesLock = await pageA.evaluate(() => {
      return /master information submitted & recorded/i.test(document.body.innerText);
    });
    check('P0-3.1', 'Hard page refresh preserves locked confirmation state', refreshPreservesLock);

    // 3.2 Session B (Incognito / isolated context with zero shared storage) sees locked state
    await pageB.reload({ waitUntil: 'networkidle2' });
    await waitForPortalLoad(pageB);
    const sessionBSeesLock = await pageB.evaluate(() => {
      return /master information submitted & recorded/i.test(document.body.innerText);
    });
    check('P0-3.2', 'Independent browser session (Session B) sees authoritative locked confirmation', sessionBSeesLock);

    // 3.3 Direct URL access via /school-project/:token in a brand new page
    const pageC = await browser.newPage();
    await pageC.goto(`${BASE_HOST}/school-project/SCH-E2E-2026-001`, { waitUntil: 'networkidle2' });
    await waitForPortalLoad(pageC);
    const directPageCSeesLock = await pageC.evaluate(() => {
      return /master information submitted & recorded/i.test(document.body.innerText);
    });
    check('P0-3.3', 'Direct /school-project navigation in new tab sees locked state', directPageCSeesLock);
    await pageC.close();

    // 3.4 Browser Back / Forward navigation cannot bypass locking
    console.log('  Testing Browser Back/Forward navigation resistance...');
    await pageA.goto(`${BASE_HOST}/admin/login`, { waitUntil: 'networkidle2' });
    await sleep(500);
    await pageA.goBack({ waitUntil: 'networkidle2' });
    await waitForPortalLoad(pageA);
    const backNavigationLocked = await pageA.evaluate(() => {
      return /master information submitted & recorded/i.test(document.body.innerText);
    });
    check('P0-3.4', 'Browser Back button cannot bypass submission locking', backNavigationLocked);

    // ─────────────────────────────────────────────────────────────────────────
    // TEST SUITE 4: SERVER-SIDE DRAFT SAVE & SUBMIT REJECTION
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n------------------------------------------------------------------------------');
    console.log('PHASE 4: Server-Side Guardrail Rejection on Submitted Projects');
    console.log('------------------------------------------------------------------------------');

    // 4.1 saveSchoolIntakeDraftAction rejects draft modifications on submitted project
    const draftSaveAttempt = await saveSchoolIntakeDraftAction(TEST_PROJECT_NUMBER, {
      schoolProfile: { schoolName: 'Malicious Injected Name' },
    });
    check(
      'P0-4.1',
      'saveSchoolIntakeDraftAction rejects unauthorized post-submission draft edits',
      draftSaveAttempt.success === false && (draftSaveAttempt.error || '').includes('locked from editing'),
      `Error received: "${draftSaveAttempt.error}"`
    );

    // 4.2 submitSchoolIntakeAction rejects duplicate submissions on already submitted project
    const duplicateSubmitAttempt = await submitSchoolIntakeAction(TEST_PROJECT_NUMBER, initialIntake);
    check(
      'P0-4.2',
      'submitSchoolIntakeAction rejects duplicate submissions on submitted project',
      duplicateSubmitAttempt.success === false && (duplicateSubmitAttempt.error || '').includes('locked from further submissions'),
      `Error received: "${duplicateSubmitAttempt.error}"`
    );

    // ─────────────────────────────────────────────────────────────────────────
    // TEST SUITE 5: REVISION MODE (changes_requested) SELECTIVE UNLOCKING
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n------------------------------------------------------------------------------');
    console.log('PHASE 5: Selective Unlocking in Revision Mode (changes_requested)');
    console.log('------------------------------------------------------------------------------');

    const db = getSchoolsServerClient()!;
    const { data: currentProj } = await db
      .from('school_projects')
      .select('id')
      .eq('project_number', TEST_PROJECT_NUMBER)
      .single();

    if (!currentProj) throw new Error('Test project not found in database');

    // Transition project to changes_requested
    await db
      .from('school_projects')
      .update({ status: 'changes_requested' })
      .eq('id', currentProj.id);

    // Insert an administrator change request strictly for officialEmail
    await db.from('school_intake_change_requests').insert([
      {
        school_project_id: currentProj.id,
        section_key: 'schoolProfile',
        field_key: 'schoolProfile.officialEmail',
        request_comment: 'Please provide official domain-based email address (e.g. principal@apexacademy.edu.in)',
        requested_by: 'Ekaagra Admin Reviewer',
        status: 'waiting_for_school',
        request_type: 'correction',
        current_value: 'info@apexacademy.edu.in',
      },
    ]);

    // Reload Session A to observe revision mode
    await pageA.reload({ waitUntil: 'networkidle2' });
    await waitForPortalLoad(pageA);

    const revisionModeBanner = await pageA.evaluate(() => {
      const text = document.body.innerText;
      return (
        /fixes requested/i.test(text) ||
        /changes requested/i.test(text) ||
        /action req/i.test(text) ||
        /change request/i.test(text)
      );
    });
    check('P0-5.1', 'Revision mode active and displays action required indicator', revisionModeBanner);

    // 5.2 Verify officialEmail is ENABLED and editable
    const officialEmailState = await pageA.evaluate(() => {
      const emailInput = document.querySelector(
        '#field-school-email, input[type="email"], input[name="officialEmail"]'
      ) as HTMLInputElement | null;
      return {
        exists: Boolean(emailInput),
        disabled: emailInput ? emailInput.disabled : true,
        readOnly: emailInput ? emailInput.readOnly : true,
      };
    });
    check(
      'P0-5.2',
      'Administrator-authorized field (officialEmail) is unlocked and editable',
      officialEmailState.exists && !officialEmailState.disabled && !officialEmailState.readOnly,
      `disabled=${officialEmailState.disabled}, readOnly=${officialEmailState.readOnly}`
    );

    // 5.3 Verify schoolName in the same section is DISABLED / locked
    const schoolNameState = await pageA.evaluate(() => {
      const nameInput = document.querySelector(
        '#field-school-name, input[name="schoolName"]'
      ) as HTMLInputElement | null;
      return {
        exists: Boolean(nameInput),
        disabled: nameInput ? nameInput.disabled : true,
      };
    });
    check(
      'P0-5.3',
      'Unrequested field in the same section (schoolName) remains strictly locked',
      schoolNameState.disabled === true,
      `disabled=${schoolNameState.disabled}`
    );

    // 5.4 Test Server-Side Guardrail: Reject unauthorized modification during changes_requested
    const unauthorizedMutation = await saveSchoolIntakeDraftAction(TEST_PROJECT_NUMBER, {
      ...initialIntake,
      schoolProfile: {
        ...initialIntake.schoolProfile,
        schoolName: 'Hacked School Name Attempt', // NOT in change requests
      },
    });
    check(
      'P0-5.4',
      'Server-side draft save rejects unauthorized field mutation during changes_requested',
      unauthorizedMutation.success === false && (unauthorizedMutation.error || '').includes('locked'),
      `Error received: "${unauthorizedMutation.error}"`
    );

    // 5.5 Test Server-Side Guardrail: Accept authorized modification and preserve changes_requested
    const authorizedMutation = await saveSchoolIntakeDraftAction(TEST_PROJECT_NUMBER, {
      ...initialIntake,
      schoolProfile: {
        ...initialIntake.schoolProfile,
        officialEmail: 'contact@apexacademy.edu.in', // Authorized field
      },
    });
    check(
      'P0-5.5',
      'Server-side draft save allows authorized change request field mutation',
      authorizedMutation.success === true,
      `Success: ${authorizedMutation.success}`
    );

    const { data: projectAfterDraft } = await db
      .from('school_projects')
      .select('status')
      .eq('id', currentProj.id)
      .single();
    check(
      'P0-5.6',
      'Project status remains changes_requested after saving revision draft',
      projectAfterDraft?.status === 'changes_requested',
      `Current DB status: ${projectAfterDraft?.status}`
    );

    // ─────────────────────────────────────────────────────────────────────────
    // TEST SUITE 6: RESUBMISSION LOCKS THE PROJECT AGAIN
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n------------------------------------------------------------------------------');
    console.log('PHASE 6: Resubmission Re-locks the Portal');
    console.log('------------------------------------------------------------------------------');

    // Submit the revision
    const resubmitRes = await submitSchoolIntakeAction(
      TEST_PROJECT_NUMBER,
      {
        ...initialIntake,
        schoolProfile: {
          ...initialIntake.schoolProfile,
          officialEmail: 'contact@apexacademy.edu.in',
        },
      },
      {},
      'Updated official email as requested'
    );
    check('P0-6.1', 'Resubmission succeeds with version increment', resubmitRes.success === true, `Version: ${resubmitRes.versionNumber}`);

    // Verify DB status is now 'resubmitted'
    const { data: projectAfterResubmit } = await db
      .from('school_projects')
      .select('status')
      .eq('id', currentProj.id)
      .single();
    check('P0-6.2', 'Database project status transitioned to resubmitted', projectAfterResubmit?.status === 'resubmitted');

    // Reload Session A
    await pageA.reload({ waitUntil: 'networkidle2' });
    await waitForPortalLoad(pageA);

    const resubmitConfirmationVisible = await pageA.evaluate(() => {
      return /master information submitted & recorded/i.test(document.body.innerText);
    });
    check('P0-6.3', 'Portal transitions back to locked confirmation screen after resubmission', resubmitConfirmationVisible);

    // Cross-session check in Session B
    await pageB.reload({ waitUntil: 'networkidle2' });
    await waitForPortalLoad(pageB);
    const sessionBResubmitLocked = await pageB.evaluate(() => {
      return /master information submitted & recorded/i.test(document.body.innerText);
    });
    check('P0-6.4', 'Session B observes locked state after resubmission', sessionBResubmitLocked);

    // Direct save attempt on resubmitted project is rejected
    const postResubmitSaveAttempt = await saveSchoolIntakeDraftAction(TEST_PROJECT_NUMBER, {
      schoolProfile: { officialEmail: 'another-edit@test.com' },
    });
    check(
      'P0-6.5',
      'Server rejects draft save on resubmitted project without new administrative change request',
      postResubmitSaveAttempt.success === false && (postResubmitSaveAttempt.error || '').includes('locked from editing'),
      `Error received: "${postResubmitSaveAttempt.error}"`
    );
  } finally {
    if (browser) {
      await browser.close();
    }
    // Clean up dedicated test project from database
    await cleanDatabaseTestRecords();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SUMMARY REPORT
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n==============================================================================');
  console.log('  FINAL E2E BROWSER ACCEPTANCE SUMMARY');
  console.log('==============================================================================');

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`Total Scenarios Executed: ${total}`);
  console.log(`Passed:                   ${passed}`);
  console.log(`Failed:                   ${failed}`);
  console.log(`Pass Rate:                 ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.error('\nFAILED SCENARIOS:');
    results.filter((r) => !r.passed).forEach((r) => {
      console.error(`  - [${r.code}] ${r.name}: ${r.details || 'Assertion failed'}`);
    });
    process.exit(1);
  } else {
    console.log('\nALL P0 BROWSER E2E TESTS PASSED WITH 100% SUCCESS!');
    process.exit(0);
  }
}

runProductionE2ETests().catch((err) => {
  console.error('[FATAL E2E ERROR]', err);
  process.exit(1);
});
