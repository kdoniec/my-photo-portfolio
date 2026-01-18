import type { APIRoute } from "astro";
import { PhotoService } from "../../../lib/services/photo.service";
import {
  photoListQuerySchema,
  createPhotoMetadataSchema,
  photoFileDimensionsSchema,
  validatePhotoFile,
} from "../../../lib/schemas/photo.schema";
import { jsonResponse, errorResponse } from "../../../lib/api-utils";

export const prerender = false;

export const GET: APIRoute = async ({ locals, url }) => {
  const { supabase, user } = locals;

  if (!user) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  try {
    // Parse query parameters
    const queryParams = {
      category_id: url.searchParams.get("category_id") || undefined,
      is_published: url.searchParams.get("is_published") || undefined,
      page: url.searchParams.get("page") || undefined,
      limit: url.searchParams.get("limit") || undefined,
      sort: url.searchParams.get("sort") || undefined,
      order: url.searchParams.get("order") || undefined,
    };

    const validation = photoListQuerySchema.safeParse(queryParams);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return errorResponse("VALIDATION_ERROR", firstError.message, 400, {
        field: firstError.path.join("."),
        errors: validation.error.errors,
      });
    }

    const photoService = new PhotoService(supabase);
    const photos = await photoService.getPhotos(user.id, validation.data);

    return jsonResponse(photos);
  } catch (error) {
    console.error("Error fetching photos:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
};

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

    // Extract and validate files
    const thumbnailResult = validatePhotoFile(formData.get("thumbnail") as File | null, "thumbnail");
    if (!thumbnailResult.success) {
      return errorResponse("VALIDATION_ERROR", thumbnailResult.error, 400, {
        field: "thumbnail",
      });
    }

    const previewResult = validatePhotoFile(formData.get("preview") as File | null, "preview");
    if (!previewResult.success) {
      return errorResponse("VALIDATION_ERROR", previewResult.error, 400, {
        field: "preview",
      });
    }

    // Extract and validate file dimensions
    const dimensionsData = {
      original_width: formData.get("original_width"),
      original_height: formData.get("original_height"),
      file_size_bytes: formData.get("file_size_bytes"),
    };

    const dimensionsValidation = photoFileDimensionsSchema.safeParse(dimensionsData);
    if (!dimensionsValidation.success) {
      const firstError = dimensionsValidation.error.errors[0];
      return errorResponse("VALIDATION_ERROR", firstError.message, 400, {
        field: firstError.path.join("."),
        errors: dimensionsValidation.error.errors,
      });
    }

    // Extract and validate metadata
    const metadataData = {
      title: formData.get("title") || undefined,
      category_id: formData.get("category_id") || undefined,
      is_published: formData.get("is_published") || undefined,
    };

    const metadataValidation = createPhotoMetadataSchema.safeParse(metadataData);
    if (!metadataValidation.success) {
      const firstError = metadataValidation.error.errors[0];
      return errorResponse("VALIDATION_ERROR", firstError.message, 400, {
        field: firstError.path.join("."),
        errors: metadataValidation.error.errors,
      });
    }

    // Create photo
    const photoService = new PhotoService(supabase);
    const newPhoto = await photoService.createPhoto(user.id, {
      thumbnail: thumbnailResult.data,
      preview: previewResult.data,
      ...dimensionsValidation.data,
      ...metadataValidation.data,
    });

    return jsonResponse(newPhoto, 201);
  } catch (error) {
    const err = error as Error & { code?: string };

    if (err.code === "LIMIT_REACHED") {
      return errorResponse("LIMIT_REACHED", err.message, 409);
    }

    if (err.code === "INVALID_CATEGORY") {
      return errorResponse("INVALID_CATEGORY", err.message, 400);
    }

    if (err.code === "UPLOAD_FAILED") {
      return errorResponse("UPLOAD_FAILED", err.message, 500);
    }

    console.error("Error creating photo:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
};
