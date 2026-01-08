import { z } from "zod";

export const deckSessionSchema = z.object({
  currentRound: z.number(),
  wrongFirstTime: z.array(z.number()),
});

export const setSettingsSchema = z.object({
  reverseDeck: z.boolean().optional(),
  shuffleDeck: z.boolean().optional(),
  totalRounds: z.number().optional(),
});

export const setDataSchema = z.object({
  settings: setSettingsSchema.optional(),
  decks: z.record(z.string(), deckSessionSchema).optional(),
});

export const flashcardsStorageSchema = z.record(z.string(), setDataSchema);

export type DeckSession = z.infer<typeof deckSessionSchema>;
export type SetSettings = z.infer<typeof setSettingsSchema>;
export type SetData = z.infer<typeof setDataSchema>;
export type FlashcardsStorage = z.infer<typeof flashcardsStorageSchema>;
