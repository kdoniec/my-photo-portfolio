import type { APIRoute } from "astro";
import { StatsService } from "../../lib/services/stats.service";
import { jsonResponse, errorResponse } from "../../lib/api-utils";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const { supabase, user } = locals;

  if (!user) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  try {
    const statsService = new StatsService(supabase);
    const stats = await statsService.getStats(user.id);

    return jsonResponse(stats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
};
