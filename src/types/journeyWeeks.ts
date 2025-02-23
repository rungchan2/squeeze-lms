import { z } from "zod";

export const journeyWeekSchema = z.object({
  id: z.number().int().nonnegative(),
  journey_id: z.number().int(),
  name: z.string().min(1),
  week_number: z.number().int().nonnegative(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type JourneyWeek = z.infer<typeof journeyWeekSchema>;