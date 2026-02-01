import type { SupabaseClient } from "../../db/supabase.client";
import type {
  PublicProfileDTO,
  PublicSettingsDTO,
  PublicCategoryDTO,
  PublicCategoryDetailDTO,
  PublicPhotoDTO,
  PublicPhotoListResponseDTO,
  PublicPhotoListQuery,
} from "../../types";

const STORAGE_BUCKET = "photos";

export class PublicService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get the public profile (first available profile for single-tenant app)
   */
  async getPublicProfile(): Promise<PublicProfileDTO | null> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("display_name, bio, contact_email, contact_phone")
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }

    return data;
  }

  /**
   * Get public settings for SEO meta tags
   */
  async getPublicSettings(): Promise<PublicSettingsDTO | null> {
    const { data, error } = await this.supabase
      .from("photographer_settings")
      .select("site_title, site_description")
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }

    return data;
  }

  /**
   * Get all public categories (only those with published photos)
   */
  async getPublicCategories(): Promise<PublicCategoryDTO[]> {
    // Get all categories
    const { data: categories, error } = await this.supabase
      .from("categories")
      .select(
        `
        id,
        name,
        slug,
        description,
        cover_photo_id,
        display_order
      `
      )
      .order("display_order", { ascending: true });

    if (error) {
      throw error;
    }

    if (!categories || categories.length === 0) {
      return [];
    }

    // Filter categories that have published photos and add counts
    const result: PublicCategoryDTO[] = [];

    for (const category of categories) {
      const publishedCount = await this.countPublishedPhotosInCategory(category.id);

      // Only include categories with published photos
      if (publishedCount > 0) {
        const coverPhotoUrl = category.cover_photo_id ? await this.getCoverPhotoUrl(category.cover_photo_id) : null;

        result.push({
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          cover_photo_url: coverPhotoUrl,
          display_order: category.display_order,
          photos_count: publishedCount,
        });
      }
    }

    return result;
  }

  /**
   * Get a single public category by slug (only if it has published photos)
   */
  async getPublicCategoryBySlug(slug: string): Promise<PublicCategoryDetailDTO | null> {
    const { data: category, error } = await this.supabase
      .from("categories")
      .select(
        `
        id,
        name,
        slug,
        description,
        cover_photo_id
      `
      )
      .eq("slug", slug)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }

    // Check if category has published photos
    const publishedCount = await this.countPublishedPhotosInCategory(category.id);
    if (publishedCount === 0) {
      return null;
    }

    const coverPhotoUrl = category.cover_photo_id ? await this.getCoverPhotoUrl(category.cover_photo_id) : null;

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      cover_photo_url: coverPhotoUrl,
    };
  }

  /**
   * Get published photos in a category with pagination
   */
  async getPublicPhotosByCategory(
    slug: string,
    query: PublicPhotoListQuery = {}
  ): Promise<PublicPhotoListResponseDTO | null> {
    const { page = 1, limit = 20 } = query;

    // First, get the category by slug
    const { data: category, error: categoryError } = await this.supabase
      .from("categories")
      .select("id")
      .eq("slug", slug)
      .single();

    if (categoryError) {
      if (categoryError.code === "PGRST116") {
        return null;
      }
      throw categoryError;
    }

    // Get total count of published photos
    const { count: totalCount, error: countError } = await this.supabase
      .from("photos")
      .select("*", { count: "exact", head: true })
      .eq("category_id", category.id)
      .eq("is_published", true);

    if (countError) {
      throw countError;
    }

    const total = totalCount || 0;
    const totalPages = Math.ceil(total / limit);

    // Get paginated photos
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: photos, error: photosError } = await this.supabase
      .from("photos")
      .select(
        `
        id,
        title,
        thumbnail_path,
        preview_path,
        original_width,
        original_height
      `
      )
      .eq("category_id", category.id)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (photosError) {
      throw photosError;
    }

    // Map to DTOs with signed URLs
    const photoDTOs: PublicPhotoDTO[] = await Promise.all(
      (photos || []).map(async (photo) => {
        const [thumbnailUrl, previewUrl] = await Promise.all([
          this.getPhotoUrl(photo.thumbnail_path),
          this.getPhotoUrl(photo.preview_path),
        ]);

        return {
          id: photo.id,
          title: photo.title,
          thumbnail_url: thumbnailUrl,
          preview_url: previewUrl,
          original_width: photo.original_width,
          original_height: photo.original_height,
        };
      })
    );

    return {
      data: photoDTOs,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    };
  }

  /**
   * Count published photos in a category
   */
  private async countPublishedPhotosInCategory(categoryId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("photos")
      .select("*", { count: "exact", head: true })
      .eq("category_id", categoryId)
      .eq("is_published", true);

    if (error) {
      return 0;
    }

    return count || 0;
  }

  /**
   * Get cover photo URL from photo ID
   */
  private async getCoverPhotoUrl(photoId: string): Promise<string | null> {
    const { data: photo, error } = await this.supabase
      .from("photos")
      .select("thumbnail_path")
      .eq("id", photoId)
      .single();

    if (error || !photo) {
      return null;
    }

    return await this.getPhotoUrl(photo.thumbnail_path);
  }

  /**
   * Generate signed URL for a storage path (valid for 1 hour)
   */
  private async getPhotoUrl(path: string): Promise<string> {
    const { data, error } = await this.supabase.storage.from(STORAGE_BUCKET).createSignedUrl(path, 3600);

    if (error || !data?.signedUrl) {
      console.error("Failed to create signed URL for:", path, error);
      return `${STORAGE_BUCKET}/${path}`;
    }

    return data.signedUrl;
  }
}
