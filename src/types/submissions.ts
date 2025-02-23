import { z } from "zod";

export const submissionSchema = z.object({
  id: z.number().int().nonnegative(),
  mission_id: z.number().int(),
  user_id: z.number().int(),
  content: z.string().optional(),
  attachment_url: z.string().url().optional(),
  submitted_at: z.string().datetime(),
  score: z.number().int().min(0).max(100).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Submission = z.infer<typeof submissionSchema>;