import type { LogoProps } from "./types";
import { cn } from "@/lib/utils";

/**
 * Logo component - clickable photographer name/logo
 * Links to the main page of the appropriate context (public or admin)
 */
export default function Logo({ name, href, className }: LogoProps) {
  return (
    <a
      href={href}
      className={cn(
        "text-xl font-semibold text-foreground hover:text-foreground/80 transition-colors",
        className
      )}
      aria-label={`${name} - powrót do strony głównej`}
    >
      {name}
    </a>
  );
}
