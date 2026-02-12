import { test, expect } from "@playwright/test";

test.describe("Deck List Tooltips", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/flashcards/test");
  });

  test("Milestones column shows all milestone descriptions in a tooltip", async ({
    page,
  }) => {
    const milestonesBtn = page
      .locator('button[id^="milestones-info-"]')
      .first();
    await expect(milestonesBtn).toBeVisible();

    // Hover over the button
    await milestonesBtn.hover();

    const tooltipId = await milestonesBtn.getAttribute("id");
    const tooltip = page.locator(`wa-tooltip[for="${tooltipId}"]`);

    // Use toHaveAttribute instead of toBeVisible if visibility check is flaky with Web Awesome
    await expect(tooltip).toHaveAttribute("open", "");

    // Check that it contains multiple milestone descriptions
    await expect(tooltip).toContainText("Milestone 1");
    await expect(tooltip).toContainText("Milestone 2");
    await expect(tooltip).toContainText("sessions");
  });

  test("Current Milestone column still shows its specific description tooltip", async ({
    page,
  }) => {
    // Correctly filter out the milestones info buttons
    const sessionBtn = page
      .locator('button.info-button:not([id^="milestones-info-"])')
      .first();

    await expect(sessionBtn).toBeVisible();

    // Hover over the button
    await sessionBtn.hover();

    const tooltipId = await sessionBtn.getAttribute("id");
    const tooltip = page.locator(`wa-tooltip[for="${tooltipId}"]`);

    await expect(tooltip).toHaveAttribute("open", "");

    // It should contain session info
    await expect(tooltip).toContainText("session");
  });
});
