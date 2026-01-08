import { z } from "zod";

export const deckSchema = z.object({
  id: z.number(),
  title: z.string(),
  cards: z.array(
    z.object({
      id: z.number(),
      side1: z.string(),
      side2: z.string(),
    }),
  ),
  tags: z.array(z.string()),
});
export type Deck = z.infer<typeof deckSchema>;
