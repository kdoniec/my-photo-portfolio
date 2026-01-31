import type { NavLinkProps } from "./types";
import { cn } from "@/lib/utils";

/**
 * NavLink component - single navigation link with active state support
 * Uses aria-current for accessibility
 */
export default function NavLink({ href, label, isActive, onClick, className }: NavLinkProps) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={cn(
        "text-sm font-medium transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm px-1 py-1",
        isActive ? "text-foreground" : "text-muted-foreground",
        className
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {label}
    </a>
  );
}
