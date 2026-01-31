import type { APIRoute } from "astro";
import { PublicService } from "../../../../../lib/services/public.service";
import { categorySlugSchema, publicPhotoListQuerySchema } from "../../../../../lib/schemas/public.schema";
import { jsonResponse, errorResponse } from "../../../../../lib/api-utils";

export const prerender = false;

export const GET: APIRoute = async ({ params, url, locals }) => {
  const { supabase } = locals;

  // Validate slug parameter
  const slugValidation = categorySlugSchema.safeParse(params.slug);
  if (!slugValidation.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid category slug", 400);
  }

  const slug = slugValidation.data;

  // Parse and validate query parameters
  const queryParams = Object.fromEntries(url.searchParams);
  const queryValidation = publicPhotoListQuerySchema.safeParse(queryParams);

  if (!queryValidation.success) {
    const firstError = queryValidation.error.errors[0];
    return errorResponse("INVALID_QUERY_PARAMS", firstError.message, 400, {
      field: firstError.path.join("."),
      errors: queryValidation.error.errors,
    });
  }

  const query = queryValidation.data;

  try {
    const publicService = new PublicService(supabase);
    const result = await publicService.getPublicPhotosByCategory(slug, query);

    if (!result) {
      return errorResponse("CATEGORY_NOT_FOUND", "Category not found", 404);
    }

    return jsonResponse(result);
  } catch (error) {
    console.error("Error fetching public photos:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
};
