import { z } from "zod";

export const missionSchema = z.object({
  id: z.number().int().nonnegative(),
  journey_week_id: z.number().int(),
  name: z.string().min(1),
  mission_type: z.string(),
  points: z.number().int().nonnegative(),
  description: z.string().optional(),
  release_date: z.string().optional(),
  expiry_date: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Mission = z.infer<typeof missionSchema>;