import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be at most 100 characters"),
  description: z.string().max(500, "Description must be at most 500 characters").nullish(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be at most 100 characters"),
  description: z.string().max(500, "Description must be at most 500 characters").nullish(),
  cover_photo_id: z.string().uuid("Invalid photo ID").nullish(),
});

export const reorderCategorySchema = z.object({
  order: z
    .array(
      z.object({
        id: z.string().uuid("Invalid category ID"),
        display_order: z.number().int().min(0, "Display order must be non-negative"),
      })
    )
    .min(1, "Order array cannot be empty"),
});

export const categoryIdSchema = z.string().uuid("Invalid category ID");

export const categoryListQuerySchema = z.object({
  sort: z.enum(["display_order", "name", "created_at"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ReorderCategoryInput = z.infer<typeof reorderCategorySchema>;
export type CategoryListQueryInput = z.infer<typeof categoryListQuerySchema>;

// Frontend form schema (Polish messages)
export const categoryFormSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana").max(100, "Nazwa może mieć maksymalnie 100 znaków"),
  description: z.string().max(500, "Opis może mieć maksymalnie 500 znaków").nullish().or(z.literal("")),
  cover_photo_id: z.string().uuid().nullish(),
});

export type CategoryFormData = z.infer<typeof categoryFormSchema>;
