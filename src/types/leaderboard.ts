import { z } from "zod";

export const leaderboardEntrySchema = z.object({
  user_id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  total_points: z.number(),
  completed_missions: z.number(),
});

export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>; 