import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Maths GCSE Deck Verification", () => {
  it("should have the correct folder structure", () => {
    const deckPath = path.resolve(__dirname, "../../src/decks/maths-gcse");
    expect(fs.existsSync(deckPath)).toBe(true);
    expect(
      fs.existsSync(path.join(deckPath, "01-quadratic-equations-type-1.json")),
    ).toBe(true);
  });

  it("should be registered in sets.json", () => {
    const setsPath = path.resolve(__dirname, "../../src/sets.json");
    const sets = JSON.parse(fs.readFileSync(setsPath, "utf-8"));
    const mathsDeck = sets.find(
      (set: { title: string; path: string }) => set.title === "Maths GCSE",
    );
    expect(mathsDeck).toBeDefined();
    expect(mathsDeck.path).toBe("maths-gcse");
  });

  it("should have valid JSON content", () => {
    const jsonPath = path.resolve(
      __dirname,
      "../../src/decks/maths-gcse/01-quadratic-equations-type-1.json",
    );
    const content = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    expect(content.title).toBe("Quadratic Equations - type 1");
    expect(content.cards.length).toBeGreaterThan(0);
    expect(content.cards[0].side1).toBe("Placeholder Question");
  });
});
