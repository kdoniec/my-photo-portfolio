import { createContext, useContext, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabaseClient } from "@/db/supabase.client";

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
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
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
      await supabaseClient.auth.signOut();
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
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
