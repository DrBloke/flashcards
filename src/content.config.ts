import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const decks = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/decks" }),
  schema: z.object({
    id: z.number(),
    title: z.string(),
    cards: z.array(
      z.object({
        side1: z.string(),
        side2: z.string(),
      }),
    ),
    tags: z.array(z.string()),
  }),
});

export const collections = { decks };
