import type { User } from "@supabase/supabase-js";
import type { ReactNode } from "react";
import { AuthProvider } from "@/components/admin/context/AuthContext";
import { AdminHeader } from "@/components/admin/shared/AdminHeader";
import { Toaster } from "@/components/ui/sonner";

interface AdminLayoutClientProps {
  user: User;
  activeNav?: "categories" | "photos" | "profile";
  children: ReactNode;
}

export function AdminLayoutClient({ user, activeNav, children }: AdminLayoutClientProps) {
  return (
    <AuthProvider initialUser={user}>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <AdminHeader activeNav={activeNav} user={user} />
      </header>

      <main className="container mx-auto px-4 py-6">{children}</main>

      <Toaster />
    </AuthProvider>
  );
}
