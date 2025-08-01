import { z } from "zod";
import { organizationSchema } from "./organizations";
import { userSchema } from "./users";
import { missionSchema } from "./missions";
import { journeyMissionInstanceSchema } from "./journeyMissionInstances";
import { answersDataSchema } from "./missionQuestions";

const pickedUserSchema = userSchema.pick({
  id: true,
  email: true,
  first_name: true,
  last_name: true,
  organization_id: true,
  profile_image: true,
  created_at: true,
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
  id: z.string().uuid(),
  title: z.string(),
  content: z.string().nullable(),
  user_id: z.string().uuid(),
  mission_instance_id: z.string().uuid(),
  journey_id: z.string().uuid(),
  score: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  view_count: z.number(),
  is_hidden: z.boolean(),
  team_id: z.string().uuid().nullable().optional(),
  is_team_submission: z.boolean().nullable().optional(),
  file_url: z.string().nullable().optional(),
  achievement_status: z.string().nullable().optional(),
  team_points: z.number().nullable().optional(),
  // New fields from database migration
  answers_data: answersDataSchema.nullable().optional(),
  auto_score: z.number().nullable().optional(),
  manual_score: z.number().nullable().optional(),
  total_questions: z.number().nullable().optional(),
  answered_questions: z.number().nullable().optional(),
  completion_rate: z.number().nullable().optional(),
});


export const createPostSchema = postSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  view_count: true,
  is_hidden: true,
});

export const updatePostSchema = createPostSchema.omit({
  journey_id: true,
  mission_instance_id: true,
  score: true,
});

export const userWithOrganizationSchema = pickedUserSchema.extend({
  organizations: pickedOrganizationSchema,
});

const journeyMissionInstanceWithMissionSchema = z.object({
  id: z.string().uuid(),
  journey_week_id: z.string().uuid(),
  missions: pickedMissionSchema,
}).nullable().optional();

export const postWithRelationsSchema = postSchema.extend({
  profiles: userWithOrganizationSchema,
  journey_mission_instances: journeyMissionInstanceWithMissionSchema,
  teamInfo: z.object({
    id: z.string().uuid(),
    name: z.string(),
  }).nullable().optional(),
});

export const postWithRelationsSchemaWithPost = postSchema.extend({
  mission_instance_id: journeyMissionInstanceSchema,
});

export type PostWithRelations = z.infer<typeof postWithRelationsSchema>;
export type Post = z.infer<typeof postSchema>;
export type CreatePost = z.infer<typeof createPostSchema>;
export type UpdatePost = z.infer<typeof updatePostSchema>;
export type PostWithRelationsWithJourneyMissionInstance = z.infer<typeof postWithRelationsSchemaWithPost>;