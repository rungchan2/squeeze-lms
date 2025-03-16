import { z } from "zod";

export const commentSchema = z.object({
  id: z.number(),
  content: z.string().nullable(),
  user_id: z.number(),
  post_id: z.number().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  profiles: z.object({
    id: z.number(),
    first_name: z.string().nullable(),
    last_name: z.string().nullable(),
    profile_image: z.string().nullable()
  }).optional()
})

export const createCommentSchema = commentSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  profiles: true
})

export const updateCommentSchema = createCommentSchema.partial()

export type Comment = z.infer<typeof commentSchema>;
export type CreateComment = z.infer<typeof createCommentSchema>;
export type UpdateComment = z.infer<typeof updateCommentSchema>;
