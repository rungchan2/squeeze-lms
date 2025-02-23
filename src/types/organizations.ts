import { z } from "zod";

export const organizationSchema = z.object({
  id: z.number().int().nonnegative(),
  name: z.string().min(1),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Organization = z.infer<typeof organizationSchema>;