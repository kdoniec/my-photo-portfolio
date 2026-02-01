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
  if (ERROR_MAP[message]) {
    return ERROR_MAP[message];
  }

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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: mapErrorMessage(data.error || "Wystąpił błąd"),
        };
      }

      return { success: true, user: data.user };
    } catch {
      return {
        success: false,
        error: "Wystąpił nieoczekiwany błąd",
      };
    }
  }

  async signOut(): Promise<void> {
    await fetch("/api/auth/logout", { method: "POST" });
  }

  async sendPasswordResetEmail(email: string): Promise<AuthResult> {
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: mapErrorMessage(data.error || "Wystąpił błąd"),
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

  async updatePassword(newPassword: string, accessToken: string): Promise<AuthResult> {
    try {
      const response = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword, accessToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: mapErrorMessage(data.error || "Wystąpił błąd"),
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
}

export const authService = new ClientAuthService();
