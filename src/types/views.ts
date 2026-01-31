import type {
  PublicCategoryDTO,
  PublicCategoryDetailDTO,
  PublicPhotoDTO,
  PublicProfileDTO,
  PaginationDTO,
} from "../types";

// =============================================================================
// View Models for Public Pages
// =============================================================================

/**
 * ViewModel dla strony głównej
 */
export interface HomePageViewModel {
  siteName: string;
  siteDescription: string | null;
  categories: PublicCategoryDTO[];
}

/**
 * ViewModel dla strony kategorii
 */
export interface CategoryPageViewModel {
  siteName: string;
  category: PublicCategoryDetailDTO;
  initialPhotos: PublicPhotoDTO[];
  pagination: PaginationDTO;
}

/**
 * ViewModel dla strony "O mnie"
 */
export interface AboutPageViewModel {
  siteName: string;
  profile: PublicProfileDTO;
}

/**
 * Stan lightboxa
 */
export interface LightboxState {
  isOpen: boolean;
  currentIndex: number;
  photos: PublicPhotoDTO[];
}

/**
 * Stan infinite scroll
 */
export interface InfiniteScrollState {
  photos: PublicPhotoDTO[];
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Nawigacja links
 */
export interface NavigationLink {
  label: string;
  href: string;
  isActive: boolean;
}
