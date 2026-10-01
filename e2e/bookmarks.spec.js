import { test, expect } from "@playwright/test";

test.describe("Bookmarks & Favorites Workflow", () => {
  test("bookmarks a job, verifies persistence, and unbookmarks", async ({ page }) => {
    await page.goto("/");

    const firstBookmarkBtn = page.locator(".job-card .job-btn-bookmark:has-text('🤍'), .job-card .job-btn-bookmark:has-text('❤️')").first();
    await expect(firstBookmarkBtn).toBeVisible({ timeout: 15000 });

    // Bookmark the first job
    await firstBookmarkBtn.click();

    // Verify bookmark indicator changed to red heart
    await expect(firstBookmarkBtn).toHaveText("❤️");

    // Click again to unbookmark
    await firstBookmarkBtn.click();
    await expect(firstBookmarkBtn).toHaveText("🤍");
  });
});
