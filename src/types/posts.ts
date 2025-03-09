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

export const postSchema = z.object({
  id: z.number(),
  uuid: z.string(),
  title: z.string(),
  content: z.string().nullable(),
  file_url: z.string().nullable(),
  user_id: z.number(),
  mission_id: z.number().nullable(),
  score: z.number().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export const createPostSchema = postSchema.omit({
  id: true,
  uuid: true,
  created_at: true,
  updated_at: true,
});

export const updatePostSchema = createPostSchema.partial();

export const userWithOrganizationSchema = pickedUserSchema.extend({
  organizations: pickedOrganizationSchema.nullable(),
});

export const postWithRelationsSchema = postSchema.extend({
  users: userWithOrganizationSchema.nullable(),
});

export type PostWithRelations = z.infer<typeof postWithRelationsSchema>;
export type Post = z.infer<typeof postSchema>;
export type CreatePost = z.infer<typeof createPostSchema>;
export type UpdatePost = z.infer<typeof updatePostSchema>;
