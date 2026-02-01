import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../../../../tests/mocks/server";
import { usePhotos } from "../usePhotos";
import { StatsProvider } from "@/components/admin/context/StatsContext";
import type { PhotoDTO, PhotoListResponseDTO, CategoryDTO, StatsDTO } from "@/types";
import type { ReactNode } from "react";

const BASE_URL = "http://localhost:3000";

// Mock initial stats
const mockStats: StatsDTO = {
  photos: { count: 50, limit: 200, published_count: 30 },
  categories: { count: 5, limit: 10 },
  storage_used_bytes: 1024000,
};

// Mock categories
const mockCategories: CategoryDTO[] = [
  {
    id: "cat-1",
    name: "Landscape",
    slug: "landscape",
    display_order: 1,
    photo_count: 10,
    cover_photo_url: null,
  },
];

// Mock photos
const mockPhotos: PhotoDTO[] = [
  {
    id: "photo-1",
    title: "Mountain View",
    category_id: "cat-1",
    category_name: "Landscape",
    thumbnail_url: "/images/thumb-1.jpg",
    preview_url: "/images/preview-1.jpg",
    is_published: true,
    original_width: 1920,
    original_height: 1080,
    created_at: new Date().toISOString(),
  },
  {
    id: "photo-2",
    title: "Ocean Sunset",
    category_id: "cat-1",
    category_name: "Landscape",
    thumbnail_url: "/images/thumb-2.jpg",
    preview_url: "/images/preview-2.jpg",
    is_published: false,
    original_width: 1920,
    original_height: 1080,
    created_at: new Date().toISOString(),
  },
];

const mockInitialData: PhotoListResponseDTO = {
  data: mockPhotos,
  pagination: {
    page: 1,
    limit: 20,
    total: 50,
    total_pages: 3,
  },
};

// Wrapper with StatsProvider
const createWrapper = () => {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <StatsProvider initialStats={mockStats}>{children}</StatsProvider>;
  };
};

describe("usePhotos", () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  describe("initialization", () => {
    it("should initialize with provided photos", () => {
      const { result } = renderHook(() => usePhotos(mockInitialData, mockCategories), {
        wrapper: createWrapper(),
      });

      expect(result.current.photos).toEqual(mockPhotos);
      expect(result.current.pagination).toEqual(mockInitialData.pagination);
    });

    it("should initialize with default filter", () => {
      const { result } = renderHook(() => usePhotos(mockInitialData, mockCategories), {
        wrapper: createWrapper(),
      });

      expect(result.current.filter).toEqual({
        category_id: "all",
        page: 1,
        limit: 20,
      });
    });

    it("should calculate hasMore correctly", () => {
      const { result } = renderHook(() => usePhotos(mockInitialData, mockCategories), {
        wrapper: createWrapper(),
      });

      expect(result.current.hasMore).toBe(true);
    });

    it("should return all functions", () => {
      const { result } = renderHook(() => usePhotos(mockInitialData, mockCategories), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.fetchPhotos).toBe("function");
      expect(typeof result.current.loadMore).toBe("function");
      expect(typeof result.current.updatePhoto).toBe("function");
      expect(typeof result.current.togglePublish).toBe("function");
      expect(typeof result.current.deletePhoto).toBe("function");
    });
  });

  describe("fetchPhotos", () => {
    it("should reset to page 1 on fetch", async () => {
      const { result } = renderHook(() => usePhotos(mockInitialData, mockCategories), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.fetchPhotos({ category_id: "cat-1" });
      });

      expect(result.current.filter.page).toBe(1);
    });

    it("should update filter with new values", async () => {
      const { result } = renderHook(() => usePhotos(mockInitialData, mockCategories), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.fetchPhotos({ category_id: "cat-1" });
      });

      expect(result.current.filter.category_id).toBe("cat-1");
    });

    it("should set error on failure", async () => {
      server.use(
        http.get(`${BASE_URL}/api/photos`, () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      const { result } = renderHook(() => usePhotos(mockInitialData, mockCategories), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.fetchPhotos();
      });

      expect(result.current.error).toBe("Nie udało się pobrać zdjęć");
    });
  });

  describe("loadMore", () => {
    it("should append photos to list", async () => {
      server.use(
        http.get(`${BASE_URL}/api/photos`, ({ request }) => {
          const url = new URL(request.url);
          const page = parseInt(url.searchParams.get("page") || "1");

          return HttpResponse.json({
            data: [
              {
                id: `photo-page-${page}`,
                title: `Photo from page ${page}`,
                category_id: "cat-1",
                category_name: "Landscape",
                thumbnail_url: "/images/thumb.jpg",
                preview_url: "/images/preview.jpg",
                is_published: true,
                original_width: 1920,
                original_height: 1080,
                created_at: new Date().toISOString(),
              },
            ],
            pagination: {
              page,
              limit: 20,
              total: 50,
              total_pages: 3,
            },
          });
        })
      );

      const { result } = renderHook(() => usePhotos(mockInitialData, mockCategories), {
        wrapper: createWrapper(),
      });

      const initialCount = result.current.photos.length;

      await act(async () => {
        await result.current.loadMore();
      });

      expect(result.current.photos.length).toBeGreaterThan(initialCount);
    });

    it("should not load when hasMore is false", async () => {
      const noMoreData: PhotoListResponseDTO = {
        data: mockPhotos,
        pagination: {
          page: 3,
          limit: 20,
          total: 50,
          total_pages: 3,
        },
      };

      const { result } = renderHook(() => usePhotos(noMoreData, mockCategories), {
        wrapper: createWrapper(),
      });

      expect(result.current.hasMore).toBe(false);

      await act(async () => {
        await result.current.loadMore();
      });

      // Photos should not change
      expect(result.current.photos).toEqual(mockPhotos);
    });

    it("should not load when already loading", async () => {
      server.use(
        http.get(`${BASE_URL}/api/photos`, async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json({
            data: [{ id: "new" }],
            pagination: { page: 2, limit: 20, total: 50, total_pages: 3 },
          });
        })
      );

      const { result } = renderHook(() => usePhotos(mockInitialData, mockCategories), {
        wrapper: createWrapper(),
      });

      // Start two loadMore calls
      act(() => {
        result.current.loadMore();
        result.current.loadMore();
      });

      await waitFor(() => {
        expect(result.current.isLoadingMore).toBe(false);
      });
    });
  });

  describe("updatePhoto", () => {
    it("should update photo in list", async () => {
      const { result } = renderHook(() => usePhotos(mockInitialData, mockCategories), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        const updated = await result.current.updatePhoto("photo-1", { title: "New Title" });
        expect(updated.title).toBe("New Title");
      });

      expect(result.current.photos.find((p) => p.id === "photo-1")?.title).toBe("New Title");
    });

    it("should throw on error", async () => {
      server.use(
        http.put(`${BASE_URL}/api/photos/:id`, () => {
          return HttpResponse.json({ error: { message: "Photo not found" } }, { status: 404 });
        })
      );

      const { result } = renderHook(() => usePhotos(mockInitialData, mockCategories), {
        wrapper: createWrapper(),
      });

      await expect(
        act(async () => {
          await result.current.updatePhoto("photo-999", { title: "Invalid" });
        })
      ).rejects.toThrow("Photo not found");
    });
  });

  describe("togglePublish", () => {
    it("should optimistically update is_published", async () => {
      const { result } = renderHook(() => usePhotos(mockInitialData, mockCategories), {
        wrapper: createWrapper(),
      });

      expect(result.current.photos.find((p) => p.id === "photo-2")?.is_published).toBe(false);

      await act(async () => {
        await result.current.togglePublish("photo-2", true);
      });

      expect(result.current.photos.find((p) => p.id === "photo-2")?.is_published).toBe(true);
    });

    it("should revert on error", async () => {
      server.use(
        http.patch(`${BASE_URL}/api/photos/:id/publish`, () => {
          return HttpResponse.json({ error: "Failed" }, { status: 500 });
        })
      );

      const { result } = renderHook(() => usePhotos(mockInitialData, mockCategories), {
        wrapper: createWrapper(),
      });

      const originalValue = result.current.photos.find((p) => p.id === "photo-1")?.is_published;

      try {
        await act(async () => {
          await result.current.togglePublish("photo-1", !originalValue);
        });
      } catch {
        // Expected to throw
      }

      // Should revert to original value
      expect(result.current.photos.find((p) => p.id === "photo-1")?.is_published).toBe(
        originalValue
      );
    });
  });

  describe("deletePhoto", () => {
    it("should remove photo from list", async () => {
      const { result } = renderHook(() => usePhotos(mockInitialData, mockCategories), {
        wrapper: createWrapper(),
      });

      const initialCount = result.current.photos.length;

      await act(async () => {
        await result.current.deletePhoto("photo-1");
      });

      expect(result.current.photos.length).toBe(initialCount - 1);
      expect(result.current.photos.find((p) => p.id === "photo-1")).toBeUndefined();
    });

    it("should throw on error", async () => {
      server.use(
        http.delete(`${BASE_URL}/api/photos/:id`, () => {
          return HttpResponse.json({ error: { message: "Cannot delete" } }, { status: 400 });
        })
      );

      const { result } = renderHook(() => usePhotos(mockInitialData, mockCategories), {
        wrapper: createWrapper(),
      });

      await expect(
        act(async () => {
          await result.current.deletePhoto("photo-1");
        })
      ).rejects.toThrow("Cannot delete");
    });
  });

  describe("loading states", () => {
    it("should set isLoading during fetch", async () => {
      server.use(
        http.get(`${BASE_URL}/api/photos`, async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return HttpResponse.json({
            data: mockPhotos,
            pagination: mockInitialData.pagination,
          });
        })
      );

      const { result } = renderHook(() => usePhotos(mockInitialData, mockCategories), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.fetchPhotos();
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should set isLoadingMore during loadMore", async () => {
      server.use(
        http.get(`${BASE_URL}/api/photos`, async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return HttpResponse.json({
            data: mockPhotos,
            pagination: { page: 2, limit: 20, total: 50, total_pages: 3 },
          });
        })
      );

      const { result } = renderHook(() => usePhotos(mockInitialData, mockCategories), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.loadMore();
      });

      expect(result.current.isLoadingMore).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoadingMore).toBe(false);
      });
    });
  });
});
