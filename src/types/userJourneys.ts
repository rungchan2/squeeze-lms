import { z } from "zod";

export const userJourneySchema = z.object({
  id: z.number().int().nonnegative(),
  user_id: z.number().int(),
  journey_id: z.number().int(),
  joined_at: z.string().datetime(),
  role_in_journey: z.enum(["student", "coach", "mentor", "admin"]),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type UserJourney = z.infer<typeof userJourneySchema>;