import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../../../../tests/mocks/server";
import { authService } from "../auth.service";

const BASE_URL = "http://localhost:3000";

describe("authService", () => {
  describe("signIn", () => {
    it("should return success with user on valid credentials", async () => {
      const result = await authService.signIn("admin@example.com", "password");

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe("admin@example.com");
      expect(result.error).toBeUndefined();
    });

    it("should return mapped error for invalid credentials", async () => {
      const result = await authService.signIn("wrong@example.com", "wrongpass");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Nieprawidłowy email lub hasło");
      expect(result.user).toBeUndefined();
    });

    it("should return mapped error for unconfirmed email", async () => {
      const result = await authService.signIn("unconfirmed@example.com", "password");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Konto nie zostało potwierdzone");
    });

    it("should handle network errors", async () => {
      server.use(
        http.post(`${BASE_URL}/api/auth/login`, () => {
          return HttpResponse.error();
        })
      );

      const result = await authService.signIn("test@example.com", "password");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Wystąpił nieoczekiwany błąd");
    });

    it("should handle server error without error message", async () => {
      server.use(
        http.post(`${BASE_URL}/api/auth/login`, () => {
          return HttpResponse.json({}, { status: 500 });
        })
      );

      const result = await authService.signIn("test@example.com", "password");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Wystąpił nieoczekiwany błąd");
    });
  });

  describe("signOut", () => {
    it("should call logout endpoint", async () => {
      let logoutCalled = false;

      server.use(
        http.post(`${BASE_URL}/api/auth/logout`, () => {
          logoutCalled = true;
          return HttpResponse.json({ success: true });
        })
      );

      await authService.signOut();

      expect(logoutCalled).toBe(true);
    });

    it("should not throw on error", async () => {
      server.use(
        http.post(`${BASE_URL}/api/auth/logout`, () => {
          return HttpResponse.error();
        })
      );

      // Should not throw
      await expect(authService.signOut()).rejects.toThrow();
    });
  });

  describe("sendPasswordResetEmail", () => {
    it("should return success for valid email", async () => {
      const result = await authService.sendPasswordResetEmail("valid@example.com");

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should return mapped error for rate limiting", async () => {
      const result = await authService.sendPasswordResetEmail("ratelimited@example.com");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Ze względów bezpieczeństwa możesz wysłać żądanie raz na 60 sekund");
    });

    it("should handle network errors", async () => {
      server.use(
        http.post(`${BASE_URL}/api/auth/reset-password`, () => {
          return HttpResponse.error();
        })
      );

      const result = await authService.sendPasswordResetEmail("test@example.com");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Wystąpił nieoczekiwany błąd");
    });

    it("should handle unknown error message", async () => {
      server.use(
        http.post(`${BASE_URL}/api/auth/reset-password`, () => {
          return HttpResponse.json({ error: "Some unknown error" }, { status: 400 });
        })
      );

      const result = await authService.sendPasswordResetEmail("test@example.com");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Wystąpił nieoczekiwany błąd");
    });
  });

  describe("updatePassword", () => {
    it("should return success with valid token", async () => {
      const result = await authService.updatePassword("newpassword123", "valid-token");

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should return mapped error for expired token", async () => {
      const result = await authService.updatePassword("newpassword123", "expired-token");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Link resetujący wygasł lub jest nieprawidłowy");
    });

    it("should return mapped error for missing session", async () => {
      const result = await authService.updatePassword("newpassword123", "invalid-token");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Sesja wygasła. Wygeneruj nowy link resetujący.");
    });

    it("should handle network errors", async () => {
      server.use(
        http.post(`${BASE_URL}/api/auth/set-password`, () => {
          return HttpResponse.error();
        })
      );

      const result = await authService.updatePassword("newpassword123", "valid-token");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Wystąpił nieoczekiwany błąd");
    });

    it("should return mapped error for weak password", async () => {
      server.use(
        http.post(`${BASE_URL}/api/auth/set-password`, () => {
          return HttpResponse.json({ error: "Password should be at least 6 characters" }, { status: 400 });
        })
      );

      const result = await authService.updatePassword("short", "valid-token");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Hasło musi mieć minimum 8 znaków");
    });

    it("should return mapped error for same password", async () => {
      server.use(
        http.post(`${BASE_URL}/api/auth/set-password`, () => {
          return HttpResponse.json(
            { error: "New password should be different from the old password" },
            { status: 400 }
          );
        })
      );

      const result = await authService.updatePassword("samepassword", "valid-token");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Nowe hasło musi być inne niż poprzednie");
    });
  });

  describe("error mapping", () => {
    it("should map exact error messages", async () => {
      server.use(
        http.post(`${BASE_URL}/api/auth/login`, () => {
          return HttpResponse.json({ error: "User not found" }, { status: 401 });
        })
      );

      const result = await authService.signIn("test@example.com", "password");

      expect(result.error).toBe("Nieprawidłowy email lub hasło");
    });

    it("should map partial error messages (case insensitive)", async () => {
      server.use(
        http.post(`${BASE_URL}/api/auth/login`, () => {
          return HttpResponse.json(
            { error: "Error: email link is invalid or has expired. Please try again." },
            { status: 400 }
          );
        })
      );

      const result = await authService.signIn("test@example.com", "password");

      expect(result.error).toBe("Link resetujący wygasł lub jest nieprawidłowy");
    });

    it("should fallback to generic error for unknown messages", async () => {
      server.use(
        http.post(`${BASE_URL}/api/auth/login`, () => {
          return HttpResponse.json({ error: "Completely unknown error that is not mapped" }, { status: 400 });
        })
      );

      const result = await authService.signIn("test@example.com", "password");

      expect(result.error).toBe("Wystąpił nieoczekiwany błąd");
    });

    it("should handle invalid_grant error", async () => {
      server.use(
        http.post(`${BASE_URL}/api/auth/login`, () => {
          return HttpResponse.json({ error: "invalid_grant" }, { status: 401 });
        })
      );

      const result = await authService.signIn("test@example.com", "password");

      expect(result.error).toBe("Nieprawidłowy email lub hasło");
    });

    it("should handle invalid email format error", async () => {
      server.use(
        http.post(`${BASE_URL}/api/auth/reset-password`, () => {
          return HttpResponse.json({ error: "Unable to validate email address: invalid format" }, { status: 400 });
        })
      );

      const result = await authService.sendPasswordResetEmail("not-an-email");

      expect(result.error).toBe("Nieprawidłowy format email");
    });
  });
});
