import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { deckSchema } from "./schemas/deck";

const decks = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/decks" }),
  schema: deckSchema,
});

export const collections = { decks };
