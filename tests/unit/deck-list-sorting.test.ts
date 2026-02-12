import { expect, test, describe, beforeEach, afterEach } from "vitest";
import { DeckList } from "../../src/components/lit/DeckList";

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

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  configurable: true,
});

describe("DeckList Sorting Logic", () => {
  let element: DeckList;
  const now = Date.now();

  beforeEach(() => {
    localStorage.clear();
    element = new DeckList();
    element.setPath = "test-set";
    element.baseUrl = "/";
    element.decks = [
      { id: "deck-new", title: "New Deck", totalCards: 10 },
      { id: "deck-scheduled", title: "Scheduled Deck", totalCards: 10 },
      { id: "deck-due", title: "Due Deck", totalCards: 10 },
      { id: "deck-overdue", title: "Overdue Deck", totalCards: 10 },
    ];

    const storageData = {
      "test-set": {
        decks: {
          "deck-overdue": {
            currentRound: 0,
            wrongFirstTime: [],
            learningLog: [
              {
                milestoneIndex: 0,
                sessionIndex: 0,
                startTime: now - 5 * 3600 * 1000,
                endTime: now - 4 * 3600 * 1000,
                nextReview: now - 3 * 3600 * 1000,
              },
            ],
          },
          "deck-due": {
            currentRound: 0,
            wrongFirstTime: [],
            learningLog: [
              {
                milestoneIndex: 0,
                sessionIndex: 0,
                startTime: now - 2 * 3600 * 1000,
                endTime: now - 1.5 * 3600 * 1000,
                nextReview: now - 1 * 3600 * 1000,
              },
            ],
          },
          "deck-scheduled": {
            currentRound: 0,
            wrongFirstTime: [],
            learningLog: [
              {
                milestoneIndex: 0,
                sessionIndex: 0,
                startTime: now - 1 * 3600 * 1000,
                endTime: now - 0.5 * 3600 * 1000,
                nextReview: now + 1 * 3600 * 1000,
              },
            ],
          },
          // New deck has no entry
        },
      },
    };

    localStorage.setItem("flashcards-data", JSON.stringify(storageData));
    document.body.appendChild(element);
    // @ts-expect-error accessing private method
    element._loadStorage();
  });

  afterEach(() => {
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  });

  test("Decks are sorted by status: Overdue, Due, Scheduled, Ready", async () => {
    await element.updateComplete;
    const rows = element.shadowRoot?.querySelectorAll("tbody tr");
    const titles = Array.from(rows || []).map((row) =>
      row.querySelector(".deck-title a")?.textContent?.trim(),
    );

    // Initial order in element.decks was: New, Scheduled, Due, Overdue
    // Sorted order should be: Overdue, Due, Scheduled, New
    expect(titles).toEqual([
      "Overdue Deck",
      "Due Deck",
      "Scheduled Deck",
      "New Deck",
    ]);
  });
});
