import { z } from "zod";
import { journeySchema } from "./journeys";
import { roleSchema } from "./users";

export const userJourneySchema = z.object({
  id: z.number().int().nonnegative(),
  user_id: z.number().int().nullable(),
  journey_id: z.number().int().nullable(),
  joined_at: z.string().datetime().nullable(),
  role_in_journey: roleSchema.nullable(),
  created_at: z.string().datetime().nullable(),
  updated_at: z.string().datetime().nullable(),
});

export const userJourneyWithJourneySchema = userJourneySchema.extend({
  journeys: journeySchema.nullable(),
});

export type UserJourney = z.infer<typeof userJourneySchema>;
export type UserJourneyWithJourney = z.infer<typeof userJourneyWithJourneySchema>;