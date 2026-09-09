import puppeteer, { Browser, Page } from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000/school-onboarding/ONB-2026-0001';

let passCount = 0;
let failCount = 0;

function check(name: string, condition: boolean, details?: string) {
  if (condition) {
    console.log(`  ✓ ${name} ${details ? `(${details})` : ''}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${name} ${details ? `(${details})` : ''}`);
    failCount++;
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('==============================================================================');
  console.log('  BROWSER E2E TEST: CAMPUS ACADEMIC LEVEL → CLASSES DYNAMIC MAPPING');
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

    console.log('Navigating to:', BASE_URL);
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('main', { timeout: 15000 });
    console.log('Portal loaded successfully.\n');

    // ─── Navigate to Campus section ─────────────────────────────────────────────
    console.log('--- Step A: Navigate to Campuses Section ---');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('aside button, nav button'));
      const campusBtn = buttons.find((b) => b.textContent?.toLowerCase().includes('campus'));
      if (campusBtn) (campusBtn as HTMLElement).click();
    });
    await sleep(1500);

    // ─── Step A: Click Add Campus to create Campus 2 ────────────────────────────
    console.log('\n--- Step A: Add Campus 2 ---');
    await page.evaluate(() => {
      const addBtn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Add Campus'));
      if (addBtn) (addBtn as HTMLElement).click();
    });
    await sleep(1500);

    const hasCampus2 = await page.evaluate(() => {
      return document.querySelector('main')?.innerText.includes('CAMPUS 2') || false;
    });
    check('Campus 2 created', hasCampus2);

    // ─── Step B: Click Pre-Primary ONE TIME ONLY ────────────────────────────────
    console.log('\n--- Step B: Click Pre-Primary on Campus 2 (FIRST CLICK) ---');

    // Find and click the Pre-Primary button on Campus 2's academic scope card
    const preClickResult = await page.evaluate(() => {
      // Find all "Campus Academic Scope" sections
      const scopeHeaders = Array.from(document.querySelectorAll('h4')).filter(
        (h) => h.textContent?.includes('Campus Academic Scope')
      );
      // Campus 2's scope section should be the last one (or second one)
      const campus2ScopeHeader = scopeHeaders[scopeHeaders.length - 1];
      if (!campus2ScopeHeader) return { found: false, clicked: false };

      // Find the academic scope card containing this header
      const scopeCard = campus2ScopeHeader.closest('div.space-y-4, div[class*="space-y"]')?.parentElement;
      if (!scopeCard) return { found: false, clicked: false };

      // Find the Pre-Primary button within this card
      const buttons = Array.from(scopeCard.querySelectorAll('button'));
      const prePrimaryBtn = buttons.find((b) => b.textContent?.includes('Pre-Primary') && !b.textContent?.includes('✓'));
      if (prePrimaryBtn) {
        (prePrimaryBtn as HTMLElement).click();
        return { found: true, clicked: true };
      }
      return { found: true, clicked: false };
    });

    check('Pre-Primary button found and clicked on Campus 2', preClickResult.clicked);

    // Wait a tick for React to re-render
    await sleep(500);

    // ─── Verify IMMEDIATE state after first click ───────────────────────────────
    const afterFirstClick = await page.evaluate(() => {
      const mainText = document.querySelector('main')?.innerText || '';
      const hasCheckmarkPrePrimary = mainText.includes('✓ Pre-Primary');
      const hasPlaygroup = mainText.includes('Playgroup');
      const hasNursery = mainText.includes('Nursery');
      const hasLKG = mainText.includes('LKG');
      const hasUKG = mainText.includes('UKG');
      return { hasCheckmarkPrePrimary, hasPlaygroup, hasNursery, hasLKG, hasUKG };
    });

    check('Pre-Primary shows selected state (✓)', afterFirstClick.hasCheckmarkPrePrimary);
    check('Playgroup class appears immediately', afterFirstClick.hasPlaygroup);
    check('Nursery class appears immediately', afterFirstClick.hasNursery);
    check('LKG class appears immediately', afterFirstClick.hasLKG);
    check('UKG class appears immediately', afterFirstClick.hasUKG);

    // ─── Step C: Click Primary → verify union ───────────────────────────────────
    console.log('\n--- Step C: Click Primary (add to Pre-Primary) ---');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      // Find a Primary button that is NOT already selected (no ✓)
      const primaryBtn = buttons.find(
        (b) => b.textContent?.trim() === '+ Primary'
      );
      if (primaryBtn) (primaryBtn as HTMLElement).click();
    });
    await sleep(500);

    const afterPrimaryAdd = await page.evaluate(() => {
      const mainText = document.querySelector('main')?.innerText || '';
      return {
        hasClass1: mainText.includes('Class 1'),
        hasClass5: mainText.includes('Class 5'),
        stillHasPlaygroup: mainText.includes('Playgroup'),
        stillHasUKG: mainText.includes('UKG'),
      };
    });

    check('Class 1 appears after adding Primary', afterPrimaryAdd.hasClass1);
    check('Class 5 appears after adding Primary', afterPrimaryAdd.hasClass5);
    check('Playgroup still present (Pre-Primary still selected)', afterPrimaryAdd.stillHasPlaygroup);
    check('UKG still present (Pre-Primary still selected)', afterPrimaryAdd.stillHasUKG);

    // ─── Step D: Click Pre-Primary again to deselect → verify removal ───────────
    console.log('\n--- Step D: Deselect Pre-Primary ---');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const prePrimaryBtn = buttons.find(
        (b) => b.textContent?.trim() === '✓ Pre-Primary'
      );
      if (prePrimaryBtn) (prePrimaryBtn as HTMLElement).click();
    });
    await sleep(500);

    const afterDeselect = await page.evaluate(() => {
      const mainText = document.querySelector('main')?.innerText || '';
      // Check within class pills area, not the entire page (page may have "Playgroup" elsewhere)
      const classPillArea = document.querySelector('.bg-\\[\\#FAF7F2\\]');
      const pillText = classPillArea?.textContent || '';
      return {
        hasClass1: pillText.includes('Class 1'),
        hasClass5: pillText.includes('Class 5'),
        playgroundGone: !pillText.includes('Playgroup'),
        ukgGone: !pillText.includes('UKG'),
      };
    });

    check('Class 1 remains after deselecting Pre-Primary', afterDeselect.hasClass1);
    check('Class 5 remains after deselecting Pre-Primary', afterDeselect.hasClass5);
    check('Playgroup removed after deselecting Pre-Primary', afterDeselect.playgroundGone);
    check('UKG removed after deselecting Pre-Primary', afterDeselect.ukgGone);

    // ─── Step G: Verify Campus 1 unchanged ──────────────────────────────────────
    console.log('\n--- Step G: Verify Campus 1 unchanged ---');
    // Campus 1's academic scope should be independent
    const campus1State = await page.evaluate(() => {
      // Check if MAIN CAMPUS badge still exists
      const mainText = document.querySelector('main')?.innerText || '';
      return {
        hasMainCampusBadge: mainText.includes('MAIN CAMPUS'),
      };
    });
    check('Campus 1 MAIN CAMPUS badge still present', campus1State.hasMainCampusBadge);

    console.log('\n==============================================================================');
    console.log(`  E2E SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
    console.log('==============================================================================\n');

    if (failCount > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Test error:', err.message);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

runTest();
