import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../../../../tests/mocks/server";
import { useCategories } from "../useCategories";
import { StatsProvider } from "@/components/admin/context/StatsContext";
import type { CategoryDTO, StatsDTO } from "@/types";
import type { ReactNode } from "react";

const BASE_URL = "http://localhost:3000";

// Mock initial stats
const mockStats: StatsDTO = {
  photos: { count: 50, limit: 200, published_count: 30 },
  categories: { count: 5, limit: 10 },
  storage_used_bytes: 1024000,
};

// Mock initial categories
const mockCategories: CategoryDTO[] = [
  {
    id: "cat-1",
    name: "Landscape",
    slug: "landscape",
    display_order: 1,
    photo_count: 10,
    cover_photo_url: null,
  },
  {
    id: "cat-2",
    name: "Portrait",
    slug: "portrait",
    display_order: 2,
    photo_count: 5,
    cover_photo_url: null,
  },
];

// Wrapper with StatsProvider
const createWrapper = () => {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <StatsProvider initialStats={mockStats}>{children}</StatsProvider>;
  };
};

describe("useCategories", () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  describe("initialization", () => {
    it("should initialize with provided categories", () => {
      const { result } = renderHook(() => useCategories(mockCategories), {
        wrapper: createWrapper(),
      });

      expect(result.current.categories).toEqual(mockCategories);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should return all CRUD functions", () => {
      const { result } = renderHook(() => useCategories(mockCategories), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.fetchCategories).toBe("function");
      expect(typeof result.current.createCategory).toBe("function");
      expect(typeof result.current.updateCategory).toBe("function");
      expect(typeof result.current.deleteCategory).toBe("function");
    });
  });

  describe("fetchCategories", () => {
    it("should fetch and update categories", async () => {
      const { result } = renderHook(() => useCategories([]), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.fetchCategories();
      });

      expect(result.current.categories).toHaveLength(2);
      expect(result.current.categories[0].name).toBe("Landscape");
    });

    it("should set error on failure", async () => {
      server.use(
        http.get(`${BASE_URL}/api/categories`, () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      const { result } = renderHook(() => useCategories([]), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.fetchCategories();
      });

      expect(result.current.error).toBe("Nie udało się pobrać kategorii");
    });

    it("should set isLoading during fetch", async () => {
      server.use(
        http.get(`${BASE_URL}/api/categories`, async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return HttpResponse.json({ data: mockCategories });
        })
      );

      const { result } = renderHook(() => useCategories([]), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.fetchCategories();
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe("createCategory", () => {
    it("should create and add category to list", async () => {
      const { result } = renderHook(() => useCategories(mockCategories), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        const newCategory = await result.current.createCategory({ name: "Wildlife" });
        expect(newCategory.name).toBe("Wildlife");
      });

      expect(result.current.categories).toHaveLength(3);
    });

    it("should throw on error", async () => {
      server.use(
        http.post(`${BASE_URL}/api/categories`, () => {
          return HttpResponse.json({ error: { message: "Category limit reached" } }, { status: 400 });
        })
      );

      const { result } = renderHook(() => useCategories(mockCategories), {
        wrapper: createWrapper(),
      });

      let thrownError: Error | null = null;
      try {
        await act(async () => {
          await result.current.createCategory({ name: "Wildlife" });
        });
      } catch (err) {
        thrownError = err as Error;
      }

      expect(thrownError).not.toBeNull();
      expect(thrownError?.message).toBe("Category limit reached");
    });
  });

  describe("updateCategory", () => {
    it("should update category in list", async () => {
      const { result } = renderHook(() => useCategories(mockCategories), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        const updated = await result.current.updateCategory("cat-1", { name: "Mountains" });
        expect(updated.name).toBe("Mountains");
      });

      expect(result.current.categories.find((c) => c.id === "cat-1")?.name).toBe("Mountains");
    });

    it("should throw on error", async () => {
      server.use(
        http.put(`${BASE_URL}/api/categories/:id`, () => {
          return HttpResponse.json({ error: { message: "Category not found" } }, { status: 404 });
        })
      );

      const { result } = renderHook(() => useCategories(mockCategories), {
        wrapper: createWrapper(),
      });

      await expect(
        act(async () => {
          await result.current.updateCategory("cat-999", { name: "Invalid" });
        })
      ).rejects.toThrow("Category not found");
    });
  });

  describe("deleteCategory", () => {
    it("should remove category from list", async () => {
      const { result } = renderHook(() => useCategories(mockCategories), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        const response = await result.current.deleteCategory("cat-1");
        expect(response.affected_photos_count).toBe(5);
      });

      expect(result.current.categories).toHaveLength(1);
      expect(result.current.categories[0].id).toBe("cat-2");
    });

    it("should throw on error", async () => {
      server.use(
        http.delete(`${BASE_URL}/api/categories/:id`, () => {
          return HttpResponse.json({ error: { message: "Cannot delete category with photos" } }, { status: 400 });
        })
      );

      const { result } = renderHook(() => useCategories(mockCategories), {
        wrapper: createWrapper(),
      });

      await expect(
        act(async () => {
          await result.current.deleteCategory("cat-1");
        })
      ).rejects.toThrow("Cannot delete category with photos");
    });
  });

  describe("loading states", () => {
    it("should clear isLoading after successful operation", async () => {
      const { result } = renderHook(() => useCategories(mockCategories), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.createCategory({ name: "New" });
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("should clear isLoading after failed operation", async () => {
      server.use(
        http.post(`${BASE_URL}/api/categories`, () => {
          return HttpResponse.json({ error: { message: "Error" } }, { status: 400 });
        })
      );

      const { result } = renderHook(() => useCategories(mockCategories), {
        wrapper: createWrapper(),
      });

      try {
        await act(async () => {
          await result.current.createCategory({ name: "New" });
        });
      } catch {
        // Expected to throw
      }

      expect(result.current.isLoading).toBe(false);
    });
  });
});
