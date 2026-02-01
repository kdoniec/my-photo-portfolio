import { useState } from "react";
import { LogOut } from "lucide-react";
import Logo from "./Logo";
import NavLink from "./NavLink";
import MobileSheet from "./MobileSheet";
import UserMenu from "./UserMenu";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useNavigation } from "@/components/hooks/useNavigation";
import { ADMIN_NAV_ITEMS } from "./types";
import type { AdminNavbarProps } from "./types";

/**
 * AdminNavbar component - responsive navigation for admin panel
 * Desktop: horizontal menu with links and UserMenu dropdown
 * Mobile: hamburger icon with slide-in sheet menu including sign out button
 */
export default function AdminNavbar({ user, currentPath }: AdminNavbarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { isActive } = useNavigation(currentPath);

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch {
      // Ignore errors, redirect anyway
    }
    window.location.href = "/admin/login";
  };

  return (
    <header role="banner" className="border-b border-border bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <nav aria-label="Admin navigation" className="flex items-center justify-between py-4">
          {/* Logo */}
          <Logo name="Admin Panel" href="/admin/photos" />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <ul className="flex items-center gap-8">
              {ADMIN_NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <NavLink href={item.href} label={item.label} isActive={isActive(item.href)} />
                </li>
              ))}
            </ul>
            <UserMenu displayName={user.displayName} email={user.email} onSignOut={handleSignOut} />
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <MobileSheet isOpen={isMobileOpen} onOpenChange={setIsMobileOpen} side="right">
              {/* User info */}
              <div className="mb-4 pb-4 border-b border-border">
                <p className="text-sm font-medium">{user.displayName}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>

              {/* Navigation links */}
              {ADMIN_NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  isActive={isActive(item.href)}
                  onClick={() => setIsMobileOpen(false)}
                  className="text-lg py-2"
                />
              ))}

              {/* Separator */}
              <Separator className="my-4" />

              {/* Sign out button */}
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Wyloguj
              </Button>
            </MobileSheet>
          </div>
        </nav>
      </div>
    </header>
  );
}
