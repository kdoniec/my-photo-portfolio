import type { APIRoute } from "astro";
import { CategoryService } from "../../../lib/services/category.service";
import { reorderCategorySchema } from "../../../lib/schemas/category.schema";
import { jsonResponse, errorResponse } from "../../../lib/api-utils";

export const prerender = false;

export const PUT: APIRoute = async ({ locals, request }) => {
  const { supabase, user } = locals;

  if (!user) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  try {
    const body = await request.json();
    const validation = reorderCategorySchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return errorResponse("VALIDATION_ERROR", firstError.message, 400, {
        field: firstError.path.join("."),
        errors: validation.error.errors,
      });
    }

    const categoryService = new CategoryService(supabase);
    await categoryService.reorderCategories(user.id, validation.data.order);

    return jsonResponse({ message: "Categories reordered successfully" });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse("VALIDATION_ERROR", "Invalid JSON body", 400);
    }

    console.error("Error reordering categories:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
};
