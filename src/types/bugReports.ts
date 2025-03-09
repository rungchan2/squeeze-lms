import { z } from "zod";

export const bugReportSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  user_id: z.number(),
  status: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
})

export const createBugReportSchema = bugReportSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const updateBugReportSchema = createBugReportSchema.partial()

export type BugReport = z.infer<typeof bugReportSchema>;
export type CreateBugReport = z.infer<typeof createBugReportSchema>;
export type UpdateBugReport = z.infer<typeof updateBugReportSchema>;
