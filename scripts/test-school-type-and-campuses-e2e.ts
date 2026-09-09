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
  console.log('  BROWSER E2E TEST: SCHOOL TYPE & CAMPUS CONSISTENCY');
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

    // ─── 1. Header Campus Count & Location Clarity ─────────────────────────────
    console.log('--- 1. Header Campus Count & Identity Verification ---');
    const headerInfo = await page.evaluate(() => {
      const headerText = document.querySelector('header')?.innerText || '';
      return {
        hasCampusesCount: /•\s*\d+\s*Campus(es)?/i.test(headerText),
        headerText,
      };
    });

    check('Header displays dynamic campus count badge', headerInfo.hasCampusesCount);

    // ─── 2. School Type to Class Range Synchronization in UI ───────────────────
    console.log('\n--- 2. School Type Selector & Class Range ---');
    const schoolTypeFound = await page.evaluate(() => {
      const select = document.querySelector('select[name="schoolType"]') as HTMLSelectElement ||
                     Array.from(document.querySelectorAll('select')).find(s =>
                       Array.from(s.options).some(o => o.text.includes('K-12') || o.text.includes('Play School'))
                     );
      if (!select) return null;
      return {
        currentValue: select.value,
        options: Array.from(select.options).map(o => o.text),
      };
    });

    check('School Type dropdown found with options', Boolean(schoolTypeFound && schoolTypeFound.options.length > 3));

    // ─── 3. Section 2: Campus Facilities & Isolation ───────────────────────────
    console.log('\n--- 3. Section 2: Campuses Isolation & Badges ---');
    // Jump to Section 2 (Campuses)
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('aside button, nav button'));
      const campusBtn = buttons.find(b => b.textContent?.toLowerCase().includes('campus'));
      if (campusBtn) (campusBtn as HTMLElement).click();
    });
    await sleep(1500);

    const campusBadges = await page.evaluate(() => {
      const text = document.querySelector('main')?.innerText || '';
      const hasMainCampusBadge = text.includes('MAIN CAMPUS');
      const hasAddCampusButton = Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes('Add Campus'));
      return { hasMainCampusBadge, hasAddCampusButton };
    });

    check('Campus 1 displays MAIN CAMPUS badge', campusBadges.hasMainCampusBadge);
    check('Add Campus button exists', campusBadges.hasAddCampusButton);

    // Click Add Campus
    await page.evaluate(() => {
      const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Add Campus'));
      if (addBtn) (addBtn as HTMLElement).click();
    });
    await sleep(1500);

    const multiCampusState = await page.evaluate(() => {
      const mainText = document.querySelector('main')?.innerText || '';
      const headerText = document.querySelector('header')?.innerText || '';
      const hasCampus2Badge = mainText.includes('CAMPUS 2');
      const hasAdditionalCampusLabel = mainText.includes('Additional Campus');
      const headerHas2Campuses = /•\s*2\s*Campuses/i.test(headerText);
      const headerHasMainCampusLabel = headerText.includes('(Main Campus)');

      return {
        hasCampus2Badge,
        hasAdditionalCampusLabel,
        headerHas2Campuses,
        headerHasMainCampusLabel,
      };
    });

    check('Campus 2 displays CAMPUS 2 badge', multiCampusState.hasCampus2Badge);
    check('Campus 2 displays Additional Campus subtitle', multiCampusState.hasAdditionalCampusLabel);
    check('Header updates to "• 2 Campuses"', multiCampusState.headerHas2Campuses);
    check('Header location updates to include "(Main Campus)"', multiCampusState.headerHasMainCampusLabel);

    // ─── 4. Section 6: School Content Highlights Dynamic Reflection ────────────
    console.log('\n--- 4. Section 6: School Content Highlights Verification ---');
    // Navigate to School Content section
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('aside button, nav button'));
      const contentBtn = buttons.find(b => b.textContent?.toLowerCase().includes('content') || b.textContent?.toLowerCase().includes('story'));
      if (contentBtn) (contentBtn as HTMLElement).click();
    });
    await sleep(1500);

    const contentHighlights = await page.evaluate(() => {
      const text = document.querySelector('main')?.innerText || '';
      const hasClassesHighlight = text.includes('Classes') || text.includes('CLASSES');
      return { hasClassesHighlight, textLength: text.length };
    });

    check('School Content section loaded with Highlights card', contentHighlights.hasClassesHighlight);

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
