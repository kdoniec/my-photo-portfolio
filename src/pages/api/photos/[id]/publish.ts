import type { APIRoute } from "astro";
import { PhotoService } from "../../../../lib/services/photo.service";
import { photoIdSchema, publishPhotoSchema } from "../../../../lib/schemas/photo.schema";
import { jsonResponse, errorResponse } from "../../../../lib/api-utils";

export const prerender = false;

export const PATCH: APIRoute = async ({ locals, params, request }) => {
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
    const validation = publishPhotoSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return errorResponse("VALIDATION_ERROR", firstError.message, 400, {
        field: firstError.path.join("."),
        errors: validation.error.errors,
      });
    }

    const photoService = new PhotoService(supabase);
    const result = await photoService.publishPhoto(user.id, idValidation.data, validation.data.is_published);

    if (!result) {
      return errorResponse("NOT_FOUND", "Photo not found", 404);
    }

    return jsonResponse(result);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse("VALIDATION_ERROR", "Invalid JSON body", 400);
    }

    console.error("Error updating photo publish status:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
};
