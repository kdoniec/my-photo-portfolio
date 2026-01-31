import type { User } from "@supabase/supabase-js";
import { Camera, Image, FolderOpen, User as UserIcon } from "lucide-react";
import { UserMenu } from "./UserMenu";

interface AdminHeaderProps {
  activeNav?: "categories" | "photos" | "profile";
  user: User | null;
}

export function AdminHeader({ activeNav, user }: AdminHeaderProps) {
  const navLinks = [
    { href: "/admin/photos", label: "Zdjęcia", icon: Image, key: "photos" as const },
    { href: "/admin/categories", label: "Kategorie", icon: FolderOpen, key: "categories" as const },
    { href: "/admin/profile", label: "Profil", icon: UserIcon, key: "profile" as const },
  ];

  return (
    <div className="container mx-auto flex h-16 items-center justify-between px-4">
      {/* Logo */}
      <a href="/admin/photos" className="flex items-center gap-2 font-semibold">
        <Camera className="h-6 w-6" />
        <span className="hidden sm:inline">Panel Administracyjny</span>
      </a>

      {/* Navigation */}
      <nav className="flex items-center gap-1" aria-label="Nawigacja główna">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = activeNav === link.key;

          return (
            <a
              key={link.key}
              href={link.href}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden md:inline">{link.label}</span>
            </a>
          );
        })}
      </nav>

      {/* User Menu */}
      {user && <UserMenu user={user} />}
    </div>
  );
}
