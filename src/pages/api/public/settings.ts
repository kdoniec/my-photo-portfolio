import type { APIRoute } from "astro";
import { PublicService } from "../../../lib/services/public.service";
import { jsonResponse, errorResponse } from "../../../lib/api-utils";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const { supabase } = locals;

  try {
    const publicService = new PublicService(supabase);
    const settings = await publicService.getPublicSettings();

    if (!settings) {
      return errorResponse("SETTINGS_NOT_FOUND", "Settings not found", 404);
    }

    return jsonResponse(settings);
  } catch (error) {
    console.error("Error fetching public settings:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
};
