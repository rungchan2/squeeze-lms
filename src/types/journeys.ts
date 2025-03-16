import { z } from "zod";

export const journeySchema = z.object({
  id: z.number(),
  name: z.string(),
  date_start: z.string().nullable(),
  date_end: z.string().nullable(),
  image_url: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  uuid: z.string().uuid(),
})

export const createJourneySchema = journeySchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const updateJourneySchema = createJourneySchema.partial()

export type Journey = z.infer<typeof journeySchema>;
export type CreateJourney = z.infer<typeof createJourneySchema>;
export type UpdateJourney = z.infer<typeof updateJourneySchema>;
