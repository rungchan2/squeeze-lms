import { z } from "zod";
import { organizationSchema } from "./organizations";
import { userSchema } from "./users";
import { missionSchema } from "./missions";
import { journeyMissionInstanceSchema } from "./journeyMissionInstances";

const pickedUserSchema = userSchema.pick({
  id: true,
  first_name: true,
  last_name: true,
  organization_id: true,
  profile_image: true,
});

const pickedOrganizationSchema = organizationSchema.pick({
  id: true,
  name: true,
});

const pickedMissionSchema = missionSchema.pick({
  id: true,
  name: true,
  description: true,
  points: true,
  mission_type: true,
});

export const postSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  user_id: z.number(),
  mission_instance_id: z.number(),
  score: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  view_count: z.number(),
  is_hidden: z.boolean(),
});


export const createPostSchema = postSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  view_count: true,
  is_hidden: true,
});

export const updatePostSchema = createPostSchema.omit({
  mission_instance_id: true,
  score: true,
});

export const userWithOrganizationSchema = pickedUserSchema.extend({
  organizations: pickedOrganizationSchema,
});

export const postWithRelationsSchema = postSchema.extend({
  profiles: userWithOrganizationSchema,
  mission_instance_id: pickedMissionSchema,
});

export const postWithRelationsSchemaWithPost = postSchema.extend({
  mission_instance_id: journeyMissionInstanceSchema,
});

export type PostWithRelations = z.infer<typeof postWithRelationsSchema>;
export type Post = z.infer<typeof postSchema>;
export type CreatePost = z.infer<typeof createPostSchema>;
export type UpdatePost = z.infer<typeof updatePostSchema>;
export type PostWithRelationsWithJourneyMissionInstance = z.infer<typeof postWithRelationsSchemaWithPost>;