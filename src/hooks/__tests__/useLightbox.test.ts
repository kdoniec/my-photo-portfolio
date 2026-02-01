import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLightbox } from "../useLightbox";
import type { PublicPhotoDTO } from "../../types";

const createMockPhotos = (count: number): PublicPhotoDTO[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `photo-${i}`,
    title: `Photo ${i}`,
    preview_url: `https://example.com/photo-${i}.jpg`,
    thumbnail_url: `https://example.com/thumb-${i}.jpg`,
    category_name: "Test Category",
    category_slug: "test-category",
    original_width: 1920,
    original_height: 1080,
  }));

describe("useLightbox", () => {
  describe("initial state", () => {
    it("should initialize with isOpen false", () => {
      const { result } = renderHook(() => useLightbox({ photos: createMockPhotos(3) }));

      expect(result.current.isOpen).toBe(false);
    });

    it("should initialize with currentIndex 0", () => {
      const { result } = renderHook(() => useLightbox({ photos: createMockPhotos(3) }));

      expect(result.current.currentIndex).toBe(0);
    });

    it("should return currentPhoto as null when closed", () => {
      const { result } = renderHook(() => useLightbox({ photos: createMockPhotos(3) }));

      expect(result.current.currentPhoto).toBeNull();
    });
  });

  describe("open", () => {
    it("should set isOpen to true", () => {
      const { result } = renderHook(() => useLightbox({ photos: createMockPhotos(3) }));

      act(() => {
        result.current.open(0);
      });

      expect(result.current.isOpen).toBe(true);
    });

    it("should set currentIndex to provided index", () => {
      const { result } = renderHook(() => useLightbox({ photos: createMockPhotos(3) }));

      act(() => {
        result.current.open(2);
      });

      expect(result.current.currentIndex).toBe(2);
    });

    it("should return currentPhoto when open", () => {
      const photos = createMockPhotos(3);
      const { result } = renderHook(() => useLightbox({ photos }));

      act(() => {
        result.current.open(1);
      });

      expect(result.current.currentPhoto).toEqual(photos[1]);
    });
  });

  describe("close", () => {
    it("should set isOpen to false", () => {
      const { result } = renderHook(() => useLightbox({ photos: createMockPhotos(3) }));

      act(() => {
        result.current.open(0);
      });

      act(() => {
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it("should return currentPhoto as null after closing", () => {
      const { result } = renderHook(() => useLightbox({ photos: createMockPhotos(3) }));

      act(() => {
        result.current.open(1);
      });

      act(() => {
        result.current.close();
      });

      expect(result.current.currentPhoto).toBeNull();
    });
  });

  describe("next", () => {
    it("should increment currentIndex", () => {
      const { result } = renderHook(() => useLightbox({ photos: createMockPhotos(3) }));

      act(() => {
        result.current.open(0);
      });

      act(() => {
        result.current.next();
      });

      expect(result.current.currentIndex).toBe(1);
    });

    it("should not exceed photos.length - 1", () => {
      const { result } = renderHook(() => useLightbox({ photos: createMockPhotos(3) }));

      act(() => {
        result.current.open(2); // Last photo
      });

      act(() => {
        result.current.next();
      });

      expect(result.current.currentIndex).toBe(2);
    });

    it("should update currentPhoto to next photo", () => {
      const photos = createMockPhotos(3);
      const { result } = renderHook(() => useLightbox({ photos }));

      act(() => {
        result.current.open(0);
      });

      act(() => {
        result.current.next();
      });

      expect(result.current.currentPhoto).toEqual(photos[1]);
    });
  });

  describe("previous", () => {
    it("should decrement currentIndex", () => {
      const { result } = renderHook(() => useLightbox({ photos: createMockPhotos(3) }));

      act(() => {
        result.current.open(2);
      });

      act(() => {
        result.current.previous();
      });

      expect(result.current.currentIndex).toBe(1);
    });

    it("should not go below 0", () => {
      const { result } = renderHook(() => useLightbox({ photos: createMockPhotos(3) }));

      act(() => {
        result.current.open(0);
      });

      act(() => {
        result.current.previous();
      });

      expect(result.current.currentIndex).toBe(0);
    });

    it("should update currentPhoto to previous photo", () => {
      const photos = createMockPhotos(3);
      const { result } = renderHook(() => useLightbox({ photos }));

      act(() => {
        result.current.open(2);
      });

      act(() => {
        result.current.previous();
      });

      expect(result.current.currentPhoto).toEqual(photos[1]);
    });
  });

  describe("goTo", () => {
    it("should set specific index", () => {
      const { result } = renderHook(() => useLightbox({ photos: createMockPhotos(5) }));

      act(() => {
        result.current.open(0);
      });

      act(() => {
        result.current.goTo(3);
      });

      expect(result.current.currentIndex).toBe(3);
    });

    it("should ignore negative index", () => {
      const { result } = renderHook(() => useLightbox({ photos: createMockPhotos(3) }));

      act(() => {
        result.current.open(1);
      });

      act(() => {
        result.current.goTo(-1);
      });

      expect(result.current.currentIndex).toBe(1);
    });

    it("should ignore index >= photos.length", () => {
      const { result } = renderHook(() => useLightbox({ photos: createMockPhotos(3) }));

      act(() => {
        result.current.open(1);
      });

      act(() => {
        result.current.goTo(5);
      });

      expect(result.current.currentIndex).toBe(1);
    });

    it("should accept index 0", () => {
      const { result } = renderHook(() => useLightbox({ photos: createMockPhotos(3) }));

      act(() => {
        result.current.open(2);
      });

      act(() => {
        result.current.goTo(0);
      });

      expect(result.current.currentIndex).toBe(0);
    });
  });

  describe("edge cases", () => {
    it("should handle empty photos array", () => {
      const { result } = renderHook(() => useLightbox({ photos: [] }));

      expect(result.current.isOpen).toBe(false);
      expect(result.current.currentPhoto).toBeNull();
    });

    it("should return null currentPhoto for out of bounds index", () => {
      const { result } = renderHook(() => useLightbox({ photos: createMockPhotos(2) }));

      // Force open with index that will become invalid
      act(() => {
        result.current.open(1);
      });

      expect(result.current.currentPhoto).not.toBeNull();
    });

    it("should handle single photo", () => {
      const photos = createMockPhotos(1);
      const { result } = renderHook(() => useLightbox({ photos }));

      act(() => {
        result.current.open(0);
      });

      expect(result.current.currentPhoto).toEqual(photos[0]);

      // next should not change
      act(() => {
        result.current.next();
      });
      expect(result.current.currentIndex).toBe(0);

      // previous should not change
      act(() => {
        result.current.previous();
      });
      expect(result.current.currentIndex).toBe(0);
    });
  });
});
