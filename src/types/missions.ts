import { z } from "zod";

// Mission type ENUM values from database
export const missionTypeEnum = z.enum([
  'essay',
  'multiple_choice', 
  'image_upload',
  'mixed'
]);

export const missionSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  mission_type: missionTypeEnum.nullable(),
  points: z.number().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
})

export const createMissionSchema = missionSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const updateMissionSchema = createMissionSchema.partial()

// Mission with questions schema for enhanced missions
export const missionWithQuestionsSchema = missionSchema.extend({
  questions: z.array(z.object({
    id: z.string().uuid(),
    question_text: z.string(),
    question_type: missionTypeEnum,
    question_order: z.number(),
    options: z.any().nullable(), // JSONB field for multiple choice options
    correct_answer: z.string().nullable(),
    max_images: z.number().nullable(),
    points: z.number().nullable(),
    is_required: z.boolean().nullable(),
    max_characters: z.number().nullable(),
    min_characters: z.number().nullable(),
    placeholder_text: z.string().nullable(),
    required_image: z.boolean().nullable(),
    multiple_select: z.boolean().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
  })).optional()
});

// Legacy mission type values for backward compatibility
export const legacyMissionTypes = {
  text: 'essay',
  image: 'image_upload', 
  team: 'essay', // team missions are essentially essay type
  individual: 'essay',
  '과제': 'essay'
} as const;

export type MissionType = z.infer<typeof missionTypeEnum>;
export type Mission = z.infer<typeof missionSchema>;
export type CreateMission = z.infer<typeof createMissionSchema>;
export type UpdateMission = z.infer<typeof updateMissionSchema>;
export type MissionWithQuestions = z.infer<typeof missionWithQuestionsSchema>;
