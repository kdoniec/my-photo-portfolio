import { supabaseClient } from "@/db/supabase.client";
import type { User } from "@supabase/supabase-js";

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
}

const ERROR_MAP: Record<string, string> = {
  "Invalid login credentials": "Nieprawidłowy email lub hasło",
  "Email not confirmed": "Konto nie zostało potwierdzone",
  "User not found": "Nieprawidłowy email lub hasło",
  invalid_grant: "Nieprawidłowy email lub hasło",
  "Email link is invalid or has expired": "Link resetujący wygasł lub jest nieprawidłowy",
  "New password should be different from the old password": "Nowe hasło musi być inne niż poprzednie",
  "Password should be at least 6 characters": "Hasło musi mieć minimum 8 znaków",
  "Auth session missing!": "Sesja wygasła. Wygeneruj nowy link resetujący.",
  "Token has expired or is invalid": "Link resetujący wygasł lub jest nieprawidłowy",
  "Unable to validate email address: invalid format": "Nieprawidłowy format email",
  "For security purposes, you can only request this once every 60 seconds":
    "Ze względów bezpieczeństwa możesz wysłać żądanie raz na 60 sekund",
};

function mapErrorMessage(message: string): string {
  // Check for exact match first
  if (ERROR_MAP[message]) {
    return ERROR_MAP[message];
  }

  // Check for partial matches
  for (const [key, value] of Object.entries(ERROR_MAP)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  return "Wystąpił nieoczekiwany błąd";
}

class ClientAuthService {
  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return {
          success: false,
          error: mapErrorMessage(error.message),
        };
      }

      return { success: true, user: data.user ?? undefined };
    } catch (err) {
      // Handle initialization errors (e.g., missing env variables)
      if (err instanceof Error) {
        if (err.message.includes("Missing Supabase environment")) {
          return {
            success: false,
            error: "Błąd konfiguracji aplikacji. Skontaktuj się z administratorem.",
          };
        }
        return {
          success: false,
          error: mapErrorMessage(err.message),
        };
      }
      return {
        success: false,
        error: "Wystąpił nieoczekiwany błąd",
      };
    }
  }

  async signOut(): Promise<void> {
    await supabaseClient.auth.signOut();
  }

  async sendPasswordResetEmail(email: string): Promise<AuthResult> {
    try {
      const redirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/admin/set-password` : "/admin/set-password";

      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        // For security, don't reveal if email exists or not
        // But still return error for rate limiting messages
        if (error.message.includes("60 seconds")) {
          return {
            success: false,
            error: mapErrorMessage(error.message),
          };
        }
        // For other errors, pretend success (security best practice)
        return { success: true };
      }

      return { success: true };
    } catch {
      return {
        success: false,
        error: "Wystąpił nieoczekiwany błąd",
      };
    }
  }

  async updatePassword(newPassword: string): Promise<AuthResult> {
    try {
      const { error } = await supabaseClient.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return {
          success: false,
          error: mapErrorMessage(error.message),
        };
      }

      return { success: true };
    } catch {
      return {
        success: false,
        error: "Wystąpił nieoczekiwany błąd",
      };
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();
    return user;
  }

  async isSessionValid(): Promise<boolean> {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();
    return session !== null;
  }
}

export const authService = new ClientAuthService();
