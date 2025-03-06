import { z } from "zod";
import { organizationSchema } from "./organizations";
import { userSchema } from "./users";

const pickedUserSchema = userSchema.pick({
  id: true,
  first_name: true,
  last_name: true,
  organization_id: true,
});

const pickedOrganizationSchema = organizationSchema.pick({
  id: true,
  name: true,
});

export const postsSchema = z.object({
  id: z.number().int().nonnegative(),
  title: z.string().optional(),
  mission_id: z.number().int(),
  user_id: z.number().int(),
  content: z.string().optional(),
  attachment_url: z.string().url().optional(),
  score: z.number().int().min(0).max(100).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Post = z.infer<typeof postsSchema>;

export const userWithOrganizationSchema = pickedUserSchema.extend({
  organizations: pickedOrganizationSchema.nullable(),
});

export const postWithRelationsSchema = postsSchema.extend({
  users: userWithOrganizationSchema.nullable(),
});

export type PostWithRelations = z.infer<typeof postWithRelationsSchema>;