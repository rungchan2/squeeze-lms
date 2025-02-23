import { z } from "zod";

export const commentSchema = z.object({
  id: z.number().int().nonnegative(),
  submission_id: z.number().int(),
  user_id: z.number().int(),
  content: z.string().min(1),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Comment = z.infer<typeof commentSchema>;