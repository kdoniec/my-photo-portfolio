import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../../../../../tests/mocks/server";
import { AuthProvider, useAuth } from "../AuthContext";
import type { User } from "@supabase/supabase-js";
import type { ReactNode } from "react";

const BASE_URL = "http://localhost:3000";

// Mock user data
const mockUser: User = {
  id: "user-123",
  email: "admin@example.com",
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString(),
} as User;

// Helper wrapper for renderHook
const createWrapper = (initialUser: User | null) => {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <AuthProvider initialUser={initialUser}>{children}</AuthProvider>;
  };
};

describe("AuthContext", () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  describe("AuthProvider", () => {
    it("should render children correctly", () => {
      const testContent = "Test Content";

      render(
        <AuthProvider initialUser={null}>
          <div data-testid="child">{testContent}</div>
        </AuthProvider>
      );

      expect(screen.getByTestId("child")).toBeTruthy();
      expect(screen.getByText(testContent)).toBeTruthy();
    });

    it("should provide initial user to children", () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockUser),
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isLoading).toBe(false);
    });

    it("should provide null user when initialized without user", () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(null),
      });

      expect(result.current.user).toBeNull();
    });
  });

  describe("useAuth hook", () => {
    it("should return user, isLoading, signIn, and signOut", () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockUser),
      });

      expect(result.current).toHaveProperty("user");
      expect(result.current).toHaveProperty("isLoading");
      expect(result.current).toHaveProperty("signIn");
      expect(result.current).toHaveProperty("signOut");
      expect(typeof result.current.signIn).toBe("function");
      expect(typeof result.current.signOut).toBe("function");
    });

    it("should throw error when used outside of AuthProvider", () => {
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow("useAuth must be used within AuthProvider");
    });
  });

  describe("signIn", () => {
    it("should set user on successful login", async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(null),
      });

      await act(async () => {
        const response = await result.current.signIn("admin@example.com", "password");
        expect(response.error).toBeUndefined();
      });

      expect(result.current.user).not.toBeNull();
      expect(result.current.user?.email).toBe("admin@example.com");
    });

    it("should return error on failed login", async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(null),
      });

      await act(async () => {
        const response = await result.current.signIn("wrong@example.com", "wrongpass");
        expect(response.error).toBe("Invalid login credentials");
      });

      expect(result.current.user).toBeNull();
    });

    it("should set isLoading during login", async () => {
      server.use(
        http.post(`${BASE_URL}/api/auth/login`, async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return HttpResponse.json({
            success: true,
            user: mockUser,
          });
        })
      );

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(null),
      });

      act(() => {
        result.current.signIn("admin@example.com", "password");
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should handle network error", async () => {
      server.use(
        http.post(`${BASE_URL}/api/auth/login`, () => {
          return HttpResponse.error();
        })
      );

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(null),
      });

      await act(async () => {
        const response = await result.current.signIn("test@example.com", "password");
        expect(response.error).toBe("Wystąpił nieoczekiwany błąd");
      });
    });

    it("should use default error message when response has no error", async () => {
      server.use(
        http.post(`${BASE_URL}/api/auth/login`, () => {
          return HttpResponse.json({}, { status: 400 });
        })
      );

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(null),
      });

      await act(async () => {
        const response = await result.current.signIn("test@example.com", "password");
        expect(response.error).toBe("Wystąpił błąd podczas logowania");
      });
    });

    it("should clear isLoading after failed login", async () => {
      server.use(
        http.post(`${BASE_URL}/api/auth/login`, () => {
          return HttpResponse.json({ error: "Invalid credentials" }, { status: 401 });
        })
      );

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(null),
      });

      await act(async () => {
        await result.current.signIn("test@example.com", "password");
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("context isolation", () => {
    it("should not share state between separate providers", () => {
      const user1: User = { ...mockUser, id: "user-1", email: "user1@example.com" };
      const user2: User = { ...mockUser, id: "user-2", email: "user2@example.com" };

      const { result: result1 } = renderHook(() => useAuth(), {
        wrapper: createWrapper(user1),
      });
      const { result: result2 } = renderHook(() => useAuth(), {
        wrapper: createWrapper(user2),
      });

      expect(result1.current.user?.email).toBe("user1@example.com");
      expect(result2.current.user?.email).toBe("user2@example.com");
    });
  });
});
