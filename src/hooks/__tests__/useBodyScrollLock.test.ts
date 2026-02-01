import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useBodyScrollLock } from "../useBodyScrollLock";

describe("useBodyScrollLock", () => {
  let originalScrollY: number;
  let scrollToMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Save original and mock scrollY
    originalScrollY = window.scrollY;
    Object.defineProperty(window, "scrollY", {
      value: 100,
      writable: true,
      configurable: true,
    });

    // Mock scrollTo
    scrollToMock = vi.fn();
    window.scrollTo = scrollToMock;

    // Reset body styles
    document.body.style.overflow = "";
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
  });

  afterEach(() => {
    // Restore original scrollY
    Object.defineProperty(window, "scrollY", {
      value: originalScrollY,
      writable: true,
      configurable: true,
    });
  });

  describe("when isLocked is true", () => {
    it("should set body overflow to hidden", () => {
      renderHook(() => useBodyScrollLock(true));

      expect(document.body.style.overflow).toBe("hidden");
    });

    it("should set body position to fixed", () => {
      renderHook(() => useBodyScrollLock(true));

      expect(document.body.style.position).toBe("fixed");
    });

    it("should set body top to negative scrollY", () => {
      renderHook(() => useBodyScrollLock(true));

      expect(document.body.style.top).toBe("-100px");
    });

    it("should set body width to 100%", () => {
      renderHook(() => useBodyScrollLock(true));

      expect(document.body.style.width).toBe("100%");
    });

    it("should handle different scroll positions", () => {
      Object.defineProperty(window, "scrollY", { value: 500 });

      renderHook(() => useBodyScrollLock(true));

      expect(document.body.style.top).toBe("-500px");
    });
  });

  describe("when isLocked changes to false (cleanup)", () => {
    it("should restore body overflow", () => {
      const { rerender } = renderHook(({ isLocked }) => useBodyScrollLock(isLocked), {
        initialProps: { isLocked: true },
      });

      rerender({ isLocked: false });

      expect(document.body.style.overflow).toBe("");
    });

    it("should restore body position", () => {
      const { rerender } = renderHook(({ isLocked }) => useBodyScrollLock(isLocked), {
        initialProps: { isLocked: true },
      });

      rerender({ isLocked: false });

      expect(document.body.style.position).toBe("");
    });

    it("should restore body top", () => {
      const { rerender } = renderHook(({ isLocked }) => useBodyScrollLock(isLocked), {
        initialProps: { isLocked: true },
      });

      rerender({ isLocked: false });

      expect(document.body.style.top).toBe("");
    });

    it("should restore body width", () => {
      const { rerender } = renderHook(({ isLocked }) => useBodyScrollLock(isLocked), {
        initialProps: { isLocked: true },
      });

      rerender({ isLocked: false });

      expect(document.body.style.width).toBe("");
    });

    it("should restore scroll position", () => {
      const { rerender } = renderHook(({ isLocked }) => useBodyScrollLock(isLocked), {
        initialProps: { isLocked: true },
      });

      rerender({ isLocked: false });

      expect(scrollToMock).toHaveBeenCalledWith(0, 100);
    });
  });

  describe("when isLocked is false", () => {
    it("should not modify body styles", () => {
      document.body.style.overflow = "auto";
      document.body.style.position = "relative";

      renderHook(() => useBodyScrollLock(false));

      expect(document.body.style.overflow).toBe("auto");
      expect(document.body.style.position).toBe("relative");
    });

    it("should not call scrollTo", () => {
      renderHook(() => useBodyScrollLock(false));

      expect(scrollToMock).not.toHaveBeenCalled();
    });
  });

  describe("unmount cleanup", () => {
    it("should restore styles on unmount when locked", () => {
      const { unmount } = renderHook(() => useBodyScrollLock(true));

      unmount();

      expect(document.body.style.overflow).toBe("");
      expect(document.body.style.position).toBe("");
      expect(document.body.style.top).toBe("");
      expect(document.body.style.width).toBe("");
    });

    it("should restore scroll position on unmount when locked", () => {
      const { unmount } = renderHook(() => useBodyScrollLock(true));

      unmount();

      expect(scrollToMock).toHaveBeenCalledWith(0, 100);
    });
  });
});
