import { z } from "zod";

export const journeySchema = z.object({
  id: z.number().int().nonnegative(),
  name: z.string().min(1),
  date_start: z.string().optional(),
  date_end: z.string().optional(),
  countries: z.string().optional(),
  image_url: z.string().url().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Journey = z.infer<typeof journeySchema>;