import { z } from "zod";

export const bugReportSchema = z.object({
  id: z.number(),
  title: z.string().min(1, { message: "페이지는 필수 입력 사항입니다." }),
  description: z.string().min(1, { message: "설명은 필수 입력 사항입니다." }),
  user_id: z.number(),
  status: z.string().min(1, { message: "심각성은 필수 입력 사항입니다." }),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  file_url: z.string().nullable(),
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
