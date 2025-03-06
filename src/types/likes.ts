import { z } from "zod";

export const likeSchema = z.object({
  id: z.number().int().nonnegative(),
  post_id: z.number().int(),
  user_id: z.number().int(),
  created_at: z.string().datetime(),
});

export type Like = z.infer<typeof likeSchema>;