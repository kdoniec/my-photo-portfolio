import type { SupabaseClient } from "../../db/supabase.client";
import type {
  CategoryDTO,
  CategoryListResponseDTO,
  CreateCategoryCommand,
  UpdateCategoryCommand,
  DeleteCategoryResponseDTO,
  CategoryListQuery,
  CategoryOrderItem,
} from "../../types";
import { generateSlug } from "../utils/slug";

const MAX_CATEGORIES = 10;

export class CategoryService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get all categories for a user with optional sorting
   */
  async getCategories(userId: string, query: CategoryListQuery = {}): Promise<CategoryListResponseDTO> {
    const { sort = "display_order", order = "asc" } = query;

    const { data: categories, error } = await this.supabase
      .from("categories")
      .select(
        `
        id,
        name,
        slug,
        description,
        cover_photo_id,
        display_order,
        created_at,
        updated_at
      `
      )
      .eq("photographer_id", userId)
      .order(sort, { ascending: order === "asc" });

    if (error) {
      throw error;
    }

    const categoriesWithCounts = await Promise.all(
      (categories || []).map(async (category) => {
        const photosCount = await this.countPhotosInCategory(category.id);
        const coverPhotoUrl = category.cover_photo_id ? await this.getCoverPhotoUrl(category.cover_photo_id) : null;

        return {
          ...category,
          cover_photo_url: coverPhotoUrl,
          photos_count: photosCount,
        } as CategoryDTO;
      })
    );

    return {
      data: categoriesWithCounts,
      total: categoriesWithCounts.length,
      limit: MAX_CATEGORIES,
    };
  }

  /**
   * Get a single category by ID
   */
  async getCategoryById(userId: string, categoryId: string): Promise<CategoryDTO | null> {
    const { data: category, error } = await this.supabase
      .from("categories")
      .select(
        `
        id,
        name,
        slug,
        description,
        cover_photo_id,
        display_order,
        created_at,
        updated_at
      `
      )
      .eq("photographer_id", userId)
      .eq("id", categoryId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }

    const photosCount = await this.countPhotosInCategory(category.id);
    const coverPhotoUrl = category.cover_photo_id ? await this.getCoverPhotoUrl(category.cover_photo_id) : null;

    return {
      ...category,
      cover_photo_url: coverPhotoUrl,
      photos_count: photosCount,
    };
  }

  /**
   * Create a new category
   */
  async createCategory(userId: string, command: CreateCategoryCommand): Promise<CategoryDTO> {
    // Check category limit
    const { count, error: countError } = await this.supabase
      .from("categories")
      .select("*", { count: "exact", head: true })
      .eq("photographer_id", userId);

    if (countError) {
      throw countError;
    }

    if ((count || 0) >= MAX_CATEGORIES) {
      const error = new Error("Category limit reached (max 10)");
      (error as Error & { code: string }).code = "LIMIT_REACHED";
      throw error;
    }

    // Generate slug from name
    const slug = generateSlug(command.name);

    // Check for duplicate slug
    const { data: existingCategory } = await this.supabase
      .from("categories")
      .select("id")
      .eq("photographer_id", userId)
      .eq("slug", slug)
      .single();

    if (existingCategory) {
      const error = new Error("Category with this name already exists");
      (error as Error & { code: string }).code = "DUPLICATE_SLUG";
      throw error;
    }

    // Get max display_order for new category
    const { data: maxOrderData } = await this.supabase
      .from("categories")
      .select("display_order")
      .eq("photographer_id", userId)
      .order("display_order", { ascending: false })
      .limit(1);

    const nextOrder = maxOrderData && maxOrderData.length > 0 ? maxOrderData[0].display_order + 1 : 0;

    // Insert new category
    const { data: newCategory, error: insertError } = await this.supabase
      .from("categories")
      .insert({
        photographer_id: userId,
        name: command.name,
        slug,
        description: command.description ?? null,
        display_order: nextOrder,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return {
      id: newCategory.id,
      name: newCategory.name,
      slug: newCategory.slug,
      description: newCategory.description,
      cover_photo_id: newCategory.cover_photo_id,
      cover_photo_url: null,
      display_order: newCategory.display_order,
      photos_count: 0,
      created_at: newCategory.created_at,
      updated_at: newCategory.updated_at,
    };
  }

  /**
   * Update an existing category
   */
  async updateCategory(
    userId: string,
    categoryId: string,
    command: UpdateCategoryCommand
  ): Promise<CategoryDTO | null> {
    // Check if category exists
    const existing = await this.getCategoryById(userId, categoryId);
    if (!existing) {
      return null;
    }

    // Generate new slug if name changed
    const newSlug = generateSlug(command.name);
    if (newSlug !== existing.slug) {
      // Check for duplicate slug
      const { data: existingSlug } = await this.supabase
        .from("categories")
        .select("id")
        .eq("photographer_id", userId)
        .eq("slug", newSlug)
        .neq("id", categoryId)
        .single();

      if (existingSlug) {
        const error = new Error("Category with this name already exists");
        (error as Error & { code: string }).code = "DUPLICATE_SLUG";
        throw error;
      }
    }

    // Validate cover_photo_id if provided
    if (command.cover_photo_id) {
      const { data: photo, error: photoError } = await this.supabase
        .from("photos")
        .select("id")
        .eq("photographer_id", userId)
        .eq("id", command.cover_photo_id)
        .single();

      if (photoError || !photo) {
        const error = new Error("Photo not found");
        (error as Error & { code: string }).code = "INVALID_PHOTO";
        throw error;
      }
    }

    // Update category
    const { data: updatedCategory, error: updateError } = await this.supabase
      .from("categories")
      .update({
        name: command.name,
        slug: newSlug,
        description: command.description ?? null,
        cover_photo_id: command.cover_photo_id ?? null,
      })
      .eq("photographer_id", userId)
      .eq("id", categoryId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    const photosCount = await this.countPhotosInCategory(categoryId);
    const coverPhotoUrl = updatedCategory.cover_photo_id
      ? await this.getCoverPhotoUrl(updatedCategory.cover_photo_id)
      : null;

    return {
      id: updatedCategory.id,
      name: updatedCategory.name,
      slug: updatedCategory.slug,
      description: updatedCategory.description,
      cover_photo_id: updatedCategory.cover_photo_id,
      cover_photo_url: coverPhotoUrl,
      display_order: updatedCategory.display_order,
      photos_count: photosCount,
      created_at: updatedCategory.created_at,
      updated_at: updatedCategory.updated_at,
    };
  }

  /**
   * Reorder categories
   */
  async reorderCategories(userId: string, order: CategoryOrderItem[]): Promise<void> {
    // Update each category's display_order
    for (const item of order) {
      const { error } = await this.supabase
        .from("categories")
        .update({ display_order: item.display_order })
        .eq("photographer_id", userId)
        .eq("id", item.id);

      if (error) {
        throw error;
      }
    }
  }

  /**
   * Delete a category
   */
  async deleteCategory(userId: string, categoryId: string): Promise<DeleteCategoryResponseDTO | null> {
    // Check if category exists
    const existing = await this.getCategoryById(userId, categoryId);
    if (!existing) {
      return null;
    }

    // Count affected photos before deletion
    const affectedPhotosCount = await this.countPhotosInCategory(categoryId);

    // Delete category (FK constraint will set photos.category_id to null)
    const { error: deleteError } = await this.supabase
      .from("categories")
      .delete()
      .eq("photographer_id", userId)
      .eq("id", categoryId);

    if (deleteError) {
      throw deleteError;
    }

    return {
      message: "Category deleted successfully",
      affected_photos_count: affectedPhotosCount,
    };
  }

  /**
   * Count photos in a category
   */
  private async countPhotosInCategory(categoryId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("photos")
      .select("*", { count: "exact", head: true })
      .eq("category_id", categoryId);

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

    const { data: urlData } = this.supabase.storage.from("photos").getPublicUrl(photo.thumbnail_path);

    return urlData.publicUrl;
  }
}
