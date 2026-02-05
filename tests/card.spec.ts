import { test, expect, type Locator } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

async function switchIsOn(locator: Locator): Promise<boolean> {
  return await locator.evaluate(
    (node: HTMLElement) => (node as HTMLElement & { checked: boolean }).checked,
  );
}

test.describe("Flashcard deck", () => {
  let cardContent: Locator;
  let cardsProgress: Locator;
  let roundsProgress: Locator;

  test.beforeEach(async ({ page }) => {
    cardContent = page.locator("#content");
    cardsProgress = page.locator(".cards-progress");
    roundsProgress = page.locator(".rounds-progress");
  });

  test("Card navigation and interaction", async ({ page }) => {
    // Go to the index page
    await page.goto("/flashcards/test");
    await expect(page).toHaveTitle("Test Decks");

    // Make sure shuffle is set to false
    const shuffleSwitch = page.locator("#shuffle-deck-switch");
    if (await switchIsOn(shuffleSwitch)) {
      await shuffleSwitch.click();
    }

    // Make sure reverse deck is set to false
    const reverseSwitch = page.locator("#reverse-deck-switch");
    if (await switchIsOn(reverseSwitch)) {
      await reverseSwitch.click();
    }

    // Click through to deck 1
    await page.getByRole("link", { name: "Test Deck 1" }).click();
    await page.getByRole("button", { name: "Start Group" }).click();

    // Once loaded, assert the accessibility of the card
    await expect(page).toHaveTitle("Test Deck 1");
    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(["landmark-one-main", "region"])
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);

    // Assert "Side 1" is visible as the card text
    await expect(cardContent).toContainText("Side 1");

    // Assert the deck title is shown
    await expect(
      page.getByRole("heading", { name: "Test Deck 1" }),
    ).toBeVisible();

    // Click flip
    await page.locator("#flip").click();

    // Assert card text is now "Side 2"
    await expect(cardContent).toContainText("Side 2");

    // Assert card is still accessible
    const accessibilityScanResults2 = await new AxeBuilder({ page })
      .disableRules(["landmark-one-main", "region"])
      .analyze();
    expect(accessibilityScanResults2.violations).toEqual([]);

    // Assert Cards is 0/2 and Round is 1/3
    await expect(cardsProgress).toContainText("Cards: 0/2");
    await expect(roundsProgress).toContainText("Round: 1/3");

    // Click correct
    await page.locator("#correct").click();

    // Assert goes to next card and now Cards is 1/2 and Round 1/3
    await expect(cardContent).toContainText("Basic markdown");
    await expect(cardsProgress).toContainText("Cards: 1/2");
    await expect(roundsProgress).toContainText("Round: 1/3");

    // Flip the next card and mark as correct
    await page.locator("#flip").click();
    await expect(cardContent).toContainText("Header");
    await page.locator("#correct").click();

    // Assert that Deck completed message is shown
    await expect(page.locator(".completed-content")).toBeVisible();
    await expect(page.locator(".completed-content")).toContainText("Mastered");
    await expect(page.locator(".completed-stats")).toContainText("Time spent:");

    // Click back to home
    await page.locator("#back-to-home").click();
    await expect(page).toHaveURL(/\/flashcards\/test$/);
  });

  test("Card filtering in multiple rounds", async ({ page }) => {
    // Go to the index page
    await page.goto("/flashcards/test");

    // Make sure shuffle is set to false
    const shuffleSwitch = page.locator("#shuffle-deck-switch");
    if (await switchIsOn(shuffleSwitch)) {
      await shuffleSwitch.click();
    }

    // Make sure reverse deck is set to false
    const reverseSwitch = page.locator("#reverse-deck-switch");
    if (await switchIsOn(reverseSwitch)) {
      await reverseSwitch.click();
    }

    // Click through to deck 1
    await page.getByRole("link", { name: "Test Deck 1" }).click();
    await expect(page).toHaveTitle("Test Deck 1");
    await page.getByRole("button", { name: "Start Group" }).click();

    // Round 1 - Card 1: Mark Incorrect
    await expect(cardContent).toContainText("Side 1");
    await page.locator("#flip").click();
    await page.locator("#incorrect").click();

    // Round 1 - Card 2: Mark Correct
    await expect(cardContent).toContainText("Basic markdown");
    await page.locator("#flip").click();
    await page.locator("#correct").click();

    // Round 1 - Card 1 (returns): Mark Correct
    await expect(cardContent).toContainText("Side 1");
    await page.locator("#flip").click();
    await page.locator("#correct").click();

    // Round 2 - Should only contain Card 1
    await expect(roundsProgress).toContainText("Round: 2/3");
    await expect(cardsProgress).toContainText("Cards: 0/1");
    await expect(cardContent).toContainText("Side 1");

    // Mark Card 1 Correct
    await page.locator("#flip").click();
    await page.locator("#correct").click();

    // Round 3 - Should only contain Card 1
    await expect(roundsProgress).toContainText("Round: 3/3");
    await expect(cardsProgress).toContainText("Cards: 0/1");
    await expect(cardContent).toContainText("Side 1");

    // Mark Card 1 Correct
    await page.locator("#flip").click();
    await page.locator("#correct").click();

    // Assert completion
    await expect(page.locator(".completed-content")).toBeVisible();
    await expect(page.locator(".completed-stats")).toContainText("Score: 50%");
    await expect(page.locator(".completed-stats")).toContainText("Time spent:");
    await expect(page.locator(".completed-stats")).toContainText(
      "Cards to focus on: 1",
    );
    await page.locator("#back-to-home").click();
    await expect(page).toHaveURL(/\/flashcards\/test$/);
  });

  test("Markdown rendering", async ({ page }) => {
    // Go to the index page
    await page.goto("/flashcards/test");

    // Click through to deck 1
    await page.getByRole("link", { name: "Test Deck 1" }).click();
    await expect(page).toHaveTitle("Test Deck 1");
    await page.getByRole("button", { name: "Start Group" }).click();

    // Move to second card (which has markdown)
    await page.locator("#flip").click();
    await page.locator("#correct").click();

    // Assert side 1 of second card
    await expect(cardContent).toContainText("Basic markdown");

    // Flip to side 2
    await page.locator("#flip").click();

    // Assert side 2 has rendered markdown (header and paragraph)
    const header = cardContent.locator("h2");
    await expect(header).toBeVisible();
    await expect(header).toHaveText("Header");

    const paragraph = cardContent.locator("p");
    await expect(paragraph).toContainText("This is a paragraph.");
  });

  test("Restarting a completed deck", async ({ page }) => {
    // Go to the index page
    await page.goto("/flashcards/test");

    // Click through to deck 1
    await page.getByRole("link", { name: "Test Deck 1" }).click();
    await expect(page).toHaveTitle("Test Deck 1");
    await page.getByRole("button", { name: "Start Group" }).click();

    // Round 1: Mark Card 1 incorrect, Card 2 correct
    await page.locator("#flip").click();
    await page.locator("#incorrect").click(); // Card 1 incorrect
    await page.locator("#flip").click();
    await page.locator("#correct").click(); // Card 2 correct

    // Finish Round 1: Card 1 correct
    await page.locator("#flip").click();
    await page.locator("#correct").click();

    // Round 2: Mark Card 1 correct
    await page.locator("#flip").click();
    await page.locator("#correct").click();

    // Round 3: Mark Card 1 correct
    await page.locator("#flip").click();
    await page.locator("#correct").click();

    // Assert completion screen is shown
    await expect(page.locator(".completed-content")).toBeVisible();

    // Go back to home
    await page.locator("#back-to-home").click();
    await expect(page).toHaveURL(/\/flashcards\/test$/);

    // Enter the same deck again
    await page.getByRole("link", { name: "Test Deck 1" }).click();
    await expect(page).toHaveTitle("Test Deck 1");

    // It should start a new session (Round 1, "Side 1" visible).
    await expect(page.locator(".completed-content")).toContainText(
      "Not due yet",
    );
    await expect(
      page.getByRole("button", { name: "Study All Cards" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Study Struggling Only (1)" }),
    ).toBeVisible();

    // Study All Words - Should now have 2 cards (deck cards)
    await page.getByRole("button", { name: "Study All Cards" }).click();
    await expect(page.locator(".cards-progress")).toContainText("Cards: 0/2");
    await expect(page.locator(".rounds-progress")).toContainText("Round: 1/3");

    // Complete session (all correct this time)
    // Round 1 (2 cards)
    for (let i = 0; i < 2; i++) {
      await page.locator("#flip").click();
      await page.locator("#correct").click();
    }
    // Round 2 (1 card - the persistent stumble)
    await page.locator("#flip").click();
    await page.locator("#correct").click();
    // Round 3 (1 card - the persistent stumble)
    await page.locator("#flip").click();
    await page.locator("#correct").click();

    // Since everything was correct in this session, but Card 1 was a stumble in history
    // the score will be 50% (1/2) because stumbles are not cleared in extra sessions.
    await expect(page.locator(".completed-content")).toBeVisible();
    await expect(page.locator(".completed-title")).toContainText(
      "Deck Completed",
    );
    await expect(page.locator(".completed-stats")).toContainText("Score: 50%");
    await expect(page.locator(".completed-stats")).toContainText(
      "Cards to focus on: 1",
    );

    await page.locator("#back-to-home").click();
    await expect(page).toHaveURL(/\/flashcards\/test$/);
  });
});
