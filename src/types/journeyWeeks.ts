import { z } from "zod";

export const journeyWeekSchema = z.object({
  id: z.number(),
  journey_id: z.number().nullable(),
  name: z.string(),
  week_number: z.number().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
})

export const createJourneyWeekSchema = journeyWeekSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const updateJourneyWeekSchema = createJourneyWeekSchema.partial()

export type JourneyWeek = z.infer<typeof journeyWeekSchema>;
export type CreateJourneyWeek = z.infer<typeof createJourneyWeekSchema>;
export type UpdateJourneyWeek = z.infer<typeof updateJourneyWeekSchema>;
