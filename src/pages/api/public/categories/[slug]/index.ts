import type { APIRoute } from "astro";
import { PublicService } from "../../../../../lib/services/public.service";
import { categorySlugSchema } from "../../../../../lib/schemas/public.schema";
import { jsonResponse, errorResponse } from "../../../../../lib/api-utils";

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  const { supabase } = locals;

  // Validate slug parameter
  const slugValidation = categorySlugSchema.safeParse(params.slug);
  if (!slugValidation.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid category slug", 400);
  }

  const slug = slugValidation.data;

  try {
    const publicService = new PublicService(supabase);
    const category = await publicService.getPublicCategoryBySlug(slug);

    if (!category) {
      return errorResponse("CATEGORY_NOT_FOUND", "Category not found or has no published photos", 404);
    }

    return jsonResponse(category);
  } catch (error) {
    console.error("Error fetching public category:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
};
