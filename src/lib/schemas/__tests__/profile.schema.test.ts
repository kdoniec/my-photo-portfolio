import { describe, it, expect } from "vitest";
import { updateProfileSchema } from "../profile.schema";

describe("updateProfileSchema", () => {
  it("should accept valid profile data", () => {
    const result = updateProfileSchema.safeParse({
      display_name: "John Doe",
      bio: "Professional photographer",
      contact_email: "john@example.com",
      contact_phone: "+1234567890",
    });
    expect(result.success).toBe(true);
  });

  it("should require display_name", () => {
    const result = updateProfileSchema.safeParse({
      bio: "Some bio",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty display_name", () => {
    const result = updateProfileSchema.safeParse({
      display_name: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Display name is required");
    }
  });

  it("should reject display_name longer than 100 characters", () => {
    const result = updateProfileSchema.safeParse({
      display_name: "a".repeat(101),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Display name must be at most 100 characters");
    }
  });

  it("should accept display_name only (other fields optional)", () => {
    const result = updateProfileSchema.safeParse({
      display_name: "Jane",
    });
    expect(result.success).toBe(true);
  });

  it("should accept null values for optional fields", () => {
    const result = updateProfileSchema.safeParse({
      display_name: "John",
      bio: null,
      contact_email: null,
      contact_phone: null,
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid email format", () => {
    const result = updateProfileSchema.safeParse({
      display_name: "John",
      contact_email: "not-an-email",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Invalid email format");
    }
  });

  it("should accept valid email formats", () => {
    const emails = ["test@example.com", "user.name@domain.co.uk", "name+tag@test.org"];
    for (const email of emails) {
      const result = updateProfileSchema.safeParse({
        display_name: "John",
        contact_email: email,
      });
      expect(result.success).toBe(true);
    }
  });

  it("should reject email longer than 255 characters", () => {
    const longEmail = "a".repeat(250) + "@b.com";
    const result = updateProfileSchema.safeParse({
      display_name: "John",
      contact_email: longEmail,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Email must be at most 255 characters");
    }
  });

  it("should reject phone longer than 20 characters", () => {
    const result = updateProfileSchema.safeParse({
      display_name: "John",
      contact_phone: "1".repeat(21),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Phone must be at most 20 characters");
    }
  });

  it("should accept phone at exactly 20 characters", () => {
    const result = updateProfileSchema.safeParse({
      display_name: "John",
      contact_phone: "1".repeat(20),
    });
    expect(result.success).toBe(true);
  });

  it("should accept bio without length limit", () => {
    const result = updateProfileSchema.safeParse({
      display_name: "John",
      bio: "a".repeat(10000),
    });
    expect(result.success).toBe(true);
  });
});
