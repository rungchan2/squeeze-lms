import { z } from "zod";

export const journeySchema = z.object({
  id: z.number(),
  name: z.string(),
  date_start: z.string().nullable(),
  date_end: z.string().nullable(),
  image_url: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  uuid: z.string().uuid(),
})

export const createJourneySchema = z.object({
  name: z.string().min(1, { message: "이름을 입력해주세요." }),
  date_start: z.string().min(1, { message: "날짜를 입력해주세요." }),
  date_end: z.string().min(1, { message: "날짜를 입력해주세요." }),
  image_url: z.string().min(1, { message: "이미지를 업로드해주세요." }),
})

export const updateJourneySchema = createJourneySchema.partial()

export type Journey = z.infer<typeof journeySchema>;
export type CreateJourney = z.infer<typeof createJourneySchema>;
export type UpdateJourney = z.infer<typeof updateJourneySchema>;
