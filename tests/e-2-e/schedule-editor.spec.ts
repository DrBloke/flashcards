import { test, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

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
    await expect(firstMilestoneInput).toHaveAttribute("disabled", "");

    // Verify the second milestone's wait time input is NOT disabled
    const secondMilestoneInput = page.locator(
      'wa-input[data-field-key="1-minTimeSinceLastMilestone"]',
    );
    await expect(secondMilestoneInput).toBeVisible();
    await expect(secondMilestoneInput).not.toBeDisabled();
  });

  test("Valid input changes update local storage and show success message", async ({
    page,
  }) => {
    await page.goto("/flashcards/test");
    await page.locator('wa-details[summary="Settings"]').click();
    await page.locator('wa-details[summary="Review Schedule"]').click();

    // Change the second milestone's wait time to "2d"
    const input = page.locator(
      'wa-input[data-field-key="1-minTimeSinceLastMilestone"]',
    );
    await input.locator("input").fill("2d");
    await input.blur();

    // Click Save
    await page.getByRole("button", { name: "Save Schedule" }).click();

    // Confirm the save dialog
    await page.getByRole("button", { name: "Confirm" }).click();

    // Verify success message
    await expect(page.getByText("Schedule saved successfully")).toBeVisible({
      timeout: 10000,
    });

    // Verify localStorage
    const storedData = await page.evaluate(() => {
      const raw = localStorage.getItem("flashcards-data");
      return raw ? JSON.parse(raw) : null;
    });

    const schedule = storedData["test"].settings.learningSchedule;
    // 2d = 2 * 24 * 60 * 60 = 172800 seconds
    expect(schedule[1].minTimeSinceLastMilestone).toBe(172800);
  });

  test("Error message is returned for invalid input", async ({ page }) => {
    await page.goto("/flashcards/test");
    await page.locator('wa-details[summary="Settings"]').click();
    await page.locator('wa-details[summary="Review Schedule"]').click();

    // Enter invalid time
    const input = page.locator(
      'wa-input[data-field-key="1-minTimeSinceLastMilestone"]',
    );
    await input.locator("input").fill("invalid-time");
    await input.blur();

    // Expect inline error message
    // The component shows error message with "Invalid time format" text
    await expect(page.getByText("Invalid time format")).toBeVisible();

    // Try to save
    await page.getByRole("button", { name: "Save Schedule" }).click();

    // Expect error dialog to be visible (it has id="error-dialog")
    // Note: wa-dialog uses open attribute or internal state. We can check visibility of the text inside it.
    await expect(
      page.getByText("Please fix the following validation errors"),
    ).toBeVisible();
  });

  test("Accessibility and HTML Validity check", async ({ page }) => {
    // 1. Check with default state
    await page.goto("/flashcards/test");
    await page.locator('wa-details[summary="Settings"]').click();
    await page.locator('wa-details[summary="Review Schedule"]').click();

    // Run Axe scan
    // We expect no violations, which covers duplicate IDs as well
    // Exclude landmark-unique because wa-details uses aria-labelledby internally in a way that Axe dislikes
    const defaultScan = await new AxeBuilder({ page })
      .disableRules("landmark-unique")
      .analyze();
    expect(defaultScan.violations).toEqual([]);

    // 2. Check with invalid input state (to ensure error messaging is accessible)
    const input = page.locator(
      'wa-input[data-field-key="1-minTimeSinceLastMilestone"]',
    );
    await input.locator("input").fill("invalid-time");
    await input.blur();

    // Wait for error message to appear
    await expect(page.getByText("Invalid time format")).toBeVisible();

    // Run Axe scan again in error state
    const errorScan = await new AxeBuilder({ page })
      .disableRules("landmark-unique")
      .analyze();
    expect(errorScan.violations).toEqual([]);

    // Verify invalid input marking (attribute check)
    // The component sets 'data-invalid' attribute on wa-input
    await expect(input).toHaveAttribute("data-invalid");
  });
});
