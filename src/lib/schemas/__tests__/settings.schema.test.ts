import { describe, it, expect } from "vitest";
import { updateSettingsSchema } from "../settings.schema";

describe("updateSettingsSchema", () => {
  it("should accept valid settings data", () => {
    const result = updateSettingsSchema.safeParse({
      site_title: "My Portfolio",
      site_description: "Professional photography portfolio",
    });
    expect(result.success).toBe(true);
  });

  it("should accept empty object (all fields optional)", () => {
    const result = updateSettingsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should accept null values", () => {
    const result = updateSettingsSchema.safeParse({
      site_title: null,
      site_description: null,
    });
    expect(result.success).toBe(true);
  });

  it("should accept only site_title", () => {
    const result = updateSettingsSchema.safeParse({
      site_title: "Just a Title",
    });
    expect(result.success).toBe(true);
  });

  it("should accept only site_description", () => {
    const result = updateSettingsSchema.safeParse({
      site_description: "Just a description",
    });
    expect(result.success).toBe(true);
  });

  it("should reject site_title longer than 100 characters", () => {
    const result = updateSettingsSchema.safeParse({
      site_title: "a".repeat(101),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Site title must be at most 100 characters");
    }
  });

  it("should accept site_title at exactly 100 characters", () => {
    const result = updateSettingsSchema.safeParse({
      site_title: "a".repeat(100),
    });
    expect(result.success).toBe(true);
  });

  it("should reject site_description longer than 300 characters", () => {
    const result = updateSettingsSchema.safeParse({
      site_description: "a".repeat(301),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Site description must be at most 300 characters");
    }
  });

  it("should accept site_description at exactly 300 characters", () => {
    const result = updateSettingsSchema.safeParse({
      site_description: "a".repeat(300),
    });
    expect(result.success).toBe(true);
  });

  it("should accept empty strings", () => {
    const result = updateSettingsSchema.safeParse({
      site_title: "",
      site_description: "",
    });
    expect(result.success).toBe(true);
  });
});
