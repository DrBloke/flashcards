import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { deckSchema } from "./schemas/deck";
import { setsSchema } from "./schemas/sets";
import rawSets from "./sets.json";

const sets = setsSchema.parse(rawSets);

export const collections = Object.fromEntries(
  sets.map((set) => [
    set.path,
    defineCollection({
      loader: glob({ pattern: "**/*.json", base: `./src/decks/${set.path}` }),
      schema: deckSchema,
    }),
  ]),
);
