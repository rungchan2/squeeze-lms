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
  email: z.string().email(),
  phone: z.string().optional(),
});

export type User = z.infer<typeof userSchema>;

export const loginSchema = z.object({
  email: z.string().email("유효한 이메일을 입력해주세요"),
  password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다"),
});

export type Login = z.infer<typeof loginSchema>;
