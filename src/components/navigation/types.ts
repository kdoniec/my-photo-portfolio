import type { LucideIcon } from "lucide-react";

// =============================================================================
// Navigation Item Types
// =============================================================================

/**
 * Reprezentuje pojedynczy element nawigacji
 */
export interface NavItem {
  label: string;
  href: string;
  icon?: LucideIcon;
}

/**
 * Konfiguracja nawigacji publicznej
 */
export const PUBLIC_NAV_ITEMS: NavItem[] = [
  { label: "Galeria", href: "/" },
  { label: "O mnie", href: "/o-mnie" },
];

/**
 * Konfiguracja nawigacji administracyjnej
 */
export const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "Kategorie", href: "/admin/categories" },
  { label: "Zdjęcia", href: "/admin/photos" },
  { label: "Profil", href: "/admin/profile" },
];

// =============================================================================
// User Types for Navigation
// =============================================================================

/**
 * Uproszczony typ użytkownika dla komponentów nawigacji
 */
export interface NavUser {
  displayName: string;
  email: string;
}

// =============================================================================
// Component Props Types
// =============================================================================

/**
 * Props for PublicNavbar component
 */
export interface PublicNavbarProps {
  photographerName: string;
  currentPath: string;
}

/**
 * Props for AdminNavbar component
 */
export interface AdminNavbarProps {
  user: NavUser;
  currentPath: string;
}

/**
 * Props for NavLink component
 */
export interface NavLinkProps {
  href: string;
  label: string;
  isActive: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Props for MobileSheet component
 */
export interface MobileSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  side?: "left" | "right";
}

/**
 * Props for UserMenu component
 */
export interface UserMenuProps {
  displayName: string;
  email?: string;
  onSignOut: () => Promise<void>;
}

/**
 * Props for Logo component
 */
export interface LogoProps {
  name: string;
  href: string;
  className?: string;
}
