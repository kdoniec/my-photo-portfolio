import type { APIRoute } from "astro";
import { PhotoService } from "../../../lib/services/photo.service";
import { photoIdSchema, updatePhotoSchema } from "../../../lib/schemas/photo.schema";
import { jsonResponse, errorResponse } from "../../../lib/api-utils";

export const prerender = false;

export const GET: APIRoute = async ({ locals, params }) => {
  const { supabase, user } = locals;

  if (!user) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  // Validate photo ID
  const idValidation = photoIdSchema.safeParse(params.id);
  if (!idValidation.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid photo ID", 400);
  }

  try {
    const photoService = new PhotoService(supabase);
    const photo = await photoService.getPhotoById(user.id, idValidation.data);

    if (!photo) {
      return errorResponse("NOT_FOUND", "Photo not found", 404);
    }

    return jsonResponse(photo);
  } catch (error) {
    console.error("Error fetching photo:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
};

export const PUT: APIRoute = async ({ locals, params, request }) => {
  const { supabase, user } = locals;

  if (!user) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  // Validate photo ID
  const idValidation = photoIdSchema.safeParse(params.id);
  if (!idValidation.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid photo ID", 400);
  }

  try {
    const body = await request.json();
    const validation = updatePhotoSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return errorResponse("VALIDATION_ERROR", firstError.message, 400, {
        field: firstError.path.join("."),
        errors: validation.error.errors,
      });
    }

    const photoService = new PhotoService(supabase);
    const updatedPhoto = await photoService.updatePhoto(user.id, idValidation.data, validation.data);

    if (!updatedPhoto) {
      return errorResponse("NOT_FOUND", "Photo not found", 404);
    }

    return jsonResponse(updatedPhoto);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse("VALIDATION_ERROR", "Invalid JSON body", 400);
    }

    const err = error as Error & { code?: string };

    if (err.code === "INVALID_CATEGORY") {
      return errorResponse("INVALID_CATEGORY", err.message, 400);
    }

    console.error("Error updating photo:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
};

export const DELETE: APIRoute = async ({ locals, params }) => {
  const { supabase, user } = locals;

  if (!user) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  // Validate photo ID
  const idValidation = photoIdSchema.safeParse(params.id);
  if (!idValidation.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid photo ID", 400);
  }

  try {
    const photoService = new PhotoService(supabase);
    const result = await photoService.deletePhoto(user.id, idValidation.data);

    if (!result) {
      return errorResponse("NOT_FOUND", "Photo not found", 404);
    }

    return jsonResponse(result);
  } catch (error) {
    console.error("Error deleting photo:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
};
