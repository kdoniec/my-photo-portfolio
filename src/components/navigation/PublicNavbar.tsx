import { useState } from "react";
import { User } from "lucide-react";
import Logo from "./Logo";
import NavLink from "./NavLink";
import MobileSheet from "./MobileSheet";
import { useNavigation } from "@/components/hooks/useNavigation";
import { PUBLIC_NAV_ITEMS } from "./types";
import type { PublicNavbarProps } from "./types";

/**
 * PublicNavbar component - responsive navigation for public gallery
 * Desktop: horizontal menu with links
 * Mobile: hamburger icon with slide-in sheet menu
 */
export default function PublicNavbar({ photographerName, currentPath }: PublicNavbarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { isActive } = useNavigation(currentPath);

  return (
    <header role="banner" className="border-b border-border bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <nav aria-label="Main navigation" className="flex items-center justify-between py-4">
          {/* Logo */}
          <Logo name={photographerName} href="/" />

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <ul className="flex items-center gap-8">
              {PUBLIC_NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <NavLink href={item.href} label={item.label} isActive={isActive(item.href)} />
                </li>
              ))}
            </ul>
            <a
              href="/admin/login"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Zaloguj się do panelu administratora"
            >
              <User className="h-4 w-4" />
              <span>Zaloguj</span>
            </a>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <MobileSheet isOpen={isMobileOpen} onOpenChange={setIsMobileOpen} side="right">
              {PUBLIC_NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  isActive={isActive(item.href)}
                  onClick={() => setIsMobileOpen(false)}
                  className="text-lg py-2"
                />
              ))}
              <a
                href="/admin/login"
                className="flex items-center gap-2 text-lg py-2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsMobileOpen(false)}
              >
                <User className="h-5 w-5" />
                <span>Zaloguj</span>
              </a>
            </MobileSheet>
          </div>
        </nav>
      </div>
    </header>
  );
}
