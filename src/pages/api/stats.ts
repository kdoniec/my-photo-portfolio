import type { APIRoute } from "astro";
import { StatsService } from "../../lib/services/stats.service";
import { jsonResponse, errorResponse } from "../../lib/api-utils";

export const prerender = false;

// TODO: Remove when auth is fully implemented
const TEST_USER_ID = "fd049c35-cca3-4933-87b9-fc66bb53f125";

export const GET: APIRoute = async ({ locals }) => {
  const { supabase, user } = locals;
  const userId = user?.id ?? TEST_USER_ID;

  // Require authentication
  if (!user && !TEST_USER_ID) {
    return errorResponse("UNAUTHORIZED", "Not authenticated", 401);
  }

  try {
    const statsService = new StatsService(supabase);
    const stats = await statsService.getStats(userId);

    return jsonResponse(stats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
};
