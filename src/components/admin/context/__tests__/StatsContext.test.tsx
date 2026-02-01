import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../../../../../tests/mocks/server";
import { StatsProvider, useStats } from "../StatsContext";
import type { StatsDTO } from "@/types";
import type { ReactNode } from "react";

// Test data following StatsDTO type
const mockInitialStats: StatsDTO = {
  photos: {
    count: 50,
    limit: 200,
    published_count: 30,
  },
  categories: {
    count: 5,
    limit: 10,
  },
  storage_used_bytes: 1024000,
};

const mockUpdatedStats: StatsDTO = {
  photos: {
    count: 55,
    limit: 200,
    published_count: 35,
  },
  categories: {
    count: 6,
    limit: 10,
  },
  storage_used_bytes: 2048000,
};

// Helper wrapper for renderHook
const createWrapper = (initialStats: StatsDTO) => {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <StatsProvider initialStats={initialStats}>{children}</StatsProvider>;
  };
};

describe("StatsContext", () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  describe("StatsProvider", () => {
    it("should render children correctly", () => {
      // Arrange
      const testContent = "Test Content";

      // Act
      render(
        <StatsProvider initialStats={mockInitialStats}>
          <div data-testid="child">{testContent}</div>
        </StatsProvider>
      );

      // Assert
      expect(screen.getByTestId("child")).toBeTruthy();
      expect(screen.getByText(testContent)).toBeTruthy();
    });

    it("should provide initial stats to children", () => {
      // Arrange & Act
      const { result } = renderHook(() => useStats(), {
        wrapper: createWrapper(mockInitialStats),
      });

      // Assert
      expect(result.current.stats).toEqual(mockInitialStats);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("useStats hook", () => {
    it("should return stats, isLoading, error, and refreshStats", () => {
      // Arrange & Act
      const { result } = renderHook(() => useStats(), {
        wrapper: createWrapper(mockInitialStats),
      });

      // Assert
      expect(result.current).toHaveProperty("stats");
      expect(result.current).toHaveProperty("isLoading");
      expect(result.current).toHaveProperty("error");
      expect(result.current).toHaveProperty("refreshStats");
      expect(typeof result.current.refreshStats).toBe("function");
    });

    it("should throw error when used outside of StatsProvider", () => {
      // Arrange & Act & Assert
      expect(() => {
        renderHook(() => useStats());
      }).toThrow("useStats must be used within StatsProvider");
    });
  });

  describe("refreshStats", () => {
    it("should fetch and update stats successfully", async () => {
      // Arrange - override default handler
      server.use(
        http.get("/api/stats", () => {
          return HttpResponse.json(mockUpdatedStats);
        })
      );

      const { result } = renderHook(() => useStats(), {
        wrapper: createWrapper(mockInitialStats),
      });

      // Act
      await act(async () => {
        await result.current.refreshStats();
      });

      // Assert
      expect(result.current.stats).toEqual(mockUpdatedStats);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should set isLoading to true during fetch", async () => {
      // Arrange - delay response
      server.use(
        http.get("/api/stats", async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return HttpResponse.json(mockUpdatedStats);
        })
      );

      const { result } = renderHook(() => useStats(), {
        wrapper: createWrapper(mockInitialStats),
      });

      // Act - start refresh without awaiting
      act(() => {
        result.current.refreshStats();
      });

      // Assert - loading should be true during fetch
      expect(result.current.isLoading).toBe(true);

      // Wait for completion
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should handle HTTP error response", async () => {
      // Arrange
      server.use(
        http.get("/api/stats", () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      const { result } = renderHook(() => useStats(), {
        wrapper: createWrapper(mockInitialStats),
      });

      // Act
      await act(async () => {
        await result.current.refreshStats();
      });

      // Assert
      expect(result.current.error).toBe("Nie udało się pobrać statystyk");
      expect(result.current.isLoading).toBe(false);
      expect(result.current.stats).toEqual(mockInitialStats); // Stats unchanged
    });

    it("should handle network error", async () => {
      // Arrange
      server.use(
        http.get("/api/stats", () => {
          return HttpResponse.error();
        })
      );

      const { result } = renderHook(() => useStats(), {
        wrapper: createWrapper(mockInitialStats),
      });

      // Act
      await act(async () => {
        await result.current.refreshStats();
      });

      // Assert
      expect(result.current.error).toBe("Failed to fetch");
      expect(result.current.isLoading).toBe(false);
    });

    it("should clear previous error on new refresh attempt", async () => {
      // Arrange - first call fails
      server.use(
        http.get("/api/stats", () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      const { result } = renderHook(() => useStats(), {
        wrapper: createWrapper(mockInitialStats),
      });

      await act(async () => {
        await result.current.refreshStats();
      });

      expect(result.current.error).toBe("Nie udało się pobrać statystyk");

      // Arrange - second call succeeds
      server.use(
        http.get("/api/stats", () => {
          return HttpResponse.json(mockUpdatedStats);
        })
      );

      // Act
      await act(async () => {
        await result.current.refreshStats();
      });

      // Assert
      expect(result.current.error).toBeNull();
      expect(result.current.stats).toEqual(mockUpdatedStats);
    });

    it("should set isLoading to false after successful fetch", async () => {
      // Arrange
      server.use(
        http.get("/api/stats", () => {
          return HttpResponse.json(mockUpdatedStats);
        })
      );

      const { result } = renderHook(() => useStats(), {
        wrapper: createWrapper(mockInitialStats),
      });

      // Act
      await act(async () => {
        await result.current.refreshStats();
      });

      // Assert
      expect(result.current.isLoading).toBe(false);
    });

    it("should set isLoading to false after failed fetch", async () => {
      // Arrange
      server.use(
        http.get("/api/stats", () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      const { result } = renderHook(() => useStats(), {
        wrapper: createWrapper(mockInitialStats),
      });

      // Act
      await act(async () => {
        await result.current.refreshStats();
      });

      // Assert
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("context isolation", () => {
    it("should not share state between separate providers", () => {
      // Arrange - create two different initial stats
      const stats1: StatsDTO = { ...mockInitialStats, storage_used_bytes: 1000 };
      const stats2: StatsDTO = { ...mockInitialStats, storage_used_bytes: 2000 };

      // Act
      const { result: result1 } = renderHook(() => useStats(), {
        wrapper: createWrapper(stats1),
      });
      const { result: result2 } = renderHook(() => useStats(), {
        wrapper: createWrapper(stats2),
      });

      // Assert - each hook has its own context
      expect(result1.current.stats?.storage_used_bytes).toBe(1000);
      expect(result2.current.stats?.storage_used_bytes).toBe(2000);
    });
  });
});
