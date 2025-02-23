import { z } from "zod";

export const bugReportSchema = z.object({
  id: z.number().int().nonnegative(),
  user_id: z.number().int(),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["open", "in_progress", "resolved"]).default("open"),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type BugReport = z.infer<typeof bugReportSchema>;