import { z } from "zod";

export const roleSchema = z.enum(["user", "teacher", "admin"])

export const userSchema = z.object({
  id: z.number(),
  uid: z.string(),
  email: z.string().email(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  phone: z.string().nonempty(),
  profile_image: z.string().nullable(),
  role: roleSchema.nullable(),
  organization_id: z.number().nullable(),
  marketing_opt_in: z.boolean().nullable(),
  privacy_agreed: z.boolean().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
})

export const createUserSchema = userSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  role: true,
})

export type Role = z.infer<typeof roleSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type User = z.infer<typeof userSchema>;

