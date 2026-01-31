import type { APIRoute } from "astro";
import { PublicService } from "../../../lib/services/public.service";
import { jsonResponse, errorResponse } from "../../../lib/api-utils";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const { supabase } = locals;

  try {
    const publicService = new PublicService(supabase);
    const profile = await publicService.getPublicProfile();

    if (!profile) {
      return errorResponse("PROFILE_NOT_FOUND", "Profile not found", 404);
    }

    return jsonResponse(profile);
  } catch (error) {
    console.error("Error fetching public profile:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
};
