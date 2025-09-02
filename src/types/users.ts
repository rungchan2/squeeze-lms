import { z } from "zod";

export const roleSchema = z.enum(["user", "teacher", "admin"])

// Phone number validation regex for Korean phone numbers
const phoneRegex = /^(010|011|016|017|018|019)-?\d{3,4}-?\d{4}$/;

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email("이메일 형식이 올바르지 않습니다"),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  phone: z.string()
    .nonempty("전화번호를 입력해주세요")
    .regex(phoneRegex, "올바른 전화번호 형식이 아닙니다 (010-1234-5678)"),
  profile_image: z.string().nullable(),
  profile_image_file_id: z.number().nullable(),
  role: roleSchema.nullable(),
  organization_id: z.string().uuid().nullable(),
  marketing_opt_in: z.boolean(),
  privacy_agreed: z.boolean(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
})


export const createUserSchema = userSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  first_name: z.string().min(1, "이름을 입력해주세요"),
  last_name: z.string().min(1, "성을 입력해주세요"),
  organization_id: z.string().uuid("소속을 선택해주세요"),
  privacy_agreed: z.boolean().refine((val) => val === true, {
    message: "개인정보 보호정책에 동의해주세요"
  }),
})

export const signupPageSchema = createUserSchema.extend({
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
  password_confirmation: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
})

export type Role = z.infer<typeof roleSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type SignupPage = z.infer<typeof signupPageSchema>;
export type User = z.infer<typeof userSchema>;
