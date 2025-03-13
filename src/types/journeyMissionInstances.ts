import { z } from "zod";

// mission_status ENUM 타입 정의
export const missionStatusEnum = z.enum([
  'not_started',
  'in_progress',
  'submitted',
  'completed',
  'failed'
]);

export const journeyMissionInstanceSchema = z.object({
  id: z.number(),
  week_id: z.number(),
  mission_id: z.number(),
  status: missionStatusEnum.default('not_started'),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export const createJourneyMissionInstanceSchema = journeyMissionInstanceSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const updateJourneyMissionInstanceSchema = createJourneyMissionInstanceSchema.partial();

export type MissionStatus = z.infer<typeof missionStatusEnum>;
export type JourneyMissionInstance = z.infer<typeof journeyMissionInstanceSchema>;
export type CreateJourneyMissionInstance = z.infer<typeof createJourneyMissionInstanceSchema>;
export type UpdateJourneyMissionInstance = z.infer<typeof updateJourneyMissionInstanceSchema>; 