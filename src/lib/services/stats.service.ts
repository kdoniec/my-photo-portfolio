import type { SupabaseClient } from "../../db/supabase.client";
import type { StatsDTO } from "../../types";

const MAX_PHOTOS = 200;
const MAX_CATEGORIES = 10;

export class StatsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get usage statistics for the authenticated user
   */
  async getStats(userId: string): Promise<StatsDTO> {
    // Count user's photos
    const { count: photosCount, error: photosError } = await this.supabase
      .from("photos")
      .select("*", { count: "exact", head: true })
      .eq("photographer_id", userId);

    if (photosError) {
      throw photosError;
    }

    // Count user's categories
    const { count: categoriesCount, error: categoriesError } = await this.supabase
      .from("categories")
      .select("*", { count: "exact", head: true })
      .eq("photographer_id", userId);

    if (categoriesError) {
      throw categoriesError;
    }

    // Calculate storage used (sum of file_size_bytes)
    const { data: storageData, error: storageError } = await this.supabase
      .from("photos")
      .select("file_size_bytes")
      .eq("photographer_id", userId);

    let storageUsedBytes: number | null = null;

    if (!storageError && storageData) {
      storageUsedBytes = storageData.reduce((sum, photo) => sum + (photo.file_size_bytes || 0), 0);
    }

    return {
      photos: {
        count: photosCount || 0,
        limit: MAX_PHOTOS,
      },
      categories: {
        count: categoriesCount || 0,
        limit: MAX_CATEGORIES,
      },
      storage_used_bytes: storageUsedBytes,
    };
  }
}
