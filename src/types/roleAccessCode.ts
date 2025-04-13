import { z } from "zod";
import { roleSchema } from "./users";

export const roleAccessCodeSchema = z.object({
  id: z.string().uuid(),
  role: roleSchema,
  expiry_date: z.string().nullable(),
  created_at: z.string().nullable(),
  code: z.string().uuid(),
});

export const createRoleAccessCodeSchema = roleAccessCodeSchema.pick({
  role: true,
  expiry_date: true,
});

export type RoleAccessCode = z.infer<typeof roleAccessCodeSchema>;
export type CreateRoleAccessCode = z.infer<typeof createRoleAccessCodeSchema>;
