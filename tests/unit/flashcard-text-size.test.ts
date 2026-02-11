import { expect, test, describe, beforeEach, afterEach } from "vitest";
import { FlashcardDeck } from "../../src/components/lit/Flashcard";
import { html } from "lit";

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

    // @ts-expect-error accessing private method
    deckElement._getStoredData = () => {
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

    // @ts-expect-error accessing private method
    deckElement._initializeSession();
    // @ts-expect-error accessing private method
    deckElement._startSession("all");
  });

  afterEach(() => {
    if (deckElement && deckElement.parentNode) {
      deckElement.parentNode.removeChild(deckElement);
    }
  });

  test("Initial font size is default (undefined in state)", () => {
    // @ts-expect-error accessing private field
    expect(deckElement._cardFontSizes[1]).toBeUndefined();
  });

  test("Increasing font size updates state and saves to localStorage", () => {
    // @ts-expect-error accessing private method
    deckElement._increaseFontSize();

    // @ts-expect-error accessing private field
    expect(deckElement._cardFontSizes[1]).toBeCloseTo(2.35);

    const storedData = JSON.parse(
      localStorage.getItem("flashcards-data") || "{}",
    );
    expect(
      storedData["test-set"].decks["test-deck"].cardFontSizes["1"],
    ).toBeCloseTo(2.35);
  });

  test("Decreasing font size updates state and saves to localStorage", () => {
    // @ts-expect-error accessing private method
    deckElement._decreaseFontSize();

    // @ts-expect-error accessing private field
    expect(deckElement._cardFontSizes[1]).toBeCloseTo(2.15);

    const storedData = JSON.parse(
      localStorage.getItem("flashcards-data") || "{}",
    );
    expect(
      storedData["test-set"].decks["test-deck"].cardFontSizes["1"],
    ).toBeCloseTo(2.15);
  });

  test("Font size is persistent and per-card", async () => {
    // Increase for card 1
    // @ts-expect-error accessing private method
    deckElement._increaseFontSize();

    // Move to next card
    await deckElement.markCorrect();

    // Card 2 should have no custom font size yet in state (until resized)
    // @ts-expect-error accessing private field
    expect(deckElement._cardFontSizes[2]).toBeUndefined();

    // Initialize another session (reloads from storage)
    const newElement = new FlashcardDeck();
    newElement.deck = mockDeck;
    newElement.deckId = "test-deck";
    newElement.setPath = "test-set";
    // @ts-expect-error accessing private method
    newElement._initializeSession();

    // @ts-expect-error accessing private field
    expect(newElement._cardFontSizes[1]).toBeCloseTo(2.35);
    // @ts-expect-error accessing private field
    expect(newElement._cardFontSizes[2]).toBeUndefined();
  });
});
