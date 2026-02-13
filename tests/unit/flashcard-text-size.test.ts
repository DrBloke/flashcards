import { expect, test, describe, beforeEach, afterEach } from "vitest";
import { FlashcardDeck } from "../../src/components/lit/Flashcard";
import { html } from "lit";
import { FlashcardStorage } from "../../src/core/FlashcardStorage";

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

describe("Flashcard Font Resizing Logic", () => {
  let deckElement: FlashcardDeck;
  const mockDeck = {
    id: 1,
    title: "Test Deck",
    tags: ["test"],
    cards: [
      { id: 1, side1: "Q1", side2: "A1" },
      { id: 2, side1: "Q2", side2: "A2" },
    ],
  };

  beforeEach(() => {
    localStorage.clear();
    deckElement = new FlashcardDeck();
    deckElement.render = () => html`<div>Mocked</div>`;

    FlashcardStorage.getStoredData = () => {
      const rawData = localStorage.getItem("flashcards-data");
      const parsed = rawData ? JSON.parse(rawData) : {};
      return parsed;
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
    deckElement.session.startSession("all");
  });

  afterEach(() => {
    if (deckElement && deckElement.parentNode) {
      deckElement.parentNode.removeChild(deckElement);
    }
  });

  test("Initial font size is default (undefined in state)", () => {
    expect(deckElement.session.cardFontSizes[1]).toBeUndefined();
  });

  test("Increasing font size updates state and saves to localStorage", () => {
    deckElement.session.increaseFontSize();

    expect(deckElement.session.cardFontSizes[1]).toBeCloseTo(2.35);

    const storedData = JSON.parse(
      localStorage.getItem("flashcards-data") || "{}",
    );
    expect(
      storedData["test-set"].decks["test-deck"].cardFontSizes["1"],
    ).toBeCloseTo(2.35);
  });

  test("Decreasing font size updates state and saves to localStorage", () => {
    deckElement.session.decreaseFontSize();

    expect(deckElement.session.cardFontSizes[1]).toBeCloseTo(2.15);

    const storedData = JSON.parse(
      localStorage.getItem("flashcards-data") || "{}",
    );
    expect(
      storedData["test-set"].decks["test-deck"].cardFontSizes["1"],
    ).toBeCloseTo(2.15);
  });

  test("Font size is persistent and per-card", async () => {
    // Increase for card 1
    deckElement.session.increaseFontSize();

    // Move to next card
    await deckElement._markCorrect();
    // Ah, Flashcard.ts does NOT implement markCorrect/markIncorrect public methods, only _markCorrect.
    // In original file, markCorrect was a method. Now I made it _markCorrect (private-ish by convention).
    // The test calls await deckElement.markCorrect().
    // I need to change this to accessing _markCorrect via cast, OR check if I should make them public.
    // In original code they were "async markCorrect()".
    // I changed them to "async _markCorrect()". I should probably check if tests use them.
    // The previous tests used "await deckElement._markCorrect()" because I changed them?
    // Wait, original tests used "await deckElement.markCorrect()".
    // I should probably make them public in Flashcard.ts or update tests to use _markCorrect.
    // Let's use (deckElement as any)._markCorrect() for now.

    // Card 2 should have no custom font size yet in state (until resized)
    expect(deckElement.session.cardFontSizes[2]).toBeUndefined();

    // Initialize another session (reloads from storage)
    const newElement = new FlashcardDeck();
    newElement.deck = mockDeck;
    newElement.deckId = "test-deck";
    newElement.setPath = "test-set";
    newElement.session.updateContext("test-deck", "test-set", mockDeck);
    newElement.session.initializeSession();

    expect(newElement.session.cardFontSizes[1]).toBeCloseTo(2.35);
    expect(newElement.session.cardFontSizes[2]).toBeUndefined();
  });
});
