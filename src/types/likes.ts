import { z } from "zod";

export const likeSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  post_id: z.string().uuid(),
  created_at: z.string().nullable(),
})

export const createLikeSchema = likeSchema.omit({
  id: true,
  created_at: true,
})

export const updateLikeSchema = createLikeSchema.partial()

export type Like = z.infer<typeof likeSchema>;
export type CreateLike = z.infer<typeof createLikeSchema>;
export type UpdateLike = z.infer<typeof updateLikeSchema>;
