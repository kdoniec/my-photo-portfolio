import type { APIRoute } from "astro";
import { SettingsService } from "../../lib/services/settings.service";
import { updateSettingsSchema } from "../../lib/schemas/settings.schema";
import { jsonResponse, errorResponse } from "../../lib/api-utils";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const { supabase, user } = locals;

  if (!user) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  try {
    const settingsService = new SettingsService(supabase);
    const settings = await settingsService.getSettings(user.id);

    if (!settings) {
      return errorResponse("NOT_FOUND", "Settings not found", 404);
    }

    return jsonResponse(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
};

export const PUT: APIRoute = async ({ locals, request }) => {
  const { supabase, user } = locals;

  if (!user) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  try {
    const body = await request.json();
    const validation = updateSettingsSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return errorResponse("VALIDATION_ERROR", firstError.message, 400, {
        field: firstError.path.join("."),
        errors: validation.error.errors,
      });
    }

    const settingsService = new SettingsService(supabase);
    const updatedSettings = await settingsService.updateSettings(user.id, validation.data);

    return jsonResponse(updatedSettings);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse("VALIDATION_ERROR", "Invalid JSON body", 400);
    }
    console.error("Error updating settings:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
};
