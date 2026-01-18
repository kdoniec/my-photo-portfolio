import { z } from "zod";

export const updateSettingsSchema = z.object({
  site_title: z.string().max(100, "Site title must be at most 100 characters").nullish(),
  site_description: z.string().max(300, "Site description must be at most 300 characters").nullish(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
