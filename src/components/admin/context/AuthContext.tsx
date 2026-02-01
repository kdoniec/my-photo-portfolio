import { createContext, useContext, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
  initialUser: User | null;
}

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = useState(false);

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || "Wystąpił błąd podczas logowania" };
      }

      if (data.user) {
        setUser(data.user);
      }

      return {};
    } catch {
      return { error: "Wystąpił nieoczekiwany błąd" };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      setUser(null);
      window.location.href = "/admin/login";
    } catch (err) {
      console.error("Błąd podczas wylogowania:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    // Return safe defaults during SSR or when outside provider
    if (typeof window === "undefined") {
      return {
        user: null,
        isLoading: false,
        signIn: async () => ({}),
        signOut: async () => undefined,
      };
    }
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
