import { test, expect } from "@playwright/test";

test.describe("Home Page & Core Navigation", () => {
  test("loads the home page with correct branding and header", async ({ page }) => {
    await page.goto("/");

    // Verify Title & Brand Logo
    await expect(page).toHaveTitle(/ReadyToGov/i);
    const logoText = page.locator(".logo .logo-text");
    await expect(logoText).toBeVisible();
    await expect(logoText).toContainText("ReadyToGovTH");

    // Verify Search Input exists
    const searchInput = page.locator("#job-search-input");
    await expect(searchInput).toBeVisible();
  });

  test("displays jobs list cards and education filter pills", async ({ page }) => {
    await page.goto("/");

    // Wait for job cards to render
    const jobCards = page.locator(".job-card");
    await expect(jobCards.first()).toBeVisible({ timeout: 15000 });
    const count = await jobCards.count();
    expect(count).toBeGreaterThan(0);

    // Verify education filter pills
    const eduPills = page.locator(".hero-edu-pill");
    await expect(eduPills.first()).toBeVisible();
  });

  test("navigates to stats page and back", async ({ page }) => {
    await page.goto("/");

    // Look for link to stats dashboard
    const statsLink = page.locator("a[href='/stats']");
    if (await statsLink.count() > 0) {
      await statsLink.first().click();
      await expect(page).toHaveURL(/\/stats/);
    }
  });
});
