import { z } from "zod";
import { missionSchema } from "./missions";
// mission_status ENUM 타입 정의
export const missionStatusEnum = z.enum([
  'not_started',
  'in_progress',
  'submitted',
  'completed',
  'rejected'
]);

export const journeyMissionInstanceSchema = z.object({
  id: z.number(),
  journey_week_id: z.number(),
  mission_id: z.number(),
  status: missionStatusEnum.default('not_started'),
  release_date: z.string().nullable(),
  expiry_date: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  journey_uuid: z.string().nullable(),
});

export const createJourneyMissionInstanceSchema = journeyMissionInstanceSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const journeyMissionInstanceSchemaWithMission = journeyMissionInstanceSchema.extend({
  missions: missionSchema,
});

export const updateJourneyMissionInstanceSchema = createJourneyMissionInstanceSchema.partial();

export type MissionStatus = z.infer<typeof missionStatusEnum>;
export type JourneyMissionInstance = z.infer<typeof journeyMissionInstanceSchema>;
export type CreateJourneyMissionInstance = z.infer<typeof createJourneyMissionInstanceSchema>;
export type UpdateJourneyMissionInstance = z.infer<typeof updateJourneyMissionInstanceSchema>; 
export type JourneyMissionInstanceWithMission = z.infer<typeof journeyMissionInstanceSchemaWithMission>;