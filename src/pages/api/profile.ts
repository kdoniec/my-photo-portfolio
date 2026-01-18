import type { APIRoute } from "astro";
import { ProfileService } from "../../lib/services/profile.service";
import { updateProfileSchema } from "../../lib/schemas/profile.schema";
import { jsonResponse, errorResponse } from "../../lib/api-utils";

export const prerender = false;

// TODO: Włączyć auth gdy będzie gotowe
const TEST_USER_ID = "fd049c35-cca3-4933-87b9-fc66bb53f125";

export const GET: APIRoute = async ({ locals }) => {
  const { supabase, user } = locals;
  const userId = user?.id ?? TEST_USER_ID;

  try {
    const profileService = new ProfileService(supabase);
    const profile = await profileService.getProfile(userId);

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
  const userId = user?.id ?? TEST_USER_ID;

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
    const updatedProfile = await profileService.updateProfile(userId, validation.data);

    return jsonResponse(updatedProfile);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse("VALIDATION_ERROR", "Invalid JSON body", 400);
    }
    console.error("Error updating profile:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
};
