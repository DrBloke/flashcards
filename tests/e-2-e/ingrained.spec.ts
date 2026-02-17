import { test, expect } from "@playwright/test";

test.describe("Ingrained Status Display", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/flashcards/test");
    // Clear storage to start fresh
    await page.evaluate(() => localStorage.clear());
  });

  test("Deck list renders correctly when a deck is Ingrained", async ({
    page,
  }) => {
    // defined default schedule length is 8
    // last milestone index = 7
    // session count = 1 -> index 0

    const ingrainedState = {
      test: {
        settings: {}, // uses default schedule
        decks: {
          "01-test-deck": {
            currentRound: 0,
            wrongFirstTime: [],
            cardFontSizes: {},
            learningLog: [
              {
                milestoneIndex: 8, // Ingrained (schedule length is 8)
                sessionIndex: 0,
                startTime: Date.now() - 10000,
                endTime: Date.now(),
                nextReview: null,
                isExtra: false,
                missedCount: 0,
              },
            ],
          },
        },
      },
    };

    await page.evaluate((state) => {
      localStorage.setItem("flashcards-data", JSON.stringify(state));
    }, ingrainedState);

    await page.reload();

    // Check if the deck is listed
    const deckRow = page.locator('tr:has-text("Test Deck 1")');
    await expect(deckRow).toBeVisible();

    // Check for Ingrained badge
    const badge = deckRow.locator('wa-badge[variant="brand"]');
    await expect(badge).toContainText("Ingrained");

    // Check for "Ingrained" milestone dots
    // We expect dots to have class 'ingrained'
    // Just check one
    const ingrainedDot = deckRow.locator(".progress-dot.ingrained").first();
    await expect(ingrainedDot).toBeVisible();
  });

  test("Deck list renders correctly when checking back from an Ingrained extra session", async ({
    page,
  }) => {
    // Simulate returning from an extra session
    const ingrainedExtraState = {
      test: {
        settings: {},
        decks: {
          "01-test-deck": {
            currentRound: 0,
            wrongFirstTime: [],
            cardFontSizes: {},
            learningLog: [
              {
                milestoneIndex: 7,
                sessionIndex: 0,
                startTime: Date.now() - 20000,
                endTime: Date.now() - 10000,
                nextReview: null,
                isExtra: false,
                missedCount: 0,
              },
              {
                milestoneIndex: 7,
                sessionIndex: 0,
                startTime: Date.now() - 5000,
                endTime: Date.now(),
                nextReview: null,
                isExtra: true, // Extra session
                missedCount: 0,
              },
            ],
          },
        },
      },
    };

    await page.evaluate((state) => {
      localStorage.setItem("flashcards-data", JSON.stringify(state));
    }, ingrainedExtraState);

    await page.reload();

    const deckRow = page.locator('tr:has-text("Test Deck 1")');
    await expect(deckRow).toBeVisible();
    const badge = deckRow.locator('wa-badge[variant="brand"]');
    await expect(badge).toContainText("Ingrained");
  });
  test("Deck list renders correctly with custom schedule and Ingrained status", async ({
    page,
  }) => {
    const customSchedule = [
      {
        minTimeSinceLastMilestone: 0,
        numberOfSessions: 1, // Short schedule
        minTimeBetweenSessions: 3600,
        maxTimeBetweenSessions: 10800,
      },
    ];

    const ingrainedState = {
      test: {
        settings: {
          learningSchedule: customSchedule,
        },
        decks: {
          "01-test-deck": {
            currentRound: 0,
            wrongFirstTime: [],
            cardFontSizes: {},
            learningLog: [
              {
                milestoneIndex: 0, // Last one (index 0)
                sessionIndex: 0, // Last session (1-1=0)
                startTime: Date.now() - 10000,
                endTime: Date.now(),
                nextReview: null,
                isExtra: false,
                missedCount: 0,
              },
            ],
          },
        },
      },
    };

    await page.evaluate((state) => {
      localStorage.setItem("flashcards-data", JSON.stringify(state));
    }, ingrainedState);

    await page.reload();

    const deckRow = page.locator('tr:has-text("Test Deck 1")');
    await expect(deckRow).toBeVisible();
    const badge = deckRow.locator('wa-badge[variant="brand"]');
    await expect(badge).toContainText("Ingrained");
  });
});
