import { z } from "zod";

export const journeyWeekSchema = z.object({
  id: z.string(),
  journey_id: z.string().uuid(),
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

export const updateJourneyWeekSchema = createJourneyWeekSchema.partial().omit({
  journey_id: true,
}).extend({
  journey_id: z.string().uuid().optional(),
})

export type JourneyWeek = z.infer<typeof journeyWeekSchema>;
export type CreateJourneyWeek = z.infer<typeof createJourneyWeekSchema>;
export type UpdateJourneyWeek = z.infer<typeof updateJourneyWeekSchema>;
