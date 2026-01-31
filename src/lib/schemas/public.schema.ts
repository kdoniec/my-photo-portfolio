import { z } from "zod";

/**
 * Query parameters for GET /api/public/categories/:slug/photos
 */
export const publicPhotoListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

/**
 * Category slug path parameter validation
 */
export const categorySlugSchema = z.string().min(1).max(100);

export type PublicPhotoListQueryInput = z.infer<typeof publicPhotoListQuerySchema>;
