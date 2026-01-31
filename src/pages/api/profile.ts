import type { APIRoute } from "astro";
import { ProfileService } from "../../lib/services/profile.service";
import { updateProfileSchema } from "../../lib/schemas/profile.schema";
import { jsonResponse, errorResponse } from "../../lib/api-utils";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const { supabase, user } = locals;

  if (!user) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  try {
    const profileService = new ProfileService(supabase);
    const profile = await profileService.getProfile(user.id);

    if (!profile) {
      return errorResponse("NOT_FOUND", "Profile not found", 404);
    }

    return jsonResponse(profile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
};

export const PUT: APIRoute = async ({ locals, request }) => {
  const { supabase, user } = locals;

  if (!user) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  try {
    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return errorResponse("VALIDATION_ERROR", firstError.message, 400, {
        field: firstError.path.join("."),
        errors: validation.error.errors,
      });
    }

    const profileService = new ProfileService(supabase);
    const updatedProfile = await profileService.updateProfile(user.id, validation.data);

    return jsonResponse(updatedProfile);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse("VALIDATION_ERROR", "Invalid JSON body", 400);
    }
    console.error("Error updating profile:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
};
