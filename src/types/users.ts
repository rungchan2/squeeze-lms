import { z } from "zod";

export const roleSchema = z.enum(["user", "teacher", "admin"])

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email("이메일 형식이 올바르지 않습니다"),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  phone: z.string().nonempty("전화번호를 입력해주세요"),
  profile_image: z.string().nullable(),
  role: roleSchema.nullable(),
  organization_id: z.string().uuid().nullable(),
  marketing_opt_in: z.boolean().nullable(),
  privacy_agreed: z.boolean().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
})


export const createUserSchema = userSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const signupPageSchema = createUserSchema.extend({
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
  password_confirmation: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
})

export type Role = z.infer<typeof roleSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type SignupPage = z.infer<typeof signupPageSchema>;
export type User = z.infer<typeof userSchema>;
