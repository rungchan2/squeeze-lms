import { z } from 'zod';

// Word Group Schema
export const WordGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  words: z.array(z.string()),
  isVisible: z.boolean().default(true),
  order: z.number().default(0),
});

export type WordGroup = z.infer<typeof WordGroupSchema>;

// Word Groups Settings Schema
export const WordGroupsSettingsSchema = z.object({
  minFrequency: z.number().default(2),
  showQuestionText: z.boolean().default(true),
  excludedWords: z.array(z.string()).default([]),
});

export type WordGroupsSettings = z.infer<typeof WordGroupsSettingsSchema>;

// Word Groups Configuration Schema
export const WordGroupsConfigSchema = z.object({
  groups: z.array(WordGroupSchema).default([]),
  settings: WordGroupsSettingsSchema.default({}),
});

export type WordGroupsConfig = z.infer<typeof WordGroupsConfigSchema>;

// Statistics Report Schema
export const StatisticsReportSchema = z.object({
  id: z.string().uuid(),
  journey_id: z.string().uuid().nullable(),
  created_by: z.string().uuid().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  word_groups: WordGroupsConfigSchema,
  metadata: z.record(z.any()).default({}),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export type StatisticsReport = z.infer<typeof StatisticsReportSchema>;

// Create Report Input Schema
export const CreateStatisticsReportSchema = z.object({
  journey_id: z.string().uuid(),
  name: z.string().min(1, 'Report name is required'),
  description: z.string().optional(),
  word_groups: WordGroupsConfigSchema,
  metadata: z.record(z.any()).optional(),
});

export type CreateStatisticsReport = z.infer<typeof CreateStatisticsReportSchema>;

// Update Report Input Schema
export const UpdateStatisticsReportSchema = z.object({
  name: z.string().min(1, 'Report name is required').optional(),
  description: z.string().nullable().optional(),
  word_groups: WordGroupsConfigSchema.optional(),
  metadata: z.record(z.any()).optional(),
});

export type UpdateStatisticsReport = z.infer<typeof UpdateStatisticsReportSchema>;

// Word Frequency Result Schema (from backend API)
export const WordFrequencyResultSchema = z.object({
  word_frequency: z.array(z.tuple([z.string(), z.number()])),
  total_words: z.number().optional(),
  unique_words: z.number().optional(),
  total_posts: z.number().optional(),
  processed_at: z.string().optional(),
  analyzed_at: z.string().optional(),
  cache_hit: z.boolean().optional(),
});

export type WordFrequencyResult = z.infer<typeof WordFrequencyResultSchema>;

// Group Words Result Schema (from backend API)
export const GroupWordsResultSchema = z.object({
  groups: z.array(z.object({
    label: z.string(),
    words: z.array(z.string()),
  })),
  total_groups: z.number(),
});

export type GroupWordsResult = z.infer<typeof GroupWordsResultSchema>;