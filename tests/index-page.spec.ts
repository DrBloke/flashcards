import { test, expect } from "@playwright/test";

test("Can navigate to test deck", async ({ page }) => {
  await page.goto("/flashcards/test");

  // Navigation to test deck is present
  const link = page.getByRole("link", { name: "Test Deck 1" });
  await expect(link).toBeVisible();

  // Click the link
  await link.click();

  // Naviagation takes effect
  await expect(page).toHaveURL("/flashcards/test/01-test-deck");
});
