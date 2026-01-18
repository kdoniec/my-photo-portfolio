import type { APIRoute } from "astro";
import { CategoryService } from "../../../lib/services/category.service";
import { categoryIdSchema, updateCategorySchema } from "../../../lib/schemas/category.schema";
import { jsonResponse, errorResponse } from "../../../lib/api-utils";

export const prerender = false;

export const GET: APIRoute = async ({ locals, params }) => {
  const { supabase, user } = locals;

  if (!user) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  // Validate category ID
  const idValidation = categoryIdSchema.safeParse(params.id);
  if (!idValidation.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid category ID", 400);
  }

  try {
    const categoryService = new CategoryService(supabase);
    const category = await categoryService.getCategoryById(user.id, idValidation.data);

    if (!category) {
      return errorResponse("NOT_FOUND", "Category not found", 404);
    }

    return jsonResponse(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
};

export const PUT: APIRoute = async ({ locals, params, request }) => {
  const { supabase, user } = locals;

  if (!user) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  // Validate category ID
  const idValidation = categoryIdSchema.safeParse(params.id);
  if (!idValidation.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid category ID", 400);
  }

  try {
    const body = await request.json();
    const validation = updateCategorySchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return errorResponse("VALIDATION_ERROR", firstError.message, 400, {
        field: firstError.path.join("."),
        errors: validation.error.errors,
      });
    }

    const categoryService = new CategoryService(supabase);
    const updatedCategory = await categoryService.updateCategory(user.id, idValidation.data, validation.data);

    if (!updatedCategory) {
      return errorResponse("NOT_FOUND", "Category not found", 404);
    }

    return jsonResponse(updatedCategory);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse("VALIDATION_ERROR", "Invalid JSON body", 400);
    }

    const err = error as Error & { code?: string };

    if (err.code === "DUPLICATE_SLUG") {
      return errorResponse("DUPLICATE_SLUG", err.message, 400);
    }

    if (err.code === "INVALID_PHOTO") {
      return errorResponse("INVALID_PHOTO", err.message, 400);
    }

    console.error("Error updating category:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
};

export const DELETE: APIRoute = async ({ locals, params }) => {
  const { supabase, user } = locals;

  if (!user) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  // Validate category ID
  const idValidation = categoryIdSchema.safeParse(params.id);
  if (!idValidation.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid category ID", 400);
  }

  try {
    const categoryService = new CategoryService(supabase);
    const result = await categoryService.deleteCategory(user.id, idValidation.data);

    if (!result) {
      return errorResponse("NOT_FOUND", "Category not found", 404);
    }

    return jsonResponse(result);
  } catch (error) {
    console.error("Error deleting category:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
};
