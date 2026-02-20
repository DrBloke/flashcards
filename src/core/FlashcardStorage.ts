import { z } from "zod";
import { flashcardsStorageSchema, deckSessionSchema } from "../schemas/storage";

export class FlashcardStorage {
  private static STORAGE_KEY = "flashcards-data";

  static getStoredData(): z.infer<typeof flashcardsStorageSchema> {
    const rawData = localStorage.getItem(this.STORAGE_KEY);
    const parsed = rawData ? JSON.parse(rawData) : {};
    const result = flashcardsStorageSchema.safeParse(parsed);
    return result.success ? result.data : {};
  }

  static saveDeckData(
    setPath: string,
    deckId: string,
    data: z.infer<typeof deckSessionSchema>,
  ) {
    const allData = this.getStoredData();

    if (!allData[setPath]) {
      allData[setPath] = { settings: {}, decks: {} };
    }
    if (!allData[setPath].decks) {
      allData[setPath].decks = {};
    }
    allData[setPath].decks![deckId] = data;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allData));
  }

  static loadDeckData(setPath: string, deckId: string) {
    const allData = this.getStoredData();
    return allData[setPath]?.decks?.[deckId];
  }

  static getSettings(setPath: string) {
    const allData = this.getStoredData();
    return allData[setPath]?.settings || {};
  }
  static saveSettings(
    setPath: string,
    settings: NonNullable<
      z.infer<typeof flashcardsStorageSchema>[string]
    >["settings"],
  ) {
    const allData = this.getStoredData();
    if (!allData[setPath]) {
      allData[setPath] = { settings: {}, decks: {} };
    }
    allData[setPath].settings = settings;
    this.saveAllData(allData);
  }

  static saveAllData(data: z.infer<typeof flashcardsStorageSchema>) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }
}
