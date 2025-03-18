import { z } from "zod";

export const roleAccessCodeSchema = z.object({
  id: z.number(),
  expiry_date: z.string(),
  created_at: z.string(),
  code: z.string(),
});
export const createRoleAccessCodeSchema = roleAccessCodeSchema.pick({
  expiry_date: true,
});

export type RoleAccessCode = z.infer<typeof roleAccessCodeSchema>;
export type CreateRoleAccessCode = z.infer<typeof createRoleAccessCodeSchema>;
