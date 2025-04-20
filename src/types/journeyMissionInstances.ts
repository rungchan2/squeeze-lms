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
  id: z.string().uuid(),
  journey_week_id: z.string().uuid(),
  mission_id: z.string().uuid(),
  status: missionStatusEnum.nullable(),
  release_date: z.string().nullable(),
  expiry_date: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  journey_id: z.string().uuid().nullable(),
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
