import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useNavigation } from "../useNavigation";

describe("useNavigation", () => {
  describe("exact match", () => {
    it("should return true for exact path match", () => {
      const { result } = renderHook(() => useNavigation("/o-mnie"));

      expect(result.current.isActive("/o-mnie")).toBe(true);
    });

    it("should return false for non-matching path", () => {
      const { result } = renderHook(() => useNavigation("/o-mnie"));

      expect(result.current.isActive("/kontakt")).toBe(false);
    });

    it("should return true for root path on root", () => {
      const { result } = renderHook(() => useNavigation("/"));

      expect(result.current.isActive("/")).toBe(true);
    });
  });

  describe("gallery special case", () => {
    it('should return true for "/" when on category page', () => {
      const { result } = renderHook(() => useNavigation("/kategoria/nature"));

      expect(result.current.isActive("/")).toBe(true);
    });

    it('should return true for "/" when on nested category page', () => {
      const { result } = renderHook(() => useNavigation("/kategoria/landscape/mountains"));

      expect(result.current.isActive("/")).toBe(true);
    });

    it('should return false for "/" when on about page', () => {
      const { result } = renderHook(() => useNavigation("/o-mnie"));

      expect(result.current.isActive("/")).toBe(false);
    });
  });

  describe("prefix match for nested routes", () => {
    it("should return true for parent path when on nested route", () => {
      const { result } = renderHook(() => useNavigation("/admin/photos/123"));

      expect(result.current.isActive("/admin/photos")).toBe(true);
    });

    it("should return true for admin path on admin photos", () => {
      const { result } = renderHook(() => useNavigation("/admin/photos"));

      expect(result.current.isActive("/admin")).toBe(true);
    });

    it("should not match partial path without slash", () => {
      const { result } = renderHook(() => useNavigation("/admin-settings"));

      expect(result.current.isActive("/admin")).toBe(false);
    });

    it("should not use prefix match for root path", () => {
      const { result } = renderHook(() => useNavigation("/about"));

      // Root path should not prefix match
      expect(result.current.isActive("/")).toBe(false);
    });
  });

  describe("exact mode", () => {
    it("should return true only for exact match when exact=true", () => {
      const { result } = renderHook(() => useNavigation("/admin/photos"));

      expect(result.current.isActive("/admin/photos", true)).toBe(true);
    });

    it("should return false for parent path when exact=true", () => {
      const { result } = renderHook(() => useNavigation("/admin/photos/123"));

      expect(result.current.isActive("/admin/photos", true)).toBe(false);
    });

    it('should return false for "/" on category page when exact=true', () => {
      const { result } = renderHook(() => useNavigation("/kategoria/nature"));

      expect(result.current.isActive("/", true)).toBe(false);
    });

    it("should return true for exact root match when exact=true", () => {
      const { result } = renderHook(() => useNavigation("/"));

      expect(result.current.isActive("/", true)).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle trailing slash in current path", () => {
      const { result } = renderHook(() => useNavigation("/admin/"));

      // "/admin/" starts with "/admin" + "/" so prefix match returns true
      expect(result.current.isActive("/admin")).toBe(true);
    });

    it("should handle empty href as prefix matching any path", () => {
      const { result } = renderHook(() => useNavigation("/"));

      // Empty href: currentPath.startsWith("" + "/") = startsWith("/") = true
      expect(result.current.isActive("")).toBe(true);
    });

    it("should handle deep nesting", () => {
      const { result } = renderHook(() => useNavigation("/admin/photos/edit/123/metadata"));

      expect(result.current.isActive("/admin/photos")).toBe(true);
      expect(result.current.isActive("/admin")).toBe(true);
    });
  });

  describe("memoization", () => {
    it("should return same isActive function reference on same currentPath", () => {
      const { result, rerender } = renderHook(({ path }) => useNavigation(path), {
        initialProps: { path: "/admin" },
      });

      const firstIsActive = result.current.isActive;

      rerender({ path: "/admin" });

      expect(result.current.isActive).toBe(firstIsActive);
    });

    it("should return new isActive function when currentPath changes", () => {
      const { result, rerender } = renderHook(({ path }) => useNavigation(path), {
        initialProps: { path: "/admin" },
      });

      const firstIsActive = result.current.isActive;

      rerender({ path: "/photos" });

      expect(result.current.isActive).not.toBe(firstIsActive);
    });
  });
});
