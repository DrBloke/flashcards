import { z } from "zod";

export const setSchema = z.object({
  title: z.string(),
  path: z.string(),
});

export const setsSchema = z.array(setSchema);

export type SetInfo = z.infer<typeof setSchema>;
