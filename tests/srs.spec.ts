import { test, expect } from "@playwright/test";

test.describe("Spaced Repetition and Learning Log", () => {
  // We use clock to control time for SRS tests
  test.use({ clock: true });

  test.beforeEach(async ({ page }) => {
    // Clear storage before each test to have a clean slate
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
  });

  test("should record a session in the learning log and set next review time", async ({
    page,
  }) => {
    const startTime = new Date("2026-02-02T10:00:00Z");
    await page.clock.setFixedTime(startTime);

    // Set totalRounds to 1 for faster testing
    await page.addInitScript(() => {
      const data = {
        test: {
          settings: { totalRounds: 1 },
          decks: {},
        },
      };
      window.localStorage.setItem("flashcards-data", JSON.stringify(data));
    });

    // Go to the deck page
    await page.goto("/flashcards/test/01-test-deck");
    await expect(page).toHaveTitle("Test Deck 1");

    await page.getByRole("button", { name: "Start Group" }).click();

    // Start interacting (start time is recorded on first interaction)
    // Round 1 - Card 1 (Correct)
    await page.locator("#flip").click();
    await page.locator("#correct").click();

    // Round 1 - Card 2 (Correct)
    await page.locator("#flip").click();
    await page.locator("#correct").click();

    // Should be completed
    await expect(page.locator(".completed-content")).toBeVisible();
    await expect(page.locator(".completed-title")).toContainText("Mastered!");

    // Verify localStorage has the log entry
    const storage = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem("flashcards-data") || "{}");
    });

    const log = storage["test"]?.decks?.["01-test-deck"]?.learningLog;
    expect(log).toBeDefined();
    expect(log.length).toBe(1);
    expect(log[0].sessionGroupIndex).toBe(0);
    expect(log[0].sessionIndex).toBe(0);
    expect(log[0].missedCount).toBe(0);

    // Next review for Group 0 Session 0 should be 1 hour later (3600s)
    const expectedNextReview = log[0].endTime + 3600 * 1000;
    expect(log[0].nextReview).toBe(expectedNextReview);
  });

  test("should show 'Not due yet' screen when trying to study early", async ({
    page,
  }) => {
    const now = new Date("2026-02-02T10:00:00Z").getTime();
    await page.clock.setFixedTime(now);

    // Pre-populate storage with a completed session from 10 mins ago
    const tenMinsAgo = now - 10 * 60 * 1000;
    const nextReview = tenMinsAgo + 3600 * 1000; // Due in 50 mins

    const initialData = {
      test: {
        settings: { totalRounds: 1 },
        decks: {
          "01-test-deck": {
            currentRound: 0,
            wrongFirstTime: [],
            learningLog: [
              {
                sessionGroupIndex: 0,
                sessionIndex: 0,
                startTime: tenMinsAgo - 60000,
                endTime: tenMinsAgo,
                nextReview: nextReview,
                missedCount: 0,
              },
            ],
          },
        },
      },
    };

    await page.addInitScript((data) => {
      window.localStorage.setItem("flashcards-data", JSON.stringify(data));
    }, initialData);

    await page.goto("/flashcards/test/01-test-deck");

    await expect(page.locator(".completed-title")).toContainText("Not due yet");

    // Verify choice buttons are present
    await expect(
      page.getByRole("button", { name: "Study All Cards" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Come Back Later" }),
    ).toBeVisible();
  });

  test("should allow studying early via 'Study All Cards'", async ({
    page,
  }) => {
    const now = new Date("2026-02-02T10:00:00Z").getTime();
    await page.clock.setFixedTime(now);

    const initialData = {
      test: {
        settings: { totalRounds: 1 },
        decks: {
          "01-test-deck": {
            currentRound: 0,
            wrongFirstTime: [1], // One card missed previously
            learningLog: [
              {
                sessionGroupIndex: 0,
                sessionIndex: 0,
                startTime: now - 120000,
                endTime: now - 60000,
                nextReview: now + 3600000,
                missedCount: 1,
              },
            ],
          },
        },
      },
    };

    await page.addInitScript((data) => {
      window.localStorage.setItem("flashcards-data", JSON.stringify(data));
    }, initialData);

    await page.goto("/flashcards/test/01-test-deck");
    await expect(page.locator(".completed-title")).toContainText("Not due yet");

    // Click Study All
    await page.getByRole("button", { name: "Study All Cards" }).click();
    await page.locator("#flip").waitFor();

    // Should start session with all cards (2 deck cards)
    await expect(page.locator(".cards-progress")).toContainText(
      /Cards:\s+0\/2/,
    );

    // Complete session
    await page.locator("#flip").click();
    await page.locator("#correct").click();
    await page.locator("#flip").click();
    await page.locator("#correct").click();

    await expect(page.locator(".completed-content")).toBeVisible();

    const storage = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem("flashcards-data") || "{}");
    });

    const log = storage["test"]?.decks?.["01-test-deck"]?.learningLog;
    expect(log.length).toBe(2);
    expect(log[1].isExtra).toBe(true);
  });

  test("should allow studying only missed cards when early", async ({
    page,
  }) => {
    const now = new Date("2026-02-02T10:00:00Z").getTime();
    await page.clock.setFixedTime(now);

    const initialData = {
      test: {
        settings: { totalRounds: 1 },
        decks: {
          "01-test-deck": {
            currentRound: 0,
            wrongFirstTime: [1], // Card 1 missed previously
            learningLog: [
              {
                sessionGroupIndex: 0,
                sessionIndex: 0,
                startTime: now - 120000,
                endTime: now - 60000,
                nextReview: now + 3600000,
                missedCount: 1,
              },
            ],
          },
        },
      },
    };

    await page.addInitScript((data) => {
      window.localStorage.setItem("flashcards-data", JSON.stringify(data));
    }, initialData);

    await page.goto("/flashcards/test/01-test-deck");

    // Click Study Struggling Only
    await page.getByRole("button", { name: /Study Struggling Only/ }).click();

    // Should only have 1 card (Card 1)
    await expect(page.locator(".cards-progress")).toContainText(
      /Cards:\s+0\/1/,
    );

    // Complete it
    await page.locator("#flip").click();
    await page.locator("#correct").click();

    await expect(page.locator(".completed-content")).toBeVisible();
    // In extra session, stumbles are NOT removed, so score reflects remaining stumbles (1/2 = 50%)
    await expect(page.locator(".completed-stats")).toContainText("Score: 50%");
  });

  test("should progress to next session index within a group", async ({
    page,
  }) => {
    const now = new Date("2026-02-02T10:00:00Z").getTime();
    await page.clock.setFixedTime(now);

    const initialData = {
      test: {
        settings: { totalRounds: 1 },
        decks: {
          "01-test-deck": {
            currentRound: 0,
            wrongFirstTime: [],
            learningLog: [
              {
                sessionGroupIndex: 0,
                sessionIndex: 0, // Finished session 0
                startTime: now - 7200000, // 2 hours ago
                endTime: now - 7000000,
                nextReview: now - 3600000, // Due 1 hour ago
                missedCount: 0,
              },
            ],
          },
        },
      },
    };

    await page.addInitScript((data) => {
      window.localStorage.setItem("flashcards-data", JSON.stringify(data));
    }, initialData);

    await page.goto("/flashcards/test/01-test-deck");

    await page.getByRole("button", { name: "Start Session" }).click();

    // Complete session
    await page.locator("#flip").click();
    await page.locator("#correct").click();
    await page.locator("#flip").click();
    await page.locator("#correct").click();
    await expect(page.locator(".completed-content")).toBeVisible();

    const storage = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem("flashcards-data") || "{}");
    });

    const log = storage["test"]?.decks?.["01-test-deck"]?.learningLog;
    expect(log[1].sessionIndex).toBe(1); // Progressed to session 1
  });

  test("should progress to next group after mastering all sessions in a group", async ({
    page,
  }) => {
    const now = new Date("2026-02-02T10:00:00Z").getTime();
    await page.clock.setFixedTime(now);

    const initialData = {
      test: {
        settings: { totalRounds: 1 },
        decks: {
          "01-test-deck": {
            currentRound: 0,
            wrongFirstTime: [],
            learningLog: [
              {
                sessionGroupIndex: 0,
                sessionIndex: 4,
                startTime: 0,
                endTime: 1000,
                nextReview: now - 1000,
                missedCount: 0,
              },
            ],
          },
        },
      },
    };

    await page.addInitScript((data) => {
      window.localStorage.setItem("flashcards-data", JSON.stringify(data));
    }, initialData);

    await page.goto("/flashcards/test/01-test-deck");

    await page.getByRole("button", { name: "Start Group" }).click();
    await page.locator("#flip").waitFor();

    // Complete session
    await page.locator("#flip").click();
    await page.locator("#correct").click();
    await page.locator("#flip").click();
    await page.locator("#correct").click();
    await expect(page.locator(".completed-content")).toBeVisible();

    const storage = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem("flashcards-data") || "{}");
    });

    const log = storage["test"]?.decks?.["01-test-deck"]?.learningLog;
    expect(log[1].sessionGroupIndex).toBe(1);
    expect(log[1].sessionIndex).toBe(0);
  });

  test("should show demotion options if score is low at end of group", async ({
    page,
  }) => {
    const now = new Date("2026-02-02T10:00:00Z").getTime();
    await page.clock.setFixedTime(now);

    const initialData = {
      test: {
        settings: { totalRounds: 1 }, // Important: set to 1 to finish immediately
        decks: {
          "01-test-deck": {
            currentRound: 0,
            wrongFirstTime: [],
            learningLog: [
              {
                sessionGroupIndex: 1,
                sessionIndex: 1,
                startTime: 0,
                endTime: 1000,
                nextReview: now - 1000,
                missedCount: 0,
              },
            ],
          },
        },
      },
    };

    await page.addInitScript((data) => {
      window.localStorage.setItem("flashcards-data", JSON.stringify(data));
    }, initialData);

    await page.goto("/flashcards/test/01-test-deck");

    await page.getByRole("button", { name: "Start Session" }).click();
    await page.locator("#flip").waitFor();

    // Fail all cards
    await page.locator("#flip").click();
    await page.locator("#incorrect").click();
    await page.locator("#flip").click();
    await page.locator("#incorrect").click();

    // Now they are at the end of the round, mark them correct to finish
    await page.locator("#flip").click();
    await page.locator("#correct").click();
    await page.locator("#flip").click();
    await page.locator("#correct").click();

    await expect(page.locator(".completed-content")).toBeVisible();
    await expect(page.locator(".demotion-choices")).toBeVisible();
    await expect(page.locator(".demotion-choices")).toContainText(
      "Your score was low",
    );
  });

  test("should show next review time on completion screen", async ({
    page,
  }) => {
    const startTime = new Date("2026-02-02T10:00:00Z");
    await page.clock.setFixedTime(startTime);

    // Set totalRounds to 1 for faster testing
    await page.addInitScript(() => {
      const data = {
        test: {
          settings: { totalRounds: 1 },
          decks: {},
        },
      };
      window.localStorage.setItem("flashcards-data", JSON.stringify(data));
    });

    // Go to the deck page
    await page.goto("/flashcards/test/01-test-deck");

    await page.getByRole("button", { name: "Start Group" }).click();

    // Complete session
    await page.locator("#flip").click();
    await page.locator("#correct").click();
    await page.locator("#flip").click();
    await page.locator("#correct").click();

    // Should be completed
    await expect(page.locator(".completed-content")).toBeVisible();

    // Default schedule Group 0 Session 0 has 1 hour wait (3600s)
    // 2026-02-02T10:00:00Z + 1 hour = 11:00:00
    await expect(page.locator(".completed-stats")).toContainText(
      "Next review scheduled for:",
    );
    // Check for "11:" to be somewhat sure it's the right time
    await expect(page.locator(".completed-stats")).toContainText("11:");
  });

  test("should not show Flip button on 'Not due yet' screen", async ({
    page,
  }) => {
    const now = new Date("2026-02-02T10:00:00Z").getTime();
    await page.clock.setFixedTime(now);

    const initialData = {
      test: {
        settings: { totalRounds: 1 },
        decks: {
          "01-test-deck": {
            currentRound: 0,
            wrongFirstTime: [],
            learningLog: [
              {
                sessionGroupIndex: 0,
                sessionIndex: 0,
                startTime: now - 120000,
                endTime: now - 60000,
                nextReview: now + 3600000,
                missedCount: 0,
              },
            ],
          },
        },
      },
    };

    await page.addInitScript((data) => {
      window.localStorage.setItem("flashcards-data", JSON.stringify(data));
    }, initialData);

    await page.goto("/flashcards/test/01-test-deck");
    await expect(page.locator(".completed-title")).toContainText("Not due yet");

    // Flip button should NOT be visible
    await expect(page.locator("#flip")).not.toBeVisible();
  });

  test("should clear wrongFirstTime between sessions to avoid getting stuck", async ({
    page,
  }) => {
    const now = new Date("2026-02-02T10:00:00Z").getTime();
    await page.clock.setFixedTime(now);

    // Initial state: User has already done one session and got everything wrong.
    // In previous versions, wrongFirstTime would have [1, 2] and it would persist.
    // We are now at sessionIndex: 1 (second session of group 0).
    const initialData = {
      test: {
        settings: { totalRounds: 1 },
        decks: {
          "01-test-deck": {
            currentRound: 0,
            wrongFirstTime: [1, 2],
            learningLog: [
              {
                sessionGroupIndex: 0,
                sessionIndex: 0,
                startTime: now - 7200000,
                endTime: now - 7000000,
                nextReview: now - 3600000, // Due
                missedCount: 2,
              },
            ],
          },
        },
      },
    };

    await page.addInitScript((data) => {
      window.localStorage.setItem("flashcards-data", JSON.stringify(data));
    }, initialData);

    await page.goto("/flashcards/test/01-test-deck");

    // Click Study All Words
    await page.getByRole("button", { name: "Study All Cards" }).click();

    // NEW EXPECTATION: Round 0 should have 2 cards because "Study All" resets stumbles
    await expect(page.locator(".cards-progress")).toContainText(
      /Cards:\s+0\/2/,
    );

    // Complete the session and get everything RIGHT this time.
    for (let i = 0; i < 2; i++) {
      await page.locator("#flip").click();
      await page.locator("#correct").click();
    }

    // Should be completed and MASTERED!
    await expect(page.locator(".completed-content")).toBeVisible();
    await expect(page.locator(".completed-title")).toContainText("Mastered!");

    // Verify localStorage: wrongFirstTime should be empty for the next session
    const storage = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem("flashcards-data") || "{}");
    });

    const deckData = storage["test"]?.decks?.["01-test-deck"];
    expect(deckData.wrongFirstTime).toEqual([]);

    // The last log entry should have missedCount: 0
    const log = deckData.learningLog;
    expect(log[log.length - 1].missedCount).toBe(0);
  });

  test("scheduled session: 'Struggling Only' choice should remove correctly guessed cards from wrongFirstTime", async ({
    page,
  }) => {
    const now = new Date("2026-02-02T10:00:00Z").getTime();
    await page.clock.setFixedTime(now);

    const initialData = {
      test: {
        settings: { totalRounds: 1 },
        decks: {
          "01-test-deck": {
            currentRound: 0,
            wrongFirstTime: [1], // Card 1 is struggling
            learningLog: [
              {
                sessionGroupIndex: 0,
                sessionIndex: 0,
                startTime: now - 7200000,
                endTime: now - 7000000,
                nextReview: now - 1000, // Due
                missedCount: 1,
              },
            ],
          },
        },
      },
    };

    await page.addInitScript((data) => {
      window.localStorage.setItem("flashcards-data", JSON.stringify(data));
    }, initialData);

    await page.goto("/flashcards/test/01-test-deck");

    // Choose Study Struggling Only
    await page.getByRole("button", { name: /Study Struggling Only/ }).click();

    // Only 1 card should be present
    await expect(page.locator(".cards-progress")).toContainText("Cards: 0/1");

    // Correctly guess it
    await page.locator("#flip").click();
    await page.locator("#correct").click();

    await expect(page.locator(".completed-content")).toBeVisible();

    // Verify wrongFirstTime is cleared
    const storage = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem("flashcards-data") || "{}");
    });
    expect(storage["test"].decks["01-test-deck"].wrongFirstTime).toEqual([]);
  });

  test("extra session: correctly guessed struggling cards should NOT be removed from wrongFirstTime", async ({
    page,
  }) => {
    const now = new Date("2026-02-02T10:00:00Z").getTime();
    await page.clock.setFixedTime(now);

    const initialData = {
      test: {
        settings: { totalRounds: 1 },
        decks: {
          "01-test-deck": {
            currentRound: 0,
            wrongFirstTime: [1],
            learningLog: [
              {
                sessionGroupIndex: 0,
                sessionIndex: 0,
                startTime: now - 120000,
                endTime: now - 60000,
                nextReview: now + 3600000, // Not due
                missedCount: 1,
              },
            ],
          },
        },
      },
    };

    await page.addInitScript((data) => {
      window.localStorage.setItem("flashcards-data", JSON.stringify(data));
    }, initialData);

    await page.goto("/flashcards/test/01-test-deck");
    await page.getByRole("button", { name: /Study Struggling Only/ }).click();

    await page.locator("#flip").click();
    await page.locator("#correct").click();

    await expect(page.locator(".completed-content")).toBeVisible();

    // Verify wrongFirstTime STILL HAS the card
    const storage = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem("flashcards-data") || "{}");
    });
    expect(storage["test"].decks["01-test-deck"].wrongFirstTime).toEqual([1]);
  });

  test("should add cards to wrongFirstTime if missed in later rounds", async ({
    page,
  }) => {
    const now = new Date("2026-02-02T10:00:00Z").getTime();
    await page.clock.setFixedTime(now);

    const initialData = {
      test: {
        settings: { totalRounds: 2 }, // 2 rounds
        decks: {
          "01-test-deck": {
            currentRound: 0,
            wrongFirstTime: [],
            learningLog: [],
          },
        },
      },
    };

    await page.addInitScript((data) => {
      window.localStorage.setItem("flashcards-data", JSON.stringify(data));
    }, initialData);

    await page.goto("/flashcards/test/01-test-deck");
    await page.getByRole("button", { name: "Start Group" }).click();

    // Round 1 (0): Card 1 Correct, Card 2 Incorrect
    await page.locator("#flip").click();
    await page.locator("#correct").click();

    await page.locator("#flip").click();
    await page.locator("#incorrect").click(); // Card 2 missed, moved to end

    await page.locator("#flip").click();
    await page.locator("#correct").click(); // Card 2 correct, finishes round 1

    // Round 2 (1): Card 2 Incorrect (missed in a later round)
    await expect(page.locator(".rounds-progress")).toContainText("Round: 2/2");
    await page.locator("#flip").click();
    await page.locator("#incorrect").click();

    // Check storage
    const storage = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem("flashcards-data") || "{}");
    });
    // Card 2 ID is 2
    expect(storage["test"].decks["01-test-deck"].wrongFirstTime).toContain(2);
  });

  test("scheduled session: should skip choice and show 'Start Session' if no stumbles exist", async ({
    page,
  }) => {
    const now = new Date("2026-02-02T10:00:00Z").getTime();
    await page.clock.setFixedTime(now);

    const initialData = {
      test: {
        settings: { totalRounds: 1 },
        decks: {
          "01-test-deck": {
            currentRound: 0,
            wrongFirstTime: [],
            learningLog: [
              {
                sessionGroupIndex: 0,
                sessionIndex: 0,
                startTime: now - 7200000,
                endTime: now - 7000000,
                nextReview: now - 1000, // Due
                missedCount: 0,
              },
            ],
          },
        },
      },
    };

    await page.addInitScript((data) => {
      window.localStorage.setItem("flashcards-data", JSON.stringify(data));
    }, initialData);

    await page.goto("/flashcards/test/01-test-deck");

    // Should NOT see choice buttons
    await expect(
      page.getByRole("button", { name: /Study Struggling Only/ }),
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Study All Cards" }),
    ).not.toBeVisible();

    // Should see Start Session
    const startBtn = page.getByRole("button", { name: "Start Session" });
    await expect(startBtn).toBeVisible();

    await startBtn.click();
    await expect(page.locator(".cards-progress")).toContainText("Cards: 0/2");
  });

  test("extra session: 'Study All Words' should NOT clear wrongFirstTime", async ({
    page,
  }) => {
    const now = new Date("2026-02-02T10:00:00Z").getTime();
    await page.clock.setFixedTime(now);

    const initialData = {
      test: {
        settings: { totalRounds: 1 },
        decks: {
          "01-test-deck": {
            currentRound: 0,
            wrongFirstTime: [1],
            learningLog: [
              {
                sessionGroupIndex: 0,
                sessionIndex: 0,
                startTime: now - 120000,
                endTime: now - 60000,
                nextReview: now + 3600000, // Not due
                missedCount: 1,
              },
            ],
          },
        },
      },
    };

    await page.addInitScript((data) => {
      window.localStorage.setItem("flashcards-data", JSON.stringify(data));
    }, initialData);

    await page.goto("/flashcards/test/01-test-deck");
    await page.getByRole("button", { name: "Study All Cards" }).click();

    // Verify wrongFirstTime STILL HAS the card
    const storage = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem("flashcards-data") || "{}");
    });
    expect(storage["test"].decks["01-test-deck"].wrongFirstTime).toEqual([1]);
  });
});
