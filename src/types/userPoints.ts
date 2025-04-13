import { z } from "zod";

export const userPointsSchema = z.object({
  id: z.string().uuid(),
  profile_id: z.string().uuid(),
  mission_instance_id: z.string().uuid(),
  post_id: z.string().uuid().nullable(),
  total_points: z.number(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export const createUserPointsSchema = userPointsSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const updateUserPointsSchema = createUserPointsSchema.partial();

export type UserPoints = z.infer<typeof userPointsSchema>;
export type CreateUserPoints = z.infer<typeof createUserPointsSchema>;
export type UpdateUserPoints = z.infer<typeof updateUserPointsSchema>; 