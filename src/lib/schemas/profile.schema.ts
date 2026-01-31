import { z } from "zod";

export const updateProfileSchema = z.object({
  display_name: z.string().min(1, "Display name is required").max(100, "Display name must be at most 100 characters"),
  bio: z.string().nullish(),
  contact_email: z.string().email("Invalid email format").max(255, "Email must be at most 255 characters").nullish(),
  contact_phone: z.string().max(20, "Phone must be at most 20 characters").nullish(),
});

export const profileFormSchema = z.object({
  display_name: z
    .string()
    .min(1, "Nazwa wyświetlana jest wymagana")
    .max(100, "Nazwa wyświetlana może mieć maksymalnie 100 znaków"),
  bio: z.string().max(500, "Bio może mieć maksymalnie 500 znaków").nullish().or(z.literal("")),
  contact_email: z
    .string()
    .email("Nieprawidłowy format email")
    .max(255, "Email może mieć maksymalnie 255 znaków")
    .nullish()
    .or(z.literal("")),
  contact_phone: z.string().max(20, "Telefon może mieć maksymalnie 20 znaków").nullish().or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ProfileFormData = z.infer<typeof profileFormSchema>;
