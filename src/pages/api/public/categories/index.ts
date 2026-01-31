import type { APIRoute } from "astro";
import { PublicService } from "../../../../lib/services/public.service";
import { jsonResponse, errorResponse } from "../../../../lib/api-utils";
import type { PublicCategoryListResponseDTO } from "../../../../types";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const { supabase } = locals;

  try {
    const publicService = new PublicService(supabase);
    const categories = await publicService.getPublicCategories();

    const response: PublicCategoryListResponseDTO = {
      data: categories,
    };

    return jsonResponse(response);
  } catch (error) {
    console.error("Error fetching public categories:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
};
