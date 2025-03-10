import { z } from "zod";

export const organizationSchema = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
})

export const createOrganizationSchema = organizationSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const updateOrganizationSchema = createOrganizationSchema.partial()

export type Organization = z.infer<typeof organizationSchema>;