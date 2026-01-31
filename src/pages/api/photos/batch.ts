import type { APIRoute } from "astro";
import { z } from "zod";
import { PhotoService } from "../../../lib/services/photo.service";
import { validatePhotoFile } from "../../../lib/schemas/photo.schema";
import { jsonResponse, errorResponse } from "../../../lib/api-utils";

export const prerender = false;

// Schema for shared metadata
const batchMetadataSchema = z.object({
  category_id: z.string().uuid("Invalid category ID").nullish(),
  is_published: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional()
    .default(false),
});

// Schema for individual photo dimensions
const photoIndexDimensionsSchema = z.object({
  original_width: z.coerce.number().int().positive("Width must be positive"),
  original_height: z.coerce.number().int().positive("Height must be positive"),
  file_size_bytes: z.coerce.number().int().positive("File size must be positive"),
  title: z.string().max(200, "Title must be at most 200 characters").nullish(),
});

interface BatchPhotoData {
  thumbnail: File;
  preview: File;
  original_width: number;
  original_height: number;
  file_size_bytes: number;
  title?: string | null;
}

export const POST: APIRoute = async ({ locals, request }) => {
  const { supabase, user } = locals;

  if (!user) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  // Check Content-Type
  const contentType = request.headers.get("Content-Type");
  if (!contentType?.includes("multipart/form-data")) {
    return errorResponse("VALIDATION_ERROR", "Content-Type must be multipart/form-data", 400);
  }

  try {
    const formData = await request.formData();

    // Extract shared metadata
    const sharedMetadata = {
      category_id: formData.get("category_id") || undefined,
      is_published: formData.get("is_published") || undefined,
    };

    const metadataValidation = batchMetadataSchema.safeParse(sharedMetadata);
    if (!metadataValidation.success) {
      const firstError = metadataValidation.error.errors[0];
      return errorResponse("VALIDATION_ERROR", firstError.message, 400, {
        field: firstError.path.join("."),
        errors: metadataValidation.error.errors,
      });
    }

    // Find all indexed photos in form data
    const photos: BatchPhotoData[] = [];
    const errors: { index: number; error: string }[] = [];

    // Detect how many photos are in the form data by looking for thumbnail_0, thumbnail_1, etc.
    let index = 0;
    while (true) {
      const thumbnail = formData.get(`thumbnail_${index}`) as File | null;
      const preview = formData.get(`preview_${index}`) as File | null;

      // If neither file exists for this index, we've reached the end
      if (!thumbnail && !preview) {
        break;
      }

      // Validate thumbnail
      const thumbnailResult = validatePhotoFile(thumbnail, `thumbnail_${index}`);
      if (!thumbnailResult.success) {
        errors.push({ index, error: thumbnailResult.error.message });
        index++;
        continue;
      }

      // Validate preview
      const previewResult = validatePhotoFile(preview, `preview_${index}`);
      if (!previewResult.success) {
        errors.push({ index, error: previewResult.error.message });
        index++;
        continue;
      }

      // Validate dimensions
      const dimensionsData = {
        original_width: formData.get(`original_width_${index}`),
        original_height: formData.get(`original_height_${index}`),
        file_size_bytes: formData.get(`file_size_bytes_${index}`),
        title: formData.get(`title_${index}`) || undefined,
      };

      const dimensionsValidation = photoIndexDimensionsSchema.safeParse(dimensionsData);
      if (!dimensionsValidation.success) {
        const firstError = dimensionsValidation.error.errors[0];
        errors.push({ index, error: `${firstError.path.join(".")}: ${firstError.message}` });
        index++;
        continue;
      }

      photos.push({
        thumbnail: thumbnailResult.data,
        preview: previewResult.data,
        ...dimensionsValidation.data,
      });

      index++;
    }

    // If no photos were found at all
    if (photos.length === 0 && errors.length === 0) {
      return errorResponse("VALIDATION_ERROR", "No photos provided", 400);
    }

    // Process batch upload
    const photoService = new PhotoService(supabase);
    const result = await photoService.createPhotoBatch(user.id, photos, {
      category_id: metadataValidation.data.category_id,
      is_published: metadataValidation.data.is_published,
    });

    // Add validation errors to failed list
    for (const err of errors) {
      result.failed.push({
        filename: `photo_${err.index}`,
        error: err.error,
      });
      result.summary.total++;
      result.summary.failed++;
    }

    return jsonResponse(result, 201);
  } catch (error) {
    console.error("Error in batch photo upload:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
};
