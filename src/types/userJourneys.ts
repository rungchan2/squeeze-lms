import { z } from "zod";
import { journeySchema } from "./journeys";
import { roleSchema } from "./users";

export const userJourneySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  journey_id: z.string().uuid(),
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