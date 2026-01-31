import { z } from "zod";

export const updateSettingsSchema = z.object({
  site_title: z.string().max(100, "Site title must be at most 100 characters").nullish(),
  site_description: z.string().max(300, "Site description must be at most 300 characters").nullish(),
});

export const settingsFormSchema = z.object({
  site_title: z.string().max(100, "Tytuł strony może mieć maksymalnie 100 znaków").nullish().or(z.literal("")),
  site_description: z.string().max(300, "Opis strony może mieć maksymalnie 300 znaków").nullish().or(z.literal("")),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type SettingsFormData = z.infer<typeof settingsFormSchema>;
