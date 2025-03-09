import { z } from "zod";

export const likeSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  post_id: z.number().nullable(),
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
