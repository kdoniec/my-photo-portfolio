import type { SupabaseClient } from "../../db/supabase.client";
import type {
  PhotoDTO,
  PhotoListResponseDTO,
  UpdatePhotoCommand,
  PublishPhotoResponseDTO,
  PhotoListQuery,
  BatchPhotoUploadResponseDTO,
  BatchUploadedPhoto,
  BatchFailedPhoto,
} from "../../types";
import { MAX_PHOTOS } from "../schemas/photo.schema";

const STORAGE_BUCKET = "photos";

interface CreatePhotoInput {
  thumbnail: File;
  preview: File;
  original_width: number;
  original_height: number;
  file_size_bytes: number;
  title?: string | null;
  category_id?: string | null;
  is_published?: boolean;
}

export class PhotoService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get photos list with filtering, sorting, and pagination
   */
  async getPhotos(userId: string, query: PhotoListQuery = {}): Promise<PhotoListResponseDTO> {
    const { category_id, is_published, page = 1, limit = 20, sort = "created_at", order = "desc" } = query;

    // Build base query
    let queryBuilder = this.supabase
      .from("photos")
      .select(
        `
        id,
        title,
        category_id,
        thumbnail_path,
        preview_path,
        original_width,
        original_height,
        file_size_bytes,
        mime_type,
        is_published,
        created_at,
        updated_at,
        categories!photos_category_id_fkey (name)
      `,
        { count: "exact" }
      )
      .eq("photographer_id", userId);

    // Apply category filter
    if (category_id !== undefined) {
      if (category_id === "uncategorized") {
        queryBuilder = queryBuilder.is("category_id", null);
      } else {
        queryBuilder = queryBuilder.eq("category_id", category_id);
      }
    }

    // Apply published filter
    if (is_published !== undefined) {
      queryBuilder = queryBuilder.eq("is_published", is_published);
    }

    // Apply sorting
    queryBuilder = queryBuilder.order(sort, { ascending: order === "asc" });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    queryBuilder = queryBuilder.range(from, to);

    const { data: photos, error, count } = await queryBuilder;

    if (error) {
      throw error;
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    // Map to DTOs
    const photoDTOs: PhotoDTO[] = (photos || []).map((photo) => {
      const categoryName =
        photo.categories && typeof photo.categories === "object" && "name" in photo.categories
          ? (photo.categories.name as string)
          : null;

      return {
        id: photo.id,
        title: photo.title,
        category_id: photo.category_id,
        category_name: categoryName,
        thumbnail_url: this.getPhotoUrl(photo.thumbnail_path),
        preview_url: this.getPhotoUrl(photo.preview_path),
        original_width: photo.original_width,
        original_height: photo.original_height,
        file_size_bytes: photo.file_size_bytes,
        mime_type: photo.mime_type,
        is_published: photo.is_published,
        created_at: photo.created_at,
        updated_at: photo.updated_at,
      };
    });

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
   * Get a single photo by ID
   */
  async getPhotoById(userId: string, photoId: string): Promise<PhotoDTO | null> {
    const { data: photo, error } = await this.supabase
      .from("photos")
      .select(
        `
        id,
        title,
        category_id,
        thumbnail_path,
        preview_path,
        original_width,
        original_height,
        file_size_bytes,
        mime_type,
        is_published,
        created_at,
        updated_at,
        categories!photos_category_id_fkey (name)
      `
      )
      .eq("photographer_id", userId)
      .eq("id", photoId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }

    const categoryName =
      photo.categories && typeof photo.categories === "object" && "name" in photo.categories
        ? (photo.categories.name as string)
        : null;

    return {
      id: photo.id,
      title: photo.title,
      category_id: photo.category_id,
      category_name: categoryName,
      thumbnail_url: this.getPhotoUrl(photo.thumbnail_path),
      preview_url: this.getPhotoUrl(photo.preview_path),
      original_width: photo.original_width,
      original_height: photo.original_height,
      file_size_bytes: photo.file_size_bytes,
      mime_type: photo.mime_type,
      is_published: photo.is_published,
      created_at: photo.created_at,
      updated_at: photo.updated_at,
    };
  }

  /**
   * Create a new photo (upload files and save metadata)
   */
  async createPhoto(userId: string, input: CreatePhotoInput): Promise<PhotoDTO> {
    // Check photo limit
    const photoCount = await this.countUserPhotos(userId);
    if (photoCount >= MAX_PHOTOS) {
      const error = new Error(`Photo limit reached (max ${MAX_PHOTOS})`);
      (error as Error & { code: string }).code = "LIMIT_REACHED";
      throw error;
    }

    // Validate category if provided
    if (input.category_id) {
      const isValid = await this.validateCategory(userId, input.category_id);
      if (!isValid) {
        const error = new Error("Category not found or does not belong to user");
        (error as Error & { code: string }).code = "INVALID_CATEGORY";
        throw error;
      }
    }

    // Generate photo ID for file paths
    const photoId = crypto.randomUUID();
    const thumbnailPath = `${userId}/thumb_${photoId}.jpg`;
    const previewPath = `${userId}/preview_${photoId}.jpg`;

    // Upload thumbnail
    const { error: thumbnailError } = await this.supabase.storage
      .from(STORAGE_BUCKET)
      .upload(thumbnailPath, input.thumbnail, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (thumbnailError) {
      console.error("Thumbnail upload error:", thumbnailError);
      const error = new Error(`Failed to upload thumbnail: ${thumbnailError.message}`);
      (error as Error & { code: string }).code = "UPLOAD_FAILED";
      throw error;
    }

    // Upload preview - cleanup thumbnail if this fails
    const { error: previewError } = await this.supabase.storage
      .from(STORAGE_BUCKET)
      .upload(previewPath, input.preview, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (previewError) {
      // Cleanup thumbnail
      await this.deleteFiles([thumbnailPath]);
      const error = new Error("Failed to upload preview");
      (error as Error & { code: string }).code = "UPLOAD_FAILED";
      throw error;
    }

    // Insert photo record
    const { data: newPhoto, error: insertError } = await this.supabase
      .from("photos")
      .insert({
        id: photoId,
        photographer_id: userId,
        title: input.title ?? null,
        category_id: input.category_id ?? null,
        thumbnail_path: thumbnailPath,
        preview_path: previewPath,
        original_width: input.original_width,
        original_height: input.original_height,
        file_size_bytes: input.file_size_bytes,
        mime_type: "image/jpeg",
        is_published: input.is_published ?? false,
      })
      .select()
      .single();

    if (insertError) {
      // Cleanup uploaded files
      await this.deleteFiles([thumbnailPath, previewPath]);
      throw insertError;
    }

    // Get category name if category_id was provided
    let categoryName: string | null = null;
    if (input.category_id) {
      categoryName = await this.getCategoryName(input.category_id);
    }

    return {
      id: newPhoto.id,
      title: newPhoto.title,
      category_id: newPhoto.category_id,
      category_name: categoryName,
      thumbnail_url: this.getPhotoUrl(newPhoto.thumbnail_path),
      preview_url: this.getPhotoUrl(newPhoto.preview_path),
      original_width: newPhoto.original_width,
      original_height: newPhoto.original_height,
      file_size_bytes: newPhoto.file_size_bytes,
      mime_type: newPhoto.mime_type,
      is_published: newPhoto.is_published,
      created_at: newPhoto.created_at,
      updated_at: newPhoto.updated_at,
    };
  }

  /**
   * Update photo metadata
   */
  async updatePhoto(userId: string, photoId: string, command: UpdatePhotoCommand): Promise<PhotoDTO | null> {
    // Check if photo exists
    const existing = await this.getPhotoById(userId, photoId);
    if (!existing) {
      return null;
    }

    // Validate category if provided
    if (command.category_id) {
      const isValid = await this.validateCategory(userId, command.category_id);
      if (!isValid) {
        const error = new Error("Category not found or does not belong to user");
        (error as Error & { code: string }).code = "INVALID_CATEGORY";
        throw error;
      }
    }

    // Build update object (only include provided fields)
    const updateData: Record<string, unknown> = {};
    if (command.title !== undefined) {
      updateData.title = command.title;
    }
    if (command.category_id !== undefined) {
      updateData.category_id = command.category_id;
    }
    if (command.is_published !== undefined) {
      updateData.is_published = command.is_published;
    }

    // Update photo
    const { data: updatedPhoto, error: updateError } = await this.supabase
      .from("photos")
      .update(updateData)
      .eq("photographer_id", userId)
      .eq("id", photoId)
      .select(
        `
        id,
        title,
        category_id,
        thumbnail_path,
        preview_path,
        original_width,
        original_height,
        file_size_bytes,
        mime_type,
        is_published,
        created_at,
        updated_at,
        categories!photos_category_id_fkey (name)
      `
      )
      .single();

    if (updateError) {
      throw updateError;
    }

    const categoryName =
      updatedPhoto.categories && typeof updatedPhoto.categories === "object" && "name" in updatedPhoto.categories
        ? (updatedPhoto.categories.name as string)
        : null;

    return {
      id: updatedPhoto.id,
      title: updatedPhoto.title,
      category_id: updatedPhoto.category_id,
      category_name: categoryName,
      thumbnail_url: this.getPhotoUrl(updatedPhoto.thumbnail_path),
      preview_url: this.getPhotoUrl(updatedPhoto.preview_path),
      original_width: updatedPhoto.original_width,
      original_height: updatedPhoto.original_height,
      file_size_bytes: updatedPhoto.file_size_bytes,
      mime_type: updatedPhoto.mime_type,
      is_published: updatedPhoto.is_published,
      created_at: updatedPhoto.created_at,
      updated_at: updatedPhoto.updated_at,
    };
  }

  /**
   * Toggle publish status of a photo
   */
  async publishPhoto(userId: string, photoId: string, isPublished: boolean): Promise<PublishPhotoResponseDTO | null> {
    // Check if photo exists
    const existing = await this.getPhotoById(userId, photoId);
    if (!existing) {
      return null;
    }

    const { data: updatedPhoto, error: updateError } = await this.supabase
      .from("photos")
      .update({ is_published: isPublished })
      .eq("photographer_id", userId)
      .eq("id", photoId)
      .select("id, is_published, updated_at")
      .single();

    if (updateError) {
      throw updateError;
    }

    return {
      id: updatedPhoto.id,
      is_published: updatedPhoto.is_published,
      updated_at: updatedPhoto.updated_at,
    };
  }

  /**
   * Delete a photo and its files
   */
  async deletePhoto(userId: string, photoId: string): Promise<{ message: string } | null> {
    // Get photo to retrieve file paths
    const { data: photo, error: fetchError } = await this.supabase
      .from("photos")
      .select("id, thumbnail_path, preview_path")
      .eq("photographer_id", userId)
      .eq("id", photoId)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return null;
      }
      throw fetchError;
    }

    // Delete files from storage
    await this.deleteFiles([photo.thumbnail_path, photo.preview_path]);

    // Delete photo record
    const { error: deleteError } = await this.supabase
      .from("photos")
      .delete()
      .eq("photographer_id", userId)
      .eq("id", photoId);

    if (deleteError) {
      throw deleteError;
    }

    return { message: "Photo deleted successfully" };
  }

  /**
   * Batch upload multiple photos
   */
  async createPhotoBatch(
    userId: string,
    photos: {
      thumbnail: File;
      preview: File;
      original_width: number;
      original_height: number;
      file_size_bytes: number;
      title?: string | null;
    }[],
    sharedMetadata: {
      category_id?: string | null;
      is_published?: boolean;
    }
  ): Promise<BatchPhotoUploadResponseDTO> {
    const uploaded: BatchUploadedPhoto[] = [];
    const failed: BatchFailedPhoto[] = [];

    // Check current photo count
    const currentCount = await this.countUserPhotos(userId);
    const availableSlots = MAX_PHOTOS - currentCount;

    if (availableSlots <= 0) {
      // All photos will fail due to limit
      for (let i = 0; i < photos.length; i++) {
        failed.push({
          filename: `photo_${i}`,
          error: `Photo limit reached (max ${MAX_PHOTOS})`,
        });
      }
      return {
        uploaded,
        failed,
        summary: {
          total: photos.length,
          successful: 0,
          failed: photos.length,
        },
      };
    }

    // Validate category if provided
    if (sharedMetadata.category_id) {
      const isValid = await this.validateCategory(userId, sharedMetadata.category_id);
      if (!isValid) {
        // All photos will fail due to invalid category
        for (let i = 0; i < photos.length; i++) {
          failed.push({
            filename: `photo_${i}`,
            error: "Category not found or does not belong to user",
          });
        }
        return {
          uploaded,
          failed,
          summary: {
            total: photos.length,
            successful: 0,
            failed: photos.length,
          },
        };
      }
    }

    // Process each photo (up to available slots)
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const filename = photo.title || `photo_${i}`;

      // Check if we've reached the limit
      if (uploaded.length >= availableSlots) {
        failed.push({
          filename,
          error: `Photo limit reached (max ${MAX_PHOTOS})`,
        });
        continue;
      }

      try {
        const result = await this.uploadSinglePhoto(userId, {
          ...photo,
          category_id: sharedMetadata.category_id,
          is_published: sharedMetadata.is_published,
        });

        uploaded.push({
          id: result.id,
          thumbnail_url: result.thumbnail_url,
          preview_url: result.preview_url,
        });
      } catch (error) {
        const err = error as Error;
        failed.push({
          filename,
          error: err.message || "Upload failed",
        });
      }
    }

    return {
      uploaded,
      failed,
      summary: {
        total: photos.length,
        successful: uploaded.length,
        failed: failed.length,
      },
    };
  }

  /**
   * Upload a single photo without limit check (used by batch)
   */
  private async uploadSinglePhoto(
    userId: string,
    input: CreatePhotoInput
  ): Promise<{ id: string; thumbnail_url: string; preview_url: string }> {
    const photoId = crypto.randomUUID();
    const thumbnailPath = `${userId}/thumb_${photoId}.jpg`;
    const previewPath = `${userId}/preview_${photoId}.jpg`;

    // Upload thumbnail
    const { error: thumbnailError } = await this.supabase.storage
      .from(STORAGE_BUCKET)
      .upload(thumbnailPath, input.thumbnail, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (thumbnailError) {
      throw new Error("Failed to upload thumbnail");
    }

    // Upload preview
    const { error: previewError } = await this.supabase.storage
      .from(STORAGE_BUCKET)
      .upload(previewPath, input.preview, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (previewError) {
      await this.deleteFiles([thumbnailPath]);
      throw new Error("Failed to upload preview");
    }

    // Insert photo record
    const { error: insertError } = await this.supabase.from("photos").insert({
      id: photoId,
      photographer_id: userId,
      title: input.title ?? null,
      category_id: input.category_id ?? null,
      thumbnail_path: thumbnailPath,
      preview_path: previewPath,
      original_width: input.original_width,
      original_height: input.original_height,
      file_size_bytes: input.file_size_bytes,
      mime_type: "image/jpeg",
      is_published: input.is_published ?? false,
    });

    if (insertError) {
      await this.deleteFiles([thumbnailPath, previewPath]);
      throw new Error("Failed to save photo metadata");
    }

    return {
      id: photoId,
      thumbnail_url: this.getPhotoUrl(thumbnailPath),
      preview_url: this.getPhotoUrl(previewPath),
    };
  }

  /**
   * Generate public URL for a storage path
   */
  private getPhotoUrl(path: string): string {
    const { data } = this.supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  /**
   * Get category name by ID
   */
  private async getCategoryName(categoryId: string): Promise<string | null> {
    const { data, error } = await this.supabase.from("categories").select("name").eq("id", categoryId).single();

    if (error || !data) {
      return null;
    }

    return data.name;
  }

  /**
   * Validate that category exists and belongs to user
   */
  private async validateCategory(userId: string, categoryId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("categories")
      .select("id")
      .eq("photographer_id", userId)
      .eq("id", categoryId)
      .single();

    return !error && !!data;
  }

  /**
   * Count user's photos
   */
  private async countUserPhotos(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("photos")
      .select("*", { count: "exact", head: true })
      .eq("photographer_id", userId);

    if (error) {
      return 0;
    }

    return count || 0;
  }

  /**
   * Delete files from storage
   */
  private async deleteFiles(paths: string[]): Promise<void> {
    const { error } = await this.supabase.storage.from(STORAGE_BUCKET).remove(paths);

    if (error) {
      console.error("Failed to delete files from storage:", error);
    }
  }
}
