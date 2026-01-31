import { useMemo } from "react";

/**
 * Return type for useNavigation hook
 */
interface UseNavigationReturn {
  isActive: (href: string, exact?: boolean) => boolean;
}

/**
 * Custom hook for determining active navigation state based on current path
 *
 * @param currentPath - The current URL pathname
 * @returns Object with isActive function to check if a link is active
 *
 * @example
 * const { isActive } = useNavigation("/kategoria/nature");
 * isActive("/") // true (gallery includes categories)
 * isActive("/o-mnie") // false
 */
export function useNavigation(currentPath: string): UseNavigationReturn {
  const isActive = useMemo(
    () =>
      (href: string, exact = false): boolean => {
        if (exact) {
          return currentPath === href;
        }

        // Special case: Gallery (/) is active for home and all category pages
        if (href === "/" && currentPath.startsWith("/kategoria/")) {
          return true;
        }

        // Exact match
        if (currentPath === href) {
          return true;
        }

        // Prefix match for nested routes (e.g., /admin/photos matches /admin/photos/123)
        if (href !== "/" && currentPath.startsWith(href + "/")) {
          return true;
        }

        return false;
      },
    [currentPath]
  );

  return { isActive };
}
