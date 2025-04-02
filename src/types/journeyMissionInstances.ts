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
  status: z.any(),
  release_date: z.string(),
  expiry_date: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  journey_uuid: z.string(),
});

export const createJourneyMissionInstanceSchema = journeyMissionInstanceSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const journeyMissionInstanceSchemaWithMission = journeyMissionInstanceSchema.extend({
  mission: missionSchema,
});

export const updateJourneyMissionInstanceSchema = createJourneyMissionInstanceSchema.partial();


export type MissionStatus = z.infer<typeof missionStatusEnum>;
export type JourneyMissionInstance = z.infer<typeof journeyMissionInstanceSchema>;
export type CreateJourneyMissionInstance = z.infer<typeof createJourneyMissionInstanceSchema>;
export type UpdateJourneyMissionInstance = z.infer<typeof updateJourneyMissionInstanceSchema>; 
export type JourneyMissionInstanceWithMission = z.infer<typeof journeyMissionInstanceSchemaWithMission>;
