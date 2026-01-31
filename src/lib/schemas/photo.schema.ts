import { z } from "zod";

// Path parameter validation
export const photoIdSchema = z.string().uuid("Invalid photo ID");

// Query parameters for GET /api/photos
export const photoListQuerySchema = z.object({
  category_id: z.union([z.string().uuid("Invalid category ID"), z.literal("uncategorized")]).optional(),
  is_published: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  page: z.coerce.number().int().min(1, "Page must be at least 1").default(1),
  limit: z.coerce.number().int().min(1, "Limit must be at least 1").max(50, "Limit must be at most 50").default(20),
  sort: z.enum(["created_at", "title"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

// Metadata for POST /api/photos (from form data)
export const createPhotoMetadataSchema = z.object({
  title: z.string().max(200, "Title must be at most 200 characters").nullish(),
  category_id: z.string().uuid("Invalid category ID").nullish(),
  is_published: z.coerce.boolean().default(false),
});

// File dimensions and size for POST /api/photos (from form data)
export const photoFileDimensionsSchema = z.object({
  original_width: z.coerce.number().int().positive("Width must be positive"),
  original_height: z.coerce.number().int().positive("Height must be positive"),
  file_size_bytes: z.coerce.number().int().positive("File size must be positive"),
});

// Update photo metadata - PUT /api/photos/:id
export const updatePhotoSchema = z.object({
  title: z.string().max(200, "Title must be at most 200 characters").nullish(),
  category_id: z.string().uuid("Invalid category ID").nullish(),
  is_published: z.boolean().optional(),
});

// Publish/unpublish photo - PATCH /api/photos/:id/publish
export const publishPhotoSchema = z.object({
  is_published: z.boolean({ required_error: "is_published is required" }),
});

// File validation constants
export const ALLOWED_MIME_TYPES = ["image/jpeg"] as const;
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_PHOTOS = 200;

// File validation error codes
export type FileValidationErrorCode = "REQUIRED" | "INVALID_TYPE" | "FILE_TOO_LARGE";

export interface FileValidationError {
  code: FileValidationErrorCode;
  message: string;
}

// Helper function to validate uploaded file
export function validatePhotoFile(
  file: File | null | undefined,
  fieldName: string
): { success: true; data: File } | { success: false; error: FileValidationError } {
  if (!file || !(file instanceof File)) {
    return { success: false, error: { code: "REQUIRED", message: `${fieldName} is required` } };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return { success: false, error: { code: "INVALID_TYPE", message: `${fieldName} must be JPEG` } };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { success: false, error: { code: "FILE_TOO_LARGE", message: `${fieldName} must be at most 10MB` } };
  }

  return { success: true, data: file };
}

// Export inferred types
export type PhotoListQueryInput = z.infer<typeof photoListQuerySchema>;
export type CreatePhotoMetadataInput = z.infer<typeof createPhotoMetadataSchema>;
export type PhotoFileDimensionsInput = z.infer<typeof photoFileDimensionsSchema>;
export type UpdatePhotoInput = z.infer<typeof updatePhotoSchema>;
export type PublishPhotoInput = z.infer<typeof publishPhotoSchema>;

// Frontend form schema (Polish messages)
export const photoFormSchema = z.object({
  title: z.string().max(200, "Tytuł może mieć maksymalnie 200 znaków").nullish().or(z.literal("")),
  category_id: z.string().uuid().nullish(),
  is_published: z.boolean(),
});

export type PhotoFormData = z.infer<typeof photoFormSchema>;
