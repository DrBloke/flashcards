import { z } from "zod";
import { learningScheduleSchema } from "./learningSchedule";

export const learningLogEntrySchema = z.object({
  sessionGroupIndex: z.number(),
  sessionIndex: z.number(),
  startTime: z.number(),
  endTime: z.number(),
  nextReview: z.number().nullable(),
  isExtra: z.boolean().optional(),
  missedCount: z.number().optional(), // Adding this to store performance
});

export const deckSessionSchema = z.object({
  currentRound: z.number(),
  wrongFirstTime: z.array(z.number()),
  learningLog: z.array(learningLogEntrySchema).default([]),
});

export const setSettingsSchema = z.object({
  reverseDeck: z.boolean().optional(),
  shuffleDeck: z.boolean().optional(),
  totalRounds: z.number().optional(),
  learningSchedule: learningScheduleSchema.optional(),
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
export type LearningLogEntry = z.infer<typeof learningLogEntrySchema>;
