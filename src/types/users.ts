import { z } from "zod";

export const userSchema = z.object({
  id: z.number().int().nonnegative(),
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  role: z.enum(["student", "teacher", "admin", "coach"]),
  organization_id: z.number().int().nullable(),
  marketing_opt_in: z.boolean(),
  privacy_agreed: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type User = z.infer<typeof userSchema>;