import type { APIRoute } from "astro";
import { CategoryService } from "../../../lib/services/category.service";
import { createCategorySchema, categoryListQuerySchema } from "../../../lib/schemas/category.schema";
import { jsonResponse, errorResponse } from "../../../lib/api-utils";

export const prerender = false;

export const GET: APIRoute = async ({ locals, url }) => {
  const { supabase, user } = locals;

  if (!user) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  try {
    // Parse and validate query parameters
    const queryParams = {
      sort: url.searchParams.get("sort") || undefined,
      order: url.searchParams.get("order") || undefined,
    };

    const validation = categoryListQuerySchema.safeParse(queryParams);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return errorResponse("VALIDATION_ERROR", firstError.message, 400, {
        field: firstError.path.join("."),
        errors: validation.error.errors,
      });
    }

    const categoryService = new CategoryService(supabase);
    const categories = await categoryService.getCategories(user.id, validation.data);

    return jsonResponse(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
};

export const POST: APIRoute = async ({ locals, request }) => {
  const { supabase, user } = locals;

  if (!user) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  try {
    const body = await request.json();
    const validation = createCategorySchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return errorResponse("VALIDATION_ERROR", firstError.message, 400, {
        field: firstError.path.join("."),
        errors: validation.error.errors,
      });
    }

    const categoryService = new CategoryService(supabase);
    const newCategory = await categoryService.createCategory(user.id, validation.data);

    return jsonResponse(newCategory, 201);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse("VALIDATION_ERROR", "Invalid JSON body", 400);
    }

    const err = error as Error & { code?: string };

    if (err.code === "LIMIT_REACHED") {
      return errorResponse("LIMIT_REACHED", err.message, 409);
    }

    if (err.code === "DUPLICATE_SLUG") {
      return errorResponse("DUPLICATE_SLUG", err.message, 400);
    }

    console.error("Error creating category:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
};
