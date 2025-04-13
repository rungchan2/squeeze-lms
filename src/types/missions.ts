import { z } from "zod";

export const missionSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  mission_type: z.string().nullable(),
  points: z.number().nullable(),
  expiry_date: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
})

export const createMissionSchema = missionSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const updateMissionSchema = createMissionSchema.partial()

export type Mission = z.infer<typeof missionSchema>;
export type CreateMission = z.infer<typeof createMissionSchema>;
export type UpdateMission = z.infer<typeof updateMissionSchema>;
