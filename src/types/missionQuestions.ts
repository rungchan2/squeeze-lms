import { z } from "zod";
import { missionTypeEnum } from "./missions";

// Mission question base schema matching database structure
export const missionQuestionSchema = z.object({
  id: z.string().uuid(),
  mission_id: z.string().uuid(),
  question_text: z.string().min(1, "질문 내용은 필수입니다"),
  question_type: missionTypeEnum,
  question_order: z.number().int().min(0),
  options: z.any().nullable(), // JSONB field for multiple choice options
  correct_answer: z.string().nullable(),
  max_images: z.number().int().min(0).nullable(),
  points: z.number().int().min(0).nullable(),
  is_required: z.boolean().nullable(),
  max_characters: z.number().int().min(1).nullable(),
  placeholder_text: z.string().nullable(),
  required_image: z.boolean().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

// Create mission question schema (without id, timestamps)
export const createMissionQuestionSchema = missionQuestionSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Update mission question schema (all fields optional except mission_id)
export const updateMissionQuestionSchema = createMissionQuestionSchema.partial().extend({
  mission_id: z.string().uuid(),
});

// Multiple choice option schema
export const multipleChoiceOptionSchema = z.object({
  id: z.string().uuid().optional(), // For frontend tracking
  text: z.string().min(1, "선택지 내용은 필수입니다"),
  is_correct: z.boolean().optional(),
});

// Essay question specific validation
export const essayQuestionSchema = createMissionQuestionSchema.extend({
  question_type: z.literal('essay'),
  max_characters: z.number().int().min(1).optional(),
  placeholder_text: z.string().optional(),
});

// Multiple choice question specific validation
export const multipleChoiceQuestionSchema = createMissionQuestionSchema.extend({
  question_type: z.literal('multiple_choice'),
  options: z.array(multipleChoiceOptionSchema).min(2, "최소 2개의 선택지가 필요합니다"),
  correct_answer: z.string().min(1, "정답을 선택해주세요"),
});

// Image upload question specific validation
export const imageUploadQuestionSchema = createMissionQuestionSchema.extend({
  question_type: z.literal('image_upload'),
  max_images: z.number().int().min(1).max(10),
  required_image: z.boolean().optional(),
});

// Mixed question specific validation (text + image)
export const mixedQuestionSchema = createMissionQuestionSchema.extend({
  question_type: z.literal('mixed'),
  max_characters: z.number().int().min(1).optional(),
  max_images: z.number().int().min(1).max(10).optional(),
  placeholder_text: z.string().optional(),
  required_image: z.boolean().optional(),
});

// Union schema for all question types
export const anyQuestionSchema = z.discriminatedUnion("question_type", [
  essayQuestionSchema,
  multipleChoiceQuestionSchema,
  imageUploadQuestionSchema,
  mixedQuestionSchema,
]);

// Answer schemas for structured post data
export const essayAnswerSchema = z.object({
  question_id: z.string().uuid(),
  question_order: z.number(),
  answer_type: z.literal('essay'),
  answer_text: z.string(),
  selected_option: z.null(),
  image_urls: z.array(z.string()).default([]),
  is_correct: z.boolean().nullable(),
  points_earned: z.number().nullable(),
});

export const multipleChoiceAnswerSchema = z.object({
  question_id: z.string().uuid(),
  question_order: z.number(),
  answer_type: z.literal('multiple_choice'),
  answer_text: z.string().nullable(),
  selected_option: z.string(),
  image_urls: z.array(z.string()).default([]),
  is_correct: z.boolean().nullable(),
  points_earned: z.number().nullable(),
});

export const imageUploadAnswerSchema = z.object({
  question_id: z.string().uuid(),
  question_order: z.number(),
  answer_type: z.literal('image_upload'),
  answer_text: z.string().nullable(),
  selected_option: z.null(),
  image_urls: z.array(z.string()).min(1, "최소 1개의 이미지가 필요합니다"),
  is_correct: z.boolean().nullable(),
  points_earned: z.number().nullable(),
});

export const mixedAnswerSchema = z.object({
  question_id: z.string().uuid(),
  question_order: z.number(),
  answer_type: z.literal('mixed'),
  answer_text: z.string().optional(),
  selected_option: z.null(),
  image_urls: z.array(z.string()).default([]),
  is_correct: z.boolean().nullable(),
  points_earned: z.number().nullable(),
});

// Union schema for all answer types
export const anyAnswerSchema = z.discriminatedUnion("answer_type", [
  essayAnswerSchema,
  multipleChoiceAnswerSchema,
  imageUploadAnswerSchema,
  mixedAnswerSchema,
]);

// Complete answers data schema for posts.answers_data field
export const answersDataSchema = z.object({
  answers: z.array(anyAnswerSchema),
  submission_metadata: z.object({
    total_questions: z.number().int(),
    answered_questions: z.number().int(),
    submission_time: z.string(),
    auto_graded: z.boolean().optional(),
    manual_review_required: z.boolean().optional(),
  }),
});

// Question builder form schemas for UI
export const questionBuilderSchema = z.object({
  questions: z.array(anyQuestionSchema),
  mission_id: z.string().uuid(),
});

// Export types
export type MissionQuestion = z.infer<typeof missionQuestionSchema>;
export type CreateMissionQuestion = z.infer<typeof createMissionQuestionSchema>;
export type UpdateMissionQuestion = z.infer<typeof updateMissionQuestionSchema>;

export type MultipleChoiceOption = z.infer<typeof multipleChoiceOptionSchema>;

export type EssayQuestion = z.infer<typeof essayQuestionSchema>;
export type MultipleChoiceQuestion = z.infer<typeof multipleChoiceQuestionSchema>;
export type ImageUploadQuestion = z.infer<typeof imageUploadQuestionSchema>;
export type MixedQuestion = z.infer<typeof mixedQuestionSchema>;
export type AnyQuestion = z.infer<typeof anyQuestionSchema>;

export type EssayAnswer = z.infer<typeof essayAnswerSchema>;
export type MultipleChoiceAnswer = z.infer<typeof multipleChoiceAnswerSchema>;
export type ImageUploadAnswer = z.infer<typeof imageUploadAnswerSchema>;
export type MixedAnswer = z.infer<typeof mixedAnswerSchema>;
export type AnyAnswer = z.infer<typeof anyAnswerSchema>;

export type AnswersData = z.infer<typeof answersDataSchema>;
export type QuestionBuilder = z.infer<typeof questionBuilderSchema>;

// Utility functions for question validation
export const validateQuestionByType = (question: CreateMissionQuestion): boolean => {
  try {
    anyQuestionSchema.parse(question);
    return true;
  } catch {
    return false;
  }
};

export const getQuestionSchemaByType = (type: string) => {
  switch (type) {
    case 'essay':
      return essayQuestionSchema;
    case 'multiple_choice':
      return multipleChoiceQuestionSchema;
    case 'image_upload':
      return imageUploadQuestionSchema;
    case 'mixed':
      return mixedQuestionSchema;
    default:
      throw new Error(`Unknown question type: ${type}`);
  }
};

// Default question templates
export const defaultQuestionTemplates = {
  essay: {
    question_text: "자유롭게 답변해주세요.",
    question_type: 'essay' as const,
    max_characters: 1000,
    placeholder_text: "여기에 답변을 작성해주세요.",
    points: 100,
    is_required: true,
    correct_answer: null,
    max_images: null,
    required_image: null,
    options: null,
  },
  multiple_choice: {
    question_text: "올바른 답을 선택해주세요.",
    question_type: 'multiple_choice' as const,
    options: [
      { text: "선택지 1", is_correct: false },
      { text: "선택지 2", is_correct: true },
      { text: "선택지 3", is_correct: false },
    ],
    correct_answer: "선택지 2",
    points: 100,
    is_required: true,
    max_characters: null,
    max_images: null,
    required_image: null,
    placeholder_text: null,
  },
  image_upload: {
    question_text: "이미지를 업로드해주세요.",
    question_type: 'image_upload' as const,
    max_images: 3,
    required_image: true,
    points: 100,
    is_required: true,
    correct_answer: null,
    max_characters: null,
    placeholder_text: null,
    options: null,
  },
  mixed: {
    question_text: "텍스트와 이미지로 답변해주세요.",
    question_type: 'mixed' as const,
    max_characters: 500,
    max_images: 2,
    placeholder_text: "설명을 작성하고 이미지를 첨부해주세요.",
    points: 100,
    is_required: true,
    correct_answer: null,
    required_image: null,
    options: null,
  },
} as const;