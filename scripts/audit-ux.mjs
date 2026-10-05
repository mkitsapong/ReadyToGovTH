import { chromium } from '@playwright/test';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/kitsa/.gemini/antigravity-ide/brain/74fc7c41-92dd-4e25-a5c5-8696e6d46c71';

async function runAudit() {
  const browser = await chromium.launch({ headless: true });

  // 1. Desktop Audit (1280x850)
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 850 },
    deviceScaleFactor: 1,
  });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await desktopPage.waitForSelector('.job-card:not(.skeleton-card)', { timeout: 15000 });

  // Dismiss cookies
  const acceptCookie = desktopPage.locator('button:has-text("ยอมรับทั้งหมด")');
  if (await acceptCookie.isVisible()) {
    await acceptCookie.click();
    await desktopPage.waitForTimeout(200);
  }

  // Capture Desktop Home (Light Mode)
  await desktopPage.screenshot({
    path: path.join(ARTIFACT_DIR, 'desktop_home_light.png'),
    fullPage: false,
  });

  // Test Search
  const searchInput = desktopPage.locator('#job-search-input');
  await searchInput.fill('ชลประทาน');
  await desktopPage.waitForTimeout(400);
  await desktopPage.screenshot({
    path: path.join(ARTIFACT_DIR, 'desktop_search_result.png'),
    fullPage: false,
  });
  await searchInput.clear();
  await desktopPage.waitForTimeout(300);

  // Open Job Detail
  const detailBtn = desktopPage.locator('.job-card:not(.skeleton-card) .btn-detail-modern').first();
  await detailBtn.click();
  await desktopPage.waitForSelector('.detail-smart-table, .detail-table-wrapper, .detail-position-list', { timeout: 10000 });
  await desktopPage.waitForTimeout(400);
  await desktopPage.screenshot({
    path: path.join(ARTIFACT_DIR, 'desktop_job_detail.png'),
    fullPage: false,
  });

  // Go back to home & Toggle Dark Mode
  await desktopPage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await desktopPage.waitForSelector('.job-card:not(.skeleton-card)', { timeout: 15000 });
  const themeToggle = desktopPage.locator('.desktop-theme-switch').first();
  if (await themeToggle.isVisible()) {
    await themeToggle.click();
    await desktopPage.waitForTimeout(300);
    await desktopPage.screenshot({
      path: path.join(ARTIFACT_DIR, 'desktop_home_dark.png'),
      fullPage: false,
    });
  }

  // 2. Mobile Audit (390x844)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await mobilePage.waitForSelector('.job-card:not(.skeleton-card)', { timeout: 15000 });

  // Dismiss cookies
  const mobAcceptCookie = mobilePage.locator('button:has-text("ยอมรับทั้งหมด")');
  if (await mobAcceptCookie.isVisible()) {
    await mobAcceptCookie.click();
    await mobilePage.waitForTimeout(200);
  }

  await mobilePage.screenshot({
    path: path.join(ARTIFACT_DIR, 'mobile_home_light.png'),
    fullPage: false,
  });

  // Open Mobile Detail
  const mobDetailBtn = mobilePage.locator('.job-card:not(.skeleton-card) .btn-detail-modern').first();
  if (await mobDetailBtn.isVisible()) {
    await mobDetailBtn.click();
    await mobilePage.waitForSelector('.detail-position-list, .detail-pos-card, .job-dept-name-title', { timeout: 10000 });
    await mobilePage.waitForTimeout(400);
    await mobilePage.screenshot({
      path: path.join(ARTIFACT_DIR, 'mobile_job_detail.png'),
      fullPage: false,
    });
  }

  await browser.close();
  console.log('Screenshots re-captured successfully without cookie overlay.');
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
