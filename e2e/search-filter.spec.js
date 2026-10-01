import { test, expect } from "@playwright/test";

test.describe("Full-Text & Fuzzy Search", () => {
  test("searches jobs by department keyword", async ({ page }) => {
    await page.goto("/");

    const searchInput = page.locator("#job-search-input");
    await expect(searchInput).toBeVisible();

    // Type real active keyword into search bar
    await searchInput.fill("โรงพยาบาล");
    await page.waitForTimeout(600); // Allow debounce

    // Verify filtered results
    const jobCards = page.locator(".job-card");
    await expect(jobCards.first()).toBeVisible({ timeout: 10000 });
    const count = await jobCards.count();
    expect(count).toBeGreaterThan(0);

    const firstDept = await page.locator(".job-card .job-dept-name-title").first().textContent();
    expect(firstDept).toContain("โรงพยาบาล");
  });

  test("supports typo tolerance fuzzy search in Thai", async ({ page }) => {
    await page.goto("/");

    const searchInput = page.locator("#job-search-input");
    await searchInput.fill("ธุระการ"); // Intentional typo of ธุรการ
    await page.waitForTimeout(600);

    const jobCards = page.locator(".job-card");
    const count = await jobCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("clears search query and restores full job listings", async ({ page }) => {
    await page.goto("/");

    const searchInput = page.locator("#job-search-input");
    await searchInput.fill("โรงพยาบาล");
    await page.waitForTimeout(600);
    const filteredCount = await page.locator(".job-card").count();

    // Clear search
    await searchInput.fill("");
    await page.waitForTimeout(600);
    const restoredCount = await page.locator(".job-card").count();

    expect(restoredCount).toBeGreaterThanOrEqual(filteredCount);
  });
});
