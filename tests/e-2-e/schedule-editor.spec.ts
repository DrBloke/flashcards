import { test, expect } from "@playwright/test";

test.describe("Schedule Editor", () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test to have a clean slate
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
  });

  test("First milestone wait time should be disabled and set to 0", async ({
    page,
  }) => {
    // Navigate to the test set page
    await page.goto("/flashcards/test");

    // Open the "Settings" details first
    await page.locator('wa-details[summary="Settings"]').click();

    // Open the "Review Schedule" details inside Settings
    await page.locator('wa-details[summary="Review Schedule"]').click();

    // Verify the first milestone's wait time input
    const firstMilestoneInput = page.locator(
      'wa-input[data-field-key="0-minTimeSinceLastMilestone"]',
    );

    // It should be visible
    await expect(firstMilestoneInput).toBeVisible();

    // It should be disabled
    await expect(firstMilestoneInput).toBeDisabled();

    // It should have value "0s" (assuming default schedule is loaded)
    // The Default schedule has 0 for first milestone.
    // _getValue formats 0 as "0s" via formatDuration?
    // Let's check formatDuration behavior or just check value property.
    // formatDuration(0) likely returns "0s".
    await expect(firstMilestoneInput).toHaveValue("0s");

    // Verify the second milestone's wait time input is NOT disabled
    const secondMilestoneInput = page.locator(
      'wa-input[data-field-key="1-minTimeSinceLastMilestone"]',
    );
    await expect(secondMilestoneInput).toBeVisible();
    await expect(secondMilestoneInput).not.toBeDisabled();
  });
});
