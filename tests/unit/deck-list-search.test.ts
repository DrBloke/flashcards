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

describe("DeckList Search Functionality", () => {
  let element: DeckList;

  beforeEach(async () => {
    localStorage.clear();
    element = new DeckList();
    element.setPath = "test-set";
    element.baseUrl = "/";
    element.decks = [
      { id: "deck-1", title: "Apple", totalCards: 10 },
      { id: "deck-2", title: "Banana", totalCards: 10 },
      { id: "deck-3", title: "Cherry", totalCards: 10 },
    ];

    document.body.appendChild(element);
  });

  afterEach(() => {
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  });

  test("Filters decks correctly based on search query", async () => {
    await element.updateComplete;

    // Initially all decks should be visible
    let rows = element.shadowRoot?.querySelectorAll("tbody tr");
    expect(rows?.length).toBe(3);

    // Filter for "apple"
    const searchInput = element.shadowRoot?.querySelector(
      "#deck-search",
    ) as HTMLElement & { value: string };
    expect(searchInput).toBeDefined();

    searchInput.value = "apple";
    // We now use the standard 'input' event
    searchInput.dispatchEvent(
      new CustomEvent("input", { bubbles: true, composed: true }),
    );

    await element.updateComplete;
    rows = element.shadowRoot?.querySelectorAll("tbody tr");
    expect(rows?.length).toBe(1);
    expect(rows?.[0].querySelector(".deck-title a")?.textContent?.trim()).toBe(
      "Apple",
    );

    // Filter for "a" (Apple and Banana)
    searchInput.value = " a "; // Test trim
    searchInput.dispatchEvent(
      new CustomEvent("input", { bubbles: true, composed: true }),
    );

    await element.updateComplete;
    rows = element.shadowRoot?.querySelectorAll("tbody tr");
    expect(rows?.length).toBe(2);
    const titles = Array.from(rows || []).map((row) =>
      row.querySelector(".deck-title a")?.textContent?.trim(),
    );
    expect(titles).toContain("Apple");
    expect(titles).toContain("Banana");

    // Clear search using wa-clear event simulation
    searchInput.value = "";
    searchInput.dispatchEvent(
      new CustomEvent("wa-clear", { bubbles: true, composed: true }),
    );

    await element.updateComplete;
    rows = element.shadowRoot?.querySelectorAll("tbody tr");
    expect(rows?.length).toBe(3);
  });

  test("Handles string input for decks property (Astro case)", async () => {
    // @ts-expect-error - testing string input handling for Astro
    element.decks = JSON.stringify([
      { id: "deck-1", title: "Apple", totalCards: 10 },
    ]);

    await element.updateComplete;
    const rows = element.shadowRoot?.querySelectorAll("tbody tr");
    expect(rows?.length).toBe(1);
    expect(rows?.[0].querySelector(".deck-title a")?.textContent?.trim()).toBe(
      "Apple",
    );
  });
});
