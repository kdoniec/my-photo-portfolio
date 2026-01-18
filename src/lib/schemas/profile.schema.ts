import { z } from "zod";

export const updateProfileSchema = z.object({
  display_name: z.string().min(1, "Display name is required").max(100, "Display name must be at most 100 characters"),
  bio: z.string().nullish(),
  contact_email: z.string().email("Invalid email format").max(255, "Email must be at most 255 characters").nullish(),
  contact_phone: z.string().max(20, "Phone must be at most 20 characters").nullish(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
