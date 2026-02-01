import { describe, it, expect } from "vitest";
import { generateSlug } from "../slug";

describe("generateSlug", () => {
  describe("basic transformations", () => {
    it("should convert to lowercase", () => {
      expect(generateSlug("HELLO WORLD")).toBe("hello-world");
    });

    it("should replace spaces with dashes", () => {
      expect(generateSlug("hello world")).toBe("hello-world");
    });

    it("should replace multiple spaces with single dash", () => {
      expect(generateSlug("hello    world")).toBe("hello-world");
    });

    it("should handle numbers", () => {
      expect(generateSlug("photo 123")).toBe("photo-123");
    });

    it("should preserve alphanumeric characters", () => {
      expect(generateSlug("abc123")).toBe("abc123");
    });
  });

  describe("Polish diacritics", () => {
    it("should convert ą to a", () => {
      expect(generateSlug("ąąą")).toBe("aaa");
    });

    it("should convert ę to e", () => {
      expect(generateSlug("ęęę")).toBe("eee");
    });

    it("should convert ć to c", () => {
      expect(generateSlug("ććć")).toBe("ccc");
    });

    it("should remove ł (not decomposable via NFD)", () => {
      // Note: ł doesn't decompose via Unicode NFD normalization
      // The function removes it as a non-alphanumeric character
      expect(generateSlug("łłł")).toBe("");
    });

    it("should convert ń to n", () => {
      expect(generateSlug("ńńń")).toBe("nnn");
    });

    it("should convert ó to o", () => {
      expect(generateSlug("óóó")).toBe("ooo");
    });

    it("should convert ś to s", () => {
      expect(generateSlug("śśś")).toBe("sss");
    });

    it("should convert ź to z", () => {
      expect(generateSlug("źźź")).toBe("zzz");
    });

    it("should convert ż to z", () => {
      expect(generateSlug("żżż")).toBe("zzz");
    });

    it("should handle mixed Polish text", () => {
      expect(generateSlug("Ślubne Fotografie")).toBe("slubne-fotografie");
    });

    it("should handle complex Polish phrase", () => {
      // Note: ł doesn't decompose via NFD, so it becomes a dash separator
      expect(generateSlug("Żółta łódź")).toBe("zo-ta-odz");
    });
  });

  describe("special characters", () => {
    it("should remove special characters", () => {
      expect(generateSlug("hello!@#$%world")).toBe("hello-world");
    });

    it("should replace consecutive special characters with single dash", () => {
      expect(generateSlug("hello!!!world")).toBe("hello-world");
    });

    it("should handle ampersand", () => {
      expect(generateSlug("black & white")).toBe("black-white");
    });

    it("should handle parentheses", () => {
      expect(generateSlug("photo (2024)")).toBe("photo-2024");
    });
  });

  describe("leading and trailing dashes", () => {
    it("should remove leading dashes", () => {
      expect(generateSlug("---hello")).toBe("hello");
    });

    it("should remove trailing dashes", () => {
      expect(generateSlug("hello---")).toBe("hello");
    });

    it("should remove both leading and trailing dashes", () => {
      expect(generateSlug("---hello---")).toBe("hello");
    });

    it("should handle input that would result in only dashes", () => {
      expect(generateSlug("!!!")).toBe("");
    });
  });

  describe("length limiting", () => {
    it("should limit to 100 characters", () => {
      const longName = "a".repeat(150);
      expect(generateSlug(longName)).toHaveLength(100);
    });

    it("should not truncate short strings", () => {
      const shortName = "a".repeat(50);
      expect(generateSlug(shortName)).toHaveLength(50);
    });

    it("should handle exactly 100 characters", () => {
      const exactName = "a".repeat(100);
      expect(generateSlug(exactName)).toHaveLength(100);
    });
  });

  describe("edge cases", () => {
    it("should handle empty string", () => {
      expect(generateSlug("")).toBe("");
    });

    it("should handle string with only spaces", () => {
      expect(generateSlug("   ")).toBe("");
    });

    it("should handle already valid slug", () => {
      expect(generateSlug("already-valid-slug")).toBe("already-valid-slug");
    });

    it("should handle single character", () => {
      expect(generateSlug("a")).toBe("a");
    });
  });
});
