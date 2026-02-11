import { test, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

test("Index page is accessible and showing the decks", async ({ page }) => {
  await page.goto("/flashcards/test");
  await expect(page).toHaveTitle("Test Decks");
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

  expect(accessibilityScanResults.violations).toEqual([]);

  // Navigation to test deck is present
  const link = page.getByRole("link", { name: "Test Deck 1" });
  await expect(link).toBeVisible();
  // Click the link
  await link.click();

  // Naviagation takes effect
  await expect(page).toHaveURL("/flashcards/test/01-test-deck");
  await expect(page).toHaveTitle("Test Deck 1");
});
