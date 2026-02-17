import { expect, test, describe, beforeEach, afterEach, vi } from "vitest";
import { FlashcardDeck } from "../../src/components/lit/Flashcard";
import { html } from "lit";
import { FlashcardStorage } from "../../src/core/FlashcardStorage";
import { DEFAULT_LEARNING_SCHEDULE } from "../../src/schemas/learningSchedule";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("Learning Progression Logic", () => {
  let deckElement: FlashcardDeck;
  const mockDeck = {
    id: 1,
    title: "Test Deck",
    tags: ["test"],
    cards: [
      { id: 1, side1: "Q1", side2: "A1" },
      { id: 2, side1: "Q2", side2: "A2" },
      { id: 3, side1: "Q3", side2: "A3" },
      { id: 4, side1: "Q4", side2: "A4" },
      { id: 5, side1: "Q5", side2: "A5" },
      { id: 6, side1: "Q6", side2: "A6" },
      { id: 7, side1: "Q7", side2: "A7" },
      { id: 8, side1: "Q8", side2: "A8" },
      { id: 9, side1: "Q9", side2: "A9" },
      { id: 10, side1: "Q10", side2: "A10" },
    ],
  };

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-10T12:00:00Z"));

    deckElement = new FlashcardDeck();
    deckElement.render = () => html`<div>Mocked</div>`;

    FlashcardStorage.getStoredData = () => {
      const rawData = localStorage.getItem("flashcards-data");
      return rawData ? JSON.parse(rawData) : {};
    };

    Object.defineProperty(deckElement, "updateComplete", {
      value: Promise.resolve(true),
      configurable: true,
    });

    deckElement.deck = mockDeck;
    deckElement.deckId = "test-deck";
    deckElement.setPath = "test-set";

    document.body.appendChild(deckElement);

    deckElement.session.updateContext("test-deck", "test-set", mockDeck);

    deckElement.session.initializeSession();
    deckElement.session.totalRounds = 1;
  }, 10000);

  afterEach(() => {
    vi.useRealTimers();
    if (deckElement && deckElement.parentNode) {
      deckElement.parentNode.removeChild(deckElement);
    }
  });

  const completeSession = async (score: number) => {
    deckElement.session.startSession("all");

    const numCorrect = Math.round(score * 10);
    for (let i = 0; i < 10; i++) {
      if (i < numCorrect) {
        await deckElement._markCorrect();
      } else {
        await deckElement._markIncorrect();
      }
    }

    while (deckElement.session.remainingCards.length > 0) {
      await deckElement._markCorrect();
    }
  };

  test("Scheduled time for next study session within milestone", async () => {
    await completeSession(1.0);
    const log = deckElement.session.learningLog;
    expect(log.length).toBe(1);
    const lastEntry = log[0];
    const expectedReview = lastEntry.endTime + 3600 * 1000;
    expect(lastEntry.nextReview).toBe(expectedReview);
  }, 30000);

  test("Progression to next milestone after mastering (score >= 90%)", async () => {
    // 5 sessions in milestone 0
    for (let i = 0; i < 5; i++) {
      await completeSession(1.0);
      vi.advanceTimersByTime(4000 * 1000);
      deckElement.session.initializeSession();
      deckElement.session.totalRounds = 1;
    }

    expect(deckElement.session.milestoneIndex).toBe(1);
    expect(deckElement.session.sessionIndex).toBe(0);

    const lastEntry =
      deckElement.session.learningLog[
        deckElement.session.learningLog.length - 1
      ];
    const expectedReview = lastEntry.endTime + 28800 * 1000;
    expect(lastEntry.nextReview).toBe(expectedReview);
  }, 30000);

  test("Redo whole milestone on failure at end of milestone (score < 90%)", async () => {
    for (let i = 0; i < 4; i++) {
      await completeSession(1.0);
      vi.advanceTimersByTime(4000 * 1000);
      deckElement.session.initializeSession();
      deckElement.session.totalRounds = 1;
    }

    await completeSession(0.5);
    deckElement.session.initializeSession();
    deckElement.session.totalRounds = 1;

    expect(deckElement.session.milestoneIndex).toBe(0);
    expect(deckElement.session.sessionIndex).toBe(0);
  }, 30000);

  test("Demotion to previous milestone works correctly", async () => {
    // Complete milestone 0 (5 sessions)
    for (let i = 0; i < 4; i++) {
      await completeSession(1.0);
      vi.advanceTimersByTime(4000 * 1000);
      deckElement.session.initializeSession();
      deckElement.session.totalRounds = 1;
    }
    await completeSession(1.0);

    // Crucial: Wait for Milestone 1 to become due (8 hours = 28800s)
    vi.advanceTimersByTime(30000 * 1000);

    deckElement.session.initializeSession();
    deckElement.session.totalRounds = 1;
    expect(deckElement.session.milestoneIndex).toBe(1);
    expect(deckElement.session.sessionIndex).toBe(0);

    // Complete session 0 and 1 of milestone 1
    // minTimeBetweenSessions is 3600s
    await completeSession(1.0);
    vi.advanceTimersByTime(4000 * 1000);
    deckElement.session.initializeSession();
    deckElement.session.totalRounds = 1;
    expect(deckElement.session.sessionIndex).toBe(1);

    await completeSession(1.0);
    vi.advanceTimersByTime(4000 * 1000);
    deckElement.session.initializeSession();
    deckElement.session.totalRounds = 1;
    expect(deckElement.session.sessionIndex).toBe(2);

    // Fail last session of milestone 1 (session 2)
    await completeSession(0.2);
    expect(deckElement.session.showDemotionChoice).toBe(true);

    deckElement.session.demoteToPreviousMilestone();
    expect(deckElement.session.milestoneIndex).toBe(0);
    expect(deckElement.session.sessionIndex).toBe(0);
  }, 30000);

  test("Retrying milestone after failure sets isDue to true immediately", async () => {
    for (let i = 0; i < 4; i++) {
      await completeSession(1.0);
      vi.advanceTimersByTime(4000 * 1000);
      deckElement.session.initializeSession();
      deckElement.session.totalRounds = 1;
    }
    await completeSession(0.5);

    deckElement.session.retryMilestone();
    expect(deckElement.session.isDue).toBe(true);
  }, 30000);

  test("Starting new milestone with struggling cards preserves wrongFirstTime", async () => {
    // 1. Run a session and get some cards wrong
    deckElement.session.startSession("all");

    // Mark first card wrong
    await deckElement._markIncorrect();
    const wrongCardId = deckElement.session.wrongFirstTime[0];

    // Mark rest correct
    while (deckElement.session.remainingCards.length > 0) {
      await deckElement._markCorrect();
    }

    // Session complete. wrongFirstTime has 1 item.
    expect(deckElement.session.wrongFirstTime.length).toBe(1);

    // 2. Simulate conditions for a new milestone start
    // We reuse the existing session state but reset flags to simulate "New Milestone" screen
    deckElement.session.sessionStarted = false;
    deckElement.session.currentRound = 0;
    deckElement.session.isNewMilestone = true;

    // 3. Start session in "struggling" mode
    deckElement.session.startSession("struggling");

    // 4. Verify wrongFirstTime is preserved
    expect(deckElement.session.wrongFirstTime.length).toBe(1);
    expect(deckElement.session.wrongFirstTime[0]).toBe(wrongCardId);

    // 5. Verify remainingCards contains only the wrong card
    expect(deckElement.session.remainingCards.length).toBe(1);
    expect(deckElement.session.remainingCards[0].id).toBe(wrongCardId);

    // 6. Verify starting in "all" mode DOES clear it
    deckElement.session.sessionStarted = false;
    deckElement.session.currentRound = 0;
    deckElement.session.startSession("all");
    expect(deckElement.session.wrongFirstTime.length).toBe(0);
    expect(deckElement.session.remainingCards.length).toBe(10); // All cards
  });

  test("Transitions to Ingrained status after completing final milestone", async () => {
    // Override schedule to be short: 1 milestone with 2 sessions
    const shortSchedule = [
      {
        minTimeSinceLastMilestone: 0,
        numberOfSessions: 2,
        minTimeBetweenSessions: 3600,
        maxTimeBetweenSessions: null,
      },
    ];
    deckElement.session.schedule = shortSchedule;
    deckElement.session.milestoneIndex = 0;
    deckElement.session.sessionIndex = 0;

    // Complete session 1
    await completeSession(1.0);
    vi.advanceTimersByTime(4000 * 1000); // Advance past wait time
    deckElement.session.initializeSession();
    deckElement.session.schedule = shortSchedule; // Re-apply schedule as initialize resets it (actually initialize loads from storage settings, so we need to mock storage settings or ensure deckElement.session.schedule keeps value if we don't save settings?)
    // FlashcardSession.initializeSession() reads settings from FlashcardStorage.
    // So we need to save the settings with our short schedule.
    FlashcardStorage.getSettings = () => ({
      learningSchedule: shortSchedule,
    });
    // Re-initialize to load these settings
    deckElement.session.initializeSession();

    expect(deckElement.session.milestoneIndex).toBe(0);
    expect(deckElement.session.sessionIndex).toBe(1);

    // Complete session 2 (Final session of final milestone)
    await completeSession(1.0);

    // session.completeSession() updates state.
    expect(deckElement.session.isIngrained).toBe(true);

    // Verify learning log entry
    const lastEntry =
      deckElement.session.learningLog[
        deckElement.session.learningLog.length - 1
      ];
    expect(lastEntry.nextReview).toBe(null);
    expect(lastEntry.milestoneIndex).toBe(0); // Log records what we just finished
    expect(lastEntry.sessionIndex).toBe(1);

    // Verify session state if we reload
    deckElement.session.initializeSession();
    expect(deckElement.session.isIngrained).toBe(true);
    expect(deckElement.session.isDue).toBe(false);
  });

  test("Studying struggling cards on Ingrained deck completes correctly", async () => {
    // 1. Setup Ingrained State with Struggling Cards
    deckElement.session.schedule = DEFAULT_LEARNING_SCHEDULE; // Ensure schedule is standard
    deckElement.session.milestoneIndex = deckElement.session.schedule.length; // Set to Ingrained (max index)
    deckElement.session.isIngrained = true;
    deckElement.session.isDue = false;
    deckElement.session.wrongFirstTime = [1]; // Card ID 1 is struggling
    deckElement.session.totalRounds = 1;

    // 2. Start Session (Struggling Only)
    deckElement.session.startSession("struggling");

    expect(deckElement.session.isExtraSession).toBe(true); // Ingrained = extra
    expect(deckElement.session.sessionStarted).toBe(true);
    expect(deckElement.session.remainingCards.length).toBe(1);
    expect(deckElement.session.remainingCards[0].id).toBe(1);

    // 3. Mark Correct
    await deckElement._markCorrect();

    // 4. Verify Completion
    expect(deckElement.session.remainingCards.length).toBe(0);
    expect(deckElement.session.sessionCompleted).toBe(true);

    // 5. Verify Learning Log
    const lastEntry =
      deckElement.session.learningLog[
        deckElement.session.learningLog.length - 1
      ];
    expect(lastEntry.isExtra).toBe(true);
    expect(lastEntry.nextReview).toBe(null); // Ingrained

    // 6. Verify Session State after re-init
    deckElement.session.initializeSession();
    expect(deckElement.session.isIngrained).toBe(true);

    // Struggling card should be cleared as it was answered correctly
    expect(deckElement.session.wrongFirstTime.includes(1)).toBe(false);
  });
});
