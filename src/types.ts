import type { Database } from "./db/database.types";

// =============================================================================
// Base Entity Types (derived from database schema)
// =============================================================================

/**
 * Base types extracted from database schema for type safety
 */
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type SettingsRow = Database["public"]["Tables"]["photographer_settings"]["Row"];
type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
type PhotoRow = Database["public"]["Tables"]["photos"]["Row"];

// =============================================================================
// Common Types
// =============================================================================

/**
 * Standard pagination response structure
 */
export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

/**
 * Standard error response structure
 */
export interface ErrorResponseDTO {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Success message response (for delete operations)
 */
export interface MessageResponseDTO {
  message: string;
}

// =============================================================================
// Profile DTOs and Commands
// =============================================================================

/**
 * Profile DTO - Response for GET/PUT /api/profile
 * Maps directly to profiles table row
 */
export type ProfileDTO = ProfileRow;

/**
 * Command for updating profile - PUT /api/profile
 * display_name is required, other fields optional
 */
export interface UpdateProfileCommand {
  display_name: string;
  bio?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
}

/**
 * Public profile DTO - Response for GET /api/public/profile
 * Excludes internal fields (id, timestamps)
 */
export type PublicProfileDTO = Pick<ProfileRow, "display_name" | "bio" | "contact_email" | "contact_phone">;

// =============================================================================
// Settings DTOs and Commands
// =============================================================================

/**
 * Settings DTO - Response for GET/PUT /api/settings
 * Maps directly to photographer_settings table row
 */
export type SettingsDTO = SettingsRow;

/**
 * Command for updating settings - PUT /api/settings
 * All fields are optional
 */
export interface UpdateSettingsCommand {
  site_title?: string | null;
  site_description?: string | null;
}

/**
 * Public settings DTO - Response for GET /api/public/settings
 * Only exposes SEO-relevant fields
 */
export type PublicSettingsDTO = Pick<SettingsRow, "site_title" | "site_description">;

// =============================================================================
// Category DTOs and Commands
// =============================================================================

/**
 * Category DTO - Response for category endpoints
 * Extends base category with computed fields (cover_photo_url, photos_count)
 */
export interface CategoryDTO extends Omit<CategoryRow, "photographer_id"> {
  cover_photo_url: string | null;
  photos_count: number;
}

/**
 * Category list response - GET /api/categories
 */
export interface CategoryListResponseDTO {
  data: CategoryDTO[];
  total: number;
  limit: number;
}

/**
 * Command for creating category - POST /api/categories
 * slug and display_order are auto-generated
 */
export interface CreateCategoryCommand {
  name: string;
  description?: string | null;
}

/**
 * Command for updating category - PUT /api/categories/:id
 */
export interface UpdateCategoryCommand {
  name: string;
  description?: string | null;
  cover_photo_id?: string | null;
}

/**
 * Single category order item for reordering
 */
export interface CategoryOrderItem {
  id: string;
  display_order: number;
}

/**
 * Command for reordering categories - PUT /api/categories/reorder
 */
export interface ReorderCategoryCommand {
  order: CategoryOrderItem[];
}

/**
 * Response for category deletion - DELETE /api/categories/:id
 */
export interface DeleteCategoryResponseDTO extends MessageResponseDTO {
  affected_photos_count: number;
}

/**
 * Public category DTO - for GET /api/public/categories
 * Excludes internal identifiers and timestamps
 */
export interface PublicCategoryDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_photo_url: string | null;
  display_order: number;
  photos_count: number;
}

/**
 * Public category list response - GET /api/public/categories
 */
export interface PublicCategoryListResponseDTO {
  data: PublicCategoryDTO[];
}

/**
 * Public category detail DTO - for GET /api/public/categories/:slug
 */
export type PublicCategoryDetailDTO = Pick<
  PublicCategoryDTO,
  "id" | "name" | "slug" | "description" | "cover_photo_url"
>;

// =============================================================================
// Photo DTOs and Commands
// =============================================================================

/**
 * Photo DTO - Response for photo endpoints
 * Extends base photo with computed fields (thumbnail_url, preview_url, category_name)
 */
export interface PhotoDTO extends Omit<PhotoRow, "photographer_id" | "thumbnail_path" | "preview_path"> {
  thumbnail_url: string;
  preview_url: string;
  category_name: string | null;
}

/**
 * Photo list response - GET /api/photos
 */
export interface PhotoListResponseDTO {
  data: PhotoDTO[];
  pagination: PaginationDTO;
}

/**
 * Command for creating photo metadata - POST /api/photos
 * Used alongside multipart file upload
 */
export interface CreatePhotoCommand {
  title?: string | null;
  category_id?: string | null;
  is_published?: boolean;
}

/**
 * Command for updating photo - PUT /api/photos/:id
 */
export interface UpdatePhotoCommand {
  title?: string | null;
  category_id?: string | null;
  is_published?: boolean;
}

/**
 * Command for toggling publish status - PATCH /api/photos/:id/publish
 */
export interface PublishPhotoCommand {
  is_published: boolean;
}

/**
 * Response for publish toggle - PATCH /api/photos/:id/publish
 */
export interface PublishPhotoResponseDTO {
  id: string;
  is_published: boolean;
  updated_at: string;
}

/**
 * Single uploaded photo result in batch response
 */
export interface BatchUploadedPhoto {
  id: string;
  thumbnail_url: string;
  preview_url: string;
}

/**
 * Single failed photo in batch response
 */
export interface BatchFailedPhoto {
  filename: string;
  error: string;
}

/**
 * Batch upload summary
 */
export interface BatchUploadSummary {
  total: number;
  successful: number;
  failed: number;
}

/**
 * Response for batch photo upload - POST /api/photos/batch
 */
export interface BatchPhotoUploadResponseDTO {
  uploaded: BatchUploadedPhoto[];
  failed: BatchFailedPhoto[];
  summary: BatchUploadSummary;
}

/**
 * Public photo DTO - for GET /api/public/categories/:slug/photos
 * Only exposes public-facing fields
 */
export interface PublicPhotoDTO {
  id: string;
  title: string | null;
  thumbnail_url: string;
  preview_url: string;
  original_width: number;
  original_height: number;
}

/**
 * Public photo list response - GET /api/public/categories/:slug/photos
 */
export interface PublicPhotoListResponseDTO {
  data: PublicPhotoDTO[];
  pagination: PaginationDTO;
}

// =============================================================================
// Stats DTO
// =============================================================================

/**
 * Resource usage stats
 */
export interface ResourceStats {
  count: number;
  limit: number;
}

/**
 * Stats DTO - Response for GET /api/stats
 */
export interface StatsDTO {
  photos: ResourceStats;
  categories: ResourceStats;
  storage_used_bytes: number | null;
}

// =============================================================================
// Query Parameter Types
// =============================================================================

/**
 * Sort options for categories list
 */
export type CategorySortField = "display_order" | "name" | "created_at";

/**
 * Sort options for photos list
 */
export type PhotoSortField = "created_at" | "title";

/**
 * Sort order direction
 */
export type SortOrder = "asc" | "desc";

/**
 * Query parameters for GET /api/categories
 */
export interface CategoryListQuery {
  sort?: CategorySortField;
  order?: SortOrder;
}

/**
 * Query parameters for GET /api/photos
 */
export interface PhotoListQuery {
  category_id?: string | "uncategorized";
  is_published?: boolean;
  page?: number;
  limit?: number;
  sort?: PhotoSortField;
  order?: SortOrder;
}

/**
 * Query parameters for GET /api/public/categories/:slug/photos
 */
export interface PublicPhotoListQuery {
  page?: number;
  limit?: number;
}
